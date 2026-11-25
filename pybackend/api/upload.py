from fastapi import APIRouter, UploadFile, File, Form, Header, HTTPException, Depends, status
from pydantic import BaseModel
from pathlib import Path
import json
import uuid
import pandas as pd
from sqlalchemy.orm import Session

from database.connection import get_db
from database.models import User, Business, Dataset, AuditLog
from auth.dependencies import get_current_user, get_current_business
from auth.security import decode_access_token
from config import settings
from storage_manager import (
    get_user_storage_dirs,
    stream_encrypt_file,
    stream_encrypt_parts_and_count,
    count_csv_rows_fast,
    _read_dataframe_from_path_or_bytes
)
from engines.data_intelligence.type_detection import detect_column_types
from engines.data_intelligence.validation import validate_dataset

router = APIRouter(prefix="/api/upload", tags=["Upload"])

MAX_FILE_SIZE = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024  # Up to 10 GB
ALLOWED_EXTENSIONS = {".csv", ".tsv", ".xlsx", ".xls", ".json"}
STREAM_DISK_CHUNK = 4 * 1024 * 1024  # 4 MB
SAMPLE_PARSE_ROWS = 10000  # Fast schema profiling & validation


def _register_dataset_in_db(
    dataset_id: str,
    target_path: Path,
    encrypted_size: int,
    raw_size: int,
    total_rows: int,
    df_sample: pd.DataFrame,
    original_filename: str,
    display_name: str | None,
    user: User,
    business: Business,
    db: Session,
    is_large: bool
) -> dict:
    types_meta = detect_column_types(df_sample)
    final_name = display_name.strip() if display_name and display_name.strip() else Path(original_filename).stem

    db_dataset = Dataset(
        id=dataset_id,
        business_id=business.id,
        user_id=user.id,
        name=final_name,
        filename=original_filename,
        file_path=str(target_path.resolve()),
        file_size_bytes=encrypted_size,
        row_count=total_rows,
        col_count=len(df_sample.columns),
        status="ready",
        column_meta=json.dumps(types_meta)
    )
    db.add(db_dataset)

    size_mb = round(raw_size / (1024 * 1024), 2)
    db.add(AuditLog(
        user_id=user.id,
        business_id=business.id,
        action="upload_dataset",
        details=f"Uploaded '{original_filename}' ({size_mb} MB) -> stream-encrypted as '{dataset_id}.enc' ({total_rows:,} rows, {len(df_sample.columns)} cols)"
    ))
    db.commit()
    db.refresh(db_dataset)

    return {
        "message": "Dataset uploaded and registered successfully",
        "dataset_id": dataset_id,
        "name": db_dataset.name,
        "filename": original_filename,
        "file_size_bytes": encrypted_size,
        "raw_size_bytes": raw_size,
        "row_count": total_rows,
        "column_count": len(df_sample.columns),
        "columns": df_sample.columns.tolist(),
        "types": types_meta,
        "large_file_mode": is_large
    }


def _finalize_uploaded_temp_file(
    tmp_path: Path,
    original_filename: str,
    display_name: str | None,
    user: User,
    business: Business,
    db: Session,
    dataset_id: str | None = None
) -> dict:
    extension = Path(original_filename).suffix.lower()
    file_size = tmp_path.stat().st_size

    if file_size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file is empty (0 bytes)."
        )

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

    total_rows = len(df)
    if is_large and extension in (".csv", ".tsv"):
        try:
            counted = count_csv_rows_fast(tmp_path)
            if counted > total_rows:
                total_rows = counted
        except Exception:
            pass

    val_result = validate_dataset(df)
    if not val_result["can_proceed"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Dataset validation failed: {val_result['checks']}"
        )

    user_dirs = get_user_storage_dirs(user.id, user.name)
    dataset_id = dataset_id or str(uuid.uuid4())
    target_path = user_dirs["uploads"] / f"{dataset_id}.enc"
    encrypted_size = stream_encrypt_file(tmp_path, target_path)

    res = _register_dataset_in_db(
        dataset_id=dataset_id,
        target_path=target_path,
        encrypted_size=encrypted_size,
        raw_size=file_size,
        total_rows=total_rows,
        df_sample=df,
        original_filename=original_filename,
        display_name=display_name,
        user=user,
        business=business,
        db=db,
        is_large=is_large
    )
    res["validation"] = val_result
    return res


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
# HIGH-SPEED PARALLEL CHUNKED UPLOAD API (Zero-DB-Latency Per Chunk)
# =====================================================================

def _get_staging_dir(upload_id: str) -> Path:
    staging = settings.STORAGE_DIR / "upload_staging" / upload_id
    staging.mkdir(parents=True, exist_ok=True)
    return staging


