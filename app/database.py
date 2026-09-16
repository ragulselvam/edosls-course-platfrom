import os
import sqlite3
import threading
from contextlib import contextmanager
from typing import Generator, List, Dict, Any, Optional
from app.config import DATABASE_PATH, DATABASE_URL, USE_POSTGRES

# Thread-local storage for DB connections in multi-threaded FastAPI
_local = threading.local()

# If using PostgreSQL / Supabase, import psycopg2
if USE_POSTGRES:
    try:
        import psycopg2
        from psycopg2 import pool
        from psycopg2.extras import RealDictCursor
    except ImportError:
        psycopg2 = None

_pg_pool = None

def get_pg_pool():
    global _pg_pool
    if _pg_pool is None:
        db_uri = DATABASE_URL
        if db_uri.startswith("postgres://"):
            db_uri = db_uri.replace("postgres://", "postgresql://", 1)
        _pg_pool = pool.ThreadedConnectionPool(minconn=1, maxconn=20, dsn=db_uri)
    return _pg_pool

def _translate_query_for_pg(query: str) -> str:
    """Translates SQLite ? parameter placeholders into PostgreSQL %s."""
    parts = []
    in_single = False
    in_double = False
    for char in query:
        if char == "'" and not in_double:
            in_single = not in_single
            parts.append(char)
        elif char == '"' and not in_single:
            in_double = not in_double
            parts.append(char)
        elif char == '?' and not in_single and not in_double:
            parts.append('%s')
        else:
            parts.append(char)
    return "".join(parts)

def get_connection():
    """Returns an active database connection (PostgreSQL / Supabase or SQLite)."""
    if USE_POSTGRES:
        if not hasattr(_local, "pg_conn") or _local.pg_conn is None or _local.pg_conn.closed:
            p = get_pg_pool()
            _local.pg_conn = p.getconn()
            _local.pg_conn.autocommit = False
        return _local.pg_conn
    else:
        if not hasattr(_local, "connection") or _local.connection is None:
            conn = sqlite3.connect(
                str(DATABASE_PATH),
                check_same_thread=False,
                timeout=30.0
            )
            conn.row_factory = sqlite3.Row
            conn.execute("PRAGMA foreign_keys = ON")
            conn.execute("PRAGMA journal_mode = WAL")
            conn.execute("PRAGMA synchronous = NORMAL")
            _local.connection = conn
        return _local.connection

@contextmanager
def get_db() -> Generator[Any, None, None]:
    """Context manager for DB transactions."""
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise

def query_one(query: str, params: tuple = ()) -> Optional[Dict[str, Any]]:
    """Helper to fetch a single row as a dictionary."""
    conn = get_connection()
    if USE_POSTGRES:
        pg_query = _translate_query_for_pg(query)
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(pg_query, params)
            row = cursor.fetchone()
            conn.commit()
            return dict(row) if row else None
    else:
        cursor = conn.cursor()
        cursor.execute(query, params)
        row = cursor.fetchone()
        return dict(row) if row else None

def query_all(query: str, params: tuple = ()) -> List[Dict[str, Any]]:
    """Helper to fetch all matching rows as a list of dictionaries."""
    conn = get_connection()
    if USE_POSTGRES:
        pg_query = _translate_query_for_pg(query)
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(pg_query, params)
            rows = cursor.fetchall()
            conn.commit()
            return [dict(r) for r in rows]
    else:
        cursor = conn.cursor()
        cursor.execute(query, params)
        rows = cursor.fetchall()
        return [dict(r) for r in rows]

def execute_query(query: str, params: tuple = ()) -> int:
    """Helper to execute INSERT/UPDATE/DELETE and return lastrowid or affected rows."""
    conn = get_connection()
    if USE_POSTGRES:
        pg_query = _translate_query_for_pg(query)
        is_insert = pg_query.strip().upper().startswith("INSERT")
        has_returning = "RETURNING" in pg_query.upper()
        if is_insert and not has_returning:
            pg_query = pg_query.rstrip().rstrip(";") + " RETURNING id;"
        
        with conn.cursor() as cursor:
            cursor.execute(pg_query, params)
            last_id = None
            if is_insert or has_returning:
                try:
                    res = cursor.fetchone()
                    if res:
                        last_id = res[0]
                except Exception:
                    pass
            conn.commit()
            return last_id if last_id is not None else cursor.rowcount
    else:
        cursor = conn.cursor()
        cursor.execute(query, params)
        conn.commit()
        return cursor.lastrowid

def execute_many(query: str, param_list: List[tuple]) -> None:
    """Helper to execute multiple parameter sets."""
    conn = get_connection()
    if USE_POSTGRES:
        pg_query = _translate_query_for_pg(query)
        with conn.cursor() as cursor:
            cursor.executemany(pg_query, param_list)
            conn.commit()
    else:
        cursor = conn.cursor()
        cursor.executemany(query, param_list)
        conn.commit()

