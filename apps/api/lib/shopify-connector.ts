import {
  ShopifyConnector,
  ShopifyProducts,
  ShopifyWebhooks,
  ShopifyPricing,
  type ShopifyConfig as ConnectorConfig,
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
  const webhookSecret = requireEnv('SHOPIFY_WEBHOOK_SECRET');
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
  const connector = new ShopifyConnector(buildShopifyConnectorConfig(integration.isActive));

  await connector.initialize({
    platform: 'shopify',
    shopDomain: integration.shopDomain,
    accessToken: integration.accessToken,
    scope: integration.scope,
  });

  const isConnected = await connector.testConnection();
  if (!isConnected) {
    throw new Error('Failed to connect to Shopify');
  }

  return connector;
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
