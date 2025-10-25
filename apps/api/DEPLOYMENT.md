# API Deployment Guide

## 🚀 Current Production Status

**Deployed and Operational**
- **URL:** https://api.calibr.lat
- **Platform:** Railway
- **Status:** ✅ Live
- **Database:** Railway PostgreSQL (migrated)
- **Latest Deploy:** October 24, 2025 (commit `1a0532c`)

## Option 1: Railway (Recommended) ⭐

Railway provides excellent monorepo support with managed PostgreSQL database. This is currently used in production.

### Production Configuration

**Docker Setup:**
- Base Image: `node:20-slim` (Debian)
- Build: Multi-stage with Next.js standalone output
- Binary Target: `debian-openssl-3.0.x` (critical for Prisma)
- Health Check: `/api/health`

**Environment Variables (Set in Railway Dashboard):**
- `DATABASE_URL`: Auto-provided by PostgreSQL service (use `${{Postgres.DATABASE_URL}}`)
- `WEBHOOK_SECRET`: Your secure webhook secret
- `NODE_ENV`: production
- `PORT`: 8080 (set in Railway service variables)
- `HOSTNAME`: 0.0.0.0 (CRITICAL: set in Dockerfile ENV - Next.js uses this for bind address, not HOST!)

### Initial Setup (Already Completed)

These steps have already been completed for the production deployment:

1. **Install Railway CLI**:
   ```bash
   npm install -g @railway/cli
   ```

2. **Login and Link**:
   ```bash
   railway login
   railway link  # Select: parrak's Projects → nurturing-caring → production → @calibr/api
   ```

3. **PostgreSQL Database**: ✅ Already added and configured

4. **Custom Domain**: ✅ api.calibr.lat configured

### Deploying Updates

To deploy new changes to production:

```bash
# Method 1: Redeploy latest commit (recommended)
railway redeploy

# Method 2: Deploy local code
railway up

# Method 3: Trigger via git push (auto-deploy enabled)
git push origin master  # Railway auto-deploys on push
```

### Running Database Migrations

After deploying code changes that include schema updates:

```bash
# Run migrations on Railway database
railway run -- npx prisma migrate deploy --schema=./packages/db/prisma/schema.prisma
```

### Viewing Logs

```bash
# Stream live logs
railway logs --service @calibr/api

# Or view in dashboard
# https://railway.app → nurturing-caring → @calibr/api → Deployments
```

### Verifying Deployment

```bash
# Check health endpoint
curl https://api.calibr.lat/api/health

# Expected response:
# {"status":"ok","timestamp":"2025-10-24T...","service":"calibr-api"}
```

## Local replication (simulate Railway deploy locally)

When changes touch deployment, infra, or database migrations, replicate Railway locally before merging:

1) Retrieve Railway variables (dashboard or CLI):

```powershell
railway login
railway variables # review variables or copy them from the dashboard
```

2) Create local `.env` files from examples and populate them with Railway values:

```powershell
cp .env.example .env
cp packages/db/.env.example packages/db/.env
# Edit the files and paste Railway-like values (DATABASE_URL, WEBHOOK_SECRET)
```

3) Start local infra (Postgres) using docker-compose:

```powershell
docker-compose up -d
```

4) Install deps, build artifacts and run production-style migrations:

```powershell
pnpm install
pnpm build
pnpm --filter @calibr/db prisma migrate deploy
```

5) Start services in a production-like mode and run smoke tests:

```powershell
# Preferred: Railway local runner (simulates the production environment)
railway up

# Alternative: Docker Compose (build images locally)
docker-compose -f docker-compose.yml up --build --force-recreate

# Run smoke tests against local endpoints
pnpm test
```

6) Capture outputs and include them in your PR (migration logs, build logs, smoke-test results). If you cannot reproduce a Railway failure locally, collect `railway logs` and attach them to the PR for investigation.

These steps help ensure that artifacts produced locally behave the same way Railway will run them and that migrations succeed in a production-style flow.

## Option 2: Render

1. Create new Web Service
2. Connect your GitHub repo
3. Set build command: `cd ../.. && pnpm install && pnpm --filter @calibr/api... build`
4. Set start command: `cd apps/api && pnpm start`
5. Add Postgres database
6. Configure environment variables

