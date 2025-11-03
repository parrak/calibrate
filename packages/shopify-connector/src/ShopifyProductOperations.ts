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

    // Prepare request parameters
    // Note: Shopify REST API uses cursor-based pagination (since_id), not page-based
    // Note: Shopify REST API has a maximum limit of 250 products per request
    const maxLimit = 250;
    const requestedLimit = filter?.limit || 50;
    const limit = Math.min(requestedLimit, maxLimit);

    // Warn if requested limit exceeds maximum
    if (requestedLimit && requestedLimit > maxLimit) {
      console.warn(`Shopify API limit ${requestedLimit} exceeds maximum of ${maxLimit}. Using ${maxLimit} instead.`);
    }

    const requestParams: any = {
      limit,
    };

    // Add cursor-based pagination if sinceId is provided
    // This is used for subsequent pages after the first page
    if ((filter as any)?.sinceId) {
      requestParams.since_id = (filter as any).sinceId;
    }

    // Add optional filters, only if they have values
    if (filter?.vendor) requestParams.vendor = filter.vendor;
    if (filter?.productType) requestParams.product_type = filter.productType;
    if (filter?.search) requestParams.title = filter.search;

    // Format date parameter if provided
    if (filter?.updatedAfter) {
      const date = filter.updatedAfter instanceof Date
        ? filter.updatedAfter
        : new Date(filter.updatedAfter);

      // Validate date
      if (isNaN(date.getTime())) {
        throw new PlatformError(
          'validation',
          'Invalid updatedAfter date provided',
          'shopify'
        );
      }

      // Shopify expects ISO 8601 format, remove milliseconds if present
      const isoString = date.toISOString();
      requestParams.updated_at_min = isoString;
    }

    try {
      const response = await this.connector.underlyingProducts.listProducts(requestParams);

      // Validate response structure
      if (!response || typeof response !== 'object') {
        throw new Error('Invalid response from Shopify API: response is not an object');
      }

      if (!Array.isArray(response.products)) {
        throw new Error(`Invalid response from Shopify API: products is not an array. Got: ${typeof response.products}`);
      }

      // Extract the last product ID for cursor-based pagination
      const lastProductId = response.products.length > 0
        ? response.products[response.products.length - 1]?.id?.toString()
        : null;

      return {
        data: response.products.map((product: any) => this.normalizeProduct(product)),
        pagination: {
          total: response.page_info ? undefined : response.products.length,
          limit: filter?.limit || 50,
          hasNext: response.page_info?.has_next_page || false,
          hasPrev: response.page_info?.has_previous_page || false,
          // Use nextCursor for cursor-based pagination (Shopify uses since_id)
          nextCursor: lastProductId || undefined,
        },
      };
    } catch (error: any) {
      // Extract error message from various error types
      let errorMessage = 'Unknown error';
      let shopifyErrorDetails: any = null;
      let statusCode: number | undefined;

      if (error instanceof Error) {
        errorMessage = error.message;
        statusCode = (error as any)?.statusCode;

        // Check if the error has response data from axios
        if ((error as any).response?.data) {
          shopifyErrorDetails = (error as any).response.data;
          statusCode = (error as any).response.status;
        } else if ((error as any).responseData) {
          shopifyErrorDetails = (error as any).responseData;
        }
      } else if (error?.response?.data) {
        // Axios error with response
        shopifyErrorDetails = error.response.data;
        const data = error.response.data;
        statusCode = error.response.status;

        if (data.errors && typeof data.errors === 'object') {
          const errorMessages: string[] = [];
          for (const key in data.errors) {
            if (Array.isArray(data.errors[key])) {
              errorMessages.push(...data.errors[key]);
            } else if (typeof data.errors[key] === 'string') {
              errorMessages.push(data.errors[key]);
            }
          }
          errorMessage = errorMessages.length > 0
            ? errorMessages.join(', ')
            : (data.message || 'Shopify API error');
        } else if (data.message) {
          errorMessage = data.message;
        }
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
        shopifyErrorDetails = error.errors;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      // Get final status code
      const finalStatusCode = statusCode || (error as any)?.response?.status || (error as any)?.statusCode;

      // Log detailed error information for 400 and 401 errors
      if (finalStatusCode === 400 || finalStatusCode === 401 || errorMessage.includes('400') || errorMessage.includes('401')) {
        console.error(`Shopify API ${finalStatusCode} error details:`, {
          requestParams,
          shopifyErrorDetails,
          statusCode: finalStatusCode,
          fullError: error,
        });
      }

      // Provide better error message for 401 (authentication errors)
      if (finalStatusCode === 401) {
        errorMessage = 'Authentication failed. The access token may be invalid or expired. Please reconnect your Shopify integration.';
      }

      // Create a proper Error object if needed
      const originalError = error instanceof Error
        ? error
        : new Error(errorMessage);

      // Enhance error message with Shopify error details if available
      if (shopifyErrorDetails && finalStatusCode === 400) {
        const detailsStr = typeof shopifyErrorDetails === 'object'
          ? JSON.stringify(shopifyErrorDetails)
          : String(shopifyErrorDetails);
        errorMessage = `${errorMessage}${detailsStr ? ` | Shopify details: ${detailsStr}` : ''}`;
      }

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
      await this.get(externalId);

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
    let hasMore = true;
    let sinceId: string | undefined = undefined;

    while (hasMore) {
      // Use cursor-based pagination with since_id
      const listFilter = {
        ...filter,
        limit: filter?.limit || 50,
      } as any;

      if (sinceId) {
        listFilter.sinceId = sinceId;
      }

      const response = await this.list(listFilter);

      for (const product of response.data) {
        const result = await this.sync(
          `cal-${product.externalId}`,
          product.externalId
        );
        results.push(result);
      }

      // Use cursor-based pagination: get the last product ID for next page
      hasMore = response.pagination.hasNext;
      if (response.pagination.nextCursor) {
        sinceId = response.pagination.nextCursor;
      } else if (response.data.length > 0) {
        // Fallback: extract ID from last product if nextCursor not in pagination
        const lastProduct = response.data[response.data.length - 1];
        sinceId = lastProduct.externalId;
      } else {
        hasMore = false;
      }
    }

    return results;
  }

  async count(_filter?: ProductFilter): Promise<number> {
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
