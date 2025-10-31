# Shopify OAuth End-to-End Flow Test Script
# Tests the production API endpoints

Write-Host "=== Shopify OAuth Flow Test ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: OAuth Install Endpoint
Write-Host "Test 1: OAuth Install Endpoint" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://api.calibr.lat/api/platforms/shopify/oauth/install?project=test&shop=test-store.myshopify.com" `
        -Method GET `
        -Headers @{"Accept"="application/json"} `
        -UseBasicParsing
    
    if ($response.StatusCode -eq 200) {
        $body = $response.Content | ConvertFrom-Json
        Write-Host "✅ Install endpoint working!" -ForegroundColor Green
        Write-Host "   Install URL: $($body.installUrl)" -ForegroundColor Gray
        Write-Host "   Shop: $($body.shop)" -ForegroundColor Gray
        Write-Host "   Scopes: $($body.scopes -join ', ')" -ForegroundColor Gray
        
        # Verify the install URL contains expected values
        if ($body.installUrl -match "test-store.myshopify.com/admin/oauth/authorize") {
            Write-Host "   ✅ Install URL format correct" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  Install URL format may be incorrect" -ForegroundColor Yellow
        }
        
        if ($body.installUrl -match "client_id=") {
            Write-Host "   ✅ Client ID included in URL" -ForegroundColor Green
        } else {
            Write-Host "   ❌ Client ID missing from URL!" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ Unexpected status code: $($response.StatusCode)" -ForegroundColor Red
        Write-Host "   Response: $($response.Content)" -ForegroundColor Gray
    }
} catch {
    $errorBody = $_.Exception.Response
    if ($errorBody) {
        $reader = New-Object System.IO.StreamReader($errorBody.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "❌ Error response:" -ForegroundColor Red
        Write-Host "   $responseBody" -ForegroundColor Gray
    } else {
        Write-Host "❌ Request failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""

# Test 2: Missing Parameters
Write-Host "Test 2: Missing Parameters Validation" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://api.calibr.lat/api/platforms/shopify/oauth/install" `
        -Method GET `
        -Headers @{"Accept"="application/json"} `
        -UseBasicParsing `
        -ErrorAction SilentlyContinue
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "✅ Validation working - correctly rejects missing params" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Unexpected error for missing params" -ForegroundColor Yellow
    }
}

Write-Host ""

# Test 3: Invalid Shop Domain
Write-Host "Test 3: Invalid Shop Domain Validation" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://api.calibr.lat/api/platforms/shopify/oauth/install?project=test&shop=invalid-shop.com" `
        -Method GET `
        -Headers @{"Accept"="application/json"} `
        -UseBasicParsing `
        -ErrorAction SilentlyContinue
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "✅ Validation working - correctly rejects invalid shop domain" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "=== Test Summary ===" -ForegroundColor Cyan
Write-Host "Note: Full OAuth callback test requires:" -ForegroundColor Yellow
Write-Host "  1. A real Shopify development store" -ForegroundColor Gray
Write-Host "  2. Manual testing through the console UI" -ForegroundColor Gray
Write-Host "  3. Completing the OAuth flow on Shopify" -ForegroundColor Gray
Write-Host ""
Write-Host "To test the full flow:" -ForegroundColor Yellow
Write-Host "  1. Navigate to: https://console.calibr.lat/p/[project]/integrations/shopify" -ForegroundColor Gray
Write-Host "  2. Click 'Connect Shopify Store'" -ForegroundColor Gray
Write-Host "  3. Enter a test shop domain" -ForegroundColor Gray
Write-Host "  4. Complete OAuth authorization" -ForegroundColor Gray
Write-Host "  5. Verify redirect back to console with success message" -ForegroundColor Gray

