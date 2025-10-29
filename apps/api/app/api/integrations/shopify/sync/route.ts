/**
 * Shopify Sync Route
 * Handles manual sync operations and price updates
 */

import { NextRequest, NextResponse } from 'next/server';
import { ShopifyConnector } from '@calibr/shopify-connector';
import { prisma } from '@calibr/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, action, data } = body;

    if (!projectId || !action) {
      return NextResponse.json(
        { error: 'project_id and action are required' },
        { status: 400 }
      );
    }

    // Find the Shopify integration
    const integration = await prisma().shopifyIntegration.findFirst({
      where: { 
        projectId,
        isActive: true,
      },
    });

    if (!integration) {
      return NextResponse.json(
        { error: 'No active Shopify integration found' },
        { status: 404 }
      );
    }

    // Initialize Shopify connector
    const connector = new ShopifyConnector({
      apiKey: process.env.SHOPIFY_API_KEY!,
      apiSecret: process.env.SHOPIFY_API_SECRET!,
      scopes: process.env.SHOPIFY_SCOPES?.split(',') || ['read_products', 'write_products'],
      webhookSecret: process.env.SHOPIFY_WEBHOOK_SECRET!,
    });

    await connector.initialize(integration.shopDomain, integration.accessToken);

    // Update sync status to in progress
    await prisma().shopifyIntegration.update({
      where: { id: integration.id },
      data: {
        syncStatus: 'in_progress',
        syncError: null,
      },
    });

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

    // Update sync status to success
    await prisma.shopifyIntegration.update({
      where: { id: integration.id },
      data: {
        lastSyncAt: new Date(),
        syncStatus: 'success',
        syncError: null,
      },
    });

    return NextResponse.json({
      success: true,
      action,
      result,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Shopify sync error:', error);

    // Update sync status with error
    if (projectId) {
      try {
        await prisma().shopifyIntegration.updateMany({
          where: { 
            projectId,
            isActive: true,
          },
          data: {
            syncStatus: 'error',
            syncError: error.message || 'Unknown error',
          },
        });
      } catch (dbError) {
        console.error('Failed to update sync error status:', dbError);
      }
    }

    return NextResponse.json(
      { error: error.message || 'Sync operation failed' },
      { status: 500 }
    );
  }
}

/**
 * Sync products from Shopify
 */
async function syncProducts(connector: ShopifyConnector, integration: any) {
  const products = await connector.products.listProducts({ limit: 100 });
  
  // Log sync event
  await prisma().event.create({
    data: {
      tenantId: integration.project.tenantId,
      projectId: integration.projectId,
      kind: 'shopify_products_sync',
      payload: {
        productsCount: products.products.length,
        syncedAt: new Date().toISOString(),
      },
    },
  });

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

  // Log price update event
  await prisma().event.create({
    data: {
      tenantId: integration.project.tenantId,
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
