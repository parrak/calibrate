# Test API endpoints
Write-Host "Testing Calibr API endpoints..." -ForegroundColor Green

# Test health endpoint
Write-Host "`n1. Testing health endpoint..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-WebRequest -Uri "https://calibrapi-production.up.railway.app/api/health" -Method GET
    Write-Host "✅ Health endpoint: Status $($healthResponse.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($healthResponse.Content)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Health endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test healthz endpoint
Write-Host "`n2. Testing healthz endpoint..." -ForegroundColor Yellow
try {
    $healthzResponse = Invoke-WebRequest -Uri "https://calibrapi-production.up.railway.app/api/healthz" -Method GET
    Write-Host "✅ Healthz endpoint: Status $($healthzResponse.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($healthzResponse.Content)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Healthz endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test catalog endpoint
Write-Host "`n3. Testing catalog endpoint..." -ForegroundColor Yellow
try {
    $catalogResponse = Invoke-WebRequest -Uri "https://calibrapi-production.up.railway.app/api/v1/catalog?productCode=PRO&project=demo" -Method GET
    Write-Host "✅ Catalog endpoint: Status $($catalogResponse.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($catalogResponse.Content)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Catalog endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nAPI testing completed!" -ForegroundColor Green

