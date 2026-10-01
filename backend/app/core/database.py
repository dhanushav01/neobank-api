"""
In-memory transactional database engine, collection collections registry,
and initial data seed for NeoBank.
"""
import random
import time
from typing import Dict, Any, List, Optional
from backend.app.core.utils import now_iso, generate_id, format_money, fail

COLLECTIONS = [
    "users", "tokens", "kyc", "accounts", "tx", "transfers", "cards", "disputes",
    "quotes", "loan_apps", "loans", "fx_quotes", "notifications", "audit", "idem",
    "counters", "beneficiaries", "standing-orders", "payees", "bill_payments",
    "portfolios", "inv_orders", "inv_quotes", "stmt_reqs", "savings-goals",
    "budgets", "webhooks", "api-keys", "tickets", "msgs", "payment-links", "applications"
]

DB: Dict[str, Dict[str, Any]] = {}

def post_transaction(
    account: Dict[str, Any],
    tx_type: str,
    amount: float,
    reference: Optional[str] = None,
    meta: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """Execute and record a debit or credit transaction with overdraft checks."""
    if account.get("status") != "ACTIVE":
        fail(409, f"Account is {account.get('status')}", "ACCOUNT_NOT_ACTIVE")

    # If debit, check sufficient funds including overdraft
    if amount < 0 and (account["balance"] + account.get("overdraftLimit", 0.0) + amount < -1e-9):
        fail(422, "Insufficient funds for this transaction", "INSUFFICIENT_FUNDS")

    new_balance = format_money(account["balance"] + amount)
    account["balance"] = new_balance

    txn_id = generate_id("txn")
    record = {
        "id": txn_id,
        "accountId": account["id"],
        "ownerId": account["ownerId"],
        "type": tx_type,
        "amount": format_money(amount),
        "balanceAfter": new_balance,
        "reference": reference or "",
        "meta": meta or {},
        "createdAt": now_iso(),
        "disputed": False
    }
    DB["tx"][txn_id] = record
    return record

def audit_log(user_id: str, action: str, reference: Optional[str] = None) -> None:
    """Record an audit trail event."""
    aud_id = generate_id("aud")
    DB["audit"][aud_id] = {
        "id": aud_id,
        "userId": user_id,
        "action": action,
        "ref": reference,
        "at": now_iso()
    }

def send_notification(user_id: str, message: str) -> Dict[str, Any]:
    """Send an in-app notification to a user."""
    notif_id = generate_id("ntf")
    notif = {
        "id": notif_id,
        "userId": user_id,
        "message": message,
        "read": False,
        "createdAt": now_iso()
    }
    DB["notifications"][notif_id] = notif
    return notif

def get_owned(collection: str, item_id: str, user: Dict[str, Any], label: str = "item") -> Dict[str, Any]:
    """Retrieve an item, ensuring the current user is owner or has staff/admin privileges."""
    item = DB.get(collection, {}).get(item_id)
    is_staff = user.get("role") in ("ADMIN", "EMPLOYEE", "SUPER_ADMIN")
    if not item or (not is_staff and item.get("ownerId") != user.get("id")):
        fail(404, f"{label.capitalize()} not found or unauthorized", f"{label.upper().replace(' ', '_')}_NOT_FOUND")
    return item

def list_owned(collection: str, user: Dict[str, Any]) -> List[Dict[str, Any]]:
    """List all records in a collection owned by user, or all if staff/admin."""
    is_staff = user.get("role") in ("ADMIN", "EMPLOYEE", "SUPER_ADMIN")
    return [
        record for record in DB.get(collection, {}).values()
        if is_staff or record.get("ownerId") == user.get("id")
    ]

def reset_db() -> None:
    """Wipe database state and re-seed default demo users, accounts, and records."""
    DB.clear()
    for col in COLLECTIONS:
        DB[col] = {}

    # Seed Admin / Employee User
    DB["users"]["usr_admin"] = {
        "id": "usr_admin",
        "email": "admin@bank.test",
        "password": "Admin@1234",
        "role": "SUPER_ADMIN",
        "hasSqlAccess": True,
        "status": "ACTIVE",
        "mfa": None,
        "createdAt": now_iso(),
        "profile": {
            "firstName": "Alexander",
            "middleName": "James",
            "lastName": "Sterling",
            "dob": "1982-04-12",
            "phone": "+447700900001",
            "address": {
                "line1": "1 Bank Street",
                "city": "London",
                "postalCode": "EC2N 1HQ",
                "country": "GB"
            }
        }
    }

    # Seed Bank Staff / Employee User
    DB["users"]["usr_employee"] = {
        "id": "usr_employee",
        "email": "employee@bank.test",
        "password": "Employee@1234",
        "role": "EMPLOYEE",
        "hasSqlAccess": False,
        "status": "ACTIVE",
        "mfa": None,
        "createdAt": now_iso(),
        "profile": {
            "firstName": "Sarah",
            "lastName": "Jenkins",
            "dob": "1991-08-25",
            "phone": "+447700900002",
            "address": {
                "line1": "44 Wallbrook Way",
                "city": "London",
                "postalCode": "EC4N 8AP",
                "country": "GB"
            }
        }
    }

    # Seed Active Customer User
    customer_id = "usr_customer"
    DB["users"][customer_id] = {
        "id": customer_id,
        "email": "customer@bank.test",
        "password": "Customer@1234",
        "role": "CUSTOMER",
        "status": "ACTIVE",
        "mfa": None,
        "createdAt": now_iso(),
        "profile": {
            "firstName": "Alexander",
            "lastName": "Wright",
            "dob": "1994-06-15",
            "phone": "+447700900123",
            "address": {
                "line1": "221B Baker Street",
                "city": "London",
                "postalCode": "NW1 6XE",
                "country": "GB"
            }
        },
        "preferences": {"currency": "USD", "theme": "dark"},
        "marketingConsent": True
    }

    # Seed Verified KYC for Customer
    kyc_id = "kyc_demo_approved"
    DB["kyc"][kyc_id] = {
        "id": kyc_id,
        "ownerId": customer_id,
        "status": "APPROVED",
        "documents": [
            {
                "type": "PASSPORT",
                "number": "GB94827104",
                "issuingCountry": "GB",
                "expiryDate": "2031-09-01"
            }
        ],
        "employment": {
            "status": "EMPLOYED",
            "employer": "FinTech Innovators Ltd",
            "annualIncome": 95000.0
        },
        "pepDeclaration": False,
        "taxResidencies": ["GB"],
        "createdAt": now_iso(),
        "reviewedAt": now_iso()
    }

    # Seed Checking Account (USD)
    acc1_id = "acc_chk_demo"
    DB["accounts"][acc1_id] = {
        "id": acc1_id,
        "ownerId": customer_id,
        "kycId": kyc_id,
        "accountNumber": "4892018471",
        "type": "CHECKING",
        "currency": "USD",
        "balance": 0.0,
        "overdraftLimit": 500.0,
        "nickname": "Primary Checking",
        "status": "ACTIVE",
        "nominees": [],
        "createdAt": now_iso()
    }
    post_transaction(DB["accounts"][acc1_id], "DEPOSIT", 14500.0, reference="Direct Deposit - Salary")
    post_transaction(DB["accounts"][acc1_id], "CARD_PURCHASE", -124.50, reference="Apple Store Regent St")
    post_transaction(DB["accounts"][acc1_id], "CARD_PURCHASE", -38.20, reference="Whole Foods Market")

    # Seed Savings Account (EUR)
    acc2_id = "acc_svg_demo"
    DB["accounts"][acc2_id] = {
        "id": acc2_id,
        "ownerId": customer_id,
        "kycId": kyc_id,
        "accountNumber": "9381048291",
        "type": "SAVINGS",
        "currency": "EUR",
        "balance": 0.0,
        "overdraftLimit": 0.0,
        "nickname": "European Rainy Day",
        "status": "ACTIVE",
        "nominees": [],
        "createdAt": now_iso()
    }
    post_transaction(DB["accounts"][acc2_id], "DEPOSIT", 5200.0, reference="Savings Transfer")

    # Seed Active Debit Card
    card_id = "crd_demo_primary"
    DB["cards"][card_id] = {
        "id": card_id,
        "ownerId": customer_id,
        "accountId": acc1_id,
        "type": "PHYSICAL",
        "network": "VISA",
        "cardholderName": "ALEXANDER WRIGHT",
        "last4": "4242",
        "status": "ACTIVE",
        "activationCode": "849201",
        "pin": "1234",
        "limits": {"daily": 3000.0, "monthly": 15000.0, "atm": 1000.0},
        "shippingAddress": DB["users"][customer_id]["profile"]["address"],
        "createdAt": now_iso()
    }

    # Seed Sample Pending Loan Application for Staff Review Demonstration
    loan_quote_id = "lq_demo"
    DB["quotes"][loan_quote_id] = {
        "quoteId": loan_quote_id,
        "ownerId": customer_id,
        "amount": 25000.0,
        "termMonths": 24,
        "purpose": "CAR",
        "currency": "USD",
        "apr": 8.0,
        "monthlyPayment": 1130.65,
        "totalRepayable": 27135.60,
        "expiresAt": now_iso()
    }
    loan_app_id = "lap_demo_pending"
    DB["loan_apps"][loan_app_id] = {
        "id": loan_app_id,
        "ownerId": customer_id,
        "quoteId": loan_quote_id,
        "disbursementAccountId": acc1_id,
        "employment": {
            "status": "EMPLOYED",
            "employer": "FinTech Innovators Ltd",
            "annualIncome": 95000.0
        },
        "consentToCreditCheck": True,
        "status": "UNDER_REVIEW",
        "createdAt": now_iso()
    }

    # Seed Notification
    send_notification(customer_id, "Welcome to NeoBank! Your primary checking account is active and funded.")

    # Seed Sample Account Opening Applications (Across today, yesterday, and earlier dates)
    from datetime import datetime, timezone, timedelta
    now_dt = datetime.now(timezone.utc)
    today_str = now_dt.isoformat(timespec="seconds")
    yesterday_str = (now_dt - timedelta(days=1)).isoformat(timespec="seconds")
    two_days_ago_str = (now_dt - timedelta(days=2)).isoformat(timespec="seconds")

    # Application 1: Submitted Today (Savings Account)
    app1_num = "APP-2026-891042"
    DB["applications"][app1_num] = {
        "applicationNumber": app1_num,
        "accountType": "SAVINGS",
        "currency": "USD",
        "initialDeposit": 250.0,
        "taxId": "TAX-998231",
        "status": "SUBMITTED",
        "createdAt": today_str,
        "applicant": {
            "firstName": "Emily",
            "lastName": "Watson",
            "dob": "1997-03-22",
            "email": "emily.watson@example.com",
            "phone": "+447700900331",
            "address": {
                "line1": "74 Victoria Street",
                "city": "London",
                "postalCode": "SW1E 6QP",
                "country": "GB"
            }
        },
        "employment": {
            "status": "EMPLOYED",
            "employer": "Kensington Media Ltd",
            "annualIncome": 54000.0
        },
        "identityDocument": {
            "type": "PASSPORT",
            "number": "GB78492011",
            "issuingCountry": "GB",
            "expiryDate": "2032-11-20"
        },
        "addressProof": {
            "type": "UTILITY_BILL",
            "number": "UB-481920",
            "issuingCountry": "GB"
        }
    }

    # Application 2: Under Review Today (Current / Checking Account)
    app2_num = "APP-2026-773190"
    DB["applications"][app2_num] = {
        "applicationNumber": app2_num,
        "accountType": "CHECKING",
        "currency": "USD",
        "initialDeposit": 100.0,
        "taxId": "TAX-441209",
        "status": "UNDER_REVIEW",
        "createdAt": today_str,
        "applicant": {
            "firstName": "Marcus",
            "lastName": "Vance",
            "dob": "1992-09-14",
            "email": "marcus.vance@example.com",
            "phone": "+447700900442",
            "address": {
                "line1": "12 St. Mary Axe",
                "city": "London",
                "postalCode": "EC3A 8EP",
                "country": "GB"
            }
        },
        "employment": {
            "status": "SELF_EMPLOYED",
            "employer": "Vance Consultancy",
            "annualIncome": 88000.0
        },
        "identityDocument": {
            "type": "DRIVERS_LICENSE",
            "number": "DL9938201",
            "issuingCountry": "GB",
            "expiryDate": "2030-05-18"
        },
        "addressProof": {
            "type": "UTILITY_BILL",
            "number": "UB-991201",
            "issuingCountry": "GB"
        }
    }

    # Application 3: Submitted Yesterday (Salary Account)
    app3_num = "APP-2026-512849"
    DB["applications"][app3_num] = {
        "applicationNumber": app3_num,
        "accountType": "SALARY",
        "currency": "GBP",
        "initialDeposit": 0.0,
        "taxId": "TAX-339182",
        "status": "APPROVED",
        "createdAt": yesterday_str,
        "reviewedAt": today_str,
        "applicant": {
            "firstName": "Priya",
            "lastName": "Sharma",
            "dob": "1995-12-05",
            "email": "priya.sharma@example.com",
            "phone": "+447700900553",
            "address": {
                "line1": "15 Oxford Street",
                "city": "Manchester",
                "postalCode": "M1 4EE",
                "country": "GB"
            }
        },
        "employment": {
            "status": "EMPLOYED",
            "employer": "Apex Global Solutions",
            "annualIncome": 62000.0
        },
        "identityDocument": {
            "type": "NATIONAL_ID",
            "number": "NID-5510294",
            "issuingCountry": "GB",
            "expiryDate": "2034-01-10"
        },
        "addressProof": {
            "type": "UTILITY_BILL",
            "number": "UB-772184",
            "issuingCountry": "GB"
        }
    }

    # Application 4: 2 Days Ago (Student Account - Rejected due to expired document)
    app4_num = "APP-2026-309184"
    DB["applications"][app4_num] = {
        "applicationNumber": app4_num,
        "accountType": "STUDENT",
        "currency": "USD",
        "initialDeposit": 0.0,
        "taxId": "TAX-118492",
        "status": "REJECTED",
        "createdAt": two_days_ago_str,
        "reviewedAt": yesterday_str,
        "reviewNotes": "Expired identification document provided. Please submit valid non-expired ID.",
        "applicant": {
            "firstName": "David",
            "lastName": "Miller",
            "dob": "2003-04-18",
            "email": "david.miller@example.com",
            "phone": "+447700900664",
            "address": {
                "line1": "44 University Way",
                "city": "Bristol",
                "postalCode": "BS8 1TH",
                "country": "GB"
            }
        },
        "employment": {
            "status": "STUDENT",
            "employer": "Bristol University",
            "annualIncome": 12000.0
        },
        "identityDocument": {
            "type": "PASSPORT",
            "number": "GB11029482",
            "issuingCountry": "GB",
            "expiryDate": "2024-01-01"
        },
        "addressProof": {
            "type": "UTILITY_BILL",
            "number": "UB-112048",
            "issuingCountry": "GB"
        }
    }

# Initialize upon module load
reset_db()
