from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Dict, Any, Optional
from app.models import CollegeCreate, CollegeUpdate
from app.database import query_one, query_all, execute_query
from app.middleware import require_role, log_audit, get_current_user

router = APIRouter(prefix="/api/colleges", tags=["Colleges"])

@router.get("/public/list")
def list_public_colleges():
    """Public endpoint to fetch active colleges for registration dropdowns."""
    return query_all("SELECT id, name, code, domain, logo_url FROM colleges WHERE is_active = 1 ORDER BY name ASC")

@router.get("")
def list_colleges(current_user: Dict[str, Any] = Depends(require_role(["super_admin"]))):
    """Lists all colleges with summary statistics (student count, courses count, admins count)."""
    colleges = query_all(
        """
        SELECT c.*,
               COUNT(DISTINCT s.id) as student_count,
               COUNT(DISTINCT ca.id) as admin_count,
               COUNT(DISTINCT cr.id) as course_count
        FROM colleges c
        LEFT JOIN students s ON c.id = s.college_id
        LEFT JOIN college_admins ca ON c.id = ca.college_id
        LEFT JOIN courses cr ON c.id = cr.college_id
        GROUP BY c.id
        ORDER BY c.created_at DESC
        """
    )
    return colleges

@router.get("/{college_id}")
def get_college(college_id: int, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Fetches details for a specific college."""
    # Allow Super Admin or College Admin/Student of that specific college
    if current_user.get("role_name") != "super_admin" and current_user.get("college_id") != college_id:
        raise HTTPException(status_code=403, detail="Unauthorized access to college resource")
        
    college = query_one(
        """
        SELECT c.*,
               COUNT(DISTINCT s.id) as student_count,
               COUNT(DISTINCT ca.id) as admin_count,
               COUNT(DISTINCT cr.id) as course_count
        FROM colleges c
        LEFT JOIN students s ON c.id = s.college_id
        LEFT JOIN college_admins ca ON c.id = ca.college_id
        LEFT JOIN courses cr ON c.id = cr.college_id
        WHERE c.id = ?
        GROUP BY c.id
        """,
        (college_id,)
    )
    if not college:
        raise HTTPException(status_code=404, detail="College not found")
    return college

@router.post("", status_code=status.HTTP_201_CREATED)
def create_college(req: CollegeCreate, current_user: Dict[str, Any] = Depends(require_role(["super_admin"]))):
    """Creates a new college organization."""
    code_cleaned = req.code.strip().upper()
    existing = query_one("SELECT id FROM colleges WHERE UPPER(code) = UPPER(?)", (code_cleaned,))
    if existing:
        raise HTTPException(status_code=400, detail=f"College code '{code_cleaned}' already exists")
        
    college_id = execute_query(
        """
        INSERT INTO colleges (name, code, domain, logo_url, address, contact_email, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            req.name.strip(),
            code_cleaned,
            req.domain.strip() if (req.domain and req.domain.strip()) else None,
            req.logo_url.strip() if (req.logo_url and req.logo_url.strip()) else None,
            req.address.strip() if (req.address and req.address.strip()) else None,
            req.contact_email.strip() if (req.contact_email and req.contact_email.strip()) else None,
            1 if req.is_active else 0
        )
    )
    
    log_audit(
        college_id=college_id,
        user_id=current_user["id"],
        action="COLLEGE_CREATE",
        resource_type="college",
        resource_id=str(college_id),
        details={"name": req.name, "code": code_cleaned}
    )
    
    return query_one("SELECT * FROM colleges WHERE id = ?", (college_id,))

@router.put("/{college_id}")
def update_college(college_id: int, req: CollegeUpdate, current_user: Dict[str, Any] = Depends(require_role(["super_admin"]))):
    """Updates college metadata."""
    college = query_one("SELECT id FROM colleges WHERE id = ?", (college_id,))
    if not college:
        raise HTTPException(status_code=404, detail="College not found")
        
    fields = []
    values = []
    if req.name is not None:
        fields.append("name = ?")
        values.append(req.name.strip())
    if req.code is not None:
        fields.append("code = ?")
        values.append(req.code.strip().upper())
    if req.domain is not None:
        fields.append("domain = ?")
        values.append(req.domain.strip() if req.domain.strip() else None)
    if req.logo_url is not None:
        fields.append("logo_url = ?")
        values.append(req.logo_url.strip() if req.logo_url.strip() else None)
    if req.address is not None:
        fields.append("address = ?")
        values.append(req.address.strip() if req.address.strip() else None)
    if req.contact_email is not None:
        fields.append("contact_email = ?")
        values.append(req.contact_email.strip() if req.contact_email.strip() else None)
    if req.is_active is not None:
        fields.append("is_active = ?")
        values.append(1 if req.is_active else 0)
        
    if not fields:
        return query_one("SELECT * FROM colleges WHERE id = ?", (college_id,))
        
    fields.append("updated_at = CURRENT_TIMESTAMP")
    values.append(college_id)
    
    execute_query(f"UPDATE colleges SET {', '.join(fields)} WHERE id = ?", tuple(values))
    
    log_audit(
        college_id=college_id,
        user_id=current_user["id"],
        action="COLLEGE_UPDATE",
        resource_type="college",
        resource_id=str(college_id)
    )
    
    return query_one("SELECT * FROM colleges WHERE id = ?", (college_id,))

@router.patch("/{college_id}/toggle-status")
def toggle_college_status(college_id: int, current_user: Dict[str, Any] = Depends(require_role(["super_admin"]))):
    """Toggles active/disabled status for a college."""
    college = query_one("SELECT id, is_active, name FROM colleges WHERE id = ?", (college_id,))
    if not college:
        raise HTTPException(status_code=404, detail="College not found")
        
    new_status = 0 if college["is_active"] == 1 else 1
    execute_query("UPDATE colleges SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", (new_status, college_id))
    
    log_audit(
        college_id=college_id,
        user_id=current_user["id"],
        action="COLLEGE_STATUS_TOGGLE",
        resource_type="college",
        resource_id=str(college_id),
        details={"new_active_status": new_status}
    )
    return {"message": f"College '{college['name']}' status set to {'active' if new_status == 1 else 'disabled'}", "is_active": new_status}

@router.delete("/{college_id}")
def delete_college(college_id: int, current_user: Dict[str, Any] = Depends(require_role(["super_admin"]))):
    """Deletes a college, all its users, students, admins, courses and cascading relations."""
    college = query_one("SELECT id, name FROM colleges WHERE id = ?", (college_id,))
    if not college:
        raise HTTPException(status_code=404, detail="College not found")
        
    # Delete institutional users of this college (students and admins)
    execute_query("DELETE FROM users WHERE college_id = ?", (college_id,))
    # Delete the college entity (which triggers CASCADE to courses, modules, assessments, etc.)
    execute_query("DELETE FROM colleges WHERE id = ?", (college_id,))
    
    log_audit(
        college_id=None,
        user_id=current_user["id"],
        action="COLLEGE_DELETE",
        resource_type="college",
        resource_id=str(college_id),
        details={"name": college["name"]}
    )
    return {"message": f"College '{college['name']}' deleted successfully"}