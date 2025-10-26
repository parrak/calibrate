/**
 * Shopify Connector - Main Implementation
 * Implements the PlatformConnector interface for Shopify integration
 */

import {
  PlatformConnector,
  PlatformType,
  PlatformConfig,
  PlatformCredentials,
  PlatformHealth,
  PlatformCapabilities,
  PlatformError,
  PlatformErrorType,
} from '@calibr/platform-connector';
import { ShopifyClient } from './client';
import { ShopifyAuth } from './auth';
import { ShopifyProducts } from './products';
import { ShopifyPricing } from './pricing';
import { ShopifyWebhooks } from './webhooks';

export interface ShopifyCredentials extends PlatformCredentials {
  platform: 'shopify';
  shopDomain: string;
  accessToken: string;
  scope?: string;
  expiresAt?: Date;
}

export interface ShopifyConfig extends PlatformConfig {
  platform: 'shopify';
  apiKey: string;
  apiSecret: string;
  scopes: string[];
  webhookSecret: string;
  apiVersion?: string;
}

export class ShopifyConnector implements PlatformConnector {
  readonly platform: PlatformType = 'shopify';
  readonly name = 'Shopify';
  readonly version = '1.0.0';

  readonly capabilities: PlatformCapabilities = {
    supportsOAuth: true,
    supportsWebhooks: true,
    supportsBatchUpdates: true,
    supportsInventoryTracking: true,
    supportsVariants: true,
    supportsCompareAtPrice: true,
    maxBatchSize: 100,
    rateLimit: {
      requestsPerSecond: 2,
      requestsPerDay: undefined,
    },
  };

  private client: ShopifyClient | null = null;
  private auth: ShopifyAuth | null = null;
  private products: ShopifyProducts | null = null;
  private pricing: ShopifyPricing | null = null;
  private webhooks: ShopifyWebhooks | null = null;
  private credentials: ShopifyCredentials | null = null;

  constructor(
    public config: ShopifyConfig,
    credentials?: ShopifyCredentials
  ) {
    if (credentials) {
      this.initialize(credentials);
    }
  }

  // Implement required properties
  get auth(): any {
    if (!this._auth) {
      throw new PlatformError(
        'authentication',
        'Connector not initialized. Call initialize() first.',
        'shopify'
      );
    }
    return this._auth;
  }

  get products(): any {
    if (!this._products) {
      throw new PlatformError(
        'authentication',
        'Connector not initialized. Call initialize() first.',
        'shopify'
      );
    }
    return this._products;
  }

  get pricing(): any {
    if (!this._pricing) {
      throw new PlatformError(
        'authentication',
        'Connector not initialized. Call initialize() first.',
        'shopify'
      );
    }
    return this._pricing;
  }

  // Implement required methods
  async isAuthenticated(): Promise<boolean> {
    return !!this.credentials && !!this.client;
  }

  async initialize(credentials: PlatformCredentials): Promise<void> {
    this.credentials = credentials as ShopifyCredentials;
    
    // Validate credentials
    if (!this.credentials.shopDomain || !this.credentials.accessToken) {
      throw new PlatformError(
        'validation',
        'Shop domain and access token are required',
        'shopify'
      );
    }

    // Initialize Shopify client
    this.client = new ShopifyClient({
      apiKey: this.config.apiKey,
      apiSecret: this.config.apiSecret,
      scopes: this.config.scopes,
      webhookSecret: this.config.webhookSecret,
      apiVersion: this.config.apiVersion || '2024-10',
    });

    // Initialize operations
    this.auth = new ShopifyAuth({
      apiKey: this.config.apiKey,
      apiSecret: this.config.apiSecret,
      scopes: this.config.scopes,
      webhookSecret: this.config.webhookSecret,
    });

    this.products = new ShopifyProducts(this.client);
    this.pricing = new ShopifyPricing(this.client);
    this.webhooks = new ShopifyWebhooks(this.client, this.config.webhookSecret);
  }

  async disconnect(): Promise<void> {
    this.credentials = null;
    this.client = null;
    this.auth = null;
    this.products = null;
    this.pricing = null;
    this.webhooks = null;
  }

  async healthCheck(): Promise<PlatformHealth> {
    const startTime = Date.now();

    try {
      if (!this.client) {
        return {
          isHealthy: false,
          status: 'disconnected',
          lastChecked: new Date(),
          message: 'Client not initialized',
          latency: Date.now() - startTime,
        };
      }

      // Make a lightweight API call to check connection
      await this.client.get('/shop.json');

      return {
        isHealthy: true,
        status: 'connected',
        lastChecked: new Date(),
        latency: Date.now() - startTime,
      };
    } catch (error) {
      return {
        isHealthy: false,
        status: 'error',
        lastChecked: new Date(),
        message: error instanceof Error ? error.message : 'Unknown error',
        latency: Date.now() - startTime,
      };
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.client) return false;
      
      await this.client.get('/shop.json');
      return true;
    } catch {
      return false;
    }
  }

  // Additional Shopify-specific methods
  async getConnectionStatus(): Promise<{
    connected: boolean;
    rateLimit: any;
    shopInfo?: any;
  }> {
    try {
      const connected = await this.testConnection();
      const rateLimit = this.client?.getRateLimit() || null;
      
      let shopInfo;
      if (connected && this.client) {
        try {
          shopInfo = await this.client.get('/shop.json');
        } catch (error) {
          // Shop info is optional
        }
      }

      return {
        connected,
        rateLimit,
        shopInfo,
      };
    } catch (error) {
      return {
        connected: false,
        rateLimit: null,
      };
    }
  }

  // Getter methods for operations
  private get _auth() {
    return this.auth;
  }

  private get _products() {
    return this.products;
  }

  private get _pricing() {
    return this.pricing;
  }

  private get _webhooks() {
    return this.webhooks;
  }
}
