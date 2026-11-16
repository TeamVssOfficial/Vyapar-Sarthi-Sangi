import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
PROJECT_DIR = BASE_DIR.parent

# Load configuration from backend/.env if available
backend_env = PROJECT_DIR / "backend" / ".env"
if backend_env.is_file():
    load_dotenv(backend_env)


class Settings(BaseSettings):
    APP_NAME: str = "Vyapar Sarthi Sangi"
    APP_VERSION: str = "1.0.0"

    # Database: MongoDB Atlas is the unified cloud database across Node & Python
    MONGODB_URI: str = os.getenv("MongDB", os.getenv("MONGODB_URI", ""))
    MONGODB_DB_NAME: str = os.getenv("DB_NAME", "test")

    # Storage
    STORAGE_DIR: Path = PROJECT_DIR / "storage"

    # Upload limits
    MAX_UPLOAD_SIZE_MB: int = 100

    # Node.js auth service integration
    NODE_BACKEND_URL: str = "http://localhost:3000"

    # Frontend origins
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173"
    ]

    # AI provider keys & JWT secret shared with Node backend
    OPENAI_API_KEY: str | None = None
    JWT_SECRET: str = os.getenv("JWT_SECRET", "vss_ai_production_jwt_secret_key")

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )


settings = Settings()

# Ensure all storage directories exist
for folder in ["uploads", "processed", "reports", "models"]:
    (settings.STORAGE_DIR / folder).mkdir(parents=True, exist_ok=True)
