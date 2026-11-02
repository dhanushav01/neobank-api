# Production-hardened Dockerfile for NeoBank API
# Pinned Python 3.11 base image (FastAPI 0.162+ & Starlette 1.10+ require Python >= 3.11)
FROM python:3.11.11-slim-bookworm

# Install gosu for privilege de-escalation in entrypoint
RUN apt-get update && apt-get install -y --no-install-recommends gosu \
    && rm -rf /var/lib/apt/lists/*

# Create unprivileged system user and group (UID/GID 1001)
RUN groupadd -r appgroup && useradd -r -g appgroup -u 1001 appuser

WORKDIR /app

# Install security updates and Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copy application files with appropriate ownership
COPY --chown=appuser:appgroup . .

# Ensure entrypoint script is executable and data directories are initialized
RUN chmod +x /app/docker-entrypoint.sh \
    && mkdir -p /data /app/backend/data \
    && chown -R appuser:appgroup /data /app/backend/data \
    && chmod -R 775 /data /app/backend/data

ENV HOST=0.0.0.0 \
    PORT=8000 \
    ENVIRONMENT=production \
    NEOBANK_DB_PATH=/data/neobank.db

EXPOSE 8000

# Docker healthcheck using dynamic PORT
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD python -c "import os, urllib.request; port = os.getenv('PORT', '8000'); urllib.request.urlopen(f'http://127.0.0.1:{port}/health')" || exit 1

ENTRYPOINT ["/app/docker-entrypoint.sh"]

# Launch uvicorn server with environment variable fallbacks
CMD ["sh", "-c", "uvicorn backend.app.main:app --host ${HOST:-0.0.0.0} --port ${PORT:-8000} --proxy-headers --forwarded-allow-ips \"${FORWARDED_ALLOW_IPS:-*}\""]
