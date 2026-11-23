from pathlib import Path
import os

from config import settings
from .models import Base
from .mongo import MongoSession, get_mongo_db, get_mongo_client, setup_model_relationships

# SessionLocal is mapped to MongoSession
SessionLocal = MongoSession


def get_db():
    session = MongoSession()
    try:
        yield session
    finally:
        session.close()


def init_db():
    """Ensure required indexes on MongoDB Atlas collections and initialize relationships."""
    setup_model_relationships()
    try:
        db = get_mongo_db()
        # Create supporting indexes safely
        try:
            db.users.create_index("email")
        except Exception:
            pass
        try:
            db.datasets.create_index("business_id")
            db.user_businesses.create_index([("user_id", 1), ("business_id", 1)])
            db.ai_messages.create_index("conversation_id")
            db.audit_logs.create_index("timestamp")
            db.user_subscriptions.create_index("user_id")
            db.subscription_plans.create_index("code")
            db.payment_transactions.create_index("order_id")
            db.trial_extension_history.create_index("user_id")
        except Exception:
            pass
        try:
            from services.subscription_service import ensure_default_plans
            ensure_default_plans(MongoSession())
        except Exception as _e:
            pass
        print("✓ Connected to MongoDB Atlas database:", db.name)
    except Exception as e:
        print("MongoDB Atlas init notice:", e)
