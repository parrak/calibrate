# Migration Check Script for CI
# Validates that Prisma migrations are up to date and detects drift

param(
    [switch]$Strict = $false
)

$ErrorActionPreference = "Stop"

Write-Host "Checking Prisma migration status..." -ForegroundColor Cyan

# Navigate to db package
$dbPackagePath = Join-Path $PSScriptRoot "..\packages\db"
if (-not (Test-Path $dbPackagePath)) {
    Write-Host "Error: Could not find @calibr/db package" -ForegroundColor Red
    exit 1
}

Push-Location $dbPackagePath

try {
    # Check if Prisma is installed
    $prismaInstalled = Get-Command npx -ErrorAction SilentlyContinue
    if (-not $prismaInstalled) {
        Write-Host "Error: npx not found. Please install Node.js and npm." -ForegroundColor Red
        exit 1
    }

    # Generate Prisma client to ensure schema is valid
    Write-Host "`n1. Generating Prisma client..." -ForegroundColor Yellow
    $generateResult = npx prisma generate 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Failed to generate Prisma client" -ForegroundColor Red
        Write-Host $generateResult
        exit 1
    }
    Write-Host "✓ Prisma client generated successfully" -ForegroundColor Green

    # Check migration status
    Write-Host "`n2. Checking migration status..." -ForegroundColor Yellow
    $migrateStatus = npx prisma migrate status 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ All migrations are applied" -ForegroundColor Green
        Write-Host $migrateStatus
    } else {
        Write-Host "Error: Migration check failed" -ForegroundColor Red
        Write-Host $migrateStatus
        exit 1
    }

    # Check for schema drift (if DATABASE_URL is available)
    $dbUrl = $env:DATABASE_URL
    if ($dbUrl -and -not $dbUrl.StartsWith("postgresql://")) {
        Write-Host "`n3. Skipping drift check (DATABASE_URL not configured or not PostgreSQL)" -ForegroundColor Yellow
    } else {
        Write-Host "`n3. Checking for schema drift..." -ForegroundColor Yellow
        $driftCheck = npx prisma migrate diff --from-schema-datamodel prisma/schema.prisma --to-schema-datasource prisma/schema.prisma 2>&1
        
        if ($LASTEXITCODE -eq 0 -and $driftCheck -match "No schema differences found") {
            Write-Host "✓ No schema drift detected" -ForegroundColor Green
        } elseif ($LASTEXITCODE -eq 0) {
            Write-Host "⚠ Schema drift detected!" -ForegroundColor Yellow
            Write-Host $driftCheck
            if ($Strict) {
                Write-Host "Strict mode: Failing due to schema drift" -ForegroundColor Red
                exit 1
            }
        } else {
            Write-Host "⚠ Could not check for drift (database may not be accessible)" -ForegroundColor Yellow
            Write-Host $driftCheck
        }
    }

    Write-Host "`n✅ Migration check complete!" -ForegroundColor Green
    exit 0
} catch {
    Write-Host "`n❌ Migration check failed:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    exit 1
} finally {
    Pop-Location
}

