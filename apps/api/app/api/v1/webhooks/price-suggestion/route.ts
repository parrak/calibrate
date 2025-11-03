import { NextRequest, NextResponse } from 'next/server'
import { PriceSuggestionPayload } from '@/zod/schemas'
import { prisma } from '@calibr/db'
import { evaluatePolicy } from '@calibr/pricing-engine'
import { applyPriceChange } from '@calibr/pricing-engine'
import { verifyHmac } from '@calibr/security'
import { ensureIdempotent } from '@calibr/security'
import { withRateLimit, rateLimiters } from '@/lib/rate-limit'
import { createRequestLogger } from '@/lib/logger'
import { createId } from '@paralleldrive/cuid2'

export const dynamic = 'force-dynamic'

async function handleWebhook(req: NextRequest) {
  const logger = createRequestLogger(req)
  const startTime = Date.now()
  
  try {
    logger.info('Processing price suggestion webhook')
    
    // Verify HMAC signature (also returns the body to avoid double-read)
    const authResult = await verifyHmac(req)
    if (!authResult.valid) {
      logger.warn('Invalid HMAC signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // Use body from authResult to avoid reading request body twice
    const raw = authResult.body || ''

    let body
    try {
      body = PriceSuggestionPayload.parse(JSON.parse(raw))
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error))
      logger.warn('Invalid payload format', errorObj)
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const ok = await ensureIdempotent(prisma().event, body.idempotencyKey, 'price-suggestion')
    if (!ok) {
      logger.info('Duplicate request detected', { metadata: { idempotencyKey: body.idempotencyKey } })
      return NextResponse.json({ status: 'duplicate' })
    }

    const projectSlug = req.headers.get('x-calibr-project')
    if (!projectSlug) {
      logger.warn('Missing project identifier')
      return NextResponse.json({ error: 'Missing project identifier' }, { status: 400 })
    }
    
    const project = await prisma().project.findUnique({ where: { slug: projectSlug } })
    if (!project) {
      logger.warn('Project not found', { metadata: { projectSlug } })
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const sku = await prisma().sku.findFirst({ 
      where: { code: body.skuCode, Product: { projectId: project.id } }, 
      include: { Product: true } 
    })
    if (!sku) {
      logger.warn('SKU not found', { metadata: { skuCode: body.skuCode, projectSlug } })
      return NextResponse.json({ error: 'SKU not found' }, { status: 404 })
    }

    const price = await prisma().price.findFirst({ 
      where: { skuId: sku.id, currency: body.currency } 
    })
    if (!price) {
      logger.warn('Price not found', { metadata: { skuCode: body.skuCode, currency: body.currency } })
      return NextResponse.json({ error: 'Price not found' }, { status: 404 })
    }

    const policy = await prisma().policy.findFirst({ 
      where: { projectId: project.id } 
    })
    const rules: any = policy?.rules ?? {}
    
    const evalRes = evaluatePolicy(price.amount, body.proposedAmount, {
      maxPctDelta: rules.maxPctDelta ?? 0.15,
      floor: rules.floors?.[body.skuCode],
      ceiling: rules.ceilings?.[body.skuCode],
      dailyBudgetPct: rules.dailyChangeBudgetPct ?? 0.25,
      dailyBudgetUsedPct: 0
    })

    const status = (policy?.autoApply && evalRes.ok) ? 'APPROVED' : 'PENDING'
    
    const pc = await prisma().priceChange.create({
      data: {
        id: createId(),
        tenantId: sku.Product.tenantId,
        projectId: project.id,
        skuId: sku.id,
        source: body.source,
        fromAmount: price.amount,
        toAmount: body.proposedAmount,
        currency: body.currency,
        context: { ...(body.context ?? {}), skuCode: body.skuCode, projectSlug },
        status,
        policyResult: evalRes
      }
    })

    logger.info('Price change created', { 
      metadata: { 
        priceChangeId: pc.id, 
        status: pc.status, 
        skuCode: body.skuCode,
        fromAmount: price.amount,
        toAmount: body.proposedAmount
      }
    })

    if (status === 'APPROVED' && policy?.autoApply) {
      try { 
        await applyPriceChange(pc.id)
        logger.info('Price change auto-applied', { metadata: { priceChangeId: pc.id } })
      } catch (error) { 
        logger.error('Failed to auto-apply price change', error as Error, { metadata: { priceChangeId: pc.id } })
        await prisma().priceChange.update({ 
          where: { id: pc.id }, 
          data: { status: 'FAILED' } 
        }) 
      }
    }

    const responseTime = Date.now() - startTime
    logger.info('Webhook processed successfully', { 
      metadata: { 
        priceChangeId: pc.id, 
        responseTime: `${responseTime}ms` 
      }
    })

    return NextResponse.json({ 
      id: pc.id, 
      status: pc.status, 
      policyResult: evalRes 
    })
  } catch (error) {
    const responseTime = Date.now() - startTime
    logger.error('Webhook processing failed', error as Error, { metadata: { responseTime: `${responseTime}ms` } })
    
    return NextResponse.json({ 
      error: 'Internal server error',
      message: 'Failed to process price suggestion'
    }, { status: 500 })
  }
}

// Apply rate limiting to the webhook handler
export const POST = withRateLimit(rateLimiters.webhook, handleWebhook)
