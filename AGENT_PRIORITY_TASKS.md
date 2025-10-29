# Agent Priority Tasks - Platform Integration Completion

**Date:** October 28, 2025
**Status:** Deployment crisis resolved, registration flows incomplete
**Priority:** HIGH - Complete platform connection workflows

---

## Current State Assessment

### What's Working ✅
- **Platform Registration**: Both Amazon and Shopify connectors registered in ConnectorRegistry
- **Database Schema**: AmazonIntegration and ShopifyIntegration tables exist with migrations
- **Platform Routes**: GET endpoints working for both platforms (returns integration status)
- **Console UI**: Integration dashboard displays both platforms
- **Connector Packages**: Both connector packages compile with 0 TypeScript errors

### What's Incomplete ❌
- **POST /api/platforms/[platform]**: Returns 501 "Not Implemented" - needs to save integration credentials
- **OAuth Flows**:
  - Shopify: Routes exist but untested, need end-to-end verification
  - Amazon: No OAuth routes yet, need SP-API LWA implementation
- **Integration Creation**: No way to actually save credentials to database
- **Connection Testing**: testConnection() works but results aren't persisted

---

## PRIORITY 1: Complete Platform Connection Flow

### Agent C - Implement Integration Creation (URGENT)

**Timeline:** 1-2 days
**Why Agent C:** Core platform infrastructure, affects both Amazon and Shopify

#### Task: Implement POST /api/platforms/[platform]

**Current Status:**
```typescript
// apps/api/app/api/platforms/[platform]/route.ts (line 208-214)
// TODO: Create platform-specific integration
return NextResponse.json({
  error: 'Platform integration not implemented',
  message: `Creating ${platform} integrations requires adding ${platform}Integration model to schema`,
}, { status: 501 });
```

**Required Implementation:**

1. **Replace the 501 response with actual integration creation:**

```typescript
// POST /api/platforms/[platform]
export const POST = withSecurity(async function POST(
  request: NextRequest,
  context: RouteParams
) {
  try {
    const db = prisma();
    const { platform } = await context.params;
    const body = await request.json();
    const { projectSlug, credentials } = body;

    // Validate inputs
    if (!projectSlug || !credentials) {
      return NextResponse.json(
        { error: 'Project slug and credentials are required' },
        { status: 400 }
      );
    }

    // Get project
    const project = await db.project.findUnique({
      where: { slug: projectSlug },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Test connection before saving
    const connector = await ConnectorRegistry.createConnector(
      platform as any,
      { platform: platform as any, name: platform, isActive: true },
      credentials
    );

    const isConnected = await connector.testConnection();
    if (!isConnected) {
      return NextResponse.json(
        { error: 'Failed to connect. Please check your credentials.' },
        { status: 400 }
      );
    }

    // Create platform-specific integration
    if (platform === 'shopify') {
      const integration = await db.shopifyIntegration.upsert({
        where: { shopDomain: credentials.shopDomain },
        create: {
          projectId: project.id,
          shopDomain: credentials.shopDomain,
          accessToken: credentials.accessToken,
          scope: credentials.scope || 'read_products,write_products',
          isActive: true,
        },
        update: {
          accessToken: credentials.accessToken,
          scope: credentials.scope || 'read_products,write_products',
          isActive: true,
        },
      });

      return NextResponse.json({
        success: true,
        integration: {
          id: integration.id,
          platform: 'shopify',
          platformName: integration.shopDomain,
          isActive: integration.isActive,
        },
      });
    } else if (platform === 'amazon') {
      const integration = await db.amazonIntegration.upsert({
        where: {
          projectId_sellerId: {
            projectId: project.id,
            sellerId: credentials.sellerId,
          },
        },
        create: {
          projectId: project.id,
          sellerId: credentials.sellerId,
          marketplaceId: credentials.marketplaceId || 'ATVPDKIKX0DER',
          region: credentials.region || 'us-east-1',
          refreshToken: credentials.refreshToken,
          accessToken: credentials.accessToken,
          tokenExpiresAt: credentials.tokenExpiresAt,
          isActive: true,
        },
        update: {
          refreshToken: credentials.refreshToken,
          accessToken: credentials.accessToken,
          tokenExpiresAt: credentials.tokenExpiresAt,
          isActive: true,
        },
      });

      return NextResponse.json({
        success: true,
        integration: {
          id: integration.id,
          platform: 'amazon',
          platformName: `Amazon ${integration.sellerId}`,
          isActive: integration.isActive,
        },
      });
    }

    return NextResponse.json(
      { error: `Platform '${platform}' not supported` },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error creating platform integration:', error);
    return NextResponse.json(
      {
        error: 'Failed to create integration',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});
```

