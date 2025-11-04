/**
 * Policy Insight Copilot Endpoint
 *
 * POST /api/v1/assistant/query
 * LLM-powered natural language query to SQL for pricing insights
 */

import { NextRequest, NextResponse } from 'next/server'
import { withSecurity } from '@/lib/security-headers'
import { prisma } from '@calibr/db'
import { generateSQL } from '@/lib/openai'

export const runtime = 'nodejs'

const DATABASE_SCHEMA = `
Table: Sku
- id: String (PK)
- projectId: String (FK)
- sku: String
- name: String
- priceAmount: Int (in cents)
- currency: String
- cost: Int (in cents)

Table: PriceChange
- id: String (PK)
- projectId: String (FK)
- skuId: String (FK)
- fromAmount: Int (cents)
- toAmount: Int (cents)
- status: Enum(PENDING, APPROVED, REJECTED)
- createdAt: Timestamp
- policyResult: JSON

Table: Project
- id: String (PK)
- slug: String
- name: String
`

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

    // Try AI-powered query generation first
    if (process.env.OPENAI_API_KEY) {
      try {
        const aiResult = await handleAIQuery(projectId, query, context)
        return NextResponse.json(aiResult, { status: 200 })
      } catch (error) {
        console.warn('[Assistant] AI query failed, falling back to patterns:', error)
      }
    }

    // Fallback to pattern matching
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
 * Handle queries using AI (GPT-4)
 */
