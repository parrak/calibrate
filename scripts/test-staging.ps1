# Staging Testing Script
# Runs comprehensive tests against staging environment

param(
    [string]$ApiUrl = "https://staging-api.calibr.lat",
    [string]$ConsoleUrl = "https://staging-console.calibr.lat",
    [string]$DocsUrl = "https://staging-docs.calibr.lat",
    [switch]$Verbose,
    [switch]$SkipPerformance,
    [switch]$SkipSecurity
)

Write-Host "🧪 Starting staging environment testing..." -ForegroundColor Green

# Set error action preference
$ErrorActionPreference = "Stop"

# Colors for output
$SuccessColor = "Green"
$ErrorColor = "Red"
$WarningColor = "Yellow"
$InfoColor = "Cyan"
$TestColor = "Magenta"

function Write-Success { param($Message) Write-Host "✅ $Message" -ForegroundColor $SuccessColor }
function Write-Error { param($Message) Write-Host "❌ $Message" -ForegroundColor $ErrorColor }
function Write-Warning { param($Message) Write-Host "⚠️ $Message" -ForegroundColor $WarningColor }
function Write-Info { param($Message) Write-Host "ℹ️ $Message" -ForegroundColor $InfoColor }
function Write-Test { param($Message) Write-Host "🧪 $Message" -ForegroundColor $TestColor }

# Test results tracking
$TestResults = @{
    Total = 0
    Passed = 0
    Failed = 0
    Skipped = 0
}

function Add-TestResult {
    param($TestName, $Passed, $Message = "")
    $TestResults.Total++
    if ($Passed) {
        $TestResults.Passed++
        Write-Success "$TestName - $Message"
    } else {
        $TestResults.Failed++
        Write-Error "$TestName - $Message"
    }
}

function Add-SkippedTest {
    param($TestName, $Reason = "")
    $TestResults.Total++
    $TestResults.Skipped++
    Write-Warning "$TestName - SKIPPED ($Reason)"
}

# Step 1: Basic connectivity tests
Write-Info "Step 1: Basic connectivity tests"
try {
    Write-Test "Testing API connectivity..."
    $apiResponse = Invoke-WebRequest -Uri $ApiUrl -Method GET -UseBasicParsing -TimeoutSec 30
    Add-TestResult "API Connectivity" ($apiResponse.StatusCode -eq 200) "Status: $($apiResponse.StatusCode)"
    
    Write-Test "Testing console connectivity..."
    $consoleResponse = Invoke-WebRequest -Uri $ConsoleUrl -Method GET -UseBasicParsing -TimeoutSec 30
    Add-TestResult "Console Connectivity" ($consoleResponse.StatusCode -eq 200) "Status: $($consoleResponse.StatusCode)"
    
    Write-Test "Testing docs connectivity..."
    $docsResponse = Invoke-WebRequest -Uri $DocsUrl -Method GET -UseBasicParsing -TimeoutSec 30
    Add-TestResult "Docs Connectivity" ($docsResponse.StatusCode -eq 200) "Status: $($docsResponse.StatusCode)"
} catch {
    Write-Error "Basic connectivity tests failed: $_"
    exit 1
}

# Step 2: API health checks
Write-Info "Step 2: API health checks"
try {
    Write-Test "Testing staging health endpoint..."
    $stagingHealth = Invoke-RestMethod -Uri "$ApiUrl/api/staging/health" -Method GET
    Add-TestResult "Staging Health Check" ($stagingHealth.status -eq "healthy") "Status: $($stagingHealth.status)"
    
    Write-Test "Testing main health endpoint..."
    $mainHealth = Invoke-RestMethod -Uri "$ApiUrl/api/health" -Method GET
    Add-TestResult "Main Health Check" ($mainHealth.status -eq "healthy") "Status: $($mainHealth.status)"
    
    Write-Test "Testing metrics endpoint..."
    $metrics = Invoke-RestMethod -Uri "$ApiUrl/api/metrics" -Method GET
    Add-TestResult "Metrics Endpoint" ($metrics -ne $null) "Metrics retrieved successfully"
} catch {
    Write-Error "API health checks failed: $_"
    exit 1
}

