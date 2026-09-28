#!/bin/sh
set -e
cd /app
if [ ! -f .next/BUILD_ID ] || [ "${REBUILD:-0}" = "1" ]; then
  echo "Building the storefront (takes a few minutes)..."
  NODE_ENV=production npm run build
fi
echo "Starting storefront..."
export NODE_ENV=production
exec npx next start -p 8000 -H 0.0.0.0
