"""
NeoBank Global Rate Limiter Configuration.
Uses slowapi with client IP resolution (supporting X-Forwarded-For).
"""
import os
from fastapi import Request
from slowapi import Limiter

from backend.app.core.config import TRUSTED_PROXIES

def get_real_client_ip(request: Request) -> str:
    """
    Extract real client IP address safely.
    Strictly verifies that the direct connecting peer is a trusted reverse proxy
    before trusting client-supplied headers (X-Forwarded-For / X-Real-IP)
    to prevent trivial rate limit bypass via IP spoofing.
    """
    client_host = request.client.host if request.client else "127.0.0.1"

    # Only trust proxy headers if connection originates from an explicitly trusted proxy
    if client_host in TRUSTED_PROXIES:
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            # Client IP is the first entry
            return forwarded.split(",")[0].strip()
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip.strip()

    return client_host

# Initialize global rate limiter instance
limiter = Limiter(
    key_func=get_real_client_ip,
    default_limits=["100/minute"],
    enabled=os.getenv("ENABLE_RATE_LIMIT", "true").lower() == "true"
)
