/**
 * Shopify Products Operations
 * Handles reading, creating, and updating Shopify products and variants
 */

import { ShopifyClient } from './client';
import { ShopifyProduct, ShopifyVariant, ShopifyPriceUpdate } from './types';

export interface ProductListOptions {
  limit?: number;
  since_id?: string; // Cursor-based pagination: last product ID from previous page
  fields?: string[];
  ids?: string[];
  title?: string;
  vendor?: string;
  product_type?: string;
  created_at_min?: string;
  created_at_max?: string;
  updated_at_min?: string;
  updated_at_max?: string;
  published_at_min?: string;
  published_at_max?: string;
  published_status?: 'published' | 'unpublished' | 'any';
  collection_id?: string;
  product_ids?: string[];
}

export interface ProductListResponse {
  products: ShopifyProduct[];
  page_info?: {
    has_next_page: boolean;
    has_previous_page: boolean;
    start_cursor?: string;
    end_cursor?: string;
  };
}

export class ShopifyProducts {
  private client: ShopifyClient;

  constructor(client: ShopifyClient) {
    this.client = client;
  }

  /**
   * List products with optional filtering
   * Uses cursor-based pagination (since_id) instead of page-based pagination
   * Note: Shopify REST API has a maximum limit of 250 products per request
   */
  async listProducts(options: ProductListOptions = {}): Promise<ProductListResponse> {
    const maxLimit = 250; // Shopify's maximum limit
    const requestedLimit = options.limit || 50;
    const limit = Math.min(requestedLimit, maxLimit);

    // Warn if requested limit exceeds maximum
    if (requestedLimit > maxLimit) {
      console.warn(`Shopify API limit ${requestedLimit} exceeds maximum of ${maxLimit}. Using ${maxLimit} instead.`);
    }

    const params: any = {
      limit,
      ...options,
    };

    // Remove page parameter if present (Shopify doesn't support it)
    delete params.page;
    // Ensure limit doesn't exceed maximum
    params.limit = limit;

    // Remove undefined values
    Object.keys(params).forEach((key: string) => {
      if (params[key] === undefined) {
        delete params[key];
      }
    });

    return await this.client.get<ProductListResponse>('/products.json', params);
  }

  /**
   * Get a single product by ID
   */
  async getProduct(productId: string): Promise<ShopifyProduct> {
    const response = await this.client.get<{ product: ShopifyProduct }>(`/products/${productId}.json`);
    return response.product;
  }

  /**
   * Get product by handle
   */
  async getProductByHandle(handle: string): Promise<ShopifyProduct | null> {
    try {
      const response = await this.client.get<{ product: ShopifyProduct }>(`/products.json?handle=${handle}`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return response.product || null;
    } catch (error: any) {
      if (error?.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get all variants for a product
   */
  async getProductVariants(productId: string): Promise<ShopifyVariant[]> {
    const product = await this.getProduct(productId);
    return product.variants;
  }

  /**
   * Get a single variant by ID
   */
  async getVariant(variantId: string): Promise<ShopifyVariant> {
    const response = await this.client.get<{ variant: ShopifyVariant }>(`/variants/${variantId}.json`);
    return response.variant;
  }

  /**
   * Update variant prices
   */
  async updateVariantPrices(updates: ShopifyPriceUpdate[]): Promise<ShopifyVariant[]> {
    const results: ShopifyVariant[] = [];

    for (const update of updates) {
      try {
        await this.client.waitIfNeeded();

        const variantData = {
          variant: {
            id: update.variantId,
            price: update.price,
            compare_at_price: update.compareAtPrice || null,
          },
        };

        const response = await this.client.put<{ variant: ShopifyVariant }>(
          `/variants/${update.variantId}.json`,
          variantData
        );

        results.push(response.variant);
      } catch (error) {
        console.error(`Failed to update variant ${update.variantId}:`, error);
        throw error;
      }
    }

    return results;
  }

  /**
   * Update a single variant price
   */
  async updateVariantPrice(update: ShopifyPriceUpdate): Promise<ShopifyVariant> {
    const results = await this.updateVariantPrices([update]);
    return results[0];
  }

  /**
   * Search products by query
   */
  async searchProducts(query: string, options: Omit<ProductListOptions, 'title'> = {}): Promise<ProductListResponse> {
    return await this.listProducts({
      ...options,
      title: query,
    });
  }

  /**
   * Get products by vendor
   */
  async getProductsByVendor(vendor: string, options: Omit<ProductListOptions, 'vendor'> = {}): Promise<ProductListResponse> {
    return await this.listProducts({
      ...options,
      vendor,
    });
  }

  /**
   * Get products by product type
   */
  async getProductsByType(productType: string, options: Omit<ProductListOptions, 'product_type'> = {}): Promise<ProductListResponse> {
    return await this.listProducts({
      ...options,
      product_type: productType,
    });
  }

  /**
   * Get recently updated products
   */
  async getRecentlyUpdatedProducts(hours: number = 24, options: Omit<ProductListOptions, 'updated_at_min'> = {}): Promise<ProductListResponse> {
    const updatedAtMin = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

    return await this.listProducts({
      ...options,
      updated_at_min: updatedAtMin,
    });
  }

  /**
   * Get product count
   */
  async getProductCount(): Promise<number> {
    const response = await this.client.get<{ count: number }>('/products/count.json');
    return response.count;
  }

  /**
   * Check if product exists
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async productExists(productId: string): Promise<boolean> {
    try {
      await this.getProduct(productId);
      return true;
    } catch (error: any) {
      if (error?.response?.status === 404) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Check if variant exists
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async variantExists(variantId: string): Promise<boolean> {
    try {
      await this.getVariant(variantId);
      return true;
    } catch (error: any) {
      if (error?.response?.status === 404) {
        return false;
      }
      throw error;
    }
  }
}
