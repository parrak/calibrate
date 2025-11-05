#!/usr/bin/env pwsh
<#
  scripts/setup.ps1
  One-step bootstrap script for Calibrate monorepo.
  Run from the repo root:
    pnpm setup
    # or directly:
    powershell -ExecutionPolicy Bypass -File ./scripts/setup.ps1

  This script:
  1. Checks prerequisites (Node.js, pnpm, Docker)
  2. Starts local database (Docker Compose)
  3. Creates minimal .env files if missing
  4. Installs dependencies
  5. Generates Prisma client
  6. Runs migrations
  7. Seeds database (optional)
#>

$ErrorActionPreference = "Stop"

function Write-Step {
    param([string]$Message)
    Write-Host "`n=== $Message ===" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Test-Command {
    param([string]$Command)
    try {
        $null = Get-Command $Command -ErrorAction Stop
        return $true
    } catch {
        return $false
    }
}

function Test-Prerequisites {
    Write-Step "Checking Prerequisites"
    
    $allGood = $true
    
    # Check Node.js
    if (Test-Command "node") {
        $nodeVersion = node --version
        Write-Success "Node.js: $nodeVersion"
    } else {
        Write-Error "Node.js not found. Please install Node.js 20+ from https://nodejs.org"
        $allGood = $false
    }
    
    # Check pnpm
    if (Test-Command "pnpm") {
        $pnpmVersion = pnpm --version
        Write-Success "pnpm: $pnpmVersion"
    } else {
        Write-Error "pnpm not found. Install with: npm install -g pnpm"
        $allGood = $false
    }
    
    # Check Docker
    if (Test-Command "docker") {
        try {
            $dockerVersion = docker --version
            Write-Success "Docker: $dockerVersion"
        } catch {
            Write-Warning "Docker found but may not be running"
        }
    } else {
        Write-Warning "Docker not found. Database setup will be skipped. Install from https://docker.com"
    }
    
    if (-not $allGood) {
        Write-Error "Prerequisites check failed. Please install missing tools and try again."
        exit 1
    }
    
    Write-Success "All prerequisites met"
}

function Start-Database {
    Write-Step "Starting Database (Docker Compose)"
    
    if (-not (Test-Command "docker")) {
        Write-Warning "Docker not available. Skipping database setup."
        Write-Warning "You'll need to set up PostgreSQL manually and update DATABASE_URL"
        return $false
    }
    
    try {
        # Check if containers are already running
        $existing = docker-compose ps --services --filter "status=running" 2>$null
        if ($existing) {
            Write-Success "Database containers already running"
            return $true
        }
        
        Write-Host "Starting Docker Compose..." -ForegroundColor Gray
        docker-compose up -d
        
        # Wait a moment for database to be ready
        Write-Host "Waiting for database to be ready..." -ForegroundColor Gray
        Start-Sleep -Seconds 3
        
        Write-Success "Database started successfully"
        return $true
    } catch {
        Write-Error "Failed to start database: $_"
        Write-Warning "You may need to start it manually: docker-compose up -d"
        return $false
    }
}

function Create-EnvFiles {
    Write-Step "Creating Environment Files"
    
    $dbUrl = "postgresql://user:pass@localhost:5432/calibr"
    
    # Root .env (if needed)
    $rootEnv = ".env"
    if (-not (Test-Path $rootEnv)) {
        Write-Host "Creating $rootEnv..." -ForegroundColor Gray
        @"
# Calibrate Environment Variables
# This file is for root-level configuration
# Service-specific env vars should go in their respective .env.local files
DATABASE_URL=$dbUrl
NODE_ENV=development
"@ | Out-File -FilePath $rootEnv -Encoding utf8
        Write-Success "Created $rootEnv"
    } else {
        Write-Host "$rootEnv already exists" -ForegroundColor Gray
    }
    
    # API .env.local
    $apiEnv = "apps/api/.env.local"
    if (-not (Test-Path $apiEnv)) {
        Write-Host "Creating $apiEnv..." -ForegroundColor Gray
        $apiEnvDir = Split-Path $apiEnv -Parent
        if (-not (Test-Path $apiEnvDir)) {
            New-Item -ItemType Directory -Path $apiEnvDir -Force | Out-Null
        }
        @"
# API Service Environment Variables
DATABASE_URL=$dbUrl
NODE_ENV=development

# Optional: Webhook Secret (generate a secure random string)
# WEBHOOK_SECRET=your-secret-here

# Optional: Shopify Integration
# SHOPIFY_API_KEY=your-api-key
# SHOPIFY_API_SECRET=your-api-secret
# SHOPIFY_SCOPES=read_products,write_products,read_orders,write_orders
# SHOPIFY_WEBHOOK_SECRET=your-webhook-secret

# Optional: Amazon SP-API
# AMAZON_SP_APP_ID=amzn1.sp.solution.xxxxx
# AMAZON_LWA_CLIENT_ID=amzn1.application-oa2-client.xxxxx
# AMAZON_LWA_CLIENT_SECRET=amzn1.oa2-cs.xxxxx
"@ | Out-File -FilePath $apiEnv -Encoding utf8
        Write-Success "Created $apiEnv"
    } else {
        Write-Host "$apiEnv already exists" -ForegroundColor Gray
    }
    
    # Console .env.local
    $consoleEnv = "apps/console/.env.local"
    if (-not (Test-Path $consoleEnv)) {
        Write-Host "Creating $consoleEnv..." -ForegroundColor Gray
        $consoleEnvDir = Split-Path $consoleEnv -Parent
        if (-not (Test-Path $consoleEnvDir)) {
            New-Item -ItemType Directory -Path $consoleEnvDir -Force | Out-Null
        }
        @"
# Console Service Environment Variables
DATABASE_URL=$dbUrl
NEXT_PUBLIC_API_BASE=http://localhost:3000
NEXTAUTH_URL=http://localhost:3001

# NextAuth Secret (generate with: openssl rand -base64 32)
# AUTH_SECRET=your-auth-secret-here
"@ | Out-File -FilePath $consoleEnv -Encoding utf8
        Write-Success "Created $consoleEnv"
    } else {
        Write-Host "$consoleEnv already exists" -ForegroundColor Gray
    }
    
    # Site .env.local
    $siteEnv = "apps/site/.env.local"
    if (-not (Test-Path $siteEnv)) {
        Write-Host "Creating $siteEnv..." -ForegroundColor Gray
        $siteEnvDir = Split-Path $siteEnv -Parent
        if (-not (Test-Path $siteEnvDir)) {
            New-Item -ItemType Directory -Path $siteEnvDir -Force | Out-Null
        }
        @"
# Site Service Environment Variables
NEXT_PUBLIC_API_BASE=http://localhost:3000
"@ | Out-File -FilePath $siteEnv -Encoding utf8
        Write-Success "Created $siteEnv"
    } else {
        Write-Host "$siteEnv already exists" -ForegroundColor Gray
    }
    
    Write-Success "Environment files ready"
}

function Install-Dependencies {
    Write-Step "Installing Dependencies"
    
    Write-Host "Running: pnpm install" -ForegroundColor Gray
    pnpm install
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to install dependencies"
        exit 1
    }
    
    Write-Success "Dependencies installed"
}

