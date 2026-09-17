# 🚀 Production Deployment Manual
### EDSOLS · Edge AI & Multi-College Learning Platform

This guide provides end-to-end instructions for deploying the platform into production across popular cloud platforms (Render, Vercel, Railway, Fly.io, AWS, GCP) or any self-hosted Linux VPS / Docker server.

---

## 🏛️ System Architecture

```
                                  [ Users & Students ]
                                           │
                                    HTTPS Port 443
                                           │
               ┌───────────────────────────┴───────────────────────────┐
               ▼                                                       ▼
  ┌────────────────────────┐                             ┌────────────────────────┐
  │  Next.js 15+ Frontend  │ ── (Internal / Proxy API) ──►  FastAPI REST Backend │
  │   (Port 3000 / Vercel) │                             │  (Port 8000 / Render)  │
  └────────────────────────┘                             └───────────┬────────────┘
                                                                     │
                                                   ┌─────────────────┴─────────────────┐
                                                   ▼                                   ▼
                                      ┌────────────────────────┐          ┌────────────────────────┐
                                      │  Supabase PostgreSQL   │          │    Supabase Storage    │
                                      │   (25 Relational DB)   │          │  (Media & Submissions) │
                                      └────────────────────────┘          └────────────────────────┘
```

---

## ⚙️ Environment Variables Reference

| Variable | Required | Default | Purpose / Example |
| :--- | :---: | :--- | :--- |
| `DATABASE_URL` | **Yes** | `sqlite:///./database.db` | Supabase / PostgreSQL URI: `postgresql://postgres.[REF]:[PASS]@[HOST]:6543/postgres` |
| `JWT_SECRET` | **Yes** | `(random)` | Strong secret for signing auth tokens (e.g. `openssl rand -hex 32`) |
| `JWT_ALGORITHM` | No | `HS256` | JWT signing algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES`| No | `1440` | Session lifetime in minutes (1440 = 24 hours) |
| `PORT` | No | `8000` | Port for FastAPI backend |
| `HOST` | No | `0.0.0.0` | Host bind address |
| `ENVIRONMENT` | No | `production` | Environment name (`production` or `development`) |
| `DEBUG` | No | `False` | Toggle verbose traceback & `/api/docs` |
| `CORS_ORIGINS` | No | `*` | Allowed origins (e.g. `https://my-domain.com,https://app.my-domain.com`) |
| `SUPABASE_URL` | Optional | `""` | Supabase Project API URL (e.g. `https://xxxx.supabase.co`) |
| `SUPABASE_KEY` | Optional | `""` | Supabase Service Role / Anon API Key |
| `SUPABASE_STORAGE_BUCKET` | Optional | `platform-media` | Cloud Storage bucket name |
| `STORAGE_BACKEND` | Optional | `local` | `supabase` for cloud object storage, or `local` for disk |
| `BACKEND_API_URL` | **Yes (Frontend)** | `http://127.0.0.1:8000` | Backend URL used by Next.js API proxy |

---

## ☁️ Option 1: 1-Click Deployment on Render.com (Recommended)

