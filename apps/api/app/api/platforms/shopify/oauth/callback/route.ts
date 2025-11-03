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

  // Log callback parameters for debugging (without sensitive values)
  console.log('Shopify OAuth callback received:', {
    shop,
    state,
    hasCode: !!code,
    hasHmac: !!hmac,
    hasTimestamp: !!timestamp,
    apiSecretLength: apiSecret.length,
  });

  if (!verifyShopifyHMAC(searchParams, hmac, apiSecret, req.url)) {
    console.error('Invalid HMAC signature', {
      shop,
      state,
      apiSecretConfigured: !!apiSecret,
    });
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
 * 
 * Shopify OAuth HMAC validation:
 * 1. Get all query parameters except 'hmac'
 * 2. Sort them alphabetically by key
 * 3. Build query string: key=value&key2=value2 (using decoded values)
 * 4. Calculate HMAC-SHA256 hex digest
 * 5. Compare with received HMAC using timing-safe comparison
 */
function verifyShopifyHMAC(
  searchParams: URLSearchParams,
  receivedHmac: string,
  apiSecret: string,
  _rawUrl: string // Kept for potential future debugging
): boolean {
  try {
    // Get all parameters except 'hmac'
    const params: Array<[string, string]> = [];
    for (const [key, value] of searchParams.entries()) {
      if (key !== 'hmac') {
        params.push([key, value]);
      }
    }

    // Sort parameters alphabetically by key (Shopify requirement)
    params.sort(([a], [b]) => a.localeCompare(b));

    // Build query string: key=value&key2=value2
    // Use decoded values from URLSearchParams (Shopify calculates HMAC on decoded values)
    const queryString = params
      .map(([key, value]) => `${key}=${value}`)
      .join('&');

    // Calculate HMAC-SHA256 hex digest
    const hash = crypto
      .createHmac('sha256', apiSecret)
      .update(queryString)
      .digest('hex');

    // Debug logging (remove in production or make conditional)
    if (process.env.NODE_ENV !== 'production') {
      console.log('HMAC Verification Debug:', {
        queryString,
        calculatedHash: hash.substring(0, 16) + '...',
        receivedHmac: receivedHmac.substring(0, 16) + '...',
        paramsCount: params.length,
      });
    }

    // Compare using timing-safe comparison to prevent timing attacks
    // Both hash and receivedHmac are hex strings
    const isValid = crypto.timingSafeEqual(
      Buffer.from(hash, 'hex'),
      Buffer.from(receivedHmac, 'hex')
    );

    if (!isValid) {
      console.error('HMAC mismatch:', {
        queryString,
        calculatedHash: hash,
        receivedHmac,
        params: params.map(([k, v]) => `${k}=${v.substring(0, 10)}...`),
      });
    }

    return isValid;
  } catch (error) {
    console.error('HMAC verification error:', error);
    return false;
  }
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
