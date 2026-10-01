"""
System Router: Health checks, platform metrics, and diagnostic testing utilities.
"""
import time
from typing import Dict, Any
from fastapi import APIRouter, Request, status
from fastapi.responses import JSONResponse

from backend.app.core.database import DB
from backend.app.core.utils import fail, now_iso

router = APIRouter(tags=["System"])

FLAKY_COUNTER = {"count": 0}

@router.get("/health")
def health_check():
    """System health check endpoint."""
    return {"status": "UP", "timestamp": now_iso()}

@router.get("/version")
def version_info():
    """Current API version."""
    return {"version": "2.1.0", "edition": "2026 Enterprise Edition"}

@router.get("/status/{code}")
def simulate_http_status(code: int):
    """Developer helper to simulate arbitrary HTTP status responses."""
    if not (200 <= code <= 599):
        fail(400, "Status code must be between 200 and 599", "BAD_CODE")
    if code == 204:
        return JSONResponse(None, status_code=204)
    return JSONResponse({"requestedCode": code, "status": "Simulated response"}, status_code=code)

@router.get("/delay/{seconds}")
def simulate_delay(seconds: int):
    """Developer helper to simulate network latency."""
    clamped = min(max(seconds, 0), 10)
    time.sleep(clamped)
    return {"delayedSeconds": clamped}

@router.get("/flaky")
def simulate_flaky():
    """Simulate an intermittent 503 service."""
    FLAKY_COUNTER["count"] += 1
    if FLAKY_COUNTER["count"] % 3 != 0:
        fail(503, "Service temporarily unavailable (simulated flake - retry)", "UNAVAILABLE")
    return {"ok": True, "attempts": FLAKY_COUNTER["count"]}

@router.post("/echo")
async def echo_request(req: Request):
    """Echo headers, query parameters, and payload."""
    try:
        body = await req.json()
    except Exception:
        body = (await req.body()).decode() or None
    return {
        "method": req.method,
        "headers": dict(req.headers),
        "query": dict(req.query_params),
        "body": body
    }

@router.get("/rate-limit")
def simulate_rate_limit(request: Request):
    """Simulate rate limiting threshold."""
    ip = request.client.host if request.client else "unknown"
    key = f"rl_{ip}"
    entry = DB["counters"].setdefault(key, {"timestamp": time.time(), "calls": 0})

    if time.time() - entry["timestamp"] > 30:
        entry["timestamp"] = time.time()
        entry["calls"] = 0

    entry["calls"] += 1
    if entry["calls"] > 5:
        return JSONResponse(
            {"code": "RATE_LIMITED", "message": "Max 5 requests allowed per 30 seconds"},
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            headers={"Retry-After": "30"}
        )

    return {"remaining": 5 - entry["calls"], "windowSeconds": 30}
