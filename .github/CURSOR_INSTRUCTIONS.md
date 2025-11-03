# Instructions for Cursor: Fix PR #2 with Parallel Execution

**Current Branch**: `chore/update-docs-and-scripts`
**PR**: https://github.com/parrak/calibrate/pull/2
**Status**: PARALLEL EXECUTION MODE - Two agents working simultaneously

## 🎯 Strategy Update: Two-Agent Parallel Execution

Based on diagnostic showing **122 TypeScript errors**, we're executing **Path A with parallel agents** to complete cleanup efficiently.

**Decision**: Clean up the repo completely, but split work between two agents to save 50% time.

---

## 📊 Current Error Breakdown

**Total**: 122 errors in `@calibr/api` package

**Top 5 Files**:
1. `apps/api/app/api/v1/assistant/query/route.ts` – 26 errors
2. `packages/amazon-connector/src/connector.ts` – 16 errors
3. `apps/api/app/api/v1/webhooks/price-suggestion/route.ts` – 15 errors
4. `apps/api/app/api/seed/route.ts` – 13 errors
5. `apps/api/app/api/projects/route.ts` – 11 errors

**Top Error Types**:
- TS2339 (29): Property doesn't exist on type
- TS2322 (23): Type assignment mismatch
- TS2353 (19): Unknown object properties
- TS2305 (11): Module has no exported member
- TS2551 (8): Property misspelling

---

## 🔀 Two-Agent Work Distribution

### 🅰️ AGENT A: API Routes Team (~65 errors)

**Branch**: `fix/typescript-routes`

**Scope**: All files in `apps/api/app/api/**` (routes only, no packages)

**Files**:
1. `apps/api/app/api/v1/assistant/query/route.ts` (26 errors) ⭐ START HERE
2. `apps/api/app/api/v1/webhooks/price-suggestion/route.ts` (15 errors)
3. `apps/api/app/api/seed/route.ts` (13 errors)
4. `apps/api/app/api/projects/route.ts` (11 errors)
5. All remaining `apps/api/app/api/**/*.ts` route files

**Estimated Time**: 2-2.5 hours

---

### 🅱️ AGENT B: Packages & Infrastructure Team (~57 errors)

**Branch**: `fix/typescript-packages`

**Scope**: All packages + lib files

**Files**:
1. `packages/amazon-connector/**` (16 errors) ⭐ START HERE
2. `apps/api/lib/staging-database.ts` (~10 errors)
3. `apps/api/lib/performance-monitor.ts` (~8 errors)
4. `apps/api/lib/auth-security.ts` (~3 errors)
5. `packages/competitor-monitoring/**`
6. `packages/platform-connector/**`
7. `apps/api/tests/**`

**Estimated Time**: 2-2.5 hours

---

## 🅰️ AGENT A: Detailed Instructions

### Setup (5 min)

```bash
# Navigate to directory (use calibrate-cursor or clone fresh)
cd C:\Users\rakes\developer\calibrate-cursor\calibrate

# Ensure on latest
git checkout chore/update-docs-and-scripts
git pull origin chore/update-docs-and-scripts

# Create your branch
git checkout -b fix/typescript-routes

# Verify your scope (should show ~65 errors)
pnpm --filter @calibr/api typecheck 2>&1 | grep "apps/api/app/api" | grep -v "packages/" | wc -l
```

### Execution Order

#### **Task 1: assistant/query/route.ts (26 errors - 30 min)**

```bash
# View errors for this file
pnpm --filter @calibr/api typecheck 2>&1 | grep "assistant/query" | head -30

# Open file
code apps/api/app/api/v1/assistant/query/route.ts

# Common fixes needed:
# 1. Fix Prisma relation casing: tenant → Tenant, project → Project, skus → Sku
# 2. Add missing IDs: id: createId() to any .create() calls
# 3. Check schema fields match actual Prisma schema

# Reference the schema:
grep "model Project" packages/db/prisma/schema.prisma -A 20
grep "model Product" packages/db/prisma/schema.prisma -A 20
grep "model Tenant" packages/db/prisma/schema.prisma -A 15

# Fix pattern example:
# BEFORE: include: { tenant: true, products: { include: { skus: true } } }
# AFTER:  include: { Tenant: true, Product: { include: { Sku: true } } }

# Test after fix
pnpm --filter @calibr/api typecheck 2>&1 | grep "assistant/query"
# Should show: 0 results

# Commit
git add apps/api/app/api/v1/assistant/query/route.ts
git commit -m "fix(routes): resolve 26 TypeScript errors in assistant/query route

- Fix Prisma relation names to PascalCase
- Add proper null handling for optional fields
- Remove non-existent schema fields from queries"

# Update progress
echo "✅ Task 1 Complete: assistant/query (26 errors fixed)"
```

