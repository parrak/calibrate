/**
 * Shopify Products Sync Route
 * Handles syncing products from Shopify to Calibrate
 */

import { NextRequest, NextResponse } from 'next/server';
import { ShopifyConnector } from '@calibr/shopify-connector';
import { prisma } from '@calibr/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');

    if (!projectId) {
      return NextResponse.json(
        { error: 'project_id is required' },
        { status: 400 }
      );
    }

    // Find the Shopify integration
    const integration = await prisma.shopifyIntegration.findFirst({
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

    // Initialize with shop-specific credentials
    await connector.initialize(integration.shopDomain, integration.accessToken);

    // Test connection
    const isConnected = await connector.testConnection();
    if (!isConnected) {
      return NextResponse.json(
        { error: 'Failed to connect to Shopify' },
        { status: 500 }
      );
    }

    // Get products from Shopify
    const productsResponse = await connector.products.listProducts({
      limit,
      page,
    });

    // Process and normalize products
    const normalizedProducts = productsResponse.products.map(product => ({
      id: product.id,
      title: product.title,
      handle: product.handle,
      vendor: product.vendor,
      productType: product.productType,
      tags: product.tags,
      variants: product.variants.map(variant => ({
        id: variant.id,
        title: variant.title,
        sku: variant.sku,
        price: variant.price,
        compareAtPrice: variant.compareAtPrice,
        inventoryQuantity: variant.inventoryQuantity,
      })),
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    }));

    // Update sync status
    await prisma.shopifyIntegration.update({
      where: { id: integration.id },
      data: {
        lastSyncAt: new Date(),
        syncStatus: 'success',
        syncError: null,
      },
    });

    return NextResponse.json({
      products: normalizedProducts,
      pagination: productsResponse.page_info,
      integration: {
        shopDomain: integration.shopDomain,
        lastSyncAt: new Date(),
        syncStatus: 'success',
      },
    });

  } catch (error) {
    console.error('Shopify products sync error:', error);

    // Update sync status with error
    if (projectId) {
      try {
        await prisma.shopifyIntegration.updateMany({
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
      { error: 'Failed to sync products from Shopify' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, productId } = body;

    if (!projectId || !productId) {
      return NextResponse.json(
        { error: 'project_id and product_id are required' },
        { status: 400 }
      );
    }

    // Find the Shopify integration
    const integration = await prisma.shopifyIntegration.findFirst({
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

    // Get specific product
    const product = await connector.products.getProduct(productId);

    return NextResponse.json({
      product: {
        id: product.id,
        title: product.title,
        handle: product.handle,
        vendor: product.vendor,
        productType: product.productType,
        tags: product.tags,
        variants: product.variants.map(variant => ({
          id: variant.id,
          title: variant.title,
          sku: variant.sku,
          price: variant.price,
          compareAtPrice: variant.compareAtPrice,
          inventoryQuantity: variant.inventoryQuantity,
        })),
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      },
    });

  } catch (error) {
    console.error('Shopify product fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product from Shopify' },
      { status: 500 }
    );
  }
}
