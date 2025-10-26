/**
 * Shopify Auth Tests
 * Tests for Shopify OAuth authentication
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ShopifyAuth } from '../src/auth';
import { ShopifyConfig } from '../src/types';

// Mock crypto
vi.mock('crypto', async (importOriginal) => {
  const actual = await importOriginal<typeof import('crypto')>();
  return {
    ...actual,
    createHmac: vi.fn(() => ({
      update: vi.fn().mockReturnThis(),
      digest: vi.fn(() => 'mock-hash'),
    })),
    randomBytes: vi.fn(() => ({
      toString: vi.fn(() => 'mock-random-string'),
    })),
    timingSafeEqual: vi.fn(() => true),
  };
});

// Mock fetch
global.fetch = vi.fn();

describe('ShopifyAuth', () => {
  let auth: ShopifyAuth;
  let config: ShopifyConfig;

  beforeEach(() => {
    config = {
      apiKey: 'test-api-key',
      apiSecret: 'test-api-secret',
      scopes: ['read_products', 'write_products'],
      webhookSecret: 'test-webhook-secret',
    };

    auth = new ShopifyAuth(config);
    vi.clearAllMocks();
  });

  describe('generateAuthUrl', () => {
    it('should generate correct OAuth URL', () => {
      const shopDomain = 'test-shop.myshopify.com';
      const redirectUri = 'https://app.calibr.lat/callback';
      const state = 'test-state';

      const authUrl = auth.generateAuthUrl(shopDomain, redirectUri, state);

      expect(authUrl).toContain('https://test-shop.myshopify.com/admin/oauth/authorize');
      expect(authUrl).toContain('client_id=test-api-key');
      expect(authUrl).toContain('scope=read_products,write_products');
      expect(authUrl).toContain('redirect_uri=https://app.calibr.lat/callback');
      expect(authUrl).toContain('state=test-state');
    });

    it('should generate state if not provided', () => {
      const shopDomain = 'test-shop.myshopify.com';
      const redirectUri = 'https://app.calibr.lat/callback';

      const authUrl = auth.generateAuthUrl(shopDomain, redirectUri);

      expect(authUrl).toContain('state=mock-random-string');
    });
  });

  describe('exchangeCodeForToken', () => {
    it('should exchange code for access token', async () => {
      const mockResponse = {
        access_token: 'test-access-token',
        scope: 'read_products,write_products',
        expires_in: 3600,
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await auth.exchangeCodeForToken(
        'test-shop.myshopify.com',
        'test-code',
        'https://app.calibr.lat/callback'
      );

      expect(global.fetch).toHaveBeenCalledWith(
        'https://test-shop.myshopify.com/admin/oauth/access_token',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            client_id: 'test-api-key',
            client_secret: 'test-api-secret',
            code: 'test-code',
            redirect_uri: 'https://app.calibr.lat/callback',
          }),
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it('should throw error on failed token exchange', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Invalid code' }),
      });

      await expect(
        auth.exchangeCodeForToken(
          'test-shop.myshopify.com',
          'invalid-code',
          'https://app.calibr.lat/callback'
        )
      ).rejects.toThrow('OAuth token exchange failed: Invalid code');
    });
  });

  describe('verifyWebhookSignature', () => {
    it('should verify valid webhook signature', () => {
      const payload = '{"test": "data"}';
      const signature = 'valid-signature';

      const result = auth.verifyWebhookSignature(payload, signature, 'test-secret');

      expect(result).toBe(true);
    });
  });

  describe('validateShopDomain', () => {
    it('should validate correct shop domain format', () => {
      expect(auth.validateShopDomain('test-shop.myshopify.com')).toBe(true);
      expect(auth.validateShopDomain('my-store.myshopify.com')).toBe(true);
    });

    it('should reject invalid shop domain format', () => {
      expect(auth.validateShopDomain('test-shop.com')).toBe(false);
      expect(auth.validateShopDomain('myshopify.com')).toBe(false);
      expect(auth.validateShopDomain('test-shop.myshopify')).toBe(false);
      expect(auth.validateShopDomain('')).toBe(false);
    });
  });

  describe('extractShopDomain', () => {
    it('should extract shop domain from URL', () => {
      const url = 'https://test-shop.myshopify.com/admin/products';
      const domain = auth.extractShopDomain(url);

      expect(domain).toBe('test-shop.myshopify.com');
    });

    it('should return null for invalid URL', () => {
      const url = 'https://test-shop.com/products';
      const domain = auth.extractShopDomain(url);

      expect(domain).toBeNull();
    });

    it('should return null for malformed URL', () => {
      const domain = auth.extractShopDomain('not-a-url');

      expect(domain).toBeNull();
    });
  });

  describe('createAuthFromResponse', () => {
    it('should create ShopifyAuth object from OAuth response', () => {
      const response = {
        access_token: 'test-access-token',
        scope: 'read_products,write_products',
        expires_in: 3600,
      };

      const result = auth.createAuthFromResponse('test-shop.myshopify.com', response);

      expect(result).toEqual({
        shopDomain: 'test-shop.myshopify.com',
        accessToken: 'test-access-token',
        scope: 'read_products,write_products',
        expiresAt: expect.any(Date),
      });
    });

    it('should handle response without expires_in', () => {
      const response = {
        access_token: 'test-access-token',
        scope: 'read_products,write_products',
      };

      const result = auth.createAuthFromResponse('test-shop.myshopify.com', response);

      expect(result).toEqual({
        shopDomain: 'test-shop.myshopify.com',
        accessToken: 'test-access-token',
        scope: 'read_products,write_products',
        expiresAt: undefined,
      });
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for non-expiring token', () => {
      const authObj = {
        shopDomain: 'test-shop.myshopify.com',
        accessToken: 'test-token',
        scope: 'read_products',
      };

      expect(auth.isTokenExpired(authObj)).toBe(false);
    });

    it('should return false for non-expired token', () => {
      const authObj = {
        shopDomain: 'test-shop.myshopify.com',
        accessToken: 'test-token',
        scope: 'read_products',
        expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
      };

      expect(auth.isTokenExpired(authObj)).toBe(false);
    });

    it('should return true for expired token', () => {
      const authObj = {
        shopDomain: 'test-shop.myshopify.com',
        accessToken: 'test-token',
        scope: 'read_products',
        expiresAt: new Date(Date.now() - 3600000), // 1 hour ago
      };

      expect(auth.isTokenExpired(authObj)).toBe(true);
    });
  });

  describe('refreshToken', () => {
    it('should throw error as Shopify does not support token refresh', async () => {
      const authObj = {
        shopDomain: 'test-shop.myshopify.com',
        accessToken: 'test-token',
        scope: 'read_products',
      };

      await expect(auth.refreshToken(authObj)).rejects.toThrow(
        'Shopify does not support token refresh. Re-authentication required.'
      );
    });
  });
});
