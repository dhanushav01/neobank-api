"""
FX Router: Live currency exchange rates, quote locking, and cross-currency exchanges.
"""
import time
from typing import Dict, Any
from fastapi import APIRouter, Depends, Query, status

from backend.app.core.config import FX_RATES
from backend.app.core.database import DB, get_owned, post_transaction, audit_log
from backend.app.core.security import get_current_user
from backend.app.core.utils import fail, generate_id, format_money, calculate_fx
from backend.app.models.schemas import FXQuoteRequest, FXExchangeRequest

router = APIRouter(prefix="/fx", tags=["FX"])

@router.get("/rates")
def get_exchange_rates(base: str = Query("USD", pattern="^[A-Z]{3}$")):
    """Get live currency exchange rates against a base currency."""
    if base not in FX_RATES:
        fail(400, f"Unsupported base currency: {base}", "BAD_CURRENCY")
    return {
        "base": base,
        "rates": {cur: calculate_fx(base, cur) for cur in FX_RATES}
    }

@router.post("/quotes", status_code=status.HTTP_201_CREATED)
def lock_fx_quote(request: FXQuoteRequest, user: Dict[str, Any] = Depends(get_current_user)):
    """Generate a 60-second price-locked foreign exchange conversion quote."""
    if request.fromCurrency == request.toCurrency:
        fail(422, "Source and destination currencies must be different", "SAME_CURRENCY")

    rate = calculate_fx(request.fromCurrency, request.toCurrency)
    quote_id = generate_id("fxq")
    converted_amount = format_money(request.amount * rate)

    quote_record = {
        "quoteId": quote_id,
        "ownerId": user["id"],
        **request.model_dump(),
        "rate": rate,
        "toAmount": converted_amount,
        "expiresAt": time.time() + 60,
        "used": False
    }
    DB["fx_quotes"][quote_id] = quote_record

    return {
        "quoteId": quote_id,
        "fromCurrency": request.fromCurrency,
        "toCurrency": request.toCurrency,
        "amount": request.amount,
        "rate": rate,
        "toAmount": converted_amount,
        "validForSeconds": 60
    }

@router.post("/exchanges", status_code=status.HTTP_201_CREATED)
def execute_fx_exchange(request: FXExchangeRequest, user: Dict[str, Any] = Depends(get_current_user)):
    """Execute currency exchange between two user accounts using locked quote."""
    quote = DB["fx_quotes"].get(request.quoteId)
    if not quote or quote.get("ownerId") != user["id"]:
        fail(404, "FX quote not found or unauthorized", "QUOTE_NOT_FOUND")

    if quote.get("used"):
        fail(409, "This FX quote has already been executed", "QUOTE_USED")

    if quote.get("expiresAt") < time.time():
        fail(410, "FX quote has expired (validity is 60s)", "QUOTE_EXPIRED")

    source_acc = get_owned("accounts", request.fromAccountId, user, "source account")
    dest_acc = get_owned("accounts", request.toAccountId, user, "destination account")

    if source_acc["currency"] != quote["fromCurrency"] or dest_acc["currency"] != quote["toCurrency"]:
        fail(422, "Account currencies do not match the locked FX quote", "CURRENCY_MISMATCH")

    # Debit source currency and credit target currency
    post_transaction(source_acc, "FX_OUT", -quote["amount"], reference=f"FX to {quote['toCurrency']}")
    post_transaction(dest_acc, "FX_IN", quote["toAmount"], reference=f"FX from {quote['fromCurrency']}")

    quote["used"] = True
    exchange_id = generate_id("fxe")
    audit_log(user["id"], "FX_EXCHANGE", exchange_id)

    return {
        "exchangeId": exchange_id,
        "fromCurrency": quote["fromCurrency"],
        "debitedAmount": quote["amount"],
        "toCurrency": quote["toCurrency"],
        "creditedAmount": quote["toAmount"],
        "rate": quote["rate"]
    }
