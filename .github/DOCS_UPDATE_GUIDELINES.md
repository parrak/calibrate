# Docs Update Guidelines

When you change code, infra, or behavior in this repository, update documentation so other agents and humans can understand the context quickly.

Minimal required updates (pick the smallest that applies):

- CHANGELOG.md (required for all non-trivial changes)
  - Add under `## [Unreleased]` a one-line summary and 1-2 bullets explaining the motivation and any migration steps.
  - Example:

```
## [Unreleased]
- Add daily budget policy — enforce `dailyBudgetPct` in `evaluatePolicy`.
  - Adds unit tests for boundary cases.
  - Run `pnpm --filter @calibr/db prisma migrate deploy` after deploy.
```

- PR body (required)
  - Include a `Local Build & Test Verification` section with the commands you ran and pasted outputs or attached logs.
  - Include an `Agent metadata` block when changed by an automated agent (see `.github/AGENT_METADATA_SCHEMA.md`).

- README/DEPLOYMENT.md (when public API, runtime, or deploy behavior changed)
  - Update the relevant file under `apps/*/README.md`, `apps/*/DEPLOYMENT.md`, or root `README.md` with the minimal info needed for a reader to understand the change and how to run/verify it.

- Verification logs
  - Attach `{branch}-verification.log` or `{branch}-railway-verify.log` to the PR when doing replication steps. If logs are long, attach as artifacts or Gist and link from the PR.

Quick copy-paste PR snippet (fill in):

````markdown
## Local Build & Test Verification

Commands run (PowerShell):

```powershell
pnpm verify:local
```

Key outputs (trimmed):
- pnpm db:generate — Prisma client generated
- pnpm --filter @calibr/db prisma migrate deploy — Applied 3 migrations
- pnpm test — All tests passed

Agent metadata (if automated agent made changes):

```json
{ "agent": "<name>", "version": "<version>", "contextId": "<uuid>" }
```

CHANGELOG: Updated under `Unreleased`.
````

Keep docs concise — add only what's necessary for a reviewer or the next agent to reproduce and understand the change.
