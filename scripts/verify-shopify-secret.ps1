# Verify Shopify API Secret Rotation
# This script tests if the Shopify OAuth endpoints are working with the new secret

param(
    [string]$ApiUrl = "http://localhost:3000",
    [string]$ProjectSlug = "demo",
    [string]$TestShop = "test-store.myshopify.com"
)

Write-Host "=== Shopify Secret Rotation Verification ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: OAuth Install Endpoint
Write-Host "Test 1: OAuth Install Endpoint" -ForegroundColor Yellow
Write-Host "Testing: $ApiUrl/api/platforms/shopify/oauth/install?project=$ProjectSlug&shop=$TestShop" -ForegroundColor Gray

try {
    $installUrl = "$ApiUrl/api/platforms/shopify/oauth/install?project=$ProjectSlug&shop=$TestShop"
    $response = Invoke-WebRequest -Uri $installUrl -UseBasicParsing -ErrorAction Stop
    
    if ($response.StatusCode -eq 200) {
        $data = $response.Content | ConvertFrom-Json
        if ($data.installUrl) {
            Write-Host "✅ PASS: Install endpoint returns valid URL" -ForegroundColor Green
            Write-Host "   Install URL: $($data.installUrl)" -ForegroundColor Gray
        } else {
            Write-Host "❌ FAIL: Install endpoint response missing installUrl" -ForegroundColor Red
            Write-Host "   Response: $($response.Content)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ FAIL: Unexpected status code: $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ FAIL: Request failed" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Yellow
    
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $responseBody = $reader.ReadToEnd()
        Write-Host "   Response: $responseBody" -ForegroundColor Yellow
    }
}

Write-Host ""

# Test 2: Check Environment Variables (if local)
if ($ApiUrl -like "*localhost*") {
    Write-Host "Test 2: Local Environment Variables" -ForegroundColor Yellow
    
    $envFile = "apps/api/.env.local"
    if (Test-Path $envFile) {
        $envContent = Get-Content $envFile -Raw
        if ($envContent -match "SHOPIFY_API_SECRET\s*=") {
            $secretMatch = $envContent -match "SHOPIFY_API_SECRET\s*=\s*([^\r\n]+)"
            if ($secretMatch) {
                $secretValue = $matches[1].Trim()
                if ($secretValue -and $secretValue -ne "YOUR_SHOPIFY_API_SECRET") {
                    Write-Host "✅ PASS: SHOPIFY_API_SECRET is set in .env.local" -ForegroundColor Green
                    Write-Host "   (Value is set, but checking format...)" -ForegroundColor Gray
                    if ($secretValue -match "^shpss_") {
                        Write-Host "✅ PASS: Secret format looks correct (starts with shpss_)" -ForegroundColor Green
                    } else {
                        Write-Host "⚠️  WARN: Secret doesn't match expected format (should start with shpss_)" -ForegroundColor Yellow
                    }
                } else {
                    Write-Host "❌ FAIL: SHOPIFY_API_SECRET not set or is placeholder" -ForegroundColor Red
                }
            } else {
                Write-Host "❌ FAIL: Could not parse SHOPIFY_API_SECRET from .env.local" -ForegroundColor Red
            }
        } else {
            Write-Host "❌ FAIL: SHOPIFY_API_SECRET not found in .env.local" -ForegroundColor Red
        }
    } else {
        Write-Host "⚠️  WARN: .env.local file not found at $envFile" -ForegroundColor Yellow
    }
} else {
    Write-Host "Test 2: Production Environment (Railway)" -ForegroundColor Yellow
    Write-Host "⚠️  Skipping: Cannot check production secrets locally" -ForegroundColor Gray
    Write-Host "   Verify manually in Railway dashboard or using Railway CLI:" -ForegroundColor Gray
    Write-Host "   railway variables | grep SHOPIFY_API_SECRET" -ForegroundColor Cyan
}

Write-Host ""

# Test 3: Production URL Test (if provided)
if ($ApiUrl -notlike "*localhost*") {
    Write-Host "Test 3: Production Health Check" -ForegroundColor Yellow
    try {
        $healthUrl = "$ApiUrl/api/health"
        $response = Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -ErrorAction Stop
        
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ PASS: API server is responding" -ForegroundColor Green
        } else {
            Write-Host "❌ FAIL: API server returned status $($response.StatusCode)" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ FAIL: Cannot reach API server" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Yellow
    }
    Write-Host ""
}

# Summary
Write-Host "=== Summary ===" -ForegroundColor Cyan
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. If install endpoint fails, check:" -ForegroundColor White
Write-Host "   - Railway environment variables (if production)" -ForegroundColor Gray
Write-Host "   - apps/api/.env.local (if local)" -ForegroundColor Gray
Write-Host "   - API server is running and has reloaded env vars" -ForegroundColor Gray
Write-Host ""
Write-Host "2. If HMAC verification fails on OAuth callback:" -ForegroundColor White
Write-Host "   - Secret in Railway must match Shopify Partners Dashboard exactly" -ForegroundColor Gray
Write-Host "   - No extra spaces or line breaks" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Reconnect existing integrations after rotation:" -ForegroundColor White
Write-Host "   - Disconnect old integration" -ForegroundColor Gray
Write-Host "   - Reconnect with new secret" -ForegroundColor Gray

