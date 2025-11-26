import { describe, it, expect, beforeEach, vi } from 'vitest'

// Import the route handler from the App Router file
import { GET as installGET } from '@/app/api/platforms/shopify/oauth/install/route'

describe('Shopify OAuth Install Route', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    vi.restoreAllMocks()
    process.env = { ...OLD_ENV }
    process.env.SHOPIFY_API_KEY = 'test_key'
    process.env.SHOPIFY_API_SECRET = 'test_secret'
    process.env.SHOPIFY_OAUTH_CALLBACK_BASE = 'https://public.example.com'
  })

  it('returns 400 when required params are missing', async () => {
    const req = new Request('https://api.example.com/api/platforms/shopify/oauth/install')
    // @ts-expect-error NextRequest compatible
    const res = await installGET(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBeDefined()
  })

  it('returns installUrl when params are valid', async () => {
    const url = 'https://api.internal/api/platforms/shopify/oauth/install?project=demo&shop=test-store.myshopify.com'
    const req = new Request(url)
    // @ts-expect-error NextRequest compatible
    const res = await installGET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.installUrl).toContain('https://test-store.myshopify.com/admin/oauth/authorize')
    expect(Array.isArray(body.scopes)).toBe(true)
    expect(body.installUrl).toContain('redirect_uri=https%3A%2F%2Fpublic.example.com%2Fapi%2Fplatforms%2Fshopify%2Foauth%2Fcallback')
  })

  it('falls back to request origin when callback base is not configured', async () => {
    delete process.env.SHOPIFY_OAUTH_CALLBACK_BASE
    const url = 'https://api.internal/api/platforms/shopify/oauth/install?project=demo&shop=test-store'
    const req = new Request(url, {
      headers: {
        'x-forwarded-proto': 'https',
        'x-forwarded-host': 'edge.example.com',
      },
    })

    // @ts-expect-error NextRequest compatible
    const res = await installGET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.installUrl).toContain('redirect_uri=https%3A%2F%2Fedge.example.com%2Fapi%2Fplatforms%2Fshopify%2Foauth%2Fcallback')
  })
})


