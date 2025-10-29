/**
 * Shopify Webhooks Route
 * Handles incoming Shopify webhooks
 */
import { NextRequest, NextResponse } from 'next/server';
import { ConnectorRegistry } from '@calibr/platform-connector';
import { prisma } from '@calibr/db';
import '@/lib/platforms/register';

export const runtime = 'nodejs';

/**
 * POST /api/platforms/shopify/webhooks
 * 
 * Handles incoming Shopify webhooks
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-shopify-hmac-sha256');
    const topic = request.headers.get('x-shopify-topic');
    const shop = request.headers.get('x-shopify-shop-domain');

    if (!signature || !topic || !shop) {
      return NextResponse.json(
        { error: 'Missing required webhook headers' },
        { status: 400 }
      );
    }

    // Get webhook secret from environment
    const webhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('SHOPIFY_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    // Verify webhook signature
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', webhookSecret);
    hmac.update(body, 'utf8');
    const hash = hmac.digest('base64');

    const isValid = crypto.timingSafeEqual(
      Buffer.from(hash, 'base64'),
      Buffer.from(signature, 'base64')
    );

    if (!isValid) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    // Parse webhook payload
    const payload = JSON.parse(body);

    // Find the integration for this shop
    const integration = await prisma.shopifyIntegration.findFirst({
      where: {
        shopDomain: shop,
        isActive: true,
      },
    });

    if (!integration) {
      console.error(`No active integration found for shop: ${shop}`);
      return NextResponse.json(
        { error: 'Integration not found' },
        { status: 404 }
      );
    }

    // Log webhook event
    await prisma.event.create({
      data: {
        projectId: integration.projectId,
        kind: `shopify.webhook.${topic}`,
        payload: {
          topic,
          shop,
          data: payload,
          receivedAt: new Date().toISOString(),
        },
      },
    });

    // Handle specific webhook topics
    switch (topic) {
      case 'products/update':
        await handleProductUpdate(integration.projectId, payload);
        break;
      case 'products/create':
        await handleProductCreate(integration.projectId, payload);
        break;
      case 'products/delete':
        await handleProductDelete(integration.projectId, payload);
        break;
      case 'inventory_levels/update':
        await handleInventoryUpdate(integration.projectId, payload);
        break;
      default:
        console.log(`Unhandled webhook topic: ${topic}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Shopify webhook error:', error);
    return NextResponse.json(
      {
        error: 'Webhook processing failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Handle product update webhook
 */
async function handleProductUpdate(projectId: string, payload: any) {
  try {
    // Log the product update
    await prisma.event.create({
      data: {
        projectId,
        kind: 'shopify.product.updated',
        payload: {
          productId: payload.id,
          title: payload.title,
          updatedAt: payload.updated_at,
        },
      },
    });

    // In a real implementation, you would:
    // 1. Sync the updated product data
    // 2. Update local database
    // 3. Trigger price recalculation if needed
    // 4. Notify other systems

    console.log(`Product updated: ${payload.title} (${payload.id})`);
  } catch (error) {
    console.error('Error handling product update:', error);
  }
}

/**
 * Handle product create webhook
 */
async function handleProductCreate(projectId: string, payload: any) {
  try {
    await prisma.event.create({
      data: {
        projectId,
        kind: 'shopify.product.created',
        payload: {
          productId: payload.id,
          title: payload.title,
          createdAt: payload.created_at,
        },
      },
    });

    console.log(`Product created: ${payload.title} (${payload.id})`);
  } catch (error) {
    console.error('Error handling product create:', error);
  }
}

/**
 * Handle product delete webhook
 */
async function handleProductDelete(projectId: string, payload: any) {
  try {
    await prisma.event.create({
      data: {
        projectId,
        kind: 'shopify.product.deleted',
        payload: {
          productId: payload.id,
          title: payload.title,
          deletedAt: new Date().toISOString(),
        },
      },
    });

    console.log(`Product deleted: ${payload.title} (${payload.id})`);
  } catch (error) {
    console.error('Error handling product delete:', error);
  }
}

/**
 * Handle inventory update webhook
 */
async function handleInventoryUpdate(projectId: string, payload: any) {
  try {
    await prisma.event.create({
      data: {
        projectId,
        kind: 'shopify.inventory.updated',
        payload: {
          inventoryItemId: payload.inventory_item_id,
          locationId: payload.location_id,
          available: payload.available,
          updatedAt: new Date().toISOString(),
        },
      },
    });

    console.log(`Inventory updated: ${payload.inventory_item_id}`);
  } catch (error) {
    console.error('Error handling inventory update:', error);
  }
}
