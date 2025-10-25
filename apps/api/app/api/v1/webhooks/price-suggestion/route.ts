import { NextRequest, NextResponse } from 'next/server'
import { PriceSuggestionPayload } from '@/zod/schemas'
import { prisma } from '@calibr/db'
import { evaluatePolicy } from '@calibr/pricing-engine'
import { applyPriceChange } from '@calibr/pricing-engine'
import { verifyHmac } from '@calibr/security'
import { ensureIdempotent } from '@calibr/security'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  // Verify HMAC signature (also returns the body to avoid double-read)
  const authResult = await verifyHmac(req)
  if (!authResult.valid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  // Use body from authResult to avoid reading request body twice
  const raw = authResult.body || ''

  let body
  try {
    body = PriceSuggestionPayload.parse(JSON.parse(raw))
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const ok = await ensureIdempotent(body.idempotencyKey, 'price-suggestion')
  if (!ok) return NextResponse.json({ status: 'duplicate' })

  const projectSlug = req.headers.get('x-calibr-project')
  if (!projectSlug) return NextResponse.json({ error: 'Missing project identifier' }, { status: 400 })
  const project = await prisma.project.findUnique({ where: { slug: projectSlug } })
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const sku = await prisma.sku.findFirst({ 
    where: { code: body.skuCode, product: { projectId: project.id } }, 
    include: { product: true } 
  })
  if (!sku) return NextResponse.json({ error: 'SKU not found' }, { status: 404 })

  const price = await prisma.price.findFirst({ 
    where: { skuId: sku.id, currency: body.currency } 
  })
  if (!price) return NextResponse.json({ error: 'Price not found' }, { status: 404 })

  const policy = await prisma.policy.findFirst({ 
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
  
  const pc = await prisma.priceChange.create({
    data: {
      tenantId: sku.product.tenantId,
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

  if (status === 'APPROVED' && policy?.autoApply) {
    try { 
      await applyPriceChange(pc.id) 
    } catch { 
      await prisma.priceChange.update({ 
        where: { id: pc.id }, 
        data: { status: 'FAILED' } 
      }) 
    }
  }

  return NextResponse.json({ 
    id: pc.id, 
    status: pc.status, 
    policyResult: evalRes 
  })
}
