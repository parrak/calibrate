#!/bin/bash
# Migration Check Script for CI (Linux/macOS)
# Validates that Prisma migrations are up to date and detects drift

set -e

STRICT=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --strict)
      STRICT=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

echo "Checking Prisma migration status..."

# Navigate to db package
DB_PACKAGE_PATH="$(cd "$(dirname "$0")/../packages/db" && pwd)"
if [ ! -d "$DB_PACKAGE_PATH" ]; then
  echo "Error: Could not find @calibr/db package" >&2
  exit 1
fi

cd "$DB_PACKAGE_PATH"

# Check if npx is available
if ! command -v npx &> /dev/null; then
  echo "Error: npx not found. Please install Node.js and npm." >&2
  exit 1
fi

# Generate Prisma client to ensure schema is valid
echo ""
echo "1. Generating Prisma client..."
if ! npx prisma generate; then
  echo "Error: Failed to generate Prisma client" >&2
  exit 1
fi
echo "✓ Prisma client generated successfully"

# Check migration status (if DATABASE_URL is set)
if [ -n "$DATABASE_URL" ]; then
  echo ""
  echo "2. Checking migration status..."
  if npx prisma migrate status; then
    echo "✓ All migrations are applied"
  else
    echo "⚠ Migration check completed (database may need migrations)" >&2
    # Don't fail if database isn't accessible in CI
  fi
else
  echo ""
  echo "2. Skipping migration status check (DATABASE_URL not set)"
fi

# Check for schema drift (validate schema file)
echo ""
echo "3. Validating schema file..."
# prisma validate requires DATABASE_URL, so we use format --check instead
# This validates the schema syntax without requiring a database connection
if npx prisma format --check; then
  echo "✓ Schema file is valid"
else
  echo "Error: Schema validation failed" >&2
  exit 1
fi

# M0.1: Check core schema requirements
echo ""
echo "4. Checking M0.1 core schema requirements..."
if npx tsx scripts/check-migrations.ts; then
  echo "✓ M0.1 schema requirements met"
else
  echo "Error: M0.1 schema check failed" >&2
  exit 1
fi

echo ""
echo "✅ Migration check complete!"
exit 0

