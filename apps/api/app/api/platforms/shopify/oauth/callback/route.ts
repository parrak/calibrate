/**
 * Shopify OAuth Callback Route
 * Handles the Shopify OAuth callback and exchanges code for access token
 */
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
    const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'https://api.calibr.lat';
    const saveResponse = await fetch(
      `${apiBase}/api/platforms/shopify`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectSlug: state,
          platformName: shop, // Required by POST endpoint
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
    const consoleUrl = process.env.NEXT_PUBLIC_CONSOLE_URL || 'https://console.calibr.lat';
    return NextResponse.redirect(
      `${consoleUrl}/p/${state}/integrations/shopify?success=true`
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

  // Shopify OAuth HMAC is hex-encoded
  // Compare using timing-safe comparison
  // Both hash and receivedHmac are already hex strings
  return crypto.timingSafeEqual(
    Buffer.from(hash, 'hex'),
    Buffer.from(receivedHmac, 'hex')
  );
}

/**
 * Redirect to console with error parameter
 */
function redirectToConsoleWithError(projectSlug: string | null, error: string): NextResponse {
  const consoleBase = process.env.NEXT_PUBLIC_CONSOLE_URL || 'https://console.calibr.lat';
  const consoleUrl = projectSlug
    ? `${consoleBase}/p/${projectSlug}/integrations/shopify?error=${error}`
    : `${consoleBase}/integrations?error=${error}`;

  return NextResponse.redirect(consoleUrl);
}

export const OPTIONS = withSecurity(async () => {
  return new NextResponse(null, { status: 204 });
});
