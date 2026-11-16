from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database.connection import get_db
from database.models import User, Business, UserBusiness
from auth.dependencies import get_current_user

router = APIRouter(prefix="/api/businesses", tags=["Business Workspaces"])


class CreateBusinessRequest(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    industry: str = Field(default="General Business", max_length=100)


@router.get("/")
def list_businesses(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    memberships = db.query(UserBusiness).filter(UserBusiness.user_id == user.id).all()
    def _fmt(dt):
        return dt.isoformat() if hasattr(dt, "isoformat") else (str(dt) if dt else "")

    return [
        {
            "id": m.business.id,
            "name": m.business.name,
            "industry": m.business.industry,
            "role": m.role,
            "created_at": _fmt(getattr(m.business, "created_at", None)),
            "datasets_count": len(m.business.datasets)
        }
        for m in memberships
    ]


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_business(
    req: CreateBusinessRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    business = Business(
        name=req.name.strip(),
        industry=req.industry.strip(),
        owner_id=user.id
    )
    db.add(business)
    db.flush()

    membership = UserBusiness(
        user_id=user.id,
        business_id=business.id,
        role="owner"
    )
    db.add(membership)
    db.commit()
    db.refresh(business)

    return {
        "id": business.id,
        "name": business.name,
        "industry": business.industry,
        "role": "owner",
        "created_at": business.created_at.isoformat() if hasattr(business.created_at, "isoformat") else (str(business.created_at) if business.created_at else "")
    }
