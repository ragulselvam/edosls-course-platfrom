from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, date

# --- Auth Models ---
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class UserUpdateRequest(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None

# --- College Models ---
class CollegeCreate(BaseModel):
    name: str
    code: str
    domain: Optional[str] = None
    logo_url: Optional[str] = None
    address: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    is_active: bool = True

class CollegeUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    domain: Optional[str] = None
    logo_url: Optional[str] = None
    address: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    is_active: Optional[bool] = None

# --- Admin Models ---
class AdminCreate(BaseModel):
    college_id: int
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    phone: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = "Academic Administrator"

# --- Student Models ---
class StudentCreate(BaseModel):
    college_id: Optional[int] = None # Filled from current admin if omitted
    email: EmailStr
    password: str = "Student@123"
    first_name: str
    last_name: str
    roll_number: str
    department: str
    year_of_study: int = 1
    batch: Optional[str] = "2024-2028"
    phone: Optional[str] = None

class StudentPublicRegistration(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    password: Optional[str] = "Student@123"
    roll_number: str
    department: str
    year_of_study: int = 1
    batch: Optional[str] = "2024-2028"
    college_id: Optional[int] = None
    phone: Optional[str] = None

class BulkStudentItem(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    roll_number: str
    department: str
    year_of_study: int = 1
    batch: Optional[str] = None
    phone: Optional[str] = None
    password: Optional[str] = "Student@123"

class BulkStudentImport(BaseModel):
    students: List[BulkStudentItem]

# --- Course Wizard Models ---
class CourseStep1Info(BaseModel):
    college_id: Optional[int] = None
    title: str
    code: str
    description: Optional[str] = None
    category: Optional[str] = "Computer Science"
    level: Optional[str] = "Beginner"
    duration: Optional[str] = "8 Weeks"
    instructor_name: Optional[str] = None
    thumbnail_url: Optional[str] = None
    learning_objectives: Optional[str] = None
    batch: Optional[str] = "All Batches"

class ModuleCreate(BaseModel):
    title: str
    description: Optional[str] = None
    sort_order: int = 0

class ModuleReorder(BaseModel):
    module_orders: List[Dict[str, int]] # [{ "id": 1, "sort_order": 0 }]

class ContentCreate(BaseModel):
    module_id: int
    title: str
    content_type: str # video, pdf, document, image, link, coding, assignment, quiz, assessment, jetbot
    content_data: Optional[str] = None # text, markdown or json string
    file_url: Optional[str] = None
    duration_minutes: int = 15
    sort_order: int = 0
    is_mandatory: bool = True

class CourseSettingsUpdate(BaseModel):
    enrollment_type: str = "open" # open, approval_required, invite_only
    visibility: str = "college" # college, public
    batch: Optional[str] = "All Batches"
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    passing_percentage: float = 60.0
    certificate_enabled: bool = True

class CourseCreateFull(BaseModel):
    college_id: Optional[int] = None
    title: str
    code: str
    description: Optional[str] = None
    category: Optional[str] = "Artificial Intelligence"
    level: Optional[str] = "Beginner"
    duration: Optional[str] = "6 Weeks"
    instructor_name: Optional[str] = None
    thumbnail_url: Optional[str] = None
    learning_objectives: Optional[str] = None
    enrollment_type: str = "open"
    visibility: str = "college"
    batch: Optional[str] = "All Batches"
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    passing_percentage: float = 60.0
    certificate_enabled: bool = True
    status: str = "draft" # draft or published

# --- Enrollment Models ---
class EnrollmentCreate(BaseModel):
    course_id: int

class EnrollmentStatusUpdate(BaseModel):
    status: str # registered, in_progress, completed, failed
    final_grade: Optional[str] = None

# --- Progress Models ---
class ProgressUpdate(BaseModel):
    content_id: int
    is_completed: bool = True
    time_spent_seconds: int = 60

# --- Assignment Models ---
class AssignmentCreate(BaseModel):
    course_id: int
    module_id: Optional[int] = None
    title: str
    description: Optional[str] = None
    instructions: Optional[str] = None
    attachment_url: Optional[str] = None
    max_score: float = 100.0
    due_date: Optional[datetime] = None

class AssignmentSubmit(BaseModel):
    assignment_id: int
    file_urls: List[str]
    notes: Optional[str] = None

# --- Assessment & Quiz Models ---
class QuestionItem(BaseModel):
    question_text: str
    question_type: str = "mcq" # mcq, multi_select, coding, file_upload, practical
    options: Optional[List[str]] = []
    correct_answers: Optional[List[Any]] = [] # indices or values
    code_template: Optional[str] = None
    test_cases: Optional[List[Dict[str, Any]]] = []
    points: float = 10.0
    sort_order: int = 0

class AssessmentCreate(BaseModel):
    course_id: int
    title: str
    description: Optional[str] = None
    assessment_type: str = "mcq" # mcq, coding, jetbot_practical, hybrid
    time_limit_minutes: int = 45
    passing_percentage: float = 60.0
    max_attempts: int = 2
    is_published: bool = True
    questions: List[QuestionItem] = []

class AssessmentSubmission(BaseModel):
    assessment_id: int
    answers: Dict[str, Any] # question_id -> selected options / code / text
    code_submission: Optional[str] = None
    file_urls: Optional[List[str]] = None

class ManualGradeRequest(BaseModel):
    submission_id: int
    score: float
    feedback: Optional[str] = None
    passed: Optional[bool] = None

# --- Code Execution Sandbox Models ---
class CodeRunRequest(BaseModel):
    code: str
    language: str = "python"
    input_data: Optional[str] = ""
    timeout_seconds: int = 5

class CodeTestRunRequest(BaseModel):
    code: str
    language: str = "python"
    test_cases: List[Dict[str, Any]] # [{"input": "...", "expected_output": "..."}]

# --- JetBot / AI Simulation Assessment Models ---
class JetBotAssessmentSubmit(BaseModel):
    assessment_id: int
    python_script: str
    dataset_url: Optional[str] = None
    notebook_url: Optional[str] = None
    model_weights_url: Optional[str] = None
    camera_task_type: str = "collision_avoidance" # collision_avoidance, line_following, yolo_object_detection

# --- Trainer Assignment & RBAC Models ---
class TrainerAssignRequest(BaseModel):
    trainer_id: Optional[int] = None # None or 0 to remove / unassign
    notes: Optional[str] = None

class TrainerOut(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: bool = True
    college_id: Optional[int] = None
    college_name: Optional[str] = None
    joining_date: Optional[str] = None
    available_until: Optional[str] = None
    assigned_courses_count: int = 0

class TrainerCreate(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    password: Optional[str] = "Trainer@123"
    phone: Optional[str] = None
    college_id: Optional[int] = None
    department: Optional[str] = "AI & Technical Computing"
    joining_date: Optional[str] = None
    available_until: Optional[str] = None

class TrainerAssignmentHistoryOut(BaseModel):
    id: int
    course_id: int
    trainer_id: Optional[int] = None
    trainer_name: Optional[str] = None
    previous_trainer_id: Optional[int] = None
    previous_trainer_name: Optional[str] = None
    assigned_by: int
    assigned_by_name: Optional[str] = None
    action: str
    notes: Optional[str] = None
    created_at: Any

