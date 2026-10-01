"""
Accounts Router: Account creation, balance queries, deposits, withdrawals, and transactions.
"""
import random
from datetime import date
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, Query, status

from backend.app.core.config import FX_RATES
from backend.app.core.database import DB, get_owned, list_owned, post_transaction, audit_log
from backend.app.core.security import get_current_user
from backend.app.core.utils import fail, generate_id, now_iso, format_money, paginate
from backend.app.models.schemas import AccountCreateRequest, AccountUpdateRequest, AmountRequest

router = APIRouter(prefix="/accounts", tags=["Accounts"])

@router.post("", status_code=status.HTTP_201_CREATED)
def open_account(request: AccountCreateRequest, user: Dict[str, Any] = Depends(get_current_user)):
    """Open a new bank account (Checking, Savings, or Business)."""
    # Verify KYC status
    kyc_record = get_owned("kyc", request.kycId, user, "kyc application")
    if kyc_record.get("status") != "APPROVED":
        fail(403, f"KYC verification must be APPROVED to open accounts (current status: {kyc_record.get('status')})", "KYC_NOT_APPROVED")

    if request.currency not in FX_RATES:
        fail(400, f"Unsupported account currency: {request.currency}", "BAD_CURRENCY")

    acc_id = generate_id("acc")
    acc_number = str(random.randint(10**9, 10**10 - 1))

    account_data = {
        "id": acc_id,
        "ownerId": user["id"],
        "kycId": request.kycId,
        "accountNumber": acc_number,
        "type": request.type,
        "currency": request.currency,
        "balance": 0.0,
        "overdraftLimit": request.overdraftLimit,
        "nickname": request.nickname or f"{request.type.capitalize()} Account",
        "status": "ACTIVE",
        "nominees": [n.model_dump() for n in request.nominees],
        "createdAt": now_iso()
    }
    DB["accounts"][acc_id] = account_data

    # Process initial deposit if specified
    if request.initialDeposit > 0:
        post_transaction(account_data, "DEPOSIT", request.initialDeposit, reference="Initial account deposit")

    audit_log(user["id"], "ACCOUNT_OPEN", acc_id)
    return account_data

@router.get("")
def list_accounts(
    status_filter: Optional[str] = Query(None, alias="status"),
    type_filter: Optional[str] = Query(None, alias="type"),
    currency_filter: Optional[str] = Query(None, alias="currency"),
    page_num: int = Query(1, ge=1, alias="page"),
    limit_num: int = Query(20, ge=1, le=100, alias="limit"),
    user: Dict[str, Any] = Depends(get_current_user)
):
    """List all accounts owned by the current user with optional filters."""
    items = [
        acc for acc in list_owned("accounts", user)
        if (not status_filter or acc.get("status") == status_filter)
        and (not type_filter or acc.get("type") == type_filter)
        and (not currency_filter or acc.get("currency") == currency_filter)
    ]
    return paginate(items, page_num, limit_num)

@router.get("/lookup/{accountNumber}")
def lookup_account(accountNumber: str, user: Dict[str, Any] = Depends(get_current_user)):
    """Lookup destination account holder information for internal transfers."""
    acc = next((a for a in DB["accounts"].values() if a["accountNumber"] == accountNumber), None)
    if not acc:
        fail(404, "Destination account not found", "ACCOUNT_NOT_FOUND")

    owner = DB["users"].get(acc["ownerId"], {}).get("profile", {})
    holder_name = f"{owner.get('firstName', 'User')} {owner.get('lastName', '')[:1]}."
    return {
        "accountNumber": accountNumber,
        "holder": holder_name,
        "currency": acc["currency"],
        "status": acc["status"]
    }

@router.get("/{accountId}")
def get_account_details(accountId: str, user: Dict[str, Any] = Depends(get_current_user)):
    """Get full details of a specific account."""
    return get_owned("accounts", accountId, user, "account")

@router.patch("/{accountId}")
def update_account(accountId: str, request: AccountUpdateRequest, user: Dict[str, Any] = Depends(get_current_user)):
    """Update account nickname or overdraft limits."""
    acc = get_owned("accounts", accountId, user, "account")
    if request.overdraftLimit is not None and acc["type"] != "CHECKING":
        fail(422, "Overdraft protection can only be set on CHECKING accounts", "OVERDRAFT_NOT_ALLOWED")

    update_fields = request.model_dump(exclude_none=True)
    acc.update(update_fields)
    return acc

@router.post("/{accountId}/freeze")
def freeze_account(accountId: str, user: Dict[str, Any] = Depends(get_current_user)):
    """Freeze an active account."""
    acc = get_owned("accounts", accountId, user, "account")
    if acc["status"] != "ACTIVE":
        fail(409, f"Account is already in {acc['status']} status", "BAD_STATE")
    acc["status"] = "FROZEN"
    audit_log(user["id"], "ACCOUNT_FREEZE", accountId)
    return acc

