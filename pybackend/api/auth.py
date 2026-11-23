from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
import httpx
import secrets
import hashlib
from datetime import datetime, timedelta

from database.connection import get_db
from database.models import User, Business, UserBusiness, OTPVerification
from auth.security import hash_password, verify_password, create_access_token
from auth.dependencies import get_current_user
from config import settings, PROJECT_DIR
from storage_manager import get_user_storage_dirs, save_encrypted_dataset, load_encrypted_dataframe
from services.email_service import send_otp_email

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


def _hash_otp(code: str) -> str:
    salt = settings.JWT_SECRET or "vss_ai_salt"
    return hashlib.sha256(f"{code.strip()}:{salt}".encode()).hexdigest()


class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: str = Field(pattern=r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
    password: str = Field(min_length=8)
    confirm_password: str | None = None
    business_name: str | None = None
    industry: str | None = "General Business"


class VerifyOTPRequest(BaseModel):
    email: str = Field(pattern=r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
    otp: str = Field(min_length=6, max_length=6)
    purpose: str = "signup"


class ResendOTPRequest(BaseModel):
    email: str = Field(pattern=r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
    purpose: str = "signup"


class ForgotPasswordRequest(BaseModel):
    email: str = Field(pattern=r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")


class ResetPasswordRequest(BaseModel):
    email: str = Field(pattern=r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
    otp: str = Field(min_length=6, max_length=6)
    new_password: str = Field(min_length=8)
    confirm_password: str | None = None


class LoginRequest(BaseModel):
    email: str = Field(pattern=r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
    password: str


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(req: RegisterRequest, response: Response, db: Session = Depends(get_db)):
    if req.confirm_password and req.password != req.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password and confirm password do not match."
        )

    clean_email = req.email.lower().strip()
    existing = db.query(User).filter(User.email == clean_email).first()
    if existing and getattr(existing, "is_verified", True):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="A user with this email address already exists. Please sign in."
        )

    # 1. Forward and persist user into MongoDB backend (port 3000)
    node_user_id = None
    try:
        with httpx.Client(timeout=3.0) as client:
            node_resp = client.post(
                f"{settings.NODE_BACKEND_URL}/api/user/register",
                json={
                    "name": req.name.strip(),
                    "email": clean_email,
                    "password": req.password
                }
            )
            if node_resp.status_code in (200, 201):
                data = node_resp.json()
                node_u = data.get("user")
                if node_u:
                    node_user_id = str(node_u.get("_id") or node_u.get("id"))
    except Exception as e:
        print("Note: Node.js/MongoDB forward registration error:", e)

    # 2. Persist user (unverified pending OTP confirmation)
    user = existing
    if not user:
        user_kwargs = {
            "name": req.name.strip(),
            "email": clean_email,
            "password_hash": hash_password(req.password),
            "role": "user",
            "is_verified": False
        }
        if node_user_id:
            user_kwargs["id"] = node_user_id

        user = User(**user_kwargs)
        db.add(user)
        db.flush()
    else:
        user.name = req.name.strip()
        user.password_hash = hash_password(req.password)
        user.is_verified = False
        db.add(user)
        db.flush()

    # Create initial business workspace
    existing_memberships = db.query(UserBusiness).filter(UserBusiness.user_id == user.id).all()
    if not existing_memberships or not existing_memberships[0].business:
        biz_name = req.business_name.strip() if req.business_name else f"{user.name}'s Enterprise"
        business = Business(
            name=biz_name,
            industry=req.industry or "General Business",
            owner_id=user.id
        )
        db.add(business)
        db.flush()

        rel = UserBusiness(
            user_id=user.id,
            business_id=business.id,
            role="owner"
        )
        db.add(rel)
        db.commit()
    else:
        db.commit()

    # 3. Generate secure 6-digit OTP
    otp_code = f"{secrets.randbelow(1000000):06d}"

    # Invalidate previous unverified signup OTPs for this email
    db.query(OTPVerification).filter(
        OTPVerification.email == clean_email,
        OTPVerification.otp_type == "signup",
        OTPVerification.is_used == False
    ).update({"is_used": True})

    otp_record = OTPVerification(
        email=clean_email,
        otp_hash=_hash_otp(otp_code),
        otp_type="signup",
        expires_at=datetime.utcnow() + timedelta(minutes=5),
        is_used=False,
        attempts=0
    )
    db.add(otp_record)
    db.commit()

    # 4. Dispatch Email OTP
    send_otp_email(to_email=clean_email, otp_code=otp_code, name=req.name.strip(), purpose="signup")

    return {
        "status": "otp_required",
        "message": f"Verification code sent to {clean_email}. Please enter the 6-digit OTP.",
        "email": clean_email
    }


@router.post("/verify-otp")
def verify_otp(req: VerifyOTPRequest, response: Response, db: Session = Depends(get_db)):
    clean_email = req.email.lower().strip()
    submitted_otp = req.otp.strip()

    otp_record = db.query(OTPVerification).filter(
        OTPVerification.email == clean_email,
        OTPVerification.otp_type == req.purpose,
        OTPVerification.is_used == False
    ).order_by(OTPVerification.created_at.desc()).first()

    if not otp_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active verification code found. Please request a new OTP."
        )

    if datetime.utcnow() > otp_record.expires_at:
        otp_record.is_used = True
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code has expired. Please request a new OTP."
        )

    if otp_record.attempts >= 5:
        otp_record.is_used = True
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Too many invalid attempts. This OTP has been invalidated for security. Please request a new one."
        )

    if _hash_otp(submitted_otp) != otp_record.otp_hash:
        otp_record.attempts += 1
        db.commit()
        remaining = 5 - otp_record.attempts
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid verification code. {remaining} attempt(s) remaining."
        )

    # OTP is valid!
    otp_record.is_used = True

    user = db.query(User).filter(User.email == clean_email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account associated with this OTP was not found."
        )

    user.is_verified = True
    user.is_active = True
    db.commit()
    db.refresh(user)

    # Provision user's dedicated encrypted storage tree
    get_user_storage_dirs(user.id, user.name)

    token = create_access_token({"userID": user.id, "email": user.email, "role": user.role})
    response.set_cookie(key="token", value=token, httponly=True, samesite="lax")

    user_businesses_list = [ub for ub in (user.businesses or []) if ub and getattr(ub, "business", None)]
    user_businesses = [
        {
            "id": ub.business.id,
            "name": ub.business.name,
            "industry": ub.business.industry,
            "role": ub.role
        }
        for ub in user_businesses_list
    ]

    return {
        "status": "verified",
        "message": "Account verified successfully! Welcome to Vyapar Verse.",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        },
        "businesses": user_businesses,
        "token": token
    }


