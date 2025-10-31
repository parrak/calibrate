# Local Testing Guide for Shopify OAuth

## Quick Start

### 1. Start Local Development Server

```bash
# From project root
pnpm dev
```

This starts:
- **API**: http://localhost:3000
- **Console**: http://localhost:3001

### 2. Set Up Environment Variables

Create `apps/api/.env.local`:

```bash
# Shopify OAuth Credentials
SHOPIFY_API_KEY=55d12ed6f0420a21cd0682db635a7fa1
SHOPIFY_API_SECRET=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

# API URLs (for OAuth redirects)
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_CONSOLE_URL=http://localhost:3001

# Database (if needed)
DATABASE_URL=postgresql://user:password@localhost:5432/calibr
```

### 3. Test Install Endpoint

Open in browser or use curl:

```bash
# Browser
http://localhost:3000/api/platforms/shopify/oauth/install?project=demo&shop=test-store.myshopify.com

# Or PowerShell
Invoke-WebRequest -Uri "http://localhost:3000/api/platforms/shopify/oauth/install?project=demo&shop=test-store.myshopify.com" | Select-Object -ExpandProperty Content
```

**Expected Response:**
```json
{
  "installUrl": "https://test-store.myshopify.com/admin/oauth/authorize?client_id=55d12ed6f0420a21cd0682db635a7fa1&scope=...",
  "shop": "test-store.myshopify.com",
  "scopes": ["read_products", "write_products", "read_orders", "read_inventory", "write_inventory"]
}
```

### 4. Test Full OAuth Flow

1. **Start the servers:**
   ```bash
   pnpm dev
   ```

2. **Navigate to console:**
   ```
   http://localhost:3001/p/demo/integrations/shopify
   ```
   (Replace `demo` with your actual project slug)

3. **Click "Connect Shopify Store"**

4. **Enter shop domain** (e.g., `test-store.myshopify.com` or `test-store`)

5. **Click "Continue to Shopify"**

6. **Expected**: Redirect to Shopify OAuth consent screen

7. **After authorizing**: Redirect back to console with success message

## Troubleshooting

### Issue: Still Getting 405 Error Locally

**Check:**
1. Is the API server running? Check http://localhost:3000/api/health
2. Are environment variables set correctly?
3. Is the route file saved? Try restarting the dev server

**Solution:**
```bash
# Kill any existing processes
# Then restart
cd apps/api
pnpm dev
```

### Issue: OAuth Redirect URL Mismatch

For local testing, you need to configure Shopify app with local redirect URL:

**In Shopify Partners Dashboard:**
- **Allowed redirection URL(s)**: 
  ```
  http://localhost:3000/api/platforms/shopify/oauth/callback
  ```

**Note:** Shopify requires HTTPS for production, but allows HTTP for localhost during development.

### Issue: CORS Errors

The `withSecurity` middleware should handle CORS automatically for localhost. If you see CORS errors:

1. Check `apps/api/lib/security-headers.ts` includes `http://localhost:3001`
2. Verify OPTIONS handler is exported
3. Clear browser cache

### Issue: Database Connection Errors

Make sure:
1. PostgreSQL is running: `docker-compose up -d` or start PostgreSQL manually
2. `DATABASE_URL` is set correctly in `.env.local`
3. Migrations are run: `pnpm migrate`

## Testing Checklist

- [ ] API server starts without errors
- [ ] Install endpoint returns JSON with `installUrl`
- [ ] Install URL contains correct `client_id`
- [ ] Install URL contains correct `redirect_uri`
- [ ] Console UI loads at `/p/[slug]/integrations/shopify`
- [ ] Clicking "Connect" redirects to Shopify
- [ ] OAuth callback redirects back to console
- [ ] Integration shows as "Connected" after OAuth

## Quick Test Script

Save as `test-oauth-local.ps1`:

```powershell
Write-Host "Testing Shopify OAuth Install Endpoint..." -ForegroundColor Cyan

$url = "http://localhost:3000/api/platforms/shopify/oauth/install?project=demo&shop=test-store.myshopify.com"

try {
    $response = Invoke-WebRequest -Uri $url -UseBasicParsing
    $body = $response.Content | ConvertFrom-Json
    
    Write-Host "✅ Success!" -ForegroundColor Green
    Write-Host "Install URL: $($body.installUrl)" -ForegroundColor Gray
    Write-Host "Shop: $($body.shop)" -ForegroundColor Gray
    
    if ($body.installUrl -match "client_id=55d12ed6f0420a21cd0682db635a7fa1") {
        Write-Host "✅ Client ID correct" -ForegroundColor Green
    } else {
        Write-Host "❌ Client ID mismatch" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Gray
    }
}
```

Run with:
```powershell
.\test-oauth-local.ps1
```

## Next Steps After Local Testing

Once local testing works:
1. Commit the fixed route file
2. Push to trigger Railway deployment
3. Test on production: `https://api.calibr.lat/api/platforms/shopify/oauth/install`

