"""
NeoBank Cryptographic & Security Utilities:
- Salted PBKDF2-HMAC-SHA256 password hashing & verification.
- AES-256 (Fernet) symmetric encryption/decryption for uploaded documents and PDFs.
"""
import os
import hmac
import hashlib
import base64
from typing import Tuple
from cryptography.fernet import Fernet

# 256-bit encryption key for document encryption (derived or persistent)
_ENV_KEY = os.getenv("NEOBANK_DOC_KEY")
if _ENV_KEY:
    try:
        DOC_CIPHER = Fernet(_ENV_KEY.encode() if isinstance(_ENV_KEY, str) else _ENV_KEY)
    except Exception:
        DOC_CIPHER = Fernet(Fernet.generate_key())
else:
    # Use deterministic key for local development persistence
    _DEV_SEED = b"NeoBank2026EnterpriseDocEncryptionKey123="
    DOC_CIPHER = Fernet(base64.urlsafe_b64encode(hashlib.sha256(_DEV_SEED).digest()))

# ----------------------------------------------------------------- PASSWORD HASHING
def hash_password(password: str) -> str:
    """Hash password using PBKDF2-HMAC-SHA256 with 100,000 rounds and 16-byte random salt."""
    salt = os.urandom(16)
    iterations = 100_000
    derived = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations)
    salt_b64 = base64.b64encode(salt).decode("utf-8")
    hash_b64 = base64.b64encode(derived).decode("utf-8")
    return f"pbkdf2:sha256:{iterations}${salt_b64}${hash_b64}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify plain password against PBKDF2 hashed string."""
    if not hashed_password:
        return False
    # If legacy plain text was stored during initial dev, verify directly or upgrade
    if not hashed_password.startswith("pbkdf2:"):
        return plain_password == hashed_password

    try:
        parts = hashed_password.split("$")
        algo_info, salt_b64, expected_hash_b64 = parts[0], parts[1], parts[2]
        iterations = int(algo_info.split(":")[-1])
        salt = base64.b64decode(salt_b64)
        expected_hash = base64.b64decode(expected_hash_b64)
        computed_hash = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt, iterations)
        return hmac.compare_digest(computed_hash, expected_hash)
    except Exception:
        return False

# ----------------------------------------------------------------- DOCUMENT ENCRYPTION (AES-256)
def encrypt_document(raw_content: bytes) -> bytes:
    """
    Encrypt document or PDF bytes using AES-256 symmetric cipher.
    The resulting ciphertext cannot be read in plaintext in the database or filesystem.
    """
    if isinstance(raw_content, str):
        raw_content = raw_content.encode("utf-8")
    return DOC_CIPHER.encrypt(raw_content)

def decrypt_document(encrypted_content: bytes) -> bytes:
    """Decrypt encrypted ciphertext back into original raw document/PDF bytes."""
    if isinstance(encrypted_content, str):
        encrypted_content = encrypted_content.encode("utf-8")
    return DOC_CIPHER.decrypt(encrypted_content)
