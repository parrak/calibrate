/**
 * Apply Price Change (Enhanced) — M1.1: Pricing Engine MVP
 * 
 * Enhanced version that stores explain traces and emits to event_log
 */

import { prisma } from '@calibr/db'
import { EventWriter } from '@calibr/db/eventing'
import { createId } from '@paralleldrive/cuid2'

export type ApplyPriceChangeOptions = {
  priceChangeId: string
  actor: string
  correlationId?: string
}

export type ApplyPriceChangeResult = {
  priceId: string
  explainTraceId: string
  auditId: string
  eventLogId: string
}

/**
 * Apply a price change with explain traces and event emission
 */
export async function applyPriceChangeEnhanced(
  options: ApplyPriceChangeOptions
): Promise<ApplyPriceChangeResult> {
  const { priceChangeId, actor, correlationId } = options

  const pc = await prisma().priceChange.findUnique({ where: { id: priceChangeId } })
  if (!pc) throw new Error('Price change not found')
  if (pc.status !== 'APPROVED' && pc.status !== 'PENDING') {
    throw new Error('Invalid state: price change must be APPROVED or PENDING')
  }

  const price = await prisma().price.findFirst({
    where: { skuId: pc.skuId, currency: pc.currency }
  })
  if (!price) throw new Error('Price not found')

  // Get SKU and Product info for explain trace
  const sku = await prisma().sku.findUnique({
    where: { id: pc.skuId },
    include: { Product: true }
  })

  // Execute in transaction
  const result = await prisma().$transaction(async (tx) => {
    // Create version record before updating
    await tx.priceVersion.create({
      data: {
        id: createId(),
        priceId: price.id,
        amount: price.amount,
        note: `Apply price change ${pc.id}`
      }
    })

    // Update the price
    const updated = await tx.price.update({
      where: { id: price.id },
      data: { amount: pc.toAmount }
    })

    // Update price change status
    const updatedPc = await tx.priceChange.update({
      where: { id: pc.id },
      data: {
        status: 'APPLIED',
        state: 'APPLIED',
        appliedAt: new Date()
      }
    })

    // Create explain trace
    const explainTrace = await tx.explainTrace.create({
      data: {
        id: createId(),
        tenantId: pc.tenantId,
        projectId: pc.projectId,
        priceChangeId: pc.id,
        entity: 'PriceChange',
        entityId: pc.id,
        action: 'apply',
        actor,
        trace: {
          priceChange: {
            id: pc.id,
            skuId: pc.skuId,
            skuCode: sku?.code,
            fromAmount: pc.fromAmount,
            toAmount: pc.toAmount,
            currency: pc.currency,
            delta: pc.toAmount - pc.fromAmount,
            deltaPct: pc.fromAmount === 0 ? 100 : ((pc.toAmount - pc.fromAmount) / pc.fromAmount) * 100
          },
          rule: {
            selector: pc.selectorJson,
            transform: pc.transformJson
          },
          policyResult: pc.policyResult,
          appliedAt: new Date().toISOString()
        },
        metadata: {
          correlationId,
          previousPrice: price.amount,
          newPrice: pc.toAmount
        }
      }
    })

    // Create audit record
    const audit = await tx.audit.create({
      data: {
        id: createId(),
        tenantId: pc.tenantId,
        projectId: pc.projectId,
        entity: 'PriceChange',
        entityId: pc.id,
        action: 'apply',
        actor,
        explain: {
          explainTraceId: explainTrace.id,
          priceChange: {
            from: pc.fromAmount,
            to: pc.toAmount,
            delta: pc.toAmount - pc.fromAmount
          },
          rule: {
            selector: pc.selectorJson,
            transform: pc.transformJson
          }
        }
      }
    })

    // Emit to event_log via EventWriter
    const eventWriter = new EventWriter(tx as any)
    const eventKey = `pricechange-applied-${pc.id}-${Date.now()}`
    const eventLogId = await eventWriter.writeEvent({
      eventKey,
      tenantId: pc.tenantId,
      projectId: pc.projectId,
      eventType: 'pricechange.applied',
      payload: {
        priceChangeId: pc.id,
        skuId: pc.skuId,
        skuCode: sku?.code,
        fromAmount: pc.fromAmount,
        toAmount: pc.toAmount,
        currency: pc.currency,
        delta: pc.toAmount - pc.fromAmount,
        deltaPct: pc.fromAmount === 0 ? 100 : ((pc.toAmount - pc.fromAmount) / pc.fromAmount) * 100,
        rule: {
          selector: pc.selectorJson,
          transform: pc.transformJson
        }
      },
      metadata: {
        actor,
        explainTraceId: explainTrace.id,
        auditId: audit.id
      },
      correlationId
    })

    // Also create legacy Event record for backward compatibility
    await tx.event.create({
      data: {
        id: createId(),
        tenantId: pc.tenantId,
        projectId: pc.projectId,
        kind: 'PRICE_APPLIED',
        type: 'pricechange.applied',
        payload: {
          priceChangeId: pc.id,
          skuId: pc.skuId,
          from: pc.fromAmount,
          to: pc.toAmount
        }
      }
    })

    return {
      priceId: updated.id,
      explainTraceId: explainTrace.id,
      auditId: audit.id,
      eventLogId
    }
  })

  return result
}

