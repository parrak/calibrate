# Vercel Deployment Guide - Preventing pnpm Lockfile Regressions

**Critical:** This document prevents deployment regressions caused by pnpm version mismatches on Vercel.

---

## The Problem

Vercel deployments fail with this error:

```
WARN  Ignoring not compatible lockfile at /vercel/path0/pnpm-lock.yaml
ERR_PNPM_NO_LOCKFILE  Cannot install with "frozen-lockfile" because pnpm-lock.yaml is present
```

### Root Cause

1. Our monorepo uses **pnpm@9.0.0** (defined in `package.json` `packageManager` field)
2. Our `pnpm-lock.yaml` has **lockfileVersion: '9.0'**
3. Vercel by default uses a different pnpm version (often 8.x or latest)
4. When Vercel sees lockfileVersion 9.0 but runs pnpm 8.x, it treats the lockfile as "incompatible"
5. With `--frozen-lockfile` flag, pnpm refuses to continue, causing the build to fail

---

## The Solution

### 1. Explicit pnpm Version Configuration

Each Vercel-deployed app **MUST** have a `vercel.json` file that:
- Activates the correct pnpm version using `corepack`
- Disables frozen-lockfile for Vercel builds
- Uses monorepo-aware build commands

### 2. Required Files

**Root `package.json` (already configured):**
```json
{
  "packageManager": "pnpm@9.0.0"
}
```

**Each app's `vercel.json`:**
```json
{
  "buildCommand": "cd ../.. && pnpm install && pnpm --filter @calibr/[app-name] build",
  "installCommand": "corepack prepare pnpm@9.0.0 --activate && pnpm install --frozen-lockfile=false",
  "framework": null
}
```

### 3. Apps Requiring Configuration

- ✅ `apps/site/vercel.json` - Landing page
- ✅ `apps/console/vercel.json` - Admin console
- ✅ `apps/docs/vercel.json` - Documentation site

---

## Prevention Checklist

### For All Changes to pnpm or Lockfile

When making any of these changes, **ALWAYS verify Vercel configuration**:

- [ ] Upgrading pnpm version
- [ ] Regenerating pnpm-lock.yaml
- [ ] Changing lockfile settings in `.npmrc`
- [ ] Adding new apps to the monorepo
- [ ] Modifying build processes

### Verification Steps

1. **Check pnpm version consistency:**
   ```bash
   # In package.json
   grep packageManager package.json
   # Should show: "packageManager": "pnpm@9.0.0"

   # In lockfile
   head -1 pnpm-lock.yaml
   # Should show: lockfileVersion: '9.0'
   ```

2. **Verify each app has vercel.json:**
   ```bash
   ls apps/*/vercel.json
   # Should list: apps/console/vercel.json, apps/docs/vercel.json, apps/site/vercel.json
   ```

3. **Check installCommand in each vercel.json:**
   ```bash
   grep "corepack prepare pnpm" apps/*/vercel.json
   # All should show: corepack prepare pnpm@9.0.0 --activate
   ```

---

## Standard Operating Procedure

### When Upgrading pnpm

1. **Update root package.json:**
   ```json
   {
     "packageManager": "pnpm@X.Y.Z"
   }
   ```

2. **Regenerate lockfile:**
   ```bash
   pnpm install
   ```

3. **Update ALL app vercel.json files:**
   ```json
   {
     "installCommand": "corepack prepare pnpm@X.Y.Z --activate && pnpm install --frozen-lockfile=false"
   }
   ```

4. **Commit all changes together:**
   ```bash
   git add package.json pnpm-lock.yaml apps/*/vercel.json
   git commit -m "chore: upgrade pnpm to X.Y.Z and update Vercel configs"
   ```

### When Adding New Vercel-Deployed App

1. **Create app's vercel.json:**
   ```bash
   # Example for new app "newapp"
   cat > apps/newapp/vercel.json <<EOF
   {
     "buildCommand": "cd ../.. && pnpm install && pnpm --filter @calibr/newapp build",
     "installCommand": "corepack prepare pnpm@9.0.0 --activate && pnpm install --frozen-lockfile=false",
     "framework": null
   }
   EOF
   ```

2. **Test locally before deploying:**
   ```bash
   cd apps/newapp
   pnpm build
   ```

3. **Commit vercel.json with app:**
   ```bash
   git add apps/newapp/
   git commit -m "feat: add newapp with Vercel deployment config"
   ```

---

## Troubleshooting

### Deployment Still Fails After Configuration

**Symptom:** Error persists even with vercel.json

**Diagnosis:**
1. Check Vercel dashboard build logs for actual pnpm version used
2. Verify `installCommand` is being executed
3. Check if Vercel project settings override vercel.json

**Fix:**
1. Go to Vercel Dashboard → Project → Settings → General
2. Ensure "Framework Preset" is set to "Other" or matches vercel.json
3. Clear "Install Command" override (should use vercel.json)
4. Clear "Build Command" override (should use vercel.json)
5. Redeploy

### Lockfile Version Mismatch

**Symptom:** lockfileVersion doesn't match pnpm version

**Fix:**
```bash
# Delete lockfile and node_modules
rm pnpm-lock.yaml
rm -rf node_modules

# Reinstall with correct pnpm version
corepack prepare pnpm@9.0.0 --activate
pnpm install

# Verify lockfile version
head -1 pnpm-lock.yaml  # Should show lockfileVersion: '9.0'
```

### Build Command Not Found

**Symptom:** `pnpm: command not found` in Vercel logs

**Cause:** installCommand didn't activate corepack properly

