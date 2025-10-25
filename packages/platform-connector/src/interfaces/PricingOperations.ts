/**
 * PricingOperations Interface
 *
 * Interface for price update operations across all platforms.
 */

import {
  NormalizedPrice,
  PriceUpdate,
  PriceUpdateResult,
  BatchPriceUpdate,
  BatchUpdateResult,
  PriceHistoryEntry
} from '../types/pricing';

/**
 * Pricing operations interface
 *
 * Defines standard operations for updating and retrieving prices
 * across e-commerce platforms.
 */
export interface PricingOperations {
  /**
   * Get current price for a product/variant
   *
   * @param externalId - Platform-specific product/variant ID
   * @returns Current price information
   * @throws PlatformError if product not found
   *
   * @example
   * ```typescript
   * const price = await connector.pricing.getPrice('shopify-variant-123');
   * console.log(`Current price: ${price.price / 100} ${price.currency}`);
   * ```
   */
  getPrice(externalId: string): Promise<NormalizedPrice>;

  /**
   * Get prices for multiple products/variants
   *
   * @param externalIds - Array of platform-specific IDs
   * @returns Array of price information
   */
  getPrices(externalIds: string[]): Promise<NormalizedPrice[]>;

  /**
   * Update price for a single product/variant
   *
   * @param update - Price update request
   * @returns Update result with success/failure information
   *
   * @example
   * ```typescript
   * const result = await connector.pricing.updatePrice({
   *   externalId: 'shopify-variant-123',
   *   price: 2999, // $29.99 in cents
   *   currency: 'USD'
   * });
   *
   * if (result.success) {
   *   console.log('Price updated successfully');
   * }
   * ```
   */
  updatePrice(update: PriceUpdate): Promise<PriceUpdateResult>;

  /**
   * Update prices for multiple products/variants in batch
   *
   * Platforms that support batch operations will process all updates together.
   * Others will process them sequentially.
   *
   * @param batchUpdate - Batch price update request
   * @returns Batch update results
   *
   * @example
   * ```typescript
   * const result = await connector.pricing.batchUpdatePrices({
   *   updates: [
   *     { externalId: 'var-1', price: 1999, currency: 'USD' },
   *     { externalId: 'var-2', price: 2999, currency: 'USD' }
   *   ],
   *   stopOnError: false
   * });
   *
   * console.log(`Updated ${result.successful}/${result.total} prices`);
   * ```
   */
  batchUpdatePrices(batchUpdate: BatchPriceUpdate): Promise<BatchUpdateResult>;

  /**
   * Validate a price update without actually applying it
   *
   * Useful for testing if a price update would succeed without making changes.
   *
   * @param update - Price update to validate
   * @returns Validation result
   */
  validatePriceUpdate(update: PriceUpdate): Promise<{
    valid: boolean;
    errors?: string[];
  }>;

  /**
   * Get price history for a product/variant (if supported by platform)
   *
   * @param externalId - Platform-specific product/variant ID
   * @param limit - Maximum number of history entries to return
   * @returns Array of price history entries
   */
  getPriceHistory?(externalId: string, limit?: number): Promise<PriceHistoryEntry[]>;

  /**
   * Revert a price update (if supported by platform)
   *
   * @param externalId - Platform-specific product/variant ID
   * @returns Revert result
   */
  revertPriceUpdate?(externalId: string): Promise<PriceUpdateResult>;
}
