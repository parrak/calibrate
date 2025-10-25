# Calibrate Deployment Validation Script
# This script validates that changes won't break production deployment
# Run this before merging to master or pushing to production

param(
    [switch]$SkipBuild,
    [switch]$SkipTests,
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"
$VerbosePreference = if ($Verbose) { "Continue" } else { "SilentlyContinue" }

Write-Host "🔍 Calibrate Deployment Validation" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Track validation results
$ValidationResults = @{
    Build = $false
    Tests = $false
    TypeCheck = $false
    Lint = $false
    DockerBuild = $false
    HealthCheck = $false
    ApiEndpoints = $false
    JsonSerialization = $false
    DatabaseMigrations = $false
}

# Function to run command and capture output
function Invoke-ValidationCommand {
    param(
        [string]$Name,
        [string]$Command,
        [scriptblock]$ValidationScript = { $LASTEXITCODE -eq 0 }
    )
    
    Write-Host "`n🔧 Running: $Name" -ForegroundColor Yellow
    Write-Host "Command: $Command" -ForegroundColor Gray
    
    try {
        $output = Invoke-Expression $Command
        $success = & $ValidationScript
        
        if ($success) {
            Write-Host "✅ $Name - PASSED" -ForegroundColor Green
            return $true
        } else {
            Write-Host "❌ $Name - FAILED" -ForegroundColor Red
            Write-Host "Output: $output" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "❌ $Name - ERROR" -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# 1. Install Dependencies
Write-Host "`n📦 Installing Dependencies..." -ForegroundColor Cyan
if (-not (Invoke-ValidationCommand "Dependencies" "pnpm install")) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# 2. Generate Prisma Client
Write-Host "`n🗄️ Generating Prisma Client..." -ForegroundColor Cyan
if (-not (Invoke-ValidationCommand "Prisma Generate" "pnpm db:generate")) {
    Write-Host "❌ Failed to generate Prisma client" -ForegroundColor Red
    exit 1
}

# 3. Type Check
Write-Host "`n🔍 Running TypeScript Type Check..." -ForegroundColor Cyan
$ValidationResults.TypeCheck = Invoke-ValidationCommand "TypeScript Check" "pnpm type-check"

# 4. Lint Check
Write-Host "`n🧹 Running Lint Check..." -ForegroundColor Cyan
$ValidationResults.Lint = Invoke-ValidationCommand "Lint Check" "pnpm lint"

# 5. Run Tests
if (-not $SkipTests) {
    Write-Host "`n🧪 Running Test Suite..." -ForegroundColor Cyan
    $ValidationResults.Tests = Invoke-ValidationCommand "Test Suite" "pnpm test"
}

# 6. Build Production
if (-not $SkipBuild) {
    Write-Host "`n🏗️ Building Production Bundles..." -ForegroundColor Cyan
    $ValidationResults.Build = Invoke-ValidationCommand "Production Build" "pnpm build"
}

# 7. Start Local Infrastructure
Write-Host "`n🐳 Starting Local Infrastructure..." -ForegroundColor Cyan
Write-Host "Starting PostgreSQL and other services..." -ForegroundColor Gray
docker-compose up -d

# Wait for services to be ready
Write-Host "Waiting for services to be ready..." -ForegroundColor Gray
Start-Sleep -Seconds 10

# 8. Run Database Migrations
Write-Host "`n🗄️ Running Database Migrations..." -ForegroundColor Cyan
$ValidationResults.DatabaseMigrations = Invoke-ValidationCommand "Database Migrations" "pnpm migrate"

# 9. Seed Database
Write-Host "`n🌱 Seeding Database..." -ForegroundColor Cyan
Invoke-ValidationCommand "Database Seed" "pnpm seed" | Out-Null

# 10. Start API Server
Write-Host "`n🚀 Starting API Server..." -ForegroundColor Cyan
$apiProcess = Start-Process -FilePath "pnpm" -ArgumentList "dev:api" -PassThru -WindowStyle Hidden

# Wait for server to start
Write-Host "Waiting for API server to start..." -ForegroundColor Gray
Start-Sleep -Seconds 15

# 11. Test Health Check
Write-Host "`n🏥 Testing Health Check Endpoint..." -ForegroundColor Cyan
$healthCheckTest = {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -Method Get -TimeoutSec 10
        $content = $response.Content | ConvertFrom-Json
        
        # Validate response structure
        $hasStatus = $content.status -eq "ok"
        $hasTimestamp = $content.timestamp -ne $null
        $hasService = $content.service -eq "calibr-api"
        
        # Check for BigInt serialization issues
        $jsonString = $response.Content
        $hasBigInt = $jsonString -match '"connections":\s*\d+'
        $hasMemory = $jsonString -match '"memory":\s*\{'
        
        return ($response.StatusCode -eq 200) -and $hasStatus -and $hasTimestamp -and $hasService -and $hasBigInt -and $hasMemory
    } catch {
        Write-Host "Health check error: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

$ValidationResults.HealthCheck = Invoke-ValidationCommand "Health Check" "Write-Host 'Testing health check...'" $healthCheckTest

# 12. Test JSON Serialization
Write-Host "`n🔍 Testing JSON Serialization..." -ForegroundColor Cyan
$jsonSerializationTest = {
    try {
        # Test health endpoint
        $healthResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -Method Get -TimeoutSec 10
        $healthJson = $healthResponse.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
        $healthValid = $LASTEXITCODE -eq 0
        
        # Test metrics endpoint
        $metricsResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/metrics?project=demo" -Method Get -TimeoutSec 10
        $metricsJson = $metricsResponse.Content | ConvertFrom-Json | ConvertTo-Json -Depth 5
        $metricsValid = $LASTEXITCODE -eq 0
        
        # Test admin dashboard
        $dashboardResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/admin/dashboard?project=demo" -Method Get -TimeoutSec 10
        $dashboardJson = $dashboardResponse.Content | ConvertFrom-Json | ConvertTo-Json -Depth 5
        $dashboardValid = $LASTEXITCODE -eq 0
        
        return $healthValid -and $metricsValid -and $dashboardValid
    } catch {
        Write-Host "JSON serialization error: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

$ValidationResults.JsonSerialization = Invoke-ValidationCommand "JSON Serialization" "Write-Host 'Testing JSON serialization...'" $jsonSerializationTest

# 13. Test API Endpoints
Write-Host "`n🌐 Testing API Endpoints..." -ForegroundColor Cyan
$apiEndpointsTest = {
    try {
        $endpoints = @(
            "http://localhost:3000/api/health",
            "http://localhost:3000/api/metrics?project=demo",
            "http://localhost:3000/api/admin/dashboard?project=demo",
            "http://localhost:3000/api/v1/price-changes?project=demo",
            "http://localhost:3000/api/v1/catalog?project=demo"
        )
        
        $allPassed = $true
        foreach ($endpoint in $endpoints) {
            try {
                $response = Invoke-WebRequest -Uri $endpoint -Method Get -TimeoutSec 10
                if ($response.StatusCode -ne 200) {
                    Write-Host "Endpoint $endpoint returned status $($response.StatusCode)" -ForegroundColor Red
                    $allPassed = $false
                }
            } catch {
                Write-Host "Endpoint $endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
                $allPassed = $false
            }
        }
        
        return $allPassed
    } catch {
        Write-Host "API endpoints test error: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

$ValidationResults.ApiEndpoints = Invoke-ValidationCommand "API Endpoints" "Write-Host 'Testing API endpoints...'" $apiEndpointsTest

# 14. Docker Build Test
Write-Host "`n🐳 Testing Docker Build..." -ForegroundColor Cyan
$dockerBuildTest = {
    try {
        # Build Docker image
        docker build -f apps/api/Dockerfile -t calibrate-test . 2>&1 | Out-Null
        return $LASTEXITCODE -eq 0
    } catch {
        Write-Host "Docker build error: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

$ValidationResults.DockerBuild = Invoke-ValidationCommand "Docker Build" "Write-Host 'Testing Docker build...'" $dockerBuildTest

# Cleanup
Write-Host "`n🧹 Cleaning up..." -ForegroundColor Cyan
if ($apiProcess -and !$apiProcess.HasExited) {
    $apiProcess.Kill()
}
docker-compose down

# 15. Generate Validation Report
Write-Host "`n📊 Validation Report" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan

$totalTests = $ValidationResults.Count
$passedTests = ($ValidationResults.Values | Where-Object { $_ -eq $true }).Count
$failedTests = $totalTests - $passedTests

foreach ($test in $ValidationResults.GetEnumerator()) {
    $status = if ($test.Value) { "✅ PASSED" } else { "❌ FAILED" }
    $color = if ($test.Value) { "Green" } else { "Red" }
    Write-Host "$($test.Key): $status" -ForegroundColor $color
}

Write-Host "`nSummary: $passedTests/$totalTests tests passed" -ForegroundColor $(if ($failedTests -eq 0) { "Green" } else { "Red" })

if ($failedTests -gt 0) {
    Write-Host "`n❌ VALIDATION FAILED - DO NOT DEPLOY" -ForegroundColor Red
    Write-Host "Fix the failing tests before merging to master." -ForegroundColor Red
    exit 1
} else {
    Write-Host "`n✅ VALIDATION PASSED - SAFE TO DEPLOY" -ForegroundColor Green
    Write-Host "All checks passed. Safe to merge to master." -ForegroundColor Green
    exit 0
}
