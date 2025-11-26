# Monitor PR Checks
param(
    [int]$PRNumber = 51,
    [int]$MaxAttempts = 60,
    [int]$IntervalSeconds = 15
)

$attempt = 0
$allCompleted = $false

Write-Host "`n🔍 Monitoring PR #$PRNumber checks..." -ForegroundColor Cyan
Write-Host "   Max attempts: $MaxAttempts (checking every $IntervalSeconds seconds)`n" -ForegroundColor Gray

while ($attempt -lt $MaxAttempts -and -not $allCompleted) {
    $attempt++
    Write-Host "=== Check #$attempt at $(Get-Date -Format 'HH:mm:ss') ===" -ForegroundColor Cyan
    
    try {
        $checksOutput = gh pr checks $PRNumber 2>&1 | Out-String
        Write-Host $checksOutput
        
        # Count statuses
        $pendingCount = ([regex]::Matches($checksOutput, 'pending')).Count
        $passCount = ([regex]::Matches($checksOutput, '\tpass\t')).Count
        $failCount = ([regex]::Matches($checksOutput, '\tfail\t')).Count
        
        Write-Host "`n📊 Status: ✅ Pass: $passCount | ⏳ Pending: $pendingCount | ❌ Fail: $failCount" -ForegroundColor Yellow
        
        # Check if all completed
        if ($pendingCount -eq 0) {
            if ($failCount -gt 0) {
                Write-Host "`n❌ Some checks failed!" -ForegroundColor Red
                $allCompleted = $true
            } else {
                Write-Host "`n✅ All checks passed!" -ForegroundColor Green
                $allCompleted = $true
            }
        } elseif ($failCount -gt 0) {
            Write-Host "`n❌ Some checks failed while others are pending!" -ForegroundColor Red
            $allCompleted = $true
        } else {
            Write-Host "⏳ Waiting for checks to complete...`n" -ForegroundColor Yellow
            Start-Sleep -Seconds $IntervalSeconds
        }
    } catch {
        Write-Host "Error checking PR status: $_" -ForegroundColor Red
        Start-Sleep -Seconds $IntervalSeconds
    }
}

if (-not $allCompleted) {
    Write-Host "`n⏱️  Timeout reached. Some checks may still be running." -ForegroundColor Yellow
    Write-Host "   View PR: https://github.com/parrak/calibrate/pull/$PRNumber" -ForegroundColor Cyan
}

