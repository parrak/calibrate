# Instructions for Cursor: Fix PR #2 and Merge to Master

**Current Branch**: `chore/update-docs-and-scripts`
**PR**: https://github.com/parrak/calibrate/pull/2
**Status**: Vercel Prisma fix applied, but 50+ TypeScript errors blocking merge

## Context
Previous agent fixed the Vercel Prisma generation issue and restored `@default(cuid())` to the schema. Now need to fix remaining TypeScript errors to get console deploying and merge to master.

---

## Step-by-Step Instructions

### 1. Verify Current State (2 min)

```bash
# Ensure you're on the right branch
git checkout chore/update-docs-and-scripts
git pull origin chore/update-docs-and-scripts

# Check current CI status
gh pr view 2 --json statusCheckRollup --jq '.statusCheckRollup[] | select(.name == "validate-deployment") | "\(.name): \(.conclusion)"'
```

**Expected**: Should show "validate-deployment: FAILURE"

---

### 2. Add Missing Type Definitions (3 min)

```bash
# Add to apps/api
cd apps/api
pnpm add -D @types/validator@13.12.2 @types/bcryptjs@2.4.6

# Add to apps/console (if needed)
cd ../console
pnpm add -D @types/bcryptjs@2.4.6
```

**Commit**:
```bash
git add apps/api/package.json apps/console/package.json pnpm-lock.yaml
git commit -m "fix: add missing type definitions for validator and bcryptjs"
```

---

### 3. Enable downlevelIteration (2 min)

**File**: `apps/api/tsconfig.json`

Find the `compilerOptions` section and add:
```json
{
  "compilerOptions": {
    "downlevelIteration": true,
    // ... existing options
  }
}
```

**Commit**:
```bash
git add apps/api/tsconfig.json
git commit -m "fix: enable downlevelIteration for Map/Set iteration"
```

---

### 4. Fix Critical Type Errors (20-30 min)

#### 4a. Fix undefined → null conversions

**Files to fix**:
- `apps/api/app/api/admin/dashboard/route.ts` (lines 37, 38, 40, 41)

**Pattern**: Replace `string | undefined` with proper null handling:
```typescript
// BEFORE
someFunction(valueOrUndefined)

// AFTER
someFunction(valueOrUndefined ?? null)
```

#### 4b. Fix Prisma include errors

**File**: `apps/api/app/api/admin/dashboard/route.ts` (line 25)

**Change**:
```typescript
// BEFORE
include: {
  tenant: true,
  // ...
}

// AFTER
include: {
  Tenant: true,  // PascalCase for relation name
  // ...
}
```

#### 4c. Fix missing ID fields in create operations

**Files affected**:
- `apps/api/app/api/auth/register/route.ts` (lines 61, 67)
- Any ShopifyIntegration.create calls
- Any Event.create calls

**Solution**: Install cuid2 and add explicit IDs

```bash
cd apps/api
pnpm add @paralleldrive/cuid2
```

**Pattern**:
```typescript
import { createId } from '@paralleldrive/cuid2'

// BEFORE
await prisma.tenant.create({
  data: {
    name: tenantName,
  }
})

// AFTER
await prisma.tenant.create({
  data: {
    id: createId(),
    name: tenantName,
  }
})
```

**Apply to all create operations missing explicit IDs**.

#### 4d. Fix staging-database.ts schema mismatches

**File**: `apps/api/lib/staging-database.ts`

