from fastapi import APIRouter, HTTPException, Depends, status, Request
from typing import Dict, Any
from app.models import (
    LoginRequest, TokenResponse, ChangePasswordRequest,
    ForgotPasswordRequest, ResetPasswordRequest, UserUpdateRequest,
    StudentPublicRegistration
)
from app.database import query_one, execute_query
from app.security import verify_password, hash_password, create_access_token, decode_access_token
from app.middleware import get_current_user, log_audit

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, request: Request):
    """Authenticates user, verifies active status, and returns JWT token."""
    user = query_one(
        """
        SELECT u.id, u.college_id, u.role_id, r.name as role_name,
               u.email, u.password_hash, u.first_name, u.last_name, u.phone, u.avatar_url,
               u.is_active, c.name as college_name, c.code as college_code, c.is_active as college_is_active,
               s.id as student_record_id, s.roll_number, s.department, s.year_of_study,
               ca.id as admin_record_id, ca.designation
        FROM users u
        JOIN roles r ON u.role_id = r.id
        LEFT JOIN colleges c ON u.college_id = c.id
        LEFT JOIN students s ON u.id = s.user_id
        LEFT JOIN college_admins ca ON u.id = ca.user_id
        WHERE LOWER(u.email) = LOWER(?)
        """,
        (req.email.strip(),)
    )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    if not verify_password(req.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    if not user["is_active"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Please contact support."
        )
    
    # Check if college is disabled (except for Super Admin)
    if user["role_name"] != "super_admin" and user["college_id"]:
        if user.get("college_is_active") == 0:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your college access is temporarily suspended. Contact Super Admin."
            )
            
    token_payload = {
        "sub": str(user["id"]),
        "email": user["email"],
        "role": user["role_name"],
        "college_id": user["college_id"],
        "name": f"{user['first_name']} {user['last_name']}"
    }
    
    token = create_access_token(token_payload)
    
    # Remove sensitive password hash from return
    user_dict = dict(user)
    user_dict.pop("password_hash", None)
    
    log_audit(
        college_id=user["college_id"],
        user_id=user["id"],
        action="USER_LOGIN",
        resource_type="auth",
        resource_id=str(user["id"]),
        details={"email": user["email"], "role": user["role_name"]},
        ip_address=request.client.host if request.client else None
    )
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user_dict
    }

