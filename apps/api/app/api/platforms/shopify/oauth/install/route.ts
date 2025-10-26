/**
 * Shopify OAuth Install Route
 * Initiates the Shopify OAuth installation flow
 */
import { NextRequest, NextResponse } from 'next/server';
import { ConnectorRegistry } from '@calibr/platform-connector';
import '@/lib/platforms/register';

export const runtime = 'nodejs';

/**
 * POST /api/platforms/shopify/oauth/install
 * 
 * Initiates Shopify OAuth installation flow
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, shopDomain, redirectUri } = body;

    if (!projectId || !shopDomain || !redirectUri) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, shopDomain, redirectUri' },
        { status: 400 }
      );
    }

    // Validate shop domain format
    const shopifyDomainRegex = /^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/;
    if (!shopifyDomainRegex.test(shopDomain)) {
      return NextResponse.json(
        { error: 'Invalid shop domain format' },
        { status: 400 }
      );
    }

    // Get Shopify connector configuration
    const config = {
      platform: 'shopify' as const,
      apiKey: process.env.SHOPIFY_API_KEY!,
      apiSecret: process.env.SHOPIFY_API_SECRET!,
      scopes: (process.env.SHOPIFY_SCOPES || 'read_products,write_products').split(','),
      webhookSecret: process.env.SHOPIFY_WEBHOOK_SECRET!,
      apiVersion: process.env.SHOPIFY_API_VERSION || '2024-10',
    };

    // Create connector instance
    const connector = await ConnectorRegistry.createConnector('shopify', config);

    // Generate authorization URL
    const authUrl = connector.auth.getAuthorizationUrl({
      clientId: config.apiKey,
      redirectUri,
      scopes: config.scopes,
      state: `${projectId}:${shopDomain}`, // Include project and shop info in state
    });

    return NextResponse.json({
      success: true,
      authUrl,
      shopDomain,
      projectId,
    });
  } catch (error) {
    console.error('Shopify OAuth install error:', error);
    return NextResponse.json(
      {
        error: 'Failed to initiate Shopify OAuth',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
