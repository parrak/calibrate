#!/bin/sh
set -e

# Next.js standalone uses HOSTNAME env var (not HOST) to bind
export HOSTNAME="${HOSTNAME:-0.0.0.0}"
export PORT="${PORT:-8080}"

echo "=== Calibr API Startup ==="
echo "NODE_ENV: ${NODE_ENV}"
echo "PORT: ${PORT}"
echo "HOSTNAME: ${HOSTNAME}"
echo "DATABASE_URL: ${DATABASE_URL:+[REDACTED]}"
echo "Working directory: $(pwd)"
echo "Checking server.js..."
ls -la apps/api/server.js || echo "server.js not found!"
echo "=========================="
echo ""
echo "Starting Next.js server on ${HOSTNAME}:${PORT}..."
exec node apps/api/server.js
