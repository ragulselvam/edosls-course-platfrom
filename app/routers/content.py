from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Dict, Any
from app.models import ContentCreate
from app.database import query_one, query_all, execute_query
from app.middleware import require_role, verify_tenant_access, get_current_user

router = APIRouter(prefix="/api/content", tags=["Course Content"])

@router.get("/{content_id}")
def get_content(content_id: int, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Fetches a specific lesson/content item."""
    content = query_one(
        """
        SELECT cnt.*, m.title as module_title, c.id as course_id, c.title as course_title, c.college_id
        FROM course_contents cnt
        JOIN course_modules m ON cnt.module_id = m.id
        JOIN courses c ON m.course_id = c.id
        WHERE cnt.id = ?
        """,
        (content_id,)
    )
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
        
    verify_tenant_access(current_user, content["college_id"])
    return content

@router.post("", status_code=status.HTTP_201_CREATED)
def create_content(
    req: ContentCreate,
    current_user: Dict[str, Any] = Depends(require_role(["super_admin", "college_admin"]))
):
    """Creates a new learning content item within a module."""
    module = query_one(
        """
        SELECT m.id, m.course_id, c.college_id
        FROM course_modules m
        JOIN courses c ON m.course_id = c.id
        WHERE m.id = ?
        """,
        (req.module_id,)
    )
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
        
    if current_user.get("role_name") == "college_admin":
        verify_tenant_access(current_user, module["college_id"])
    
    last_cnt = query_one("SELECT MAX(sort_order) as max_order FROM course_contents WHERE module_id = ?", (req.module_id,))
    next_order = (last_cnt["max_order"] + 1) if last_cnt and last_cnt["max_order"] is not None else 0
    sort_order = req.sort_order if req.sort_order > 0 else next_order
    
    content_id = execute_query(
        """
        INSERT INTO course_contents (
            module_id, title, content_type, content_data, file_url,
            duration_minutes, sort_order, is_mandatory
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            req.module_id,
            req.title.strip(),
            req.content_type,
            req.content_data,
            req.file_url,
            req.duration_minutes,
            sort_order,
            1 if req.is_mandatory else 0
        )
    )
    
    return query_one("SELECT * FROM course_contents WHERE id = ?", (content_id,))

@router.put("/{content_id}")
def update_content(
    content_id: int,
    req: ContentCreate,
    current_user: Dict[str, Any] = Depends(require_role(["super_admin", "college_admin"]))
):
    """Updates learning content item."""
    content = query_one(
        """
        SELECT cnt.id, m.course_id, c.college_id
        FROM course_contents cnt
        JOIN course_modules m ON cnt.module_id = m.id
        JOIN courses c ON m.course_id = c.id
        WHERE cnt.id = ?
        """,
        (content_id,)
    )
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
        
    if current_user.get("role_name") == "college_admin":
        verify_tenant_access(current_user, content["college_id"])
    
    execute_query(
        """
        UPDATE course_contents
        SET title = ?, content_type = ?, content_data = ?, file_url = ?,
            duration_minutes = ?, sort_order = ?, is_mandatory = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        """,
        (
            req.title.strip(),
            req.content_type,
            req.content_data,
            req.file_url,
            req.duration_minutes,
            req.sort_order,
            1 if req.is_mandatory else 0,
            content_id
        )
    )
    return query_one("SELECT * FROM course_contents WHERE id = ?", (content_id,))

@router.delete("/{content_id}")
def delete_content(content_id: int, current_user: Dict[str, Any] = Depends(require_role(["super_admin", "college_admin"]))):
    """Deletes a content item."""
    content = query_one(
        """
        SELECT cnt.id, c.college_id
        FROM course_contents cnt
        JOIN course_modules m ON cnt.module_id = m.id
        JOIN courses c ON m.course_id = c.id
        WHERE cnt.id = ?
        """,
        (content_id,)
    )
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
        
    if current_user.get("role_name") == "college_admin":
        verify_tenant_access(current_user, content["college_id"])
        
    execute_query("DELETE FROM course_contents WHERE id = ?", (content_id,))
    return {"message": "Content deleted successfully"}