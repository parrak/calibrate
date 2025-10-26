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

    try {
      const response = await this.connector['products'].listProducts({
        limit: filter?.limit || 50,
        page: filter?.page || 1,
        vendor: filter?.vendor,
        product_type: filter?.productType,
        title: filter?.search,
        created_at_min: filter?.createdAfter?.toISOString(),
        created_at_max: filter?.createdBefore?.toISOString(),
        updated_at_min: filter?.updatedAfter?.toISOString(),
        updated_at_max: filter?.updatedBefore?.toISOString(),
      });

      return {
        data: response.products.map(this.normalizeProduct),
        pagination: {
          total: response.page_info ? undefined : response.products.length,
          page: filter?.page || 1,
          limit: filter?.limit || 50,
          hasNext: response.page_info?.has_next_page || false,
          hasPrev: response.page_info?.has_previous_page || false,
        },
      };
    } catch (error) {
      throw new PlatformError(
        'server',
        `Failed to list products: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'shopify',
        error instanceof Error ? error : undefined
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
      const product = await this.connector['products'].getProduct(externalId);
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
      // Search for products with the SKU
      const response = await this.list({ search: sku });
      
      // Find the product with matching SKU in variants
      for (const product of response.data) {
        const variant = product.variants.find(v => v.sku === sku);
        if (variant) {
          return product;
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
      const response = await this.list({ ...filter, page, limit: 50 });

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
      return await this.connector['products'].getProductCount();
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
      variants: shopifyProduct.variants?.map(this.normalizeVariant) || [],
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
