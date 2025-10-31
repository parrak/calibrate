# Quick Local Test Script for Shopify OAuth
Write-Host "=== Shopify OAuth Local Test ===" -ForegroundColor Cyan
Write-Host ""

# Check if API is running
Write-Host "Checking if API server is running..." -ForegroundColor Yellow
try {
    $healthCheck = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
    Write-Host "✅ API server is running" -ForegroundColor Green
} catch {
    Write-Host "❌ API server is NOT running on http://localhost:3000" -ForegroundColor Red
    Write-Host "   Start it with: pnpm dev (from project root)" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Testing Install Endpoint..." -ForegroundColor Yellow

$url = "http://localhost:3000/api/platforms/shopify/oauth/install?project=demo&shop=test-store.myshopify.com"

try {
    $response = Invoke-WebRequest -Uri $url -UseBasicParsing -Method GET
    $body = $response.Content | ConvertFrom-Json
    
    Write-Host "✅ Success! Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Cyan
    Write-Host "  Install URL: $($body.installUrl)" -ForegroundColor Gray
    Write-Host "  Shop: $($body.shop)" -ForegroundColor Gray
    Write-Host "  Scopes: $($body.scopes -join ', ')" -ForegroundColor Gray
    Write-Host ""
    
    # Verify client ID
    if ($body.installUrl -match "client_id=55d12ed6f0420a21cd0682db635a7fa1") {
        Write-Host "✅ Client ID matches" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Client ID in URL doesn't match expected value" -ForegroundColor Yellow
    }
    
    # Verify redirect URI
    if ($body.installUrl -match "redirect_uri=http%3A%2F%2Flocalhost%3A3000" -or $body.installUrl -match "redirect_uri=http://localhost:3000") {
        Write-Host "✅ Redirect URI points to localhost (URL encoded)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Redirect URI doesn't match localhost" -ForegroundColor Yellow
        Write-Host "   Found: $($body.installUrl -replace '.*redirect_uri=([^&]+).*', '$1')" -ForegroundColor Gray
    }
    
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $statusCode = [int]$_.Exception.Response.StatusCode
        Write-Host "   Status Code: $statusCode" -ForegroundColor Gray
        
        if ($statusCode -eq 405) {
            Write-Host "   405 = Method Not Allowed - Route handler may not be exported correctly" -ForegroundColor Yellow
        } elseif ($statusCode -eq 500) {
            Write-Host "   500 = Server Error - Check environment variables (SHOPIFY_API_KEY)" -ForegroundColor Yellow
        }
        
        try {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "   Response Body: $responseBody" -ForegroundColor Gray
        } catch {
            Write-Host "   Could not read response body" -ForegroundColor Gray
        }
    }
}

Write-Host ""
Write-Host "=== Test Complete ===" -ForegroundColor Cyan

