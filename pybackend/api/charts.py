from fastapi import APIRouter, HTTPException, Depends, status, Query
from sqlalchemy.orm import Session

from database.connection import get_db
from database.models import User, Business, Dataset
from auth.dependencies import get_current_user, get_current_business
from api.datasets import load_dataset_df
from engines.visualization.chart_generator import generate_plotly_spec
from engines.bi.field_mapper import detect_business_mapping
import pandas as pd
import numpy as np

router = APIRouter(prefix="/api/charts", tags=["Interactive Charts"])


@router.get("/{dataset_id}/spec")
def get_chart_specification(
    dataset_id: str,
    chart_type: str = Query(..., description="bar, line, scatter, pie, histogram, box, correlation_heatmap, stacked_bar"),
    x: str = Query(..., description="X-axis column name"),
    y: str | None = Query(None, description="Y-axis column name"),
    color: str | None = Query(None, description="Optional color breakdown column"),
    title: str | None = Query(None, description="Chart title"),
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db)
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.business_id == business.id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    df = load_dataset_df(dataset.file_path)

    if chart_type != "correlation_heatmap" and x not in df.columns:
        raise HTTPException(status_code=400, detail=f"Column '{x}' not found in dataset")
    if y and y not in df.columns:
        raise HTTPException(status_code=400, detail=f"Column '{y}' not found in dataset")

    try:
        spec = generate_plotly_spec(df, chart_type=chart_type, x=x, y=y, color=color, title=title)
        return spec
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Error generating chart: {str(exc)}")


@router.get("/{dataset_id}/dashboard-presets")
def get_dashboard_presets(
    dataset_id: str,
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db)
):
    """
    Returns automated pre-built charts tailored to the detected business semantics.
    """
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.business_id == business.id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    df = load_dataset_df(dataset.file_path)
    mapping_res = detect_business_mapping(df)
    m = mapping_res["mapping"]

    charts = []

    # 1. Trend chart if date + metric
    val_col = m["revenue"] or m["sales"]
    if not val_col:
        num_cols = df.select_dtypes(include=np.number).columns
        if not num_cols.empty:
            val_col = num_cols[0]

    date_col = m["date"]
    if date_col and val_col:
        # Pre-aggregate by date string
        try:
            temp_df = df[[date_col, val_col]].copy()
            temp_df[date_col] = pd.to_datetime(temp_df[date_col], errors="coerce")
            temp_df = temp_df.dropna().sort_values(by=date_col)
            monthly = temp_df.set_index(date_col)[val_col].resample("M").sum().reset_index()
            monthly[date_col] = monthly[date_col].dt.strftime("%Y-%m")
            spec = generate_plotly_spec(monthly, "line", x=date_col, y=val_col, title=f"Monthly {val_col} Trend")
            charts.append({"id": "trend", "title": f"Monthly {val_col} Trend", "spec": spec})
        except Exception:
            pass

    # 2. Category Breakdown (Pie or Bar)
    cat_col = m["category"]
    if cat_col and val_col:
        try:
            spec = generate_plotly_spec(df, "bar", x=cat_col, y=val_col, title=f"{val_col} by {cat_col}")
            charts.append({"id": "category", "title": f"{val_col} by {cat_col}", "spec": spec})
        except Exception:
            pass

    # 3. Top Products
    prod_col = m["product"]
    if prod_col and val_col:
        try:
            spec = generate_plotly_spec(df, "bar", x=prod_col, y=val_col, title=f"Top Performing {prod_col}")
            charts.append({"id": "products", "title": f"Top Performing {prod_col}", "spec": spec})
        except Exception:
            pass

    # 4. Geographic distribution
    geo_col = m["country"] or m["region"]
    if geo_col and val_col:
        try:
            spec = generate_plotly_spec(df, "pie", x=geo_col, y=val_col, title=f"{val_col} Share by {geo_col}")
            charts.append({"id": "geographic", "title": f"{val_col} Share by {geo_col}", "spec": spec})
        except Exception:
            pass

    # 5. Correlation Heatmap
    if len(df.select_dtypes(include=np.number).columns) >= 2:
        try:
            spec = generate_plotly_spec(df, "correlation_heatmap", x="", title="Metric Correlation Matrix")
            charts.append({"id": "correlation", "title": "Metric Correlation Matrix", "spec": spec})
        except Exception:
            pass

    return {
        "dataset_id": dataset.id,
        "dataset_name": dataset.name,
        "charts": charts
    }
