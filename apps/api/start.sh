#!/bin/sh
set -e

# Next.js standalone uses HOSTNAME env var (not HOST) to bind
export HOSTNAME="${HOSTNAME:-0.0.0.0}"
export PORT="${PORT:-8080}"

# Explicitly export all Railway environment variables for Next.js
# Railway sets these, but we need to ensure they're in the environment
export DATABASE_URL="${DATABASE_URL}"
export ENCRYPTION_KEY="${ENCRYPTION_KEY}"
export WEBHOOK_SECRET="${WEBHOOK_SECRET}"
export CONSOLE_INTERNAL_TOKEN="${CONSOLE_INTERNAL_TOKEN}"
export CRON_TOKEN="${CRON_TOKEN}"
export NODE_ENV="${NODE_ENV:-production}"

echo "=== Calibr API Startup ==="
echo "NODE_ENV: ${NODE_ENV}"
echo "PORT: ${PORT}"
echo "HOSTNAME: ${HOSTNAME}"
echo "DATABASE_URL: ${DATABASE_URL:+[SET - $(echo $DATABASE_URL | cut -c1-20)...]}"
echo "ENCRYPTION_KEY: ${ENCRYPTION_KEY:+[SET]}"
echo "WEBHOOK_SECRET: ${WEBHOOK_SECRET:+[SET]}"
echo "CONSOLE_INTERNAL_TOKEN: ${CONSOLE_INTERNAL_TOKEN:+[SET]}"
echo "CRON_TOKEN: ${CRON_TOKEN:+[SET]}"
echo "Working directory: $(pwd)"
echo "Checking server.js..."
ls -la apps/api/server.js || echo "server.js not found!"
echo "=========================="
echo ""
echo "Starting Next.js server on ${HOSTNAME}:${PORT}..."
exec node apps/api/server.js