Issues to fix:
1. **Line 83**: Remove `slug` from Tenant create (field doesn't exist)
2. **Line 102**: Remove `settings` from Project create (field doesn't exist)
3. **Line 144**: Add `tenantId` to Product create
4. **Line 184**: Update PriceChange create to match new schema
5. **Lines 205, 228, 323**: Remove `slug` from Tenant where clauses

**Check current schema first**:
```bash
grep "model Tenant" packages/db/prisma/schema.prisma -A 10
grep "model Product" packages/db/prisma/schema.prisma -A 20
grep "model PriceChange" packages/db/prisma/schema.prisma -A 30
```

**Then update staging-database.ts to match actual schema fields**.

#### 4e. Fix performance-monitor.ts

**File**: `apps/api/lib/performance-monitor.ts`

Add type annotations to implicit `any` parameters:
```typescript
// Lines 236, 242, 367, 377, 387
// BEFORE
.reduce((sum, m) => sum + m.value, 0)

// AFTER
.reduce((sum, m: PerformanceMetric) => sum + m.value, 0)
```

**Commit after each file**:
```bash
git add <file>
git commit -m "fix: resolve TypeScript errors in <component>"
```

---

### 5. Run Local TypeCheck (5 min)

```bash
# From repo root
pnpm typecheck
```

**If errors remain**:
- Read error messages carefully
- Most common: schema field mismatches, missing IDs, wrong types
- Fix iteratively and re-run typecheck
- Commit working fixes incrementally

**Goal**: Get `pnpm typecheck` to pass with 0 errors

---

### 6. Push and Monitor CI (10 min)

```bash
git push origin chore/update-docs-and-scripts
```

Wait 2-3 minutes, then check:
```bash
gh run list --branch chore/update-docs-and-scripts --limit 3
gh pr view 2 --json statusCheckRollup --jq '.statusCheckRollup[] | "\(.name): \(.conclusion)"'
```

**Expected results**:
- `validate-deployment`: SUCCESS
- `pnpm-frozen-lockfile`: SUCCESS
- `pr_lint`: SUCCESS
- `Vercel – console`: SUCCESS (wait for deployment)

**If Vercel console still fails**, check deployment logs:
```bash
gh pr view 2 --json statusCheckRollup --jq '.statusCheckRollup[] | select(.context == "Vercel – console") | .targetUrl'
```
Visit that URL to see build logs.

---

### 7. Final Verification (5 min)

Once all checks pass:

```bash
# Verify PR is ready
gh pr view 2

# Check for any review comments
gh pr view 2 --json reviews

# Verify all checks are green
gh pr checks 2
```

---

### 8. Merge to Master

```bash
# Use GitHub CLI to merge
gh pr merge 2 --squash --auto

# Or merge via web UI if you prefer
gh pr view 2 --web
```

**Squash commit message suggestion**:
```
fix: Vercel Prisma deployment and TypeScript errors

- Add explicit @calibr/db install before Prisma generate in Vercel
- Restore @default(cuid()) to Prisma schema for auto ID generation
- Fix pr-lint workflow syntax error
- Add missing type definitions (@types/validator, @types/bcryptjs)
- Enable downlevelIteration for iterator support
- Fix schema field mismatches in API routes
- Add explicit ID generation using cuid2 where needed

Fixes Vercel console deployment and resolves 50+ TypeScript errors.
```

---

## Priority Order

If short on time, fix in this order:

1. **Type definitions** (step 2) - Quick win, fixes ~10 errors
2. **downlevelIteration** (step 3) - Quick win, fixes ~6 errors
3. **auth/register.ts ID generation** (step 4c) - Fixes 2 critical errors
4. **staging-database.ts schema fixes** (step 4d) - Fixes ~8 errors
5. **Remaining undefined → null** (step 4a) - Fixes ~4 errors
6. **performance-monitor.ts types** (step 4e) - Fixes ~4 errors

**Skip if necessary**:
- Amazon connector errors (not critical for console deployment)
- Competitor monitoring errors (not critical path)
- Test file errors (won't block deployment)

---

## Emergency Fallback

If TypeScript errors prove too complex:

**Create new minimal PR with just the Vercel fix**:
```bash
# Start fresh from master
git checkout master
git pull origin master
git checkout -b fix/vercel-prisma-minimal

# Cherry-pick just the Vercel config change
git cherry-pick 49d6114  # The Vercel fix commit

# Push and create PR
git push -u origin fix/vercel-prisma-minimal
gh pr create --title "fix: Vercel Prisma client generation" \
  --body "Minimal fix for Vercel console deployment - adds explicit @calibr/db install before generate"

# Merge that instead
```

This gets the critical fix merged without the TypeScript cleanup.

---

## Helpful Commands

```bash
# See what changed in this PR
git diff master...chore/update-docs-and-scripts --stat

# Run typecheck on specific package
pnpm --filter @calibr/api typecheck

# View specific error count
pnpm typecheck 2>&1 | grep "error TS" | wc -l

# Check Prisma schema
pnpm --filter @calibr/db exec prisma format
pnpm --filter @calibr/db exec prisma validate

# Test build locally
pnpm --filter @calibr/console build
```

---

## Success Criteria

✅ All CI checks passing
✅ Vercel console deploying successfully
✅ 0 TypeScript errors in `pnpm typecheck`
✅ PR merged to master
✅ Vercel env var `PRISMA_DISABLE_POSTINSTALL_GENERATE=true` is set (already done)

---

## Questions or Blockers?

If you encounter issues:

1. **Check the checkpoint doc**: `.github/PR2_CHECKPOINT.md` has detailed error analysis
2. **View CI logs**: `gh run view <run-id> --log-failed`
3. **Compare schemas**: `git diff master..HEAD packages/db/prisma/schema.prisma`
4. **Test locally**: Always run `pnpm typecheck` before pushing

---

**Estimated time**: 30-60 minutes total

Good luck! 🚀