function Generate-PrismaClient {
    Write-Step "Generating Prisma Client"
    
    Write-Host "Running: pnpm db:generate" -ForegroundColor Gray
    pnpm db:generate
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to generate Prisma client"
        exit 1
    }
    
    Write-Success "Prisma client generated"
}

function Run-Migrations {
    Write-Step "Running Database Migrations"
    
    Write-Host "Running: pnpm migrate" -ForegroundColor Gray
    pnpm migrate
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to run migrations"
        Write-Warning "You may need to check your DATABASE_URL and ensure the database is running"
        exit 1
    }
    
    Write-Success "Migrations completed"
}

function Seed-Database {
    Write-Step "Seeding Database"
    
    $response = Read-Host "Do you want to seed the database with sample data? (y/N)"
    if ($response -match '^[Yy]') {
        Write-Host "Running: pnpm seed" -ForegroundColor Gray
        pnpm seed
        
        if ($LASTEXITCODE -ne 0) {
            Write-Warning "Database seeding failed (this is optional)"
        } else {
            Write-Success "Database seeded"
        }
    } else {
        Write-Host "Skipping database seed" -ForegroundColor Gray
    }
}

# Main execution
Write-Host "`n🚀 Calibrate Setup Script" -ForegroundColor Green
Write-Host "========================`n" -ForegroundColor Green

try {
    Test-Prerequisites
    Start-Database
    Create-EnvFiles
    Install-Dependencies
    Generate-PrismaClient
    Run-Migrations
    Seed-Database
    
    Write-Host "`n" -NoNewline
    Write-Success "Setup complete! 🎉"
    Write-Host "`nNext steps:" -ForegroundColor Cyan
    Write-Host "  1. Update .env files with your API keys and secrets (if needed)"
    Write-Host "  2. Run 'pnpm dev:all' to start all development servers"
    Write-Host "  3. Visit http://localhost:3001 for the Console"
    Write-Host "  4. Visit http://localhost:3000 for the API"
    Write-Host ""
} catch {
    Write-Error "Setup failed: $_"
    exit 1
}

