/**
 * Shopify Webhooks Route
 * Handles incoming webhooks from Shopify
 */

import { NextRequest, NextResponse } from 'next/server';
import { ShopifyWebhooks } from '@calibr/shopify-connector';
import { prisma } from '@calibr/db';
import { createId } from '@paralleldrive/cuid2';

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-shopify-hmac-sha256');
    const shopDomain = request.headers.get('x-shopify-shop-domain');
    const topic = request.headers.get('x-shopify-topic');

    if (!signature || !shopDomain || !topic) {
      return NextResponse.json(
        { error: 'Missing required webhook headers' },
        { status: 400 }
      );
    }

    // Get webhook payload
    const payload = await request.text();

    // Initialize webhook handler
    const webhooks = new ShopifyWebhooks(
      null as any, // We don't need the client for verification
      process.env.SHOPIFY_WEBHOOK_SECRET!
    );

    // Verify webhook signature
    const verification = webhooks.verifyWebhookSignature(payload, signature);
    
    if (!verification.isValid) {
      console.error('Invalid webhook signature:', verification.error);
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    // Find the integration
    const integration = await prisma().shopifyIntegration.findUnique({
      where: { shopDomain },
      include: { Project: true },
    });

    if (!integration) {
      console.error('No integration found for shop domain:', shopDomain);
      return NextResponse.json(
        { error: 'Integration not found' },
        { status: 404 }
      );
    }

    // Process the webhook based on topic
    await processWebhookByTopic(topic, verification.payload, integration);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Process webhook based on topic
 */
async function processWebhookByTopic(
  topic: string,
  payload: any,
  integration: any
): Promise<void> {
  switch (topic) {
    case 'products/update':
    case 'products/create':
      await handleProductUpdate(payload, integration);
      break;
    
    case 'products/delete':
      await handleProductDelete(payload, integration);
      break;
    
    case 'inventory_levels/update':
      await handleInventoryUpdate(payload, integration);
      break;
    
    case 'orders/create':
    case 'orders/updated':
    case 'orders/paid':
    case 'orders/cancelled':
      await handleOrderUpdate(payload, integration);
      break;
    
    default:
      console.log(`Unhandled webhook topic: ${topic}`);
  }
}

/**
 * Handle product updates
 */
async function handleProductUpdate(payload: any, integration: any): Promise<void> {
  try {
    // Log the product update
    await prisma().event.create({
      data: {
        id: createId(),
        tenantId: integration.project.tenantId,
        projectId: integration.projectId,
        kind: 'shopify_product_update',
        payload: {
          productId: payload.id,
          title: payload.title,
          handle: payload.handle,
          variants: payload.variants,
          updatedAt: payload.updated_at,
        },
      },
    });

    console.log(`Product updated: ${payload.title} (${payload.id})`);
  } catch (error) {
    console.error('Error handling product update:', error);
  }
}

/**
 * Handle product deletion
 */
async function handleProductDelete(payload: any, integration: any): Promise<void> {
  try {
    // Log the product deletion
    await prisma().event.create({
      data: {
        id: createId(),
        tenantId: integration.project.tenantId,
        projectId: integration.projectId,
        kind: 'shopify_product_delete',
        payload: {
          productId: payload.id,
          title: payload.title,
          deletedAt: new Date().toISOString(),
        },
      },
    });

    console.log(`Product deleted: ${payload.title} (${payload.id})`);
  } catch (error) {
    console.error('Error handling product deletion:', error);
  }
}

/**
 * Handle inventory updates
 */
async function handleInventoryUpdate(payload: any, integration: any): Promise<void> {
  try {
    // Log the inventory update
    await prisma().event.create({
      data: {
        id: createId(),
        tenantId: integration.project.tenantId,
        projectId: integration.projectId,
        kind: 'shopify_inventory_update',
        payload: {
          inventoryItemId: payload.inventory_item_id,
          locationId: payload.location_id,
          available: payload.available,
          updatedAt: payload.updated_at,
        },
      },
    });

    console.log(`Inventory updated: ${payload.inventory_item_id}`);
  } catch (error) {
    console.error('Error handling inventory update:', error);
  }
}

/**
 * Handle order updates
 */
async function handleOrderUpdate(payload: any, integration: any): Promise<void> {
  try {
    // Log the order update
    await prisma().event.create({
      data: {
        id: createId(),
        tenantId: integration.project.tenantId,
        projectId: integration.projectId,
        kind: 'shopify_order_update',
        payload: {
          orderId: payload.id,
          orderNumber: payload.order_number,
          totalPrice: payload.total_price,
          currency: payload.currency,
          status: payload.financial_status,
          updatedAt: payload.updated_at,
        },
      },
    });

    console.log(`Order updated: ${payload.order_number} (${payload.id})`);
  } catch (error) {
    console.error('Error handling order update:', error);
  }
}
