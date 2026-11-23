import sys
from pathlib import Path

# Add pybackend directory to sys.path so imports work regardless of execution working directory
_BASE_DIR = Path(__file__).resolve().parent
if str(_BASE_DIR) not in sys.path:
    sys.path.insert(0, str(_BASE_DIR))

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
from contextlib import asynccontextmanager

from config import settings, PROJECT_DIR
from database.connection import init_db

# Routers
from api import auth
from api import business
from api import upload
from api import datasets
from api import data_quality
from api import analysis
from api import bi
from api import charts
from api import ml
from api import ai_chat
from api import reports
from api import code_studio
from api import inventory
from api import finance
from api import excel_integration
from api import auto_agent
from api import subscriptions


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables on application start
    init_db()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    description="VSS AI - Unified AI-Powered Business Operating System API",
    version=settings.APP_VERSION,
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_origin_regex=r"^https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all modules
app.include_router(auth.router)
app.include_router(auth.router, prefix="/api/user")  # Compatibility alias for Node.js backend routes
app.include_router(business.router)
app.include_router(upload.router)
app.include_router(datasets.router)
app.include_router(data_quality.router)
app.include_router(analysis.router)
app.include_router(bi.router)
app.include_router(charts.router)
app.include_router(ml.router)
app.include_router(ai_chat.router)
app.include_router(reports.router)
app.include_router(code_studio.router)
app.include_router(inventory.router)
app.include_router(finance.router)
app.include_router(excel_integration.router)
app.include_router(auto_agent.router)
app.include_router(subscriptions.router)

# Middleware to prevent stale browser caching of frontend static assets
@app.middleware("http")
async def add_no_cache_header(request: Request, call_next):
    response = await call_next(request)
    if request.url.path.startswith("/app"):
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
    return response

# Mount frontend SaaS application
frontend_dir = PROJECT_DIR / "frontend"
if frontend_dir.is_dir():
    app.mount("/app", StaticFiles(directory=str(frontend_dir), html=True), name="frontend")


@app.api_route("/", methods=["GET", "HEAD"])
def home(request: Request):
    if request.method == "HEAD":
        return Response(status_code=200)
    accept_header = request.headers.get("accept", "")
    if "text/html" in accept_header:
        return RedirectResponse(url="/app/")
    return {
        "product": "Vyapar Sarthi Sangi",
        "short_name": "VSS AI",
        "tagline": "Your Business. One System. One Intelligent Sarthi.",
        "status": "online",
        "version": settings.APP_VERSION,
        "app_url": "/app/",
        "docs_url": "/docs"
    }


@app.api_route("/health", methods=["GET", "HEAD"])
@app.api_route("/api/health", methods=["GET", "HEAD"])
def health(request: Request):
    if request.method == "HEAD":
        return Response(status_code=200)
    return {
        "status": "healthy",
        "service": "VSS AI Backend Core",
        "database": "connected"
    }


@app.api_route("/favicon.ico", methods=["GET", "HEAD"], include_in_schema=False)
def favicon():
    return Response(status_code=204)


if __name__ == "__main__":
    import uvicorn
    import os
    raw_port = os.environ.get("PORT", "8000")
    try:
        port = int(raw_port)
    except (ValueError, TypeError):
        port = 8000
    host = "0.0.0.0" if os.environ.get("PORT") else "127.0.0.1"
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=False
    )
