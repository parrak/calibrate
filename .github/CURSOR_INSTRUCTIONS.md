# Instructions for Cursor: Fix PR #2 and Merge to Master

**Current Branch**: `chore/update-docs-and-scripts`
**PR**: https://github.com/parrak/calibrate/pull/2
**Status**: In Progress - Fixing TypeScript errors (100+ errors identified)

---

## Agent B Progress Log

- 2025-01-13 10:42 — Created `fix/typescript-packages` branch from latest `chore/update-docs-and-scripts`; baseline `pnpm --filter @calibr/api typecheck` reported 28 errors within `packages/**` and `apps/api/lib/**`.
- 2025-01-13 11:12 — Started amazon-connector refactor; product list/get/sync return normalized products, pricing fixes in progress.
- 2025-01-13 14:30 — **Agent B work taken over by Codex agent**. Working on same branch `fix/typescript-routes` as Agent A.
- 2025-01-13 15:45 — ✅ **Task 1 COMPLETE**: `packages/amazon-connector/src/connector.ts` (16 errors fixed)
- 2025-01-13 15:50 — ✅ **Task 2 COMPLETE**: `packages/competitor-monitoring/monitor.ts` (4 errors fixed)
- 2025-01-13 16:00 — ✅ **Task 3 COMPLETE**: `apps/api/lib/performance-monitor.ts` (2 errors fixed)

**Current Status**: 71 TypeScript errors remaining (down from 122 at start of parallel execution)

**Completed Fixes**:
1. ✅ amazon-connector/connector.ts: Fixed all type imports, AuthStatus interface, method signatures, return types
2. ✅ competitor-monitoring: Fixed all Prisma relation names
3. ✅ performance-monitor: Added type casts for Prisma raw queries

**Remaining in Agent B scope**: ~30 errors in amazon-connector edge cases (feeds, pricing, spapi-client) and analytics package (implicit any types)

---

## 🅰️ AGENT A — API Routes Team

**Branch**: `fix/typescript-routes` (forked from `chore/update-docs-and-scripts`)
**Scope**: Fix all TypeScript errors in `apps/api/app/api/**` routes (~65 errors)

### ✅ Task 1: assistant/query/route.ts — COMPLETE (26 errors fixed)

**File**: `apps/api/app/api/v1/assistant/query/route.ts`

**Issues Fixed**:
1. ✅ **Prisma schema relation mismatches**: 
   - `PriceChange` has no direct `sku` relation (only `skuId` field)
   - Fixed `explainPriceChange()`: query Sku separately using `skuId`
   - Changed `include: { sku: ... }` → fetch Sku separately with `prisma().sku.findUnique()`

2. ✅ **Sku model field access**:
   - `Sku` doesn't have `projectId` directly (via `Product` relation)
   - Fixed `simulatePriceIncrease()`: use `where: { Product: { projectId } }`
   - Fixed `findLowMarginProducts()`: same pattern + access Price via relation

3. ✅ **Price and cost data access**:
   - `Sku` doesn't have `priceAmount` or `cost` fields directly
   - Price stored in `Price` model (relation: `Sku.Price[]`)
   - Fixed: Access price via `s.Price[0]?.amount` and cost via `s.attributes?.cost`

4. ✅ **Field name corrections**:
   - `Sku.code` used instead of `Sku.sku` (field is `code` in schema)
   - All references updated to use `code` field

5. ✅ **Type safety improvements**:
   - Added proper null checks for optional fields
   - Added type assertions for JSON attributes
   - Fixed `method: 'ai'` with `as const` for type literal

**Changes Summary**:
- `explainPriceChange()`: Fetch Sku separately after getting PriceChange
- `simulatePriceIncrease()`: Query via Product relation, access Price and cost correctly
- `findLowMarginProducts()`: Query via Product relation, calculate margins from Price and attributes
- All functions now correctly handle Prisma schema relationships

**Status**: ✅ All 26 TypeScript errors in this file resolved. No linter errors remaining.

