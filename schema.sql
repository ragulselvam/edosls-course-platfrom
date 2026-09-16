-- =====================================================================
-- Multi-Tenant Student Training & Assessment Platform - SQLite Database Schema
-- File: schema.sql
-- Database Target: database.db
-- =====================================================================

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;

-- ---------------------------------------------------------------------
-- 1. COLLEGES & INSTITUTIONS TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS colleges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    domain TEXT,
    logo_url TEXT,
    address TEXT,
    contact_email TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- 2. USER ROLES TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE, -- super_admin, college_admin, trainer, student
    description TEXT
);

-- ---------------------------------------------------------------------
-- 3. USERS TABLE (Global Authentication)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    college_id INTEGER REFERENCES colleges(id) ON DELETE CASCADE,
    role_id INTEGER NOT NULL REFERENCES roles(id),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- 4. COLLEGE ADMINISTRATORS TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS college_admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    college_id INTEGER NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    department TEXT,
    designation TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- 5. STUDENTS TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    college_id INTEGER NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    roll_number TEXT NOT NULL,
    department TEXT NOT NULL,
    year_of_study INTEGER NOT NULL DEFAULT 1,
    batch TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(college_id, roll_number)
);

-- ---------------------------------------------------------------------
-- 6. COURSES TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    college_id INTEGER REFERENCES colleges(id) ON DELETE CASCADE, -- NULL indicates global/universal course available to all colleges
    trainer_id INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Assigned trainer (Super Admin only)
    title TEXT NOT NULL,
    code TEXT NOT NULL,
    description TEXT,
    category TEXT,
    level TEXT DEFAULT 'Beginner', -- Beginner, Intermediate, Advanced
    duration TEXT,
    instructor_name TEXT,
    thumbnail_url TEXT,
    learning_objectives TEXT,
    enrollment_type TEXT DEFAULT 'open', -- open, approval_required, invite_only
    visibility TEXT DEFAULT 'college', -- college, public
    batch TEXT DEFAULT 'All Batches', -- All Batches, 2021-2025, 2022-2026, 2023-2027, 2024-2028, etc.
    start_date DATE,
    end_date DATE,
    passing_percentage REAL DEFAULT 60.0,
    certificate_enabled INTEGER DEFAULT 1,
    is_published INTEGER DEFAULT 0,
    status TEXT DEFAULT 'draft', -- draft, published, archived
    created_by INTEGER REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(college_id, code)
);

-- ---------------------------------------------------------------------
-- 6b. TRAINER ASSIGNMENTS & AUDIT HISTORY TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS trainer_assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    trainer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    previous_trainer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    assigned_by INTEGER NOT NULL REFERENCES users(id),
    action TEXT NOT NULL DEFAULT 'assigned', -- assigned, changed, removed
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- 7. COURSE MODULES TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS course_modules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- 8. COURSE CONTENTS & LESSONS TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS course_contents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    module_id INTEGER NOT NULL REFERENCES course_modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content_type TEXT NOT NULL, -- video, pdf, document, image, link, coding, assignment, quiz, assessment, jetbot
    content_data TEXT, -- markdown, json payload, or source code description
    file_url TEXT,
    duration_minutes INTEGER DEFAULT 10,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_mandatory INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- 9. ENROLLMENTS TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS enrollments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    college_id INTEGER NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'registered', -- not_registered, registered, in_progress, completed, failed
    progress_percentage REAL NOT NULL DEFAULT 0.0,
    final_grade TEXT,
    enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    UNIQUE(student_id, course_id)
);

-- ---------------------------------------------------------------------
-- 10. CONTENT PROGRESS TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    enrollment_id INTEGER NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
    content_id INTEGER NOT NULL REFERENCES course_contents(id) ON DELETE CASCADE,
    is_completed INTEGER NOT NULL DEFAULT 0,
    time_spent_seconds INTEGER DEFAULT 0,
    completed_at DATETIME,
    last_accessed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(enrollment_id, content_id)
);

