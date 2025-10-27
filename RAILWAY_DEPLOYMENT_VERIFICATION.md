# Railway Deployment Verification Guide

## Current Issue: CORS Fixes Not Live

### Expected Behavior (Once Deployed)
✅ `/api/projects` returns with CORS headers
✅ Railway logs show: `[CORS] Allowing Vercel origin: https://...`
✅ Console loads without CORS errors

### Actual Behavior (Right Now)
❌ `/api/projects` returns 204 for OPTIONS but fails on GET
❌ No CORS logs in Railway
❌ Console shows "CORS error"

**Conclusion**: Railway hasn't deployed the latest commits yet.

---

## Commits That Need to Be Deployed

| Commit | File | What It Does |
|--------|------|--------------|
| 321d43f | security-headers.ts | Allow Vercel .vercel.app URLs |
| c10d75c | security-headers.ts | Add rakesh-paridas-projects + debug logs |
| a05ea57 | catalog/route.ts | Add withSecurity to catalog |
| 4340d8b | **projects/route.ts** | **Add withSecurity to projects** ⚠️ CRITICAL |

**Latest commit**: 4340d8b (pushed 5 minutes ago)

---

## How to Verify Railway Deployment

### Step 1: Check Deployment Status

1. Go to **https://railway.app/**
2. Click on your **API project** (nurturing-caring or similar)
3. Click on the **Deployments** tab
4. Look at the **top deployment** (most recent)

**Check these fields:**
- **Status**: Should say "Success" or "Active" (not "Building" or "Failed")
- **Commit**: Should show commit SHA starting with **4340d8b** or later
- **Time**: Should be within last 10 minutes

### Step 2: Check Deployment Logs

1. Click on the **latest deployment**
2. Click **"View Logs"** or the logs tab
3. Search for: `[CORS]`

**What you should see** (once deployed):
```
[CORS] Allowing Vercel origin: https://console-9pyiio15k-rakesh-paridas-projects.vercel.app
```

**If you see nothing**: Railway hasn't deployed the latest code yet.

### Step 3: Check Build Logs

Still in the deployment view:
1. Look for **Build Logs** section
2. Check if build succeeded
3. Look for any errors during build

