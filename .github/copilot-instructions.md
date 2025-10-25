# Calibrate AI Agent Guide

## Project Overview
Calibrate is a multi-tenant pricing automation platform built with Next.js, Prisma, and TypeScript in a monorepo structure. The platform processes price change suggestions through a secure webhook API, evaluates them against configurable policies, and provides an admin console for review.

## Applicability

These instructions apply to all contributors and automated agents working on this repository — including but not limited to Codex, Claude, Code, Cursor, and Copilot-style agents. Every agent must follow these conventions, update documentation when making changes, and include verification evidence in PRs as described below.

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

- **CRITICAL**: Use the automated validation script for comprehensive testing:

```powershell
# Run comprehensive deployment validation
.\scripts\validate-deployment.ps1

# Or run specific checks
.\scripts\validate-deployment.ps1 -SkipBuild -SkipTests
```

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

# CRITICAL: Test JSON serialization (prevents BigInt errors)
pnpm --filter @calibr/api run test:json-serialization

# Test API endpoints locally
pnpm dev:api &
Start-Sleep 15
Invoke-WebRequest -Uri "http://localhost:3000/api/health" -Method Get
Invoke-WebRequest -Uri "http://localhost:3000/api/metrics?project=demo" -Method Get
```

- Package-level tests: run only the package you changed for faster feedback, e.g. `pnpm --filter @calibr/pricing-engine test`.
- Record verification: in the PR body include which commands you ran, any failing tests you fixed, and a short note that the local build succeeded (or attach logs/snippets).
- If tests or build fail in local verification, do not merge. Fix issues in the feature branch and re-run verification.
- CI is required but not sufficient — local verification catches environment-specific issues early and speeds up iteration.

## Railway local replication & deploy testing

- Railway deployments can fail post-merge if changes aren't tested against a production-like environment. Agents must replicate Railway deploys locally when a change affects deployment, infra, DB migrations, or environment variables.
- Minimal replication checklist (PowerShell):

```powershell
# 1) Get Railway variables (copy from Railway dashboard or use CLI)
railway login
railway variables # or inspect variables in the Railway dashboard

# 2) Start local infra similar to Railway (Postgres, etc.)
docker-compose up -d

# 3) Create a local .env from example and populate values (DATABASE_URL, WEBHOOK_SECRET, etc.)
cp .env.example .env
cp packages/db/.env.example packages/db/.env
# Edit the files and paste Railway-like values or the ones from the CLI/dashboard

# 4) Build production artifacts and run production-style migrations locally
pnpm build
pnpm --filter @calibr/db prisma migrate deploy

# 5) Run the services locally in a production-like mode (Railway local runner)
railway up

