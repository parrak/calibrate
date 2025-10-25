# Staging Deployment Script
# Deploys the application to staging environment

param(
    [switch]$SkipTests,
    [switch]$SkipBuild,
    [switch]$Force,
    [string]$Environment = "staging"
)

Write-Host "🚀 Starting staging deployment..." -ForegroundColor Green

# Set error action preference
$ErrorActionPreference = "Stop"

# Configuration
$STAGING_API_URL = "https://staging-api.calibr.lat"
$STAGING_CONSOLE_URL = "https://staging-console.calibr.lat"
$STAGING_DOCS_URL = "https://staging-docs.calibr.lat"

# Colors for output
$SuccessColor = "Green"
$ErrorColor = "Red"
$WarningColor = "Yellow"
$InfoColor = "Cyan"

function Write-Success { param($Message) Write-Host "✅ $Message" -ForegroundColor $SuccessColor }
function Write-Error { param($Message) Write-Host "❌ $Message" -ForegroundColor $ErrorColor }
function Write-Warning { param($Message) Write-Host "⚠️ $Message" -ForegroundColor $WarningColor }
function Write-Info { param($Message) Write-Host "ℹ️ $Message" -ForegroundColor $InfoColor }

# Step 1: Pre-deployment validation
Write-Info "Step 1: Pre-deployment validation"
try {
    if (-not $SkipTests) {
        Write-Info "Running tests..."
        pnpm test
        if ($LASTEXITCODE -ne 0) {
            throw "Tests failed"
        }
        Write-Success "All tests passed"
    } else {
        Write-Warning "Skipping tests (--SkipTests flag used)"
    }
} catch {
    Write-Error "Pre-deployment validation failed: $_"
    exit 1
}

# Step 2: Build application
Write-Info "Step 2: Building application"
try {
    if (-not $SkipBuild) {
        Write-Info "Building API..."
        Set-Location apps/api
        pnpm build
        if ($LASTEXITCODE -ne 0) {
            throw "API build failed"
        }
        Write-Success "API built successfully"
        
        Set-Location ../console
        Write-Info "Building console..."
        pnpm build
        if ($LASTEXITCODE -ne 0) {
            throw "Console build failed"
        }
        Write-Success "Console built successfully"
        
        Set-Location ../docs
        Write-Info "Building docs..."
        pnpm build
        if ($LASTEXITCODE -ne 0) {
            throw "Docs build failed"
        }
        Write-Success "Docs built successfully"
        
        Set-Location ../..
    } else {
        Write-Warning "Skipping build (--SkipBuild flag used)"
    }
} catch {
    Write-Error "Build failed: $_"
    exit 1
}

# Step 3: Deploy API to staging
Write-Info "Step 3: Deploying API to staging"
try {
    Set-Location apps/api
    Write-Info "Deploying API to Vercel staging..."
    
    # Deploy to Vercel with staging configuration
    vercel deploy --prod --config vercel.staging.json --yes
    if ($LASTEXITCODE -ne 0) {
        throw "API deployment failed"
    }
    Write-Success "API deployed to staging successfully"
    
    Set-Location ../..
} catch {
    Write-Error "API deployment failed: $_"
    exit 1
}

# Step 4: Deploy console to staging
Write-Info "Step 4: Deploying console to staging"
try {
    Set-Location apps/console
    Write-Info "Deploying console to Vercel staging..."
    
    # Deploy to Vercel with staging configuration
    vercel deploy --prod --yes
    if ($LASTEXITCODE -ne 0) {
        throw "Console deployment failed"
    }
    Write-Success "Console deployed to staging successfully"
    
    Set-Location ../..
} catch {
    Write-Error "Console deployment failed: $_"
    exit 1
}

