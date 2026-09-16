# Multi-College Student Training & Assessment Platform Dockerfile
FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source code and static assets
COPY . .

# Create persistent data and uploads directories
RUN mkdir -p /app/data/uploads

# Expose server port
EXPOSE 6966

ENV PORT=6966
ENV HOST=0.0.0.0
ENV PYTHONUNBUFFERED=1

# Run FastAPI backend with Uvicorn
CMD ["python3", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "6966"]