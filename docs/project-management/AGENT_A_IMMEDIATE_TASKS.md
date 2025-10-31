# Agent A - Immediate Tasks: Complete Shopify OAuth Flow

**Date:** October 28, 2025
**Status:** 🟢 UNBLOCKED - Agent C completed POST endpoint
**Priority:** HIGH - Can now complete Shopify OAuth end-to-end
**Estimated Time:** 4-6 hours

---

## 🎯 Objective

Complete the Shopify OAuth flow so users can connect their Shopify stores to Calibr through a secure OAuth process.

---

## ✅ What Agent C Completed (Dependencies Resolved)

**POST /api/platforms/shopify** endpoint is now fully functional:
- Accepts `{ projectSlug, credentials }` in request body
- Validates credentials: requires `shopDomain` and `accessToken`
- Tests connection via `ConnectorRegistry.testConnection()`
- Saves to database using `upsert` (allows reconnecting)
- Returns integration details on success

**Example successful response:**
```json
{
  "success": true,
  "integration": {
    "id": "cuid123",
    "platform": "shopify",
    "platformName": "mystore.myshopify.com",
    "isActive": true,
    "installedAt": "2025-10-28T12:00:00.000Z"
  }
}
```

---

## 📋 Tasks to Complete

### Task 1: Review and Fix OAuth Install Route (30 mins)

**File:** `apps/api/app/api/platforms/shopify/oauth/install/route.ts`

**Current State:** Route exists but may need updates

**Required Implementation:**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { withSecurity } from '@/lib/security-headers';

export const runtime = 'nodejs';

/**
 * GET /api/platforms/shopify/oauth/install
 * Generates Shopify OAuth authorization URL
 *
 * Query params:
 * - project: project slug (required)
 * - shop: Shopify shop domain (required)
 */
export const GET = withSecurity(async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectSlug = searchParams.get('project');
  const shop = searchParams.get('shop');

  if (!projectSlug || !shop) {
    return NextResponse.json(
      { error: 'Project slug and shop domain are required' },
      { status: 400 }
    );
  }

  // Validate shop domain format
  if (!shop.endsWith('.myshopify.com') && !shop.includes('.')) {
    return NextResponse.json(
      { error: 'Invalid shop domain. Must be in format: mystore.myshopify.com' },
      { status: 400 }
    );
  }

  // Shopify OAuth scopes
  const scopes = [
    'read_products',
    'write_products',
    'read_orders',
    'read_inventory',
    'write_inventory',
  ].join(',');

  const apiKey = process.env.SHOPIFY_API_KEY;
  const redirectUri = `${process.env.NEXT_PUBLIC_API_URL}/api/platforms/shopify/oauth/callback`;

  if (!apiKey) {
    console.error('SHOPIFY_API_KEY not configured');
    return NextResponse.json(
      { error: 'Shopify integration not configured' },
      { status: 500 }
    );
  }

  // Build Shopify OAuth URL
  const authUrl = new URL(`https://${shop}/admin/oauth/authorize`);
  authUrl.searchParams.set('client_id', apiKey);
  authUrl.searchParams.set('scope', scopes);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('state', projectSlug); // Use state to track project
  authUrl.searchParams.set('grant_options[]', 'per-user');

  return NextResponse.json({
    installUrl: authUrl.toString(),
    shop,
    scopes: scopes.split(','),
  });
});

