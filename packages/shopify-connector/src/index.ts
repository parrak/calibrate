/**
 * Shopify Connector - Main Export
 * Complete Shopify Admin API integration for Calibrate pricing platform
 */
export { ShopifyConnector, ShopifyCredentials, ShopifyConfig } from './ShopifyConnector';
export { ShopifyAuthOperations } from './ShopifyAuthOperations';
export { ShopifyProductOperations } from './ShopifyProductOperations';
export { ShopifyPricingOperations } from './ShopifyPricingOperations';
export { ShopifyClient } from './client';
export { ShopifyAuthManager } from './auth';
export { ShopifyProducts } from './products';
export { ShopifyPricing } from './pricing';
export { ShopifyWebhooks } from './webhooks';
export * from './types';

// Register the connector with the platform registry
import { ConnectorRegistry } from '@calibr/platform-connector';
import { ShopifyConnector, ShopifyConfig } from './ShopifyConnector';

ConnectorRegistry.register('shopify', async (config, credentials) => {
  const connector = new ShopifyConnector(config as ShopifyConfig, credentials as any);
  if (credentials) {
    await connector.initialize(credentials);
  }
  return connector;
});
