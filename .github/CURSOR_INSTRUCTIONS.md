# Instructions for Parallel Agent Execution: Fix PR #2 Lint Errors

**Current Branch**: `chore/update-docs-and-scripts`
**PR**: https://github.com/parrak/calibrate/pull/2
**Status**: 🔴 **LINT CHECK FAILING** - TypeScript fixed, but ESLint errors blocking merge

## 🚨 Current Failures

### Lint Check: 10 errors in shopify-connector
**Details**: https://github.com/parrak/calibrate/actions/runs/19050934335/job/54410795896

**Errors**:
- `packages/shopify-connector/src/ShopifyConnector.ts`: 8 errors (lines 57, 58, 59, 77, 88, 99, 213, 214)
- `packages/shopify-connector/src/ShopifyPricingOperations.ts`: 2 errors (lines 113, 203)

**Issue**: "Unexpected any. Specify a different type" - All errors are about using `any` type

### GitHub Actions Warnings: 2 warnings
- `deployment-validation.yml:21`: Invalid pnpm action input `version-file`
- `lockfile-check.yml:17`: Invalid pnpm action input `version-file`

**Issue**: `version-file` is not a valid input for `pnpm/action-setup@v4`. Valid inputs are: `version`, `dest`, `run_install`, `package_json_file`, `standalone`

### Vercel Console Deployment: FAILING
**Details**: https://vercel.com/rakesh-paridas-projects/console/5UxvrCzGmrr75kxHjBjyANZztCdF

**Error**:
```
Error: Could not resolve @prisma/client despite the installation that we just tried.
Please try to install it by hand with pnpm add @prisma/client and rerun pnpm dlx "prisma generate" 🙏.
ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL  Command failed with exit code 1: prisma generate
```

**Root Cause**: Prisma client generation failing during Vercel build. `@prisma/client` may not be properly installed or the package dependencies are misconfigured.

---

## 🎯 Two-Agent Work Distribution

### 🅰️ AGENT A (Cursor): ShopifyConnector.ts

**Branch**: Work directly on `chore/update-docs-and-scripts`
**File**: `packages/shopify-connector/src/ShopifyConnector.ts`
**Errors**: 8 (lines 57, 58, 59, 77, 88, 99, 213, 214)

#### Setup (2 min)
```bash
cd C:\Users\rakes\developer\calibrate-cursor\calibrate
git checkout chore/update-docs-and-scripts
git pull origin chore/update-docs-and-scripts
```

#### Task: Replace `any` types with proper types (20 min)

**Lines 57-59**: Private operation properties
```typescript
// BEFORE
private authOperations: any = null;
private productOperations: any = null;
private pricingOperations: any = null;

// AFTER
private authOperations: ShopifyAuth | null = null;
private productOperations: ShopifyProducts | null = null;
private pricingOperations: ShopifyPricing | null = null;
```

**Lines 77, 88, 99**: Similar `any` types in initialization code
- Check context around these lines
- Replace with proper typed classes (likely `ShopifyAuth`, `ShopifyProducts`, `ShopifyPricing`)
- Ensure imports are present at top of file

**Lines 213-214**: Error handling or response types
- Check context - likely error objects or API responses
- Define proper interface or use `unknown` if type is truly dynamic
- Example fix:
```typescript
// If it's an error object
catch (error: unknown) {
  if (error instanceof Error) {
    // handle error
  }
}

// If it's API response
interface ShopifyApiResponse {
  data?: unknown;
  errors?: Array<{ message: string; field?: string[] }>;
}
```

#### Verification
```bash
# Run lint check
pnpm --filter @calibr/shopify-connector lint

# Should show: 0 errors in ShopifyConnector.ts
```

#### Commit
```bash
git add packages/shopify-connector/src/ShopifyConnector.ts
git commit -m "fix(shopify-connector): replace any types with proper types in ShopifyConnector

- Replace any with ShopifyAuth | null for authOperations
- Replace any with ShopifyProducts | null for productOperations
- Replace any with ShopifyPricing | null for pricingOperations
- Add proper error handling types
- Fixes 8 ESLint errors (lines 57, 58, 59, 77, 88, 99, 213, 214)"

git push origin chore/update-docs-and-scripts
```

