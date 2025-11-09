# Script to check database state and diagnose migration issues

$ErrorActionPreference = "Stop"

Write-Host "Database State Check" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan

Push-Location $PSScriptRoot/..

try {
    # Check if DATABASE_URL is set
    if (-not $env:DATABASE_URL) {
        Write-Host "⚠ DATABASE_URL not set" -ForegroundColor Yellow
        Write-Host "   Set it in .env file or environment" -ForegroundColor Gray
        exit 1
    }
    
    Write-Host "`n1. Checking migration status..." -ForegroundColor Yellow
    $status = npx prisma migrate status 2>&1
    Write-Host $status
    
    Write-Host "`n2. Checking if base tables exist..." -ForegroundColor Yellow
    Write-Host "   (This requires a database connection)" -ForegroundColor Gray
    
    # Try to query for Tenant table
    $checkQuery = @"
SELECT 
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Tenant') 
        THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as tenant_status;
"@
    
    Write-Host "`n3. To manually check database state:" -ForegroundColor Cyan
    Write-Host "   Connect to your database and run:" -ForegroundColor Gray
    Write-Host "   SELECT migration_name, finished_at FROM `"_prisma_migrations`" ORDER BY started_at;" -ForegroundColor White
    Write-Host "`n   If base tables (Tenant, Project) are missing but migrations are marked as applied," -ForegroundColor Yellow
    Write-Host "   you may need to:" -ForegroundColor Yellow
    Write-Host "   1. Reset the database: npx prisma migrate reset" -ForegroundColor White
    Write-Host "   2. Or manually fix the _prisma_migrations table" -ForegroundColor White
    
} finally {
    Pop-Location
}

