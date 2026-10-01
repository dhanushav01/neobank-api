"""
Onboarding & Customer Account Opening Router:
Manages account selection, eligibility verification, document submission,
unique application number generation, applicant status tracking,
and bank staff application review with date-range filtering.
"""
import os
import random
from datetime import datetime, date, timezone, timedelta
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, Query, status, UploadFile, File, Form, Response

from backend.app.core.database import (
    DB, post_transaction, audit_log, send_notification
)
from backend.app.core.security import require_staff_or_admin
from backend.app.core.utils import fail, generate_id, now_iso, paginate, format_money
from backend.app.core.sql_db import (
    store_sql_application, get_sql_application, list_sql_applications,
    store_encrypted_document, retrieve_and_decrypt_document,
    list_documents_for_application, create_or_sync_user
)
from backend.app.models.schemas import (
    AccountOpeningApplication, ApplicationReviewRequest
)

router = APIRouter(prefix="/onboarding", tags=["Account Onboarding"])

# ----------------------------------------------------------------- ENCRYPTED DOCUMENT SQL UPLOAD & DOWNLOAD
@router.post("/upload-document")
async def upload_encrypted_document(
    file: UploadFile = File(...),
    applicationNumber: Optional[str] = Form(None),
    docCategory: str = Form("IDENTITY"),
    docType: str = Form("PASSPORT"),
    docNumber: Optional[str] = Form(None),
    userId: Optional[str] = Form(None)
):
    """
    Encrypt document or scan with AES-256 and store securely as an encrypted BLOB in SQL database.
    Supports Identity Proof, Address Proof, and Income documents.
    """
    raw_content = await file.read()
    if not raw_content:
        fail(400, "Empty document upload", "EMPTY_FILE")

    doc_id = f"doc_{os.urandom(8).hex()}"
    saved = store_encrypted_document(
        doc_id=doc_id,
        application_number=applicationNumber,
        user_id=userId,
        doc_category=docCategory,
        doc_type=docType,
        doc_number=docNumber,
        file_name=file.filename or "document.bin",
        file_mime=file.content_type or "application/octet-stream",
        raw_content=raw_content
    )
    return {
        "success": True,
        "document": saved,
        "message": f"Document {file.filename} successfully encrypted with AES-256 and stored in SQL database."
    }

@router.get("/documents/{docId}/download")
def download_decrypted_document(docId: str):
    """Retrieve and decrypt an AES-256 encrypted document from SQL database."""
    doc = retrieve_and_decrypt_document(docId)
    if not doc:
        fail(404, "Document not found in database", "DOC_NOT_FOUND")

    return Response(
        content=doc["contentBytes"],
        media_type=doc["fileMime"],
        headers={"Content-Disposition": f"inline; filename=\"{doc['fileName']}\""}
    )

@router.get("/documents/by-application/{applicationNumber}")
def get_documents_by_application(applicationNumber: str):
    """List encrypted document records associated with an application from SQL database."""
    return list_documents_for_application(applicationNumber)

