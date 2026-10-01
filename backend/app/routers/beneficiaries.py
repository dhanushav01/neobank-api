"""
Beneficiaries Router: Saved transfer recipients CRUD.
"""
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, status

from backend.app.core.database import DB, get_owned, list_owned
from backend.app.core.security import get_current_user
from backend.app.core.utils import generate_id, now_iso
from backend.app.models.schemas import BeneficiaryRequest

router = APIRouter(prefix="/beneficiaries", tags=["Beneficiaries"])

@router.get("")
def list_beneficiaries(user: Dict[str, Any] = Depends(get_current_user)):
    """List all saved transfer recipients for the current user."""
    return list_owned("beneficiaries", user)

@router.post("", status_code=status.HTTP_201_CREATED)
def add_beneficiary(request: BeneficiaryRequest, user: Dict[str, Any] = Depends(get_current_user)):
    """Save a new transfer recipient."""
    ben_id = generate_id("ben")
    record = {
        "id": ben_id,
        "ownerId": user["id"],
        **request.model_dump(),
        "createdAt": now_iso()
    }
    DB["beneficiaries"][ben_id] = record
    return record

@router.get("/{beneficiaryId}")
def get_beneficiary(beneficiaryId: str, user: Dict[str, Any] = Depends(get_current_user)):
    """Get single saved beneficiary."""
    return get_owned("beneficiaries", beneficiaryId, user, "beneficiary")

@router.delete("/{beneficiaryId}", status_code=status.HTTP_204_NO_CONTENT)
def delete_beneficiary(beneficiaryId: str, user: Dict[str, Any] = Depends(get_current_user)):
    """Remove a saved recipient."""
    get_owned("beneficiaries", beneficiaryId, user, "beneficiary")
    DB["beneficiaries"].pop(beneficiaryId, None)
