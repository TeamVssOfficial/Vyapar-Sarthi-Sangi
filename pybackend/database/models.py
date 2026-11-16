from sqlalchemy import (
    Column, String, Integer, Float, Text, DateTime, ForeignKey, Boolean
)
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime
import uuid

Base = declarative_base()


def generate_uuid():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default="user", nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    businesses = relationship("UserBusiness", back_populates="user", cascade="all, delete-orphan")
    datasets = relationship("Dataset", back_populates="user")


class Business(Base):
    __tablename__ = "businesses"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(150), nullable=False)
    industry = Column(String(100), default="General Business")
    owner_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    members = relationship("UserBusiness", back_populates="business", cascade="all, delete-orphan")
    datasets = relationship("Dataset", back_populates="business", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="business", cascade="all, delete-orphan")


class UserBusiness(Base):
    __tablename__ = "user_businesses"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    business_id = Column(String(36), ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(20), default="owner", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="businesses")
    business = relationship("Business", back_populates="members")


class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    business_id = Column(String(36), ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    name = Column(String(255), nullable=False)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size_bytes = Column(Integer, default=0)
    row_count = Column(Integer, default=0)
    col_count = Column(Integer, default=0)
    status = Column(String(50), default="ready")
    column_meta = Column(Text, nullable=True)  # JSON string of column types and classifications
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    business = relationship("Business", back_populates="datasets")
    user = relationship("User", back_populates="datasets")
    analyses = relationship("AnalysisResult", back_populates="dataset", cascade="all, delete-orphan")
    models = relationship("MLModel", back_populates="dataset", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="dataset", cascade="all, delete-orphan")


class AnalysisResult(Base):
    __tablename__ = "analysis_results"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    dataset_id = Column(String(36), ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False)
    analysis_type = Column(String(50), nullable=False)  # eda, quality, bi, correlations
    result_data = Column(Text, nullable=False)  # JSON formatted string
    created_at = Column(DateTime, default=datetime.utcnow)

    dataset = relationship("Dataset", back_populates="analyses")


class MLModel(Base):
    __tablename__ = "ml_models"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    dataset_id = Column(String(36), ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False)
    business_id = Column(String(36), ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(150), nullable=False)
    task_type = Column(String(50), nullable=False)  # regression, classification, forecasting, clustering
    target_column = Column(String(100), nullable=True)
    algorithm = Column(String(100), nullable=False)
    metrics_json = Column(Text, nullable=True)
    model_path = Column(String(500), nullable=True)
    status = Column(String(50), default="trained")
    created_at = Column(DateTime, default=datetime.utcnow)

    dataset = relationship("Dataset", back_populates="models")
    predictions = relationship("Prediction", back_populates="model", cascade="all, delete-orphan")


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    model_id = Column(String(36), ForeignKey("ml_models.id", ondelete="CASCADE"), nullable=False)
    dataset_id = Column(String(36), ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False)
    predictions_json = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    model = relationship("MLModel", back_populates="predictions")


class Report(Base):
    __tablename__ = "reports"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    business_id = Column(String(36), ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False)
    dataset_id = Column(String(36), ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    report_type = Column(String(20), nullable=False)  # pdf, excel
    file_path = Column(String(500), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    business = relationship("Business", back_populates="reports")
    dataset = relationship("Dataset", back_populates="reports")


class AIConversation(Base):
    __tablename__ = "ai_conversations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    business_id = Column(String(36), ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False)
    dataset_id = Column(String(36), ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), default="New Analysis Conversation")
    created_at = Column(DateTime, default=datetime.utcnow)

    messages = relationship("AIMessage", back_populates="conversation", cascade="all, delete-orphan")


class AIMessage(Base):
    __tablename__ = "ai_messages"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    conversation_id = Column(String(36), ForeignKey("ai_conversations.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(20), nullable=False)  # user, assistant, system
    content = Column(Text, nullable=False)
    metadata_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    conversation = relationship("AIConversation", back_populates="messages")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), nullable=True)
    business_id = Column(String(36), nullable=True)
    action = Column(String(100), nullable=False)
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