### ✅ Task 2: projects/route.ts & projects/[slug]/route.ts — COMPLETE (13 errors fixed)

**Files Fixed**:
- `apps/api/app/api/projects/route.ts` (11 errors)
- `apps/api/app/api/projects/[slug]/route.ts` (1 error)

**Issues Fixed**:
1. ✅ **Missing IDs in create operations**:
   - `Project.create`: Added `id: createId()` and `updatedAt: new Date()`
   - `Membership.create`: Added `id: createId()`

2. ✅ **Relation name mismatches**:
   - `include: { project: ... }` → `include: { Project: ... }`
   - `orderBy: { project: ... }` → `orderBy: { Project: ... }`
   - `m.project.*` → `m.Project.*` (property access)
   - `shopifyIntegrations` → `ShopifyIntegration` (relation name)
   - `amazonIntegrations` → `AmazonIntegration` (relation name)

3. ✅ **Non-existent model**: `platformIntegration` doesn't exist
   - Fixed: Query `shopifyIntegration` and `amazonIntegration` separately, then combine results

**Status**: ✅ All 13 errors in these files resolved.

### ✅ Task 3: seed/route.ts — COMPLETE (12 errors fixed)

**File**: `apps/api/app/api/seed/route.ts`

**Issues Fixed**:
1. ✅ **Missing IDs in all create operations**:
   - `Project.create`: Added `id: createId()` and `updatedAt: new Date()`
   - `User.create` (2 instances): Added `id: createId()`
   - `Membership.create` (2 instances): Added `id: createId()`
   - `Product.create`: Added `id: createId()`
   - `Sku.create`: Added `id: createId()`
   - `Price.create`: Added `id: createId()`
   - `Policy.create`: Added `id: createId()` and `updatedAt: new Date()`
   - `PriceChange.create`: Added `id: createId()`

2. ✅ **Relation name mismatch**:
   - `include: { prices: true }` → `include: { Price: true }`
   - `sku.prices` → `sku.Price`

**Status**: ✅ All 12 errors in this file resolved.

### 📋 Next Tasks (Agent A)
✅ **Task 4 (DONE)**: Fix relation name mismatches in competitors routes (`sku` → `Sku`, `products` → `CompetitorProduct`, `prices` → `CompetitorPrice`, `product` → `Product`)

✅ **Task 5 (DONE)**: Export `verifyHmac` and `ensureIdempotent` from `@calibr/security`

✅ **Task 6 (DONE)**: Fix remaining route errors (analytics import path, `JsonValue` casts in price-changes, `LogEntry` property usage via `metadata`)

✅ **Task 7 (DONE)**: Typecheck for routes is clean; remaining errors are outside Agent A scope (tests, packages)

---

## 🎉 AGENT A: ALL TASKS COMPLETE!

**Status**: ✅ All 65+ route errors fixed. Ready to finalize.

**Next Action**: See [AGENT_A_NEXT_STEPS.md](.github/AGENT_A_NEXT_STEPS.md) for finalization steps:
1. Final verification typecheck
2. Push branch to origin/fix/typescript-routes
3. Create PR Part 1/2
4. Coordinate with Agent B for merge

---

## Progress Tracker

### ✅ Completed Steps
- **Step 1**: Verified current state - Branch synced, CI shows `validate-deployment: FAILURE`
- **Step 2**: ✅ Type definitions already added (`@types/validator@13.12.2`, `@types/bcryptjs@2.4.6`)
- **Step 3**: ✅ `downlevelIteration` already enabled in `apps/api/tsconfig.json`
- **Step 4c**: ✅ `@paralleldrive/cuid2` already installed in `apps/api`

**New (Agent A) — Completed in this session**
- ✅ Competitors routes fixed: relation names corrected (`CompetitorProduct`, `Sku`, `CompetitorPrice`)
- ✅ Security module exports: `verifyHmac`, `ensureIdempotent` exported from `@calibr/security`
- ✅ Price changes routes: `JsonValue` issues resolved via `Prisma.InputJsonValue` casts
- ✅ Webhooks route: `verifyHmac`/`ensureIdempotent` wired, `LogEntry` fields moved to `metadata`, schema relation fixes (`Product`)
- ✅ Analytics routes: imports resolved and Next.js params typing aligned

