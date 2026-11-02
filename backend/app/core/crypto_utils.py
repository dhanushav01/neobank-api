"""
NeoBank Cryptographic & Security Utilities (Production-Hardened)
────────────────────────────────────────────────────────────
Provides:
  • Bcrypt password hashing (work factor 12, OWASP recommended).
  • Backwards-compatible legacy PBKDF2 password verification.
  • Salted PBKDF2 PIN hashing & verification for payment cards.
  • Fernet (AES-128-CBC + HMAC-SHA256) authenticated encryption for uploaded documents.
  • Cryptographically secure random token and OTP generation (CSPRNG).
"""
import os
import hmac
import hashlib
import base64
import secrets
import logging
from typing import Optional, Any
import bcrypt
from cryptography.fernet import Fernet

logger = logging.getLogger("neobank.crypto")

# ----------------------------------------------------------------- ENVIRONMENT & KEY CONFIG
from backend.app.core.config import IS_PRODUCTION, ENVIRONMENT
from cryptography.fernet import MultiFernet

_RAW_DOC_KEYS_ENV = os.getenv("NEOBANK_DOC_KEY", "")
_fernet_instances = []

if _RAW_DOC_KEYS_ENV:
    # Support versioned keys: PRIMARY_NEW_KEY,OLD_KEY_1,OLD_KEY_2
    _key_candidates = [k.strip() for k in _RAW_DOC_KEYS_ENV.split(",") if k.strip()]
    for _k in _key_candidates:
        try:
            _k_bytes = _k.encode("utf-8") if isinstance(_k, str) else _k
            _fernet_instances.append(Fernet(_k_bytes))
        except Exception as exc:
            if IS_PRODUCTION:
                raise RuntimeError(f"FATAL: Invalid Fernet key '{_k[:8]}...' in NEOBANK_DOC_KEY: {exc}")
            logger.warning(f"Invalid Fernet key '{_k[:8]}...': {exc}")

if not _fernet_instances:
    if IS_PRODUCTION:
        raise RuntimeError("FATAL: Valid NEOBANK_DOC_KEY environment variable MUST be explicitly set in production mode.")
    # In automated test or dev fallback, generate ephemeral primary key
    _ephemeral_key = Fernet.generate_key()
    _fernet_instances = [Fernet(_ephemeral_key)]
    logger.warning("[SECURITY] Generated ephemeral development Fernet key for document encryption.")

DOC_CIPHER = MultiFernet(_fernet_instances)


