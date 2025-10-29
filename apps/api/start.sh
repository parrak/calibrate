#!/bin/sh
set -e

# Next.js standalone uses HOSTNAME env var (not HOST) to bind
export HOSTNAME="${HOSTNAME:-0.0.0.0}"
export PORT="${PORT:-8080}"
export NODE_ENV="${NODE_ENV:-production}"

echo "=== Calibr API Startup ==="
echo "NODE_ENV: ${NODE_ENV}"
echo "PORT: ${PORT}"
echo "HOSTNAME: ${HOSTNAME}"
echo "Working directory: $(pwd)"

# Auto-detect and log all sensitive environment variables
# This ensures any new Railway variables are automatically passed through
echo ""
echo "Environment Variables Status:"
for var in DATABASE_URL DATABASE_PUBLIC_URL ENCRYPTION_KEY WEBHOOK_SECRET \
           CONSOLE_INTERNAL_TOKEN CRON_TOKEN RAILWAY_ENVIRONMENT \
           RAILWAY_DEPLOYMENT_ID RAILWAY_SERVICE_NAME; do
  if [ -n "$(eval echo \$$var)" ]; then
    # For DATABASE_URL, show prefix; for others just show [SET]
    if [ "$var" = "DATABASE_URL" ]; then
      echo "  $var: [SET - $(eval echo \$$var | cut -c1-20)...]"
    else
      echo "  $var: [SET]"
    fi
  else
    echo "  $var: [NOT SET]"
  fi
done

echo ""
echo "Checking server.js..."
ls -la apps/api/server.js || echo "server.js not found!"
echo "=========================="
echo ""
echo "Starting Next.js server on ${HOSTNAME}:${PORT}..."

# Use exec to replace the shell process with node
# All environment variables are automatically inherited by child processes
exec node apps/api/server.js
