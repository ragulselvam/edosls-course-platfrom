import os
import tempfile
from pathlib import Path

# Use dedicated isolated test DB so live platform.db is never touched or wiped by tests
TEST_DB = Path(tempfile.gettempdir()) / "test_platform_isolated.db"
os.environ["PLATFORM_DB_PATH"] = str(TEST_DB)

import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import init_db
from app.seed import seed_database

client = TestClient(app)

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    init_db()
    seed_database(force=True)
    yield
    # Cleanup test DB
    if TEST_DB.exists():
        try:
            TEST_DB.unlink()
        except Exception:
            pass

def get_token(email: str, password: str = None):
    if password is None:
        password = "edu_edsols2026" if ("edsols.in" in email or email == "superadmin@platform.edu") else "Password@123"
    resp = client.post("/api/auth/login", json={"email": email, "password": password})
    assert resp.status_code == 200, f"Login failed for {email}: {resp.text}"
    return resp.json()["access_token"]

def test_super_admin_flow():
    """Super admin can view all colleges, create new college and create college admin."""
    token = get_token("superadmin@platform.edu")
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. List Colleges
    resp = client.get("/api/colleges", headers=headers)
    assert resp.status_code == 200
    colleges = resp.json()
    assert len(colleges) >= 3
    
    # 2. Super Admin Dashboard Metrics
    metrics_resp = client.get("/api/reports/super-admin-dashboard", headers=headers)
    assert metrics_resp.status_code == 200
    metrics = metrics_resp.json()["metrics"]
    assert metrics["total_colleges"] >= 3
    assert metrics["total_students"] >= 6
    assert metrics["total_courses"] >= 4

def test_tenant_data_isolation():
    """Strict test: College 1 Student and Admin CANNOT access College 2 resources."""
    ait_student_token = get_token("student1@ait.edu")
    svce_student_token = get_token("student1@svce.edu")
    ait_admin_token = get_token("admin@ait.edu")
    svce_admin_token = get_token("admin@svce.edu")
    
    # AIT Student views courses: should only see AIT courses
    ait_courses = client.get("/api/courses", headers={"Authorization": f"Bearer {ait_student_token}"}).json()
    for c in ait_courses:
        assert c["college_code"] == "AIT", "AIT student should only see AIT courses"
        
    # SVCE Student views courses: should only see SVCE courses
    svce_courses = client.get("/api/courses", headers={"Authorization": f"Bearer {svce_student_token}"}).json()
    for c in svce_courses:
        assert c["college_code"] == "SVCE", "SVCE student should only see SVCE courses"
        
    # Cross-tenant enrollment attempt: AIT student attempting to register for SVCE course must fail (403)
    svce_course_id = svce_courses[0]["id"]
    reg_resp = client.post(
        "/api/enrollments/register",
        json={"course_id": svce_course_id},
        headers={"Authorization": f"Bearer {ait_student_token}"}
    )
    assert reg_resp.status_code == 403, "Cross-tenant registration should be forbidden"

def test_course_creation_and_publishing_lifecycle():
    """College admin creates a new course, adds a module, adds content, and publishes."""
    admin_token = get_token("admin@svce.edu")
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    unique_code = f"SVCE-QC-{uuid.uuid4().hex[:6].upper()}"
    # Step 1: Create Course Draft
    course_data = {
        "title": "Quantum Computing & Algorithms",
        "code": unique_code,
        "description": "Introduction to Qubits and Quantum Gates",
        "category": "Quantum Computing",
        "level": "Intermediate",
        "duration": "4 Weeks",
        "status": "draft"
    }
    create_resp = client.post("/api/courses", json=course_data, headers=headers)
    assert create_resp.status_code == 201
    course_id = create_resp.json()["id"]
    
    # Step 2: Add Module
    mod_resp = client.post(f"/api/modules/course/{course_id}", json={"title": "Qubits & Superposition"}, headers=headers)
    assert mod_resp.status_code == 201
    module_id = mod_resp.json()["id"]
    
    # Step 3: Add Content Item
    cnt_resp = client.post(
        "/api/content",
        json={
            "module_id": module_id,
            "title": "Introduction to Hadamard Gate",
            "content_type": "document",
            "content_data": "# Quantum Circuits\nExploring superposition.",
            "duration_minutes": 10
        },
        headers=headers
    )
    assert cnt_resp.status_code == 201
    
    # Step 4: Publish Course
    pub_resp = client.patch(f"/api/courses/{course_id}/publish", headers=headers)
    assert pub_resp.status_code == 200
    assert pub_resp.json()["is_published"] == 1

