from fastapi import APIRouter, HTTPException, Depends, status, Request
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import json
import uuid
import time
import logging
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

from database.connection import get_db
from database.models import User, Business, Dataset, AIConversation, AIMessage, AuditLog
from auth.dependencies import get_current_user, get_current_business
from auth.subscription_guard import require_active_subscription
from api.datasets import load_dataset_df
from engines.ai_analyst.question_router import route_user_question
from engines.ai_analyst.analytics_tools import execute_analytical_tool
from engines.ai_analyst.response_generator import generate_analyst_response
from ai_engine.orchestrator import CentralAIOrchestrator
from ai_engine.model_router import ModelRouter
from ai_engine.provider_registry import ProviderRegistry
from ai_engine.cost_tracker import CostTracker

router = APIRouter(prefix="/api/ai", tags=["AI Analyst & Central Brain"])


class ChatQueryRequest(BaseModel):
    question: Optional[str] = None
    message: Optional[str] = None
    query: Optional[str] = None
    prompt: Optional[str] = None
    conversation_id: Optional[str] = None
    dataset_id: Optional[str] = None
    preferred_model: Optional[str] = None
    model: Optional[str] = None
    history: Optional[List[Dict[str, Any]]] = None

    def get_query_text(self) -> str:
        q = self.question or self.message or self.query or self.prompt or ""
        return q.strip()

    def get_model(self) -> Optional[str]:
        return self.preferred_model or self.model


class BenchmarkRequest(BaseModel):
    test_prompt: Optional[str] = "Calculate total revenue and suggest the best product line to restock."


@router.get("/models")
def get_ai_models_status():
    """
    Returns OpenRouter gateway configuration, active models, and usage cost statistics.
    """
    provider_status = ProviderRegistry.get_status()
    models = ModelRouter.get_configured_models()
    cost_summary = CostTracker.get_summary()

    return {
        "gateway": provider_status,
        "models": {
            "primary": {
                "id": models["primary"],
                "role": "Strategic Business Orchestrator",
                "specialization": "Multi-step reasoning, agent orchestration & tool calling",
                "provider": "NVIDIA / OpenRouter",
                "tier": "Free Tier (:free)",
                "context_window": "1,000,000 tokens"
            },
            "reasoning": {
                "id": models["reasoning"],
                "role": "Logic & Code Engine",
                "specialization": "Python data science, mathematical proof & feature engineering",
                "provider": "Google / OpenRouter",
                "tier": "Free Tier (:free)",
                "context_window": "262,144 tokens"
            },
            "fast": {
                "id": models["fast"],
                "role": "Instant Routine Q&A",
                "specialization": "High-throughput summarization & fast UI queries",
                "provider": "Google / OpenRouter",
                "tier": "Free Tier (:free)",
                "context_window": "131,072 tokens"
            },
            "multimodal": {
                "id": models["multimodal"],
                "role": "Multimodal Vision & Document Engine",
                "specialization": "Receipt OCR, invoice extraction & chart inspection",
                "provider": "NVIDIA / OpenRouter",
                "tier": "Free Tier (:free)",
                "context_window": "128,000 tokens"
            },
            "auto_fallback": {
                "id": models["auto_fallback"],
                "role": "High-Availability Dynamic Router",
                "specialization": "Automated rate-limit cascade buffer",
                "provider": "OpenRouter Free Pool",
                "tier": "Free Tier (:free)",
                "context_window": "Dynamic"
            }
        },
        "cost_summary": cost_summary
    }


