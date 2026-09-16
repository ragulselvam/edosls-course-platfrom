import json
import subprocess
import sys
import tempfile
import os
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Dict, Any, Optional
from app.models import AssessmentCreate, AssessmentSubmission, ManualGradeRequest
from app.database import query_one, query_all, execute_query
from app.middleware import get_current_user, require_role, verify_tenant_access, log_audit

router = APIRouter(prefix="/api/assessments", tags=["Assessments & Exams"])

@router.get("")
def list_assessments(
    course_id: Optional[int] = None,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Lists assessments for the current college / course."""
    role = current_user.get("role_name")
    user_college_id = current_user.get("college_id")
    
    sql = """
        SELECT a.*, c.title as course_title, c.code as course_code,
               COUNT(q.id) as question_count,
               COALESCE(SUM(q.points), 0) as total_points
        FROM assessments a
        JOIN courses c ON a.course_id = c.id
        LEFT JOIN questions q ON a.id = q.assessment_id
        WHERE 1=1
    """
    params = []
    
    if role != "super_admin":
        sql += " AND a.college_id = ?"
        params.append(user_college_id)
        
    if course_id:
        sql += " AND a.course_id = ?"
        params.append(course_id)
        
    sql += " GROUP BY a.id ORDER BY a.created_at DESC"
    assessments = query_all(sql, tuple(params))
    
    # If student, attach latest attempt and result status
    if role == "student":
        student_id = current_user.get("student_record_id")
        for assess in assessments:
            last_sub = query_one(
                """
                SELECT s.id as submission_id, s.attempt_number, s.submitted_at, s.status,
                       r.score, r.max_score, r.percentage, r.passed, r.feedback
                FROM submissions s
                LEFT JOIN results r ON s.id = r.submission_id
                WHERE s.assessment_id = ? AND s.student_id = ?
                ORDER BY s.attempt_number DESC LIMIT 1
                """,
                (assess["id"], student_id)
            )
            assess["last_submission"] = last_sub
            assess["has_attempted"] = bool(last_sub)
            assess["status"] = "Passed" if (last_sub and last_sub.get("passed") == 1) else ("Failed" if last_sub else "Not Started")
            
    return assessments

@router.get("/{assessment_id}")
def get_assessment(assessment_id: int, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Fetches assessment details and questions."""
    assessment = query_one(
        """
        SELECT a.*, c.title as course_title, c.code as course_code
        FROM assessments a
        JOIN courses c ON a.course_id = c.id
        WHERE a.id = ?
        """,
        (assessment_id,)
    )
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
        
    verify_tenant_access(current_user, assessment["college_id"])
    
    raw_questions = query_all(
        "SELECT * FROM questions WHERE assessment_id = ? ORDER BY sort_order ASC, id ASC",
        (assessment_id,)
    )
    
    is_student = (current_user["role_name"] == "student")
    
    questions = []
    for q in raw_questions:
        q_dict = dict(q)
        q_dict["options"] = json.loads(q["options_json"]) if q.get("options_json") else []
        q_dict["test_cases"] = json.loads(q["test_cases_json"]) if q.get("test_cases_json") else []
        
        if is_student:
            # Hide correct answers and hidden test case expectations from students during test
            q_dict.pop("correct_answer_json", None)
            if q_dict.get("test_cases"):
                # Filter out hidden test cases or hide expected outputs for hidden tests
                q_dict["test_cases"] = [
                    tc for tc in q_dict["test_cases"] if not tc.get("is_hidden")
                ]
        else:
            q_dict["correct_answers"] = json.loads(q["correct_answer_json"]) if q.get("correct_answer_json") else []
            
        questions.append(q_dict)
        
    assessment["questions"] = questions
    return assessment

@router.post("", status_code=status.HTTP_201_CREATED)
def create_assessment(
    req: AssessmentCreate,
    current_user: Dict[str, Any] = Depends(require_role(["college_admin", "super_admin"]))
):
    """Creates a new assessment with full question bank."""
    course = query_one("SELECT id, college_id, title FROM courses WHERE id = ?", (req.course_id,))
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
        
    verify_tenant_access(current_user, course["college_id"])
    
    assessment_id = execute_query(
        """
        INSERT INTO assessments (
            college_id, course_id, title, description, assessment_type,
            time_limit_minutes, passing_percentage, max_attempts, is_published
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            course["college_id"],
            req.course_id,
            req.title.strip(),
            req.description,
            req.assessment_type,
            req.time_limit_minutes,
            req.passing_percentage,
            1 if req.is_published else 0,
            req.max_attempts
        )
    )
    
    # Insert questions
    for idx, q in enumerate(req.questions):
        options_str = json.dumps(q.options) if q.options else None
        answers_str = json.dumps(q.correct_answers) if q.correct_answers else None
        test_cases_str = json.dumps(q.test_cases) if q.test_cases else None
        
        execute_query(
            """
            INSERT INTO questions (
                assessment_id, question_text, question_type, options_json,
                correct_answer_json, code_template, test_cases_json, points, sort_order
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                assessment_id,
                q.question_text.strip(),
                q.question_type,
                options_str,
                answers_str,
                q.code_template,
                test_cases_str,
                q.points,
                q.sort_order if q.sort_order > 0 else idx
            )
        )
        
    # Notify students in college
    execute_query(
        """
        INSERT INTO notifications (college_id, user_id, title, message, type, link_url)
        VALUES (?, NULL, ?, ?, 'assessment', ?)
        """,
        (
            course["college_id"],
            f"New Assessment: {req.title}",
            f"Assessment '{req.title}' is now available for {course['title']}. Duration: {req.time_limit_minutes} mins.",
            f"/assessments/{assessment_id}"
        )
    )
    
    return query_one("SELECT * FROM assessments WHERE id = ?", (assessment_id,))

@router.post("/submit", status_code=status.HTTP_201_CREATED)
def submit_assessment(
    req: AssessmentSubmission,
    current_user: Dict[str, Any] = Depends(require_role(["student"]))
):
    """
    Submits student assessment answers, performs automatic evaluation on MCQ, Multi-Select,
    and Coding test cases, records the attempt, and returns instant results and feedback.
    """
    student_id = current_user.get("student_record_id")
    college_id = current_user.get("college_id")
    
    assessment = query_one(
        """
        SELECT a.*, c.title as course_title
        FROM assessments a
        JOIN courses c ON a.course_id = c.id
        WHERE a.id = ?
        """,
        (req.assessment_id,)
    )
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
        
    if int(assessment["college_id"]) != int(college_id):
        raise HTTPException(status_code=403, detail="Cross-tenant assessment attempt forbidden")
        
    # Check previous attempts count
    prev_attempts = query_all(
        "SELECT id FROM submissions WHERE assessment_id = ? AND student_id = ?",
        (req.assessment_id, student_id)
    )
    attempt_num = len(prev_attempts) + 1
    if attempt_num > assessment["max_attempts"]:
        raise HTTPException(
            status_code=400,
            detail=f"Maximum attempts limit reached ({assessment['max_attempts']} attempts allowed)."
        )
        
    # Fetch questions with correct answers
    questions = query_all(
        "SELECT * FROM questions WHERE assessment_id = ?",
        (req.assessment_id,)
    )
    
    total_earned = 0.0
    total_max = 0.0
    feedback_items = []
    
    for q in questions:
        q_id = str(q["id"])
        q_type = q["question_type"]
        points = float(q["points"])
        total_max += points
        
        student_ans = req.answers.get(q_id)
        earned = 0.0
        
        if q_type == "mcq":
            correct_list = json.loads(q["correct_answer_json"]) if q["correct_answer_json"] else []
            # Single select comparison
            if student_ans is not None:
                if str(student_ans) in [str(c) for c in correct_list]:
                    earned = points
                    feedback_items.append({"question_id": q["id"], "status": "correct", "points": earned, "max": points})
                else:
                    feedback_items.append({"question_id": q["id"], "status": "incorrect", "points": 0, "max": points})
            else:
                feedback_items.append({"question_id": q["id"], "status": "skipped", "points": 0, "max": points})
                
        elif q_type == "multi_select":
            correct_list = [str(c) for c in (json.loads(q["correct_answer_json"]) if q["correct_answer_json"] else [])]
            if isinstance(student_ans, list):
                student_set = set(str(s) for s in student_ans)
                correct_set = set(correct_list)
                if student_set == correct_set:
                    earned = points
                    feedback_items.append({"question_id": q["id"], "status": "correct", "points": earned, "max": points})
                else:
                    feedback_items.append({"question_id": q["id"], "status": "partial/incorrect", "points": 0, "max": points})
            else:
                feedback_items.append({"question_id": q["id"], "status": "incorrect", "points": 0, "max": points})
                
        elif q_type == "coding":
            # Execute test cases
            code_text = str(student_ans) if student_ans else (req.code_submission or "")
            test_cases = json.loads(q["test_cases_json"]) if q["test_cases_json"] else []
            
            if test_cases and code_text:
                passed_tests = 0
                for tc in test_cases:
                    t_input = str(tc.get("input", ""))
                    t_expected = str(tc.get("expected_output", "")).strip()
                    
                    with tempfile.NamedTemporaryFile(suffix=".py", mode="w", delete=False) as tmp:
                        tmp.write(code_text)
                        tmp_name = tmp.name
                    try:
                        proc = subprocess.run(
                            [sys.executable, tmp_name],
                            input=t_input,
                            text=True,
                            capture_output=True,
                            timeout=3
                        )
                        if proc.returncode == 0 and proc.stdout.strip() == t_expected:
                            passed_tests += 1
                    except Exception:
                        pass
                    finally:
                        if os.path.exists(tmp_name):
                            try:
                                os.remove(tmp_name)
                            except Exception:
                                pass
                                
                ratio = passed_tests / len(test_cases) if len(test_cases) > 0 else 0
                earned = round(ratio * points, 1)
                feedback_items.append({
                    "question_id": q["id"],
                    "status": "passed" if ratio == 1.0 else f"passed {passed_tests}/{len(test_cases)} tests",
                    "points": earned,
                    "max": points
                })
            else:
                feedback_items.append({"question_id": q["id"], "status": "unanswered", "points": 0, "max": points})
                
        elif q_type in ("file_upload", "practical"):
            # Requires instructor review or default provisional points
            earned = points # provisional pending review
            feedback_items.append({"question_id": q["id"], "status": "submitted_for_review", "points": earned, "max": points})
            
        total_earned += earned
        
    percentage = round((total_earned / total_max * 100.0) if total_max > 0 else 100.0, 1)
    passed = 1 if percentage >= float(assessment["passing_percentage"]) else 0
    
    # Store submission
    sub_id = execute_query(
        """
        INSERT INTO submissions (
            college_id, student_id, assessment_id, attempt_number,
            answers_json, code_submission, file_urls_json, status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, 'evaluated')
        """,
        (
            college_id,
            student_id,
            req.assessment_id,
            attempt_num,
            json.dumps(req.answers),
            req.code_submission,
            json.dumps(req.file_urls) if req.file_urls else None
        )
    )
    
    # Store Result
    result_id = execute_query(
        """
        INSERT INTO results (
            submission_id, student_id, assessment_id, score, max_score,
            percentage, passed, feedback
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            sub_id,
            student_id,
            req.assessment_id,
            total_earned,
            total_max,
            percentage,
            passed,
            json.dumps(feedback_items)
        )
    )
    
    # Send Notification to Student
    verdict = "PASSED" if passed == 1 else "FAILED"
    execute_query(
        """
        INSERT INTO notifications (college_id, user_id, title, message, type, link_url)
        VALUES (?, ?, ?, ?, 'assessment', ?)
        """,
        (
            college_id,
            current_user["id"],
            f"Assessment Result: {assessment['title']} ({verdict})",
            f"You scored {total_earned}/{total_max} ({percentage}%). Status: {verdict}.",
            f"/results"
        )
    )
    
    return {
        "result_id": result_id,
        "submission_id": sub_id,
        "assessment_id": req.assessment_id,
        "attempt_number": attempt_num,
        "score": total_earned,
        "max_score": total_max,
        "percentage": percentage,
        "passed": bool(passed),
        "passing_percentage": assessment["passing_percentage"],
        "feedback_items": feedback_items
    }