def test_assessment_and_grading_engine():
    """Student submits answers to an assessment and receives automated scoring."""
    token = get_token("student2@ait.edu")
    headers = {"Authorization": f"Bearer {token}"}
    
    # List assessments for AIT student
    assessments = client.get("/api/assessments", headers=headers).json()
    assert len(assessments) > 0
    assess_id = assessments[0]["id"]
    
    # Submit assessment answers using actual question IDs
    assess_detail = client.get(f"/api/assessments/{assess_id}", headers=headers).json()
    questions = assess_detail.get("questions", [])
    
    answers = {}
    for q in questions:
        qid = str(q["id"])
        if q["question_type"] == "mcq":
            answers[qid] = "1" # Correct option for seeded question
        elif q["question_type"] == "multi_select":
            answers[qid] = ["0", "1", "3"]
            
    submit_payload = {
        "assessment_id": assess_id,
        "answers": answers,
        "code_submission": """import sys
try:
    val = float(sys.stdin.read().strip())
    if val >= 0.8:
        print("STOP")
    elif val >= 0.5:
        print("SLOW_TURN")
    else:
        print("FORWARD")
except:
    print("FORWARD")
"""
    }
    
    sub_resp = client.post("/api/assessments/submit", json=submit_payload, headers=headers)
    assert sub_resp.status_code == 201
    res = sub_resp.json()
    assert "score" in res
    assert res["percentage"] >= 50.0
    assert res["passed"] is True

def test_public_certificate_verification():
    """Public certificate verification endpoint verifies authenticity without login."""
    # We seeded CERT-AIT-401-98F27A for Alex Rivera
    verify_resp = client.get("/api/certificates/verify/CERT-AIT-401-98F27A")
    assert verify_resp.status_code == 200
    data = verify_resp.json()
    assert data["is_valid"] is True
    assert "Alex Rivera" in data["student_name"]
    assert "Autonomous Robotics" in data["course_title"]
    assert "Apex Institute of Technology" in data["college_name"]

def test_course_material_upload_and_lesson_attachment():
    """College Admin can upload own course material file (PDF/video/code) and attach it to a course module."""
    import io
    admin_token = get_token("admin@ait.edu")
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # 1. Upload a PDF Course Material file
    fake_pdf_content = b"%PDF-1.4 ... Fake binary PDF stream for Autonomous Robotics Lecture Notes ..."
    files = {"file": ("Robotics_Lecture_01.pdf", io.BytesIO(fake_pdf_content), "application/pdf")}
    data = {"category": "courses"}
    
    upload_resp = client.post("/api/files/upload", files=files, data=data, headers=headers)
    assert upload_resp.status_code == 200, f"Upload failed: {upload_resp.text}"
    uploaded = upload_resp.json()
    assert "url" in uploaded
    assert uploaded["filename"] == "Robotics_Lecture_01.pdf"
    assert uploaded["extension"] == "pdf"
    file_url = uploaded["url"]
    
    # 2. Get existing course module for AIT
    courses = client.get("/api/courses", headers=headers).json()
    assert len(courses) > 0
    course_id = courses[0]["id"]
    course_full = client.get(f"/api/courses/{course_id}", headers=headers).json()
    assert len(course_full["modules"]) > 0
    module_id = course_full["modules"][0]["id"]
    
    # 3. Create learning content with the uploaded file attached
    content_payload = {
        "module_id": module_id,
        "title": "Uploaded PDF: Robotics Lecture 01",
        "content_type": "pdf",
        "content_data": "# Robotics Foundations\nPlease review the attached official lecture slide deck.",
        "file_url": file_url,
        "duration_minutes": 25,
        "is_mandatory": True
    }
    cnt_resp = client.post("/api/content", json=content_payload, headers=headers)
    assert cnt_resp.status_code == 201
    created_content = cnt_resp.json()
    assert created_content["file_url"] == file_url
    assert created_content["content_type"] == "pdf"
    
    # 4. Student can retrieve the content item with the attached file URL
    student_token = get_token("student1@ait.edu")
    student_content = client.get(f"/api/content/{created_content['id']}", headers={"Authorization": f"Bearer {student_token}"}).json()
    assert student_content["file_url"] == file_url
    assert student_content["title"] == "Uploaded PDF: Robotics Lecture 01"

