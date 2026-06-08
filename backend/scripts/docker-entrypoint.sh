#!/bin/sh
set -e

if [ -n "${DATABASE_URL}" ] && echo "${DATABASE_URL}" | grep -q postgresql; then
  echo "Waiting for PostgreSQL..."
  python /app/scripts/wait_for_db.py
fi

echo "Starting API..."
exec "$@"
