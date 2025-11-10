import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET as listRulesRoute, POST as createRuleRoute } from '../app/api/v1/rules/route'
import { GET as getRuleRoute, PATCH as updateRuleRoute, DELETE as deleteRuleRoute } from '../app/api/v1/rules/[id]/route'
import { POST as previewRuleRoute } from '../app/api/v1/rules/[id]/preview/route'
import { POST as applyRuleRoute } from '../app/api/v1/rules/[id]/apply/route'

type PricingRuleRecord = {
  id: string
  tenantId: string
  projectId: string
  name: string
  description: string | null
  selectorJson: any
  transformJson: any
  scheduleAt: Date | null
  enabled: boolean
  deletedAt: Date | null
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

type ProductRecord = {
  id: string
  tenantId: string
  projectId: string
  variantId: string | null
  skuCode: string | null
  name: string
  currentPrice: number | null
  currency: string | null
  tags: string[]
}

type RuleRunRecord = {
  id: string
  tenantId: string
  projectId: string
  ruleId: string
  status: 'PREVIEW' | 'PENDING' | 'APPLIED' | 'FAILED'
  explainJson: any
  createdAt: Date
}

type RuleTargetRecord = {
  id: string
  tenantId: string
  projectId: string
  ruleRunId: string
  productId: string
  variantId: string | null
  beforeJson: any
  afterJson: any
  status: 'PREVIEW' | 'PENDING' | 'APPLIED' | 'FAILED'
}

type StoreState = {
  projects: Array<{ id: string; slug: string; tenantId: string }>
  pricingRules: PricingRuleRecord[]
  products: ProductRecord[]
  ruleRuns: RuleRunRecord[]
  ruleTargets: RuleTargetRecord[]
  audit: any[]
  events: any[]
}

const uid = () => Math.random().toString(36).slice(2)

const initialState = (): StoreState => ({
  projects: [{ id: 'proj1', slug: 'demo', tenantId: 'tenant1' }],
  pricingRules: [
    {
      id: 'rule1',
      tenantId: 'tenant1',
      projectId: 'proj1',
      name: 'Summer Sale',
      description: '20% off all products',
      selectorJson: { predicates: [{ type: 'all' }], operator: 'AND' },
      transformJson: {
        transform: { type: 'percentage', value: -20 },
        constraints: { floor: 100 }
      },
      scheduleAt: null,
      enabled: true,
      deletedAt: null,
      createdBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],
  products: [
    {
      id: 'prod1',
      tenantId: 'tenant1',
      projectId: 'proj1',
      variantId: 'var1',
      skuCode: 'SKU-001',
      name: 'Product 1',
      currentPrice: 1000,
      currency: 'USD',
      tags: ['electronics']
    },
    {
      id: 'prod2',
      tenantId: 'tenant1',
      projectId: 'proj1',
      variantId: 'var2',
      skuCode: 'SKU-002',
      name: 'Product 2',
      currentPrice: 2000,
      currency: 'USD',
      tags: ['clothing']
    },
    {
      id: 'prod3',
      tenantId: 'tenant1',
      projectId: 'proj1',
      variantId: null,
      skuCode: 'SKU-003',
      name: 'Product 3',
      currentPrice: 500,
      currency: 'USD',
      tags: ['electronics', 'sale']
    }
  ],
  ruleRuns: [],
  ruleTargets: [],
  audit: [],
  events: []
})

let store: StoreState

beforeEach(() => {
  store = initialState()
  vi.clearAllMocks()
})

vi.mock('@calibr/db', () => {
  const mockPrisma = () => ({
    project: {
      findUnique: vi.fn(async ({ where }: any) => {
        const project = store.projects.find(p => p.slug === where.slug || p.id === where.id)
        return project || null
      })
    },
    pricingRule: {
      findMany: vi.fn(async ({ where, orderBy, take, cursor, skip }: any) => {
        let rules = store.pricingRules.filter(r =>
          r.projectId === where.projectId &&
          r.tenantId === where.tenantId &&
          r.deletedAt === null
        )

        if (where.enabled !== undefined) {
          rules = rules.filter(r => r.enabled === where.enabled)
        }

        if (where.OR) {
          rules = rules.filter(r => {
            return where.OR.some((condition: any) => {
              if (condition.name?.contains) {
                return r.name.toLowerCase().includes(condition.name.contains.toLowerCase())
              }
              return false
            })
          })
        }

        if (orderBy?.createdAt === 'desc') {
          rules = rules.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        }

        if (cursor) {
          const cursorIndex = rules.findIndex(r => r.id === cursor.id)
          if (cursorIndex >= 0 && skip) {
            rules = rules.slice(cursorIndex + skip)
          }
        }

        if (take) {
          rules = rules.slice(0, take)
        }

        return rules
      }),
      findFirst: vi.fn(async ({ where }: any) => {
        return store.pricingRules.find(r =>
          (where.id ? r.id === where.id : true) &&
          r.projectId === where.projectId &&
          r.tenantId === where.tenantId &&
          r.deletedAt === null
        ) || null
      }),
      create: vi.fn(async ({ data }: any) => {
        const newRule: PricingRuleRecord = {
          id: `rule-${uid()}`,
          tenantId: data.tenantId,
          projectId: data.projectId,
          name: data.name,
          description: data.description,
          selectorJson: data.selectorJson,
          transformJson: data.transformJson,
          scheduleAt: data.scheduleAt,
          enabled: data.enabled,
          deletedAt: null,
          createdBy: data.createdBy,
          createdAt: new Date(),
          updatedAt: new Date()
        }
        store.pricingRules.push(newRule)
        return newRule
      }),
      update: vi.fn(async ({ where, data }: any) => {
        const rule = store.pricingRules.find(r => r.id === where.id)
        if (!rule) throw new Error('NotFound')

        Object.assign(rule, {
          ...data,
          updatedAt: new Date()
        })
        return rule
      })
    },
    product: {
      findMany: vi.fn(async ({ where }: any) => {
        let products = store.products.filter(p =>
          p.tenantId === where.tenantId &&
          p.projectId === where.projectId
        )

        // Handle SKU filter
        if (where.skuCode?.in) {
          products = products.filter(p => where.skuCode.in.includes(p.skuCode))
        }

        // Handle tag filter
        if (where.tags?.hasSome) {
          products = products.filter(p =>
            where.tags.hasSome.some((tag: string) => p.tags.includes(tag))
          )
        }

        // Handle price range
        if (where.currentPrice) {
          if (where.currentPrice.gte !== undefined) {
            products = products.filter(p => p.currentPrice && p.currentPrice >= where.currentPrice.gte)
          }
          if (where.currentPrice.lte !== undefined) {
            products = products.filter(p => p.currentPrice && p.currentPrice <= where.currentPrice.lte)
          }
        }

        return products
      })
    },
    ruleRun: {
      create: vi.fn(async ({ data }: any) => {
        const newRun: RuleRunRecord = {
          id: `run-${uid()}`,
          tenantId: data.tenantId,
          projectId: data.projectId,
          ruleId: data.ruleId,
          status: data.status,
          explainJson: data.explainJson,
          createdAt: new Date()
        }
        store.ruleRuns.push(newRun)
        return newRun
      })
    },
    ruleTarget: {
      createMany: vi.fn(async ({ data }: any) => {
        const targets = Array.isArray(data) ? data : [data]
        targets.forEach((target: any) => {
          const newTarget: RuleTargetRecord = {
            id: `target-${uid()}`,
            tenantId: target.tenantId,
            projectId: target.projectId,
            ruleRunId: target.ruleRunId,
            productId: target.productId,
            variantId: target.variantId,
            beforeJson: target.beforeJson,
            afterJson: target.afterJson,
            status: target.status
          }
          store.ruleTargets.push(newTarget)
        })
        return { count: targets.length }
      })
    },
    audit: {
      create: vi.fn(async ({ data }: any) => {
        const audit = {
          id: `audit-${uid()}`,
          ...data,
          createdAt: new Date()
        }
        store.audit.push(audit)
        return audit
      })
    },
    event: {
      create: vi.fn(async ({ data }: any) => {
        const event = {
          id: `event-${uid()}`,
          ...data,
          createdAt: new Date()
        }
        store.events.push(event)
        return event
      })
    },
    $transaction: vi.fn(async (callback: any) => {
      return await callback(mockPrisma())
    })
  })

  return {
    prisma: mockPrisma,
    Prisma: {
      PrismaClientKnownRequestError: class extends Error {
        code: string
        constructor(message: string, code: string) {
          super(message)
          this.code = code
        }
      }
    }
  }
})

describe('Pricing Rules API - End to End', () => {
  describe('GET /api/v1/rules - List Rules', () => {
    it('should return all rules for a project', async () => {
      const req = new NextRequest('http://localhost/api/v1/rules?project=demo')
      const response = await listRulesRoute(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.items).toHaveLength(1)
      expect(data.items[0].name).toBe('Summer Sale')
      expect(data.items[0].enabled).toBe(true)
    })

    it('should filter by enabled status', async () => {
      // Add a disabled rule
      store.pricingRules.push({
        id: 'rule2',
        tenantId: 'tenant1',
        projectId: 'proj1',
        name: 'Winter Sale',
        description: null,
        selectorJson: { predicates: [{ type: 'all' }], operator: 'AND' },
        transformJson: { transform: { type: 'percentage', value: -10 }, constraints: {} },
        scheduleAt: null,
        enabled: false,
        deletedAt: null,
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date()
      })

      const req = new NextRequest('http://localhost/api/v1/rules?project=demo&enabled=true')
      const response = await listRulesRoute(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.items).toHaveLength(1)
      expect(data.items.every((r: any) => r.enabled)).toBe(true)
    })

    it('should search by name', async () => {
      const req = new NextRequest('http://localhost/api/v1/rules?project=demo&q=summer')
      const response = await listRulesRoute(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.items).toHaveLength(1)
      expect(data.items[0].name).toBe('Summer Sale')
    })

    it('should return 400 if project parameter is missing', async () => {
      const req = new NextRequest('http://localhost/api/v1/rules')
      const response = await listRulesRoute(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('BadRequest')
    })
  })

  describe('POST /api/v1/rules - Create Rule', () => {
    it('should create a new pricing rule', async () => {
      const ruleData = {
        name: 'Test Rule',
        description: 'A test pricing rule',
        selectorJson: {
          predicates: [{ type: 'tag', tags: ['electronics'] }],
          operator: 'AND'
        },
        transformJson: {
          transform: { type: 'percentage', value: -15 },
          constraints: { floor: 100, ceiling: 10000 }
        },
        enabled: true
      }

      const req = new NextRequest('http://localhost/api/v1/rules?project=demo', {
        method: 'POST',
        body: JSON.stringify(ruleData)
      })

      const response = await createRuleRoute(req)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.name).toBe('Test Rule')
      expect(data.description).toBe('A test pricing rule')
      expect(data.enabled).toBe(true)
      expect(data.selectorJson).toEqual(ruleData.selectorJson)
      expect(data.transformJson).toEqual(ruleData.transformJson)

      // Verify rule was added to store
      expect(store.pricingRules).toHaveLength(2)

      // Verify audit entry was created
      expect(store.audit).toHaveLength(1)
      expect(store.audit[0].action).toBe('create')
      expect(store.audit[0].entity).toBe('PricingRule')

      // Verify event was created
      expect(store.events).toHaveLength(1)
      expect(store.events[0].kind).toBe('rule.created')
    })

    it('should return 400 if name is missing', async () => {
      const req = new NextRequest('http://localhost/api/v1/rules?project=demo', {
        method: 'POST',
        body: JSON.stringify({
          selectorJson: { predicates: [], operator: 'AND' },
          transformJson: { transform: { type: 'percentage', value: 0 } }
        })
      })

      const response = await createRuleRoute(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('ValidationError')
    })

    it('should return 400 if selectorJson is missing', async () => {
      const req = new NextRequest('http://localhost/api/v1/rules?project=demo', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test',
          transformJson: { transform: { type: 'percentage', value: 0 } }
        })
      })

      const response = await createRuleRoute(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('ValidationError')
    })

    it('should return 400 if transformJson is missing', async () => {
      const req = new NextRequest('http://localhost/api/v1/rules?project=demo', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test',
          selectorJson: { predicates: [], operator: 'AND' }
        })
      })

      const response = await createRuleRoute(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('ValidationError')
    })
  })

  describe('GET /api/v1/rules/:id - Get Rule', () => {
    it('should return a specific rule', async () => {
      const req = new NextRequest('http://localhost/api/v1/rules/rule1?project=demo')
      const response = await getRuleRoute(req, { params: Promise.resolve({ id: 'rule1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.id).toBe('rule1')
      expect(data.name).toBe('Summer Sale')
    })

    it('should return 404 if rule not found', async () => {
      const req = new NextRequest('http://localhost/api/v1/rules/nonexistent?project=demo')
      const response = await getRuleRoute(req, { params: Promise.resolve({ id: 'nonexistent' }) })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('NotFound')
    })
  })

  describe('PATCH /api/v1/rules/:id - Update Rule', () => {
    it('should update a rule name', async () => {
      const req = new NextRequest('http://localhost/api/v1/rules/rule1?project=demo', {
        method: 'PATCH',
        body: JSON.stringify({ name: 'Updated Summer Sale' })
      })

      const response = await updateRuleRoute(req, { params: Promise.resolve({ id: 'rule1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.name).toBe('Updated Summer Sale')
      expect(store.pricingRules[0].name).toBe('Updated Summer Sale')
    })

    it('should update rule enabled status', async () => {
      const req = new NextRequest('http://localhost/api/v1/rules/rule1?project=demo', {
        method: 'PATCH',
        body: JSON.stringify({ enabled: false })
      })

      const response = await updateRuleRoute(req, { params: Promise.resolve({ id: 'rule1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.enabled).toBe(false)
      expect(store.pricingRules[0].enabled).toBe(false)

      // Verify audit entry
      expect(store.audit.length).toBeGreaterThan(0)
      expect(store.audit[store.audit.length - 1].action).toBe('update')
    })

    it('should return 404 if rule not found', async () => {
      const req = new NextRequest('http://localhost/api/v1/rules/nonexistent?project=demo', {
        method: 'PATCH',
        body: JSON.stringify({ name: 'Test' })
      })

      const response = await updateRuleRoute(req, { params: Promise.resolve({ id: 'nonexistent' }) })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('NotFound')
    })
  })

  describe('DELETE /api/v1/rules/:id - Delete Rule', () => {
    it('should soft delete a rule', async () => {
      const req = new NextRequest('http://localhost/api/v1/rules/rule1?project=demo', {
        method: 'DELETE'
      })

      const response = await deleteRuleRoute(req, { params: Promise.resolve({ id: 'rule1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)

      // Verify rule is soft deleted
      expect(store.pricingRules[0].deletedAt).toBeTruthy()
      expect(store.pricingRules[0].enabled).toBe(false)

      // Verify audit entry
      expect(store.audit.length).toBeGreaterThan(0)
      expect(store.audit[store.audit.length - 1].action).toBe('delete')
    })

    it('should return 404 if rule not found', async () => {
      const req = new NextRequest('http://localhost/api/v1/rules/nonexistent?project=demo', {
        method: 'DELETE'
      })

      const response = await deleteRuleRoute(req, { params: Promise.resolve({ id: 'nonexistent' }) })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('NotFound')
    })
  })

  describe('POST /api/v1/rules/:id/preview - Preview Rule', () => {
    it('should preview rule execution and return matched products', async () => {
      const req = new NextRequest('http://localhost/api/v1/rules/rule1/preview?project=demo', {
        method: 'POST'
      })

      const response = await previewRuleRoute(req, { params: Promise.resolve({ id: 'rule1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.status).toBe('PREVIEW')
      expect(data.matchedProducts).toBe(3) // All products match "all" selector
      expect(data.targets).toBeDefined()
      expect(data.totalTargets).toBe(3)
      expect(data.appliedTargets).toBeLessThanOrEqual(3)

      // Verify preview run was created
      expect(store.ruleRuns).toHaveLength(1)
      expect(store.ruleRuns[0].status).toBe('PREVIEW')

      // Verify targets were created
      expect(store.ruleTargets.length).toBeGreaterThan(0)

      // Verify audit entry
      expect(store.audit.length).toBeGreaterThan(0)
      expect(store.audit[store.audit.length - 1].action).toBe('preview')
    })

    it('should return 404 if rule not found', async () => {
      const req = new NextRequest('http://localhost/api/v1/rules/nonexistent/preview?project=demo', {
        method: 'POST'
      })

      const response = await previewRuleRoute(req, { params: Promise.resolve({ id: 'nonexistent' }) })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('NotFound')
    })
  })

  describe('End-to-End Flow - Create, Preview, Update, Delete', () => {
    it('should complete full lifecycle of a pricing rule', async () => {
      // 1. Create a new rule
      const createReq = new NextRequest('http://localhost/api/v1/rules?project=demo', {
        method: 'POST',
        body: JSON.stringify({
          name: 'E2E Test Rule',
          description: 'End-to-end test rule',
          selectorJson: {
            predicates: [{ type: 'tag', tags: ['electronics'] }],
            operator: 'AND'
          },
          transformJson: {
            transform: { type: 'percentage', value: -10 },
            constraints: { floor: 100 }
          },
          enabled: true
        })
      })

      const createResponse = await createRuleRoute(createReq)
      const createdRule = await createResponse.json()

      expect(createResponse.status).toBe(201)
      expect(createdRule.id).toBeDefined()

      // 2. List rules and verify it's included
      const listReq = new NextRequest('http://localhost/api/v1/rules?project=demo')
      const listResponse = await listRulesRoute(listReq)
      const listData = await listResponse.json()

      expect(listResponse.status).toBe(200)
      expect(listData.items.length).toBeGreaterThan(1)
      expect(listData.items.some((r: any) => r.id === createdRule.id)).toBe(true)

      // 3. Preview the rule
      const previewReq = new NextRequest(
        `http://localhost/api/v1/rules/${createdRule.id}/preview?project=demo`,
        { method: 'POST' }
      )
      const previewResponse = await previewRuleRoute(previewReq, {
        params: Promise.resolve({ id: createdRule.id })
      })
      const previewData = await previewResponse.json()

      expect(previewResponse.status).toBe(200)
      expect(previewData.matchedProducts).toBeGreaterThan(0)

      // 4. Update the rule
      const updateReq = new NextRequest(
        `http://localhost/api/v1/rules/${createdRule.id}?project=demo`,
        {
          method: 'PATCH',
          body: JSON.stringify({ enabled: false })
        }
      )
      const updateResponse = await updateRuleRoute(updateReq, {
        params: Promise.resolve({ id: createdRule.id })
      })
      const updatedRule = await updateResponse.json()

      expect(updateResponse.status).toBe(200)
      expect(updatedRule.enabled).toBe(false)

      // 5. Delete the rule
      const deleteReq = new NextRequest(
        `http://localhost/api/v1/rules/${createdRule.id}?project=demo`,
        { method: 'DELETE' }
      )
      const deleteResponse = await deleteRuleRoute(deleteReq, {
        params: Promise.resolve({ id: createdRule.id })
      })
      const deleteData = await deleteResponse.json()

      expect(deleteResponse.status).toBe(200)
      expect(deleteData.success).toBe(true)

      // 6. Verify it doesn't appear in list anymore
      const finalListReq = new NextRequest('http://localhost/api/v1/rules?project=demo')
      const finalListResponse = await listRulesRoute(finalListReq)
      const finalListData = await finalListResponse.json()

      expect(finalListResponse.status).toBe(200)
      expect(finalListData.items.some((r: any) => r.id === createdRule.id)).toBe(false)
    })
  })
})
