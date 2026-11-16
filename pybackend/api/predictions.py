
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api/predictions", tags=["Predictions"])


@router.get("/{dataset_id}/tasks")
def available_prediction_tasks(dataset_id: str):

    # Task detection will be implemented in the ML engine.
    return {
        "dataset_id": dataset_id,
        "message": "Prediction task detection is not implemented yet.",
        "available_tasks": [
            "sales_forecasting",
            "revenue_prediction",
            "classification",
            "customer_segmentation",
            "anomaly_detection"
        ]
    }


@router.post("/{dataset_id}/train")
def train_model(dataset_id: str):

    raise HTTPException(
        status_code=501,
        detail="ML training will be connected in Phase 4."
    )
