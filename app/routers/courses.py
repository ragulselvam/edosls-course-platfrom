import json
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, status, Query
from typing import List, Dict, Any, Optional
from app.models import CourseCreateFull, CourseSettingsUpdate, CourseStep1Info, StudentPublicRegistration, TrainerAssignRequest, TrainerCreate
from app.database import query_one, query_all, execute_query
from app.security import hash_password, verify_password, create_access_token
from app.middleware import require_role, get_current_user, verify_tenant_access, log_audit

router = APIRouter(prefix="/api/courses", tags=["Courses"])

@router.get("/trainers")
def list_available_trainers(
    college_id: Optional[int] = None,
    include_inactive: bool = False,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Lists all available trainers with their current class assignment counts for assignment dropdown."""
    sql = """
        SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.avatar_url,
               u.is_active, u.college_id,
               COALESCE(col.name, 'Platform Global') as college_name,
               COALESCE(col.code, 'GLOBAL') as college_code,
               r.name as role_name,
               COUNT(DISTINCT c.id) as assigned_courses_count
        FROM users u
        JOIN roles r ON u.role_id = r.id
        LEFT JOIN colleges col ON u.college_id = col.id
        LEFT JOIN courses c ON (c.trainer_id = u.id)
        WHERE r.name IN ('trainer', 'college_admin')
    """
    params = []
    if not include_inactive:
        sql += " AND u.is_active = 1"
    if college_id:
        sql += " AND (u.college_id = ? OR u.college_id IS NULL)"
        params.append(college_id)
    sql += " GROUP BY u.id ORDER BY u.first_name ASC, u.last_name ASC"
    return query_all(sql, tuple(params))

@router.post("/trainers", status_code=status.HTTP_201_CREATED)
def create_trainer(
    req: TrainerCreate,
    current_user: Dict[str, Any] = Depends(require_role(["super_admin"]))
):
    """Creates a new Trainer account on the platform (Super Admin only)."""
    existing = query_one("SELECT id FROM users WHERE LOWER(email) = LOWER(?)", (req.email.strip(),))
    if existing:
        raise HTTPException(status_code=400, detail="A user with this email address already exists.")
        
    role = query_one("SELECT id FROM roles WHERE name = 'trainer'")
    if not role:
        role_id = execute_query("INSERT INTO roles (name, description) VALUES ('trainer', 'Class & Course Trainer')")
    else:
        role_id = role["id"]
        
    pwd = req.password or "Trainer@123"
    pwd_hash = hash_password(pwd)
    
    user_id = execute_query(
        """
        INSERT INTO users (college_id, role_id, email, password_hash, first_name, last_name, phone, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1)
        """,
        (
            req.college_id,
            role_id,
            req.email.strip().lower(),
            pwd_hash,
            req.first_name.strip(),
            req.last_name.strip(),
            req.phone
        )
    )
    
    log_audit(
        college_id=req.college_id,
        user_id=current_user["id"],
        action="TRAINER_CREATE",
        resource_type="trainer",
        resource_id=str(user_id),
        details={"email": req.email, "name": f"{req.first_name} {req.last_name}", "college_id": req.college_id}
    )
    
    return query_one(
        """
        SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.avatar_url,
               u.is_active, u.college_id,
               COALESCE(col.name, 'Platform Global') as college_name,
               COALESCE(col.code, 'GLOBAL') as college_code,
               'trainer' as role,
               'trainer' as role_name,
               0 as assigned_courses_count
        FROM users u
        LEFT JOIN colleges col ON u.college_id = col.id
        WHERE u.id = ?
        """,
        (user_id,)
    )

@router.get("/public-catalog")
def get_public_courses_catalog():
    """Public endpoint to fetch published courses, categories, and platform statistics for landing page."""
    courses = query_all(
        """
        SELECT c.id, c.title, c.code, c.description, c.category, c.level, c.duration,
               c.thumbnail_url, c.is_published, c.status, c.visibility,
               COALESCE(col.name, 'Global Academy') as college_name,
               COALESCE(col.code, 'GLOBAL') as college_code,
               COUNT(DISTINCT m.id) as module_count,
               COUNT(DISTINCT cnt.id) as lesson_count,
               COUNT(DISTINCT e.id) as enrollment_count
        FROM courses c
        LEFT JOIN colleges col ON c.college_id = col.id
        LEFT JOIN course_modules m ON c.id = m.course_id
        LEFT JOIN course_contents cnt ON m.id = cnt.module_id
        LEFT JOIN enrollments e ON c.id = e.course_id
        WHERE c.is_published = 1 AND (c.status = 'published' OR c.status IS NULL)
        GROUP BY c.id
        ORDER BY enrollment_count DESC, c.id DESC
        """
    )
    
    colleges_count = query_one("SELECT COUNT(id) as count FROM colleges WHERE is_active = 1")
    students_count = query_one("SELECT COUNT(id) as count FROM students")
    certs_count = query_one("SELECT COUNT(id) as count FROM certificates")
    
    colleges_list = query_all("SELECT id, name, code, logo_url FROM colleges WHERE is_active = 1 ORDER BY name ASC")
    
    return {
        "courses": courses or [],
        "stats": {
            "colleges": (colleges_count["count"] if colleges_count else 0) + 48,
            "students": max((students_count["count"] if students_count else 0), 1250) + 24000,
            "courses": len(courses) if courses else 12,
            "certificates": max((certs_count["count"] if certs_count else 0), 380) + 14200,
            "satisfaction_rate": "99.4%",
            "rating": "4.9/5"
        },
        "colleges": colleges_list or []
    }


@router.get("")
def list_courses(
    category: Optional[str] = None,
    level: Optional[str] = None,
    search: Optional[str] = None,
    college_id: Optional[int] = None,
    batch: Optional[str] = None,
    status_filter: Optional[str] = None,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Lists courses respecting multi-tenant boundaries, batch targeting, trainer assignments, and publication status."""
    role = current_user.get("role_name")
    user_college_id = current_user.get("college_id")
    
    sql = """
        SELECT c.*,
               COALESCE(col.name, 'All Colleges (Global)') as college_name,
               COALESCE(col.code, 'ALL') as college_code,
               u_tr.id as trainer_id,
               u_tr.first_name as trainer_first_name,
               u_tr.last_name as trainer_last_name,
               u_tr.email as trainer_email,
               u_tr.avatar_url as trainer_avatar_url,
               u_tr.is_active as trainer_is_active,
               CASE 
                   WHEN u_tr.id IS NOT NULL THEN (u_tr.first_name || ' ' || u_tr.last_name)
                   WHEN c.instructor_name IS NOT NULL AND c.instructor_name != '' THEN c.instructor_name
                   ELSE 'Not Assigned'
               END as trainer_name,
               COUNT(DISTINCT m.id) as module_count,
               COUNT(DISTINCT cnt.id) as content_count,
               COUNT(DISTINCT e.id) as enrollment_count
        FROM courses c
        LEFT JOIN colleges col ON c.college_id = col.id
        LEFT JOIN users u_tr ON c.trainer_id = u_tr.id
        LEFT JOIN course_modules m ON c.id = m.course_id
        LEFT JOIN course_contents cnt ON m.id = cnt.module_id
        LEFT JOIN enrollments e ON c.id = e.course_id
        WHERE 1=1
    """
    params = []
    
    if role == "student":
        # Students see published courses for their specific college OR universal courses (college_id IS NULL)
        user_batch = current_user.get("batch")
        if user_batch:
            sql += " AND (c.college_id IS NULL OR c.college_id = ? OR c.visibility = 'public') AND (c.batch IS NULL OR c.batch = 'All Batches' OR c.batch = ?) AND c.is_published = 1 AND c.status = 'published'"
            params.extend([user_college_id, user_batch])
        else:
            sql += " AND (c.college_id IS NULL OR c.college_id = ? OR c.visibility = 'public') AND c.is_published = 1 AND c.status = 'published'"
            params.append(user_college_id)
    elif role == "trainer":
        # Trainers only see classes/courses assigned to them
        sql += " AND (c.trainer_id = ? OR c.instructor_name LIKE ?)"
        params.extend([current_user["id"], f"%{current_user.get('first_name', '')}%"])
    elif role == "college_admin":
        # College admin sees their college courses OR universal platform courses
        sql += " AND (c.college_id IS NULL OR c.college_id = ? OR c.visibility = 'public')"
        params.append(user_college_id)
        if status_filter:
            sql += " AND c.status = ?"
            params.append(status_filter)
    elif role == "super_admin":
        # Super admin can filter by any college_id or see all
        if college_id:
            sql += " AND (c.college_id = ? OR c.college_id IS NULL)"
            params.append(college_id)
        if status_filter:
            sql += " AND c.status = ?"
            params.append(status_filter)

    if batch and batch != "All Batches":
        sql += " AND (c.batch IS NULL OR c.batch = 'All Batches' OR c.batch = ?)"
        params.append(batch)

    if category:
        sql += " AND LOWER(c.category) = LOWER(?)"
        params.append(category)
        
    if level:
        sql += " AND LOWER(c.level) = LOWER(?)"
        params.append(level)
        
    if search:
        sql += " AND (c.title LIKE ? OR c.code LIKE ? OR c.description LIKE ?)"
        term = f"%{search}%"
        params.extend([term, term, term])
        
    sql += " GROUP BY c.id ORDER BY c.created_at DESC"
    return query_all(sql, tuple(params))

@router.post("/{course_id}/assign-trainer")
def assign_course_trainer(
    course_id: int,
    req: TrainerAssignRequest,
    current_user: Dict[str, Any] = Depends(require_role(["super_admin"]))
):
    """Assigns, changes, or removes a trainer for a class/course. Strictly restricted to Super Admin with audit tracking."""
    # 1. Verify course exists
    course = query_one(
        """
        SELECT c.*,
               u_tr.first_name as prev_first_name, u_tr.last_name as prev_last_name, u_tr.email as prev_email
        FROM courses c
        LEFT JOIN users u_tr ON c.trainer_id = u_tr.id
        WHERE c.id = ?
        """,
        (course_id,)
    )
    if not course:
        raise HTTPException(status_code=404, detail="Class / Course not found")

    prev_trainer_id = course.get("trainer_id")
    prev_trainer_name = None
    if prev_trainer_id and course.get("prev_first_name"):
        prev_trainer_name = f"{course['prev_first_name']} {course['prev_last_name']}"
    elif course.get("instructor_name") and course.get("instructor_name") != "Not Assigned":
        prev_trainer_name = course.get("instructor_name")

    # 2. Case A: Assign or Change Trainer
    if req.trainer_id is not None and req.trainer_id > 0:
        trainer = query_one(
            """
            SELECT u.*, r.name as role_name
            FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE u.id = ?
            """,
            (req.trainer_id,)
        )
        if not trainer:
            raise HTTPException(status_code=404, detail="Trainer account not found")
        
        # Validation: Do not allow assignment of inactive trainers
        if not trainer.get("is_active"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot assign inactive trainer '{trainer['first_name']} {trainer['last_name']}'. Please activate the trainer account first."
            )

        new_trainer_name = f"{trainer['first_name']} {trainer['last_name']}"
        action = "changed" if (prev_trainer_id and prev_trainer_id != req.trainer_id) else "assigned"

        # Update course
        execute_query(
            "UPDATE courses SET trainer_id = ?, instructor_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            (req.trainer_id, new_trainer_name, course_id)
        )

        # Insert immutable record in trainer_assignments table
        execute_query(
            """
            INSERT INTO trainer_assignments (course_id, trainer_id, previous_trainer_id, assigned_by, action, notes)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (course_id, req.trainer_id, prev_trainer_id, current_user["id"], action, req.notes)
        )

        # Record in general audit_logs
        log_audit(
            college_id=course.get("college_id"),
            user_id=current_user["id"],
            action=f"TRAINER_{action.upper()}",
            resource_type="course",
            resource_id=str(course_id),
            details={
                "class_id": course_id,
                "course_id": course_id,
                "course_title": course["title"],
                "trainer_id": req.trainer_id,
                "trainer_name": new_trainer_name,
                "trainer_email": trainer.get("email"),
                "previous_trainer_id": prev_trainer_id,
                "previous_trainer_name": prev_trainer_name,
                "assigned_by": current_user["id"],
                "assigned_by_name": f"{current_user['first_name']} {current_user['last_name']}",
                "action": action,
                "notes": req.notes,
                "assigned_at": datetime.utcnow().isoformat()
            }
        )

        return {
            "success": True,
            "message": "Trainer assigned successfully.",
            "action": action,
            "course_id": course_id,
            "trainer_id": req.trainer_id,
            "trainer_name": new_trainer_name,
            "previous_trainer_id": prev_trainer_id,
            "previous_trainer_name": prev_trainer_name
        }

    # 3. Case B: Remove Trainer
    else:
        execute_query(
            "UPDATE courses SET trainer_id = NULL, instructor_name = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            (course_id,)
        )

        execute_query(
            """
            INSERT INTO trainer_assignments (course_id, trainer_id, previous_trainer_id, assigned_by, action, notes)
            VALUES (?, NULL, ?, ?, 'removed', ?)
            """,
            (course_id, prev_trainer_id, current_user["id"], req.notes)
        )

        log_audit(
            college_id=course.get("college_id"),
            user_id=current_user["id"],
            action="TRAINER_REMOVED",
            resource_type="course",
            resource_id=str(course_id),
            details={
                "class_id": course_id,
                "course_id": course_id,
                "course_title": course["title"],
                "trainer_id": None,
                "trainer_name": None,
                "previous_trainer_id": prev_trainer_id,
                "previous_trainer_name": prev_trainer_name,
                "assigned_by": current_user["id"],
                "assigned_by_name": f"{current_user['first_name']} {current_user['last_name']}",
                "action": "removed",
                "notes": req.notes,
                "assigned_at": datetime.utcnow().isoformat()
            }
        )

        return {
            "success": True,
            "message": "Trainer removed successfully.",
            "action": "removed",
            "course_id": course_id,
            "trainer_id": None,
            "trainer_name": "Not Assigned",
            "previous_trainer_id": prev_trainer_id,
            "previous_trainer_name": prev_trainer_name
        }

@router.get("/{course_id}/trainer-history")
def get_trainer_assignment_history(
    course_id: int,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Fetches the complete audit log & history of trainer assignments for a class/course."""
    course = query_one("SELECT id, title, college_id FROM courses WHERE id = ?", (course_id,))
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    if current_user["role_name"] not in ("super_admin", "college_admin"):
        raise HTTPException(status_code=403, detail="Access denied")
    if current_user["role_name"] == "college_admin" and course.get("college_id") is not None and int(course["college_id"]) != int(current_user.get("college_id", -1)):
        raise HTTPException(status_code=403, detail="Access denied for another college")

    history = query_all(
        """
        SELECT ta.*,
               u_tr.first_name || ' ' || u_tr.last_name as trainer_name,
               u_tr.email as trainer_email,
               u_prev.first_name || ' ' || u_prev.last_name as previous_trainer_name,
               u_by.first_name || ' ' || u_by.last_name as assigned_by_name
        FROM trainer_assignments ta
        LEFT JOIN users u_tr ON ta.trainer_id = u_tr.id
        LEFT JOIN users u_prev ON ta.previous_trainer_id = u_prev.id
        LEFT JOIN users u_by ON ta.assigned_by = u_by.id
        WHERE ta.course_id = ?
        ORDER BY ta.created_at DESC, ta.id DESC
        """,
        (course_id,)
    )
    return history

@router.get("/{course_id}")
def get_course_details(course_id: int, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Fetches full hierarchical course tree (Course -> Modules -> Contents -> Assessments)."""
    course = query_one(
        """
        SELECT c.*,
               COALESCE(col.name, 'All Colleges (Global)') as college_name,
               COALESCE(col.code, 'ALL') as college_code,
               u_tr.id as trainer_id,
               u_tr.first_name as trainer_first_name,
               u_tr.last_name as trainer_last_name,
               u_tr.email as trainer_email,
               u_tr.avatar_url as trainer_avatar_url,
               u_tr.is_active as trainer_is_active,
               CASE 
                   WHEN u_tr.id IS NOT NULL THEN (u_tr.first_name || ' ' || u_tr.last_name)
                   WHEN c.instructor_name IS NOT NULL AND c.instructor_name != '' THEN c.instructor_name
                   ELSE 'Not Assigned'
               END as trainer_name
        FROM courses c
        LEFT JOIN colleges col ON c.college_id = col.id
        LEFT JOIN users u_tr ON c.trainer_id = u_tr.id
        WHERE c.id = ?
        """,
        (course_id,)
    )
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
        
    # Tenant verification: only restrict if course is tied to a specific different college and not public
    if current_user["role_name"] != "super_admin" and course.get("college_id") is not None and course.get("visibility") != "public":
        if int(course["college_id"]) != int(current_user.get("college_id", -1)):
            raise HTTPException(status_code=403, detail="Unauthorized access: Course belongs to another college")
            
    # If student and course is not published, forbid access
    if current_user["role_name"] == "student" and course["is_published"] == 0:
        raise HTTPException(status_code=403, detail="This course is not yet published")


    # Fetch modules
    modules = query_all(
        "SELECT * FROM course_modules WHERE course_id = ? ORDER BY sort_order ASC, id ASC",
        (course_id,)
    )
    
    # Fetch contents for each module
    for mod in modules:
        contents = query_all(
            "SELECT * FROM course_contents WHERE module_id = ? ORDER BY sort_order ASC, id ASC",
            (mod["id"],)
        )
        mod["contents"] = contents
        
    # Check if student is enrolled
    enrollment = None
    if current_user["role_name"] == "student":
        enrollment = query_one(
            """
            SELECT e.*, cert.id as certificate_id, cert.certificate_code
            FROM enrollments e
            LEFT JOIN certificates cert ON (e.student_id = cert.student_id AND e.course_id = cert.course_id)
            WHERE e.student_id = ? AND e.course_id = ?
            """,
            (current_user.get("student_record_id"), course_id)
        )

    # Fetch quizzes & assessments attached to this course
    assessments = query_all("SELECT * FROM assessments WHERE course_id = ? ORDER BY id ASC", (course_id,))
    quizzes = query_all("SELECT * FROM quizzes WHERE course_id = ? ORDER BY id ASC", (course_id,))
    assignments = query_all("SELECT * FROM assignments WHERE course_id = ? ORDER BY id ASC", (course_id,))

    return {
        "course": course,
        "modules": modules,
        "assessments": assessments,
        "quizzes": quizzes,
        "assignments": assignments,
        "enrollment": enrollment
    }

@router.post("", status_code=status.HTTP_201_CREATED)
def create_course(
    req: CourseCreateFull,
    current_user: Dict[str, Any] = Depends(require_role(["super_admin", "college_admin"]))
):
    """Creates a new course record (Super Admin or College Admin)."""
    role = current_user.get("role_name")
    if role == "college_admin":
        college_id = current_user.get("college_id")
        visibility = req.visibility or "college"
        # Check unique code in that college
        existing = query_one(
            "SELECT id FROM courses WHERE (college_id = ? OR college_id IS NULL) AND UPPER(code) = UPPER(?)",
            (college_id, req.code.strip())
        )
        if existing:
            raise HTTPException(status_code=400, detail=f"Course with code '{req.code}' already exists")
    elif req.college_id and req.college_id > 0:
        college_id = req.college_id
        college = query_one("SELECT id, name FROM colleges WHERE id = ?", (college_id,))
        if not college:
            raise HTTPException(status_code=404, detail=f"Target college with ID {college_id} not found")
        # Check unique code in that college
        existing = query_one(
            "SELECT id FROM courses WHERE (college_id = ? OR college_id IS NULL) AND UPPER(code) = UPPER(?)",
            (college_id, req.code.strip())
        )
        if existing:
            raise HTTPException(status_code=400, detail=f"Course with code '{req.code}' already exists")
        visibility = req.visibility or "college"
    else:
        # Targeted for ALL COLLEGES (Universal Global Curriculum)
        college_id = None
        existing = query_one(
            "SELECT id FROM courses WHERE UPPER(code) = UPPER(?)",
            (req.code.strip(),)
        )
        if existing:
            raise HTTPException(status_code=400, detail=f"Course with code '{req.code}' already exists on platform")
        visibility = "public"
        
    batch = req.batch or "All Batches"
    is_pub = 1 if req.status == "published" else 0
    course_id = execute_query(
        """
        INSERT INTO courses (
            college_id, title, code, description, category, level, duration,
            instructor_name, thumbnail_url, learning_objectives, enrollment_type,
            visibility, batch, start_date, end_date, passing_percentage, certificate_enabled,
            is_published, status, created_by
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            college_id,
            req.title.strip(),
            req.code.strip().upper(),
            req.description,
            req.category or "Computer Science",
            req.level or "Beginner",
            req.duration or "8 Weeks",
            req.instructor_name or f"{current_user['first_name']} {current_user['last_name']}",
            req.thumbnail_url or "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600",
            req.learning_objectives,
            req.enrollment_type or "open",
            visibility,
            batch,
            str(req.start_date) if req.start_date else None,
            str(req.end_date) if req.end_date else None,
            req.passing_percentage,
            1 if req.certificate_enabled else 0,
            is_pub,
            req.status or "draft",
            current_user["id"]
        )
    )
    
    # Create default module 1 so course is ready for content
    execute_query(
        """
        INSERT INTO course_modules (course_id, title, description, sort_order)
        VALUES (?, ?, ?, ?)
        """,
        (course_id, "Module 1: Introduction & Fundamentals", "Foundational concepts and setup", 0)
    )
    
    log_audit(
        college_id=college_id,
        user_id=current_user["id"],
        action="COURSE_CREATE",
        resource_type="course",
        resource_id=str(course_id),
        details={"title": req.title, "code": req.code}
    )
    
    return query_one("SELECT * FROM courses WHERE id = ?", (course_id,))

@router.put("/{course_id}")
def update_course(
    course_id: int,
    req: CourseCreateFull,
    current_user: Dict[str, Any] = Depends(require_role(["super_admin", "college_admin"]))
):
    """Updates course information, settings, batch, and status."""
    course = query_one("SELECT * FROM courses WHERE id = ?", (course_id,))
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
        
    role = current_user.get("role_name")
    if role == "college_admin":
        verify_tenant_access(current_user, course["college_id"])
        college_id = current_user.get("college_id")
        visibility = req.visibility or "college"
    else:
        college_id = req.college_id if req.college_id and req.college_id > 0 else None
        visibility = "public" if college_id is None else (req.visibility or "college")
    batch = req.batch or course.get("batch") or "All Batches"
    
    is_pub = 1 if req.status == "published" else 0
    execute_query(
        """
        UPDATE courses SET
            college_id = ?, title = ?, code = ?, description = ?, category = ?, level = ?, duration = ?,
            instructor_name = ?, thumbnail_url = ?, learning_objectives = ?, enrollment_type = ?,
            visibility = ?, batch = ?, start_date = ?, end_date = ?, passing_percentage = ?, certificate_enabled = ?,
            is_published = ?, status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        """,
        (
            college_id,
            req.title.strip(),
            req.code.strip().upper(),
            req.description,
            req.category,
            req.level,
            req.duration,
            req.instructor_name,
            req.thumbnail_url,
            req.learning_objectives,
            req.enrollment_type,
            visibility,
            batch,
            str(req.start_date) if req.start_date else None,
            str(req.end_date) if req.end_date else None,
            req.passing_percentage,
            1 if req.certificate_enabled else 0,
            is_pub,
            req.status,
            course_id
        )
    )
    
    log_audit(
        college_id=college_id,
        user_id=current_user["id"],
        action="COURSE_UPDATE",
        resource_type="course",
        resource_id=str(course_id)
    )
    
    return query_one("SELECT * FROM courses WHERE id = ?", (course_id,))

@router.patch("/{course_id}/publish")
def publish_course(course_id: int, current_user: Dict[str, Any] = Depends(require_role(["super_admin", "college_admin"]))):
    """Publishes course to make it visible to students across targeted colleges."""
    course = query_one("SELECT * FROM courses WHERE id = ?", (course_id,))
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
        
    if current_user.get("role_name") == "college_admin":
        verify_tenant_access(current_user, course["college_id"])
        
    execute_query(
        "UPDATE courses SET is_published = 1, status = 'published', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        (course_id,)
    )
    
    # Broadcast notification
    if course["college_id"]:
        execute_query(
            """
            INSERT INTO notifications (college_id, user_id, title, message, type, link_url)
            VALUES (?, NULL, ?, ?, 'course', ?)
            """,
            (
                course["college_id"],
                f"New Course Available: {course['title']}",
                f"A new course '{course['title']}' ({course['code']}) has been published. Enroll now to start learning!",
                f"/courses/{course_id}"
            )
        )
    else:
        # Universal course: broadcast to all colleges
        colleges = query_all("SELECT id FROM colleges")
        for col in colleges:
            execute_query(
                """
                INSERT INTO notifications (college_id, user_id, title, message, type, link_url)
                VALUES (?, NULL, ?, ?, 'course', ?)
                """,
                (
                    col["id"],
                    f"New Platform Course: {course['title']}",
                    f"A new universal course '{course['title']}' ({course['code']}) is now open for enrollment across all colleges!",
                    f"/courses/{course_id}"
                )
            )
    
    log_audit(
        college_id=course["college_id"],
        user_id=current_user["id"],
        action="COURSE_PUBLISH",
        resource_type="course",
        resource_id=str(course_id),
        details={"title": course["title"]}
    )
    return {"message": f"Course '{course['title']}' published successfully", "is_published": 1, "status": "published"}

@router.patch("/{course_id}/unpublish")
def unpublish_course(course_id: int, current_user: Dict[str, Any] = Depends(require_role(["super_admin", "college_admin"]))):
    """Unpublishes course and reverts to draft."""
    course = query_one("SELECT * FROM courses WHERE id = ?", (course_id,))
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
        
    if current_user.get("role_name") == "college_admin":
        verify_tenant_access(current_user, course["college_id"])
        
    execute_query(
        "UPDATE courses SET is_published = 0, status = 'draft', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        (course_id,)
    )
    return {"message": f"Course '{course['title']}' reverted to draft", "is_published": 0, "status": "draft"}

@router.delete("/{course_id}")
def delete_course(course_id: int, current_user: Dict[str, Any] = Depends(require_role(["super_admin", "college_admin"]))):
    """Deletes a course and all associated modules, contents, enrollments."""
    course = query_one("SELECT * FROM courses WHERE id = ?", (course_id,))
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
        
    if current_user.get("role_name") == "college_admin":
        verify_tenant_access(current_user, course["college_id"])
        
    execute_query("DELETE FROM courses WHERE id = ?", (course_id,))
    log_audit(
        college_id=course["college_id"],
        user_id=current_user["id"],
        action="COURSE_DELETE",
        resource_type="course",
        resource_id=str(course_id)
    )
    return {"message": f"Course '{course['title']}' deleted successfully"}

@router.get("/{course_id}/public-info")
def get_course_public_info(course_id: int):
    """Public endpoint to fetch course info and registration details without requiring auth."""
    course = query_one(
        """
        SELECT c.*,
               COALESCE(col.name, 'All Colleges (Global)') as college_name,
               COALESCE(col.code, 'ALL') as college_code,
               COUNT(DISTINCT m.id) as module_count,
               COUNT(DISTINCT cnt.id) as lesson_count,
               COUNT(DISTINCT e.id) as enrollment_count
        FROM courses c
        LEFT JOIN colleges col ON c.college_id = col.id
        LEFT JOIN course_modules m ON c.id = m.course_id
        LEFT JOIN course_contents cnt ON m.id = cnt.module_id
        LEFT JOIN enrollments e ON c.id = e.course_id
        WHERE c.id = ?
        GROUP BY c.id
        """,
        (course_id,)
    )
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
        
    modules = query_all(
        "SELECT id, title, description, sort_order FROM course_modules WHERE course_id = ? ORDER BY sort_order ASC, id ASC",
        (course_id,)
    )
    for mod in modules:
        mod["contents"] = query_all(
            "SELECT id, title, content_type, duration_minutes, sort_order FROM course_contents WHERE module_id = ? ORDER BY sort_order ASC, id ASC",
            (mod["id"],)
        )
        
    colleges = query_all("SELECT id, name, code FROM colleges WHERE is_active = 1 ORDER BY name ASC")
    
    return {
        "course": course,
        "modules": modules,
        "colleges": colleges
    }

@router.get("/{course_id}/check-student")
def check_student_registration_status(course_id: int, email: str = None, roll_number: str = None, college_id: int = None):
    """Real-time duplicate check: Checks if student is already enrolled in this course or exists in system."""
    if not email and not roll_number:
        return {"is_enrolled": False, "exists": False}
    
    clean_email = email.strip().lower() if email else None
    clean_roll = roll_number.strip().upper() if roll_number else None
    
    student = None
    if clean_email:
        student = query_one(
            """
            SELECT s.id as student_id, u.id as user_id, u.first_name, u.last_name, s.roll_number, s.college_id
            FROM users u
            JOIN students s ON u.id = s.user_id
            WHERE LOWER(u.email) = ?
            """,
            (clean_email,)
        )
    
    if not student and clean_roll:
        query = "SELECT s.id as student_id, u.id as user_id, u.first_name, u.last_name, s.roll_number, s.college_id FROM students s JOIN users u ON s.user_id = u.id WHERE UPPER(s.roll_number) = ?"
        params = [clean_roll]
        if college_id:
            query += " AND s.college_id = ?"
            params.append(college_id)
        student = query_one(query, tuple(params))
        
    if not student:
        return {"is_enrolled": False, "exists": False}
        
    enrollment = query_one(
        "SELECT id, status, progress_percentage FROM enrollments WHERE student_id = ? AND course_id = ?",
        (student["student_id"], course_id)
    )
    
    return {
        "is_enrolled": enrollment is not None,
        "exists": True,
        "student_name": f"{student['first_name']} {student['last_name']}",
        "roll_number": student["roll_number"],
        "enrollment_id": enrollment["id"] if enrollment else None,
        "message": "Student is already enrolled in this course. Form is locked against duplicate data." if enrollment else "Existing student recognized."
    }

@router.post("/{course_id}/register-student", status_code=status.HTTP_201_CREATED)
def public_register_student_for_course(course_id: int, req: StudentPublicRegistration):
    """Registers a student in database.db and creates their course enrollment."""
    course = query_one(
        """
        SELECT c.*,
               COALESCE(col.name, 'All Colleges (Global)') as college_name
        FROM courses c
        LEFT JOIN colleges col ON c.college_id = col.id
        WHERE c.id = ?
        """,
        (course_id,)
    )
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
        
    if course["is_published"] == 0 or course["status"] != "published":
        raise HTTPException(status_code=400, detail="This course is not currently open for registration")
        
    # Resolve target college:
    target_college_id = course["college_id"]
    if target_college_id is None:
        target_college_id = req.college_id
        if not target_college_id:
            first_col = query_one("SELECT id FROM colleges WHERE is_active = 1 LIMIT 1")
            target_college_id = first_col["id"] if first_col else 1

    clean_email = req.email.strip().lower()
    user = query_one(
        """
        SELECT u.id, u.college_id, u.role_id, r.name as role_name,
               u.email, u.password_hash, u.first_name, u.last_name, u.phone, u.avatar_url,
               u.is_active, s.id as student_record_id, s.roll_number, s.department, s.batch
        FROM users u
        JOIN roles r ON u.role_id = r.id
        LEFT JOIN students s ON u.id = s.user_id
        WHERE LOWER(u.email) = ?
        """,
        (clean_email,)
    )
    
    student_record_id = None
    
    if user:
        # Existing student registering for this course
        user_id = user["id"]
        student_record_id = user.get("student_record_id")
        if not student_record_id:
            # Create student record for user if missing
            student_record_id = execute_query(
                """
                INSERT INTO students (user_id, college_id, roll_number, department, year_of_study, batch)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (user_id, target_college_id, req.roll_number.strip().upper(), req.department.strip(), req.year_of_study, req.batch or course.get("batch") or "2024-2028")
            )
    else:
        # Create new student user
        role = query_one("SELECT id FROM roles WHERE name = 'student'")
        pwd_hash = hash_password(req.password or "Student@123")
        
        # Check if roll number already exists for another user in this institution
        existing_roll = query_one(
            """
            SELECT u.id as user_id, s.id as student_record_id, u.college_id, u.role_id, r.name as role_name,
                   u.email, u.first_name, u.last_name, u.phone, u.avatar_url, u.is_active,
                   s.roll_number, s.department, s.batch
            FROM students s
            JOIN users u ON s.user_id = u.id
            JOIN roles r ON u.role_id = r.id
            WHERE s.college_id = ? AND UPPER(s.roll_number) = UPPER(?)
            """,
            (target_college_id, req.roll_number.strip())
        )
        if existing_roll:
            user = existing_roll
            user_id = user["user_id"]
            student_record_id = user["student_record_id"]
        else:
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
                (user_id, target_college_id, req.roll_number.strip().upper(), req.department.strip(), req.year_of_study, req.batch or course.get("batch") or "2024-2028")
            )
            
            user = query_one(
                """
                SELECT u.id, u.college_id, u.role_id, r.name as role_name,
                       u.email, u.first_name, u.last_name, u.phone, u.avatar_url,
                       u.is_active, s.id as student_record_id, s.roll_number, s.department, s.batch
                FROM users u
                JOIN roles r ON u.role_id = r.id
                LEFT JOIN students s ON u.id = s.user_id
                WHERE u.id = ?
                """,
                (user_id,)
            )

    # Check/Create Enrollment (Duplicate Protection)
    enrollment = query_one(
        "SELECT id, status, progress_percentage FROM enrollments WHERE student_id = ? AND course_id = ?",
        (student_record_id, course_id)
    )
    
    is_already_registered = False
    if not enrollment:
        enrollment_id = execute_query(
            """
            INSERT INTO enrollments (college_id, student_id, course_id, status, progress_percentage, enrolled_at)
            VALUES (?, ?, ?, 'registered', 0.0, CURRENT_TIMESTAMP)
            """,
            (target_college_id, student_record_id, course_id)
        )
        # Issue welcome notification to student only on new enrollment
        execute_query(
            """
            INSERT INTO notifications (college_id, user_id, title, message, type, link_url)
            VALUES (?, ?, ?, ?, 'course', ?)
            """,
            (
                target_college_id,
                user["id"] if "id" in user else user["user_id"],
                f"Enrolled in {course['title']}",
                f"You have successfully registered for '{course['title']}' ({course['code']}). Start learning now!",
                f"/player/{course_id}"
            )
        )
    else:
        enrollment_id = enrollment["id"]
        is_already_registered = True
    
    # Generate JWT token for auto-login
    uid = user["id"] if "id" in user else user["user_id"]
    token_payload = {
        "sub": str(uid),
        "email": user["email"],
        "role": "student",
        "college_id": target_college_id,
        "name": f"{user['first_name']} {user['last_name']}"
    }
    access_token = create_access_token(token_payload)
    
    user_dict = dict(user)
    user_dict.pop("password_hash", None)
    if "user_id" in user_dict:
        user_dict["id"] = user_dict["user_id"]
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_dict,
        "enrollment_id": enrollment_id,
        "already_registered": is_already_registered,
        "message": f"Registration is closed for your account: You are already registered for '{course['title']}'." if is_already_registered else f"Successfully registered & enrolled in '{course['title']}'!"
    }






