export const OPTIONS = withSecurity(async () => {
  return new NextResponse(null, { status: 204 });
});
```

**Testing:**
```bash
curl "http://localhost:3001/api/platforms/shopify/oauth/install?project=demo&shop=test-store.myshopify.com"
```

**Expected Response:**
```json
{
  "installUrl": "https://test-store.myshopify.com/admin/oauth/authorize?client_id=xxx&scope=read_products,write_products&redirect_uri=https://api.calibr.lat/api/platforms/shopify/oauth/callback&state=demo",
  "shop": "test-store.myshopify.com",
  "scopes": ["read_products", "write_products", ...]
}
```

---

### Task 2: Review and Fix OAuth Callback Route (2 hours)

**File:** `apps/api/app/api/platforms/shopify/oauth/callback/route.ts`

**Current State:** Route exists but needs to integrate with POST endpoint

**Required Implementation:**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { withSecurity } from '@/lib/security-headers';
import crypto from 'crypto';

export const runtime = 'nodejs';

/**
 * GET /api/platforms/shopify/oauth/callback
 * Handles Shopify OAuth callback
 *
 * Query params from Shopify:
 * - code: OAuth authorization code
 * - hmac: HMAC signature for verification
 * - shop: Shop domain
 * - state: Project slug (from install step)
 * - timestamp: Unix timestamp
 */
export const GET = withSecurity(async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const code = searchParams.get('code');
  const hmac = searchParams.get('hmac');
  const shop = searchParams.get('shop');
  const state = searchParams.get('state'); // projectSlug
  const timestamp = searchParams.get('timestamp');

  // Validate required params
  if (!code || !hmac || !shop || !state) {
    console.error('Missing OAuth callback parameters', { code: !!code, hmac: !!hmac, shop, state });
    return redirectToConsoleWithError(state, 'missing_parameters');
  }

  // Verify HMAC signature
  const apiSecret = process.env.SHOPIFY_API_SECRET;
  if (!apiSecret) {
    console.error('SHOPIFY_API_SECRET not configured');
    return redirectToConsoleWithError(state, 'configuration_error');
  }

  if (!verifyShopifyHMAC(searchParams, hmac, apiSecret)) {
    console.error('Invalid HMAC signature');
    return redirectToConsoleWithError(state, 'invalid_signature');
  }

  try {
    // Exchange authorization code for access token
    const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.SHOPIFY_API_KEY,
        client_secret: apiSecret,
        code,
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Failed to exchange code for token:', error);
      return redirectToConsoleWithError(state, 'token_exchange_failed');
    }

    const tokenData = await tokenResponse.json();
    const { access_token, scope } = tokenData;

    if (!access_token) {
      console.error('No access token received from Shopify');
      return redirectToConsoleWithError(state, 'no_access_token');
    }

    // Save integration using Agent C's POST endpoint
    const saveResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/platforms/shopify`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectSlug: state,
          credentials: {
            shopDomain: shop,
            accessToken: access_token,
            scope: scope || 'read_products,write_products',
          },
        }),
      }
    );

    if (!saveResponse.ok) {
      const error = await saveResponse.json();
      console.error('Failed to save Shopify integration:', error);
      return redirectToConsoleWithError(state, 'save_failed');
    }

    const integration = await saveResponse.json();
    console.log('Shopify integration saved successfully:', integration.integration.id);

    // Redirect to console success page
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_CONSOLE_URL}/p/${state}/integrations/shopify?success=true`
    );
  } catch (error) {
    console.error('OAuth callback error:', error);
    return redirectToConsoleWithError(state, 'unexpected_error');
  }
});

/**
 * Verify Shopify HMAC signature
 * Shopify docs: https://shopify.dev/docs/apps/auth/oauth/getting-started#step-5-verify-the-request
 */
function verifyShopifyHMAC(
  searchParams: URLSearchParams,
  receivedHmac: string,
  apiSecret: string
): boolean {
  // Build query string without HMAC parameter
  const params = Array.from(searchParams.entries())
    .filter(([key]) => key !== 'hmac')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  // Calculate HMAC
  const hash = crypto
    .createHmac('sha256', apiSecret)
    .update(params)
    .digest('hex');

  // Compare using timing-safe comparison
  return crypto.timingSafeEqual(
    Buffer.from(hash),
    Buffer.from(receivedHmac)
  );
}

/**
 * Redirect to console with error parameter
 */
function redirectToConsoleWithError(projectSlug: string | null, error: string): NextResponse {
  const consoleUrl = projectSlug
    ? `${process.env.NEXT_PUBLIC_CONSOLE_URL}/p/${projectSlug}/integrations/shopify?error=${error}`
    : `${process.env.NEXT_PUBLIC_CONSOLE_URL}/integrations?error=${error}`;

  return NextResponse.redirect(consoleUrl);
}

export const OPTIONS = withSecurity(async () => {
  return new NextResponse(null, { status: 204 });
});
```

**Security Notes:**
- ✅ HMAC verification prevents request tampering
- ✅ Timing-safe comparison prevents timing attacks
- ✅ No sensitive data logged (only success/failure)
- ✅ Proper error handling and user feedback

**Testing:**
Cannot test without real Shopify OAuth flow, but can unit test HMAC verification:

```typescript
// tests/shopify-oauth.test.ts
import { describe, it, expect } from 'vitest';

describe('Shopify HMAC Verification', () => {
  it('verifies valid HMAC', () => {
    // Test with known good signature
  });

  it('rejects invalid HMAC', () => {
    // Test with tampered parameters
  });
});
```

---

### Task 3: Update Console UI ShopifyAuthButton (1 hour)

**File:** `apps/console/app/p/[slug]/integrations/shopify/components/ShopifyAuthButton.tsx`

**Current State:** Component exists but needs to integrate with install endpoint

**Required Implementation:**

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@calibr/ui/button';
import { AlertCircle } from 'lucide-react';

interface ShopifyAuthButtonProps {
  projectSlug: string;
  onSuccess?: () => void;
}

