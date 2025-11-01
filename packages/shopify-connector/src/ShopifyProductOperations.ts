/**
 * Shopify Product Operations
 * Implements ProductOperations interface for Shopify products
 */

import {
  ProductOperations,
  NormalizedProduct,
  NormalizedVariant,
  ProductFilter,
  ProductSyncResult,
  PaginatedResponse,
  PlatformError,
} from '@calibr/platform-connector';
import { ShopifyConnector } from './ShopifyConnector';

export class ShopifyProductOperations implements ProductOperations {
  constructor(private connector: ShopifyConnector) {}

  async list(filter?: ProductFilter): Promise<PaginatedResponse<NormalizedProduct>> {
    if (!this.connector['client']) {
      throw new PlatformError(
        'authentication',
        'Connector not initialized',
        'shopify'
      );
    }

    if (!this.connector.underlyingProducts) {
      throw new PlatformError(
        'authentication',
        'Products client not initialized. Connector may not be fully initialized.',
        'shopify'
      );
    }

    try {
      const response = await this.connector.underlyingProducts.listProducts({
        limit: filter?.limit || 50,
        page: filter?.page || 1,
        vendor: filter?.vendor,
        product_type: filter?.productType,
        title: filter?.search,
        updated_at_min: filter?.updatedAfter?.toISOString(),
      } as any);

      // Validate response structure
      if (!response || typeof response !== 'object') {
        throw new Error('Invalid response from Shopify API: response is not an object');
      }

      if (!Array.isArray(response.products)) {
        throw new Error(`Invalid response from Shopify API: products is not an array. Got: ${typeof response.products}`);
      }

      return {
        data: response.products.map((product: any) => this.normalizeProduct(product)),
        pagination: {
          total: response.page_info ? undefined : response.products.length,
          page: filter?.page || 1,
          limit: filter?.limit || 50,
          hasNext: response.page_info?.has_next_page || false,
          hasPrev: response.page_info?.has_previous_page || false,
        },
      };
    } catch (error: any) {
      // Extract error message from various error types
      let errorMessage = 'Unknown error';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error?.errors) {
        // Handle ShopifyApiError format
        const errors = error.errors;
        if (typeof errors === 'object') {
          const errorMessages: string[] = [];
          for (const key in errors) {
            if (Array.isArray(errors[key])) {
              errorMessages.push(...errors[key]);
            } else if (typeof errors[key] === 'string') {
              errorMessages.push(errors[key]);
            }
          }
          errorMessage = errorMessages.length > 0 
            ? errorMessages.join(', ') 
            : 'Shopify API error';
        }
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      // Create a proper Error object if needed
      const originalError = error instanceof Error 
        ? error 
        : new Error(errorMessage);

      throw new PlatformError(
        'server',
        `Failed to list products: ${errorMessage}`,
        'shopify',
        originalError
      );
    }
  }

  async get(externalId: string): Promise<NormalizedProduct> {
    if (!this.connector['client']) {
      throw new PlatformError(
        'authentication',
        'Connector not initialized',
        'shopify'
      );
    }

    try {
      const product = await this.connector.underlyingProducts!.getProduct(externalId);
      return this.normalizeProduct(product);
    } catch (error) {
      throw new PlatformError(
        'not_found',
        `Product not found: ${externalId}`,
        'shopify',
        error instanceof Error ? error : undefined
      );
    }
  }

