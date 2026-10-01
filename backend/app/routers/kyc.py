"""
KYC Router: Customer Identity Verification and Document Management.
"""
from datetime import date
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, Query, status

from backend.app.core.database import DB, get_owned, list_owned, audit_log, send_notification
from backend.app.core.security import get_current_user
from backend.app.core.utils import fail, generate_id, now_iso, paginate
from backend.app.models.schemas import KYCCreateRequest, KYCDocument

router = APIRouter(prefix="/kyc", tags=["KYC"])

@router.post("/applications", status_code=status.HTTP_201_CREATED)
def submit_kyc_application(request: KYCCreateRequest, user: Dict[str, Any] = Depends(get_current_user)):
    """Submit an identity verification (KYC) application."""
    # Check for expired documents
    for doc in request.documents:
        if doc.expiryDate and doc.expiryDate < date.today():
            fail(422, f"Document {doc.number} is expired ({doc.expiryDate})", "DOC_EXPIRED")

    # If applicant already has an approved KYC, inform them
    existing_approved = next((k for k in list_owned("kyc", user) if k["status"] == "APPROVED"), None)
    if existing_approved:
        return {
            "kycId": existing_approved["id"],
            "status": "APPROVED",
            "message": "User already has an approved KYC application."
        }

    kyc_id = generate_id("kyc")
    application_data = {
        "id": kyc_id,
        "ownerId": user["id"],
        "status": "SUBMITTED",
        "createdAt": now_iso(),
        "reviewedAt": None,
        "reason": None,
        **request.model_dump(mode="json")
    }
    DB["kyc"][kyc_id] = application_data

    audit_log(user["id"], "KYC_SUBMIT", kyc_id)
    send_notification(user["id"], f"Your KYC application #{kyc_id} has been received and is pending staff review.")

    return {
        "kycId": kyc_id,
        "status": "SUBMITTED",
        "message": "KYC application submitted successfully"
    }

@router.get("/applications")
def list_kyc_applications(
    status_filter: Optional[str] = Query(None, alias="status"),
    page_num: int = Query(1, ge=1, alias="page"),
    limit_num: int = Query(20, ge=1, le=100, alias="limit"),
    user: Dict[str, Any] = Depends(get_current_user)
):
    """List KYC applications submitted by the current user."""
    items = [k for k in list_owned("kyc", user) if not status_filter or k.get("status") == status_filter]
    return paginate(items, page_num, limit_num)

@router.get("/applications/{kycId}")
def get_kyc_application(kycId: str, user: Dict[str, Any] = Depends(get_current_user)):
    """Retrieve details of a specific KYC application."""
    return get_owned("kyc", kycId, user, "kyc application")

@router.post("/applications/{kycId}/documents", status_code=status.HTTP_201_CREATED)
def append_kyc_document(kycId: str, doc: KYCDocument, user: Dict[str, Any] = Depends(get_current_user)):
    """Attach an additional identity document to an active KYC application."""
    kyc_record = get_owned("kyc", kycId, user, "kyc application")
    if kyc_record.get("status") in ("APPROVED", "REJECTED"):
        fail(409, f"Cannot modify KYC in {kyc_record.get('status')} state", "KYC_FINAL")

    doc_data = doc.model_dump(mode="json")
    kyc_record["documents"].append(doc_data)

    return {
        "kycId": kycId,
        "documentsCount": len(kyc_record["documents"]),
        "message": "Document appended successfully"
    }

@router.delete("/applications/{kycId}", status_code=status.HTTP_204_NO_CONTENT)
def withdraw_kyc_application(kycId: str, user: Dict[str, Any] = Depends(get_current_user)):
    """Withdraw a pending KYC application."""
    kyc_record = get_owned("kyc", kycId, user, "kyc application")
    if kyc_record.get("status") == "APPROVED":
        fail(409, "Approved KYC applications cannot be withdrawn", "KYC_FINAL")

    DB["kyc"].pop(kycId, None)
    audit_log(user["id"], "KYC_WITHDRAW", kycId)