def test_student_public_registration_and_course_enrollment():
    """Verifies that public web form submissions register students directly into DB and grant immediate access."""
    # 1. Public colleges list
    pub_colleges = client.get("/api/colleges/public/list").json()
    assert len(pub_colleges) >= 1
    college_id = pub_colleges[0]["id"]
    
    # 2. General student registration
    reg_payload = {
        "first_name": "Priya",
        "last_name": "Sharma",
        "email": f"priya.sharma.{uuid.uuid4().hex[:5]}@test.edu",
        "password": "Password@123",
        "roll_number": f"TEST-{uuid.uuid4().hex[:6].upper()}",
        "department": "Computer Science & Engineering",
        "year_of_study": 2,
        "batch": "2024-2028",
        "college_id": college_id,
        "phone": "+91 9123456789"
    }
    reg_resp = client.post("/api/auth/register-student", json=reg_payload)
    assert reg_resp.status_code == 201, f"Registration failed: {reg_resp.text}"
    data = reg_resp.json()
    assert "access_token" in data
    assert data["user"]["email"] == reg_payload["email"].lower()
    assert data["user"]["first_name"] == "Priya"
    
    # 3. Verify user can authenticate immediately with new credentials
    auth_resp = client.post("/api/auth/login", json={"email": reg_payload["email"], "password": "Password@123"})
    assert auth_resp.status_code == 200

    # 4. Direct Course Registration and duplicate prevention
    admin_token = get_token("superadmin@platform.edu")
    courses = client.get("/api/courses", headers={"Authorization": f"Bearer {admin_token}"}).json()
    assert len(courses) >= 1
    test_course_id = courses[0]["id"]

    course_reg_payload = {
        "first_name": "Rohan",
        "last_name": "Verma",
        "email": f"rohan.verma.{uuid.uuid4().hex[:5]}@test.edu",
        "roll_number": f"22CS{uuid.uuid4().hex[:4].upper()}",
        "department": "Artificial Intelligence & Data Science",
        "year_of_study": 3,
        "batch": "2023-2027",
        "college_id": college_id,
        "phone": "+91 9876543210"
    }
    # Initial registration
    first_resp = client.post(f"/api/courses/{test_course_id}/register-student", json=course_reg_payload)
    assert first_resp.status_code in [200, 201], f"Registration failed: {first_resp.text}"
    first_data = first_resp.json()
    assert first_data["already_registered"] is False
    assert "access_token" in first_data

    # Duplicate registration attempt with same student details
    dup_resp = client.post(f"/api/courses/{test_course_id}/register-student", json=course_reg_payload)
    assert dup_resp.status_code in [200, 201]
    dup_data = dup_resp.json()
    assert dup_data["already_registered"] is True
    assert dup_data["enrollment_id"] == first_data["enrollment_id"]
    assert "already registered" in dup_data["message"].lower()

def test_trainer_assignment_super_admin_success():
    """Super Admin assigns, changes, and removes a trainer for a class/course."""
    sa_token = get_token("superadmin@platform.edu")
    headers = {"Authorization": f"Bearer {sa_token}"}

    # 1. Get available trainers
    trainers_resp = client.get("/api/courses/trainers", headers=headers)
    assert trainers_resp.status_code == 200
    trainers = trainers_resp.json()
    assert len(trainers) >= 2
    john_doe = next((t for t in trainers if t["email"] == "john.doe@platform.edu"), None)
    sarah_connor = next((t for t in trainers if t["email"] == "sarah.connor@platform.edu"), None)
    assert john_doe is not None
    assert sarah_connor is not None

    # 2. Get list of courses
    courses_resp = client.get("/api/courses", headers=headers)
    assert courses_resp.status_code == 200
    courses = courses_resp.json()
    assert len(courses) >= 1
    course_id = courses[0]["id"]

    # 3. Super Admin assigns John Doe to course
    assign_resp = client.post(
        f"/api/courses/{course_id}/assign-trainer",
        json={"trainer_id": john_doe["id"], "notes": "Assigned for Spring AI Term"},
        headers=headers
    )
    assert assign_resp.status_code == 200
    assign_data = assign_resp.json()
    assert assign_data["success"] is True
    assert assign_data["trainer_id"] == john_doe["id"]
    assert "John Doe" in assign_data["trainer_name"]
    assert assign_data["message"] == "Trainer assigned successfully."

    # Verify course reflects trainer
    c_detail = client.get(f"/api/courses/{course_id}", headers=headers).json()
    assert c_detail["course"]["trainer_id"] == john_doe["id"]
    assert "John Doe" in c_detail["course"]["trainer_name"]

    # 4. Super Admin changes trainer to Sarah Connor
    change_resp = client.post(
        f"/api/courses/{course_id}/assign-trainer",
        json={"trainer_id": sarah_connor["id"], "notes": "Reassigned instructor"},
        headers=headers
    )
    assert change_resp.status_code == 200
    change_data = change_resp.json()
    assert change_data["action"] == "changed"
    assert change_data["trainer_id"] == sarah_connor["id"]
    assert change_data["previous_trainer_id"] == john_doe["id"]

    # 5. Verify assignment history audit trail
    history_resp = client.get(f"/api/courses/{course_id}/trainer-history", headers=headers)
    assert history_resp.status_code == 200
    history = history_resp.json()
    assert len(history) >= 2
    assert history[0]["action"] == "changed"
    assert history[0]["trainer_id"] == sarah_connor["id"]
    assert history[0]["previous_trainer_id"] == john_doe["id"]

    # 6. Super Admin removes trainer
    remove_resp = client.post(
        f"/api/courses/{course_id}/assign-trainer",
        json={"trainer_id": None, "notes": "Unassigned trainer"},
        headers=headers
    )
    assert remove_resp.status_code == 200
    remove_data = remove_resp.json()
    assert remove_data["action"] == "removed"
    assert remove_data["trainer_id"] is None
    assert remove_data["trainer_name"] == "Not Assigned"

    # Verify course is unassigned
    c_unassigned = client.get(f"/api/courses/{course_id}", headers=headers).json()
    assert c_unassigned["course"]["trainer_id"] is None
    assert c_unassigned["course"]["trainer_name"] == "Not Assigned"

