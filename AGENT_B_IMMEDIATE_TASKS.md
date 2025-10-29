# Agent B - Immediate Tasks: Implement Amazon SP-API OAuth

**Date:** October 28, 2025
**Status:** 🟢 UNBLOCKED - Agent C completed POST endpoint
**Priority:** HIGH - Can now implement Amazon OAuth
**Estimated Time:** 6-8 hours
**Complexity:** Higher than Shopify (requires SP-API setup)

---

## 🎯 Objective

Implement Amazon SP-API OAuth using Login with Amazon (LWA) so users can connect their Amazon Seller Central accounts to Calibr.

---

## ✅ What Agent C Completed (Dependencies Resolved)

**POST /api/platforms/amazon** endpoint is now fully functional:
- Accepts `{ projectSlug, credentials }` in request body
- Validates credentials: requires `sellerId` and `refreshToken`
- Optional: `accessToken`, `tokenExpiresAt`, `marketplaceId`, `region`
- Tests connection via `ConnectorRegistry.testConnection()`
- Saves to database using `upsert` (allows reconnecting)
- Returns integration details on success

**Example successful response:**
```json
{
  "success": true,
  "integration": {
    "id": "cuid456",
    "platform": "amazon",
    "platformName": "Amazon A1EXAMPLE",
    "isActive": true,
    "installedAt": "2025-10-28T12:00:00.000Z",
    "metadata": {
      "sellerId": "A1EXAMPLE",
      "marketplaceId": "ATVPDKIKX0DER",
      "region": "us-east-1"
    }
  }
}
```

---

## 📋 Tasks to Complete

### Task 0: Register SP-API Application (1-2 hours setup)

**PREREQUISITE:** Must complete before coding

**Steps:**

