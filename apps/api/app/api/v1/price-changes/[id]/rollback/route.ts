import { NextRequest, NextResponse } from 'next/server'
import { prisma, Prisma } from '@calibr/db'
import { withSecurity } from '@/lib/security-headers'
import { trackPerformance } from '@/lib/performance-middleware'
import {
  errorJson,
  getActiveShopifyIntegration,
  getPCForProject,
  inferConnectorTarget,
  requireProjectAccess,
  resolveShopifyVariantId,
  toPriceChangeDTO,
} from '../../utils'
import { createId } from '@paralleldrive/cuid2'
import { initializeShopifyConnector } from '@/lib/shopify-connector'
import type { PriceUpdateResult } from '@calibr/platform-connector'

export const POST = withSecurity(
  trackPerformance(async (req: NextRequest, ...args: unknown[]) => {
    const context = args[0] as { params: Promise<{ id: string }> }
    const projectSlug = req.headers.get('X-Calibr-Project')?.trim()
    if (!projectSlug) {
      return errorJson({
        status: 400,
        error: 'ProjectRequired',
        message: 'X-Calibr-Project header is required.',
      })
    }

    const { id } = await context.params
    const access = await requireProjectAccess(req, projectSlug, 'ADMIN')
    if ('error' in access) {
      return errorJson(access.error)
    }

    const match = await getPCForProject(id, projectSlug)
    if ('error' in match) {
      return match.error === 'NotFound'
        ? errorJson({ status: 404, error: 'NotFound', message: 'Price change not found.' })
        : errorJson({
            status: 403,
            error: 'Forbidden',
            message: 'Price change does not belong to this project.',
          })
    }

    if (match.project.id !== access.project.id) {
      return errorJson({
        status: 403,
        error: 'Forbidden',
        message: 'Price change does not belong to this project.',
      })
    }

    const pc = match.pc
    if (pc.status !== 'APPLIED') {
      return errorJson({
        status: 400,
        error: 'InvalidStatus',
        message: 'Only applied price changes can be rolled back.',
      })
    }

    const connectorTarget = inferConnectorTarget(pc)

    type ShopifyContext = {
      target: 'shopify'
      connector: Awaited<ReturnType<typeof initializeShopifyConnector>>
      variantId: string
      result: PriceUpdateResult
    }

    let shopifyContext: ShopifyContext | null = null

    if (connectorTarget === 'shopify') {
      const variantId = resolveShopifyVariantId(pc)
      if (!variantId) {
        return errorJson({
          status: 422,
          error: 'MissingVariant',
          message: 'Cannot rollback without a Shopify variant identifier on the price change.',
        })
      }

      const integration = await getActiveShopifyIntegration(pc.projectId)
      if (!integration) {
        return errorJson({
          status: 409,
          error: 'IntegrationMissing',
          message: 'An active Shopify integration is required to rollback this price change.',
        })
      }

      let connector: Awaited<ReturnType<typeof initializeShopifyConnector>>
      try {
        connector = await initializeShopifyConnector(integration)
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Failed to initialize Shopify connector for this project.'
        return errorJson({
          status: 502,
          error: 'ConnectorUnavailable',
          message,
        })
      }

      let updateResult: PriceUpdateResult
      try {
        updateResult = await connector.pricing.updatePrice({
          externalId: variantId,
          price: pc.fromAmount,
          currency: pc.currency,
          metadata: {
            priceChangeId: pc.id,
            projectId: pc.projectId,
            reason: 'rollback',
          },
        })
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Failed to rollback price in Shopify for this price change.'
        return errorJson({
          status: 502,
          error: 'ConnectorError',
          message,
        })
      }

      if (!updateResult.success) {
        return errorJson({
          status: 502,
          error: 'ConnectorError',
          message: updateResult.error || 'Shopify rejected the rollback request.',
          details: { retryable: updateResult.retryable ?? false },
        })
      }

      shopifyContext = {
        target: 'shopify',
        connector,
        variantId,
        result: updateResult,
      }
    }

    const connectorStatusPayload: Prisma.InputJsonValue =
      shopifyContext !== null
        ? {
            target: shopifyContext.target,
            state: 'SYNCED',
            errorMessage: null,
            variantId: shopifyContext.variantId,
            externalId: shopifyContext.result.externalId,
            updatedAt: shopifyContext.result.updatedAt.toISOString(),
            metadata: {
              priceChangeId: pc.id,
              projectId: pc.projectId,
              oldPrice: shopifyContext.result.oldPrice ?? pc.toAmount,
              newPrice: shopifyContext.result.newPrice ?? pc.fromAmount,
              rolledBack: true,
              currency: pc.currency,
            },
          }
        : {
            target: connectorTarget,
            state: 'SYNCED',
            errorMessage: null,
          }

    try {
      const updated = await prisma().$transaction(async (tx) => {
        const price = await tx.price.findFirst({
          where: { skuId: pc.skuId, currency: pc.currency },
        })
        if (!price) {
          throw Object.assign(new Error('PRICE_NOT_FOUND'), { code: 'PRICE_NOT_FOUND' })
        }

        await tx.priceVersion.create({
          data: {
            id: createId(),
            priceId: price.id,
            amount: price.amount,
            note: `Rollback price change ${pc.id}`,
          },
        })

        await tx.price.update({
          where: { id: price.id },
          data: { amount: pc.fromAmount },
        })

        await tx.event.create({
          data: {
            id: createId(),
            tenantId: pc.tenantId,
            projectId: pc.projectId,
            kind: 'PRICE_ROLLED_BACK',
            payload: {
              priceChangeId: pc.id,
              skuId: pc.skuId,
              restoredAmount: pc.fromAmount,
            },
          },
        })

        return tx.priceChange.update({
          where: { id: pc.id },
          data: {
            status: 'ROLLED_BACK',
            connectorStatus: connectorStatusPayload,
          },
        })
      })

      return NextResponse.json({ ok: true, item: toPriceChangeDTO(updated) })
    } catch (err: unknown) {
      if (shopifyContext) {
        try {
          await shopifyContext.connector.pricing.updatePrice({
            externalId: shopifyContext.variantId,
            price: pc.toAmount,
            currency: pc.currency,
            metadata: {
              priceChangeId: pc.id,
              projectId: pc.projectId,
              reason: 'revert-after-db-failure',
            },
          })
        } catch (revertError) {
          console.error('Failed to restore Shopify price after rollback failure', revertError)
        }
      }

      if (err && typeof err === 'object' && 'code' in err && err.code === 'PRICE_NOT_FOUND') {
        return errorJson({
          status: 404,
          error: 'NotFound',
          message: 'Price record not found for this SKU and currency.',
        })
      }
      const errorMessage = err && typeof err === 'object' && 'message' in err && typeof err.message === 'string'
        ? err.message
        : 'Failed to rollback price change.'
      return errorJson({
        status: 500,
        error: 'RollbackFailed',
        message: errorMessage,
      })
    }
  })
)

export const OPTIONS = withSecurity(async () => new NextResponse(null, { status: 204 }))
