/**
 * Validation Utilities
 *
 * Input validation helpers for platform operations.
 */

import { z } from 'zod';
import { PlatformType } from '../types/base';

/**
 * Validate platform type
 */
export function isValidPlatform(platform: string): platform is PlatformType {
  const validPlatforms: PlatformType[] = [
    'shopify',
    'amazon',
    'google_shopping',
    'woocommerce',
    'bigcommerce',
    'custom'
  ];
  return validPlatforms.includes(platform as PlatformType);
}

/**
 * Validate price (must be positive integer in cents)
 */
export function isValidPrice(price: number): boolean {
  return Number.isInteger(price) && price >= 0;
}

/**
 * Validate currency code (ISO 4217)
 */
export function isValidCurrency(currency: string): boolean {
  return /^[A-Z]{3}$/.test(currency);
}

/**
 * Validate SKU format
 */
export function isValidSku(sku: string): boolean {
  return sku.length > 0 && sku.length <= 255;
}

/**
 * Validate external ID
 */
export function isValidExternalId(externalId: string): boolean {
  return externalId.length > 0 && externalId.length <= 255;
}

/**
 * Zod schema for price updates
 */
export const PriceUpdateSchema = z.object({
  externalId: z.string().min(1).max(255),
  sku: z.string().min(1).max(255).optional(),
  price: z.number().int().nonnegative(),
  compareAtPrice: z.number().int().nonnegative().optional(),
  currency: z.string().regex(/^[A-Z]{3}$/),
  effectiveDate: z.date().optional(),
  metadata: z.record(z.any()).optional(),
});

/**
 * Zod schema for batch price updates
 */
export const BatchPriceUpdateSchema = z.object({
  updates: z.array(PriceUpdateSchema).min(1),
  validateOnly: z.boolean().optional(),
  stopOnError: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
});

/**
 * Zod schema for product filter
 */
export const ProductFilterSchema = z.object({
  status: z.enum(['active', 'draft', 'archived']).optional(),
  vendor: z.string().optional(),
  productType: z.string().optional(),
  tags: z.array(z.string()).optional(),
  search: z.string().optional(),
  sku: z.string().optional(),
  updatedAfter: z.date().optional(),
  limit: z.number().int().positive().max(250).optional(),
  page: z.number().int().positive().optional(),
  cursor: z.string().optional(),
});

/**
 * Validate price update
 */
export function validatePriceUpdate(update: unknown): z.SafeParseReturnType<any, any> {
  return PriceUpdateSchema.safeParse(update);
}

/**
 * Validate batch price update
 */
export function validateBatchPriceUpdate(batchUpdate: unknown): z.SafeParseReturnType<any, any> {
  return BatchPriceUpdateSchema.safeParse(batchUpdate);
}

/**
 * Validate product filter
 */
export function validateProductFilter(filter: unknown): z.SafeParseReturnType<any, any> {
  return ProductFilterSchema.safeParse(filter);
}

/**
 * Sanitize string input
 */
export function sanitizeString(input: string, maxLength: number = 255): string {
  return input.trim().slice(0, maxLength);
}

/**
 * Validate and sanitize metadata
 */
export function sanitizeMetadata(metadata: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(metadata)) {
    // Only allow strings, numbers, booleans, and null
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      value === null
    ) {
      sanitized[key] = value;
    }
  }

  return sanitized;
}
