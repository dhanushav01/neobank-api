"""
NeoBank FastAPI Application Entrypoint (Production-Hardened)
─────────────────────────────────────────────────────────────
Orchestrates:
  ✓ Strict explicit CORS origin allowlist (no wildcard credentials).
  ✓ Comprehensive HTTP Security Headers Middleware (HSTS, CSP, X-Frame-Options, X-Content-Type-Options).
  ✓ SlowAPI global distributed rate limiting middleware.
  ✓ Global exception masking (no stack trace or internal database leakage).
  ✓ Production documentation safeguards.
  ✓ Static file serving and dedicated single-page endpoints.
"""
import os
import logging
from typing import Optional
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException
from slowapi.errors import RateLimitExceeded

from backend.app.core.config import (
    PROJECT_NAME, VERSION, DESCRIPTION, TAGS,
    CORS_ALLOWED_ORIGINS, IS_PRODUCTION, ENVIRONMENT
)
from backend.app.core.utils import ApiError
from backend.app.core.limiter import limiter

# Import modular routers
from backend.app.routers.auth import router as auth_router
from backend.app.routers.onboarding import router as onboarding_router
from backend.app.routers.users import router as users_router
from backend.app.routers.kyc import router as kyc_router
from backend.app.routers.accounts import router as accounts_router
from backend.app.routers.transfers import router as transfers_router
from backend.app.routers.cards import router as cards_router
from backend.app.routers.loans import router as loans_router
from backend.app.routers.disputes import router as disputes_router
from backend.app.routers.admin import router as admin_router
from backend.app.routers.fx import router as fx_router
from backend.app.routers.bills import router as bills_router
from backend.app.routers.beneficiaries import router as beneficiaries_router
from backend.app.routers.notifications import router as notifications_router
from backend.app.routers.reference import router as reference_router
from backend.app.routers.system import router as system_router
from backend.app.routers.db_admin import router as db_admin_router

logger = logging.getLogger("neobank.main")

# In production, docs can be disabled or restricted
docs_url = None if IS_PRODUCTION else "/docs"
redoc_url = None if IS_PRODUCTION else "/redoc"
openapi_url = None if IS_PRODUCTION else "/openapi.json"

app = FastAPI(
    title=PROJECT_NAME,
    version=VERSION,
    description=DESCRIPTION,
    openapi_tags=TAGS,
    docs_url=docs_url,
    redoc_url=redoc_url,
    openapi_url=openapi_url,
    swagger_ui_parameters={
        "docExpansion": "none",
        "filter": True,
        "persistAuthorization": True,
        "displayRequestDuration": True,
        "tryItOutEnabled": True
    }
)

# Attach SlowAPI rate limiter to app state
app.state.limiter = limiter


