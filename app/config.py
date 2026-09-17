import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# Read .env if exists
ENV_PATH = BASE_DIR / ".env"
if ENV_PATH.exists():
    with open(ENV_PATH) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, val = line.split("=", 1)
                os.environ.setdefault(key.strip(), val.strip())

# Environment & Server Settings
ENVIRONMENT = os.environ.get("ENVIRONMENT", os.environ.get("NODE_ENV", "production")).lower()
PORT = int(os.environ.get("PORT", 8000))
HOST = os.environ.get("HOST", "0.0.0.0")
DEBUG = os.environ.get("DEBUG", "False").lower() in ("true", "1", "yes")

# Security & JWT Tokens
JWT_SECRET = os.environ.get("JWT_SECRET", "super_secret_jwt_key_multi_tenant_lms_2026_change_in_production")
JWT_ALGORITHM = os.environ.get("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES", 1440))

# CORS Configuration
raw_cors = os.environ.get("CORS_ORIGINS", "*").strip()
if raw_cors == "*" or not raw_cors:
    CORS_ORIGINS = ["*"]
else:
    CORS_ORIGINS = [origin.strip() for origin in raw_cors.split(",") if origin.strip()]

# Database Configuration (Supabase PostgreSQL vs SQLite fallback)
DATABASE_URL = os.environ.get("DATABASE_URL", os.environ.get("SUPABASE_DB_URL", "")).strip()
USE_POSTGRES = bool(DATABASE_URL and (DATABASE_URL.startswith("postgresql://") or DATABASE_URL.startswith("postgres://")))

# Primary database file at project root (database.db) fallback for local SQLite
DEFAULT_DB = BASE_DIR / "database.db"
DATABASE_PATH = Path(os.environ.get("PLATFORM_DB_PATH", os.environ.get("DATABASE_PATH", str(DEFAULT_DB))))

# Storage & Uploads
raw_upload_dir = os.environ.get("UPLOAD_DIR", "").strip()
if raw_upload_dir:
    UPLOAD_DIR = Path(raw_upload_dir).resolve()
else:
    UPLOAD_DIR = BASE_DIR / "data" / "uploads"

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)

MAX_UPLOAD_SIZE_MB = int(os.environ.get("MAX_UPLOAD_SIZE_MB", 50))

# Supabase API & Cloud Storage Configuration
SUPABASE_URL = os.environ.get("SUPABASE_URL", "").strip()
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", os.environ.get("SUPABASE_SERVICE_ROLE_KEY", os.environ.get("SUPABASE_ANON_KEY", ""))).strip()
SUPABASE_STORAGE_BUCKET = os.environ.get("SUPABASE_STORAGE_BUCKET", "platform-media")
STORAGE_BACKEND = os.environ.get("STORAGE_BACKEND", "supabase" if (SUPABASE_URL and SUPABASE_KEY) else "local")