# ----------------------------------------------------------------- ACCOUNT TYPES & ELIGIBILITY RULES
ACCOUNT_CATALOG = [
    # Category 1: Everyday / Transactional
    {
        "type": "SAVINGS",
        "category": "Everyday / Transactional",
        "title": "High-Yield Savings Account",
        "tagline": "Grow your wealth with competitive daily-accrued interest.",
        "interestRate": "4.20% APY",
        "minAge": 18,
        "minInitialDeposit": 100.0,
        "monthlyFee": 0.0,
        "eligibilityRules": [
            "Must be at least 18 years old",
            "Initial deposit of at least $100.00 required upon approval",
            "Legal resident of supported jurisdiction"
        ],
        "requiredDocuments": [
            {"name": "Proof of Identity", "examples": "Passport, National ID Card, or Driver's License"},
            {"name": "Proof of Address", "examples": "Utility bill or Bank statement (less than 3 months old)"},
            {"name": "Tax Identification", "examples": "SSN (US), National Insurance (UK), or PAN (India)"}
        ]
    },
    {
        "type": "CHECKING",
        "category": "Everyday / Transactional",
        "title": "Everyday Current & Checking Account",
        "tagline": "Full-featured digital checking with contactless Visa debit and overdraft protection.",
        "interestRate": "0.10% APY",
        "minAge": 18,
        "minInitialDeposit": 25.0,
        "monthlyFee": 0.0,
        "eligibilityRules": [
            "Must be at least 18 years old",
            "Overdraft protection eligibility subject to credit assessment",
            "Free international contactless debit card included"
        ],
        "requiredDocuments": [
            {"name": "Proof of Identity", "examples": "Passport or Driver's License"},
            {"name": "Proof of Address", "examples": "Utility bill or Council Tax statement"},
            {"name": "Tax Identification", "examples": "SSN or PAN card"}
        ]
    },
    {
        "type": "SALARY",
        "category": "Everyday / Transactional",
        "title": "Corporate Salary Account",
        "tagline": "Zero-minimum-balance corporate salary account with zero-fee ATM withdrawals.",
        "interestRate": "2.50% APY",
        "minAge": 18,
        "minInitialDeposit": 0.0,
        "monthlyFee": 0.0,
        "eligibilityRules": [
            "Must be actively employed or self-employed",
            "Zero minimum balance requirement",
            "Monthly recurring payroll credit required"
        ],
        "requiredDocuments": [
            {"name": "Proof of Identity", "examples": "Passport or National ID"},
            {"name": "Employment Proof", "examples": "Recent salary payslip, Offer letter, or Corporate ID"},
            {"name": "Tax Identification", "examples": "SSN or Tax ID number"}
        ]
    },
    # Category 2: Long-Term / Investment
    {
        "type": "FIXED_DEPOSIT",
        "category": "Long-Term / Investment",
        "title": "Fixed / Term Deposit Account",
        "tagline": "Guaranteed locked-in premium returns with flexible tenure options (6 to 60 months).",
        "interestRate": "5.25% APY",
        "minAge": 18,
        "minInitialDeposit": 500.0,
        "monthlyFee": 0.0,
        "eligibilityRules": [
            "Must be at least 18 years old",
            "Minimum initial principal lock-in of $500.00",
            "Penalty-free interest compounding at maturity"
        ],
        "requiredDocuments": [
            {"name": "Proof of Identity", "examples": "Passport, National ID, or Driver's License"},
            {"name": "Proof of Address", "examples": "Recent Utility Bill or Tax Document"},
            {"name": "Source of Funds Declaration", "examples": "Bank statement verifying deposit origin"}
        ]
    },
    {
        "type": "MONEY_MARKET",
        "category": "Long-Term / Investment",
        "title": "Money Market / Recurring Deposit",
        "tagline": "Earn high-tier money-market returns with monthly scheduled auto-contributions.",
        "interestRate": "3.80% APY",
        "minAge": 18,
        "minInitialDeposit": 50.0,
        "monthlyFee": 0.0,
        "eligibilityRules": [
            "Must be at least 18 years old",
            "Minimum initial deposit of $50.00 with flexible recurring schedule",
            "Higher liquidity with limited monthly withdrawals"
        ],
        "requiredDocuments": [
            {"name": "Proof of Identity", "examples": "Passport or National ID"},
            {"name": "Proof of Address", "examples": "Utility bill or bank statement"}
        ]
    },
    # Category 3: Specialized / Cross-Border
    {
        "type": "NRI_EXPAT",
        "category": "Specialized / Cross-Border",
        "title": "NRI / Foreign Expat Account",
        "tagline": "Borderless multi-currency accounts (USD, EUR, GBP, AED, INR) with zero foreign remittance markup.",
        "interestRate": "3.50% APY",
        "minAge": 18,
        "minInitialDeposit": 200.0,
        "monthlyFee": 0.0,
        "eligibilityRules": [
            "Expatriate, non-resident citizen, or global remote worker",
            "Zero conversion fee on cross-border inward remittances",
            "Access to multi-currency sub-ledgers"
        ],
        "requiredDocuments": [
            {"name": "Passport & Visa / Residence Permit", "examples": "Valid foreign work visa or expat resident permit"},
            {"name": "Overseas Address Proof", "examples": "Utility bill or lease in foreign host country"},
            {"name": "Tax Residency Self-Declaration", "examples": "W-8BEN or CRS self-certification form"}
        ]
    },
    {
        "type": "STUDENT",
        "category": "Specialized / Cross-Border",
        "title": "Student / Youth Advantage Account",
        "tagline": "Tailored for higher education students with zero maintenance fees and campus discounts.",
        "interestRate": "1.75% APY",
        "minAge": 16,
        "maxAge": 26,
        "minInitialDeposit": 0.0,
        "monthlyFee": 0.0,
        "eligibilityRules": [
            "Age between 16 and 26 years",
            "Enrolled in accredited secondary or university program",
            "Zero fees and free student virtual card"
        ],
        "requiredDocuments": [
            {"name": "Proof of Identity", "examples": "Passport or National ID"},
            {"name": "Student Proof", "examples": "Student ID card or University Acceptance Letter"},
            {"name": "Proof of Address", "examples": "Dormitory registration or Parent utility bill"}
        ]
    },
    {
        "type": "PENSION",
        "category": "Specialized / Senior / Welfare",
        "title": "Pension Savings Account",
        "tagline": "Specially tailored for pensioners, senior citizens (60+), and disability pension beneficiaries with direct treasury PPO credit and zero minimum balance.",
        "interestRate": "4.50% APY",
        "minAge": 18,
        "minInitialDeposit": 0.0,
        "monthlyFee": 0.0,
        "eligibilityRules": [
            "Senior Citizens (60+ years) OR Disability Pension Beneficiaries (18+)",
            "Direct Treasury, Central/State Govt, EPS, or Armed Forces PPO credit",
            "Zero minimum balance requirement & free doorstep banking assistance"
        ],
        "requiredDocuments": [
            {"name": "Proof of Identity & Age", "examples": "Aadhaar Card, Passport, or Senior Citizen Card"},
            {"name": "Pension Sanction Order / Disability Certificate", "examples": "PPO letter, EPFO Pension certificate, or Disability ID (UDID)"},
            {"name": "Proof of Address", "examples": "Aadhaar, Utility bill, or Govt allotment letter"}
        ]
    }
]

