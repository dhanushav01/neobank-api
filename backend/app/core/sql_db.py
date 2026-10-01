"""
NeoBank SQL Database Manager:
Manages persistent SQLite relational storage, schema migrations,
encrypted document BLOB storage, salted password persistence, and audit logging.
"""
import os
import json
import sqlite3
from datetime import datetime
from typing import Dict, Any, List, Optional
from backend.app.core.crypto_utils import hash_password, encrypt_document, decrypt_document

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data"))
os.makedirs(DATA_DIR, exist_ok=True)
DB_PATH = os.path.join(DATA_DIR, "neobank.db")

def get_db_connection() -> sqlite3.Connection:
    """Acquire a thread-safe connection to the SQLite database with row factory."""
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def init_sql_database():
    """Create all required relational tables, indexes, and encrypted BLOB tables."""
    conn = get_db_connection()
    with conn:
        # 1. Users Table
        conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'ACTIVE',
                first_name TEXT NOT NULL,
                last_name TEXT NOT NULL,
                dob TEXT,
                phone TEXT,
                address_json TEXT,
                employee_code TEXT,
                department TEXT,
                has_sql_access INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL
            );
        """)

        # Migration: Ensure has_sql_access exists on existing tables
        try:
            conn.execute("ALTER TABLE users ADD COLUMN has_sql_access INTEGER NOT NULL DEFAULT 0;")
        except Exception:
            pass

        # 2. Bank Accounts Table
        conn.execute("""
            CREATE TABLE IF NOT EXISTS accounts (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                account_number TEXT UNIQUE NOT NULL,
                type TEXT NOT NULL,
                currency TEXT NOT NULL DEFAULT 'USD',
                balance REAL NOT NULL DEFAULT 0.0,
                overdraft_limit REAL NOT NULL DEFAULT 0.0,
                nickname TEXT,
                status TEXT NOT NULL DEFAULT 'ACTIVE',
                created_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        """)

        # 3. Transactions Table
        conn.execute("""
            CREATE TABLE IF NOT EXISTS transactions (
                id TEXT PRIMARY KEY,
                account_id TEXT NOT NULL,
                type TEXT NOT NULL,
                amount REAL NOT NULL,
                currency TEXT NOT NULL DEFAULT 'USD',
                balance_after REAL NOT NULL,
                reference TEXT,
                channel TEXT DEFAULT 'ONLINE',
                created_at TEXT NOT NULL,
                FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
            );
        """)

        # 4. Debit & Virtual Cards Table
        conn.execute("""
            CREATE TABLE IF NOT EXISTS cards (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                account_id TEXT NOT NULL,
                type TEXT NOT NULL,
                network TEXT NOT NULL DEFAULT 'VISA',
                cardholder_name TEXT NOT NULL,
                last4 TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'ACTIVE',
                daily_limit REAL DEFAULT 3000.0,
                monthly_limit REAL DEFAULT 15000.0,
                atm_limit REAL DEFAULT 1000.0,
                created_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
            );
        """)

        # 5. Loan Applications Table
        conn.execute("""
            CREATE TABLE IF NOT EXISTS loans (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                account_id TEXT,
                amount REAL NOT NULL,
                apr REAL NOT NULL,
                term_months INTEGER NOT NULL,
                monthly_payment REAL NOT NULL,
                purpose TEXT,
                status TEXT NOT NULL DEFAULT 'PENDING',
                created_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        """)

        # 6. Transaction Disputes Table
        conn.execute("""
            CREATE TABLE IF NOT EXISTS disputes (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                transaction_id TEXT NOT NULL,
                amount REAL NOT NULL,
                reason TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'PENDING',
                resolution TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        """)

        # 7. Customer Account Opening Applications Table
        conn.execute("""
            CREATE TABLE IF NOT EXISTS applications (
                application_number TEXT PRIMARY KEY,
                email TEXT NOT NULL,
                account_type TEXT NOT NULL,
                currency TEXT NOT NULL DEFAULT 'USD',
                initial_deposit REAL NOT NULL DEFAULT 0.0,
                tax_id TEXT NOT NULL,
                password_hash TEXT NOT NULL,
                applicant_json TEXT NOT NULL,
                employment_json TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'SUBMITTED',
                created_at TEXT NOT NULL,
                reviewed_at TEXT,
                reviewed_by TEXT,
                review_notes TEXT,
                generated_account_number TEXT,
                form_data_json TEXT,
                branch_name TEXT,
                branch_code TEXT
            );
        """)

        # Backward compatibility column migrations for applications
        for col_def in ("form_data_json TEXT", "branch_name TEXT", "branch_code TEXT"):
            try:
                conn.execute(f"ALTER TABLE applications ADD COLUMN {col_def};")
            except Exception:
                pass


        # 8. Encrypted Documents & PDFs Table (Stores encrypted BLOBs)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS encrypted_documents (
                id TEXT PRIMARY KEY,
                application_number TEXT,
                user_id TEXT,
                doc_category TEXT NOT NULL, -- IDENTITY, ADDRESS_PROOF, INCOME_PROOF
                doc_type TEXT NOT NULL,     -- PASSPORT, DRIVERS_LICENSE, UTILITY_BILL, etc.
                doc_number TEXT,
                file_name TEXT NOT NULL,
                file_mime TEXT NOT NULL DEFAULT 'application/octet-stream',
                file_size_bytes INTEGER NOT NULL,
                encrypted_blob BLOB NOT NULL, -- Encrypted AES-256 ciphertext
                is_encrypted INTEGER NOT NULL DEFAULT 1,
                created_at TEXT NOT NULL,
                FOREIGN KEY (application_number) REFERENCES applications(application_number) ON DELETE SET NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            );
        """)

        # 9. Audit Logs Table
        conn.execute("""
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                actor_id TEXT NOT NULL,
                action TEXT NOT NULL,
                resource TEXT,
                details TEXT,
                timestamp TEXT NOT NULL
            );
        """)

        # 10. Login OTPs Table for Email / Phone OTP Authentication
        conn.execute("""
            CREATE TABLE IF NOT EXISTS login_otps (
                id TEXT PRIMARY KEY,
                identifier TEXT NOT NULL,
                otp_code TEXT NOT NULL,
                expires_at TEXT NOT NULL,
                used INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL
            );
        """)

        # Create indexes for fast lookups
        conn.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_accounts_user ON accounts(user_id);")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_accounts_number ON accounts(account_number);")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_transactions_acc ON transactions(account_id);")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_apps_email ON applications(email);")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_apps_date ON applications(created_at);")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_login_otps_ident ON login_otps(identifier);")

    seed_sql_database()

