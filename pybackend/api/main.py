
from fastapi import FastAPI

from api import upload
from api import datasets
from api import analysis
from api import charts
from api import predictions
from api import ai_chat

app = FastAPI(
    title="Vyapar Sarthi Sangi API",
    description="VSS AI - Automated Business Intelligence Platform",
    version="0.1.0"
)

app.include_router(upload.router)
app.include_router(datasets.router)
app.include_router(analysis.router)
app.include_router(charts.router)
app.include_router(predictions.router)
app.include_router(ai_chat.router)


@app.get("/")
def home():
    return {
        "name": "Vyapar Sarthi Sangi",
        "short_name": "VSS AI",
        "status": "running"
    }


@app.get("/health")
def health():
    return {"status": "healthy"}
