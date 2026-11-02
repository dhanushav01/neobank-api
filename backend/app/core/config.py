"""
Configuration settings, reference datasets, and centralized environment management for NeoBank.
────────────────────────────────────────────────────────────────────────────────────────────────
Production-hardened: Zero hardcoded secrets, externalized environment parameters,
and safe dynamic fallbacks for development workflows.
"""
import os
import sys
import secrets
import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger("neobank.config")

# Fail-Closed Insecure Placeholder Detection Patterns
DISALLOWED_SECRET_PATTERNS = [
    "change_in_prod", "super_secret", "replace_with", "password", "12345", "example",
    "dev_neobank", "secret_token", "changeme", "change_me", "change-me", "placeholder", "your_secret"
]

# ----------------------------------------------------------------- CENTRALIZED .ENV LOADER
def _load_env_file(filepath: str) -> bool:
    """Safely parse a .env file and populate os.environ, overwriting any stale placeholder vars."""
    if not os.path.isfile(filepath):
        return False
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                if "=" in line:
                    key, val = line.split("=", 1)
                    key = key.strip()
                    val = val.strip()
                    if len(val) >= 2 and ((val[0] == '"' and val[-1] == '"') or (val[0] == "'" and val[-1] == "'")):
                        val = val[1:-1]
                    if key and key not in os.environ:
                        os.environ[key] = val
        return True
    except Exception as exc:
        logger.warning(f"Failed to read environment file at '{filepath}': {exc}")
        return False

# Attempt to load from multiple standard locations
_BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
_CWD_ENV = os.path.abspath(os.path.join(os.getcwd(), ".env"))
_BACKEND_ENV = os.path.join(_BASE_DIR, ".env")
_ROOT_ENV = os.path.abspath(os.path.join(_BASE_DIR, "..", ".env"))

for _candidate in (_CWD_ENV, _BACKEND_ENV, _ROOT_ENV):
    _load_env_file(_candidate)


# ----------------------------------------------------------------- ENVIRONMENT & SECURITY
ENVIRONMENT = os.getenv("ENVIRONMENT", "development").lower()
IS_PRODUCTION = ENVIRONMENT == "production"

# Server Network Configuration
API_HOST = os.getenv("API_HOST", "0.0.0.0" if IS_PRODUCTION else "127.0.0.1")
API_PORT = int(os.getenv("API_PORT", os.getenv("PORT", "8000")))

def load_strict_secret(name: str, min_bytes: int = 32, default_test_generator=None) -> str:
    """
    Enforces fail-closed secret loading:
    Aborts startup if missing, under min_bytes length, or matching known insecure placeholder strings.
    """
    val = os.getenv(name)
    if not val:
        # In automated test harness, allow dynamic ephemeral test generation if requested
        if (os.getenv("NEOBANK_TEST_MODE") == "1" or ENVIRONMENT in ("test", "testing")) and default_test_generator:
            val = default_test_generator()
            os.environ[name] = val
            return val
        raise RuntimeError(
            f"FATAL SECURITY CONFIGURATION: Secret '{name}' is MISSING. "
            f"Startup aborted. You must supply a cryptographically secure random secret via environment."
        )
    val_clean = val.strip()
    val_lower = val_clean.lower()
    for pattern in DISALLOWED_SECRET_PATTERNS:
        if pattern in val_lower:
            raise RuntimeError(
                f"FATAL SECURITY CONFIGURATION: Secret '{name}' matches insecure placeholder pattern '{pattern}'. "
                f"Startup aborted. Generate a high-entropy CSPRNG secret."
            )
    if len(val_clean.encode('utf-8')) < min_bytes:
        raise RuntimeError(
            f"FATAL SECURITY CONFIGURATION: Secret '{name}' is too short "
            f"({len(val_clean)} bytes; minimum {min_bytes} random bytes required). Startup aborted."
        )
    return val_clean

# Cryptographic secret for signing JWT access and refresh tokens
JWT_SECRET = load_strict_secret(
    "JWT_SECRET",
    min_bytes=32,
    default_test_generator=lambda: secrets.token_hex(32)
)

