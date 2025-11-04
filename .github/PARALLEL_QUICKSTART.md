# Quick Start: Launch Both Agents in Parallel

## 🚀 Ready to Execute?

**Both agents can start NOW.** Zero file conflicts. Complete in ~2.5 hours.

---

## 📋 Pre-Flight Checklist

- [ ] Both Cursor/Codex sessions open
- [ ] Both have access to the repo
- [ ] Both read `.github/CURSOR_INSTRUCTIONS.md`

---

## 🅰️ Agent A - Launch Command

**Open Cursor/Codex in `calibrate-cursor` directory**

Paste this into Agent A's chat:

```
I am Agent A - API Routes Team.

Read .github/CURSOR_INSTRUCTIONS.md and follow my section (🅰️ AGENT A).

My scope: Fix all TypeScript errors in apps/api/app/api/** routes (~65 errors)
My branch: fix/typescript-routes

Start with Task 1: assistant/query/route.ts (26 errors)

Setup commands:
cd C:\Users\rakes\developer\calibrate-cursor\calibrate
git checkout chore/update-docs-and-scripts
git pull origin chore/update-docs-and-scripts
git checkout -b fix/typescript-routes

Verify scope:
pnpm --filter @calibr/api typecheck 2>&1 | grep "apps/api/app/api" | grep -v "packages/" | wc -l

Begin Task 1 now and report progress after each task completion.
```

---

## 🅱️ Agent B - Launch Command

**Open Cursor/Codex in `calibrate-codex` directory**

Paste this into Agent B's chat:

```
I am Agent B - Packages & Infrastructure Team.

Read .github/CURSOR_INSTRUCTIONS.md and follow my section (🅱️ AGENT B).

My scope: Fix all TypeScript errors in packages/** and apps/api/lib/** (~57 errors)
My branch: fix/typescript-packages

Start with Task 1: amazon-connector (16 errors)

Setup commands:
cd C:\Users\rakes\developer\calibrate-codex\calibrate
git checkout chore/update-docs-and-scripts
git pull origin chore/update-docs-and-scripts
git checkout -b fix/typescript-packages

Verify scope:
pnpm --filter @calibr/api typecheck 2>&1 | grep -E "(packages/|apps/api/lib/)" | wc -l

Begin Task 1 now and report progress after each task completion.
```

---

## ⏱️ Checkpoint Schedule

### 30-Minute Checkpoint

Both agents run and share:

**Agent A:**
```bash
echo "=== AGENT A - 30min Checkpoint ==="
pnpm --filter @calibr/api typecheck 2>&1 | grep "apps/api/app/api" | grep -v "packages/" | wc -l
echo "errors remaining"
git log --oneline -5
```

**Agent B:**
```bash
echo "=== AGENT B - 30min Checkpoint ==="
pnpm --filter @calibr/api typecheck 2>&1 | grep -E "(packages/|apps/api/lib/)" | wc -l
echo "errors remaining"
git log --oneline -5
```

### 60-Minute Checkpoint

Share:
- Estimated completion time
- Any blockers
- Current task

---

## 🎯 Success Metrics

### Agent A Target:
- Start: ~65 errors in routes
- After 30min: ~40 errors (25 fixed)
- After 60min: ~15 errors (50 fixed)
- After 90min: 0 errors ✅

### Agent B Target:
- Start: ~57 errors in packages
- After 30min: ~40 errors (17 fixed)
- After 60min: ~20 errors (37 fixed)
- After 90min: 0 errors ✅

---

## 🔄 When Complete

### Agent finishes first:
```bash
# Push your branch
git push -u origin <your-branch-name>

# Create PR
gh pr create --title "fix: TypeScript errors in <your-scope> (Part X/2)"

# Help the other agent if needed
```

### Both complete:
```bash
# Final verification
git checkout chore/update-docs-and-scripts
git pull origin chore/update-docs-and-scripts
pnpm typecheck
# Should show: Found 0 errors ✅

# Push and merge PR #2
git push origin chore/update-docs-and-scripts
gh pr merge 2 --squash --auto
```

---

## 🆘 If Stuck

**Agent A stuck?**
```bash
# Share top 3 remaining errors
pnpm --filter @calibr/api typecheck 2>&1 | grep "apps/api/app/api" | head -3
```

**Agent B stuck?**
```bash
# Share top 3 remaining errors
pnpm --filter @calibr/api typecheck 2>&1 | grep -E "(packages/|apps/api/lib/)" | head -3
```

---

## 📊 Progress Tracker

Update this as you go:

### Agent A (Routes)
- [ ] Task 1: assistant/query.ts (26) - ETA: ___
- [ ] Task 2: webhooks/price-suggestion.ts (15) - ETA: ___
- [ ] Task 3: seed/route.ts (13) - ETA: ___
- [ ] Task 4: projects/route.ts (11) - ETA: ___
- [ ] Task 5: Remaining routes - ETA: ___

**Status**: ___
**Errors Remaining**: ___ / 65

### Agent B (Packages)
- [ ] Task 1: amazon-connector (16) - ETA: ___
- [ ] Task 2: staging-database.ts (10) - ETA: ___
- [ ] Task 3: performance-monitor.ts (8) - ETA: ___
- [ ] Task 4: auth-security.ts (3) - ETA: ___
- [ ] Task 5: Remaining packages - ETA: ___

**Status**: ___
**Errors Remaining**: ___ / 57

---

## 🎬 Launch NOW!

Copy the launch commands above into your Cursor/Codex sessions and start!

Good luck! 🚀💪
