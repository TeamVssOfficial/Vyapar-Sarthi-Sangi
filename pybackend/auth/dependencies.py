from fastapi import Depends, HTTPException, status, Header, Request
from sqlalchemy.orm import Session
import time

from database.connection import get_db
from database.models import User, Business, UserBusiness
from .security import decode_access_token

# High-Performance In-Memory Auth Cache to eliminate redundant cloud roundtrips
_USER_CACHE: dict[str, tuple[float, User]] = {}
_BIZ_CACHE: dict[tuple[str, str], tuple[float, Business]] = {}
AUTH_CACHE_TTL = 90.0  # 90 seconds in-memory TTL


def clear_auth_cache(user_id: str | None = None):
    """Invalidate cached user or business sessions when user profile/membership updates."""
    global _USER_CACHE, _BIZ_CACHE
    if user_id:
        _USER_CACHE.pop(str(user_id), None)
        keys_to_remove = [k for k in _BIZ_CACHE if k[0] == str(user_id)]
        for k in keys_to_remove:
            _BIZ_CACHE.pop(k, None)
    else:
        _USER_CACHE.clear()
        _BIZ_CACHE.clear()


async def get_current_user(
    request: Request,
    authorization: str | None = Header(None),
    db: Session = Depends(get_db)
) -> User:
    token = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
    elif "token" in request.cookies:
        token = request.cookies.get("token")

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token missing. Please log in.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("userID") or payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload missing user identifier.",
        )

    uid_str = str(user_id)
    now = time.time()

    # Check high-speed in-memory cache first (0.01ms)
    cached_entry = _USER_CACHE.get(uid_str)
    if cached_entry and (now - cached_entry[0]) < AUTH_CACHE_TTL:
        user = cached_entry[1]
        user._session = db
        return user

    user = db.query(User).filter(User.id == uid_str).first()
    if not user:
        # If user logged in through the Node.js backend, automatically provision local profile & workspace
        user = User(
            id=uid_str,
            email=payload.get("email") or f"user_{uid_str[:8]}@vssai.local",
            name=payload.get("name") or "Enterprise User",
            role=payload.get("role") or "user",
            password_hash="[synced_from_node_backend]"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # Ensure user's separate isolated encrypted directory structure exists
    from storage_manager import get_user_storage_dirs
    get_user_storage_dirs(user.id, user.name)

    _USER_CACHE[uid_str] = (now, user)
    return user


async def get_current_business(
    business_id: str | None = Header(None, alias="X-Business-Id"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Business:
    now = time.time()
    cache_key = (str(user.id), str(business_id or ""))
    cached_biz = _BIZ_CACHE.get(cache_key)
    if cached_biz and (now - cached_biz[0]) < AUTH_CACHE_TTL:
        biz = cached_biz[1]
        biz._session = db
        return biz

    business = None
    if business_id:
        # Check user membership
        membership = db.query(UserBusiness).filter(
            UserBusiness.user_id == user.id,
            UserBusiness.business_id == business_id
        ).first()

        if membership or user.role == "admin":
            business = db.query(Business).filter(Business.id == business_id).first()

    if not business:
        # Fallback to the first business owned or associated with the user
        user_business = db.query(UserBusiness).filter(UserBusiness.user_id == user.id).first()
        if user_business and user_business.business:
            business = user_business.business

    if not business:
        # If user has no business, create a default workspace automatically
        business = Business(
            name=f"{user.name}'s Workspace",
            industry="General Business",
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

    _BIZ_CACHE[cache_key] = (now, business)
    return business
