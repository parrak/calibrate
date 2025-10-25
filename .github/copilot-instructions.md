# Calibrate AI Agent Guide

## Project Overview
Calibrate is a multi-tenant pricing automation platform built with Next.js, Prisma, and TypeScript in a monorepo structure. The platform processes price change suggestions through a secure webhook API, evaluates them against configurable policies, and provides an admin console for review.

## Key Architecture Components
- **Monorepo Structure**: Uses `pnpm` workspaces with shared packages under `packages/` and apps under `apps/`
- **Core Services**:
  - `packages/pricing-engine`: Policy evaluation logic (`evaluatePolicy.ts`)
  - `packages/db`: Prisma schema and migrations
  - `packages/security`: HMAC verification and idempotency
  - `packages/connectors`: E-commerce platform integrations
- **Frontend Apps**:
  - `apps/console`: Admin dashboard (Next.js)
  - `apps/api`: Backend API routes
  - `apps/site` & `apps/docs`: Public site and documentation

## Critical Patterns

### Database Schema
- Multi-tenant design with `Tenant` as the root entity
- All major entities (`Project`, `Product`, `Policy`) have tenant isolation
- Example in `packages/db/prisma/schema.prisma`

### Price Policy Evaluation
```typescript
// packages/pricing-engine/evaluatePolicy.ts
evaluatePolicy(currentAmount, proposedAmount, {
  maxPctDelta?: number,  // Maximum % change allowed
  floor?: number,        // Minimum price
  ceiling?: number       // Maximum price
})
```

### Development Workflow
1. Start dependencies: `docker-compose up -d`
2. Install packages: `pnpm install`
3. Generate Prisma client: `pnpm -F db generate`
4. Run dev servers: `pnpm dev`

### Testing
- Use Vitest for unit tests (`*.test.ts`)
- Add tests in the same directory as source files
- Mock external dependencies (database, APIs)

### Common Tasks
- Add new policy rule: Extend `evaluatePolicy.ts` and update Prisma schema
- Create API endpoint: Add route in `apps/api/app/api`
- Update admin UI: Modify components in `apps/console/components`

## Development Process
- **Branch Management**:
  - Create feature branches from `master` for all changes
  - Use descriptive branch names: `feature/policy-budget-limits` or `fix/webhook-validation`
  - Never commit directly to `master`
  - Ensure all tests pass before merging to `master`

- **Testing Requirements**:
  - Write tests alongside new code, not after
  - Update existing tests when modifying functionality
  - Run full test suite before creating PR: `pnpm test`
  - Verify changes in development environment before merging

- **Quality Gates**:
  - All tests must pass in feature branch
  - No regressions in `master` - run test suite after merge
  - Maintain test coverage for new features
  - Review schema changes for backward compatibility

## Configuration Management
- **Environment Variables**:
  - Never hardcode sensitive values or environment-specific config
  - Use `.env.example` files as templates in each package/app
  - Reference environment variables through strongly-typed config modules
  - Example locations:
    - Root: `.env.example`
    - API: `apps/api/.env.local.example`
    - Database: `packages/db/.env.example`

- **Configuration Hierarchy**:
  - Root config for project-wide settings
  - Package-level configs for reusable modules
  - App-specific configs for deployment settings
  - Local overrides via `.env.local` (git-ignored)

## Build & Test Verification

- Agents must perform local build and test verification before merging to `master` or initiating any production deployment. Do the full local verification even if CI exists — document results in the PR.

- Minimal local verification steps (PowerShell):

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

- Package-level tests: run only the package you changed for faster feedback, e.g. `pnpm --filter @calibr/pricing-engine test`.
- Record verification: in the PR body include which commands you ran, any failing tests you fixed, and a short note that the local build succeeded (or attach logs/snippets).
- If tests or build fail in local verification, do not merge. Fix issues in the feature branch and re-run verification.
- CI is required but not sufficient — local verification catches environment-specific issues early and speeds up iteration.

## Agent Collaboration & Documentation

- When multiple LLM agents or developers contribute, document the "why" for every change — not just the "what".
- Commit messages must be explicit and follow this mini-contract:
  - Short summary (50 chars max)
  - Blank line
  - One-paragraph motivation explaining why the change is needed
  - Bullet list of files touched and a short rationale per file
  - Agent metadata footer (optional but recommended): `Agent: <name>/<version>` `Context-ID: <uuid>`

- Pull Request (PR) body should include the following sections (copy this template):

  Summary
  -------
  One-line summary of the change.

  Motivation
  ----------
  Explain the problem being solved and why the chosen approach is correct.

  Files changed
  -------------
  - `packages/pricing-engine/evaluatePolicy.ts` — update to enforce daily budget check
  - `packages/pricing-engine/evaluatePolicy.test.ts` — added tests for edge-cases

  Tests
  -----
  Describe what tests were added/updated and how to run them locally (e.g., `pnpm test`).

  How to verify
  -------------
  Step-by-step manual verification (endpoints to call, example payloads, expected responses).

  Agent metadata
  --------------
  - Agent: `gpt-4.x` (optional)
  - Prompt seed: brief description or file with the prompt used
  - Decision notes: short bullets describing trade-offs considered

- Inline code comments: prefer short comments that explain the reasoning and cite the PR/issue number. Example in code:

  // Allow any positive proposedAmount when currentAmount === 0
  // See PR (example 123) — avoids rejecting valid initial prices for new products

- Tests and changelog: update or add tests in the same package as the code change (see `packages/pricing-engine/*`) and add a short changelog entry (create `CHANGELOG.md` at repo root if none exists).

- Multi-agent coordination:
  - Assign a human reviewer or single ownership for every PR to avoid conflicting automated changes.
  - If two agents make related changes, include cross-references in each PR and prefer one combined PR that a human merges.

### Agent documentation requirements

- Every agent (automated or human) that makes changes MUST update repository MD files so the next agent or reviewer can understand the context of the change.
- Minimum documentation updates required per change:
  - Add an entry to `CHANGELOG.md` under `Unreleased` describing the change and motivation (one-line summary + 1-2 bullets). Example: `CHANGELOG.md` — "Add daily budget policy: enforce dailyBudgetPct in evaluatePolicy, added tests.".
  - If public-facing behavior or APIs changed, update the relevant `README.md` (root or package-level) and any `DEPLOYMENT.md` or `apps/*/README.md` that document runtime/endpoint behavior.
  - Include verification evidence either inside the PR body (preferred) or as a small `{feature}-verification.md` file under `.github/` or the package folder. Use the PR template checklist and `.github/EXAMPLE_VERIFICATION_PR.md` as a reference.
- When changing infra or deployment (Railway, Vercel, Docker), update `apps/*/DEPLOYMENT.md` and list required environment variables in the corresponding `.env.example` files.
- Keep docs concise: update only the files needed to explain the change, but do not omit the changelog entry — changelog entries help other agents quickly build context.

## Best Practices
- Always maintain tenant isolation in queries
- Use HMAC verification for webhooks (`packages/security`)
- Implement idempotency for price change operations
- Follow Next.js App Router conventions in all apps