1. **Log in to Amazon Seller Central:**
   - Go to [Seller Central](https://sellercentral.amazon.com/)
   - Navigate to **Apps & Services** → **Develop Apps**

2. **Create New App:**
   - Click "Add new app client"
   - **App Name:** Calibr Pricing Management
   - **OAuth Redirect URIs:**
     - Production: `https://api.calibr.lat/api/platforms/amazon/oauth/callback`
     - Development: `http://localhost:3001/api/platforms/amazon/oauth/callback`

3. **Configure App:**
   - **App Type:** Public app
   - **Roles:** Select the following API sections:
     - ✓ Product Catalog
     - ✓ Pricing
     - ✓ Product Fees
     - ✓ Reports
   - **Data Access:** Limited access (as needed)

4. **Get Credentials:**
   - Copy **LWA Client ID** (looks like: `amzn1.application-oa2-client.xxx`)
   - Copy **LWA Client Secret** (looks like: `amzn1.oa2-cs.xxx`)
   - Copy **Application ID** (looks like: `amzn1.sp.solution.xxx`)

5. **Save to Environment Variables:**
   ```bash
   AMAZON_SP_APP_ID=amzn1.sp.solution.xxx
   AMAZON_LWA_CLIENT_ID=amzn1.application-oa2-client.xxx
   AMAZON_LWA_CLIENT_SECRET=amzn1.oa2-cs.xxx
   ```

**Documentation:**
- [SP-API Developer Guide](https://developer-docs.amazon.com/sp-api/docs/registering-your-application)
- [LWA Authorization](https://developer-docs.amazon.com/sp-api/docs/authorizing-selling-partner-api-applications)

---

### Task 1: Create OAuth Install Route (1 hour)

**File:** `apps/api/app/api/platforms/amazon/oauth/install/route.ts` (NEW)

**Implementation:**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { withSecurity } from '@/lib/security-headers';

export const runtime = 'nodejs';

/**
 * GET /api/platforms/amazon/oauth/install
 * Generates Amazon Seller Central OAuth authorization URL
 *
 * Query params:
 * - project: project slug (required)
 */
export const GET = withSecurity(async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectSlug = searchParams.get('project');

  if (!projectSlug) {
    return NextResponse.json(
      { error: 'Project slug is required' },
      { status: 400 }
    );
  }

  const appId = process.env.AMAZON_SP_APP_ID;

  if (!appId) {
    console.error('AMAZON_SP_APP_ID not configured');
    return NextResponse.json(
      { error: 'Amazon SP-API integration not configured' },
      { status: 500 }
    );
  }

  // Amazon LWA authorization URL
  // Docs: https://developer-docs.amazon.com/sp-api/docs/website-authorization-workflow
  const authUrl = new URL('https://sellercentral.amazon.com/apps/authorize/consent');
  authUrl.searchParams.set('application_id', appId);
  authUrl.searchParams.set('state', projectSlug); // Track project
  authUrl.searchParams.set('version', 'beta'); // Required parameter

  return NextResponse.json({
    installUrl: authUrl.toString(),
    instructions: [
      'You will be redirected to Amazon Seller Central',
      'Log in with your seller account credentials',
      'Review and grant the requested permissions',
      'You will be redirected back to Calibr',
    ],
    note: 'Make sure you are logged in to the correct Amazon Seller account',
  });
});

export const OPTIONS = withSecurity(async () => {
  return new NextResponse(null, { status: 204 });
});
```

**Testing:**
```bash
curl "http://localhost:3001/api/platforms/amazon/oauth/install?project=demo"
```

**Expected Response:**
```json
{
  "installUrl": "https://sellercentral.amazon.com/apps/authorize/consent?application_id=amzn1.sp.solution.xxx&state=demo&version=beta",
  "instructions": [...],
  "note": "Make sure you are logged in to the correct Amazon Seller account"
}
```

---

### Task 2: Create OAuth Callback Route (3-4 hours)

**File:** `apps/api/app/api/platforms/amazon/oauth/callback/route.ts` (NEW)

**Implementation:**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { withSecurity } from '@/lib/security-headers';

export const runtime = 'nodejs';

/**
 * GET /api/platforms/amazon/oauth/callback
 * Handles Amazon SP-API OAuth callback
 *
 * Query params from Amazon:
 * - spapi_oauth_code: OAuth authorization code
 * - selling_partner_id: Amazon Seller ID
 * - state: Project slug (from install step)
 * - mws_auth_token: (legacy MWS, ignore)
 */
export const GET = withSecurity(async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const spapiOauthCode = searchParams.get('spapi_oauth_code');
  const sellingPartnerId = searchParams.get('selling_partner_id');
  const state = searchParams.get('state'); // projectSlug

  console.log('[Amazon OAuth] Callback received', {
    hasCode: !!spapiOauthCode,
    sellerId: sellingPartnerId,
    project: state,
  });

  // Validate required params
  if (!spapiOauthCode || !sellingPartnerId || !state) {
    console.error('[Amazon OAuth] Missing required parameters', {
      code: !!spapiOauthCode,
      sellerId: sellingPartnerId,
      state,
    });
    return redirectToConsoleWithError(state, 'missing_parameters');
  }

  const lwaClientId = process.env.AMAZON_LWA_CLIENT_ID;
  const lwaClientSecret = process.env.AMAZON_LWA_CLIENT_SECRET;

  if (!lwaClientId || !lwaClientSecret) {
    console.error('[Amazon OAuth] LWA credentials not configured');
    return redirectToConsoleWithError(state, 'configuration_error');
  }

  try {
    // Exchange authorization code for refresh token
    // Docs: https://developer-docs.amazon.com/sp-api/docs/lwa-authorization-code-workflow
    console.log('[Amazon OAuth] Exchanging code for refresh token...');

    const tokenResponse = await fetch('https://api.amazon.com/auth/o2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: spapiOauthCode,
        client_id: lwaClientId,
        client_secret: lwaClientSecret,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('[Amazon OAuth] Token exchange failed:', errorText);
      return redirectToConsoleWithError(state, 'token_exchange_failed');
    }

    const tokens = await tokenResponse.json();
    const { refresh_token, access_token, expires_in } = tokens;

    if (!refresh_token) {
      console.error('[Amazon OAuth] No refresh token received');
      return redirectToConsoleWithError(state, 'no_refresh_token');
    }

    console.log('[Amazon OAuth] Tokens received', {
      hasRefreshToken: !!refresh_token,
      hasAccessToken: !!access_token,
      expiresIn: expires_in,
    });

    // Calculate token expiry
    const tokenExpiresAt = access_token
      ? new Date(Date.now() + expires_in * 1000)
      : undefined;

    // Save integration using Agent C's POST endpoint
    console.log('[Amazon OAuth] Saving integration...');

    const saveResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/platforms/amazon`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectSlug: state,
          credentials: {
            sellerId: sellingPartnerId,
            refreshToken: refresh_token,
            accessToken: access_token,
            tokenExpiresAt: tokenExpiresAt?.toISOString(),
            marketplaceId: 'ATVPDKIKX0DER', // US marketplace (default)
            region: 'us-east-1', // US region (default)
          },
        }),
      }
    );

    if (!saveResponse.ok) {
      const error = await saveResponse.json();
      console.error('[Amazon OAuth] Failed to save integration:', error);
      return redirectToConsoleWithError(state, 'save_failed');
    }

    const integration = await saveResponse.json();
    console.log('[Amazon OAuth] Integration saved successfully:', integration.integration.id);

    // Redirect to console success page
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_CONSOLE_URL}/p/${state}/integrations/amazon?success=true`
    );
  } catch (error) {
    console.error('[Amazon OAuth] Unexpected error:', error);
    return redirectToConsoleWithError(state, 'unexpected_error');
  }
});

/**
 * Redirect to console with error parameter
 */
function redirectToConsoleWithError(projectSlug: string | null, error: string): NextResponse {
  const consoleUrl = projectSlug
    ? `${process.env.NEXT_PUBLIC_CONSOLE_URL}/p/${projectSlug}/integrations/amazon?error=${error}`
    : `${process.env.NEXT_PUBLIC_CONSOLE_URL}/integrations?error=${error}`;

  return NextResponse.redirect(consoleUrl);
}

export const OPTIONS = withSecurity(async () => {
  return new NextResponse(null, { status: 204 });
});
```

