/**
 * Preview / Dry-Run — M1.1: Pricing Engine MVP
 * 
 * Provides preview functionality for pricing rules without applying changes
 */

import { prisma } from '@calibr/db'
import type { PricingRule } from './rules-dsl'
import { evaluateSelector, calculatePriceDiff } from './rules-dsl'
import { evaluatePolicy } from './evaluatePolicy'

export type PreviewResult = {
  priceChangeId?: string
  skuId: string
  skuCode: string
  currentPrice: number
  currency: string
  proposedPrice: number
  delta: number
  deltaPct: number
  policyEval?: {
    ok: boolean
    checks: Array<{ name: string; ok: boolean; [key: string]: unknown }>
  }
  matched: boolean
  reason?: string
}

export type PreviewOptions = {
  tenantId: string
  projectId: string
  rule: PricingRule
  policyRules?: {
    maxPctDelta?: number
    floor?: number
    ceiling?: number
    dailyBudgetPct?: number
    dailyBudgetUsedPct?: number
  }
  actor?: string
  dryRun?: boolean // If true, don't create price change records
}

/**
 * Preview a pricing rule against all matching products/SKUs
 */
export async function previewRule(options: PreviewOptions): Promise<{
  results: PreviewResult[]
  summary: {
    total: number
    matched: number
    wouldChange: number
    totalDelta: number
  }
}> {
  const { tenantId, projectId, rule, policyRules, actor, dryRun = true } = options

  // Find all products in the project
  const products = await prisma().product.findMany({
    where: {
      tenantId,
      projectId,
      active: true
    },
    include: {
      Sku: {
        include: {
          Price: true
        }
      }
    }
  })

  const results: PreviewResult[] = []
  let matched = 0
  let wouldChange = 0
  let totalDelta = 0

  for (const product of products) {
    for (const sku of product.Sku) {
      const price = sku.Price.find((p) => p.status === 'ACTIVE')
      if (!price) continue

      const context = {
        skuCode: sku.code,
        tags: product.tags || [],
        price: price.amount / 100, // Convert from cents
        currency: price.currency,
        productId: product.id,
        productName: product.name,
        productCode: product.code
      }

      // Check if selector matches
      const matches = evaluateSelector(rule.selector, context)
      if (!matches) {
        results.push({
          skuId: sku.id,
          skuCode: sku.code,
          currentPrice: price.amount / 100,
          currency: price.currency,
          proposedPrice: price.amount / 100,
          delta: 0,
          deltaPct: 0,
          matched: false,
          reason: 'Selector did not match'
        })
        continue
      }

      matched++

      // Calculate proposed price
      const diff = calculatePriceDiff(price.amount / 100, rule.transform)
      const proposedPrice = diff.to

      // Evaluate policy if provided
      let policyEval
      if (policyRules) {
        policyEval = evaluatePolicy(price.amount / 100, proposedPrice, policyRules)
      }

      // Only count as "would change" if price actually changes and policy passes
      const actuallyChanges = diff.delta !== 0
      const policyPasses = !policyEval || policyEval.ok

      if (actuallyChanges && policyPasses) {
        wouldChange++
        totalDelta += Math.abs(diff.delta)
      }

      results.push({
        skuId: sku.id,
        skuCode: sku.code,
        currentPrice: price.amount / 100,
        currency: price.currency,
        proposedPrice,
        delta: diff.delta,
        deltaPct: diff.deltaPct,
        policyEval,
        matched: true,
        reason: actuallyChanges
          ? policyPasses
            ? 'Would change price'
            : 'Policy check failed'
          : 'No price change needed'
      })
    }
  }

  // If not dry-run, create price change records for matched items
  if (!dryRun && matched > 0) {
    // This will be handled by the apply function
    // Preview just shows what would happen
  }

  return {
    results,
    summary: {
      total: results.length,
      matched,
      wouldChange,
      totalDelta
    }
  }
}

/**
 * Simulate a rule (preview without creating any records)
 */
export async function simulateRule(options: PreviewOptions): Promise<{
  results: PreviewResult[]
  summary: {
    total: number
    matched: number
    wouldChange: number
    totalDelta: number
  }
  explainTrace: {
    rule: PricingRule
    timestamp: Date
    actor: string | undefined
    summary: {
      total: number
      matched: number
      wouldChange: number
      totalDelta: number
    }
  }
}> {
  const preview = await previewRule({ ...options, dryRun: true })

  return {
    ...preview,
    explainTrace: {
      rule: options.rule,
      timestamp: new Date(),
      actor: options.actor,
      summary: preview.summary
    }
  }
}

