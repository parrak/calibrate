/**
 * ProductOperations Interface
 *
 * Interface for product-related operations across all platforms.
 */

import { NormalizedProduct, ProductFilter, ProductSyncResult } from '../types/product';
import { PaginatedResponse } from '../types/base';

/**
 * Product operations interface
 *
 * Defines standard operations for reading and syncing product data
 * from e-commerce platforms.
 */
export interface ProductOperations {
  /**
   * List products with optional filtering and pagination
   *
   * @param filter - Optional filter criteria
   * @returns Paginated list of normalized products
   *
   * @example
   * ```typescript
   * const products = await connector.products.list({
   *   status: 'active',
   *   limit: 50,
   *   page: 1
   * });
   * ```
   */
  list(filter?: ProductFilter): Promise<PaginatedResponse<NormalizedProduct>>;

  /**
   * Get a single product by external ID
   *
   * @param externalId - Platform-specific product ID
   * @returns Normalized product data
   * @throws PlatformError if product not found
   *
   * @example
   * ```typescript
   * const product = await connector.products.get('shopify-product-123');
   * ```
   */
  get(externalId: string): Promise<NormalizedProduct>;

  /**
   * Get a product by SKU
   *
   * @param sku - Product SKU
   * @returns Normalized product data or null if not found
   */
  getBySku(sku: string): Promise<NormalizedProduct | null>;

  /**
   * Sync a specific product from the platform
   *
   * Fetches the latest data for a product and updates local cache/database.
   *
   * @param productId - Internal Calibrate product ID
   * @param externalId - Platform-specific product ID
   * @returns Sync result
   *
   * @example
   * ```typescript
   * const result = await connector.products.sync(
   *   'cal-prod-123',
   *   'shopify-product-456'
   * );
   * ```
   */
  sync(productId: string, externalId: string): Promise<ProductSyncResult>;

  /**
   * Sync all products from the platform
   *
   * Performs a full sync of all products. This may be a long-running operation.
   *
   * @param filter - Optional filter to limit which products to sync
   * @returns Array of sync results
   */
  syncAll(filter?: ProductFilter): Promise<ProductSyncResult[]>;

  /**
   * Count total products matching filter
   *
   * @param filter - Optional filter criteria
   * @returns Total count of products
   */
  count(filter?: ProductFilter): Promise<number>;
}
