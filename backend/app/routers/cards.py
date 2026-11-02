"""
Cards Router (Production-Hardened)
────────────────────────────────────
Security fixes applied:
  ✓ [CRITICAL] Card PINs are strictly hashed with PBKDF2-HMAC-SHA256 (hash_pin) and never stored in plaintext.
  ✓ [CRITICAL] Removed activation code leakage in API responses and in-app notifications.
  ✓ [HIGH] Replaced random with cryptographically secure secrets.randbelow (CSPRNG).
  ✓ [HIGH] Constant-time PIN and activation code comparisons with hmac.compare_digest.
  ✓ [HIGH] POS Authorization validates hashed PIN against cryptographically stored PIN hash.
"""
import hmac
import secrets
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Header, Request, status

from backend.app.core.config import POS_GATEWAY_KEY, IS_PRODUCTION
from backend.app.core.limiter import limiter
from backend.app.core.database import DB, get_owned, list_owned, post_transaction, audit_log, send_notification
from backend.app.core.security import get_current_user
from backend.app.core.utils import fail, generate_id, now_iso
from backend.app.core.crypto_utils import hash_pin, verify_pin
from backend.app.models.schemas import (
    CardCreateRequest, CardLimits, CardActivateRequest,
    CardBlockRequest, CardPinChangeRequest, CardAuthorizeRequest
)

router = APIRouter(tags=["Cards"])


def sanitize_card_output(card: Dict[str, Any]) -> Dict[str, Any]:
    """Strip secret PIN, PIN hashes, and activation codes from public card dictionary."""
    return {k: v for k, v in card.items() if k not in ("pin", "pin_hash", "activationCode", "_activationCode", "testModeActivationCode")}


@router.post("/accounts/{accountId}/cards", status_code=status.HTTP_201_CREATED)
def issue_card(accountId: str, request: CardCreateRequest, user: Dict[str, Any] = Depends(get_current_user)):
    """Issue a new virtual or physical Visa/Mastercard linked to an active account."""
    account = get_owned("accounts", accountId, user, "account")
    if account["status"] != "ACTIVE":
        fail(409, f"Account is {account['status']}. Cards can only be issued for ACTIVE accounts", "ACCOUNT_NOT_ACTIVE")

    card_id = generate_id("crd")
    # Generate activation code and last4 using CSPRNG
    activation_code = f"{secrets.randbelow(1_000_000):06d}"
    last_four = f"{secrets.randbelow(9000) + 1000:04d}"

    card_record = {
        "id": card_id,
        "ownerId": user["id"],
        "accountId": accountId,
        "type": request.type,
        "network": request.network,
        "cardholderName": request.cardholderName.upper(),
        "last4": last_four,
        "status": "INACTIVE",
        "_activationCode": activation_code,
        "pin_hash": None,
        "limits": request.limits.model_dump(),
        "shippingAddress": request.shippingAddress.model_dump() if request.shippingAddress else None,
        "createdAt": now_iso()
    }
    DB["cards"][card_id] = card_record

    audit_log(user["id"], "CARD_ISSUE", card_id)
    # Notice: Do not expose activation code in general notifications or responses
    send_notification(user["id"], f"New {request.network} {request.type} card issued (*{last_four}). Check your secure postal mail or authorized channel for activation.")

    # Never return activation code in response
    return sanitize_card_output(card_record)


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

    expected_code = card.get("_activationCode") or card.get("activationCode", "")
    if not hmac.compare_digest(request.activationCode.strip(), expected_code):
        fail(400, "Invalid card activation code provided", "BAD_ACTIVATION_CODE")

    # Store card PIN as secure PBKDF2 hash
    card["status"] = "ACTIVE"
    card["pin_hash"] = hash_pin(request.pin)
    card.pop("_activationCode", None)
    card.pop("activationCode", None)

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
    """Unblock a temporarily locked card."""
    card = get_owned("cards", cardId, user, "card")
    if card.get("status") != "BLOCKED":
        fail(409, f"Card is currently {card.get('status')}, not BLOCKED", "BAD_STATE")

    card["status"] = "ACTIVE"
    card.pop("blockReason", None)
    send_notification(user["id"], f"Card *{card['last4']} is now UNBLOCKED and active.")
    audit_log(user["id"], "CARD_UNBLOCK", cardId)
    return sanitize_card_output(card)


