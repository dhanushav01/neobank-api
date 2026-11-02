"""
Quick launcher for NeoBank backend server.
Usage: python run.py
"""
import uvicorn
from backend.app.core.config import API_HOST, API_PORT

if __name__ == "__main__":
    uvicorn.run("backend.app.main:app", host=API_HOST, port=API_PORT, reload=True)
