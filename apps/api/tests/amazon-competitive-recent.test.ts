import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET as recent } from '../app/api/platforms/amazon/competitive/recent/route'

vi.mock('@calibr/db', () => {
  return {
    prisma: () => ({
      amazonCompetitivePrice: {
        findMany: vi.fn().mockResolvedValue([
          { id: '1', asin: 'A1', retrievedAt: new Date(), lowestPriceCents: 1000, buyBoxPriceCents: 1100, offerCount: 3 },
          { id: '2', asin: 'A1', retrievedAt: new Date(Date.now() - 1000), lowestPriceCents: 1200, buyBoxPriceCents: 1300, offerCount: 2 },
          { id: '3', asin: 'A2', retrievedAt: new Date(), lowestPriceCents: 500, buyBoxPriceCents: null, offerCount: 1 },
        ])
      }
    })
  }
})

describe('GET /platforms/amazon/competitive/recent', () => {
  it('dedupes by ASIN and paginates', async () => {
    const req = new Request('http://localhost/api?limit=1&page=1') as any
    const res = await recent(req)
    expect(res.status).toBe(200)
    const body = await res.json() as any
    expect(Array.isArray(body.items)).toBe(true)
    // With limit=1 page=1 we should get one item
    expect(body.items.length).toBe(1)
    // next page should also have items because we had A2
    const req2 = new Request('http://localhost/api?limit=1&page=2') as any
    const res2 = await recent(req2)
    const body2 = await res2.json() as any
    expect(body2.items.length).toBe(1)
  })
})

