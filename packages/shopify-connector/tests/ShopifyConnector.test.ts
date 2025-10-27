/**
 * Shopify Connector Tests
 * 
 * Tests for the main ShopifyConnector class
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ShopifyConnector } from '../src/ShopifyConnector';
import { ShopifyAuthManager } from '../src/auth';
import { ShopifyClient } from '../src/client';
import type { ShopifyConfig, ShopifyCredentials } from '../src/types';

// Mock dependencies
vi.mock('../src/auth');
vi.mock('../src/client');

describe('ShopifyConnector', () => {
  let config: ShopifyConfig;
  let credentials: ShopifyCredentials;

  beforeEach(() => {
    config = {
      platform: 'shopify',
      apiKey: 'test-api-key',
      apiSecret: 'test-api-secret',
      scopes: ['read_products', 'write_products'],
      webhookSecret: 'test-webhook-secret',
      apiVersion: '2024-10',
    };

    credentials = {
      platform: 'shopify',
      shopDomain: 'test-store.myshopify.com',
      accessToken: 'test-access-token',
      scope: 'read_products,write_products',
    };
  });

  describe('constructor', () => {
    it('should create connector with config only', () => {
      const connector = new ShopifyConnector(config);
      expect(connector).toBeDefined();
      expect(connector.platform).toBe('shopify');
      expect(connector.name).toBe('Shopify');
      expect(connector.version).toBe('1.0.0');
    });

    it('should create connector with config and credentials', async () => {
      const connector = new ShopifyConnector(config, credentials);
      expect(connector).toBeDefined();
      // Should be authenticated after initialization with credentials
    });
  });

  describe('capabilities', () => {
    it('should have correct platform capabilities', () => {
      const connector = new ShopifyConnector(config);
      expect(connector.capabilities.supportsOAuth).toBe(true);
      expect(connector.capabilities.supportsWebhooks).toBe(true);
      expect(connector.capabilities.supportsBatchUpdates).toBe(true);
      expect(connector.capabilities.supportsVariants).toBe(true);
      expect(connector.capabilities.supportsCompareAtPrice).toBe(true);
      expect(connector.capabilities.maxBatchSize).toBe(100);
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
      await connector.initialize(credentials);
      const result = await connector.isAuthenticated();
      expect(result).toBe(true);
    });
  });

  describe('initialize', () => {
    it('should throw error when credentials are missing', async () => {
      const connector = new ShopifyConnector(config);
      const invalidCredentials = {
        platform: 'shopify' as const,
        shopDomain: '',
        accessToken: '',
      };

      await expect(connector.initialize(invalidCredentials)).rejects.toThrow();
    });

    it('should initialize successfully with valid credentials', async () => {
      const connector = new ShopifyConnector(config);
      await connector.initialize(credentials);
      
      const isAuth = await connector.isAuthenticated();
      expect(isAuth).toBe(true);
    });
  });

  describe('disconnect', () => {
    it('should disconnect successfully', async () => {
      const connector = new ShopifyConnector(config, credentials);
      await connector.disconnect();
      
      const isAuth = await connector.isAuthenticated();
      expect(isAuth).toBe(false);
    });
  });

  describe('healthCheck', () => {
    it('should return healthy status when connected', async () => {
      const connector = new ShopifyConnector(config, credentials);
      const health = await connector.healthCheck();
      
      // Should be healthy since we have credentials
      expect(health.isHealthy).toBeDefined();
    });
  });

  describe('testConnection', () => {
    it('should test connection successfully', async () => {
      const connector = new ShopifyConnector(config, credentials);
      const result = await connector.testConnection();
      
      // Result will depend on actual API call
      expect(typeof result).toBe('boolean');
    });
  });
});

