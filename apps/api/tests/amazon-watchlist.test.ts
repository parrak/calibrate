import { describe, it, expect, vi } from 'vitest'
import { GET as listWatch, POST as addWatch, DELETE as delWatch } from '../app/api/platforms/amazon/watchlist/route'

vi.mock('@calibr/db', () => {
  const items: any[] = []
  return {
    prisma: () => ({
      amazonWatchlist: {
        count: vi.fn().mockResolvedValue(0),
        findMany: vi.fn().mockImplementation(async () => items),
        upsert: vi.fn().mockImplementation(async ({ create, update, where }: any) => {
          const idx = items.findIndex((i) => i.asin === where.asin_marketplace_unique.asin)
          if (idx >= 0) { items[idx] = { ...items[idx], ...update } } else { items.push({ id: String(items.length+1), ...create }) }
          return items[items.length-1]
        }),
        delete: vi.fn().mockImplementation(async ({ where }: any) => {
          const idx = items.findIndex((i) => i.asin === where.asin_marketplace_unique.asin)
          if (idx >= 0) items.splice(idx,1)
        }),
      }
    })
  }
})

describe('watchlist endpoints', () => {
  it('adds and lists', async () => {
    const addReq = new Request('http://localhost/api', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ asin: 'A1' }) }) as any
    const addRes = await addWatch(addReq)
    expect(addRes.status).toBe(200)
    const listRes = await listWatch(new Request('http://localhost/api') as any)
    const body = await listRes.json() as any
    expect(Array.isArray(body.items)).toBe(true)
  })

  it('deletes by asin', async () => {
    const delRes = await delWatch(new Request('http://localhost/api?asin=A1') as any)
    expect(delRes.status).toBe(200)
  })
})

