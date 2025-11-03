/**
 * Policy Insight Copilot Endpoint
 *
 * POST /api/v1/assistant/query
 * LLM-powered natural language query to SQL for pricing insights
 */

import { NextRequest, NextResponse } from 'next/server'
import { withSecurity } from '@/lib/security-headers'
import { prisma } from '@calibr/db'

export const runtime = 'nodejs'

/**
 * POST /api/v1/assistant/query
 *
 * Body:
 * - projectId: string
 * - query: string (natural language question)
 * - context?: object (additional context)
 */
export const POST = withSecurity(async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { projectId, query, context } = body

    if (!projectId || !query) {
      return NextResponse.json(
        { error: 'projectId and query are required' },
        { status: 400 }
      )
    }

    console.log('[Assistant] Query:', { projectId, query })

    // Parse and route query to appropriate handler
    const result = await handleQuery(projectId, query, context)

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('[Assistant API] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to process query',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
})

/**
 * Handle natural language queries
 * (Simplified version - would use LLM in production)
 */
async function handleQuery(
  projectId: string,
  query: string,
  context?: any
): Promise<{
  answer: string
  data?: any
  sql?: string
  suggestions?: string[]
}> {
  const lowerQuery = query.toLowerCase()

  // Pattern matching for common queries
  // In production, this would use an LLM to generate SQL

  // "Why was this price changed?" pattern
  if (lowerQuery.includes('why') && (lowerQuery.includes('price') || lowerQuery.includes('change'))) {
    return await explainPriceChange(projectId, context)
  }

  // "What if I increase prices by X%?" pattern
  if (lowerQuery.includes('what if') && lowerQuery.includes('increase')) {
    const percent = extractPercentage(query)
    return await simulatePriceIncrease(projectId, percent)
  }

  // "Show me products with low margins" pattern
  if (lowerQuery.includes('low margin') || lowerQuery.includes('lowest margin')) {
    return await findLowMarginProducts(projectId)
  }

  // "How many price changes last week?" pattern
  if (lowerQuery.includes('how many') && lowerQuery.includes('price change')) {
    return await countRecentPriceChanges(projectId)
  }

  // Default: provide helpful suggestions
  return {
    answer: "I can help you analyze your pricing data. Try asking questions like:",
    suggestions: [
      "Why was this price changed?",
      "What if I increase prices by 10%?",
      "Show me products with low margins",
      "How many price changes were made last week?",
      "Which products have the highest margins?",
      "What's my average price change percentage?",
    ],
  }
}

/**
 * Explain a recent price change
 */
async function explainPriceChange(projectId: string, context?: any): Promise<any> {
  const priceChange = await prisma().priceChange.findFirst({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
    include: {
      sku: {
        select: { sku: true, name: true },
      },
    },
  })

  if (!priceChange) {
    return {
      answer: "No recent price changes found for this project.",
    }
  }

  const delta = priceChange.toAmount - priceChange.fromAmount
  const deltaPercent = ((delta / priceChange.fromAmount) * 100).toFixed(1)
  const direction = delta > 0 ? 'increased' : 'decreased'

  const policyResult = priceChange.policyResult as any

  const answer = `Price ${direction} by ${Math.abs(delta)}¢ (${Math.abs(parseFloat(deltaPercent))}%) for ${priceChange.sku.name || priceChange.sku.sku}. ` +
    `Status: ${priceChange.status}. ` +
    (policyResult?.checks
      ? `Policy checks: ${policyResult.checks.length} evaluated, ${policyResult.checks.filter((c: any) => c.ok).length} passed.`
      : '')

  return {
    answer,
    data: {
      sku: priceChange.sku.sku,
      from: priceChange.fromAmount,
      to: priceChange.toAmount,
      delta,
      deltaPercent: parseFloat(deltaPercent),
      status: priceChange.status,
      createdAt: priceChange.createdAt,
    },
    sql: `SELECT * FROM "PriceChange" WHERE "projectId" = '${projectId}' ORDER BY "createdAt" DESC LIMIT 1`,
  }
}

/**
 * Simulate a price increase
 */