export function ShopifyAuthButton({ projectSlug, onSuccess }: ShopifyAuthButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shopDomain, setShopDomain] = useState('');
  const [showInput, setShowInput] = useState(false);

  const handleConnect = async () => {
    if (!shopDomain) {
      setError('Please enter your shop domain');
      return;
    }

    // Validate shop domain format
    if (!shopDomain.includes('.') && !shopDomain.endsWith('.myshopify.com')) {
      setError('Invalid format. Enter: mystore.myshopify.com');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Call install endpoint to get OAuth URL
      const response = await fetch(
        `/api/platforms/shopify/oauth/install?project=${projectSlug}&shop=${shopDomain}`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to start OAuth flow');
      }

      const { installUrl } = await response.json();

      // Redirect to Shopify OAuth consent screen
      window.location.href = installUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect');
      setLoading(false);
    }
  };

  if (!showInput) {
    return (
      <Button onClick={() => setShowInput(true)} size="lg">
        Connect Shopify Store
      </Button>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="shop-domain" className="block text-sm font-medium mb-2">
          Shopify Store Domain
        </label>
        <input
          id="shop-domain"
          type="text"
          placeholder="mystore.myshopify.com"
          value={shopDomain}
          onChange={(e) => setShopDomain(e.target.value)}
          disabled={loading}
          className="w-full px-3 py-2 border rounded-md"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleConnect();
            }
          }}
        />
        <p className="text-xs text-gray-500 mt-1">
          Enter your full Shopify store domain (e.g., mystore.myshopify.com)
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          onClick={handleConnect}
          disabled={loading || !shopDomain}
          size="lg"
        >
          {loading ? 'Connecting...' : 'Continue to Shopify'}
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setShowInput(false);
            setShopDomain('');
            setError(null);
          }}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
```

---

### Task 4: Update Shopify Integration Page (1 hour)

**File:** `apps/console/app/p/[slug]/integrations/shopify/page.tsx`

**Required Updates:**

```typescript
import { ShopifyAuthButton } from './components/ShopifyAuthButton';
import { ShopifyStatus } from './components/ShopifyStatus';

