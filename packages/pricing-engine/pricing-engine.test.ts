/**
 * Pricing Engine Integration Tests — M1.1: Pricing Engine MVP
 * 
 * Tests the complete flow: preview → apply → rollback with explain traces
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { prisma } from '@calibr/db'
import type { PricingRule } from './rules-dsl'
import { previewRule, simulateRule } from './preview'
import { applyRule } from './apply-rule'
import {
  applyPriceChangeEnhanced,
  rollbackPriceChangeEnhanced,
} from './apply-price-change-enhanced'
import { createId } from '@paralleldrive/cuid2'

// Test fixtures
const TEST_TENANT_ID = 'test-tenant-m1-1'
const TEST_PROJECT_ID = 'test-project-m1-1'
const TEST_ACTOR = 'test-actor'

// Check if database is available
// Note: DATABASE_URL might be set in CI but database not running
// We'll check this dynamically in beforeAll
const hasDatabase = !!process.env.DATABASE_URL

// Try to connect to database to verify it's actually available
async function checkDatabaseConnection(): Promise<boolean> {
  if (!hasDatabase) {
    return false
  }
  try {
    // Try a simple query to check if database is reachable
    await prisma().$queryRaw`SELECT 1`
    return true
  } catch (error) {
    // Database not available
    return false
  }
}

async function setupTestData() {
  // Create tenant
  const tenant = await prisma().tenant.upsert({
    where: { id: TEST_TENANT_ID },
    update: {},
    create: {
      id: TEST_TENANT_ID,
      name: 'Test Tenant M1.1'
    }
  })

  // Create project
  const project = await prisma().project.upsert({
    where: { id: TEST_PROJECT_ID },
    update: {},
    create: {
      id: TEST_PROJECT_ID,
      tenantId: tenant.id,
      name: 'Test Project M1.1',
      slug: 'test-project-m1-1'
    }
  })

  // Create products with SKUs and prices
  const product1 = await prisma().product.upsert({
    where: {
      tenantId_projectId_code: {
        tenantId: tenant.id,
        projectId: project.id,
        code: 'PROD-001'
      }
    },
    update: {},
    create: {
      id: createId(),
      tenantId: tenant.id,
      projectId: project.id,
      name: 'Test Product 1',
      code: 'PROD-001',
      sku: 'PROD-001',
      tags: ['sale', 'featured'],
      active: true
    }
  })

  const sku1 = await prisma().sku.upsert({
    where: {
      productId_code: {
        productId: product1.id,
        code: 'SKU-001'
      }
    },
    update: {},
    create: {
      id: createId(),
      productId: product1.id,
      name: 'Test SKU 1',
      code: 'SKU-001',
      status: 'ACTIVE'
    }
  })

  await prisma().price.upsert({
    where: {
      skuId_currency: {
        skuId: sku1.id,
        currency: 'USD'
      }
    },
    update: {},
    create: {
      id: createId(),
      skuId: sku1.id,
      currency: 'USD',
      amount: 10000, // $100.00 in cents
      status: 'ACTIVE'
    }
  })

  return { tenant, project, product1, sku1 }
}

async function cleanupTestData() {
  // Clean up in reverse order
  await prisma().explainTrace.deleteMany({
    where: { tenantId: TEST_TENANT_ID }
  })
  await prisma().priceChange.deleteMany({
    where: { tenantId: TEST_TENANT_ID }
  })
  await prisma().priceVersion.deleteMany({
    where: { price: { sku: { product: { tenantId: TEST_TENANT_ID } } } }
  })
  await prisma().price.deleteMany({
    where: { sku: { product: { tenantId: TEST_TENANT_ID } } }
  })
  await prisma().sku.deleteMany({
    where: { product: { tenantId: TEST_TENANT_ID } }
  })
  await prisma().product.deleteMany({
    where: { tenantId: TEST_TENANT_ID }
  })
  await prisma().project.deleteMany({
    where: { tenantId: TEST_TENANT_ID }
  })
  await prisma().tenant.deleteMany({
    where: { id: TEST_TENANT_ID }
  })
}

describe('Pricing Engine Integration', () => {
  let dbAvailable = false

  beforeAll(async () => {
    // Check if database is actually available
    dbAvailable = await checkDatabaseConnection()
    if (!dbAvailable) {
      console.log('⚠️  Database not available - skipping integration tests')
      return
    }
    await setupTestData()
  })

  afterAll(async () => {
    if (!dbAvailable) {
      return
    }
    try {
      await cleanupTestData()
    } catch (error) {
      // Ignore cleanup errors
      console.warn('Cleanup error (ignored):', error)
    }
  })

  describe('Preview Rule', () => {
    it.skipIf(!dbAvailable)('should preview a percentage transform rule', async () => {
      const rule: PricingRule = {
        id: createId(),
        name: 'Test Rule: +10% Sale',
        selector: {
          predicates: [{ type: 'tag', tags: ['sale'] }]
        },
        transform: {
          transform: { type: 'percentage', value: 10 },
          constraints: { maxPctDelta: 15 }
        }
      }

      const result = await previewRule({
        tenantId: TEST_TENANT_ID,
        projectId: TEST_PROJECT_ID,
        rule,
        actor: TEST_ACTOR,
        dryRun: true
      })

      expect(result.results.length).toBeGreaterThan(0)
      const matched = result.results.find((r) => r.matched)
      expect(matched).toBeDefined()
      if (matched) {
        expect(matched.proposedPrice).toBe(110) // $100 + 10%
        expect(matched.delta).toBe(10)
        expect(matched.deltaPct).toBe(10)
      }
    })

    it.skipIf(!dbAvailable)('should preview with policy evaluation', async () => {
      const rule: PricingRule = {
        id: createId(),
        name: 'Test Rule: Policy Check',
        selector: {
          predicates: [{ type: 'all' }]
        },
        transform: {
          transform: { type: 'percentage', value: 20 }
        }
      }

      const result = await previewRule({
        tenantId: TEST_TENANT_ID,
        projectId: TEST_PROJECT_ID,
        rule,
        policyRules: {
          maxPctDelta: 15 // Policy limits to 15%
        },
        actor: TEST_ACTOR,
        dryRun: true
      })

      const matched = result.results.find((r) => r.matched && r.policyEval)
      expect(matched).toBeDefined()
      if (matched) {
        expect(matched.policyEval?.ok).toBe(false) // Should fail because 20% > 15%
      }
    })
  })

  describe('Simulate Rule', () => {
    it.skipIf(!dbAvailable)('should simulate a rule without creating records', async () => {
      const rule: PricingRule = {
        id: createId(),
        name: 'Test Rule: Simulation',
        selector: {
          predicates: [{ type: 'all' }]
        },
        transform: {
          transform: { type: 'absolute', value: 5 }
        }
      }

      const result = await simulateRule({
        tenantId: TEST_TENANT_ID,
        projectId: TEST_PROJECT_ID,
        rule,
        actor: TEST_ACTOR
      })

      expect(result.explainTrace).toBeDefined()
      expect(result.explainTrace.rule.id).toBe(rule.id)
      expect(result.explainTrace.actor).toBe(TEST_ACTOR)

      // Verify no price changes were created
      const priceChanges = await prisma().priceChange.findMany({
        where: {
          tenantId: TEST_TENANT_ID,
          context: { path: ['ruleId'], equals: rule.id }
        }
      })
      expect(priceChanges.length).toBe(0)
    })
  })

  describe('Apply Rule', () => {
    it.skipIf(!dbAvailable)('should apply a rule and create price changes', async () => {
      const rule: PricingRule = {
        id: createId(),
        name: 'Test Rule: Apply +5%',
        selector: {
          predicates: [{ type: 'all' }]
        },
        transform: {
          transform: { type: 'percentage', value: 5 }
        }
      }

      const result = await applyRule({
        tenantId: TEST_TENANT_ID,
        projectId: TEST_PROJECT_ID,
        rule,
        actor: TEST_ACTOR
      })

      expect(result.priceChangeIds.length).toBeGreaterThan(0)
      expect(result.explainTraceId).toBeDefined()
      expect(result.summary.applied).toBeGreaterThan(0)

      // Verify explain trace was created
      const explainTrace = await prisma().explainTrace.findUnique({
        where: { id: result.explainTraceId }
      })
      expect(explainTrace).toBeDefined()
      expect(explainTrace?.action).toBe('apply')
      expect(explainTrace?.entity).toBe('Rule')

      // Verify event was emitted
      const events = await prisma().eventLog.findMany({
        where: {
          tenantId: TEST_TENANT_ID,
          eventType: 'pricechange.rule.applied'
        }
      })
      expect(events.length).toBeGreaterThan(0)
    })
  })

  describe('Apply Price Change Enhanced', () => {
    it.skipIf(!dbAvailable)('should apply a price change with explain trace and event', async () => {
      // Create a price change
      const sku = await prisma().sku.findFirst({
        where: { product: { tenantId: TEST_TENANT_ID } }
      })
      if (!sku) throw new Error('SKU not found')

      const priceChange = await prisma().priceChange.create({
        data: {
          id: createId(),
          tenantId: TEST_TENANT_ID,
          projectId: TEST_PROJECT_ID,
          skuId: sku.id,
          source: 'test',
          fromAmount: 10000,
          toAmount: 11000,
          currency: 'USD',
          status: 'PENDING',
          selectorJson: {},
          transformJson: {}
        }
      })

      const result = await applyPriceChangeEnhanced({
        priceChangeId: priceChange.id,
        actor: TEST_ACTOR
      })

      expect(result.explainTraceId).toBeDefined()
      expect(result.auditId).toBeDefined()
      expect(result.eventLogId).toBeDefined()

      // Verify explain trace
      const explainTrace = await prisma().explainTrace.findUnique({
        where: { id: result.explainTraceId }
      })
      expect(explainTrace).toBeDefined()
      expect(explainTrace?.action).toBe('apply')
      expect(explainTrace?.priceChangeId).toBe(priceChange.id)

      // Verify audit record
      const audit = await prisma().audit.findUnique({
        where: { id: result.auditId }
      })
      expect(audit).toBeDefined()
      expect(audit?.action).toBe('apply')

      // Verify event was emitted
      const event = await prisma().eventLog.findUnique({
        where: { id: result.eventLogId }
      })
      expect(event).toBeDefined()
      expect(event?.eventType).toBe('pricechange.applied')

      // Verify price was updated
      const price = await prisma().price.findFirst({
        where: { skuId: sku.id, currency: 'USD' }
      })
      expect(price?.amount).toBe(11000)
    })
  })

  describe('Rollback Price Change Enhanced', () => {
    it.skipIf(!dbAvailable)('should rollback a price change with explain trace and event', async () => {
      // Create and apply a price change first
      const sku = await prisma().sku.findFirst({
        where: { product: { tenantId: TEST_TENANT_ID } }
      })
      if (!sku) throw new Error('SKU not found')

      const priceChange = await prisma().priceChange.create({
        data: {
          id: createId(),
          tenantId: TEST_TENANT_ID,
          projectId: TEST_PROJECT_ID,
          skuId: sku.id,
          source: 'test',
          fromAmount: 10000,
          toAmount: 11000,
          currency: 'USD',
          status: 'APPLIED',
          selectorJson: {},
          transformJson: {}
        }
      })

      // Update price to applied state
      await prisma().price.updateMany({
        where: { skuId: sku.id, currency: 'USD' },
        data: { amount: 11000 }
      })

      const result = await rollbackPriceChangeEnhanced({
        priceChangeId: priceChange.id,
        actor: TEST_ACTOR
      })

      expect(result.explainTraceId).toBeDefined()
      expect(result.auditId).toBeDefined()
      expect(result.eventLogId).toBeDefined()

      // Verify explain trace
      const explainTrace = await prisma().explainTrace.findUnique({
        where: { id: result.explainTraceId }
      })
      expect(explainTrace).toBeDefined()
      expect(explainTrace?.action).toBe('rollback')

      // Verify event was emitted
      const event = await prisma().eventLog.findUnique({
        where: { id: result.eventLogId }
      })
      expect(event).toBeDefined()
      expect(event?.eventType).toBe('pricechange.rolled_back')

      // Verify price was restored
      const price = await prisma().price.findFirst({
        where: { skuId: sku.id, currency: 'USD' }
      })
      expect(price?.amount).toBe(10000)
    })
  })
})

