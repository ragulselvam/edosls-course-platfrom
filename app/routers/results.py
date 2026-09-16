import json
from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Dict, Any, Optional
from app.models import ManualGradeRequest
from app.database import query_one, query_all, execute_query
from app.middleware import get_current_user, require_role, verify_tenant_access, log_audit

router = APIRouter(prefix="/api/results", tags=["Results & Grading"])

@router.get("")
def list_results(
    course_id: Optional[int] = None,
    assessment_id: Optional[int] = None,
    student_id: Optional[int] = None,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Lists results with tenant filtering."""
    role = current_user.get("role_name")
    user_college_id = current_user.get("college_id")
    
    sql = """
        SELECT r.*, sub.attempt_number, sub.submitted_at, sub.code_submission, sub.file_urls_json, sub.answers_json,
               s.roll_number, s.department, u.first_name, u.last_name, u.email,
               a.title as assessment_title, a.assessment_type, a.passing_percentage as required_passing_percentage,
               c.id as course_id, c.title as course_title, c.code as course_code
        FROM results r
        JOIN submissions sub ON r.submission_id = sub.id
        JOIN students s ON r.student_id = s.id
        JOIN users u ON s.user_id = u.id
        LEFT JOIN assessments a ON r.assessment_id = a.id
        LEFT JOIN courses c ON a.course_id = c.id
        WHERE 1=1
    """
    params = []
    
    if role == "student":
        sql += " AND r.student_id = ?"
        params.append(current_user.get("student_record_id"))
    elif role == "college_admin":
        sql += " AND s.college_id = ?"
        params.append(user_college_id)
        if course_id:
            sql += " AND c.id = ?"
            params.append(course_id)
        if assessment_id:
            sql += " AND a.id = ?"
            params.append(assessment_id)
        if student_id:
            sql += " AND s.id = ?"
            params.append(student_id)
    elif role == "super_admin":
        if course_id:
            sql += " AND c.id = ?"
            params.append(course_id)
        if assessment_id:
            sql += " AND a.id = ?"
            params.append(assessment_id)
            
    sql += " ORDER BY r.evaluated_at DESC"
    results = query_all(sql, tuple(params))
    
    for item in results:
        if item.get("feedback"):
            try:
                item["feedback_details"] = json.loads(item["feedback"])
            except Exception:
                item["feedback_details"] = item["feedback"]
        if item.get("file_urls_json"):
            try:
                item["file_urls"] = json.loads(item["file_urls_json"])
            except Exception:
                item["file_urls"] = []
                
    return results

@router.get("/recent")
def get_recent_results(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Convenience alias for listing recent results for the current tenant."""
    return list_results(current_user=current_user)

@router.get("/my-results")
def get_student_my_results(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Returns results for current student user."""
    return list_results(current_user=current_user)

@router.post("/manual-grade")
def submit_manual_grade(
    req: ManualGradeRequest,
    current_user: Dict[str, Any] = Depends(require_role(["college_admin", "super_admin"]))
):
    """Allows an administrator/instructor to adjust score or manually grade a submission."""
    submission = query_one(
        """
        SELECT sub.*, s.college_id, a.passing_percentage
        FROM submissions sub
        JOIN students s ON sub.student_id = s.id
        LEFT JOIN assessments a ON sub.assessment_id = a.id
        WHERE sub.id = ?
        """,
        (req.submission_id,)
    )
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
        
    verify_tenant_access(current_user, submission["college_id"])
    
    existing_result = query_one("SELECT * FROM results WHERE submission_id = ?", (req.submission_id,))
    max_score = existing_result["max_score"] if existing_result else 100.0
    percentage = round((req.score / max_score * 100.0) if max_score > 0 else 100.0, 1)
    pass_pct = submission.get("passing_percentage") or 60.0
    passed = 1 if (req.passed is True or (req.passed is None and percentage >= pass_pct)) else 0
    
    if existing_result:
        execute_query(
            """
            UPDATE results
            SET score = ?, percentage = ?, passed = ?, feedback = ?, graded_by = ?, evaluated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            """,
            (req.score, percentage, passed, req.feedback, current_user["id"], existing_result["id"])
        )
        result_id = existing_result["id"]
    else:
        result_id = execute_query(
            """
            INSERT INTO results (submission_id, student_id, assessment_id, score, max_score, percentage, passed, feedback, graded_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                req.submission_id,
                submission["student_id"],
                submission["assessment_id"],
                req.score,
                max_score,
                percentage,
                passed,
                req.feedback,
                current_user["id"]
            )
        )
        
    return {
        "result_id": result_id,
        "submission_id": req.submission_id,
        "score": req.score,
        "max_score": max_score,
        "percentage": percentage,
        "passed": bool(passed),
        "feedback": req.feedback,
        "message": "Grade recorded successfully"
    }