@router.post("/resend-otp")
def resend_otp(req: ResendOTPRequest, db: Session = Depends(get_db)):
    clean_email = req.email.lower().strip()

    user = db.query(User).filter(User.email == clean_email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account registered with this email address."
        )

    # Check 60-second cooldown
    latest_otp = db.query(OTPVerification).filter(
        OTPVerification.email == clean_email,
        OTPVerification.otp_type == req.purpose
    ).order_by(OTPVerification.created_at.desc()).first()

    if latest_otp and (datetime.utcnow() - latest_otp.created_at) < timedelta(seconds=60):
        wait_seconds = 60 - int((datetime.utcnow() - latest_otp.created_at).total_seconds())
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Please wait {wait_seconds} seconds before requesting another code."
        )

    # Invalidate previous OTPs
    db.query(OTPVerification).filter(
        OTPVerification.email == clean_email,
        OTPVerification.otp_type == req.purpose,
        OTPVerification.is_used == False
    ).update({"is_used": True})

    otp_code = f"{secrets.randbelow(1000000):06d}"
    otp_record = OTPVerification(
        email=clean_email,
        otp_hash=_hash_otp(otp_code),
        otp_type=req.purpose,
        expires_at=datetime.utcnow() + timedelta(minutes=5),
        is_used=False,
        attempts=0
    )
    db.add(otp_record)
    db.commit()

    send_otp_email(to_email=clean_email, otp_code=otp_code, name=user.name, purpose=req.purpose)

    return {
        "status": "resent",
        "message": f"A new verification code has been dispatched to {clean_email}."
    }