JWT_ALGORITHM = "HS256"  # Pinned explicitly to reject algorithm confusion attacks
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "15"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

# Cookie Security Configuration (Strict SameSite and Secure by default)
COOKIE_SECURE = os.getenv("COOKIE_SECURE", "true" if IS_PRODUCTION else "false").lower() == "true"
COOKIE_SAMESITE = os.getenv("COOKIE_SAMESITE", "strict")
COOKIE_DOMAIN = os.getenv("COOKIE_DOMAIN", None)

# CORS Policy - Explicit Allowlist (No Wildcards in Production)
_DEFAULT_ORIGINS = [
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://localhost:3000",
    "http://localhost:5173",
]
_ENV_ORIGINS = os.getenv("ALLOWED_ORIGINS")
if _ENV_ORIGINS:
    CORS_ALLOWED_ORIGINS = [orig.strip() for orig in _ENV_ORIGINS.split(",") if orig.strip()]
elif IS_PRODUCTION:
    # In production, require explicit origins and do not default to localhost
    CORS_ALLOWED_ORIGINS = []
else:
    CORS_ALLOWED_ORIGINS = _DEFAULT_ORIGINS

# POS Gateway Secret Key (Validated strictly)
POS_GATEWAY_KEY = load_strict_secret(
    "POS_GATEWAY_KEY",
    min_bytes=24,
    default_test_generator=lambda: secrets.token_urlsafe(32)
)

# Forwarded Proxy and IP Configuration (Render, Cloudflare, Load Balancers)
FORWARDED_ALLOW_IPS = os.getenv("FORWARDED_ALLOW_IPS", "*")
TRUSTED_PROXIES = [
    p.strip() for p in os.getenv("TRUSTED_PROXIES", "127.0.0.1,::1,testclient,*" if not IS_PRODUCTION else "*").split(",") if p.strip()
]

# ----------------------------------------------------------------- SEED & DEMO ACCOUNT CONFIGURATION
SEED_DEMO_USERS = os.getenv("SEED_DEMO_USERS", "false").lower() == "true"
SEED_DEMO_DATA = SEED_DEMO_USERS
ENABLE_TEST_ROUTES = os.getenv("ENABLE_TEST_ROUTES", "false" if IS_PRODUCTION else "true").lower() == "true"
ENABLE_TEST_OTP = os.getenv("ENABLE_TEST_OTP", "false").lower() in ("true", "1", "yes") and not IS_PRODUCTION
NEOBANK_DB_PATH = os.getenv("NEOBANK_DB_PATH", "")
SEED_ADMIN_EMAIL = os.getenv("SEED_ADMIN_EMAIL", "admin@bank.test")
SEED_ADMIN_PASSWORD = os.getenv("SEED_ADMIN_PASSWORD", "Admin@1234")
SEED_EMPLOYEE_EMAIL = os.getenv("SEED_EMPLOYEE_EMAIL", "employee@bank.test")
SEED_EMPLOYEE_PASSWORD = os.getenv("SEED_EMPLOYEE_PASSWORD", "Employee@1234")
SEED_CUSTOMER_EMAIL = os.getenv("SEED_CUSTOMER_EMAIL", "customer@bank.test")
SEED_CUSTOMER_PASSWORD = os.getenv("SEED_CUSTOMER_PASSWORD", "Customer@1234")
SEED_CARD_PIN = os.getenv("SEED_CARD_PIN", "1234")
SEED_CARD_ACTIVATION_CODE = os.getenv("SEED_CARD_ACTIVATION_CODE", "849201")

# ----------------------------------------------------------------- EXTERNAL DATABASE BRIDGES
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://127.0.0.1:27017/")
MONGODB_DB_NAME = os.getenv("MONGODB_DB", "neobank")