The repository includes a ready-to-use [`render.yaml`](file:///Users/ragul/Desktop/platform/render.yaml) blueprint that deploys both the FastAPI Backend and Next.js Frontend simultaneously.

1. Create a free account at [Render.com](https://render.com).
2. Go to **Blueprints → New Blueprint Instance**.
3. Connect your GitHub repository: `git@github.com:ragulselvam/edosls-course-platfrom.git`.
4. Render will automatically detect `render.yaml` and configure both services:
   - `nexus-lms-backend` (Python web service)
   - `nexus-lms-frontend` (Node.js web service)
5. Set your `DATABASE_URL` in the environment variables with your Supabase PostgreSQL connection string.
6. Click **Apply**. Both services will build and deploy automatically!

---

## ⚡ Option 2: Decoupled Cloud Deployment (Vercel + Render/Railway + Supabase)

### Step 1: Set up Supabase PostgreSQL
1. Create a project at [Supabase.com](https://supabase.com).
2. In **Project Settings → Database**, copy your **Connection String (URI / Pooler)**.
3. In your local terminal, run the automated migration to seed all 25 tables and demo data:
   ```bash
   python migrate_to_supabase.py --postgres-url "postgresql://postgres.[REF]:[PASSWORD]@[HOST]:6543/postgres"
   ```

### Step 2: Deploy Backend to Render or Railway
1. **Render**:
   - Create a **New Web Service** → Connect repo.
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Add Environment Variables:
     - `DATABASE_URL`: Your Supabase connection string.
     - `JWT_SECRET`: A secure random string.
     - `CORS_ORIGINS`: `*` (or your Vercel frontend URL).
2. Note your deployed Backend URL (e.g. `https://nexus-backend.onrender.com`).

### Step 3: Deploy Frontend to Vercel
1. Import repository on [Vercel.com](https://vercel.com).
2. Set **Root Directory** to `frontend`.
3. Framework Preset: **Next.js**.
4. Add Environment Variable:
   - `BACKEND_API_URL`: `https://nexus-backend.onrender.com`
5. Click **Deploy**. Vercel will build and serve your app globally.

---

## 🐳 Option 3: 1-Command Docker Compose (Self-Hosted / VPS)

For any Ubuntu / Debian / CentOS Linux server with Docker and Docker Compose installed:

```bash
# 1. Clone repository
git clone git@github.com:ragulselvam/edosls-course-platfrom.git
cd edosls-course-platfrom

# 2. Configure .env
cp .env.example .env
nano .env   # Add your DATABASE_URL and JWT_SECRET

# 3. Launch both Frontend and Backend
docker compose up --build -d

# 4. Verify containers are healthy
docker compose ps
```

- **Frontend**: Accessible at `http://YOUR-SERVER-IP:3000`
- **Backend**: Accessible at `http://YOUR-SERVER-IP:8000`
- **Health Check**: `http://YOUR-SERVER-IP:8000/health`

---

## 🔒 Option 4: Linux VPS Production Setup with Nginx & Let's Encrypt SSL

For a custom domain with automated SSL certificates:

### 1. Install Nginx & Certbot
```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
```

### 2. Configure Nginx Reverse Proxy (`/etc/nginx/sites-available/platform.conf`)
```nginx
server {
    server_name yourdomain.com www.yourdomain.com;

    # Frontend Next.js
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API Proxy
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Uploaded media assets
    client_max_body_size 50M;
}
```

### 3. Enable Site & Generate Free SSL Certificate
```bash
sudo ln -s /etc/nginx/sites-available/platform.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## 🔍 Verification & Health Monitoring

1. **Backend Health Check**:
   ```bash
   curl -i https://yourdomain.com/health
   ```
   *Expected Response:*
   ```json
   {
     "status": "healthy",
     "service": "multi-college-platform-api",
     "version": "1.0.0",
     "environment": "production",
     "database": {
       "driver": "PostgreSQL (Supabase)",
       "status": "healthy",
       "colleges_registered": 3
     },
     "uptime_seconds": 120
   }
   ```

2. **Automated Unit Tests**:
   ```bash
   PYTHONPATH=. pytest
   ```

3. **Frontend Production Build Test**:
   ```bash
   cd frontend && npm run build
   ```

---

## 🔑 Pre-Seeded Demonstration Accounts

All demonstration accounts use password: `Password@123`

| Role | Email |
| :--- | :--- |
| **Super Admin** | `superadmin@platform.edu` |
| **College Admin (AIT)** | `admin@ait.edu` |
| **College Admin (SVCE)** | `admin@svce.edu` |
| **Faculty Trainer** | `dr.arun@platform.edu` |
| **Student** | `student1@ait.edu` |