@router.post("/{accountId}/unfreeze")
def unfreeze_account(accountId: str, user: Dict[str, Any] = Depends(get_current_user)):
    """Unfreeze a frozen account."""
    acc = get_owned("accounts", accountId, user, "account")
    if acc["status"] != "FROZEN":
        fail(409, f"Account is not frozen (currently {acc['status']})", "BAD_STATE")
    acc["status"] = "ACTIVE"
    audit_log(user["id"], "ACCOUNT_UNFREEZE", accountId)
    return acc

@router.post("/{accountId}/close")
def close_account(accountId: str, user: Dict[str, Any] = Depends(get_current_user)):
    """Close an account if balance is zero."""
    acc = get_owned("accounts", accountId, user, "account")
    if acc["balance"] != 0:
        fail(409, f"Account balance must be exactly 0.00 to close (current: {acc['balance']} {acc['currency']})", "NON_ZERO_BALANCE")
    acc["status"] = "CLOSED"
    audit_log(user["id"], "ACCOUNT_CLOSE", accountId)
    return acc

@router.get("/{accountId}/balance")
def get_account_balance(accountId: str, user: Dict[str, Any] = Depends(get_current_user)):
    """Get real-time balance and available overdraft credit."""
    acc = get_owned("accounts", accountId, user, "account")
    available = format_money(acc["balance"] + acc.get("overdraftLimit", 0.0))
    return {
        "accountId": acc["id"],
        "accountNumber": acc["accountNumber"],
        "currency": acc["currency"],
        "balance": acc["balance"],
        "overdraftLimit": acc.get("overdraftLimit", 0.0),
        "availableBalance": available,
        "status": acc["status"]
    }

@router.post("/{accountId}/deposit", status_code=status.HTTP_201_CREATED)
def deposit_funds(accountId: str, request: AmountRequest, user: Dict[str, Any] = Depends(get_current_user)):
    """Deposit funds into account."""
    acc = get_owned("accounts", accountId, user, "account")
    tx = post_transaction(
        acc,
        "DEPOSIT",
        request.amount,
        reference=request.note or f"Deposit via {request.channel}",
        meta={"channel": request.channel}
    )
    audit_log(user["id"], "DEPOSIT", tx["id"])
    return tx

@router.post("/{accountId}/withdraw", status_code=status.HTTP_201_CREATED)
def withdraw_funds(accountId: str, request: AmountRequest, user: Dict[str, Any] = Depends(get_current_user)):
    """Withdraw funds from account."""
    acc = get_owned("accounts", accountId, user, "account")
    tx = post_transaction(
        acc,
        "WITHDRAWAL",
        -request.amount,
        reference=request.note or f"Withdrawal via {request.channel}",
        meta={"channel": request.channel}
    )
    audit_log(user["id"], "WITHDRAWAL", tx["id"])
    return tx

@router.get("/{accountId}/transactions")
def get_account_transactions(
    accountId: str,
    tx_type: Optional[str] = Query(None, alias="type"),
    min_amount: Optional[float] = Query(None, alias="minAmount"),
    page_num: int = Query(1, ge=1, alias="page"),
    limit_num: int = Query(20, ge=1, le=100, alias="limit"),
    user: Dict[str, Any] = Depends(get_current_user)
):
    """Retrieve chronological transaction history for an account."""
    get_owned("accounts", accountId, user, "account")
    items = [
        t for t in DB["tx"].values()
        if t["accountId"] == accountId
        and (not tx_type or t.get("type") == tx_type)
        and (min_amount is None or abs(t.get("amount", 0.0)) >= min_amount)
    ]
    # Reverse so newest transactions are first
    items.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
    return paginate(items, page_num, limit_num)

@router.get("/{accountId}/statement")
def get_account_statement(
    accountId: str,
    from_date: date = Query(..., alias="fromDate"),
    to_date: date = Query(..., alias="toDate"),
    user: Dict[str, Any] = Depends(get_current_user)
):
    """Compute financial summary and itemized statement for a date range."""
    acc = get_owned("accounts", accountId, user, "account")
    if from_date > to_date:
        fail(422, "fromDate cannot be later than toDate", "BAD_RANGE")

    transactions = [
        t for t in DB["tx"].values()
        if t["accountId"] == accountId
        and from_date <= date.fromisoformat(t["createdAt"][:10]) <= to_date
    ]
    credits = format_money(sum(t["amount"] for t in transactions if t["amount"] > 0))
    debits = format_money(-sum(t["amount"] for t in transactions if t["amount"] < 0))

    return {
        "accountId": accountId,
        "accountNumber": acc["accountNumber"],
        "currency": acc["currency"],
        "fromDate": str(from_date),
        "toDate": str(to_date),
        "count": len(transactions),
        "totalCredits": credits,
        "totalDebits": debits,
        "netMovement": format_money(credits - debits),
        "transactions": transactions
    }
