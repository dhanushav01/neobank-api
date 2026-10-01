"""
Notifications Router: Customer alerts, unread counts, and notification lifecycle.
"""
from typing import Dict, Any
from fastapi import APIRouter, Depends, status

from backend.app.core.database import DB
from backend.app.core.security import get_current_user
from backend.app.core.utils import fail

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("")
def list_notifications(unread_only: bool = False, user: Dict[str, Any] = Depends(get_current_user)):
    """List in-app alerts and notifications for the user."""
    notifs = [
        n for n in DB["notifications"].values()
        if n.get("userId") == user["id"] and (not unread_only or not n.get("read"))
    ]
    notifs.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
    return notifs

@router.post("/read-all")
def mark_all_notifications_read(user: Dict[str, Any] = Depends(get_current_user)):
    """Mark all unread notifications as read."""
    count = 0
    for n in DB["notifications"].values():
        if n.get("userId") == user["id"] and not n.get("read"):
            n["read"] = True
            count += 1
    return {"updatedCount": count}

@router.post("/{notifId}/read")
def mark_notification_read(notifId: str, user: Dict[str, Any] = Depends(get_current_user)):
    """Mark single notification as read."""
    notif = DB["notifications"].get(notifId)
    if not notif or notif.get("userId") != user["id"]:
        fail(404, "Notification not found", "NOTIFICATION_NOT_FOUND")

    notif["read"] = True
    return notif

@router.delete("/{notifId}", status_code=status.HTTP_204_NO_CONTENT)
def delete_notification(notifId: str, user: Dict[str, Any] = Depends(get_current_user)):
    """Dismiss and remove a notification."""
    notif = DB["notifications"].get(notifId)
    if not notif or notif.get("userId") != user["id"]:
        fail(404, "Notification not found", "NOTIFICATION_NOT_FOUND")

    DB["notifications"].pop(notifId, None)
