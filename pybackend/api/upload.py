from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends, status
from pydantic import BaseModel
from pathlib import Path
import json
import uuid
import os
import shutil
import pandas as pd
from sqlalchemy.orm import Session

from database.connection import get_db
from database.models import User, Business, Dataset, AuditLog
from auth.dependencies import get_current_user, get_current_business
from config import settings
from storage_manager import (
    get_user_storage_dirs,
    stream_encrypt_file,
    count_csv_rows_fast,
    _read_dataframe_from_path_or_bytes
)
from engines.data_intelligence.type_detection import detect_column_types
from engines.data_intelligence.validation import validate_dataset

router = APIRouter(prefix="/api/upload", tags=["Upload"])

MAX_FILE_SIZE = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024  # Up to 10 GB
ALLOWED_EXTENSIONS = {".csv", ".tsv", ".xlsx", ".xls", ".json"}
STREAM_DISK_CHUNK = 4 * 1024 * 1024  # 4 MB
SAMPLE_PARSE_ROWS = 50000


def _finalize_uploaded_temp_file(
    tmp_path: Path,
    original_filename: str,
    display_name: str | None,
    user: User,
    business: Business,
    db: Session,
    dataset_id: str | None = None
) -> dict:
    """
    Validates a streamed file on disk without blowing up RAM,
    counts total rows, profiles schema, stream-encrypts to user's vault,
    and registers metadata in the database.
    """
    extension = Path(original_filename).suffix.lower()
    file_size = tmp_path.stat().st_size

    if file_size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file is empty (0 bytes)."
        )

    # Parse DataFrame safely: full parse for <=25MB CSV/Excel, smart sample for >25MB
    is_large = file_size > (25 * 1024 * 1024)
    sample_nrows = SAMPLE_PARSE_ROWS if is_large else None

    try:
        df = _read_dataframe_from_path_or_bytes(
            source_path=tmp_path,
            ref_name=original_filename,
            nrows=sample_nrows
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unable to parse dataset: {str(exc)}"
        )

    if df.empty or len(df.columns) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file contains no data or valid columns."
        )

    # Count total rows accurately on disk for large CSV/TSV files
    total_rows = len(df)
    if is_large and extension in (".csv", ".tsv"):
        try:
            counted = count_csv_rows_fast(tmp_path)
            if counted > total_rows:
                total_rows = counted
        except Exception:
            pass

    # Run validation on sample/full DataFrame
    val_result = validate_dataset(df)
    if not val_result["can_proceed"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Dataset validation failed: {val_result['checks']}"
        )

    # Stream-encrypt from temp file to isolated user folder (<4MB RAM even for 10GB)
    user_dirs = get_user_storage_dirs(user.id, user.name)
    dataset_id = dataset_id or str(uuid.uuid4())
    target_path = user_dirs["uploads"] / f"{dataset_id}.enc"
    encrypted_size = stream_encrypt_file(tmp_path, target_path)

    # Column type detection
    types_meta = detect_column_types(df)
    final_name = display_name.strip() if display_name and display_name.strip() else Path(original_filename).stem

    # Save metadata to database
    db_dataset = Dataset(
        id=dataset_id,
        business_id=business.id,
        user_id=user.id,
        name=final_name,
        filename=original_filename,
        file_path=str(target_path.resolve()),
        file_size_bytes=encrypted_size,
        row_count=total_rows,
        col_count=len(df.columns),
        status="ready",
        column_meta=json.dumps(types_meta)
    )
    db.add(db_dataset)

    # Audit log
    size_mb = round(file_size / (1024 * 1024), 2)
    db.add(AuditLog(
        user_id=user.id,
        business_id=business.id,
        action="upload_dataset",
        details=f"Uploaded '{original_filename}' ({size_mb} MB) -> stream-encrypted as '{dataset_id}.enc' ({total_rows:,} rows, {len(df.columns)} cols)"
    ))
    db.commit()
    db.refresh(db_dataset)

    return {
        "message": "Dataset uploaded and registered successfully",
        "dataset_id": dataset_id,
        "name": db_dataset.name,
        "filename": original_filename,
        "file_size_bytes": encrypted_size,
        "raw_size_bytes": file_size,
        "row_count": total_rows,
        "column_count": len(df.columns),
        "columns": df.columns.tolist(),
        "types": types_meta,
        "validation": val_result,
        "large_file_mode": is_large
    }