**Fix:**
Ensure installCommand includes `corepack prepare` BEFORE `pnpm install`:
```json
{
  "installCommand": "corepack prepare pnpm@9.0.0 --activate && pnpm install --frozen-lockfile=false"
}
```

---

## Agent Instructions

### For LLM Agents Working on This Codebase

**CRITICAL CHECKS before any pnpm-related commit:**

1. **Version Consistency:**
   ```bash
   # Check these match
   grep packageManager package.json | grep -oP '\d+\.\d+\.\d+'
   head -1 pnpm-lock.yaml | grep -oP '\d+\.\d+'
   grep "corepack prepare pnpm@" apps/*/vercel.json | grep -oP '\d+\.\d+\.\d+'
   ```
   All should return the same major version (9.0.0 → 9.0).

2. **File Existence:**
   ```bash
   # These must exist
   test -f apps/site/vercel.json && echo "✓ site" || echo "✗ site MISSING"
   test -f apps/console/vercel.json && echo "✓ console" || echo "✗ console MISSING"
   test -f apps/docs/vercel.json && echo "✓ docs" || echo "✗ docs MISSING"
   ```

3. **Content Validation:**
   ```bash
   # Each vercel.json must contain
   grep -q "corepack prepare pnpm@9.0.0" apps/*/vercel.json && echo "✓" || echo "✗ MISSING"
   grep -q "frozen-lockfile=false" apps/*/vercel.json && echo "✓" || echo "✗ MISSING"
   ```

4. **Commit Together:**
   When changing pnpm version, ALWAYS commit these files together:
   - `package.json`
   - `pnpm-lock.yaml`
   - `apps/site/vercel.json`
   - `apps/console/vercel.json`
   - `apps/docs/vercel.json`

### Pre-Commit Checklist for Agents

```bash
# Run this before any commit touching pnpm or Vercel
./scripts/verify-vercel-config.sh  # TODO: Create this script

# Or manually verify
pnpm_version=$(grep packageManager package.json | grep -oP '\d+\.\d+\.\d+')
echo "Expected pnpm version: $pnpm_version"

for app in site console docs; do
  if grep -q "pnpm@$pnpm_version" "apps/$app/vercel.json"; then
    echo "✓ apps/$app/vercel.json"
  else
    echo "✗ apps/$app/vercel.json - VERSION MISMATCH"
  fi
done
```

---

## CI/CD Integration

### GitHub Actions Check (Recommended)

Create `.github/workflows/verify-vercel-config.yml`:

```yaml
name: Verify Vercel Configuration

on:
  pull_request:
    paths:
      - 'package.json'
      - 'pnpm-lock.yaml'
      - 'apps/*/vercel.json'
      - '.npmrc'

jobs:
  verify-vercel-config:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Check pnpm version consistency
        run: |
          pnpm_version=$(grep packageManager package.json | grep -oP '\d+\.\d+\.\d+')
          lockfile_version=$(head -1 pnpm-lock.yaml | grep -oP '\d+\.\d+')

          if [[ "${pnpm_version:0:1}" != "${lockfile_version:0:1}" ]]; then
            echo "ERROR: pnpm version mismatch"
            echo "package.json: $pnpm_version"
            echo "lockfile: $lockfile_version"
            exit 1
          fi

      - name: Verify vercel.json files exist
        run: |
          for app in site console docs; do
            if [ ! -f "apps/$app/vercel.json" ]; then
              echo "ERROR: apps/$app/vercel.json missing"
              exit 1
            fi
          done

      - name: Verify vercel.json content
        run: |
          pnpm_version=$(grep packageManager package.json | grep -oP '\d+\.\d+\.\d+')

          for app in site console docs; do
            if ! grep -q "pnpm@$pnpm_version" "apps/$app/vercel.json"; then
              echo "ERROR: apps/$app/vercel.json has wrong pnpm version"
              exit 1
            fi
          done
```

---

## Historical Context

### Why This Happened

**Original Issue (October 2025):**
- Vercel deployments failing with lockfile compatibility errors
- Root cause: pnpm@9.0.0 in package.json, but Vercel using different version
- Impact: All Vercel apps (site, console, docs) failing to deploy

**Resolution (October 25, 2025):**
- Commit: `cf68b87` - "fix(vercel): Configure pnpm@9.0.0 for Vercel deployments"
- Added vercel.json to all apps with explicit pnpm version
- Documented prevention strategy in this guide

### Lessons Learned

1. **Explicit is better than implicit** - Don't rely on Vercel auto-detecting pnpm version
2. **Monorepo requires special handling** - Default Vercel configs don't work for pnpm workspaces
3. **Version consistency is critical** - All configs must use the same pnpm version
4. **Test deployments after pnpm upgrades** - Always verify Vercel deployments after changing pnpm

---

## Quick Reference

### Files to Check When pnpm Changes

1. `package.json` → `packageManager` field
2. `pnpm-lock.yaml` → `lockfileVersion` line
3. `apps/site/vercel.json` → `installCommand`
4. `apps/console/vercel.json` → `installCommand`
5. `apps/docs/vercel.json` → `installCommand`

### One-Liner Verification

```bash
pnpm_ver=$(grep packageManager package.json | grep -oP '\d+\.\d+\.\d+') && echo "pnpm: $pnpm_ver" && head -1 pnpm-lock.yaml && grep "corepack prepare pnpm" apps/*/vercel.json | grep --color "$pnpm_ver"
```

Expected output: All should show same major.minor version.

---

**Last Updated:** October 25, 2025
**Incident:** Vercel pnpm lockfile incompatibility
**Resolution:** Commit cf68b87
**Status:** ✅ Resolved and documented

**For Questions:** See [.github/copilot-instructions.md](.github/copilot-instructions.md) or create GitHub issue.
