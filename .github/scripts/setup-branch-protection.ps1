# Setup GitHub Branch Protection Rules (PowerShell)
# This script configures branch protection for the master branch to require
# all GitHub Actions to pass before merging.

param(
    [string]$Branch = "master",
    [string]$RepoOwner = "parrak",
    [string]$RepoName = "calibrate"
)

$ErrorActionPreference = "Stop"

$Repo = "${RepoOwner}/${RepoName}"

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
    Write-Host "✓ Repository access confirmed" -ForegroundColor Green
} catch {
    Write-Host "Error: Cannot access repository $Repo" -ForegroundColor Red
    Write-Host "Make sure you have admin access to the repository"
    exit 1
}

# Branch protection configuration
$protectionConfig = @{
    required_status_checks = @{
        strict = $true
        contexts = @(
            "Deployment Validation / validate-deployment",
            "Lockfile Check / pnpm-frozen-lockfile"
        )
    }
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
} | ConvertTo-Json -Depth 10

Write-Host ""
Write-Host "Settings to be applied:"
Write-Host "  - Require pull request before merging: ✓"
Write-Host "  - Require status checks to pass: ✓"
Write-Host "    - Deployment Validation / validate-deployment"
Write-Host "    - Lockfile Check / pnpm-frozen-lockfile"
Write-Host "  - Require branches to be up to date: ✓"
Write-Host "  - Require approvals: 1"
Write-Host "  - Enforce on administrators: ✓"
Write-Host "  - Allow force pushes: ✗"
Write-Host "  - Allow deletions: ✗"
Write-Host ""

# Apply branch protection using GitHub CLI
Write-Host "Configuring branch protection..."
try {
    $protectionConfig | gh api "repos/$Repo/branches/$Branch/protection" --method PUT --input - 2>&1 | Out-Null
    Write-Host "✓ Branch protection configured successfully!" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to configure branch protection" -ForegroundColor Red
    Write-Host ""
    Write-Host "This might be because:"
    Write-Host "  1. You don't have admin access to the repository"
    Write-Host "  2. The repository is part of an organization and requires special permissions"
    Write-Host "  3. Branch protection is already configured differently"
    Write-Host ""
    $url = "https://github.com/$Repo/settings/branches"
    Write-Host "Please set up branch protection manually via GitHub UI:"
    Write-Host "  1. Go to: $url"
    Write-Host "  2. Add/edit rule for '$Branch' branch"
    Write-Host "  3. Enable 'Require status checks to pass before merging'"
    Write-Host "  4. Select the required checks listed above"
    exit 1
}

# Verify the configuration
Write-Host ""
Write-Host "Verifying configuration..."
$verification = gh api "repos/$Repo/branches/$Branch/protection" --jq '.required_status_checks.contexts[]' 2>&1
if ($verification -match "Deployment Validation") {
    Write-Host "✓ Branch protection is active" -ForegroundColor Green
} else {
    Write-Host "⚠ Could not verify configuration automatically" -ForegroundColor Yellow
    $url = "https://github.com/$Repo/settings/branches"
    Write-Host "Please check manually at: $url"
}

Write-Host ""
Write-Host "Branch protection setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Create a test PR to verify the protection is working"
Write-Host "  2. Try merging with failing checks to confirm they block the merge"
Write-Host ""
$url = "https://github.com/$Repo/settings/branches"
Write-Host "View branch protection settings:"
Write-Host "  $url"

