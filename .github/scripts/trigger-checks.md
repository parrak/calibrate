# How to Trigger Workflows for Branch Protection Setup

GitHub requires workflows to run at least once before they appear as available status checks in branch protection settings. Follow these steps to trigger the workflows:

## Method 1: Create a Test Pull Request (Recommended)

1. **Create a test branch:**
   ```bash
   git checkout master
   git pull origin master
   git checkout -b test/trigger-ci-checks
   ```

2. **Make a small, harmless change:**
   ```bash
   # Add a comment or whitespace change to a non-critical file
   echo "# CI Trigger" >> README.md
   git add README.md
   git commit -m "chore: trigger CI checks for branch protection setup"
   ```

3. **Push and create PR:**
   ```bash
   git push origin test/trigger-ci-checks
   ```
   Then go to GitHub and create a pull request to `master`.

4. **Wait for workflows to complete:**
   - Go to the **Actions** tab on GitHub
   - Watch for:
     - `Deployment Validation` workflow
     - `Lockfile Check` workflow
   - Both should show as running/completed

5. **Verify checks are available:**
   - Go to **Settings** → **Branches**
   - Try to add/edit a branch protection rule for `master`
   - The status checks should now appear in the dropdown

## Method 2: Manual Workflow Dispatch

✅ **Now Available!** The workflows have been updated to support manual triggering.

1. Go to **Actions** tab on GitHub
2. Select **Deployment Validation** workflow from the left sidebar
3. Click **Run workflow** dropdown button (top right)
4. Select branch: `master` (or your current branch)
5. Click **Run workflow** button
6. Repeat for **Lockfile Check** workflow

**Note:** After running manually, the checks may still need to appear in a PR context to be selectable for branch protection.

## Method 3: Push to Master (Not Recommended)

⚠️ **Only if you have admin access and are confident:**
- Make a small commit directly to `master`
- This will trigger all workflows
- Less ideal because it bypasses PR process

## After Workflows Run

Once workflows have run successfully:

1. **Wait 2-3 minutes** for GitHub to update the available checks list
2. **Refresh** the branch protection settings page
3. **Set up branch protection** using:
   - The setup script: `bash .github/scripts/setup-branch-protection.sh`
   - Or manually via GitHub UI

## Expected Status Check Names

After workflows run, you should see these checks available:
- `Deployment Validation / validate-deployment`
- `Lockfile Check / pnpm-frozen-lockfile`

If these don't appear, check:
- Workflow files are in `.github/workflows/`
- Workflows run on `pull_request` events
- Workflows completed successfully (not cancelled/failed)