def test_trainer_assignment_rbac_enforcement():
    """Non-Super Admins (Admin, Student, Trainer) MUST receive 403 Forbidden."""
    sa_token = get_token("superadmin@platform.edu")
    admin_token = get_token("admin@svce.edu")
    student_token = get_token("student1@ait.edu")
    trainer_token = get_token("john.doe@platform.edu")

    courses = client.get("/api/courses", headers={"Authorization": f"Bearer {sa_token}"}).json()
    course_id = courses[0]["id"]
    trainers = client.get("/api/courses/trainers", headers={"Authorization": f"Bearer {sa_token}"}).json()
    target_trainer_id = trainers[0]["id"]

    # 1. College Admin attempts assign -> 403
    ca_resp = client.post(
        f"/api/courses/{course_id}/assign-trainer",
        json={"trainer_id": target_trainer_id},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert ca_resp.status_code == 403, "College Admin must not be allowed to assign trainer"

    # 2. Student attempts assign -> 403
    st_resp = client.post(
        f"/api/courses/{course_id}/assign-trainer",
        json={"trainer_id": target_trainer_id},
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert st_resp.status_code == 403, "Student must not be allowed to assign trainer"

    # 3. Trainer attempts assign -> 403
    tr_resp = client.post(
        f"/api/courses/{course_id}/assign-trainer",
        json={"trainer_id": target_trainer_id},
        headers={"Authorization": f"Bearer {trainer_token}"}
    )
    assert tr_resp.status_code == 403, "Trainer must not be allowed to assign trainer"

def test_trainer_assignment_validation_inactive_trainer():
    """Assigning an inactive trainer must fail with 400 Bad Request."""
    sa_token = get_token("superadmin@platform.edu")
    headers = {"Authorization": f"Bearer {sa_token}"}

    # Query inactive trainer
    inactive_trainers = client.get("/api/courses/trainers?include_inactive=true", headers=headers).json()
    alex_inactive = next((t for t in inactive_trainers if t["email"] == "inactive.trainer@platform.edu"), None)
    assert alex_inactive is not None
    assert alex_inactive["is_active"] == 0 or alex_inactive["is_active"] is False

    courses = client.get("/api/courses", headers=headers).json()
    course_id = courses[0]["id"]

    # Attempt to assign inactive trainer
    fail_resp = client.post(
        f"/api/courses/{course_id}/assign-trainer",
        json={"trainer_id": alex_inactive["id"]},
        headers=headers
    )
    assert fail_resp.status_code == 400
    assert "inactive" in fail_resp.json()["detail"].lower()

def test_trainer_view_assigned_courses_only():
    """A trainer only sees courses/classes assigned to them."""
    sa_token = get_token("superadmin@platform.edu")
    sa_headers = {"Authorization": f"Bearer {sa_token}"}

    # Get trainers
    trainers = client.get("/api/courses/trainers", headers=sa_headers).json()
    john_doe = next(t for t in trainers if t["email"] == "john.doe@platform.edu")
    courses = client.get("/api/courses", headers=sa_headers).json()
    assert len(courses) >= 2

    # Assign Course 0 to John Doe
    c0_id = courses[0]["id"]
    client.post(f"/api/courses/{c0_id}/assign-trainer", json={"trainer_id": john_doe["id"]}, headers=sa_headers)

    # Assign Course 1 to another trainer (Sarah Connor)
    c1_id = courses[1]["id"]
    sarah = next(t for t in trainers if t["email"] == "sarah.connor@platform.edu")
    client.post(f"/api/courses/{c1_id}/assign-trainer", json={"trainer_id": sarah["id"]}, headers=sa_headers)

    # Log in as John Doe (Trainer)
    trainer_token = get_token("john.doe@platform.edu")
    tr_headers = {"Authorization": f"Bearer {trainer_token}"}

    # John Doe lists courses -> only sees Course 0
    tr_courses = client.get("/api/courses", headers=tr_headers).json()
    assigned_ids = [c["id"] for c in tr_courses]
    assert c0_id in assigned_ids
    assert c1_id not in assigned_ids


