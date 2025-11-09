# Script to apply M0.1 fields migration
# This adds the missing columns to PriceChange and Product tables

Write-Host "Applying M0.1 fields migration..." -ForegroundColor Cyan

# Check if migration file exists
$migrationFile = "prisma\migrations\20251202000000_add_m0_1_fields\migration.sql"
if (-not (Test-Path $migrationFile)) {
    Write-Host "Error: Migration file not found at $migrationFile" -ForegroundColor Red
    exit 1
}

# Apply the migration using Prisma
Write-Host "Running: pnpm prisma migrate deploy" -ForegroundColor Yellow
pnpm prisma migrate deploy

if ($LASTEXITCODE -eq 0) {
    Write-Host "Migration applied successfully!" -ForegroundColor Green
    Write-Host "Regenerating Prisma Client..." -ForegroundColor Yellow
    pnpm prisma generate
    Write-Host "Done!" -ForegroundColor Green
} else {
    Write-Host "Migration failed. Please check the error above." -ForegroundColor Red
    exit 1
}

