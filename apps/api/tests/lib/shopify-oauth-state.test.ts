import { describe, it, expect } from 'vitest'
import { decodeOAuthState, encodeOAuthState } from '@/lib/shopify-oauth-state'

describe('Shopify OAuth state helpers', () => {
  it('round-trips encode/decode', () => {
    const state = { projectSlug: 'demo-project', host: 'aGVsbG8=', returnTo: '/integrations' }
    const encoded = encodeOAuthState(state)
    expect(encoded).not.toContain('{')
    const decoded = decodeOAuthState(encoded)
    expect(decoded).toEqual(state)
  })

  it('returns null for invalid payloads', () => {
    expect(decodeOAuthState(null)).toBeNull()
    expect(decodeOAuthState('not-json')).toBeNull()
  })
})
