/**
 * Shopify Connector Tests
 * Tests for the main ShopifyConnector implementing PlatformConnector interface
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ShopifyConnector, ShopifyCredentials, ShopifyConfig } from '../src/ShopifyConnector';
import { PlatformError } from '@calibr/platform-connector';

// Mock the dependencies
vi.mock('../src/client', () => ({
  ShopifyClient: vi.fn().mockImplementation(() => ({
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    getRateLimit: vi.fn(() => null),
    waitIfNeeded: vi.fn(),
  })),
}));

vi.mock('../src/auth', () => ({
  ShopifyAuth: vi.fn().mockImplementation(() => ({
    generateAuthUrl: vi.fn(),
    exchangeCodeForToken: vi.fn(),
    verifyWebhookSignature: vi.fn(),
  })),
}));

vi.mock('../src/products', () => ({
  ShopifyProducts: vi.fn().mockImplementation(() => ({
    listProducts: vi.fn(),
    getProduct: vi.fn(),
    getProductCount: vi.fn(),
  })),
}));

vi.mock('../src/pricing', () => ({
  ShopifyPricing: vi.fn().mockImplementation(() => ({
    updateVariantPrice: vi.fn(),
    updateVariantPricesBulk: vi.fn(),
  })),
}));

vi.mock('../src/webhooks', () => ({
  ShopifyWebhooks: vi.fn().mockImplementation(() => ({
    createWebhook: vi.fn(),
    listWebhooks: vi.fn(),
  })),
}));

describe('ShopifyConnector', () => {
  let config: ShopifyConfig;
  let credentials: ShopifyCredentials;

  beforeEach(() => {
    config = {
      platform: 'shopify',
      name: 'Test Store',
      isActive: true,
      apiKey: 'test-api-key',
      apiSecret: 'test-api-secret',
      scopes: ['read_products', 'write_products'],
      webhookSecret: 'test-webhook-secret',
      apiVersion: '2024-10',
    };

    credentials = {
      platform: 'shopify',
      shopDomain: 'test-shop.myshopify.com',
      accessToken: 'test-access-token',
      scope: 'read_products,write_products',
    };

    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with correct platform properties', () => {
      const connector = new ShopifyConnector(config);

      expect(connector.platform).toBe('shopify');
      expect(connector.name).toBe('Shopify');
      expect(connector.version).toBe('1.0.0');
      expect(connector.capabilities).toBeDefined();
      expect(connector.config).toEqual(config);
    });

    it('should initialize with credentials if provided', async () => {
      const connector = new ShopifyConnector(config, credentials);
      
      // The connector should be initialized with credentials
      expect(connector['credentials']).toEqual(credentials);
    });
  });

  describe('capabilities', () => {
    it('should have correct Shopify capabilities', () => {
      const connector = new ShopifyConnector(config);

      expect(connector.capabilities.supportsOAuth).toBe(true);
      expect(connector.capabilities.supportsWebhooks).toBe(true);
      expect(connector.capabilities.supportsBatchUpdates).toBe(true);
      expect(connector.capabilities.supportsInventoryTracking).toBe(true);
      expect(connector.capabilities.supportsVariants).toBe(true);
      expect(connector.capabilities.supportsCompareAtPrice).toBe(true);
      expect(connector.capabilities.maxBatchSize).toBe(100);
      expect(connector.capabilities.rateLimit.requestsPerSecond).toBe(2);
    });
  });

  describe('isAuthenticated', () => {
    it('should return false when not initialized', async () => {
      const connector = new ShopifyConnector(config);
      const result = await connector.isAuthenticated();
      expect(result).toBe(false);
    });

    it('should return true when initialized with credentials', async () => {
      const connector = new ShopifyConnector(config, credentials);
      const result = await connector.isAuthenticated();
      expect(result).toBe(true);
    });
  });

  describe('initialize', () => {
    it('should initialize with valid credentials', async () => {
      const connector = new ShopifyConnector(config);
      await connector.initialize(credentials);

      expect(connector['credentials']).toEqual(credentials);
      expect(connector['client']).toBeDefined();
      expect(connector['auth']).toBeDefined();
      expect(connector['products']).toBeDefined();
      expect(connector['pricing']).toBeDefined();
      expect(connector['webhooks']).toBeDefined();
    });

    it('should throw error for invalid credentials', async () => {
      const connector = new ShopifyConnector(config);
      const invalidCredentials = {
        platform: 'shopify' as const,
        shopDomain: '',
        accessToken: '',
      };

      await expect(connector.initialize(invalidCredentials)).rejects.toThrow(PlatformError);
    });
  });

  describe('disconnect', () => {
    it('should clear all connections and resources', async () => {
      const connector = new ShopifyConnector(config, credentials);
      await connector.disconnect();

      expect(connector['credentials']).toBeNull();
      expect(connector['client']).toBeNull();
      expect(connector['auth']).toBeNull();
      expect(connector['products']).toBeNull();
      expect(connector['pricing']).toBeNull();
      expect(connector['webhooks']).toBeNull();
    });
  });

  describe('healthCheck', () => {
    it('should return unhealthy when not initialized', async () => {
      const connector = new ShopifyConnector(config);
      const health = await connector.healthCheck();

      expect(health.isHealthy).toBe(false);
      expect(health.status).toBe('disconnected');
      expect(health.message).toBe('Client not initialized');
    });

    it('should return healthy when connection is working', async () => {
      const connector = new ShopifyConnector(config, credentials);
      
      // Mock successful API call
      connector['client'].get.mockResolvedValue({ shop: { name: 'Test Shop' } });

      const health = await connector.healthCheck();

      expect(health.isHealthy).toBe(true);
      expect(health.status).toBe('connected');
      expect(health.latency).toBeGreaterThan(0);
    });

    it('should return unhealthy when API call fails', async () => {
      const connector = new ShopifyConnector(config, credentials);
      
      // Mock failed API call
      connector['client'].get.mockRejectedValue(new Error('API Error'));

      const health = await connector.healthCheck();

      expect(health.isHealthy).toBe(false);
      expect(health.status).toBe('error');
      expect(health.message).toBe('API Error');
    });
  });

  describe('testConnection', () => {
    it('should return false when not initialized', async () => {
      const connector = new ShopifyConnector(config);
      const result = await connector.testConnection();
      expect(result).toBe(false);
    });

    it('should return true when connection is working', async () => {
      const connector = new ShopifyConnector(config, credentials);
      
      // Mock successful API call
      connector['client'].get.mockResolvedValue({ shop: { name: 'Test Shop' } });

      const result = await connector.testConnection();
      expect(result).toBe(true);
    });

    it('should return false when connection fails', async () => {
      const connector = new ShopifyConnector(config, credentials);
      
      // Mock failed API call
      connector['client'].get.mockRejectedValue(new Error('Connection failed'));

      const result = await connector.testConnection();
      expect(result).toBe(false);
    });
  });

  describe('operations access', () => {
    it('should throw error when accessing operations before initialization', () => {
      const connector = new ShopifyConnector(config);

      expect(() => connector.auth).toThrow(PlatformError);
      expect(() => connector.products).toThrow(PlatformError);
      expect(() => connector.pricing).toThrow(PlatformError);
    });

    it('should provide access to operations after initialization', async () => {
      const connector = new ShopifyConnector(config);
      await connector.initialize(credentials);

      expect(connector.auth).toBeDefined();
      expect(connector.products).toBeDefined();
      expect(connector.pricing).toBeDefined();
    });
  });

  describe('getConnectionStatus', () => {
    it('should return connection status', async () => {
      const connector = new ShopifyConnector(config, credentials);
      
      // Mock successful API call
      connector['client'].get.mockResolvedValue({ shop: { name: 'Test Shop' } });
      connector['client'].getRateLimit.mockReturnValue({
        limit: 40,
        remaining: 30,
        resetTime: new Date(),
      });

      const status = await connector.getConnectionStatus();

      expect(status.connected).toBe(true);
      expect(status.rateLimit).toBeDefined();
      expect(status.shopInfo).toBeDefined();
    });

    it('should handle connection errors gracefully', async () => {
      const connector = new ShopifyConnector(config, credentials);
      
      // Mock failed API call
      connector['client'].get.mockRejectedValue(new Error('Connection failed'));

      const status = await connector.getConnectionStatus();

      expect(status.connected).toBe(false);
      expect(status.rateLimit).toBeNull();
    });
  });
});