#### **Task 2: webhooks/price-suggestion/route.ts (15 errors - 20 min)**

```bash
pnpm --filter @calibr/api typecheck 2>&1 | grep "webhooks/price-suggestion" | head -20

# Common issues:
# - Missing id: createId() in create operations
# - PriceChange field mismatches
# - undefined → null conversions

# After fixing:
pnpm --filter @calibr/api typecheck 2>&1 | grep "webhooks/price-suggestion"

git add apps/api/app/api/v1/webhooks/price-suggestion/route.ts
git commit -m "fix(routes): resolve TypeScript errors in webhooks/price-suggestion"

echo "✅ Task 2 Complete: webhooks/price-suggestion (15 errors fixed)"
```

#### **Task 3: seed/route.ts (13 errors - 20 min)**

```bash
pnpm --filter @calibr/api typecheck 2>&1 | grep "seed/route" | head -20

# Import cuid2 at top if not present:
# import { createId } from '@paralleldrive/cuid2'

# Add id: createId() to EVERY .create() operation
# Pattern:
# await prisma.tenant.create({
#   data: {
#     id: createId(),  // ← Add this
#     name: 'Demo',
#   }
# })

pnpm --filter @calibr/api typecheck 2>&1 | grep "seed/route"

git add apps/api/app/api/seed/route.ts
git commit -m "fix(routes): add explicit IDs to all seed route create operations"

echo "✅ Task 3 Complete: seed/route (13 errors fixed)"
```

#### **Task 4: projects/route.ts (11 errors - 15 min)**

```bash
pnpm --filter @calibr/api typecheck 2>&1 | grep "projects/route" | head -15

# Fix same patterns: relations, IDs, field names

pnpm --filter @calibr/api typecheck 2>&1 | grep "projects/route"

git add apps/api/app/api/projects/route.ts
git commit -m "fix(routes): resolve TypeScript errors in projects route"

echo "✅ Task 4 Complete: projects/route (11 errors fixed)"
```

#### **Task 5: Remaining route errors (30 min)**

```bash
# Find all remaining errors in your scope
pnpm --filter @calibr/api typecheck 2>&1 | grep "apps/api/app/api" | grep -v "packages/" | cut -d'(' -f1 | sort -u

# Fix each file systematically, commit after each
```

### Agent A Completion Checklist

```bash
# Verify all your errors are fixed
pnpm --filter @calibr/api typecheck 2>&1 | grep "apps/api/app/api" | grep -v "packages/"
# Should show: 0 results

# Push your branch
git push -u origin fix/typescript-routes

# Update progress tracker
echo "🅰️ AGENT A COMPLETE: All route errors fixed (65/65)"
```

---

## 🅱️ AGENT B: Detailed Instructions

### Setup (5 min)

```bash
# Navigate to directory (use calibrate-codex or clone fresh)
cd C:\Users\rakes\developer\calibrate-codex\calibrate

# Ensure on latest
git checkout chore/update-docs-and-scripts
git pull origin chore/update-docs-and-scripts

# Create your branch
git checkout -b fix/typescript-packages

# Verify your scope (should show ~57 errors)
pnpm --filter @calibr/api typecheck 2>&1 | grep -E "(packages/|apps/api/lib/)" | wc -l
```

### Execution Order

#### **Task 1: amazon-connector (16 errors - 45 min)**

```bash
# View errors
pnpm --filter @calibr/api typecheck 2>&1 | grep "amazon-connector" | head -20

# Common issues:
# - TS2305: Missing exports from platform-connector
# - Type mismatches in connector interface
# - Private property access issues

# Check what platform-connector exports:
grep "export" packages/platform-connector/src/index.ts

# May need to add missing type exports or use workarounds

pnpm --filter @calibr/api typecheck 2>&1 | grep "amazon-connector"

git add packages/amazon-connector
git commit -m "fix(packages): resolve amazon-connector type errors

- Fix missing type imports from platform-connector
- Resolve interface implementation issues
- Fix private property visibility"

echo "✅ Task 1 Complete: amazon-connector (16 errors fixed)"
```

#### **Task 2: lib/staging-database.ts (~10 errors - 30 min)**