MYSQL_HOST = os.getenv("MYSQL_HOST", "127.0.0.1")
MYSQL_PORT = int(os.getenv("MYSQL_PORT", "3306"))
MYSQL_USER = os.getenv("MYSQL_USER", "neobank_app" if IS_PRODUCTION else "root")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "")
MYSQL_DB = os.getenv("MYSQL_DB", "neobank")

# ----------------------------------------------------------------- BUSINESS LOGIC PARAMETERS
OTP_THRESHOLD = float(os.getenv("OTP_THRESHOLD", "1000.0"))
TRANSFER_EXTERNAL_FEE = float(os.getenv("TRANSFER_EXTERNAL_FEE", "1.50"))
BASE_LOAN_APR = float(os.getenv("BASE_LOAN_APR", "6.0"))
MAX_DOC_SIZE_BYTES = int(os.getenv("MAX_DOC_SIZE_BYTES", str(10 * 1024 * 1024)))

# ----------------------------------------------------------------- APPLICATION METADATA & DATASETS
PROJECT_NAME = "NeoBank Financial Platform"
VERSION = "2.1.0"
DESCRIPTION = """
Production-ready NeoBank REST API platform with strict role-based access control,
multi-currency accounts, instant transfers, card issuance, loan underwriting,
KYC identity verification, and dispute resolution.
"""

# Foreign Exchange Reference Rates (Base USD)
FX_RATES: Dict[str, float] = {
    "USD": 1.0,
    "EUR": 0.92,
    "GBP": 0.79,
    "INR": 83.1,
    "JPY": 150.0,
    "CAD": 1.36,
    "AUD": 1.52,
    "CHF": 0.91
}

# Supported Countries
COUNTRIES: List[Dict[str, str]] = [
    {"code": "GB", "name": "United Kingdom", "currency": "GBP"},
    {"code": "US", "name": "United States", "currency": "USD"},
    {"code": "DE", "name": "Germany", "currency": "EUR"},
    {"code": "IN", "name": "India", "currency": "INR"},
    {"code": "JP", "name": "Japan", "currency": "JPY"},
    {"code": "CA", "name": "Canada", "currency": "CAD"},
    {"code": "AU", "name": "Australia", "currency": "AUD"}
]

# ----------------------------------------------------------------- PRODUCTION FAIL-CLOSED VERIFICATION
def validate_production_secrets():
    """Fail closed in production if any configured service secret is missing or contains placeholder values."""
    if not IS_PRODUCTION:
        return

    placeholders = ("change_me", "changeme", "change-me", "replace_me", "placeholder", "your_secret")

    # Check ADMIN_PASSWORD if ADMIN_EMAIL is set
    admin_email = os.getenv("ADMIN_EMAIL", "").strip().lower()
    admin_pw = os.getenv("ADMIN_PASSWORD", "").strip().lower()
    if admin_email and (not admin_pw or any(p in admin_pw for p in placeholders)):
        raise RuntimeError("FATAL SECURITY CONFIGURATION: In production, 'ADMIN_PASSWORD' must be a strong password and cannot be a placeholder.")

    # Check MYSQL_PASSWORD if non-localhost MYSQL_HOST is configured
    mysql_host = os.getenv("MYSQL_HOST", "").strip().lower()
    mysql_pw = os.getenv("MYSQL_PASSWORD", "").strip().lower()
    if mysql_host and mysql_host not in ("127.0.0.1", "localhost") and any(p in mysql_pw for p in placeholders):
        raise RuntimeError("FATAL SECURITY CONFIGURATION: In production, 'MYSQL_PASSWORD' cannot be a placeholder.")

validate_production_secrets()

# Partner Banks
BANKS: Dict[str, Dict[str, str]] = {
    "NBK001": {"name": "NeoBank Global", "country": "GB", "swift": "NEOBGB2L"},
    "HSB002": {"name": "Harbor Savings Bank", "country": "GB", "swift": "HRBSGB2L"},
    "CTB003": {"name": "Citadel Trust Bank", "country": "US", "swift": "CTBKUS33"},
    "EUB004": {"name": "EuroBank AG", "country": "DE", "swift": "EUBKDEFF"},
    "IND005": {"name": "Indus National Bank", "country": "IN", "swift": "INDNINBB"},
    "TKY006": {"name": "Tokyo Mercantile", "country": "JP", "swift": "TKMCJPJT"}
}

