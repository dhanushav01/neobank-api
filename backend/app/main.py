"""
NeoBank Main FastAPI Application Entrypoint.
Orchestrates CORS middleware, modular routers, global exception handlers, and documentation.
"""
import os
from typing import Optional
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from backend.app.core.config import PROJECT_NAME, VERSION, DESCRIPTION, TAGS
from backend.app.core.utils import ApiError

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

app = FastAPI(
    title=PROJECT_NAME,
    version=VERSION,
    description=DESCRIPTION,
    openapi_tags=TAGS,
    docs_url="/docs",
    redoc_url="/redoc",
    swagger_ui_parameters={
        "docExpansion": "none",
        "filter": True,
        "persistAuthorization": True,
        "displayRequestDuration": True,
        "tryItOutEnabled": True
    }
)

# ----------------------------------------------------------------- CORS Middleware
# Allows separated frontends (Live Server, Vite, static files, local ports) to communicate with API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------------------------------------------------- Exception Handlers
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
            "/auth/", "/onboarding/", "/users/", "/kyc/", "/accounts/",
            "/transfers/", "/cards/", "/loans/", "/disputes/", "/admin/",
            "/fx/", "/bills/", "/beneficiaries/", "/notifications/",
            "/reference/", "/system/", "/db-admin/", "/api/"
        )
        is_api = any(path.startswith(prefix) for prefix in api_prefixes)
        if ("text/html" in accept or "*/*" in accept) and not is_api:
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

# ----------------------------------------------------------------- Mount Modular Routers
app.include_router(auth_router)
app.include_router(onboarding_router)
app.include_router(users_router)
app.include_router(kyc_router)
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

# ----------------------------------------------------------------- Frontend Mounting
# The frontend code lives cleanly and exclusively in ../../frontend/
FRONTEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend"))

if os.path.exists(FRONTEND_DIR):
    css_dir = os.path.join(FRONTEND_DIR, "css")
    js_dir = os.path.join(FRONTEND_DIR, "js")
    img_dir = os.path.join(FRONTEND_DIR, "images")
    if os.path.exists(css_dir):
        app.mount("/css", StaticFiles(directory=css_dir), name="css")
    if os.path.exists(js_dir):
        app.mount("/js", StaticFiles(directory=js_dir), name="js")
    if os.path.exists(img_dir):
        app.mount("/images", StaticFiles(directory=img_dir), name="images")
    app.mount("/frontend", StaticFiles(directory=FRONTEND_DIR), name="frontend")
    # Backward compatibility: route any /static requests directly to FRONTEND_DIR
    app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")

# ----------------------------------------------------------------- Initialize SQL Database
from backend.app.core.sql_db import init_sql_database
try:
    init_sql_database()
except Exception as e:
    print(f"Warning: Failed to initialize SQL database: {e}")

# ----------------------------------------------------------------- Dedicated Page Routes
@app.get("/sql-gui", include_in_schema=False)
@app.get("/db-admin", include_in_schema=False)
@app.get("/database", include_in_schema=False)
def serve_sql_gui_page():
    """Dedicated SQL Database GUI Workbench for inspecting tables and running queries."""
    gui_file = os.path.join(FRONTEND_DIR, "sql_gui.html")
    if os.path.exists(gui_file):
        return FileResponse(gui_file)
    return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))

@app.get("/login", include_in_schema=False)
def serve_login_page():
    """Dedicated login page."""
    login_file = os.path.join(FRONTEND_DIR, "login.html")
    if os.path.exists(login_file):
        return FileResponse(login_file)
    return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))

@app.get("/open_account_customer", include_in_schema=False)
@app.get("/open_account_customer/{path:path}", include_in_schema=False)
@app.get("/open-account", include_in_schema=False)
@app.get("/open-account/{path:path}", include_in_schema=False)
def serve_open_account_page(path: Optional[str] = None):
    """Dedicated customer account opening page with benefits, timeline, and uniform bank form."""
    page_file = os.path.join(FRONTEND_DIR, "open_account_customer.html")
    if os.path.exists(page_file):
        return FileResponse(page_file)
    return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))

@app.get("/existing_application", include_in_schema=False)
@app.get("/existing_application/{path:path}", include_in_schema=False)
@app.get("/track", include_in_schema=False)
@app.get("/track/{path:path}", include_in_schema=False)
def serve_tracking_page(path: Optional[str] = None):
    """Dedicated application status tracking page supporting direct links and subpaths."""
    page_file = os.path.join(FRONTEND_DIR, "existing_application.html")
    if os.path.exists(page_file):
        return FileResponse(page_file)
    return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))

@app.get("/404", include_in_schema=False)
def serve_404_page():
    """Universal 404 Page Not Available or Not Found error page."""
    page_404 = os.path.join(FRONTEND_DIR, "404.html")
    if os.path.exists(page_404):
        return FileResponse(page_404, status_code=404)
    return HTMLResponse("<h2>404 • Page Not Available or Not Found</h2>", status_code=404)

@app.get("/employee_onboarding", include_in_schema=False)
def serve_employee_onboarding_page():
    """Dedicated bank employee onboarding page."""
    page_file = os.path.join(FRONTEND_DIR, "employee_onboarding.html")
    if os.path.exists(page_file):
        return FileResponse(page_file)
    return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))

@app.get("/", include_in_schema=False)
@app.get("/home", include_in_schema=False)
def serve_home_landing_page():
    """Serve the public NeoBank landing page explaining the bank with links to Login, Open Account, and Track."""
    home_file = os.path.join(FRONTEND_DIR, "home.html")
    if os.path.exists(home_file):
        return FileResponse(home_file)
    return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))

@app.get("/app", include_in_schema=False)
@app.get("/app/", include_in_schema=False)
@app.get("/app/{subpath:path}", include_in_schema=False)
@app.get("/ui", include_in_schema=False)
@app.get("/dashboard", include_in_schema=False)
def serve_frontend_app(subpath: Optional[str] = None):
    """Serve the master core banking dashboard and staff portal."""
    index_file = os.path.join(FRONTEND_DIR, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return HTMLResponse("<h2>NeoBank Frontend not found in /frontend directory</h2>", status_code=404)


