import { ConnectorRegistry } from '@calibr/platform-connector'
import { registerAmazonConnector } from '@calibr/amazon-connector'

// Idempotent registration of known connectors
export function registerKnownConnectors() {
  if (!ConnectorRegistry.isRegistered('amazon')) {
    registerAmazonConnector()
  }
}

// Perform registration on import for route side-effects
registerKnownConnectors()