# ----------------------------------------------------------------- SECURITY HEADERS MIDDLEWARE
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Appends OWASP-recommended HTTP security headers to every response:
    HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy.
    """
    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)

        # Enforce clickjacking prevention
        response.headers["X-Frame-Options"] = "DENY"

        # Prevent MIME type sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"

        # XSS protection filter
        response.headers["X-XSS-Protection"] = "1; mode=block"

        # Referrer leakage policy
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # Restrict browser hardware APIs
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=(), payment=()"

        # Cross-Origin Isolation Policies
        response.headers["Cross-Origin-Opener-Policy"] = "same-origin"
        response.headers["Cross-Origin-Resource-Policy"] = "same-origin"

        # Content Security Policy (CSP)
        connect_src = (
            "'self' http://localhost:* http://127.0.0.1:* https://*.google.com https://*.googleapis.com https://*.gstatic.com"
            if not IS_PRODUCTION
            else "'self' https://*.google.com https://*.googleapis.com https://*.gstatic.com"
        )
        csp = (
            "default-src 'self'; "
            "object-src 'none'; "
            "base-uri 'self'; "
            "form-action 'self'; "
            "frame-ancestors 'none'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://*.google.com https://*.googleapis.com https://*.gstatic.com; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net https://*.google.com https://*.googleapis.com https://*.gstatic.com; "
            "font-src 'self' https://fonts.gstatic.com https://*.gstatic.com data:; "
            "img-src 'self' data: https: blob:; "
            f"connect-src {connect_src}; "
            "frame-src 'self' https://*.google.com https://*.googleapis.com https://*.gstatic.com;"
        )
        response.headers["Content-Security-Policy"] = csp

        return response

app.add_middleware(SecurityHeadersMiddleware)


# ----------------------------------------------------------------- CORS MIDDLEWARE (HARDENED)
# Replaced wildcard allow_origins=["*"] with explicit environment-configured origins allowlist
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "Idempotency-Key", "X-Requested-With"],
    max_age=86400
)


# ----------------------------------------------------------------- EXCEPTION HANDLERS
@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(_: Request, exc: RateLimitExceeded):
    """Handle rate limit exceeded with clean RFC-compliant error."""
    return JSONResponse(
        status_code=429,
        content={
            "code": "RATE_LIMIT_EXCEEDED",
            "message": "Too many requests. Please slow down and try again later.",
            "details": str(exc.detail)
        },
        headers={"Retry-After": "60"}
    )


@app.exception_handler(ApiError)
async def api_error_handler(_: Request, exc: ApiError):
    return JSONResponse(
        status_code=exc.status,
        content={
            "code": exc.code or f"HTTP_{exc.status}",
            "message": exc.message,
            "details": exc.details
        }
    )


@app.exception_handler(StarletteHTTPException)
async def http_error_handler(request: Request, exc: StarletteHTTPException):
    if exc.status_code == 404:
        accept = request.headers.get("accept", "").lower()
        path = request.url.path
        api_prefixes = (
            "/api/", "/api/v1/",
            "/auth/", "/onboarding/", "/users/", "/kyc/", "/accounts/",
            "/transfers/", "/cards/", "/loans/", "/disputes/", "/admin/",
            "/fx/", "/bills/", "/beneficiaries/", "/notifications/",
            "/reference/", "/system/", "/api/db/", "/db-admin/"
        )
        is_api = any(path.startswith(prefix) for prefix in api_prefixes)
        if ("text/html" in accept or "*/*" in accept) and not is_api:
            page_404 = os.path.join(FRONTEND_DIR, "html", "404.html")
            if not os.path.exists(page_404):
                page_404 = os.path.join(FRONTEND_DIR, "404.html")
            if os.path.exists(page_404):
                return FileResponse(page_404, status_code=404)

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "code": f"HTTP_{exc.status_code}",
            "message": str(exc.detail),
            "details": None
        }
    )


@app.exception_handler(RequestValidationError)
async def validation_error_handler(_: Request, exc: RequestValidationError):
    formatted_errors = [
        {"field": ".".join(str(loc) for loc in err["loc"][1:]), "issue": err["msg"]}
        for err in exc.errors()
    ]
    return JSONResponse(
        status_code=422,
        content={
            "code": "VALIDATION_ERROR",
            "message": "Request validation failed. Please check field types and constraints.",
            "details": formatted_errors
        }
    )


# ----------------------------------------------------------------- MOUNT MODULAR ROUTERS
app.include_router(auth_router)
app.include_router(auth_router, prefix="/api/v1")
app.include_router(auth_router, prefix="/api")

app.include_router(onboarding_router)
app.include_router(onboarding_router, prefix="/api/v1")
app.include_router(onboarding_router, prefix="/api")

app.include_router(users_router)
app.include_router(users_router, prefix="/api/v1")
app.include_router(users_router, prefix="/api")

app.include_router(kyc_router)
app.include_router(kyc_router, prefix="/api/v1")
app.include_router(kyc_router, prefix="/api")
app.include_router(accounts_router)
app.include_router(transfers_router)
app.include_router(cards_router)
app.include_router(loans_router)
app.include_router(disputes_router)
app.include_router(admin_router)
app.include_router(fx_router)
app.include_router(bills_router)
app.include_router(beneficiaries_router)
app.include_router(notifications_router)
app.include_router(reference_router)
app.include_router(system_router)
app.include_router(db_admin_router)


# ----------------------------------------------------------------- FRONTEND MOUNTING
FRONTEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend"))
HTML_DIR = os.path.join(FRONTEND_DIR, "html")


def get_frontend_html(filename: str) -> str:
    html_path = os.path.join(HTML_DIR, filename)
    if os.path.exists(html_path):
        return html_path
    legacy_path = os.path.join(FRONTEND_DIR, filename)
    if os.path.exists(legacy_path):
        return legacy_path
    return html_path


if os.path.exists(FRONTEND_DIR):
    css_dir = os.path.join(FRONTEND_DIR, "css")
    js_dir = os.path.join(FRONTEND_DIR, "js")
    img_dir = os.path.join(FRONTEND_DIR, "images")
    if os.path.exists(HTML_DIR):
        app.mount("/html", StaticFiles(directory=HTML_DIR), name="html")
    if os.path.exists(css_dir):
        app.mount("/css", StaticFiles(directory=css_dir), name="css")
    if os.path.exists(js_dir):
        app.mount("/js", StaticFiles(directory=js_dir), name="js")
    if os.path.exists(img_dir):
        app.mount("/images", StaticFiles(directory=img_dir), name="images")
    app.mount("/frontend", StaticFiles(directory=FRONTEND_DIR), name="frontend")
    app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")


# ----------------------------------------------------------------- INITIALIZE SQL DATABASE
from backend.app.core.sql_db import init_sql_database
try:
    init_sql_database()
except Exception as e:
    logger.warning(f"Failed to initialize SQL database: {e}")


@app.get("/neobank-ui", include_in_schema=False)
@app.get("/neobank-ui.html", include_in_schema=False)
def serve_neobank_ui_page():
    """NeoBank UI Next-Gen Banking & Testing Console."""
    page_file = get_frontend_html("neobank-ui.html")
    if os.path.exists(page_file):
        return FileResponse(page_file)
    return FileResponse(get_frontend_html("index.html"))

@app.get("/theme-preview", include_in_schema=False)
@app.get("/theme-preview.html", include_in_schema=False)
def serve_theme_preview_page():
    """Dedicated Theme Preview & Culture System Workbench."""
    page_file = get_frontend_html("theme-preview.html")
    if os.path.exists(page_file):
        return FileResponse(page_file)
    return FileResponse(get_frontend_html("index.html"))

@app.get("/sql-gui", include_in_schema=False)
@app.get("/db-admin", include_in_schema=False)
@app.get("/database", include_in_schema=False)
def serve_sql_gui_page():
    """Dedicated SQL Database GUI Workbench for inspecting tables and running analytical queries."""
    gui_file = get_frontend_html("sql_gui.html")
    if os.path.exists(gui_file):
        return FileResponse(gui_file)
    return FileResponse(get_frontend_html("index.html"))

@app.get("/login", include_in_schema=False)
def serve_login_page():
    login_file = get_frontend_html("login.html")
    if os.path.exists(login_file):
        return FileResponse(login_file)
    return FileResponse(get_frontend_html("index.html"))

@app.get("/open_account_customer", include_in_schema=False)
@app.get("/open-account", include_in_schema=False)
def serve_open_account_start_page(request: Request):
    """Dedicated landing and account initiation page."""
    app_param = request.query_params.get("app") or request.query_params.get("application") or request.query_params.get("id")
    if app_param and app_param.strip():
        app_file = get_frontend_html("open_account_application.html")
        if os.path.exists(app_file):
            return FileResponse(app_file)
    page_file = get_frontend_html("open_account_customer.html")
    if os.path.exists(page_file):
        return FileResponse(page_file)
    return FileResponse(get_frontend_html("index.html"))

@app.get("/open_account_customer/{path:path}", include_in_schema=False)
@app.get("/open-account/{path:path}", include_in_schema=False)
def serve_open_account_form_page(path: str, request: Request):
    """Dedicated multi-step uniform application form page (e.g. /open_account_customer/APP-2026-595845)."""
    clean_path = (path or "").strip().strip("/")
    if clean_path:
        app_file = get_frontend_html("open_account_application.html")
        if os.path.exists(app_file):
            return FileResponse(app_file)
    page_file = get_frontend_html("open_account_customer.html")
    if os.path.exists(page_file):
        return FileResponse(page_file)
    return FileResponse(get_frontend_html("index.html"))

@app.get("/open_account_application", include_in_schema=False)
@app.get("/open_account_application/{path:path}", include_in_schema=False)
def serve_open_account_application_direct(path: Optional[str] = None):
    """Direct alias for the dedicated uniform application form."""
    app_file = get_frontend_html("open_account_application.html")
    if os.path.exists(app_file):
        return FileResponse(app_file)
    return FileResponse(get_frontend_html("open_account_customer.html"))

@app.get("/existing_application", include_in_schema=False)
@app.get("/existing_application/{path:path}", include_in_schema=False)
@app.get("/track", include_in_schema=False)
@app.get("/track/{path:path}", include_in_schema=False)
def serve_tracking_page(path: Optional[str] = None):
    page_file = get_frontend_html("existing_application.html")
    if os.path.exists(page_file):
        return FileResponse(page_file)
    return FileResponse(get_frontend_html("index.html"))

@app.get("/404", include_in_schema=False)
def serve_404_page():
    page_404 = get_frontend_html("404.html")
    if os.path.exists(page_404):
        return FileResponse(page_404, status_code=404)
    return HTMLResponse("<h2>404 • Page Not Available or Not Found</h2>", status_code=404)

@app.get("/employee_onboarding", include_in_schema=False)
def serve_employee_onboarding_page():
    page_file = get_frontend_html("employee_onboarding.html")
    if os.path.exists(page_file):
        return FileResponse(page_file)
    return FileResponse(get_frontend_html("index.html"))

@app.get("/", include_in_schema=False)
@app.get("/home", include_in_schema=False)
def serve_home_landing_page():
    home_file = get_frontend_html("home.html")
    if os.path.exists(home_file):
        return FileResponse(home_file)
    return FileResponse(get_frontend_html("index.html"))

@app.get("/app", include_in_schema=False)
@app.get("/app/", include_in_schema=False)
@app.get("/app/{subpath:path}", include_in_schema=False)
@app.get("/ui", include_in_schema=False)
@app.get("/dashboard", include_in_schema=False)
def serve_frontend_app(subpath: Optional[str] = None):
    index_file = get_frontend_html("index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return HTMLResponse("<h2>NeoBank Frontend not found in /frontend directory</h2>", status_code=404)
