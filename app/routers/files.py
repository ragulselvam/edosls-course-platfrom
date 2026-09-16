import os
import uuid
import shutil
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, status
from fastapi.responses import FileResponse
from typing import Dict, Any, Optional
from app.config import UPLOAD_DIR, MAX_UPLOAD_SIZE_MB
from app.middleware import get_current_user

router = APIRouter(prefix="/api/files", tags=["Files"])

ALLOWED_EXTENSIONS = {
    "mp4", "webm", "ogg", "mov", # Videos
    "pdf", "doc", "docx", "ppt", "pptx", "txt", "md", # Documents
    "jpg", "jpeg", "png", "gif", "svg", "webp", # Images
    "py", "ipynb", "zip", "tar", "gz", "json", "csv", # Datasets / Code / Notebooks
    "pth", "pt", "onnx", "engine", "weights", "h5" # AI/JetBot models
}

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    category: str = Form("general"), # courses, submissions, datasets, avatars
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Uploads a file and returns its public URL and metadata."""
    filename = file.filename or "file.bin"
    ext = filename.split(".")[-1].lower() if "." in filename else ""
    
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File extension '.{ext}' is not supported. Supported: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )
    
    # Organize directory by college and category
    college_id = current_user.get("college_id") or "global"
    target_folder = UPLOAD_DIR / str(college_id) / category
    target_folder.mkdir(parents=True, exist_ok=True)
    
    unique_filename = f"{uuid.uuid4().hex[:12]}_{filename.replace(' ', '_')}"
    file_path = target_folder / unique_filename
    
    from app.services.storage import StorageService
    from app.config import STORAGE_BACKEND

    # Save file and calculate size
    content_bytes = bytearray()
    size = 0
    while chunk := await file.read(1024 * 1024): # 1MB chunks
        size += len(chunk)
        if size > MAX_UPLOAD_SIZE_MB * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File exceeds maximum upload size of {MAX_UPLOAD_SIZE_MB}MB"
            )
        content_bytes.extend(chunk)
        
    if STORAGE_BACKEND == "supabase":
        uploaded_url = StorageService.upload_file(
            file_content=bytes(content_bytes),
            filename=unique_filename,
            content_type=file.content_type,
            prefix=f"{college_id}/{category}"
        )
    else:
        with open(file_path, "wb") as buffer:
            buffer.write(content_bytes)
        uploaded_url = f"/api/files/download/{college_id}/{category}/{unique_filename}"

    return {
        "filename": filename,
        "url": uploaded_url,
        "size_bytes": size,
        "content_type": file.content_type,
        "extension": ext
    }

@router.get("/download/{college_id}/{category}/{filename}")
def get_uploaded_file(college_id: str, category: str, filename: str):
    """Serves uploaded files."""
    file_path = UPLOAD_DIR / college_id / category / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Requested file not found")
    return FileResponse(file_path)