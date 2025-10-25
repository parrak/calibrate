# Verify Vercel Configuration Script
# Prevents pnpm lockfile deployment regressions

Write-Host "Verifying Vercel deployment configuration..." -ForegroundColor Cyan

$errors = @()

# 1. Extract pnpm version from package.json
$packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
$pnpmVersion = $packageJson.packageManager -replace 'pnpm@', ''

if (-not $pnpmVersion) {
    $errors += "ERROR: packageManager not set in package.json"
} else {
    Write-Host "OK package.json pnpm version: $pnpmVersion" -ForegroundColor Green
}

# 2. Check lockfile version
$lockfileFirstLine = Get-Content "pnpm-lock.yaml" -TotalCount 1
$lockfileVersion = $lockfileFirstLine -replace "lockfileVersion: '", "" -replace "'", ""

$majorVersion = $pnpmVersion.Split('.')[0]
$lockfileMajor = $lockfileVersion.Split('.')[0]

if ($majorVersion -ne $lockfileMajor) {
    $errors += "ERROR: Version mismatch - package.json has pnpm@$pnpmVersion but lockfile has version $lockfileVersion"
} else {
    Write-Host "OK pnpm-lock.yaml version: $lockfileVersion (matches pnpm $majorVersion.x)" -ForegroundColor Green
}

# 3. Check vercel.json files exist
$apps = @('site', 'console', 'docs')

foreach ($app in $apps) {
    $vercelJson = "apps/$app/vercel.json"
    if (-not (Test-Path $vercelJson)) {
        $errors += "ERROR: Missing $vercelJson"
    } else {
        Write-Host "OK Found $vercelJson" -ForegroundColor Green

        # 4. Check content
        $content = Get-Content $vercelJson -Raw

        if ($content -notmatch "pnpm@$pnpmVersion") {
            $errors += "ERROR: $vercelJson does not specify pnpm@$pnpmVersion"
        } else {
            Write-Host "  OK Specifies pnpm@$pnpmVersion" -ForegroundColor Green
        }

        if ($content -notmatch "corepack prepare") {
            $errors += "ERROR: $vercelJson missing corepack prepare command"
        } else {
            Write-Host "  OK Uses corepack prepare" -ForegroundColor Green
        }

        if ($content -notmatch "frozen-lockfile=false") {
            $errors += "ERROR: $vercelJson missing frozen-lockfile=false"
        } else {
            Write-Host "  OK Disables frozen-lockfile" -ForegroundColor Green
        }
    }
}

# 5. Report results
Write-Host ""

if ($errors.Count -eq 0) {
    Write-Host "=====================================" -ForegroundColor Green
    Write-Host "OK All Vercel configuration checks PASSED" -ForegroundColor Green
    Write-Host "=====================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Vercel deployments should work correctly." -ForegroundColor Green
    exit 0
} else {
    Write-Host "=====================================" -ForegroundColor Red
    Write-Host "FAIL Vercel configuration checks FAILED" -ForegroundColor Red
    Write-Host "=====================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Errors found:" -ForegroundColor Red
    foreach ($error in $errors) {
        Write-Host "  - $error" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "Please fix these issues before deploying to Vercel." -ForegroundColor Yellow
    Write-Host "See .github/VERCEL_DEPLOYMENT_GUIDE.md for details." -ForegroundColor Yellow
    exit 1
}