2. **Similarly implement DELETE endpoint:**

```typescript
// DELETE /api/platforms/[platform]
// Change to deactivate instead of delete (preserving history)
await db.shopifyIntegration.update({
  where: { id: integrationId },
  data: { isActive: false }
});
```

**Files to Modify:**
- `apps/api/app/api/platforms/[platform]/route.ts`

**Testing:**
```bash
# Test Shopify connection
curl -X POST https://api.calibr.lat/api/platforms/shopify \
  -H "Content-Type: application/json" \
  -d '{
    "projectSlug": "demo",
    "credentials": {
      "shopDomain": "test-store.myshopify.com",
      "accessToken": "shpat_xxx"
    }
  }'

# Test Amazon connection
curl -X POST https://api.calibr.lat/api/platforms/amazon \
  -H "Content-Type: application/json" \
  -d '{
    "projectSlug": "demo",
    "credentials": {
      "sellerId": "A1EXAMPLE",
      "refreshToken": "Atzr|xxx",
      "marketplaceId": "ATVPDKIKX0DER"
    }
  }'
```

**Success Criteria:**
- ✅ POST creates integration in database
- ✅ Credentials saved (consider encryption for production)
- ✅ testConnection() called before saving
- ✅ GET endpoint returns saved integration
- ✅ DELETE deactivates integration
- ✅ Works for both Shopify and Amazon

---

## PRIORITY 2: Complete Shopify OAuth Flow

### Agent A - Shopify OAuth End-to-End (MEDIUM)

**Timeline:** 2-3 days
**Dependencies:** POST endpoint from Agent C

#### Task 1: Verify and Test Shopify OAuth Routes

**Existing Routes:**
- `/api/platforms/shopify/oauth/install` - Generate OAuth URL
- `/api/platforms/shopify/oauth/callback` - Handle OAuth callback

**Required Actions:**

1. **Review and fix oauth/install route:**

```typescript
// apps/api/app/api/platforms/shopify/oauth/install/route.ts
export const GET = withSecurity(async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectSlug = searchParams.get('project');
  const shop = searchParams.get('shop');

  if (!projectSlug || !shop) {
    return NextResponse.json(
      { error: 'Project and shop domain required' },
      { status: 400 }
    );
  }

  // Generate install URL
  const scopes = 'read_products,write_products,read_orders,write_orders';
  const redirectUri = `${process.env.NEXT_PUBLIC_API_URL}/api/platforms/shopify/oauth/callback`;

  const installUrl = `https://${shop}/admin/oauth/authorize?` +
    `client_id=${process.env.SHOPIFY_API_KEY}&` +
    `scope=${scopes}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `state=${projectSlug}`; // Use state to track project

  return NextResponse.json({ installUrl });
});
```

2. **Review and fix oauth/callback route:**

