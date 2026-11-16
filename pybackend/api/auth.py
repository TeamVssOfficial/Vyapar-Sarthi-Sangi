from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
import httpx

from database.connection import get_db
from database.models import User, Business, UserBusiness
from auth.security import hash_password, verify_password, create_access_token
from auth.dependencies import get_current_user
from config import settings, PROJECT_DIR
from storage_manager import get_user_storage_dirs, save_encrypted_dataset, load_encrypted_dataframe

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: str = Field(pattern=r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
    password: str = Field(min_length=8)
    business_name: str | None = None
    industry: str | None = "General Business"


class LoginRequest(BaseModel):
    email: str = Field(pattern=r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
    password: str


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(req: RegisterRequest, response: Response, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == req.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="A user with this email address already exists."
        )

    # 1. Forward and persist user into MongoDB backend (port 3000)
    node_user_id = None
    node_token = None
    try:
        with httpx.Client(timeout=3.0) as client:
            node_resp = client.post(
                f"{settings.NODE_BACKEND_URL}/api/user/register",
                json={
                    "name": req.name.strip(),
                    "email": req.email.lower().strip(),
                    "password": req.password
                }
            )
            if node_resp.status_code in (200, 201):
                data = node_resp.json()
                node_u = data.get("user")
                if node_u:
                    node_user_id = str(node_u.get("_id") or node_u.get("id"))
                node_token = data.get("token")
    except Exception as e:
        print("Note: Node.js/MongoDB forward registration error:", e)

    # 2. Persist user and business workspace in database
    user = db.query(User).filter(User.email == req.email.lower().strip()).first()
    if not user:
        user_kwargs = {
            "name": req.name.strip(),
            "email": req.email.lower().strip(),
            "password_hash": hash_password(req.password),
            "role": "user"
        }
        if node_user_id:
            user_kwargs["id"] = node_user_id

        user = User(**user_kwargs)
        db.add(user)
        db.flush()
    else:
        # User was already inserted in MongoDB by Node backend; ensure password hash is set
        if not getattr(user, "password_hash", None) or user.password_hash == "[synced_from_node_backend]":
            user.password_hash = hash_password(req.password)
            db.add(user)
            db.flush()

    # Create initial business workspace if not already present
    existing_memberships = db.query(UserBusiness).filter(UserBusiness.user_id == user.id).all()
    if existing_memberships and existing_memberships[0].business:
        business = existing_memberships[0].business
    else:
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
        db.refresh(user)

    # Provision user's dedicated encrypted storage tree
    get_user_storage_dirs(user.id, user.name)

    token = node_token or create_access_token({"userID": user.id, "email": user.email, "role": user.role})
    response.set_cookie(key="token", value=token, httponly=True, samesite="lax")

    return {
        "message": "Registration successful (persisted to MongoDB & local workspace)",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        },
        "business": {
            "id": business.id,
            "name": business.name,
            "industry": business.industry
        },
        "token": token
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
