from fastapi import APIRouter, HTTPException, Depends, status, Query
from sqlalchemy.orm import Session

from database.connection import get_db
from database.models import User, Business, Dataset, AnalysisResult
from auth.dependencies import get_current_user, get_current_business
from api.datasets import load_dataset_df
from engines.eda.statistics import (
    compute_descriptive_statistics,
    compute_categorical_distributions,
    compute_numerical_distributions
)
from engines.eda.correlation import compute_correlations
from engines.eda.outliers import detect_outliers
from engines.eda.trends import detect_date_columns, compute_time_trends
import json

router = APIRouter(prefix="/api/analysis", tags=["Exploratory Data Analysis"])


@router.get("/{dataset_id}/eda")
def get_full_eda(
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

    stats = compute_descriptive_statistics(df)
    cat_dist = compute_categorical_distributions(df)
    num_dist = compute_numerical_distributions(df)
    correlations = compute_correlations(df)
    outliers = detect_outliers(df)
    date_cols = detect_date_columns(df)

    # Key automated insights
    insights = []
    if outliers["total_outlier_points"] > 0:
        insights.append(f"Identified {outliers['total_outlier_points']} potential outliers across {outliers['columns_with_outliers']} numeric columns.")
    if correlations["top_correlations"]:
        top = correlations["top_correlations"][0]
        insights.append(f"Strongest feature relationship is between '{top['col1']}' and '{top['col2']}' (r = {top['correlation']}).")
    if date_cols:
        insights.append(f"Identified date field '{date_cols[0]}' suitable for longitudinal trend analysis and forecasting.")

    eda_payload = {
        "dataset_id": dataset.id,
        "dataset_name": dataset.name,
        "overview": {
            "total_rows": len(df),
            "total_columns": len(df.columns),
            "numeric_columns_count": len(df.select_dtypes(include="number").columns),
            "categorical_columns_count": len(df.select_dtypes(include=["object", "category"]).columns),
            "date_columns": date_cols
        },
        "descriptive_statistics": stats["numeric_statistics"],
        "categorical_distributions": cat_dist,
        "numerical_histograms": num_dist,
        "correlations": correlations,
        "outliers": outliers,
        "insights": insights
    }

    return eda_payload


@router.get("/{dataset_id}/correlations")
def get_correlations(
    dataset_id: str,
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db)
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.business_id == business.id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    df = load_dataset_df(dataset.file_path)
    return compute_correlations(df)


@router.get("/{dataset_id}/outliers")
def get_outliers(
    dataset_id: str,
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db)
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.business_id == business.id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    df = load_dataset_df(dataset.file_path)
    return detect_outliers(df)


@router.get("/{dataset_id}/trend")
def get_trend(
    dataset_id: str,
    date_col: str,
    value_col: str,
    frequency: str = "M",
    agg: str = "sum",
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db)
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.business_id == business.id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    df = load_dataset_df(dataset.file_path)
    return compute_time_trends(df, date_col=date_col, value_col=value_col, frequency=frequency, agg_func=agg)
