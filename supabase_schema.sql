-- =====================================================================
-- Multi-Tenant Student Training & Assessment Platform
-- Target: Supabase / PostgreSQL Schema Definition
-- File: supabase_schema.sql
-- =====================================================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. COLLEGES & INSTITUTIONS TABLE
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

-- 3. USER ROLES TABLE
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
ON CONFLICT (name) DO NOTHING;

-- 4. USERS TABLE (Global Authentication & Identity)
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    college_id BIGINT REFERENCES colleges(id) ON DELETE CASCADE,
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

-- 5. COLLEGE ADMINISTRATORS TABLE
CREATE TABLE IF NOT EXISTS college_admins (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    college_id BIGINT NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    department TEXT,
    designation TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. STUDENTS TABLE
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

-- 7. COURSES TABLE
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
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(college_id, code)
);

-- 7b. TRAINER ASSIGNMENTS TABLE
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

-- 8. COURSE MODULES TABLE
CREATE TABLE IF NOT EXISTS course_modules (
    id BIGSERIAL PRIMARY KEY,
    course_id BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. COURSE CONTENTS & LESSONS TABLE
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

-- 10. ENROLLMENTS TABLE (Unique per student & course)
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

-- 11. CONTENT PROGRESS TABLE
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

-- 12. ASSIGNMENTS TABLE
CREATE TABLE IF NOT EXISTS assignments (
    id BIGSERIAL PRIMARY KEY,
    course_id BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    module_id BIGINT REFERENCES course_modules(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    instructions TEXT,
    max_score REAL DEFAULT 100.0,
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. ASSIGNMENT SUBMISSIONS TABLE
CREATE TABLE IF NOT EXISTS assignment_submissions (
    id BIGSERIAL PRIMARY KEY,
    assignment_id BIGINT NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    submission_text TEXT,
    file_url TEXT,
    score REAL,
    feedback TEXT,
    graded_by BIGINT REFERENCES users(id),
    status TEXT DEFAULT 'submitted', -- submitted, graded, resubmit_requested
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    graded_at TIMESTAMPTZ,
    UNIQUE(assignment_id, student_id)
);

-- 14. ASSESSMENTS TABLE
CREATE TABLE IF NOT EXISTS assessments (
    id BIGSERIAL PRIMARY KEY,
    course_id BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    module_id BIGINT REFERENCES course_modules(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    assessment_type TEXT DEFAULT 'quiz', -- quiz, final_exam, mid_term, diagnostic
    duration_minutes INT DEFAULT 30,
    pass_percentage REAL DEFAULT 60.0,
    max_attempts INT DEFAULT 3,
    is_proctored BOOLEAN DEFAULT FALSE,
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. ASSESSMENT QUESTIONS TABLE
CREATE TABLE IF NOT EXISTS assessment_questions (
    id BIGSERIAL PRIMARY KEY,
    assessment_id BIGINT NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL DEFAULT 'multiple_choice', -- multiple_choice, true_false, code_output, short_answer
    options TEXT, -- JSON Array of option strings
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    points REAL DEFAULT 1.0,
    sort_order INT DEFAULT 0
);

-- 16. ASSESSMENT ATTEMPTS TABLE
CREATE TABLE IF NOT EXISTS assessment_attempts (
    id BIGSERIAL PRIMARY KEY,
    assessment_id BIGINT NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    attempt_number INT DEFAULT 1,
    score_percentage REAL DEFAULT 0.0,
    points_earned REAL DEFAULT 0.0,
    total_points REAL DEFAULT 0.0,
    is_passed BOOLEAN DEFAULT FALSE,
    answers_payload TEXT, -- JSON of user submitted answers
    started_at TIMESTAMPTZ DEFAULT NOW(),
    submitted_at TIMESTAMPTZ
);

-- 17. CERTIFICATES TABLE
CREATE TABLE IF NOT EXISTS certificates (
    id BIGSERIAL PRIMARY KEY,
    enrollment_id BIGINT NOT NULL UNIQUE REFERENCES enrollments(id) ON DELETE CASCADE,
    certificate_number TEXT NOT NULL UNIQUE,
    verification_hash TEXT NOT NULL UNIQUE,
    student_name TEXT NOT NULL,
    course_name TEXT NOT NULL,
    college_name TEXT NOT NULL,
    issued_date DATE DEFAULT CURRENT_DATE,
    grade TEXT,
    pdf_url TEXT,
    is_valid BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,
    college_id BIGINT REFERENCES colleges(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    link_url TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    college_id BIGINT REFERENCES colleges(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id BIGINT,
    details TEXT,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 20. PYTHON SANDBOX RUNS TABLE
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

-- 21. JETBOT SIMULATIONS TABLE
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

-- 22. ANNOUNCEMENTS & DISCUSSIONS
CREATE TABLE IF NOT EXISTS course_announcements (
    id BIGSERIAL PRIMARY KEY,
    course_id BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_by BIGINT REFERENCES users(id),
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

-- =====================================================================
-- PERFORMANCE INDEXES
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_college ON users(college_id);
CREATE INDEX IF NOT EXISTS idx_students_college_roll ON students(college_id, roll_number);
CREATE INDEX IF NOT EXISTS idx_courses_college ON courses(college_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student_course ON enrollments(student_id, course_id);
CREATE INDEX IF NOT EXISTS idx_progress_enrollment_content ON progress(enrollment_id, content_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_certificates_hash ON certificates(verification_hash);