import { ConnectorRegistry } from '@calibr/platform-connector'
import { registerAmazonConnector } from '@calibr/amazon-connector'
// Import Shopify connector to trigger auto-registration
import '@calibr/shopify-connector'

// Idempotent registration of known connectors
export function registerKnownConnectors() {
  if (!ConnectorRegistry.isRegistered('amazon')) {
    registerAmazonConnector()
  }

  // Register Stripe
  if (!ConnectorRegistry.isRegistered('stripe')) {
    ConnectorRegistry.register('stripe', async (config, credentials) => {
      // Dynamic import to avoid circular dependencies if any
      const { StripeConnector } = await import('@calibr/connectors')
      return new StripeConnector(config, credentials)
    })
  }

  // Shopify auto-registers on import (see packages/shopify-connector/src/index.ts)
}

// Perform registration on import for route side-effects
registerKnownConnectors()