```typescript
// apps/api/app/api/platforms/shopify/oauth/callback/route.ts
export const GET = withSecurity(async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const shop = searchParams.get('shop');
  const state = searchParams.get('state'); // projectSlug
  const hmac = searchParams.get('hmac');

  // Verify HMAC
  // Exchange code for access token
  // Call POST /api/platforms/shopify with credentials
  // Redirect to console integration page

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/platforms/shopify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectSlug: state,
      credentials: {
        shopDomain: shop,
        accessToken: accessToken,
        scope: scopes,
      },
    }),
  });

  // Redirect to success page
  return NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_CONSOLE_URL}/p/${state}/integrations/shopify?success=true`
  );
});
```

3. **Update Console UI ShopifyAuthButton:**

```typescript
// apps/console/app/p/[slug]/integrations/shopify/components/ShopifyAuthButton.tsx
const handleInstall = async () => {
  const shop = prompt('Enter your Shopify store domain (e.g., mystore.myshopify.com)');
  if (!shop) return;

  // Call install endpoint
  const response = await fetch(
    `/api/platforms/shopify/oauth/install?project=${projectSlug}&shop=${shop}`
  );
  const { installUrl } = await response.json();

  // Redirect to Shopify OAuth
  window.location.href = installUrl;
};
```

**Files to Modify:**
- `apps/api/app/api/platforms/shopify/oauth/install/route.ts`
- `apps/api/app/api/platforms/shopify/oauth/callback/route.ts`
- `apps/console/app/p/[slug]/integrations/shopify/components/ShopifyAuthButton.tsx`

**Environment Variables Needed:**
```bash
# Add to Railway and .env.example
SHOPIFY_API_KEY=your_app_client_id
SHOPIFY_API_SECRET=your_app_client_secret
NEXT_PUBLIC_API_URL=https://api.calibr.lat
NEXT_PUBLIC_CONSOLE_URL=https://app.calibr.lat
```

**Testing Flow:**
1. Navigate to `/p/demo/integrations/shopify`
2. Click "Connect Shopify" button
3. Enter shop domain
4. Redirected to Shopify OAuth consent screen
5. Approve permissions
6. Redirected back to callback route
7. Credentials saved to database
8. Redirected to success page
9. Integration shown as connected

**Success Criteria:**
- ✅ OAuth flow completes end-to-end
- ✅ Access token saved to database
- ✅ User redirected back to console
- ✅ Integration status shows "Connected"
- ✅ Can disconnect and reconnect

---

## PRIORITY 3: Implement Amazon SP-API OAuth

### Agent B - Amazon SP-API LWA OAuth (MEDIUM)

**Timeline:** 3-4 days
**Dependencies:** POST endpoint from Agent C
**Complexity:** Higher - requires SP-API LWA (Login with Amazon)

#### Task: Create Amazon OAuth Routes

**Background:**
Amazon SP-API uses Login with Amazon (LWA) OAuth 2.0 flow. Unlike Shopify's simple OAuth, Amazon requires:
1. Application registered in Seller Central
2. LWA client ID and secret
3. OAuth authorization URL with specific parameters
4. Token exchange endpoint
5. Refresh token management

**Implementation:**

1. **Create install route:**

```typescript
// apps/api/app/api/platforms/amazon/oauth/install/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withSecurity } from '@/lib/security-headers';

export const runtime = 'nodejs';

export const GET = withSecurity(async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectSlug = searchParams.get('project');

  if (!projectSlug) {
    return NextResponse.json(
      { error: 'Project slug required' },
      { status: 400 }
    );
  }

  // Amazon LWA authorization URL
  const authUrl = new URL('https://sellercentral.amazon.com/apps/authorize/consent');
  authUrl.searchParams.set('application_id', process.env.AMAZON_SP_APP_ID!);
  authUrl.searchParams.set('state', projectSlug);
  authUrl.searchParams.set('version', 'beta');

  return NextResponse.json({
    installUrl: authUrl.toString(),
    instructions: [
      'You will be redirected to Amazon Seller Central',
      'Log in with your seller account',
      'Grant the requested permissions',
      'You will be redirected back to Calibr',
    ],
  });
});

export const OPTIONS = withSecurity(async () => {
  return new NextResponse(null, { status: 204 });
});
```

2. **Create callback route:**

```typescript
// apps/api/app/api/platforms/amazon/oauth/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withSecurity } from '@/lib/security-headers';

export const runtime = 'nodejs';