# 6) Run smoke tests / integration tests against the running services
pnpm test
```

- If `railway up` is not available or you prefer Docker-only verification, build and run containers with Docker Compose:

```powershell
docker-compose -f docker-compose.yml up --build --force-recreate
# Then run smoke tests against localhost endpoints
pnpm test
```

- What to capture in the PR:
  - The exact commands run to replicate Railway (copy/paste the PowerShell commands you used).
  - Key output snippets (migration success, build logs, smoke-test results) or attached logs (`{branch}-railway-verify.log`).
  - Any differences between local and Railway behavior and how you resolved them.

- If a change touches DB schema, ensure migrations were run with `prisma migrate deploy` (production flow) and include the migration step output in the PR.

- If you can't reproduce the failure locally, capture the minimal failing Railway logs (from the Railway dashboard or `railway logs`) and attach them to the PR; escalate to a human reviewer if the issue blocks merging.

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

---

## 🚨 CRITICAL: Railway Deployment Constraints

These constraints MUST be followed by all agents and developers to prevent deployment regressions. Violating these will break production deployments.

### Environment Variables - CRITICAL

**HOSTNAME (NOT HOST!)**
- Next.js standalone server uses `HOSTNAME` environment variable to determine bind address
- **MUST** be set to `0.0.0.0` in `apps/api/Dockerfile` ENV section
- **DO NOT** use `HOST` - Next.js ignores it
- Consequence: Healthcheck failures, deployment never promoted, 404 errors on domain

**PORT**
- **MUST** be set to `8080` in `apps/api/Dockerfile` ENV section
- Also set in Railway service variables (dashboard)
- Consequence: Railway cannot reach healthcheck endpoint

**Example (REQUIRED in apps/api/Dockerfile):**
```dockerfile
ENV NODE_ENV=production
ENV PORT=8080
ENV HOSTNAME=0.0.0.0  # CRITICAL - Next.js uses this, not HOST
```

### Prisma Binary Targets - CRITICAL

**MUST use `debian-openssl-3.0.x`:**
```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "debian-openssl-3.0.x"]
}
```

**NEVER use:**
- `linux-musl` or `linux-musl-openssl-3.0.x` (Alpine)
- `rhel-openssl-3.0.x`
- Consequence: Prisma engine crashes with SIGILL or missing libssl errors

**Required Dockerfile ENV:**
```dockerfile
ENV PRISMA_CLI_BINARY_TARGETS="debian-openssl-3.0.x"
ENV PRISMA_ENGINE_BINARY_TARGET="debian-openssl-3.0.x"
ENV PRISMA_CLIENT_ENGINE_TYPE=binary
```

### Database Schema Constraints - CRITICAL

**Unique Constraints for Multi-tenant Seeding:**
- Product: `@@unique([tenantId, projectId, code])` - allows same code across tenants
- Sku: `@@unique([productId, code])` - allows same code across products
- Price: `@@unique([skuId, currency])` - one price per SKU per currency
- Policy: `@@unique([projectId])` - enables upsert by project

**NEVER add:**
- Global unique on `Product.code` or `Sku.code`
- Consequence: Seed script fails with constraint violations, migrations fail

### Railway Configuration Files

**apps/api/railway.json (REQUIRED STRUCTURE):**
```json
{
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "/apps/api/Dockerfile"
  },
  "deploy": {
    "healthcheckPath": "/api/health",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10,
    "preDeployCommand": "prisma migrate deploy --schema=/app/prisma/schema.prisma",
    "startCommand": "/app/start.sh"
  }
}
```

**DO NOT:**
- Remove healthcheckPath
- Change healthcheckPath without updating health endpoint
- Remove preDeployCommand (migrations must run before app starts)
- Remove startCommand (needed for startup logging)

### Dockerfile Requirements

**Base Image:**
- Use `node:20-slim` (Debian) for both builder and runner stages
- **DO NOT** use Alpine (`node:20-alpine`) - causes Prisma engine errors

**Required Steps in Runner Stage:**
1. Install Prisma CLI globally: `RUN npm i -g prisma@5.22.0`
2. Copy Prisma schema/migrations to `/app/prisma`
3. Set ENV vars (HOSTNAME, PORT, PRISMA_*)
4. Remove musl engines (prevent wrong engine loading)
5. Expose port 8080
6. Use startup script: `CMD ["/app/start.sh"]`

### Healthcheck Endpoint

**apps/api/app/api/health/route.ts MUST exist and return:**
```typescript
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'calibr-api'
  })
}
```

**DO NOT:**
- Remove this file
- Change the path (Railway expects `/api/health`)
- Add authentication (healthcheck must be public)
- Make it async/dependent on database (healthcheck must be fast)

### Pre-Deployment Testing

**Before ANY merge to master that touches:**
- `apps/api/Dockerfile`
- `apps/api/railway.json`
- `packages/db/prisma/schema.prisma`
- `apps/api/start.sh`
- Prisma migrations
- **ANY API endpoint that returns JSON**

**MUST verify:**
1. Build Docker image locally and test startup
2. Check logs show: `Starting Next.js server on 0.0.0.0:8080`
3. Verify `/api/health` returns 200 OK
4. Test migrations with `prisma migrate deploy`
5. Seed script completes without errors
6. **CRITICAL: Test JSON serialization for all API endpoints**

**Testing Commands:**
```bash
# Build and run locally
docker build -f apps/api/Dockerfile -t test .
docker run -p 8080:8080 -e DATABASE_URL=postgresql://... test

# Verify healthcheck
curl http://localhost:8080/api/health

