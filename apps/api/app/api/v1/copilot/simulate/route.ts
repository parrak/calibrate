import { NextRequest, NextResponse } from 'next/server'
import { withSecurity } from '@/lib/security-headers'
import { prisma } from '@calibr/db'
import { simulateRule, type PricingRule } from '@calibr/pricing-engine'
import { z } from 'zod'
import { requireProjectAccess, errorJson } from '../../price-changes/utils'

const SCHEMA_VERSION = '1.9.0'

const customSelectorPredicateSchema = z.object({
  type: z.literal('custom'),
  field: z.string(),
  operator: z.enum(['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'contains']),
  value: z.custom<unknown>((val) => val !== undefined, {
    message: 'value is required for custom selector predicates',
  }),
})

const selectorPredicateSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('all') }),
  z.object({ type: z.literal('sku'), skuCodes: z.array(z.string()) }),
  z.object({ type: z.literal('tag'), tags: z.array(z.string()) }),
  z.object({
    type: z.literal('priceRange'),
    min: z.number().optional(),
    max: z.number().optional(),
    currency: z.string().optional(),
  }),
  customSelectorPredicateSchema,
]) as unknown as z.ZodType<PricingRule['selector']['predicates'][number]>

const pricingRuleSchema: z.ZodType<PricingRule> = z.object({
  id: z.string().optional(),
  name: z.string(),
  description: z.string().optional(),
  selector: z.object({
    predicates: z.array(selectorPredicateSchema),
    operator: z.enum(['AND', 'OR']).optional(),
  }),
  transform: z.object({
    transform: z.union([
      z.object({ type: z.literal('percentage'), value: z.number() }),
      z.object({ type: z.literal('absolute'), value: z.number() }),
      z.object({ type: z.literal('set'), value: z.number() }),
      z.object({ type: z.literal('multiply'), factor: z.number() }),
    ]),
    constraints: z
      .object({
        floor: z.number().optional(),
        ceiling: z.number().optional(),
        maxPctDelta: z.number().optional(),
      })
      .optional(),
  }),
  schedule: z
    .object({
      type: z.enum(['immediate', 'scheduled', 'recurring']),
      scheduledAt: z.coerce.date().optional(),
      cron: z.string().optional(),
      timezone: z.string().optional(),
    })
    .optional(),
  enabled: z.boolean().optional(),
})

const simulateSchema = z.object({
  projectSlug: z.string().trim().min(1),
  rule: pricingRuleSchema,
  policyRules: z
    .object({
      maxPctDelta: z.number().optional(),
      floor: z.number().optional(),
      ceiling: z.number().optional(),
      dailyBudgetPct: z.number().optional(),
      dailyBudgetUsedPct: z.number().optional(),
    })
    .optional(),
  userId: z.string().trim().optional(),
  actor: z.string().trim().optional(),
  metadata: z.record(z.unknown()).optional(),
})

type SimulationLogParams = {
  tenantId: string
  projectId: string
  userId?: string
  userRole?: string
  ruleName: string
  summary: { total: number; matched: number; wouldChange: number; totalDelta: number }
  executionTime: number
  success: boolean
  error?: string
  metadata?: Record<string, unknown>
}

async function logSimulation(params: SimulationLogParams, generatedSQL?: string) {
  try {
    await prisma().copilotQueryLog.create({
      data: {
        tenantId: params.tenantId,
        projectId: params.projectId,
        userId: params.userId,
        userRole: params.userRole,
        query: `simulate:${params.ruleName}`,
        generatedSQL,
        queryType: 'simulate',
        resultCount: params.summary.total,
        executionTime: params.executionTime,
        schemaVersion: SCHEMA_VERSION,
        method: 'simulation',
        success: params.success,
        error: params.error,
        metadata: {
          matched: params.summary.matched,
          wouldChange: params.summary.wouldChange,
          totalDelta: params.summary.totalDelta,
          ...(params.metadata || {}),
        },
      },
    })
  } catch (error) {
    console.error('[Copilot Simulation] Failed to log simulation:', error)
  }
}

export const POST = withSecurity(async function POST(req: NextRequest) {
  const start = Date.now()

  const parsed = simulateSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request payload', issues: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { projectSlug, rule, policyRules, actor, metadata } = parsed.data

  const access = await requireProjectAccess(req, projectSlug, 'EDITOR')
  if ('error' in access) {
    return errorJson(access.error)
  }

  try {
    const userId = access.session.userId
    const simulation = await simulateRule({
      tenantId: access.project.tenantId,
      projectId: access.project.id,
      rule,
      policyRules,
      actor: actor || userId,
      dryRun: true,
    })

    await logSimulation(
      {
        tenantId: access.project.tenantId,
        projectId: access.project.id,
        userId,
        userRole: access.membership.role,
        ruleName: rule.name,
        summary: simulation.summary,
        executionTime: Date.now() - start,
        success: true,
        metadata,
      }
    )

    return NextResponse.json({
      tenantId: access.project.tenantId,
      projectId: access.project.id,
      summary: simulation.summary,
      results: simulation.results,
      explainTrace: simulation.explainTrace,
    })
  } catch (error) {
    console.error('[Copilot Simulation] Failed to simulate rule:', error)

    const userId = access.session.userId
    await logSimulation(
      {
        tenantId: access.project.tenantId,
        projectId: access.project.id,
        userId,
        userRole: access.membership.role,
        ruleName: rule.name,
        summary: { total: 0, matched: 0, wouldChange: 0, totalDelta: 0 },
        executionTime: Date.now() - start,
        success: false,
        error: 'Simulation failed',
        metadata,
      }
    )
    return NextResponse.json(
      { error: 'Failed to simulate pricing rule' },
      { status: 500 }
    )
  }
})

export const OPTIONS = withSecurity(async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
})
