import json
import uuid
from datetime import datetime, date
from app.database import get_db, query_one, execute_query, init_db
from app.security import hash_password

def ensure_trainers_seeded():
    """Idempotently ensures the trainer role and demo trainer accounts exist."""
    default_pwd_hash = hash_password("Password@123")
    
    # 1. Ensure trainer role
    role_tr = query_one("SELECT id FROM roles WHERE name = 'trainer'")
    if not role_tr:
        execute_query("INSERT OR IGNORE INTO roles (name, description) VALUES ('trainer', 'Course & Class Trainer / Instructor')")
        role_tr = query_one("SELECT id FROM roles WHERE name = 'trainer'")
    role_tr_id = role_tr["id"] if role_tr else 3

    # 2. Get college IDs
    ait = query_one("SELECT id FROM colleges WHERE code = 'AIT'")
    svce = query_one("SELECT id FROM colleges WHERE code = 'SVCE'")
    mau = query_one("SELECT id FROM colleges WHERE code = 'MAU'")

    trainers_data = [
        {"college_id": ait["id"] if ait else None, "email": "john.doe@platform.edu", "first_name": "John", "last_name": "Doe", "phone": "+1-800-555-0144", "is_active": 1},
        {"college_id": svce["id"] if svce else None, "email": "sarah.connor@platform.edu", "first_name": "Sarah", "last_name": "Connor", "phone": "+1-800-555-0145", "is_active": 1},
        {"college_id": mau["id"] if mau else None, "email": "dr.arun@platform.edu", "first_name": "Dr. Arun", "last_name": "Dass", "phone": "+1-800-555-0146", "is_active": 1},
        {"college_id": ait["id"] if ait else None, "email": "inactive.trainer@platform.edu", "first_name": "Alex", "last_name": "Miller", "phone": "+1-800-555-0147", "is_active": 0},
    ]

    for tr in trainers_data:
        existing = query_one("SELECT id FROM users WHERE email = ?", (tr["email"],))
        if not existing:
            execute_query(
                "INSERT INTO users (college_id, role_id, email, password_hash, first_name, last_name, phone, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (tr["college_id"], role_tr_id, tr["email"], default_pwd_hash, tr["first_name"], tr["last_name"], tr["phone"], tr["is_active"])
            )