export const GET = withSecurity(async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const spapi_oauth_code = searchParams.get('spapi_oauth_code');
  const selling_partner_id = searchParams.get('selling_partner_id');
  const state = searchParams.get('state'); // projectSlug

  if (!spapi_oauth_code || !selling_partner_id || !state) {
    return NextResponse.json(
      { error: 'Missing required OAuth parameters' },
      { status: 400 }
    );
  }

  try {
    // Exchange authorization code for refresh token
    const tokenResponse = await fetch('https://api.amazon.com/auth/o2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: spapi_oauth_code,
        client_id: process.env.AMAZON_LWA_CLIENT_ID!,
        client_secret: process.env.AMAZON_LWA_CLIENT_SECRET!,
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokens.refresh_token) {
      throw new Error('No refresh token received from Amazon');
    }

    // Save integration
    const saveResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/platforms/amazon`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectSlug: state,
          credentials: {
            sellerId: selling_partner_id,
            refreshToken: tokens.refresh_token,
            accessToken: tokens.access_token,
            tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
            marketplaceId: 'ATVPDKIKX0DER', // US by default
            region: 'us-east-1',
          },
        }),
      }
    );

    if (!saveResponse.ok) {
      throw new Error('Failed to save Amazon integration');
    }

    // Redirect to console
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_CONSOLE_URL}/p/${state}/integrations/amazon?success=true`
    );
  } catch (error) {
    console.error('Amazon OAuth error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_CONSOLE_URL}/p/${state}/integrations/amazon?error=oauth_failed`
    );
  }
});

export const OPTIONS = withSecurity(async () => {
  return new NextResponse(null, { status: 204 });
});
```

3. **Create Console UI component:**

```typescript
// apps/console/app/p/[slug]/integrations/amazon/components/AmazonAuthButton.tsx
'use client';

import { useState } from 'react';

export function AmazonAuthButton({ projectSlug }: { projectSlug: string }) {
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/platforms/amazon/oauth/install?project=${projectSlug}`
      );
      const { installUrl, instructions } = await response.json();

      // Show instructions modal (optional)
      const proceed = confirm(
        'You will be redirected to Amazon Seller Central to authorize this app.\n\n' +
        instructions.join('\n')
      );

      if (proceed) {
        window.location.href = installUrl;
      }
    } catch (error) {
      alert('Failed to initiate Amazon connection');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleConnect}
      disabled={loading}
      className="btn btn-primary"
    >
      {loading ? 'Connecting...' : 'Connect Amazon'}
    </button>
  );
}
```

4. **Update Amazon integration page:**

```typescript
// apps/console/app/p/[slug]/integrations/amazon/page.tsx
import { AmazonAuthButton } from './components/AmazonAuthButton';

export default async function AmazonIntegrationPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { success?: string; error?: string };
}) {
  const { slug } = await params;

  // Fetch integration status
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/platforms/amazon?project=${slug}`
  );
  const { integration, isConnected } = await response.json();

  if (searchParams.success) {
    // Show success message
  }

  if (searchParams.error) {
    // Show error message
  }

  return (
    <div>
      <h1>Amazon SP-API Integration</h1>

      {isConnected ? (
        <div>
          <p>Connected to Amazon Seller ID: {integration.metadata.sellerId}</p>
          <button>Disconnect</button>
        </div>
      ) : (
        <div>
          <p>Connect your Amazon Seller Central account to sync products and manage pricing.</p>
          <AmazonAuthButton projectSlug={slug} />
        </div>
      )}
    </div>
  );
}
```

**Files to Create:**
- `apps/api/app/api/platforms/amazon/oauth/install/route.ts`
- `apps/api/app/api/platforms/amazon/oauth/callback/route.ts`
- `apps/console/app/p/[slug]/integrations/amazon/components/AmazonAuthButton.tsx`

**Files to Modify:**
- `apps/console/app/p/[slug]/integrations/amazon/page.tsx`

**Environment Variables Needed:**
```bash
# Add to Railway and .env.example
AMAZON_SP_APP_ID=amzn1.sp.solution.xxx
AMAZON_LWA_CLIENT_ID=amzn1.application-oa2-client.xxx
AMAZON_LWA_CLIENT_SECRET=amzn1.oa2-cs.xxx
```

**SP-API Application Setup:**
1. Register app in Amazon Seller Central Developer Console
2. Get LWA credentials (client ID, client secret)
3. Configure OAuth redirect URI: `https://api.calibr.lat/api/platforms/amazon/oauth/callback`
4. Request necessary permissions (pricing, products, orders)