```bash
pnpm --filter @calibr/api typecheck 2>&1 | grep "staging-database" | head -15

# Known fixes from checkpoint:
# Line 83: Remove slug from Tenant create (field doesn't exist)
# Line 102: Remove settings from Project create (field doesn't exist)
# Line 144: Add tenantId to Product create (required field)
# Line 184: Fix PriceChange create to match new schema
# Lines 205, 228, 323: Remove slug from Tenant where clauses

# Check actual schema:
grep "model Tenant" packages/db/prisma/schema.prisma -A 10
grep "model Product" packages/db/prisma/schema.prisma -A 20

pnpm --filter @calibr/api typecheck 2>&1 | grep "staging-database"

git add apps/api/lib/staging-database.ts
git commit -m "fix(lib): resolve schema mismatches in staging-database

- Remove non-existent fields (Tenant.slug, Project.settings)
- Add required fields (Product.tenantId)
- Update PriceChange create to match current schema"

echo "✅ Task 2 Complete: staging-database (10 errors fixed)"
```

#### **Task 3: lib/performance-monitor.ts (~8 errors - 20 min)**

```bash
pnpm --filter @calibr/api typecheck 2>&1 | grep "performance-monitor" | head -12

# Add type annotations to implicit any parameters
# Pattern on lines 234, 236, 241, 242, 366-387:
# BEFORE: .reduce((sum, m) => sum + m.value, 0)
# AFTER:  .reduce((sum, m: PerformanceMetric) => sum + m.value, 0)

# Also type other implicit parameters like ErrorMetric, ResourceMetric

pnpm --filter @calibr/api typecheck 2>&1 | grep "performance-monitor"

git add apps/api/lib/performance-monitor.ts
git commit -m "fix(lib): add type annotations in performance-monitor

- Add PerformanceMetric type to reduce callback parameters
- Add ErrorMetric and ResourceMetric type annotations
- Fix unknown types in Prisma raw query results"

echo "✅ Task 3 Complete: performance-monitor (8 errors fixed)"
```

#### **Task 4: lib/auth-security.ts (~3 errors - 10 min)**

```bash
pnpm --filter @calibr/api typecheck 2>&1 | grep "auth-security" | head -5

# Known issue: Missing requireTenant property in SecurityPolicy
# Lines 418, 426: Add requireTenant: false (or true as needed)

pnpm --filter @calibr/api typecheck 2>&1 | grep "auth-security"

git add apps/api/lib/auth-security.ts
git commit -m "fix(lib): add missing requireTenant to SecurityPolicy objects"

echo "✅ Task 4 Complete: auth-security (3 errors fixed)"
```

#### **Task 5: Remaining package errors (30 min)**

```bash
# Find remaining errors in your scope
pnpm --filter @calibr/api typecheck 2>&1 | grep "packages/" | cut -d'(' -f1 | sort -u

# Also check lib files
pnpm --filter @calibr/api typecheck 2>&1 | grep "apps/api/lib/" | cut -d'(' -f1 | sort -u

# Fix each, commit incrementally
```

### Agent B Completion Checklist

```bash
# Verify all your errors are fixed
pnpm --filter @calibr/api typecheck 2>&1 | grep -E "(packages/|apps/api/lib/)"
# Should show: 0 results

# Push your branch
git push -u origin fix/typescript-packages

# Update progress tracker
echo "🅱️ AGENT B COMPLETE: All package/lib errors fixed (57/57)"
```

---

## 🔄 Coordination & Progress Tracking

### 30-Minute Checkpoint

Both agents run and share:

```bash
# Agent A
echo "=== AGENT A (Routes) - 30min Checkpoint ==="
pnpm --filter @calibr/api typecheck 2>&1 | grep "apps/api/app/api" | grep -v "packages/" | wc -l
echo "errors remaining"
git log --oneline -5

# Agent B
echo "=== AGENT B (Packages) - 30min Checkpoint ==="
pnpm --filter @calibr/api typecheck 2>&1 | grep -E "(packages/|apps/api/lib/)" | wc -l
echo "errors remaining"
git log --oneline -5
```

### 60-Minute Checkpoint

```bash
# Both agents: Share estimated completion time
# Verify no file overlap
# If one agent finishing early, they can help the other
```

---

## 🎯 Merge Strategy

### Option 1: Sequential Merge (Recommended)

**Agent who finishes first** (likely Agent A):

