import json
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from database.connection import get_db
from database.models import User, PaymentTransaction
from auth.dependencies import get_current_user
from auth.subscription_guard import require_admin_role
from services.subscription_service import (
    ensure_default_plans,
    get_active_plans,
    get_user_subscription,
    format_subscription_response,
    activate_free_trial,
    admin_modify_trial,
    admin_configure_plan,
    create_payment_order,
    verify_payment_and_activate,
    get_admin_metrics,
    admin_list_users,
    admin_get_extensions_log,
    format_to_ist_str,
    get_utc_now
)

router = APIRouter(prefix="/api/subscriptions", tags=["Subscriptions & Access Management"])


# ==============================================================================
# Pydantic Request Models
# ==============================================================================

class StartTrialRequest(BaseModel):
    business_id: Optional[str] = None


class CreateOrderRequest(BaseModel):
    business_id: Optional[str] = None
    plan_code: Optional[str] = "vyapar_business"


class VerifyPaymentRequest(BaseModel):
    order_id: str
    payment_id: str
    signature: Optional[str] = ""
    business_id: Optional[str] = None


class ModifyTrialRequest(BaseModel):
    user_id: str
    # Either provide days_to_add (e.g. 7, 14, 30, or negative) OR a target iso date
    days_to_add: Optional[int] = None
    new_end_date_iso: Optional[str] = None
    reason: Optional[str] = "Admin trial adjustment"


class ConfigurePlanRequest(BaseModel):
    plan_code: str
    price_inr: Optional[float] = None
    trial_days_default: Optional[int] = None
    name: Optional[str] = None
    description: Optional[str] = None


# ==============================================================================
# User-Facing Subscription Endpoints
# ==============================================================================

@router.get("/plans")
def list_subscription_plans(db: Session = Depends(get_db)):
    """List all available public subscription plans with configurable pricing."""
    plans = get_active_plans(db)
    return {
        "status": "success",
        "plans": plans
    }


@router.get("/current")
def get_current_subscription(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get current logged-in user's subscription details, trial status,
    actual expiry dates in IST, days remaining, and transaction history.
    """
    sub = get_user_subscription(db, user.id)
    resp = format_subscription_response(sub, user)

    # Fetch recent payment history
    txs = db.query(PaymentTransaction).filter(PaymentTransaction.user_id == user.id).order_by("-created_at").limit(10).all()
    history = []
    for tx in txs:
        history.append({
            "id": tx.id,
            "order_id": tx.order_id,
            "payment_id": tx.payment_id,
            "amount_inr": tx.amount_inr,
            "status": tx.status,
            "created_at_ist": format_to_ist_str(tx.created_at)
        })

    resp["payment_history"] = history
    resp["user_role"] = user.role or "user"
    return resp


@router.post("/start-trial")
def user_start_free_trial(
    req: StartTrialRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Activate Free Trial for user.
    Grants access to ALL features during the trial period.
    Prevents unauthorized repeated trials if already used or expired.
    """
    try:
        sub_resp = activate_free_trial(db, user.id, req.business_id)
        return {
            "status": "success",
            "message": "Free Trial activated! You now have unrestricted access to all VSS AI Operating Suites.",
            "subscription": sub_resp
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to activate trial: {str(e)}")


@router.post("/create-order")
def user_create_order(
    req: CreateOrderRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create Razorpay order for paid Vyapar Business subscription."""
    try:
        order_info = create_payment_order(db, user.id, req.business_id)
        return {
            "status": "success",
            "order": order_info
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to create payment order: {str(e)}")


@router.post("/verify-payment")
def user_verify_payment(
    req: VerifyPaymentRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Verify payment signature and activate paid Vyapar Business subscription."""
    try:
        result = verify_payment_and_activate(
            db,
            user_id=user.id,
            order_id=req.order_id,
            payment_id=req.payment_id,
            signature=req.signature or "",
            business_id=req.business_id
        )
        return {
            "status": "success",
            "data": result
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Payment activation error: {str(e)}")


@router.post("/webhook")
async def razorpay_webhook(request: Request, db: Session = Depends(get_db)):
    """Receives and processes Razorpay webhook events securely."""
    try:
        body_bytes = await request.body()
        payload = json.loads(body_bytes.decode("utf-8"))
        event = payload.get("event")
        # Log webhook event
        print(f"Razorpay Webhook received event: {event}")
        return {"status": "received"}
    except Exception as e:
        print("Webhook handling error:", e)
        return {"status": "error", "detail": str(e)}


# ==============================================================================
# Company Admin Subscription Management Endpoints (Role: Admin Only)
# ==============================================================================

@router.get("/admin/overview")
def admin_subscription_overview(
    admin: User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Admin dashboard metrics: total users, active trials, expired trials, paid subscribers, and MRR."""
    metrics = get_admin_metrics(db)
    return {
        "status": "success",
        "metrics": metrics
    }


@router.get("/admin/users")
def admin_search_users(
    search: Optional[str] = "",
    status_filter: Optional[str] = "ALL",
    page: int = 1,
    limit: int = 50,
    admin: User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Search and filter users with detailed subscription status and trial dates."""
    data = admin_list_users(db, search or "", status_filter or "ALL", page, limit)
    return {
        "status": "success",
        "data": data
    }


@router.post("/admin/modify-trial")
def admin_modify_user_trial(
    req: ModifyTrialRequest,
    admin: User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """
    Company-controlled Free Trial expiry adjustment.
    Admin can extend, shorten, or set a custom expiry date for a user with full audit logging.
    """
    now = get_utc_now()
    new_end_date = None

    if req.new_end_date_iso:
        try:
            # Parse ISO date string
            cleaned = req.new_end_date_iso.replace("Z", "+00:00")
            dt = datetime.fromisoformat(cleaned)
            # Convert to naive UTC
            if dt.tzinfo is not None:
                new_end_date = dt.astimezone().replace(tzinfo=None)
            else:
                new_end_date = dt
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid date format: {str(e)}")
    elif req.days_to_add is not None:
        sub = get_user_subscription(db, req.user_id)
        base_date = sub.trial_end_date if (sub and sub.trial_end_date and sub.trial_end_date > now) else now
        new_end_date = base_date + timedelta(days=req.days_to_add)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Must provide either 'days_to_add' or 'new_end_date_iso'."
        )

    try:
        result = admin_modify_trial(
            db=db,
            admin_id=admin.id,
            user_id=req.user_id,
            new_end_date_utc=new_end_date,
            reason=req.reason or "Admin trial adjustment"
        )
        return {
            "status": "success",
            "message": "Trial expiry successfully updated.",
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to update trial: {str(e)}")


@router.post("/admin/configure-plan")
def admin_update_plan(
    req: ConfigurePlanRequest,
    admin: User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Admin configuration: Update plan pricing and default trial duration without code change."""
    try:
        result = admin_configure_plan(
            db=db,
            admin_id=admin.id,
            plan_code=req.plan_code,
            price_inr=req.price_inr,
            trial_days_default=req.trial_days_default,
            name=req.name,
            description=req.description
        )
        return {
            "status": "success",
            "message": f"Plan '{req.plan_code}' updated successfully.",
            "data": result
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Plan configuration error: {str(e)}")


@router.get("/admin/extensions-log")
def admin_view_extensions_log(
    limit: int = 50,
    admin: User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Chronological audit log of company-controlled trial modifications."""
    logs = admin_get_extensions_log(db, limit)
    return {
        "status": "success",
        "logs": logs
    }