@router.get("/account-types")
def get_account_catalog():
    """Retrieve available bank account types, eligibility rules, and required onboarding documents."""
    return ACCOUNT_CATALOG

# ----------------------------------------------------------------- DRAFT APPLICATION MANAGEMENT
@router.post("/initiate-draft")
def initiate_application_draft(payload: Optional[Dict[str, Any]] = None):
    """
    Step 1: Generates a unique Application Number (e.g. APP-2026-XXXXXX)
    immediately when applicant selects account & branch.
    Locks this application number to avoid reusing or polluting caches.
    """
    current_year = datetime.now().year
    random_digits = random.randint(100000, 999999)
    app_number = f"APP-{current_year}-{random_digits}"
    while app_number in DB["applications"]:
        random_digits = random.randint(100000, 999999)
        app_number = f"APP-{current_year}-{random_digits}"

    account_type = (payload or {}).get("accountType", "SAVINGS")
    branch_name = (payload or {}).get("branchName", "")
    branch_code = (payload or {}).get("branchCode", "")

    app_record = {
        "applicationNumber": app_number,
        "accountType": account_type,
        "branchName": branch_name,
        "branchCode": branch_code,
        "currency": "INR",
        "initialDeposit": 0.0,
        "taxId": "",
        "status": "DRAFT_INITIATED",
        "createdAt": now_iso(),
        "updatedAt": now_iso(),
        "applicant": {},
        "employment": {},
        "formData": payload or {}
    }
    DB["applications"][app_number] = app_record
    try:
        store_sql_application(app_record)
    except Exception as e:
        print(f"Warning: Failed to persist initial draft {app_number}: {e}")

    return {
        "applicationNumber": app_number,
        "status": "DRAFT_INITIATED",
        "accountType": account_type,
        "branchName": branch_name,
        "branchCode": branch_code,
        "message": "Unique application reference created successfully."
    }

@router.post("/save-draft")
def save_application_draft(payload: Dict[str, Any]):
    """
    Persist in-progress customer form draft data keyed strictly to the Application Number.
    Never overwrites an application that has already been submitted or is under review.
    """
    app_number = payload.get("applicationNumber")
    if not app_number:
        fail(400, "Application number is required to save draft", "MISSING_APP_NUMBER")

    app_record = DB["applications"].get(app_number) or get_sql_application(app_number) or {}
    
    # CRITICAL GUARD: If the application has already been submitted or processed, reject reverting to draft
    current_status = app_record.get("status")
    if current_status in ("SUBMITTED", "UNDER_REVIEW", "APPROVED", "ACCOUNT_OPENED", "REJECTED"):
        return {
            "applicationNumber": app_number,
            "status": current_status,
            "updatedAt": app_record.get("updatedAt"),
            "message": f"Application is already {current_status} and cannot be converted to draft."
        }

    app_record["applicationNumber"] = app_number
    app_record["status"] = "DRAFT_SAVED"
    app_record["updatedAt"] = now_iso()
    if not app_record.get("createdAt"):
        app_record["createdAt"] = now_iso()

    if "accountType" in payload:
        app_record["accountType"] = payload["accountType"]
    if "branchName" in payload:
        app_record["branchName"] = payload["branchName"]
    if "branchCode" in payload:
        app_record["branchCode"] = payload["branchCode"]
    if "applicant" in payload:
        app_record["applicant"] = payload["applicant"]
    if "formData" in payload:
        app_record["formData"] = payload["formData"]

    DB["applications"][app_number] = app_record
    try:
        store_sql_application(app_record)
    except Exception as e:
        print(f"Warning: Failed to persist draft update {app_number}: {e}")

    return {
        "applicationNumber": app_number,
        "status": "DRAFT_SAVED",
        "updatedAt": app_record["updatedAt"],
        "message": "Application draft persisted successfully."
    }

