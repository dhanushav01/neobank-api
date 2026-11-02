#!/bin/sh
set -e

# Target database/data directory from env or defaults
DATA_DIR="${NEOBANK_DATA_DIR:-/data}"

# If running as root, fix permissions on mounted persistent disk and drop privileges to appuser
if [ "$(id -u)" = "0" ]; then
    mkdir -p "$DATA_DIR" /app/backend/data 2>/dev/null || true
    if ! chown -R appuser:appgroup "$DATA_DIR" /app/backend/data; then
        echo "[FATAL] Failed to set ownership (chown) of $DATA_DIR and /app/backend/data to appuser:appgroup." >&2
        echo "[FATAL] Container cannot safely write to persistent disk as unprivileged user (UID 1001)." >&2
        echo "[FATAL] Please check host volume / disk mount permissions." >&2
        exit 1
    fi
    exec gosu appuser "$@"
else
    # Already running as unprivileged user
    exec "$@"
fi
