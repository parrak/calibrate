# Branch Protection Quick Start

**Problem:** Status checks don't appear when setting up branch protection because GitHub requires workflows to run at least once first.

## Solution

### Step 1: Trigger Workflows (Choose One Method)

**Option A: Create a Test Pull Request (Best Method)**
```bash
# Create a test branch
git checkout master
git pull origin master
git checkout -b test/trigger-ci-checks

# Make a harmless change
echo "" >> README.md
git add README.md
git commit -m "chore: trigger CI checks for branch protection"
git push origin test/trigger-ci-checks
```

Then on GitHub:
1. Create a pull request from `test/trigger-ci-checks` to `master`
2. Wait for workflows to complete (check Actions tab)
3. Wait 2-3 minutes after workflows finish

**Option B: Manual Workflow Dispatch**
1. Go to GitHub → Actions tab
2. Click **Deployment Validation** workflow
3. Click **Run workflow** → Select `master` → **Run workflow**
4. Repeat for **Lockfile Check** workflow
5. Wait for both to complete

**Note:** Method B may not work for branch protection - GitHub typically requires checks to run in a PR context.

### Step 2: Set Up Branch Protection

**After workflows have run on a PR:**

**Option A: Use the Setup Script**
```bash
bash .github/scripts/setup-branch-protection.sh
```

**Option B: Manual Setup via GitHub UI**
1. Go to: https://github.com/parrak/calibrate/settings/branches
2. Click **Add rule** or edit existing rule for `master`
3. Enable:
   - ✅ Require a pull request before merging
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
4. Select these checks (if they appear):
   - `Deployment Validation / validate-deployment`
   - `Lockfile Check / pnpm-frozen-lockfile`
5. Enable additional protection:
   - ✅ Include administrators
   - ✅ Do not allow bypassing
6. Click **Create** or **Save changes**

**Option C: Set Up Without Specific Checks**

If checks don't appear yet, you can still protect the branch:

1. Enable "Require status checks to pass before merging"
2. Enable "Require branches to be up to date"
3. **Don't select specific checks** (leave checkboxes empty)
4. Save the rule

This will still block merges when checks fail, and you can add specific checks later once they appear.

### Step 3: Verify It Works

1. Create a test PR with intentionally failing code
2. Verify the merge button is disabled
3. Fix the code and verify merge is enabled again

## Troubleshooting

### Checks Still Don't Appear

1. **Wait longer** - GitHub can take 5-10 minutes to update the checks list
2. **Refresh the page** - Hard refresh (Ctrl+F5 / Cmd+Shift+R)
3. **Verify workflow names** match exactly:
   - Workflow name from `name:` field in YAML
   - Job name from `jobs:` section
   - Format: `{workflow_name} / {job_name}`
4. **Try a different browser** or incognito mode
5. **Check workflow completed successfully** - Failed/cancelled workflows may not register

### Can't Select Specific Checks

That's okay! Set up branch protection without selecting specific checks. It will still:
- Block merges when any check fails
- Require checks to pass before merging
- Work the same way, just less specific

You can always come back later and add specific checks once they appear.

## Expected Status Check Names

- `Deployment Validation / validate-deployment`
- `Lockfile Check / pnpm-frozen-lockfile`

## Need More Help?

See the full documentation: [BRANCH_PROTECTION.md](BRANCH_PROTECTION.md)