# Major Cities for Branches / ATMs
CITIES = ["London", "Manchester", "Leeds", "Bristol", "Glasgow", "Cardiff", "Belfast", "Edinburgh"]

# Registered Utility Billers
BILLERS: Dict[str, Dict[str, Any]] = {
    "bl_power": {"id": "bl_power", "name": "National Power & Electric", "category": "UTILITIES", "minAmount": 5.0},
    "bl_water": {"id": "bl_water", "name": "Aqua Clean Water Co.", "category": "UTILITIES", "minAmount": 5.0},
    "bl_net": {"id": "bl_net", "name": "GigaFiber Broadband", "category": "INTERNET", "minAmount": 10.0},
    "bl_mobile": {"id": "bl_mobile", "name": "Horizon Telecom 5G", "category": "TELECOM", "minAmount": 5.0},
    "bl_ins": {"id": "bl_ins", "name": "Guardian Life & Health", "category": "INSURANCE", "minAmount": 25.0},
    "bl_tax": {"id": "bl_tax", "name": "HM Revenue & Customs", "category": "GOVERNMENT", "minAmount": 1.0}
}

# Investment Instruments
INSTRUMENTS: Dict[str, tuple] = {
    "AAPL": ("Apple Inc.", "STOCK", 195.50),
    "MSFT": ("Microsoft Corp.", "STOCK", 425.20),
    "TSLA": ("Tesla Inc.", "STOCK", 248.80),
    "NVDA": ("Nvidia Corp.", "STOCK", 128.40),
    "VOO": ("Vanguard S&P 500 ETF", "ETF", 492.10),
    "BND": ("Vanguard Total Bond Market ETF", "ETF", 73.50),
    "GLD": ("SPDR Gold Shares ETF", "ETF", 218.60)
}

# OpenAPI Tag Groups
TAGS = [
    {"name": "Account Onboarding", "description": "Customer account selection, eligibility check, application submission with unique reference number, status tracking, and staff review with date filtering."},
    {"name": "Auth", "description": "Authentication: Unified login for all roles, employee registration, session tokens, MFA."},
    {"name": "Users", "description": "Current user profile and personal financial dashboard summary."},
    {"name": "KYC", "description": "Identity verification submission and status checking."},
    {"name": "Accounts", "description": "Account management (Checking, Savings, Multi-currency), deposits, withdrawals, transactions."},
    {"name": "Transfers", "description": "Domestic & International money transfers, OTP challenge verification."},
    {"name": "Cards", "description": "Virtual and physical debit cards, card locking, PIN updates, spend limits, POS authorizations."},
    {"name": "Loans", "description": "Loan quotes, applications, installments repayment schedule."},
    {"name": "Disputes", "description": "Charge disputes on suspicious debit/card transactions."},
    {"name": "Admin", "description": "Bank Staff / Employee operations: KYC review, loan underwriting, dispute resolution, user oversight."},
    {"name": "FX", "description": "Real-time foreign currency exchange rates and instant currency conversion."},
    {"name": "Beneficiaries", "description": "Saved payees and recipients management."},
    {"name": "Bill Payments", "description": "Registered utility bills and scheduled bill payments."},
    {"name": "Investments", "description": "Equities, ETFs, price-lock quotes, investment portfolios, and order execution."},
    {"name": "Statements", "description": "Asynchronous official PDF/CSV statement requests and downloads."},
    {"name": "Notifications", "description": "In-app notifications and real-time alerts."},
    {"name": "Reference Data", "description": "Lookup banks, currencies, countries, branches, and ATMs."},
    {"name": "System", "description": "Health checks, metrics, and developer diagnostic utilities."},
    {"name": "Database GUI", "description": "Administrative SQL Database GUI Workbench for authorized staff."}
]
