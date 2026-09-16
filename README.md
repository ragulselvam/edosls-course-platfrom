# Multi-College Autonomous Robotics & AI Learning Platform

An enterprise multi-tenant training and assessment platform with isolated institutional governance, interactive Python 3.12 coding sandboxes, 2D NVIDIA JetBot robotics simulation, timed proctored examinations, and verifiable cryptographic QR certificates.

---

## 🏛️ Monorepo Architecture

```
platform/
├── app/                           # FastAPI REST Backend (Port 8000)
│   ├── main.py                    # FastAPI application entrypoint & CORS
│   ├── database.py                # Database connection & seed initializer
│   ├── models.py                  # Pydantic validation models
│   ├── security.py                # JWT tokens & Bcrypt password hashing
│   ├── middleware.py              # Tenant isolation & role authorization
│   └── routers/                   # 17 REST API routers
│       ├── auth.py, colleges.py, admins.py, students.py, courses.py,
│       ├── modules.py, content.py, enrollments.py, progress.py,
│       ├── assignments.py, assessments.py, results.py, certificates.py,
│       └── notifications.py, reports.py, files.py, sandbox.py
│
└── frontend/                      # Next.js 15+ App Router Frontend (Port 3000)
    ├── next.config.ts             # API proxy rewrites to FastAPI backend
    ├── tailwind.config.ts         # Luxury Design System tokens
    └── src/
        ├── app/                   # App Router (29 Routes)
        │   ├── page.tsx           # SaaS Landing Page
        │   ├── login/page.tsx     # Multi-Tenant Login Portal
        │   ├── verify/            # Public QR Certificate Verification
        │   ├── (dashboard)/
        │   │   ├── super-admin/   # Global Institutional Governance
        │   │   ├── college-admin/ # Campus Dean & Department Portal
        │   │   ├── student/       # Learning Center & Exam Runner
        │   │   └── trainer/       # Faculty Class Allocation Portal
        ├── components/
        │   ├── layout/            # Sidebar, TopNavbar, DashboardLayout
        │   ├── ui/                # Modal, ConfirmModal
        │   ├── sandbox/           # Live Python 3.12 CodeEditor Widget
        │   └── robotics/          # 2D JetBot Physics Canvas Simulator
        ├── context/               # AuthContext, ToastContext, ThemeContext
        ├── lib/                   # api.ts (Centralized Type-Safe API Client)
        └── types/                 # TypeScript interfaces & types
```

---

## 🌟 Key Architecture & Highlights

- **Multi-Tenant Data Isolation**: Strict row-level `college_id` authorization across database queries and middleware. Students and Admins belonging to College A cannot access or modify College B records.
- **Portals**:
  1. **Super Admin Console**: Global college management, tenant status toggles, institutional admin assignment, global course studio with 3-step builder, trainer allocations, and immutable audit logs.
  2. **College Admin Hub**: Campus KPIs, student management (single add + bulk CSV import with error logs), curriculum tracks, timed examination studio with MCQ & coding question banks, and grading center.
  3. **Student Learning Center**: Course catalog with 1-click self-enrollment, "My Courses" hub, interactive course player with syllabus drawer, live **Python 3.12 execution sandbox**, and **2D NVIDIA JetBot robotics physics simulator**.
  4. **Faculty Trainer Portal**: Allocated class rosters, student submissions review, and live sandbox supervision.
- **Timed Assessment Runner**: Live proctored countdown timer, question index matrix, MCQ selector, code editor with autograding test suites, and celebratory completion confetti.
- **Verifiable Certificate System**: Cryptographically verifiable Certificate ID with dynamic QR code validation and public lookup endpoint (`/verify/{certificate_code}`) requiring no login.

---

## 🔑 Pre-Seeded Demo Credentials

All accounts use default password: `Password@123`

| Role | Organization / College | Email | Primary Responsibilities |
| :--- | :--- | :--- | :--- |
| **Super Admin** | Platform Governance | `superadmin@platform.edu` | Global colleges, admins, curriculum, and audit logs |
| **College Admin** | Apex Institute of Tech (AIT) | `admin@ait.edu` | AI & Robotics Department Admin |
| **College Admin** | Silicon Valley College (SVCE) | `admin@svce.edu` | Computer Science & Cloud Admin |
| **College Admin** | Metro Autonomous Univ (MAU) | `admin@mau.edu` | Engineering & Autonomous Systems Admin |
| **Faculty Trainer** | Platform Global Faculty | `john.doe@platform.edu` | Class Lead Instructor |
| **Student** | Apex Institute of Tech (AIT) | `student1@ait.edu` | Alex Rivera (JetBot Course Done + Certificate) |
| **Student** | Apex Institute of Tech (AIT) | `student2@ait.edu` | Sophia Chen (In progress) |
| **Student** | Silicon Valley College (SVCE) | `student1@svce.edu` | Jordan Lee (Cloud Computing Cohort) |

---

## 🚀 Quick Start Guide (Local Setup)

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 2. Backend Setup & Run (FastAPI)
```bash
# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI backend on port 8000
PYTHONPATH=. python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation available at: **`http://localhost:8000/api/docs`**

### 3. Frontend Setup & Run (Next.js)
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies (already initialized)
npm install

# Start Next.js development server on port 3000
npm run dev
```
Web Application available at: **`http://localhost:3000`**

---

## 🧪 Testing & Verification

### Run Backend Unit Tests:
```bash
PYTHONPATH=. pytest
```

### Run Frontend Production Build:
```bash
cd frontend && npm run build
```

---

## ☁️ Supabase PostgreSQL & Cloud Storage Connection

To connect the platform to **Supabase** (or any PostgreSQL instance) for production-grade cloud persistence:

### 1. Configure `.env`
Open or create `.env` in the root directory and add your Supabase connection parameters:
```env
# Supabase PostgreSQL URI (from Supabase Dashboard -> Project Settings -> Database -> Connection String)
DATABASE_URL=postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres

# Supabase Storage & API Keys (from Supabase Dashboard -> Project Settings -> API)
SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
SUPABASE_KEY=[YOUR-SUPABASE-SERVICE-ROLE-OR-ANON-KEY]
SUPABASE_STORAGE_BUCKET=platform-media
STORAGE_BACKEND=supabase
```

### 2. Auto-Migrate Seed & SQLite Data to Supabase
Run the built-in migration utility:
```bash
# Test connection and table schema (dry run)
python migrate_to_supabase.py --dry-run

# Execute full schema initialization & transfer all records to Supabase
python migrate_to_supabase.py
```

### 3. Restart FastAPI Backend
When `DATABASE_URL` starts with `postgresql://` or `postgres://`, FastAPI automatically enables connection pooling (`psycopg2`), initializes the schema from `supabase_schema.sql`, and connects directly to Supabase.

