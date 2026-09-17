import uuid
from datetime import datetime, date, timezone
from fastapi import APIRouter, HTTPException, Depends, status
from typing import Dict, Any, List
from app.models import ProgressUpdate
from app.database import query_one, query_all, execute_query
from app.middleware import get_current_user, require_role

router = APIRouter(prefix="/api/progress", tags=["Progress Tracking"])

@router.get("/course/{course_id}")
def get_course_progress(course_id: int, current_user: Dict[str, Any] = Depends(require_role(["student"]))):
    """Retrieves student's detailed progress across modules and content items for a course."""
    student_id = current_user.get("student_record_id")
    enrollment = query_one(
        "SELECT * FROM enrollments WHERE student_id = ? AND course_id = ?",
        (student_id, course_id)
    )
    if not enrollment:
        raise HTTPException(status_code=404, detail="Student is not enrolled in this course")
        
    completed_rows = query_all(
        "SELECT content_id, is_completed, time_spent_seconds, completed_at FROM progress WHERE enrollment_id = ?",
        (enrollment["id"],)
    )
    completed_map = {row["content_id"]: row for row in completed_rows}
    
    return {
        "enrollment": enrollment,
        "completed_items": completed_map,
        "progress_percentage": enrollment["progress_percentage"],
        "status": enrollment["status"]
    }

@router.post("/mark-complete")
def mark_content_complete(
    req: ProgressUpdate,
    current_user: Dict[str, Any] = Depends(require_role(["student"]))
):
    """
    Marks a lesson/content item as complete, increments time spent, recalculates overall
    course progress percentage, and handles course completion / automatic certificate generation.
    """
    student_id = current_user.get("student_record_id")
    college_id = current_user.get("college_id")
    
    # Identify course from content_id
    content_info = query_one(
        """
        SELECT cnt.id as content_id, cnt.is_mandatory, m.id as module_id, c.id as course_id,
               c.title as course_title, c.passing_percentage, c.certificate_enabled, c.college_id
        FROM course_contents cnt
        JOIN course_modules m ON cnt.module_id = m.id
        JOIN courses c ON m.course_id = c.id
        WHERE cnt.id = ?
        """,
        (req.content_id,)
    )
    if not content_info:
        raise HTTPException(status_code=404, detail="Content item not found")
        
    course_id = content_info["course_id"]
    
    # Get or create enrollment
    enrollment = query_one(
        "SELECT * FROM enrollments WHERE student_id = ? AND course_id = ?",
        (student_id, course_id)
    )
    if not enrollment:
        # Auto-enroll if student is viewing course content
        enrollment_id = execute_query(
            "INSERT INTO enrollments (college_id, student_id, course_id, status) VALUES (?, ?, ?, 'in_progress')",
            (college_id, student_id, course_id)
        )
        enrollment = query_one("SELECT * FROM enrollments WHERE id = ?", (enrollment_id,))
    else:
        enrollment_id = enrollment["id"]
        
    # Upsert progress record
    existing_prog = query_one(
        "SELECT id, time_spent_seconds FROM progress WHERE enrollment_id = ? AND content_id = ?",
        (enrollment_id, req.content_id)
    )
    
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    if existing_prog:
        new_time = existing_prog["time_spent_seconds"] + req.time_spent_seconds
        execute_query(
            """
            UPDATE progress
            SET is_completed = ?, time_spent_seconds = ?, completed_at = COALESCE(completed_at, ?), last_accessed_at = ?
            WHERE id = ?
            """,
            (1 if req.is_completed else 0, new_time, now_str if req.is_completed else None, now_str, existing_prog["id"])
        )
    else:
        execute_query(
            """
            INSERT INTO progress (enrollment_id, content_id, is_completed, time_spent_seconds, completed_at, last_accessed_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (enrollment_id, req.content_id, 1 if req.is_completed else 0, req.time_spent_seconds, now_str if req.is_completed else None, now_str)
        )
        
    # Calculate overall progress % for course
    all_mandatory = query_all(
        """
        SELECT cnt.id
        FROM course_contents cnt
        JOIN course_modules m ON cnt.module_id = m.id
        WHERE m.course_id = ? AND cnt.is_mandatory = 1
        """,
        (course_id,)
    )
    total_mandatory = len(all_mandatory)
    
    completed_mandatory = query_all(
        """
        SELECT p.content_id
        FROM progress p
        JOIN course_contents cnt ON p.content_id = cnt.id
        JOIN course_modules m ON cnt.module_id = m.id
        WHERE p.enrollment_id = ? AND p.is_completed = 1 AND cnt.is_mandatory = 1 AND m.course_id = ?
        """,
        (enrollment_id, course_id)
    )
    completed_count = len(completed_mandatory)
    
    new_percentage = round((completed_count / total_mandatory * 100.0) if total_mandatory > 0 else 100.0, 1)
    new_percentage = min(100.0, new_percentage)
    
    new_status = enrollment["status"]
    if new_percentage >= 100.0:
        new_status = "completed"
        completed_at = now_str
    elif new_percentage > 0:
        new_status = "in_progress"
        completed_at = None
    else:
        completed_at = None
        
    execute_query(
        """
        UPDATE enrollments
        SET progress_percentage = ?, status = ?, completed_at = COALESCE(?, completed_at)
        WHERE id = ?
        """,
        (new_percentage, new_status, completed_at, enrollment_id)
    )
    
    # Auto-generate Certificate if completed & eligible
    certificate = None
    if new_status == "completed" and content_info.get("certificate_enabled"):
        existing_cert = query_one(
            "SELECT * FROM certificates WHERE student_id = ? AND course_id = ?",
            (student_id, course_id)
        )
        if not existing_cert:
            cert_code = f"CERT-{college_id}-{course_id}-{uuid.uuid4().hex[:8].upper()}"
            today_str = date.today().isoformat()
            qr_data = f"https://verify.platform.edu/certificates/{cert_code}"
            
            cert_id = execute_query(
                """
                INSERT INTO certificates (
                    certificate_code, college_id, student_id, course_id, enrollment_id,
                    issue_date, qr_code_data, signature_name, signature_title
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, 'Dr. Aris Thorne', 'Dean of Academic Excellence')
                """,
                (cert_code, college_id, student_id, course_id, enrollment_id, today_str, qr_data)
            )
            
            certificate = query_one("SELECT * FROM certificates WHERE id = ?", (cert_id,))
            
            # Send Certificate Ready Notification
            execute_query(
                """
                INSERT INTO notifications (college_id, user_id, title, message, type, link_url)
                VALUES (?, ?, ?, ?, 'certificate', ?)
                """,
                (
                    college_id,
                    current_user["id"],
                    f"🎉 Certificate Issued: {content_info['course_title']}",
                    f"Congratulations! You completed '{content_info['course_title']}' and your verifiable certificate is now available.",
                    f"/certificates"
                )
            )
        else:
            certificate = existing_cert
            
    return {
        "content_id": req.content_id,
        "is_completed": req.is_completed,
        "course_id": course_id,
        "progress_percentage": new_percentage,
        "status": new_status,
        "certificate_earned": bool(certificate),
        "certificate": certificate
    }