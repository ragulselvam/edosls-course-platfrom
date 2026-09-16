from fastapi import APIRouter, HTTPException, Depends, status, Query
from typing import List, Dict, Any, Optional
from app.models import StudentCreate, BulkStudentImport
from app.database import query_one, query_all, execute_query
from app.security import hash_password
from app.middleware import require_role, get_current_user, verify_tenant_access, log_audit

router = APIRouter(prefix="/api/students", tags=["Students"])

@router.get("")
def list_students(
    college_id: Optional[int] = None,
    course_id: Optional[int] = None,
    department: Optional[str] = None,
    search: Optional[str] = None,
    current_user: Dict[str, Any] = Depends(require_role(["super_admin", "college_admin"]))
):
    """Lists students with college-level tenant isolation and optional course filtering."""
    # If college admin, force their own college_id
    if current_user["role_name"] == "college_admin":
        target_college_id = current_user["college_id"]
    else:
        target_college_id = college_id

    sql = """
        SELECT s.id as student_id, s.roll_number, s.department, s.year_of_study, s.batch, s.created_at,
               u.id as user_id, u.email, u.first_name, u.last_name, u.phone, u.avatar_url, u.is_active,
               c.id as college_id, c.name as college_name, c.code as college_code,
               COUNT(DISTINCT e.id) as enrolled_courses_count,
               COUNT(DISTINCT cert.id) as certificates_count,
               AVG(e.progress_percentage) as average_progress
        FROM students s
        JOIN users u ON s.user_id = u.id
        JOIN colleges c ON s.college_id = c.id
        LEFT JOIN enrollments e ON s.id = e.student_id
        LEFT JOIN certificates cert ON s.id = cert.student_id
        WHERE 1=1
    """
    params = []
    
    if target_college_id:
        sql += " AND s.college_id = ?"
        params.append(target_college_id)
        
    if course_id:
        sql += " AND s.id IN (SELECT student_id FROM enrollments WHERE course_id = ?)"
        params.append(course_id)

    if department:
        sql += " AND s.department = ?"
        params.append(department)
        
    if search:
        sql += " AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ? OR s.roll_number LIKE ?)"
        term = f"%{search}%"
        params.extend([term, term, term, term])
        
    sql += " GROUP BY s.id ORDER BY s.created_at DESC"
    return query_all(sql, tuple(params))

@router.get("/{student_id}")
def get_student_profile(student_id: int, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Fetches full student profile including course enrollments and achievements."""
    student = query_one(
        """
        SELECT s.id as student_id, s.roll_number, s.department, s.year_of_study, s.batch, s.created_at,
               u.id as user_id, u.email, u.first_name, u.last_name, u.phone, u.avatar_url, u.is_active,
               c.id as college_id, c.name as college_name, c.code as college_code
        FROM students s
        JOIN users u ON s.user_id = u.id
        JOIN colleges c ON s.college_id = c.id
        WHERE s.id = ?
        """,
        (student_id,)
    )
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    # Check permissions
    if current_user["role_name"] == "student" and current_user.get("student_record_id") != student_id:
        raise HTTPException(status_code=403, detail="Unauthorized access to student profile")
    if current_user["role_name"] == "college_admin":
        verify_tenant_access(current_user, student["college_id"])

    # Fetch student enrollments
    enrollments = query_all(
        """
        SELECT e.*, c.title as course_title, c.code as course_code, c.thumbnail_url, c.duration,
               cert.id as certificate_id, cert.certificate_code
        FROM enrollments e
        JOIN courses c ON e.course_id = c.id
        LEFT JOIN certificates cert ON (e.student_id = cert.student_id AND e.course_id = cert.course_id)
        WHERE e.student_id = ?
        ORDER BY e.enrolled_at DESC
        """,
        (student_id,)
    )
    
    # Fetch student assessment results
    results = query_all(
        """
        SELECT r.*, a.title as assessment_title, q.title as quiz_id_title,
               c.title as course_title
        FROM results r
        JOIN submissions sub ON r.submission_id = sub.id
        LEFT JOIN assessments a ON r.assessment_id = a.id
        LEFT JOIN quizzes q ON r.quiz_id = q.id
        LEFT JOIN courses c ON (a.course_id = c.id OR q.course_id = c.id)
        WHERE r.student_id = ?
        ORDER BY r.evaluated_at DESC
        """,
        (student_id,)
    )

    return {
        "student": student,
        "enrollments": enrollments,
        "results": results
    }

@router.post("", status_code=status.HTTP_201_CREATED)
def create_student(
    req: StudentCreate,
    current_user: Dict[str, Any] = Depends(require_role(["super_admin", "college_admin"]))
):
    """Creates a new student account with college isolation."""
    # Resolve college
    target_college_id = req.college_id if current_user["role_name"] == "super_admin" else current_user["college_id"]
    if not target_college_id:
        raise HTTPException(status_code=400, detail="College ID is required")
        
    verify_tenant_access(current_user, target_college_id)
    
    # Check duplicate email
    existing_user = query_one("SELECT id FROM users WHERE LOWER(email) = LOWER(?)", (req.email.strip(),))
    if existing_user:
        raise HTTPException(status_code=400, detail=f"Email '{req.email}' is already registered")
        
    # Check duplicate roll number within this college
    existing_roll = query_one("SELECT id FROM students WHERE college_id = ? AND UPPER(roll_number) = UPPER(?)", (target_college_id, req.roll_number.strip()))
    if existing_roll:
        raise HTTPException(status_code=400, detail=f"Roll number '{req.roll_number}' already exists in this college")
        
    role = query_one("SELECT id FROM roles WHERE name = 'student'")
    pwd_hash = hash_password(req.password or "Student@123")
    
    user_id = execute_query(
        """
        INSERT INTO users (college_id, role_id, email, password_hash, first_name, last_name, phone, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1)
        """,
        (
            target_college_id,
            role["id"],
            req.email.strip().lower(),
            pwd_hash,
            req.first_name.strip(),
            req.last_name.strip(),
            req.phone
        )
    )
    
    student_id = execute_query(
        """
        INSERT INTO students (user_id, college_id, roll_number, department, year_of_study, batch)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (
            user_id,
            target_college_id,
            req.roll_number.strip().upper(),
            req.department.strip(),
            req.year_of_study,
            req.batch
        )
    )
    
    log_audit(
        college_id=target_college_id,
        user_id=current_user["id"],
        action="STUDENT_CREATE",
        resource_type="student",
        resource_id=str(student_id),
        details={"roll_number": req.roll_number, "email": req.email}
    )
    
    return {
        "student_id": student_id,
        "user_id": user_id,
        "roll_number": req.roll_number,
        "email": req.email,
        "college_id": target_college_id,
        "message": "Student created successfully"
    }

