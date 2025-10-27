export type { ShopifyConnector } from './ShopifyConnector';
export type { ShopifyConfig, ShopifyCredentials } from './ShopifyConnector';
export { ShopifyAuthOperations } from './ShopifyAuthOperations';
export { ShopifyProductOperations } from './ShopifyProductOperations';
export { ShopifyPricingOperations } from './ShopifyPricingOperations';
export { ShopifyClient } from './client';
export { ShopifyAuthManager } from './auth';
export { ShopifyProducts } from './products';
export { ShopifyPricing } from './pricing';
export { ShopifyWebhooks } from './webhooks';
export * from './types';

import { ConnectorRegistry } from '@calibr/platform-connector';
import { ShopifyConnector } from './ShopifyConnector';

ConnectorRegistry.register('shopify', async (config, credentials) => {
  const connector = new ShopifyConnector(config as any, credentials as any);
  if (credentials) await connector.initialize(credentials);
  return connector;
});