# CRITICAL: Test JSON serialization
curl http://localhost:8080/api/health | jq .
curl "http://localhost:8080/api/metrics?project=demo" | jq .
curl "http://localhost:8080/api/admin/dashboard?project=demo" | jq .
```

### 🚨 CRITICAL: Preventing JSON Serialization Regressions

**BigInt Serialization Issues:**
- PostgreSQL returns `BigInt` values that cannot be serialized to JSON
- This causes deployment failures with "Do not know how to serialize a BigInt"
- **MUST** convert all BigInt values to numbers before JSON response

**Required Patterns:**
```typescript
// ❌ WRONG - Will cause BigInt serialization error
const connections = await prisma().$queryRaw`SELECT count(*) as active_connections FROM pg_stat_activity`
return NextResponse.json({ connections: connections[0]?.active_connections })

// ✅ CORRECT - Convert BigInt to number
const connections = await prisma().$queryRaw`SELECT count(*) as active_connections FROM pg_stat_activity`
return NextResponse.json({ connections: Number(connections[0]?.active_connections) || 0 })
```

**Validation Checklist:**
1. All database query results must be converted to numbers
2. Use `Number(bigIntValue)` or `bigIntValue.toString()`
3. Test all API endpoints return valid JSON
4. Run `.\scripts\validate-deployment.ps1` before merging
5. Check for BigInt in response: `response.Content | ConvertFrom-Json | ConvertTo-Json`

### Common Regression Causes

| DO NOT | WHY | SYMPTOM |
|--------|-----|---------|
| Use `ENV HOST=0.0.0.0` | Next.js uses HOSTNAME not HOST | Healthcheck fails |
| Use Alpine base image | Prisma needs Debian glibc | Engine crashes |
| Add global unique on Product.code | Breaks multi-tenant seed | Seed fails |
| Remove HOSTNAME env var | Server binds to container ID | 404 on domain |
| Change healthcheck path | Railway can't verify deployment | Never promoted |
| Skip preDeployCommand | Migrations don't run | App crashes on startup |
| Return BigInt in JSON response | BigInt cannot be serialized | "Do not know how to serialize a BigInt" |
| Skip JSON serialization testing | BigInt issues not caught locally | Deployment fails in production |

### Deployment Verification

**After push to master, MUST verify:**
1. Railway build completes (check logs for `node:20-slim`)
2. Pre-deploy migrations run: "No pending migrations"
3. Startup logs show: `HOSTNAME: 0.0.0.0` and `PORT: 8080`
4. Healthcheck passes (up to 5 min retry window)
5. Test both domains:
   - https://calibrapi-production.up.railway.app/api/health
   - https://api.calibr.lat/api/health

**Expected Success Logs:**
```
=== Calibr API Startup ===
NODE_ENV: production
PORT: 8080
HOSTNAME: 0.0.0.0
==========================
Starting Next.js server on 0.0.0.0:8080...
   ▲ Next.js 14.0.4
   - Local:        http://0.0.0.0:8080  ← MUST show 0.0.0.0
 ✓ Ready in 71ms
