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
import { prisma } from '@calibr/db'
import { generatePricingRule } from '@/lib/openai'
import { simulateRule, type PricingRule } from '@calibr/pricing-engine'
import { z } from 'zod'

const SCHEMA_VERSION = '1.8.0' // M1.8 schema version

/**
 * Request schema validation
 */
const proposeSchema = z.object({
  projectSlug: z.string().trim().min(1),
  query: z.string().trim().min(1),
  userId: z.string().trim().optional(),
  metadata: z.record(z.unknown()).optional(),
})

/**
 * RBAC: Check user has access to project and required role
 */
async function requireProjectAccess(
  projectSlug: string,
  userId?: string,
  requiredRole: 'VIEWER' | 'EDITOR' | 'ADMIN' | 'OWNER' = 'EDITOR'
): Promise<{
  allowed: boolean
  role?: string
  projectId?: string
  tenantId?: string
}> {
  try {
    const project = await prisma().project.findUnique({
      where: { slug: projectSlug },
      include: {
        Membership: userId
          ? {
              where: { userId },
              select: { role: true },
            }
          : false,
      },
    })

    if (!project) {
      return { allowed: false }
    }

    if (!userId || !project.Membership || project.Membership.length === 0) {
      return { allowed: false, projectId: project.id, tenantId: project.tenantId }
    }

    const membership = project.Membership[0]
    const hierarchy = { OWNER: 4, ADMIN: 3, EDITOR: 2, VIEWER: 1 }
    const allowed =
      hierarchy[(membership.role as keyof typeof hierarchy) ?? 'VIEWER'] >=
      hierarchy[requiredRole]

    return {
      allowed,
      role: membership.role,
      projectId: project.id,
      tenantId: project.tenantId,
    }
  } catch (error) {
    console.error('[Copilot Propose] RBAC check failed:', error)
    return { allowed: false }
  }
}

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
export const POST = withSecurity(async function POST(req: NextRequest) {
  const start = Date.now()

  const parsed = proposeSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request payload', issues: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { projectSlug, query, userId, metadata } = parsed.data

  // Check access
  const access = await requireProjectAccess(projectSlug, userId, 'EDITOR')
  if (!access.allowed || !access.projectId || !access.tenantId) {
    if (access.projectId && access.tenantId) {
      await logPropose({
        tenantId: access.tenantId,
        projectId: access.projectId,
        userId,
        userRole: access.role,
        query,
        ruleName: 'unknown',
        executionTime: Date.now() - start,
        success: false,
        error: 'Access denied',
        metadata,
      })
    }

    return NextResponse.json(
      { error: 'Access denied', message: 'User does not have permission to propose rules' },
      { status: 403 }
    )
  }

  try {
    // 1. Generate PricingRule from natural language using AI
    console.log('[Copilot Propose] Generating rule from query:', query)
    const { rule, explanation, confidence } = await generatePricingRule(query, JSON.stringify(metadata))

    // 2. Run simulation to get impact preview
    console.log('[Copilot Propose] Simulating rule:', rule.name)
    const simulation = await simulateRule({
      tenantId: access.tenantId,
      projectId: access.projectId,
      rule: rule as PricingRule,
      actor: userId,
      dryRun: true,
    })

    // 3. Persist the rule as DISABLED (draft)
    console.log('[Copilot Propose] Persisting disabled rule')
    const persistedRule = await prisma().pricingRule.create({
      data: {
        tenantId: access.tenantId,
        projectId: access.projectId,
        name: rule.name,
        description: rule.description || `Copilot-generated: "${query}"`,
        enabled: false, // Disabled by default for review
        selectorJson: rule.selector as any,
        transformJson: rule.transform as any,
        createdBy: userId || 'system',
        source: 'copilot',
        metadata: {
          query,
          confidence,
          explanation,
          generatedAt: new Date().toISOString(),
          ...(metadata || {}),
        } as any,
      },
    })

    // 4. Create preview run (PREVIEW state, not executed)
    console.log('[Copilot Propose] Creating preview run')
    const previewRun = await prisma().ruleRun.create({
      data: {
        tenantId: access.tenantId,
        projectId: access.projectId,
        ruleId: persistedRule.id,
        status: 'PREVIEW',
        metadata: {
          simulation: {
            summary: simulation.summary,
            results: simulation.results.slice(0, 10), // Store first 10 results for preview
          },
          query,
          confidence,
        } as any,
      },
    })

    // 5. Log successful propose operation
    await logPropose({
      tenantId: access.tenantId,
      projectId: access.projectId,
      userId,
      userRole: access.role,
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

    // Log failed operation
    await logPropose({
      tenantId: access.tenantId,
      projectId: access.projectId,
      userId,
      userRole: access.role,
      query,
      ruleName: 'unknown',
      executionTime: Date.now() - start,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      metadata,
    })

    return NextResponse.json(
      {
        error: 'Failed to propose pricing rule',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
})

/**
 * OPTIONS handler for CORS preflight
 */
export const OPTIONS = withSecurity(async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
})
