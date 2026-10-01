"""
Cards Router: Debit card issuance, PIN management, temporary blocking, limits, and POS authorization.
"""
import random
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, status

from backend.app.core.database import DB, get_owned, list_owned, post_transaction, audit_log, send_notification
from backend.app.core.security import get_current_user
from backend.app.core.utils import fail, generate_id, now_iso
from backend.app.models.schemas import (
    CardCreateRequest, CardLimits, CardActivateRequest,
    CardBlockRequest, CardPinChangeRequest, CardAuthorizeRequest
)

router = APIRouter(tags=["Cards"])

def sanitize_card_output(card: Dict[str, Any]) -> Dict[str, Any]:
    """Strip secret PIN from public card dictionary."""
    return {k: v for k, v in card.items() if k != "pin"}

@router.post("/accounts/{accountId}/cards", status_code=status.HTTP_201_CREATED)
def issue_card(accountId: str, request: CardCreateRequest, user: Dict[str, Any] = Depends(get_current_user)):
    """Issue a new virtual or physical Visa/Mastercard linked to an active account."""
    account = get_owned("accounts", accountId, user, "account")
    if account["status"] != "ACTIVE":
        fail(409, f"Account is {account['status']}. Cards can only be issued for ACTIVE accounts", "ACCOUNT_NOT_ACTIVE")

    card_id = generate_id("crd")
    activation_code = f"{random.randint(0, 999999):06d}"
    last_four = f"{random.randint(1000, 9999):04d}"

    card_record = {
        "id": card_id,
        "ownerId": user["id"],
        "accountId": accountId,
        "type": request.type,
        "network": request.network,
        "cardholderName": request.cardholderName.upper(),
        "last4": last_four,
        "status": "INACTIVE",
        "activationCode": activation_code,
        "pin": None,
        "limits": request.limits.model_dump(),
        "shippingAddress": request.shippingAddress.model_dump() if request.shippingAddress else None,
        "createdAt": now_iso()
    }
    DB["cards"][card_id] = card_record

    audit_log(user["id"], "CARD_ISSUE", card_id)
    send_notification(user["id"], f"New {request.network} {request.type} card issued (*{last_four}). Activation code: {activation_code}")

    res = sanitize_card_output(card_record)
    res["testModeActivationCode"] = activation_code
    return res

@router.get("/cards")
def list_cards(status_filter: Optional[str] = None, user: Dict[str, Any] = Depends(get_current_user)):
    """List all cards associated with the authenticated user."""
    cards = [
        sanitize_card_output(c) for c in list_owned("cards", user)
        if not status_filter or c.get("status") == status_filter
    ]
    return cards

@router.get("/cards/{cardId}")
def get_card(cardId: str, user: Dict[str, Any] = Depends(get_current_user)):
    """Retrieve card details."""
    card = get_owned("cards", cardId, user, "card")
    return sanitize_card_output(card)

@router.post("/cards/{cardId}/activate")
def activate_card(cardId: str, request: CardActivateRequest, user: Dict[str, Any] = Depends(get_current_user)):
    """Activate an inactive card using the 6-digit code and set its initial 4-digit PIN."""
    card = get_owned("cards", cardId, user, "card")
    if card.get("status") != "INACTIVE":
        fail(409, f"Card is in {card.get('status')} state and cannot be activated", "BAD_STATE")

    if request.activationCode != card.get("activationCode"):
        fail(400, "Invalid card activation code provided", "BAD_ACTIVATION_CODE")

    card["status"] = "ACTIVE"
    card["pin"] = request.pin

    send_notification(user["id"], f"Card *{card['last4']} is now ACTIVE and ready for transactions.")
    audit_log(user["id"], "CARD_ACTIVATE", cardId)
    return sanitize_card_output(card)

@router.post("/cards/{cardId}/block")
def block_card(cardId: str, request: CardBlockRequest, user: Dict[str, Any] = Depends(get_current_user)):
    """Lock or block a card (temporary lock, lost, stolen, fraud)."""
    card = get_owned("cards", cardId, user, "card")
    if card.get("status") not in ("ACTIVE", "INACTIVE"):
        fail(409, f"Cannot block a card in {card.get('status')} state", "BAD_STATE")

    card["status"] = "BLOCKED"
    card["blockReason"] = request.reason
    send_notification(user["id"], f"Card *{card['last4']} has been BLOCKED (Reason: {request.reason}).")
    audit_log(user["id"], "CARD_BLOCK", cardId)
    return sanitize_card_output(card)

