"""
NeoBank Global Rate Limiter Configuration.
Uses slowapi with client IP resolution (supporting X-Forwarded-For).
"""
import os
from fastapi import Request
from slowapi import Limiter

from backend.app.core.config import TRUSTED_PROXIES, FORWARDED_ALLOW_IPS

def get_real_client_ip(request: Request) -> str:
    """
    Extract real client IP address safely for rate limiting.
    Supports reverse proxy setups (Render, Cloudflare, AWS ALB, Nginx) so
    multiple users behind a platform load balancer do not share rate limit buckets.
    """
    # 1. Cloudflare connecting IP (Render edge runs behind Cloudflare)
    cf_ip = request.headers.get("CF-Connecting-IP")
    if cf_ip and cf_ip.strip():
        return cf_ip.strip()

    client_host = request.client.host if request.client else "127.0.0.1"

    # 2. Check trusted reverse proxy headers
    trust_forwarded = (
        FORWARDED_ALLOW_IPS == "*"
        or "*" in TRUSTED_PROXIES
        or client_host in TRUSTED_PROXIES
    )
    if trust_forwarded:
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            # The client IP is the first address in the comma-separated chain
            first_ip = forwarded.split(",")[0].strip()
            if first_ip:
                return first_ip
        real_ip = request.headers.get("X-Real-IP")
        if real_ip and real_ip.strip():
            return real_ip.strip()

    return client_host

# Initialize global rate limiter instance
limiter = Limiter(
    key_func=get_real_client_ip,
    default_limits=["100/minute"],
    enabled=os.getenv("ENABLE_RATE_LIMIT", "true").lower() == "true"
)