### 🔄 In Progress
- **Step 4**: Fixing critical TypeScript errors (100+ errors identified)
  - ✅ Fixed dashboard route: removed invalid PriceChange.sku include, query Sku separately
  - ✅ Fixed ShopifyIntegration.create: added createId() in oauth/callback route
  - ✅ Fixed Event.create: added createId() in shopify/sync route (2 instances)
  - ✅ Fixed Event.create: added createId() in shopify/webhooks route (4 instances)
  - ✅ Fixed admin/security route: restructure details response for typing
  - ✅ Fixed health route: typed Prisma raw queries for connections/migrations
  - ✅ Shopify products/sync routes: centralized connector bootstrap helper, typed config/credentials, guarded webhooks/pricing access
  - ✅ Deprecated legacy `/api/platforms/*` Shopify endpoints in favor of new `/api/integrations` routes
  - 🔄 Missing IDs in create operations (7+ Event.create in platforms/shopify/webhooks, PriceVersion.create, AmazonIntegration, etc.)
  - Schema field mismatches (wrong relation names, missing fields)
  - Type errors (undefined/null handling, wrong types)
  
**Files fixed so far:**
- `apps/api/app/api/admin/dashboard/route.ts`
- `apps/api/app/api/integrations/shopify/oauth/callback/route.ts`
- `apps/api/app/api/integrations/shopify/sync/route.ts`
- `apps/api/app/api/integrations/shopify/webhooks/route.ts`
- `apps/api/app/api/v1/price-changes/[id]/apply/route.ts`
- `apps/api/app/api/v1/price-changes/[id]/rollback/route.ts`
- `apps/api/app/api/v1/assistant/query/route.ts` (✅ Agent A - 26 errors fixed)

**Progress**: 
- ✅ Fixed ~25+ create operations with missing IDs:
  - Event.create (13 instances)
  - PriceVersion.create (2 instances) 
  - ShopifyIntegration.create (2 instances)
  - AmazonIntegration.create (2 instances)
  - AmazonCompetitivePrice.create (3 instances)
  - PriceChange.create (1 instance)
  - Competitor.create, CompetitorProduct.create, CompetitorRule.create (3 instances)
  
- ✅ Fixed relation name mismatches:
  - `include: { tenant: true }` → `include: { Tenant: true }` (2 instances)
  - `include: { project: true }` → `include: { Project: true }` (1 instance)
  - `include: { skus: ... }` → `include: { Sku: ... }` (2 instances)
  - `include: { prices: ... }` → `include: { Price: ... }` (2 instances)
  - `product.skus` → `product.Sku`, `s.prices` → `s.Price`
  - `project.tenant` → `project.Tenant`
  - ✅ Agent A: Fixed `PriceChange` relation issues - no direct `sku` relation, query separately
  - ✅ Agent A: Fixed `Sku` access via `Product` relation for `projectId` filtering
  - ✅ Agent A: Fixed `Price` access via `Sku.Price[]` relation, `cost` via `attributes`
  
**Remaining**: Route errors in Agent A scope: 0. Remaining TypeScript errors are primarily in tests and external packages (Amazon connector, competitor monitoring, performance monitoring), which are out of Agent A scope.
- Schema field mismatches
- Type errors (undefined/null handling)
- Missing type annotations
- Other relation/field name issues

### 📋 Next Steps
- Continue fixing create operations with missing IDs
- Fix schema mismatches (relation names, field names)
- Fix undefined/null type issues
- Fix performance-monitor.ts type annotations

## Context
Previous agent fixed the Vercel Prisma generation issue and restored `@default(cuid())` to the schema. Currently fixing remaining TypeScript errors to get console deploying and merge to master.

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