@router.post("/cards/{cardId}/unblock")
def unblock_card(cardId: str, user: Dict[str, Any] = Depends(get_current_user)):
    """Unlock a temporarily blocked card."""
    card = get_owned("cards", cardId, user, "card")
    if card.get("status") != "BLOCKED" or card.get("blockReason") != "TEMPORARY":
        fail(409, "Only cards with a TEMPORARY lock can be unblocked by the user. Contact customer support for fraud/lost blocks.", "BAD_STATE")

    card["status"] = "ACTIVE"
    card.pop("blockReason", None)
    send_notification(user["id"], f"Temporary lock removed from Card *{card['last4']}.")
    audit_log(user["id"], "CARD_UNBLOCK", cardId)
    return sanitize_card_output(card)

@router.put("/cards/{cardId}/limits")
def update_card_limits(cardId: str, request: CardLimits, user: Dict[str, Any] = Depends(get_current_user)):
    """Modify daily, monthly, and ATM withdrawal limits on the card."""
    card = get_owned("cards", cardId, user, "card")
    card["limits"] = request.model_dump()
    audit_log(user["id"], "CARD_LIMITS", cardId)
    return sanitize_card_output(card)

@router.post("/cards/{cardId}/pin", status_code=status.HTTP_204_NO_CONTENT)
def change_card_pin(cardId: str, request: CardPinChangeRequest, user: Dict[str, Any] = Depends(get_current_user)):
    """Change the card security PIN."""
    card = get_owned("cards", cardId, user, "card")
    if card.get("status") != "ACTIVE":
        fail(409, "Card must be ACTIVE to change PIN", "BAD_STATE")

    if card.get("pin") != request.oldPin:
        fail(400, "Current card PIN does not match", "BAD_PIN")

    card["pin"] = request.newPin
    audit_log(user["id"], "CARD_PIN_CHANGE", cardId)

@router.delete("/cards/{cardId}", status_code=status.HTTP_204_NO_CONTENT)
def cancel_card(cardId: str, user: Dict[str, Any] = Depends(get_current_user)):
    """Permanently cancel a card."""
    card = get_owned("cards", cardId, user, "card")
    card["status"] = "CANCELLED"
    audit_log(user["id"], "CARD_CANCEL", cardId)

@router.post("/cards/{cardId}/authorize")
def authorize_purchase(cardId: str, request: CardAuthorizeRequest, user: Dict[str, Any] = Depends(get_current_user)):
    """Simulate a Point-of-Sale (POS) or e-commerce merchant purchase authorization."""
    card = get_owned("cards", cardId, user, "card")
    account = DB["accounts"].get(card["accountId"])

    def decline(reason_code: str):
        return {
            "authorizationId": generate_id("auth"),
            "status": "DECLINED",
            "reason": reason_code,
            "merchant": request.merchant.name,
            "amount": request.amount
        }

    if card.get("status") != "ACTIVE":
        return decline("CARD_NOT_ACTIVE")

    if card.get("type") == "PHYSICAL" and request.pin and request.pin != card.get("pin"):
        return decline("BAD_PIN")

    if request.amount > card.get("limits", {}).get("daily", 5000.0):
        return decline("DAILY_LIMIT_EXCEEDED")

    if account["currency"] != request.currency:
        return decline("CURRENCY_MISMATCH")

    if account["balance"] + account.get("overdraftLimit", 0.0) < request.amount:
        return decline("INSUFFICIENT_FUNDS")

    # Post purchase debit transaction
    tx = post_transaction(
        account,
        "CARD_PURCHASE",
        -request.amount,
        reference=request.merchant.name,
        meta={"cardId": cardId, "merchant": request.merchant.model_dump()}
    )

    return {
        "authorizationId": generate_id("auth"),
        "status": "APPROVED",
        "transactionId": tx["id"],
        "balanceAfter": tx["balanceAfter"],
        "merchant": request.merchant.name,
        "amount": request.amount
    }
