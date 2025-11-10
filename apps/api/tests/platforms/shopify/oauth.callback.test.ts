import crypto from 'crypto'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Import the route handler from the App Router file
import { GET as callbackGET } from '@/app/api/platforms/shopify/oauth/callback/route'
import { encodeOAuthState } from '@/lib/shopify-oauth-state'

describe('Shopify OAuth Callback Route', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    vi.restoreAllMocks()
    process.env = { ...OLD_ENV }
    process.env.SHOPIFY_API_KEY = 'test_key'
    process.env.SHOPIFY_API_SECRET = 'test_secret'
    process.env.NEXT_PUBLIC_CONSOLE_URL = 'https://console.example.com'
    process.env.INTERNAL_API_BASE = 'https://internal-api.example.com'
    process.env.API_BASE_URL = 'https://public-api.example.com'
    process.env.SHOPIFY_OAUTH_CALLBACK_BASE = 'https://public-api.example.com'
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('redirects with error when required params are missing', async () => {
    const req = new Request('https://api.example.com/api/platforms/shopify/oauth/callback')
    // @ts-expect-error NextRequest compatible
    const res = await callbackGET(req)
    // Expect a redirect to the console error page (302)
    expect(res.status).toBe(307)
    const location = res.headers.get('location') || ''
    expect(location).toContain('/integrations/shopify?')
  })

  it('redirects with invalid signature when HMAC does not match', async () => {
    const state = encodeOAuthState({ projectSlug: 'demo' })
    const params = new URLSearchParams({
      code: 'test_code',
      shop: 'test-shop.myshopify.com',
      state,
      timestamp: '1234567890',
      hmac: 'bad-hmac',
    })

    const req = new Request(`https://api.example.com/api/platforms/shopify/oauth/callback?${params.toString()}`)
    // @ts-expect-error NextRequest compatible
    const res = await callbackGET(req)

    expect(res.status).toBe(307)
    const location = res.headers.get('location') || ''
    expect(location).toContain('error=invalid_signature')
  })

  it('exchanges token, saves integration, and redirects to success', async () => {
    const state = encodeOAuthState({ projectSlug: 'demo', host: 'admin.shopify.com' })
    const params = new URLSearchParams({
      code: 'test_code',
      shop: 'test-shop.myshopify.com',
      state,
      timestamp: '1234567890',
    })

    const baseParams = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('&')

    const hmac = crypto.createHmac('sha256', process.env.SHOPIFY_API_SECRET!).update(baseParams).digest('hex')
    params.set('hmac', hmac)

    const fetchMock = vi.mocked(global.fetch)
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ access_token: 'token', scope: 'read_products' }),
          { status: 200 }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ integration: { id: 'integration-id' } }),
          { status: 200 }
        )
      )

    const req = new Request(`https://api.example.com/api/platforms/shopify/oauth/callback?${params.toString()}`)
    // @ts-expect-error NextRequest compatible
    const res = await callbackGET(req)

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://test-shop.myshopify.com/admin/oauth/access_token',
      expect.objectContaining({ method: 'POST' })
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://internal-api.example.com/api/platforms/shopify',
      expect.objectContaining({ method: 'POST' })
    )

    expect(res.status).toBe(307)
    const location = res.headers.get('location') || ''
    expect(location).toBe('https://console.example.com/p/demo/integrations/shopify?success=true&host=admin.shopify.com')
  })
})


