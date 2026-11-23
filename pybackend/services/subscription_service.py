import os
import json
import uuid
import hmac
import hashlib
import urllib.request
import urllib.error
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, List

from database.models import (
    User, Business, SubscriptionPlan, UserSubscription,
    PaymentTransaction, TrialExtensionHistory, AdminSubscriptionAction
)
from config import settings

# Indian Standard Time (IST) is UTC + 5:30
IST_OFFSET = timezone(timedelta(hours=5, minutes=30))


def get_utc_now() -> datetime:
    """Return timezone-naive UTC now for database storage."""
    return datetime.utcnow()


def get_ist_now() -> datetime:
    """Return current time in IST."""
    return datetime.now(IST_OFFSET)


def format_to_ist_str(dt: Optional[datetime]) -> str:
    """Format any UTC datetime into an unambiguous user-facing IST string."""
    if not dt:
        return "N/A"
    # Treat naive datetime as UTC
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    ist_dt = dt.astimezone(IST_OFFSET)
    return ist_dt.strftime("%d %b %Y, %I:%M %p IST")


def to_ist_iso(dt: Optional[datetime]) -> Optional[str]:
    """Format datetime as ISO string with IST offset."""
    if not dt:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(IST_OFFSET).isoformat()


# Razorpay Configuration from environment
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "")
RAZORPAY_WEBHOOK_SECRET = os.getenv("RAZORPAY_WEBHOOK_SECRET", "")


def ensure_default_plans(db):
    """Seed default subscription plans if they don't already exist."""
    try:
        # 1. Free Trial Plan
        trial_plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.code == "free_trial").first()
        if not trial_plan:
            trial_plan = SubscriptionPlan(
                id=str(uuid.uuid4()),
                code="free_trial",
                name="Free Trial",
                description="Full Access to All VSS AI Operating Suites & Neural Sarthi for Evaluators",
                price_inr=0.0,
                billing_cycle="trial",
                is_trial=True,
                trial_days_default=7,
                is_active=True,
                features_json=json.dumps(["*"])
            )
            db.add(trial_plan)

        # 2. Vyapar Business Paid Plan
        biz_plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.code == "vyapar_business").first()
        if not biz_plan:
            biz_plan = SubscriptionPlan(
                id=str(uuid.uuid4()),
                code="vyapar_business",
                name="Vyapar Business",
                description="Complete AI-Powered Operating System for Indian Retailers, Wholesalers & Distributors",
                price_inr=799.0,
                billing_cycle="monthly",
                is_trial=False,
                trial_days_default=0,
                is_active=True,
                features_json=json.dumps(["*"])
            )
            db.add(biz_plan)

        db.commit()
    except Exception as e:
        print("Notice: Subscription plan seeding encountered:", e)


def get_active_plans(db) -> List[Dict[str, Any]]:
    """Return all active subscription plans with full details."""
    ensure_default_plans(db)
    plans = db.query(SubscriptionPlan).filter(SubscriptionPlan.is_active == True).all()
    results = []
    for p in plans:
        features = ["*"]
        try:
            if p.features_json:
                features = json.loads(p.features_json)
        except Exception:
            pass
        results.append({
            "id": p.id,
            "code": p.code,
            "name": p.name,
            "description": p.description,
            "price_inr": float(p.price_inr),
            "billing_cycle": p.billing_cycle,
            "is_trial": bool(p.is_trial),
            "trial_days_default": int(p.trial_days_default or 7),
            "features": features
        })
    return results


