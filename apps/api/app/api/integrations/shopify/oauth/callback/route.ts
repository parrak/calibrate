/**
 * Shopify OAuth Callback Route
 * Handles the OAuth callback and stores the access token
 */

import { NextRequest, NextResponse } from 'next/server';
import { ShopifyAuth } from '@calibr/shopify-connector';
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
import { prisma } from '@calibr/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const shop = searchParams.get('shop');

    if (!code || !state || !shop) {
      return NextResponse.json(
        { error: 'Missing required OAuth parameters' },
        { status: 400 }
      );
    }

    // Parse state to get project info
    let projectId: string;
    let shopDomain: string;
    
    try {
      const stateData = JSON.parse(state);
      projectId = stateData.projectId;
      shopDomain = stateData.shopDomain;
    } catch {
      return NextResponse.json(
        { error: 'Invalid state parameter' },
        { status: 400 }
      );
    }

    // Initialize Shopify auth
    const auth = new ShopifyAuth({
      apiKey: process.env.SHOPIFY_API_KEY!,
      apiSecret: process.env.SHOPIFY_API_SECRET!,
      scopes: process.env.SHOPIFY_SCOPES?.split(',') || ['read_products', 'write_products'],
      webhookSecret: process.env.SHOPIFY_WEBHOOK_SECRET!,
    });

    // Exchange code for access token
    const redirectUri = `${process.env.NEXT_PUBLIC_API_BASE}/api/integrations/shopify/oauth/callback`;
    const oauthResponse = await auth.exchangeCodeForToken(shopDomain, code, redirectUri);

    // Create ShopifyAuth object
    const shopifyAuth = auth.createAuthFromResponse(shopDomain, oauthResponse);

    // Store integration in database
    const integration = await prisma().shopifyIntegration.upsert({
      where: { shopDomain },
      update: {
        accessToken: shopifyAuth.accessToken,
        scope: shopifyAuth.scope,
        isActive: true,
        lastSyncAt: null,
        syncStatus: null,
        syncError: null,
      },
      create: {
        projectId,
        shopDomain,
        accessToken: shopifyAuth.accessToken,
        scope: shopifyAuth.scope,
        isActive: true,
      },
    });

    // Redirect to success page
    const successUrl = `${process.env.NEXT_PUBLIC_CONSOLE_URL}/p/${projectId}/integrations/shopify?success=true`;
    
    return NextResponse.redirect(successUrl);

  } catch (error) {
    console.error('Shopify OAuth callback error:', error);
    
    // Redirect to error page
    const errorUrl = `${process.env.NEXT_PUBLIC_CONSOLE_URL}/p/integrations/shopify?error=oauth_failed`;
    return NextResponse.redirect(errorUrl);
  }
}
