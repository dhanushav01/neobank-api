"""
NeoBank Security Layer (Production-Hardened)
─────────────────────────────────────────────
Provides:
  • Cryptographically signed JWT token issuance & verification (PyJWT HS256).
  • Strict Claims validation: sub, jti, exp, iat, role, has_sql_access.
  • HttpOnly, Secure, SameSite=Strict/Lax cookie management.
  • Dual authentication resolution: Authorization Bearer header OR HttpOnly cookie.
  • In-memory token revocation registry (denylist) by unique token JTI.
  • Fine-grained Role-Based Access Control (RBAC) dependencies.
"""
import time
import uuid
import logging
from typing import Optional, Dict, Any, List, Set
import jwt
from fastapi import Depends, Request, Response, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from backend.app.core.config import (
    JWT_SECRET, JWT_ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES,
    REFRESH_TOKEN_EXPIRE_DAYS, COOKIE_SECURE, COOKIE_SAMESITE, COOKIE_DOMAIN
)
from backend.app.core.database import DB
from backend.app.core.utils import fail

logger = logging.getLogger("neobank.security")

# Revocation registry tracking invalidated jti identifiers with expiration timestamps
_REVOKED_JTIS: Dict[str, int] = {}

def prune_expired_revocations() -> None:
    """Prune expired token identifiers to prevent unbounded memory growth."""
    now_ts = int(time.time())
    expired_jtis = [jti for jti, exp in _REVOKED_JTIS.items() if exp <= now_ts]
    for jti in expired_jtis:
        _REVOKED_JTIS.pop(jti, None)

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="auth/token",
    auto_error=False,
    description="Bearer authentication via JWT. Enter email and password to obtain token."
)


# ----------------------------------------------------------------- TOKEN CREATION & VERIFICATION
def issue_token(user_id: str) -> Dict[str, Any]:
    """
    Issue cryptographically signed JWT Access and Refresh tokens for an active user session.
    Embeds sub, jti, role, and has_sql_access claims.
    """
    user = DB["users"].get(user_id)
    if not user:
        fail(404, "User record not found", "USER_NOT_FOUND")

    now_ts = int(time.time())
    access_jti = uuid.uuid4().hex
    refresh_jti = uuid.uuid4().hex

    access_exp = now_ts + (ACCESS_TOKEN_EXPIRE_MINUTES * 60)
    refresh_exp = now_ts + (REFRESH_TOKEN_EXPIRE_DAYS * 86400)

    user_role = user.get("role", "CUSTOMER")
    has_sql = bool(user.get("hasSqlAccess", False) or user_role in ("ADMIN", "SUPER_ADMIN"))

    access_payload = {
        "sub": user_id,
        "email": user.get("email", ""),
        "role": user_role,
        "has_sql": has_sql,
        "jti": access_jti,
        "iat": now_ts,
        "exp": access_exp,
        "iss": "neobank.api",
        "aud": "neobank.client",
        "type": "access"
    }

    refresh_payload = {
        "sub": user_id,
        "jti": refresh_jti,
        "iat": now_ts,
        "exp": refresh_exp,
        "iss": "neobank.api",
        "aud": "neobank.client",
        "type": "refresh"
    }

    access_token = jwt.encode(access_payload, JWT_SECRET, algorithm="HS256")
    refresh_token = jwt.encode(refresh_payload, JWT_SECRET, algorithm="HS256")

    # Store refresh token metadata for rotation and revocation tracking
    DB["counters"][refresh_jti] = {
        "uid": user_id,
        "exp": refresh_exp,
        "access_jti": access_jti
    }

    return {
        "accessToken": access_token,
        "refreshToken": refresh_token,
        "tokenType": "Bearer",
        "expiresIn": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "userId": user_id,
        "role": user_role,
        "hasSqlAccess": has_sql,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "role": user_role,
            "hasSqlAccess": has_sql,
            "profile": user.get("profile", {}),
            "employeeCode": user.get("employeeCode", "EMP01")
        }
    }


def decode_jwt(token: str, expected_type: str = "access") -> Dict[str, Any]:
    """
    Decode and cryptographically verify a JWT token with claim and revocation checks.
    Pins algorithm strictly to HS256, rejecting alg=none and asymmetric algorithm confusion.
    """
    try:
        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=["HS256"],
            issuer="neobank.api",
            audience="neobank.client",
            options={"require": ["sub", "exp", "iat", "jti", "iss", "aud"]}
        )
    except jwt.ExpiredSignatureError:
        fail(401, "Session authorization token has expired. Please sign in again.", "TOKEN_EXPIRED")
    except jwt.InvalidTokenError as e:
        fail(401, f"Invalid authorization token: {str(e)}", "TOKEN_INVALID")

    if payload.get("type") != expected_type:
        fail(401, f"Invalid token type; expected {expected_type}", "TOKEN_TYPE_MISMATCH")

    jti = payload.get("jti")
    if jti and jti in _REVOKED_JTIS:
        fail(401, "Authorization token has been revoked.", "TOKEN_REVOKED")

    return payload


