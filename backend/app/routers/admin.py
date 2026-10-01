"""
Admin & Staff Router: Employee operations, KYC verification underwriting, loan decisions,
user account status oversight, dispute resolution, and security audit logs.
"""
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, Query, status

from backend.app.core.database import (
    DB, post_transaction, audit_log, send_notification, reset_db
)
from backend.app.core.security import require_staff_or_admin, require_admin
from backend.app.core.utils import fail, generate_id, now_iso, paginate, calculate_emi
from backend.app.models.schemas import (
    KYCReviewRequest, LoanDecisionRequest, DisputeResolveRequest
)

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.get("/stats")
def get_bank_overview_stats(staff: Dict[str, Any] = Depends(require_staff_or_admin)):
    """Retrieve high-level institutional statistics for the bank management dashboard."""
    total_customers = sum(1 for u in DB["users"].values() if u.get("role") == "CUSTOMER")
    total_accounts = len(DB["accounts"])
    total_deposits = sum(a.get("balance", 0.0) for a in DB["accounts"].values() if a.get("currency") == "USD")
    pending_kyc = sum(1 for k in DB["kyc"].values() if k.get("status") == "SUBMITTED")
    pending_loans = sum(1 for l in DB["loan_apps"].values() if l.get("status") == "UNDER_REVIEW")
    open_disputes = sum(1 for d in DB["disputes"].values() if d.get("status") in ("OPEN", "UNDER_REVIEW"))
    active_cards = sum(1 for c in DB["cards"].values() if c.get("status") == "ACTIVE")

    return {
        "totalCustomers": total_customers,
        "totalAccounts": total_accounts,
        "totalDepositsUSD": round(total_deposits, 2),
        "pendingKycCount": pending_kyc,
        "pendingLoansCount": pending_loans,
        "openDisputesCount": open_disputes,
        "activeCardsCount": active_cards,
        "totalAuditLogs": len(DB["audit"])
    }

# ----------------------------------------------------------------- USER MANAGEMENT
@router.get("/users")
def list_all_users(
    status_filter: Optional[str] = Query(None, alias="status"),
    role_filter: Optional[str] = Query(None, alias="role"),
    page_num: int = Query(1, ge=1, alias="page"),
    limit_num: int = Query(20, ge=1, le=100, alias="limit"),
    staff: Dict[str, Any] = Depends(require_staff_or_admin)
):
    """List registered users with account status, profile details, and role filters."""
    users_list = []
    for u in DB["users"].values():
        if status_filter and u.get("status") != status_filter:
            continue
        if role_filter and u.get("role") != role_filter:
            continue
        safe_user = {k: v for k, v in u.items() if k not in ("password", "mfa")}
        # Attach account count
        user_accs = [a for a in DB["accounts"].values() if a.get("ownerId") == u["id"]]
        safe_user["accountsCount"] = len(user_accs)
        safe_user["totalBalanceUSD"] = sum(a.get("balance", 0.0) for a in user_accs if a.get("currency") == "USD")
        users_list.append(safe_user)

    return paginate(users_list, page_num, limit_num)

@router.get("/users/{userId}")
def get_user_details(userId: str, staff: Dict[str, Any] = Depends(require_staff_or_admin)):
    """Inspect full customer profile, attached accounts, KYC documents, cards, and loan applications."""
    user = DB["users"].get(userId)
    if not user:
        fail(404, "User not found", "USER_NOT_FOUND")

    safe_user = {k: v for k, v in user.items() if k not in ("password", "mfa")}
    safe_user["accounts"] = [a for a in DB["accounts"].values() if a.get("ownerId") == userId]
    safe_user["cards"] = [c for c in DB["cards"].values() if c.get("ownerId") == userId]
    safe_user["kyc"] = [k for k in DB["kyc"].values() if k.get("ownerId") == userId]
    safe_user["loans"] = [l for l in DB["loans"].values() if l.get("ownerId") == userId]
    return safe_user

@router.post("/users/{userId}/suspend")
def suspend_user_account(userId: str, staff: Dict[str, Any] = Depends(require_staff_or_admin)):
    """Freeze/suspend customer access."""
    user = DB["users"].get(userId)
    if not user:
        fail(404, "User not found", "USER_NOT_FOUND")
    if user.get("role") in ("ADMIN", "SUPER_ADMIN"):
        fail(403, "Administrator accounts cannot be suspended", "FORBIDDEN")

    user["status"] = "SUSPENDED"
    send_notification(userId, "Your NeoBank account access has been suspended by staff review.")
    audit_log(staff["id"], "ADMIN_SUSPEND_USER", userId)
    return {"userId": userId, "status": "SUSPENDED", "message": f"User {user['email']} has been suspended."}

