import { describe, it, expect, beforeEach, vi } from 'vitest'

// Import the route handler from the App Router file
import { GET as callbackGET } from '../../app/api/platforms/shopify/oauth/callback/route.ts'

describe('Shopify OAuth Callback Route', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    vi.restoreAllMocks()
    process.env = { ...OLD_ENV }
    process.env.SHOPIFY_API_KEY = 'test_key'
    process.env.SHOPIFY_API_SECRET = 'test_secret'
    process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com'
    process.env.NEXT_PUBLIC_CONSOLE_URL = 'https://console.example.com'
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
})


