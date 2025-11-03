# Instructions for Parallel Agent Execution: Fix PR #2 Lint Errors

**Current Branch**: `chore/update-docs-and-scripts`
**PR**: https://github.com/parrak/calibrate/pull/2
**Status**: 🟡 **IN PROGRESS** - TypeScript fixed, working on 50 ESLint errors

## 🚨 Current Status

### Lint Check: 50 errors in shopify-connector (UPDATED)
**Initial GitHub Actions Report**: 10 errors shown
**Full Lint Check**: 50 errors total across 9 files

**Error Breakdown by File**:
- ✅ `ShopifyConnector.ts`: 8 errors - **FIXED by Agent A**
- 🔄 `ShopifyPricingOperations.ts`: 2 errors - **Codex working on this**
- ❌ `ShopifyProductOperations.ts`: 23 errors - **Agent A take this**
- ❌ `client.ts`: 13 errors - **Agent A take this**
- ❌ `auth.ts`: 2 errors - **Agent B will handle**
- ❌ `index.ts`: 2 errors - **Agent B will handle**
- ❌ `pricing.ts`: 4 errors - **Agent B will handle**
- ❌ `products.ts`: 4 errors - **Agent B will handle**
- ❌ `types.ts`: 1 error - **Agent B will handle**
- ❌ `webhooks.ts`: 1 error - **Agent B will handle**

**Issue**: "Unexpected any. Specify a different type" + some unused vars

### GitHub Actions Warnings: 2 warnings
🔄 **Codex working on this**
- `deployment-validation.yml:21`: Invalid pnpm action input `version-file`
- `lockfile-check.yml:17`: Invalid pnpm action input `version-file`

### Vercel Console Deployment: ✅ FIXED!
**Issue**: Prisma client resolution failure during build
**Root Cause**: Local pnpm installs were removing packages from workspace

**Solution (commit `2cb4843`)**: Run prisma generate from workspace root with schema path
```bash
pnpm exec prisma generate --schema=./packages/db/prisma/schema.prisma
```

**Why This Works**:
- installCommand sets up entire workspace with `--shamefully-hoist`
- buildCommand runs prisma from root where all packages are available
- No local installs that could break the workspace structure
- Prisma can find @prisma/client in the hoisted node_modules

**Deployment**: https://vercel.com/rakesh-paridas-projects/console/9LiY5vp5kF7z2KQqhGUWXoURoCt4

---

## 🎯 Updated Work Distribution

### 🅰️ AGENT A (Cursor): Large Shopify Files

**Branch**: Work directly on `chore/update-docs-and-scripts`
**Files**: 2 large files with 36 total errors
1. `packages/shopify-connector/src/ShopifyProductOperations.ts` (23 errors)
2. `packages/shopify-connector/src/client.ts` (13 errors)

#### Setup
```bash
cd C:\Users\rakes\developer\calibrate-cursor\calibrate
git checkout chore/update-docs-and-scripts
git pull origin chore/update-docs-and-scripts
```

#### Task 1: ShopifyProductOperations.ts (23 errors) (~30 min)

**File**: `packages/shopify-connector/src/ShopifyProductOperations.ts`

**Errors to fix** (23 total):
```
  49:26  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  55:20  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  56:43  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
 103:47  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
 114:21  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
 117:32  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
 122:32  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
 125:23  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
 126:43  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
 127:34  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
 128:30  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
 129:43  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
 176:55  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
 176:91  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
 253:51  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
 306:12  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
 339:15  error  '_filter' is defined but never used       @typescript-eslint/no-unused-vars
 360:44  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
 370:48  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
 371:56  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
 382:44  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
```

**Fix Strategy**:
1. Replace `any` with proper Shopify GraphQL types (likely `ShopifyProduct`, `ShopifyVariant`, etc.)
2. Remove unused `_filter` variable (line 339)
3. Check what types are available from imports - likely need to define interfaces for Shopify API responses

**Common patterns**:
```typescript
// For GraphQL query results
interface ShopifyGraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string; locations?: unknown[] }>;
}

// For product data
interface ShopifyProductNode {
  id: string;
  title: string;
  variants: { edges: Array<{ node: ShopifyVariantNode }> };
  // ... other fields
}

// Replace: (error: any) => error.message
// With: (error: { message: string }) => error.message
```

**Verification**:
```bash
pnpm --filter @calibr/shopify-connector lint 2>&1 | grep "ShopifyProductOperations"
# Should show: 0 errors
```

**Commit**:
```bash
git add packages/shopify-connector/src/ShopifyProductOperations.ts
git commit -m "fix(shopify-connector): replace any types in ShopifyProductOperations

- Define proper types for Shopify GraphQL responses
- Replace any with specific product/variant types
- Remove unused _filter variable
- Fixes 23 ESLint errors"

git push origin chore/update-docs-and-scripts
```

---

#### Task 2: client.ts (13 errors) (~20 min)

**File**: `packages/shopify-connector/src/client.ts`

**Errors to fix** (13 total):
```
  97:45  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  99:30  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
 100:36  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
 117:25  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
 118:25  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
 123:26  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
 124:29  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
 125:29  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
 142:23  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
 189:15  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
 192:15  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
 195:15  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
 208:58  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
```

