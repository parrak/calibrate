# Fix 401 Login Error on Vercel Console

## Problem
Getting 401 errors when trying to log in to `https://console.calibr.lat` with `admin@calibr.lat`.

## Root Cause
The console app on Vercel connects directly to the Railway PostgreSQL database. The 401 error occurs because:
1. The `passwordHash` column may not exist yet (migration not applied)
2. The user `admin@calibr.lat` doesn't exist or has no `passwordHash` set

## Solution Steps

### Step 1: Verify Migration is Applied
The migration should run automatically on Railway deployment. Check Railway logs to confirm:
```
Running migrations...
Applied: 20251031194005_add_password_hash
```

If migration hasn't run, manually trigger it:
```bash
railway run -- npx prisma migrate deploy --schema=/app/prisma/schema.prisma
```

### Step 2: Seed Database (Create Users with Passwords)
Call the seed endpoint to create users:
```bash
curl -X POST https://api.calibr.lat/api/seed
```

This will create:
- `admin@calibr.lat` with password `Admin1234!`
- `demo@calibr.lat` with password `Demo1234!`

### Step 3: Verify Vercel Environment Variables
Ensure Vercel console has these environment variables set:
- `DATABASE_URL` - Must point to Railway PostgreSQL database
- `AUTH_SECRET` or `NEXTAUTH_SECRET` - Secret for NextAuth
- `NEXT_PUBLIC_API_BASE` - API URL (e.g., `https://api.calibr.lat`)
- `CONSOLE_INTERNAL_TOKEN` - Token for console-to-API auth (optional)

### Step 4: Test Login
Try logging in with:
- Email: `admin@calibr.lat`
- Password: `Admin1234!`

## Verification
After seeding, verify the user exists:
```sql
SELECT email, "passwordHash" IS NOT NULL as has_password 
FROM "User" 
WHERE email = 'admin@calibr.lat';
```

## Notes
- The migration adds the `passwordHash` column to the User table
- The seed endpoint creates/updates users with hashed passwords
- Both console (Vercel) and API (Railway) connect to the same PostgreSQL database

