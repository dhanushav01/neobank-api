"""
Transfers Router: Internal and external money transfers, idempotency, and OTP challenge workflows.
"""
import random
from datetime import date
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, Header, Query, status

from backend.app.core.database import DB, get_owned, list_owned, post_transaction, audit_log, send_notification
from backend.app.core.security import get_current_user
from backend.app.core.utils import fail, generate_id, now_iso, paginate
from backend.app.models.schemas import TransferCreateRequest, TransferConfirmRequest

router = APIRouter(prefix="/transfers", tags=["Transfers"])

OTP_THRESHOLD = 1000.0

def execute_transfer(transfer: Dict[str, Any]) -> None:
    """Debit source account, apply fees, and credit destination account if internal."""
    source_acc = DB["accounts"][transfer["fromAccountId"]]
    is_internal = transfer["destination"]["type"] == "INTERNAL"
    fee = 0.0 if is_internal else 1.50

    debit_tx = post_transaction(
        source_acc,
        "TRANSFER_OUT",
        -(transfer["amount"] + fee),
        reference=transfer.get("reference") or f"Transfer to {transfer['destination']['name']}",
        meta={"transferId": transfer["id"], "fee": fee, "destination": transfer["destination"]}
    )
    transfer["debitTxId"] = debit_tx["id"]
    transfer["fee"] = fee

    if is_internal:
        dest_account_num = transfer["destination"]["accountNumber"]
        dest_acc = next((a for a in DB["accounts"].values() if a["accountNumber"] == dest_account_num), None)
        if dest_acc:
            credit_tx = post_transaction(
                dest_acc,
                "TRANSFER_IN",
                transfer["amount"],
                reference=transfer.get("reference") or f"Transfer from {source_acc['accountNumber']}",
                meta={"transferId": transfer["id"]}
            )
            transfer["creditTxId"] = credit_tx["id"]

    transfer["status"] = "COMPLETED"
    transfer["completedAt"] = now_iso()

@router.post("", status_code=status.HTTP_201_CREATED)
def initiate_transfer(
    request: TransferCreateRequest,
    user: Dict[str, Any] = Depends(get_current_user),
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key")
):
    """Initiate a money transfer. Amounts above 1,000 generate a 6-digit OTP challenge."""
    # Check idempotency
    if idempotency_key:
        cached_id = DB["idem"].get((user["id"], idempotency_key))
        if cached_id and cached_id in DB["transfers"]:
            cached_transfer = dict(DB["transfers"][cached_id])
            cached_transfer.pop("_otp", None)
            return cached_transfer

    # Validate source account
    source_acc = get_owned("accounts", request.fromAccountId, user, "source account")
    if source_acc["currency"] != request.currency:
        fail(422, f"Transfer currency ({request.currency}) must match source account currency ({source_acc['currency']})", "CURRENCY_MISMATCH")

    dest = request.destination
    if dest.type == "INTERNAL":
        dest_acc = next((a for a in DB["accounts"].values() if a["accountNumber"] == dest.accountNumber), None)
        if not dest_acc:
            fail(404, "Destination account not found in system", "DEST_NOT_FOUND")
        if dest_acc["id"] == source_acc["id"]:
            fail(422, "Cannot transfer funds to the same source account", "SAME_ACCOUNT")
        if dest_acc["currency"] != request.currency:
            fail(422, f"Destination account operates in {dest_acc['currency']}. Use FX exchange for cross-currency transfers", "CURRENCY_MISMATCH")

    transfer_id = generate_id("trf")
    transfer_record = {
        "id": transfer_id,
        "ownerId": user["id"],
        **request.model_dump(mode="json"),
        "status": "CREATED",
        "createdAt": now_iso()
    }
    DB["transfers"][transfer_id] = transfer_record

    # Handle scheduling or OTP requirements
    if request.scheduledFor and request.scheduledFor > date.today():
        transfer_record["status"] = "SCHEDULED"
    elif request.amount > OTP_THRESHOLD:
        transfer_record["status"] = "PENDING_OTP"
        transfer_record["otpChallengeId"] = generate_id("otp")
        transfer_record["_otp"] = f"{random.randint(0, 999999):06d}"
        transfer_record["testModeOtp"] = transfer_record["_otp"]
        send_notification(user["id"], f"Security OTP for transfer #{transfer_id}: {transfer_record['_otp']}")
    else:
        execute_transfer(transfer_record)
        send_notification(user["id"], f"Transfer of {transfer_record['amount']} {transfer_record['currency']} completed.")

    if idempotency_key:
        DB["idem"][(user["id"], idempotency_key)] = transfer_id

    audit_log(user["id"], "TRANSFER_CREATE", transfer_id)
    return {k: v for k, v in transfer_record.items() if k != "_otp"}

@router.post("/{transferId}/confirm")
def confirm_transfer_otp(
    transferId: str,
    request: TransferConfirmRequest,
    user: Dict[str, Any] = Depends(get_current_user)
):
    """Verify 6-digit OTP code to authorize a high-value transfer."""
    transfer = get_owned("transfers", transferId, user, "transfer")
    if transfer.get("status") != "PENDING_OTP":
        fail(409, f"Transfer is in {transfer.get('status')} state and cannot be confirmed", "BAD_STATE")

    if request.otpChallengeId != transfer.get("otpChallengeId"):
        fail(400, "Invalid OTP challenge ID provided", "BAD_CHALLENGE")

    if request.otp != transfer.get("_otp"):
        transfer["attempts"] = transfer.get("attempts", 0) + 1
        if transfer["attempts"] >= 3:
            transfer["status"] = "FAILED"
            fail(423, "Maximum OTP verification attempts exceeded. Transfer failed for security.", "OTP_LOCKED")
        fail(400, "Incorrect OTP code entered", "OTP_INVALID", {"attemptsLeft": 3 - transfer["attempts"]})

    execute_transfer(transfer)
    transfer.pop("testModeOtp", None)
    send_notification(user["id"], f"Transfer #{transferId} verified and completed successfully.")
    audit_log(user["id"], "TRANSFER_CONFIRM", transferId)

    return {k: v for k, v in transfer.items() if k != "_otp"}

@router.post("/{transferId}/cancel")
def cancel_transfer(transferId: str, user: Dict[str, Any] = Depends(get_current_user)):
    """Cancel a pending OTP or scheduled transfer."""
    transfer = get_owned("transfers", transferId, user, "transfer")
    if transfer.get("status") not in ("PENDING_OTP", "SCHEDULED"):
        fail(409, f"Cannot cancel transfer in {transfer.get('status')} state", "BAD_STATE")

    transfer["status"] = "CANCELLED"
    audit_log(user["id"], "TRANSFER_CANCEL", transferId)
    return {k: v for k, v in transfer.items() if k != "_otp"}

@router.get("")
def list_transfers(
    status_filter: Optional[str] = Query(None, alias="status"),
    page_num: int = Query(1, ge=1, alias="page"),
    limit_num: int = Query(20, ge=1, le=100, alias="limit"),
    user: Dict[str, Any] = Depends(get_current_user)
):
    """List transfers initiated by the current user."""
    items = [
        {k: v for k, v in t.items() if k != "_otp"}
        for t in list_owned("transfers", user)
        if not status_filter or t.get("status") == status_filter
    ]
    items.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
    return paginate(items, page_num, limit_num)

@router.get("/{transferId}")
def get_transfer(transferId: str, user: Dict[str, Any] = Depends(get_current_user)):
    """Get single transfer details."""
    t = get_owned("transfers", transferId, user, "transfer")
    return {k: v for k, v in t.items() if k != "_otp"}