@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    clean_email = req.email.lower().strip()

    user = db.query(User).filter(User.email == clean_email).first()
    # Always return a generic success message to prevent user enumeration
    if not user:
        return {
            "status": "otp_sent",
            "message": f"If an account exists for {clean_email}, a password reset code has been sent."
        }

    # Invalidate previous forgot_password OTPs
    db.query(OTPVerification).filter(
        OTPVerification.email == clean_email,
        OTPVerification.otp_type == "forgot_password",
        OTPVerification.is_used == False
    ).update({"is_used": True})

    otp_code = f"{secrets.randbelow(1000000):06d}"
    otp_record = OTPVerification(
        email=clean_email,
        otp_hash=_hash_otp(otp_code),
        otp_type="forgot_password",
        expires_at=datetime.utcnow() + timedelta(minutes=5),
        is_used=False,
        attempts=0
    )
    db.add(otp_record)
    db.commit()

    send_otp_email(to_email=clean_email, otp_code=otp_code, name=user.name, purpose="forgot_password")

    return {
        "status": "otp_sent",
        "message": f"If an account exists for {clean_email}, a password reset code has been sent."
    }


@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    if req.confirm_password and req.new_password != req.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match."
        )

    clean_email = req.email.lower().strip()
    submitted_otp = req.otp.strip()

    otp_record = db.query(OTPVerification).filter(
        OTPVerification.email == clean_email,
        OTPVerification.otp_type == "forgot_password",
        OTPVerification.is_used == False
    ).order_by(OTPVerification.created_at.desc()).first()

    if not otp_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active reset code found. Please request a new password reset."
        )

    if datetime.utcnow() > otp_record.expires_at:
        otp_record.is_used = True
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset code has expired. Please request a new code."
        )

    if _hash_otp(submitted_otp) != otp_record.otp_hash:
        otp_record.attempts += 1
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid reset code. Please check your email and try again."
        )

    otp_record.is_used = True
    db.add(otp_record)

    user = db.query(User).filter(User.email == clean_email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account was not found."
        )

    user.password_hash = hash_password(req.new_password)
    user.is_verified = True
    db.add(user)
    db.commit()

    return {
        "status": "success",
        "message": "Password updated successfully. You can now sign in with your new credentials."
    }


