from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from app.database import query_one, query_all, execute_query
from app.middleware import get_current_user, require_role

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

class BroadcastRequest(BaseModel):
    title: str
    message: str
    type: str = "info" # course, assessment, enrollment, certificate, system, assignment
    link_url: Optional[str] = None
    target_college_id: Optional[int] = None

@router.get("")
def list_user_notifications(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Fetches user-specific and college broadcast notifications."""
    user_id = current_user["id"]
    college_id = current_user.get("college_id")
    
    if college_id:
        notifications = query_all(
            """
            SELECT * FROM notifications
            WHERE (user_id = ? OR (user_id IS NULL AND college_id = ?) OR (user_id IS NULL AND college_id IS NULL))
            ORDER BY created_at DESC LIMIT 50
            """,
            (user_id, college_id)
        )
    else:
        notifications = query_all(
            """
            SELECT * FROM notifications
            WHERE (user_id = ? OR (user_id IS NULL AND college_id IS NULL))
            ORDER BY created_at DESC LIMIT 50
            """,
            (user_id,)
        )
        
    unread_count = sum(1 for n in notifications if n["is_read"] == 0)
    return {
        "notifications": notifications,
        "unread_count": unread_count
    }

@router.patch("/{notification_id}/read")
def mark_notification_read(notification_id: int, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Marks a single notification as read."""
    execute_query("UPDATE notifications SET is_read = 1 WHERE id = ?", (notification_id,))
    return {"message": "Marked as read"}

@router.post("/mark-all-read")
def mark_all_read(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Marks all user notifications as read."""
    user_id = current_user["id"]
    college_id = current_user.get("college_id")
    if college_id:
        execute_query(
            "UPDATE notifications SET is_read = 1 WHERE (user_id = ? OR (user_id IS NULL AND college_id = ?))",
            (user_id, college_id)
        )
    else:
        execute_query("UPDATE notifications SET is_read = 1 WHERE user_id = ?", (user_id,))
    return {"message": "All notifications marked as read"}

@router.post("/broadcast", status_code=status.HTTP_201_CREATED)
def broadcast_notification(
    req: BroadcastRequest,
    current_user: Dict[str, Any] = Depends(require_role(["college_admin", "super_admin"]))
):
    """Sends a broadcast notification to students."""
    target_college_id = req.target_college_id if current_user["role_name"] == "super_admin" else current_user["college_id"]
    
    notif_id = execute_query(
        """
        INSERT INTO notifications (college_id, user_id, title, message, type, link_url)
        VALUES (?, NULL, ?, ?, ?, ?)
        """,
        (target_college_id, req.title.strip(), req.message.strip(), req.type, req.link_url)
    )
    return {"message": "Broadcast sent successfully", "notification_id": notif_id}