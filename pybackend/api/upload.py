from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, status
from pathlib import Path
import json
import uuid
from sqlalchemy.orm import Session

from database.connection import get_db
from database.models import User, Business, Dataset, AuditLog
from auth.dependencies import get_current_user, get_current_business
from config import settings
from storage_manager import get_user_storage_dirs, save_encrypted_dataset, load_encrypted_dataframe
from engines.data_intelligence.type_detection import detect_column_types
from engines.data_intelligence.validation import validate_dataset
import io
import pandas as pd

router = APIRouter(prefix="/api/upload", tags=["Upload"])

MAX_FILE_SIZE = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
ALLOWED_EXTENSIONS = {".csv", ".xlsx", ".xls"}


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
            detail=f"Unsupported file format '{extension}'. Only CSV, XLSX, and XLS are supported."
        )

    # Isolated user folder (organized by user name & user ID)
    user_dirs = get_user_storage_dirs(user.id, user.name)
    dataset_id = str(uuid.uuid4())

    # On disk: raw file name is changed to dataset ID with .enc extension
    target_path = user_dirs["uploads"] / f"{dataset_id}.enc"

    # Read uploaded file bytes in memory
    raw_bytes = bytearray()
    while chunk := await file.read(1024 * 1024):
        raw_bytes.extend(chunk)
        if len(raw_bytes) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB."
            )

    raw_data = bytes(raw_bytes)

    # In-memory DataFrame validation before writing
    try:
        if extension in (".xlsx", ".xls"):
            df = pd.read_excel(io.BytesIO(raw_data))
        else:
            df = None
            for enc in ("utf-8", "utf-8-sig", "cp1252", "latin1"):
                try:
                    df = pd.read_csv(io.BytesIO(raw_data), encoding=enc)
                    break
                except UnicodeDecodeError:
                    continue
            if df is None:
                df = pd.read_csv(io.BytesIO(raw_data), encoding="latin1")
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

    # Run validation
    val_result = validate_dataset(df)
    if not val_result["can_proceed"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Dataset validation failed: {val_result['checks']}"
        )

    # Encrypt and save to user's isolated folder with ID filename
    encrypted_size = save_encrypted_dataset(raw_data, target_path)

    # Column type detection
    types_meta = detect_column_types(df)
    display_name = name.strip() if name and name.strip() else Path(original_filename).stem

    # Save metadata to database
    db_dataset = Dataset(
        id=dataset_id,
        business_id=business.id,
        user_id=user.id,
        name=display_name,
        filename=original_filename,
        file_path=str(target_path.resolve()),
        file_size_bytes=encrypted_size,
        row_count=len(df),
        col_count=len(df.columns),
        status="ready",
        column_meta=json.dumps(types_meta)
    )
    db.add(db_dataset)

    # Audit log
    db.add(AuditLog(
        user_id=user.id,
        business_id=business.id,
        action="upload_dataset",
        details=f"Uploaded '{original_filename}' -> encrypted as '{dataset_id}.enc' in user directory ({len(df):,} rows, {len(df.columns)} cols)"
    ))
    db.commit()
    db.refresh(db_dataset)

    await file.close()

    return {
        "message": "Dataset uploaded and registered successfully",
        "dataset_id": dataset_id,
        "name": db_dataset.name,
        "filename": original_filename,
        "file_size_bytes": encrypted_size,
        "row_count": len(df),
        "column_count": len(df.columns),
        "columns": df.columns.tolist(),
        "types": types_meta,
        "validation": val_result
    }
