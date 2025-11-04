# Environment Variable Validation Script
# Ensures required environment variables are set and consistent across services

param(
    [string]$Service = "all",  # "api", "console", "site", "all"
    [string]$EnvFile = "",      # Path to .env file (optional)
    [switch]$Verbose = $false
)

$ErrorActionPreference = "Continue"

# Define required environment variables per service
$requiredVars = @{
    "api" = @(
        "DATABASE_URL",
        "NODE_ENV"
    )
    "console" = @(
        "DATABASE_URL",
        "NEXT_PUBLIC_API_BASE",
        "AUTH_SECRET",
        "NEXTAUTH_URL"
    )
    "site" = @(
        "NEXT_PUBLIC_API_BASE"
    )
}

# Optional but recommended variables
$recommendedVars = @{
    "api" = @(
        "WEBHOOK_SECRET",
        "SHOPIFY_API_KEY",
        "SHOPIFY_API_SECRET"
    )
    "console" = @(
        "CONSOLE_INTERNAL_TOKEN",
        "NEXTAUTH_SECRET"
    )
}

function Test-EnvVar {
    param(
        [string]$Name,
        [string]$Value,
        [bool]$Required = $true
    )

    $status = @{
        Name = $Name
        Set = $false
        Valid = $false
        Value = ""
    }

    if ([string]::IsNullOrWhiteSpace($Value)) {
        $status.Set = $false
        $status.Valid = -not $Required
        return $status
    }

    $status.Set = $true
    $status.Value = if ($Value.Length -gt 50) { $Value.Substring(0, 47) + "..." } else { $Value }
    
    # Basic validation
    switch ($Name) {
        "DATABASE_URL" {
            $status.Valid = $Value -match "^postgresql://"
        }
        { $_ -like "*SECRET" -or $_ -like "*KEY" -or $_ -like "*TOKEN" } {
            $status.Valid = $Value.Length -ge 16
        }
        { $_ -like "NEXT_PUBLIC_*" } {
            $status.Valid = $Value -match "^https?://"
        }
        "NODE_ENV" {
            $status.Valid = $Value -in @("development", "production", "test")
        }
        default {
            $status.Valid = $Value.Length -gt 0
        }
    }

    return $status
}

function Validate-Service {
    param(
        [string]$ServiceName
    )

    Write-Host "`nValidating $ServiceName environment..." -ForegroundColor Cyan
    
    $required = $requiredVars[$ServiceName]
    $recommended = $recommendedVars[$ServiceName]
    
    if (-not $required) {
        Write-Host "Unknown service: $ServiceName" -ForegroundColor Red
        return $false
    }

    $allValid = $true
    $issues = @()

    # Check required variables
    foreach ($var in $required) {
        $value = [Environment]::GetEnvironmentVariable($var, "Process")
        $status = Test-EnvVar -Name $var -Value $value -Required $true
        
        if (-not $status.Set) {
            $allValid = $false
            Write-Host "  ❌ $var - MISSING (required)" -ForegroundColor Red
            $issues += "$var is required but not set"
        } elseif (-not $status.Valid) {
            $allValid = $false
            Write-Host "  ⚠  $var - INVALID: $($status.Value)" -ForegroundColor Yellow
            $issues += "$var is set but invalid"
        } else {
            if ($Verbose) {
                Write-Host "  ✓  $var - OK" -ForegroundColor Green
            }
        }
    }

    # Check recommended variables
    foreach ($var in $recommended) {
        $value = [Environment]::GetEnvironmentVariable($var, "Process")
        $status = Test-EnvVar -Name $var -Value $value -Required $false
        
        if (-not $status.Set) {
            Write-Host "  ⚠  $var - NOT SET (recommended)" -ForegroundColor Yellow
        } elseif (-not $status.Valid) {
            Write-Host "  ⚠  $var - INVALID: $($status.Value)" -ForegroundColor Yellow
        } elseif ($Verbose) {
            Write-Host "  ✓  $var - OK" -ForegroundColor Green
        }
    }

    return $allValid
}

# Load .env file if specified
if ($EnvFile -and (Test-Path $EnvFile)) {
    Write-Host "Loading environment from $EnvFile..." -ForegroundColor Cyan
    Get-Content $EnvFile | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
}

# Load .env.local if it exists (for local development)
$localEnvFile = Join-Path $PSScriptRoot "..\.env.local"
if ((Test-Path $localEnvFile) -and -not $EnvFile) {
    Write-Host "Loading .env.local..." -ForegroundColor Cyan
    Get-Content $localEnvFile | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
}

# Validate services
$allPassed = $true

if ($Service -eq "all") {
    $allPassed = (Validate-Service "api") -and $allPassed
    $allPassed = (Validate-Service "console") -and $allPassed
    $allPassed = (Validate-Service "site") -and $allPassed
} else {
    $allPassed = Validate-Service $Service
}

Write-Host "`n" -NoNewline

if ($allPassed) {
    Write-Host "✅ Environment validation passed!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "❌ Environment validation failed!" -ForegroundColor Red
    Write-Host "`nPlease ensure all required environment variables are set." -ForegroundColor Yellow
    exit 1
}