@router.post("/", status_code=status.HTTP_201_CREATED)
async def upload_dataset(
    file: UploadFile = File(...),
    name: str | None = None,
    user: User = Depends(get_current_user),
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db)
):
    original_filename = file.filename or "uploaded_dataset"
    extension = Path(original_filename).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{extension}'. Supported: CSV, TSV, XLSX, XLS, JSON."
        )

    user_dirs = get_user_storage_dirs(user.id, user.name)
    dataset_id = str(uuid.uuid4())
    tmp_path = user_dirs["uploads"] / f"{dataset_id}.upload.tmp"

    # Stream directly to disk in 4MB chunks (Zero-OOM up to 10GB)
    total_bytes = 0
    try:
        with open(tmp_path, "wb") as fout:
            while chunk := await file.read(STREAM_DISK_CHUNK):
                total_bytes += len(chunk)
                if total_bytes > MAX_FILE_SIZE:
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB (10 GB)."
                    )
                fout.write(chunk)

        return _finalize_uploaded_temp_file(
            tmp_path=tmp_path,
            original_filename=original_filename,
            display_name=name,
            user=user,
            business=business,
            db=db,
            dataset_id=dataset_id
        )
    finally:
        await file.close()
        if tmp_path.exists():
            try:
                tmp_path.unlink()
            except Exception:
                pass


# =====================================================================
# CHUNKED RESUMABLE UPLOAD API (For 30MB - 10GB Files Without Timeout)
# =====================================================================

class ChunkInitRequest(BaseModel):
    filename: str
    total_size: int
    name: str | None = None


@router.post("/chunk/init")
def init_chunk_upload(
    req: ChunkInitRequest,
    user: User = Depends(get_current_user),
    business: Business = Depends(get_current_business)
):
    extension = Path(req.filename).suffix.lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{extension}'. Supported: CSV, TSV, XLSX, XLS, JSON."
        )
    if req.total_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB (10 GB)."
        )

    upload_id = str(uuid.uuid4())
    user_dirs = get_user_storage_dirs(user.id, user.name)
    tmp_path = user_dirs["uploads"] / f"chunk_{upload_id}.tmp"
    meta_path = user_dirs["uploads"] / f"chunk_{upload_id}.meta.json"

    # Create empty file
    tmp_path.touch()
    meta_path.write_text(json.dumps({
        "upload_id": upload_id,
        "filename": req.filename,
        "name": req.name,
        "total_size": req.total_size,
        "received_bytes": 0
    }))

    return {"upload_id": upload_id, "status": "initialized"}


@router.post("/chunk/part")
async def upload_chunk_part(
    upload_id: str = Form(...),
    chunk_index: int = Form(...),
    chunk: UploadFile = File(...),
    user: User = Depends(get_current_user)
):
    user_dirs = get_user_storage_dirs(user.id, user.name)
    tmp_path = user_dirs["uploads"] / f"chunk_{upload_id}.tmp"
    meta_path = user_dirs["uploads"] / f"chunk_{upload_id}.meta.json"

    if not tmp_path.exists() or not meta_path.exists():
        raise HTTPException(status_code=404, detail="Upload session not found or expired.")

    received = 0
    with open(tmp_path, "ab") as fout:
        while data := await chunk.read(STREAM_DISK_CHUNK):
            fout.write(data)
            received += len(data)
    await chunk.close()

    current_size = tmp_path.stat().st_size
    if current_size > MAX_FILE_SIZE:
        tmp_path.unlink(missing_ok=True)
        meta_path.unlink(missing_ok=True)
        raise HTTPException(status_code=413, detail="Upload exceeded 10 GB limit.")

    return {
        "upload_id": upload_id,
        "chunk_index": chunk_index,
        "received_bytes": current_size
    }


class ChunkCompleteRequest(BaseModel):
    upload_id: str


@router.post("/chunk/complete", status_code=status.HTTP_201_CREATED)
def complete_chunk_upload(
    req: ChunkCompleteRequest,
    user: User = Depends(get_current_user),
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db)
):
    user_dirs = get_user_storage_dirs(user.id, user.name)
    tmp_path = user_dirs["uploads"] / f"chunk_{req.upload_id}.tmp"
    meta_path = user_dirs["uploads"] / f"chunk_{req.upload_id}.meta.json"

    if not tmp_path.exists() or not meta_path.exists():
        raise HTTPException(status_code=404, detail="Upload session not found.")

    try:
        meta = json.loads(meta_path.read_text())
        return _finalize_uploaded_temp_file(
            tmp_path=tmp_path,
            original_filename=meta["filename"],
            display_name=meta.get("name"),
            user=user,
            business=business,
            db=db,
            dataset_id=req.upload_id
        )
    finally:
        tmp_path.unlink(missing_ok=True)
        meta_path.unlink(missing_ok=True)
