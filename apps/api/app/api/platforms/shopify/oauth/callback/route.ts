/**
 * Shopify OAuth Callback Route
 * Handles the Shopify OAuth callback and exchanges code for access token
 */
import { NextRequest, NextResponse } from 'next/server';
import { ConnectorRegistry } from '@calibr/platform-connector';
import { prisma } from '@calibr/db';
import '@/lib/platforms/register';

export const runtime = 'nodejs';

/**
 * GET /api/platforms/shopify/oauth/callback
 * 
 * Handles Shopify OAuth callback
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const shop = searchParams.get('shop');
    const error = searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      return NextResponse.json(
        { error: 'OAuth authorization failed', details: error },
        { status: 400 }
      );
    }

    if (!code || !state || !shop) {
      return NextResponse.json(
        { error: 'Missing required OAuth parameters' },
        { status: 400 }
      );
    }

    // Parse state to get project info
    const [projectId, shopDomain] = state.split(':');
    if (!projectId || !shopDomain) {
      return NextResponse.json(
        { error: 'Invalid state parameter' },
        { status: 400 }
      );
    }

    // Verify shop domain matches
    if (shop !== shopDomain) {
      return NextResponse.json(
        { error: 'Shop domain mismatch' },
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

    // Exchange code for access token
    const tokenResponse = await connector.auth.handleOAuthCallback(code, {
      clientId: config.apiKey,
      clientSecret: config.apiSecret,
      redirectUri: `${process.env.API_BASE_URL || 'http://localhost:3000'}/api/platforms/shopify/oauth/callback`,
    });

    // Store integration in database
    const integration = await prisma.platformIntegration.upsert({
      where: {
        projectId_platform: {
          projectId,
          platform: 'shopify',
        },
      },
      update: {
        platformName: `${shopDomain} Store`,
        externalId: shopDomain,
        status: 'CONNECTED',
        isActive: true,
        connectedAt: new Date(),
        metadata: {
          accessToken: tokenResponse.accessToken,
          scope: tokenResponse.scope,
          expiresIn: tokenResponse.expiresIn,
          shopDomain,
        },
      },
      create: {
        projectId,
        platform: 'shopify',
        platformName: `${shopDomain} Store`,
        externalId: shopDomain,
        status: 'CONNECTED',
        isActive: true,
        connectedAt: new Date(),
        metadata: {
          accessToken: tokenResponse.accessToken,
          scope: tokenResponse.scope,
          expiresIn: tokenResponse.expiresIn,
          shopDomain,
        },
      },
    });

    // Test the connection
    const credentials = {
      platform: 'shopify' as const,
      shopDomain,
      accessToken: tokenResponse.accessToken,
      scope: tokenResponse.scope,
    };

    await connector.initialize(credentials);
    const connectionStatus = await connector.getConnectionStatus();

    return NextResponse.json({
      success: true,
      integration: {
        id: integration.id,
        platform: integration.platform,
        platformName: integration.platformName,
        status: integration.status,
        connectedAt: integration.connectedAt,
      },
      connectionStatus,
      message: 'Shopify integration connected successfully',
    });
  } catch (error) {
    console.error('Shopify OAuth callback error:', error);
    return NextResponse.json(
      {
        error: 'Failed to complete Shopify OAuth',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