**Success Criteria:**
- ✅ OAuth flow redirects to Amazon Seller Central
- ✅ User grants permissions
- ✅ Callback receives authorization code
- ✅ Code exchanged for refresh token
- ✅ Integration saved to database
- ✅ User redirected back to console
- ✅ Integration status shows "Connected"

---

## PRIORITY 4: Credential Encryption (SECURITY)

### Agent C - Encrypt Sensitive Credentials (HIGH SECURITY)

**Timeline:** 1-2 days
**Why:** Currently storing tokens in plaintext

#### Task: Implement Credential Encryption

**Current Issue:**
```typescript
// packages/db/client.ts (line 2-3)
// TODO: Re-enable encryption middleware after implementing encryptCredentials/decryptCredentials in @calibr/security
// import { encryptionMiddleware } from './src/middleware/encryption'
```

**Implementation:**

1. **Create encryption utility:**

```typescript
// packages/security/src/encryption.ts
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'base64'); // 32-byte key
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

export function encryptCredentials(plaintext: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:ciphertext
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decryptCredentials(ciphertext: string): string {
  const [ivHex, authTagHex, encrypted] = ciphertext.split(':');

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
```

2. **Create Prisma middleware:**

```typescript
// packages/db/src/middleware/encryption.ts
import { Prisma } from '@prisma/client';
import { encryptCredentials, decryptCredentials } from '@calibr/security';

const ENCRYPTED_FIELDS = {
  ShopifyIntegration: ['accessToken'],
  AmazonIntegration: ['refreshToken', 'accessToken'],
};

export const encryptionMiddleware: Prisma.Middleware = async (params, next) => {
  // Encrypt on create/update
  if (
    (params.action === 'create' || params.action === 'update') &&
    params.model &&
    ENCRYPTED_FIELDS[params.model]
  ) {
    const fields = ENCRYPTED_FIELDS[params.model];
    const data = params.args.data || {};

    for (const field of fields) {
      if (data[field] && typeof data[field] === 'string') {
        data[field] = encryptCredentials(data[field]);
      }
    }
  }

  const result = await next(params);

  // Decrypt on read
  if (
    (params.action === 'findUnique' ||
     params.action === 'findFirst' ||
     params.action === 'findMany') &&
    params.model &&
    ENCRYPTED_FIELDS[params.model]
  ) {
    const decrypt = (record: any) => {
      const fields = ENCRYPTED_FIELDS[params.model!];
      for (const field of fields) {
        if (record[field] && typeof record[field] === 'string') {
          try {
            record[field] = decryptCredentials(record[field]);
          } catch {
            // Already decrypted or invalid
          }
        }
      }
      return record;
    };

    if (Array.isArray(result)) {
      return result.map(decrypt);
    } else if (result) {
      return decrypt(result);
    }
  }

  return result;
};
```

3. **Enable middleware:**

```typescript
// packages/db/client.ts
import { encryptionMiddleware } from './src/middleware/encryption';

export function prisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

    // Apply encryption middleware
    globalForPrisma.prisma.$use(encryptionMiddleware);
  }
  return globalForPrisma.prisma;
}
```

4. **Generate encryption key:**

```bash
# Generate 32-byte key
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Add to Railway environment variables
ENCRYPTION_KEY=<generated-base64-key>
```

**Files to Create:**
- `packages/security/src/encryption.ts`

**Files to Modify:**
- `packages/db/src/middleware/encryption.ts` (uncomment imports)
- `packages/db/client.ts` (enable middleware)

**Migration for Existing Data:**
```typescript
// scripts/encrypt-existing-credentials.ts
// One-time script to encrypt existing plaintext credentials
```

