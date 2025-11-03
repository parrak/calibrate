# Agent A - Next Steps (All Tasks Complete!)

## ✅ Status: READY TO PUSH

You've successfully fixed all 65+ TypeScript errors in API routes. Time to finalize and create your PR.

---

## Step 1: Final Verification (3 min)

```bash
# Ensure you're on your branch
git status
# Should show: On branch fix/typescript-routes

# Final typecheck for your scope
pnpm --filter @calibr/api typecheck 2>&1 | grep "apps/api/app/api" | grep -v "packages/"
# Expected: No results (0 errors)

# Check what you've committed
git log --oneline origin/chore/update-docs-and-scripts..HEAD
# Should show 7+ commits fixing routes

# View changed files
git diff origin/chore/update-docs-and-scripts --stat
```

**Expected**: Clean typecheck for all route files, multiple commits documenting your fixes.

---

## Step 2: Push Your Branch (2 min)

```bash
# Push to remote
git push -u origin fix/typescript-routes
```

---

## Step 3: Create PR Part 1/2 (5 min)

```bash
gh pr create --title "fix: resolve TypeScript errors in API routes (Part 1/2)" \
  --body "$(cat <<'EOF'
## Summary
Part 1 of parallel TypeScript cleanup effort. Fixes all 65+ TypeScript errors in API route files.

## Tasks Completed
- ✅ Task 1: assistant/query/route.ts (26 errors)
  - Fixed Prisma relation mismatches (PriceChange has no direct sku relation)
  - Fixed Sku model field access via Product relation
  - Corrected Price and cost data access patterns
  - Fixed field name usage (code vs sku)
- ✅ Task 2: projects routes (13 errors)
  - Added missing IDs to Project and Membership creates
  - Fixed relation name casing (Project, ShopifyIntegration, AmazonIntegration)
  - Replaced non-existent platformIntegration queries
- ✅ Task 3: seed/route.ts (12 errors)
  - Added explicit IDs to all create operations (Project, User, Membership, Product, Sku, Price, Policy, PriceChange)
  - Fixed relation name (Price instead of prices)
- ✅ Task 4: Competitors routes
  - Fixed relation names (Sku, CompetitorProduct, CompetitorPrice, Product)
- ✅ Task 5: Security module exports
  - Exported verifyHmac and ensureIdempotent from @calibr/security
- ✅ Task 6: Remaining route fixes
  - Analytics: Fixed import paths and Next.js params typing
  - Price changes: Fixed JsonValue casts via Prisma.InputJsonValue
  - Webhooks: Fixed LogEntry metadata access and schema relations
- ✅ Task 7: Final verification
  - All route-level errors resolved (0 errors in scope)

## Scope
**Files modified:**
- apps/api/app/api/v1/assistant/query/route.ts
- apps/api/app/api/projects/route.ts
- apps/api/app/api/projects/[slug]/route.ts
- apps/api/app/api/seed/route.ts
- apps/api/app/api/v1/competitors/** (multiple routes)
- apps/api/app/api/v1/price-changes/** (multiple routes)
- apps/api/app/api/v1/webhooks/** (multiple routes)
- apps/api/app/api/v1/analytics/** (multiple routes)
- packages/security/src/index.ts (exports)

**Total**: ~65 errors fixed across all API route files

## Changes Made
1. **Prisma relation fixes**: All relation includes use PascalCase (Tenant, Project, Sku, Price, Product, etc.)
2. **ID generation**: Added explicit `id: createId()` to all create operations
3. **Schema alignment**: Removed references to non-existent fields, aligned with actual Prisma schema
4. **Type safety**: Proper null checks, JsonValue handling, metadata access patterns
5. **Module exports**: Security utilities now properly exported

## Testing
- [x] pnpm typecheck shows 0 errors in apps/api/app/api routes
- [x] All Prisma queries aligned with schema
- [x] No linter errors in modified files
- [ ] CI validation pending

## Related Work
- **Part 2 (Agent B)**: Packages and lib files (amazon-connector, staging-database, performance-monitor, auth-security) - In progress
- **Base PR**: #2 (chore/update-docs-and-scripts)

## Merge Strategy
This is Part 1/2 of parallel cleanup. Can be merged independently or wait for Part 2 to merge both together.

---

🤖 Agent A - API Routes Team
EOF
)"
```

---

## Step 4: Verify PR Created (2 min)

```bash
# Check PR status
gh pr view --json number,title,url

# View PR checks (will be pending initially)
gh pr checks

# Get PR URL
gh pr view --web
```

**Expected**: PR created successfully, CI checks starting.

---

## Step 5: Coordinate with Agent B

**Agent B Status**: Working on packages/lib errors (amazon-connector, staging-database, performance-monitor, auth-security)

**Your options:**

### Option A: Wait for Agent B
```bash
# Monitor Agent B's progress in calibrate-codex directory
# When Agent B completes, coordinate merge strategy
```

### Option B: Offer Help
If Agent B is stuck or behind schedule:
```bash
# Check what errors remain in Agent B scope
pnpm --filter @calibr/api typecheck 2>&1 | grep -E "(packages/|apps/api/lib/)" | head -10

# Offer to help with specific files if needed
```

---

## Merge Options (Once Agent B Completes)

### Sequential Merge (Recommended)
```bash
# Your PR merges first
gh pr merge --squash --auto

# Agent B rebases on your changes and merges second
# (Agent B handles this)
```

### Combined Merge
```bash
# Both branches merge to chore/update-docs-and-scripts
# Then chore/update-docs-and-scripts merges to master as PR #2
```

---

## Final Checklist

- [ ] Final typecheck shows 0 route errors in your scope
- [ ] Branch pushed to origin/fix/typescript-routes
- [ ] PR #[number] created with detailed description
- [ ] CI checks running/passing
- [ ] Agent B status confirmed
- [ ] Merge strategy decided

---

## Success Metrics

**Your contribution:**
- ✅ 65+ errors fixed
- ✅ 7 tasks completed
- ✅ 15+ files modified
- ✅ All route-level TypeScript errors resolved
- ✅ Clean typecheck for API routes

**Timeline**: Completed in estimated 2-2.5 hours ✨

---

## Questions?

**If CI fails**:
```bash
gh run view --log-failed
```

**If merge conflicts arise**:
```bash
git fetch origin
git rebase origin/chore/update-docs-and-scripts
```

**If you need to check Agent B's progress**:
```bash
# In calibrate-codex directory
cd C:\Users\rakes\developer\calibrate-codex\calibrate
git checkout fix/typescript-packages
git log --oneline
```

---

Great work, Agent A! 🎉 All route errors eliminated. Ready to finalize!
