# Blocking Direct Commits to Master

## The Problem

Branch protection rules **only block PR merges** by default. They do **NOT** block direct commits to the branch unless you explicitly enable push restrictions.

The commit [cacb5d0](https://github.com/parrak/calibrate/commit/cacb5d05a65a9e312237fa989b928112487d92b4) was made directly to `master`, bypassing:
- PR review requirements
- Status checks
- All branch protection rules

## Why This Happened

Your current rule (https://github.com/parrak/calibrate/settings/rules/9391905) only enforces:
- ✅ PR reviews (for merges)
- ✅ Status checks (for merges)
- ✅ Force push blocking
- ❌ **NOT blocking direct pushes**

## Solution: Restrict Direct Pushes

To block direct commits, you need to add **push restrictions** to the branch protection rule:

### Option 1: Block All Direct Pushes (Strictest)

1. Go to: https://github.com/parrak/calibrate/settings/rules/9391905
2. Find **"Restrict updates"** section
3. Check the box: **"Restrict updates"**
   - Description: "Only allow users with bypass permission to update matching refs"
4. Leave the user/team list **empty** (no one can push directly)
5. Save changes

**Result:** No one can push directly to `master`. All changes must go through PRs.

**Note:** In GitHub Rulesets, "Restrict updates" blocks updates to existing branches (direct commits/pushes).

### Option 2: Allow Specific Users/Teams (Selective)

1. Go to: https://github.com/parrak/calibrate/settings/rules/9391905
2. Find **"Restrict updates"** section
3. Check the box: **"Restrict updates"**
4. **Add specific users or teams** who are allowed to push directly
   - Only add trusted admins/CI bots
   - Everyone else must use PRs
5. Save changes

**Result:** Only listed users/teams can push directly. Everyone else needs PRs.

### Option 3: GitHub CLI (PowerShell)

```powershell
# Get current protection
gh api repos/parrak/calibrate/branches/master/protection

# Update with push restrictions (blocks all direct pushes)
$protection = @{
    required_status_checks = @{ strict = $true; contexts = @() }
    enforce_admins = $true
    required_pull_request_reviews = @{
        dismissal_restrictions = @{}
        dismiss_stale_reviews = $true
        require_code_owner_reviews = $false
        required_approving_review_count = 1
    }
    restrictions = @{
        users = @()  # Empty = no one can push directly
        teams = @()
        apps = @()
    }
    allow_force_pushes = $false
    allow_deletions = $false
} | ConvertTo-Json -Depth 10

$protection | gh api repos/parrak/calibrate/branches/master/protection --method PUT --input -
```

## Important Notes

⚠️ **"Include administrators" does NOT block direct pushes!**

- "Include administrators" means admins are subject to PR review requirements
- It does **NOT** prevent admins from pushing directly
- To block direct pushes, you **MUST** enable "Restrict pushes"

## After Enabling Push Restrictions

1. **Direct pushes will be blocked:**
   ```bash
   git push origin master
   # Error: You cannot push directly to this branch
   ```

2. **All changes must go through PRs:**
   - Create feature branch
   - Push to branch
   - Create PR
   - Get review + pass checks
   - Merge via PR

3. **Even admins are blocked** (if restrictions list is empty)

## Current Rule Status

Your rule at https://github.com/parrak/calibrate/settings/rules/9391905 needs:
- ✅ Already has: PR reviews, status checks for merges
- ❌ **Missing:** Push restrictions (allows direct commits)

## Recommendation

**Enable Option 1 (Block All Direct Pushes):**
- Enforces code review for ALL changes
- Ensures status checks run before code enters master
- Prevents accidental direct commits
- Only allow exceptions via the restrictions list if absolutely needed

