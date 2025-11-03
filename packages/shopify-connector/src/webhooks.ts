/**
 * Shopify Webhooks Management
 * Handles webhook subscription, verification, and processing
 */

import * as crypto from 'crypto';
import { ShopifyClient } from './client';
import { ShopifyWebhook, ShopifyWebhookPayload, ShopifyWebhookVerification } from './types';

export interface WebhookSubscription {
  topic: string;
  address: string;
  format?: 'json' | 'xml';
}

export class ShopifyWebhooks {
  private client: ShopifyClient;
  private webhookSecret: string;

  constructor(client: ShopifyClient, webhookSecret: string) {
    this.client = client;
    this.webhookSecret = webhookSecret;
  }

  /**
   * Create a webhook subscription
   */
  async createWebhook(subscription: WebhookSubscription): Promise<ShopifyWebhook> {
    const webhookData = {
      webhook: {
        topic: subscription.topic,
        address: subscription.address,
        format: subscription.format || 'json',
      },
    };

    const response = await this.client.post<{ webhook: ShopifyWebhook }>('/webhooks.json', webhookData);
    return response.webhook;
  }

  /**
   * List all webhook subscriptions
   */
  async listWebhooks(): Promise<ShopifyWebhook[]> {
    const response = await this.client.get<{ webhooks: ShopifyWebhook[] }>('/webhooks.json');
    return response.webhooks;
  }

  /**
   * Get a specific webhook by ID
   */
  async getWebhook(webhookId: string): Promise<ShopifyWebhook> {
    const response = await this.client.get<{ webhook: ShopifyWebhook }>(`/webhooks/${webhookId}.json`);
    return response.webhook;
  }

  /**
   * Update a webhook subscription
   */
  async updateWebhook(webhookId: string, updates: Partial<WebhookSubscription>): Promise<ShopifyWebhook> {
    const webhookData = {
      webhook: {
        id: webhookId,
        ...updates,
      },
    };

    const response = await this.client.put<{ webhook: ShopifyWebhook }>(`/webhooks/${webhookId}.json`, webhookData);
    return response.webhook;
  }

  /**
   * Delete a webhook subscription
   */
  async deleteWebhook(webhookId: string): Promise<void> {
    await this.client.delete(`/webhooks/${webhookId}.json`);
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): ShopifyWebhookVerification {
    try {
      const hmac = crypto.createHmac('sha256', this.webhookSecret);
      hmac.update(payload, 'utf8');
      const hash = hmac.digest('base64');

      const isValid = crypto.timingSafeEqual(
        Buffer.from(hash, 'base64'),
        Buffer.from(signature, 'base64')
      );

      if (isValid) {
        return {
          isValid: true,
          payload: JSON.parse(payload),
        };
      } else {
        return {
          isValid: false,
          payload: null,
          error: 'Invalid signature',
        };
      }
    } catch (error: any) {
      return {
        isValid: false,
        payload: null,
        error: `Verification failed: ${error?.message || 'Unknown error'}`,
      };
    }
  }

  /**
   * Process webhook payload
   */
  async processWebhook(payload: ShopifyWebhookPayload): Promise<void> {
    // This method should be overridden by the implementing application
    // to handle specific webhook topics
    console.log(`Received webhook: ${payload.topic}`, payload.data);
  }

  /**
   * Subscribe to common webhook topics
   */
  async subscribeToCommonWebhooks(baseUrl: string): Promise<ShopifyWebhook[]> {
    const commonTopics = [
      'products/update',
      'products/create',
      'products/delete',
      'inventory_levels/update',
      'orders/create',
      'orders/updated',
      'orders/paid',
      'orders/cancelled',
    ];

    const webhooks: ShopifyWebhook[] = [];

    for (const topic of commonTopics) {
      try {
        const webhook = await this.createWebhook({
          topic,
          address: `${baseUrl}/api/integrations/shopify/webhooks`,
          format: 'json',
        });
        webhooks.push(webhook);
      } catch (error) {
        console.error(`Failed to create webhook for ${topic}:`, error);
      }
    }

    return webhooks;
  }

  /**
   * Clean up old webhooks
   */
  async cleanupWebhooks(keepTopics: string[]): Promise<void> {
    const webhooks = await this.listWebhooks();

    for (const webhook of webhooks) {
      if (!keepTopics.includes(webhook.topic)) {
        try {
          await this.deleteWebhook(webhook.id);
          console.log(`Deleted webhook: ${webhook.topic}`);
        } catch (error) {
          console.error(`Failed to delete webhook ${webhook.id}:`, error);
        }
      }
    }
  }
}