/**
 * Rollback a price change with explain traces and event emission
 */
export async function rollbackPriceChangeEnhanced(
  options: ApplyPriceChangeOptions
): Promise<ApplyPriceChangeResult> {
  const { priceChangeId, actor, correlationId } = options

  const pc = await prisma().priceChange.findUnique({ where: { id: priceChangeId } })
  if (!pc) throw new Error('Price change not found')
  if (pc.status !== 'APPLIED') {
    throw new Error('Invalid state: price change must be APPLIED to rollback')
  }

  const price = await prisma().price.findFirst({
    where: { skuId: pc.skuId, currency: pc.currency }
  })
  if (!price) throw new Error('Price not found')

  // Get SKU info
  const sku = await prisma().sku.findUnique({
    where: { id: pc.skuId },
    include: { Product: true }
  })

  // Execute in transaction
  const result = await prisma().$transaction(async (tx) => {
    // Create version record before updating
    await tx.priceVersion.create({
      data: {
        id: createId(),
        priceId: price.id,
        amount: price.amount,
        note: `Rollback price change ${pc.id}`
      }
    })

    // Restore the original price
    const updated = await tx.price.update({
      where: { id: price.id },
      data: { amount: pc.fromAmount }
    })

    // Update price change status
    await tx.priceChange.update({
      where: { id: pc.id },
      data: {
        status: 'ROLLED_BACK',
        state: 'ROLLED_BACK'
      }
    })

    // Create explain trace
    const explainTrace = await tx.explainTrace.create({
      data: {
        id: createId(),
        tenantId: pc.tenantId,
        projectId: pc.projectId,
        priceChangeId: pc.id,
        entity: 'PriceChange',
        entityId: pc.id,
        action: 'rollback',
        actor,
        trace: {
          priceChange: {
            id: pc.id,
            skuId: pc.skuId,
            skuCode: sku?.code,
            restoredFrom: pc.toAmount,
            restoredTo: pc.fromAmount,
            currency: pc.currency
          },
          reason: 'User-initiated rollback',
          rolledBackAt: new Date().toISOString()
        },
        metadata: {
          correlationId,
          previousPrice: price.amount,
          restoredPrice: pc.fromAmount
        }
      }
    })

    // Create audit record
    const audit = await tx.audit.create({
      data: {
        id: createId(),
        tenantId: pc.tenantId,
        projectId: pc.projectId,
        entity: 'PriceChange',
        entityId: pc.id,
        action: 'rollback',
        actor,
        explain: {
          explainTraceId: explainTrace.id,
          priceChange: {
            from: pc.toAmount,
            to: pc.fromAmount,
            restored: true
          }
        }
      }
    })

    // Emit to event_log
    const eventWriter = new EventWriter(tx as any)
    const eventKey = `pricechange-rolled-back-${pc.id}-${Date.now()}`
    const eventLogId = await eventWriter.writeEvent({
      eventKey,
      tenantId: pc.tenantId,
      projectId: pc.projectId,
      eventType: 'pricechange.rolled_back',
      payload: {
        priceChangeId: pc.id,
        skuId: pc.skuId,
        skuCode: sku?.code,
        restoredFrom: pc.toAmount,
        restoredTo: pc.fromAmount,
        currency: pc.currency
      },
      metadata: {
        actor,
        explainTraceId: explainTrace.id,
        auditId: audit.id
      },
      correlationId
    })

    // Also create legacy Event record
    await tx.event.create({
      data: {
        id: createId(),
        tenantId: pc.tenantId,
        projectId: pc.projectId,
        kind: 'PRICE_ROLLED_BACK',
        type: 'pricechange.rolled_back',
        payload: {
          priceChangeId: pc.id,
          skuId: pc.skuId,
          restoredAmount: pc.fromAmount
        }
      }
    })

    return {
      priceId: updated.id,
      explainTraceId: explainTrace.id,
      auditId: audit.id,
      eventLogId
    }
  })

  return result
}