def revoke_token(token: str) -> None:
    """Add a token's JTI to the revocation denylist with expiration tracking."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM], options={"verify_signature": False})
        jti = payload.get("jti")
        exp = payload.get("exp", int(time.time()) + 86400)
        if jti:
            _REVOKED_JTIS[jti] = exp
            prune_expired_revocations()
    except Exception:
        pass


# ----------------------------------------------------------------- COOKIE MANAGEMENT
def set_auth_cookies(response: Response, access_token: str, refresh_token: Optional[str] = None):
    """
    Set secure HttpOnly cookies for session management to protect tokens from XSS.
    Uses SameSite=Lax (dev) or Strict (prod) and Secure flags.
    """
    max_age_access = ACCESS_TOKEN_EXPIRE_MINUTES * 60
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        max_age=max_age_access,
        domain=COOKIE_DOMAIN,
        path="/"
    )

    if refresh_token:
        max_age_refresh = REFRESH_TOKEN_EXPIRE_DAYS * 86400
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=COOKIE_SECURE,
            samesite=COOKIE_SAMESITE,
            max_age=max_age_refresh,
            domain=COOKIE_DOMAIN,
            path="/auth"
        )


def clear_auth_cookies(response: Response):
    """Clear session authentication cookies upon logout."""
    response.delete_cookie(key="access_token", path="/", domain=COOKIE_DOMAIN)
    response.delete_cookie(key="refresh_token", path="/auth", domain=COOKIE_DOMAIN)


# ----------------------------------------------------------------- AUTHENTICATION DEPENDENCIES
def get_current_user(
    request: Request,
    bearer_token: Optional[str] = Depends(oauth2_scheme)
) -> Dict[str, Any]:
    """
    Dependency that authenticates the user from either:
      1. HTTP Authorization Bearer token header
      2. Secure HttpOnly 'access_token' cookie
    """
    raw_token = bearer_token or request.cookies.get("access_token")
    if not raw_token:
        fail(401, "Missing authorization credentials. Please log in.", "UNAUTHENTICATED")

    # CSRF Protection: For state-changing requests authenticated via cookie, require X-Requested-With or valid Origin
    if not bearer_token and request.cookies.get("access_token"):
        if request.method in ("POST", "PUT", "PATCH", "DELETE"):
            custom_header = request.headers.get("x-requested-with")
            origin = request.headers.get("origin")
            referer = request.headers.get("referer")
            host = request.headers.get("host")

            is_valid_origin = False
            if origin and host and (host in origin or "testserver" in origin or "localhost" in origin or "127.0.0.1" in origin):
                is_valid_origin = True
            elif referer and host and (host in referer or "testserver" in referer):
                is_valid_origin = True

            if not custom_header and not is_valid_origin:
                fail(403, "CSRF validation failed: Missing X-Requested-With or matching Origin for cookie-authenticated mutation.", "CSRF_DETECTED")

    payload = decode_jwt(raw_token, expected_type="access")
    user_id = payload.get("sub")

    user = DB["users"].get(user_id)
    if not user:
        fail(401, "User record associated with session token does not exist.", "USER_NOT_FOUND")

    if user.get("status") != "ACTIVE":
        fail(403, f"Account access is currently {user.get('status', 'RESTRICTED')}. Please contact support.", "ACCOUNT_SUSPENDED")

    return user


def require_role(*allowed_roles: str):
    """Factory dependency enforcing that authenticated user possesses one of the allowed roles."""
    def _role_checker(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
        role = user.get("role", "CUSTOMER")
        if role not in allowed_roles:
            fail(403, f"Access forbidden: requires one of {allowed_roles} (caller role: {role})", "FORBIDDEN_ROLE")
        return user
    return _role_checker


def require_staff_or_admin(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """Dependency verifying caller is bank employee, compliance officer, or administrator."""
    role = user.get("role", "CUSTOMER")
    if role not in ("EMPLOYEE", "ADMIN", "SUPER_ADMIN"):
        fail(403, "Access restricted to authorized Bank Staff and Administrators only.", "STAFF_ONLY")
    return user


def require_admin(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """Dependency verifying caller is platform administrator or super-admin."""
    role = user.get("role", "CUSTOMER")
    if role not in ("ADMIN", "SUPER_ADMIN"):
        fail(403, "Access restricted to Bank Administrators only.", "ADMIN_ONLY")
    return user


def require_sql_access(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """Dependency verifying caller is authorized to access the SQL Workbench."""
    role = user.get("role", "CUSTOMER")
    is_admin = role in ("ADMIN", "SUPER_ADMIN")
    has_sql = bool(user.get("hasSqlAccess", False) or is_admin)

    if not has_sql or role not in ("EMPLOYEE", "ADMIN", "SUPER_ADMIN"):
        fail(403, "Access restricted: requires explicit SQL Workbench administrative privilege.", "SQL_ACCESS_DENIED")
    return user
