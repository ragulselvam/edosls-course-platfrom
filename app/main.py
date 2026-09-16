import os
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse

from app.config import DEBUG, PORT, HOST
from app.database import init_db
from app.seed import seed_database
from app.routers import (
    auth, colleges, admins, students, courses, modules,
    content, enrollments, progress, assignments, assessments,
    results, certificates, notifications, reports, files, sandbox
)

STATIC_DIR = Path(__file__).resolve().parent.parent / "static"
STATIC_DIR.mkdir(parents=True, exist_ok=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB & Seed Data on Startup
    init_db()
    seed_database()
    yield

app = FastAPI(
    title="Multi-College Student Training & Assessment Platform API",
    description="Enterprise multi-tenant learning, coding assessment, certificate, and robotics training platform.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
    return {"status": "healthy", "service": "multi-college-platform", "version": "1.0.0"}

# Single-page application route: serve index.html for all UI routes
@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    # If request is an API route that didn't match, return 404 JSON
    if full_path.startswith("api/"):
        return JSONResponse(status_code=404, content={"detail": "API route not found"})
        
    index_file = STATIC_DIR / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    return {"message": "Platform API is running. Frontend static assets initializing..."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=HOST, port=PORT, reload=DEBUG)
