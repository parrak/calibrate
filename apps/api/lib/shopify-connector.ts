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

  // Validate access token format
  // Shopify access tokens should be alphanumeric strings (base64-like format)
  const accessTokenTrimmed = integration.accessToken.trim();
  if (accessTokenTrimmed !== integration.accessToken) {
    console.warn('Access token has leading/trailing whitespace - this will cause authentication to fail');
    throw new Error('Access token contains invalid whitespace. Please reconnect your Shopify integration.');
  }

  // Log credentials for debugging (mask access token for security)
  console.log('Initializing Shopify connector with credentials:', {
    shopDomain: integration.shopDomain,
    accessTokenLength: integration.accessToken.length,
    accessTokenPrefix: integration.accessToken.substring(0, 8) + '...',
    accessTokenSuffix: '...' + integration.accessToken.substring(integration.accessToken.length - 4),
    accessTokenType: typeof integration.accessToken,
    scope: integration.scope,
    // Check for potential encoding issues
    hasWhitespace: /\s/.test(integration.accessToken),
    hasSpecialChars: /[^a-zA-Z0-9_-]/.test(integration.accessToken),
  });

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

      // Provide actionable error messages for common issues
      let userFacingMessage = errorMessage;
      if (errorMessage.includes('401') || errorMessage.toLowerCase().includes('authentication')) {
        userFacingMessage = 'Authentication failed. The access token is invalid or has been revoked. Please reconnect your Shopify integration to get a new access token.';
      } else if (errorMessage.includes('404')) {
        userFacingMessage = 'Shop not found. Please verify your shop domain and reconnect your Shopify integration.';
      } else if (errorMessage.includes('429')) {
        userFacingMessage = 'Rate limit exceeded. Please try again in a few moments.';
      }

      throw new Error(`Failed to connect to Shopify: ${userFacingMessage}`);
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
