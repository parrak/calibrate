# GitHub Branch Protection Policy

This document describes how to configure branch protection rules to ensure all GitHub Actions must pass before code can be merged to the `master` branch.

## Overview

Branch protection rules enforce quality gates by:
- Requiring all status checks to pass before merging
- **Blocking direct commits** (if push restrictions enabled)
- Preventing force pushes to protected branches
- Requiring pull request reviews (optional)
- Ensuring branches are up to date before merging

**⚠️ Critical Note:** By default, branch protection only blocks **merges**, not direct pushes. To block direct commits, you **must** enable **"Restrict updates"**. See [FIX_DIRECT_COMMITS.md](FIX_DIRECT_COMMITS.md) for details.

## Required Status Checks

The following GitHub Actions must pass before merging to `master`:

1. **Deployment Validation** (`Deployment Validation`)
   - Runs on: `push` and `pull_request` to `master`
   - Validates: TypeScript, linting, tests, build, migrations, API health

2. **Lockfile Check** (`pnpm-frozen-lockfile`)
   - Runs on: `push` and `pull_request` to `master`
   - Validates: `pnpm-lock.yaml` is up to date

3. **Pull Request Lint** (`pr_lint`)
   - Runs on: Pull requests
   - Validates: PR compliance and deployment documentation

## Setup Methods

### Prerequisites: Trigger Workflows First!

⚠️ **Important:** Before setting up branch protection, you must trigger the workflows at least once so they appear as available status checks. See [trigger-checks.md](scripts/trigger-checks.md) for instructions.

### Option 1: GitHub CLI (Recommended)

**First, trigger the workflows** (see prerequisites above), then run the setup script:

**On Linux/macOS:**
```bash
# Make sure you have GitHub CLI installed and authenticated
# Install: https://cli.github.com/manual/installation
# Auth: gh auth login

# Run the setup script
bash .github/scripts/setup-branch-protection.sh
```

**On Windows (PowerShell):**
```powershell
# Make sure you have GitHub CLI installed and authenticated
# Install: https://cli.github.com/manual/installation
# Auth: gh auth login

# Run the setup script
powershell -ExecutionPolicy Bypass -File .github/scripts/setup-branch-protection.ps1
```

### Option 2: Manual Setup via GitHub UI

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Branches**
3. Click **Add rule** or edit the existing rule for `master`
4. Configure the following settings:

   **General Settings:**
   - ✅ Require a pull request before merging
   - ✅ Require approvals: 1 (optional, adjust as needed)
   - ✅ Dismiss stale pull request approvals when new commits are pushed
   - ✅ Require review from Code Owners (optional)

   **Restrict pushes that create matching branches:**
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
   - ✅ Select status checks to require:
     - `Deployment Validation / validate-deployment`
     - `Lockfile Check / pnpm-frozen-lockfile`
     - `Pull Request Lint / pr_lint` (if applicable)

   **Additional Protection:**
   - ✅ Do not allow bypassing the above settings
   - ✅ Include administrators
   - ⚠️ **CRITICAL:** **"Restrict updates"** - Blocks direct commits:
     - ✅ Check "Restrict updates" box to block direct commits
     - Leave user list empty = no one can push directly (recommended)
     - Or add specific users/teams who can push directly
     - **Note:** "Restrict updates" blocks updates to existing branches (commits/pushes)
   - ✅ Allow force pushes: ❌ (unchecked)
   - ✅ Allow deletions: ❌ (unchecked)
   
   **⚠️ Important:** Without "Restrict updates" enabled, direct commits bypass all protection rules!

5. Click **Create** or **Save changes**

### Option 3: GitHub REST API

