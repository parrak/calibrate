import {
  ShopifyConnector,
  ShopifyProducts,
  ShopifyWebhooks,
  ShopifyPricing,
  type ShopifyConfig as ConnectorConfig,
  type ShopifyRateLimit,
} from '@calibr/shopify-connector';

interface IntegrationCredentials {
  shopDomain: string;
  accessToken: string;
  scope: string;
  isActive: boolean;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function buildShopifyConnectorConfig(isActive: boolean): ConnectorConfig {
  const apiKey = requireEnv('SHOPIFY_API_KEY');
  const apiSecret = requireEnv('SHOPIFY_API_SECRET');
  // webhookSecret is optional - only needed for webhook verification, not for sync operations
  // Provide empty string as default to satisfy type requirements
  const webhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET || '';
  const apiVersion = process.env.SHOPIFY_API_VERSION;

  return {
    platform: 'shopify',
    name: 'Shopify Integration',
    isActive,
    apiKey,
    apiSecret,
    scopes: process.env.SHOPIFY_SCOPES?.split(',') || ['read_products', 'write_products'],
    webhookSecret,
    apiVersion,
  };
}

export async function initializeShopifyConnector(integration: IntegrationCredentials): Promise<ShopifyConnector> {
  // Validate required credentials
  if (!integration.shopDomain) {
    throw new Error('Shop domain is missing. Please reconnect your Shopify integration.');
  }
  if (!integration.accessToken) {
    throw new Error('Access token is missing. Please reconnect your Shopify integration.');
  }

  // Validate shop domain format
  const shopDomainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/;
  if (!shopDomainRegex.test(integration.shopDomain)) {
    throw new Error(`Invalid shop domain format: ${integration.shopDomain}. Expected format: yourstore.myshopify.com`);
  }

  const connector = new ShopifyConnector(buildShopifyConnectorConfig(integration.isActive));

  try {
    await connector.initialize({
      platform: 'shopify',
      shopDomain: integration.shopDomain,
      accessToken: integration.accessToken,
      scope: integration.scope,
    });

    // Use healthCheck instead of testConnection to get detailed error information
    const health = await connector.healthCheck();
    if (!health.isHealthy) {
      const errorMessage = health.message || 'Unknown connection error';
      console.error('Shopify connection health check failed:', {
        status: health.status,
        message: errorMessage,
        shopDomain: integration.shopDomain,
        latency: health.latency,
      });
      throw new Error(`Failed to connect to Shopify: ${errorMessage}`);
    }

    return connector;
  } catch (error) {
    // Enhance error message with helpful context
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to initialize Shopify connector:', {
      shopDomain: integration.shopDomain,
      error: errorMessage,
    });

    // Re-throw with enhanced message if not already a descriptive error
    if (errorMessage.includes('Failed to connect to Shopify')) {
      throw error;
    }
    throw new Error(`Failed to initialize Shopify connection: ${errorMessage}`);
  }
}

export function getProductsClient(connector: ShopifyConnector): ShopifyProducts {
  const productsClient = connector.underlyingProducts;
  if (!productsClient) {
    throw new Error('Shopify products client not initialized');
  }
  return productsClient;
}

export function getWebhooksClient(connector: ShopifyConnector): ShopifyWebhooks {
  const webhooksClient = (connector as unknown as { webhooks: ShopifyWebhooks | null }).webhooks;
  if (!webhooksClient) {
    throw new Error('Shopify webhooks client not initialized');
  }
  return webhooksClient;
}

export function getPricingClient(connector: ShopifyConnector): ShopifyPricing {
  const pricingClient = (connector as unknown as { underlyingPricing: ShopifyPricing | null }).underlyingPricing;
  if (!pricingClient) {
    throw new Error('Shopify pricing client not initialized');
  }
  return pricingClient;
}

export function serializeShopifyRateLimit(rateLimit?: ShopifyRateLimit | null) {
  if (!rateLimit) {
    return null;
  }

  const resetTime =
    rateLimit.resetTime instanceof Date
      ? rateLimit.resetTime.toISOString()
      : new Date(rateLimit.resetTime).toISOString();

  return {
    limit: rateLimit.limit,
    remaining: rateLimit.remaining,
    resetTime,
  };
}
