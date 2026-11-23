from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from database.connection import get_db
from database.models import User, UserSubscription
from auth.dependencies import get_current_user
from services.subscription_service import get_user_subscription, format_to_ist_str


async def require_active_subscription(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> UserSubscription:
    """
    Centralized Permission Guard.
    Ensures user has either:
    1. Active Free Trial (TRIAL_ACTIVE) with full feature access
    2. Active Paid Subscription (ACTIVE)
    3. Company Administrator role (unrestricted access)

    Gracefully detects expired trials, automatically updates DB to TRIAL_EXPIRED,
    and returns a structured 403 response directing the user to upgrade,
    WITHOUT deleting or modifying any user datasets, workbooks, or records.
    """
    # Company Admins have unrestricted system-wide access
    if getattr(user, "role", "") == "admin":
        return UserSubscription(
            user_id=user.id,
            plan_code="enterprise_admin",
            status="ACTIVE"
        )

    sub = get_user_subscription(db, user.id)

    if not sub:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "NO_SUBSCRIPTION",
                "status": "NONE",
                "message": "Welcome to Vyapar Verse! Please start your Free Trial or choose a subscription plan to continue.",
                "trial_available": True,
                "upgrade_url": "#subscription"
            }
        )

    if sub.status == "TRIAL_EXPIRED":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "SUBSCRIPTION_EXPIRED",
                "status": "TRIAL_EXPIRED",
                "message": "Your VSS AI Free Trial has expired. Your business datasets and workbooks are safely preserved. Upgrade to Vyapar Business to resume full intelligence capabilities.",
                "trial_end_ist": format_to_ist_str(sub.trial_end_date),
                "trial_available": False,
                "upgrade_url": "#subscription"
            }
        )

    if sub.status in ["EXPIRED", "CANCELLED"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "SUBSCRIPTION_EXPIRED",
                "status": sub.status,
                "message": "Your Vyapar Business subscription has expired. Please renew your plan to continue using executive intelligence tools.",
                "period_end_ist": format_to_ist_str(sub.current_period_end),
                "trial_available": False,
                "upgrade_url": "#subscription"
            }
        )

    if sub.status not in ["TRIAL_ACTIVE", "ACTIVE"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "SUBSCRIPTION_INACTIVE",
                "status": sub.status,
                "message": "Your subscription is currently inactive. Please check your billing settings.",
                "upgrade_url": "#subscription"
            }
        )

    return sub


async def require_admin_role(
    user: User = Depends(get_current_user)
) -> User:
    """Restricts company administration endpoints to users with admin role."""
    if getattr(user, "role", "") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted: Company Administrator role required."
        )
    return user
