import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { decodeOAuthState, encodeOAuthState } from '@/lib/shopify-oauth-state'

describe('Shopify OAuth state helpers', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    vi.restoreAllMocks()
    process.env = { ...OLD_ENV, SHOPIFY_API_SECRET: 'test-secret' }
  })

  afterEach(() => {
    process.env = OLD_ENV
  })

  it('round-trips encode/decode with signed payloads', () => {
    const state = { projectSlug: 'demo-project', host: 'admin.shopify.com', returnTo: '/integrations' }
    const encoded = encodeOAuthState(state)
    expect(encoded).not.toContain('{')
    const decoded = decodeOAuthState(encoded)
    expect(decoded).toEqual(state)
  })

  it('throws when encoding without a secret', () => {
    delete process.env.SHOPIFY_API_SECRET
    expect(() => encodeOAuthState({ projectSlug: 'demo' })).toThrowError()
  })

  it('returns null when decoding without a secret', () => {
    const token = encodeOAuthState({ projectSlug: 'demo' })
    delete process.env.SHOPIFY_API_SECRET
    expect(decodeOAuthState(token)).toBeNull()
  })

  it('returns null for tampered payloads', () => {
    const token = encodeOAuthState({ projectSlug: 'demo' })
    const raw = Buffer.from(token, 'base64url').toString('utf8')
    const parsed = JSON.parse(raw)
    parsed.payload.projectSlug = 'hacked'
    const tampered = Buffer.from(JSON.stringify(parsed), 'utf8').toString('base64url')
    expect(decodeOAuthState(tampered)).toBeNull()
  })

  it('expires tokens after the TTL window', () => {
    vi.useFakeTimers()
    const now = Date.now()
    vi.setSystemTime(now)
    const token = encodeOAuthState({ projectSlug: 'demo' })

    // Advance beyond 10 minute TTL
    vi.setSystemTime(now + 11 * 60 * 1000)
    expect(decodeOAuthState(token)).toBeNull()
    vi.useRealTimers()
  })

  it('returns null for invalid payload strings', () => {
    expect(decodeOAuthState(null)).toBeNull()
    expect(decodeOAuthState('not-json')).toBeNull()
  })
})