async function simulatePriceIncrease(projectId: string, percent: number): Promise<any> {
  const skus = await prisma().sku.findMany({
    where: { projectId },
    select: {
      sku: true,
      name: true,
      priceAmount: true,
      cost: true,
    },
  })

  const simulated = skus
    .filter((s) => s.priceAmount !== null)
    .map((s) => {
      const newPrice = Math.round(s.priceAmount! * (1 + percent / 100))
      const currentMargin = s.cost ? ((s.priceAmount! - s.cost) / s.cost) * 100 : null
      const newMargin = s.cost ? ((newPrice - s.cost) / s.cost) * 100 : null

      return {
        sku: s.sku,
        currentPrice: s.priceAmount,
        newPrice,
        delta: newPrice - s.priceAmount!,
        currentMargin,
        newMargin,
      }
    })

  const totalDelta = simulated.reduce((sum, s) => sum + s.delta, 0)
  const avgNewMargin = simulated.filter((s) => s.newMargin !== null).length > 0
    ? simulated.filter((s) => s.newMargin !== null).reduce((sum, s) => sum + (s.newMargin || 0), 0) / simulated.filter((s) => s.newMargin !== null).length
    : null

  const answer = `Increasing all prices by ${percent}% would affect ${simulated.length} products. ` +
    `Total revenue impact: +${totalDelta}¢ per unit sold. ` +
    (avgNewMargin ? `Average margin would increase to ${avgNewMargin.toFixed(1)}%. ` : '') +
    `Top 3 impacts: ${simulated.slice(0, 3).map((s) => `${s.sku} +${s.delta}¢`).join(', ')}.`

  return {
    answer,
    data: {
      affectedProducts: simulated.length,
      totalDelta,
      avgNewMargin,
      examples: simulated.slice(0, 5),
    },
  }
}

/**
 * Find products with low margins
 */
async function findLowMarginProducts(projectId: string): Promise<any> {
  const skus = await prisma().sku.findMany({
    where: {
      projectId,
      cost: { not: null },
      priceAmount: { not: null },
    },
    select: {
      sku: true,
      name: true,
      priceAmount: true,
      cost: true,
    },
  })

  const withMargins = skus
    .map((s) => ({
      sku: s.sku,
      name: s.name,
      price: s.priceAmount!,
      cost: s.cost!,
      margin: ((s.priceAmount! - s.cost!) / s.cost!) * 100,
    }))
    .sort((a, b) => a.margin - b.margin)

  const lowMargin = withMargins.filter((s) => s.margin < 20)

  const answer = lowMargin.length > 0
    ? `Found ${lowMargin.length} products with margins below 20%. Lowest margins: ${lowMargin.slice(0, 3).map((s) => `${s.sku} (${s.margin.toFixed(1)}%)`).join(', ')}.`
    : "All products have healthy margins above 20%."

  return {
    answer,
    data: lowMargin.slice(0, 10),
    sql: `SELECT *, ((priceAmount - cost) / cost * 100) as margin FROM "Sku" WHERE "projectId" = '${projectId}' AND cost IS NOT NULL ORDER BY margin ASC`,
  }
}

/**
 * Count recent price changes
 */
async function countRecentPriceChanges(projectId: string): Promise<any> {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const total = await prisma().priceChange.count({
    where: {
      projectId,
      createdAt: { gte: weekAgo },
    },
  })

  const byStatus = await prisma().priceChange.groupBy({
    by: ['status'],
    where: {
      projectId,
      createdAt: { gte: weekAgo },
    },
    _count: true,
  })

  const statusCounts = byStatus.reduce(
    (acc, s) => {
      acc[s.status.toLowerCase()] = s._count
      return acc
    },
    {} as Record<string, number>
  )

  const answer = `${total} price changes in the last 7 days. ` +
    `Breakdown: ${byStatus.map((s) => `${s._count} ${s.status.toLowerCase()}`).join(', ')}.`

  return {
    answer,
    data: {
      total,
      ...statusCounts,
    },
    sql: `SELECT status, COUNT(*) FROM "PriceChange" WHERE "projectId" = '${projectId}' AND "createdAt" >= NOW() - INTERVAL '7 days' GROUP BY status`,
  }
}

/**
 * Extract percentage from query string
 */
function extractPercentage(query: string): number {
  const match = query.match(/(\d+(?:\.\d+)?)\s*%/)
  return match ? parseFloat(match[1]) : 10 // Default 10%
}

/**
 * OPTIONS handler for CORS preflight
 */
export const OPTIONS = withSecurity(async () => {
  return new NextResponse(null, { status: 204 })
})