@router.get("/draft/{applicationNumber}")
def get_application_draft(applicationNumber: str):
    """Retrieve saved draft details for an application number."""
    app = DB["applications"].get(applicationNumber) or get_sql_application(applicationNumber)
    if not app:
        fail(404, "Draft not found for reference number", "DRAFT_NOT_FOUND")
    return app

# ----------------------------------------------------------------- APPLICATION SUBMISSION & TRACKING
@router.post("/apply", status_code=status.HTTP_201_CREATED)
def submit_account_opening_application(application: AccountOpeningApplication):
    """
    Submit completed uniform bank application form.
    Uses pre-generated applicationNumber or issues a new one if not supplied.
    """
    clean_email = application.email.lower().strip()

    # Check if this email already has an active bank user account
    if any(u.get("email", "").lower() == clean_email for u in DB["users"].values()):
        fail(409, "An active bank account already exists for this email address. Please log in directly.", "EMAIL_ALREADY_EXISTS")

    # If applicationNumber was pre-assigned during draft/Step 1, honor it!
    app_number = application.applicationNumber
    if not app_number:
        # Check if applicant already submitted an application that is pending or approved
        existing_app = next(
            (app for app in DB["applications"].values()
             if app.get("applicant", {}).get("email", "").lower() == clean_email
             and app.get("status") in ("SUBMITTED", "UNDER_REVIEW", "APPROVED")),
            None
        )
        if existing_app:
            return {
                "applicationNumber": existing_app["applicationNumber"],
                "status": existing_app["status"],
                "accountType": existing_app["accountType"],
                "applicantName": f"{existing_app['applicant'].get('firstName', '')} {existing_app['applicant'].get('lastName', '')}",
                "message": "An application is already registered for this email. Use your existing application number to track status.",
                "isExisting": True
            }

        # Generate Unique Random Application Number (e.g., APP-2026-681924)
        random_digits = random.randint(100000, 999999)
        current_year = datetime.now().year
        app_number = f"APP-{current_year}-{random_digits}"
        while app_number in DB["applications"]:
            random_digits = random.randint(100000, 999999)
            app_number = f"APP-{current_year}-{random_digits}"

    app_record = {
        "applicationNumber": app_number,
        "accountType": application.accountType,
        "currency": application.currency,
        "branchName": application.branchName or "",
        "branchCode": application.branchCode or "",
        "initialDeposit": application.initialDeposit,
        "taxId": application.taxId,
        "password": application.password,  # Stored for activation upon staff approval
        "cardScheme": application.cardScheme or "RUPAY",
        "cardFormat": application.cardFormat or "BOTH",
        "applicationType": application.applicationType or "NEW",
        "linkedAccountNumber": application.linkedAccountNumber,
        "status": "SUBMITTED",
        "createdAt": now_iso(),
        "officerMessages": [],
        "applicant": {
            "firstName": application.applicant.firstName,
            "lastName": application.applicant.lastName,
            "dob": str(application.applicant.dob),
            "email": clean_email,
            "phone": application.applicant.phone,
            "address": application.applicant.address.model_dump()
        },
        "employment": application.employment.model_dump(),
        "identityDocument": application.identityDocument.model_dump(mode="json"),
        "addressProof": application.addressProof.model_dump(mode="json"),
        "agreedToTerms": application.agreedToTerms
    }

    DB["applications"][app_number] = app_record

    # Persist in SQL relational database
    try:
        store_sql_application(app_record)
    except Exception as e:
        print(f"Warning: Failed to persist application {app_number} to SQL: {e}")

    audit_log(clean_email, "ONBOARDING_APPLICATION_SUBMIT", app_number)

    return {
        "applicationNumber": app_number,
        "status": "SUBMITTED",
        "accountType": application.accountType,
        "branchName": application.branchName or "",
        "branchCode": application.branchCode or "",
        "applicantName": f"{application.applicant.firstName} {application.applicant.lastName}",
        "initialDeposit": application.initialDeposit,
        "submittedAt": app_record["createdAt"],
        "estimatedReviewTime": "Within 24 business hours",
        "trackingInstructions": "Save this Application Number to track verification progress or inquire with bank staff.",
        "isExisting": False
    }

