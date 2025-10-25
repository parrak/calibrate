# Staging Environment Status Script
# Checks the status of the staging environment

param(
    [string]$ApiUrl = "https://staging-api.calibr.lat",
    [string]$ConsoleUrl = "https://staging-console.calibr.lat",
    [string]$DocsUrl = "https://staging-docs.calibr.lat",
    [switch]$Detailed
)

Write-Host "📊 Checking staging environment status..." -ForegroundColor Cyan

# Set error action preference
$ErrorActionPreference = "Stop"

# Colors for output
$SuccessColor = "Green"
$ErrorColor = "Red"
$WarningColor = "Yellow"
$InfoColor = "Cyan"
$StatusColor = "Magenta"

function Write-Success { param($Message) Write-Host "✅ $Message" -ForegroundColor $SuccessColor }
function Write-Error { param($Message) Write-Host "❌ $Message" -ForegroundColor $ErrorColor }
function Write-Warning { param($Message) Write-Host "⚠️ $Message" -ForegroundColor $WarningColor }
function Write-Info { param($Message) Write-Host "ℹ️ $Message" -ForegroundColor $InfoColor }
function Write-Status { param($Message) Write-Host "📊 $Message" -ForegroundColor $StatusColor }

# Status tracking
$Status = @{
    API = @{ Status = "Unknown"; Details = @() }
    Console = @{ Status = "Unknown"; Details = @() }
    Docs = @{ Status = "Unknown"; Details = @() }
    Database = @{ Status = "Unknown"; Details = @() }
    Overall = "Unknown"
}

# Check API status
Write-Status "Checking API status..."
try {
    $apiHealth = Invoke-RestMethod -Uri "$ApiUrl/api/staging/health" -Method GET
    $Status.API.Status = $apiHealth.status
    $Status.API.Details = @(
        "Response Time: $($apiHealth.responseTime)",
        "Database: $($apiHealth.database.connected)",
        "Migrations: $($apiHealth.database.migrations)",
        "Test Data: $($apiHealth.database.testData)"
    )
    Write-Success "API is $($apiHealth.status)"
} catch {
    $Status.API.Status = "Error"
    $Status.API.Details = @("Error: $_")
    Write-Error "API check failed: $_"
}

# Check Console status
Write-Status "Checking Console status..."
try {
    $consoleResponse = Invoke-WebRequest -Uri $ConsoleUrl -Method GET -UseBasicParsing
    $Status.Console.Status = if ($consoleResponse.StatusCode -eq 200) { "Healthy" } else { "Error" }
    $Status.Console.Details = @("Status Code: $($consoleResponse.StatusCode)")
    Write-Success "Console is accessible"
} catch {
    $Status.Console.Status = "Error"
    $Status.Console.Details = @("Error: $_")
    Write-Error "Console check failed: $_"
}

# Check Docs status
Write-Status "Checking Docs status..."
try {
    $docsResponse = Invoke-WebRequest -Uri $DocsUrl -Method GET -UseBasicParsing
    $Status.Docs.Status = if ($docsResponse.StatusCode -eq 200) { "Healthy" } else { "Error" }
    $Status.Docs.Details = @("Status Code: $($docsResponse.StatusCode)")
    Write-Success "Docs are accessible"
} catch {
    $Status.Docs.Status = "Error"
    $Status.Docs.Details = @("Error: $_")
    Write-Error "Docs check failed: $_"
}

# Check Database status
Write-Status "Checking Database status..."
try {
    $dbStatus = Invoke-RestMethod -Uri "$ApiUrl/api/staging/manage?action=status" -Method GET
    $Status.Database.Status = if ($dbStatus.database.connected) { "Connected" } else { "Disconnected" }
    $Status.Database.Details = @(
        "Connected: $($dbStatus.database.connected)",
        "Migrations: $($dbStatus.database.migrations)",
        "Test Data: $($dbStatus.database.testData)"
    )
    Write-Success "Database is $($Status.Database.Status.ToLower())"
} catch {
    $Status.Database.Status = "Error"
    $Status.Database.Details = @("Error: $_")
    Write-Error "Database check failed: $_"
}

