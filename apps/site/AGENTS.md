# AGENTS.md (apps/site)

Scope: `calibrate/apps/site` — Marketing/docs Next.js site.

## When Editing
- Keep components simple and static where possible; avoid server-side data fetching.
- Follow existing Tailwind and component structure under `components/`.
- Maintain accessibility (semantic tags, alt text, focus order).

## Validation Before Finishing
- Lint: `pnpm --filter @calibr/site lint`
- Build: `pnpm --filter @calibr/site build`

## Pull Request Workflow to Master

### **Mandatory PR Requirements**

When creating a Pull Request to sync changes to `master`, **ALL PRs MUST include**:

1. **CHANGELOG.md Update**
   - Add a new entry under `[Unreleased]` section describing the site changes
   - Include marketing content updates, page changes, or design improvements
   - Reference PR number (e.g., `(PR #123)`)

2. **AGENT_WORKFLOW.md Update**
   - Update the relevant agent section in `agents/AGENT_WORKFLOW.md` to reflect progress
   - Mark completed deliverables with ✅ and date
   - Update status indicators if applicable

3. **PR Description**
   - Clear title (e.g., `feat(site): update landing page` or `fix(site): resolve accessibility issue`)
   - Summary of changes
   - Screenshots if visual changes

### **PR Creation Steps**

```bash
# 1. Create feature branch
git checkout -b feature/site-your-feature

# 2. Make changes and commit
git add .
git commit -m "feat(site): your feature description"

# 3. Update CHANGELOG.md (add entry under [Unreleased])
# 4. Update agents/AGENT_WORKFLOW.md (update relevant agent section)

# 5. Commit documentation
git add CHANGELOG.md agents/AGENT_WORKFLOW.md
git commit -m "docs: update changelog and agent workflow"

# 6. Push and create PR targeting master
git push origin feature/site-your-feature
```

