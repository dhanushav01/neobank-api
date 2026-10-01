"""
Security dependencies, authentication token lifecycle, password hashing, and role checks.
"""
import uuid
import time
from typing import Optional, Dict, Any
from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from backend.app.core.database import DB
from backend.app.core.utils import fail

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="auth/token",
    auto_error=False,
    description="Bearer authentication. Enter your email and password to receive an access token."
)

def issue_token(user_id: str) -> Dict[str, Any]:
    """Issue a new pair of access and refresh tokens for a user session."""
    user = DB["users"].get(user_id)
    if not user:
        fail(404, "User record not found", "USER_NOT_FOUND")

    access_token = uuid.uuid4().hex
    refresh_token = uuid.uuid4().hex
    expires_at = time.time() + 3600  # 1 hour expiration

    DB["tokens"][access_token] = {
        "uid": user_id,
        "exp": expires_at,
        "refresh": refresh_token
    }
    DB["counters"][refresh_token] = {
        "uid": user_id,
        "access": access_token
    }

    has_sql = bool(user.get("hasSqlAccess", False) or user.get("role") in ("ADMIN", "SUPER_ADMIN"))
    return {
        "accessToken": access_token,
        "refreshToken": refresh_token,
        "tokenType": "Bearer",
        "expiresIn": 3600,
        "userId": user_id,
        "role": user.get("role", "CUSTOMER"),
        "hasSqlAccess": has_sql,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "role": user.get("role", "CUSTOMER"),
            "hasSqlAccess": has_sql,
            "profile": user.get("profile", {}),
            "employeeCode": user.get("employeeCode", "EMP01")
        }
    }

def get_current_user(token: Optional[str] = Depends(oauth2_scheme)) -> Dict[str, Any]:
    """Dependency that authenticates the Bearer token and returns the current user record."""
    if not token:
        fail(401, "Missing authorization bearer token", "UNAUTHENTICATED")

    token_meta = DB["tokens"].get(token)
    if not token_meta or token_meta["exp"] < time.time():
        fail(401, "Invalid or expired authorization token", "TOKEN_INVALID")

    user = DB["users"].get(token_meta["uid"])
    if not user:
        fail(401, "User associated with this token does not exist", "TOKEN_INVALID")

    if user.get("status") != "ACTIVE":
        fail(403, "User account is suspended or inactive", "USER_SUSPENDED")

    return user

def require_staff_or_admin(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """Enforce that the authenticated user has bank staff or admin privileges."""
    if user.get("role") not in ("ADMIN", "EMPLOYEE", "SUPER_ADMIN"):
        fail(403, "Access restricted to bank employees and administrators", "FORBIDDEN")
    return user

def require_admin(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """Enforce that the authenticated user is an administrator."""
    if user.get("role") not in ("ADMIN", "SUPER_ADMIN"):
        fail(403, "Administrator privilege required", "FORBIDDEN")
    return user