class ChunkInitRequest(BaseModel):
    filename: str
    total_size: int
    total_chunks: int | None = None
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
    staging_dir = _get_staging_dir(upload_id)
    meta_path = staging_dir / "meta.json"

    meta_path.write_text(json.dumps({
        "upload_id": upload_id,
        "user_id": str(user.id),
        "business_id": str(business.id),
        "filename": req.filename,
        "name": req.name,
        "total_size": req.total_size,
        "total_chunks": req.total_chunks
    }))

    return {"upload_id": upload_id, "status": "initialized"}


@router.post("/chunk/part")
async def upload_chunk_part(
    upload_id: str = Form(...),
    chunk_index: int = Form(...),
    chunk: UploadFile = File(...),
    authorization: str | None = Header(None)
):
    """
    Stateless JWT-verified parallel chunk receiver.
    Zero MongoDB round-trip per chunk for maximum upload speed.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Bearer token")
    payload = decode_access_token(authorization.split(" ")[1])
    if not payload or not payload.get("sub"):
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    staging_dir = settings.STORAGE_DIR / "upload_staging" / upload_id
    meta_path = staging_dir / "meta.json"
    if not meta_path.exists():
        raise HTTPException(status_code=404, detail="Upload session not found or expired.")

    part_path = staging_dir / f"part_{chunk_index:06d}.bin"
    with open(part_path, "wb") as fout:
        while data := await chunk.read(STREAM_DISK_CHUNK):
            fout.write(data)
    await chunk.close()

    return {
        "upload_id": upload_id,
        "chunk_index": chunk_index,
        "part_size": part_path.stat().st_size
    }


class ChunkCompleteRequest(BaseModel):
    upload_id: str
    total_chunks: int | None = None


@router.post("/chunk/complete", status_code=status.HTTP_201_CREATED)
def complete_chunk_upload(
    req: ChunkCompleteRequest,
    user: User = Depends(get_current_user),
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db)
):
    staging_dir = settings.STORAGE_DIR / "upload_staging" / req.upload_id
    meta_path = staging_dir / "meta.json"

    if not meta_path.exists():
        raise HTTPException(status_code=404, detail="Upload session not found.")

    try:
        meta = json.loads(meta_path.read_text())
        if str(meta.get("user_id")) != str(user.id):
            raise HTTPException(status_code=403, detail="Unauthorized upload session.")

        part_paths = sorted(staging_dir.glob("part_*.bin"))
        if not part_paths:
            raise HTTPException(status_code=400, detail="No uploaded chunks found.")

        original_filename = meta["filename"]
        extension = Path(original_filename).suffix.lower()
        total_raw_size = sum(p.stat().st_size for p in part_paths)

        # For Excel (.xlsx/.xls), assemble to single temp file first since Excel is a ZIP archive
        if extension in (".xlsx", ".xls"):
            assembled = staging_dir / f"assembled{extension}"
            with open(assembled, "wb") as fout:
                for p in part_paths:
                    with open(p, "rb") as fin:
                        while buf := fin.read(STREAM_DISK_CHUNK):
                            fout.write(buf)
                    p.unlink(missing_ok=True)
            return _finalize_uploaded_temp_file(
                tmp_path=assembled,
                original_filename=original_filename,
                display_name=meta.get("name"),
                user=user,
                business=business,
                db=db,
                dataset_id=req.upload_id
            )

        # Fast-path for CSV/TSV/JSON: profile from part_0 in <0.1s, then single-pass stream-encrypt & count!
        try:
            df_sample = _read_dataframe_from_path_or_bytes(
                source_path=part_paths[0],
                ref_name=original_filename,
                nrows=SAMPLE_PARSE_ROWS
            )
        except Exception as exc:
            raise HTTPException(status_code=400, detail=f"Unable to parse dataset: {str(exc)}")

        if df_sample.empty or len(df_sample.columns) == 0:
            raise HTTPException(status_code=400, detail="The uploaded file contains no data or valid columns.")

        val_result = validate_dataset(df_sample)
        if not val_result["can_proceed"]:
            raise HTTPException(status_code=400, detail=f"Dataset validation failed: {val_result['checks']}")

        user_dirs = get_user_storage_dirs(user.id, user.name)
        target_path = user_dirs["uploads"] / f"{req.upload_id}.enc"

        encrypted_size, counted_rows = stream_encrypt_parts_and_count(part_paths, target_path)
        total_rows = max(len(df_sample), counted_rows) if extension in (".csv", ".tsv") else len(df_sample)

        res = _register_dataset_in_db(
            dataset_id=req.upload_id,
            target_path=target_path,
            encrypted_size=encrypted_size,
            raw_size=total_raw_size,
            total_rows=total_rows,
            df_sample=df_sample,
            original_filename=original_filename,
            display_name=meta.get("name"),
            user=user,
            business=business,
            db=db,
            is_large=(total_raw_size > 25 * 1024 * 1024)
        )
        res["validation"] = val_result
        return res
    finally:
        # Clean up staging directory
        try:
            for item in staging_dir.glob("*"):
                item.unlink(missing_ok=True)
            staging_dir.rmdir()
        except Exception:
            pass
