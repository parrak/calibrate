import { describe, it, expect } from 'vitest'
import { loadConfigFromEnv, createSpApiClient, applyPriceChange } from '../src'

describe('amazon-connector config', () => {
  it('loads config from env with defaults', () => {
    const cfg = loadConfigFromEnv()
    expect(cfg.region).toBeTypeOf('string')
  })
})

describe('amazon-connector client', () => {
  it('returns null client without LWA creds', () => {
    const client = createSpApiClient({ lwaClientId: undefined, lwaClientSecret: undefined })
    expect(client).toBeNull()
  })
})

describe('amazon-connector pricing', () => {
  it('applies price change in dry-run without creds', async () => {
    const res = await applyPriceChange({ skuCode: 'SKU1', currency: 'USD', amount: 12.34 })
    expect(res.ok).toBe(true)
    expect(res.channelResult?.mode).toBe('dry-run')
  })
})

