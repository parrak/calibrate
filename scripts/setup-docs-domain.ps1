# Setup custom domain for Calibrate API Documentation
param(
    [string]$Environment = "production"
)

Write-Host "🌐 Setting up custom domain for Calibrate API Documentation..." -ForegroundColor Green
Write-Host "Environment: $Environment" -ForegroundColor Yellow

# Navigate to docs directory
Set-Location "apps/docs"

try {
    $domain = if ($Environment -eq "staging") { "staging-docs.calibr.lat" } else { "docs.calibr.lat" }
    
    Write-Host "Setting up domain: $domain" -ForegroundColor Yellow
    
    # Add domain to Vercel project
    Write-Host "Adding domain to Vercel project..." -ForegroundColor Yellow
    vercel domains add $domain
    
    Write-Host "✅ Domain setup complete!" -ForegroundColor Green
    Write-Host "🌐 Documentation will be available at: https://$domain" -ForegroundColor Cyan
    
    Write-Host ""
    Write-Host "📋 Next steps:" -ForegroundColor Yellow
    Write-Host "1. Update your DNS settings to point $domain to Vercel" -ForegroundColor White
    Write-Host "2. Wait for DNS propagation (usually 5-15 minutes)" -ForegroundColor White
    Write-Host "3. Test the domain: https://$domain" -ForegroundColor White

} catch {
    Write-Host "❌ Domain setup failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "You may need to add the domain manually in the Vercel dashboard" -ForegroundColor Yellow
    exit 1
} finally {
    # Return to project root
    Set-Location "../.."
}

Write-Host "🎉 Domain setup complete!" -ForegroundColor Green
