# Branch Protection - Next Steps

## ✅ Current Status

Branch protection rule has been created at: https://github.com/parrak/calibrate/settings/rules/9391905

The rule is currently configured **without specific status checks** because GitHub requires workflows to run in a PR context before checks appear in the settings.

## 🔍 Verify Current Configuration

Check that the following are enabled:
- ✅ Require a pull request before merging
- ✅ Require approvals (1 reviewer)
- ✅ Include administrators
- ✅ Block force pushes
- ✅ Block deletions

## 📝 Next Steps: Adding Status Checks

Once status checks appear (after workflows run on a PR), add them:

1. **Go to the rule**: https://github.com/parrak/calibrate/settings/rules/9391905
2. **Scroll down** to "Require status checks to pass before merging"
3. **Check the box**: "Require status checks to pass before merging"
4. **Check the box**: "Require branches to be up to date before merging"
5. **Select these checks** (when they appear):
   - `Deployment Validation / validate-deployment`
   - `Lockfile Check / pnpm-frozen-lockfile`
6. **Click "Save changes"**

## 🧪 Test That Protection Is Working

1. Create a test branch:
   ```bash
   git checkout -b test/branch-protection
   ```

2. Make a change and push:
   ```bash
   echo "# Test" >> README.md
   git add README.md
   git commit -m "test: verify branch protection"
   git push origin test/branch-protection
   ```

3. Create a pull request on GitHub

4. **Verify**:
   - The merge button should be disabled
   - It should show "Merging is blocked" or "X review(s) required"
   - Once you get approval, it should still show if checks are running/failing

## 🚨 What Happens Now

### Current Protection (Without Specific Checks)

- **Merges are blocked** until:
  - PR is reviewed and approved
  - All status checks pass (if any exist)
  
- **Even without specific checks selected**, GitHub will still:
  - Block merges if ANY check fails
  - Show check status on PRs
  - Require checks to pass if they exist

### After Adding Specific Checks

- **Merges are blocked** until:
  - PR is reviewed and approved
  - **Specific required checks** pass:
    - `Deployment Validation / validate-deployment`
    - `Lockfile Check / pnpm-frozen-lockfile`
  - Branch is up to date with `master`

## ⏱️ When Will Checks Appear?

Status checks typically appear after:
1. A pull request is created
2. Workflows run on that PR
3. Wait 5-10 minutes for GitHub to update
4. Refresh the branch protection settings page

If checks don't appear:
- Verify workflows are running (check Actions tab)
- Ensure workflows have `pull_request` trigger
- Try creating another PR and waiting longer

## 🔧 Troubleshooting

### Checks Still Don't Appear

**Option 1: Verify workflows are running**
- Go to Actions tab
- Check if "Deployment Validation" and "Lockfile Check" workflows ran
- They must run on a PR (not just push to master)

**Option 2: Manually trigger workflows**
- Go to Actions tab
- Select each workflow
- Click "Run workflow" (if available)
- Create a PR after triggering

**Option 3: Use the current setup**
- The current protection still works without specific checks
- It will require ANY checks that exist to pass
- You can add specific checks later when convenient

## 📊 Expected Status Check Names

Once they appear, look for:
- `Deployment Validation / validate-deployment`
- `Lockfile Check / pnpm-frozen-lockfile`

Format: `{workflow_name} / {job_name}`

## ✅ Summary

You've successfully set up branch protection! The rule is active and will:
- ✅ Require PR reviews before merging
- ✅ Block force pushes and deletions
- ✅ Require status checks to pass (when they exist)
- ✅ Apply to administrators too

Adding specific checks later is optional but recommended for stricter control.