export default async function ShopifyIntegrationPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { success?: string; error?: string };
}) {
  const { slug } = await params;

  // Fetch current integration status
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/platforms/shopify?project=${slug}`,
    { cache: 'no-store' }
  );

  const { integration, isConnected } = await response.json();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">Shopify Integration</h1>
      <p className="text-gray-600 mb-8">
        Connect your Shopify store to sync products and manage pricing.
      </p>

      {/* Success message */}
      {searchParams.success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-green-800 font-medium">
            ✓ Successfully connected to Shopify!
          </p>
        </div>
      )}

      {/* Error message */}
      {searchParams.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800 font-medium">
            Failed to connect: {getErrorMessage(searchParams.error)}
          </p>
        </div>
      )}

      {isConnected ? (
        <div className="space-y-6">
          <ShopifyStatus integration={integration} />

          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold mb-4">Actions</h2>
            <button
              className="text-red-600 hover:text-red-700"
              onClick={async () => {
                if (confirm('Are you sure you want to disconnect your Shopify store?')) {
                  await fetch(`/api/platforms/shopify?project=${slug}`, {
                    method: 'DELETE',
                  });
                  window.location.reload();
                }
              }}
            >
              Disconnect Shopify
            </button>
          </div>
        </div>
      ) : (
        <div className="border rounded-lg p-6 bg-white">
          <h2 className="text-xl font-semibold mb-4">Connect Your Store</h2>
          <p className="text-gray-600 mb-6">
            Authorize Calibr to access your Shopify store. You'll be redirected to Shopify to grant permissions.
          </p>
          <ShopifyAuthButton projectSlug={slug} />
        </div>
      )}
    </div>
  );
}

function getErrorMessage(error: string): string {
  const messages: Record<string, string> = {
    missing_parameters: 'OAuth callback missing required parameters',
    configuration_error: 'Shopify app not properly configured',
    invalid_signature: 'Invalid request signature',
    token_exchange_failed: 'Failed to exchange authorization code',
    no_access_token: 'No access token received from Shopify',
    save_failed: 'Failed to save integration',
    unexpected_error: 'An unexpected error occurred',
  };
  return messages[error] || error;
}
```

---

### Task 5: Environment Variables (15 mins)

Add to Railway and `.env.example`:

```bash
# Shopify App Credentials
SHOPIFY_API_KEY=your_shopify_app_client_id
SHOPIFY_API_SECRET=your_shopify_app_client_secret

# URLs (already exist, verify values)
NEXT_PUBLIC_API_URL=https://api.calibr.lat
NEXT_PUBLIC_CONSOLE_URL=https://app.calibr.lat
```

**Where to get Shopify credentials:**
1. Go to [Shopify Partners Dashboard](https://partners.shopify.com/)
2. Create or select your app
3. Go to App Setup
4. Copy **Client ID** (API Key) and **Client Secret** (API Secret)
5. Set **App URL** to `https://app.calibr.lat`
6. Set **Allowed redirection URL(s)** to:
   - `https://api.calibr.lat/api/platforms/shopify/oauth/callback`

---

## 🧪 Testing Checklist

### Manual Testing (with Dev Store)

1. **Create Shopify Development Store:**
   - Go to Shopify Partners
   - Create development store
   - Note the store domain (e.g., `calibr-test.myshopify.com`)

2. **Test OAuth Flow:**
   ```bash
   # Step 1: Navigate to integration page
   https://app.calibr.lat/p/demo/integrations/shopify

   # Step 2: Click "Connect Shopify Store"
   # Step 3: Enter: calibr-test.myshopify.com
   # Step 4: Click "Continue to Shopify"
   # Step 5: Verify redirect to Shopify consent screen
   # Step 6: Click "Install app"
   # Step 7: Verify redirect back to console with success message
   # Step 8: Verify integration shows "Connected"
   ```

3. **Verify Database:**
   ```sql
   SELECT * FROM "ShopifyIntegration" WHERE "projectId" = 'project_id';
   -- Should show: shopDomain, accessToken (encrypted), isActive=true
   ```

4. **Test Disconnect:**
   ```bash
   # Click "Disconnect Shopify"
   # Verify isActive set to false
   # Verify UI shows "Not Connected"
   ```

5. **Test Reconnect:**
   ```bash
   # Click "Connect Shopify Store" again
   # Use same shop domain
   # Verify it updates existing record (upsert)
   # Verify isActive set back to true
   ```

### Automated Testing

```typescript
// tests/shopify-oauth-flow.test.ts
describe('Shopify OAuth Flow', () => {
  it('generates valid install URL', async () => {
    const response = await GET('/api/platforms/shopify/oauth/install?project=test&shop=test.myshopify.com');
    expect(response.installUrl).toContain('https://test.myshopify.com/admin/oauth/authorize');
  });

  it('verifies valid HMAC', () => {
    // Test HMAC verification
  });

  it('saves integration on successful callback', async () => {
    // Mock Shopify token exchange
    // Test callback saves to database
  });
});
```

---

## ✅ Success Criteria

- [ ] User can click "Connect Shopify" in console
- [ ] User enters shop domain and is redirected to Shopify
- [ ] User approves permissions on Shopify consent screen
- [ ] User is redirected back to console with success message
- [ ] Integration status shows "Connected" with shop domain
- [ ] Integration record exists in database with encrypted token
- [ ] User can disconnect integration (soft delete)
- [ ] User can reconnect same shop (updates existing record)
- [ ] All HMAC signatures verified correctly
- [ ] No sensitive data logged in console or logs
- [ ] Error messages are user-friendly

---

## 🔗 Dependencies

**Completed by Agent C:**
- ✅ POST /api/platforms/shopify endpoint
- ✅ DELETE /api/platforms/shopify endpoint
- ✅ ShopifyIntegration database table with migration
- ✅ Prisma client includes shopifyIntegration model

**Environment Requirements:**
- SHOPIFY_API_KEY (get from Shopify Partners)
- SHOPIFY_API_SECRET (get from Shopify Partners)
- NEXT_PUBLIC_API_URL (already configured)
- NEXT_PUBLIC_CONSOLE_URL (already configured)

---

## 📚 Resources

**Shopify Documentation:**
- [OAuth Getting Started](https://shopify.dev/docs/apps/auth/oauth/getting-started)
- [OAuth Scopes](https://shopify.dev/docs/api/usage/access-scopes)
- [Verifying Requests](https://shopify.dev/docs/apps/auth/oauth/getting-started#step-5-verify-the-request)

**Calibr Documentation:**
- [AGENT_PRIORITY_TASKS.md](AGENT_PRIORITY_TASKS.md) - Overall plan
- [AGENT_C_WEEK2_HANDOFF.md](AGENT_C_WEEK2_HANDOFF.md) - Agent C's work
- POST endpoint contract in `apps/api/app/api/platforms/[platform]/route.ts`

---

## 🚨 Common Issues

**Issue:** "Invalid HMAC signature"
**Solution:** Verify SHOPIFY_API_SECRET is correct, use timing-safe comparison

**Issue:** "Token exchange failed"
**Solution:** Check SHOPIFY_API_KEY and SHOPIFY_API_SECRET match Shopify Partners app

**Issue:** "Save failed"
**Solution:** Check POST endpoint is working, verify credentials format

**Issue:** OAuth redirect goes to wrong URL
**Solution:** Verify redirect URL in Shopify Partners matches NEXT_PUBLIC_API_URL

---

**Ready to Start!** Agent C has completed all dependencies. You can begin implementation immediately.

---

**Generated with Claude Code**
**Co-Authored-By:** Claude <noreply@anthropic.com>
