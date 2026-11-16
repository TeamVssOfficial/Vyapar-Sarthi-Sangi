from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, Field
from pathlib import Path
import json
import uuid
import joblib
from sqlalchemy.orm import Session

from database.connection import get_db
from database.models import User, Business, Dataset, MLModel, Prediction, AuditLog
from auth.dependencies import get_current_user, get_current_business
from config import settings
from api.datasets import load_dataset_df
from engines.ml.task_detection import detect_ml_tasks
from engines.ml.training import (
    train_supervised_model,
    train_forecasting_model,
    train_clustering_model
)

router = APIRouter(prefix="/api/ml", tags=["Machine Learning Studio"])

MODELS_DIR = settings.STORAGE_DIR / "models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)


class TrainModelRequest(BaseModel):
    task_type: str = Field(..., description="regression, classification, forecasting, clustering")
    target_column: str | None = None
    date_column: str | None = None
    entity_column: str | None = None
    feature_columns: list[str] | None = None
    name: str | None = None
    forecast_horizon: int = 6


class PredictRequest(BaseModel):
    records: list[dict]


@router.get("/{dataset_id}/tasks")
def get_ml_tasks(
    dataset_id: str,
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db)
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.business_id == business.id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    df = load_dataset_df(dataset.file_path)
    return detect_ml_tasks(df)


@router.post("/{dataset_id}/train")
def train_model_endpoint(
    dataset_id: str,
    req: TrainModelRequest,
    user: User = Depends(get_current_user),
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db)
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.business_id == business.id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    df = load_dataset_df(dataset.file_path)
    model_id = str(uuid.uuid4())
    model_save_path = MODELS_DIR / f"{model_id}.joblib"

    try:
        if req.task_type in ["regression", "classification"]:
            if not req.target_column:
                raise HTTPException(status_code=400, detail="Target column must be specified for supervised learning.")

            res = train_supervised_model(
                df,
                target=req.target_column,
                task_type=req.task_type,
                feature_columns=req.feature_columns
            )

            # Persist model
            joblib.dump(res["pipeline"], model_save_path)
            model_name = req.name or f"{req.task_type.title()} on {req.target_column}"

            db_model = MLModel(
                id=model_id,
                dataset_id=dataset.id,
                business_id=business.id,
                name=model_name,
                task_type=req.task_type,
                target_column=req.target_column,
                algorithm="RandomForest",
                metrics_json=json.dumps(res["metrics"]),
                model_path=str(model_save_path.resolve()),
                status="ready"
            )
            db.add(db_model)
            db.add(AuditLog(
                user_id=user.id,
                business_id=business.id,
                action="train_model",
                details=f"Trained {req.task_type} model on '{req.target_column}' (Metrics: {res['metrics']})"
            ))
            db.commit()

            return {
                "model_id": model_id,
                "name": model_name,
                "task_type": req.task_type,
                "target_column": req.target_column,
                "metrics": res["metrics"],
                "feature_importances": res["feature_importances"],
                "sample_predictions": res["sample_predictions"],
                "limitations": res["limitations"]
            }

        elif req.task_type == "forecasting":
            if not req.date_column or not req.target_column:
                raise HTTPException(status_code=400, detail="Forecasting requires both date_column and target_column.")

            res = train_forecasting_model(
                df,
                date_column=req.date_column,
                target_column=req.target_column,
                forecast_horizon=req.forecast_horizon
            )

            model_name = req.name or f"Forecast for {req.target_column}"
            db_model = MLModel(
                id=model_id,
                dataset_id=dataset.id,
                business_id=business.id,
                name=model_name,
                task_type="forecasting",
                target_column=req.target_column,
                algorithm="Time-Series Autoregressive Forest",
                metrics_json=json.dumps({"test_mae": res["test_mae"]}),
                status="ready"
            )
            db.add(db_model)
            db.commit()

            return {
                "model_id": model_id,
                "name": model_name,
                "task_type": "forecasting",
                "test_mae": res["test_mae"],
                "historical_series": res["historical_series"],
                "forecast": res["forecast"]
            }

        elif req.task_type == "clustering":
            if not req.entity_column:
                raise HTTPException(status_code=400, detail="Clustering requires an entity_column (e.g. customer name).")

            res = train_clustering_model(df, entity_column=req.entity_column)
            model_name = req.name or f"Segmentation on {req.entity_column}"

            db_model = MLModel(
                id=model_id,
                dataset_id=dataset.id,
                business_id=business.id,
                name=model_name,
                task_type="clustering",
                target_column=req.entity_column,
                algorithm="KMeans",
                metrics_json=json.dumps({"silhouette_score": res["silhouette_score"]}),
                status="ready"
            )
            db.add(db_model)
            db.commit()

            return {
                "model_id": model_id,
                "name": model_name,
                "task_type": "clustering",
                "silhouette_score": res["silhouette_score"],
                "clusters": res["clusters"]
            }

        else:
            raise HTTPException(status_code=400, detail=f"Unsupported task_type '{req.task_type}'")

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Model training error: {str(exc)}")


@router.get("/{dataset_id}/models")
def list_dataset_models(
    dataset_id: str,
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db)
):
    models = db.query(MLModel).filter(
        MLModel.dataset_id == dataset_id,
        MLModel.business_id == business.id
    ).order_by(MLModel.created_at.desc()).all()

    return [
        {
            "id": m.id,
            "name": m.name,
            "task_type": m.task_type,
            "target_column": m.target_column,
            "algorithm": m.algorithm,
            "metrics": json.loads(m.metrics_json) if m.metrics_json else {},
            "status": m.status,
            "created_at": m.created_at.isoformat()
        }
        for m in models
    ]
