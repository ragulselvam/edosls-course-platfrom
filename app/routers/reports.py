from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Dict, Any, Optional
from app.database import query_one, query_all
from app.middleware import get_current_user, require_role, verify_tenant_access

router = APIRouter(prefix="/api/reports", tags=["Reports & Analytics"])

@router.get("/super-admin-dashboard")
def get_super_admin_dashboard(current_user: Dict[str, Any] = Depends(require_role(["super_admin"]))):
    """Calculates aggregate metrics across all colleges for Super Admin."""
    total_colleges = query_one("SELECT COUNT(*) as count FROM colleges")["count"]
    active_colleges = query_one("SELECT COUNT(*) as count FROM colleges WHERE is_active = 1")["count"]
    total_students = query_one("SELECT COUNT(*) as count FROM students")["count"]
    total_courses = query_one("SELECT COUNT(*) as count FROM courses")["count"]
    published_courses = query_one("SELECT COUNT(*) as count FROM courses WHERE is_published = 1")["count"]
    total_enrollments = query_one("SELECT COUNT(*) as count FROM enrollments")["count"]
    completed_enrollments = query_one("SELECT COUNT(*) as count FROM enrollments WHERE status = 'completed'")["count"]
    total_certificates = query_one("SELECT COUNT(*) as count FROM certificates")["count"]
    
    # College breakdown stats
    colleges_breakdown = query_all(
        """
        SELECT c.id, c.name, c.code, c.is_active,
               COUNT(DISTINCT s.id) as student_count,
               COUNT(DISTINCT cr.id) as course_count,
               COUNT(DISTINCT e.id) as enrollment_count,
               COUNT(DISTINCT cert.id) as certificate_count
        FROM colleges c
        LEFT JOIN students s ON c.id = s.college_id
        LEFT JOIN courses cr ON c.id = cr.college_id
        LEFT JOIN enrollments e ON c.id = e.college_id
        LEFT JOIN certificates cert ON c.id = cert.college_id
        GROUP BY c.id
        ORDER BY student_count DESC
        """
    )
    
    # Recent audit events
    recent_audits = query_all(
        """
        SELECT a.*, u.email as user_email, u.first_name, u.last_name, c.name as college_name
        FROM audit_logs a
        LEFT JOIN users u ON a.user_id = u.id
        LEFT JOIN colleges c ON a.college_id = c.id
        ORDER BY a.created_at DESC LIMIT 100
        """
    )
    
    return {
        "metrics": {
            "total_colleges": total_colleges,
            "active_colleges": active_colleges,
            "total_students": total_students,
            "total_courses": total_courses,
            "published_courses": published_courses,
            "total_enrollments": total_enrollments,
            "completed_enrollments": completed_enrollments,
            "total_certificates": total_certificates,
            "global_completion_rate": round((completed_enrollments / total_enrollments * 100) if total_enrollments > 0 else 0, 1)
        },
        "colleges_breakdown": colleges_breakdown,
        "colleges": colleges_breakdown,
        "recent_audits": recent_audits
    }

