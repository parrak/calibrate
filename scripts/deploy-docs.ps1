# Deploy Calibrate API Documentation
# This script builds and deploys the documentation to Vercel

param(
    [switch]$DryRun = $false,
    [switch]$Help = $false
)

if ($Help) {
    Write-Host "Deploy Calibrate API Documentation" -ForegroundColor Green
    Write-Host ""
    Write-Host "Usage: .\scripts\deploy-docs.ps1 [options]"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -DryRun    Show what would be deployed without actually deploying"
    Write-Host "  -Help      Show this help message"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\scripts\deploy-docs.ps1              # Deploy to production"
    Write-Host "  .\scripts\deploy-docs.ps1 -DryRun      # Preview deployment"
    exit 0
}

Write-Host "🚀 Deploying Calibrate API Documentation" -ForegroundColor Green
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "apps/docs")) {
    Write-Error "❌ apps/docs directory not found. Run this script from the project root."
    exit 1
}

# Check if Vercel CLI is installed
try {
    $vercelVersion = vercel --version 2>$null
    Write-Host "✅ Vercel CLI found: $vercelVersion" -ForegroundColor Green
} catch {
    Write-Error "❌ Vercel CLI not found. Install it with: npm install -g vercel"
    exit 1
}

# Navigate to docs directory
Push-Location "apps/docs"

try {
    Write-Host "📁 Working directory: $(Get-Location)" -ForegroundColor Blue
    
    # Check if package.json exists
    if (-not (Test-Path "package.json")) {
        Write-Error "❌ package.json not found in apps/docs"
        exit 1
    }
    
    # Install dependencies
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    pnpm install
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "❌ Failed to install dependencies"
        exit 1
    }
    
    # Build documentation (if needed)
    Write-Host "🔨 Building documentation..." -ForegroundColor Yellow
    pnpm run build
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "❌ Failed to build documentation"
        exit 1
    }
    
    if ($DryRun) {
        Write-Host "🔍 DRY RUN - Would deploy the following files:" -ForegroundColor Cyan
        Get-ChildItem -Recurse | Where-Object { $_.Name -match '\.(html|yaml|json|css|js)$' } | ForEach-Object {
            Write-Host "  $($_.FullName)" -ForegroundColor Gray
        }
        Write-Host ""
        Write-Host "✅ Dry run completed. Use without -DryRun to actually deploy." -ForegroundColor Green
    } else {
        # Deploy to Vercel
        Write-Host "🚀 Deploying to Vercel..." -ForegroundColor Yellow
        
        # Check if already linked to Vercel project
        $vercelProject = vercel ls 2>$null | Select-String "calibrate-api-docs"
        
        if ($vercelProject) {
            Write-Host "✅ Found existing Vercel project: $vercelProject" -ForegroundColor Green
            vercel --prod
        } else {
            Write-Host "🔗 Linking to new Vercel project..." -ForegroundColor Yellow
            vercel --prod
        }
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "✅ Documentation deployed successfully!" -ForegroundColor Green
            Write-Host "📚 Live at: https://docs.calibr.lat" -ForegroundColor Cyan
            Write-Host ""
            Write-Host "🔗 Quick links:" -ForegroundColor Blue
            Write-Host "  - API Health: https://api.calibr.lat/api/health" -ForegroundColor Gray
            Write-Host "  - Swagger UI: https://docs.calibr.lat" -ForegroundColor Gray
            Write-Host "  - OpenAPI Spec: https://docs.calibr.lat/api/openapi.yaml" -ForegroundColor Gray
        } else {
            Write-Error "❌ Deployment failed"
            exit 1
        }
    }
} finally {
    # Return to original directory
    Pop-Location
}

Write-Host ""
Write-Host "🎉 Documentation deployment completed!" -ForegroundColor Green
