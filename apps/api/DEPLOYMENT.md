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
