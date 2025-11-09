/**
 * Shopify Integration for Pricing Rules
 * Handles idempotent price updates to Shopify
 */

import { PrismaClient } from '@prisma/client';
import { initializeShopifyConnector, getPricingClient } from '@/lib/shopify-connector';

const db = prisma();

export interface PriceUpdate {
  variantId: string;
  price: string; // In dollars (e.g., "19.99")
  compareAtPrice?: string | null;
}

export interface PriceUpdateResult {
  success: boolean;
  error?: string;
  shopifyResponse?: unknown;
}

/**
 * Apply price update to Shopify with idempotency
 */
export async function applyPriceToShopify(
  projectId: string,
  update: PriceUpdate
): Promise<PriceUpdateResult> {
  try {
    // Get Shopify integration
    const integration = await prisma().shopifyIntegration.findFirst({
      where: {
        projectId,
        isActive: true,
      },
    });

    if (!integration) {
      return {
        success: false,
        error: 'No active Shopify integration found for project',
      };
    }

    // Initialize Shopify connector
    const connector = await initializeShopifyConnector({
      shopDomain: integration.shopDomain,
      accessToken: integration.accessToken,
      scope: integration.scope,
      isActive: integration.isActive,
    });

    // Get pricing client
    const pricingClient = getPricingClient(connector);

    // Apply price update
    const result = await pricingClient.updateVariantPrice({
      variantId: update.variantId,
      price: update.price,
      compareAtPrice: update.compareAtPrice,
    });

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Unknown Shopify error',
        shopifyResponse: result,
      };
    }

    return {
      success: true,
      shopifyResponse: result.updatedVariant,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error applying price to Shopify:', errorMessage);

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Batch apply price updates to Shopify with rate limiting
 */
export async function batchApplyPricesToShopify(
  projectId: string,
  updates: PriceUpdate[]
): Promise<PriceUpdateResult[]> {
  const results: PriceUpdateResult[] = [];

  for (const update of updates) {
    const result = await applyPriceToShopify(projectId, update);
    results.push(result);

    // Rate limit: wait between updates to avoid hitting Shopify rate limits
    // Shopify bucket size is 40 requests, so we can do ~2 requests/second safely
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return results;
}

/**
 * Validate variant ID format
 */
export function isValidShopifyVariantId(variantId: string): boolean {
  // Shopify variant IDs are numeric strings
  return /^\d+$/.test(variantId);
}

/**
 * Generate idempotency key for price update
 * Format: {tenantId}:{variantId}:{runId}:{price}
 */
export function generateIdempotencyKey(
  tenantId: string,
  variantId: string,
  runId: string,
  price: number
): string {
  return `${tenantId}:${variantId}:${runId}:${price}`;
}

/**
 * Check if price update has already been applied (idempotency check)
 */
export async function isPriceUpdateApplied(
  idempotencyKey: string
): Promise<boolean> {
  const existing = await prisma().priceChange.findFirst({
    where: {
      context: {
        path: ['idempotencyKey'],
        equals: idempotencyKey,
      },
      status: 'APPLIED',
    },
  });

  return existing !== null;
}