@router.post("/chat")
async def central_ai_chat(
    req: ChatQueryRequest,
    user: User = Depends(get_current_user),
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
    _sub: Any = Depends(require_active_subscription)
):
    """
    Central AI Business Assistant query endpoint.
    Routes to OpenRouter models (Nemotron 3 Ultra, Gemma 4) with automatic tool pre-computation,
    response validation, context resolution, and offline deterministic fallback.
    Persists messages with interactive chart specifications and evidence.
    """
    df = None
    dataset_name = "Enterprise Business Records"
    first_ds = None

    if req.dataset_id:
        dataset = db.query(Dataset).filter(
            Dataset.id == req.dataset_id,
            Dataset.business_id == business.id
        ).first()
        if dataset:
            try:
                df = load_dataset_df(dataset.file_path)
                dataset_name = dataset.name
            except Exception as e:
                df = None
    else:
        first_ds = db.query(Dataset).filter(Dataset.business_id == business.id).order_by(Dataset.created_at.desc()).first()
        if first_ds:
            try:
                df = load_dataset_df(first_ds.file_path)
                dataset_name = first_ds.name
            except Exception as e:
                df = None

    query_text = req.get_query_text()
    if not query_text:
        query_text = "What is the overall performance and health of my business?"

    # Resolve or create conversation
    conv_id = req.conversation_id
    history_turns = req.history or []

    if conv_id and not history_turns:
        prior_msgs = db.query(AIMessage).filter(AIMessage.conversation_id == conv_id).order_by(AIMessage.created_at.asc()).all()
        for pm in prior_msgs:
            history_turns.append({"role": pm.role, "content": pm.content})

    result = await CentralAIOrchestrator.process_user_query(
        user_query=query_text,
        df=df,
        dataset_name=dataset_name,
        history=history_turns,
        preferred_model=req.get_model()
    )

    # Persist in DB
    try:
        db_conv = None
        if conv_id:
            db_conv = db.query(AIConversation).filter(
                AIConversation.id == conv_id,
                AIConversation.business_id == business.id
            ).first()

        if not db_conv:
            conv_id = str(uuid.uuid4())
            db_conv = AIConversation(
                id=conv_id,
                business_id=business.id,
                dataset_id=req.dataset_id or (first_ds.id if first_ds else None),
                title=query_text[:50]
            )
            db.add(db_conv)
            db.flush()

        # Add user turn
        db.add(AIMessage(
            id=str(uuid.uuid4()),
            conversation_id=conv_id,
            role="user",
            content=query_text
        ))

        # Add assistant turn
        db.add(AIMessage(
            id=str(uuid.uuid4()),
            conversation_id=conv_id,
            role="assistant",
            content=result["content"],
            metadata_json=json.dumps({
                "model_used": result["model"],
                "intent": result["intent"],
                "grounded": result["grounded"],
                "evidence": result.get("evidence", []),
                "chart_spec": result.get("chart_spec"),
                "resolved_query": result.get("resolved_query")
            })
        ))
        db.commit()
    except Exception as dbe:
        logger.warning(f"Chat persistence notice: {dbe}")

    return {
        "conversation_id": conv_id,
        "question": query_text,
        "answer": result["content"],
        "response": result["content"],
        "content": result["content"],
        "model_used": result["model"],
        "model": result["model"],
        "intent": result["intent"],
        "routing_reason": result["routing_reason"],
        "grounded": result["grounded"],
        "evidence": result.get("evidence", []),
        "tools_executed": result.get("evidence", []),
        "is_fallback": result.get("is_fallback", False),
        "chart_spec": result.get("chart_spec"),
        "resolved_query": result.get("resolved_query")
    }


@router.get("/conversations")
def list_business_conversations(
    dataset_id: Optional[str] = None,
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db)
):
    """List chat conversations belonging to the authenticated business workspace."""
    query = db.query(AIConversation).filter(AIConversation.business_id == business.id)
    if dataset_id:
        query = query.filter(AIConversation.dataset_id == dataset_id)
    convs = query.order_by(AIConversation.created_at.desc()).all()
    return [
        {
            "id": c.id,
            "title": c.title,
            "dataset_id": c.dataset_id,
            "created_at": c.created_at.isoformat() if c.created_at else None,
            "message_count": len(c.messages)
        }
        for c in convs
    ]


@router.post("/conversations")
def create_new_conversation(
    req: Dict[str, Any],
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db)
):
    """Create a new conversational workspace."""
    c_id = str(uuid.uuid4())
    new_c = AIConversation(
        id=c_id,
        business_id=business.id,
        dataset_id=req.get("dataset_id"),
        title=req.get("title", "New Analysis Chat")
    )
    db.add(new_c)
    db.commit()
    return {"id": c_id, "title": new_c.title, "dataset_id": new_c.dataset_id}


@router.delete("/conversations/{conversation_id}")
def delete_conversation(
    conversation_id: str,
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db)
):
    """Delete a conversation and its messages."""
    conv = db.query(AIConversation).filter(
        AIConversation.id == conversation_id,
        AIConversation.business_id == business.id
    ).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    db.query(AIMessage).filter(AIMessage.conversation_id == conv.id).delete()
    db.delete(conv)
    db.commit()
    return {"status": "success", "message": "Conversation deleted"}


@router.patch("/conversations/{conversation_id}")
def rename_conversation(
    conversation_id: str,
    req: Dict[str, Any],
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db)
):
    """Rename conversation title."""
    conv = db.query(AIConversation).filter(
        AIConversation.id == conversation_id,
        AIConversation.business_id == business.id
    ).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if "title" in req:
        conv.title = req["title"]
        db.commit()
    return {"id": conv.id, "title": conv.title}


