# API Deployment Guide

## Option 1: Railway (Recommended)

Railway provides excellent monorepo support and includes Postgres database.

### Steps:

1. **Install Railway CLI**:
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway**:
   ```bash
   railway login
   ```

3. **Initialize Project**:
   ```bash
   cd apps/api
   railway init
   ```

4. **Add Postgres Database**:
   ```bash
   railway add postgres
   ```

5. **Set Environment Variables**:
   ```bash
   railway variables set NODE_ENV=production
   railway variables set WEBHOOK_SECRET=your-secret-here
   ```

6. **Deploy**:
   ```bash
   railway up
   ```

7. **Run Database Migrations**:
   ```bash
   railway run pnpm --filter @calibr/db prisma migrate deploy
   ```

8. **Get Domain**:
   ```bash
   railway domain
   ```
   Then configure custom domain `api.calibr.lat` in Railway dashboard.

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