@router.get("/track/{applicationNumber}")
def track_application_status(applicationNumber: str):
    """Public lookup endpoint allowing applicants to track their account opening status and view verified documents."""
    app = DB["applications"].get(applicationNumber) or get_sql_application(applicationNumber)
    if not app:
        fail(404, f"No application found with reference {applicationNumber}", "APPLICATION_NOT_FOUND")

    applicant = app.get("applicant", {})
    first_name = applicant.get("firstName") or applicant.get("first_name") or ""
    last_name = applicant.get("lastName") or applicant.get("last_name") or ""
    name_display = f"{first_name} {last_name[:1]}." if first_name else "Applicant Draft"

    attached_docs = list_documents_for_application(applicationNumber)
    curr_status = app.get("status", "SUBMITTED")

    return {
        "applicationNumber": applicationNumber,
        "status": curr_status,
        "accountType": app.get("accountType", "SAVINGS"),
        "applicationType": app.get("applicationType", "NEW"),
        "branchName": app.get("branchName", ""),
        "branchCode": app.get("branchCode", ""),
        "applicantName": name_display,
        "submittedAt": app.get("createdAt"),
        "updatedAt": app.get("updatedAt"),
        "reviewedAt": app.get("reviewedAt"),
        "reviewNotes": app.get("reviewNotes"),
        "generatedAccountNumber": app.get("generatedAccountNumber"),
        "isDraft": curr_status in ("DRAFT_INITIATED", "DRAFT_SAVED"),
        "documents": attached_docs,
        "officerMessages": app.get("officerMessages", [])
    }

# ----------------------------------------------------------------- STAFF APPLICATION REVIEW & DATE FILTERING
@router.get("/applications")
def list_applications_for_staff(
    date_filter: Optional[str] = Query("all", alias="dateRange", description="Filter by: all, today, yesterday, this_week, this_month"),
    start_date: Optional[date] = Query(None, alias="startDate"),
    end_date: Optional[date] = Query(None, alias="endDate"),
    status_filter: Optional[str] = Query("all", alias="status"),
    account_type: Optional[str] = Query("all", alias="accountType"),
    page_num: int = Query(1, ge=1, alias="page"),
    limit_num: int = Query(20, ge=1, le=100, alias="limit"),
    staff: Dict[str, Any] = Depends(require_staff_or_admin)
):
    """
    Bank Staff Management Portal:
    List, filter, and inspect customer account opening applications based on date ranges and status.
    Only shows submitted applications; saved drafts are excluded (Item 7).
    """
    today_date = date.today()
    yesterday_date = today_date - timedelta(days=1)
    week_start_date = today_date - timedelta(days=7)
    month_start_date = today_date - timedelta(days=30)

    # Sync persistent applications from SQL database into DB["applications"]
    try:
        for sa in list_sql_applications():
            num = sa.get("applicationNumber")
            if not num:
                continue
            if num not in DB["applications"]:
                DB["applications"][num] = sa
            else:
                DB["applications"][num]["status"] = sa.get("status", DB["applications"][num].get("status"))
                if sa.get("applicant"):
                    DB["applications"][num]["applicant"] = sa["applicant"]
                if sa.get("accountType"):
                    DB["applications"][num]["accountType"] = sa["accountType"]
    except Exception as e:
        print(f"Warning: Failed to sync applications from SQL: {e}")

    filtered_apps = []

    for app in DB["applications"].values():
        # Exclude draft applications strictly (Item 7)
        if app.get("isDraft") or app.get("status") in ("DRAFT_INITIATED", "DRAFT_SAVED"):
            continue

        # Date parsing
        created_str = app.get("createdAt", "")[:10]
        try:
            created_d = date.fromisoformat(created_str)
        except Exception:
            created_d = today_date

        # Check Quick Date Filter
        if date_filter == "today" and created_d != today_date:
            continue
        elif date_filter == "yesterday" and created_d != yesterday_date:
            continue
        elif date_filter == "this_week" and created_d < week_start_date:
            continue
        elif date_filter == "this_month" and created_d < month_start_date:
            continue

        # Check Custom Date Range
        if start_date and created_d < start_date:
            continue
        if end_date and created_d > end_date:
            continue

        # Status filter
        if status_filter != "all" and app.get("status") != status_filter:
            continue

        # Account type filter
        if account_type != "all" and app.get("accountType") != account_type:
            continue

        safe_app = dict(app)
        safe_app.pop("password", None)  # Protect password from serialization
        safe_app["documents"] = list_documents_for_application(app["applicationNumber"])
        filtered_apps.append(safe_app)

    # Sort descending by creation date
    filtered_apps.sort(key=lambda x: x.get("createdAt", ""), reverse=True)

    # Compute high-level date metrics for submitted apps
    all_apps = [a for a in DB["applications"].values() if not a.get("isDraft") and a.get("status") not in ("DRAFT_INITIATED", "DRAFT_SAVED")]
    total_today = sum(1 for a in all_apps if a.get("createdAt", "")[:10] == str(today_date))
    pending_total = sum(1 for a in all_apps if a.get("status") in ("SUBMITTED", "UNDER_REVIEW"))
    approved_total = sum(1 for a in all_apps if a.get("status") in ("APPROVED", "ACCOUNT_OPENED"))

    paginated_result = paginate(filtered_apps, page_num, limit_num)
    paginated_result["metrics"] = {
        "totalApplications": len(all_apps),
        "receivedToday": total_today,
        "pendingReview": pending_total,
        "approved": approved_total
    }
    return paginated_result

