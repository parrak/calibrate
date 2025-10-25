/**
 * ConnectorRegistry Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ConnectorRegistry } from '../src/registry/ConnectorRegistry';
import { PlatformConnector, PlatformConnectorFactory } from '../src/interfaces/PlatformConnector';
import { PlatformConfig, PlatformCredentials, PlatformHealth, PlatformType } from '../src/types/base';
import { PlatformCapabilities } from '../src/types/integration';

// Mock connector for testing
class MockShopifyConnector implements PlatformConnector {
  readonly platform: PlatformType = 'shopify';
  readonly name = 'Mock Shopify';
  readonly version = '1.0.0';
  readonly capabilities: PlatformCapabilities = {
    supportsOAuth: true,
    supportsWebhooks: true,
    supportsBatchUpdates: true,
    supportsInventoryTracking: true,
    supportsVariants: true,
    supportsCompareAtPrice: true,
    maxBatchSize: 100,
  };

  constructor(
    public config: PlatformConfig,
    private credentials?: PlatformCredentials
  ) {}

  auth = {} as any;
  products = {} as any;
  pricing = {} as any;

  async isAuthenticated(): Promise<boolean> {
    return !!this.credentials;
  }

  async initialize(credentials: PlatformCredentials): Promise<void> {
    this.credentials = credentials;
  }

  async disconnect(): Promise<void> {
    this.credentials = undefined;
  }

  async healthCheck(): Promise<PlatformHealth> {
    return {
      isHealthy: true,
      status: 'connected',
      lastChecked: new Date(),
    };
  }

  async testConnection(): Promise<boolean> {
    return true;
  }
}

describe('ConnectorRegistry', () => {
  const mockConfig: PlatformConfig = {
    platform: 'shopify',
    name: 'Test Store',
    isActive: true,
  };

  const mockCredentials: PlatformCredentials = {
    platform: 'shopify',
    apiKey: 'test-key',
  };

  beforeEach(() => {
    // Reset registry before each test
    ConnectorRegistry.reset();
  });

  describe('register', () => {
    it('should register a platform connector factory', () => {
      const factory: PlatformConnectorFactory = async (config) => {
        return new MockShopifyConnector(config);
      };

      ConnectorRegistry.register('shopify', factory);

      expect(ConnectorRegistry.isRegistered('shopify')).toBe(true);
    });

    it('should allow re-registering a platform', () => {
      const factory1: PlatformConnectorFactory = async (config) => {
        return new MockShopifyConnector(config);
      };
      const factory2: PlatformConnectorFactory = async (config) => {
        return new MockShopifyConnector(config);
      };

      ConnectorRegistry.register('shopify', factory1);
      ConnectorRegistry.register('shopify', factory2);

      expect(ConnectorRegistry.isRegistered('shopify')).toBe(true);
    });
  });

  describe('unregister', () => {
    it('should unregister a platform connector', () => {
      const factory: PlatformConnectorFactory = async (config) => {
        return new MockShopifyConnector(config);
      };

      ConnectorRegistry.register('shopify', factory);
      expect(ConnectorRegistry.isRegistered('shopify')).toBe(true);

      ConnectorRegistry.unregister('shopify');
      expect(ConnectorRegistry.isRegistered('shopify')).toBe(false);
    });
  });

  describe('isRegistered', () => {
    it('should return true for registered platform', () => {
      const factory: PlatformConnectorFactory = async (config) => {
        return new MockShopifyConnector(config);
      };

      ConnectorRegistry.register('shopify', factory);
      expect(ConnectorRegistry.isRegistered('shopify')).toBe(true);
    });

    it('should return false for unregistered platform', () => {
      expect(ConnectorRegistry.isRegistered('shopify')).toBe(false);
    });
  });

  describe('getRegisteredPlatforms', () => {
    it('should return empty array when no platforms registered', () => {
      expect(ConnectorRegistry.getRegisteredPlatforms()).toEqual([]);
    });

    it('should return all registered platforms', () => {
      const shopifyFactory: PlatformConnectorFactory = async (config) => {
        return new MockShopifyConnector(config);
      };

      ConnectorRegistry.register('shopify', shopifyFactory);
      ConnectorRegistry.register('amazon', shopifyFactory); // Using same factory for test

      const platforms = ConnectorRegistry.getRegisteredPlatforms();
      expect(platforms).toContain('shopify');
      expect(platforms).toContain('amazon');
      expect(platforms).toHaveLength(2);
    });
  });

  describe('getConnector', () => {
    it('should create and return a connector instance', async () => {
      const factory: PlatformConnectorFactory = async (config, credentials) => {
        return new MockShopifyConnector(config, credentials);
      };

      ConnectorRegistry.register('shopify', factory);

      const connector = await ConnectorRegistry.getConnector(
        'shopify',
        mockConfig,
        mockCredentials
      );

      expect(connector).toBeInstanceOf(MockShopifyConnector);
      expect(connector.platform).toBe('shopify');
      expect(await connector.isAuthenticated()).toBe(true);
    });

    it('should throw error for unregistered platform', async () => {
      await expect(
        ConnectorRegistry.getConnector('shopify', mockConfig)
      ).rejects.toThrow("Platform 'shopify' is not registered");
    });

    it('should cache connector when cacheKey provided', async () => {
      const factory: PlatformConnectorFactory = async (config) => {
        return new MockShopifyConnector(config);
      };

      ConnectorRegistry.register('shopify', factory);

      const connector1 = await ConnectorRegistry.getConnector(
        'shopify',
        mockConfig,
        undefined,
        'test-cache-key'
      );

      const connector2 = await ConnectorRegistry.getConnector(
        'shopify',
        mockConfig,
        undefined,
        'test-cache-key'
      );

      expect(connector1).toBe(connector2); // Same instance
    });

    it('should create new instance when no cacheKey provided', async () => {
      const factory: PlatformConnectorFactory = async (config) => {
        return new MockShopifyConnector(config);
      };

      ConnectorRegistry.register('shopify', factory);

      const connector1 = await ConnectorRegistry.getConnector('shopify', mockConfig);
      const connector2 = await ConnectorRegistry.getConnector('shopify', mockConfig);

      expect(connector1).not.toBe(connector2); // Different instances
    });
  });

  describe('createConnector', () => {
    it('should create a new connector without caching', async () => {
      const factory: PlatformConnectorFactory = async (config) => {
        return new MockShopifyConnector(config);
      };

      ConnectorRegistry.register('shopify', factory);

      const connector = await ConnectorRegistry.createConnector('shopify', mockConfig);

      expect(connector).toBeInstanceOf(MockShopifyConnector);
      expect(ConnectorRegistry.getCached('any-key')).toBeUndefined();
    });
  });

  describe('clearCache', () => {
    it('should clear specific cached connector', async () => {
      const factory: PlatformConnectorFactory = async (config) => {
        return new MockShopifyConnector(config);
      };

      ConnectorRegistry.register('shopify', factory);

      await ConnectorRegistry.getConnector('shopify', mockConfig, undefined, 'key1');
      await ConnectorRegistry.getConnector('shopify', mockConfig, undefined, 'key2');

      expect(ConnectorRegistry.getCached('key1')).toBeDefined();
      expect(ConnectorRegistry.getCached('key2')).toBeDefined();

      ConnectorRegistry.clearCache('key1');

      expect(ConnectorRegistry.getCached('key1')).toBeUndefined();
      expect(ConnectorRegistry.getCached('key2')).toBeDefined();
    });

    it('should clear all cached connectors when no key provided', async () => {
      const factory: PlatformConnectorFactory = async (config) => {
        return new MockShopifyConnector(config);
      };

      ConnectorRegistry.register('shopify', factory);

      await ConnectorRegistry.getConnector('shopify', mockConfig, undefined, 'key1');
      await ConnectorRegistry.getConnector('shopify', mockConfig, undefined, 'key2');

      ConnectorRegistry.clearCache();

      expect(ConnectorRegistry.getCached('key1')).toBeUndefined();
      expect(ConnectorRegistry.getCached('key2')).toBeUndefined();
    });
  });

  describe('reset', () => {
    it('should clear all registrations and cache', async () => {
      const factory: PlatformConnectorFactory = async (config) => {
        return new MockShopifyConnector(config);
      };

      ConnectorRegistry.register('shopify', factory);
      await ConnectorRegistry.getConnector('shopify', mockConfig, undefined, 'test-key');

      expect(ConnectorRegistry.isRegistered('shopify')).toBe(true);
      expect(ConnectorRegistry.getCached('test-key')).toBeDefined();

      ConnectorRegistry.reset();

      expect(ConnectorRegistry.isRegistered('shopify')).toBe(false);
      expect(ConnectorRegistry.getCached('test-key')).toBeUndefined();
    });
  });
});
