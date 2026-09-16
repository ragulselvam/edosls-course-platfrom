"""
Storage Service: Local Disk and Supabase Cloud Storage Provider
"""

import os
import shutil
import mimetypes
from pathlib import Path
from typing import Optional, Union, BinaryIO
import httpx
from app.config import (
    UPLOAD_DIR,
    STORAGE_BACKEND,
    SUPABASE_URL,
    SUPABASE_KEY,
    SUPABASE_STORAGE_BUCKET
)

class StorageService:
    @staticmethod
    def upload_file(
        file_content: Union[bytes, BinaryIO],
        filename: str,
        content_type: Optional[str] = None,
        prefix: str = "attachments"
    ) -> str:
        """
        Uploads a file to either Supabase Storage or Local UPLOAD_DIR.
        Returns the accessible URL or path.
        """
        if isinstance(file_content, bytes):
            data = file_content
        else:
            data = file_content.read()

        if not content_type:
            content_type = mimetypes.guess_type(filename)[0] or "application/octet-stream"

        # 1. Supabase Cloud Storage
        if STORAGE_BACKEND == "supabase" and SUPABASE_URL and SUPABASE_KEY:
            clean_filename = filename.replace(" ", "_").replace("/", "_")
            remote_path = f"{prefix}/{clean_filename}".lstrip("/")
            
            headers = {
                "Authorization": f"Bearer {SUPABASE_KEY}",
                "apikey": SUPABASE_KEY,
                "Content-Type": content_type
            }
            
            upload_endpoint = f"{SUPABASE_URL.rstrip('/')}/storage/v1/object/{SUPABASE_STORAGE_BUCKET}/{remote_path}"
            
            try:
                with httpx.Client(timeout=30.0) as client:
                    resp = client.post(upload_endpoint, content=data, headers=headers)
                    if resp.status_code in (200, 201):
                        # Public URL format for Supabase Storage
                        public_url = f"{SUPABASE_URL.rstrip('/')}/storage/v1/object/public/{SUPABASE_STORAGE_BUCKET}/{remote_path}"
                        return public_url
            except Exception as err:
                print(f"[StorageService] Supabase upload failed, falling back to local: {err}")

        # 2. Local Disk Storage Fallback
        dest_dir = UPLOAD_DIR / prefix
        dest_dir.mkdir(parents=True, exist_ok=True)
        local_path = dest_dir / filename

        with open(local_path, "wb") as f:
            f.write(data)

        # Return local static mount URL
        return f"/data/uploads/{prefix}/{filename}"

    @staticmethod
    def get_file_url(path_or_url: str) -> str:
        """Returns the public URL for a given storage path."""
        if path_or_url.startswith("http://") or path_or_url.startswith("https://"):
            return path_or_url
        return path_or_url