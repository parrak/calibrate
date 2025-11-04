/**
 * Shopify OAuth Installation Route
 * Handles the initial OAuth flow for installing Shopify app
 */

import { NextRequest, NextResponse } from 'next/server';
import { ShopifyAuth } from '@calibr/shopify-connector';
import { withSecurity } from '@/lib/security-headers';

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export const GET = withSecurity(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');
    const shopDomain = searchParams.get('shop');

    if (!projectId) {
      return NextResponse.json(
        { error: 'project_id is required' },
        { status: 400 }
      );
    }

    if (!shopDomain) {
      return NextResponse.json(
        { error: 'shop domain is required' },
        { status: 400 }
      );
    }

    // Validate shop domain format
    const auth = new ShopifyAuth({
      apiKey: process.env.SHOPIFY_API_KEY!,
      apiSecret: process.env.SHOPIFY_API_SECRET!,
      scopes: process.env.SHOPIFY_SCOPES?.split(',') || ['read_products', 'write_products'],
      webhookSecret: process.env.SHOPIFY_WEBHOOK_SECRET!,
    });

    if (!auth.validateShopDomain(shopDomain)) {
      return NextResponse.json(
        { error: 'Invalid shop domain format' },
        { status: 400 }
      );
    }

    // Generate OAuth URL
    const redirectUri = `${process.env.NEXT_PUBLIC_API_BASE}/api/integrations/shopify/oauth/callback`;
    const state = JSON.stringify({ projectId, shopDomain });

    const authUrl = auth.generateAuthUrl(shopDomain, redirectUri, state);

    return NextResponse.json({
      authUrl,
      shopDomain,
      projectId,
    });

  } catch (error) {
    console.error('Shopify OAuth installation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate OAuth URL' },
      { status: 500 }
    );
  }
});

/**
 * OPTIONS handler for CORS preflight
 */
export const OPTIONS = withSecurity(async (_req: NextRequest) => {
  return new NextResponse(null, { status: 204 });
});