  async getBySku(sku: string): Promise<NormalizedProduct | null> {
    if (!this.connector['client']) {
      throw new PlatformError(
        'authentication',
        'Connector not initialized',
        'shopify'
      );
    }

    try {
      // Search for products with the SKU using searchProducts
      const response = await this.connector.underlyingProducts!.searchProducts(sku);
      
      // Find the product with matching SKU in variants
      for (const product of response.products) {
        const variant = product.variants.find((v: any) => v.sku === sku);
        if (variant) {
          return this.normalizeProduct(product);
        }
      }

      return null;
    } catch (error) {
      throw new PlatformError(
        'server',
        `Failed to search products by SKU: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'shopify',
        error instanceof Error ? error : undefined
      );
    }
  }

  async sync(productId: string, externalId: string): Promise<ProductSyncResult> {
    try {
      const product = await this.get(externalId);

      // In a real implementation, this would update the local database
      // For now, we'll just return a success result

      return {
        productId,
        externalId,
        platform: 'shopify',
        success: true,
        syncedAt: new Date(),
      };
    } catch (error) {
      return {
        productId,
        externalId,
        platform: 'shopify',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        syncedAt: new Date(),
      };
    }
  }

  async syncAll(filter?: ProductFilter): Promise<ProductSyncResult[]> {
    const results: ProductSyncResult[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await this.list({ ...filter, page, limit: filter?.limit || 50 });

      for (const product of response.data) {
        const result = await this.sync(
          `cal-${product.externalId}`,
          product.externalId
        );
        results.push(result);
      }

      hasMore = response.pagination.hasNext;
      page++;
    }

    return results;
  }

  async count(filter?: ProductFilter): Promise<number> {
    if (!this.connector['client']) {
      throw new PlatformError(
        'authentication',
        'Connector not initialized',
        'shopify'
      );
    }

    try {
      return await this.connector.underlyingProducts!.getProductCount();
    } catch (error) {
      throw new PlatformError(
        'server',
        `Failed to get product count: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'shopify',
        error instanceof Error ? error : undefined
      );
    }
  }

  private normalizeProduct(shopifyProduct: any): NormalizedProduct {
    return {
      externalId: shopifyProduct.id.toString(),
      platform: 'shopify',
      title: shopifyProduct.title,
      description: shopifyProduct.body_html || '',
      vendor: shopifyProduct.vendor || '',
      productType: shopifyProduct.productType || '',
      tags: shopifyProduct.tags || [],
      status: this.normalizeStatus(shopifyProduct.status),
      images: shopifyProduct.images?.map((img: any) => img.src) || [],
      variants: shopifyProduct.variants?.map((variant: any) => this.normalizeVariant(variant)) || [],
      createdAt: new Date(shopifyProduct.createdAt),
      updatedAt: new Date(shopifyProduct.updatedAt),
      publishedAt: shopifyProduct.publishedAt ? new Date(shopifyProduct.publishedAt) : undefined,
      metadata: {
        shopifyHandle: shopifyProduct.handle,
        shopifyProductId: shopifyProduct.id,
      },
    };
  }

  private normalizeVariant(shopifyVariant: any): NormalizedVariant {
    return {
      externalId: shopifyVariant.id.toString(),
      sku: shopifyVariant.sku || '',
      title: shopifyVariant.title || '',
      price: Math.round(parseFloat(shopifyVariant.price || '0') * 100), // Convert to cents
      compareAtPrice: shopifyVariant.compareAtPrice
        ? Math.round(parseFloat(shopifyVariant.compareAtPrice) * 100)
        : undefined,
      currency: 'USD', // Default currency, should be fetched from shop settings
      inventory: {
        quantity: shopifyVariant.inventoryQuantity || 0,
        tracked: shopifyVariant.inventoryManagement === 'shopify',
        available: (shopifyVariant.inventoryQuantity || 0) > 0,
      },
      options: {
        option1: shopifyVariant.option1 || '',
        option2: shopifyVariant.option2 || '',
        option3: shopifyVariant.option3 || '',
      },
      barcode: shopifyVariant.barcode || '',
      imageUrl: shopifyVariant.image?.src || '',
      metadata: {
        shopifyVariantId: shopifyVariant.id,
        shopifyInventoryItemId: shopifyVariant.inventoryItemId,
      },
    };
  }

  private normalizeStatus(status: string): 'active' | 'draft' | 'archived' {
    if (status === 'active') return 'active';
    if (status === 'draft') return 'draft';
    return 'archived';
  }
}
