import type {
  PlatformConnector,
  ProductOperations,
  PricingOperations,
  AuthOperations,
  PlatformConfig,
  PlatformCredentials,
  PlatformHealth,
  PlatformCapabilities,
  ProductLookupParams,
  Product,
  PriceUpdate,
  PriceUpdateResult,
  AuthCredentials,
  AuthStatus,
  ProductFilter,
  ProductSyncResult,
  ProductCountResult,
  BatchPriceUpdate,
  BatchPriceUpdateResult,
  PriceValidationResult,
} from '@calibr/platform-connector'
import { PlatformError } from '@calibr/platform-connector'
import { createSpApiClient, loadConfigFromEnv, AmazonConnectorConfig } from './spapi-client'

export class AmazonConnector implements PlatformConnector {
  readonly platform = 'amazon' as const
  readonly name = 'Amazon'
  readonly version = '1.0.0'
  readonly capabilities: PlatformCapabilities = {
    supportsOAuth: false, // Amazon uses LWA, not OAuth
    supportsWebhooks: false, // Amazon uses polling/feeds
    supportsBatchUpdates: true,
    supportsInventoryTracking: true,
    supportsVariants: false, // Amazon doesn't have variants like Shopify
    supportsCompareAtPrice: false,
    maxBatchSize: 1000,
    rateLimit: {
      requestsPerSecond: 0.5, // Amazon has strict rate limits
      requestsPerDay: 10000,
    },
  }

  private config: PlatformConfig
  private credentials: PlatformCredentials | null = null
  private spClient: any = null

  constructor(config: PlatformConfig, credentials?: PlatformCredentials) {
    this.config = config
    if (credentials) {
      this.initialize(credentials)
    }
  }

  async isAuthenticated(): Promise<boolean> {
    return !!this.credentials && !!this.spClient
  }

  async initialize(credentials: PlatformCredentials): Promise<void> {
    this.credentials = credentials
    
    // Load Amazon-specific configuration
    const amazonConfig = loadConfigFromEnv()
    
    // Validate required credentials
    if (!amazonConfig.lwaClientId || !amazonConfig.lwaClientSecret) {
      throw new PlatformError('validation', 'Amazon LWA credentials are required', 'amazon')
    }

    // Create SP-API client
    this.spClient = createSpApiClient(amazonConfig)
    
    if (!this.spClient) {
      throw new PlatformError('authentication', 'Failed to create Amazon SP-API client', 'amazon')
    }
  }

  async disconnect(): Promise<void> {
    this.credentials = null
    this.spClient = null
  }

