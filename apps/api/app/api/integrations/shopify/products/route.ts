/**
 * Shopify Products Sync Route
 * Handles syncing products from Shopify to Calibrate
 */

import { NextRequest, NextResponse } from 'next/server';
import type { ShopifyProduct, ShopifyVariant } from '@calibr/shopify-connector';
import { prisma } from '@calibr/db';
import { initializeShopifyConnector, getProductsClient } from '@/lib/shopify-connector';

const DEFAULT_LIMIT = 50;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('project_id');
  const limitParam = Number.parseInt(searchParams.get('limit') ?? `${DEFAULT_LIMIT}`, 10);
  const cursor = searchParams.get('cursor') ?? undefined;

  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 250) : DEFAULT_LIMIT;

  if (!projectId) {
    return NextResponse.json(
      { error: 'project_id is required' },
      { status: 400 }
    );
  }

  try {
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

    const connector = await initializeShopifyConnector(integration);
    const productsClient = getProductsClient(connector);

    const productsResponse = await productsClient.listProducts({
      limit,
      ...(cursor ? { since_id: cursor } : {}),
    });

    const normalizedProducts = productsResponse.products.map((product: ShopifyProduct) => ({
      id: product.id,
      title: product.title,
      handle: product.handle,
      vendor: product.vendor,
      productType: product.productType,
      tags: product.tags,
      variants: product.variants.map((variant: ShopifyVariant) => ({
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

    await prisma().shopifyIntegration.update({
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    try {
      await prisma().shopifyIntegration.updateMany({
        where: {
          projectId,
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

    return NextResponse.json(
      { error: 'Failed to sync products from Shopify', message: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { projectId?: string; productId?: string };
    const { projectId, productId } = body;

    if (!projectId || !productId) {
      return NextResponse.json(
        { error: 'project_id and product_id are required' },
        { status: 400 }
      );
    }

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

    const connector = await initializeShopifyConnector(integration);
    const productsClient = getProductsClient(connector);

    const product = await productsClient.getProduct(productId);

    return NextResponse.json({
      product: {
        id: product.id,
        title: product.title,
        handle: product.handle,
        vendor: product.vendor,
        productType: product.productType,
        tags: product.tags,
        variants: product.variants.map((variant: ShopifyVariant) => ({
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      { error: 'Failed to fetch product from Shopify', message: errorMessage },
      { status: 500 }
    );
  }
}
