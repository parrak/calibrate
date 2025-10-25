/**
 * Product Types
 *
 * Normalized product and variant types that work across all platforms.
 * Platform-specific connectors will transform their data into these normalized types.
 */

import { PlatformType } from './base';

/**
 * Product availability status
 */
export type ProductStatus = 'active' | 'draft' | 'archived';

/**
 * Inventory tracking level
 */
export type InventoryTracking = 'none' | 'product' | 'variant';

/**
 * Normalized product variant
 */
export interface NormalizedVariant {
  externalId: string;           // Platform-specific variant ID
  sku?: string;
  title: string;
  price: number;                // Price in cents
  compareAtPrice?: number;      // Compare-at price in cents (MSRP)
  currency: string;             // ISO currency code (e.g., "USD")
  inventory?: {
    quantity: number;
    tracked: boolean;
    available: boolean;
  };
  options?: Record<string, string>; // e.g., { "Size": "Large", "Color": "Blue" }
  weight?: {
    value: number;
    unit: 'kg' | 'g' | 'lb' | 'oz';
  };
  barcode?: string;
  imageUrl?: string;
  metadata?: Record<string, any>;
}

/**
 * Normalized product
 */
export interface NormalizedProduct {
  externalId: string;           // Platform-specific product ID
  platform: PlatformType;
  title: string;
  description?: string;
  vendor?: string;
  productType?: string;
  tags?: string[];
  status: ProductStatus;
  images?: string[];            // Image URLs
  variants: NormalizedVariant[];
  createdAt?: Date;
  updatedAt?: Date;
  publishedAt?: Date;
  metadata?: Record<string, any>; // Platform-specific data
}

/**
 * Product filter for list operations
 */
export interface ProductFilter {
  status?: ProductStatus;
  vendor?: string;
  productType?: string;
  tags?: string[];
  search?: string;
  sku?: string;
  updatedAfter?: Date;
  limit?: number;
  page?: number;
  cursor?: string;
}

/**
 * Product sync result
 */
export interface ProductSyncResult {
  productId: string;
  externalId: string;
  platform: PlatformType;
  success: boolean;
  error?: string;
  syncedAt: Date;
}
