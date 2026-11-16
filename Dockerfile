# Production Dockerfile for Vyapar Sarthi Sangi
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY pybackend/requirements.txt /app/pybackend/requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r /app/pybackend/requirements.txt

# Copy application files
COPY frontend/ /app/frontend/
COPY pybackend/ /app/pybackend/

# Create storage directories
RUN mkdir -p /app/storage/uploads /app/storage/processed /app/storage/reports /app/storage/models

ENV PORT=8000
ENV PYTHONUNBUFFERED=1

EXPOSE 8000

# Start FastAPI server
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --app-dir /app/pybackend