  async healthCheck(): Promise<PlatformHealth> {
    const startTime = Date.now()

    try {
      if (!this.spClient) {
        return {
          isHealthy: false,
          status: 'disconnected',
          lastChecked: new Date(),
          message: 'SP-API client not initialized',
          latency: Date.now() - startTime,
        }
      }

      // Make a lightweight API call to check connection
      // Using catalog items API as a health check
      await this.spClient.callAPI({
        operation: 'searchCatalogItems',
        query: { keywords: 'test', marketplaceIds: [loadConfigFromEnv().marketplaceId || 'ATVPDKIKX0DER'] }
      })

      return {
        isHealthy: true,
        status: 'connected',
        lastChecked: new Date(),
        latency: Date.now() - startTime,
      }
    } catch (error: any) {
      return {
        isHealthy: false,
        status: 'error',
        lastChecked: new Date(),
        message: error instanceof Error ? error.message : 'Unknown error',
        latency: Date.now() - startTime,
      }
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.spClient) return false
      
      // Test with a simple API call
      await this.spClient.callAPI({
        operation: 'searchCatalogItems',
        query: { keywords: 'test', marketplaceIds: [loadConfigFromEnv().marketplaceId || 'ATVPDKIKX0DER'] }
      })
      
      return true
    } catch {
      return false
    }
  }

  get auth(): AuthOperations {
    return {
      isAuthenticated: () => this.isAuthenticated(),
      getAuthStatus: async (): Promise<AuthStatus> => {
        const cfg = loadConfigFromEnv()
        const hasLwa = Boolean(cfg.lwaClientId && cfg.lwaClientSecret && cfg.refreshToken)
        return {
          platform: 'amazon',
          connected: hasLwa,
          details: {
            marketplaceId: cfg.marketplaceId,
            region: cfg.region,
            mode: hasLwa ? 'live' : 'dry-run',
          },
        }
      },
      authenticate: async (credentials: PlatformCredentials): Promise<void> => {
        await this.initialize(credentials)
      },
      revoke: async (): Promise<void> => {
        await this.disconnect()
      },
      getAuthorizationUrl: (): string => {
        throw new PlatformError('not_supported', 'Amazon uses LWA authentication, not OAuth', 'amazon')
      },
      handleOAuthCallback: async (): Promise<any> => {
        throw new PlatformError('not_supported', 'Amazon uses LWA authentication, not OAuth', 'amazon')
      },
    }
  }

  get products(): ProductOperations {
    return {
      list: async (filter?: ProductFilter) => {
        if (!this.spClient) {
          throw new PlatformError('authentication', 'Connector not initialized', 'amazon')
        }

        try {
          const cfg = loadConfigFromEnv()
          const marketplaceId = cfg.marketplaceId || 'ATVPDKIKX0DER'
          
          // Use Catalog Items API to search for products
          const response = await this.spClient.callAPI({
            operation: 'searchCatalogItems',
            query: {
              keywords: filter?.search || '',
              marketplaceIds: [marketplaceId],
              pageSize: filter?.limit || 50,
              pageToken: filter?.page ? String(filter.page) : undefined,
            }
          })

          const products = response.items?.map((item: any) => this.normalizeProduct(item)) || []

          return {
            data: products,
            pagination: {
              total: response.totalResultCount || products.length,
              page: filter?.page || 1,
              limit: filter?.limit || 50,
              hasNext: !!response.nextToken,
              hasPrev: false, // Amazon doesn't provide previous page info
            },
          }
        } catch (error) {
          throw new PlatformError(
            'server',
            `Failed to list Amazon products: ${error instanceof Error ? error.message : 'Unknown error'}`,
            'amazon',
            error instanceof Error ? error : undefined
          )
        }
      },

      get: async (externalId: string): Promise<Product> => {
        if (!this.spClient) {
          throw new PlatformError('authentication', 'Connector not initialized', 'amazon')
        }

        try {
          const cfg = loadConfigFromEnv()
          const marketplaceId = cfg.marketplaceId || 'ATVPDKIKX0DER'
          
          const response = await this.spClient.callAPI({
            operation: 'getCatalogItem',
            path: { asin: externalId },
            query: { marketplaceIds: [marketplaceId] }
          })

          return this.normalizeProduct(response)
        } catch (error) {
          throw new PlatformError(
            'not_found',
            `Amazon product not found: ${externalId}`,
            'amazon',
            error instanceof Error ? error : undefined
          )
        }
      },

      getBySku: async (params: ProductLookupParams): Promise<Product | null> => {
        const sku = params.sku
        const cfg = loadConfigFromEnv()
        const marketplaceId = cfg.marketplaceId || 'ATVPDKIKX0DER'
        
        if (!this.spClient) {
          // Return mock data for dry-run mode
          return {
            externalId: `B${sku}`,
            platform: 'amazon',
            title: `Amazon Product ${sku}`,
            description: '',
            vendor: 'Amazon',
            productType: 'Unknown',
            tags: [],
            status: 'active',
            images: [],
            variants: [{
              externalId: sku,
              sku,
              title: `Variant ${sku}`,
              price: 0,
              currency: 'USD',
              inventory: {
                quantity: 0,
                tracked: false,
                available: false,
              },
              options: {},
              barcode: '',
              imageUrl: '',
              metadata: { sku },
            }],
            createdAt: new Date(),
            updatedAt: new Date(),
            metadata: {
              marketplaceId,
              mode: 'dry-run',
            },
          }
        }

        try {
          // Search for product by SKU using Catalog Items API
          const response = await this.spClient.callAPI({
            operation: 'searchCatalogItems',
            query: {
              keywords: sku,
              marketplaceIds: [marketplaceId],
              pageSize: 1,
            }
          })

          if (response.items && response.items.length > 0) {
            return this.normalizeProduct(response.items[0])
          }

          return null
        } catch (error) {
          throw new PlatformError(
            'server',
            `Failed to search Amazon product by SKU: ${error instanceof Error ? error.message : 'Unknown error'}`,
            'amazon',
            error instanceof Error ? error : undefined
          )
        }
      },

      sync: async (productId: string, externalId: string): Promise<ProductSyncResult> => {
        try {
          const product = await this.get(externalId)
          
          // In a real implementation, this would update the local database
          return {
            productId,
            externalId,
            platform: 'amazon',
            success: true,
            syncedAt: new Date(),
          }
        } catch (error) {
          return {
            productId,
            externalId,
            platform: 'amazon',
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            syncedAt: new Date(),
          }
        }
      },

      syncAll: async (filter?: ProductFilter): Promise<ProductSyncResult[]> => {
        const results: ProductSyncResult[] = []
        let page = 1
        let hasMore = true

        while (hasMore) {
          const response = await this.list({ ...filter, page, limit: 50 })

          for (const product of response.data) {
            const result = await this.sync(`cal-${product.externalId}`, product.externalId)
            results.push(result)
          }

          hasMore = response.pagination.hasNext
          page++
        }

        return results
      },

      count: async (filter?: ProductFilter): Promise<ProductCountResult> => {
        try {
          const response = await this.list({ ...filter, limit: 1 })
          return {
            total: response.pagination.total || 0,
            platform: 'amazon',
          }
        } catch (error) {
          throw new PlatformError(
            'server',
            `Failed to get Amazon product count: ${error instanceof Error ? error.message : 'Unknown error'}`,
            'amazon',
            error instanceof Error ? error : undefined
          )
        }
      },
    }
  }

  get pricing(): PricingOperations {
    return {
      getPrice: async (externalId: string) => {
        if (!this.spClient) {
          throw new PlatformError('authentication', 'Connector not initialized', 'amazon')
        }

        try {
          // Amazon doesn't have a direct price API, prices are managed through feeds
          // This is a placeholder implementation
          return {
            externalId,
            platform: 'amazon',
            price: 0,
            currency: 'USD',
            updatedAt: new Date(),
            metadata: {
              note: 'Amazon prices are managed through feeds, not direct API calls',
            },
          }
        } catch (error) {
          throw new PlatformError(
            'not_found',
            `Amazon price not found: ${externalId}`,
            'amazon',
            error instanceof Error ? error : undefined
          )
        }
      },

      getPrices: async (externalIds: string[]) => {
        const prices = await Promise.all(externalIds.map((id) => this.pricing.getPrice(id)))
        return prices
      },

      updatePrice: async (update: PriceUpdate): Promise<PriceUpdateResult> => {
        if (!this.spClient) {
          throw new PlatformError('authentication', 'Connector not initialized', 'amazon')
        }

        try {
          // Delegate to local pricing util which handles dry-run vs real submission
          const { applyPriceChange } = await import('./pricing')
          const res = await applyPriceChange({
            skuCode: update.sku,
            currency: update.currency,
            amount: update.price,
            submit: true,
          })

          return {
            externalId: update.externalId,
            platform: 'amazon',
            success: res.ok,
            oldPrice: 0, // Amazon doesn't provide old price in response
            newPrice: update.price,
            currency: update.currency,
            updatedAt: new Date(),
            error: res.ok ? undefined : res.message,
            retryable: !res.ok && res.message.includes('rate limit'),
          }
        } catch (error) {
          return {
            externalId: update.externalId,
            platform: 'amazon',
            success: false,
            currency: update.currency,
            updatedAt: new Date(),
            error: error instanceof Error ? error.message : 'Unknown error',
            retryable: true,
          }
        }
      },

      batchUpdatePrices: async (batchUpdate: BatchPriceUpdate): Promise<BatchPriceUpdateResult> => {
        const results: PriceUpdateResult[] = []

        for (const update of batchUpdate.updates) {
          const result = await this.pricing.updatePrice(update)
          results.push(result)

          if (!result.success && batchUpdate.stopOnError) {
            break
          }
        }

        const successful = results.filter((r) => r.success).length
        const failed = results.filter((r) => !r.success).length

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
        }
      },

      validatePriceUpdate: async (update: PriceUpdate): Promise<PriceValidationResult> => {
        const errors: string[] = []

        // Validate price is positive
        if (update.price < 0) {
          errors.push('Price must be positive')
        }

        // Validate currency
        if (update.currency !== 'USD') {
          errors.push('Only USD currency is supported for Amazon')
        }

        // Validate SKU format (Amazon SKUs are typically alphanumeric)
        if (!/^[A-Z0-9\-_]+$/i.test(update.sku)) {
          errors.push('Invalid SKU format for Amazon')
        }

        return {
          valid: errors.length === 0,
          errors: errors.length > 0 ? errors : undefined,
        }
      },
    }
  }

  private normalizeProduct(amazonItem: any): Product {
    return {
      externalId: amazonItem.asin || amazonItem.productId,
      platform: 'amazon',
      title: amazonItem.title || amazonItem.itemName || 'Unknown Product',
      description: amazonItem.description || '',
      vendor: amazonItem.brand || 'Unknown',
      productType: amazonItem.productType || 'Unknown',
      tags: amazonItem.keywords ? amazonItem.keywords.split(',') : [],
      status: 'active',
      images: amazonItem.images?.map((img: any) => img.link) || [],
      variants: [{
        externalId: amazonItem.asin || amazonItem.productId,
        sku: amazonItem.sku || amazonItem.asin,
        title: amazonItem.title || 'Default Variant',
        price: 0, // Amazon prices are managed through feeds
        currency: 'USD',
        inventory: {
          quantity: 0,
          tracked: false,
          available: false,
        },
        options: {},
        barcode: amazonItem.ean || '',
        imageUrl: amazonItem.images?.[0]?.link || '',
        metadata: {
          asin: amazonItem.asin,
          sku: amazonItem.sku,
        },
      }],
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        asin: amazonItem.asin,
        marketplaceId: loadConfigFromEnv().marketplaceId,
      },
    }
  }
}
