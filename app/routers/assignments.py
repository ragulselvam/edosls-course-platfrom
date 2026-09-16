import json
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Dict, Any, Optional
from app.models import AssignmentCreate, AssignmentSubmit
from app.database import query_one, query_all, execute_query
from app.middleware import get_current_user, require_role, verify_tenant_access, log_audit

router = APIRouter(prefix="/api/assignments", tags=["Assignments"])

@router.get("")
def list_all_assignments(
    course_id: Optional[int] = None,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Lists all assignments for student's enrolled courses or admin's college."""
    role = current_user.get("role_name")
    user_college_id = current_user.get("college_id")
    
    if role == "student":
        student_id = current_user.get("student_record_id")
        sql = """
            SELECT a.*, c.title as course_title, c.code as course_code, m.title as module_title,
                   sub.id as submission_id, sub.submitted_at, sub.file_urls_json,
                   CASE WHEN sub.id IS NOT NULL THEN 'submitted' ELSE 'pending' END as submission_status,
                   r.score, r.percentage, r.passed, r.feedback
            FROM assignments a
            JOIN courses c ON a.course_id = c.id
            JOIN enrollments e ON e.course_id = c.id AND e.student_id = ?
            LEFT JOIN course_modules m ON a.module_id = m.id
            LEFT JOIN submissions sub ON sub.assignment_id = a.id AND sub.student_id = ?
            LEFT JOIN results r ON sub.id = r.submission_id
            WHERE 1=1
        """
        params = [student_id, student_id]
        if course_id:
            sql += " AND a.course_id = ?"
            params.append(course_id)
        sql += " ORDER BY a.due_date ASC, a.id ASC"
        return query_all(sql, tuple(params))
    else:
        sql = """
            SELECT a.*, c.title as course_title, c.code as course_code, m.title as module_title
            FROM assignments a
            JOIN courses c ON a.course_id = c.id
            LEFT JOIN course_modules m ON a.module_id = m.id
            WHERE 1=1
        """
        params = []
        if role == "college_admin":
            sql += " AND c.college_id = ?"
            params.append(user_college_id)
        if course_id:
            sql += " AND a.course_id = ?"
            params.append(course_id)
        sql += " ORDER BY a.id ASC"
        return query_all(sql, tuple(params))

@router.get("/course/{course_id}")
def list_course_assignments(course_id: int, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Lists all assignments for a given course."""
    course = query_one("SELECT id, college_id FROM courses WHERE id = ?", (course_id,))
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
        
    verify_tenant_access(current_user, course["college_id"])
    
    assignments = query_all(
        """
        SELECT a.*, m.title as module_title
        FROM assignments a
        LEFT JOIN course_modules m ON a.module_id = m.id
        WHERE a.course_id = ?
        ORDER BY a.created_at ASC
        """,
        (course_id,)
    )
    
    # If student, attach submission status
    if current_user["role_name"] == "student":
        student_id = current_user.get("student_record_id")
        for asgn in assignments:
            sub = query_one(
                """
                SELECT s.*, r.score, r.max_score, r.percentage, r.passed, r.feedback, r.evaluated_at
                FROM submissions s
                LEFT JOIN results r ON s.id = r.submission_id
                WHERE s.assignment_id = ? AND s.student_id = ?
                ORDER BY s.submitted_at DESC LIMIT 1
                """,
                (asgn["id"], student_id)
            )
            asgn["submission"] = sub
            
    return assignments

@router.post("", status_code=status.HTTP_201_CREATED)
def create_assignment(
    req: AssignmentCreate,
    current_user: Dict[str, Any] = Depends(require_role(["college_admin", "super_admin"]))
):
    """Creates a new assignment for a course."""
    course = query_one("SELECT id, college_id, title FROM courses WHERE id = ?", (req.course_id,))
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
        
    verify_tenant_access(current_user, course["college_id"])
    
    due_str = req.due_date.strftime("%Y-%m-%d %H:%M:%S") if req.due_date else None
    asgn_id = execute_query(
        """
        INSERT INTO assignments (course_id, module_id, title, description, instructions, attachment_url, max_score, due_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            req.course_id,
            req.module_id,
            req.title.strip(),
            req.description,
            req.instructions,
            req.attachment_url,
            req.max_score,
            due_str
        )
    )
    
    # Notify students in college
    execute_query(
        """
        INSERT INTO notifications (college_id, user_id, title, message, type, link_url)
        VALUES (?, NULL, ?, ?, 'assignment', ?)
        """,
        (
            course["college_id"],
            f"New Assignment in {course['title']}: {req.title}",
            f"Assignment '{req.title}' has been added to {course['title']}. Max score: {req.max_score} pts.",
            f"/assignments/{asgn_id}"
        )
    )
    
    return query_one("SELECT * FROM assignments WHERE id = ?", (asgn_id,))

@router.post("/submit", status_code=status.HTTP_201_CREATED)
def submit_assignment(
    req: AssignmentSubmit,
    current_user: Dict[str, Any] = Depends(require_role(["student"]))
):
    """Submits student work/files for an assignment."""
    student_id = current_user.get("student_record_id")
    college_id = current_user.get("college_id")
    
    asgn = query_one(
        """
        SELECT a.*, c.college_id, c.title as course_title
        FROM assignments a
        JOIN courses c ON a.course_id = c.id
        WHERE a.id = ?
        """,
        (req.assignment_id,)
    )
    if not asgn:
        raise HTTPException(status_code=404, detail="Assignment not found")
        
    if int(asgn["college_id"]) != int(college_id):
        raise HTTPException(status_code=403, detail="Cross-tenant assignment submission forbidden")
        
    sub_id = execute_query(
        """
        INSERT INTO submissions (college_id, student_id, assignment_id, file_urls_json, code_submission, status)
        VALUES (?, ?, ?, ?, ?, 'submitted')
        """,
        (
            college_id,
            student_id,
            req.assignment_id,
            json.dumps(req.file_urls),
            req.notes
        )
    )
    
    return {
        "submission_id": sub_id,
        "assignment_id": req.assignment_id,
        "status": "submitted",
        "message": "Assignment submitted successfully"
    }

@router.get("/{assignment_id}/submissions")
def list_assignment_submissions(
    assignment_id: int,
    current_user: Dict[str, Any] = Depends(require_role(["college_admin", "super_admin"]))
):
    """Lists student submissions for grading."""
    asgn = query_one("SELECT a.*, c.college_id FROM assignments a JOIN courses c ON a.course_id = c.id WHERE a.id = ?", (assignment_id,))
    if not asgn:
        raise HTTPException(status_code=404, detail="Assignment not found")
        
    verify_tenant_access(current_user, asgn["college_id"])
    
    submissions = query_all(
        """
        SELECT sub.*, s.roll_number, s.department, u.first_name, u.last_name, u.email,
               r.id as result_id, r.score, r.percentage, r.passed, r.feedback, r.evaluated_at
        FROM submissions sub
        JOIN students s ON sub.student_id = s.id
        JOIN users u ON s.user_id = u.id
        LEFT JOIN results r ON sub.id = r.submission_id
        WHERE sub.assignment_id = ?
        ORDER BY sub.submitted_at DESC
        """,
        (assignment_id,)
    )
    return submissions