@router.post("/login")
def login(req: LoginRequest, response: Response, db: Session = Depends(get_db)):
    # 1. Attempt authentication with Node.js backend if active (port 3000)
    node_user = None
    node_token = None
    try:
        with httpx.Client(timeout=1.5) as client:
            node_resp = client.post(
                f"{settings.NODE_BACKEND_URL}/api/user/login",
                json={"email": req.email, "password": req.password}
            )
            if node_resp.status_code == 200:
                data = node_resp.json()
                node_user = data.get("user")
                node_token = data.get("token") or node_resp.cookies.get("token")
    except Exception:
        pass

    if node_user and node_token:
        user_id = str(node_user.get("_id") or node_user.get("id"))
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            user = db.query(User).filter(User.email == req.email.lower().strip()).first()
        if not user:
            user = User(
                id=user_id,
                name=node_user.get("name", "Enterprise User"),
                email=node_user.get("email", req.email),
                role=node_user.get("role", "user"),
                password_hash=hash_password(req.password)
            )
            db.add(user)
            db.flush()

        # Ensure user has a workspace
        user_businesses_list = [ub for ub in (user.businesses or []) if ub and ub.business]
        if not user_businesses_list:
            default_biz = Business(
                name=f"{user.name}'s Workspace",
                industry="General Business",
                owner_id=user.id
            )
            db.add(default_biz)
            db.flush()

            rel = UserBusiness(user_id=user.id, business_id=default_biz.id, role="owner")
            db.add(rel)
            db.commit()
            db.refresh(user)
            user_businesses_list = [rel]

        response.set_cookie(key="token", value=node_token, httponly=True, samesite="lax")
        user_businesses = [
            {
                "id": ub.business.id,
                "name": ub.business.name,
                "industry": ub.business.industry,
                "role": ub.role
            }
            for ub in user_businesses_list
            if ub and ub.business
        ]

        # Verify or provision user's dedicated encrypted storage tree on login
        get_user_storage_dirs(user.id, user.name)

        if getattr(user, "is_verified", True) is False:
            otp_code = f"{secrets.randbelow(1000000):06d}"
            db.query(OTPVerification).filter(
                OTPVerification.email == user.email,
                OTPVerification.otp_type == "signup",
                OTPVerification.is_used == False
            ).update({"is_used": True})
            otp_record = OTPVerification(
                email=user.email,
                otp_hash=_hash_otp(otp_code),
                otp_type="signup",
                expires_at=datetime.utcnow() + timedelta(minutes=5),
                is_used=False,
                attempts=0
            )
            db.add(otp_record)
            db.commit()
            send_otp_email(to_email=user.email, otp_code=otp_code, name=user.name, purpose="signup")
            return {
                "status": "otp_required",
                "email": user.email,
                "message": "Please verify your email address to access your workspace. A 6-digit OTP has been dispatched."
            }

        return {
            "message": "Login successful (authenticated via Node.js backend)",
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role
            },
            "businesses": user_businesses,
            "token": node_token
        }

    # 2. Direct database authentication fallback
    user = db.query(User).filter(User.email == req.email.lower().strip()).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    # Check password
    if not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    token = create_access_token({"userID": user.id, "email": user.email, "role": user.role})
    response.set_cookie(key="token", value=token, httponly=True, samesite="lax")

    # Verify or provision user's dedicated encrypted storage tree on login
    get_user_storage_dirs(user.id, user.name)

    if getattr(user, "is_verified", True) is False:
        otp_code = f"{secrets.randbelow(1000000):06d}"
        db.query(OTPVerification).filter(
            OTPVerification.email == user.email,
            OTPVerification.otp_type == "signup",
            OTPVerification.is_used == False
        ).update({"is_used": True})
        otp_record = OTPVerification(
            email=user.email,
            otp_hash=_hash_otp(otp_code),
            otp_type="signup",
            expires_at=datetime.utcnow() + timedelta(minutes=5),
            is_used=False,
            attempts=0
        )
        db.add(otp_record)
        db.commit()
        send_otp_email(to_email=user.email, otp_code=otp_code, name=user.name, purpose="signup")
        return {
            "status": "otp_required",
            "email": user.email,
            "message": "Please verify your email address to access your workspace. A 6-digit OTP has been dispatched."
        }

    # Ensure user has a workspace
    user_businesses_list = [ub for ub in (user.businesses or []) if ub and ub.business]
    if not user_businesses_list:
        default_biz = Business(
            name=f"{user.name}'s Workspace",
            industry="General Business",
            owner_id=user.id
        )
        db.add(default_biz)
        db.flush()

        rel = UserBusiness(user_id=user.id, business_id=default_biz.id, role="owner")
        db.add(rel)
        db.commit()
        db.refresh(user)
        user_businesses_list = [rel]

    user_businesses = [
        {
            "id": ub.business.id,
            "name": ub.business.name,
            "industry": ub.business.industry,
            "role": ub.role
        }
        for ub in user_businesses_list
        if ub and ub.business
    ]

    return {
        "message": "Login successful",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        },
        "businesses": user_businesses,
        "token": token
    }


