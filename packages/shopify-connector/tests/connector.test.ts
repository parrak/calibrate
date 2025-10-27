/**
 * Shopify Connector Core Tests
 * Tests for connector initialization, authentication, and lifecycle
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ShopifyConnector } from '../src/ShopifyConnector'
import { ShopifyCredentials, ShopifyConfig } from '../src/ShopifyConnector'

describe('ShopifyConnector', () => {
  let config: ShopifyConfig
  let credentials: ShopifyCredentials

  beforeEach(() => {
    config = {
      platform: 'shopify' as const,
      apiKey: 'test-api-key',
      apiSecret: 'test-api-secret',
      scopes: ['read_products', 'write_products'],
      webhookSecret: 'test-webhook-secret',
      apiVersion: '2024-10',
    }

    credentials = {
      platform: 'shopify' as const,
      shopDomain: 'test-store.myshopify.com',
      accessToken: 'test-access-token',
    }
  })

  describe('Constructor', () => {
    it('should create connector instance with config only', () => {
      const connector = new ShopifyConnector(config)
      expect(connector.config).toEqual(config)
      expect(connector.platform).toBe('shopify')
      expect(connector.name).toBe('Shopify')
      expect(connector.version).toBe('1.0.0')
    })

    it('should create connector instance with config and credentials', async () => {
      const connector = new ShopifyConnector(config, credentials)
      expect(connector.config).toEqual(config)
    })

    it('should have correct capabilities', () => {
      const connector = new ShopifyConnector(config)
      expect(connector.capabilities.supportsOAuth).toBe(true)
      expect(connector.capabilities.supportsWebhooks).toBe(true)
      expect(connector.capabilities.supportsBatchUpdates).toBe(true)
      expect(connector.capabilities.supportsInventoryTracking).toBe(true)
      expect(connector.capabilities.supportsVariants).toBe(true)
      expect(connector.capabilities.supportsCompareAtPrice).toBe(true)
      expect(connector.capabilities.maxBatchSize).toBe(100)
    })
  })

  describe('isAuthenticated', () => {
    it('should return false when not initialized', async () => {
      const connector = new ShopifyConnector(config)
      const isAuth = await connector.isAuthenticated()
      expect(isAuth).toBe(false)
    })

    it('should return true when credentials are provided', async () => {
      const connector = new ShopifyConnector(config)
      await connector.initialize(credentials)
      const isAuth = await connector.isAuthenticated()
      expect(isAuth).toBe(true)
    })
  })

  describe('initialize', () => {
    it('should initialize connector with credentials', async () => {
      const connector = new ShopifyConnector(config)
      await connector.initialize(credentials)
      const isAuth = await connector.isAuthenticated()
      expect(isAuth).toBe(true)
    })

    it('should throw error when shop domain is missing', async () => {
      const connector = new ShopifyConnector(config)
      const invalidCredentials = {
        platform: 'shopify' as const,
        shopDomain: '',
        accessToken: 'test-token',
      }

      await expect(connector.initialize(invalidCredentials)).rejects.toThrow()
    })

    it('should throw error when access token is missing', async () => {
      const connector = new ShopifyConnector(config)
      const invalidCredentials = {
        platform: 'shopify' as const,
        shopDomain: 'test-store.myshopify.com',
        accessToken: '',
      }

      await expect(connector.initialize(invalidCredentials)).rejects.toThrow()
    })
  })

  describe('disconnect', () => {
    it('should disconnect connector and clear credentials', async () => {
      const connector = new ShopifyConnector(config, credentials)
      expect(await connector.isAuthenticated()).toBe(true)

      await connector.disconnect()

      expect(await connector.isAuthenticated()).toBe(false)
    })
  })

  describe('healthCheck', () => {
    it('should return unhealthy status when not initialized', async () => {
      const connector = new ShopifyConnector(config)
      const health = await connector.healthCheck()

      expect(health.isHealthy).toBe(false)
      expect(health.status).toBe('disconnected')
      expect(health.message).toBe('Client not initialized')
    })

    it('should return healthy status when connected', async () => {
      const connector = new ShopifyConnector(config)
      await connector.initialize(credentials)
      
      // Mock client.get to simulate successful API call
      const mockClient = {
        get: vi.fn().mockResolvedValue({ data: {} }),
      }
      connector['client'] = mockClient as any

      const health = await connector.healthCheck()

      expect(health.isHealthy).toBe(true)
      expect(health.status).toBe('connected')
      expect(mockClient.get).toHaveBeenCalledWith('/shop.json')
    })

    it('should return error status on API failure', async () => {
      const connector = new ShopifyConnector(config)
      await connector.initialize(credentials)
      
      // Mock client.get to simulate failed API call
      const mockClient = {
        get: vi.fn().mockRejectedValue(new Error('Network error')),
      }
      connector['client'] = mockClient as any

      const health = await connector.healthCheck()

      expect(health.isHealthy).toBe(false)
      expect(health.status).toBe('error')
      expect(health.message).toBe('Network error')
    })
  })

  describe('testConnection', () => {
    it('should return false when not initialized', async () => {
      const connector = new ShopifyConnector(config)
      const connected = await connector.testConnection()
      expect(connected).toBe(false)
    })

    it('should return true when connection works', async () => {
      const connector = new ShopifyConnector(config)
      await connector.initialize(credentials)
      
      const mockClient = {
        get: vi.fn().mockResolvedValue({ data: {} }),
      }
      connector['client'] = mockClient as any

      const connected = await connector.testConnection()
      expect(connected).toBe(true)
    })

    it('should return false when connection fails', async () => {
      const connector = new ShopifyConnector(config)
      await connector.initialize(credentials)
      
      const mockClient = {
        get: vi.fn().mockRejectedValue(new Error('Failed')),
      }
      connector['client'] = mockClient as any

      const connected = await connector.testConnection()
      expect(connected).toBe(false)
    })
  })

  describe('getters', () => {
    it('should throw error when accessing auth before initialization', () => {
      const connector = new ShopifyConnector(config)
      expect(() => connector.auth).toThrow('Connector not initialized')
    })

    it('should throw error when accessing products before initialization', () => {
      const connector = new ShopifyConnector(config)
      expect(() => connector.products).toThrow('Connector not initialized')
    })

    it('should throw error when accessing pricing before initialization', () => {
      const connector = new ShopifyConnector(config)
      expect(() => connector.pricing).toThrow('Connector not initialized')
    })

    it('should return auth operations after initialization', async () => {
      const connector = new ShopifyConnector(config)
      await connector.initialize(credentials)
      
      expect(connector.auth).toBeDefined()
      expect(connector.products).toBeDefined()
      expect(connector.pricing).toBeDefined()
    })
  })

  describe('getConnectionStatus', () => {
    it('should return connection status', async () => {
      const connector = new ShopifyConnector(config)
      await connector.initialize(credentials)
      
      const mockClient = {
        get: vi.fn().mockResolvedValue({ data: { shop: {} } }),
        getRateLimit: vi.fn().mockReturnValue({ limit: 40, remaining: 20 }),
      }
      connector['client'] = mockClient as any

      const status = await connector.getConnectionStatus()

      expect(status.connected).toBe(true)
      expect(status.rateLimit).toBeDefined()
      expect(status.shopInfo).toBeDefined()
    })
  })
})

