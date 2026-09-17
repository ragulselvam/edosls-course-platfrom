from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from app.models import EnrollmentCreate, EnrollmentStatusUpdate
from app.database import query_one, query_all, execute_query
from app.middleware import get_current_user, require_role, verify_tenant_access, log_audit

router = APIRouter(prefix="/api/enrollments", tags=["Enrollments"])

@router.get("")
@router.get("/my-courses")
def list_enrollments(
    course_id: Optional[int] = None,
    student_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    college_id: Optional[int] = None,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Lists enrollments based on role and filters."""
    role = current_user.get("role_name")
    
    sql = """
        SELECT e.*, c.title as course_title, c.code as course_code, c.category, c.level, c.duration,
               c.thumbnail_url, c.passing_percentage, c.certificate_enabled,
               s.roll_number, s.department, s.year_of_study,
               u.first_name, u.last_name, u.email,
               col.name as college_name, col.code as college_code,
               cert.id as certificate_id, cert.certificate_code, cert.issue_date
        FROM enrollments e
        JOIN courses c ON e.course_id = c.id
        JOIN students s ON e.student_id = s.id
        JOIN users u ON s.user_id = u.id
        JOIN colleges col ON e.college_id = col.id
        LEFT JOIN certificates cert ON (e.student_id = cert.student_id AND e.course_id = cert.course_id)
        WHERE 1=1
    """
    params = []
    
    if role == "student":
        # Students only see their own enrollments
        sql += " AND e.student_id = ?"
        params.append(current_user.get("student_record_id"))
    elif role == "college_admin":
        sql += " AND e.college_id = ?"
        params.append(current_user.get("college_id"))
        if course_id:
            sql += " AND e.course_id = ?"
            params.append(course_id)
        if student_id:
            sql += " AND e.student_id = ?"
            params.append(student_id)
    elif role == "super_admin":
        if college_id:
            sql += " AND e.college_id = ?"
            params.append(college_id)
        if course_id:
            sql += " AND e.course_id = ?"
            params.append(course_id)

    if status_filter:
        sql += " AND e.status = ?"
        params.append(status_filter)
        
    sql += " ORDER BY e.enrolled_at DESC"
    return query_all(sql, tuple(params))

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register_course(
    req: EnrollmentCreate,
    current_user: Dict[str, Any] = Depends(require_role(["student"]))
):
    """Registers a student into an available published course."""
    student_id = current_user.get("student_record_id")
    college_id = current_user.get("college_id")
    
    if not student_id or not college_id:
        raise HTTPException(status_code=400, detail="Student profile not found")
        
    course = query_one(
        "SELECT id, college_id, title, is_published, status FROM courses WHERE id = ?",
        (req.course_id,)
    )
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
        
    # Tenant verification
    if course.get("college_id") is not None and int(course["college_id"]) != int(college_id):
        raise HTTPException(status_code=403, detail="Cross-tenant error: You can only enroll in courses from your college")
        
    if course["is_published"] == 0 or course["status"] != "published":
        raise HTTPException(status_code=400, detail="This course is not open for registration")
        
    # Check if already registered
    existing = query_one(
        "SELECT id, status, progress_percentage FROM enrollments WHERE student_id = ? AND course_id = ?",
        (student_id, req.course_id)
    )
    if existing:
        return {
            "message": f"Already enrolled with status: {existing['status']}",
            "enrollment_id": existing["id"],
            "status": existing["status"],
            "progress_percentage": existing["progress_percentage"]
        }
        
    enrollment_id = execute_query(
        """
        INSERT INTO enrollments (college_id, student_id, course_id, status, progress_percentage)
        VALUES (?, ?, ?, 'registered', 0.0)
        """,
        (college_id, student_id, req.course_id)
    )
    
    # Notify student
    execute_query(
        """
        INSERT INTO notifications (college_id, user_id, title, message, type, link_url)
        VALUES (?, ?, ?, ?, 'enrollment', ?)
        """,
        (
            college_id,
            current_user["id"],
            f"Enrolled in {course['title']}",
            f"You have successfully registered for '{course['title']}'. Click here to begin learning!",
            f"/player/{req.course_id}"
        )
    )
    
    log_audit(
        college_id=college_id,
        user_id=current_user["id"],
        action="STUDENT_ENROLL",
        resource_type="enrollment",
        resource_id=str(enrollment_id),
        details={"course_title": course["title"], "student_id": student_id}
    )
    
    return {
        "message": f"Successfully registered for '{course['title']}'",
        "enrollment_id": enrollment_id,
        "status": "registered",
        "progress_percentage": 0.0
    }

@router.patch("/{enrollment_id}/status")
def update_enrollment_status(
    enrollment_id: int,
    req: EnrollmentStatusUpdate,
    current_user: Dict[str, Any] = Depends(require_role(["college_admin", "super_admin"]))
):
    """Updates enrollment status and final grade."""
    enrollment = query_one("SELECT * FROM enrollments WHERE id = ?", (enrollment_id,))
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
        
    verify_tenant_access(current_user, enrollment["college_id"])
    
    completed_at = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S") if req.status == "completed" else None
    
    execute_query(
        """
        UPDATE enrollments
        SET status = ?, final_grade = COALESCE(?, final_grade), completed_at = COALESCE(?, completed_at)
        WHERE id = ?
        """,
        (req.status, req.final_grade, completed_at, enrollment_id)
    )
    return {"message": f"Enrollment status updated to {req.status}"}