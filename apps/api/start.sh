#!/bin/sh
set -e

# Next.js standalone uses HOSTNAME env var (not HOST) to bind
export HOSTNAME="${HOSTNAME:-0.0.0.0}"
export PORT="${PORT:-8080}"
export NODE_ENV="${NODE_ENV:-production}"

echo "=== Calibrate API Startup ==="
echo "NODE_ENV: ${NODE_ENV}"
echo "PORT: ${PORT}"
echo "HOSTNAME: ${HOSTNAME}"
echo "Working directory: $(pwd)"

# Create .env file for Prisma (Next.js standalone doesn't pass env vars to Prisma properly)
# Prisma looks for .env file in current directory at runtime
echo ""
echo "Creating .env file for Prisma..."
cat > .env <<EOF
DATABASE_URL="${DATABASE_URL}"
EOF
if [ -n "$DATABASE_URL" ]; then
  echo "DATABASE_URL written to .env: [YES - $(echo "$DATABASE_URL" | cut -c1-20)...]"
else
  echo "DATABASE_URL written to .env: [NOT SET]"
fi

# Log all environment variables (excluding system/shell vars)
# This automatically shows any new Railway variables without code changes
echo ""
echo "Environment Variables:"
env | grep -v '^_' | grep -v '^SHLVL' | grep -v '^PWD' | grep -v '^OLDPWD' | \
  while IFS='=' read -r name value; do
    # Redact sensitive values, show only that they're set
    case "$name" in
      *PASSWORD*|*SECRET*|*KEY*|*TOKEN*|DATABASE_URL|DATABASE_PUBLIC_URL)
        # Show prefix for DATABASE_URL, just [SET] for others
        if [ "$name" = "DATABASE_URL" ]; then
          echo "  $name: [SET - $(echo "$value" | cut -c1-20)...]"
        else
          echo "  $name: [SET]"
        fi
        ;;
      *)
        # Show full value for non-sensitive vars
        echo "  $name: $value"
        ;;
    esac
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
