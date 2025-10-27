# NextAuth 500 Error Fix - Deployment Checklist

## Changes Made

### 1. NextAuth Route Configuration
**File**: [apps/console/app/api/auth/[...nextauth]/route.ts](apps/console/app/api/auth/[...nextauth]/route.ts)

Added Node.js runtime enforcement to avoid edge runtime incompatibilities:
```typescript
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
```

### 2. NextAuth Config Update
**File**: [apps/console/lib/auth.ts](apps/console/lib/auth.ts)

Added explicit trustHost and secret configuration:
```typescript
export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  // ... rest of config
})
```

### 3. Diagnostic Endpoint
**File**: [apps/console/app/api/_diag/runtime/route.ts](apps/console/app/api/_diag/runtime/route.ts)

Created diagnostic endpoint to verify runtime and environment configuration.

## Required Vercel Environment Variables

Set these in Vercel Console → Project Settings → Environment Variables:

| Variable | Value | Required |
|----------|-------|----------|
| `AUTH_SECRET` | 32+ character random string | **YES** |
| `NEXTAUTH_SECRET` | Same as AUTH_SECRET | **YES** (fallback) |
| `NEXTAUTH_URL` | `https://console.calibr.lat` | **YES** |
| `AUTH_URL` | `https://console.calibr.lat` | Recommended |
| `AUTH_TRUST_HOST` | `true` | Recommended |
| `NEXT_PUBLIC_API_BASE` | `https://api.calibr.lat` | **YES** |
| `CONSOLE_INTERNAL_TOKEN` | Same as API's internal token | **YES** |
| `DATABASE_URL` | Postgres connection string | **YES** |

### Generate AUTH_SECRET

Run this command to generate a secure secret:
```bash
openssl rand -base64 32
```

Or use Node.js:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Deployment Steps

1. **Set Environment Variables in Vercel**
   - Go to https://vercel.com/your-team/console-calibr-lat/settings/environment-variables
   - Add/update all variables listed above
   - Make sure they're available for Production, Preview, and Development

2. **Redeploy Console**
   ```bash
   git add .
   git commit -m "fix(console): force Node runtime for NextAuth to resolve 500 error"
   git push
   ```

   Or trigger manual redeploy in Vercel dashboard.

3. **Verify Deployment**

   After deployment completes:

   a. Check diagnostic endpoint:
   ```bash
   curl https://console.calibr.lat/api/_diag/runtime
   ```
   Expected: All env flags should be `true`

   b. Check session endpoint:
   ```bash
   curl https://console.calibr.lat/api/auth/session
   ```
   Expected: `200 OK` with JSON (may be empty `{}` if not logged in)

   c. Check console dashboard:
   Visit https://console.calibr.lat/p/demo
   Expected: No "Failed to fetch" error

4. **Check Vercel Logs**
   - Go to https://vercel.com/your-team/console-calibr-lat/logs
   - Filter for "oY is not a constructor"
   - Should see no more occurrences after deployment

## Root Cause

The error `"TypeError: oY is not a constructor"` was caused by NextAuth v5 beta trying to use Edge Runtime features (likely a minified constructor for cookies or crypto helpers) that aren't available in the default Vercel function runtime.

By forcing `runtime = 'nodejs'`, we ensure the route runs in Node.js where all required constructors and APIs are available.

## Rollback Plan

If this doesn't resolve the issue:

1. **Try pinning next-auth version**:
   ```bash
   cd apps/console
   pnpm add next-auth@5.0.0-beta.30
   ```

2. **Or downgrade to stable v4**:
   ```bash
   pnpm add next-auth@4.24.5
   ```
   Then update [apps/console/lib/auth.ts](apps/console/lib/auth.ts) to v4 config format.

3. **Isolate callbacks**: Comment out `callbacks.jwt` and `callbacks.session` temporarily to verify they're not the source.

## Related Commits

- e982c41 - API input validation fix (removed DOMPurify)
- eb45a2a - Console API defaults
- 4001edc - Console auth trustHost
- 3d5d596 - Console SessionProvider + API normalization

## Testing Checklist

- [ ] `GET /api/auth/session` returns 200
- [ ] `GET /api/_diag/runtime` shows correct env flags
- [ ] Console dashboard loads without errors
- [ ] Login flow works end-to-end
- [ ] Middleware redirects work correctly
- [ ] API calls from console include bearer token
- [ ] No "oY is not a constructor" in Vercel logs
