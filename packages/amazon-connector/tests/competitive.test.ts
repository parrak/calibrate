import { describe, it, expect } from 'vitest'
import { getCompetitivePrice } from '../src'

describe('amazon-connector competitive pricing', () => {
  it('returns a safe fallback structure without creds', async () => {
    const asin = 'B000TEST'
    const res = await getCompetitivePrice(asin)
    expect(res.asin).toBe(asin)
    expect(typeof res.marketplaceId).toBe('string')
    expect(typeof res.offerCount).toBe('number')
    // When no creds, we expect a non-throwing, minimal structure
    expect(res.lowestPrice).toBeTypeOf('object') // can be number or null; ensure key exists
  })
})