**Fix Strategy**:
1. Define types for GraphQL query/mutation variables
2. Define types for GraphQL response structure
3. Use `unknown` for truly dynamic data, then type guard

**Common patterns for client.ts**:
```typescript
// For GraphQL variables
interface GraphQLVariables {
  [key: string]: unknown;
}

// For fetch response
interface FetchResponse {
  ok: boolean;
  status: number;
  statusText: string;
  json: () => Promise<unknown>;
}

// For error handling
interface GraphQLError {
  message: string;
  extensions?: {
    code?: string;
    [key: string]: unknown;
  };
}
```

**Verification**:
```bash
pnpm --filter @calibr/shopify-connector lint 2>&1 | grep "client.ts"
# Should show: 0 errors
```

**Commit**:
```bash
git add packages/shopify-connector/src/client.ts
git commit -m "fix(shopify-connector): replace any types in client.ts

- Add proper types for GraphQL variables and responses
- Define error interfaces for type safety
- Use unknown with type guards for dynamic data
- Fixes 13 ESLint errors"

git push origin chore/update-docs-and-scripts
```

---

### 🅱️ AGENT B (Codex/Claude): Remaining Files

**Status**:
- ✅ Prisma deployment fix committed (`503cad7`)
- 🔄 ShopifyPricingOperations.ts (Codex working on this)
- 🔄 GitHub Actions workflows (Codex working on this)
- ⏳ Remaining 14 errors in 6 small files (will handle after Codex finishes)

**Remaining files** (Agent B will handle):
1. `auth.ts` - 2 errors
2. `index.ts` - 2 errors
3. `pricing.ts` - 4 errors
4. `products.ts` - 4 errors
5. `types.ts` - 1 error
6. `webhooks.ts` - 1 error

---

## 🔄 Coordination Protocol

### Timing
- **Agent A**: Start immediately on ShopifyProductOperations.ts (~30 min), then client.ts (~20 min)
- **Codex**: Working on ShopifyPricingOperations.ts + workflows (~15 min)
- **Agent B (Claude)**: Prisma fix done ✅, will handle remaining small files after Codex
- **Total Time**: ~50 minutes for all agents combined

### Communication
All agents working on same branch (`chore/update-docs-and-scripts`):
1. Pull latest before starting each task
2. Work on separate files (no conflicts)
3. Commit immediately after fixing each file
4. Push frequently to keep in sync

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
- [x] Pull latest from branch (initial)
- [x] Fix ShopifyConnector.ts (8 errors) - commit: d1344a4
- [ ] Pull latest (before new tasks)
- [ ] Fix ShopifyProductOperations.ts (23 errors)
- [ ] Verify lint passes for ShopifyProductOperations.ts
- [ ] Commit and push
- [ ] Fix client.ts (13 errors)
- [ ] Verify lint passes for client.ts
- [ ] Commit and push
- [ ] Final verification: 36 errors fixed

### Codex Progress
- [x] Working on ShopifyPricingOperations.ts (2 errors)
- [x] Working on GitHub Actions workflows (2 warnings)
- [ ] Commit and push lint fixes
- [ ] Commit and push workflow fixes

### Agent B Progress (Completed by Agent A)
- [x] Pull latest from branch
- [x] Fix ShopifyPricingOperations.ts line 113 (ShopifyUserError interface)
- [x] Fix ShopifyPricingOperations.ts line 203 (unknown with type guards)
- [x] Verify lint passes for ShopifyPricingOperations.ts
- [x] Fix deployment-validation.yml (package_json_file)
- [x] Fix lockfile-check.yml (package_json_file)
- [x] Commit and push lint fixes (commit 00f7480)
- [x] Diagnose Prisma client resolution issue
- [x] Fix Prisma deployment (improved buildCommand + postinstall script)
- [x] Commit and push Prisma fix (commit 92af004)
- [x] All assigned tasks completed
- _2025-11-03 00:12 UTC � Agent B (Codex)_: Added typed Shopify variant update response + stricter retry guard; no lint errors remain in this file, further package lint fixes tracked separately.

---

## 📝 Context: What Was Fixed

✅ **Previous Session**: All 122 TypeScript type errors fixed
- Fixed Prisma relation names (lowercase → PascalCase)
- Added missing IDs to create operations
- Fixed schema field mismatches
- Resolved cyclic dependencies

✅ **Current Session - Completed**:
- Agent A: Fixed ShopifyConnector.ts (8 errors)
- Agent B: ✅ Fixed Vercel Prisma deployment (9 attempts, success with schema path approach)

✅ **Current Session - Completed**:
- Agent A: ✅ Fixed ShopifyConnector.ts (8 errors) - commit d1344a4
- Agent A (taking over): ✅ Fixed ShopifyPricingOperations.ts (2 errors) - commit 00f7480
- Agent A: ✅ Fixed GitHub Actions workflows (2 warnings) - commit 00f7480
- Agent A: ✅ Fixed Vercel Prisma deployment (improved buildCommand + postinstall) - commit 92af004

⏳ **Remaining Work**: Other lint errors in shopify-connector (not blocking the original 10 errors)

---

## 🎯 Agent A: Start Here!

**Next Task**: Fix `packages/shopify-connector/src/ShopifyProductOperations.ts` (23 errors)

Pull latest and begin! 🚀