@router.post("/cards/{cardId}/pin", status_code=status.HTTP_204_NO_CONTENT)
def change_card_pin(cardId: str, request: CardPinChangeRequest, user: Dict[str, Any] = Depends(get_current_user)):
    """Update card PIN using salted PBKDF2 hash verification."""
    card = get_owned("cards", cardId, user, "card")
    current_hash = card.get("pin_hash") or card.get("pin")

    if not current_hash or not verify_pin(request.oldPin, current_hash):
        fail(400, "Current card PIN is incorrect", "BAD_PIN")

    if request.newPin == request.oldPin:
        fail(422, "New PIN must be different from current PIN", "SAME_PIN")

    card["pin_hash"] = hash_pin(request.newPin)
    card.pop("pin", None)
    audit_log(user["id"], "CARD_PIN_CHANGE", cardId)


@router.post("/cards/{cardId}/limits")
def update_card_limits(cardId: str, limits: CardLimits, user: Dict[str, Any] = Depends(get_current_user)):
    """Update spending limits on an active card."""
    card = get_owned("cards", cardId, user, "card")
    card["limits"] = limits.model_dump()
    audit_log(user["id"], "CARD_LIMITS_UPDATE", cardId)
    return sanitize_card_output(card)


@router.post("/cards/{cardId}/authorize")
@limiter.limit("15/minute")
def authorize_pos_transaction(
    request: Request,
    cardId: str,
    payload: CardAuthorizeRequest,
    gateway_key: Optional[str] = Header(None, alias="X-Gateway-Key")
):
    """
    Simulated Point-of-Sale (POS) or E-commerce payment authorization engine.
    Hardened protections:
      - Validates POS Gateway Authorization Key in production.
      - Enforces strict rate limiting.
      - Automatically blocks card after 3 consecutive failed PIN attempts (Anti-Brute-Force).
      - Validates salted PBKDF2 card PIN hash.
    """
    if not gateway_key or not hmac.compare_digest(gateway_key.strip(), POS_GATEWAY_KEY):
        fail(401, "Unauthorized: Invalid or missing X-Gateway-Key header.", "GATEWAY_UNAUTHORIZED")

    card = DB["cards"].get(cardId)
    if not card:
        fail(404, "Card not recognized by card network", "CARD_NOT_FOUND")

    if card.get("status") != "ACTIVE":
        fail(402, f"Payment declined: Card is {card.get('status')}", "CARD_DECLINED")

    # Verify hashed PIN with attempt counting
    current_hash = card.get("pin_hash") or card.get("pin")
    if not current_hash or not payload.pin or not verify_pin(payload.pin, current_hash):
        card["failed_pin_attempts"] = card.get("failed_pin_attempts", 0) + 1
        if card["failed_pin_attempts"] >= 3:
            card["status"] = "BLOCKED"
            card["blockReason"] = "EXCESSIVE_FAILED_PIN_ATTEMPTS"
            send_notification(card["ownerId"], f"SECURITY ALERT: Card *{card['last4']} has been BLOCKED due to 3 consecutive incorrect PIN attempts.")
            fail(403, "Payment declined: Card blocked due to excessive incorrect PIN attempts.", "CARD_BLOCKED")
        fail(401, "Payment declined: Incorrect card PIN", "PIN_INCORRECT", {"attemptsLeft": 3 - card["failed_pin_attempts"]})

    # Reset failed PIN counter on authentic PIN entry
    card["failed_pin_attempts"] = 0

    # Check limits
    limits = card.get("limits", {})
    if payload.amount > limits.get("daily", 3000.0):
        fail(402, "Payment declined: Transaction exceeds daily card spending limit", "LIMIT_EXCEEDED")

    account = DB["accounts"].get(card["accountId"])
    if not account or account.get("status") != "ACTIVE":
        fail(402, "Payment declined: Linked funding account unavailable", "ACCOUNT_UNAVAILABLE")

    # Resolve merchant name & category
    merchant_name = payload.merchant.name if payload.merchant else (getattr(payload, "merchantName", None) or "POS Merchant")
    merchant_cat = payload.merchant.mcc if payload.merchant else (getattr(payload, "merchantCategory", None) or "RETAIL")

    # Debit account
    tx = post_transaction(
        account,
        "CARD_PURCHASE",
        -payload.amount,
        reference=f"POS: {merchant_name} ({merchant_cat})",
        meta={"cardId": cardId, "merchant": merchant_name, "category": merchant_cat}
    )

    send_notification(
        card["ownerId"],
        f"Card transaction of {payload.amount} {payload.currency} approved at {merchant_name}."
    )
    audit_log(card["ownerId"], "CARD_AUTH", tx["id"])

    return {
        "authorized": True,
        "authorizationCode": f"AUTH_{secrets.token_hex(4).upper()}",
        "transactionId": tx["id"],
        "balanceRemaining": account["balance"]
    }