@router.get("/applications/{applicationNumber}")
def get_application_detail_for_staff(
    applicationNumber: str,
    staff: Dict[str, Any] = Depends(require_staff_or_admin)
):
    """
    Inspect full application dossier with identity documents, tax ID, and applicant details.
    Auto-transitions status from SUBMITTED to UNDER_REVIEW upon first staff inspection (Item 14).
    """
    app = DB["applications"].get(applicationNumber)
    if not app:
        app = get_sql_application(applicationNumber)
        if app:
            DB["applications"][applicationNumber] = app
    if not app:
        fail(404, "Application not found", "APPLICATION_NOT_FOUND")

    # Item 14: If viewing for first time while SUBMITTED, move to UNDER_REVIEW
    if app.get("status") == "SUBMITTED":
        app["status"] = "UNDER_REVIEW"
        app["reviewStartedAt"] = now_iso()
        app["reviewedBy"] = staff.get("id")
        try:
            store_sql_application(app)
        except Exception:
            pass

    safe_app = dict(app)
    safe_app.pop("password", None)
    safe_app["documents"] = list_documents_for_application(applicationNumber)
    safe_app["officerMessages"] = app.get("officerMessages", [])
    return safe_app

@router.post("/applications/{applicationNumber}/message")
def send_officer_message(
    applicationNumber: str,
    payload: Dict[str, Any],
    staff: Dict[str, Any] = Depends(require_staff_or_admin)
):
    """
    Item 15: Post a bank officer communication/note to the applicant regarding documents or required edits.
    This appears in the applicant's status tracking view.
    """
    app = DB["applications"].get(applicationNumber) or get_sql_application(applicationNumber)
    if not app:
        fail(404, "Application not found", "APPLICATION_NOT_FOUND")

    msg_text = (payload.get("message") or "").strip()
    if not msg_text:
        fail(400, "Message content cannot be empty", "EMPTY_MESSAGE")

    officer_name = staff.get("profile", {}).get("firstName") or staff.get("name") or "Bank Officer"
    msg_entry = {
        "id": generate_id("msg"),
        "sender": "OFFICER",
        "senderName": officer_name,
        "message": msg_text,
        "timestamp": now_iso()
    }
    if "officerMessages" not in app or not isinstance(app["officerMessages"], list):
        app["officerMessages"] = []
    app["officerMessages"].append(msg_entry)
    DB["applications"][applicationNumber] = app

    try:
        store_sql_application(app)
    except Exception as e:
        print(f"Warning: Failed to persist officer message to SQL: {e}")

    audit_log(staff["id"], "APPLICATION_OFFICER_MESSAGE", f"{applicationNumber}: {msg_text[:30]}")
    return {"success": True, "message": "Officer message dispatched successfully.", "entry": msg_entry}

@router.post("/applications/{applicationNumber}/revert-status")
def revert_application_status(
    applicationNumber: str,
    payload: Dict[str, Any],
    staff: Dict[str, Any] = Depends(require_staff_or_admin)
):
    """
    Item 16: If an application was mistakenly rejected or closed, allow reverting back to UNDER_REVIEW or SUBMITTED.
    """
    app = DB["applications"].get(applicationNumber) or get_sql_application(applicationNumber)
    if not app:
        fail(404, "Application not found", "APPLICATION_NOT_FOUND")

    target_status = payload.get("targetStatus", "UNDER_REVIEW")
    if target_status not in ("UNDER_REVIEW", "SUBMITTED"):
        fail(400, "Invalid target status. Can only revert to UNDER_REVIEW or SUBMITTED.", "INVALID_STATUS")

    old_status = app.get("status")
    app["status"] = target_status
    app["updatedAt"] = now_iso()
    app["revertedAt"] = now_iso()
    app["revertedBy"] = staff["id"]
    if payload.get("reason"):
        app["revertReason"] = payload["reason"]

    DB["applications"][applicationNumber] = app
    try:
        store_sql_application(app)
    except Exception as e:
        print(f"Warning: Failed to persist status revert to SQL: {e}")

    audit_log(staff["id"], "APPLICATION_STATUS_REVERT", f"{applicationNumber}:{old_status}->{target_status}")
    return {
        "success": True,
        "applicationNumber": applicationNumber,
        "status": target_status,
        "message": f"Application status successfully reverted to {target_status}."
    }

