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
import { ShopifyProduct, ShopifyVariant } from './types';

interface ShopifyErrorResponse {
  response?: {
    data?: unknown;
    status?: number;
  };
  responseData?: unknown;
  statusCode?: number;
  status?: number;
}

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

    interface RequestParams {
      limit: number;
      since_id?: string;
      vendor?: string;
      product_type?: string;
      title?: string;
      updated_at_min?: string;
    }

    const requestParams: RequestParams = {
      limit,
    };

    // Add cursor-based pagination if sinceId is provided
    // This is used for subsequent pages after the first page
    interface FilterWithSinceId extends ProductFilter {
      sinceId?: string;
    }
    const filterWithSinceId = filter as FilterWithSinceId;
    if (filterWithSinceId?.sinceId) {
      requestParams.since_id = filterWithSinceId.sinceId;
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const lastProductId = response.products.length > 0
        ? response.products[response.products.length - 1]?.id?.toString()
        : null;

      return {
        data: response.products.map((product: ShopifyProduct) => this.normalizeProduct(product)),
        pagination: {
          total: response.page_info ? undefined : response.products.length,
          limit: filter?.limit || 50,
          hasNext: response.page_info?.has_next_page || false,
          hasPrev: response.page_info?.has_previous_page || false,
          // Use nextCursor for cursor-based pagination (Shopify uses since_id)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          nextCursor: lastProductId || undefined,
        },
      };
    } catch (error: unknown) {
      // Extract error message from various error types
      let errorMessage = 'Unknown error';
      let shopifyErrorDetails: unknown = null;
      let statusCode: number | undefined;

      if (error instanceof Error) {
        errorMessage = error.message;
        const errorWithStatus = error as Error & ShopifyErrorResponse;
        statusCode = errorWithStatus.statusCode;

        // Check if the error has response data from axios
        if (errorWithStatus.response?.data) {
          shopifyErrorDetails = errorWithStatus.response.data;
          statusCode = errorWithStatus.response.status;
        } else if (errorWithStatus.responseData) {
          shopifyErrorDetails = errorWithStatus.responseData;
        }
      } else {
        const errorWithResponse = error as ShopifyErrorResponse;
        if (errorWithResponse.response?.data) {
          // Axios error with response
          shopifyErrorDetails = errorWithResponse.response.data;
          const data = errorWithResponse.response.data;
          statusCode = errorWithResponse.response.status;

          if (data && typeof data === 'object' && 'errors' in data) {
            const errorData = data as { errors?: Record<string, string[]>; message?: string };
            if (errorData.errors && typeof errorData.errors === 'object') {
              const errorMessages: string[] = [];
              for (const key in errorData.errors) {
                if (Array.isArray(errorData.errors[key])) {
                  errorMessages.push(...errorData.errors[key]);
                } else if (typeof errorData.errors[key] === 'string') {
                  errorMessages.push(errorData.errors[key]);
                }
              }
              errorMessage = errorMessages.length > 0
                ? errorMessages.join(', ')
                : (errorData.message || 'Shopify API error');
            } else if (errorData.message) {
              errorMessage = errorData.message;
            } else if (statusCode) {
              errorMessage = `Request failed with status code ${statusCode}`;
            }
          } else if (statusCode) {
            errorMessage = `Request failed with status code ${statusCode}`;
          }
        } else if (errorWithResponse.statusCode) {
          statusCode = errorWithResponse.statusCode;
        }
      }

      // Check for other error types
      if (error && typeof error === 'object' && 'errors' in error) {
        const errorWithErrors = error as { errors?: Record<string, string[]> };
        // Handle ShopifyApiError format
        const errors = errorWithErrors.errors;
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
        shopifyErrorDetails = errors;
      } else if (error && typeof error === 'object' && 'message' in error) {
        const errorWithMessage = error as { message?: string };
        if (errorWithMessage.message) {
          errorMessage = errorWithMessage.message;
        }
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      // Get final status code
      const errorWithStatus = error as ShopifyErrorResponse;
      const finalStatusCode = statusCode || errorWithStatus.response?.status || errorWithStatus.statusCode || errorWithStatus.status;

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
        const variant = product.variants.find((v: ShopifyVariant) => v.sku === sku);
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
      interface ListFilterWithSinceId extends ProductFilter {
        sinceId?: string;
      }
      const listFilter: ListFilterWithSinceId = {
        ...filter,
        limit: filter?.limit || 50,
      };

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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const lastProduct = response.data[response.data.length - 1];
        sinceId = lastProduct.externalId;
      } else {
        hasMore = false;
      }
    }

    return results;
  }

  async count(): Promise<number> {
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

  private normalizeProduct(shopifyProduct: ShopifyProduct): NormalizedProduct {
    return {
      externalId: shopifyProduct.id.toString(),
      platform: 'shopify',
      title: shopifyProduct.title,
      description: shopifyProduct.body_html || '',
      vendor: shopifyProduct.vendor || '',
      productType: shopifyProduct.productType || '',
      tags: shopifyProduct.tags || [],
      status: this.normalizeStatus(shopifyProduct.status),
      images: shopifyProduct.images?.map((img: { src: string }) => img.src) || [],
      variants: shopifyProduct.variants?.map((variant: ShopifyVariant) => this.normalizeVariant(variant)) || [],
      createdAt: new Date(shopifyProduct.createdAt),
      updatedAt: new Date(shopifyProduct.updatedAt),
      publishedAt: shopifyProduct.publishedAt ? new Date(shopifyProduct.publishedAt) : undefined,
      metadata: {
        shopifyHandle: shopifyProduct.handle,
        shopifyProductId: shopifyProduct.id,
      },
    };
  }

  private normalizeVariant(shopifyVariant: ShopifyVariant): NormalizedVariant {
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
