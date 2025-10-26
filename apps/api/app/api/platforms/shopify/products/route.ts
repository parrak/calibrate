/**
 * Shopify Products Route
 * Handles product synchronization and management
 */
import { NextRequest, NextResponse } from 'next/server';
import { ConnectorRegistry } from '@calibr/platform-connector';
import { prisma } from '@calibr/db';
import '@/lib/platforms/register';

export const runtime = 'nodejs';

/**
 * GET /api/platforms/shopify/products
 * 
 * List products from Shopify
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');

    if (!projectId) {
      return NextResponse.json(
        { error: 'Missing projectId parameter' },
        { status: 400 }
      );
    }

    // Find the Shopify integration
    const integration = await prisma.platformIntegration.findFirst({
      where: {
        projectId,
        platform: 'shopify',
        isActive: true,
      },
    });

    if (!integration) {
      return NextResponse.json(
        { error: 'No active Shopify integration found' },
        { status: 404 }
      );
    }

    // Get connector configuration
    const config = {
      platform: 'shopify' as const,
      apiKey: process.env.SHOPIFY_API_KEY!,
      apiSecret: process.env.SHOPIFY_API_SECRET!,
      scopes: (process.env.SHOPIFY_SCOPES || 'read_products,write_products').split(','),
      webhookSecret: process.env.SHOPIFY_WEBHOOK_SECRET!,
      apiVersion: process.env.SHOPIFY_API_VERSION || '2024-10',
    };

    // Create connector with stored credentials
    const credentials = {
      platform: 'shopify' as const,
      shopDomain: integration.externalId!,
      accessToken: integration.metadata.accessToken,
      scope: integration.metadata.scope,
    };

    const connector = await ConnectorRegistry.createConnector('shopify', config);
    await connector.initialize(credentials);

    // List products
    const result = await connector.productOperations.list({
      limit,
      page,
    });

    return NextResponse.json({
      success: true,
      products: result.data,
      pagination: result.pagination,
      integration: {
        id: integration.id,
        platformName: integration.platformName,
        status: integration.status,
      },
    });
  } catch (error) {
    console.error('Shopify products list error:', error);
    return NextResponse.json(
      {
        error: 'Failed to list Shopify products',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/platforms/shopify/products/sync
 * 
 * Sync specific products from Shopify
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, productIds } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: 'Missing projectId' },
        { status: 400 }
      );
    }

    // Find the Shopify integration
    const integration = await prisma.platformIntegration.findFirst({
      where: {
        projectId,
        platform: 'shopify',
        isActive: true,
      },
    });

    if (!integration) {
      return NextResponse.json(
        { error: 'No active Shopify integration found' },
        { status: 404 }
      );
    }

    // Get connector configuration
    const config = {
      platform: 'shopify' as const,
      apiKey: process.env.SHOPIFY_API_KEY!,
      apiSecret: process.env.SHOPIFY_API_SECRET!,
      scopes: (process.env.SHOPIFY_SCOPES || 'read_products,write_products').split(','),
      webhookSecret: process.env.SHOPIFY_WEBHOOK_SECRET!,
      apiVersion: process.env.SHOPIFY_API_VERSION || '2024-10',
    };

    // Create connector with stored credentials
    const credentials = {
      platform: 'shopify' as const,
      shopDomain: integration.externalId!,
      accessToken: integration.metadata.accessToken,
      scope: integration.metadata.scope,
    };

    const connector = await ConnectorRegistry.createConnector('shopify', config);
    await connector.initialize(credentials);

    const results = [];

    if (productIds && productIds.length > 0) {
      // Sync specific products
      for (const productId of productIds) {
        try {
          const result = await connector.productOperations.sync(`cal-${productId}`, productId);
          results.push(result);
        } catch (error) {
          results.push({
            productId: `cal-${productId}`,
            externalId: productId,
            platform: 'shopify',
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            syncedAt: new Date(),
          });
        }
      }
    } else {
      // Sync all products
      const syncResults = await connector.productOperations.syncAll({
        limit: 100, // Limit to prevent timeout
      });
      results.push(...syncResults);
    }

    // Update integration sync status
    await prisma.platformIntegration.update({
      where: { id: integration.id },
      data: {
        lastSyncAt: new Date(),
        syncStatus: 'SUCCESS',
        syncError: null,
      },
    });

    return NextResponse.json({
      success: true,
      results,
      summary: {
        total: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
      },
    });
  } catch (error) {
    console.error('Shopify products sync error:', error);
    return NextResponse.json(
      {
        error: 'Failed to sync Shopify products',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