# Determine overall status
$healthyServices = 0
$totalServices = 4

if ($Status.API.Status -eq "healthy") { $healthyServices++ }
if ($Status.Console.Status -eq "Healthy") { $healthyServices++ }
if ($Status.Docs.Status -eq "Healthy") { $healthyServices++ }
if ($Status.Database.Status -eq "Connected") { $healthyServices++ }

if ($healthyServices -eq $totalServices) {
    $Status.Overall = "Healthy"
} elseif ($healthyServices -gt 0) {
    $Status.Overall = "Degraded"
} else {
    $Status.Overall = "Unhealthy"
}

# Display status summary
Write-Host ""
Write-Host "📊 Staging Environment Status Summary" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Overall status
$overallColor = switch ($Status.Overall) {
    "Healthy" { "Green" }
    "Degraded" { "Yellow" }
    "Unhealthy" { "Red" }
    default { "White" }
}
Write-Host "Overall Status: $($Status.Overall)" -ForegroundColor $overallColor
Write-Host ""

# Service status
Write-Host "Service Status:" -ForegroundColor Cyan
Write-Host "  • API: $($Status.API.Status)" -ForegroundColor $(if ($Status.API.Status -eq "healthy") { "Green" } else { "Red" })
Write-Host "  • Console: $($Status.Console.Status)" -ForegroundColor $(if ($Status.Console.Status -eq "Healthy") { "Green" } else { "Red" })
Write-Host "  • Docs: $($Status.Docs.Status)" -ForegroundColor $(if ($Status.Docs.Status -eq "Healthy") { "Green" } else { "Red" })
Write-Host "  • Database: $($Status.Database.Status)" -ForegroundColor $(if ($Status.Database.Status -eq "Connected") { "Green" } else { "Red" })
Write-Host ""

# Detailed information
if ($Detailed) {
    Write-Host "Detailed Information:" -ForegroundColor Cyan
    Write-Host "====================" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "API Details:" -ForegroundColor White
    foreach ($detail in $Status.API.Details) {
        Write-Host "  • $detail" -ForegroundColor Gray
    }
    Write-Host ""
    
    Write-Host "Console Details:" -ForegroundColor White
    foreach ($detail in $Status.Console.Details) {
        Write-Host "  • $detail" -ForegroundColor Gray
    }
    Write-Host ""
    
    Write-Host "Docs Details:" -ForegroundColor White
    foreach ($detail in $Status.Docs.Details) {
        Write-Host "  • $detail" -ForegroundColor Gray
    }
    Write-Host ""
    
    Write-Host "Database Details:" -ForegroundColor White
    foreach ($detail in $Status.Database.Details) {
        Write-Host "  • $detail" -ForegroundColor Gray
    }
    Write-Host ""
}

# Quick links
Write-Host "Quick Links:" -ForegroundColor Cyan
Write-Host "  • API Health: $ApiUrl/api/staging/health" -ForegroundColor White
Write-Host "  • API Status: $ApiUrl/api/staging/manage?action=status" -ForegroundColor White
Write-Host "  • Console: $ConsoleUrl" -ForegroundColor White
Write-Host "  • Docs: $DocsUrl" -ForegroundColor White
Write-Host ""

# Recommendations
if ($Status.Overall -eq "Healthy") {
    Write-Host "✅ Staging environment is healthy and ready for testing!" -ForegroundColor Green
} elseif ($Status.Overall -eq "Degraded") {
    Write-Host "⚠️ Staging environment is degraded. Some services may not be working properly." -ForegroundColor Yellow
    Write-Host "   Consider running: pwsh scripts/reset-staging.ps1" -ForegroundColor Yellow
} else {
    Write-Host "❌ Staging environment is unhealthy. Please check the errors above." -ForegroundColor Red
    Write-Host "   Consider running: pwsh scripts/reset-staging.ps1" -ForegroundColor Red
}

Write-Host ""
Write-Host "Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
