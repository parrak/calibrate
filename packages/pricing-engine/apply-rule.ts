/**
 * Apply Rule — M1.1: Pricing Engine MVP
 * 
 * Applies a pricing rule to matching products, creating price changes
 * with explain traces and event emission
 */

import { prisma } from '@calibr/db'
import { EventWriter } from '@calibr/db/eventing'
import type { PricingRule } from './rules-dsl'
import { previewRule } from './preview'
import { createId } from '@paralleldrive/cuid2'

export type ApplyRuleOptions = {
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
  actor: string
  correlationId?: string
}

export type ApplyRuleResult = {
  priceChangeIds: string[]
  explainTraceId: string
  summary: {
    total: number
    matched: number
    applied: number
    failed: number
  }
}

/**
 * Apply a pricing rule to matching products
 */
export async function applyRule(options: ApplyRuleOptions): Promise<ApplyRuleResult> {
  const { tenantId, projectId, rule, policyRules, actor, correlationId } = options

  // First, preview the rule to see what would change
  const preview = await previewRule({
    tenantId,
    projectId,
    rule,
    policyRules,
    actor,
    dryRun: false
  })

  const priceChangeIds: string[] = []
  let applied = 0
  let failed = 0

  // Create price changes for matched items that would change
  for (const result of preview.results) {
    if (!result.matched || result.delta === 0) continue
    if (result.policyEval && !result.policyEval.ok) {
      failed++
      continue
    }

    try {
      const priceChange = await prisma().priceChange.create({
        data: {
          id: createId(),
          tenantId,
          projectId,
          skuId: result.skuId,
          source: `rule:${rule.id || 'unknown'}`,
          fromAmount: Math.round(result.currentPrice * 100), // Convert to cents
          toAmount: Math.round(result.proposedPrice * 100),
          currency: result.currency,
          status: 'PENDING',
          selectorJson: rule.selector as any,
          transformJson: rule.transform as any,
          scheduleAt: rule.schedule?.scheduledAt || null,
          state: 'PENDING',
          createdBy: actor,
          policyResult: result.policyEval as any,
          context: {
            ruleId: rule.id,
            ruleName: rule.name,
            preview: true
          }
        }
      })

      priceChangeIds.push(priceChange.id)
      applied++
    } catch (error) {
      console.error(`Failed to create price change for SKU ${result.skuCode}:`, error)
      failed++
    }
  }

  // Create explain trace
  const explainTrace = await prisma().explainTrace.create({
    data: {
      id: createId(),
      tenantId,
      projectId,
      entity: 'Rule',
      entityId: rule.id || 'unknown',
      action: 'apply',
      actor,
      trace: {
        rule: {
          id: rule.id,
          name: rule.name,
          selector: rule.selector,
          transform: rule.transform,
          schedule: rule.schedule
        },
        preview: preview.summary,
        applied: {
          count: applied,
          priceChangeIds
        },
        failed: {
          count: failed
        },
        policyRules
      },
      metadata: {
        correlationId,
        timestamp: new Date().toISOString()
      }
    }
  })

  // Emit event to event log
  const eventWriter = new EventWriter(prisma())
  const eventKey = `rule-apply-${rule.id || 'unknown'}-${Date.now()}`
  await eventWriter.writeEvent({
    eventKey,
    tenantId,
    projectId,
    eventType: 'pricechange.rule.applied',
    payload: {
      ruleId: rule.id,
      ruleName: rule.name,
      priceChangeIds,
      summary: {
        total: preview.summary.total,
        matched: preview.summary.matched,
        applied,
        failed
      }
    },
    metadata: {
      actor,
      explainTraceId: explainTrace.id
    },
    correlationId
  })

  return {
    priceChangeIds,
    explainTraceId: explainTrace.id,
    summary: {
      total: preview.summary.total,
      matched: preview.summary.matched,
      applied,
      failed
    }
  }
}

