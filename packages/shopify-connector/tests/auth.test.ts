/**
 * Shopify Auth Tests
 * 
 * Tests for the ShopifyAuthManager class
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ShopifyAuthManager } from '../src/auth';
import type { ShopifyConfig } from '../src/types';

describe('ShopifyAuthManager', () => {
  let config: ShopifyConfig;

  beforeEach(() => {
    config = {
      apiKey: 'test-api-key',
      apiSecret: 'test-api-secret',
      scopes: ['read_products', 'write_products'],
      webhookSecret: 'test-webhook-secret',
      apiVersion: '2024-10',
    };
  });

  describe('generateAuthUrl', () => {
    it('should generate valid OAuth URL', () => {
      const auth = new ShopifyAuthManager(config);
      const url = auth.generateAuthUrl('test-store.myshopify.com', 'https://example.com/callback');
      
      expect(url).toContain('test-store.myshopify.com');
      expect(url).toContain('client_id=test-api-key');
      expect(url).toContain('redirect_uri=');
      expect(url).toContain('scope=');
    });

    it('should include state parameter', () => {
      const auth = new ShopifyAuthManager(config);
      const state = 'unique-state-123';
      const url = auth.generateAuthUrl('test-store.myshopify.com', 'https://example.com/callback', state);
      
      expect(url).toContain(`state=${state}`);
    });
  });

  describe('verifyWebhookSignature', () => {
    it('should verify valid webhook signature', () => {
      const auth = new ShopifyAuthManager(config);
      const payload = '{"test": "data"}';
      const secret = 'test-webhook-secret';
      
      // Create a valid signature
      const crypto = require('crypto');
      const hash = crypto.createHmac('sha256', secret)
        .update(payload, 'utf8')
        .digest('base64');
      
      const result = auth.verifyWebhookSignature(payload, hash, secret);
      expect(result).toBe(true);
    });

    it('should reject invalid webhook signature', () => {
      const auth = new ShopifyAuthManager(config);
      const payload = '{"test": "data"}';
      const secret = 'test-webhook-secret';
      
      // Create an invalid signature by using different secret
      const crypto = require('crypto');
      const invalidSignature = crypto.createHmac('sha256', 'wrong-secret')
        .update(payload, 'utf8')
        .digest('base64');
      
      const result = auth.verifyWebhookSignature(payload, invalidSignature, secret);
      expect(result).toBe(false);
    });
  });

  describe('validateShopDomain', () => {
    it('should validate correct shop domain', () => {
      const auth = new ShopifyAuthManager(config);
      const result = auth.validateShopDomain('test-store.myshopify.com');
      expect(result).toBe(true);
    });

    it('should reject invalid shop domain', () => {
      const auth = new ShopifyAuthManager(config);
      const result = auth.validateShopDomain('invalid-domain.com');
      expect(result).toBe(false);
    });
  });

  describe('extractShopDomain', () => {
    it('should extract shop domain from full URL', () => {
      const auth = new ShopifyAuthManager(config);
      const result = auth.extractShopDomain('https://test-store.myshopify.com');
      expect(result).toBe('test-store.myshopify.com');
    });

    it('should return null for non-myshopify domain', () => {
      const auth = new ShopifyAuthManager(config);
      const result = auth.extractShopDomain('https://example.com');
      expect(result).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for non-expired token', () => {
      const auth = new ShopifyAuthManager(config);
      const authData = {
        shopDomain: 'test-store.myshopify.com',
        accessToken: 'test-token',
        scope: 'read_products',
        expiresAt: new Date(Date.now() + 86400000), // Tomorrow
      };
      
      const result = auth.isTokenExpired(authData);
      expect(result).toBe(false);
    });

    it('should return true for expired token', () => {
      const auth = new ShopifyAuthManager(config);
      const authData = {
        shopDomain: 'test-store.myshopify.com',
        accessToken: 'test-token',
        scope: 'read_products',
        expiresAt: new Date(Date.now() - 86400000), // Yesterday
      };
      
      const result = auth.isTokenExpired(authData);
      expect(result).toBe(true);
    });
  });
});

