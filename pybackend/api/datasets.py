from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.responses import FileResponse
from pathlib import Path
import json
import pandas as pd
from sqlalchemy.orm import Session

from database.connection import get_db
from database.models import User, Business, Dataset, AuditLog
from auth.dependencies import get_current_user, get_current_business
from storage_manager import load_encrypted_dataframe

router = APIRouter(prefix="/api/datasets", tags=["Datasets"])


def load_dataset_df(file_path: str | Path, original_filename: str | None = None) -> pd.DataFrame:
    try:
        return load_encrypted_dataframe(file_path, original_filename=original_filename)
    except FileNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dataset file not found at {file_path}"
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error reading dataset: {str(exc)}"
        )


@router.get("/")
def list_datasets(
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db)
):
    datasets = db.query(Dataset).filter(Dataset.business_id == business.id).order_by(Dataset.created_at.desc()).all()
    def _fmt(dt):
        return dt.isoformat() if hasattr(dt, "isoformat") else (str(dt) if dt else "")

    return [
        {
            "id": d.id,
            "name": d.name,
            "filename": d.filename,
            "file_size_bytes": d.file_size_bytes,
            "row_count": d.row_count,
            "col_count": d.col_count,
            "status": d.status,
            "created_at": _fmt(getattr(d, "created_at", None)),
            "updated_at": _fmt(getattr(d, "updated_at", None))
        }
        for d in datasets
    ]


@router.get("/{dataset_id}")
def get_dataset_details(
    dataset_id: str,
    preview_rows: int = 50,
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db)
):
    dataset = db.query(Dataset).filter(
        Dataset.id == dataset_id,
        Dataset.business_id == business.id
    ).first()

    if not dataset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dataset not found in this business workspace")

    df = load_dataset_df(dataset.file_path)

    # Safe JSON serializable preview
    preview_data = df.head(preview_rows).replace({float("nan"): None}).to_dict(orient="records")

    types_meta = json.loads(dataset.column_meta) if dataset.column_meta else {}

    return {
        "id": dataset.id,
        "name": dataset.name,
        "filename": dataset.filename,
        "row_count": len(df),
        "column_count": len(df.columns),
        "columns": df.columns.tolist(),
        "types": types_meta,
        "preview": preview_data,
        "status": dataset.status,
        "created_at": dataset.created_at.isoformat() if hasattr(dataset.created_at, "isoformat") else (str(dataset.created_at) if dataset.created_at else "")
    }


@router.get("/{dataset_id}/download")
def download_dataset_file(
    dataset_id: str,
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db)
):
    dataset = db.query(Dataset).filter(
        Dataset.id == dataset_id,
        Dataset.business_id == business.id
    ).first()

    if not dataset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dataset not found")

    path = Path(dataset.file_path)
    if not path.is_file():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Physical file missing")

    return FileResponse(
        path=path,
        filename=dataset.filename,
        media_type="application/octet-stream"
    )


@router.delete("/{dataset_id}")
def delete_dataset(
    dataset_id: str,
    user: User = Depends(get_current_user),
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db)
):
    dataset = db.query(Dataset).filter(
        Dataset.id == dataset_id,
        Dataset.business_id == business.id
    ).first()

    if not dataset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dataset not found")

    # Unlink file if exists
    try:
        Path(dataset.file_path).unlink(missing_ok=True)
    except Exception:
        pass

    db.delete(dataset)
    db.add(AuditLog(
        user_id=user.id,
        business_id=business.id,
        action="delete_dataset",
        details=f"Deleted dataset '{dataset.name}'"
    ))
    db.commit()

    return {"message": "Dataset deleted successfully"}
