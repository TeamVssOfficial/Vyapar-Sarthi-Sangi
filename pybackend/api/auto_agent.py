"""
Automated AI Data Science Agent API for Vyapar Verse.
Provides single-click automated data science execution, executive dashboards,
data quality scoring, automated cleaning, and download of cleaned datasets.
Strictly returns business results with zero exposed Python code.
"""

from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.responses import FileResponse, StreamingResponse
from pathlib import Path
from typing import Optional, Dict, Any
import io
import pandas as pd
from sqlalchemy.orm import Session

from database.connection import get_db
from database.models import User, Business, Dataset
from auth.dependencies import get_current_user, get_current_business
from auth.subscription_guard import require_active_subscription
from api.datasets import load_dataset_df
from storage_manager import get_user_storage_dirs
from engines.auto_agent.auto_analyst_pipeline import run_automated_data_science_pipeline

router = APIRouter(prefix="/api/auto-agent", tags=["Automated AI Data Science Agent"])

# In-memory pipeline cache: dataset_id -> analysis_result
_PIPELINE_CACHE: Dict[str, Dict[str, Any]] = {}


@router.post("/analyze/{dataset_id}")
async def analyze_dataset_automatically(
    dataset_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    current_business: Business = Depends(get_current_business),
    _sub: Any = Depends(require_active_subscription)
):
    """
    Executes the fully automated AI data science workflow on the uploaded file.
    Does not require any code, SQL, or parameter tuning from the user.
    """
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset and current_business:
        dataset = db.query(Dataset).filter(Dataset.business_id == current_business.id).first()

    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found. Please upload a business dataset first.")

    try:
        df_raw = load_dataset_df(dataset.file_path, original_filename=dataset.filename)
        if df_raw is None or df_raw.empty:
            raise HTTPException(status_code=400, detail="Cannot read dataset contents or file is empty")

        user_dirs = get_user_storage_dirs(current_user.id, current_user.name)
        cleaned_dir = user_dirs.get("cleaned") or user_dirs.get("processed") or user_dirs["root"]
        cleaned_dir.mkdir(parents=True, exist_ok=True)
        cleaned_path = cleaned_dir / f"{dataset.id}_cleaned.csv"

        result = run_automated_data_science_pipeline(
            df_raw=df_raw,
            dataset_name=dataset.name,
            cleaned_file_path=cleaned_path
        )
        result["dataset_id"] = dataset.id
        result["download_cleaned_url"] = f"/api/auto-agent/download-cleaned/{dataset.id}"

        # Cache in memory for instant subsequent loads
        _PIPELINE_CACHE[dataset_id] = result
        _PIPELINE_CACHE[dataset.id] = result
        return result
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Automated pipeline failed: {str(e)}")


@router.get("/results/{dataset_id}")
async def get_automated_analysis_results(
    dataset_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    current_business: Business = Depends(get_current_business)
):
    """Retrieves or auto-executes the automated analysis report."""
    if dataset_id in _PIPELINE_CACHE:
        return _PIPELINE_CACHE[dataset_id]

    return await analyze_dataset_automatically(
        dataset_id=dataset_id,
        db=db,
        current_user=current_user,
        current_business=current_business
    )


@router.get("/download-cleaned/{dataset_id}")
async def download_cleaned_dataset(
    dataset_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Directly downloads the clean, validated CSV version of the uploaded dataset."""
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    user_dirs = get_user_storage_dirs(current_user.id, current_user.name)
    cleaned_dir = user_dirs.get("cleaned") or user_dirs.get("processed") or user_dirs["root"]
    cleaned_dir.mkdir(parents=True, exist_ok=True)
    cleaned_path = cleaned_dir / f"{dataset.id}_cleaned.csv"

    if not cleaned_path.exists():
        df_raw = load_dataset_df(dataset.file_path, original_filename=dataset.filename)
        run_automated_data_science_pipeline(
            df_raw=df_raw,
            dataset_name=dataset.name,
            cleaned_file_path=cleaned_path
        )

    export_name = f"Cleaned_{Path(dataset.filename).stem}.csv"
    return FileResponse(
        path=str(cleaned_path),
        filename=export_name,
        media_type="text/csv"
    )
