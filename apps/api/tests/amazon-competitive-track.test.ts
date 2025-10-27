import { describe, it, expect, vi } from 'vitest'
import { POST as trackSingle } from '../app/api/platforms/amazon/competitive/route'

vi.mock('@calibr/amazon-connector', () => ({
  getCompetitivePrice: vi.fn().mockResolvedValue({
    asin: 'A1', marketplaceId: 'TEST', currency: 'USD', lowestPrice: 12.34, buyBoxPrice: 12.99, offerCount: 3,
  })
}))

vi.mock('@calibr/db', () => {
  return {
    prisma: () => ({
      amazonCompetitivePrice: {
        create: vi.fn().mockImplementation(async (args: any) => ({ id: 'newid', ...args.data }))
      }
    })
  }
})

describe('POST /platforms/amazon/competitive', () => {
  it('saves snapshot and returns ok true', async () => {
    const req = new Request('http://localhost/api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ asin: 'A1' })
    }) as any
    const res = await trackSingle(req)
    expect(res.status).toBe(200)
    const body = await res.json() as any
    expect(body.ok).toBe(true)
    expect(body.id).toBeDefined()
  })
})