# Step 3: API functionality tests
Write-Info "Step 3: API functionality tests"
try {
    Write-Test "Testing catalog endpoint..."
    $catalog = Invoke-RestMethod -Uri "$ApiUrl/api/v1/catalog?project=staging-test" -Method GET
    Add-TestResult "Catalog Endpoint" ($catalog -ne $null) "Products retrieved: $($catalog.products.Count)"
    
    Write-Test "Testing price changes endpoint..."
    $priceChanges = Invoke-RestMethod -Uri "$ApiUrl/api/v1/price-changes?project=staging-test" -Method GET
    Add-TestResult "Price Changes Endpoint" ($priceChanges -ne $null) "Items retrieved: $($priceChanges.items.Count)"
    
    Write-Test "Testing webhook endpoint..."
    $webhookTest = @{
        productCode = "STAGING-PRODUCT-001"
        newPrice = 39.99
        oldPrice = 29.99
        source = "test"
    }
    $webhookResponse = Invoke-RestMethod -Uri "$ApiUrl/api/v1/webhooks/price-suggestion" -Method POST -Body ($webhookTest | ConvertTo-Json) -ContentType "application/json"
    Add-TestResult "Webhook Endpoint" ($webhookResponse -ne $null) "Webhook processed successfully"
} catch {
    Write-Error "API functionality tests failed: $_"
    exit 1
}

# Step 4: Performance tests
if (-not $SkipPerformance) {
    Write-Info "Step 4: Performance tests"
    try {
        Write-Test "Testing API response times..."
        $endpoints = @(
            "$ApiUrl/api/health",
            "$ApiUrl/api/staging/health",
            "$ApiUrl/api/metrics",
            "$ApiUrl/api/v1/catalog?project=staging-test"
        )
        
        foreach ($endpoint in $endpoints) {
            $startTime = Get-Date
            $response = Invoke-RestMethod -Uri $endpoint -Method GET
            $endTime = Get-Date
            $responseTime = ($endTime - $startTime).TotalMilliseconds
            
            $isFast = $responseTime -lt 1000
            Add-TestResult "Performance: $endpoint" $isFast "Response time: $([math]::Round($responseTime, 2))ms"
        }
        
        Write-Test "Testing concurrent requests..."
        $concurrentTests = @()
        for ($i = 1; $i -le 5; $i++) {
            $concurrentTests += Start-Job -ScriptBlock {
                param($url)
                $startTime = Get-Date
                $response = Invoke-RestMethod -Uri $url -Method GET
                $endTime = Get-Date
                return ($endTime - $startTime).TotalMilliseconds
            } -ArgumentList "$ApiUrl/api/health"
        }
        
        $concurrentResults = $concurrentTests | Wait-Job | Receive-Job
        $concurrentTests | Remove-Job
        
        $avgResponseTime = ($concurrentResults | Measure-Object -Average).Average
        $isConcurrent = $avgResponseTime -lt 2000
        Add-TestResult "Concurrent Requests" $isConcurrent "Average response time: $([math]::Round($avgResponseTime, 2))ms"
    } catch {
        Write-Error "Performance tests failed: $_"
        exit 1
    }
} else {
    Add-SkippedTest "Performance Tests" "Skipped by user request"
}

