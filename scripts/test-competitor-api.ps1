# Manual API Testing Script for Competitor Endpoints
# Usage: .\scripts\test-competitor-api.ps1 -BaseUrl "http://localhost:3001" -ProjectSlug "your-project-slug"

param(
    [string]$BaseUrl = "http://localhost:3001",
    [string]$ProjectSlug = "test-project"
)

Write-Host "=== Competitor API Testing ===" -ForegroundColor Cyan
Write-Host "Base URL: $BaseUrl" -ForegroundColor Gray
Write-Host "Project Slug: $ProjectSlug" -ForegroundColor Gray
Write-Host ""

$headers = @{
    "Content-Type" = "application/json"
}

# Test 1: GET /api/v1/competitors?projectSlug=xxx
Write-Host "Test 1: GET /api/v1/competitors?projectSlug=$ProjectSlug" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/v1/competitors?projectSlug=$ProjectSlug" -Method Get -Headers $headers
    Write-Host "✓ Success: Found $($response.competitors.Count) competitors" -ForegroundColor Green
    $response.competitors | ForEach-Object {
        Write-Host "  - $($_.name) ($($_.id))" -ForegroundColor Gray
    }
    $competitorId = if ($response.competitors.Count -gt 0) { $response.competitors[0].id } else { $null }
} catch {
    Write-Host "✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
    $competitorId = $null
}
Write-Host ""

# Test 2: POST /api/v1/competitors (Create competitor)
Write-Host "Test 2: POST /api/v1/competitors (Create competitor)" -ForegroundColor Yellow
try {
    $body = @{
        projectSlug = $ProjectSlug
        name = "Test Competitor $(Get-Date -Format 'yyyyMMddHHmmss')"
        domain = "test-competitor.com"
        channel = "shopify"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/v1/competitors" -Method Post -Headers $headers -Body $body
    Write-Host "✓ Success: Created competitor $($response.competitor.id)" -ForegroundColor Green
    $newCompetitorId = $response.competitor.id
    if (-not $competitorId) { $competitorId = $newCompetitorId }
} catch {
    Write-Host "✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
    if (-not $competitorId) {
        Write-Host "  Skipping tests that require competitor ID" -ForegroundColor Yellow
    }
}
Write-Host ""

if ($competitorId) {
    # Test 3: GET /api/v1/competitors/[id]
    Write-Host "Test 3: GET /api/v1/competitors/$competitorId" -ForegroundColor Yellow
    try {
        $response = Invoke-RestMethod -Uri "$BaseUrl/api/v1/competitors/$competitorId" -Method Get -Headers $headers
        Write-Host "✓ Success: Retrieved competitor $($response.competitor.name)" -ForegroundColor Green
    } catch {
        Write-Host "✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""

    # Test 4: GET /api/v1/competitors/[id]/products
    Write-Host "Test 4: GET /api/v1/competitors/$competitorId/products" -ForegroundColor Yellow
    try {
        $response = Invoke-RestMethod -Uri "$BaseUrl/api/v1/competitors/$competitorId/products" -Method Get -Headers $headers
        Write-Host "✓ Success: Found $($response.products.Count) products" -ForegroundColor Green
    } catch {
        Write-Host "✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""

    # Test 5: POST /api/v1/competitors/[id]/products (Add product)
    Write-Host "Test 5: POST /api/v1/competitors/$competitorId/products" -ForegroundColor Yellow
    try {
        $body = @{
            name = "Test Product"
            url = "https://test-competitor.com/products/test"
            skuCode = "TEST-SKU-001"
        } | ConvertTo-Json
        
        $response = Invoke-RestMethod -Uri "$BaseUrl/api/v1/competitors/$competitorId/products" -Method Post -Headers $headers -Body $body
        Write-Host "✓ Success: Created product $($response.product.id)" -ForegroundColor Green
    } catch {
        Write-Host "✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""

    # Test 6: PUT /api/v1/competitors/[id] (Update competitor)
    Write-Host "Test 6: PUT /api/v1/competitors/$competitorId" -ForegroundColor Yellow
    try {
        $body = @{
            name = "Updated Competitor Name"
            domain = "updated-competitor.com"
            channel = "shopify"
            isActive = $true
        } | ConvertTo-Json
        
        $response = Invoke-RestMethod -Uri "$BaseUrl/api/v1/competitors/$competitorId" -Method Put -Headers $headers -Body $body
        Write-Host "✓ Success: Updated competitor" -ForegroundColor Green
    } catch {
        Write-Host "✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""
}

# Test 7: GET /api/v1/competitors/rules?projectSlug=xxx
Write-Host "Test 7: GET /api/v1/competitors/rules?projectSlug=$ProjectSlug" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/v1/competitors/rules?projectSlug=$ProjectSlug" -Method Get -Headers $headers
    Write-Host "✓ Success: Found $($response.rules.Count) rules" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 8: POST /api/v1/competitors/rules (Create rule)
Write-Host "Test 8: POST /api/v1/competitors/rules" -ForegroundColor Yellow
try {
    $body = @{
        projectSlug = $ProjectSlug
        name = "Test Rule $(Get-Date -Format 'yyyyMMddHHmmss')"
        description = "Test pricing rule"
        rules = @{
            type = "beat_by_percent"
            value = 5
            minMargin = 10
        }
        isActive = $true
    } | ConvertTo-Json -Depth 10
    
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/v1/competitors/rules" -Method Post -Headers $headers -Body $body
    Write-Host "✓ Success: Created rule $($response.rule.id)" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 9: POST /api/v1/competitors/monitor (Monitor competitors)
Write-Host "Test 9: POST /api/v1/competitors/monitor" -ForegroundColor Yellow
try {
    $body = @{
        projectSlug = $ProjectSlug
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/v1/competitors/monitor" -Method Post -Headers $headers -Body $body
    Write-Host "✓ Success: Monitoring completed" -ForegroundColor Green
    Write-Host "  Results: $($response.results.Count) competitors monitored" -ForegroundColor Gray
} catch {
    Write-Host "✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "=== Testing Complete ===" -ForegroundColor Cyan