@router.post("/demo-login")
def demo_login(response: Response, db: Session = Depends(get_db)):
    demo_email = "demo@vssai.com"
    user = db.query(User).filter(User.email == demo_email).first()
    if not user:
        user = User(
            name="Enterprise Director",
            email=demo_email,
            password_hash=hash_password("DemoPassword123!"),
            role="admin"
        )
        db.add(user)
        db.flush()

        biz = Business(
            name="Vyapar Global Enterprises",
            industry="Retail & Distribution",
            owner_id=user.id
        )
        db.add(biz)
        db.flush()

        rel = UserBusiness(user_id=user.id, business_id=biz.id, role="owner")
        db.add(rel)
        db.commit()
        db.refresh(user)

    # Also register/sync demo user to MongoDB backend if online
    try:
        with httpx.Client(timeout=2.0) as client:
            client.post(
                f"{settings.NODE_BACKEND_URL}/api/user/register",
                json={
                    "name": "Enterprise Director",
                    "email": demo_email,
                    "password": "DemoPassword123!"
                }
            )
    except Exception:
        pass

    # Ensure sample benchmark dataset is seeded into this demo business
    active_dataset_id = None
    if user.businesses:
        demo_biz = user.businesses[0].business
        from database.models import Dataset
        existing_ds = db.query(Dataset).filter(Dataset.business_id == demo_biz.id).first()
        if existing_ds:
            active_dataset_id = existing_ds.id
        else:
            sample_csv = PROJECT_DIR / "notebooks" / "sales_data_sample.csv"
            if sample_csv.is_file():
                import uuid
                from engines.data_intelligence.type_detection import detect_column_types

                user_dirs = get_user_storage_dirs(user.id, user.name)
                ds_id = str(uuid.uuid4())
                target_enc = user_dirs["uploads"] / f"{ds_id}.enc"

                try:
                    import json
                    with open(sample_csv, "rb") as f:
                        raw_csv_bytes = f.read()
                    encrypted_size = save_encrypted_dataset(raw_csv_bytes, target_enc)

                    df = load_encrypted_dataframe(target_enc)
                    col_types = detect_column_types(df)
                    seeded_ds = Dataset(
                        id=ds_id,
                        business_id=demo_biz.id,
                        user_id=user.id,
                        name="Enterprise Sales Benchmark Dataset",
                        filename="sales_data_sample.csv",
                        file_path=str(target_enc.resolve()),
                        file_size_bytes=encrypted_size,
                        row_count=len(df),
                        col_count=len(df.columns),
                        column_meta=json.dumps(col_types),
                        status="ready"
                    )
                    db.add(seeded_ds)
                    db.commit()
                    db.refresh(seeded_ds)
                    active_dataset_id = seeded_ds.id
                except Exception as e:
                    print("Error seeding demo dataset:", e)

    token = create_access_token({"userID": user.id, "email": user.email, "role": user.role})
    response.set_cookie(key="token", value=token, httponly=True, samesite="lax")

    # Verify or provision user's dedicated encrypted storage tree on login
    get_user_storage_dirs(user.id, user.name)

    if getattr(user, "is_verified", True) is False:
        otp_code = f"{secrets.randbelow(1000000):06d}"
        db.query(OTPVerification).filter(
            OTPVerification.email == user.email,
            OTPVerification.otp_type == "signup",
            OTPVerification.is_used == False
        ).update({"is_used": True})
        otp_record = OTPVerification(
            email=user.email,
            otp_hash=_hash_otp(otp_code),
            otp_type="signup",
            expires_at=datetime.utcnow() + timedelta(minutes=5),
            is_used=False,
            attempts=0
        )
        db.add(otp_record)
        db.commit()
        send_otp_email(to_email=user.email, otp_code=otp_code, name=user.name, purpose="signup")
        return {
            "status": "otp_required",
            "email": user.email,
            "message": "Please verify your email address to access your workspace. A 6-digit OTP has been dispatched."
        }

    user_businesses = [
        {
            "id": ub.business.id,
            "name": ub.business.name,
            "industry": ub.business.industry,
            "role": ub.role
        }
        for ub in user.businesses
    ]

    return {
        "message": "Demo login successful",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        },
        "businesses": user_businesses,
        "active_dataset_id": active_dataset_id,
        "token": token
    }


@router.get("/me")
def get_current_user_profile(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user_businesses_list = [ub for ub in (user.businesses or []) if ub and getattr(ub, "business", None)]
    if not user_businesses_list:
        default_biz = Business(
            name=f"{user.name}'s Workspace",
            industry="General Business",
            owner_id=user.id
        )
        db.add(default_biz)
        db.flush()

        rel = UserBusiness(user_id=user.id, business_id=default_biz.id, role="owner")
        db.add(rel)
        db.commit()
        db.refresh(user)
        user_businesses_list = [rel]

    businesses = [
        {
            "id": ub.business.id,
            "name": ub.business.name,
            "industry": ub.business.industry,
            "role": ub.role
        }
        for ub in user_businesses_list
        if ub and getattr(ub, "business", None)
    ]

    def _format_dt(dt):
        if dt is None:
            return ""
        if hasattr(dt, "isoformat"):
            return dt.isoformat()
        return str(dt)

    return {
        "user": {
            "id": str(user.id),
            "name": user.name or "User",
            "email": user.email,
            "role": user.role or "owner",
            "created_at": _format_dt(getattr(user, "created_at", None))
        },
        "businesses": businesses
    }


@router.post("/logout")
async def logout(request: Request, response: Response):
    token = request.cookies.get("token")
    auth_header = request.headers.get("authorization", "")
    if not token and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1].strip()

    response.delete_cookie("token")

    # Forward to Node.js backend to blacklist token and record LOGOUT in MongoDB
    if token:
        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                await client.post(
                    f"{settings.NODE_BACKEND_URL}/api/user/logout",
                    headers={"Authorization": f"Bearer {token}"}
                )
        except Exception as e:
            print("MongoDB logout sync error:", e)

    return {"message": "Logged out successfully (synced with MongoDB blacklist & audit logs)"}
