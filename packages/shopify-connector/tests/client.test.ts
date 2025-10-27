/**
 * Shopify Client Tests
 * Tests for the Shopify Admin API client
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ShopifyClient } from '../src/client';
import { ShopifyConfig } from '../src/types';

// Mock axios
const mockAxiosInstance = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  interceptors: {
    request: { use: vi.fn() },
    response: { use: vi.fn() },
  },
  defaults: {
    headers: {},
  },
};

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => mockAxiosInstance),
  },
}));

describe('ShopifyClient', () => {
  let client: ShopifyClient;
  let mockAxios: any;

  beforeEach(async () => {
    const config: ShopifyConfig = {
      apiKey: 'test-api-key',
      apiSecret: 'test-api-secret',
      scopes: ['read_products', 'write_products'],
      webhookSecret: 'test-webhook-secret',
      apiVersion: '2024-10',
    };

    client = new ShopifyClient(config);
    
    // Use the mock instance directly
    mockAxios = mockAxiosInstance;
  });

  describe('constructor', () => {
    it('should initialize with correct configuration', () => {
      expect(client).toBeDefined();
      expect(client.getRateLimit()).toBeNull();
    });
  });

  describe('HTTP methods', () => {
    it('should make GET requests', async () => {
      const mockResponse = { data: { products: [] } };
      mockAxios.get.mockResolvedValue(mockResponse);

      const result = await client.get('/products.json');
      expect(mockAxios.get).toHaveBeenCalledWith('/products.json', { params: undefined });
      expect(result).toEqual(mockResponse.data);
    });

    it('should make POST requests', async () => {
      const mockResponse = { data: { product: { id: '1' } } };
      mockAxios.post.mockResolvedValue(mockResponse);

      const result = await client.post('/products.json', { title: 'Test Product' });
      expect(mockAxios.post).toHaveBeenCalledWith('/products.json', { title: 'Test Product' });
      expect(result).toEqual(mockResponse.data);
    });

    it('should make PUT requests', async () => {
      const mockResponse = { data: { product: { id: '1', title: 'Updated' } } };
      mockAxios.put.mockResolvedValue(mockResponse);

      const result = await client.put('/products/1.json', { title: 'Updated' });
      expect(mockAxios.put).toHaveBeenCalledWith('/products/1.json', { title: 'Updated' });
      expect(result).toEqual(mockResponse.data);
    });

    it('should make DELETE requests', async () => {
      const mockResponse = { data: {} };
      mockAxios.delete.mockResolvedValue(mockResponse);

      const result = await client.delete('/products/1.json');
      expect(mockAxios.delete).toHaveBeenCalledWith('/products/1.json');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('rate limiting', () => {
    it('should update rate limit from response headers', () => {
      const mockResponse = {
        headers: {
          'x-shopify-shop-api-call-limit': '10/40',
        },
      };

      // Simulate the interceptor calling the updateRateLimit method
      client['updateRateLimit'](mockResponse);

      const rateLimit = client.getRateLimit();
      expect(rateLimit).toEqual({
        limit: 40,
        remaining: 30,
        resetTime: expect.any(Date),
      });
    });

    it('should detect when near rate limit', () => {
      client['rateLimit'] = {
        limit: 40,
        remaining: 5,
        resetTime: new Date(),
      };

      expect(client.isNearRateLimit()).toBe(true);
    });

    it('should not be near rate limit when plenty remaining', () => {
      client['rateLimit'] = {
        limit: 40,
        remaining: 20,
        resetTime: new Date(),
      };

      expect(client.isNearRateLimit()).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle API errors correctly', () => {
      const error = {
        response: {
          data: {
            errors: {
              title: ['Title is required'],
            },
          },
        },
      };

      const result = client['handleError'](error);
      expect(result).toEqual({
        errors: {
          title: ['Title is required'],
        },
      });
    });

    it('should handle network errors', () => {
      const error = {
        message: 'Network error',
      };

      const result = client['handleError'](error);
      expect(result).toEqual({
        errors: {
          general: ['Network error'],
        },
      });
    });
  });
});
