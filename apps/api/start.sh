#!/bin/sh
set -e

echo "=== Calibr API Startup ==="
echo "NODE_ENV: ${NODE_ENV}"
echo "PORT: ${PORT}"
echo "HOST: ${HOST}"
echo "DATABASE_URL: ${DATABASE_URL:+[REDACTED]}"
echo "Working directory: $(pwd)"
echo "Checking server.js..."
ls -la apps/api/server.js || echo "server.js not found!"
echo "=========================="
echo ""
echo "Starting Next.js server on ${HOST:-0.0.0.0}:${PORT:-3000}..."
exec node apps/api/server.js
