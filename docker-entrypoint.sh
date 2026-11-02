#!/bin/sh
set -e

# Target database/data directory from env or defaults
DATA_DIR="${NEOBANK_DATA_DIR:-/data}"

# If running as root, fix permissions on mounted persistent disk and drop privileges to appuser
if [ "$(id -u)" = "0" ]; then
    mkdir -p "$DATA_DIR" /app/backend/data 2>/dev/null || true
    chown -R appuser:appgroup "$DATA_DIR" /app/backend/data 2>/dev/null || chmod -R 777 "$DATA_DIR" /app/backend/data 2>/dev/null || true
    exec gosu appuser "$@"
else
    # Already running as unprivileged user
    exec "$@"
fi