@router.post("/applications/{applicationNumber}/review")
def review_and_open_account(
    applicationNumber: str,
    review: ApplicationReviewRequest,
    staff: Dict[str, Any] = Depends(require_staff_or_admin)
):
    """
    Staff review decision:
    - If APPROVED: Automatically provisions customer User record, approves KYC, opens the new Bank Account,
      and issues debit cards according to user preference (RuPay / Visa / Mastercard, Virtual / Metal)!
    - If REJECTED: Records reason and notifies applicant.
    """
    app = DB["applications"].get(applicationNumber) or get_sql_application(applicationNumber)
    if not app:
        fail(404, "Application not found", "APPLICATION_NOT_FOUND")

    if app.get("status") in ("ACCOUNT_OPENED", "APPROVED"):
        fail(409, f"Application has already been approved and account opened ({app.get('status')})", "APPLICATION_ALREADY_OPENED")

    app["reviewedAt"] = now_iso()
    app["reviewedBy"] = staff["id"]
    app["reviewNotes"] = review.notes or f"Application {review.decision.lower()} by bank officer {staff.get('email')}."

    # Item 12: Bank Verifying Officer Details for Office Use Section
    officer_name = staff.get("profile", {}).get("firstName") or staff.get("name") or "Alexander Sterling"
    officer_empcode = staff.get("employeeCode") or "EMP01"
    app["verifyingOfficerName"] = officer_name
    app["officerEmpCode"] = officer_empcode

    if review.decision == "REJECTED":
        app["status"] = "REJECTED"
        DB["applications"][applicationNumber] = app
        try:
            store_sql_application(app)
        except Exception:
            pass
        audit_log(staff["id"], "ONBOARDING_REJECT", applicationNumber)
        return {
            "applicationNumber": applicationNumber,
            "status": "REJECTED",
            "notes": app["reviewNotes"]
        }

    # ==================== AUTOMATIC PROVISIONING UPON APPROVAL ====================
    applicant = app.get("applicant", {})
    user_email = applicant.get("email") or f"customer_{random.randint(1000,9999)}@bank.test"
    user_id = generate_id("usr")
    customer_pwd = app.get("password") or "Password123!"

    # 1. Create Active Customer User
    customer_user_record = {
        "id": user_id,
        "email": user_email,
        "password": customer_pwd,
        "role": "CUSTOMER",
        "status": "ACTIVE",
        "mfa": None,
        "createdAt": now_iso(),
        "profile": {
            "firstName": applicant.get("firstName", "Applicant"),
            "lastName": applicant.get("lastName", "Customer"),
            "dob": applicant.get("dob", "1990-01-01"),
            "phone": applicant.get("phone", "9876543210"),
            "address": applicant.get("address", {})
        },
        "preferences": {"currency": app.get("currency", "USD")},
        "marketingConsent": True
    }
    DB["users"][user_id] = customer_user_record

    # Item 2 & 5: Persist to SQL user table with phone so applicant can log in via email OR phone with provided password!
    try:
        create_or_sync_user(
            user_id=user_id,
            email=user_email,
            password_hash=customer_pwd,
            role="CUSTOMER",
            first_name=applicant.get("firstName", "Applicant"),
            last_name=applicant.get("lastName", "Customer"),
            phone=applicant.get("phone", "9876543210")
        )
    except Exception as e:
        print(f"Warning: Failed to sync approved customer to SQL users: {e}")

    # 2. Create Approved KYC Record
    kyc_id = generate_id("kyc")
    DB["kyc"][kyc_id] = {
        "id": kyc_id,
        "ownerId": user_id,
        "status": "APPROVED",
        "documents": [app.get("identityDocument", {}), app.get("addressProof", {})],
        "employment": app.get("employment", {}),
        "pepDeclaration": False,
        "taxResidencies": [applicant.get("address", {}).get("country", "IN")],
        "createdAt": now_iso(),
        "reviewedAt": now_iso()
    }

    # 3. Create Activated Bank Account
    acc_id = generate_id("acc")
    acc_number = str(random.randint(10**9, 10**10 - 1))
    account_type = app.get("accountType", "SAVINGS")
    currency = app.get("currency", "INR")
    overdraft = 500.0 if account_type in ("CHECKING", "SALARY") else 0.0

    account_record = {
        "id": acc_id,
        "ownerId": user_id,
        "kycId": kyc_id,
        "accountNumber": acc_number,
        "type": account_type,
        "currency": currency,
        "balance": 0.0,
        "overdraftLimit": overdraft,
        "nickname": f"Primary {account_type.capitalize()} Account",
        "status": "ACTIVE",
        "nominees": [],
        "createdAt": now_iso()
    }
    DB["accounts"][acc_id] = account_record

    # Post Initial Deposit if specified
    initial_deposit = float(app.get("initialDeposit", 0.0))
    if initial_deposit > 0:
        post_transaction(account_record, "DEPOSIT", initial_deposit, reference="Initial account opening deposit")

    # 4. Item 18: Issue Debit Card(s) based on chosen scheme (RuPay / Visa / Mastercard) and format (Virtual / Metal / Both)
    chosen_scheme = (app.get("cardScheme") or "RUPAY").upper()
    chosen_format = (app.get("cardFormat") or "BOTH").upper()
    cardholder_name = f"{applicant.get('firstName', '')} {applicant.get('lastName', '')}".strip().upper() or "BANK CUSTOMER"

    if chosen_format in ("VIRTUAL", "BOTH"):
        v_card_id = generate_id("crd")
        DB["cards"][v_card_id] = {
            "id": v_card_id,
            "ownerId": user_id,
            "accountId": acc_id,
            "type": "VIRTUAL",
            "network": chosen_scheme,
            "cardholderName": cardholder_name,
            "last4": f"{random.randint(1000, 9999):04d}",
            "status": "ACTIVE",
            "pin": "1234",
            "limits": {"daily": 3000.0, "monthly": 15000.0, "atm": 1000.0},
            "createdAt": now_iso()
        }

    if chosen_format in ("METAL", "BOTH"):
        m_card_id = generate_id("crd")
        DB["cards"][m_card_id] = {
            "id": m_card_id,
            "ownerId": user_id,
            "accountId": acc_id,
            "type": "METAL",
            "network": chosen_scheme,
            "cardholderName": cardholder_name,
            "last4": f"{random.randint(1000, 9999):04d}",
            "status": "ACTIVE",
            "pin": "1234",
            "limits": {"daily": 10000.0, "monthly": 50000.0, "atm": 3000.0},
            "createdAt": now_iso()
        }

    # Item 12: Record allocated account and verification officer details
    app["status"] = "ACCOUNT_OPENED"
    app["generatedUserId"] = user_id
    app["generatedAccountId"] = acc_id
    app["generatedAccountNumber"] = acc_number
    app["officeAllocatedAcc"] = acc_number
    app["verifyingOfficerName"] = officer_name
    app["officerEmpCode"] = officer_empcode

    DB["applications"][applicationNumber] = app
    try:
        store_sql_application(app)
    except Exception as e:
        print(f"Warning: Failed to persist approved application to SQL: {e}")

    send_notification(user_id, f"Welcome to NeoBank! Your application #{applicationNumber} was approved and Account #{acc_number} is open.")
    audit_log(staff["id"], "ONBOARDING_APPROVE_AND_OPEN", f"{applicationNumber}:{acc_number}")

    return {
        "applicationNumber": applicationNumber,
        "status": "ACCOUNT_OPENED",
        "userId": user_id,
        "accountNumber": acc_number,
        "accountType": account_type,
        "initialBalance": initial_deposit,
        "cardScheme": chosen_scheme,
        "cardFormat": chosen_format,
        "message": f"Account #{acc_number} provisioned and credentials activated for {user_email}."
    }

