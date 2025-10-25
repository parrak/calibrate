/**
 * Normalization Utilities
 *
 * Helper functions for normalizing data across different platforms.
 */

import { NormalizedProduct, NormalizedVariant, ProductStatus } from '../types/product';
import { NormalizedPrice } from '../types/pricing';
import { PlatformType } from '../types/base';

/**
 * Convert price from dollars to cents
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * Convert price from cents to dollars
 */
export function centsToDollars(cents: number): number {
  return cents / 100;
}

/**
 * Format price for display
 */
export function formatPrice(cents: number, currency: string = 'USD'): string {
  const dollars = centsToDollars(cents);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(dollars);
}

/**
 * Normalize product status across platforms
 */
export function normalizeProductStatus(status: string): ProductStatus {
  const normalized = status.toLowerCase();

  if (normalized === 'active' || normalized === 'published') {
    return 'active';
  }

  if (normalized === 'draft' || normalized === 'unpublished') {
    return 'draft';
  }

  if (normalized === 'archived' || normalized === 'deleted') {
    return 'archived';
  }

  return 'draft'; // Default to draft for unknown statuses
}

/**
 * Normalize currency code to ISO 4217
 */
export function normalizeCurrency(currency: string): string {
  return currency.toUpperCase().trim();
}

/**
 * Extract SKU from variant
 */
export function extractSku(variant: Partial<NormalizedVariant>): string | undefined {
  return variant.sku || variant.externalId;
}

/**
 * Calculate price difference in cents
 */
export function calculatePriceDifference(oldPrice: number, newPrice: number): number {
  return newPrice - oldPrice;
}

/**
 * Calculate price difference as percentage
 */
export function calculatePriceChangePercent(oldPrice: number, newPrice: number): number {
  if (oldPrice === 0) return 0;
  return ((newPrice - oldPrice) / oldPrice) * 100;
}

/**
 * Check if product is on sale (has compare-at price)
 */
export function isOnSale(price: number, compareAtPrice?: number): boolean {
  return compareAtPrice !== undefined && compareAtPrice > price;
}

/**
 * Calculate sale discount percentage
 */
export function calculateSaleDiscount(price: number, compareAtPrice: number): number {
  if (compareAtPrice === 0) return 0;
  return ((compareAtPrice - price) / compareAtPrice) * 100;
}

/**
 * Normalize tags (lowercase, deduplicate)
 */
export function normalizeTags(tags: string[]): string[] {
  return [...new Set(tags.map(tag => tag.toLowerCase().trim()))];
}

/**
 * Build external product URL (if platform supports it)
 */
export function buildProductUrl(
  platform: PlatformType,
  externalId: string,
  shopDomain?: string
): string | undefined {
  switch (platform) {
    case 'shopify':
      if (!shopDomain) return undefined;
      return `https://${shopDomain}/admin/products/${externalId}`;

    case 'amazon':
      return `https://sellercentral.amazon.com/inventory?sku=${externalId}`;

    default:
      return undefined;
  }
}

/**
 * Extract platform-specific ID from URL
 */
export function extractIdFromUrl(url: string, platform: PlatformType): string | null {
  try {
    const urlObj = new URL(url);

    switch (platform) {
      case 'shopify': {
        const match = url.match(/\/products\/(\d+)/);
        return match ? match[1] : null;
      }

      case 'amazon': {
        const match = url.match(/\/dp\/([A-Z0-9]{10})/);
        return match ? match[1] : null;
      }

      default:
        return null;
    }
  } catch {
    return null;
  }
}

/**
 * Merge metadata objects
 */
export function mergeMetadata(
  base: Record<string, any> = {},
  override: Record<string, any> = {}
): Record<string, any> {
  return { ...base, ...override };
}

/**
 * Clean empty fields from object
 */
export function cleanEmptyFields<T extends Record<string, any>>(obj: T): Partial<T> {
  const cleaned: Partial<T> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== null && value !== '') {
      cleaned[key as keyof T] = value;
    }
  }

  return cleaned;
}
