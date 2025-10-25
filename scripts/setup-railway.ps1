# Railway Setup Script
# This script configures environment variables and runs migrations

Write-Host "Setting up Railway environment..." -ForegroundColor Green

# Link to Railway project
Write-Host "`n1. Linking to Railway project..." -ForegroundColor Cyan
railway link

# Get DATABASE_URL from PostgreSQL service
Write-Host "`n2. Getting DATABASE_URL from PostgreSQL service..." -ForegroundColor Cyan
$dbUrl = railway variables --service postgres --kv | Select-String "DATABASE_URL" | ForEach-Object { $_ -replace "DATABASE_URL=", "" }

if ($dbUrl) {
    Write-Host "Found DATABASE_URL" -ForegroundColor Green

    # Set DATABASE_URL for API service
    Write-Host "`n3. Setting DATABASE_URL for API service..." -ForegroundColor Cyan
    railway variables --service "@calibr/api" --set DATABASE_URL="$dbUrl"
} else {
    Write-Host "Warning: Could not find DATABASE_URL from PostgreSQL service" -ForegroundColor Yellow
}

# Generate WEBHOOK_SECRET
Write-Host "`n4. Generating WEBHOOK_SECRET..." -ForegroundColor Cyan
$webhookSecret = node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
Write-Host "Generated secret: $webhookSecret" -ForegroundColor Green

# Set WEBHOOK_SECRET
Write-Host "`n5. Setting WEBHOOK_SECRET for API service..." -ForegroundColor Cyan
railway variables --service "@calibr/api" --set WEBHOOK_SECRET="$webhookSecret"

# Run migrations
Write-Host "`n6. Running Prisma migrations..." -ForegroundColor Cyan
railway run --service "@calibr/api" -- sh -c "cd /app && npx prisma migrate deploy --schema=./packages/db/prisma/schema.prisma"

Write-Host "`n✅ Railway setup complete!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "  - Configure api.calibr.lat custom domain in Railway dashboard"
Write-Host "  - Test API endpoints"
