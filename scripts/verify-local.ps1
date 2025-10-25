#!/usr/bin/env pwsh
<#
  scripts/verify-local.ps1
  Runs the recommended local verification steps for the Calibrate monorepo.
  Run from the repo root:
    powershell -ExecutionPolicy Bypass -File ./scripts/verify-local.ps1

  This script will stop on the first failing step and print guidance.
#>

function Run-Check {
    param(
        [string]$Command,
        [string]$Label
    )

    Write-Host "\n=== $Label ===" -ForegroundColor Cyan
    Write-Host "Running: $Command" -ForegroundColor Gray
    $proc = Start-Process -FilePath pwsh -ArgumentList "-Command", $Command -NoNewWindow -Wait -PassThru -WindowStyle Hidden
    if ($proc.ExitCode -ne 0) {
        Write-Error "Step failed: $Label (exit code $($proc.ExitCode)). Aborting."
        exit $proc.ExitCode
    }
}

Write-Host "Starting local verification for Calibrate" -ForegroundColor Green

# 1) Start local infra (docker-compose)
Run-Check -Command 'docker-compose up -d' -Label 'Start local infra (docker-compose up -d)'

# 2) Install dependencies
Run-Check -Command 'pnpm install' -Label 'Install dependencies (pnpm install)'

# 3) Generate Prisma client
Run-Check -Command 'pnpm db:generate' -Label 'Generate Prisma client (pnpm db:generate)'

# 4) Run migrations and seed (run against disposable/dev DB only)
Run-Check -Command 'pnpm migrate' -Label 'Run migrations (pnpm migrate)'
Run-Check -Command 'pnpm seed' -Label 'Seed database (pnpm seed)'

# 5) Run tests
Run-Check -Command 'pnpm test' -Label 'Run test suite (pnpm test)'

# 6) Lint and type checks
Run-Check -Command 'pnpm lint' -Label 'Lint and type checks (pnpm lint)'

# 7) Build production bundles
Run-Check -Command 'pnpm build' -Label 'Build production bundles (pnpm build)'

Write-Host "\nLocal verification complete — all steps succeeded." -ForegroundColor Green
exit 0