def seed_sql_database():
    """Populate default accounts if tables are fresh."""
    conn = get_db_connection()
    with conn:
        count = conn.execute("SELECT COUNT(*) as cnt FROM users;").fetchone()["cnt"]
        if count == 0:
            now_str = datetime.now().isoformat()
            
            # Default Customer: customer@bank.test / Customer@1234
            cust_id = "usr_seed_customer"
            conn.execute("""
                INSERT INTO users (id, email, password_hash, role, status, first_name, last_name, dob, phone, address_json, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                cust_id, "customer@bank.test", hash_password("Customer@1234"), "CUSTOMER", "ACTIVE",
                "Jane", "Doe", "1995-05-15", "+447700900123",
                json.dumps({"line1": "10 Downing Street", "city": "London", "postalCode": "SW1A 2AA", "country": "GB"}),
                now_str
            ))

            # Default Staff/Admin: admin@bank.test / Admin@1234
            admin_id = "usr_seed_admin"
            conn.execute("""
                INSERT INTO users (id, email, password_hash, role, status, first_name, last_name, dob, phone, employee_code, department, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                admin_id, "admin@bank.test", hash_password("Admin@1234"), "SUPER_ADMIN", "ACTIVE",
                "Alexander", "Sterling", "1988-01-01", "+447700900000",
                "EMP-001", "EXECUTIVE", now_str
            ))

            # Seed Account for Customer
            acc_id = "acc_seed_primary"
            conn.execute("""
                INSERT INTO accounts (id, user_id, account_number, type, currency, balance, overdraft_limit, nickname, status, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                acc_id, cust_id, "1002938471", "CHECKING", "USD", 14850.50, 2000.0, "Everyday Checking", "ACTIVE", now_str
            ))

            # Seed Transactions
            conn.execute("""
                INSERT INTO transactions (id, account_id, type, amount, currency, balance_after, reference, channel, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, ("tx_seed_1", acc_id, "DEPOSIT", 15000.0, "USD", 15000.0, "Initial Salary Deposit", "ONLINE", now_str))

            conn.execute("""
                INSERT INTO transactions (id, account_id, type, amount, currency, balance_after, reference, channel, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, ("tx_seed_2", acc_id, "WITHDRAWAL", 149.50, "USD", 14850.50, "Coffee & Grocery", "ATM", now_str))

            # Seed Card
            conn.execute("""
                INSERT INTO cards (id, user_id, account_id, type, network, cardholder_name, last4, status, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, ("crd_seed_1", cust_id, acc_id, "VIRTUAL", "VISA", "JANE DOE", "4821", "ACTIVE", now_str))

# ----------------------------------------------------------------- OTP MANAGEMENT (SQL)
def generate_and_save_otp(identifier: str, minutes_valid: int = 10) -> str:
    """Generate and persist a 6-digit OTP code in SQL for email or phone login."""
    import random
    from datetime import timedelta
    clean_ident = identifier.strip().lower()
    otp_code = f"{random.randint(100000, 999999):06d}"
    now_dt = datetime.now()
    expires_dt = now_dt + timedelta(minutes=minutes_valid)
    now_str = now_dt.isoformat()
    expires_str = expires_dt.isoformat()
    otp_id = f"otp_{os.urandom(8).hex()}"

    conn = get_db_connection()
    with conn:
        # Invalidate any existing unused OTPs for this identifier
        conn.execute("UPDATE login_otps SET used = 1 WHERE identifier = ? AND used = 0", (clean_ident,))
        # Insert new OTP
        conn.execute("""
            INSERT INTO login_otps (id, identifier, otp_code, expires_at, used, created_at)
            VALUES (?, ?, ?, ?, 0, ?)
        """, (otp_id, clean_ident, otp_code, expires_str, now_str))

    return otp_code

def verify_and_consume_otp(identifier: str, otp_code: str) -> bool:
    """Validate an OTP code against SQL table and consume it upon successful verification."""
    clean_ident = identifier.strip().lower()
    clean_code = otp_code.strip()
    now_str = datetime.now().isoformat()

    conn = get_db_connection()
    with conn:
        row = conn.execute("""
            SELECT * FROM login_otps
            WHERE identifier = ? AND otp_code = ? AND used = 0 AND expires_at > ?
            ORDER BY created_at DESC LIMIT 1
        """, (clean_ident, clean_code, now_str)).fetchone()

        if not row:
            return False

        # Mark OTP as consumed
        conn.execute("UPDATE login_otps SET used = 1 WHERE id = ?", (row["id"],))
        return True

# ----------------------------------------------------------------- USER MANAGEMENT (SQL)
def get_sql_user_by_identifier(ident: str) -> Optional[Dict[str, Any]]:
    """Lookup a user by email or phone number in SQL database."""
    clean = ident.strip().lower()
    conn = get_db_connection()
    # Check email
    row = conn.execute("SELECT * FROM users WHERE LOWER(email) = ?", (clean,)).fetchone()
    if not row:
        # Check phone
        row = conn.execute("SELECT * FROM users WHERE phone = ?", (ident.strip(),)).fetchone()
    if not row:
        return None
    return dict(row)

def get_sql_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    """Lookup a user by user_id in SQL database."""
    conn = get_db_connection()
    row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    if not row:
        return None
    return dict(row)

def create_or_sync_user(
    user_id: str,
    email: str,
    password_hash: str,
    role: str = "CUSTOMER",
    first_name: str = "Customer",
    last_name: str = "User",
    phone: Optional[str] = None,
    dob: Optional[str] = None,
    address_json: Optional[str] = None,
    employee_code: Optional[str] = None,
    department: Optional[str] = None,
    has_sql_access: bool = False
) -> Dict[str, Any]:
    """Insert or update a user record in the SQL database."""
    now_str = datetime.now().isoformat()
    clean_email = email.strip().lower()
    sql_access_int = 1 if has_sql_access else 0
    conn = get_db_connection()
    with conn:
        existing = conn.execute("SELECT * FROM users WHERE LOWER(email) = ?", (clean_email,)).fetchone()
        if existing:
            return dict(existing)

        conn.execute("""
            INSERT INTO users (id, email, password_hash, role, status, first_name, last_name, dob, phone, address_json, employee_code, department, has_sql_access, created_at)
            VALUES (?, ?, ?, ?, 'ACTIVE', ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (user_id, clean_email, password_hash, role, first_name, last_name, dob, phone, address_json, employee_code, department, sql_access_int, now_str))

        # Also create default bank account
        acc_num = f"10{abs(hash(clean_email)) % 100000000:08d}"
        conn.execute("""
            INSERT INTO accounts (id, user_id, account_number, type, currency, balance, nickname, status, created_at)
            VALUES (?, ?, ?, 'CHECKING', 'USD', 1000.0, 'Primary Checking', 'ACTIVE', ?)
        """, (f"acc_{user_id}", user_id, acc_num, now_str))

    return get_sql_user_by_id(user_id)

def update_sql_user_password(user_id: str, new_password_hash: str) -> bool:
    """Update password hash for a user in the SQL database."""
    conn = get_db_connection()
    with conn:
        conn.execute("UPDATE users SET password_hash = ? WHERE id = ?", (new_password_hash, user_id))
    return True


# ----------------------------------------------------------------- DOCUMENT STORAGE (SQL + AES-256)
def store_encrypted_document(
    doc_id: str,
    application_number: Optional[str],
    user_id: Optional[str],
    doc_category: str,
    doc_type: str,
    doc_number: Optional[str],
    file_name: str,
    file_mime: str,
    raw_content: bytes
) -> Dict[str, Any]:
    """Encrypt raw document bytes with AES-256 and store as an encrypted BLOB in the SQL database."""
    encrypted_blob = encrypt_document(raw_content)
    file_size = len(raw_content)
    created_at = datetime.now().isoformat()

    conn = get_db_connection()
    with conn:
        app_num = application_number
        if app_num:
            app_exists = conn.execute("SELECT 1 FROM applications WHERE application_number = ?", (app_num,)).fetchone()
            if not app_exists:
                # Ensure placeholder application exists to satisfy foreign key constraint
                conn.execute("""
                    INSERT OR IGNORE INTO applications (
                        application_number, email, account_type, currency, initial_deposit,
                        tax_id, password_hash, applicant_json, employment_json, status, created_at
                    ) VALUES (?, 'pending@applicant.bank', 'SAVINGS', 'USD', 0.0, 'PENDING', '', '{}', '{}', 'SUBMITTED', ?)
                """, (app_num, created_at))

        usr_num = user_id
        if usr_num:
            usr_exists = conn.execute("SELECT 1 FROM users WHERE id = ?", (usr_num,)).fetchone()
            if not usr_exists:
                usr_num = None

        conn.execute("""
            INSERT INTO encrypted_documents (
                id, application_number, user_id, doc_category, doc_type, doc_number,
                file_name, file_mime, file_size_bytes, encrypted_blob, is_encrypted, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
        """, (
            doc_id, app_num, usr_num, doc_category, doc_type, doc_number,
            file_name, file_mime, file_size, encrypted_blob, created_at
        ))

    return {
        "id": doc_id,
        "applicationNumber": app_num,
        "fileName": file_name,
        "fileMime": file_mime,
        "sizeBytes": file_size,
        "docCategory": doc_category,
        "docType": doc_type,
        "isEncrypted": True,
        "createdAt": created_at
    }

def retrieve_and_decrypt_document(doc_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve an encrypted document from the SQL database and decrypt it in memory."""
    conn = get_db_connection()
    row = conn.execute("SELECT * FROM encrypted_documents WHERE id = ?", (doc_id,)).fetchone()
    if not row:
        return None

    decrypted_bytes = decrypt_document(row["encrypted_blob"])
    return {
        "id": row["id"],
        "applicationNumber": row["application_number"],
        "docCategory": row["doc_category"],
        "docType": row["doc_type"],
        "fileName": row["file_name"],
        "fileMime": row["file_mime"],
        "sizeBytes": row["file_size_bytes"],
        "contentBytes": decrypted_bytes,
        "createdAt": row["created_at"]
    }

def list_documents_for_application(app_number: str) -> List[Dict[str, Any]]:
    """Retrieve metadata of all encrypted documents attached to an application from SQL."""
    conn = get_db_connection()
    rows = conn.execute("""
        SELECT id, application_number, user_id, doc_category, doc_type, doc_number,
               file_name, file_mime, file_size_bytes, is_encrypted, created_at
        FROM encrypted_documents WHERE application_number = ?
    """, (app_number,)).fetchall()
    return [dict(r) for r in rows]

# ----------------------------------------------------------------- APPLICATION MANAGEMENT (SQL)
def store_sql_application(app_record: Dict[str, Any]) -> None:
    """Save customer account opening application record into SQL database."""
    conn = get_db_connection()
    with conn:
        applicant = app_record.get("applicant", {})
        form_data = app_record.get("formData", {})
        app_num = app_record["applicationNumber"]
        
        # Guard: Never allow a draft save to overwrite a submitted/active application in SQL
        existing_row = conn.execute("SELECT status FROM applications WHERE application_number = ?", (app_num,)).fetchone()
        target_status = app_record.get("status", "SUBMITTED")
        if existing_row and existing_row["status"] in ("SUBMITTED", "UNDER_REVIEW", "APPROVED", "ACCOUNT_OPENED", "REJECTED"):
            if target_status in ("DRAFT_INITIATED", "DRAFT_SAVED"):
                target_status = existing_row["status"]
                app_record["status"] = target_status

        conn.execute("""
            INSERT OR REPLACE INTO applications (
                application_number, email, account_type, currency, initial_deposit,
                tax_id, password_hash, applicant_json, employment_json, status,
                created_at, reviewed_at, reviewed_by, review_notes, generated_account_number,
                form_data_json, branch_name, branch_code
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            app_num,
            applicant.get("email", app_record.get("email", "")),
            app_record.get("accountType", "SAVINGS"),
            app_record.get("currency", "USD"),
            float(app_record.get("initialDeposit", 0.0)),
            app_record.get("taxId", ""),
            hash_password(app_record.get("password", "Customer@1234")),
            json.dumps(applicant),
            json.dumps(app_record.get("employment", {})),
            target_status,
            app_record.get("createdAt", datetime.now().isoformat()),
            app_record.get("reviewedAt"),
            app_record.get("reviewedBy"),
            app_record.get("reviewNotes"),
            app_record.get("generatedAccountNumber"),
            json.dumps(form_data) if form_data else None,
            app_record.get("branchName", ""),
            app_record.get("branchCode", "")
        ))

def get_sql_application(app_number: str) -> Optional[Dict[str, Any]]:
    """Retrieve an application from the SQL database."""
    conn = get_db_connection()
    row = conn.execute("SELECT * FROM applications WHERE application_number = ?", (app_number,)).fetchone()
    if not row:
        return None
    d = dict(row)
    d["applicationNumber"] = d.get("application_number", "")
    d["accountType"] = d.get("account_type", "SAVINGS")
    d["initialDeposit"] = float(d.get("initial_deposit") or 0.0)
    d["taxId"] = d.get("tax_id", "")
    d["createdAt"] = d.get("created_at")
    d["reviewedAt"] = d.get("reviewed_at")
    d["reviewedBy"] = d.get("reviewed_by")
    d["reviewNotes"] = d.get("review_notes")
    d["generatedAccountNumber"] = d.get("generated_account_number")
    d["branchName"] = d.get("branch_name", "")
    d["branchCode"] = d.get("branch_code", "")

    try:
        d["applicant"] = json.loads(d.get("applicant_json") or "{}")
    except Exception:
        d["applicant"] = {}
    try:
        d["employment"] = json.loads(d.get("employment_json") or "{}")
    except Exception:
        d["employment"] = {}
    try:
        d["formData"] = json.loads(d.get("form_data_json") or "{}")
    except Exception:
        d["formData"] = {}
    d["officeVerification"] = d["formData"].get("officeVerification")
    d["verifyingOfficerName"] = d["formData"].get("verifyingOfficerName") or d.get("reviewedBy")
    d["officerEmpCode"] = d["formData"].get("officerEmpCode") or "EMP01"
    d["riskCategory"] = d["formData"].get("riskCategory", "LOW")
    d["kycMode"] = d["formData"].get("kycMode", "In-Person Verification (IPV)")
    d["ipvVerified"] = d["formData"].get("ipvVerified", True)
    return d

def list_sql_applications() -> List[Dict[str, Any]]:
    """Retrieve all applications from SQL relational storage with properly mapped fields."""
    conn = get_db_connection()
    rows = conn.execute("SELECT * FROM applications ORDER BY created_at DESC").fetchall()
    results = []
    for row in rows:
        d = dict(row)
        d["applicationNumber"] = d.get("application_number", "")
        d["accountType"] = d.get("account_type", "SAVINGS")
        d["initialDeposit"] = float(d.get("initial_deposit") or 0.0)
        d["taxId"] = d.get("tax_id", "")
        d["createdAt"] = d.get("created_at")
        d["reviewedAt"] = d.get("reviewed_at")
        d["reviewedBy"] = d.get("reviewed_by")
        d["reviewNotes"] = d.get("review_notes")
        d["generatedAccountNumber"] = d.get("generated_account_number")
        d["branchName"] = d.get("branch_name", "")
        d["branchCode"] = d.get("branch_code", "")
        try:
            d["applicant"] = json.loads(d.get("applicant_json") or "{}")
        except Exception:
            d["applicant"] = {}
        try:
            d["employment"] = json.loads(d.get("employment_json") or "{}")
        except Exception:
            d["employment"] = {}
        try:
            d["formData"] = json.loads(d.get("form_data_json") or "{}")
        except Exception:
            d["formData"] = {}
        d["officeVerification"] = d["formData"].get("officeVerification")
        d["verifyingOfficerName"] = d["formData"].get("verifyingOfficerName") or d.get("reviewedBy")
        d["officerEmpCode"] = d["formData"].get("officerEmpCode") or "EMP01"
        d["riskCategory"] = d["formData"].get("riskCategory", "LOW")
        d["kycMode"] = d["formData"].get("kycMode", "In-Person Verification (IPV)")
        d["ipvVerified"] = d["formData"].get("ipvVerified", True)
        results.append(d)
    return results