def get_user_subscription(db, user_id: str) -> Optional[UserSubscription]:
    """
    Fetch user's current subscription and perform automatic expiry check.
    Gracefully transitions TRIAL_ACTIVE -> TRIAL_EXPIRED or ACTIVE -> EXPIRED if end date has passed.
    """
    sub = db.query(UserSubscription).filter(UserSubscription.user_id == str(user_id)).order_by("-created_at").first()
    if not sub:
        return None

    now = get_utc_now()

    # Check Trial Expiry
    if sub.status == "TRIAL_ACTIVE" and sub.trial_end_date:
        if now >= sub.trial_end_date:
            sub.status = "TRIAL_EXPIRED"
            db.add(sub)
            db.commit()
            db.refresh(sub)

    # Check Paid Period Expiry
    elif sub.status == "ACTIVE" and sub.current_period_end:
        if now >= sub.current_period_end:
            sub.status = "EXPIRED"
            db.add(sub)
            db.commit()
            db.refresh(sub)

    return sub


def format_subscription_response(sub: Optional[UserSubscription], user: Optional[User] = None) -> Dict[str, Any]:
    """Format subscription record into standard user-facing JSON payload."""
    if not sub:
        return {
            "has_subscription": False,
            "status": "NONE",
            "plan_code": "none",
            "plan_name": "No Active Subscription",
            "is_active": False,
            "is_trial": False,
            "can_start_trial": True,
            "days_remaining": 0,
            "hours_remaining": 0,
            "trial_start_ist": None,
            "trial_end_ist": None,
            "trial_end_iso": None,
            "period_end_ist": None,
            "message": "Select Free Trial or Subscribe to Vyapar Business to activate your workspace."
        }

    now = get_utc_now()
    days_rem = 0
    hours_rem = 0
    target_end = sub.trial_end_date if sub.plan_code == "free_trial" else sub.current_period_end

    if target_end and target_end > now:
        diff = target_end - now
        days_rem = diff.days
        hours_rem = int(diff.total_seconds() // 3600)
    elif target_end and target_end <= now:
        days_rem = 0
        hours_rem = 0

    is_active = sub.status in ["TRIAL_ACTIVE", "ACTIVE"]
    is_trial = sub.plan_code == "free_trial"

    plan_display = "Free Trial (Full Access)" if is_trial else "Vyapar Business"

    return {
        "id": sub.id,
        "has_subscription": True,
        "status": sub.status,
        "plan_code": sub.plan_code,
        "plan_name": plan_display,
        "is_active": is_active,
        "is_trial": is_trial,
        "can_start_trial": False,  # User already activated trial
        "days_remaining": days_rem,
        "hours_remaining": hours_rem,
        "trial_start_ist": format_to_ist_str(sub.trial_start_date),
        "trial_end_ist": format_to_ist_str(sub.trial_end_date),
        "trial_end_iso": to_ist_iso(sub.trial_end_date),
        "period_start_ist": format_to_ist_str(sub.current_period_start),
        "period_end_ist": format_to_ist_str(sub.current_period_end),
        "period_end_iso": to_ist_iso(sub.current_period_end),
        "auto_renew": bool(sub.auto_renew),
        "payment_method": sub.payment_method or "none",
        "last_payment_id": sub.last_payment_id
    }


def activate_free_trial(db, user_id: str, business_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Activate Free Trial for a user.
    Enforces business rule: Full-feature access, no payment required, configurable trial days.
    Prevents repeated unauthorized trials for the same user account.
    """
    ensure_default_plans(db)

    # Check existing subscriptions
    existing = db.query(UserSubscription).filter(UserSubscription.user_id == str(user_id)).first()
    if existing:
        if existing.status == "TRIAL_ACTIVE":
            return format_subscription_response(existing)
        elif existing.status in ["TRIAL_EXPIRED", "EXPIRED", "ACTIVE"]:
            raise ValueError(
                "You have already used your Free Trial. Upgrade to Vyapar Business for continuous unlimited access."
            )

    trial_plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.code == "free_trial").first()
    trial_days = int(trial_plan.trial_days_default) if trial_plan and trial_plan.trial_days_default else 7

    now = get_utc_now()
    trial_end = now + timedelta(days=trial_days)

    sub = UserSubscription(
        id=str(uuid.uuid4()),
        user_id=str(user_id),
        business_id=str(business_id) if business_id else None,
        plan_id=trial_plan.id if trial_plan else None,
        plan_code="free_trial",
        status="TRIAL_ACTIVE",
        trial_start_date=now,
        trial_end_date=trial_end,
        payment_method="none",
        auto_renew=False
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)

    return format_subscription_response(sub)


def admin_modify_trial(
    db,
    admin_id: str,
    user_id: str,
    new_end_date_utc: datetime,
    reason: str = "Admin trial adjustment"
) -> Dict[str, Any]:
    """
    Company-controlled Free Trial expiry adjustment.
    Admin can extend, shorten, or set a custom expiry date for a user.
    Creates an audit log entry in TrialExtensionHistory and AdminSubscriptionAction.
    """
    now = get_utc_now()
    sub = db.query(UserSubscription).filter(UserSubscription.user_id == str(user_id)).order_by("-created_at").first()

    previous_end_date = None
    if not sub:
        # Create subscription record if user had none
        trial_plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.code == "free_trial").first()
        sub = UserSubscription(
            id=str(uuid.uuid4()),
            user_id=str(user_id),
            plan_id=trial_plan.id if trial_plan else None,
            plan_code="free_trial",
            status="TRIAL_ACTIVE" if new_end_date_utc > now else "TRIAL_EXPIRED",
            trial_start_date=now,
            trial_end_date=new_end_date_utc,
            payment_method="none"
        )
        db.add(sub)
    else:
        previous_end_date = sub.trial_end_date
        sub.trial_end_date = new_end_date_utc
        # Immediate state transition
        if new_end_date_utc > now:
            sub.status = "TRIAL_ACTIVE"
        else:
            sub.status = "TRIAL_EXPIRED"
        sub.updated_at = now
        db.add(sub)

    extension_days = 0
    if previous_end_date:
        extension_days = (new_end_date_utc.date() - previous_end_date.date()).days
    else:
        extension_days = (new_end_date_utc.date() - now.date()).days

    # Audit Log 1: TrialExtensionHistory
    history = TrialExtensionHistory(
        id=str(uuid.uuid4()),
        subscription_id=sub.id,
        user_id=str(user_id),
        admin_id=str(admin_id),
        previous_end_date=previous_end_date,
        new_end_date=new_end_date_utc,
        extension_days=extension_days,
        reason=reason,
        created_at=now
    )
    db.add(history)

    # Audit Log 2: AdminSubscriptionAction
    action = AdminSubscriptionAction(
        id=str(uuid.uuid4()),
        admin_id=str(admin_id),
        action_type="modify_trial",
        target_user_id=str(user_id),
        details_json=json.dumps({
            "previous_end_utc": previous_end_date.isoformat() if previous_end_date else None,
            "new_end_utc": new_end_date_utc.isoformat(),
            "previous_end_ist": format_to_ist_str(previous_end_date),
            "new_end_ist": format_to_ist_str(new_end_date_utc),
            "extension_days": extension_days,
            "reason": reason
        }),
        created_at=now
    )
    db.add(action)

    db.commit()
    db.refresh(sub)

    return {
        "success": True,
        "user_id": user_id,
        "subscription": format_subscription_response(sub),
        "previous_end_ist": format_to_ist_str(previous_end_date),
        "new_end_ist": format_to_ist_str(new_end_date_utc),
        "extension_days": extension_days,
        "reason": reason
    }


def admin_configure_plan(
    db,
    admin_id: str,
    plan_code: str,
    price_inr: Optional[float] = None,
    trial_days_default: Optional[int] = None,
    name: Optional[str] = None,
    description: Optional[str] = None
) -> Dict[str, Any]:
    """Admin endpoint to update subscription plan pricing or trial duration without code change."""
    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.code == plan_code).first()
    if not plan:
        raise ValueError(f"Subscription plan with code '{plan_code}' not found.")

    changes = {}
    if price_inr is not None:
        changes["old_price"] = plan.price_inr
        plan.price_inr = float(price_inr)
        changes["new_price"] = plan.price_inr

    if trial_days_default is not None:
        changes["old_trial_days"] = plan.trial_days_default
        plan.trial_days_default = int(trial_days_default)
        changes["new_trial_days"] = plan.trial_days_default

    if name:
        plan.name = name
    if description:
        plan.description = description

    plan.updated_at = get_utc_now()
    db.add(plan)

    action = AdminSubscriptionAction(
        id=str(uuid.uuid4()),
        admin_id=str(admin_id),
        action_type="configure_plan",
        target_user_id=None,
        details_json=json.dumps({"plan_code": plan_code, "changes": changes}),
        created_at=get_utc_now()
    )
    db.add(action)
    db.commit()
    db.refresh(plan)

    return {
        "success": True,
        "plan_code": plan.code,
        "price_inr": float(plan.price_inr),
        "trial_days_default": int(plan.trial_days_default),
        "changes": changes
    }


def create_payment_order(db, user_id: str, business_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Create Razorpay Order for Vyapar Business paid subscription.
    Uses configurable price from SubscriptionPlan (never hardcoded).
    Falls back gracefully to sandbox order if Razorpay credentials are not configured.
    """
    ensure_default_plans(db)
    biz_plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.code == "vyapar_business").first()
    price_inr = float(biz_plan.price_inr) if biz_plan else 799.0
    amount_paise = int(price_inr * 100)

    razorpay_configured = bool(RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET)
    order_id = f"order_vss_{uuid.uuid4().hex[:12]}"

    if razorpay_configured:
        try:
            url = "https://api.razorpay.com/v1/orders"
            data = json.dumps({
                "amount": amount_paise,
                "currency": "INR",
                "receipt": f"rcpt_{user_id[:8]}_{int(datetime.utcnow().timestamp())}",
                "notes": {
                    "user_id": user_id,
                    "plan_code": "vyapar_business"
                }
            }).encode("utf-8")

            req = urllib.request.Request(
                url,
                data=data,
                headers={"Content-Type": "application/json"}
            )
            # Basic Auth
            import base64
            auth_str = f"{RAZORPAY_KEY_ID}:{RAZORPAY_KEY_SECRET}"
            b64_auth = base64.b64encode(auth_str.encode("utf-8")).decode("ascii")
            req.add_header("Authorization", f"Basic {b64_auth}")

            with urllib.request.urlopen(req, timeout=10) as response:
                resp_json = json.loads(response.read().decode("utf-8"))
                order_id = resp_json.get("id", order_id)
        except Exception as e:
            print("Notice: Live Razorpay order creation failed, using sandbox fallback:", e)
            razorpay_configured = False

    # Store transaction in PENDING state
    tx = PaymentTransaction(
        id=str(uuid.uuid4()),
        user_id=str(user_id),
        business_id=str(business_id) if business_id else None,
        order_id=order_id,
        amount_inr=price_inr,
        currency="INR",
        status="PENDING",
        provider="razorpay" if razorpay_configured else "sandbox",
        created_at=get_utc_now()
    )
    db.add(tx)
    db.commit()

    return {
        "order_id": order_id,
        "amount_paise": amount_paise,
        "price_inr": price_inr,
        "currency": "INR",
        "key_id": RAZORPAY_KEY_ID if razorpay_configured else "rzp_test_vss_sandbox",
        "razorpay_configured": razorpay_configured,
        "plan_name": "Vyapar Business",
        "billing_cycle": "Monthly"
    }


def verify_payment_and_activate(
    db,
    user_id: str,
    order_id: str,
    payment_id: str,
    signature: str,
    business_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Verify payment signature and activate paid subscription.
    """
    razorpay_configured = bool(RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET)

    # In production with live keys, verify cryptographic signature
    if razorpay_configured:
        payload = f"{order_id}|{payment_id}"
        expected_sig = hmac.new(
            RAZORPAY_KEY_SECRET.encode("utf-8"),
            payload.encode("utf-8"),
            hashlib.sha256
        ).hexdigest()

        if not hmac.compare_digest(expected_sig, signature):
            # Record failed transaction
            tx = db.query(PaymentTransaction).filter(PaymentTransaction.order_id == order_id).first()
            if tx:
                tx.status = "FAILED"
                tx.error_reason = "Signature mismatch verification failure"
                db.add(tx)
                db.commit()
            raise ValueError("Payment verification failed: Invalid cryptographic signature.")

    # Mark transaction as SUCCESS
    tx = db.query(PaymentTransaction).filter(PaymentTransaction.order_id == order_id).first()
    if tx:
        tx.payment_id = payment_id
        tx.signature = signature
        tx.status = "SUCCESS"
        db.add(tx)

    # Activate Paid Vyapar Business Subscription
    ensure_default_plans(db)
    biz_plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.code == "vyapar_business").first()

    now = get_utc_now()
    period_end = now + timedelta(days=30)

    sub = db.query(UserSubscription).filter(UserSubscription.user_id == str(user_id)).first()
    if not sub:
        sub = UserSubscription(
            id=str(uuid.uuid4()),
            user_id=str(user_id),
            business_id=str(business_id) if business_id else None,
            plan_id=biz_plan.id if biz_plan else None,
            plan_code="vyapar_business",
            status="ACTIVE",
            current_period_start=now,
            current_period_end=period_end,
            payment_method="razorpay" if razorpay_configured else "sandbox",
            last_payment_id=payment_id,
            auto_renew=True
        )
    else:
        sub.plan_id = biz_plan.id if biz_plan else None
        sub.plan_code = "vyapar_business"
        sub.status = "ACTIVE"
        sub.current_period_start = now
        sub.current_period_end = period_end
        sub.payment_method = "razorpay" if razorpay_configured else "sandbox"
        sub.last_payment_id = payment_id
        sub.auto_renew = True
        sub.updated_at = now

    db.add(sub)
    db.commit()
    db.refresh(sub)

    return {
        "success": True,
        "message": "Payment verified successfully. Welcome to Vyapar Business!",
        "subscription": format_subscription_response(sub)
    }


def get_admin_metrics(db) -> Dict[str, Any]:
    """Calculate key subscription analytics for the Company Admin Dashboard."""
    ensure_default_plans(db)
    users = db.query(User).all()
    total_users = len(users)

    subscriptions = db.query(UserSubscription).all()
    sub_map = {s.user_id: s for s in subscriptions}

    active_trials = 0
    expired_trials = 0
    active_paid = 0
    unregistered_subs = 0

    now = get_utc_now()
    biz_plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.code == "vyapar_business").first()
    mrr_price = float(biz_plan.price_inr) if biz_plan else 799.0

    for u in users:
        sub = sub_map.get(u.id)
        if not sub:
            unregistered_subs += 1
            continue

        if sub.status == "TRIAL_ACTIVE":
            if sub.trial_end_date and now >= sub.trial_end_date:
                expired_trials += 1
            else:
                active_trials += 1
        elif sub.status == "TRIAL_EXPIRED":
            expired_trials += 1
        elif sub.status == "ACTIVE":
            if sub.current_period_end and now >= sub.current_period_end:
                expired_trials += 1
            else:
                active_paid += 1
        else:
            expired_trials += 1

    mrr = active_paid * mrr_price

    return {
        "total_users": total_users,
        "active_trials": active_trials,
        "expired_trials": expired_trials,
        "active_paid": active_paid,
        "unregistered_subs": unregistered_subs,
        "monthly_recurring_revenue": mrr,
        "mrr_formatted": f"₹{mrr:,.2f}",
        "plans": get_active_plans(db)
    }


def admin_list_users(
    db,
    search: str = "",
    status_filter: str = "",
    page: int = 1,
    limit: int = 50
) -> Dict[str, Any]:
    """Search and filter users with detailed subscription status and trial dates for Admin table."""
    users = db.query(User).all()
    subscriptions = db.query(UserSubscription).all()
    businesses = db.query(Business).all()

    sub_map = {s.user_id: s for s in subscriptions}
    biz_map = {b.id: b for b in businesses}

    now = get_utc_now()
    rows = []

    for u in users:
        # Search filter
        if search:
            q = search.lower().strip()
            uname = (u.name or "").lower()
            uemail = (u.email or "").lower()
            if q not in uname and q not in uemail:
                continue

        sub = sub_map.get(u.id)
        status = "NO_SUBSCRIPTION"
        plan_code = "none"
        trial_end_date = None
        period_end_date = None
        days_rem = 0

        if sub:
            # Dynamic expiry check for response consistency
            if sub.status == "TRIAL_ACTIVE" and sub.trial_end_date and now >= sub.trial_end_date:
                status = "TRIAL_EXPIRED"
            elif sub.status == "ACTIVE" and sub.current_period_end and now >= sub.current_period_end:
                status = "EXPIRED"
            else:
                status = sub.status

            plan_code = sub.plan_code
            trial_end_date = sub.trial_end_date
            period_end_date = sub.current_period_end

            target_end = trial_end_date if plan_code == "free_trial" else period_end_date
            if target_end and target_end > now:
                days_rem = (target_end - now).days
            else:
                days_rem = 0

        # Status filter
        if status_filter and status_filter != "ALL":
            if status != status_filter:
                continue

        rows.append({
            "user_id": u.id,
            "name": u.name or "Unnamed User",
            "email": u.email,
            "role": u.role or "user",
            "subscription_id": sub.id if sub else None,
            "status": status,
            "plan_code": plan_code,
            "days_remaining": days_rem,
            "trial_start_ist": format_to_ist_str(sub.trial_start_date) if sub else None,
            "trial_end_ist": format_to_ist_str(trial_end_date),
            "trial_end_iso": to_ist_iso(trial_end_date),
            "period_end_ist": format_to_ist_str(period_end_date),
            "created_at_ist": format_to_ist_str(u.created_at)
        })

    # Sort: active trials & expired first
    rows.sort(key=lambda x: (0 if "TRIAL" in x["status"] else (1 if x["status"] == "ACTIVE" else 2)))

    total_count = len(rows)
    start_idx = (page - 1) * limit
    paginated = rows[start_idx:start_idx + limit]

    return {
        "total": total_count,
        "page": page,
        "limit": limit,
        "users": paginated
    }


def admin_get_extensions_log(db, limit: int = 50) -> List[Dict[str, Any]]:
    """Return chronological audit log of company-controlled trial modifications."""
    logs = db.query(TrialExtensionHistory).order_by("-created_at").limit(limit).all()
    user_ids = {l.user_id for l in logs} | {l.admin_id for l in logs}
    users = db.query(User).filter(User.id.in_(list(user_ids))).all() if user_ids else []
    user_map = {u.id: u for u in users}

    results = []
    for l in logs:
        target_u = user_map.get(l.user_id)
        admin_u = user_map.get(l.admin_id)
        results.append({
            "id": l.id,
            "timestamp_ist": format_to_ist_str(l.created_at),
            "user_email": target_u.email if target_u else l.user_id,
            "user_name": target_u.name if target_u else "User",
            "admin_email": admin_u.email if admin_u else l.admin_id,
            "previous_end_ist": format_to_ist_str(l.previous_end_date),
            "new_end_ist": format_to_ist_str(l.new_end_date),
            "extension_days": l.extension_days,
            "reason": l.reason or "No reason specified"
        })
    return results
