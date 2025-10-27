/**
 * Shopify Pricing Operations
 * Handles price updates and pricing-related operations using GraphQL
 */
import { ShopifyClient } from './client';
import { ShopifyPriceUpdate, ShopifyVariant } from './types';

export interface BulkPriceUpdate {
  updates: ShopifyPriceUpdate[];
  batchSize?: number;
}

export interface PriceUpdateResult {
  success: boolean;
  variantId: string;
  updatedVariant?: ShopifyVariant;
  error?: string;
}

export interface BulkPriceUpdateResult {
  results: PriceUpdateResult[];
  successCount: number;
  errorCount: number;
  errors: string[];
}

export class ShopifyPricing {
  private client: ShopifyClient;

  constructor(client: ShopifyClient) {
    this.client = client;
  }

  /**
   * Update variant price using GraphQL mutation
   */
  async updateVariantPrice(update: ShopifyPriceUpdate): Promise<PriceUpdateResult> {
    const mutation = `
      mutation productVariantUpdate($input: ProductVariantInput!) {
        productVariantUpdate(input: $input) {
          productVariant {
            id
            price
            compareAtPrice
            sku
            title
            inventoryQuantity
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
        id: `gid://shopify/ProductVariant/${update.variantId}`,
        price: update.price,
        compareAtPrice: update.compareAtPrice || null,
      },
    };

    try {
      const response = await this.client.post('/graphql.json', {
        query: mutation,
        variables,
      }) as any;

      const { productVariantUpdate } = response.data;

      if (productVariantUpdate.userErrors.length > 0) {
        return {
          success: false,
          variantId: update.variantId,
          error: productVariantUpdate.userErrors.map((e: any) => e.message).join(', '),
        };
      }

      return {
        success: true,
        variantId: update.variantId,
        updatedVariant: this.convertGraphQLVariant(productVariantUpdate.productVariant),
      };
    } catch (error: any) {
      return {
        success: false,
        variantId: update.variantId,
        error: error.message || 'Unknown error occurred',
      };
    }
  }

  /**
   * Update multiple variant prices in batches
   */
  async updateVariantPricesBulk(bulkUpdate: BulkPriceUpdate): Promise<BulkPriceUpdateResult> {
    const batchSize = bulkUpdate.batchSize || 10;
    const results: PriceUpdateResult[] = [];
    const errors: string[] = [];

    // Process updates in batches
    for (let i = 0; i < bulkUpdate.updates.length; i += batchSize) {
      const batch = bulkUpdate.updates.slice(i, i + batchSize);

      // Process batch concurrently
      const batchPromises = batch.map(update => this.updateVariantPrice(update));
      const batchResults = await Promise.allSettled(batchPromises);

      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          const update = batch[index];
          results.push({
            success: false,
            variantId: update.variantId,
            error: result.reason?.message || 'Unknown error',
          });
          errors.push(`Variant ${update.variantId}: ${result.reason?.message || 'Unknown error'}`);
        }
      });

      // Wait between batches to respect rate limits
      if (i + batchSize < bulkUpdate.updates.length) {
        await this.client.waitIfNeeded();
      }
    }

    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;

    return {
      results,
      successCount,
      errorCount,
      errors,
    };
  }

  /**
   * Get current pricing for multiple variants
   */
  async getVariantPricing(variantIds: string[]): Promise<Map<string, ShopifyVariant>> {
    const query = `
      query getVariants($ids: [ID!]!) {
        nodes(ids: $ids) {
          ... on ProductVariant {
            id
            price
            compareAtPrice
            sku
            title
            inventoryQuantity
            product {
              id
              title
            }
          }
        }
      }
    `;

    const variables = {
      ids: variantIds.map(id => `gid://shopify/ProductVariant/${id}`),
    };

    try {
      const response = await this.client.post('/graphql.json', {
        query,
        variables,
      }) as any;

      const pricingMap = new Map<string, ShopifyVariant>();

      response.data.nodes.forEach((node: any) => {
        if (node) {
          const variantId = node.id.split('/').pop();
          pricingMap.set(variantId, this.convertGraphQLVariant(node));
        }
      });

      return pricingMap;
    } catch (error: any) {
      throw new Error(`Failed to get variant pricing: ${error.message}`);
    }
  }

  /**
   * Validate price format
   */
  validatePrice(price: string): boolean {
    const priceRegex = /^\d+(\.\d{1,2})?$/;
    return priceRegex.test(price);
  }

  /**
   * Format price for Shopify (ensure 2 decimal places)
   */
  formatPrice(price: string | number): string {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return numPrice.toFixed(2);
  }

  /**
   * Calculate price change percentage
   */
  calculatePriceChangePercentage(oldPrice: string, newPrice: string): number {
    const old = parseFloat(oldPrice);
    const newPriceNum = parseFloat(newPrice);

    if (old === 0) return 0;

    return ((newPriceNum - old) / old) * 100;
  }

  /**
   * Check if price change is significant
   */
  isSignificantPriceChange(oldPrice: string, newPrice: string, threshold: number = 5): boolean {
    const changePercentage = Math.abs(this.calculatePriceChangePercentage(oldPrice, newPrice));
    return changePercentage >= threshold;
  }

  /**
   * Convert GraphQL variant response to ShopifyVariant type
   */
  private convertGraphQLVariant(graphqlVariant: any): ShopifyVariant {
    return {
      id: graphqlVariant.id.split('/').pop(),
      productId: graphqlVariant.product?.id.split('/').pop() || '',
      title: graphqlVariant.title,
      sku: graphqlVariant.sku,
      price: graphqlVariant.price,
      compareAtPrice: graphqlVariant.compareAtPrice,
      inventoryQuantity: graphqlVariant.inventoryQuantity,
      inventoryPolicy: 'deny', // Default value
      fulfillmentService: 'manual', // Default value
      inventoryManagement: 'shopify', // Default value
      createdAt: new Date().toISOString(), // GraphQL doesn't return this
      updatedAt: new Date().toISOString(), // GraphQL doesn't return this
    };
  }

  /**
   * Get pricing history for a variant (if available)
   * Note: Shopify doesn't provide pricing history, this is for future compatibility
   */
  async getPricingHistory(variantId: string): Promise<any[]> {
    // Shopify doesn't provide pricing history
    // This method is here for interface compatibility
    return [];
  }

  /**
   * Apply pricing rules to variants
   */
  async applyPricingRules(
    variantIds: string[],
    rules: {
      markup?: number;
      discount?: number;
      minPrice?: string;
      maxPrice?: string;
    }
  ): Promise<BulkPriceUpdateResult> {
    // Get current pricing
    const currentPricing = await this.getVariantPricing(variantIds);

    // Apply rules to create updates
    const updates: ShopifyPriceUpdate[] = [];

    currentPricing.forEach((variant, variantId) => {
      let newPrice = parseFloat(variant.price);

      // Apply markup
      if (rules.markup) {
        newPrice = newPrice * (1 + rules.markup / 100);
      }

      // Apply discount
      if (rules.discount) {
        newPrice = newPrice * (1 - rules.discount / 100);
      }

      // Apply min/max constraints
      if (rules.minPrice) {
        newPrice = Math.max(newPrice, parseFloat(rules.minPrice));
      }

      if (rules.maxPrice) {
        newPrice = Math.min(newPrice, parseFloat(rules.maxPrice));
      }

      updates.push({
        variantId,
        price: this.formatPrice(newPrice),
      });
    });

    return await this.updateVariantPricesBulk({ updates });
  }
}
