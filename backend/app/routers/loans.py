"""
Loans Router: Loan quotes, application underwriting lifecycle, disbursement, and installment repayment.
"""
from datetime import datetime, date, timedelta, timezone
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, status

from backend.app.core.database import DB, get_owned, list_owned, post_transaction, audit_log, send_notification
from backend.app.core.security import get_current_user
from backend.app.core.utils import fail, generate_id, now_iso, format_money, calculate_emi
from backend.app.models.schemas import LoanQuoteRequest, LoanApplicationRequest, LoanRepayRequest

router = APIRouter(prefix="/loans", tags=["Loans"])

PURPOSE_RISK_SURCHARGE = {
    "HOME": 0.0,
    "CAR": 1.0,
    "EDUCATION": 0.5,
    "PERSONAL": 3.0,
    "BUSINESS": 2.0
}

@router.post("/quotes", status_code=status.HTTP_201_CREATED)
def generate_loan_quote(request: LoanQuoteRequest, user: Dict[str, Any] = Depends(get_current_user)):
    """Calculate loan interest APR, monthly payment (EMI), and total repayable amount."""
    base_apr = 6.0
    surcharge = PURPOSE_RISK_SURCHARGE.get(request.purpose, 2.0)
    term_adjustment = request.termMonths / 24.0
    apr = round(base_apr + surcharge + term_adjustment, 2)

    monthly_payment = calculate_emi(request.amount, apr, request.termMonths)
    total_repayable = format_money(monthly_payment * request.termMonths)
    expires_at = (datetime.now(timezone.utc) + timedelta(minutes=30)).isoformat(timespec="seconds")

    quote_id = generate_id("lq")
    quote_record = {
        "quoteId": quote_id,
        "ownerId": user["id"],
        **request.model_dump(),
        "apr": apr,
        "monthlyPayment": monthly_payment,
        "totalRepayable": total_repayable,
        "expiresAt": expires_at
    }
    DB["quotes"][quote_id] = quote_record
    return quote_record

@router.get("/quotes/{quoteId}")
def get_loan_quote(quoteId: str, user: Dict[str, Any] = Depends(get_current_user)):
    """Retrieve details of a generated loan quote."""
    return get_owned("quotes", quoteId, user, "loan quote")

@router.post("/applications", status_code=status.HTTP_201_CREATED)
def apply_for_loan(request: LoanApplicationRequest, user: Dict[str, Any] = Depends(get_current_user)):
    """Submit a loan application using an active loan quote."""
    quote = get_owned("quotes", request.quoteId, user, "loan quote")
    account = get_owned("accounts", request.disbursementAccountId, user, "disbursement account")

    if account["currency"] != quote["currency"]:
        fail(422, f"Account currency ({account['currency']}) must match loan currency ({quote['currency']})", "CURRENCY_MISMATCH")

    # Affordability check (5x annual income limit without co-applicant)
    income = request.employment.annualIncome
    if quote["amount"] > income * 5 and not request.coApplicant and not request.collateral:
        fail(422, "Requested amount exceeds 5x annual income: add a co-applicant or collateral to qualify", "AFFORDABILITY")

    app_id = generate_id("lap")
    application_record = {
        "id": app_id,
        "ownerId": user["id"],
        **request.model_dump(mode="json"),
        "status": "UNDER_REVIEW",  # Auto-submit for bank review
        "createdAt": now_iso()
    }
    DB["loan_apps"][app_id] = application_record

    audit_log(user["id"], "LOAN_APPLICATION_SUBMIT", app_id)
    send_notification(user["id"], f"Loan application #{app_id} submitted and is now under staff credit review.")
    return application_record

@router.get("/applications")
def list_loan_applications(status_filter: Optional[str] = None, user: Dict[str, Any] = Depends(get_current_user)):
    """List loan applications submitted by current user."""
    return [a for a in list_owned("loan_apps", user) if not status_filter or a.get("status") == status_filter]

@router.get("/applications/{appId}")
def get_loan_application(appId: str, user: Dict[str, Any] = Depends(get_current_user)):
    """Get single loan application details."""
    return get_owned("loan_apps", appId, user, "loan application")

@router.post("/applications/{appId}/withdraw")
def withdraw_loan_application(appId: str, user: Dict[str, Any] = Depends(get_current_user)):
    """Withdraw a pending loan application."""
    app = get_owned("loan_apps", appId, user, "loan application")
    if app.get("status") not in ("DRAFT", "UNDER_REVIEW"):
        fail(409, f"Cannot withdraw loan application in {app.get('status')} state", "BAD_STATE")

    app["status"] = "WITHDRAWN"
    audit_log(user["id"], "LOAN_APPLICATION_WITHDRAW", appId)
    return app

@router.get("")
def list_active_loans(status_filter: Optional[str] = None, user: Dict[str, Any] = Depends(get_current_user)):
    """List approved and active disbursed loans."""
    return [
        {k: v for k, v in l.items() if k != "schedule"}
        for l in list_owned("loans", user)
        if not status_filter or l.get("status") == status_filter
    ]

@router.get("/{loanId}")
def get_loan(loanId: str, user: Dict[str, Any] = Depends(get_current_user)):
    """Get loan details and summary."""
    loan = get_owned("loans", loanId, user, "loan")
    return {k: v for k, v in loan.items() if k != "schedule"}

