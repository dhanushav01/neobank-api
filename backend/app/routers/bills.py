"""
Bills & Payments Router: Utility billers, payee registration, and one-time/scheduled payments.
"""
from datetime import date
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, status
from pydantic import BaseModel, Field

from backend.app.core.config import BILLERS
from backend.app.core.database import DB, get_owned, list_owned, post_transaction, audit_log, send_notification
from backend.app.core.security import get_current_user
from backend.app.core.utils import fail, generate_id, now_iso
from backend.app.models.schemas import BillPayRequest

router = APIRouter(tags=["Bill Payments"])

@router.get("/billers")
def list_billers(category: Optional[str] = None):
    """List registered utility and telecom billers."""
    return [b for b in BILLERS.values() if not category or b.get("category") == category]

@router.get("/billers/{billerId}")
def get_biller(billerId: str):
    """Get single biller details."""
    biller = BILLERS.get(billerId)
    if not biller:
        fail(404, "Biller not found", "BILLER_NOT_FOUND")
    return biller

class PayeeCreate(BaseModel):
    billerId: str
    accountRef: str = Field(min_length=4, max_length=30)
    nickname: Optional[str] = None

@router.get("/payees")
def list_payees(user: Dict[str, Any] = Depends(get_current_user)):
    """List user's registered utility payees."""
    return list_owned("payees", user)

@router.post("/payees", status_code=status.HTTP_201_CREATED)
def register_payee(request: PayeeCreate, user: Dict[str, Any] = Depends(get_current_user)):
    """Save a bill payee."""
    if request.billerId not in BILLERS:
        fail(404, "Invalid biller ID", "BILLER_NOT_FOUND")

    payee_id = generate_id("pay")
    biller = BILLERS[request.billerId]
    record = {
        "id": payee_id,
        "ownerId": user["id"],
        "billerId": request.billerId,
        "billerName": biller["name"],
        "accountRef": request.accountRef,
        "nickname": request.nickname or biller["name"],
        "createdAt": now_iso()
    }
    DB["payees"][payee_id] = record
    return record

@router.delete("/payees/{payeeId}", status_code=status.HTTP_204_NO_CONTENT)
def delete_payee(payeeId: str, user: Dict[str, Any] = Depends(get_current_user)):
    """Remove a saved payee."""
    get_owned("payees", payeeId, user, "payee")
    DB["payees"].pop(payeeId, None)

@router.post("/bills/payments", status_code=status.HTTP_201_CREATED)
def pay_bill(request: BillPayRequest, user: Dict[str, Any] = Depends(get_current_user)):
    """Pay an electricity, water, telecom, or government bill."""
    payee = get_owned("payees", request.payeeId, user, "payee")
    account = get_owned("accounts", request.fromAccountId, user, "source account")
    biller = BILLERS.get(payee["billerId"])

    if request.amount < biller.get("minAmount", 5.0):
        fail(422, f"Payment is below the minimum allowed for {biller['name']} ({biller.get('minAmount')} {account['currency']})", "BELOW_MINIMUM")

    payment_id = generate_id("bpy")
    payment_record = {
        "id": payment_id,
        "ownerId": user["id"],
        "payeeId": request.payeeId,
        "biller": biller["name"],
        "amount": request.amount,
        "memo": request.memo,
        "status": "PAID",
        "createdAt": now_iso()
    }

    if request.scheduledFor and request.scheduledFor > date.today():
        payment_record["status"] = "SCHEDULED"
        payment_record["scheduledFor"] = str(request.scheduledFor)
    else:
        tx = post_transaction(account, "BILL_PAYMENT", -request.amount, reference=f"Bill: {biller['name']}")
        payment_record["transactionId"] = tx["id"]
        send_notification(user["id"], f"Paid {request.amount} to {biller['name']} (Ref: {payee['accountRef']})")

    DB["bill_payments"][payment_id] = payment_record
    audit_log(user["id"], "BILL_PAYMENT", payment_id)
    return payment_record

@router.get("/bills/payments")
def list_bill_payments(user: Dict[str, Any] = Depends(get_current_user)):
    """List historical bill payments."""
    return list_owned("bill_payments", user)