@router.post("/users/{userId}/activate")
def activate_user_account(userId: str, staff: Dict[str, Any] = Depends(require_staff_or_admin)):
    """Reactivate a suspended customer account."""
    user = DB["users"].get(userId)
    if not user:
        fail(404, "User not found", "USER_NOT_FOUND")

    user["status"] = "ACTIVE"
    send_notification(userId, "Your NeoBank account access has been restored.")
    audit_log(staff["id"], "ADMIN_ACTIVATE_USER", userId)
    return {"userId": userId, "status": "ACTIVE", "message": f"User {user['email']} is now active."}

# ----------------------------------------------------------------- KYC REVIEW
@router.get("/kyc/pending")
def list_pending_kyc_applications(staff: Dict[str, Any] = Depends(require_staff_or_admin)):
    """View KYC identity submissions awaiting staff evaluation."""
    pending = []
    for k in DB["kyc"].values():
        if k.get("status") == "SUBMITTED":
            record = dict(k)
            owner = DB["users"].get(k.get("ownerId"), {})
            record["ownerEmail"] = owner.get("email")
            record["ownerProfile"] = owner.get("profile")
            pending.append(record)
    return pending

@router.post("/kyc/{kycId}/review")
def review_kyc_application(
    kycId: str,
    request: KYCReviewRequest,
    staff: Dict[str, Any] = Depends(require_staff_or_admin)
):
    """Approve or reject a customer's KYC identity verification with review notes."""
    kyc_record = DB["kyc"].get(kycId)
    if not kyc_record:
        fail(404, "KYC application not found", "KYC_NOT_FOUND")

    if kyc_record.get("status") in ("APPROVED", "REJECTED"):
        fail(409, f"KYC application already reached final status ({kyc_record.get('status')})", "KYC_FINAL")

    kyc_record["status"] = request.decision
    kyc_record["reason"] = request.reason
    kyc_record["reviewedAt"] = now_iso()
    kyc_record["reviewedBy"] = staff["id"]

    status_msg = "approved! You can now open accounts and apply for cards" if request.decision == "APPROVED" else f"rejected: {request.reason}"
    send_notification(kyc_record["ownerId"], f"Your KYC application was {status_msg}.")
    audit_log(staff["id"], "KYC_DECISION", kycId)

    return kyc_record

# ----------------------------------------------------------------- LOAN UNDERWRITING
@router.get("/loans/pending")
def list_pending_loan_applications(staff: Dict[str, Any] = Depends(require_staff_or_admin)):
    """List loan applications in UNDER_REVIEW status awaiting staff credit decision."""
    pending = []
    for app in DB["loan_apps"].values():
        if app.get("status") == "UNDER_REVIEW":
            record = dict(app)
            owner = DB["users"].get(app.get("ownerId"), {})
            quote = DB["quotes"].get(app.get("quoteId"), {})
            account = DB["accounts"].get(app.get("disbursementAccountId"), {})
            record["applicantEmail"] = owner.get("email")
            record["applicantProfile"] = owner.get("profile")
            record["quote"] = quote
            record["account"] = account
            pending.append(record)
    return pending