@router.post("/{loanId}/disburse")
def disburse_loan(loanId: str, user: Dict[str, Any] = Depends(get_current_user)):
    """Disburse approved loan principal funds directly into borrower's account."""
    loan = get_owned("loans", loanId, user, "loan")
    if loan.get("status") != "APPROVED":
        fail(409, f"Loan is {loan.get('status')}. Only APPROVED loans can be disbursed", "BAD_STATE")

    disbursement_acc = DB["accounts"].get(loan["accountId"])
    if not disbursement_acc:
        fail(404, "Designated disbursement account not found", "ACCOUNT_NOT_FOUND")

    # Post principal credit transaction
    tx = post_transaction(disbursement_acc, "LOAN_DISBURSEMENT", loan["principal"], reference=f"Loan #{loanId} Disbursement")

    # Build amortization schedule
    balance = loan["principal"]
    monthly_rate = loan["apr"] / 1200.0
    schedule = []
    for n in range(1, loan["termMonths"] + 1):
        interest = format_money(balance * monthly_rate)
        principal_part = format_money(loan["monthlyPayment"] - interest)
        balance = format_money(max(0.0, balance - principal_part))
        schedule.append({
            "installmentNo": n,
            "dueDate": str(date.today() + timedelta(days=30 * n)),
            "amount": loan["monthlyPayment"],
            "principal": principal_part,
            "interest": interest,
            "status": "DUE"
        })

    loan["schedule"] = schedule
    loan["status"] = "ACTIVE"
    loan["disbursedAt"] = now_iso()

    send_notification(user["id"], f"Funds disbursed: {loan['principal']} {loan['currency']} credited to your account.")
    audit_log(user["id"], "LOAN_DISBURSE", loanId)

    return {
        "loanId": loanId,
        "status": "ACTIVE",
        "principal": loan["principal"],
        "disbursementTxId": tx["id"],
        "firstDueDate": schedule[0]["dueDate"] if schedule else None
    }

@router.get("/{loanId}/schedule")
def get_loan_schedule(loanId: str, status_filter: Optional[str] = None, user: Dict[str, Any] = Depends(get_current_user)):
    """View month-by-month repayment schedule and paid/due installments."""
    loan = get_owned("loans", loanId, user, "loan")
    schedule = loan.get("schedule", [])
    return [s for s in schedule if not status_filter or s.get("status") == status_filter]

@router.post("/{loanId}/repayments", status_code=status.HTTP_201_CREATED)
def repay_loan_installment(loanId: str, request: LoanRepayRequest, user: Dict[str, Any] = Depends(get_current_user)):
    """Repay a due installment from a specified account."""
    loan = get_owned("loans", loanId, user, "loan")
    if loan.get("status") != "ACTIVE":
        fail(409, f"Loan is in {loan.get('status')} state and not accepting repayments", "BAD_STATE")

    installment = next((s for s in loan["schedule"] if s["installmentNo"] == request.installmentNo), None)
    if not installment:
        fail(404, f"Installment #{request.installmentNo} not found in schedule", "INSTALLMENT_NOT_FOUND")

    if installment.get("status") == "PAID":
        fail(409, f"Installment #{request.installmentNo} has already been settled", "ALREADY_PAID")

    # Ensure prior installments are paid first
    prior_unpaid = any(s["installmentNo"] < request.installmentNo and s["status"] != "PAID" for s in loan["schedule"])
    if prior_unpaid:
        fail(422, "Earlier chronological installments must be repaid first", "OUT_OF_ORDER")

    repay_acc = get_owned("accounts", request.fromAccountId, user, "repayment account")
    tx = post_transaction(repay_acc, "LOAN_REPAYMENT", -installment["amount"], reference=f"Loan #{loanId} Inst #{request.installmentNo}")
    installment["status"] = "PAID"
    installment["paidAt"] = now_iso()

    # Check if fully paid off
    if all(s["status"] == "PAID" for s in loan["schedule"]):
        loan["status"] = "CLOSED"
        send_notification(user["id"], f"Congratulations! Loan #{loanId} has been completely paid off.")

    audit_log(user["id"], "LOAN_REPAYMENT", loanId)
    return {
        "loanId": loanId,
        "installmentNo": request.installmentNo,
        "amountPaid": installment["amount"],
        "transactionId": tx["id"],
        "loanStatus": loan["status"]
    }

@router.get("/{loanId}/payoff-quote")
def get_early_payoff_quote(loanId: str, user: Dict[str, Any] = Depends(get_current_user)):
    """Calculate remaining balance and fee for early loan settlement."""
    loan = get_owned("loans", loanId, user, "loan")
    if loan.get("status") != "ACTIVE":
        fail(409, f"Loan is {loan.get('status')}", "BAD_STATE")

    due_installments = [s for s in loan.get("schedule", []) if s["status"] != "PAID"]
    remaining_principal = format_money(sum(s["principal"] for s in due_installments))
    early_fee = format_money(0.01 * remaining_principal)

    return {
        "loanId": loanId,
        "remainingPrincipal": remaining_principal,
        "earlyPayoffFee": early_fee,
        "totalPayoffAmount": format_money(remaining_principal + early_fee),
        "installmentsLeft": len(due_installments)
    }