# ----------------------------------------------------------------- CUSTOMER PROFILE / APPLICATION UPDATE (Item 20)
@router.post("/request-update", status_code=status.HTTP_201_CREATED)
def request_application_update(payload: Dict[str, Any]):
    """
    Item 20: Post-account-opening customer application update request.
    Allows existing customers to request updates with account number (Application Type* = UPDATE).
    """
    account_number = payload.get("accountNumber")
    if not account_number:
        fail(400, "Account number is required for profile/application updates", "MISSING_ACCOUNT_NUMBER")

    current_year = datetime.now().year
    random_digits = random.randint(100000, 999999)
    app_number = f"UPD-{current_year}-{random_digits}"

    update_record = {
        "applicationNumber": app_number,
        "applicationType": "UPDATE",
        "accountType": "UPDATE",
        "linkedAccountNumber": account_number,
        "status": "SUBMITTED",
        "createdAt": now_iso(),
        "updatedAt": now_iso(),
        "initialDeposit": 0.0,
        "taxId": payload.get("taxId", "N/A"),
        "applicant": {
            "firstName": payload.get("firstName", "Existing"),
            "lastName": payload.get("lastName", "Customer"),
            "email": payload.get("email", ""),
            "phone": payload.get("phone", ""),
            "address": payload.get("address", {})
        },
        "updateReason": payload.get("reason", "Customer requested profile & mandate updates"),
        "updateFields": payload.get("fields", {}),
        "notes": payload.get("notes", "Submitted via Customer Online Banking Portal")
    }

    DB["applications"][app_number] = update_record
    try:
        store_sql_application(update_record)
    except Exception as e:
        print(f"Warning: Failed to persist update application to SQL: {e}")

    audit_log(payload.get("email", "customer"), "APPLICATION_UPDATE_REQUEST", f"{app_number}:{account_number}")
    return {
        "success": True,
        "applicationNumber": app_number,
        "status": "SUBMITTED",
        "applicationType": "UPDATE",
        "linkedAccountNumber": account_number,
        "message": f"Update request #{app_number} registered for Account #{account_number}. Bank staff will review the changes."
    }