# ----------------------------------------------------------------- PASSWORD HASHING (BCRYPT)
def hash_password(password: str) -> str:
    """
    Hash password using Bcrypt with work factor 12.
    Meets current OWASP and NIST recommendations for password storage.
    """
    if not password or not isinstance(password, str):
        raise ValueError("Password must be a non-empty string.")
    
    pwd_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify plain password against stored hash.
    Supports Bcrypt ($2a$, $2b$) and legacy PBKDF2-HMAC-SHA256 hashes.
    Strictly prohibits plaintext password comparisons.
    """
    if not plain_password or not hashed_password:
        return False

    try:
        # 1. Bcrypt hash check ($2b$, $2a$, $2y$)
        if hashed_password.startswith(("$2a$", "$2b$", "$2y$")):
            return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

        # 2. Legacy PBKDF2 hash check (pbkdf2:sha256:rounds$salt$hash)
        if hashed_password.startswith("pbkdf2:"):
            parts = hashed_password.split("$")
            if len(parts) != 3:
                return False
            algo_info, salt_b64, expected_hash_b64 = parts[0], parts[1], parts[2]
            iterations = int(algo_info.split(":")[-1])
            salt = base64.b64decode(salt_b64)
            expected_hash = base64.b64decode(expected_hash_b64)
            computed_hash = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt, iterations)
            return hmac.compare_digest(computed_hash, expected_hash)

        # Insecure or unrecognized format — reject completely (never fallback to plaintext ==)
        return False
    except Exception as e:
        logger.warning(f"Password verification encountered exception: {e}")
        return False


def is_password_hash(val: Any) -> bool:
    """Return True if the value appears to be an already-hashed password (bcrypt, argon2, pbkdf2)."""
    if not isinstance(val, str):
        return False
    return val.startswith(("$2a$", "$2b$", "$2y$", "$argon2id$", "$argon2i$", "pbkdf2:"))


def needs_rehash(hashed_password: str) -> bool:
    """Check if password was hashed with an older algorithm (e.g., legacy PBKDF2) and needs upgrade."""
    return not hashed_password.startswith(("$2b$12$", "$2b$"))


# ----------------------------------------------------------------- CARD PIN HASHING (PBKDF2)
def hash_pin(pin: str) -> str:
    """
    Hash a 4-digit payment card PIN using PBKDF2-HMAC-SHA256 with 100,000 iterations.
    PINs must NEVER be stored in plaintext.
    """
    if not pin or not str(pin).isdigit() or len(str(pin)) < 4:
        raise ValueError("Card PIN must be at least 4 digits.")
    
    salt = os.urandom(16)
    iterations = 100_000
    derived = hashlib.pbkdf2_hmac("sha256", str(pin).encode("utf-8"), salt, iterations)
    salt_b64 = base64.b64encode(salt).decode("utf-8")
    hash_b64 = base64.b64encode(derived).decode("utf-8")
    return f"pin:pbkdf2:{iterations}${salt_b64}${hash_b64}"


def verify_pin(plain_pin: str, hashed_pin: str) -> bool:
    """
    Verify a 4-digit PIN against its stored PBKDF2 hash using constant-time comparison.
    Strictly rejects any unhashed/plaintext PINs for maximum security.
    """
    if not plain_pin or not hashed_pin:
        return False
    try:
        if not hashed_pin.startswith("pin:pbkdf2:"):
            # Insecure / unhashed PINs are strictly rejected
            return False

        parts = hashed_pin.split("$")
        if len(parts) != 3:
            return False
        algo_info, salt_b64, expected_hash_b64 = parts[0], parts[1], parts[2]
        iterations = int(algo_info.split(":")[-1])
        salt = base64.b64decode(salt_b64)
        expected_hash = base64.b64decode(expected_hash_b64)
        computed_hash = hashlib.pbkdf2_hmac("sha256", str(plain_pin).encode("utf-8"), salt, iterations)
        return hmac.compare_digest(computed_hash, expected_hash)
    except Exception:
        return False


# ----------------------------------------------------------------- SECURE RANDOM UTILITIES (CSPRNG)
def generate_secure_otp(length: int = 6) -> str:
    """
    Generate cryptographically secure numerical OTP code using secrets.randbelow.
    Guarantees true randomness and zero predictability.
    """
    max_val = 10 ** length
    code_int = secrets.randbelow(max_val)
    return f"{code_int:0{length}d}"


def generate_secure_token(nbytes: int = 32) -> str:
    """Generate cryptographically secure URL-safe token."""
    return secrets.token_urlsafe(nbytes)


# ----------------------------------------------------------------- DOCUMENT ENCRYPTION (Fernet: AES-128-CBC + HMAC-SHA256)
def encrypt_document(raw_content: bytes) -> bytes:
    """
    Encrypt document or PDF bytes using Fernet (AES-128-CBC with HMAC-SHA256).
    Ciphertext includes 128-bit AES in CBC mode with PKCS7 padding and HMAC-SHA256 authentication.
    """
    if isinstance(raw_content, str):
        raw_content = raw_content.encode("utf-8")
    return DOC_CIPHER.encrypt(raw_content)


def decrypt_document(encrypted_content: bytes) -> bytes:
    """Decrypt document bytes with MAC verification and authentic decryption."""
    if isinstance(encrypted_content, str):
        encrypted_content = encrypted_content.encode("utf-8")
    return DOC_CIPHER.decrypt(encrypted_content)


def re_encrypt_document(encrypted_content: bytes) -> bytes:
    """
    Re-encrypt document ciphertext using the current primary Fernet key.
    Enables zero-downtime key rotation across historical encrypted documents.
    """
    if isinstance(encrypted_content, str):
        encrypted_content = encrypted_content.encode("utf-8")
    return DOC_CIPHER.rotate(encrypted_content)


# ----------------------------------------------------------------- SALTED OTP HASHING
def hash_otp(code: str, salt: Optional[str] = None) -> tuple:
    """
    Generate salted cryptographic hash of OTP using PBKDF2-HMAC-SHA256.
    Ensures OTPs are never stored in plaintext in the database or cache.
    """
    if not salt:
        salt = secrets.token_hex(16)
    hashed = hashlib.pbkdf2_hmac(
        "sha256",
        code.strip().encode("utf-8"),
        salt.encode("utf-8"),
        iterations=50000
    )
    return base64.b64encode(hashed).decode("utf-8"), salt


def verify_salted_otp(provided_code: str, expected_hash_b64: str, salt: str) -> bool:
    """Constant-time verification of candidate OTP against stored salted hash."""
    if not provided_code or not expected_hash_b64 or not salt:
        return False
    calculated_hash, _ = hash_otp(provided_code, salt)
    return hmac.compare_digest(calculated_hash, expected_hash_b64)
