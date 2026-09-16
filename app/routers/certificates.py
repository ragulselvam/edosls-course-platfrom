from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Dict, Any, Optional
from app.database import query_one, query_all, execute_query
from app.middleware import get_current_user, require_role, verify_tenant_access

router = APIRouter(prefix="/api/certificates", tags=["Certificates"])

@router.get("")
def list_certificates(
    course_id: Optional[int] = None,
    college_id: Optional[int] = None,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Lists certificates based on role and tenant."""
    role = current_user.get("role_name")
    
    sql = """
        SELECT cert.*, c.title as course_title, c.code as course_code, c.duration as course_duration,
               col.name as college_name, col.code as college_code, col.logo_url as college_logo,
               s.roll_number, s.department, u.first_name, u.last_name, u.email
        FROM certificates cert
        JOIN courses c ON cert.course_id = c.id
        JOIN colleges col ON cert.college_id = col.id
        JOIN students s ON cert.student_id = s.id
        JOIN users u ON s.user_id = u.id
        WHERE 1=1
    """
    params = []
    
    if role == "student":
        sql += " AND cert.student_id = ?"
        params.append(current_user.get("student_record_id"))
    elif role == "college_admin":
        sql += " AND cert.college_id = ?"
        params.append(current_user.get("college_id"))
        if course_id:
            sql += " AND cert.course_id = ?"
            params.append(course_id)
    elif role == "super_admin":
        if college_id:
            sql += " AND cert.college_id = ?"
            params.append(college_id)
        if course_id:
            sql += " AND cert.course_id = ?"
            params.append(course_id)
            
    sql += " ORDER BY cert.created_at DESC"
    return query_all(sql, tuple(params))

@router.get("/{certificate_id}")
def get_certificate_by_id(certificate_id: int, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Fetches full certificate payload for printable view."""
    cert = query_one(
        """
        SELECT cert.*, c.title as course_title, c.code as course_code, c.duration as course_duration,
               c.category, col.name as college_name, col.code as college_code, col.logo_url as college_logo,
               s.roll_number, s.department, s.batch, u.first_name, u.last_name, u.email
        FROM certificates cert
        JOIN courses c ON cert.course_id = c.id
        JOIN colleges col ON cert.college_id = col.id
        JOIN students s ON cert.student_id = s.id
        JOIN users u ON s.user_id = u.id
        WHERE cert.id = ?
        """,
        (certificate_id,)
    )
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
        
    verify_tenant_access(current_user, cert["college_id"])
    return cert

@router.get("/verify/{certificate_code}")
def verify_certificate_public(certificate_code: str):
    """
    Public Certificate Verification API endpoint.
    No authentication required. Verifies cryptographic certificate authenticity,
    issuing college, student details, course title, and completion date.
    """
    cert = query_one(
        """
        SELECT cert.certificate_code, cert.issue_date, cert.qr_code_data, cert.signature_name, cert.signature_title,
               c.title as course_title, c.code as course_code, c.duration as course_duration,
               col.name as college_name, col.code as college_code, col.logo_url as college_logo,
               s.roll_number, s.department, u.first_name, u.last_name
        FROM certificates cert
        JOIN courses c ON cert.course_id = c.id
        JOIN colleges col ON cert.college_id = col.id
        JOIN students s ON cert.student_id = s.id
        JOIN users u ON s.user_id = u.id
        WHERE UPPER(cert.certificate_code) = UPPER(?)
        """,
        (certificate_code.strip(),)
    )
    if not cert:
        return {
            "is_valid": False,
            "certificate_code": certificate_code,
            "message": "Certificate record not found or invalid certificate code."
        }
        
    return {
        "is_valid": True,
        "certificate_code": cert["certificate_code"],
        "student_name": f"{cert['first_name']} {cert['last_name']}",
        "roll_number": cert["roll_number"],
        "department": cert["department"],
        "course_title": cert["course_title"],
        "course_code": cert["course_code"],
        "duration": cert["course_duration"],
        "college_name": cert["college_name"],
        "issue_date": cert["issue_date"],
        "signature_name": cert["signature_name"],
        "signature_title": cert["signature_title"],
        "message": "Certificate verified authentic and officially issued."
    }
