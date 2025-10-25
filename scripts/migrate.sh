#!/bin/sh
# Railway migration script
set -e

echo "Running database migrations..."
cd /app
npx prisma migrate deploy --schema=./packages/db/prisma/schema.prisma

echo "Migrations completed successfully!"
