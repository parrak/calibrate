# Simple Deployment Validation Script
# Quick validation for common issues

Write-Host "🔍 Calibrate Simple Validation" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan

# Check for BigInt serialization issues
Write-Host "`n🔍 Checking for BigInt serialization issues..." -ForegroundColor Yellow

$bigIntIssues = @()

# Check health endpoint
if (Test-Path "apps/api/app/api/health/route.ts") {
    $healthContent = Get-Content "apps/api/app/api/health/route.ts" -Raw
    if ($healthContent -match "BigInt|bigint" -and $healthContent -notmatch "Number\(") {
        $bigIntIssues += "Health endpoint may have BigInt serialization issues"
    }
}

# Check metrics endpoint
if (Test-Path "apps/api/app/api/metrics/route.ts") {
    $metricsContent = Get-Content "apps/api/app/api/metrics/route.ts" -Raw
    if ($metricsContent -match "BigInt|bigint" -and $metricsContent -notmatch "Number\(") {
        $bigIntIssues += "Metrics endpoint may have BigInt serialization issues"
    }
}

# Check admin dashboard
if (Test-Path "apps/api/app/api/admin/dashboard/route.ts") {
    $dashboardContent = Get-Content "apps/api/app/api/admin/dashboard/route.ts" -Raw
    if ($dashboardContent -match "BigInt|bigint" -and $dashboardContent -notmatch "Number\(") {
        $bigIntIssues += "Admin dashboard may have BigInt serialization issues"
    }
}

if ($bigIntIssues.Count -gt 0) {
    Write-Host "❌ BigInt serialization issues found:" -ForegroundColor Red
    foreach ($issue in $bigIntIssues) {
        Write-Host "   - $issue" -ForegroundColor Red
    }
    Write-Host "`nFix these issues before deploying!" -ForegroundColor Red
    exit 1
} else {
    Write-Host "✅ No BigInt serialization issues found" -ForegroundColor Green
}

# Check for JSON.stringify usage
Write-Host "`n🔍 Checking for JSON.stringify usage..." -ForegroundColor Yellow
$jsonStringifyFiles = Get-ChildItem -Path "apps/api/app/api" -Recurse -Filter "*.ts" | Where-Object {
    (Get-Content $_.FullName -Raw) -match "JSON\.stringify"
}

if ($jsonStringifyFiles.Count -gt 0) {
    Write-Host "⚠️  JSON.stringify usage detected in:" -ForegroundColor Yellow
    foreach ($file in $jsonStringifyFiles) {
        Write-Host "   - $($file.FullName)" -ForegroundColor Yellow
    }
    Write-Host "   Ensure no BigInt values are being serialized" -ForegroundColor Yellow
}

# Check for required patterns
Write-Host "`n🔍 Checking for required patterns..." -ForegroundColor Yellow

$requiredPatterns = @(
    @{ Pattern = "Number\("; Description = "BigInt to number conversion" },
    @{ Pattern = "HOSTNAME=0\.0\.0\.0"; Description = "Correct HOSTNAME setting" },
    @{ Pattern = "PORT=8080"; Description = "Correct PORT setting" }
)

$missingPatterns = @()
foreach ($pattern in $requiredPatterns) {
    $found = Get-ChildItem -Path "apps/api" -Recurse -Filter "*.ts" | Where-Object {
        (Get-Content $_.FullName -Raw) -match $pattern.Pattern
    }
    
    if ($found.Count -eq 0) {
        $missingPatterns += $pattern.Description
    }
}

if ($missingPatterns.Count -gt 0) {
    Write-Host "⚠️  Missing required patterns:" -ForegroundColor Yellow
    foreach ($pattern in $missingPatterns) {
        Write-Host "   - $pattern" -ForegroundColor Yellow
    }
}

Write-Host "`n✅ Simple validation completed" -ForegroundColor Green
Write-Host "Run full validation with: .\scripts\validate-deployment.ps1" -ForegroundColor Cyan
