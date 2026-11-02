"""
NeoBank SQL Database Manager (Production-Hardened)
──────────────────────────────────────────────────
Manages persistent SQLite relational storage, schema migrations,
Fernet (AES-128-CBC + HMAC-SHA256) encrypted document BLOB storage, salted password persistence, and audit logging.
"""
import os
import json
import sqlite3
import secrets
import logging

logger = logging.getLogger("neobank.bootstrap")
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from backend.app.core.crypto_utils import hash_password, encrypt_document, decrypt_document
from backend.app.core.config import (
    SEED_DEMO_DATA, SEED_DEMO_USERS, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD,
    SEED_CUSTOMER_EMAIL, SEED_CUSTOMER_PASSWORD, NEOBANK_DB_PATH
)

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data"))
os.makedirs(DATA_DIR, exist_ok=True)
DB_PATH = os.path.abspath(NEOBANK_DB_PATH) if NEOBANK_DB_PATH else os.path.join(DATA_DIR, "neobank.db")
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)


def get_db_connection() -> sqlite3.Connection:
    """Acquire a thread-safe connection to the SQLite database with row factory."""
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def init_sql_database():
    """Create all required relational tables, indexes, and encrypted BLOB tables."""
    conn = get_db_connection()
    try:
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
                pin_hash TEXT,
                daily_limit REAL DEFAULT 3000.0,
                monthly_limit REAL DEFAULT 15000.0,
                atm_limit REAL DEFAULT 1000.0,
                created_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
            );
        """)

        # Migration: Ensure pin_hash exists on cards
        try:
            conn.execute("ALTER TABLE cards ADD COLUMN pin_hash TEXT;")
        except Exception:
            pass

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
                branch_code TEXT,
                draft_secret TEXT
            );
        """)

        # Migration: Ensure draft_secret exists on applications table
        try:
            conn.execute("ALTER TABLE applications ADD COLUMN draft_secret TEXT;")
        except Exception:
            pass

        # 8. Encrypted Documents & PDFs Table (Stores Fernet AES-128-CBC + HMAC encrypted BLOBs)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS encrypted_documents (
                id TEXT PRIMARY KEY,
                application_number TEXT,
                user_id TEXT,
                doc_category TEXT NOT NULL,
                doc_type TEXT NOT NULL,
                doc_number TEXT,
                file_name TEXT NOT NULL,
                file_mime TEXT NOT NULL DEFAULT 'application/octet-stream',
                file_size_bytes INTEGER NOT NULL,
                encrypted_blob BLOB NOT NULL,
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
                salt TEXT,
                attempts INTEGER NOT NULL DEFAULT 0,
                expires_at TEXT NOT NULL,
                used INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL
            );
        """)
        try:
            conn.execute("ALTER TABLE login_otps ADD COLUMN salt TEXT;")
        except Exception:
            pass
        try:
            conn.execute("ALTER TABLE login_otps ADD COLUMN attempts INTEGER NOT NULL DEFAULT 0;")
        except Exception:
            pass

        # Create indexes for fast lookups
        conn.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_accounts_user ON accounts(user_id);")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_accounts_number ON accounts(account_number);")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_transactions_acc ON transactions(account_id);")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_apps_email ON applications(email);")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_apps_date ON applications(created_at);")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_login_otps_ident ON login_otps(identifier);")
    finally:
        conn.close()

    seed_sql_database()
    migrate_plaintext_passwords()
    bootstrap_first_admin()


def migrate_plaintext_passwords() -> int:
    """Migrate legacy plaintext or weak user passwords to secure salted hashes."""
    conn = get_db_connection()
    try:
        migrated = 0
        with conn:
            users = conn.execute("SELECT id, password_hash FROM users").fetchall()
            for u in users:
                pwd = u["password_hash"]
                if pwd and not (pwd.startswith("$2b$") or pwd.startswith("pbkdf2:")):
                    hashed = hash_password(pwd)
                    conn.execute("UPDATE users SET password_hash = ? WHERE id = ?", (hashed, u["id"]))
                    migrated += 1
        if migrated > 0:
            print(f"[SECURITY] Successfully migrated {migrated} plaintext password(s) in SQLite to secure hashes.")
        return migrated
    finally:
        conn.close()


def bootstrap_first_admin() -> bool:
    """
    Safe First-Admin Bootstrap:
    If ADMIN_EMAIL and ADMIN_PASSWORD environment variables are set and no admin exists,
    creates one at startup. Enforces strict password complexity. Never logs the password.
    """
    admin_email = os.getenv("ADMIN_EMAIL", "").strip().lower()
    admin_password = os.getenv("ADMIN_PASSWORD", "")

    if not admin_email or not admin_password:
        return False

    conn = get_db_connection()
    try:
        with conn:
            existing_admin = conn.execute(
                "SELECT COUNT(*) as cnt FROM users WHERE role IN ('ADMIN', 'SUPER_ADMIN')"
            ).fetchone()["cnt"]

            if existing_admin > 0:
                return False

            if "@" not in admin_email or "." not in admin_email.split("@")[-1]:
                logger.error("[BOOTSTRAP] ADMIN_EMAIL must be a valid email address.")
                return False

            if len(admin_password) < 12:
                logger.error("[BOOTSTRAP] ADMIN_PASSWORD rejected: Must be at least 12 characters.")
                return False
            if not any(c.isupper() for c in admin_password):
                logger.error("[BOOTSTRAP] ADMIN_PASSWORD rejected: Must contain uppercase letter.")
                return False
            if not any(c.islower() for c in admin_password):
                logger.error("[BOOTSTRAP] ADMIN_PASSWORD rejected: Must contain lowercase letter.")
                return False
            if not any(c.isdigit() for c in admin_password):
                logger.error("[BOOTSTRAP] ADMIN_PASSWORD rejected: Must contain a number.")
                return False
            if not any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?~`'\"/\\" for c in admin_password):
                logger.error("[BOOTSTRAP] ADMIN_PASSWORD rejected: Must contain special character.")
                return False

            now_str = datetime.now().isoformat()
            admin_id = f"usr_{secrets.token_hex(6)}"
            hashed_pwd = hash_password(admin_password)

            conn.execute("""
                INSERT INTO users (id, email, password_hash, role, status, first_name, last_name, employee_code, department, created_at)
                VALUES (?, ?, ?, 'SUPER_ADMIN', 'ACTIVE', 'System', 'Administrator', 'ROOT01', 'ADMINISTRATION', ?)
            """, (admin_id, admin_email, hashed_pwd, now_str))

        logger.info(f"[BOOTSTRAP] Initial super-admin successfully provisioned for '{admin_email}'.")
        print(f"[BOOTSTRAP] Initial super-admin successfully provisioned for '{admin_email}'.")
        return True
    except Exception as exc:
        logger.error(f"[BOOTSTRAP] Failed to provision initial admin: {exc}")
        return False
    finally:
        conn.close()


def seed_sql_database():
    """Populate default accounts if tables are fresh."""
    if not SEED_DEMO_DATA:
        return
    conn = get_db_connection()
    try:
        with conn:
            count = conn.execute("SELECT COUNT(*) as cnt FROM users;").fetchone()["cnt"]
            if count == 0:
                now_str = datetime.now().isoformat()
                
                # Default Customer
                cust_id = "usr_seed_customer"
                conn.execute("""
                    INSERT INTO users (id, email, password_hash, role, status, first_name, last_name, dob, phone, address_json, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    cust_id, SEED_CUSTOMER_EMAIL, hash_password(SEED_CUSTOMER_PASSWORD), "CUSTOMER", "ACTIVE",
                    "Jane", "Doe", "1995-05-15", "+447700900123",
                    json.dumps({"line1": "10 Downing Street", "city": "London", "postalCode": "SW1A 2AA", "country": "GB"}),
                    now_str
                ))

                # Default Staff/Admin
                admin_id = "usr_seed_admin"
                conn.execute("""
                    INSERT INTO users (id, email, password_hash, role, status, first_name, last_name, dob, phone, employee_code, department, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    admin_id, SEED_ADMIN_EMAIL, hash_password(SEED_ADMIN_PASSWORD), "SUPER_ADMIN", "ACTIVE",
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
    finally:
        conn.close()


# ----------------------------------------------------------------- OTP MANAGEMENT (CSPRNG)
def generate_and_save_otp(identifier: str, minutes_valid: int = 5) -> str:
    """
    Generate and persist a cryptographically secure 6-digit OTP code in SQL.
    Stores strictly a salted PBKDF2 hash of the OTP; plaintext code is NEVER persisted.
    Max lifetime is capped at 5 minutes per OWASP ASVS guidelines.
    """
    from backend.app.core.crypto_utils import hash_otp
    clean_ident = identifier.strip().lower()
    otp_code = f"{secrets.randbelow(1_000_000):06d}"
    hashed_code, salt = hash_otp(otp_code)

    now_dt = datetime.now()
    capped_minutes = min(max(minutes_valid, 1), 5)
    expires_dt = now_dt + timedelta(minutes=capped_minutes)
    now_str = now_dt.isoformat()
    expires_str = expires_dt.isoformat()
    otp_id = f"otp_{secrets.token_hex(8)}"

    conn = get_db_connection()
    with conn:
        # Invalidate any existing unused OTPs for this identifier
        conn.execute("UPDATE login_otps SET used = 1 WHERE identifier = ? AND used = 0", (clean_ident,))
        conn.execute("""
            INSERT INTO login_otps (id, identifier, otp_code, salt, attempts, expires_at, used, created_at)
            VALUES (?, ?, ?, ?, 0, ?, 0, ?)
        """, (otp_id, clean_ident, hashed_code, salt, expires_str, now_str))

    return otp_code


def verify_and_consume_otp(identifier: str, otp_code: str) -> bool:
    """
    Validate an OTP code against SQL table and consume it upon verification.
    Enforces maximum 5 attempts lockout and single-use invalidation.
    """
    from backend.app.core.crypto_utils import verify_salted_otp
    import hmac
    clean_ident = identifier.strip().lower()
    clean_code = otp_code.strip()
    now_str = datetime.now().isoformat()

    conn = get_db_connection()
    with conn:
        row = conn.execute("""
            SELECT * FROM login_otps
            WHERE identifier = ? AND used = 0 AND expires_at > ?
            ORDER BY created_at DESC LIMIT 1
        """, (clean_ident, now_str)).fetchone()

        if not row:
            return False

        current_attempts = int(row["attempts"] or 0)
        # Lockout after 5 failed attempts
        if current_attempts >= 5:
            conn.execute("UPDATE login_otps SET used = 1 WHERE id = ?", (row["id"],))
            return False

        # Verify salted hash or legacy plaintext with constant-time comparison
        salt = row["salt"]
        stored_hash = row["otp_code"]
        is_valid = False

        if salt:
            is_valid = verify_salted_otp(clean_code, stored_hash, salt)
        else:
            is_valid = hmac.compare_digest(clean_code, stored_hash)

        if not is_valid:
            conn.execute("UPDATE login_otps SET attempts = attempts + 1 WHERE id = ?", (row["id"],))
            return False

        # Mark OTP as consumed immediately (one-time use)
        conn.execute("UPDATE login_otps SET used = 1 WHERE id = ?", (row["id"],))
        return True


# ----------------------------------------------------------------- USER MANAGEMENT (SQL)
def get_sql_user_by_identifier(ident: str) -> Optional[Dict[str, Any]]:
    """Lookup a user by email or phone number in SQL database."""
    clean = ident.strip().lower()
    conn = get_db_connection()
    row = conn.execute("""
        SELECT * FROM users
        WHERE LOWER(email) = ? OR phone = ?
        LIMIT 1;
    """, (clean, clean)).fetchone()
    return dict(row) if row else None


def create_or_sync_user(
    user_id: str,
    email: str,
    password_hash: str,
    role: str = "CUSTOMER",
    first_name: str = "",
    last_name: str = "",
    phone: Optional[str] = None,
    dob: Optional[str] = None,
    address_json: Optional[str] = None,
    employee_code: Optional[str] = None,
    department: Optional[str] = None,
    has_sql_access: int = 0
):
    """Insert or update user record in SQL database."""
    conn = get_db_connection()
    with conn:
        conn.execute("""
            INSERT INTO users (
                id, email, password_hash, role, status, first_name, last_name,
                dob, phone, address_json, employee_code, department, has_sql_access, created_at
            ) VALUES (?, ?, ?, ?, 'ACTIVE', ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                email = excluded.email,
                password_hash = excluded.password_hash,
                role = excluded.role,
                first_name = excluded.first_name,
                last_name = excluded.last_name,
                phone = excluded.phone,
                employee_code = excluded.employee_code,
                department = excluded.department,
                has_sql_access = excluded.has_sql_access;
        """, (
            user_id, email.lower().strip(), password_hash, role, first_name, last_name,
            dob, phone, address_json, employee_code, department, has_sql_access, datetime.now().isoformat()
        ))


def update_sql_user_password(user_id: str, new_hash: str):
    """Update a user's password hash in SQL database."""
    conn = get_db_connection()
    with conn:
        conn.execute("UPDATE users SET password_hash = ? WHERE id = ?", (new_hash, user_id))


# ----------------------------------------------------------------- ENCRYPTED DOCUMENTS
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
    """Encrypt raw document bytes with Fernet (AES-128-CBC + HMAC) and store in encrypted_documents table."""
    encrypted_blob = encrypt_document(raw_content)
    now_str = datetime.now().isoformat()

    conn = get_db_connection()
    with conn:
        conn.execute("""
            INSERT INTO encrypted_documents (
                id, application_number, user_id, doc_category, doc_type,
                doc_number, file_name, file_mime, file_size_bytes, encrypted_blob, is_encrypted, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
        """, (
            doc_id, application_number, user_id, doc_category, doc_type,
            doc_number, file_name, file_mime, len(raw_content), encrypted_blob, now_str
        ))

    return {
        "id": doc_id,
        "applicationNumber": application_number,
        "userId": user_id,
        "docCategory": doc_category,
        "docType": doc_type,
        "docNumber": doc_number,
        "fileName": file_name,
        "fileMime": file_mime,
        "fileSizeBytes": len(raw_content),
        "isEncrypted": True,
        "createdAt": now_str
    }


def retrieve_and_decrypt_document(doc_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve an encrypted document from SQL and decrypt it into raw bytes."""
    conn = get_db_connection()
    row = conn.execute("SELECT * FROM encrypted_documents WHERE id = ?", (doc_id,)).fetchone()
    if not row:
        return None

    encrypted_blob = row["encrypted_blob"]
    decrypted_bytes = decrypt_document(encrypted_blob) if row["is_encrypted"] else encrypted_blob

    return {
        "id": row["id"],
        "applicationNumber": row["application_number"],
        "userId": row["user_id"],
        "docCategory": row["doc_category"],
        "docType": row["doc_type"],
        "docNumber": row["doc_number"],
        "fileName": row["file_name"],
        "fileMime": row["file_mime"],
        "fileSizeBytes": row["file_size_bytes"],
        "contentBytes": decrypted_bytes,
        "createdAt": row["created_at"]
    }


def list_documents_for_application(app_number: str) -> List[Dict[str, Any]]:
    """List document metadata attached to an application without exposing plaintext blobs."""
    conn = get_db_connection()
    rows = conn.execute("""
        SELECT id, application_number, user_id, doc_category, doc_type, doc_number,
               file_name, file_mime, file_size_bytes, is_encrypted, created_at
        FROM encrypted_documents
        WHERE application_number = ?
        ORDER BY created_at ASC
    """, (app_number,)).fetchall()

    return [
        {
            "id": r["id"],
            "applicationNumber": r["application_number"],
            "userId": r["user_id"],
            "docCategory": r["doc_category"],
            "docType": r["doc_type"],
            "docNumber": r["doc_number"],
            "fileName": r["file_name"],
            "fileMime": r["file_mime"],
            "fileSizeBytes": r["file_size_bytes"],
            "isEncrypted": bool(r["is_encrypted"]),
            "createdAt": r["created_at"],
            "downloadUrl": f"/onboarding/documents/{r['id']}/download"
        }
        for r in rows
    ]


# ----------------------------------------------------------------- APPLICATIONS
def store_sql_application(app_record: Dict[str, Any]):
    """Insert or update customer account opening application record."""
    conn = get_db_connection()
    with conn:
        applicant = app_record.get("applicant", {})
        form_data = app_record.get("formData", {})
        app_num = app_record["applicationNumber"]

        existing_row = conn.execute("SELECT status, created_at FROM applications WHERE application_number = ?", (app_num,)).fetchone()
        target_status = app_record.get("status", "SUBMITTED")
        if existing_row:
            if existing_row["status"] in ("SUBMITTED", "UNDER_REVIEW", "APPROVED", "ACCOUNT_OPENED", "REJECTED"):
                if target_status in ("DRAFT_INITIATED", "DRAFT_SAVED"):
                    target_status = existing_row["status"]
                    app_record["status"] = target_status
            orig_created_at = existing_row["created_at"] or app_record.get("createdAt") or datetime.now().isoformat()
        else:
            orig_created_at = app_record.get("createdAt") or datetime.now().isoformat()
        app_record["createdAt"] = orig_created_at

        raw_pwd = app_record.get("password") or app_record.get("password_hash") or SEED_CUSTOMER_PASSWORD
        if isinstance(raw_pwd, str) and (raw_pwd.startswith("$2b$") or raw_pwd.startswith("pbkdf2:")):
            app_pwd_hash = raw_pwd
        else:
            app_pwd_hash = hash_password(str(raw_pwd))

        conn.execute("""
            INSERT OR REPLACE INTO applications (
                application_number, email, account_type, currency, initial_deposit,
                tax_id, password_hash, applicant_json, employment_json, status,
                created_at, reviewed_at, reviewed_by, review_notes, generated_account_number,
                form_data_json, branch_name, branch_code, draft_secret
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            app_num,
            applicant.get("email", app_record.get("email", "")),
            app_record.get("accountType", "SAVINGS"),
            app_record.get("currency", "USD"),
            float(app_record.get("initialDeposit", 0.0)),
            app_record.get("taxId", ""),
            app_pwd_hash,
            json.dumps(applicant),
            json.dumps(app_record.get("employment", {})),
            target_status,
            orig_created_at,
            app_record.get("reviewedAt"),
            app_record.get("reviewedBy"),
            app_record.get("reviewNotes"),
            app_record.get("generatedAccountNumber"),
            json.dumps(form_data) if form_data else None,
            app_record.get("branchName", ""),
            app_record.get("branchCode", ""),
            app_record.get("draftSecret") or app_record.get("draft_secret", "")
        ))


def get_sql_application(app_number: str) -> Optional[Dict[str, Any]]:
    """Retrieve an application from SQL database WITHOUT leaking password hash."""
    conn = get_db_connection()
    row = conn.execute("SELECT * FROM applications WHERE application_number = ?", (app_number,)).fetchone()
    if not row:
        return None
    d = dict(row)
    d["applicationNumber"] = d.get("application_number", "")
    d["accountType"] = d.get("account_type", "SAVINGS")
    d["initialDeposit"] = float(d.get("initial_deposit") or 0.0)
    d["taxId"] = d.get("tax_id", "")
    # STRICT SECURITY: Do not leak password hash into the application dictionary
    d.pop("password", None)
    d.pop("password_hash", None)
    d["createdAt"] = d.get("created_at")
    d["reviewedAt"] = d.get("reviewed_at")
    d["reviewedBy"] = d.get("reviewed_by")
    d["reviewNotes"] = d.get("review_notes")
    d["generatedAccountNumber"] = d.get("generated_account_number")
    d["branchName"] = d.get("branch_name", "")
    d["branchCode"] = d.get("branch_code", "")
    d["draftSecret"] = d.get("draft_secret", "")

    try:
        d["applicant"] = json.loads(d.get("applicant_json") or "{}")
        # Ensure applicant dictionary does not contain sensitive password field
        if isinstance(d["applicant"], dict):
            d["applicant"].pop("password", None)
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
    """Retrieve applications from SQL database WITHOUT password hashes."""
    conn = get_db_connection()
    rows = conn.execute("SELECT * FROM applications ORDER BY created_at DESC").fetchall()
    results = []
    for row in rows:
        d = dict(row)
        d["applicationNumber"] = d.get("application_number", "")
        d["accountType"] = d.get("account_type", "SAVINGS")
        d["initialDeposit"] = float(d.get("initial_deposit") or 0.0)
        d["taxId"] = d.get("tax_id", "")
        # Protect password hashes from leakage
        d.pop("password", None)
        d.pop("password_hash", None)
        d["createdAt"] = d.get("created_at")
        d["reviewedAt"] = d.get("reviewed_at")
        d["reviewedBy"] = d.get("reviewed_by")
        d["reviewNotes"] = d.get("review_notes")
        d["generatedAccountNumber"] = d.get("generated_account_number")
        d["branchName"] = d.get("branch_name", "")
        d["branchCode"] = d.get("branch_code", "")
        try:
            d["applicant"] = json.loads(d.get("applicant_json") or "{}")
            if isinstance(d["applicant"], dict):
                d["applicant"].pop("password", None)
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
