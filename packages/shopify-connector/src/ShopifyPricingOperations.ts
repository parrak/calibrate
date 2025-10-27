/**
 * Shopify Pricing Operations
 * Implements PricingOperations interface for Shopify pricing
 */

import {
  PricingOperations,
  NormalizedPrice,
  PriceUpdate,
  PriceUpdateResult,
  BatchPriceUpdate,
  BatchUpdateResult,
  PlatformError,
} from '@calibr/platform-connector';
import { ShopifyConnector } from './ShopifyConnector';

export class ShopifyPricingOperations implements PricingOperations {
  constructor(private connector: ShopifyConnector) {}

  async getPrice(externalId: string): Promise<NormalizedPrice> {
    if (!this.connector['client']) {
      throw new PlatformError(
        'authentication',
        'Connector not initialized',
        'shopify'
      );
    }

    try {
      const variant = await this.connector.underlyingProducts!.getVariant(externalId);

      return {
        externalId: variant.id.toString(),
        platform: 'shopify',
        price: Math.round(parseFloat(variant.price || '0') * 100),
        compareAtPrice: variant.compareAtPrice
          ? Math.round(parseFloat(variant.compareAtPrice) * 100)
          : undefined,
        currency: 'USD', // Default currency, should be fetched from shop settings
        updatedAt: new Date(variant.updatedAt),
        metadata: {
          shopifyVariantId: variant.id,
        },
      };
    } catch (error) {
      throw new PlatformError(
        'not_found',
        `Variant not found: ${externalId}`,
        'shopify',
        error instanceof Error ? error : undefined
      );
    }
  }

  async getPrices(externalIds: string[]): Promise<NormalizedPrice[]> {
    const prices = await Promise.all(
      externalIds.map((id) => this.getPrice(id))
    );
    return prices;
  }

  async updatePrice(update: PriceUpdate): Promise<PriceUpdateResult> {
    if (!this.connector['client']) {
      throw new PlatformError(
        'authentication',
        'Connector not initialized',
        'shopify'
      );
    }

    try {
      // Get current price for comparison
      const currentPrice = await this.getPrice(update.externalId);
      const oldPrice = currentPrice.price;

      // Update via GraphQL mutation
      const mutation = `
        mutation variantUpdate($input: ProductVariantInput!) {
          productVariantUpdate(input: $input) {
            productVariant {
              id
              price
              compareAtPrice
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const variables = {
        input: {
          id: `gid://shopify/ProductVariant/${update.externalId}`,
          price: (update.price / 100).toFixed(2),
          compareAtPrice: update.compareAtPrice
            ? (update.compareAtPrice / 100).toFixed(2)
            : null,
        },
      };

      const response: any = await this.connector['client'].post('/graphql.json', {
        query: mutation,
        variables,
      });

      if (response.data.productVariantUpdate.userErrors.length > 0) {
        const errors = response.data.productVariantUpdate.userErrors;
        throw new PlatformError(
          'validation',
          errors.map((e: any) => e.message).join(', '),
          'shopify'
        );
      }

      return {
        externalId: update.externalId,
        platform: 'shopify',
        success: true,
        oldPrice,
        newPrice: update.price,
        currency: update.currency,
        updatedAt: new Date(),
      };
    } catch (error) {
      if (error instanceof PlatformError) {
        throw error;
      }

      return {
        externalId: update.externalId,
        platform: 'shopify',
        success: false,
        currency: update.currency,
        updatedAt: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
        retryable: this.isRetryableError(error),
      };
    }
  }

  async batchUpdatePrices(batchUpdate: BatchPriceUpdate): Promise<BatchUpdateResult> {
    const results: PriceUpdateResult[] = [];

    for (const update of batchUpdate.updates) {
      const result = await this.updatePrice(update);
      results.push(result);

      if (!result.success && batchUpdate.stopOnError) {
        break;
      }
    }

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return {
      total: batchUpdate.updates.length,
      successful,
      failed,
      results,
      completedAt: new Date(),
      errors: results
        .filter((r) => !r.success)
        .map((r) => ({
          externalId: r.externalId,
          error: r.error || 'Unknown error',
        })),
    };
  }

  async validatePriceUpdate(update: PriceUpdate): Promise<{
    valid: boolean;
    errors?: string[];
  }> {
    const errors: string[] = [];

    // Validate price is positive
    if (update.price < 0) {
      errors.push('Price must be positive');
    }

    // Validate currency
    if (update.currency !== 'USD') {
      errors.push('Only USD currency is supported');
    }

    // Validate variant exists
    try {
      await this.getPrice(update.externalId);
    } catch {
      errors.push('Variant not found');
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  private isRetryableError(error: any): boolean {
    // Check if error is retryable (rate limits, server errors)
    if (error?.status === 429) return true; // Rate limit
    if (error?.status >= 500) return true; // Server error
    return false;
  }
}
