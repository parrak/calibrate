/**
 * Copilot Read-Only Query Endpoint — M1.4
 *
 * POST /api/v1/copilot
 * Schema-aware NL→SQL/GraphQL generation with RBAC enforcement and query logging
 *
 * Features:
 * - Natural language to SQL conversion using GPT-4
 * - RBAC enforcement (checks user project role)
 * - SQL injection guards (read-only queries only)
 * - Query logging with resolved schemas and tenant scope
 * - Support for both AI-powered and pattern-based queries
 */

import { NextRequest, NextResponse } from 'next/server'
import { withSecurity } from '@/lib/security-headers'
import { prisma, Prisma } from '@calibr/db'
import { generateSQL } from '@/lib/openai'

export const runtime = 'nodejs'

/**
 * Convert BigInt values to Number for JSON serialization
 */
function convertBigIntToNumber(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj
  }

  if (typeof obj === 'bigint') {
    return Number(obj)
  }

  if (Array.isArray(obj)) {
    return obj.map(convertBigIntToNumber)
  }

  if (typeof obj === 'object') {
    const converted: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj)) {
      converted[key] = convertBigIntToNumber(value)
    }
    return converted
  }

  return obj
}

const DATABASE_SCHEMA = `
Table: Sku
- id: String (PK)
- productId: String (FK to Product)
- name: String
- code: String (SKU code)
- attributes: JSON (may contain cost, etc.)
- status: Enum (DRAFT, ACTIVE, ARCHIVED)

Table: Price
- id: String (PK)
- skuId: String (FK to Sku)
- currency: String
- amount: Int (in cents)
- status: Enum (DRAFT, ACTIVE, ARCHIVED)
- billingCycle: String
- unit: String

Table: Product
- id: String (PK)
- tenantId: String
- projectId: String (FK to Project)
- name: String
- code: String (Product code)
- status: Enum

Table: PriceChange
- id: String (PK)
- tenantId: String
- projectId: String (FK to Project)
- skuId: String (FK to Sku)
- fromAmount: Int (cents)
- toAmount: Int (cents)
- currency: String
- status: Enum (PENDING, APPROVED, APPLIED, REJECTED, FAILED, ROLLED_BACK)
- createdAt: Timestamp
- policyResult: JSON
- context: JSON

Table: Project
- id: String (PK)
- tenantId: String
- slug: String
- name: String

Important:
- To query SKUs, JOIN with Product table to filter by projectId
- Prices are in separate Price table, JOIN on Price.skuId = Sku.id
- Cost is stored in Sku.attributes JSON field, access with: (attributes->>'cost')::int
- Always filter by projectId through Product table for Sku queries
`

const SCHEMA_VERSION = '1.4.0' // M1.4 schema version

/**
 * RBAC: Check user has access to project and required role
 */
async function requireProjectAccess(
  projectSlug: string,
  userId?: string,
  requiredRole: 'VIEWER' | 'EDITOR' | 'ADMIN' | 'OWNER' = 'VIEWER'
): Promise<{ allowed: boolean; role?: string; projectId?: string; tenantId?: string }> {
  try {
    // Get project
    const project = await prisma().project.findUnique({
      where: { slug: projectSlug },
      include: {
        Tenant: true,
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

    // If no userId provided, assume system/anonymous access (deny)
    if (!userId) {
      return { allowed: false, projectId: project.id, tenantId: project.tenantId }
    }

    // Check membership
    const membership = Array.isArray(project.Membership) ? project.Membership[0] : null
    if (!membership) {
      return { allowed: false, projectId: project.id, tenantId: project.tenantId }
    }

    // Check role hierarchy: OWNER > ADMIN > EDITOR > VIEWER
    const roleHierarchy = { OWNER: 4, ADMIN: 3, EDITOR: 2, VIEWER: 1 }
    const userRoleLevel = roleHierarchy[membership.role as keyof typeof roleHierarchy] || 0
    const requiredRoleLevel = roleHierarchy[requiredRole] || 0

    const allowed = userRoleLevel >= requiredRoleLevel

    return {
      allowed,
      role: membership.role,
      projectId: project.id,
      tenantId: project.tenantId,
    }
  } catch (error) {
    console.error('[Copilot] RBAC check failed:', error)
    return { allowed: false }
  }
}

/**
 * Log copilot query for audit trail
 */
async function logQuery(params: {
  tenantId: string
  projectId: string
  userId?: string
  userRole?: string
  query: string
  generatedSQL?: string
  queryType: string
  resultCount?: number
  executionTime: number
  method?: string
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
        query: params.query,
        generatedSQL: params.generatedSQL,
        queryType: params.queryType,
        resultCount: params.resultCount,
        executionTime: params.executionTime,
        schemaVersion: SCHEMA_VERSION,
        method: params.method || 'pattern',
        success: params.success,
        error: params.error,
        metadata: (params.metadata || {}) as Prisma.InputJsonValue,
      },
    })
  } catch (error) {
    console.error('[Copilot] Failed to log query:', error)
    // Don't throw - logging failure shouldn't break the request
  }
}

