# Multi-stage production-hardened Dockerfile for NeoBank API
FROM python:3.11-slim

# Create unprivileged system user and group
RUN groupadd -r appgroup && useradd -r -g appgroup -u 1001 appuser

WORKDIR /app

# Install security updates and Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copy application files with appropriate ownership
COPY --chown=appuser:appgroup . .

# Ensure data directory exists and has correct permissions
RUN mkdir -p /app/backend/data && chown -R appuser:appgroup /app/backend/data

# Switch to non-root user
USER appuser

ENV HOST=0.0.0.0 \
    PORT=8000 \
    ENVIRONMENT=production

EXPOSE 8000

# Docker healthcheck using dynamic PORT
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD python -c "import os, urllib.request; port = os.getenv('PORT', '8000'); urllib.request.urlopen(f'http://127.0.0.1:{port}/health')" || exit 1

# Launch uvicorn server with environment variable fallbacks
CMD ["sh", "-c", "uvicorn backend.app.main:app --host ${HOST:-0.0.0.0} --port ${PORT:-8000} --proxy-headers"]