```

### Reference Commits

When fixing deployment issues, refer to these commits:
- `2d16036`: Fix HOSTNAME env var for Next.js binding (CRITICAL)
- `35c0ca5`: Add startup logging script for diagnostics
- `ff0e1de`: Add PORT/HOST env vars (later corrected to HOSTNAME)
- `a71bf09`: Add explicit startCommand

### Full Documentation

See `apps/api/DEPLOYMENT.md` for complete deployment guide with troubleshooting table and all configuration details.

---

## 🚨 CRITICAL: Vercel Deployment - pnpm Lockfile Consistency

**MANDATORY**: All agents and developers MUST follow these rules to prevent Vercel deployment regressions. Violating these will break frontend deployments.

### Root Cause of Lockfile Issues

Vercel uses a default pnpm version that may not match the version specified in `package.json`. When versions mismatch:
- Local lockfile uses `lockfileVersion: '9.0'` (pnpm 9.x)
- Vercel's pnpm tries to read it with incompatible version
- Build fails with: `ERR_PNPM_NO_LOCKFILE Cannot install with 'frozen-lockfile'`

### Required Configuration

**EVERY Vercel-deployed app MUST have `vercel.json` with:**

```json
{
  "buildCommand": "cd ../.. && pnpm install && pnpm --filter @scope/app-name build",
  "installCommand": "corepack prepare pnpm@9.0.0 --activate && pnpm install --frozen-lockfile=false"
}
```

**Currently configured apps:**
- `apps/site/vercel.json` - Marketing site
- `apps/console/vercel.json` - Admin console
- `apps/docs/vercel.json` - API documentation

### Validation Requirements

**BEFORE merging ANY change that touches:**
- `package.json` (especially `packageManager` field)
- `pnpm-lock.yaml`
- `apps/*/vercel.json`
- pnpm version upgrade
- Vercel configuration

**MUST run verification script:**

```powershell
# Validates all Vercel configurations
.\scripts\verify-vercel-config.ps1
```

**Script verifies:**
1. pnpm version in `package.json` matches lockfile version
2. All Vercel apps have `vercel.json` files
3. Each `vercel.json` specifies correct pnpm version
4. Each `vercel.json` includes `corepack prepare` command
5. Each `vercel.json` disables `frozen-lockfile`

### Common Regression Patterns

| DO NOT | WHY | SYMPTOM |
|--------|-----|---------|
| Upgrade pnpm without updating vercel.json | Version mismatch breaks builds | `ERR_PNPM_NO_LOCKFILE` error |
| Deploy Vercel app without vercel.json | Uses wrong pnpm version | Lockfile compatibility errors |
| Use `frozen-lockfile=true` in Vercel | Monorepo needs dependency hoisting | Install fails |
| Skip verification script | Miss configuration drift | Production build fails |
| Delete vercel.json files | Vercel reverts to defaults | Lockfile version mismatch |

### Pre-Deployment Testing

**Required verification steps:**

```powershell
# 1. Verify configuration is correct
.\scripts\verify-vercel-config.ps1

# 2. Test local build matches Vercel environment
pnpm install
pnpm --filter @calibr/console build
pnpm --filter @calibr/site build
pnpm --filter @calibr/docs build

# 3. Check lockfile consistency
git status # Should show no changes to pnpm-lock.yaml
```

### Deployment Recovery

If Vercel deployment fails with lockfile error:

1. **Check pnpm version consistency:**
   ```powershell
   # Extract version from package.json
   $pkg = Get-Content package.json | ConvertFrom-Json
   $pnpmVersion = $pkg.packageManager -replace 'pnpm@', ''
   Write-Host "Expected: $pnpmVersion"

   # Check lockfile version
   Get-Content pnpm-lock.yaml -Head 1
   ```

2. **Verify vercel.json exists and is correct:**
   ```powershell
   # Check all apps
   Get-ChildItem apps/*/vercel.json | ForEach-Object {
     Write-Host $_.FullName
     Get-Content $_.FullName
   }
   ```

3. **Run verification script:**
   ```powershell
   .\scripts\verify-vercel-config.ps1
   ```

4. **If issues found, fix and redeploy:**
   ```bash
   # Fix vercel.json files as needed
   # Run verification again
   .\scripts\verify-vercel-config.ps1

   # Commit and push
   git add apps/*/vercel.json
   git commit -m "fix(vercel): ensure pnpm version consistency"
   git push
   ```

### Standard Operating Procedure (SOP)

**When upgrading pnpm version:**

1. Update `package.json` `packageManager` field
2. Run `corepack prepare pnpm@<version> --activate`
3. Run `pnpm install` to update lockfile
4. Update ALL `apps/*/vercel.json` files with new version
5. Run `.\scripts\verify-vercel-config.ps1`
6. Commit all changes together
7. Monitor Vercel deployments for success

**When adding new Vercel app:**

1. Create `apps/<app>/vercel.json` using template from existing apps
2. Update `installCommand` with correct pnpm version
3. Update `buildCommand` with correct filter scope
4. Run `.\scripts\verify-vercel-config.ps1`
5. Test local build: `pnpm --filter @scope/app build`
6. Commit and push

### Full Documentation

See `.github/VERCEL_DEPLOYMENT_GUIDE.md` for complete guide including:
- Detailed root cause analysis
- Prevention strategies and checklist
- Troubleshooting scenarios
- CI/CD integration examples
- Emergency recovery procedures

### Reference Commits

When fixing Vercel deployment issues, refer to:
- `cf68b87`: Fix Vercel pnpm lockfile compatibility (adds vercel.json files)
- Includes verification script and comprehensive documentation