**Common issues**:
- `frozen-lockfile` errors
- TypeScript errors (we have `ignoreBuildErrors: true` so this shouldn't block)
- Missing dependencies

---

## If Railway Hasn't Deployed Yet

### Option A: Wait Longer
- Railway can take 5-10 minutes to build and deploy
- Check back in 5 minutes

### Option B: Manually Trigger Redeploy

#### Via Dashboard:
1. Go to your API service in Railway
2. Click **Settings** tab
3. Scroll to **Service**
4. Click **"Redeploy"** button
5. Confirm redeploy

#### Via CLI:
```bash
cd apps/api
railway link
# Select your project/service
railway up
```

### Option C: Check for Deployment Issues

1. Go to Railway dashboard → **Deployments**
2. Look for **failed deployments** (red)
3. Click on failed deployment to see error logs
4. Common fixes:
   - If lockfile error: `pnpm install` then commit `pnpm-lock.yaml`
   - If build error: check TypeScript errors (though we ignore them)
   - If memory error: increase Railway plan

---

## How to Test if CORS is Fixed

### Test 1: Railway Logs
After deployment, load your console dashboard, then check Railway logs.

**Expected**:
```
[CORS] Allowing Vercel origin: https://console-9pyiio15k-rakesh-paridas-projects.vercel.app
GET /api/projects 200
```

**If you see**:
```
[CORS] Rejecting origin: <some-url>
```
Then the origin pattern doesn't match - let me know the exact URL.

### Test 2: Browser Network Tab
1. Open console dashboard
2. Open DevTools → Network tab
3. Reload page
4. Find `/projects` request
5. Click on it → **Headers** tab
6. Look under **Response Headers**

**Expected**:
```
access-control-allow-origin: https://console-9pyiio15k-rakesh-paridas-projects.vercel.app
access-control-allow-methods: GET, POST, PUT, DELETE, OPTIONS, PATCH
access-control-allow-credentials: true
```

**If missing**: Railway hasn't deployed yet or deployment failed.

### Test 3: Curl
From your terminal:

```bash
curl -I -H "Origin: https://console-9pyiio15k-rakesh-paridas-projects.vercel.app" \
  "https://api.calibr.lat/api/projects?userId=test"
```

**Expected**: Response includes `Access-Control-Allow-Origin` header

---

## Commit Verification (Already Pushed)

Verify commits are on master:

```bash
git log --oneline -10
```

**Should include**:
```
4340d8b fix(api): add withSecurity/CORS middleware to /projects endpoint
c10d75c fix(api): expand CORS to allow rakesh-paridas-projects Vercel URLs + debug logging
a05ea57 fix(api): add withSecurity/CORS middleware to catalog endpoint
321d43f fix(api): allow Vercel preview deployments in CORS
```

All these commits ✅ **are pushed to master** and ready for Railway to deploy.

---

## Emergency: If Railway is Stuck

### Check Railway Status
- https://railway.statuspage.io/
- Look for ongoing incidents

### Check GitHub → Railway Connection
1. Railway dashboard → **Settings**
2. Check **GitHub Connection** is active
3. Check **Auto-deploy** is enabled
4. Check **Branch** is set to `master`

### Nuclear Option: Create New Deployment
1. Make a trivial change (add comment to any file)
2. Commit and push
3. This triggers a new deployment

---

## Current Codebase State

All CORS fixes are ✅ **IN THE CODE** and ✅ **PUSHED TO MASTER**:

**File**: `apps/api/lib/security-headers.ts` (lines 202-216)
```typescript
// Allow Vercel preview deployments for console
// Check for both "console" pattern and rakesh-paridas-projects pattern
if (origin.includes('.vercel.app')) {
  // Allow if contains "console" OR "rakesh-paridas-projects"
  if (origin.includes('console') || origin.includes('rakesh-paridas-projects')) {
    console.log('[CORS] Allowing Vercel origin:', origin)
    return true
  }
}

const allowed = allowedOrigins.includes(origin)
if (!allowed) {
  console.log('[CORS] Rejecting origin:', origin)
}
return allowed
```

**File**: `apps/api/app/api/projects/route.ts` (lines 10, 100)
```typescript
export const POST = withSecurity(async (req: NextRequest) => {
  // ... handler
})

export const GET = withSecurity(async (req: NextRequest) => {
  // ... handler
})
```

**File**: `apps/api/app/api/v1/catalog/route.ts` (line 5)
```typescript
export const GET = withSecurity(async (req: NextRequest) => {
  // ... handler
})
```

---

## Timeline

| Time | Event |
|------|-------|
| ~1 hour ago | Fixed NextAuth (console) ✅ Deployed |
| ~1 hour ago | Fixed redirect loops ✅ Deployed |
| ~45 min ago | Added CORS Vercel support (commit 321d43f) |
| ~30 min ago | Added catalog withSecurity (commit a05ea57) |
| ~20 min ago | Expanded CORS pattern + debug (commit c10d75c) |
| ~5 min ago | **Added projects withSecurity (commit 4340d8b)** ⏳ Awaiting deploy |

---

## What to Tell Me

When checking Railway:

1. **What's the latest deployment commit SHA?**
   (First 7 characters, e.g., "4340d8b" or "871d64d")

2. **What's the deployment status?**
   (Building / Success / Failed)

3. **Do you see any errors in logs?**
   (Copy/paste if yes)

4. **Is auto-deploy enabled?**
   (Settings → GitHub → Auto-deploy toggle)

This will help me diagnose if Railway is stuck or if there's another issue.

---

**Created**: Oct 27, 2025, 11:05 PM
**Agent**: Agent C
**Status**: All code pushed ✅ | Waiting for Railway deployment ⏳
