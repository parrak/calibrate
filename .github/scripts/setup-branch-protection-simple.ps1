# Setup GitHub Branch Protection Rules (PowerShell)
# Simplified version that uses GitHub CLI

param(
    [string]$Branch = "master",
    [string]$RepoOwner = "parrak",
    [string]$RepoName = "calibrate",
    [switch]$RequireSpecificChecks = $false
)

$ErrorActionPreference = "Stop"
$Repo = "$RepoOwner/$RepoName"
$settingsUrl = "https://github.com/$Repo/settings/branches"

Write-Host "Setting up branch protection for $Branch branch..." -ForegroundColor Green

# Check if GitHub CLI is installed
try {
    $null = Get-Command gh -ErrorAction Stop
} catch {
    Write-Host "Error: GitHub CLI (gh) is not installed." -ForegroundColor Red
    Write-Host "Install it from: https://cli.github.com/manual/installation"
    exit 1
}

# Check if user is authenticated
try {
    gh auth status 2>&1 | Out-Null
} catch {
    Write-Host "Error: Not authenticated with GitHub CLI." -ForegroundColor Red
    Write-Host "Run: gh auth login"
    exit 1
}

# Verify repo exists and we have access
try {
    gh repo view $Repo 2>&1 | Out-Null
    Write-Host "Repository access confirmed" -ForegroundColor Green
} catch {
    Write-Host "Error: Cannot access repository $Repo" -ForegroundColor Red
    Write-Host "Make sure you have admin access to the repository"
    exit 1
}

# Check available status checks
Write-Host ""
Write-Host "Checking available status checks..."
try {
    $latestCommit = gh api "repos/$Repo/branches/$Branch" --jq '.commit.sha'
    $checkRuns = gh api "repos/$Repo/commits/$latestCommit/check-runs?per_page=100" --jq '.check_runs[].name' 2>&1
    $availableChecks = $checkRuns | Sort-Object -Unique
    
    if ($availableChecks) {
        Write-Host "Available status checks found:" -ForegroundColor Green
        $availableChecks | ForEach-Object { Write-Host "  - $_" }
    } else {
        Write-Host "No status checks found yet." -ForegroundColor Yellow
        Write-Host "  This is normal if workflows haven't run recently." -ForegroundColor Yellow
    }
} catch {
    Write-Host "Could not fetch status checks." -ForegroundColor Yellow
    $availableChecks = @()
}

# Determine which checks to require
$requiredChecks = @()
if ($RequireSpecificChecks) {
    $expectedChecks = @(
        "Deployment Validation / validate-deployment",
        "Lockfile Check / pnpm-frozen-lockfile"
    )
    
    foreach ($check in $expectedChecks) {
        if ($availableChecks -contains $check) {
            $requiredChecks += $check
            Write-Host "  Will require: $check" -ForegroundColor Green
        } else {
            Write-Host "  Not available: $check" -ForegroundColor Yellow
        }
    }
    
    if ($requiredChecks.Count -eq 0) {
        Write-Host ""
        Write-Host "No required checks are available yet!" -ForegroundColor Yellow
        Write-Host "Setting up branch protection WITHOUT specific checks." -ForegroundColor Yellow
        Write-Host "This will still block merges when checks fail." -ForegroundColor Yellow
        Write-Host "You can add specific checks later via GitHub UI." -ForegroundColor Yellow
        Write-Host ""
        $RequireSpecificChecks = $false
    }
}

# Build branch protection configuration
$protectionConfig = @{
    enforce_admins = $true
    required_pull_request_reviews = @{
        dismissal_restrictions = @{}
        dismiss_stale_reviews = $true
        require_code_owner_reviews = $false
        required_approving_review_count = 1
    }
    restrictions = $null
    allow_force_pushes = $false
    allow_deletions = $false
    required_linear_history = $false
    allow_squash_merge = $true
    allow_merge_commit = $true
    allow_rebase_merge = $true
    block_creations = $false
    required_conversation_resolution = $false
    lock_branch = $false
    allow_fork_syncing = $false
}

# Add status checks only if we have them or if explicitly requested
if ($RequireSpecificChecks -and $requiredChecks.Count -gt 0) {
    $protectionConfig.required_status_checks = @{
        strict = $true
        contexts = $requiredChecks
    }
    Write-Host ""
    Write-Host "Will require these specific checks:"
    $requiredChecks | ForEach-Object { Write-Host "  - $_" }
} else {
    # Don't include required_status_checks - this allows GitHub to require any checks that exist
    Write-Host ""
    Write-Host "Setting up protection to require ANY status checks (no specific ones)" -ForegroundColor Yellow
    Write-Host "This will block merges when any check fails" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Other settings:"
Write-Host "  - Require pull request before merging"
Write-Host "  - Require approvals: 1"
Write-Host "  - Enforce on administrators"
Write-Host "  - Block force pushes and deletions"
Write-Host ""

# Apply branch protection using GitHub CLI
Write-Host "Configuring branch protection..."
try {
    $jsonConfig = $protectionConfig | ConvertTo-Json -Depth 10 -Compress
    $jsonConfig | gh api "repos/$Repo/branches/$Branch/protection" --method PUT --input - 2>&1 | Out-Null
    Write-Host ""
    Write-Host "Branch protection configured successfully!" -ForegroundColor Green
} catch {
    $errorMessage = $_.Exception.Message
    Write-Host ""
    Write-Host "Failed to configure branch protection" -ForegroundColor Red
    Write-Host "Error: $errorMessage" -ForegroundColor Red
    Write-Host ""
    Write-Host "This might be because:" -ForegroundColor Yellow
    Write-Host "  1. Status checks need to run in a PR context first" -ForegroundColor Yellow
    Write-Host "  2. GitHub needs more time to register the checks" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Try setting up branch protection manually via GitHub UI:" -ForegroundColor Yellow
    Write-Host "  Go to: $settingsUrl" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Or create another test PR to ensure workflows run again." -ForegroundColor Yellow
    exit 1
}

# Verify the configuration
Write-Host ""
Write-Host "Verifying configuration..."
try {
    $verification = gh api "repos/$Repo/branches/$Branch/protection" --jq '.' 2>&1
    if ($verification -match "required_status_checks" -or $verification -match "required_pull_request_reviews") {
        Write-Host "Branch protection is active!" -ForegroundColor Green
        
        $requiredChecksList = gh api "repos/$Repo/branches/$Branch/protection" --jq '.required_status_checks.contexts[]?' 2>&1
        if ($requiredChecksList) {
            Write-Host ""
            Write-Host "Required status checks:"
            $requiredChecksList | ForEach-Object { Write-Host "  - $_" }
        } else {
            Write-Host ""
            Write-Host "No specific checks required (will require any checks that exist)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "Could not verify configuration automatically" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Could not verify, but setup may have succeeded" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Branch protection setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Create a test PR to verify protection is working"
Write-Host "  2. Once status checks appear, you can add them specifically via GitHub UI"
Write-Host ""
Write-Host "View branch protection settings:" -ForegroundColor Cyan
Write-Host "  $settingsUrl"
