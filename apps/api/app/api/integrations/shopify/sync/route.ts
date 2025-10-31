/**
 * Shopify Sync Route
 * Handles manual sync operations and price updates
 */

import { NextRequest, NextResponse } from 'next/server';
import { ShopifyConnector } from '@calibr/shopify-connector';
import { prisma } from '@calibr/db';
import { withSecurity } from '@/lib/security-headers';

export const runtime = 'nodejs';

export const POST = withSecurity(async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, projectSlug, action, data } = body;

    if ((!projectId && !projectSlug) || !action) {
      return NextResponse.json(
        { error: 'project_id or project_slug, and action are required' },
        { status: 400 }
      );
    }

    let integration;
    
    // If projectSlug is provided, resolve it to projectId first
    if (projectSlug) {
      const project = await prisma().project.findUnique({
        where: { slug: projectSlug },
      });
      
      if (!project) {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        );
      }
      
      integration = await prisma().shopifyIntegration.findFirst({
        where: { 
          projectId: project.id,
          isActive: true,
        },
      });
    } else {
      // Find the Shopify integration by projectId
      integration = await prisma().shopifyIntegration.findFirst({
        where: { 
          projectId,
          isActive: true,
        },
      });
    }

    if (!integration) {
      return NextResponse.json(
        { error: 'No active Shopify integration found' },
        { status: 404 }
      );
    }

    // Initialize Shopify connector
    const connector = new ShopifyConnector({
      platform: 'shopify',
      apiKey: process.env.SHOPIFY_API_KEY!,
      apiSecret: process.env.SHOPIFY_API_SECRET!,
      scopes: process.env.SHOPIFY_SCOPES?.split(',') || ['read_products', 'write_products'],
      webhookSecret: process.env.SHOPIFY_WEBHOOK_SECRET || '',
      apiVersion: process.env.SHOPIFY_API_VERSION || '2024-10',
    });

    await connector.initialize({
      platform: 'shopify',
      shopDomain: integration.shopDomain,
      accessToken: integration.accessToken,
      scope: integration.scope,
    });

    // Update sync status to in progress (only for non-test actions)
    if (action !== 'test_connection') {
      await prisma().shopifyIntegration.update({
        where: { id: integration.id },
        data: {
          syncStatus: 'in_progress',
          syncError: null,
        },
      });
    }

    let result: any;

    switch (action) {
      case 'sync_products':
        result = await syncProducts(connector, integration);
        break;
      
      case 'update_prices':
        result = await updatePrices(connector, integration, data);
        break;
      
      case 'test_connection':
        result = await testConnection(connector, integration);
        break;
      
      case 'setup_webhooks':
        result = await setupWebhooks(connector, integration);
        break;
      
      default:
        throw new Error(`Unknown sync action: ${action}`);
    }

    // Update sync status to success (only for non-test actions)
    if (action !== 'test_connection') {
      await prisma().shopifyIntegration.update({
        where: { id: integration.id },
        data: {
          lastSyncAt: new Date(),
          syncStatus: 'success',
          syncError: null,
        },
      });
    } else {
      // For test_connection, optionally update lastSyncAt without changing status
      // This allows UI to show when connection was last tested
    }

    return NextResponse.json({
      success: true,
      action,
      result,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Shopify sync error:', error);

    // Update sync status with error
    const project = projectSlug 
      ? await prisma().project.findUnique({ where: { slug: projectSlug } })
      : null;
    
    const actualProjectId = project?.id || projectId;
    
    if (actualProjectId) {
      try {
        await prisma().shopifyIntegration.updateMany({
          where: { 
            projectId: actualProjectId,
            isActive: true,
          },
          data: {
            syncStatus: 'error',
            syncError: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      } catch (dbError) {
        console.error('Failed to update sync error status:', dbError);
      }
    }

    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Sync operation failed' 
      },
      { status: 500 }
    );
  }
});

export const OPTIONS = withSecurity(async () => {
  return new NextResponse(null, { status: 204 });
});

/**
 * Sync products from Shopify
 */
async function syncProducts(connector: ShopifyConnector, integration: any) {
  const products = await connector.products.listProducts({ limit: 100 });
  
  // Get project to get tenantId
  const project = await prisma().project.findUnique({
    where: { id: integration.projectId },
  });
  
  if (project) {
    // Log sync event
    await prisma().event.create({
      data: {
        tenantId: project.tenantId,
        projectId: integration.projectId,
        kind: 'shopify_products_sync',
        payload: {
          productsCount: products.products.length,
          syncedAt: new Date().toISOString(),
        },
      },
    });
  }

  return {
    productsCount: products.products.length,
    products: products.products.map(p => ({
      id: p.id,
      title: p.title,
      handle: p.handle,
      variantsCount: p.variants.length,
    })),
  };
}

/**
 * Update prices in Shopify
 */
async function updatePrices(connector: ShopifyConnector, integration: any, data: any) {
  if (!data.priceUpdates || !Array.isArray(data.priceUpdates)) {
    throw new Error('priceUpdates array is required');
  }

  const results = await connector.pricing.updateVariantPricesBulk({
    updates: data.priceUpdates,
    batchSize: data.batchSize || 10,
  });

  // Get project to get tenantId
  const project = await prisma().project.findUnique({
    where: { id: integration.projectId },
  });
  
  if (project) {
    // Log price update event
    await prisma().event.create({
      data: {
        tenantId: project.tenantId,
        projectId: integration.projectId,
        kind: 'shopify_price_update',
        payload: {
          updatesCount: data.priceUpdates.length,
          successCount: results.successCount,
          errorCount: results.errorCount,
          updatedAt: new Date().toISOString(),
        },
      },
    });
  }

  return results;
}

/**
 * Test connection to Shopify
 */
async function testConnection(connector: ShopifyConnector, integration: any) {
  const isConnected = await connector.testConnection();
  const status = await connector.getConnectionStatus();
  
  return {
    connected: isConnected,
    status,
  };
}

/**
 * Setup webhooks for Shopify integration
 */
async function setupWebhooks(connector: ShopifyConnector, integration: any) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE;
  const webhooks = await connector.webhooks.subscribeToCommonWebhooks(baseUrl);
  
  // Store webhook subscriptions in database
  for (const webhook of webhooks) {
    await prisma().shopifyWebhookSubscription.upsert({
      where: { webhookId: webhook.id },
      update: {
        topic: webhook.topic,
        address: webhook.address,
        isActive: true,
      },
      create: {
        integrationId: integration.id,
        topic: webhook.topic,
        address: webhook.address,
        webhookId: webhook.id,
        isActive: true,
      },
    });
  }

  return {
    webhooksCount: webhooks.length,
    webhooks: webhooks.map(w => ({
      id: w.id,
      topic: w.topic,
      address: w.address,
    })),
  };
}