@router.get("/college-admin-dashboard")
def get_college_admin_dashboard(
    college_id: Optional[int] = None,
    current_user: Dict[str, Any] = Depends(require_role(["college_admin", "super_admin"]))
):
    """Calculates specific college metrics, charts, and student performance for College Admin."""
    target_college_id = college_id if (current_user["role_name"] == "super_admin" and college_id) else current_user.get("college_id")
    if not target_college_id:
        raise HTTPException(status_code=400, detail="College context required")
        
    college = query_one("SELECT * FROM colleges WHERE id = ?", (target_college_id,))
    if not college:
        raise HTTPException(status_code=404, detail="College not found")
        
    total_students = query_one("SELECT COUNT(*) as count FROM students WHERE college_id = ?", (target_college_id,))["count"]
    active_students = query_one(
        "SELECT COUNT(DISTINCT s.id) as count FROM students s JOIN users u ON s.user_id = u.id WHERE s.college_id = ? AND u.is_active = 1",
        (target_college_id,)
    )["count"]
    total_courses = query_one("SELECT COUNT(*) as count FROM courses WHERE (college_id = ? OR college_id IS NULL)", (target_college_id,))["count"]
    published_courses = query_one("SELECT COUNT(*) as count FROM courses WHERE (college_id = ? OR college_id IS NULL) AND is_published = 1", (target_college_id,))["count"]
    total_enrollments = query_one("SELECT COUNT(*) as count FROM enrollments WHERE college_id = ?", (target_college_id,))["count"]
    completed_enrollments = query_one("SELECT COUNT(*) as count FROM enrollments WHERE college_id = ? AND status = 'completed'", (target_college_id,))["count"]
    in_progress_enrollments = query_one("SELECT COUNT(*) as count FROM enrollments WHERE college_id = ? AND status = 'in_progress'", (target_college_id,))["count"]
    total_certificates = query_one("SELECT COUNT(*) as count FROM certificates WHERE college_id = ?", (target_college_id,))["count"]
    
    # Pass rate
    passed_results = query_one(
        "SELECT COUNT(*) as count FROM results r JOIN students s ON r.student_id = s.id WHERE s.college_id = ? AND r.passed = 1",
        (target_college_id,)
    )["count"]
    total_results = query_one(
        "SELECT COUNT(*) as count FROM results r JOIN students s ON r.student_id = s.id WHERE s.college_id = ?",
        (target_college_id,)
    )["count"]
    pass_rate = round((passed_results / total_results * 100) if total_results > 0 else 0, 1)
    completion_rate = round((completed_enrollments / total_enrollments * 100) if total_enrollments > 0 else 0, 1)

    # Chart 1: Course Enrollment & Popularity
    course_enrollment_chart = query_all(
        """
        SELECT c.id, c.title, c.code, COUNT(e.id) as enrollments_count,
               AVG(e.progress_percentage) as avg_progress,
               SUM(CASE WHEN e.status = 'completed' THEN 1 ELSE 0 END) as completed_count
        FROM courses c
        LEFT JOIN enrollments e ON c.id = e.course_id
        WHERE (c.college_id = ? OR c.college_id IS NULL)
        GROUP BY c.id
        ORDER BY enrollments_count DESC LIMIT 8
        """,
        (target_college_id,)
    )

    # Chart 2: Assessment Pass Performance
    assessment_chart = query_all(
        """
        SELECT a.id, a.title, a.assessment_type,
               COUNT(r.id) as attempts_count,
               AVG(r.score) as avg_score,
               AVG(r.percentage) as avg_percentage,
               SUM(CASE WHEN r.passed = 1 THEN 1 ELSE 0 END) as passed_count
        FROM assessments a
        LEFT JOIN results r ON a.id = r.assessment_id
        WHERE a.college_id = ?
        GROUP BY a.id
        ORDER BY attempts_count DESC LIMIT 6
        """,
        (target_college_id,)
    )

    # Recent Registrations
    recent_registrations = query_all(
        """
        SELECT s.roll_number, s.department, s.year_of_study, u.first_name, u.last_name, u.email, s.created_at
        FROM students s
        JOIN users u ON s.user_id = u.id
        WHERE s.college_id = ?
        ORDER BY s.created_at DESC LIMIT 8
        """,
        (target_college_id,)
    )

    return {
        "college": college,
        "metrics": {
            "total_students": total_students,
            "active_students": active_students,
            "total_courses": total_courses,
            "published_courses": published_courses,
            "total_enrollments": total_enrollments,
            "in_progress_enrollments": in_progress_enrollments,
            "completed_enrollments": completed_enrollments,
            "total_certificates": total_certificates,
            "course_completion_rate": completion_rate,
            "assessment_pass_rate": pass_rate
        },
        "charts": {
            "course_enrollments": course_enrollment_chart,
            "assessment_performance": assessment_chart
        },
        "recent_registrations": recent_registrations
    }

@router.get("/student-dashboard")
def get_student_dashboard(current_user: Dict[str, Any] = Depends(require_role(["student"]))):
    """Fetches personalized dashboard statistics for the logged-in student."""
    student_id = current_user.get("student_record_id")
    college_id = current_user.get("college_id")
    
    total_enrolled = query_one("SELECT COUNT(*) as count FROM enrollments WHERE student_id = ?", (student_id,))["count"]
    in_progress = query_one("SELECT COUNT(*) as count FROM enrollments WHERE student_id = ? AND status = 'in_progress'", (student_id,))["count"]
    completed = query_one("SELECT COUNT(*) as count FROM enrollments WHERE student_id = ? AND status = 'completed'", (student_id,))["count"]
    certificates_count = query_one("SELECT COUNT(*) as count FROM certificates WHERE student_id = ?", (student_id,))["count"]
    