async function handleAIQuery(
  projectId: string,
  query: string,
  _context?: unknown
): Promise<{
  answer: string
  data?: unknown
  sql?: string
  method: 'ai'
}> {
  // Generate SQL using GPT-4
  const { sql, explanation } = await generateSQL(query, DATABASE_SCHEMA)

  // Validate query is read-only
  const sqlLower = sql.toLowerCase().trim()
  if (
    !sqlLower.startsWith('select') ||
    sqlLower.includes('insert') ||
    sqlLower.includes('update') ||
    sqlLower.includes('delete') ||
    sqlLower.includes('drop')
  ) {
    throw new Error('Only SELECT queries are allowed')
  }

  // Inject projectId constraint for security
  const secureSQL = sql.includes('WHERE')
    ? sql.replace(/WHERE/i, `WHERE "projectId" = '${projectId}' AND`)
    : sql.replace(/FROM\s+"(\w+)"/i, `FROM "$1" WHERE "projectId" = '${projectId}'`)

  try {
    // Execute query
    const data = await prisma().$queryRawUnsafe(secureSQL)

    return {
      answer: explanation,
      data,
      sql: secureSQL,
      method: 'ai' as const,
    }
  } catch (error) {
    throw new Error(
      `Query execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Handle natural language queries using pattern matching
 * (Fallback when OpenAI not available)
 */
async function handleQuery(
  projectId: string,
  query: string,
  context?: unknown
): Promise<{
  answer: string
  data?: unknown
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
async function explainPriceChange(projectId: string, _context?: unknown): Promise<{ answer: string; data?: unknown; sql?: string }> {
  const priceChange = await prisma().priceChange.findFirst({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
  })

  if (!priceChange) {
    return {
      answer: "No recent price changes found for this project.",
    }
  }

  // Fetch the related Sku separately since PriceChange doesn't have a direct relation
  const sku = await prisma().sku.findUnique({
    where: { id: priceChange.skuId },
    select: { code: true, name: true },
  })

  const delta = priceChange.toAmount - priceChange.fromAmount
  const deltaPercent = ((delta / priceChange.fromAmount) * 100).toFixed(1)
  const direction = delta > 0 ? 'increased' : 'decreased'

  const policyResult = priceChange.policyResult as { checks?: Array<{ ok: boolean }> } | null | undefined

  const answer = `Price ${direction} by ${Math.abs(delta)}¢ (${Math.abs(parseFloat(deltaPercent))}%) for ${sku?.name || sku?.code || priceChange.skuId}. ` +
    `Status: ${priceChange.status}. ` +
    (policyResult?.checks
      ? `Policy checks: ${policyResult.checks.length} evaluated, ${policyResult.checks.filter((c) => c.ok).length} passed.`
      : '')

  return {
    answer,
    data: {
      sku: sku?.code || priceChange.skuId,
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
async function simulatePriceIncrease(projectId: string, percent: number): Promise<{ answer: string; data?: unknown }> {
  // Sku is related to Product, which has projectId
  const skus = await prisma().sku.findMany({
    where: {
      Product: {
        projectId,
      },
    },
    select: {
      id: true,
      code: true,
      name: true,
      Price: {
        where: {
          status: 'ACTIVE',
        },
        select: {
          amount: true,
          currency: true,
        },
        take: 1,
      },
      attributes: true,
    },
  })

  const simulated = skus
    .filter((s) => s.Price[0]?.amount !== null && s.Price[0]?.amount !== undefined)
    .map((s) => {
      const currentPrice = s.Price[0]?.amount || 0
      const newPrice = Math.round(currentPrice * (1 + percent / 100))
      // Extract cost from attributes if available (cost is not directly on Sku)
      const attributes = s.attributes as { cost?: number } | null | undefined
      const cost = attributes?.cost
      const currentMargin = cost ? ((currentPrice - cost) / cost) * 100 : null
      const newMargin = cost ? ((newPrice - cost) / cost) * 100 : null

      return {
        sku: s.code,
        currentPrice,
        newPrice,
        delta: newPrice - currentPrice,
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
async function findLowMarginProducts(projectId: string): Promise<{ answer: string; data?: unknown; sql?: string }> {
  // Sku is related to Product, which has projectId. Cost and priceAmount are not directly on Sku.
  const skus = await prisma().sku.findMany({
    where: {
      Product: {
        projectId,
      },
    },
    select: {
      id: true,
      code: true,
      name: true,
      Price: {
        where: {
          status: 'ACTIVE',
        },
        select: {
          amount: true,
          currency: true,
        },
        take: 1,
      },
      attributes: true,
    },
  })

  const withMargins = skus
    .filter((s) => {
      const price = s.Price[0]?.amount
      const attributes = s.attributes as { cost?: number } | null | undefined
      const cost = attributes?.cost
      return price !== null && price !== undefined && cost !== null && cost !== undefined && cost > 0
    })
    .map((s) => {
      const price = s.Price[0]!.amount
      const attributes = s.attributes as { cost: number } | null
      const cost = attributes!.cost
      return {
        sku: s.code,
        name: s.name,
        price,
        cost,
        margin: ((price - cost) / cost) * 100,
      }
    })
    .sort((a, b) => a.margin - b.margin)

  const lowMargin = withMargins.filter((s) => s.margin < 20)

  const answer = lowMargin.length > 0
    ? `Found ${lowMargin.length} products with margins below 20%. Lowest margins: ${lowMargin.slice(0, 3).map((s) => `${s.sku} (${s.margin.toFixed(1)}%)`).join(', ')}.`
    : "All products have healthy margins above 20%."

  return {
    answer,
    data: lowMargin.slice(0, 10),
    sql: `SELECT s.*, p.amount as priceAmount, (s.attributes->>'cost')::int as cost, ((p.amount - (s.attributes->>'cost')::int) / (s.attributes->>'cost')::int * 100) as margin FROM "Sku" s JOIN "Price" p ON s.id = p."skuId" JOIN "Product" pr ON s."productId" = pr.id WHERE pr."projectId" = '${projectId}' AND (s.attributes->>'cost') IS NOT NULL ORDER BY margin ASC`,
  }
}

/**
 * Count recent price changes
 */
async function countRecentPriceChanges(projectId: string): Promise<{ answer: string; data?: unknown; sql?: string }> {
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