```bash
# Set the repository name
REPO="parrak/calibrate"
BRANCH="master"

# Get your GitHub token
# Create one at: https://github.com/settings/tokens
# Required scopes: repo, admin:repo_hook

# Configure branch protection
curl -X PUT \
  -H "Authorization: token YOUR_GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/${REPO}/branches/${BRANCH}/protection \
  -d '{
    "required_status_checks": {
      "strict": true,
      "contexts": [
        "Deployment Validation / validate-deployment",
        "Lockfile Check / pnpm-frozen-lockfile"
      ]
    },
    "enforce_admins": true,
    "required_pull_request_reviews": {
      "dismissal_restrictions": {},
      "dismiss_stale_reviews": true,
      "require_code_owner_reviews": false,
      "required_approving_review_count": 1
    },
    "restrictions": null,
    "allow_force_pushes": false,
    "allow_deletions": false,
    "required_linear_history": false,
    "allow_squash_merge": true,
    "allow_merge_commit": true,
    "allow_rebase_merge": true,
    "block_creations": false,
    "required_conversation_resolution": false,
    "lock_branch": false,
    "allow_fork_syncing": false
  }'
```

## Verification

After setting up branch protection, verify it's working:

**Option 1: Automated Verification Script**

**On Linux/macOS:**
```bash
bash .github/scripts/verify-branch-protection.sh
```

**On Windows (PowerShell):**
```powershell
# Note: Verification script is bash-only. Use GitHub UI or CLI directly:
gh api repos/parrak/calibrate/branches/master/protection
```

**Option 2: Manual Testing**

1. Create a test branch with intentionally failing tests
2. Open a pull request to `master`
3. Verify that:
   - The merge button is disabled until all checks pass
   - The PR shows "Required status check X is expected"
   - You cannot merge with failing checks

## Troubleshooting

### Status checks not appearing

**This is the most common issue!** GitHub requires workflows to run at least once before they appear as available status checks.

If status checks don't appear in the branch protection settings:

**Step 1: Trigger the workflows to run**
- Create a test pull request to `master` branch
- Wait for workflows to complete (they should run automatically on PRs)
- Alternatively, manually trigger workflows:
  - Go to **Actions** tab
  - Select each workflow (`Deployment Validation`, `Lockfile Check`)
  - Click **Run workflow** button (if available)

**Step 2: Verify workflow names match exactly**
- Status check format: `{workflow_name} / {job_name}`
- For `deployment-validation.yml`: `Deployment Validation / validate-deployment`
- For `lockfile-check.yml`: `Lockfile Check / pnpm-frozen-lockfile`

**Step 3: Wait a few minutes**
- After workflows run, wait 2-3 minutes for GitHub to update the available checks list
- Refresh the branch protection settings page

**Step 4: Set up branch protection after checks appear**
- Once checks are visible, you can select them in branch protection settings
- Or re-run the setup script

**Alternative: Set up branch protection without selecting specific checks**
- Enable "Require status checks to pass before merging"
- Check "Require branches to be up to date before merging"
- Leave the checkboxes empty (or wait for them to appear)
- This will still block merges if any check fails, once checks start running

### Bypassing checks (Emergency only)

If you need to bypass checks in an emergency:

1. Temporarily disable branch protection (requires admin access)
2. Or use the "Update branch" button to retrigger checks
3. Re-enable protection immediately after

**Note:** Bypassing should be extremely rare and documented.

## Current Configuration

As of the latest update, the following workflows run on `master`:

- **Deployment Validation** - Full CI/CD pipeline validation
  - Status check name: `Deployment Validation / validate-deployment`
- **Lockfile Check** - Ensures lockfile is synchronized
  - Status check name: `Lockfile Check / pnpm-frozen-lockfile`
- **Pull Request Lint** - Validates PR compliance (optional)

All required checks must pass before merging.

## Quick Setup Guide

1. **Trigger workflows first:**
   ```bash
   # Create a test PR to trigger workflows
   git checkout -b test/trigger-checks
   echo "# CI Trigger" >> README.md
   git commit -am "chore: trigger CI checks"
   git push origin test/trigger-checks
   # Create PR on GitHub, wait for workflows to complete
   ```

2. **Wait for workflows to finish** (check Actions tab)

3. **Set up branch protection:**
   ```bash
   bash .github/scripts/setup-branch-protection.sh
   ```

See [scripts/trigger-checks.md](scripts/trigger-checks.md) for detailed instructions.

## Additional Resources

- [GitHub Branch Protection Documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [GitHub CLI Documentation](https://cli.github.com/manual/)
- [GitHub REST API - Branch Protection](https://docs.github.com/en/rest/branches/branch-protection)

