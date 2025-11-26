import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET as auditRoute } from '../app/api/v1/audit/route'

type StoreState = {
  projects: Array<{ id: string; slug: string; tenantId: string }>
  tenants: Array<{ id: string; name: string }>
  audit: Array<{
    id: string
    tenantId: string
    projectId: string | null
    entity: string
    entityId: string
    action: string
    actor: string
    explain: Record<string, any> | null
    createdAt: Date
  }>
}

const uid = () => Math.random().toString(36).slice(2)

const initialState = (): StoreState => ({
  projects: [
    { id: 'proj1', slug: 'demo', tenantId: 'tenant1' },
    { id: 'proj2', slug: 'other', tenantId: 'tenant2' },
  ],
  tenants: [
    { id: 'tenant1', name: 'Demo Tenant' },
    { id: 'tenant2', name: 'Other Tenant' },
  ],
  audit: [
    {
      id: 'audit_1',
      tenantId: 'tenant1',
      projectId: 'proj1',
      entity: 'PriceChange',
      entityId: 'pc_1',
      action: 'approved',
      actor: 'user-admin',
      explain: { reason: 'Manual approval', timestamp: '2025-01-01T00:00:00Z' },
      createdAt: new Date('2025-01-01T00:00:00Z'),
    },
    {
      id: 'audit_2',
      tenantId: 'tenant1',
      projectId: 'proj1',
      entity: 'PriceChange',
      entityId: 'pc_1',
      action: 'applied',
      actor: 'system',
      explain: { reason: 'Auto-apply', timestamp: '2025-01-01T00:01:00Z' },
      createdAt: new Date('2025-01-01T00:01:00Z'),
    },
    {
      id: 'audit_3',
      tenantId: 'tenant1',
      projectId: 'proj1',
      entity: 'PriceChange',
      entityId: 'pc_2',
      action: 'rejected',
      actor: 'user-editor',
      explain: { reason: 'Price too high', timestamp: '2025-01-01T00:02:00Z' },
      createdAt: new Date('2025-01-01T00:02:00Z'),
    },
    {
      id: 'audit_4',
      tenantId: 'tenant1',
      projectId: 'proj1',
      entity: 'Product',
      entityId: 'prod_1',
      action: 'created',
      actor: 'user-admin',
      explain: null,
      createdAt: new Date('2025-01-01T00:03:00Z'),
    },
    {
      id: 'audit_5',
      tenantId: 'tenant2',
      projectId: 'proj2',
      entity: 'PriceChange',
      entityId: 'pc_3',
      action: 'approved',
      actor: 'user-admin',
      explain: null,
      createdAt: new Date('2025-01-01T00:04:00Z'),
    },
  ],
})

const store = (() => {
  let state = initialState()

  const clone = <T>(value: T): T => structuredClone(value)

  const client = {
    project: {
      findUnique: async ({ where, include }: any) => {
        if (where?.slug) {
          const project = clone(state.projects.find((p) => p.slug === where.slug) ?? null)
          if (!project) return null
          if (include?.Tenant) {
            return {
              ...project,
              Tenant: clone(state.tenants.find((t) => t.id === project.tenantId) ?? null),
            }
          }
          return project
        }
        if (where?.id) {
          return clone(state.projects.find((p) => p.id === where.id) ?? null)
        }
        return null
      },
    },
    audit: {
      findMany: async (args: any) => {
        let results = state.audit.slice()

        // Filter by where clause
        if (args?.where) {
          const where = args.where
          if (where.tenantId) {
            results = results.filter((a) => a.tenantId === where.tenantId)
          }
          if (where.projectId) {
            results = results.filter((a) => a.projectId === where.projectId)
          }
          if (where.entity) {
            results = results.filter((a) => a.entity === where.entity)
          }
          if (where.entityId) {
            results = results.filter((a) => a.entityId === where.entityId)
          }
          if (where.action) {
            results = results.filter((a) => a.action === where.action)
          }
          if (where.actor) {
            results = results.filter((a) => a.actor === where.actor)
          }
          if (where.createdAt) {
            if (where.createdAt.gte) {
              results = results.filter((a) => a.createdAt >= where.createdAt.gte)
            }
            if (where.createdAt.lte) {
              results = results.filter((a) => a.createdAt <= where.createdAt.lte)
            }
          }
        }

        // Sort by createdAt desc
        results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

        // Handle cursor pagination
        if (args?.cursor?.id) {
          const idx = results.findIndex((a) => a.id === args.cursor.id)
          if (idx === -1) {
            throw Object.assign(new Error('cursor not found'), { code: 'P2025' })
          }
          results = results.slice(idx + (args?.skip ?? 0))
        }

        const take = args?.take ?? results.length
        return clone(results.slice(0, take))
      },
    },
  }

  return {
    get state() {
      return state
    },
    client,
    reset() {
      state = initialState()
    },
    pushAudit(audit: StoreState['audit'][0]) {
      state.audit.push(audit)
    },
  }
})()

vi.mock('@calibr/db', () => ({
  prisma: () => store.client,
}))

