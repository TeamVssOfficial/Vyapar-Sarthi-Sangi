from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from pathlib import Path
import json
import uuid
import pandas as pd
from sqlalchemy.orm import Session

from database.connection import get_db
from database.models import User, Business, Dataset, AnalysisResult, AuditLog
from auth.dependencies import get_current_user, get_current_business
from config import settings
from storage_manager import get_user_storage_dirs, save_encrypted_dataset
from api.datasets import load_dataset_df
from engines.data_intelligence.profiling import profile_dataset
from engines.data_intelligence.validation import validate_dataset
from engines.data_intelligence.cleaning import generate_cleaning_recommendations, apply_cleaning
from engines.data_intelligence.type_detection import detect_column_types
import io

router = APIRouter(prefix="/api/data-quality", tags=["Data Quality"])

PROCESSED_DIR = settings.STORAGE_DIR / "processed"
PROCESSED_DIR.mkdir(parents=True, exist_ok=True)


class CleanDatasetRequest(BaseModel):
    drop_duplicates: bool = True
    trim_whitespace: bool = True
    fill_numeric_strategy: str = "median"  # median, mean, zero, none
    fill_categorical_strategy: str = "unknown"  # unknown, mode, none
    drop_columns: list[str] = []
    outlier_strategy: str = "none"  # "drop", "cap", "none"
    outlier_columns: list[str] = []
    iqr_multiplier: float = 1.5
    create_new_dataset: bool = True
    cleaned_name: str | None = None


class OutlierRemovalRequest(BaseModel):
    strategy: str = "drop"  # "drop" (remove rows) or "cap" (winsorize)
    columns: list[str] = []
    iqr_multiplier: float = 1.5
    cleaned_name: str | None = None


@router.get("/{dataset_id}")
def get_quality_report(
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

    df = load_dataset_df(dataset.file_path)

    profile = profile_dataset(df)
    validation = validate_dataset(df)
    recommendations = generate_cleaning_recommendations(df)

    return {
        "dataset_id": dataset.id,
        "dataset_name": dataset.name,
        "profile": profile,
        "validation": validation,
        "recommendations": recommendations
    }


@router.post("/{dataset_id}/clean")
def clean_dataset_endpoint(
    dataset_id: str,
    req: CleanDatasetRequest,
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

    df = load_dataset_df(dataset.file_path)

    options = {
        "drop_duplicates": req.drop_duplicates,
        "trim_whitespace": req.trim_whitespace,
        "fill_numeric_strategy": req.fill_numeric_strategy,
        "fill_categorical_strategy": req.fill_categorical_strategy,
        "drop_columns": req.drop_columns,
        "outlier_strategy": req.outlier_strategy,
        "outlier_columns": req.outlier_columns,
        "iqr_multiplier": req.iqr_multiplier
    }

    cleaned_df, summary = apply_cleaning(df, options)

    new_id = str(uuid.uuid4())
    cleaned_filename = f"{dataset.name}_cleaned.csv"

    # User separate folder & encrypted storage
    user_dirs = get_user_storage_dirs(user.id, user.name)
    target_path = user_dirs["processed"] / f"{new_id}.enc"

    csv_buf = io.StringIO()
    cleaned_df.to_csv(csv_buf, index=False)
    encrypted_size = save_encrypted_dataset(csv_buf.getvalue().encode("utf-8"), target_path)

    new_types = detect_column_types(cleaned_df)

    cleaned_dataset = Dataset(
        id=new_id,
        business_id=business.id,
        user_id=user.id,
        name=req.cleaned_name or f"{dataset.name} (Cleaned)",
        filename=cleaned_filename,
        file_path=str(target_path.resolve()),
        file_size_bytes=encrypted_size,
        row_count=len(cleaned_df),
        col_count=len(cleaned_df.columns),
        status="cleaned",
        column_meta=json.dumps(new_types)
    )
    db.add(cleaned_dataset)
    db.add(AuditLog(
        user_id=user.id,
        business_id=business.id,
        action="clean_dataset",
        details=f"Cleaned dataset '{dataset.name}' -> '{cleaned_dataset.name}'. {summary['actions_performed']}"
    ))
    db.commit()
    db.refresh(cleaned_dataset)

    return {
        "message": "Dataset cleaned successfully without altering original file",
        "new_dataset_id": cleaned_dataset.id,
        "name": cleaned_dataset.name,
        "summary": summary
    }


@router.post("/{dataset_id}/remove-outliers")
def remove_outliers_endpoint(
    dataset_id: str,
    req: OutlierRemovalRequest,
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

    df = load_dataset_df(dataset.file_path)

    options = {
        "drop_duplicates": False,
        "trim_whitespace": False,
        "fill_numeric_strategy": "none",
        "fill_categorical_strategy": "none",
        "outlier_strategy": req.strategy,
        "outlier_columns": req.columns,
        "iqr_multiplier": req.iqr_multiplier
    }

    cleaned_df, summary = apply_cleaning(df, options)

    new_id = str(uuid.uuid4())
    suffix = "Outliers Capped" if req.strategy in ["cap", "winsorize"] else "Outliers Removed"
    cleaned_name = req.cleaned_name or f"{dataset.name} ({suffix})"
    cleaned_filename = f"{dataset.name}_{req.strategy}_outliers.csv"

    # User separate folder & encrypted storage
    user_dirs = get_user_storage_dirs(user.id, user.name)
    target_path = user_dirs["processed"] / f"{new_id}.enc"

    csv_buf = io.StringIO()
    cleaned_df.to_csv(csv_buf, index=False)
    encrypted_size = save_encrypted_dataset(csv_buf.getvalue().encode("utf-8"), target_path)

    new_types = detect_column_types(cleaned_df)

    cleaned_dataset = Dataset(
        id=new_id,
        business_id=business.id,
        user_id=user.id,
        name=cleaned_name,
        filename=cleaned_filename,
        file_path=str(target_path.resolve()),
        file_size_bytes=encrypted_size,
        row_count=len(cleaned_df),
        col_count=len(cleaned_df.columns),
        status="cleaned",
        column_meta=json.dumps(new_types)
    )
    db.add(cleaned_dataset)
    db.add(AuditLog(
        user_id=user.id,
        business_id=business.id,
        action="remove_outliers",
        details=f"Outlier processing on '{dataset.name}' ({req.strategy}) -> '{cleaned_dataset.name}'. {summary['actions_performed']}"
    ))
    db.commit()
    db.refresh(cleaned_dataset)

    return {
        "message": f"Successfully treated outliers using strategy '{req.strategy}' without altering original file",
        "new_dataset_id": cleaned_dataset.id,
        "name": cleaned_dataset.name,
        "summary": summary
    }