```bash
# Create PR from your branch
gh pr create --title "fix: resolve TypeScript errors in API routes (Part 1/2)" \
  --body "## Summary
Part 1 of parallel TypeScript cleanup. Fixes all 65 errors in API route files.

## Scope
- apps/api/app/api/v1/** routes
- apps/api/app/api/auth/** routes
- apps/api/app/api/seed, projects, etc.

## Changes
- Fixed Prisma relation casing (tenant → Tenant, etc.)
- Added explicit IDs with createId() to all create operations
- Removed non-existent schema fields
- Added proper null handling

## Testing
- [x] pnpm typecheck passes for all route files
- [ ] CI validates (will check after push)

Part 2 (packages/lib) being worked on in parallel by Agent B.

Related: PR #2"

# Merge it
gh pr merge --squash --auto
```

**Agent who finishes second**:

```bash
# Pull the merged changes
git checkout chore/update-docs-and-scripts
git pull origin chore/update-docs-and-scripts

# Rebase your branch
git checkout fix/typescript-packages
git rebase chore/update-docs-and-scripts
# Resolve any conflicts (should be minimal to none)

# Push rebased branch
git push --force-with-lease origin fix/typescript-packages

# Create PR
gh pr create --title "fix: resolve TypeScript errors in packages and lib (Part 2/2)" \
  --body "## Summary
Part 2 of parallel TypeScript cleanup. Fixes all 57 errors in packages and lib files.

## Scope
- packages/amazon-connector/**
- packages/competitor-monitoring/**
- packages/platform-connector/**
- apps/api/lib/** (staging-database, performance-monitor, auth-security)

## Changes
- Fixed amazon-connector type exports and interface issues
- Updated lib files to match Prisma schema changes
- Added type annotations to remove implicit any errors
- Fixed SecurityPolicy missing properties

## Testing
- [x] pnpm typecheck passes for all package/lib files
- [ ] CI validates

Completes TypeScript cleanup started in Part 1. Combined with Part 1, resolves all 122 TypeScript errors.

Related: PR #2"

# Merge it
gh pr merge --squash --auto
```

### Option 2: Combined Merge

```bash
# Both agents push to their branches
# Then merge both into chore/update-docs-and-scripts

git checkout chore/update-docs-and-scripts
git merge fix/typescript-routes
git merge fix/typescript-packages

# Run final verification
pnpm typecheck
# Should show: 0 errors

# Push
git push origin chore/update-docs-and-scripts
```

---

## ✅ Final Verification (Both Agents)

Once both branches are merged:

```bash
# Checkout the combined branch
git checkout chore/update-docs-and-scripts
git pull origin chore/update-docs-and-scripts

# Run FULL typecheck
pnpm typecheck
# Expected: Found 0 errors

# Test builds
pnpm --filter @calibr/console build
pnpm --filter @calibr/api build

# Push and check CI
git push origin chore/update-docs-and-scripts

# Monitor PR #2
gh pr view 2
gh pr checks 2
```

### Success Criteria

- ✅ `pnpm typecheck` shows 0 errors
- ✅ Console builds successfully
- ✅ API builds successfully
- ✅ All CI checks pass (validate-deployment, pr-lint, lockfile)
- ✅ Vercel console deploys successfully

---

## 🚨 If You Get Stuck

### Agent A (Routes)

**Common issues**:
1. **Relation names**: Always use PascalCase (Tenant, Project, Product, Sku, Price)
2. **Missing IDs**: Every `.create()` needs `id: createId()`
3. **Schema fields**: Check Prisma schema with `grep "model <Name>" packages/db/prisma/schema.prisma -A 20`

**Get help**:
```bash
# Share current error count and top error
pnpm --filter @calibr/api typecheck 2>&1 | grep "apps/api/app/api" | head -5
```

### Agent B (Packages)

**Common issues**:
1. **amazon-connector**: May need to add type exports to platform-connector
2. **staging-database**: Field mismatches with schema (remove non-existent fields)
3. **performance-monitor**: Add type annotations to all implicit any parameters

**Get help**:
```bash
# Share current error count and top error
pnpm --filter @calibr/api typecheck 2>&1 | grep -E "(packages/|apps/api/lib/)" | head -5
```

---

## 📊 Expected Timeline

**Agent A (Routes)**: 2-2.5 hours
**Agent B (Packages/Lib)**: 2-2.5 hours
**Combined Time**: ~2.5 hours (vs 5 hours sequential)

**Time Saved**: 50% 🚀

---

## 🎯 Ready to Start?

**Agent A**: Start with Task 1 (assistant/query/route.ts)
**Agent B**: Start with Task 1 (amazon-connector)

Good luck! Let's get this repo clean! 💪