const makeRequest = (url: string, init: { method?: string; headers?: Record<string, string> } = {}) => {
  const { method = 'GET', headers = {} } = init
  const request = new Request(url, { method, headers })
  return new NextRequest(request)
}

describe('audit API', () => {
  beforeEach(() => {
    store.reset()
  })

  it('requires project query parameter', async () => {
    const req = makeRequest('http://localhost/api/v1/audit')
    const res = await auditRoute(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('BadRequest')
  })

  it('returns 404 for non-existent project', async () => {
    const req = makeRequest('http://localhost/api/v1/audit?project=nonexistent')
    const res = await auditRoute(req)
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toBe('NotFound')
  })

  it('lists all audit records for a project', async () => {
    const req = makeRequest('http://localhost/api/v1/audit?project=demo')
    const res = await auditRoute(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body.items)).toBe(true)
    expect(body.items.length).toBe(4)
    expect(body.items.every((item: any) => item.tenantId === 'tenant1')).toBe(true)
    expect(body.role).toBe('ADMIN')
  })

  it('filters audit records by entity', async () => {
    const req = makeRequest('http://localhost/api/v1/audit?project=demo&entity=PriceChange')
    const res = await auditRoute(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.items.length).toBe(3)
    expect(body.items.every((item: any) => item.entity === 'PriceChange')).toBe(true)
  })

  it('filters audit records by entityId', async () => {
    const req = makeRequest('http://localhost/api/v1/audit?project=demo&entityId=pc_1')
    const res = await auditRoute(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.items.length).toBe(2)
    expect(body.items.every((item: any) => item.entityId === 'pc_1')).toBe(true)
  })

  it('filters audit records by action', async () => {
    const req = makeRequest('http://localhost/api/v1/audit?project=demo&action=approved')
    const res = await auditRoute(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.items.length).toBe(1)
    expect(body.items.every((item: any) => item.action === 'approved')).toBe(true)
  })

  it('filters audit records by actor', async () => {
    const req = makeRequest('http://localhost/api/v1/audit?project=demo&actor=system')
    const res = await auditRoute(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.items.length).toBe(1)
    expect(body.items.every((item: any) => item.actor === 'system')).toBe(true)
  })

  it('filters audit records by date range', async () => {
    const req = makeRequest(
      'http://localhost/api/v1/audit?project=demo&startDate=2025-01-01T00:01:00Z&endDate=2025-01-01T00:02:30Z'
    )
    const res = await auditRoute(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.items.length).toBe(2)
  })

  it('supports pagination with cursor', async () => {
    // Add more audit records for pagination
    for (let i = 0; i < 55; i++) {
      store.pushAudit({
        id: `audit_extra_${i}`,
        tenantId: 'tenant1',
        projectId: 'proj1',
        entity: 'PriceChange',
        entityId: `pc_${i}`,
        action: 'created',
        actor: 'user-admin',
        explain: null,
        createdAt: new Date(Date.now() - i * 1000),
      })
    }

    const firstReq = makeRequest('http://localhost/api/v1/audit?project=demo')
    const firstRes = await auditRoute(firstReq)
    expect(firstRes.status).toBe(200)
    const firstBody = await firstRes.json()
    expect(firstBody.items.length).toBe(50)
    expect(firstBody.nextCursor).toBeDefined()

    const cursor = firstBody.nextCursor
    const secondReq = makeRequest(`http://localhost/api/v1/audit?project=demo&cursor=${cursor}`)
    const secondRes = await auditRoute(secondReq)
    expect(secondRes.status).toBe(200)
    const secondBody = await secondRes.json()
    expect(Array.isArray(secondBody.items)).toBe(true)
    expect(secondBody.items.length).toBeGreaterThan(0)
  })

  it('combines multiple filters', async () => {
    const req = makeRequest(
      'http://localhost/api/v1/audit?project=demo&entity=PriceChange&action=approved&actor=user-admin'
    )
    const res = await auditRoute(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.items.length).toBe(1)
    expect(body.items[0].entity).toBe('PriceChange')
    expect(body.items[0].action).toBe('approved')
    expect(body.items[0].actor).toBe('user-admin')
  })

  it('isolates audit records by tenant', async () => {
    const req = makeRequest('http://localhost/api/v1/audit?project=other')
    const res = await auditRoute(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.items.length).toBe(1)
    expect(body.items.every((item: any) => item.tenantId === 'tenant2')).toBe(true)
  })

  it('returns audit records ordered by createdAt desc', async () => {
    const req = makeRequest('http://localhost/api/v1/audit?project=demo')
    const res = await auditRoute(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.items.length).toBeGreaterThan(1)

    // Verify they are sorted by createdAt in descending order
    for (let i = 1; i < body.items.length; i++) {
      const prevDate = new Date(body.items[i - 1].createdAt)
      const currDate = new Date(body.items[i].createdAt)
      expect(prevDate.getTime()).toBeGreaterThanOrEqual(currDate.getTime())
    }
  })
})
