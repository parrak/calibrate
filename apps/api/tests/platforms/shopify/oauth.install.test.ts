import { describe, it, expect, beforeEach, vi } from 'vitest'

// Import the route handler from the App Router file
import { GET as installGET } from '../../app/api/platforms/shopify/oauth/install/route.ts'

describe('Shopify OAuth Install Route', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    vi.restoreAllMocks()
    process.env = { ...OLD_ENV }
    process.env.SHOPIFY_API_KEY = 'test_key'
    process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com'
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
    const url = 'https://api.example.com/api/platforms/shopify/oauth/install?project=demo&shop=test-store.myshopify.com'
    const req = new Request(url)
    // @ts-expect-error NextRequest compatible
    const res = await installGET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.installUrl).toContain('https://test-store.myshopify.com/admin/oauth/authorize')
    expect(Array.isArray(body.scopes)).toBe(true)
  })
})


