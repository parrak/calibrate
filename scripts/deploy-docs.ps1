# Deploy Calibrate API Documentation
param(
    [switch]$DryRun = $false,
    [string]$Environment = "production"
)

Write-Host "Deploying Calibrate API Documentation..." -ForegroundColor Green
Write-Host "Environment: $Environment" -ForegroundColor Yellow

# Navigate to docs directory
Set-Location "apps/docs"

try {
    if ($DryRun) {
        Write-Host "DRY RUN: Would deploy docs to $Environment environment" -ForegroundColor Yellow
        Write-Host "Production URL: https://docs.calibr.lat" -ForegroundColor Cyan
        Write-Host "Staging URL: https://staging-docs.calibr.lat" -ForegroundColor Cyan
        return
    }

    # Deploy to Vercel
    if ($Environment -eq "staging") {
        Write-Host "Deploying to staging environment..." -ForegroundColor Yellow
        # Copy staging config to vercel.json temporarily
        Copy-Item "vercel.staging.json" "vercel.json" -Force
        vercel --prod --yes
        # Restore original config
        Copy-Item "vercel.json" "vercel.production.json" -Force
        Copy-Item "vercel.staging.json" "vercel.json" -Force
    } else {
        Write-Host "Deploying to production environment..." -ForegroundColor Yellow
        vercel --prod --yes
    }

    Write-Host "Documentation deployed successfully!" -ForegroundColor Green
    
    if ($Environment -eq "staging") {
        Write-Host "Staging URL: https://staging-docs.calibr.lat" -ForegroundColor Cyan
    } else {
        Write-Host "Production URL: https://docs.calibr.lat" -ForegroundColor Cyan
    }

} catch {
    Write-Host "Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} finally {
    # Return to project root
    Set-Location "../.."
}

Write-Host "Documentation deployment complete!" -ForegroundColor Green