@router.post("/loans/applications/{appId}/decision")
def decide_loan_application(
    appId: str,
    request: LoanDecisionRequest,
    staff: Dict[str, Any] = Depends(require_staff_or_admin)
):
    """Underwrite and render a decision (APPROVED or REJECTED) on a customer loan application."""
    application = DB["loan_apps"].get(appId)
    if not application:
        fail(404, "Loan application not found", "APPLICATION_NOT_FOUND")

    if application.get("status") != "UNDER_REVIEW":
        fail(409, f"Application is currently in {application.get('status')} state and cannot be decided", "BAD_STATE")

    if request.decision == "REJECTED":
        application["status"] = "REJECTED"
        application["reason"] = request.reason or "Does not satisfy credit underwriting criteria"
        application["decidedAt"] = now_iso()
        application["decidedBy"] = staff["id"]
        send_notification(application["ownerId"], f"Loan application #{appId} was not approved: {application['reason']}")
        audit_log(staff["id"], "LOAN_REJECT", appId)
        return application

    # Handle Approval
    quote = DB["quotes"].get(application["quoteId"])
    approved_amt = request.approvedAmount or quote["amount"]
    if approved_amt > quote["amount"]:
        fail(422, "Approved amount cannot exceed the quoted amount", "AMOUNT_TOO_HIGH")

    application["status"] = "APPROVED"
    application["decidedAt"] = now_iso()
    application["decidedBy"] = staff["id"]

    # Provision new loan entity ready for disbursement
    loan_id = generate_id("loan")
    monthly_installment = calculate_emi(approved_amt, quote["apr"], quote["termMonths"])

    DB["loans"][loan_id] = {
        "id": loan_id,
        "ownerId": application["ownerId"],
        "applicationId": appId,
        "principal": approved_amt,
        "apr": quote["apr"],
        "termMonths": quote["termMonths"],
        "monthlyPayment": monthly_installment,
        "currency": quote["currency"],
        "accountId": application["disbursementAccountId"],
        "status": "APPROVED",
        "schedule": [],
        "createdAt": now_iso()
    }
    application["loanId"] = loan_id

    send_notification(application["ownerId"], f"Congratulations! Your loan of {approved_amt} {quote['currency']} has been APPROVED. Visit your dashboard to disburse the funds.")
    audit_log(staff["id"], "LOAN_APPROVE", loan_id)
    return application

# ----------------------------------------------------------------- DISPUTES MANAGEMENT
@router.get("/disputes")
def list_all_disputes(staff: Dict[str, Any] = Depends(require_staff_or_admin)):
    """List all open and reviewed transaction disputes across all customers."""
    disputes = []
    for d in DB["disputes"].values():
        rec = dict(d)
        tx = DB["tx"].get(d.get("transactionId"))
        owner = DB["users"].get(d.get("ownerId"), {})
        rec["transaction"] = tx
        rec["customerEmail"] = owner.get("email")
        disputes.append(rec)
    return disputes

@router.post("/disputes/{disputeId}/resolve")
def resolve_dispute(
    disputeId: str,
    request: DisputeResolveRequest,
    staff: Dict[str, Any] = Depends(require_staff_or_admin)
):
    """Resolve a customer transaction dispute with a full refund credit or rejection."""
    dispute = DB["disputes"].get(disputeId)
    if not dispute:
        fail(404, "Dispute record not found", "DISPUTE_NOT_FOUND")

    if dispute.get("status") not in ("OPEN", "UNDER_REVIEW"):
        fail(409, f"Dispute is already resolved ({dispute.get('status')})", "BAD_STATE")

    dispute["status"] = f"RESOLVED_{request.outcome}"
    dispute["staffNote"] = request.note
    dispute["resolvedAt"] = now_iso()
    dispute["resolvedBy"] = staff["id"]

    if request.outcome == "REFUND":
        tx = DB["tx"].get(dispute["transactionId"])
        if tx:
            account = DB["accounts"].get(tx["accountId"])
            if account:
                post_transaction(account, "REFUND", dispute["amountDisputed"], reference=f"Dispute #{disputeId} Refund")
        send_notification(dispute["ownerId"], f"Dispute #{disputeId} was resolved: {dispute['amountDisputed']} refunded to your account.")
    else:
        send_notification(dispute["ownerId"], f"Dispute #{disputeId} was rejected upon review.")

    audit_log(staff["id"], "DISPUTE_RESOLVE", disputeId)
    return dispute

# ----------------------------------------------------------------- AUDIT LOGS & SANDBOX RESET
@router.get("/audit-logs")
def get_audit_logs(
    user_id: Optional[str] = Query(None, alias="userId"),
    action: Optional[str] = Query(None, alias="action"),
    staff: Dict[str, Any] = Depends(require_staff_or_admin)
):
    """Query chronological system audit logs."""
    logs = [
        item for item in DB["audit"].values()
        if (not user_id or item.get("userId") == user_id)
        and (not action or item.get("action") == action)
    ]
    logs.sort(key=lambda x: x.get("at", ""), reverse=True)
    return logs[:100]

@router.post("/reset")
def reset_platform_data(staff: Dict[str, Any] = Depends(require_admin)):
    """Wipe sandbox database and restore initial seed state."""
    reset_db()
    return {"reset": True, "message": "Platform state re-seeded with demo records."}
