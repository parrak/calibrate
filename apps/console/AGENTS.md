# AGENTS.md (apps/console)

Scope: `calibrate/apps/console` — Next.js app for the console UI.

## When Editing
- Use and extend shared UI from `@calibr/ui` where possible.
- Keep server/client component boundaries explicit; prefer server components unless interactivity is needed.
- Co-locate styles with components; Tailwind is preferred for styling.
- Keep route structure and layouts consistent with existing pages under `app/`.

## Integration
- API access via existing helpers in `lib/` and `api-client.ts`.
- Auth uses NextAuth; do not introduce custom session handling.

## Validation Before Finishing
- Lint: `pnpm --filter @calibr/console lint`
- Build: `pnpm --filter @calibr/console build`

## Status Broadcasts
- Follow the hub guide: `../../AGENTS.md#status-broadcasting`

## Pull Request Workflow to Master

### **Mandatory PR Requirements**

When creating a Pull Request to sync changes to `master`, **ALL PRs MUST include**:

1. **CHANGELOG.md Update**
   - Add a new entry under `[Unreleased]` section describing the console UI changes
   - Include UI/UX improvements, new pages, component changes, or bug fixes
   - Reference PR number (e.g., `(PR #123)`)

2. **AGENT_WORKFLOW.md Update**
   - Update the relevant agent section in `agents/AGENT_WORKFLOW.md` to reflect progress
   - Mark completed deliverables with ✅ and date
   - Update status indicators and milestone table if applicable

3. **PR Description**
   - Clear title (e.g., `feat(console): add new page` or `fix(console): resolve UI issue`)
   - Summary of UI/UX changes
   - Screenshots or before/after if visual changes
   - Testing performed

### **PR Creation Steps**

```bash
# 1. Create feature branch
git checkout -b feature/console-your-feature

# 2. Make changes and commit
git add .
git commit -m "feat(console): your feature description"

# 3. Update CHANGELOG.md (add entry under [Unreleased])
# 4. Update agents/AGENT_WORKFLOW.md (update Agent B section)

# 5. Commit documentation
git add CHANGELOG.md agents/AGENT_WORKFLOW.md
git commit -m "docs: update changelog and agent workflow"

# 6. Push and create PR targeting master
git push origin feature/console-your-feature
```