---

### 🅱️ AGENT B (Codex/Claude): Remaining Fixes

**Branch**: Work directly on `chore/update-docs-and-scripts`
**Scope**:
1. ShopifyPricingOperations.ts (2 lint errors)
2. GitHub Actions workflows (2 warnings)
3. Fix Vercel Prisma deployment issue
4. Verify all deployments succeed

#### Setup (2 min)
```bash
cd C:\Users\rakes\developer\calibrate
git checkout chore/update-docs-and-scripts
git pull origin chore/update-docs-and-scripts
```

#### Task 1: Fix ShopifyPricingOperations.ts (10 min)

**File**: `packages/shopify-connector/src/ShopifyPricingOperations.ts`
**Errors**: 2 (lines 113, 203)

**Line 113**: Error mapping in catch block
```typescript
// BEFORE
errors.map((e: any) => e.message).join(', ')

// AFTER - Option 1: Define interface
interface ShopifyUserError {
  message: string;
  field?: string[];
}
errors.map((e: ShopifyUserError) => e.message).join(', ')

// AFTER - Option 2: Use unknown with type guard
errors.map((e: unknown) => {
  return (e as { message: string }).message;
}).join(', ')
```

**Line 203**: isRetryableError parameter
```typescript
// BEFORE
private isRetryableError(error: any): boolean {

// AFTER
private isRetryableError(error: unknown): boolean {
  // Type guard for error with status
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const statusError = error as { status?: number };
    if (statusError.status === 429) return true;
    if (statusError.status && statusError.status >= 500) return true;
  }
  return false;
}
```

**Verification**:
```bash
pnpm --filter @calibr/shopify-connector lint
# Should show: 0 errors
```

**Commit**:
```bash
git add packages/shopify-connector/src/ShopifyPricingOperations.ts
git commit -m "fix(shopify-connector): replace any types in ShopifyPricingOperations

- Add ShopifyUserError interface for error mapping
- Replace any with unknown in isRetryableError with proper type guards
- Fixes 2 ESLint errors (lines 113, 203)"
```

#### Task 2: Fix GitHub Actions workflows (5 min)

**Files**:
- `.github/workflows/deployment-validation.yml` (line 21)
- `.github/workflows/lockfile-check.yml` (line 17)

**Fix**: Replace `version-file` with `package_json_file`

```yaml
# BEFORE
- uses: pnpm/action-setup@v4
  with:
    version-file: package.json

# AFTER
- uses: pnpm/action-setup@v4
  with:
    package_json_file: package.json
```

**Verification**: Push and check GitHub Actions run without warnings

**Commit**:
```bash
git add .github/workflows/deployment-validation.yml .github/workflows/lockfile-check.yml
git commit -m "fix(ci): use package_json_file instead of version-file in pnpm setup

- Update deployment-validation.yml
- Update lockfile-check.yml
- Fixes invalid input warnings in GitHub Actions"
```

#### Task 3: Fix Vercel Prisma deployment (15 min)

**Issue**: `@prisma/client` resolution failing during Vercel build

**Diagnosis Steps**:
```bash
# Check if @prisma/client is in package.json dependencies
cat packages/db/package.json | grep "@prisma/client"

# Check console app dependencies
cat apps/console/package.json | grep "@calibr/db"
```

**Likely Fixes** (try in order):

**Option 1**: Ensure `@prisma/client` is explicitly in dependencies (not just devDependencies)
```bash
# In packages/db/package.json
# Ensure @prisma/client is in "dependencies", not "devDependencies"
```

**Option 2**: Add postinstall script to ensure Prisma generates
```bash
# In packages/db/package.json, add:
"scripts": {
  "postinstall": "prisma generate"
}
```

**Option 3**: Update Vercel build settings
```bash
# Check if there's a vercel.json or check console's package.json build script
# May need to adjust the build command to ensure db package is built first
```

**Option 4**: Check for workspace dependencies
```bash
# In apps/console/package.json, ensure:
"dependencies": {
  "@calibr/db": "workspace:*",
  "@prisma/client": "^5.x.x"  // Explicitly add if missing
}
```

