import json
from fastapi import Request, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional, List, Dict, Any
from app.security import decode_access_token
from app.database import query_one, execute_query

security_scheme = HTTPBearer(auto_error=False)

async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme)
) -> Dict[str, Any]:
    """Extract and validate the current user from Bearer header or auth cookie."""
    token = None
    if credentials:
        token = credentials.credentials
    elif "access_token" in request.cookies:
        token = request.cookies.get("access_token")
    
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token is missing or expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("sub")
    user = query_one(
        """
        SELECT u.id, u.college_id, u.role_id, r.name as role_name,
               u.email, u.first_name, u.last_name, u.phone, u.avatar_url,
               u.is_active, c.name as college_name, c.code as college_code,
               s.id as student_record_id, s.roll_number, s.department, s.year_of_study,
               ca.id as admin_record_id, ca.designation
        FROM users u
        JOIN roles r ON u.role_id = r.id
        LEFT JOIN colleges c ON u.college_id = c.id
        LEFT JOIN students s ON u.id = s.user_id
        LEFT JOIN college_admins ca ON u.id = ca.user_id
        WHERE u.id = ?
        """,
        (user_id,)
    )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.get("is_active"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated. Please contact administrator.",
        )
    
    return user

def require_role(allowed_roles: List[str]):
    """Dependency factory to enforce Role-Based Access Control."""
    async def role_checker(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
        user_role = current_user.get("role_name")
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Requires one of roles: {', '.join(allowed_roles)} (Your role: {user_role})",
            )
        return current_user
    return role_checker

def verify_tenant_access(current_user: Dict[str, Any], target_college_id: Optional[int]) -> bool:
    """Verifies that the user has authorization for the given college_id."""
    if current_user.get("role_name") == "super_admin":
        return True
    
    user_college_id = current_user.get("college_id")
    if target_college_id is None or user_college_id is None:
        return False
    
    if int(user_college_id) != int(target_college_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cross-tenant access violation: You are not authorized to access another college's resources.",
        )
    return True

def log_audit(
    college_id: Optional[int],
    user_id: Optional[int],
    action: str,
    resource_type: str,
    resource_id: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None
):
    """Inserts an immutable audit log record."""
    try:
        execute_query(
            """
            INSERT INTO audit_logs (college_id, user_id, action, resource_type, resource_id, details_json, ip_address)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                college_id,
                user_id,
                action,
                resource_type,
                str(resource_id) if resource_id is not None else None,
                json.dumps(details) if details else None,
                ip_address
            )
        )
    except Exception as e:
        print(f"Audit log failed: {e}")
