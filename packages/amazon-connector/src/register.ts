import { ConnectorRegistry } from '@calibr/platform-connector'
import type { PlatformConnectorFactory } from '@calibr/platform-connector'
import { AmazonConnector } from './connector'

export const registerAmazonConnector = () => {
  const factory: PlatformConnectorFactory = async (config, credentials) => {
    return new AmazonConnector(config, credentials)
  }
  ConnectorRegistry.register('amazon', factory)
}
