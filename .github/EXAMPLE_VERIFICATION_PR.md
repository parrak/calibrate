# Example PR — Feature: Add daily budget policy

Summary
-------
Add a daily budget check to the pricing policy evaluation and expose it in the admin UI.

Motivation
----------
To prevent aggressive price changes from consuming daily budgets across tenants we add a dailyBudgetPct option to `evaluatePolicy` and surface the evaluation details.

Files changed
-------------
- `packages/pricing-engine/evaluatePolicy.ts` — add daily budget check and unit tests
- `packages/pricing-engine/evaluatePolicy.test.ts` — add tests for boundary cases
- `apps/console/components/PriceChangeRow.tsx` — show policy check details

Tests
-----
Ran package-level tests during development and fixed one edge-case in `evaluatePolicy` where currentAmount === 0.

Local Build & Test Verification (required)
-----------------------------------------
I ran the repository local verification steps and pasted key outputs below.

Commands executed (PowerShell):

```powershell
pnpm verify:local
```

Key outputs (trimmed):

- docker-compose up -d
  - Started postgres_calibrate_1

- pnpm install
  - Packages installed

- pnpm db:generate
  - Prisma client generated successfully

- pnpm migrate
  - Applied 3 migrations

- pnpm seed
  - Seeded initial tenants and demo data

- pnpm --filter @calibr/pricing-engine test
  - PASS  evaluatePolicy should allow positive initial price
  - PASS  evaluatePolicy respects maxPctDelta
  - PASS  evaluatePolicy respects dailyBudgetPct

- pnpm test
  - All workspace tests passed (summary)

- pnpm lint
  - No lint errors

- pnpm build
  - Build succeeded for all apps

If any command failed, I fixed it on this branch and re-ran the verification until green.

Checklist
- [x] Branch created from `master` and named descriptively (`feature/policy-daily-budget`).
- [x] Commit messages follow the mini-contract (summary, motivation, files touched, agent metadata).
- [x] All new and existing tests pass locally.
- [x] Local verification steps executed and outputs included above.
- [x] Human reviewer assigned and PR labeled `feature`.
- [x] Agent metadata included: Agent: autotest/1.0  Context-ID: 9f2b8d

How to verify manually
----------------------
1. Start dev servers: `pnpm dev`.
2. POST a price suggestion to `/api/v1/webhooks/price-suggestion` with a sample payload.
3. Check the admin console `Price Change` row for policy check details.


Notes
-----
- Database migrations were run against a disposable local DB started by docker-compose. Do not run `pnpm migrate` against production DB from this branch.
- If you need the full logs, see the attached `verification.log` (if included).
