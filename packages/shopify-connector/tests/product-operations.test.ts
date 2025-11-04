/**
 * Shopify Product Operations Tests
 * Tests for product listing, retrieval, and syncing
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ShopifyProductOperations } from '../src/ShopifyProductOperations'
import { ShopifyConnector } from '../src/ShopifyConnector'
import { ShopifyConfig, ShopifyCredentials } from '../src/ShopifyConnector'

describe('ShopifyProductOperations', () => {
  let connector: ShopifyConnector
  let operations: ShopifyProductOperations
  let mockClient: any

  beforeEach(async () => {
    const config: ShopifyConfig = {
      platform: 'shopify' as const,
      apiKey: 'test-api-key',
      apiSecret: 'test-api-secret',
      scopes: ['read_products', 'write_products'],
      webhookSecret: 'test-webhook-secret',
      apiVersion: '2024-10',
    }

    const credentials: ShopifyCredentials = {
      platform: 'shopify' as const,
      shopDomain: 'test-store.myshopify.com',
      accessToken: 'test-access-token',
    }

    connector = new ShopifyConnector(config)
    await connector.initialize(credentials)

    // Get the operations instance
    operations = connector.products as ShopifyProductOperations

    // Mock the underlying services
    const mockUnderlyingProducts = {
      listProducts: vi.fn(),
      getProduct: vi.fn(),
      getProductByHandle: vi.fn(),
      getProductCount: vi.fn(),
      searchProducts: vi.fn(),
    }

    const mockUnderlyingPricing = {
      updateVariantPrice: vi.fn(),
      updateVariantPrices: vi.fn(),
    }

    // Set the mocked underlying services
    connector['underlyingProducts'] = mockUnderlyingProducts
    connector['underlyingPricing'] = mockUnderlyingPricing

    // Mock the client
    mockClient = {
      get: vi.fn(),
      post: vi.fn(),
    }
    connector['client'] = mockClient
  })

  describe('list', () => {
    it('should list products with default filters', async () => {
      const mockResponse = {
        products: [
          { id: 101, title: 'Test Product', vendor: 'Test', status: 'active' },
        ],
      }

      connector['underlyingProducts'].listProducts.mockResolvedValue(mockResponse)

      const result = await operations.list()

      expect(connector['underlyingProducts'].listProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 50,
        })
      )
      expect(result.data).toHaveLength(1)
      expect(result.data[0].externalId).toBe('101')
    })

    it('should list products with custom limit', async () => {
      const mockResponse = { products: [] }
      connector['underlyingProducts'].listProducts.mockResolvedValue(mockResponse)

      await operations.list({ limit: 10 })

      expect(connector['underlyingProducts'].listProducts).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 10 })
      )
    })

    it('should handle pagination', async () => {
      const mockResponse = {
        products: [],
        page_info: { has_next_page: true },
      }
      connector['underlyingProducts'].listProducts.mockResolvedValue(mockResponse)

      // Test cursor-based pagination with since_id
      const result = await operations.list({ limit: 50 })

      expect(connector['underlyingProducts'].listProducts).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 50 })
      )
      // Verify page parameter is NOT included
      expect(connector['underlyingProducts'].listProducts).toHaveBeenCalledWith(
        expect.not.objectContaining({ page: expect.anything() })
      )
      expect(result.pagination.hasNext).toBe(true)
    })

    it('should handle errors', async () => {
      connector['underlyingProducts'].listProducts.mockRejectedValue(new Error('Network error'))

      await expect(operations.list()).rejects.toThrow()
    })
  })

  describe('get', () => {
    it('should get a single product by ID', async () => {
      const mockResponse = {
        id: 101,
        title: 'Test Product',
        body_html: '<p>Description</p>',
        vendor: 'Test Vendor',
        product_type: 'Test Type',
        tags: 'test, product',
        status: 'active',
        handle: 'test-product',
        variants: [],
        images: [],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      }

      connector['underlyingProducts'].getProduct.mockResolvedValue(mockResponse)

      const product = await operations.get('101')

      expect(connector['underlyingProducts'].getProduct).toHaveBeenCalledWith('101')
      expect(product.externalId).toBe('101')
      expect(product.title).toBe('Test Product')
    })

    it('should throw error when product not found', async () => {
      connector['underlyingProducts'].getProduct.mockRejectedValue(new Error('Product not found'))

      await expect(operations.get('999')).rejects.toThrow()
    })
  })

  describe('getBySku', () => {
    it('should find product by SKU', async () => {
      const searchResponse = {
        products: [
          {
            id: 101,
            title: 'Test Product',
            vendor: 'Test',
            status: 'active',
            tags: 'test',
            body_html: '<p>Description</p>',
            product_type: 'Test Type',
            handle: 'test-product',
            variants: [
              {
                id: 201,
                product_id: 101,
                sku: 'TEST-SKU-001',
              },
            ],
            images: [],
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-02T00:00:00Z',
          },
        ],
      }

      connector['underlyingProducts'].searchProducts.mockResolvedValue(searchResponse)

      const product = await operations.getBySku('TEST-SKU-001')

      expect(connector['underlyingProducts'].searchProducts).toHaveBeenCalledWith('TEST-SKU-001')
      expect(product).toBeDefined()
      expect(product?.externalId).toBe('101')
    })

    it('should return null when SKU not found', async () => {
      connector['underlyingProducts'].searchProducts.mockResolvedValue({ products: [] })

      const product = await operations.getBySku('NONEXISTENT-SKU')

      expect(product).toBeNull()
    })
  })

  describe('sync', () => {
    it('should sync a single product', async () => {
      const mockProductResponse = {
        id: 101,
        title: 'Test Product',
        vendor: 'Test',
        status: 'active',
        tags: 'test',
        body_html: '<p>Description</p>',
        product_type: 'Test Type',
        handle: 'test-product',
        variants: [
          {
            id: 201,
            price: '29.99',
            sku: 'TEST-SKU-001',
            inventory_quantity: 10,
          },
        ],
        images: [],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      }

      connector['underlyingProducts'].getProduct.mockResolvedValue(mockProductResponse)

      const result = await operations.sync('cal-101', '101')

      expect(connector['underlyingProducts'].getProduct).toHaveBeenCalledWith('101')
      expect(result.externalId).toBe('101')
      expect(result.platform).toBe('shopify')
      expect(result.success).toBe(true)
    })

    it('should handle sync errors', async () => {
      connector['underlyingProducts'].getProduct.mockRejectedValue(new Error('Sync failed'))

      const result = await operations.sync('cal-101', '101')

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('syncAll', () => {
    it('should sync all products', async () => {
      const mockListResponse = {
        products: [
          {
            id: 101,
            title: 'Product 1',
            vendor: 'Test',
            status: 'active',
            tags: 'test',
            body_html: '<p>Description</p>',
            product_type: 'Test Type',
            handle: 'product-1',
            variants: [],
            images: [],
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-02T00:00:00Z',
          },
          {
            id: 102,
            title: 'Product 2',
            vendor: 'Test',
            status: 'active',
            tags: 'test',
            body_html: '<p>Description</p>',
            product_type: 'Test Type',
            handle: 'product-2',
            variants: [],
            images: [],
            created_at: '2024-01-03T00:00:00Z',
            updated_at: '2024-01-04T00:00:00Z',
          },
        ],
        page_info: { has_next_page: false },
      }

      connector['underlyingProducts'].listProducts.mockResolvedValue(mockListResponse)

      const results = await operations.syncAll({ limit: 50 })

      expect(connector['underlyingProducts'].listProducts).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 50 })
      )
      expect(results).toHaveLength(2)
      expect(results[0].externalId).toBe('101')
      expect(results[1].externalId).toBe('102')
    })

    it('should respect limit parameter', async () => {
      const mockResponse = {
        products: [],
        page_info: { has_next_page: false },
      }

      connector['underlyingProducts'].listProducts.mockResolvedValue(mockResponse)

      await operations.syncAll({ limit: 25 })

      expect(connector['underlyingProducts'].listProducts).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 25 })
      )
    })
  })

  describe('count', () => {
    it('should count products', async () => {
      connector['underlyingProducts'].getProductCount.mockResolvedValue(42)

      const count = await operations.count()

      expect(connector['underlyingProducts'].getProductCount).toHaveBeenCalled()
      expect(count).toBe(42)
    })

    it('should handle count with filters', async () => {
      connector['underlyingProducts'].getProductCount.mockResolvedValue(10)

      const count = await operations.count({ vendor: 'Test Vendor' })

      expect(connector['underlyingProducts'].getProductCount).toHaveBeenCalled()
      expect(count).toBe(10)
    })
  })
})

