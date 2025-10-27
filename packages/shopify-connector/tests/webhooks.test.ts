/**
 * Shopify Webhooks Tests
 * 
 * Tests for the ShopifyWebhooks class
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ShopifyWebhooks } from '../src/webhooks';
import { ShopifyClient } from '../src/client';
import type { ShopifyConfig } from '../src/types';

describe('ShopifyWebhooks', () => {
  let webhooks: ShopifyWebhooks;
  let mockClient: any;

  beforeEach(() => {
    mockClient = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    };

    webhooks = new ShopifyWebhooks(mockClient, 'test-webhook-secret');
  });

  describe('createWebhook', () => {
    it('should create webhook successfully', async () => {
      const mockWebhook = {
        id: '123',
        topic: 'products/update',
        address: 'https://example.com/webhook',
        format: 'json' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockClient.post.mockResolvedValue({ webhook: mockWebhook });

      const result = await webhooks.createWebhook({
        topic: 'products/update',
        address: 'https://example.com/webhook',
      });

      expect(result).toEqual(mockWebhook);
      expect(mockClient.post).toHaveBeenCalledWith('/webhooks.json', expect.any(Object));
    });
  });

  describe('listWebhooks', () => {
    it('should list all webhooks', async () => {
      const mockWebhooks = [
        { id: '1', topic: 'products/update' },
        { id: '2', topic: 'orders/create' },
      ];

      mockClient.get.mockResolvedValue({ webhooks: mockWebhooks });

      const result = await webhooks.listWebhooks();

      expect(result).toHaveLength(2);
      expect(mockClient.get).toHaveBeenCalledWith('/webhooks.json');
    });
  });

  describe('getWebhook', () => {
    it('should get webhook by ID', async () => {
      const mockWebhook = {
        id: '123',
        topic: 'products/update',
        address: 'https://example.com/webhook',
      };

      mockClient.get.mockResolvedValue({ webhook: mockWebhook });

      const result = await webhooks.getWebhook('123');

      expect(result).toEqual(mockWebhook);
      expect(mockClient.get).toHaveBeenCalledWith('/webhooks/123.json');
    });
  });

  describe('deleteWebhook', () => {
    it('should delete webhook successfully', async () => {
      mockClient.delete.mockResolvedValue(undefined);

      await webhooks.deleteWebhook('123');

      expect(mockClient.delete).toHaveBeenCalledWith('/webhooks/123.json');
    });
  });

  describe('verifyWebhookSignature', () => {
    it('should verify valid webhook signature', () => {
      const payload = JSON.stringify({ test: 'data' });
      const crypto = require('crypto');
      const hmac = crypto.createHmac('sha256', 'test-webhook-secret');
      hmac.update(payload, 'utf8');
      const signature = hmac.digest('base64');

      const result = webhooks.verifyWebhookSignature(payload, signature);

      expect(result.isValid).toBe(true);
      expect(result.payload).toBeDefined();
    });

    it('should reject invalid webhook signature', () => {
      const payload = JSON.stringify({ test: 'data' });
      const crypto = require('crypto');
      const hmac = crypto.createHmac('sha256', 'wrong-secret');
      hmac.update(payload, 'utf8');
      const invalidSignature = hmac.digest('base64');

      const result = webhooks.verifyWebhookSignature(payload, invalidSignature);

      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('subscribeToCommonWebhooks', () => {
    it('should subscribe to multiple webhook topics', async () => {
      mockClient.post.mockResolvedValue({ webhook: { id: '123', topic: 'test' } });

      const result = await webhooks.subscribeToCommonWebhooks('https://example.com');

      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle errors gracefully', async () => {
      const error = new Error('Webhook creation failed');
      mockClient.post.mockRejectedValue(error);

      const result = await webhooks.subscribeToCommonWebhooks('https://example.com');

      // Should return successfully created webhooks even if some fail
      expect(Array.isArray(result)).toBe(true);
    });
  });
});

