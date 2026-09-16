# Multi-College Student Training & Assessment Platform

A complete, production-ready, multi-tenant enterprise training and examination platform featuring isolated institutional governance, interactive coding sandboxes, NVIDIA JetBot AI robotics simulation, and verifiable cryptographic certificates with QR codes.

---

## 🌟 Key Architecture & Highlights

- **Multi-Tenant Data Isolation**: Strict row-level `college_id` authorization across database queries and middleware. Students and Admins belonging to College A cannot access or see College B students, courses, or assessments.
- **Three Distinct Portals**:
  1. **Super Admin Portal**: Global college management, tenant disable/enable toggle, institutional admin assignment, and real-time audit logs.
  2. **College Admin Portal**: Analytics dashboard, student management (single add + bulk CSV/JSON import), **5-Step Course Creation Wizard**, assessment creation, and instructor grading center.
  3. **Student Portal**: Available courses catalog with one-click enrollment, "My Courses" hub, interactive split-screen course player, automated coding & MCQ evaluation engine, and verifiable certificates.
- **Interactive Learning Player**: Split view with accordion module navigation, video streaming, rich Markdown documents, live **Python execution sandbox & automated unit test evaluation**, and **NVIDIA JetBot / Jetson AI Vision Simulator** with YOLO object detection overlays.
- **Certificate Verification System**: Cryptographically verifiable Certificate ID with dynamic QR code generation and public lookup endpoint (`/api/certificates/verify/{certificate_code}`) requiring no login.

---

## 🔑 Pre-Seeded Demo Credentials

All accounts use default password: `Password@123`

| Role | Organization / College | Email | Primary Responsibilities |
| :--- | :--- | :--- | :--- |
| **Super Admin** | Platform Governance | `superadmin@platform.edu` | Manage all colleges, admins, and global audit logs |
| **College Admin** | Apex Institute of Tech (AIT) | `admin@ait.edu` | AI & Robotics Department Admin |
| **College Admin** | Silicon Valley College (SVCE) | `admin@svce.edu` | Computer Science & Cloud Admin |
| **College Admin** | Metro Autonomous Univ (MAU) | `admin@mau.edu` | Engineering & Autonomous Systems Admin |
| **Student** | Apex Institute of Tech (AIT) | `student1@ait.edu` | Alex Rivera (100% JetBot Course Done + Certificate) |
| **Student** | Apex Institute of Tech (AIT) | `student2@ait.edu` | Sophia Chen (50% in progress) |
| **Student** | Silicon Valley College (SVCE) | `student1@svce.edu` | Jordan Lee (Cloud Computing Cohort) |

---

## 🚀 Quick Start Guide (Local Setup)

### 1. Prerequisites
- Python 3.9+ installed

### 2. Environment Setup & Dependency Installation
```bash
# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Run Application Server
```bash
# Starts the FastAPI server and serves static SPA assets at http://localhost:8000
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
Open **`http://localhost:8000`** in your browser.

---

## 🐳 Docker Deployment

To launch with Docker:
```bash
docker compose up --build -d
```
The platform will automatically initialize tables, seed demo data, and listen on port `8000`.

---

## 🧪 Automated Testing

Run the automated test suite verifying tenant isolation, auth, course lifecycle, and assessment grading:
```bash
PYTHONPATH=. pytest tests/test_platform.py -v
```

---

## 📚 API Endpoints Overview

| API Group | Route Prefix | Description |
| :--- | :--- | :--- |
| **Auth** | `/api/auth` | Login, current user, profile updates, password reset |
| **Colleges** | `/api/colleges` | Super Admin CRUD & institutional status toggle |
| **Admins** | `/api/admins` | Assign and manage College Admin accounts |
| **Students** | `/api/students` | Student management, bulk CSV/JSON import, profile view |
| **Courses** | `/api/courses` | 5-step Course Wizard, publishing, and college catalogs |
| **Modules & Content** | `/api/modules`, `/api/content` | Course modules, videos, documents, coding & JetBot content |
| **Enrollments** | `/api/enrollments` | Course registration, status tracking, admin enrollment list |
| **Progress** | `/api/progress` | Module completion, time spent, auto-certificate generation |
| **Assessments** | `/api/assessments` | Timed exam creation, question bank, automated scoring |
| **Results** | `/api/results` | Assessment submission results, instructor manual grading |
| **Certificates** | `/api/certificates` | Earned certificates, printable view, public QR verification |
| **Sandbox** | `/api/sandbox` | Safe Python code runner, unit test runner, JetBot telemetry |
| **Notifications** | `/api/notifications` | Real-time system alerts, broadcast announcements |
| **Reports** | `/api/reports` | Analytics dashboards for Super Admin, College Admin, Student |
| **Files** | `/api/files` | Multi-part uploads for PDFs, videos, datasets, and models |

---

## 🤖 Future JetBot & NVIDIA Jetson AI Architecture

The platform provides a dedicated extensible layer for AI/Robotics training:
- **Telemetry Stream**: Simulated camera capture at 30 FPS with YOLOv8 bounding box overlays (`traffic_cone`, `stop_sign`, `pedestrian`).
- **Edge Computing Sandbox**: Python execution checking control loops (`robot.left`, `robot.right`, PyTorch tensor preprocessing).
- **File Asset Pipeline**: Storage layer accepting `.pth`, `.pt`, `.onnx`, `.engine`, and `.ipynb` Jupyter notebook files for practical model training evaluations.
