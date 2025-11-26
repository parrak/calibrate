# Script to resolve Prisma migration P3018 errors
# When a migration fails, Prisma won't apply new migrations until the failed one is resolved

param(
    [string]$Action = "check"  # check, resolve, or reset
)

$ErrorActionPreference = "Stop"

Write-Host "Prisma Migration Resolution Script" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan

Push-Location $PSScriptRoot/..

try {
    # Check migration status
    Write-Host "`n1. Checking migration status..." -ForegroundColor Yellow
    $status = npx prisma migrate status 2>&1
    Write-Host $status
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ All migrations are applied" -ForegroundColor Green
        exit 0
    }
    
    # Check if there's a failed migration
    if ($status -match "failed to apply" -or $status -match "P3018") {
        Write-Host "`n⚠ Migration failure detected" -ForegroundColor Yellow
        
        if ($Action -eq "resolve") {
            Write-Host "`n2. Attempting to resolve failed migration..." -ForegroundColor Yellow
            Write-Host "   This will mark the failed migration as rolled back" -ForegroundColor Gray
            Write-Host "   You can then reapply migrations with: pnpm prisma migrate deploy" -ForegroundColor Gray
            
            # Get the failed migration name from the error
            if ($status -match "Migration name: (\S+)") {
                $failedMigration = $Matches[1]
                Write-Host "   Failed migration: $failedMigration" -ForegroundColor Yellow
                Write-Host "`n   Run this command to resolve:" -ForegroundColor Cyan
                Write-Host "   npx prisma migrate resolve --rolled-back $failedMigration" -ForegroundColor White
            } else {
                Write-Host "   Could not determine failed migration name" -ForegroundColor Red
                Write-Host "   Check the migration status output above" -ForegroundColor Yellow
            }
        } elseif ($Action -eq "reset") {
            Write-Host "`n⚠ RESET MODE: This will drop all data!" -ForegroundColor Red
            Write-Host "   Only use this in development/staging environments" -ForegroundColor Yellow
            Write-Host "`n   To reset and reapply all migrations:" -ForegroundColor Cyan
            Write-Host "   npx prisma migrate reset" -ForegroundColor White
        } else {
            Write-Host "`n2. To resolve this issue, run:" -ForegroundColor Cyan
            Write-Host "   .\scripts\resolve-migration-issue.ps1 -Action resolve" -ForegroundColor White
            Write-Host "`n   Or manually resolve with:" -ForegroundColor Cyan
            Write-Host "   npx prisma migrate resolve --rolled-back <migration_name>" -ForegroundColor White
        }
    } else {
        Write-Host "`n2. Database may need migrations applied" -ForegroundColor Yellow
        Write-Host "   Run: pnpm prisma migrate deploy" -ForegroundColor Cyan
    }
    
} finally {
    Pop-Location
}

