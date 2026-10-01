"""
Reference Data Router: Public lookup data for currencies, banks, countries, branches, and ATMs.
"""
from typing import Optional
from fastapi import APIRouter, Query

from backend.app.core.config import FX_RATES, COUNTRIES, BANKS, CITIES
from backend.app.core.utils import fail, paginate

router = APIRouter(tags=["Reference Data"])

BRANCHES = [
    {"id": f"br_{i + 1:02d}", "name": f"NeoBank {city} Central", "city": city, "country": "GB", "openHours": "09:00-17:00"}
    for i, city in enumerate(CITIES)
]

ATMS = [
    {
        "id": f"atm_{i + 1:02d}",
        "city": CITIES[i % len(CITIES)],
        "open24h": i % 2 == 0,
        "cashDeposit": i % 3 == 0,
        "location": f"Site {i + 1} - Central Station, {CITIES[i % len(CITIES)]}"
    }
    for i in range(16)
]

@router.get("/reference/currencies")
def get_currencies():
    """List supported multi-currency codes and relative FX rates."""
    return [{"code": c, "usdRate": r} for c, r in FX_RATES.items()]

@router.get("/reference/countries")
def get_countries(currency: Optional[str] = None):
    """List operational country jurisdictions."""
    return [c for c in COUNTRIES if not currency or c["currency"] == currency]

@router.get("/reference/banks")
def get_banks(country: Optional[str] = Query(None, pattern="^[A-Z]{2}$")):
    """List clearing bank codes and SWIFT identifiers."""
    return [{"code": k, **v} for k, v in BANKS.items() if not country or v["country"] == country]

@router.get("/reference/banks/{bankCode}")
def get_bank(bankCode: str):
    """Lookup specific bank clearing details."""
    bank = BANKS.get(bankCode)
    if not bank:
        fail(404, "Bank clearing institution not found", "BANK_NOT_FOUND")
    return {"code": bankCode, **bank}

@router.get("/branches")
def get_branches(city: Optional[str] = None, page_num: int = Query(1, ge=1, alias="page"), limit_num: int = Query(10, ge=1, le=50, alias="limit")):
    """Locate bank branches."""
    items = [b for b in BRANCHES if not city or b["city"].lower() == city.lower()]
    return paginate(items, page_num, limit_num)

@router.get("/atms")
def get_atms(city: Optional[str] = None, open24h: Optional[bool] = None, cashDeposit: Optional[bool] = None):
    """Locate ATMs and cash deposit kiosks."""
    return [
        a for a in ATMS
        if (not city or a["city"].lower() == city.lower())
        and (open24h is None or a["open24h"] == open24h)
        and (cashDeposit is None or a["cashDeposit"] == cashDeposit)
    ]