## Option 3: Fly.io with Docker

1. Install Fly CLI
2. From project root: `fly launch --dockerfile apps/api/Dockerfile`
3. Add Postgres: `fly postgres create`
4. Connect database: `fly postgres attach`
5. Deploy: `fly deploy`

## Database Setup

After deployment, run migrations:

```bash
# Railway
railway run pnpm --filter @calibr/db prisma migrate deploy

# Render/Fly
# SSH into container or use their CLI to run:
cd /app/packages/db && pnpm exec prisma migrate deploy
```

## Environment Variables Required

- `DATABASE_URL` - Postgres connection string (auto-set by Railway/Render)
- `NODE_ENV=production`
- `WEBHOOK_SECRET` - Secret for webhook signature verification
- `NEXT_PUBLIC_API_BASE` - API URL (e.g., https://api.calibr.lat)

## Custom Domain Setup

After deployment, configure DNS for `api.calibr.lat`:
- Railway: Add custom domain in project settings
- Render: Add custom domain in service settings
- Fly.io: `fly certs create api.calibr.lat`

---

## 🚨 Critical Deployment Constraints (MUST READ)

### Next.js Standalone Server Requirements

**HOSTNAME Environment Variable (CRITICAL)**
- Next.js standalone server uses `HOSTNAME` (NOT `HOST`) to determine bind address
- **MUST** be set to `0.0.0.0` in Dockerfile ENV for Railway healthchecks to work
- Setting only in Railway service variables is insufficient
- Symptom if missing: Server binds to container hostname (e.g., `http://bd5b77b7d2f8:8080`) instead of `0.0.0.0`, causing healthcheck failures

**PORT Environment Variable**
- Set to `8080` in both Dockerfile ENV and Railway service variables
- Next.js standalone reads this to determine listening port
- Railway healthcheck expects port 8080

**Example in Dockerfile:**
```dockerfile
ENV NODE_ENV=production
ENV PORT=8080
ENV HOSTNAME=0.0.0.0  # CRITICAL - must be 0.0.0.0
```

### Prisma Binary Targets

**MUST use `debian-openssl-3.0.x` for Railway deployments:**
```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "debian-openssl-3.0.x"]
}
```

**DO NOT use:**
- `linux-musl` or `linux-musl-openssl-3.0.x` (Alpine) - causes engine errors
- `rhel-openssl-3.0.x` - wrong platform

**Required Dockerfile ENV for Prisma:**
```dockerfile
ENV PRISMA_CLI_BINARY_TARGETS="debian-openssl-3.0.x"
ENV PRISMA_ENGINE_BINARY_TARGET="debian-openssl-3.0.x"
ENV PRISMA_CLIENT_ENGINE_TYPE=binary
```

### Database Schema Constraints

**Unique Constraints Must Support Seed Script:**
- Product: composite unique on `(tenantId, projectId, code)` - allows same code across tenants
- Sku: composite unique on `(productId, code)` - allows same code across products
- Price: composite unique on `(skuId, currency)` - one price per SKU per currency
- Policy: unique on `projectId` - enables upsert by project

**DO NOT add global uniques** on `Product.code` or `Sku.code` - breaks multi-tenant seeding

### Railway-Specific Configuration

**railway.json Requirements:**
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

**Healthcheck Endpoint:**
- MUST exist at `/api/health`
- MUST return JSON with status 200
- Located at `apps/api/app/api/health/route.ts`
- Used by Railway to determine deployment success

**Start Command:**
- Use wrapper script (`/app/start.sh`) for startup logging and env verification
- Script MUST export `HOSTNAME=0.0.0.0` before starting Next.js
- Helps diagnose port binding and startup issues

### Dockerfile Best Practices

**Multi-stage Build Structure:**
```dockerfile
# Builder stage: node:20-slim (Debian)
FROM node:20-slim AS builder
# ... build Next.js standalone, generate Prisma client

# Runner stage: node:20-slim (Debian)
FROM node:20-slim AS runner
# ... copy built artifacts, set ENV vars, start server
```

**Required Runtime Steps:**
1. Install Prisma CLI globally for pre-deploy migrations
2. Copy Prisma schema and migrations to `/app/prisma`
3. Remove musl engines from final image (prevent wrong engine loading)
4. Set correct file ownership for non-root user (nextjs:nodejs)
5. Expose port 8080
6. Use startup wrapper script for logging

### Testing Before Deployment

**Pre-merge Checklist:**
1. Test Dockerfile build locally (if not on Debian, verify in Railway preview)
2. Verify Prisma generates correct engines: `debian-openssl-3.0.x`
3. Run migrations in test environment
4. Ensure seed script completes without constraint violations
5. Check healthcheck endpoint returns 200 OK
6. Verify server binds to `0.0.0.0:8080` in logs

**Local Docker Test:**
```bash
# Build image
docker build -f apps/api/Dockerfile -t calibr-api:test .

# Run with Railway-like environment
docker run -p 8080:8080 \
  -e DATABASE_URL="postgresql://..." \
  -e NODE_ENV=production \
  -e PORT=8080 \
  -e HOSTNAME=0.0.0.0 \
  calibr-api:test

# Check logs show: "Starting Next.js server on 0.0.0.0:8080"
# Verify: curl http://localhost:8080/api/health
```

### Common Deployment Failures and Solutions

| Symptom | Cause | Solution |
|---------|-------|----------|
| Healthcheck fails with "service unavailable" | Next.js binding to container hostname instead of 0.0.0.0 | Set `HOSTNAME=0.0.0.0` in Dockerfile ENV |
| Prisma engine errors (`SIGILL`, `libssl` not found) | Wrong binary target (Alpine/musl instead of Debian) | Use `debian-openssl-3.0.x` in schema and Dockerfile |
| Seed script fails with unique constraint violation | Global uniques on Product.code or Sku.code | Use composite uniques: `@@unique([tenantId, projectId, code])` |
| Migration fails during pre-deploy | Database out of sync or missing permissions | Check Railway Postgres permissions, verify migration files |
| Build succeeds but app crashes on startup | Missing environment variables or incorrect paths | Check Railway service variables, verify `DATABASE_URL` |
| Domain returns 404 "Application not found" | Deployment never promoted due to failed healthcheck | Check healthcheck logs, verify HOSTNAME and PORT binding |

### Migration Safety

**Before Adding Migrations:**
1. Test locally with `prisma migrate dev`
2. Verify SQL is reversible if needed
3. Check for data loss risks (dropping columns/tables)
4. Ensure migrations are idempotent (can run multiple times safely)

**Railway Pre-deploy Command:**
- Runs `prisma migrate deploy` before starting app
- Failures abort deployment (good!)
- Check logs for "No pending migrations" or migration names applied

### Monitoring Deployment Health

**After Push to Master:**
1. Watch Railway deployment logs for build completion
2. Verify pre-deploy migrations run successfully
3. Check startup logs show correct HOSTNAME and PORT
4. Wait for healthcheck to pass (up to 5 minutes retry window)
5. Test endpoints:
   - `https://calibrapi-production.up.railway.app/api/health`
   - `https://api.calibr.lat/api/health`

**Expected Success Logs:**
```
=== Calibr API Startup ===
NODE_ENV: production
PORT: 8080
HOSTNAME: 0.0.0.0
==========================
Starting Next.js server on 0.0.0.0:8080...
   ▲ Next.js 14.0.4
   - Local:        http://0.0.0.0:8080
 ✓ Ready in 71ms
```

---

## Troubleshooting

If deployment fails after following all constraints above:

1. **Check Railway Logs:** `railway logs --service @calibr/api`
2. **Verify Environment Variables:** Railway dashboard → service → Variables tab
3. **Inspect Build Output:** Look for Prisma engine generation messages
4. **Test Healthcheck Locally:** Build Docker image and test `/api/health` endpoint
5. **Compare with Working Deployment:** Review logs from successful deployment (commit `2d16036`)

For persistent issues, refer to commit history:
- `2d16036`: Fix HOSTNAME env var for Next.js binding
- `35c0ca5`: Add startup logging script
- `ff0e1de`: Add PORT and HOST env vars (later corrected to HOSTNAME)
- `a71bf09`: Add explicit startCommand
