"""
Users Router: User profile management and aggregated dashboard metrics.
"""
from typing import Dict, Any
from fastapi import APIRouter, Depends

from backend.app.core.database import DB, list_owned
from backend.app.core.security import get_current_user
from backend.app.core.utils import format_money
from backend.app.models.schemas import ProfileUpdateRequest

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/me")
def get_profile(user: Dict[str, Any] = Depends(get_current_user)):
    """Retrieve full details of the authenticated user without sensitive credentials."""
    return {k: v for k, v in user.items() if k not in ("password", "mfa")}

@router.patch("/me/profile")
def update_profile(request: ProfileUpdateRequest, user: Dict[str, Any] = Depends(get_current_user)):
    """Update profile fields such as contact phone and address."""
    update_data = request.model_dump(mode="json", exclude_none=True)
    if "address" in update_data and update_data["address"]:
        user["profile"]["address"].update(update_data["address"])
        del update_data["address"]
    user["profile"].update(update_data)
    return user["profile"]

@router.get("/me/summary")
def get_user_dashboard_summary(user: Dict[str, Any] = Depends(get_current_user)):
    """Aggregated financial dashboard summary for the authenticated customer."""
    user_accounts = list_owned("accounts", user)
    user_cards = list_owned("cards", user)
    user_loans = [l for l in list_owned("loans", user) if l.get("status") == "ACTIVE"]

    # Calculate balances grouped by currency
    balance_by_currency = {}
    for acc in user_accounts:
        cur = acc.get("currency", "USD")
        balance_by_currency[cur] = format_money(balance_by_currency.get(cur, 0.0) + acc.get("balance", 0.0))

    unread_alerts = [
        n for n in DB["notifications"].values()
        if n.get("userId") == user["id"] and not n.get("read")
    ]

    return {
        "userId": user["id"],
        "role": user.get("role", "CUSTOMER"),
        "accountsCount": len(user_accounts),
        "totalBalanceByCurrency": balance_by_currency,
        "cardsCount": len(user_cards),
        "activeLoansCount": len(user_loans),
        "unreadNotificationsCount": len(unread_alerts)
    }
