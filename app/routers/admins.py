from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Dict, Any, Optional
from app.models import AdminCreate
from app.database import query_one, query_all, execute_query
from app.security import hash_password
from app.middleware import require_role, log_audit

router = APIRouter(prefix="/api/admins", tags=["College Admins"])

@router.get("")
def list_college_admins(
    college_id: Optional[int] = None,
    current_user: Dict[str, Any] = Depends(require_role(["super_admin"]))
):
    """Lists all college administrator accounts."""
    sql = """
        SELECT u.id as user_id, u.email, u.first_name, u.last_name, u.phone, u.avatar_url, u.is_active,
               u.created_at, c.id as college_id, c.name as college_name, c.code as college_code,
               ca.id as admin_id, ca.department, ca.designation
        FROM users u
        JOIN roles r ON u.role_id = r.id
        JOIN college_admins ca ON u.id = ca.user_id
        JOIN colleges c ON u.college_id = c.id
        WHERE r.name = 'college_admin'
    """
    params = []
    if college_id:
        sql += " AND u.college_id = ?"
        params.append(college_id)
        
    sql += " ORDER BY u.created_at DESC"
    return query_all(sql, tuple(params))

@router.post("", status_code=status.HTTP_201_CREATED)
def create_college_admin(
    req: AdminCreate,
    current_user: Dict[str, Any] = Depends(require_role(["super_admin"]))
):
    """Creates a new College Admin user for a designated college."""
    # Check if college exists
    college = query_one("SELECT id, name FROM colleges WHERE id = ?", (req.college_id,))
    if not college:
        raise HTTPException(status_code=404, detail="College not found")
        
    # Check if email is already taken
    existing = query_one("SELECT id FROM users WHERE LOWER(email) = LOWER(?)", (req.email.strip(),))
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")
        
    role = query_one("SELECT id FROM roles WHERE name = 'college_admin'")
    if not role:
        raise HTTPException(status_code=500, detail="college_admin role missing")
        
    pwd_hash = hash_password(req.password)
    
    user_id = execute_query(
        """
        INSERT INTO users (college_id, role_id, email, password_hash, first_name, last_name, phone, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1)
        """,
        (
            req.college_id,
            role["id"],
            req.email.strip().lower(),
            pwd_hash,
            req.first_name.strip(),
            req.last_name.strip(),
            req.phone
        )
    )
    
    admin_id = execute_query(
        """
        INSERT INTO college_admins (user_id, college_id, department, designation)
        VALUES (?, ?, ?, ?)
        """,
        (user_id, req.college_id, req.department, req.designation)
    )
    
    log_audit(
        college_id=req.college_id,
        user_id=current_user["id"],
        action="ADMIN_CREATE",
        resource_type="college_admin",
        resource_id=str(admin_id),
        details={"email": req.email, "college_name": college["name"]}
    )
    
    return {
        "user_id": user_id,
        "admin_id": admin_id,
        "email": req.email,
        "first_name": req.first_name,
        "last_name": req.last_name,
        "college_id": req.college_id,
        "college_name": college["name"],
        "message": "College Admin created successfully"
    }

@router.delete("/{user_id}")
def delete_college_admin(user_id: int, current_user: Dict[str, Any] = Depends(require_role(["super_admin"]))):
    """Deletes an admin account."""
    user = query_one("SELECT u.id, u.email, u.college_id, r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?", (user_id,))
    if not user or user["role"] != "college_admin":
        raise HTTPException(status_code=404, detail="College admin not found")
        
    execute_query("UPDATE audit_logs SET user_id = NULL WHERE user_id = ?", (user_id,))
    execute_query("DELETE FROM notifications WHERE user_id = ?", (user_id,))
    execute_query("UPDATE courses SET created_by = NULL WHERE created_by = ?", (user_id,))
    execute_query("DELETE FROM users WHERE id = ?", (user_id,))
    log_audit(
        college_id=user["college_id"],
        user_id=current_user["id"],
        action="ADMIN_DELETE",
        resource_type="user",
        resource_id=str(user_id)
    )
    return {"message": f"College Admin '{user['email']}' deleted successfully"}