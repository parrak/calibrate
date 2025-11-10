/**
 * Shopify OAuth Install Route
 * Initiates the Shopify OAuth installation flow
 */
import { NextRequest, NextResponse } from 'next/server';
import { withSecurity } from '@/lib/security-headers';
import { encodeOAuthState, type ShopifyOAuthState } from '@/lib/shopify-oauth-state';

function resolvePublicApiBase(req: NextRequest): string {
  const explicitBase =
    process.env.SHOPIFY_OAUTH_CALLBACK_BASE ||
    process.env.API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE ||
    null;

  if (explicitBase) {
    return explicitBase.replace(/\/$/, '');
  }

  const forwardedProto = req.headers.get('x-forwarded-proto');
  const forwardedHost = req.headers.get('x-forwarded-host');

  if (forwardedProto && forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  const url = new URL(req.url);
  return url.origin;
}

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
  const host = searchParams.get('host');

  if (!projectSlug || !shop) {
    return NextResponse.json(
      { error: 'Project slug and shop domain are required' },
      { status: 400 }
    );
  }

  // Validate shop domain format
  // Allow both "mystore.myshopify.com" and "mystore" formats
  // If no .myshopify.com suffix, we'll add it
  let normalizedShop = shop.trim().toLowerCase();
  if (!normalizedShop.includes('.')) {
    normalizedShop = `${normalizedShop}.myshopify.com`;
  } else if (!normalizedShop.endsWith('.myshopify.com')) {
    return NextResponse.json(
      { error: 'Invalid shop domain. Must be in format: mystore.myshopify.com or mystore' },
      { status: 400 }
    );
  }

  // Use normalized shop domain
  const finalShop = normalizedShop;

  // Shopify OAuth scopes
  const scopes = [
    'read_products',
    'write_products',
    'read_orders',
    'read_inventory',
    'write_inventory',
  ].join(',');

  const apiKey = process.env.SHOPIFY_API_KEY;
  const apiBase = resolvePublicApiBase(req);
  const redirectUri = `${apiBase}/api/platforms/shopify/oauth/callback`;

  if (!apiKey) {
    console.error('SHOPIFY_API_KEY not configured');
    return NextResponse.json(
      { error: 'Shopify integration not configured' },
      { status: 500 }
    );
  }

  // Build Shopify OAuth URL
  const authUrl = new URL(`https://${finalShop}/admin/oauth/authorize`);
  authUrl.searchParams.set('client_id', apiKey);
  authUrl.searchParams.set('scope', scopes);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  const state: ShopifyOAuthState = {
    projectSlug,
    host: host || null,
  };
  const encodedState = encodeOAuthState(state);

  authUrl.searchParams.set('state', encodedState); // Use state to track project and embedded host
  authUrl.searchParams.set('grant_options[]', 'per-user');

  return NextResponse.json({
    installUrl: authUrl.toString(),
    shop: finalShop,
    scopes: scopes.split(','),
    state: encodedState,
    host: host || null,
  });
});

export const OPTIONS = withSecurity(async () => {
  return new NextResponse(null, { status: 204 });
});
