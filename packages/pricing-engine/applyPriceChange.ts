import { prisma } from '@calibr/db'
import crypto from 'crypto'

export async function applyPriceChange(priceChangeId: string) {
  const pc = await prisma().priceChange.findUnique({ where: { id: priceChangeId } })
  if (!pc) throw new Error('Price change not found')
  if (pc.status !== 'APPROVED' && pc.status !== 'PENDING') {
    throw new Error('Invalid state: price change must be APPROVED or PENDING')
  }
  
  const price = await prisma().price.findFirst({ 
    where: { skuId: pc.skuId, currency: pc.currency } 
  })
  if (!price) throw new Error('Price not found')
  
  // Create version record before updating
  await prisma().priceVersion.create({ 
    data: { 
      id: crypto.randomUUID(),
      priceId: price.id, 
      amount: price.amount, 
      note: `Apply PC ${pc.id}` 
    } 
  })
  
  // Update the price
  const updated = await prisma().price.update({ 
    where: { id: price.id }, 
    data: { amount: pc.toAmount } 
  })
  
  // Record the event
  await prisma().event.create({ 
    data: { 
      id: crypto.randomUUID(),
      tenantId: pc.tenantId, 
      kind: 'PRICE_APPLIED', 
      payload: { 
        priceChangeId: pc.id, 
        skuId: pc.skuId, 
        from: pc.fromAmount, 
        to: pc.toAmount 
      } 
    } 
  })
  
  // Update price change status
  await prisma().priceChange.update({ 
    where: { id: pc.id }, 
    data: { status: 'APPLIED', appliedAt: new Date() } 
  })
  
  return updated
}
