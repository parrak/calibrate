# Reset Staging Environment Script
# Resets the staging environment to a clean state

param(
    [string]$ApiUrl = "https://staging-api.calibr.lat",
    [switch]$Force
)

Write-Host "🔄 Resetting staging environment..." -ForegroundColor Yellow

# Set error action preference
$ErrorActionPreference = "Stop"

# Colors for output
$SuccessColor = "Green"
$ErrorColor = "Red"
$WarningColor = "Yellow"
$InfoColor = "Cyan"

function Write-Success { param($Message) Write-Host "✅ $Message" -ForegroundColor $SuccessColor }
function Write-Error { param($Message) Write-Host "❌ $Message" -ForegroundColor $ErrorColor }
function Write-Warning { param($Message) Write-Host "⚠️ $Message" -ForegroundColor $WarningColor }
function Write-Info { param($Message) Write-Host "ℹ️ $Message" -ForegroundColor $InfoColor }

# Confirmation prompt
if (-not $Force) {
    $confirmation = Read-Host "Are you sure you want to reset the staging environment? This will delete all test data. (y/N)"
    if ($confirmation -ne "y" -and $confirmation -ne "Y") {
        Write-Info "Reset cancelled by user"
        exit 0
    }
}

try {
    Write-Info "Step 1: Checking API connectivity..."
    $healthResponse = Invoke-RestMethod -Uri "$ApiUrl/api/staging/health" -Method GET
    if ($healthResponse.status -ne "healthy") {
        throw "Staging API is not healthy"
    }
    Write-Success "API is accessible"

    Write-Info "Step 2: Resetting staging database..."
    $resetResponse = Invoke-RestMethod -Uri "$ApiUrl/api/staging/manage?action=reset" -Method POST -ContentType "application/json"
    if ($resetResponse.success) {
        Write-Success "Staging database reset successfully"
    } else {
        throw "Failed to reset staging database"
    }

    Write-Info "Step 3: Verifying reset..."
    $statusResponse = Invoke-RestMethod -Uri "$ApiUrl/api/staging/manage?action=status" -Method GET
    if ($statusResponse.database.testData) {
        Write-Success "Test data verified"
    } else {
        throw "Test data verification failed"
    }

    Write-Info "Step 4: Running health check..."
    $finalHealth = Invoke-RestMethod -Uri "$ApiUrl/api/staging/health" -Method GET
    if ($finalHealth.status -eq "healthy") {
        Write-Success "Staging environment is healthy after reset"
    } else {
        throw "Staging environment is not healthy after reset"
    }

    Write-Host ""
    Write-Host "🎉 Staging environment reset completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Reset Summary:" -ForegroundColor Cyan
    Write-Host "  • Database: Reset to clean state" -ForegroundColor White
    Write-Host "  • Test Data: Fresh test data loaded" -ForegroundColor White
    Write-Host "  • API Status: $($finalHealth.status)" -ForegroundColor White
    Write-Host "  • Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor White
    Write-Host ""
    Write-Host "✅ Staging environment is ready for testing!" -ForegroundColor Green

} catch {
    Write-Error "Staging environment reset failed: $_"
    exit 1
}