# Step 5: Security tests
if (-not $SkipSecurity) {
    Write-Info "Step 5: Security tests"
    try {
        Write-Test "Testing security headers..."
        $headersResponse = Invoke-WebRequest -Uri $ApiUrl -Method GET -UseBasicParsing
        $securityHeaders = @(
            "X-Content-Type-Options",
            "X-Frame-Options",
            "X-XSS-Protection",
            "Strict-Transport-Security"
        )
        
        foreach ($header in $securityHeaders) {
            $hasHeader = $headersResponse.Headers.ContainsKey($header)
            Add-TestResult "Security Header: $header" $hasHeader "Header present: $hasHeader"
        }
        
        Write-Test "Testing CORS headers..."
        $corsResponse = Invoke-WebRequest -Uri $ApiUrl -Method OPTIONS -UseBasicParsing
        $hasCors = $corsResponse.Headers.ContainsKey("Access-Control-Allow-Origin")
        Add-TestResult "CORS Headers" $hasCors "CORS headers present: $hasCors"
        
        Write-Test "Testing rate limiting..."
        $rateLimitTests = @()
        for ($i = 1; $i -le 10; $i++) {
            $rateLimitTests += Start-Job -ScriptBlock {
                param($url)
                try {
                    $response = Invoke-RestMethod -Uri $url -Method GET
                    return $response
                } catch {
                    return $_.Exception.Response.StatusCode
                }
            } -ArgumentList "$ApiUrl/api/health"
        }
        
        $rateLimitResults = $rateLimitTests | Wait-Job | Receive-Job
        $rateLimitTests | Remove-Job
        
        $rateLimited = $rateLimitResults | Where-Object { $_ -eq 429 }
        $isRateLimited = $rateLimited.Count -gt 0
        Add-TestResult "Rate Limiting" $isRateLimited "Rate limited requests: $($rateLimited.Count)"
    } catch {
        Write-Error "Security tests failed: $_"
        exit 1
    }
} else {
    Add-SkippedTest "Security Tests" "Skipped by user request"
}

# Step 6: Database tests
Write-Info "Step 6: Database tests"
try {
    Write-Test "Testing database connectivity..."
    $dbStatus = Invoke-RestMethod -Uri "$ApiUrl/api/staging/manage?action=status" -Method GET
    Add-TestResult "Database Connectivity" $dbStatus.database.connected "Database status: $($dbStatus.database.connected)"
    
    Write-Test "Testing database migrations..."
    Add-TestResult "Database Migrations" $dbStatus.database.migrations "Migrations status: $($dbStatus.database.migrations)"
    
    Write-Test "Testing test data..."
    Add-TestResult "Test Data" $dbStatus.database.testData "Test data present: $($dbStatus.database.testData)"
} catch {
    Write-Error "Database tests failed: $_"
    exit 1
}

# Step 7: Integration tests
Write-Info "Step 7: Integration tests"
try {
    Write-Test "Testing end-to-end workflow..."
    
    # Test complete workflow: create price change, approve it, verify it
    $priceChange = @{
        productCode = "STAGING-PRODUCT-001"
        newPrice = 45.99
        oldPrice = 39.99
        source = "integration-test"
        metadata = @{
            test = $true
            timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
        }
    }
    
    $createResponse = Invoke-RestMethod -Uri "$ApiUrl/api/v1/webhooks/price-suggestion" -Method POST -Body ($priceChange | ConvertTo-Json) -ContentType "application/json"
    Add-TestResult "Price Change Creation" ($createResponse -ne $null) "Price change created successfully"
    
    # Verify the price change was created
    $verifyResponse = Invoke-RestMethod -Uri "$ApiUrl/api/v1/price-changes?project=staging-test" -Method GET
    $testPriceChange = $verifyResponse.items | Where-Object { $_.metadata.test -eq $true }
    Add-TestResult "Price Change Verification" ($testPriceChange -ne $null) "Price change verified in database"
    
} catch {
    Write-Error "Integration tests failed: $_"
    exit 1
}

# Step 8: Test summary
Write-Info "Step 8: Test summary"
Write-Host ""
Write-Host "📊 Test Results Summary:" -ForegroundColor Cyan
Write-Host "  • Total Tests: $($TestResults.Total)" -ForegroundColor White
Write-Host "  • Passed: $($TestResults.Passed)" -ForegroundColor Green
Write-Host "  • Failed: $($TestResults.Failed)" -ForegroundColor Red
Write-Host "  • Skipped: $($TestResults.Skipped)" -ForegroundColor Yellow
Write-Host "  • Success Rate: $([math]::Round(($TestResults.Passed / $TestResults.Total) * 100, 2))%" -ForegroundColor White
Write-Host ""

if ($TestResults.Failed -eq 0) {
    Write-Host "🎉 All tests passed! Staging environment is healthy." -ForegroundColor Green
    exit 0
} else {
    Write-Host "❌ Some tests failed. Please review the results above." -ForegroundColor Red
    exit 1
}