# Step 5: Deploy docs to staging
Write-Info "Step 5: Deploying docs to staging"
try {
    Set-Location apps/docs
    Write-Info "Deploying docs to Vercel staging..."
    
    # Deploy to Vercel with staging configuration
    vercel deploy --prod --yes
    if ($LASTEXITCODE -ne 0) {
        throw "Docs deployment failed"
    }
    Write-Success "Docs deployed to staging successfully"
    
    Set-Location ../..
} catch {
    Write-Error "Docs deployment failed: $_"
    exit 1
}

# Step 6: Initialize staging database
Write-Info "Step 6: Initializing staging database"
try {
    Write-Info "Initializing staging database..."
    
    # Call staging database initialization endpoint
    $response = Invoke-RestMethod -Uri "$STAGING_API_URL/api/staging/manage?action=seed" -Method POST -ContentType "application/json"
    if ($response.success) {
        Write-Success "Staging database initialized successfully"
    } else {
        throw "Database initialization failed"
    }
} catch {
    Write-Error "Staging database initialization failed: $_"
    exit 1
}

# Step 7: Verify staging deployment
Write-Info "Step 7: Verifying staging deployment"
try {
    Write-Info "Verifying API health..."
    $apiHealth = Invoke-RestMethod -Uri "$STAGING_API_URL/api/staging/health" -Method GET
    if ($apiHealth.status -eq "healthy") {
        Write-Success "API health check passed"
    } else {
        throw "API health check failed"
    }
    
    Write-Info "Verifying console accessibility..."
    $consoleResponse = Invoke-WebRequest -Uri $STAGING_CONSOLE_URL -Method GET -UseBasicParsing
    if ($consoleResponse.StatusCode -eq 200) {
        Write-Success "Console is accessible"
    } else {
        throw "Console is not accessible"
    }
    
    Write-Info "Verifying docs accessibility..."
    $docsResponse = Invoke-WebRequest -Uri $STAGING_DOCS_URL -Method GET -UseBasicParsing
    if ($docsResponse.StatusCode -eq 200) {
        Write-Success "Docs are accessible"
    } else {
        throw "Docs are not accessible"
    }
} catch {
    Write-Error "Staging deployment verification failed: $_"
    exit 1
}

# Step 8: Run staging tests
Write-Info "Step 8: Running staging tests"
try {
    Write-Info "Running staging integration tests..."
    
    # Test API endpoints
    $endpoints = @(
        "$STAGING_API_URL/api/staging/health",
        "$STAGING_API_URL/api/health",
        "$STAGING_API_URL/api/v1/catalog?project=staging-test",
        "$STAGING_API_URL/api/v1/price-changes?project=staging-test"
    )
    
    foreach ($endpoint in $endpoints) {
        Write-Info "Testing endpoint: $endpoint"
        $response = Invoke-RestMethod -Uri $endpoint -Method GET
        if ($response) {
            Write-Success "Endpoint $endpoint is working"
        } else {
            throw "Endpoint $endpoint is not working"
        }
    }
    
    Write-Success "All staging tests passed"
} catch {
    Write-Error "Staging tests failed: $_"
    exit 1
}

# Step 9: Deployment summary
Write-Info "Step 9: Deployment summary"
Write-Host ""
Write-Host "🎉 Staging deployment completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Deployment Summary:" -ForegroundColor Cyan
Write-Host "  • API: $STAGING_API_URL" -ForegroundColor White
Write-Host "  • Console: $STAGING_CONSOLE_URL" -ForegroundColor White
Write-Host "  • Docs: $STAGING_DOCS_URL" -ForegroundColor White
Write-Host "  • Environment: $Environment" -ForegroundColor White
Write-Host "  • Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor White
Write-Host ""
Write-Host "🔗 Quick Links:" -ForegroundColor Cyan
Write-Host "  • API Health: $STAGING_API_URL/api/staging/health" -ForegroundColor White
Write-Host "  • API Docs: $STAGING_DOCS_URL" -ForegroundColor White
Write-Host "  • Console: $STAGING_CONSOLE_URL" -ForegroundColor White
Write-Host ""
Write-Host "✅ Staging environment is ready for testing!" -ForegroundColor Green
