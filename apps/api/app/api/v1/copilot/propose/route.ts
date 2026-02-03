/**
 * Copilot Propose Endpoint — M1.8
 *
 * POST /api/v1/copilot/propose
 * Generates a pricing rule from natural language, simulates it, and persists as disabled draft
 *
 * Features:
 * - Natural language to PricingRule conversion using GPT-4
 * - Automatic simulation of proposed changes
 * - Persists disabled rule with preview run for review
 * - Full audit logging with prompt, scope, and SQL
 * - RBAC enforcement (EDITOR role required)
 */

import { NextRequest, NextResponse } from 'next/server'
import { withSecurity } from '@/lib/security-headers'
import { withRateLimit, rateLimiters } from '@/lib/rate-limit'
import { prisma, Prisma } from '@calibr/db'
import { generatePricingRule } from '@/lib/openai'
import { simulateRule, type PricingRule } from '@calibr/pricing-engine'
import { z } from 'zod'
import { getRulesWorker } from '@calibr/automation-runner'
import { requireProjectAccess, errorJson } from '../../price-changes/utils'

const SCHEMA_VERSION = '1.8.0' // M1.8 schema version

/**
 * Request schema validation
 */
const proposeSchema = z.object({
  projectSlug: z.string().trim().min(1),
  query: z.string().trim().min(1),
  userId: z.string().trim().optional(),
  rule: z
    .object({
      id: z.string().optional(),
      name: z.string(),
      description: z.string().optional(),
      selector: z.object({
        predicates: z.array(
          z.discriminatedUnion('type', [
            z.object({ type: z.literal('all') }),
            z.object({ type: z.literal('sku'), skuCodes: z.array(z.string()) }),
            z.object({ type: z.literal('tag'), tags: z.array(z.string()) }),
            z.object({
              type: z.literal('priceRange'),
              min: z.number().optional(),
              max: z.number().optional(),
              currency: z.string().optional(),
            }),
            z.object({
              type: z.literal('custom'),
              field: z.string(),
              operator: z.enum(['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'contains']),
              value: z.custom<unknown>((val) => val !== undefined, {
                message: 'value is required for custom selector predicates',
              }),
            }),
          ])
        ),
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
    .optional(),
  explanation: z.string().optional(),
  confidence: z.number().optional(),
  metadata: z.record(z.unknown()).optional(),
})

/**
 * Log propose operation for audit trail
 */
async function logPropose(params: {
  tenantId: string
  projectId: string
  userId?: string
  userRole?: string
  query: string
  ruleName: string
  ruleId?: string
  runId?: string
  summary?: { total: number; matched: number; wouldChange: number; totalDelta: number }
  executionTime: number
  success: boolean
  error?: string
  metadata?: Record<string, unknown>
}) {
  try {
    await prisma().copilotQueryLog.create({
      data: {
        tenantId: params.tenantId,
        projectId: params.projectId,
        userId: params.userId,
        userRole: params.userRole,
        query: `propose:${params.query}`,
        queryType: 'propose',
        resultCount: params.summary?.matched || 0,
        executionTime: params.executionTime,
        schemaVersion: SCHEMA_VERSION,
        method: 'ai',
        success: params.success,
        error: params.error,
        metadata: {
          ruleName: params.ruleName,
          ruleId: params.ruleId,
          runId: params.runId,
          matched: params.summary?.matched,
          wouldChange: params.summary?.wouldChange,
          totalDelta: params.summary?.totalDelta,
          ...(params.metadata || {}),
        },
      },
    })
  } catch (error) {
    console.error('[Copilot Propose] Failed to log operation:', error)
  }
}

/**
 * POST /api/v1/copilot/propose
 *
 * Generate a pricing rule from natural language, simulate it, and save as disabled draft
 */
export const POST = withSecurity(
  withRateLimit(
    rateLimiters.copilot,
    async function POST(req: NextRequest) {
      const start = Date.now()

      const parsed = proposeSchema.safeParse(await req.json())
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Invalid request payload', issues: parsed.error.flatten() },
          { status: 400 }
        )
      }

      const {
        projectSlug,
        query,
        metadata,
        rule: providedRule,
        explanation: providedExplanation,
        confidence: providedConfidence,
      } = parsed.data

      // Check access
      const access = await requireProjectAccess(req, projectSlug, 'EDITOR')
      if ('error' in access) {
        return errorJson(access.error)
      }

      try {
        const userId = access.session.userId

        // 1. Generate PricingRule from natural language using AI (unless provided)
        let rule: PricingRule | undefined = providedRule ? (providedRule as PricingRule) : undefined
        let explanation = providedExplanation
        let confidence = providedConfidence

        if (!rule) {
          console.log('[Copilot Propose] Generating rule from query:', query)
          const generated = await generatePricingRule(query, JSON.stringify(metadata))
          rule = generated.rule as PricingRule
          explanation = generated.explanation
          confidence = generated.confidence
        }

        if (!rule) {
          throw new Error('Failed to generate pricing rule')
        }

        rule.enabled = false

        // 2. Run simulation to get impact preview
        console.log('[Copilot Propose] Simulating rule:', rule.name)
        const simulation = await simulateRule({
          tenantId: access.project.tenantId,
          projectId: access.project.id,
          rule,
          actor: userId,
          dryRun: true,
        })

        // 3. Persist the rule as DISABLED (draft)
        console.log('[Copilot Propose] Persisting disabled rule')
        const persistedRule = await prisma().pricingRule.create({
          data: {
            tenantId: access.project.tenantId,
            projectId: access.project.id,
            name: rule.name,
            description: rule.description || `Copilot-generated: "${query}"`,
            enabled: false, // Disabled by default for review
            selectorJson: rule.selector as Prisma.InputJsonValue,
            transformJson: rule.transform as Prisma.InputJsonValue,
            createdBy: userId || 'system',
            source: 'copilot',
            metadata: {
              query,
              confidence,
              explanation,
              generatedAt: new Date().toISOString(),
              ...(metadata || {}),
            } as Prisma.InputJsonValue,
          },
        })

        // 4. Materialize preview run with targets (PREVIEW state)
        console.log('[Copilot Propose] Materializing preview run')
        const worker = getRulesWorker()
        const previewRun = await worker.materialize(persistedRule.id, userId || 'system')
        const runStatus = await worker.getRunStatus(previewRun.id)

        await prisma().ruleRun.update({
          where: { id: previewRun.id },
          data: {
            metadata: {
              simulation: {
                summary: simulation.summary,
                results: simulation.results.slice(0, 10),
              },
              query,
              confidence,
            } as Prisma.InputJsonValue,
          },
        })

        // 5. Log successful propose operation
        await logPropose({
          tenantId: access.project.tenantId,
          projectId: access.project.id,
          userId,
          userRole: access.membership.role,
          query,
          ruleName: rule.name,
          ruleId: persistedRule.id,
          runId: previewRun.id,
          summary: simulation.summary,
          executionTime: Date.now() - start,
          success: true,
          metadata,
        })

        // 6. Return the proposed rule, preview run, and simulation
        return NextResponse.json({
          rule: {
            id: persistedRule.id,
            name: persistedRule.name,
            description: persistedRule.description,
            enabled: persistedRule.enabled,
            selector: persistedRule.selectorJson,
            transform: persistedRule.transformJson,
            source: persistedRule.source,
          },
          previewRun: {
            id: previewRun.id,
            status: previewRun.status,
            createdAt: previewRun.createdAt,
            targetCount: runStatus?.totalTargets ?? 0,
          },
          simulation: {
            summary: simulation.summary,
            results: simulation.results.slice(0, 20), // Return first 20 for UI
            explainTrace: simulation.explainTrace,
          },
          metadata: {
            query,
            explanation,
            confidence,
            executionTime: Date.now() - start,
            schemaVersion: SCHEMA_VERSION,
          },
        })
      } catch (error) {
        console.error('[Copilot Propose] Failed to propose rule:', error)

        const userId = 'session' in access ? access.session.userId : undefined
        const projectId = 'project' in access ? access.project.id : undefined
        const tenantId = 'project' in access ? access.project.tenantId : undefined
        const userRole = 'membership' in access ? access.membership.role : undefined

        // Log failed operation
        if (tenantId && projectId) {
          await logPropose({
            tenantId,
            projectId,
            userId,
            userRole,
            query,
            ruleName: 'unknown',
            executionTime: Date.now() - start,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            metadata,
          })
        }

        return NextResponse.json(
          {
            error: 'Failed to propose pricing rule',
            message: error instanceof Error ? error.message : 'Unknown error',
          },
          { status: 500 }
        )
      }
    }
  )
)

/**
 * OPTIONS handler for CORS preflight
 */
export const OPTIONS = withSecurity(async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
})