-- ---------------------------------------------------------------------
-- 11. ASSIGNMENTS TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    module_id INTEGER REFERENCES course_modules(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    instructions TEXT,
    attachment_url TEXT,
    max_score REAL DEFAULT 100.0,
    due_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- 12. QUIZZES TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS quizzes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    module_id INTEGER REFERENCES course_modules(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    time_limit_minutes INTEGER DEFAULT 30,
    passing_percentage REAL DEFAULT 60.0,
    max_attempts INTEGER DEFAULT 3,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- 13. ASSESSMENTS TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS assessments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    college_id INTEGER NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    assessment_type TEXT DEFAULT 'mcq', -- mcq, coding, jetbot_practical, hybrid
    time_limit_minutes INTEGER DEFAULT 45,
    passing_percentage REAL DEFAULT 60.0,
    max_attempts INTEGER DEFAULT 2,
    is_published INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- 14. QUESTIONS TABLE (MCQ, Coding, Multi-select)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    assessment_id INTEGER REFERENCES assessments(id) ON DELETE CASCADE,
    quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL DEFAULT 'mcq', -- mcq, multi_select, coding, file_upload, practical
    options_json TEXT, -- JSON array of option choices
    correct_answer_json TEXT, -- JSON array of correct indices or answers
    code_template TEXT, -- Starter template for coding problems
    test_cases_json TEXT, -- JSON list of {input, expected_output, is_hidden}
    points REAL DEFAULT 10.0,
    sort_order INTEGER DEFAULT 0
);

-- ---------------------------------------------------------------------
-- 15. SUBMISSIONS TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    college_id INTEGER NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    assessment_id INTEGER REFERENCES assessments(id) ON DELETE SET NULL,
    quiz_id INTEGER REFERENCES quizzes(id) ON DELETE SET NULL,
    assignment_id INTEGER REFERENCES assignments(id) ON DELETE SET NULL,
    attempt_number INTEGER DEFAULT 1,
    answers_json TEXT, -- JSON record of question_id -> response
    code_submission TEXT,
    file_urls_json TEXT, -- JSON array of uploaded attachments
    status TEXT DEFAULT 'submitted', -- submitted, evaluating, evaluated
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- 16. RESULTS TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    submission_id INTEGER NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    assessment_id INTEGER REFERENCES assessments(id) ON DELETE SET NULL,
    quiz_id INTEGER REFERENCES quizzes(id) ON DELETE SET NULL,
    assignment_id INTEGER REFERENCES assignments(id) ON DELETE SET NULL,
    score REAL NOT NULL,
    max_score REAL NOT NULL,
    percentage REAL NOT NULL,
    passed INTEGER NOT NULL DEFAULT 0,
    feedback TEXT,
    graded_by INTEGER REFERENCES users(id),
    evaluated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- 17. CERTIFICATES TABLE (QR Verifiable)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS certificates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    certificate_code TEXT NOT NULL UNIQUE,
    college_id INTEGER NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    enrollment_id INTEGER NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
    issue_date DATE NOT NULL,
    qr_code_data TEXT NOT NULL,
    signature_name TEXT DEFAULT 'Dean of Academic Affairs',
    signature_title TEXT DEFAULT 'Authorized Signatory',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, course_id)
);

-- ---------------------------------------------------------------------
-- 18. NOTIFICATIONS TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    college_id INTEGER REFERENCES colleges(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info', -- course, assessment, enrollment, certificate, system, assignment
    is_read INTEGER DEFAULT 0,
    link_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- 19. AUDIT LOGS TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    college_id INTEGER REFERENCES colleges(id) ON DELETE SET NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    details_json TEXT,
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- 20. SYSTEM SETTINGS & METADATA FLAGS TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- INDEXES FOR HIGH PERFORMANCE & MULTI-TENANT ISOLATION
-- ---------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_users_college ON users(college_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_students_college ON students(college_id);
CREATE INDEX IF NOT EXISTS idx_students_user ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_courses_college ON courses(college_id);
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);
CREATE INDEX IF NOT EXISTS idx_modules_course ON course_modules(course_id);
CREATE INDEX IF NOT EXISTS idx_contents_module ON course_contents(module_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_college ON enrollments(college_id);
CREATE INDEX IF NOT EXISTS idx_progress_enrollment ON progress(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assessment ON submissions(assessment_id);
CREATE INDEX IF NOT EXISTS idx_results_submission ON results(submission_id);
CREATE INDEX IF NOT EXISTS idx_certificates_code ON certificates(certificate_code);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_college ON audit_logs(college_id);
CREATE INDEX IF NOT EXISTS idx_courses_trainer ON courses(trainer_id);
CREATE INDEX IF NOT EXISTS idx_trainer_assignments_course ON trainer_assignments(course_id);