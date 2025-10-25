# Pull Request

Please fill out this template and complete the verification checklist before requesting review.

## Summary
One-line summary of the change.

## Motivation
Explain the problem being solved and why the chosen approach is correct.

## Files changed
- List the changed files and a short rationale for each.

## Tests
Describe what tests were added/updated and how to run them locally (e.g., `pnpm test` or `pnpm --filter @calibr/pricing-engine test`).

## Local Build & Test Verification (required)
Agents must run the following local verification steps and include the command outputs or attach logs in this section of the PR body.

Run these steps in PowerShell (copy/paste):

```powershell
# Start local infra (Postgres, etc.)
docker-compose up -d

# Install dependencies
pnpm install

# Generate Prisma client
pnpm db:generate

# Run migrations and seed on local DB (only against a disposable dev DB)
pnpm migrate
pnpm seed

# Run the test suite (workspace-wide)
pnpm test

# Run lint and type checks
pnpm lint

# Build production bundles for all apps/packages
pnpm build
```

Or run the automated helper script (preferred):

```powershell
pnpm verify:local
```

- If you changed only a package, run only that package's tests for faster feedback, e.g. `pnpm --filter @calibr/pricing-engine test`.
- Paste command output, or attach logs, and list any failing tests you fixed.
- If local verification fails, do not merge; fix issues in the feature branch and re-run verification.

## Checklist
- [ ] Branch created from `master` and named descriptively (e.g. `feature/...` or `fix/...`).
- [ ] Commit messages follow the mini-contract (summary, motivation, files touched, agent metadata).
- [ ] All new and existing tests pass locally.
- [ ] Local verification steps above were executed and outputs included.
- [ ] Human reviewer assigned and PR labeled appropriately.
- [ ] Agent metadata included (if applicable): Agent: <name>/<version>  Context-ID: <uuid>
- [ ] `CHANGELOG.md` updated with an `Unreleased` entry describing this change.
- [ ] Relevant docs/README/DEPLOYMENT files updated (list files below):
	- 
- [ ] Verification logs or evidence included in PR body or attached as `{branch}-verification.log`/`{branch}-verification.md`.

## Agent metadata (optional)
- Agent: 
- Prompt seed / brief description: 
- Decision notes / trade-offs:

## How to verify manually
Add any manual steps reviewers should run to validate the change (endpoints to call, sample payloads, expected responses).


---

Thank you — please keep the PR description and verification evidence clear to help reviewers and other agents reproduce the change.