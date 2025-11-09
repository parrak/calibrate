import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  priceChangesApi,
  catalogApi,
  competitorsApi,
  platformsApi,
  healthApi,
  ApiError,
} from './api-client'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('ApiError', () => {
    it('should create ApiError with message and status', () => {
      const error = new ApiError('Test error', 404, { detail: 'Not found' })
      expect(error.message).toBe('Test error')
      expect(error.status).toBe(404)
      expect(error.data).toEqual({ detail: 'Not found' })
      expect(error.name).toBe('ApiError')
    })
  })

  describe('priceChangesApi', () => {
    it('should list price changes', async () => {
      const mockData = { items: [{ id: '1', status: 'PENDING' }] }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      })

      const result = await priceChangesApi.list('demo', 'token-123')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/price-changes?project=demo'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer token-123',
          }),
        })
      )
      expect(result).toEqual(mockData.items)
    })

    it('should approve price change', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      await priceChangesApi.approve('pc-123', 'token-123')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/price-changes/pc-123/approve'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer token-123',
          }),
        })
      )
    })

    it('should reject price change', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      await priceChangesApi.reject('pc-123', 'token-123')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/price-changes/pc-123/reject'),
        expect.objectContaining({ method: 'POST' })
      )
    })

    it('should apply price change', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      await priceChangesApi.apply('pc-123', 'token-123')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/price-changes/pc-123/apply'),
        expect.objectContaining({ method: 'POST' })
      )
    })

    it('should rollback price change', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      await priceChangesApi.rollback('pc-123', 'token-123')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/price-changes/pc-123/rollback'),
        expect.objectContaining({ method: 'POST' })
      )
    })

    it('should throw ApiError on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ error: 'Price change not found' }),
      })

      await expect(priceChangesApi.approve('pc-123')).rejects.toThrow(ApiError)
    })
  })

  describe('catalogApi', () => {
    it('should get single product', async () => {
      const mockProduct = { code: 'PROD-001', name: 'Product' }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockProduct,
      })

      const result = await catalogApi.getProduct('PROD-001')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/catalog?productCode=PROD-001'),
        expect.any(Object)
      )
      expect(result).toEqual(mockProduct)
    })

    it('should list products and normalize response', async () => {
      const mockResponse = {
        products: [
          {
            product: { code: 'P1', name: 'Product 1' },
            skus: [{ code: 'S1', prices: [] }],
          },
          {
            product: { code: 'P2', name: 'Product 2' },
            skus: [{ code: 'S2', prices: [] }],
          },
        ],
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await catalogApi.listProducts('demo')

      expect(result).toEqual([
        { code: 'P1', name: 'Product 1', skus: [{ code: 'S1', prices: [] }] },
        { code: 'P2', name: 'Product 2', skus: [{ code: 'S2', prices: [] }] },
      ])
    })
  })

  describe('competitorsApi', () => {
    it('should list competitors', async () => {
      const mockCompetitors = { competitors: [{ id: '1', name: 'Competitor 1' }] }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCompetitors,
      })

      const result = await competitorsApi.list('demo')

      expect(result).toEqual(mockCompetitors.competitors)
    })

    it('should get competitor by id', async () => {
      const mockCompetitor = { competitor: { id: '1', name: 'Competitor' } }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCompetitor,
      })

      const result = await competitorsApi.get('comp-1')

      expect(result).toEqual(mockCompetitor.competitor)
    })

    it('should get competitor products', async () => {
      const mockProducts = { products: [{ id: 'p1' }] }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockProducts,
      })

      const result = await competitorsApi.getProducts('comp-1')

      expect(result).toEqual(mockProducts.products)
    })

    it('should monitor competitors', async () => {
      const mockResults = { results: [{ status: 'success' }] }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResults,
      })

      const result = await competitorsApi.monitor('comp-1', 'demo')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/competitors/monitor'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ competitorId: 'comp-1', projectSlug: 'demo' }),
        })
      )
      expect(result).toEqual({ results: mockResults.results })
    })

    it('should get competitor rules', async () => {
      const mockRules = { rules: [{ id: 'r1' }] }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRules,
      })

      const result = await competitorsApi.getRules('demo')

      expect(result).toEqual(mockRules.rules)
    })
  })

  describe('platformsApi', () => {
    it('should list platforms', async () => {
      const mockData = { platforms: [], count: 0 }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      })

      const result = await platformsApi.list()

      expect(result).toEqual(mockData)
    })

    it('should get platform status', async () => {
      const mockStatus = { platform: 'shopify', integration: null, isConnected: false }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStatus,
      })

      const result = await platformsApi.getStatus('shopify', 'demo')

      expect(result).toEqual(mockStatus)
    })

    it('should connect platform', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      await platformsApi.connect('shopify', 'demo', 'My Shop', { apiKey: 'key' })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/platforms/shopify'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            projectSlug: 'demo',
            platformName: 'My Shop',
            credentials: { apiKey: 'key' },
          }),
        })
      )
    })

    it('should disconnect platform', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      await platformsApi.disconnect('shopify', 'demo')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/platforms/shopify?project=demo'),
        expect.objectContaining({ method: 'DELETE' })
      )
    })

    it('should trigger sync', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      await platformsApi.triggerSync('shopify', 'demo', 'incremental')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/platforms/shopify/sync'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ projectSlug: 'demo', syncType: 'incremental' }),
        })
      )
    })

    it('should get sync status', async () => {
      const mockSyncStatus = {
        success: true,
        integration: { id: 'int-1', platformName: 'shop', status: 'ACTIVE' },
        syncLogs: [],
      }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSyncStatus,
      })

      const result = await platformsApi.getSyncStatus('shopify', 'demo')

      expect(result).toEqual(mockSyncStatus)
    })
  })

  describe('healthApi', () => {
    it('should check health', async () => {
      const mockHealth = { status: 'ok', timestamp: '2024-01-01', service: 'api' }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockHealth,
      })

      const result = await healthApi.check()

      expect(result).toEqual(mockHealth)
    })
  })

  describe('Error handling', () => {
    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(priceChangesApi.list('demo')).rejects.toThrow('Network error')
    })

    it('should handle non-ok responses without error field', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({}),
      })

      await expect(priceChangesApi.list('demo')).rejects.toThrow(
        'API error: Internal Server Error'
      )
    })

    it('should handle responses with error field', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Bad request' }),
      })

      await expect(priceChangesApi.list('demo')).rejects.toThrow('Bad request')
    })
  })
})
