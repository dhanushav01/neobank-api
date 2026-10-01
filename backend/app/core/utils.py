"""
Utility functions, custom exceptions, and helpers for business logic and data access.
"""
import uuid
import time
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from backend.app.core.config import FX_RATES

class ApiError(Exception):
    """Unified application API exception with HTTP status code and error details."""
    def __init__(self, status: int, message: str, code: Optional[str] = None, details: Any = None):
        self.status = status
        self.message = message
        self.code = code or f"HTTP_{status}"
        self.details = details
        super().__init__(message)

def fail(status: int, message: str, code: Optional[str] = None, details: Any = None) -> None:
    """Convenience helper to abort request with an ApiError."""
    raise ApiError(status, message, code, details)

def now_iso() -> str:
    """Return current UTC timestamp in ISO 8601 format."""
    return datetime.now(timezone.utc).isoformat(timespec="seconds")

def generate_id(prefix: str) -> str:
    """Generate a clean, collision-free entity identifier with prefix (e.g. acc_8a7d3f1c)."""
    return f"{prefix}_{uuid.uuid4().hex[:8]}"

def format_money(amount: float) -> float:
    """Format and round financial amount to 2 decimal places."""
    return round(float(amount) + 0.0, 2)

def paginate(items: List[Any], page: int = 1, limit: int = 20) -> Dict[str, Any]:
    """Slice and wrap items with standardized pagination metadata."""
    total = len(items)
    start = (page - 1) * limit
    return {
        "data": items[start:start + limit],
        "page": page,
        "limit": limit,
        "total": total
    }

def calculate_fx(from_cur: str, to_cur: str) -> float:
    """Calculate conversion rate between two currencies using base USD rates."""
    if from_cur not in FX_RATES or to_cur not in FX_RATES:
        fail(400, f"Unsupported currency pair: {from_cur}/{to_cur}", "BAD_CURRENCY")
    return round(FX_RATES[to_cur] / FX_RATES[from_cur], 6)

def calculate_emi(principal: float, apr: float, term_months: int) -> float:
    """Calculate monthly loan installment using amortization formula."""
    monthly_rate = apr / 1200.0
    if monthly_rate == 0:
        return format_money(principal / term_months)
    factor = (1 + monthly_rate) ** term_months
    monthly_payment = principal * monthly_rate * factor / (factor - 1)
    return format_money(monthly_payment)
