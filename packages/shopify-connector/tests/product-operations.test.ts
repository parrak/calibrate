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

      mockClient.get.mockResolvedValue(mockResponse)

      const result = await operations.list()

      expect(mockClient.get).toHaveBeenCalledWith(
        '/products.json',
        expect.objectContaining({
          limit: 50,
          page: 1,
        })
      )
      expect(result.data).toHaveLength(1)
      expect(result.data[0].externalId).toBe('101')
    })

    it('should list products with custom limit', async () => {
      const mockResponse = { products: [] }
      mockClient.get.mockResolvedValue(mockResponse)

      await operations.list({ limit: 10 })

      expect(mockClient.get).toHaveBeenCalledWith(
        '/products.json',
        expect.objectContaining({ limit: 10 })
      )
    })

    it('should handle pagination', async () => {
      const mockResponse = {
        products: [],
        pagination: { hasNext: true },
      }
      mockClient.get.mockResolvedValue(mockResponse)

      const result = await operations.list({ page: 2 })

      expect(mockClient.get).toHaveBeenCalledWith(
        '/products.json',
        expect.objectContaining({ page: 2 })
      )
    })

    it('should handle errors', async () => {
      mockClient.get.mockRejectedValue(new Error('Network error'))

      await expect(operations.list()).rejects.toThrow()
    })
  })

  describe('get', () => {
    it('should get a single product by ID', async () => {
      const mockResponse = {
        product: {
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
        },
      }

      mockClient.get.mockResolvedValue(mockResponse)

      const product = await operations.get('101')

      expect(mockClient.get).toHaveBeenCalledWith('/products/101.json')
      expect(product.externalId).toBe('101')
      expect(product.title).toBe('Test Product')
    })

    it('should throw error when product not found', async () => {
      mockClient.get.mockRejectedValue(new Error('Product not found'))

      await expect(operations.get('999')).rejects.toThrow()
    })
  })

  describe('getBySku', () => {
    it('should find product by SKU', async () => {
      const searchResponse = {
        variants: [
          {
            id: 201,
            product_id: 101,
            sku: 'TEST-SKU-001',
          },
        ],
      }

      const productResponse = {
        product: {
          id: 101,
          title: 'Test Product',
          vendor: 'Test',
          status: 'active',
          tags: 'test',
          body_html: '<p>Description</p>',
          product_type: 'Test Type',
          handle: 'test-product',
          variants: [],
          images: [],
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
        },
      }

      mockClient.get
        .mockResolvedValueOnce(searchResponse)
        .mockResolvedValueOnce(productResponse)

      const product = await operations.getBySku('TEST-SKU-001')

      expect(product).toBeDefined()
      expect(product?.externalId).toBe('101')
    })

    it('should return null when SKU not found', async () => {
      mockClient.get.mockResolvedValue({ variants: [] })

      const product = await operations.getBySku('NONEXISTENT-SKU')

      expect(product).toBeNull()
    })
  })

  describe('sync', () => {
    it('should sync a single product', async () => {
      const mockProductResponse = {
        product: {
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
        },
      }

      mockClient.get.mockResolvedValue(mockProductResponse)

      const result = await operations.sync('cal-101', '101')

      expect(result.externalId).toBe('101')
      expect(result.platform).toBe('shopify')
      expect(result.success).toBe(true)
    })

    it('should handle sync errors', async () => {
      mockClient.get.mockRejectedValue(new Error('Sync failed'))

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
        pagination: { hasNext: false },
      }

      mockClient.get.mockResolvedValue(mockListResponse)

      const results = await operations.syncAll({ limit: 50 })

      expect(results).toHaveLength(2)
      expect(results[0].externalId).toBe('101')
      expect(results[1].externalId).toBe('102')
    })

    it('should respect limit parameter', async () => {
      const mockResponse = {
        products: [],
        pagination: { hasNext: false },
      }

      mockClient.get.mockResolvedValue(mockResponse)

      await operations.syncAll({ limit: 25 })

      expect(mockClient.get).toHaveBeenCalledWith(
        '/products.json',
        expect.objectContaining({ limit: 25 })
      )
    })
  })

  describe('count', () => {
    it('should count products', async () => {
      const mockResponse = { count: 42 }
      mockClient.get.mockResolvedValue(mockResponse)

      const count = await operations.count()

      expect(mockClient.get).toHaveBeenCalledWith(
        '/products/count.json',
        expect.any(Object)
      )
      expect(count).toBe(42)
    })

    it('should handle count with filters', async () => {
      const mockResponse = { count: 10 }
      mockClient.get.mockResolvedValue(mockResponse)

      const count = await operations.count({ vendor: 'Test Vendor' })

      expect(mockClient.get).toHaveBeenCalled()
      expect(count).toBe(10)
    })
  })
})

