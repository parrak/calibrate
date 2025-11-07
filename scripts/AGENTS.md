# AGENTS.md (scripts)

Scope: `calibrate/scripts` — operational scripts for local, staging, and docs.

## Usage
- Prefer invoking via root scripts to ensure environment flags:
  - Local verify: `pnpm verify:local`
  - Staging deploy: `pnpm staging:deploy`
  - Staging test: `pnpm staging:test`
  - Docs deploy: `pnpm docs:deploy`
- PowerShell scripts are written to tolerate `-ExecutionPolicy Bypass`.

## Agent Notes
- Do not edit scripts unless the user task requires it. These are operationally sensitive.
- If you must change a script, keep behavior backward compatible and document flags in the file header.

## Status Broadcasts
- Follow the hub guide: `../AGENTS.md#status-broadcasting`

## Pull Request Workflow to Master

### **Mandatory PR Requirements**

When creating a Pull Request to sync changes to `master`, **ALL PRs MUST include**:

1. **CHANGELOG.md Update**
   - Add a new entry under `[Unreleased]` section describing the script changes
   - Include new scripts, script improvements, or operational fixes
   - Reference PR number (e.g., `(PR #123)`)

2. **AGENT_WORKFLOW.md Update**
   - Update the relevant agent section in `agents/AGENT_WORKFLOW.md` to reflect progress
   - Mark completed deliverables with ✅ and date
   - Update status indicators if applicable
   - Note which agent (typically Agent A - Cursor) completed the work

3. **PR Description**
   - Clear title (e.g., `feat(scripts): add new deployment script` or `fix(scripts): resolve validation issue`)
   - Summary of script changes
   - Usage instructions if new script added
   - Testing performed

### **PR Creation Steps**

```bash
# 1. Create feature branch
git checkout -b feature/scripts-your-feature

# 2. Make changes and commit
git add .
git commit -m "feat(scripts): your feature description"

# 3. Update CHANGELOG.md (add entry under [Unreleased])
# 4. Update agents/AGENT_WORKFLOW.md (update Agent A section)

# 5. Commit documentation
git add CHANGELOG.md agents/AGENT_WORKFLOW.md
git commit -m "docs: update changelog and agent workflow"

# 6. Push and create PR targeting master
git push origin feature/scripts-your-feature
```

