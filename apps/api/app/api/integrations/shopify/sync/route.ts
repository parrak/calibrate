/**
 * Shopify Sync Route
 * Handles manual sync operations and price updates
 */

import { NextRequest, NextResponse } from 'next/server';
import { ShopifyConnector, type ShopifyProduct } from '@calibr/shopify-connector';
import { prisma } from '@calibr/db';
import type { Prisma } from '@calibr/db';
import { withSecurity } from '@/lib/security-headers';
import { createId } from '@paralleldrive/cuid2';
import {
  initializeShopifyConnector,
  getProductsClient,
  getWebhooksClient,
  getPricingClient,
} from '@/lib/shopify-connector';

type ShopifyIntegration = Prisma.ShopifyIntegrationGetPayload<Record<string, never>>;

export const runtime = 'nodejs';

export const POST = withSecurity(async function POST(request: NextRequest) {
  let projectId: string | undefined;
  let projectSlug: string | undefined;
  let action: string | undefined;
  let data: unknown;

  try {
    const body = (await request.json()) as {
      projectId?: string;
      projectSlug?: string;
      action?: string;
      data?: unknown;
    };

    projectId = body.projectId;
    projectSlug = body.projectSlug;
    action = body.action;
    data = body.data;

    if ((!projectId && !projectSlug) || !action) {
      return NextResponse.json(
        { error: 'project_id or project_slug, and action are required' },
        { status: 400 }
      );
    }

    let resolvedProjectId = projectId ?? null;

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

      resolvedProjectId = project.id;
    }

    if (!resolvedProjectId) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const integration = await prisma().shopifyIntegration.findFirst({
      where: {
        projectId: resolvedProjectId,
        isActive: true,
      },
    });

    if (!integration) {
      return NextResponse.json(
        { error: 'No active Shopify integration found' },
        { status: 404 }
      );
    }

    const connector = await initializeShopifyConnector(integration);

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

    let result: unknown;

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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    const project = projectSlug
      ? await prisma().project.findUnique({ where: { slug: projectSlug } })
      : null;

    const actualProjectId = project?.id ?? projectId;

    if (actualProjectId) {
      try {
        await prisma().shopifyIntegration.updateMany({
          where: {
            projectId: actualProjectId,
            isActive: true,
          },
          data: {
            syncStatus: 'error',
            syncError: errorMessage,
          },
        });
      } catch (dbError) {
        console.error('Failed to update sync error status:', dbError);
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage || 'Sync operation failed',
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
async function syncProducts(connector: ShopifyConnector, integration: ShopifyIntegration) {
  const productsClient = getProductsClient(connector);
  const products = await productsClient.listProducts({ limit: 100 });

  // Get project to get tenantId
  const project = await prisma().project.findUnique({
    where: { id: integration.projectId },
  });

  if (project) {
    // Log sync event
    await prisma().event.create({
      data: {
        id: createId(),
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
    products: products.products.map((p: ShopifyProduct) => ({
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
async function updatePrices(connector: ShopifyConnector, integration: ShopifyIntegration, data: unknown) {
  if (!data || typeof data !== 'object' || !('priceUpdates' in data) || !Array.isArray((data as { priceUpdates: unknown }).priceUpdates)) {
    throw new Error('priceUpdates array is required');
  }

  const pricingClient = getPricingClient(connector);
  const dataWithPriceUpdates = data as { priceUpdates: unknown[]; batchSize?: number };
  const priceUpdates = Array.isArray(dataWithPriceUpdates.priceUpdates)
    ? dataWithPriceUpdates.priceUpdates as Array<{ variantId: string; price: number }>
    : [];
  const results = await pricingClient.updateVariantPricesBulk({
    updates: priceUpdates,
    batchSize: dataWithPriceUpdates.batchSize || 10,
  });

  // Get project to get tenantId
  const project = await prisma().project.findUnique({
    where: { id: integration.projectId },
  });

  if (project) {
    // Log price update event
    await prisma().event.create({
      data: {
        id: createId(),
        tenantId: project.tenantId,
        projectId: integration.projectId,
        kind: 'shopify_price_update',
        payload: {
          updatesCount: priceUpdates.length,
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
async function testConnection(connector: ShopifyConnector, _integration: ShopifyIntegration) {
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
async function setupWebhooks(connector: ShopifyConnector, integration: ShopifyIntegration) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE;
  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_API_BASE is not configured');
  }

  const webhooksClient = getWebhooksClient(connector);
  const webhooks = await webhooksClient.subscribeToCommonWebhooks(baseUrl);

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
        id: createId(),
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
