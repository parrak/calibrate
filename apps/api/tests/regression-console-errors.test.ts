/**
 * Regression Tests for Console Website Errors
 * 
 * Tests fixes for:
 * - Price changes API 400 errors
 * - Catalog API 500 errors
 * - Analytics API 404 errors
 * - Shopify sync 500 errors (missing SHOPIFY_WEBHOOK_SECRET)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET as catalogRoute } from '../app/api/v1/catalog/route'
import { GET as analyticsRoute } from '../app/api/v1/analytics/[projectId]/route'
import { POST as shopifySyncRoute } from '../app/api/platforms/shopify/sync/route'
import { buildShopifyConnectorConfig } from '../lib/shopify-connector'

// Mock Prisma - create a shared mock client
const createMockPrismaClient = () => {
  const mockProject = {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
  }
  const mockProduct = {
    findFirst: vi.fn(),
    findMany: vi.fn(),
  }

  return {
    project: mockProject,
    product: mockProduct,
  }
}

const mockPrismaClient = createMockPrismaClient()

vi.mock('@calibr/db', () => ({
  prisma: vi.fn(() => mockPrismaClient),
}))

// Mock analytics package - use the same relative path as the route imports
// Route imports from: '../../../../../../../packages/analytics/index'
// From test file, we need to match the module resolution
const mockGetAnalyticsOverview = vi.fn().mockResolvedValue({
  summary: {
    totalSkus: 10,
    totalPriceChanges: 5,
    approvalRate: 0.8,
    averageChangePerDay: 0.5,
  },
  trends: {
    priceChanges: { current: 3, previous: 2, direction: 'up', changePercent: 50 },
    averagePrice: { current: 10000, previous: 9500, direction: 'up', changePercent: 5.26 },
  },
  topPerformers: {
    byMargin: [],
    bySales: [],
  },
})

// Mock using the exact relative path the route uses
vi.mock('../../../../../../../packages/analytics/index', () => ({
  getAnalyticsOverview: mockGetAnalyticsOverview,
}))

// Mock shopify connector
vi.mock('../lib/shopify-connector', async () => {
  const actual = await vi.importActual('../lib/shopify-connector')
  return {
    ...actual,
    initializeShopifyConnector: vi.fn().mockResolvedValue({
      testConnection: vi.fn().mockResolvedValue(true),
      getConnectionStatus: vi.fn().mockResolvedValue({ connected: true }),
    }),
  }
})

describe('Console Errors Regression Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset environment variables
    delete process.env.SHOPIFY_WEBHOOK_SECRET
    process.env.SHOPIFY_API_KEY = 'test-key'
    process.env.SHOPIFY_API_SECRET = 'test-secret'
    // Reset Prisma mocks
    mockPrismaClient.project.findUnique.mockReset()
    mockPrismaClient.project.findFirst.mockReset()
    mockPrismaClient.product.findFirst.mockReset()
    mockPrismaClient.product.findMany.mockReset()
    // Reset analytics mock
    mockGetAnalyticsOverview.mockResolvedValue({
      summary: {
        totalSkus: 10,
        totalPriceChanges: 5,
        approvalRate: 0.8,
        averageChangePerDay: 0.5,
      },
      trends: {
        priceChanges: { current: 3, previous: 2, direction: 'up', changePercent: 50 },
        averagePrice: { current: 10000, previous: 9500, direction: 'up', changePercent: 5.26 },
      },
      topPerformers: {
        byMargin: [],
        bySales: [],
      },
    })
  })

  describe('Catalog API - Error Handling', () => {
    it('should handle missing project parameter gracefully', async () => {
      const req = new NextRequest('http://localhost/api/v1/catalog')
      const response = await catalogRoute(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('project required')
    })

    it('should handle project not found', async () => {
      mockPrismaClient.project.findUnique.mockResolvedValue(null)

      const req = new NextRequest('http://localhost/api/v1/catalog?project=nonexistent')
      const response = await catalogRoute(req)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('project not found')
    })

    it('should handle database errors gracefully', async () => {
      mockPrismaClient.project.findUnique.mockRejectedValue(new Error('Database connection failed'))

      const req = new NextRequest('http://localhost/api/v1/catalog?project=demo')
      const response = await catalogRoute(req)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch catalog')
      expect(data.message).toBe('Database connection failed')
    })

    it('should return products successfully', async () => {
      const mockProject = { id: 'project-1', slug: 'demo' }
      const mockProducts = [
        {
          id: 'product-1',
          code: 'PROD-1',
          name: 'Test Product',
          Sku: [
            {
              code: 'SKU-1',
              Price: [{ currency: 'USD', amount: 10000 }],
            },
          ],
          createdAt: new Date(),
        },
      ]

      mockPrismaClient.project.findUnique.mockResolvedValue(mockProject)
      mockPrismaClient.product.findMany.mockResolvedValue(mockProducts)

      const req = new NextRequest('http://localhost/api/v1/catalog?project=demo')
      const response = await catalogRoute(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.products).toBeDefined()
      expect(Array.isArray(data.products)).toBe(true)
    })
  })

  describe('Analytics API - Slug Support', () => {
    it('should accept project slug and resolve to projectId', async () => {
      const mockProject = { id: 'project-123', slug: 'demo' }
      mockPrismaClient.project.findFirst.mockResolvedValue(mockProject)

      const req = new NextRequest('http://localhost/api/v1/analytics/demo?days=30')
      const response = await analyticsRoute(req, {
        params: Promise.resolve({ projectId: 'demo' }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.summary).toBeDefined()
      expect(mockPrismaClient.project.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [{ id: 'demo' }, { slug: 'demo' }],
        },
      })
    })

    it('should accept projectId directly', async () => {
      const mockProject = { id: 'project-123', slug: 'demo' }
      mockPrismaClient.project.findFirst.mockResolvedValue(mockProject)

      const req = new NextRequest('http://localhost/api/v1/analytics/project-123?days=30')
      const response = await analyticsRoute(req, {
        params: Promise.resolve({ projectId: 'project-123' }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.summary).toBeDefined()
    })

    it('should return 404 for non-existent project', async () => {
      mockPrismaClient.project.findFirst.mockResolvedValue(null)

      const req = new NextRequest('http://localhost/api/v1/analytics/nonexistent?days=30')
      const response = await analyticsRoute(req, {
        params: Promise.resolve({ projectId: 'nonexistent' }),
      })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Project not found')
    })

    it('should validate days parameter', async () => {
      const mockProject = { id: 'project-123', slug: 'demo' }
      mockPrismaClient.project.findFirst.mockResolvedValue(mockProject)

      const req = new NextRequest('http://localhost/api/v1/analytics/demo?days=500')
      const response = await analyticsRoute(req, {
        params: Promise.resolve({ projectId: 'demo' }),
      })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Days must be between 1 and 365')
    })
  })

  describe('Shopify Sync - Optional Webhook Secret', () => {
    it('should build config without SHOPIFY_WEBHOOK_SECRET', () => {
      delete process.env.SHOPIFY_WEBHOOK_SECRET

      const config = buildShopifyConnectorConfig(true)

      expect(config.apiKey).toBe('test-key')
      expect(config.apiSecret).toBe('test-secret')
      // webhookSecret defaults to empty string to satisfy TypeScript type requirements
      expect(config.webhookSecret).toBe('')
      expect(config.isActive).toBe(true)
    })

    it('should use SHOPIFY_WEBHOOK_SECRET when provided', () => {
      process.env.SHOPIFY_WEBHOOK_SECRET = 'test-webhook-secret'

      const config = buildShopifyConnectorConfig(true)

      expect(config.webhookSecret).toBe('test-webhook-secret')
    })

    it('should still require SHOPIFY_API_KEY and SHOPIFY_API_SECRET', () => {
      delete process.env.SHOPIFY_API_KEY

      expect(() => buildShopifyConnectorConfig(true)).toThrow(
        'Missing required environment variable: SHOPIFY_API_KEY'
      )
    })
  })

  describe('Price Changes API - API Base URL', () => {
    it('should require project parameter', async () => {
      const { GET } = await import('../app/api/v1/price-changes/route')
      const req = new NextRequest('http://localhost/api/v1/price-changes')
      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('BadRequest')
      expect(data.message).toContain('project')
    })

    it('should require authentication token', async () => {
      const mockProject = { id: 'project-1', slug: 'demo' }
      mockPrismaClient.project.findUnique.mockResolvedValue(mockProject)

      const { GET } = await import('../app/api/v1/price-changes/route')
      const req = new NextRequest('http://localhost/api/v1/price-changes?project=demo')
      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })
  })
})