**Testing**:
```bash
# Test locally that build works
pnpm install --frozen-lockfile=false
pnpm --filter @calibr/db install
pnpm --filter @calibr/db exec prisma generate
pnpm --filter @calibr/console build

# If successful, commit and push
git add <modified-files>
git commit -m "fix(vercel): ensure @prisma/client resolves during deployment

- [describe what was changed]
- Fixes Prisma client resolution error in Vercel build"
```

#### Task 4: Verify & Monitor (5 min)

```bash
# Push all changes
git push origin chore/update-docs-and-scripts

# Check PR status
gh pr checks 2

# Monitor until all checks pass:
# ✅ validate-deployment (lint check)
# ✅ Vercel – console (deployment)
# ✅ pnpm-frozen-lockfile
# ✅ pr_lint
```

---

## 🔄 Coordination Protocol

### Timing
- **Agent A**: Start immediately on ShopifyConnector.ts (~20 min)
- **Agent B**: Start immediately on ShopifyPricingOperations.ts (~10 min), workflows (~5 min), Prisma fix (~15 min)
- **Total Time**: ~30 minutes (parallel execution, Agent B slightly longer due to Vercel Prisma fix)

### Communication
Both agents should:
1. Pull latest before starting
2. Work on separate files (no conflicts)
3. Commit immediately after fixing assigned file
4. Push to same branch (`chore/update-docs-and-scripts`)
5. Git will handle merging commits automatically

### If Conflicts Occur
```bash
# Pull latest changes
git pull origin chore/update-docs-and-scripts

# If conflicts, resolve and continue
git add <resolved-files>
git commit -m "merge: resolve conflicts"
git push origin chore/update-docs-and-scripts
```

---

## ✅ Success Criteria

**All checks must pass**:
- ✅ Lint check: 0 errors in shopify-connector
- ✅ GitHub Actions: No workflow warnings
- ✅ Vercel console: Deployment succeeds
- ✅ All CI checks: Green status

**Ready to merge**: Once all checks pass, PR #2 can be merged to master

---

## 📊 Progress Tracking

### Agent A Progress
- [ ] Pull latest from branch
- [ ] Fix line 57: authOperations type
- [ ] Fix line 58: productOperations type
- [ ] Fix line 59: pricingOperations type
- [ ] Fix line 77: (check context)
- [ ] Fix line 88: (check context)
- [ ] Fix line 99: (check context)
- [ ] Fix line 213: (check context)
- [ ] Fix line 214: (check context)
- [ ] Verify lint passes
- [ ] Commit and push

### Agent B Progress
- [ ] Pull latest from branch
- [ ] Fix ShopifyPricingOperations.ts line 113
- [ ] Fix ShopifyPricingOperations.ts line 203
- [ ] Verify lint passes for shopify-connector
- [ ] Commit and push lint fixes
- [ ] Fix deployment-validation.yml
- [ ] Fix lockfile-check.yml
- [ ] Commit and push workflow fixes
- [ ] Diagnose Prisma client resolution issue
- [ ] Fix Prisma deployment (check dependencies, postinstall, etc.)
- [ ] Test local build with Prisma
- [ ] Commit and push Prisma fix
- [ ] Monitor PR checks until all pass (especially Vercel console)

---

## 📝 Context: What Was Fixed Before

✅ **Previous Session (TypeScript Errors)**: All 122 TypeScript type errors were fixed
- Fixed Prisma relation names (lowercase → PascalCase)
- Added missing IDs to create operations
- Fixed schema field mismatches
- Resolved cyclic dependencies

🔴 **Current Session (Lint Errors)**: Fixing ESLint errors blocking deployment
- Replacing `any` types with proper types
- Fixing GitHub Actions workflow config
- Ensuring Vercel console deployment succeeds

---

## 🎯 Ready to Start?

**Agent A (Cursor)**: Start with ShopifyConnector.ts line 57-59
**Agent B (Codex/Claude)**: Start with ShopifyPricingOperations.ts line 113

Let's get PR #2 across the finish line! 🚀