/**
 * POST /api/v1/copilot
 *
 * Body:
 * - projectSlug: string
 * - query: string (natural language question)
 * - userId?: string (for RBAC)
 * - context?: object (additional context)
 */
export const POST = withSecurity(async function POST(req: NextRequest) {
  const startTime = Date.now()

  try {
    const body = await req.json()
    const { projectSlug, query, userId, context } = body

    if (!projectSlug || !query) {
      return NextResponse.json(
        { error: 'projectSlug and query are required' },
        { status: 400 }
      )
    }

    console.log('[Copilot] Query received:', { projectSlug, query, userId })

    // RBAC: Check project access
    const access = await requireProjectAccess(projectSlug, userId, 'VIEWER')
    if (!access.allowed || !access.projectId || !access.tenantId) {
      // Log failed access attempt
      if (access.projectId && access.tenantId) {
        await logQuery({
          tenantId: access.tenantId,
          projectId: access.projectId,
          userId,
          userRole: access.role,
          query,
          queryType: 'read',
          executionTime: Date.now() - startTime,
          success: false,
          error: 'Access denied',
        })
      }

      return NextResponse.json(
        { error: 'Access denied', message: 'User does not have access to this project' },
        { status: 403 }
      )
    }

    const { projectId, tenantId, role } = access

    // Try AI-powered query generation first
    if (process.env.OPENAI_API_KEY) {
      try {
        const aiResult = await handleAIQuery(projectId, tenantId, query, context)

        // Log successful AI query
        await logQuery({
          tenantId,
          projectId,
          userId,
          userRole: role,
          query,
          generatedSQL: aiResult.sql,
          queryType: determineQueryType(query),
          resultCount: Array.isArray(aiResult.data) ? aiResult.data.length : undefined,
          executionTime: Date.now() - startTime,
          method: 'ai',
          success: true,
          metadata: { context },
        })

        return NextResponse.json(
          {
            answer: aiResult.answer,
            data: aiResult.data,
            sql: aiResult.sql,
            method: 'ai',
            metadata: {
              schemaVersion: SCHEMA_VERSION,
              executionTime: Date.now() - startTime,
              role,
            },
          },
          { status: 200 }
        )
      } catch (error) {
        console.warn('[Copilot] AI query failed, falling back to patterns:', error)
      }
    }

    // Fallback to pattern matching
    const result = await handlePatternQuery(projectId, tenantId, query, context)

    // Log successful pattern query
    await logQuery({
      tenantId,
      projectId,
      userId,
      userRole: role,
      query,
      generatedSQL: result.sql,
      queryType: determineQueryType(query),
      resultCount: Array.isArray(result.data) ? result.data.length : undefined,
      executionTime: Date.now() - startTime,
      method: 'pattern',
      success: true,
      metadata: { context },
    })

    return NextResponse.json(
      {
        answer: result.answer,
        data: result.data,
        sql: result.sql,
        suggestions: result.suggestions,
        method: 'pattern',
        metadata: {
          schemaVersion: SCHEMA_VERSION,
          executionTime: Date.now() - startTime,
          role,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[Copilot API] Error:', error)

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
 * Determine query type from natural language
 */
function determineQueryType(query: string): string {
  const lowerQuery = query.toLowerCase()

  if (lowerQuery.includes('why') || lowerQuery.includes('explain')) {
    return 'explain'
  }

  if (
    lowerQuery.includes('count') ||
    lowerQuery.includes('how many') ||
    lowerQuery.includes('total') ||
    lowerQuery.includes('average') ||
    lowerQuery.includes('sum')
  ) {
    return 'aggregate'
  }

  return 'read'
}

/**
 * Handle queries using AI (GPT-4)
 */
async function handleAIQuery(
  projectId: string,
  tenantId: string,
  query: string,
  _context?: unknown
): Promise<{
  answer: string
  data?: unknown
  sql?: string
}> {
  // Generate SQL using GPT-4
  const { sql, explanation } = await generateSQL(query, DATABASE_SCHEMA)

  // SQL Injection Guards: Validate query is read-only
  const sqlLower = sql.toLowerCase().trim()
  const dangerousKeywords = ['insert', 'update', 'delete', 'drop', 'alter', 'create', 'truncate', 'replace']

  if (!sqlLower.startsWith('select')) {
    throw new Error('Only SELECT queries are allowed')
  }

  for (const keyword of dangerousKeywords) {
    if (sqlLower.includes(keyword)) {
      throw new Error(`Query contains forbidden keyword: ${keyword}`)
    }
  }

  // Inject tenant scope constraint for security (prevent cross-tenant data access)
  let secureSQL = sql

  // CRITICAL FIX: Replace any existing projectId values with the actual CUID
  // The AI might generate SQL with projectId = 'demo' (slug) instead of the actual project ID
  // We need to ensure ALL projectId references use the correct CUID for security and correctness

  // Pattern 1: Replace "projectId" = 'any-value' or "projectId" = "any-value"
  secureSQL = secureSQL.replace(/"projectId"\s*=\s*['"][^'"]+['"]/gi, `"projectId" = '${projectId}'`)

  // Pattern 2: Replace projectId = 'any-value' (without quotes around column name)
  secureSQL = secureSQL.replace(/\bprojectId\b\s*=\s*['"][^'"]+['"]/gi, `"projectId" = '${projectId}'`)

  // Add projectId filter if still not present (belt and suspenders approach)
  if (!secureSQL.match(/"projectId"|projectId/i)) {
    // Try to inject WHERE clause
    if (secureSQL.includes('WHERE')) {
      secureSQL = secureSQL.replace(/WHERE/i, `WHERE "projectId" = '${projectId}' AND`)
    } else if (secureSQL.includes('FROM')) {
      // Find the first FROM clause and inject WHERE after it
      secureSQL = secureSQL.replace(/FROM\s+"?(\w+)"?/i, (match) => `${match} WHERE "projectId" = '${projectId}'`)
    }
  }

  // Add LIMIT if not present (prevent large result sets)
  if (!sqlLower.includes('limit')) {
    secureSQL += ' LIMIT 100'
  }

  try {
    // Execute query
    const rawData = await prisma().$queryRawUnsafe(secureSQL)

    // Convert BigInt to Number for JSON serialization
    const data = convertBigIntToNumber(rawData)

    return {
      answer: explanation,
      data,
      sql: secureSQL,
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
async function handlePatternQuery(
  projectId: string,
  _tenantId: string,
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
    answer: 'I can help you analyze your pricing data. Try asking questions like:',
    suggestions: [
      'Why was this price changed?',
      'What if I increase prices by 10%?',
      'Show me products with low margins',
      'How many price changes were made last week?',
      'Which products have the highest margins?',
      "What's my average price change percentage?",
    ],
  }
}

/**
 * Explain a recent price change
 */
async function explainPriceChange(
  projectId: string,
  _context?: unknown
): Promise<{ answer: string; data?: unknown; sql?: string }> {
  const priceChange = await prisma().priceChange.findFirst({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
  })

  if (!priceChange) {
    return {
      answer: 'No recent price changes found for this project.',
    }
  }

  // Fetch the related Sku separately
  const sku = await prisma().sku.findUnique({
    where: { id: priceChange.skuId },
    select: { code: true, name: true },
  })

  const delta = priceChange.toAmount - priceChange.fromAmount
  const deltaPercent = ((delta / priceChange.fromAmount) * 100).toFixed(1)
  const direction = delta > 0 ? 'increased' : 'decreased'

  const policyResult = priceChange.policyResult as { checks?: Array<{ ok: boolean }> } | null

  const answer =
    `Price ${direction} by ${Math.abs(delta)}¢ (${Math.abs(parseFloat(deltaPercent))}%) for ${sku?.name || sku?.code || priceChange.skuId}. ` +
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
async function simulatePriceIncrease(
  projectId: string,
  percent: number
): Promise<{ answer: string; data?: unknown }> {
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
      const attributes = s.attributes as { cost?: number } | null
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
  const avgNewMargin =
    simulated.filter((s) => s.newMargin !== null).length > 0
      ? simulated.filter((s) => s.newMargin !== null).reduce((sum, s) => sum + (s.newMargin || 0), 0) /
        simulated.filter((s) => s.newMargin !== null).length
      : null

  const answer =
    `Increasing all prices by ${percent}% would affect ${simulated.length} products. ` +
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
async function findLowMarginProducts(
  projectId: string
): Promise<{ answer: string; data?: unknown; sql?: string }> {
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
      const attributes = s.attributes as { cost?: number } | null
      const cost = attributes?.cost
      return price !== null && price !== undefined && cost !== null && cost !== undefined && cost > 0
    })
    .map((s) => {
      const price = s.Price[0]!.amount
      const attributes = s.attributes as { cost: number }
      const cost = attributes.cost
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
    : 'All products have healthy margins above 20%.'

  return {
    answer,
    data: lowMargin.slice(0, 10),
    sql: `SELECT s.*, p.amount as priceAmount, (s.attributes->>'cost')::int as cost, ((p.amount - (s.attributes->>'cost')::int) / (s.attributes->>'cost')::int * 100) as margin FROM "Sku" s JOIN "Price" p ON s.id = p."skuId" JOIN "Product" pr ON s."productId" = pr.id WHERE pr."projectId" = '${projectId}' AND (s.attributes->>'cost') IS NOT NULL ORDER BY margin ASC`,
  }
}

/**
 * Count recent price changes
 */
async function countRecentPriceChanges(
  projectId: string
): Promise<{ answer: string; data?: unknown; sql?: string }> {
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

  const answer =
    `${total} price changes in the last 7 days. ` +
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
