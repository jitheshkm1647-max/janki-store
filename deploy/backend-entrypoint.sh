#!/bin/sh
set -e
cd /app

# Uploaded product images live in the "static" volume. Seed it with the
# starter catalogue images the first time.
mkdir -p static
cp -r --update=none seed-static/. static/ 2>/dev/null || cp -rn seed-static/. static/ 2>/dev/null || true

if [ "${MEDUSA_WORKER_MODE:-shared}" != "worker" ]; then
  echo "Running database migrations..."
  npx medusa db:migrate
  npx medusa db:migrate:search
fi

echo "Starting Medusa..."
exec npx medusa start
