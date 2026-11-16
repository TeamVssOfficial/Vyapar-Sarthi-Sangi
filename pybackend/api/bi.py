from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database.connection import get_db
from database.models import User, Business, Dataset
from auth.dependencies import get_current_user, get_current_business
from api.datasets import load_dataset_df
from engines.bi.field_mapper import detect_business_mapping
from engines.bi.kpi_calculator import calculate_business_kpis

router = APIRouter(prefix="/api/bi", tags=["Business Intelligence"])


class MappingOverrideRequest(BaseModel):
    mapping: dict[str, str | None]


@router.get("/{dataset_id}/mapping")
def get_column_mapping(
    dataset_id: str,
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db)
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.business_id == business.id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    df = load_dataset_df(dataset.file_path)
    return detect_business_mapping(df)


@router.post("/{dataset_id}/mapping")
def update_column_mapping(
    dataset_id: str,
    req: MappingOverrideRequest,
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db)
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.business_id == business.id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    df = load_dataset_df(dataset.file_path)
    return detect_business_mapping(df, user_mapping=req.mapping)


@router.get("/{dataset_id}/kpis")
def get_kpis(
    dataset_id: str,
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db)
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.business_id == business.id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    df = load_dataset_df(dataset.file_path)
    return calculate_business_kpis(df)