@router.post("/benchmark")
async def run_model_benchmark(
    req: BenchmarkRequest,
    user: User = Depends(get_current_user)
):
    """
    Executes live latency and accuracy tests across the configured models.
    """
    provider = ProviderRegistry.get_openrouter()
    models = ModelRouter.get_configured_models()
    test_models = [
        ("primary", models["primary"]),
        ("reasoning", models["reasoning"]),
        ("fast", models["fast"])
    ]

    benchmark_results = []
    messages = [
        {"role": "system", "content": "You are a business analytics benchmarking engine. Respond with 1 concise sentence."},
        {"role": "user", "content": req.test_prompt or "Test latency and availability."}
    ]

    for label, model_id in test_models:
        t0 = time.time()
        if provider.is_configured():
            res = await provider.chat_completion(
                model=model_id,
                messages=messages,
                max_tokens=64
            )
            lat = res.get("latency_seconds", round(time.time() - t0, 3))
            benchmark_results.append({
                "role": label,
                "model": model_id,
                "status": "ONLINE" if res.get("success") else "RATE_LIMITED_OR_UNAVAILABLE",
                "latency_seconds": lat,
                "error": res.get("error") if not res.get("success") else None
            })
        else:
            benchmark_results.append({
                "role": label,
                "model": model_id,
                "status": "OFFLINE_SIMULATION",
                "latency_seconds": 0.02,
                "error": "OpenRouter API key not configured. Using local analytical engine."
            })

    return {
        "benchmark_timestamp": time.time(),
        "prompt": req.test_prompt,
        "results": benchmark_results,
        "provider_status": ProviderRegistry.get_status()
    }


# Backwards compatibility endpoints for existing UI
@router.post("/{dataset_id}/ask")
def ask_ai_analyst(
    dataset_id: str,
    req: ChatQueryRequest,
    user: User = Depends(get_current_user),
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db)
):
    dataset = db.query(Dataset).filter(
        Dataset.id == dataset_id,
        Dataset.business_id == business.id
    ).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found in this business workspace")

    df = load_dataset_df(dataset.file_path)

    q_text = req.get_query_text() or "Provide a business summary of this dataset."

    # 1. Routing
    routing = route_user_question(q_text)

    # 2. Tool execution on actual dataset
    analytical_data = execute_analytical_tool(df, routing)

    # 3. Grounded response synthesis
    response_payload = generate_analyst_response(q_text, routing, analytical_data)

    # 4. Persistence
    conv_id = req.conversation_id
    if not conv_id:
        new_conv = AIConversation(
            id=str(uuid.uuid4()),
            business_id=business.id,
            dataset_id=dataset.id,
            title=q_text[:60]
        )
        db.add(new_conv)
        db.flush()
        conv_id = new_conv.id
    else:
        existing_conv = db.query(AIConversation).filter(
            AIConversation.id == conv_id,
            AIConversation.business_id == business.id
        ).first()
        if not existing_conv:
            conv_id = str(uuid.uuid4())
            new_conv = AIConversation(
                id=conv_id,
                business_id=business.id,
                dataset_id=dataset.id,
                title=req.question[:60]
            )
            db.add(new_conv)
            db.flush()

    # User message
    user_msg = AIMessage(
        id=str(uuid.uuid4()),
        conversation_id=conv_id,
        role="user",
        content=req.question
    )
    db.add(user_msg)

    # Assistant message
    assistant_msg = AIMessage(
        id=str(uuid.uuid4()),
        conversation_id=conv_id,
        role="assistant",
        content=response_payload["answer"],
        metadata_json=json.dumps({
            "title": response_payload["title"],
            "suggested_actions": response_payload["suggested_actions"],
            "evidence": response_payload["evidence_data"]
        })
    )
    db.add(assistant_msg)
    db.commit()

    return {
        "conversation_id": conv_id,
        "question": req.question,
        "title": response_payload["title"],
        "answer": response_payload["answer"],
        "suggested_actions": response_payload["suggested_actions"],
        "evidence": response_payload["evidence_data"]
    }


@router.get("/{dataset_id}/conversations")
def get_conversations(
    dataset_id: str,
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db)
):
    convs = db.query(AIConversation).filter(
        AIConversation.dataset_id == dataset_id,
        AIConversation.business_id == business.id
    ).order_by(AIConversation.created_at.desc()).all()

    return [
        {
            "id": c.id,
            "title": c.title,
            "created_at": c.created_at.isoformat(),
            "message_count": len(c.messages)
        }
        for c in convs
    ]


@router.get("/conversations/{conversation_id}/messages")
def get_conversation_messages(
    conversation_id: str,
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db)
):
    conv = db.query(AIConversation).filter(
        AIConversation.id == conversation_id,
        AIConversation.business_id == business.id
    ).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    messages = db.query(AIMessage).filter(
        AIMessage.conversation_id == conv.id
    ).order_by(AIMessage.created_at.asc()).all()

    return [
        {
            "id": m.id,
            "role": m.role,
            "content": m.content,
            "metadata": json.loads(m.metadata_json) if m.metadata_json else None,
            "created_at": m.created_at.isoformat()
        }
        for m in messages
    ]