**Key Differences from Shopify:**
- No HMAC verification (Amazon uses different security model)
- Authorization code → refresh token (not access token directly)
- Refresh token is long-lived, access token expires
- Must specify marketplace and region

---

### Task 3: Create Console UI Component (2 hours)

**File:** `apps/console/app/p/[slug]/integrations/amazon/components/AmazonAuthButton.tsx` (NEW)

**Implementation:**

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@calibr/ui/button';
import { AlertCircle, ExternalLink } from 'lucide-react';

interface AmazonAuthButtonProps {
  projectSlug: string;
  onSuccess?: () => void;
}

export function AmazonAuthButton({ projectSlug, onSuccess }: AmazonAuthButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);

  const handleConnect = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get OAuth URL from install endpoint
      const response = await fetch(
        `/api/platforms/amazon/oauth/install?project=${projectSlug}`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to start OAuth flow');
      }

      const { installUrl, instructions } = await response.json();

      // Show instructions modal before redirect
      const proceed = confirm(
        `Amazon Authorization\n\n` +
        instructions.join('\n') +
        `\n\nClick OK to continue to Amazon Seller Central.`
      );

      if (proceed) {
        // Redirect to Amazon OAuth
        window.location.href = installUrl;
      } else {
        setLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {!showInstructions ? (
        <div className="space-y-3">
          <Button onClick={handleConnect} disabled={loading} size="lg">
            {loading ? 'Connecting to Amazon...' : 'Connect Amazon Seller Central'}
          </Button>

          <button
            onClick={() => setShowInstructions(true)}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            What information will Amazon share?
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
          <h3 className="font-medium text-blue-900">Amazon Permissions</h3>
          <p className="text-sm text-blue-800">
            Calibr will request access to:
          </p>
          <ul className="text-sm text-blue-800 list-disc list-inside space-y-1">
            <li>Product catalog information</li>
            <li>Pricing data</li>
            <li>Product fees</li>
            <li>Reports</li>
          </ul>
          <p className="text-xs text-blue-700">
            You can revoke access at any time from Amazon Seller Central under
            Apps & Services → Manage Your Apps.
          </p>
          <button
            onClick={() => setShowInstructions(false)}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Close
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
```

---

### Task 4: Update Amazon Integration Page (1 hour)

**File:** `apps/console/app/p/[slug]/integrations/amazon/page.tsx`

**Updates:**

```typescript
import { AmazonAuthButton } from './components/AmazonAuthButton';

export default async function AmazonIntegrationPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { success?: string; error?: string };
}) {
  const { slug } = await params;

  // Fetch current integration status
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/platforms/amazon?project=${slug}`,
    { cache: 'no-store' }
  );

  const { integration, isConnected } = await response.json();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">Amazon SP-API Integration</h1>
      <p className="text-gray-600 mb-8">
        Connect your Amazon Seller Central account to sync products and manage pricing across marketplaces.
      </p>

      {/* Success message */}
      {searchParams.success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-green-800 font-medium">
            ✓ Successfully connected to Amazon!
          </p>
          <p className="text-green-700 text-sm mt-1">
            Seller ID: {integration?.metadata?.sellerId}
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
          <div className="border rounded-lg p-6 bg-white">
            <h2 className="text-xl font-semibold mb-4">Connection Details</h2>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm text-gray-500">Seller ID</dt>
                <dd className="font-medium">{integration.metadata.sellerId}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Marketplace</dt>
                <dd className="font-medium">
                  {getMarketplaceName(integration.metadata.marketplaceId)}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Region</dt>
                <dd className="font-medium">{integration.metadata.region}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Status</dt>
                <dd>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Connected
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Connected Since</dt>
                <dd className="text-sm">
                  {new Date(integration.installedAt).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </div>

          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold mb-4">Actions</h2>
            <button
              className="text-red-600 hover:text-red-700"
              onClick={async () => {
                if (confirm('Are you sure you want to disconnect your Amazon account?')) {
                  await fetch(`/api/platforms/amazon?project=${slug}`, {
                    method: 'DELETE',
                  });
                  window.location.reload();
                }
              }}
            >
              Disconnect Amazon
            </button>
          </div>
        </div>
      ) : (
        <div className="border rounded-lg p-6 bg-white">
          <h2 className="text-xl font-semibold mb-4">Connect Your Account</h2>
          <p className="text-gray-600 mb-6">
            Authorize Calibr to access your Amazon Seller Central account.
            You'll be redirected to Amazon to grant permissions.
          </p>
          <AmazonAuthButton projectSlug={slug} />

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-sm mb-2">Prerequisites:</h3>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>Active Amazon Seller Central account</li>
              <li>Professional selling plan recommended</li>
              <li>Admin access to your seller account</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function getErrorMessage(error: string): string {
  const messages: Record<string, string> = {
    missing_parameters: 'OAuth callback missing required parameters',
    configuration_error: 'Amazon SP-API not properly configured',
    token_exchange_failed: 'Failed to exchange authorization code',
    no_refresh_token: 'No refresh token received from Amazon',
    save_failed: 'Failed to save integration',
    unexpected_error: 'An unexpected error occurred',
  };
  return messages[error] || error;
}

function getMarketplaceName(marketplaceId: string): string {
  const marketplaces: Record<string, string> = {
    'ATVPDKIKX0DER': 'United States (amazon.com)',
    'A2EUQ1WTGCTBG2': 'Canada (amazon.ca)',
    'A1AM78C64UM0Y8': 'Mexico (amazon.com.mx)',
    'A2Q3Y263D00KWC': 'Brazil (amazon.com.br)',
    'A1RKKUPIHCS9HS': 'Spain (amazon.es)',
    'A1F83G8C2ARO7P': 'United Kingdom (amazon.co.uk)',
    'A13V1IB3VIYZZH': 'France (amazon.fr)',
    'A1PA6795UKMFR9': 'Germany (amazon.de)',
    'APJ6JRA9NG5V4': 'Italy (amazon.it)',
    'A1805IZSGTT6HS': 'Netherlands (amazon.nl)',
    'A33AVAJ2PDY3EV': 'Turkey (amazon.com.tr)',
    'A21TJRUUN4KGV': 'India (amazon.in)',
    'A19VAU5U5O7RUS': 'Singapore (amazon.sg)',
    'A39IBJ37TRP1C6': 'Australia (amazon.com.au)',
    'A1VC38T7YXB528': 'Japan (amazon.co.jp)',
  };
  return marketplaces[marketplaceId] || marketplaceId;
}
```

---

### Task 5: Environment Variables

Add to Railway and `.env.example`:

```bash
# Amazon SP-API Credentials
AMAZON_SP_APP_ID=amzn1.sp.solution.xxx
AMAZON_LWA_CLIENT_ID=amzn1.application-oa2-client.xxx
AMAZON_LWA_CLIENT_SECRET=amzn1.oa2-cs.xxx

# URLs (verify these exist)
NEXT_PUBLIC_API_URL=https://api.calibr.lat
NEXT_PUBLIC_CONSOLE_URL=https://app.calibr.lat
```

---

## 🧪 Testing Checklist

### Manual Testing

1. **Test OAuth Flow:**
   ```bash
   # Step 1: Navigate to integration page
   https://app.calibr.lat/p/demo/integrations/amazon

   # Step 2: Click "Connect Amazon Seller Central"
   # Step 3: Verify redirect to Amazon Seller Central
   # Step 4: Log in to Amazon Seller account
   # Step 5: Review permissions and click "Authorize"
   # Step 6: Verify redirect back to console with success message
   # Step 7: Verify integration shows "Connected" with seller ID
   ```

2. **Verify Database:**
   ```sql
   SELECT * FROM "AmazonIntegration" WHERE "projectId" = 'project_id';
   -- Should show: sellerId, refreshToken (encrypted), isActive=true
   ```

3. **Test Disconnect:**
   ```bash
   # Click "Disconnect Amazon"
   # Verify isActive set to false
   # Verify UI shows "Not Connected"
   ```

4. **Test Reconnect:**
   ```bash
   # Click "Connect Amazon" again
   # Verify it updates existing record (upsert)
   # Verify isActive set back to true
   ```

---

## ✅ Success Criteria

- [ ] User can click "Connect Amazon" in console
- [ ] User is redirected to Amazon Seller Central login
- [ ] User approves permissions on Amazon consent screen
- [ ] User is redirected back to console with success message
- [ ] Integration status shows "Connected" with seller ID
- [ ] Integration record exists in database with encrypted refresh token
- [ ] User can disconnect integration (soft delete)
- [ ] User can reconnect same account (updates existing record)
- [ ] Marketplace and region displayed correctly
- [ ] No sensitive data logged

---

## 🔗 Dependencies

**Completed by Agent C:**
- ✅ POST /api/platforms/amazon endpoint
- ✅ DELETE /api/platforms/amazon endpoint
- ✅ AmazonIntegration database table with migration
- ✅ Prisma client includes amazonIntegration model

**Required Setup:**
- Amazon SP-API application registered
- LWA credentials obtained
- Environment variables configured

---

## 📚 Resources

**Amazon Documentation:**
- [SP-API Developer Guide](https://developer-docs.amazon.com/sp-api/)
- [LWA Authorization](https://developer-docs.amazon.com/sp-api/docs/authorizing-selling-partner-api-applications)
- [Website Authorization Workflow](https://developer-docs.amazon.com/sp-api/docs/website-authorization-workflow)

**Calibr Documentation:**
- [AGENT_PRIORITY_TASKS.md](AGENT_PRIORITY_TASKS.md)
- [AGENT_C_WEEK2_HANDOFF.md](AGENT_C_WEEK2_HANDOFF.md)

---

**Ready to Start!** Complete Task 0 (SP-API registration) first, then proceed with implementation.

---

**Generated with Claude Code**
**Co-Authored-By:** Claude <noreply@anthropic.com>