@router.get("/me")
def get_me(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Returns current user details and permissions."""
    return current_user

@router.post("/change-password")
def change_password(req: ChangePasswordRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Changes password for the current user."""
    user = query_one("SELECT password_hash FROM users WHERE id = ?", (current_user["id"],))
    if not user or not verify_password(req.old_password, user["password_hash"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    new_hash = hash_password(req.new_password)
    execute_query("UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", (new_hash, current_user["id"]))
    
    log_audit(
        college_id=current_user.get("college_id"),
        user_id=current_user["id"],
        action="PASSWORD_CHANGE",
        resource_type="user",
        resource_id=str(current_user["id"])
    )
    return {"message": "Password changed successfully"}

@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest):
    """Generates password reset token."""
    user = query_one("SELECT id, email FROM users WHERE LOWER(email) = LOWER(?)", (req.email.strip(),))
    if not user:
        # Avoid user enumeration in production, return generic success
        return {"message": "If this email is registered, a password reset link has been issued.", "reset_token": None}
    
    reset_token = create_access_token({"sub": str(user["id"]), "type": "reset"}, None)
    return {
        "message": "Password reset token generated successfully",
        "reset_token": reset_token
    }

@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest):
    """Resets password using a reset token."""
    payload = decode_access_token(req.token)
    if not payload or payload.get("type") != "reset":
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    
    user_id = payload.get("sub")
    new_hash = hash_password(req.new_password)
    execute_query("UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", (new_hash, user_id))
    return {"message": "Password has been reset successfully. You can now login with your new password."}

@router.put("/profile")
def update_profile(req: UserUpdateRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Updates user first name, last name, phone, or avatar."""
    fields = []
    values = []
    if req.first_name is not None:
        fields.append("first_name = ?")
        values.append(req.first_name.strip())
    if req.last_name is not None:
        fields.append("last_name = ?")
        values.append(req.last_name.strip())
    if req.phone is not None:
        fields.append("phone = ?")
        values.append(req.phone.strip())
    if req.avatar_url is not None:
        fields.append("avatar_url = ?")
        values.append(req.avatar_url)
        
    if not fields:
        return {"message": "No changes made", "user": current_user}
        
    fields.append("updated_at = CURRENT_TIMESTAMP")
    values.append(current_user["id"])
    
    sql = f"UPDATE users SET {', '.join(fields)} WHERE id = ?"
    execute_query(sql, tuple(values))
    
    updated_user = query_one("SELECT * FROM users WHERE id = ?", (current_user["id"],))
    return {"message": "Profile updated successfully", "user": updated_user}

@router.post("/register-student", status_code=status.HTTP_201_CREATED)
def register_student(req: StudentPublicRegistration):
    """Registers a new student user and student record directly into database.db."""
    clean_email = req.email.strip().lower()
    
    # Check if user with this email already exists
    existing_user = query_one("SELECT id FROM users WHERE LOWER(email) = ?", (clean_email,))
    if existing_user:
        raise HTTPException(status_code=400, detail="An account with this email address already exists. Please log in.")
        
    target_college_id = req.college_id
    if not target_college_id:
        first_col = query_one("SELECT id FROM colleges WHERE is_active = 1 ORDER BY id ASC LIMIT 1")
        target_college_id = first_col["id"] if first_col else None
        
    if not target_college_id:
        raise HTTPException(status_code=400, detail="No active college available for registration.")
        
    # Check duplicate roll number in target college
    existing_roll = query_one(
        "SELECT id FROM students WHERE college_id = ? AND UPPER(roll_number) = UPPER(?)",
        (target_college_id, req.roll_number.strip())
    )
    if existing_roll:
        raise HTTPException(status_code=400, detail=f"Roll number '{req.roll_number}' is already registered in this institution.")
        
    role = query_one("SELECT id FROM roles WHERE name = 'student'")
    pwd_hash = hash_password(req.password or "Student@123")
    
    user_id = execute_query(
        """
        INSERT INTO users (college_id, role_id, email, password_hash, first_name, last_name, phone, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1)
        """,
        (target_college_id, role["id"], clean_email, pwd_hash, req.first_name.strip(), req.last_name.strip(), req.phone)
    )
    
    student_record_id = execute_query(
        """
        INSERT INTO students (user_id, college_id, roll_number, department, year_of_study, batch)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (user_id, target_college_id, req.roll_number.strip().upper(), req.department.strip(), req.year_of_study, req.batch or "2024-2028")
    )
    
    # Issue welcome notification
    execute_query(
        """
        INSERT INTO notifications (college_id, user_id, title, message, type, link_url)
        VALUES (?, ?, 'Welcome to the Platform!', 'Your student account has been successfully created. Explore available courses and start learning!', 'system', '/courses')
        """,
        (target_college_id, user_id)
    )
    
    user = query_one(
        """
        SELECT u.id, u.college_id, u.role_id, r.name as role_name,
               u.email, u.first_name, u.last_name, u.phone, u.avatar_url,
               u.is_active, c.name as college_name, c.code as college_code,
               s.id as student_record_id, s.roll_number, s.department, s.year_of_study, s.batch
        FROM users u
        JOIN roles r ON u.role_id = r.id
        LEFT JOIN colleges c ON u.college_id = c.id
        LEFT JOIN students s ON u.id = s.user_id
        WHERE u.id = ?
        """,
        (user_id,)
    )
    
    token_payload = {
        "sub": str(user["id"]),
        "email": user["email"],
        "role": "student",
        "college_id": target_college_id,
        "name": f"{user['first_name']} {user['last_name']}"
    }
    access_token = create_access_token(token_payload)
    
    user_dict = dict(user)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_dict,
        "student_id": student_record_id,
        "message": "Student registration completed successfully!"
    }
