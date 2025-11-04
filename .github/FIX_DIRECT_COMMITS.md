# Fix: Block Direct Commits to Master

## The Problem

Commit [cacb5d0](https://github.com/parrak/calibrate/commit/cacb5d05a65a9e312237fa989b928112487d92b4) was pushed directly to `master`, bypassing all protection rules.

## The Solution

Enable **"Restrict updates"** in your ruleset to block direct commits.

## Step-by-Step Fix

1. **Go to your ruleset:**
   https://github.com/parrak/calibrate/settings/rules/9391905

2. **Find "Restrict updates" section**

3. **Check the box:** "Restrict updates"
   - Option text: "Only allow users with bypass permission to update matching refs"
   - This blocks direct pushes/commits to existing branches

4. **Leave the user/team list empty** (blocks everyone from direct pushes)
   - Or add specific users if you need exceptions

5. **Save changes**

## What Each Option Does

Based on your available options:

- ✅ **Restrict updates** ← **THIS IS WHAT YOU NEED!**
  - Blocks direct commits/pushes to existing branches
  - Enables: Only bypass users can push directly
  
- **Restrict creations**
  - Blocks creating new branches (not what you need)

- **Restrict deletions**
  - Blocks deleting branches (already protected)

- **Block force pushes**
  - Already checked (prevents force pushes)

- **Require a pull request before merging**
  - Already enabled (requires PR reviews)

- **Require status checks to pass**
  - Already enabled (requires checks on PRs)

## After Enabling "Restrict updates"

**Direct pushes will be blocked:**
```bash
git push origin master
# Error: You cannot push directly to this branch
```

**All changes must go through PRs:**
1. Create feature branch
2. Push to feature branch
3. Create PR
4. Get review + pass checks
5. Merge via PR

## Verification

After saving, test that direct pushes are blocked:
```bash
git checkout -b test/verify-protection
echo "# Test" >> README.md
git add README.md
git commit -m "test: verify protection"
git push origin master  # Should fail!
```

If it fails with "You cannot push directly to this branch", protection is working! ✅

## Current Rule Configuration

Your rule should have:
- ✅ Require a pull request before merging
- ✅ Require status checks to pass (validate-deployment, pnpm-frozen-lockfile)
- ✅ Require branches to be up to date
- ✅ Block force pushes
- ❌ **MISSING: Restrict updates** ← Enable this now!

## Important Notes

- **"Restrict updates"** is different from "Restrict creations"
  - Updates = modifying existing branches (commits/pushes)
  - Creations = creating new branches

- **Leaving user list empty** = blocks everyone (even admins) from direct pushes
  - This is the strictest and recommended setting
  - Only bypass permission users can push directly

- **Adding users to the list** = those users can push directly
  - Use sparingly (only for CI bots or emergency admins)

## Summary

**To block direct commits like commit cacb5d0:**
1. Go to: https://github.com/parrak/calibrate/settings/rules/9391905
2. Enable: **"Restrict updates"**
3. Leave user list empty
4. Save

This will prevent future direct commits from bypassing your protection rules.


