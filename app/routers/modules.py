from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Dict, Any
from app.models import ModuleCreate, ModuleReorder
from app.database import query_one, query_all, execute_query
from app.middleware import require_role, verify_tenant_access, log_audit

router = APIRouter(prefix="/api/modules", tags=["Course Modules"])

@router.post("/course/{course_id}", status_code=status.HTTP_201_CREATED)
def create_module(
    course_id: int,
    req: ModuleCreate,
    current_user: Dict[str, Any] = Depends(require_role(["super_admin", "college_admin"]))
):
    """Adds a new module to a course."""
    course = query_one("SELECT id, college_id FROM courses WHERE id = ?", (course_id,))
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    if current_user.get("role_name") == "college_admin":
        verify_tenant_access(current_user, course["college_id"])
    
    # Calculate next sort order if not specified
    last_mod = query_one("SELECT MAX(sort_order) as max_order FROM course_modules WHERE course_id = ?", (course_id,))
    next_order = (last_mod["max_order"] + 1) if last_mod and last_mod["max_order"] is not None else 0
    sort_order = req.sort_order if req.sort_order > 0 else next_order
    
    module_id = execute_query(
        """
        INSERT INTO course_modules (course_id, title, description, sort_order)
        VALUES (?, ?, ?, ?)
        """,
        (course_id, req.title.strip(), req.description, sort_order)
    )
    
    return query_one("SELECT * FROM course_modules WHERE id = ?", (module_id,))

@router.put("/{module_id}")
def update_module(
    module_id: int,
    req: ModuleCreate,
    current_user: Dict[str, Any] = Depends(require_role(["super_admin", "college_admin"]))
):
    """Updates module title, description, and order."""
    module = query_one(
        """
        SELECT m.id, m.course_id, c.college_id
        FROM course_modules m
        JOIN courses c ON m.course_id = c.id
        WHERE m.id = ?
        """,
        (module_id,)
    )
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
        
    if current_user.get("role_name") == "college_admin":
        verify_tenant_access(current_user, module["college_id"])
    
    execute_query(
        """
        UPDATE course_modules
        SET title = ?, description = ?, sort_order = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        """,
        (req.title.strip(), req.description, req.sort_order, module_id)
    )
    return query_one("SELECT * FROM course_modules WHERE id = ?", (module_id,))

@router.post("/reorder")
def reorder_modules(
    req: ModuleReorder,
    current_user: Dict[str, Any] = Depends(require_role(["super_admin", "college_admin"]))
):
    """Updates sequence order for a list of modules."""
    for item in req.module_orders:
        mod_id = item.get("id")
        order = item.get("sort_order", 0)
        if mod_id:
            execute_query("UPDATE course_modules SET sort_order = ? WHERE id = ?", (order, mod_id))
    return {"message": "Modules reordered successfully"}

@router.delete("/{module_id}")
def delete_module(module_id: int, current_user: Dict[str, Any] = Depends(require_role(["super_admin", "college_admin"]))):
    """Deletes a module and its contents."""
    module = query_one(
        """
        SELECT m.id, m.course_id, c.college_id
        FROM course_modules m
        JOIN courses c ON m.course_id = c.id
        WHERE m.id = ?
        """,
        (module_id,)
    )
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
        
    if current_user.get("role_name") == "college_admin":
        verify_tenant_access(current_user, module["college_id"])
        
    execute_query("DELETE FROM course_modules WHERE id = ?", (module_id,))
    return {"message": "Module deleted successfully"}