@router.post("/bulk-import", status_code=status.HTTP_201_CREATED)
def bulk_import_students(
    req: BulkStudentImport,
    current_user: Dict[str, Any] = Depends(require_role(["college_admin", "super_admin"]))
):
    """Bulk imports a batch of students from CSV or JSON data."""
    target_college_id = current_user.get("college_id")
    if not target_college_id and current_user["role_name"] != "super_admin":
        raise HTTPException(status_code=400, detail="Missing college assignment")
        
    role = query_one("SELECT id FROM roles WHERE name = 'student'")
    
    created_count = 0
    errors = []
    
    for idx, item in enumerate(req.students):
        try:
            # Check duplicate email
            exists_email = query_one("SELECT id FROM users WHERE LOWER(email) = LOWER(?)", (item.email.strip(),))
            if exists_email:
                errors.append(f"Row {idx+1}: Email '{item.email}' already exists.")
                continue
                
            exists_roll = query_one("SELECT id FROM students WHERE college_id = ? AND UPPER(roll_number) = UPPER(?)", (target_college_id, item.roll_number.strip()))
            if exists_roll:
                errors.append(f"Row {idx+1}: Roll number '{item.roll_number}' already registered in this college.")
                continue
                
            pwd_hash = hash_password(item.password or "Student@123")
            user_id = execute_query(
                """
                INSERT INTO users (college_id, role_id, email, password_hash, first_name, last_name, phone, is_active)
                VALUES (?, ?, ?, ?, ?, ?, ?, 1)
                """,
                (
                    target_college_id,
                    role["id"],
                    item.email.strip().lower(),
                    pwd_hash,
                    item.first_name.strip(),
                    item.last_name.strip(),
                    item.phone
                )
            )
            
            execute_query(
                """
                INSERT INTO students (user_id, college_id, roll_number, department, year_of_study, batch)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    user_id,
                    target_college_id,
                    item.roll_number.strip().upper(),
                    item.department.strip(),
                    item.year_of_study,
                    item.batch or "2024-2028"
                )
            )
            created_count += 1
        except Exception as e:
            errors.append(f"Row {idx+1}: {str(e)}")

    log_audit(
        college_id=target_college_id,
        user_id=current_user["id"],
        action="STUDENTS_BULK_IMPORT",
        resource_type="students",
        details={"total_rows": len(req.students), "created_count": created_count, "errors_count": len(errors)}
    )

    return {
        "message": f"Successfully imported {created_count} students.",
        "created_count": created_count,
        "failed_count": len(errors),
        "errors": errors
    }

@router.delete("/{student_id}")
def delete_student(student_id: int, current_user: Dict[str, Any] = Depends(require_role(["super_admin", "college_admin"]))):
    """Deletes a student record and user account."""
    student = query_one("SELECT id, user_id, college_id FROM students WHERE id = ?", (student_id,))
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    verify_tenant_access(current_user, student["college_id"])
    execute_query("DELETE FROM users WHERE id = ?", (student["user_id"],))
    
    log_audit(
        college_id=student["college_id"],
        user_id=current_user["id"],
        action="STUDENT_DELETE",
        resource_type="student",
        resource_id=str(student_id)
    )
    return {"message": "Student deleted successfully"}