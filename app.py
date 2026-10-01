"""
NeoBank Financial Platform - Root Application Entry Point.
Delegates to modular architecture located in `backend/app/main.py`.

Run with:
    uvicorn app:app --reload
"""
from backend.app.main import app

__all__ = ["app"]
