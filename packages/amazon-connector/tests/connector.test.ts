import { describe, it, expect } from 'vitest'
import { registerAmazonConnector, AmazonConnector } from '../src'
import { ConnectorRegistry } from '@calibr/platform-connector'

describe('AmazonConnector', () => {
  it('implements PlatformConnector shape', async () => {
    const c = new AmazonConnector()
    expect(c.key).toBe('amazon')
    expect(typeof c.products.getProductBySku).toBe('function')
    expect(typeof c.pricing.applyPriceUpdate).toBe('function')
    expect(typeof c.auth.getStatus).toBe('function')
  })

  it('registers with ConnectorRegistry', async () => {
    registerAmazonConnector()
    expect(ConnectorRegistry.isRegistered('amazon')).toBe(true)
  })
})