def init_db():
    """Create all relational tables and indexes if they do not exist."""
    schema_sql = """
    -- Colleges Table
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

    -- Roles Table
    CREATE TABLE IF NOT EXISTS roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT
    );

    -- Users Table
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        college_id INTEGER REFERENCES colleges(id) ON DELETE SET NULL,
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

    -- College Admins Table
    CREATE TABLE IF NOT EXISTS college_admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        college_id INTEGER NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
        department TEXT,
        designation TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Students Table
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

    -- Courses Table
    CREATE TABLE IF NOT EXISTS courses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        college_id INTEGER REFERENCES colleges(id) ON DELETE CASCADE,
        trainer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
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

    -- Trainer Assignments Table
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

    -- Course Modules Table
    CREATE TABLE IF NOT EXISTS course_modules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Course Contents Table
    CREATE TABLE IF NOT EXISTS course_contents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        module_id INTEGER NOT NULL REFERENCES course_modules(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        content_type TEXT NOT NULL, -- video, pdf, document, image, link, coding, assignment, quiz, assessment, jetbot
        content_data TEXT, -- markdown, json payload, or text description
        file_url TEXT,
        duration_minutes INTEGER DEFAULT 10,
        sort_order INTEGER NOT NULL DEFAULT 0,
        is_mandatory INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Enrollments Table
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

    -- Content Progress Table
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

    -- Assignments Table
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

    -- Quizzes Table
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

    -- Assessments Table
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

    -- Questions Table
    CREATE TABLE IF NOT EXISTS questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        assessment_id INTEGER REFERENCES assessments(id) ON DELETE CASCADE,
        quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
        question_text TEXT NOT NULL,
        question_type TEXT NOT NULL DEFAULT 'mcq', -- mcq, multi_select, coding, file_upload, practical
        options_json TEXT, -- JSON array of strings
        correct_answer_json TEXT, -- JSON array of correct indices or strings
        code_template TEXT, -- Starting code snippet
        test_cases_json TEXT, -- JSON list of {input, expected_output, is_hidden}
        points REAL DEFAULT 10.0,
        sort_order INTEGER DEFAULT 0
    );

    -- Submissions Table
    CREATE TABLE IF NOT EXISTS submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        college_id INTEGER NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
        student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        assessment_id INTEGER REFERENCES assessments(id) ON DELETE SET NULL,
        quiz_id INTEGER REFERENCES quizzes(id) ON DELETE SET NULL,
        assignment_id INTEGER REFERENCES assignments(id) ON DELETE SET NULL,
        attempt_number INTEGER DEFAULT 1,
        answers_json TEXT, -- JSON record of question_id -> answers
        code_submission TEXT,
        file_urls_json TEXT, -- JSON array of uploaded file urls (e.g. jupyter notebook, weights, dataset)
        status TEXT DEFAULT 'submitted', -- submitted, evaluating, evaluated
        submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Results Table
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

    -- Certificates Table
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

    -- Notifications Table
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

    -- Audit Logs Table
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

    -- System Settings & State Flags
    CREATE TABLE IF NOT EXISTS system_settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Indexes for High Performance Querying & Strict Tenant Isolation
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
    """
    conn = get_connection()
    if not USE_POSTGRES:
        conn.executescript(schema_sql)
        conn.commit()

    # Auto-migration for trainer_id on courses
    try:
        if USE_POSTGRES:
            with conn.cursor() as cur:
                cur.execute("ALTER TABLE courses ADD COLUMN IF NOT EXISTS trainer_id BIGINT REFERENCES users(id) ON DELETE SET NULL;")
                cur.execute("INSERT INTO roles (name, description) VALUES ('trainer', 'Course & Class Trainer / Instructor assigned by Super Admin') ON CONFLICT (name) DO NOTHING;")
                cur.execute("CREATE INDEX IF NOT EXISTS idx_courses_trainer ON courses(trainer_id);")
                cur.execute("CREATE INDEX IF NOT EXISTS idx_trainer_assignments_course ON trainer_assignments(course_id);")
                conn.commit()
        else:
            cur = conn.cursor()
            cur.execute("PRAGMA table_info(courses)")
            columns = [col[1] for col in cur.fetchall()]
            if "trainer_id" not in columns:
                cur.execute("ALTER TABLE courses ADD COLUMN trainer_id INTEGER REFERENCES users(id) ON DELETE SET NULL")
                conn.commit()
            cur.execute("INSERT OR IGNORE INTO roles (name, description) VALUES ('trainer', 'Course & Class Trainer / Instructor assigned by Super Admin')")
            cur.execute("CREATE INDEX IF NOT EXISTS idx_courses_trainer ON courses(trainer_id)")
            cur.execute("CREATE INDEX IF NOT EXISTS idx_trainer_assignments_course ON trainer_assignments(course_id)")
            conn.commit()
    except Exception as e:
        print(f"[init_db] Migration notice: {e}")