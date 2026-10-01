"""
Disputes Router: Customer transaction dispute submission, evidence upload, and tracking.
"""
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, status
from pydantic import BaseModel, Field

from backend.app.core.database import DB, get_owned, list_owned, audit_log, send_notification
from backend.app.core.security import get_current_user
from backend.app.core.utils import fail, generate_id, now_iso
from backend.app.models.schemas import DisputeCreateRequest

router = APIRouter(tags=["Disputes"])

@router.post("/transactions/{txId}/disputes", status_code=status.HTTP_201_CREATED)
def raise_transaction_dispute(
    txId: str,
    request: DisputeCreateRequest,
    user: Dict[str, Any] = Depends(get_current_user)
):
    """File a charge dispute on a suspicious debit or card purchase transaction."""
    tx = get_owned("tx", txId, user, "transaction")
    if tx["amount"] >= 0:
        fail(422, "Only debit or charge transactions can be disputed", "NOT_DISPUTABLE")

    if tx.get("disputed"):
        fail(409, "This transaction is already under dispute investigation", "ALREADY_DISPUTED")

    if request.amountDisputed > abs(tx["amount"]):
        fail(422, f"Disputed amount cannot exceed original transaction amount ({abs(tx['amount'])})", "AMOUNT_TOO_HIGH")

    dispute_id = generate_id("dsp")
    tx["disputed"] = True

    dispute_record = {
        "id": dispute_id,
        "ownerId": user["id"],
        "transactionId": txId,
        "amountDisputed": request.amountDisputed,
        "reason": request.reason,
        "description": request.description,
        "status": "OPEN",
        "evidence": [],
        "createdAt": now_iso()
    }
    DB["disputes"][dispute_id] = dispute_record

    audit_log(user["id"], "DISPUTE_CREATE", dispute_id)
    send_notification(user["id"], f"Dispute #{dispute_id} registered. Bank compliance staff will review your claim.")
    return dispute_record

class EvidenceSubmission(BaseModel):
    items: List[Dict[str, Any]] = Field(min_length=1)

@router.post("/disputes/{disputeId}/evidence", status_code=status.HTTP_201_CREATED)
def submit_dispute_evidence(
    disputeId: str,
    request: EvidenceSubmission,
    user: Dict[str, Any] = Depends(get_current_user)
):
    """Attach receipts or documentation to an open dispute claim."""
    dispute = get_owned("disputes", disputeId, user, "dispute")
    if dispute["status"] not in ("OPEN", "UNDER_REVIEW"):
        fail(409, f"Cannot add evidence to a dispute in {dispute['status']} status", "BAD_STATE")

    dispute["evidence"].extend(request.items)
    dispute["status"] = "UNDER_REVIEW"
    return dispute

@router.get("/disputes")
def list_disputes(user: Dict[str, Any] = Depends(get_current_user)):
    """List all transaction disputes filed by current user."""
    return list_owned("disputes", user)

@router.get("/disputes/{disputeId}")
def get_dispute(disputeId: str, user: Dict[str, Any] = Depends(get_current_user)):
    """Get specific dispute case details."""
    return get_owned("disputes", disputeId, user, "dispute")
