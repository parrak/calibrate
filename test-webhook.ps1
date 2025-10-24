$body = '{"idempotencyKey":"test-20251020-041933","skuCode":"PRO-M","currency":"USD","proposedAmount":5500,"context":{"test":true,"reason":"production testing"},"source":"MANUAL"}'

$timestamp = [Math]::Floor([decimal]((Get-Date).ToUniversalTime() - [DateTime]::new(1970,1,1)).TotalSeconds)
$secret = "test-secret-key"
$signature = [System.Security.Cryptography.HMACSHA256]::new([System.Text.Encoding]::UTF8.GetBytes($secret)).ComputeHash([System.Text.Encoding]::UTF8.GetBytes("$timestamp.$body")) | ForEach-Object { $_.ToString("x2") } | Join-String -Separator ""

$headers = @{
    "Content-Type" = "application/json"
    "X-Calibr-Signature" = "t=$timestamp,v1=$signature"
    "X-Calibr-Project" = "demo"
}

Write-Host "Testing webhook with signature: t=$timestamp,v1=$signature"

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/v1/webhooks/price-suggestion" -Method POST -Body $body -Headers $headers -UseBasicParsing -TimeoutSec 10
    Write-Host "Webhook Status: $($response.StatusCode)"
    Write-Host "Response: $($response.Content)"
} catch {
    Write-Host "Webhook Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Error Response: $responseBody"
    }
}