def seed_database(force: bool = False):
    """Populates the database with realistic seed data only once on fresh setup."""
    init_db()
    if force:
        tables = [
            "trainer_assignments", "audit_logs", "notifications", "certificates", "results", "submissions",
            "questions", "assessments", "quizzes", "assignments", "progress",
            "enrollments", "course_contents", "course_modules", "courses",
            "students", "college_admins", "users", "roles", "colleges", "system_settings"
        ]
        for t in tables:
            try:
                execute_query(f"DELETE FROM {t}")
            except Exception:
                pass
    else:
        # Check persistent system setting flag so user modifications and deleted/added colleges are NEVER overwritten!
        seeded_meta = query_one("SELECT value FROM system_settings WHERE key = 'initial_seed_completed'")
        if seeded_meta and seeded_meta["value"] == "1":
            ensure_trainers_seeded()
            print("[Database] Database already initialized. Preserving all user data and modifications.")
            return
        
        # Fallback check: if any roles or colleges exist, do not overwrite
        roles_count = query_one("SELECT count(*) as cnt FROM roles")
        if roles_count and roles_count["cnt"] > 0:
            execute_query("INSERT OR REPLACE INTO system_settings (key, value) VALUES ('initial_seed_completed', '1')")
            ensure_trainers_seeded()
            print("[Database] Existing data found. Preserving all user data and modifications.")
            return

    print("[Database] Seeding multi-tenant training platform...")
    default_pwd_hash = hash_password("Password@123")
    
    # 1. Insert Roles
    role_super = execute_query("INSERT INTO roles (name, description) VALUES ('super_admin', 'Global Platform Super Administrator')")
    role_admin = execute_query("INSERT INTO roles (name, description) VALUES ('college_admin', 'College Organization Administrator')")
    role_trainer = execute_query("INSERT INTO roles (name, description) VALUES ('trainer', 'Course & Class Trainer / Instructor')")
    role_student = execute_query("INSERT INTO roles (name, description) VALUES ('student', 'College Enrolled Student')")

    # 2. Insert 3 Colleges
    colleges_data = [
        {
            "name": "Apex Institute of Technology",
            "code": "AIT",
            "domain": "ait.edu",
            "logo_url": "https://images.unsplash.com/photo-1562774053-701939374585?w=120&auto=format&fit=crop&q=80",
            "address": "100 Innovation Boulevard, Tech District",
            "contact_email": "dean@ait.edu"
        },
        {
            "name": "Silicon Valley College of Engineering",
            "code": "SVCE",
            "domain": "svce.edu",
            "logo_url": "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=120&auto=format&fit=crop&q=80",
            "address": "450 Silicon Avenue, Enterprise Hub",
            "contact_email": "admin@svce.edu"
        },
        {
            "name": "Metro Autonomous University",
            "code": "MAU",
            "domain": "mau.edu",
            "logo_url": "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=120&auto=format&fit=crop&q=80",
            "address": "780 Metro Gateway, Academic Zone",
            "contact_email": "support@mau.edu"
        }
    ]
    
    col_ids = {}
    for col in colleges_data:
        cid = execute_query(
            "INSERT INTO colleges (name, code, domain, logo_url, address, contact_email, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)",
            (col["name"], col["code"], col["domain"], col["logo_url"], col["address"], col["contact_email"])
        )
        col_ids[col["code"]] = cid

    # 3. Insert Super Admin
    super_user_id = execute_query(
        """
        INSERT INTO users (college_id, role_id, email, password_hash, first_name, last_name, phone, is_active)
        VALUES (NULL, ?, 'superadmin@platform.edu', ?, 'System', 'SuperAdmin', '+1-800-555-0199', 1)
        """,
        (role_super, default_pwd_hash)
    )

    # 4. Insert College Admins
    admins_data = [
        {
            "college_code": "AIT",
            "email": "admin@ait.edu",
            "first_name": "Dr. Evelyn",
            "last_name": "Carter",
            "department": "Artificial Intelligence & Robotics",
            "designation": "Head of Academic Programs"
        },
        {
            "college_code": "SVCE",
            "email": "admin@svce.edu",
            "first_name": "Prof. Marcus",
            "last_name": "Vance",
            "department": "Computer Science & Engineering",
            "designation": "Dean of Computing"
        },
        {
            "college_code": "MAU",
            "email": "admin@mau.edu",
            "first_name": "Dr. Samantha",
            "last_name": "Reed",
            "department": "Autonomous Systems",
            "designation": "Director of Technology Training"
        }
    ]
    
    for adm in admins_data:
        cid = col_ids[adm["college_code"]]
        uid = execute_query(
            "INSERT INTO users (college_id, role_id, email, password_hash, first_name, last_name, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)",
            (cid, role_admin, adm["email"], default_pwd_hash, adm["first_name"], adm["last_name"])
        )
        execute_query(
            "INSERT INTO college_admins (user_id, college_id, department, designation) VALUES (?, ?, ?, ?)",
            (uid, cid, adm["department"], adm["designation"])
        )

    # 5. Insert Students
    students_data = [
        # AIT Students
        {"college_code": "AIT", "email": "student1@ait.edu", "first_name": "Alex", "last_name": "Rivera", "roll": "AIT-2024-001", "dept": "AI & Data Science", "year": 3},
        {"college_code": "AIT", "email": "student2@ait.edu", "first_name": "Sophia", "last_name": "Chen", "roll": "AIT-2024-002", "dept": "Robotics & Automation", "year": 2},
        {"college_code": "AIT", "email": "student3@ait.edu", "first_name": "Liam", "last_name": "Patel", "roll": "AIT-2024-003", "dept": "Computer Science", "year": 4},
        # SVCE Students
        {"college_code": "SVCE", "email": "student1@svce.edu", "first_name": "Jordan", "last_name": "Lee", "roll": "SVCE-CS-101", "dept": "Cloud Computing", "year": 3},
        {"college_code": "SVCE", "email": "student2@svce.edu", "first_name": "Maya", "last_name": "Sharma", "roll": "SVCE-CS-102", "dept": "Full Stack Development", "year": 2},
        # MAU Students
        {"college_code": "MAU", "email": "student1@mau.edu", "first_name": "Noah", "last_name": "Kim", "roll": "MAU-ENG-501", "dept": "Autonomous Vehicles", "year": 4},
        {"college_code": "MAU", "email": "student2@mau.edu", "first_name": "Emma", "last_name": "Wilson", "roll": "MAU-ENG-502", "dept": "Machine Learning", "year": 1}
    ]
    
    student_records = {} # email -> {student_id, user_id, college_id}
    for st in students_data:
        cid = col_ids[st["college_code"]]
        uid = execute_query(
            "INSERT INTO users (college_id, role_id, email, password_hash, first_name, last_name, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)",
            (cid, role_student, st["email"], default_pwd_hash, st["first_name"], st["last_name"])
        )
        sid = execute_query(
            "INSERT INTO students (user_id, college_id, roll_number, department, year_of_study, batch) VALUES (?, ?, ?, ?, ?, '2024-2028')",
            (uid, cid, st["roll"], st["dept"], st["year"])
        )
        student_records[st["email"]] = {"student_id": sid, "user_id": uid, "college_id": cid}

    # 5b. Insert Trainers
    trainers_seed = [
        {"college_code": "AIT", "email": "john.doe@platform.edu", "first_name": "John", "last_name": "Doe", "phone": "+1-800-555-0144", "is_active": 1},
        {"college_code": "SVCE", "email": "sarah.connor@platform.edu", "first_name": "Sarah", "last_name": "Connor", "phone": "+1-800-555-0145", "is_active": 1},
        {"college_code": "MAU", "email": "dr.arun@platform.edu", "first_name": "Dr. Arun", "last_name": "Dass", "phone": "+1-800-555-0146", "is_active": 1},
        {"college_code": "AIT", "email": "inactive.trainer@platform.edu", "first_name": "Alex", "last_name": "Miller", "phone": "+1-800-555-0147", "is_active": 0},
    ]
    trainer_uids = {}
    for tr in trainers_seed:
        cid = col_ids[tr["college_code"]]
        t_uid = execute_query(
            "INSERT INTO users (college_id, role_id, email, password_hash, first_name, last_name, phone, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (cid, role_trainer, tr["email"], default_pwd_hash, tr["first_name"], tr["last_name"], tr["phone"], tr["is_active"])
        )
        trainer_uids[tr["email"]] = t_uid

    # 6. Insert Rich Courses
    # Course 1: Autonomous Robotics & NVIDIA JetBot AI (AIT)
    ait_id = col_ids["AIT"]
    john_doe_id = trainer_uids.get("john.doe@platform.edu")
    c1_id = execute_query(
        """
        INSERT INTO courses (
            college_id, trainer_id, title, code, description, category, level, duration,
            instructor_name, thumbnail_url, learning_objectives, enrollment_type,
            visibility, passing_percentage, certificate_enabled, is_published, status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', 'college', 70.0, 1, 1, 'published')
        """,
        (
            ait_id,
            john_doe_id,
            "Autonomous Robotics & NVIDIA JetBot AI",
            "AIT-ROB-401",
            "Comprehensive hands-on training on NVIDIA JetBot, Jetson Orin/Nano architectures, deep learning vision pipelines, OpenCV, YOLO obstacle detection, and autonomous navigation algorithms.",
            "Artificial Intelligence & Robotics",
            "Intermediate",
            "6 Weeks",
            "John Doe",
            "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600&auto=format&fit=crop&q=80",
            "1. Master NVIDIA Jetson hardware interfaces (I2C, GPIO, CSI Camera)\n2. Deploy PyTorch deep learning models on Edge GPUs\n3. Implement real-time collision avoidance with YOLOv8\n4. Calibrate motor PID controllers for trajectory tracking"
        )
    )

    if john_doe_id:
        execute_query(
            "INSERT INTO trainer_assignments (course_id, trainer_id, previous_trainer_id, assigned_by, action, notes) VALUES (?, ?, NULL, ?, 'assigned', 'Initial demo class trainer assignment')",
            (c1_id, john_doe_id, super_user_id)
        )

    
    # Modules & Content for Course 1
    m1_id = execute_query(
        "INSERT INTO course_modules (course_id, title, description, sort_order) VALUES (?, ?, ?, 0)",
        (c1_id, "Module 1: Jetson Architecture & Differential Drive", "Hardware setup and motor controller programming")
    )
    
    cnt1_1 = execute_query(
        """
        INSERT INTO course_contents (module_id, title, content_type, content_data, duration_minutes, sort_order, is_mandatory)
        VALUES (?, ?, 'video', ?, 20, 0, 1)
        """,
        (
            m1_id,
            "JetBot Hardware Architecture & Jetson Nano Pinout",
            "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
        )
    )
    
    cnt1_2 = execute_query(
        """
        INSERT INTO course_contents (module_id, title, content_type, content_data, duration_minutes, sort_order, is_mandatory)
        VALUES (?, ?, 'document', ?, 15, 1, 1)
        """,
        (
            m1_id,
            "Jetson Linux, Motor Drivers & I2C Bus Wiring Guide",
            """# NVIDIA JetBot Architecture & Hardware Overview

The **NVIDIA JetBot** is an open-source AI robotics platform powered by the NVIDIA Jetson Nano / Orin developer kit.

### Key Hardware Specifications:
- **Processor:** Quad-core ARM A57 + 128-core Maxwell GPU / Ampere Architecture
- **Camera:** Sony IMX219 8MP CSI Camera with 160° Field of View
- **Motor Driver:** Adafruit PCA9685 16-Channel 12-bit PWM I2C motor controller
- **Sensors:** MPU-6050 6-DOF IMU, Wheel Encoders

### Motor Control Formula:
Differential steering computes independent wheel velocities:
```python
v_left = linear_velocity - (angular_velocity * track_width / 2.0)
v_right = linear_velocity + (angular_velocity * track_width / 2.0)
```
"""
        )
    )
    
    cnt1_3 = execute_query(
        """
        INSERT INTO course_contents (module_id, title, content_type, content_data, duration_minutes, sort_order, is_mandatory)
        VALUES (?, ?, 'coding', ?, 25, 2, 1)
        """,
        (
            m1_id,
            "Coding Lab: Differential Drive Velocity Calculator",
            json.dumps({
                "language": "python",
                "instructions": "Write a Python function `compute_motor_speeds(v, omega, width=0.1)` that takes linear velocity `v` (m/s), angular velocity `omega` (rad/s), and robot track width `width`, then prints `(v_left, v_right)` rounded to 2 decimal places.",
                "starter_code": """def compute_motor_speeds(v, omega, width=0.1):
    # Calculate differential speeds
    v_left = v - (omega * width / 2.0)
    v_right = v + (omega * width / 2.0)
    print(f"{round(v_left, 2)}, {round(v_right, 2)}")

import sys
if __name__ == '__main__':
    lines = sys.stdin.read().strip().split()
    if len(lines) >= 2:
        compute_motor_speeds(float(lines[0]), float(lines[1]))
""",
                "test_cases": [
                    {"input": "1.0 0.0", "expected_output": "1.0, 1.0"},
                    {"input": "0.5 2.0", "expected_output": "0.4, 0.6"},
                    {"input": "0.0 4.0", "expected_output": "-0.2, 0.2"}
                ]
            })
        )
    )

    m2_id = execute_query(
        "INSERT INTO course_modules (course_id, title, description, sort_order) VALUES (?, ?, ?, 1)",
        (c1_id, "Module 2: Computer Vision & JetBot AI Navigation", "Real-time perception and obstacle avoidance")
    )
    
    cnt1_4 = execute_query(
        """
        INSERT INTO course_contents (module_id, title, content_type, content_data, duration_minutes, sort_order, is_mandatory)
        VALUES (?, ?, 'jetbot', ?, 35, 0, 1)
        """,
        (
            m2_id,
            "JetBot Practical AI Simulation: Collision Avoidance & YOLO Vision",
            json.dumps({
                "task_title": "Autonomous Collision Avoidance & Object Detection",
                "instructions": "Implement the JetBot control loop in Python. Use the Camera stream to detect obstacles, run model inference, and control the left and right motor speeds.",
                "starter_script": """from jetbot import Robot, Camera
import torch
import cv2

robot = Robot()
camera = Camera.instance(width=224, height=224)

# Load lightweight PyTorch collision avoidance model
model = torch.load('model_weights.pth')
model.eval()

def process_frame(change):
    image = change['new']
    # Preprocess frame and run forward pass
    tensor = preprocess(image)
    prediction = model(tensor)
    
    # If blocked, steer away; otherwise drive forward
    if prediction['obstacle_prob'] > 0.6:
        robot.left = -0.3
        robot.right = 0.3
    else:
        robot.left = 0.4
        robot.right = 0.4

camera.observe(process_frame, names='value')
"""
            })
        )
    )

    # Assessment for Course 1
    assess1_id = execute_query(
        """
        INSERT INTO assessments (college_id, course_id, title, description, assessment_type, time_limit_minutes, passing_percentage, max_attempts, is_published)
        VALUES (?, ?, 'JetBot AI & Robotics Certification Assessment', 'Final theoretical and practical assessment covering JetBot hardware, PyTorch inference, and control systems.', 'hybrid', 30, 70.0, 3, 1)
        """,
        (ait_id, c1_id)
    )
    
    # Question 1: MCQ
    execute_query(
        """
        INSERT INTO questions (assessment_id, question_text, question_type, options_json, correct_answer_json, points, sort_order)
        VALUES (?, ?, 'mcq', ?, ?, 25.0, 0)
        """,
        (
            assess1_id,
            "What interface does the NVIDIA JetBot use to communicate with the PCA9685 motor driver board?",
            json.dumps(["SPI Bus", "I2C Bus", "UART Serial", "CAN Bus"]),
            json.dumps(["1"]), # Index 1: I2C Bus
        )
    )
    
    # Question 2: Multi-select
    execute_query(
        """
        INSERT INTO questions (assessment_id, question_text, question_type, options_json, correct_answer_json, points, sort_order)
        VALUES (?, ?, 'multi_select', ?, ?, 25.0, 1)
        """,
        (
            assess1_id,
            "Which of the following neural network optimizations are supported on Jetson edge devices? (Select all that apply)",
            json.dumps(["NVIDIA TensorRT FP16/INT8 precision", "CUDA Core stream parallelism", "Direct x86 Instruction Set Translation", "DeepStream Video Analytics Pipeline"]),
            json.dumps(["0", "1", "3"]),
        )
    )
    
    # Question 3: Coding
    execute_query(
        """
        INSERT INTO questions (assessment_id, question_text, question_type, code_template, test_cases_json, points, sort_order)
        VALUES (?, ?, 'coding', ?, ?, 50.0, 2)
        """,
        (
            assess1_id,
            "Write a Python script that reads an obstacle confidence score (between 0.0 and 1.0) and prints 'STOP' if confidence >= 0.8, 'SLOW_TURN' if confidence >= 0.5, and 'FORWARD' otherwise.",
            """import sys

def main():
    val = float(sys.stdin.read().strip())
    if val >= 0.8:
        print("STOP")
    elif val >= 0.5:
        print("SLOW_TURN")
    else:
        print("FORWARD")

if __name__ == '__main__':
    main()
""",
            json.dumps([
                {"input": "0.92", "expected_output": "STOP"},
                {"input": "0.65", "expected_output": "SLOW_TURN"},
                {"input": "0.20", "expected_output": "FORWARD"}
            ])
        )
    )

    # Course 2: Applied Deep Learning & Computer Vision (AIT)
    c2_id = execute_query(
        """
        INSERT INTO courses (
            college_id, title, code, description, category, level, duration,
            instructor_name, thumbnail_url, learning_objectives, enrollment_type,
            visibility, passing_percentage, certificate_enabled, is_published, status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', 'college', 65.0, 1, 1, 'published')
        """,
        (
            ait_id,
            "Applied Deep Learning & Computer Vision with PyTorch",
            "AIT-AI-301",
            "Build CNNs, Vision Transformers, and object detectors with PyTorch and deploy them for production applications.",
            "Artificial Intelligence",
            "Advanced",
            "8 Weeks",
            "Dr. Evelyn Carter",
            "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=600&auto=format&fit=crop&q=80",
            "Master modern convolutional backbones, ResNet, EfficientNet, Transfer Learning, and ONNX deployment."
        )
    )
    
    m_c2 = execute_query("INSERT INTO course_modules (course_id, title, description, sort_order) VALUES (?, ?, ?, 0)", (c2_id, "Module 1: Tensors, Backprop & PyTorch", "Foundations of neural computation"))
    execute_query("INSERT INTO course_contents (module_id, title, content_type, content_data, duration_minutes, sort_order, is_mandatory) VALUES (?, ?, 'document', ?, 15, 0, 1)",
                  (m_c2, "PyTorch Tensors, Autograd and GPU acceleration", "# Deep Learning Fundamentals\nUnderstand tensor operations and computational graphs."))

    # Course 3: Full-Stack Enterprise Engineering (SVCE)
    svce_id = col_ids["SVCE"]
    c3_id = execute_query(
        """
        INSERT INTO courses (
            college_id, title, code, description, category, level, duration,
            instructor_name, thumbnail_url, learning_objectives, enrollment_type,
            visibility, passing_percentage, certificate_enabled, is_published, status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', 'college', 60.0, 1, 1, 'published')
        """,
        (
            svce_id,
            "Full-Stack Enterprise Engineering with Python & Microservices",
            "SVCE-FS-202",
            "Master scalable backend REST APIs, authentication security, asynchronous event queues, and modern frontend design.",
            "Computer Science",
            "Beginner",
            "10 Weeks",
            "Prof. Marcus Vance",
            "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80",
            "Learn RESTful design, relational indexing, caching, and frontend component architecture."
        )
    )
    
    m_c3 = execute_query("INSERT INTO course_modules (course_id, title, description, sort_order) VALUES (?, ?, ?, 0)", (c3_id, "Module 1: REST API Design & Security", "FastAPI, JWT & RBAC"))
    execute_query("INSERT INTO course_contents (module_id, title, content_type, content_data, duration_minutes, sort_order, is_mandatory) VALUES (?, ?, 'document', ?, 20, 0, 1)",
                  (m_c3, "Building Secure RESTful Microservices", "# Enterprise Microservices\nDesigning clean API endpoints and secure authentication."))

    # Course 4: Cloud Native Microservices & Docker Architecture (SVCE)
    c4_id = execute_query(
        """
        INSERT INTO courses (
            college_id, title, code, description, category, level, duration,
            instructor_name, thumbnail_url, learning_objectives, enrollment_type,
            visibility, passing_percentage, certificate_enabled, is_published, status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', 'college', 60.0, 1, 1, 'published')
        """,
        (
            svce_id,
            "Cloud Native Architecture & Docker Containers",
            "SVCE-CLD-304",
            "Containerize microservices, orchestrate with Docker Compose and Kubernetes, and implement CI/CD pipelines.",
            "Cloud Computing",
            "Intermediate",
            "6 Weeks",
            "Prof. Marcus Vance",
            "https://images.unsplash.com/photo-1607799279861-4dd421887fb3?w=600&auto=format&fit=crop&q=80",
            "Container networking, persistent volumes, multi-stage builds, and deployment security."
        )
    )
    
    # Course 5: Data Structures & Algorithms in Python (MAU)
    mau_id = col_ids["MAU"]
    c5_id = execute_query(
        """
        INSERT INTO courses (
            college_id, title, code, description, category, level, duration,
            instructor_name, thumbnail_url, learning_objectives, enrollment_type,
            visibility, passing_percentage, certificate_enabled, is_published, status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', 'college', 70.0, 1, 1, 'published')
        """,
        (
            mau_id,
            "Data Structures, Algorithms & Robotics Kinematics",
            "MAU-DSA-101",
            "Foundational algorithm analysis, graph search for autonomous pathfinding (A*, Dijkstra), and kinematic tree transforms.",
            "Engineering & Computer Science",
            "Intermediate",
            "8 Weeks",
            "Dr. Samantha Reed",
            "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&auto=format&fit=crop&q=80",
            "Graph algorithms, dynamic programming, priority queues, and path planners."
        )
    )

    # 7. Seed Sample Enrollments & Completed Certificate for AIT Student 1 (Alex Rivera)
    alex_info = student_records["student1@ait.edu"]
    e1_id = execute_query(
        """
        INSERT INTO enrollments (college_id, student_id, course_id, status, progress_percentage, final_grade, enrolled_at, completed_at)
        VALUES (?, ?, ?, 'completed', 100.0, 'A+', '2026-08-01 09:00:00', '2026-08-20 16:30:00')
        """,
        (ait_id, alex_info["student_id"], c1_id)
    )
    
    # Seed Progress items for Alex
    execute_query("INSERT INTO progress (enrollment_id, content_id, is_completed, time_spent_seconds) VALUES (?, ?, 1, 1200)", (e1_id, cnt1_1))
    execute_query("INSERT INTO progress (enrollment_id, content_id, is_completed, time_spent_seconds) VALUES (?, ?, 1, 900)", (e1_id, cnt1_2))
    execute_query("INSERT INTO progress (enrollment_id, content_id, is_completed, time_spent_seconds) VALUES (?, ?, 1, 1500)", (e1_id, cnt1_3))
    execute_query("INSERT INTO progress (enrollment_id, content_id, is_completed, time_spent_seconds) VALUES (?, ?, 1, 2100)", (e1_id, cnt1_4))

    # Seed Submission & Result for Alex
    sub1_id = execute_query(
        """
        INSERT INTO submissions (college_id, student_id, assessment_id, attempt_number, answers_json, code_submission, status)
        VALUES (?, ?, ?, 1, ?, ?, 'evaluated')
        """,
        (
            ait_id,
            alex_info["student_id"],
            assess1_id,
            json.dumps({"1": "1", "2": ["0", "1", "3"]}),
            "print('STOP')"
        )
    )
    
    execute_query(
        """
        INSERT INTO results (submission_id, student_id, assessment_id, score, max_score, percentage, passed, feedback)
        VALUES (?, ?, ?, 100.0, 100.0, 100.0, 1, 'Outstanding performance in JetBot robotics evaluation.')
        """,
        (sub1_id, alex_info["student_id"], assess1_id)
    )

    # Seed Verifiable Certificate for Alex
    cert_code_alex = "CERT-AIT-401-98F27A"
    execute_query(
        """
        INSERT INTO certificates (
            certificate_code, college_id, student_id, course_id, enrollment_id,
            issue_date, qr_code_data, signature_name, signature_title
        )
        VALUES (?, ?, ?, ?, ?, '2026-08-20', ?, 'Dr. Evelyn Carter', 'Head of AI & Robotics')
        """,
        (
            cert_code_alex,
            ait_id,
            alex_info["student_id"],
            c1_id,
            e1_id,
            f"https://verify.platform.edu/certificates/{cert_code_alex}"
        )
    )

    # Seed In-Progress Enrollment for AIT Student 2 (Sophia Chen)
    sophia_info = student_records["student2@ait.edu"]
    e2_id = execute_query(
        """
        INSERT INTO enrollments (college_id, student_id, course_id, status, progress_percentage, enrolled_at)
        VALUES (?, ?, ?, 'in_progress', 50.0, '2026-08-15 11:00:00')
        """,
        (ait_id, sophia_info["student_id"], c1_id)
    )
    execute_query("INSERT INTO progress (enrollment_id, content_id, is_completed, time_spent_seconds) VALUES (?, ?, 1, 1100)", (e2_id, cnt1_1))
    execute_query("INSERT INTO progress (enrollment_id, content_id, is_completed, time_spent_seconds) VALUES (?, ?, 1, 850)", (e2_id, cnt1_2))

    # Seed Enrollment for SVCE Student 1 (Jordan Lee)
    jordan_info = student_records["student1@svce.edu"]
    execute_query(
        """
        INSERT INTO enrollments (college_id, student_id, course_id, status, progress_percentage, enrolled_at)
        VALUES (?, ?, ?, 'in_progress', 25.0, '2026-08-18 14:00:00')
        """,
        (svce_id, jordan_info["student_id"], c3_id)
    )

    # Seed Sample Notifications
    execute_query(
        """
        INSERT INTO notifications (college_id, user_id, title, message, type, link_url)
        VALUES (?, ?, '🎉 Certificate Earned: Autonomous Robotics & NVIDIA JetBot AI', 'Your verified completion certificate is ready for download and verification.', 'certificate', '/certificates')
        """,
        (ait_id, alex_info["user_id"])
    )
    
    execute_query(
        """
        INSERT INTO notifications (college_id, user_id, title, message, type, link_url)
        VALUES (?, NULL, 'Welcome to the Fall 2026 AI Training Cohort', 'Explore available courses in Robotics, AI, and Full-Stack Engineering.', 'system', '/courses')
        """,
        (ait_id,)
    )

    execute_query("INSERT OR REPLACE INTO system_settings (key, value) VALUES ('initial_seed_completed', '1')")
    print("[Database] Successfully seeded multi-tenant platform with 3 colleges, courses, modules, assessments, and student records.")

if __name__ == "__main__":
    seed_database()
