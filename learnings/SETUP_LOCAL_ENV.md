# Local Environment Setup - Quick Fix

## ✅ Environment File Created

I've created `apps/api/.env.local` with:
- ✅ Shopify API credentials
- ✅ Local API URLs
- ✅ DATABASE_URL (matches docker-compose.yml)

## Next Steps

### 1. Start Database

```powershell
# Start PostgreSQL using Docker
docker-compose up -d

# Verify it's running
docker ps
```

### 2. Run Migrations

```powershell
# Run database migrations
pnpm migrate

# (Optional) Seed with test data
pnpm seed
```

### 3. Restart Dev Server

The `.env.local` file was just created, so you need to restart the dev server:

```powershell
# Stop current dev server (Ctrl+C)
# Then restart:
pnpm dev
```

### 4. Test OAuth Endpoint

Once the server restarts, test:

```powershell
# Quick test
.\test-oauth-local.ps1

# Or in browser:
# http://localhost:3000/api/platforms/shopify/oauth/install?project=demo&shop=test-store.myshopify.com
```

## Expected Result

After restarting, you should see:
- ✅ No DATABASE_URL errors
- ✅ API running on http://localhost:3000
- ✅ OAuth install endpoint returns JSON

## Database Connection String

The DATABASE_URL in `.env.local` is:
```
DATABASE_URL=postgresql://user:pass@localhost:5432/calibr
```

This matches the `docker-compose.yml` configuration:
- User: `user`
- Password: `pass`
- Database: `calibr`
- Port: `5432`

## Troubleshooting

**If database connection fails:**
1. Check Docker is running: `docker ps`
2. Check PostgreSQL container: `docker-compose ps`
3. Check logs: `docker-compose logs db`

**If migrations fail:**
1. Ensure database is running
2. Try: `pnpm db:generate` first
3. Then: `pnpm migrate`