**Success Criteria:**
- ✅ All access tokens encrypted at rest
- ✅ Tokens automatically decrypted on read
- ✅ Encryption transparent to application code
- ✅ Existing integrations still work after migration

---

## Implementation Order

### Week 1
**Day 1-2:** Agent C - Implement POST/DELETE platform endpoints
**Day 3-4:** Agent A - Complete Shopify OAuth flow
**Day 5:** Agent C - Test and verify both OAuth flows work end-to-end

### Week 2
**Day 1-3:** Agent B - Implement Amazon SP-API OAuth
**Day 4-5:** Agent C - Implement credential encryption
**Day 6-7:** All Agents - Integration testing, bug fixes, documentation

---

## Testing Checklist

### Manual Testing Flow

**Shopify:**
- [ ] Navigate to `/p/demo/integrations/shopify`
- [ ] Click "Connect Shopify"
- [ ] Enter shop domain
- [ ] Complete OAuth on Shopify
- [ ] Verify redirect back to console
- [ ] Confirm integration shows as "Connected"
- [ ] Verify can sync products
- [ ] Verify can disconnect

**Amazon:**
- [ ] Navigate to `/p/demo/integrations/amazon`
- [ ] Click "Connect Amazon"
- [ ] Complete OAuth on Amazon Seller Central
- [ ] Verify redirect back to console
- [ ] Confirm integration shows as "Connected"
- [ ] Verify can access SP-API endpoints
- [ ] Verify can disconnect

### Automated Testing

```typescript
// tests/integration/platform-connection.test.ts
describe('Platform Connection Flow', () => {
  it('creates Shopify integration', async () => {
    const response = await POST('/api/platforms/shopify', {
      projectSlug: 'test',
      credentials: { shopDomain: 'test.myshopify.com', accessToken: 'xxx' }
    });
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it('retrieves saved integration', async () => {
    const response = await GET('/api/platforms/shopify?project=test');
    expect(response.body.isConnected).toBe(true);
  });

  it('disconnects integration', async () => {
    const response = await DELETE('/api/platforms/shopify?project=test');
    expect(response.status).toBe(200);
  });
});
```

---

## Success Metrics

### User Experience
- ✅ User can connect Shopify in < 2 minutes
- ✅ User can connect Amazon in < 3 minutes
- ✅ Clear error messages if connection fails
- ✅ Integration status visible on dashboard
- ✅ Can disconnect and reconnect

### Technical
- ✅ All credentials encrypted at rest
- ✅ OAuth flows follow best practices
- ✅ Tokens automatically refreshed
- ✅ 95%+ test coverage on new code
- ✅ No TypeScript errors
- ✅ All routes return proper CORS headers

### Documentation
- ✅ User guide for connecting platforms
- ✅ Developer docs for OAuth flows
- ✅ Environment variable documentation
- ✅ Troubleshooting guide

---

## Risks & Mitigations

### Risk: OAuth Credentials Exposure
**Mitigation:**
- Never log credentials
- Use environment variables only
- Implement encryption immediately
- Audit all API responses for leaks

### Risk: Token Refresh Failures
**Mitigation:**
- Implement automatic refresh before expiry
- Handle refresh failures gracefully
- Show clear re-authentication UI
- Log refresh attempts for monitoring

### Risk: HMAC/Signature Validation Bypass
**Mitigation:**
- Validate all OAuth callbacks
- Verify HMAC signatures (Shopify)
- Use state parameter for CSRF protection
- Test with invalid signatures

---

## Questions for Product Team

1. **Credential Storage:** Should we encrypt existing credentials or only new ones?
2. **Multi-Account:** Should users be able to connect multiple Shopify stores to one project?
3. **Token Refresh:** Should we refresh Amazon tokens proactively or on-demand?
4. **Disconnect Behavior:** Hard delete or soft delete (isActive=false)?
5. **Error Handling:** Should OAuth failures send email notifications?

---

**Next Action:** Agent C should start with PRIORITY 1 (POST endpoint) immediately, as it unblocks both Agent A and Agent B.

---

**Generated with Claude Code**
**Co-Authored-By:** Claude <noreply@anthropic.com>
