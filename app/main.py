import os
import time
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse

from app.config import DEBUG, PORT, HOST, CORS_ORIGINS, ENVIRONMENT, USE_POSTGRES
from app.database import init_db, query_one
from app.seed import seed_database
from app.routers import (
    auth, colleges, admins, students, courses, modules,
    content, enrollments, progress, assignments, assessments,
    results, certificates, notifications, reports, files, sandbox
)

STATIC_DIR = Path(__file__).resolve().parent.parent / "static"
STATIC_DIR.mkdir(parents=True, exist_ok=True)

START_TIME = time.time()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB & Seed Data on Startup
    try:
        init_db()
        seed_database()
        print(f"[Platform API] Initialized successfully in '{ENVIRONMENT}' mode.")
    except Exception as e:
        print(f"[Platform API] Startup initialization notice: {e}")
    yield

app = FastAPI(
    title="Multi-College Student Training & Assessment Platform API",
    description="Enterprise multi-tenant learning, coding assessment, certificate, and robotics training platform.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs" if (DEBUG or ENVIRONMENT != "production") else None,
    redoc_url="/api/redoc" if (DEBUG or ENVIRONMENT != "production") else None
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global error handler for unhandled exceptions
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    if DEBUG:
        import traceback
        traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please contact system administrator if this persists."}
    )

# Register All API Routers
app.include_router(auth.router)
app.include_router(colleges.router)
app.include_router(admins.router)
app.include_router(students.router)
app.include_router(courses.router)
app.include_router(modules.router)
app.include_router(content.router)
app.include_router(enrollments.router)
app.include_router(progress.router)
app.include_router(assignments.router)
app.include_router(assessments.router)
app.include_router(results.router)
app.include_router(certificates.router)
app.include_router(notifications.router)
app.include_router(reports.router)
app.include_router(files.router)
app.include_router(sandbox.router)

# Mount Static Assets
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

@app.get("/health")
def health_check():
    db_status = "healthy"
    colleges_count = 0
    try:
        row = query_one("SELECT count(*) as cnt FROM colleges")
        if row:
            colleges_count = row.get("cnt", 0)
    except Exception as e:
        db_status = f"unhealthy ({str(e)})"

    uptime_sec = int(time.time() - START_TIME)

    return {
        "status": "healthy" if "unhealthy" not in db_status else "degraded",
        "service": "multi-college-platform-api",
        "version": "1.0.0",
        "environment": ENVIRONMENT,
        "database": {
            "driver": "PostgreSQL (Supabase)" if USE_POSTGRES else "SQLite",
            "status": db_status,
            "colleges_registered": colleges_count
        },
        "uptime_seconds": uptime_sec
    }

@app.get("/")
def root():
    return {
        "name": "Multi-College Student Training & Assessment Platform API",
        "status": "online",
        "version": "1.0.0",
        "docs": "/api/docs",
        "health": "/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=HOST, port=PORT, reload=DEBUG)
