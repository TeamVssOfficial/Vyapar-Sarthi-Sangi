from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, Field
import json
import uuid
from sqlalchemy.orm import Session

from database.connection import get_db
from database.models import User, Business, Dataset, AIConversation, AIMessage, AuditLog
from auth.dependencies import get_current_user, get_current_business
from api.datasets import load_dataset_df
from engines.ai_analyst.question_router import route_user_question
from engines.ai_analyst.analytics_tools import execute_analytical_tool
from engines.ai_analyst.response_generator import generate_analyst_response

router = APIRouter(prefix="/api/ai", tags=["AI Analyst"])


class ChatQueryRequest(BaseModel):
    question: str = Field(min_length=2, max_length=2000)
    conversation_id: str | None = None


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

    # 1. Routing
    routing = route_user_question(req.question)

    # 2. Tool execution on actual dataset
    analytical_data = execute_analytical_tool(df, routing)

    # 3. Grounded response synthesis
    response_payload = generate_analyst_response(req.question, routing, analytical_data)

    # 4. Persistence
    conv_id = req.conversation_id
    if not conv_id:
        new_conv = AIConversation(
            id=str(uuid.uuid4()),
            business_id=business.id,
            dataset_id=dataset.id,
            title=req.question[:60]
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
