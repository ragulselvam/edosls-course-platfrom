-- =====================================================================
-- Multi-Tenant Student Training & Assessment Platform (NEXUS LMS)
-- Target: Supabase / PostgreSQL Schema Definition
-- File: supabase_schema.sql
-- =====================================================================

-- 1. Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------
-- 2. COLLEGES & INSTITUTIONS TABLE (Tenants)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS colleges (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    domain TEXT,
    logo_url TEXT,
    address TEXT,
    contact_email TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 3. USER ROLES TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE, -- super_admin, college_admin, trainer, student
    description TEXT
);

-- Insert Default System Roles
INSERT INTO roles (id, name, description) VALUES
    (1, 'super_admin', 'Global Platform Super Administrator with complete oversight'),
    (2, 'college_admin', 'Tenant Institution Administrator managing campus curriculum and students'),
    (3, 'trainer', 'Course & Class Trainer / Instructor assigned by Super Admin'),
    (4, 'student', 'Enrolled student learner accessing courses, code sandboxes, and labs')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;

-- ---------------------------------------------------------------------
-- 4. USERS TABLE (Global Authentication & Identity)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    college_id BIGINT REFERENCES colleges(id) ON DELETE SET NULL,
    role_id BIGINT NOT NULL REFERENCES roles(id),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 5. COLLEGE ADMINISTRATORS TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS college_admins (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    college_id BIGINT NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    department TEXT,
    designation TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 6. STUDENTS TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS students (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    college_id BIGINT NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    roll_number TEXT NOT NULL,
    department TEXT NOT NULL,
    year_of_study INT NOT NULL DEFAULT 1,
    batch TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(college_id, roll_number)
);

-- ---------------------------------------------------------------------
-- 7. COURSES TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS courses (
    id BIGSERIAL PRIMARY KEY,
    college_id BIGINT REFERENCES colleges(id) ON DELETE CASCADE, -- NULL indicates global/universal course
    trainer_id BIGINT REFERENCES users(id) ON DELETE SET NULL, -- Assigned trainer (Super Admin only)
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
    batch TEXT DEFAULT 'All Batches',
    start_date DATE,
    end_date DATE,
    passing_percentage REAL DEFAULT 60.0,
    certificate_enabled BOOLEAN DEFAULT TRUE,
    is_published BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'draft', -- draft, published, archived
    created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(college_id, code)
);

-- ---------------------------------------------------------------------
-- 8. TRAINER ASSIGNMENTS TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS trainer_assignments (
    id BIGSERIAL PRIMARY KEY,
    course_id BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    trainer_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    previous_trainer_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    assigned_by BIGINT NOT NULL REFERENCES users(id),
    action TEXT NOT NULL DEFAULT 'assigned', -- assigned, changed, removed
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 9. COURSE MODULES TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS course_modules (
    id BIGSERIAL PRIMARY KEY,
    course_id BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 10. COURSE CONTENTS & LESSONS TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS course_contents (
    id BIGSERIAL PRIMARY KEY,
    module_id BIGINT NOT NULL REFERENCES course_modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content_type TEXT NOT NULL, -- video, pdf, document, image, link, coding, assignment, quiz, assessment, jetbot
    content_data TEXT,
    file_url TEXT,
    duration_minutes INT DEFAULT 10,
    sort_order INT NOT NULL DEFAULT 0,
    is_mandatory BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 11. ENROLLMENTS TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS enrollments (
    id BIGSERIAL PRIMARY KEY,
    college_id BIGINT NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    course_id BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'registered', -- registered, in_progress, completed, failed
    progress_percentage REAL NOT NULL DEFAULT 0.0,
    final_grade TEXT,
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    UNIQUE(student_id, course_id)
);

-- ---------------------------------------------------------------------
-- 12. CONTENT PROGRESS TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS progress (
    id BIGSERIAL PRIMARY KEY,
    enrollment_id BIGINT NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
    content_id BIGINT NOT NULL REFERENCES course_contents(id) ON DELETE CASCADE,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    time_spent_seconds INT DEFAULT 0,
    completed_at TIMESTAMPTZ,
    last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(enrollment_id, content_id)
);

-- ---------------------------------------------------------------------
-- 13. ASSIGNMENTS TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS assignments (
    id BIGSERIAL PRIMARY KEY,
    course_id BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    module_id BIGINT REFERENCES course_modules(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    instructions TEXT,
    attachment_url TEXT,
    max_score REAL DEFAULT 100.0,
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 14. QUIZZES TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS quizzes (
    id BIGSERIAL PRIMARY KEY,
    course_id BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    module_id BIGINT REFERENCES course_modules(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    time_limit_minutes INT DEFAULT 30,
    passing_percentage REAL DEFAULT 60.0,
    max_attempts INT DEFAULT 3,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 15. ASSESSMENTS TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS assessments (
    id BIGSERIAL PRIMARY KEY,
    college_id BIGINT NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    course_id BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    assessment_type TEXT DEFAULT 'mcq', -- mcq, coding, jetbot_practical, hybrid
    time_limit_minutes INT DEFAULT 45,
    passing_percentage REAL DEFAULT 60.0,
    max_attempts INT DEFAULT 2,
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 16. QUESTIONS TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS questions (
    id BIGSERIAL PRIMARY KEY,
    assessment_id BIGINT REFERENCES assessments(id) ON DELETE CASCADE,
    quiz_id BIGINT REFERENCES quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL DEFAULT 'mcq', -- mcq, multi_select, coding, file_upload, practical
    options_json TEXT, -- JSON array of strings
    correct_answer_json TEXT, -- JSON array of correct indices or strings
    code_template TEXT,
    test_cases_json TEXT,
    points REAL DEFAULT 10.0,
    sort_order INT DEFAULT 0
);

-- ---------------------------------------------------------------------
-- 17. SUBMISSIONS TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS submissions (
    id BIGSERIAL PRIMARY KEY,
    college_id BIGINT NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    assessment_id BIGINT REFERENCES assessments(id) ON DELETE SET NULL,
    quiz_id BIGINT REFERENCES quizzes(id) ON DELETE SET NULL,
    assignment_id BIGINT REFERENCES assignments(id) ON DELETE SET NULL,
    attempt_number INT DEFAULT 1,
    answers_json TEXT,
    code_submission TEXT,
    file_urls_json TEXT,
    status TEXT DEFAULT 'submitted', -- submitted, evaluating, evaluated
    submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 18. RESULTS TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS results (
    id BIGSERIAL PRIMARY KEY,
    submission_id BIGINT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    assessment_id BIGINT REFERENCES assessments(id) ON DELETE SET NULL,
    quiz_id BIGINT REFERENCES quizzes(id) ON DELETE SET NULL,
    assignment_id BIGINT REFERENCES assignments(id) ON DELETE SET NULL,
    score REAL NOT NULL,
    max_score REAL NOT NULL,
    percentage REAL NOT NULL,
    passed BOOLEAN NOT NULL DEFAULT FALSE,
    feedback TEXT,
    graded_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    evaluated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 19. CERTIFICATES TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS certificates (
    id BIGSERIAL PRIMARY KEY,
    certificate_code TEXT NOT NULL UNIQUE,
    college_id BIGINT NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    course_id BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    enrollment_id BIGINT NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
    issue_date DATE NOT NULL,
    qr_code_data TEXT NOT NULL,
    signature_name TEXT DEFAULT 'Dean of Academic Affairs',
    signature_title TEXT DEFAULT 'Authorized Signatory',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, course_id)
);

-- ---------------------------------------------------------------------
-- 20. NOTIFICATIONS TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,
    college_id BIGINT REFERENCES colleges(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    link_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 21. AUDIT LOGS TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    college_id BIGINT REFERENCES colleges(id) ON DELETE SET NULL,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    details_json TEXT,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 22. SYSTEM SETTINGS TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 23. PYTHON SANDBOX RUNS TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS python_sandbox_runs (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT REFERENCES students(id) ON DELETE CASCADE,
    content_id BIGINT REFERENCES course_contents(id) ON DELETE CASCADE,
    source_code TEXT NOT NULL,
    stdin_input TEXT,
    stdout_output TEXT,
    stderr_output TEXT,
    exit_code INT DEFAULT 0,
    execution_time_ms REAL DEFAULT 0.0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 24. JETBOT SIMULATIONS TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS jetbot_simulations (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT REFERENCES students(id) ON DELETE CASCADE,
    content_id BIGINT REFERENCES course_contents(id) ON DELETE CASCADE,
    scenario_name TEXT NOT NULL,
    commands_json TEXT NOT NULL,
    telemetry_json TEXT,
    score REAL DEFAULT 0.0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 25. ANNOUNCEMENTS & DISCUSSIONS TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS course_announcements (
    id BIGSERIAL PRIMARY KEY,
    course_id BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS discussions (
    id BIGSERIAL PRIMARY KEY,
    course_id BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- PERFORMANCE INDEXES
-- ---------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_users_college ON users(college_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_students_college ON students(college_id);
CREATE INDEX IF NOT EXISTS idx_students_user ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_courses_college ON courses(college_id);
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_trainer ON courses(trainer_id);
CREATE INDEX IF NOT EXISTS idx_trainer_assignments_course ON trainer_assignments(course_id);
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