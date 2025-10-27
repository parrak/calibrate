/**
 * Shopify Connector - Main Implementation
 * Implements the PlatformConnector interface for Shopify integration
 */
import { PlatformConnector, PlatformType, PlatformConfig, PlatformCredentials, PlatformHealth, PlatformCapabilities } from '@calibr/platform-connector';
import { PlatformError } from '@calibr/platform-connector';
import { ShopifyClient } from './client';
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
  config: ShopifyConfig;
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
  private authOperations: any = null;
  private productOperations: any = null;
  private pricingOperations: any = null;
  private webhooks: ShopifyWebhooks | null = null;
  private credentials: ShopifyCredentials | null = null;

  // Private internal references to underlying Shopify classes
  private _products: ShopifyProducts | null = null;
  private _pricing: ShopifyPricing | null = null;

  constructor(config: ShopifyConfig, credentials?: ShopifyCredentials) {
    this.config = config;
    if (credentials) {
      this.initialize(credentials);
    }
  }

  // Implement required properties
  get auth() {
    if (!this.authOperations) {
      throw new PlatformError('authentication', 'Connector not initialized. Call initialize() first.', 'shopify');
    }
    return this.authOperations;
  }

  get products() {
    if (!this.productOperations) {
      throw new PlatformError('authentication', 'Connector not initialized. Call initialize() first.', 'shopify');
    }
    return this.productOperations;
  }

  get pricing() {
    if (!this.pricingOperations) {
      throw new PlatformError('authentication', 'Connector not initialized. Call initialize() first.', 'shopify');
    }
    return this.pricingOperations;
  }

  // Implement required methods
  async isAuthenticated(): Promise<boolean> {
    return !!this.credentials && !!this.client;
  }

  async initialize(credentials: PlatformCredentials): Promise<void> {
    this.credentials = credentials as ShopifyCredentials;

    // Validate credentials
    if (!this.credentials.shopDomain || !this.credentials.accessToken) {
      throw new PlatformError('validation', 'Shop domain and access token are required', 'shopify');
    }

    // Initialize Shopify client
    this.client = new ShopifyClient({
      apiKey: this.config.apiKey,
      apiSecret: this.config.apiSecret,
      scopes: this.config.scopes,
      webhookSecret: this.config.webhookSecret,
      apiVersion: this.config.apiVersion || '2024-10',
      shopDomain: this.credentials.shopDomain, // Required for client to work
      accessToken: this.credentials.accessToken, // Required for authentication
    });

    // Initialize operations
    const { ShopifyAuthOperations } = await import('./ShopifyAuthOperations');
    const { ShopifyProductOperations } = await import('./ShopifyProductOperations');
    const { ShopifyPricingOperations } = await import('./ShopifyPricingOperations');

    this.authOperations = new ShopifyAuthOperations(this);
    this.productOperations = new ShopifyProductOperations(this);
    this.pricingOperations = new ShopifyPricingOperations(this);
    this.webhooks = new ShopifyWebhooks(this.client, this.config.webhookSecret);

    // Initialize underlying Shopify classes
    this._products = new ShopifyProducts(this.client);
    this._pricing = new ShopifyPricing(this.client);
  }

  async disconnect(): Promise<void> {
    this.credentials = null;
    this.client = null;
    this.authOperations = null;
    this.productOperations = null;
    this.pricingOperations = null;
    this.webhooks = null;
    this._products = null;
    this._pricing = null;
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
    } catch (error: any) {
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

  // Getter methods for internal access to underlying Shopify classes
  getAuthInstance() {
    return this.auth;
  }

  getProductsInstance() {
    if (!this._products) {
      throw new PlatformError('authentication', 'Products instance not initialized', 'shopify');
    }
    return this._products;
  }

  getPricingInstance() {
    if (!this._pricing) {
      throw new PlatformError('authentication', 'Pricing instance not initialized', 'shopify');
    }
    return this._pricing;
  }

  getWebhooksInstance() {
    if (!this.webhooks) {
      throw new PlatformError('authentication', 'Webhooks instance not initialized', 'shopify');
    }
    return this.webhooks;
  }
}
