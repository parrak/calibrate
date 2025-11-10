import { NextRequest, NextResponse } from 'next/server'
import { prisma, Prisma } from '@calibr/db'
import { evaluatePolicy } from '@calibr/pricing-engine'
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
import { initializeShopifyConnector, serializeShopifyRateLimit } from '@/lib/shopify-connector'
import type { PriceUpdateResult } from '@calibr/platform-connector'
import { PlatformError } from '@calibr/platform-connector'
import type { ShopifyRateLimit } from '@calibr/shopify-connector'

type RulesShape = {
  maxPctDelta?: number
  floor?: number
  ceiling?: number
  dailyChangeBudgetPct?: number
  dailyChangeBudgetUsedPct?: number
  floors?: Record<string, number>
  ceilings?: Record<string, number>
}

const MAX_SHOPIFY_APPLY_ATTEMPTS = 3
const BASE_RETRY_DELAY_MS = 750

type ShopifyConnectorInstance = Awaited<ReturnType<typeof initializeShopifyConnector>>
type SerializedRateLimit = ReturnType<typeof serializeShopifyRateLimit>

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function guardShopifyRateLimit(
  connector: ShopifyConnectorInstance
): Promise<ShopifyRateLimit | null> {
  try {
    const status = await connector.getConnectionStatus()
    const rateLimit = status.rateLimit ?? null

    if (rateLimit && typeof rateLimit.remaining === 'number' && rateLimit.remaining < 2) {
      await sleep(1000)
    }

    return rateLimit
  } catch (error) {
    console.warn('Failed to read Shopify rate limits before apply', error)
    return null
  }
}

function extractRetryMetadata(error: unknown): {
  retryable: boolean
  message: string
  type?: string
} {
  if (error instanceof PlatformError) {
    return {
      retryable: error.retryable || error.type === 'rate_limit' || error.type === 'network',
      message: error.message,
      type: error.type,
    }
  }

  if (error && typeof error === 'object' && 'retryable' in error) {
    const retryableValue = (error as { retryable?: unknown }).retryable
    return {
      retryable: Boolean(retryableValue),
      message: error instanceof Error ? error.message : 'Unknown error',
    }
  }

  return {
    retryable: false,
    message: error instanceof Error ? error.message : 'Unknown error',
  }
}

function extractRuleValue(rules: RulesShape | undefined, key: string, skuCode?: string) {
  if (!rules) return undefined
  const direct = rules[key as keyof RulesShape]
  if (typeof direct === 'number') return direct
  if (skuCode) {
    const pluralKey = `${key}s` as keyof RulesShape
    const map = rules[pluralKey]
    if (map && typeof map === 'object' && typeof (map as Record<string, number>)[skuCode] === 'number') {
      return (map as Record<string, number>)[skuCode]
    }
  }
  return undefined
}

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
    if (pc.status === 'APPLIED' || pc.status === 'ROLLED_BACK') {
      return errorJson({
        status: 409,
        error: 'AlreadyApplied',
        message: 'Price change already applied.',
      })
    }
    if (pc.status === 'REJECTED') {
      return errorJson({
        status: 409,
        error: 'AlreadyRejected',
        message: 'Rejected price changes cannot be applied.',
      })
    }

    const contextData = (pc.context ?? {}) as Record<string, unknown>
    if (contextData?.simulateConnectorError) {
      const msg =
        typeof contextData.simulateConnectorError === 'string'
          ? contextData.simulateConnectorError
          : 'Connector reported an error.'
      return errorJson({
        status: 502,
        error: 'ConnectorError',
        details: { target: inferConnectorTarget(pc), message: msg },
      })
    }

    const price = await prisma().price.findFirst({
      where: { skuId: pc.skuId, currency: pc.currency },
    })
    if (!price) {
      return errorJson({
        status: 404,
        error: 'NotFound',
        message: 'Active price record not found for this SKU and currency.',
      })
    }

    const policy = await prisma().policy.findUnique({ where: { projectId: pc.projectId } })
    const rules = (policy?.rules ?? {}) as RulesShape | undefined
    const skuCode = typeof contextData?.skuCode === 'string' ? contextData.skuCode : undefined
    const evaluation = evaluatePolicy(price.amount, pc.toAmount, {
      maxPctDelta: extractRuleValue(rules, 'maxPctDelta'),
      floor: extractRuleValue(rules, 'floor', skuCode),
      ceiling: extractRuleValue(rules, 'ceiling', skuCode),
      dailyBudgetPct: extractRuleValue(rules, 'dailyChangeBudgetPct'),
      dailyBudgetUsedPct: extractRuleValue(rules, 'dailyChangeBudgetUsedPct'),
    })

    if (!evaluation.ok) {
      return errorJson({
        status: 422,
        error: 'PolicyViolation',
        details: evaluation,
        message: 'Policy checks failed for this price change.',
      })
    }

    if (pc.status === 'PENDING' && !policy?.autoApply) {
      return errorJson({
        status: 400,
        error: 'InvalidStatus',
        message: 'Pending price changes must be approved before applying.',
      })
    }

    const connectorTarget = inferConnectorTarget(pc)
    const now = new Date()

    type ShopifyContext = {
      target: 'shopify'
      connector: Awaited<ReturnType<typeof initializeShopifyConnector>>
      variantId: string
      result: PriceUpdateResult
    }

    let shopifyContext: ShopifyContext | null = null

    if (connectorTarget === 'shopify') {
      const variantId = await resolveShopifyVariantId(pc)
      if (!variantId) {
        return errorJson({
          status: 422,
          error: 'MissingVariant',
          message: 'shopifyVariantId is required in the price change context to apply changes.',
        })
      }

      const integration = await getActiveShopifyIntegration(pc.projectId)
      if (!integration) {
        return errorJson({
          status: 409,
          error: 'IntegrationMissing',
          message: 'An active Shopify integration is required to apply this price change.',
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

      const attemptSummaries: Array<{
        attempt: number
        success: boolean
        retryable: boolean
        error?: string
        delayMs?: number
        rateLimit?: SerializedRateLimit
        errorType?: string
        completedAt: string
      }> = []

      let updateResult: PriceUpdateResult | null = null
      let failure: { message: string; retryable: boolean } | null = null

      for (let attempt = 1; attempt <= MAX_SHOPIFY_APPLY_ATTEMPTS; attempt += 1) {
        const rateLimit = await guardShopifyRateLimit(connector)
        const serializedRateLimit = serializeShopifyRateLimit(rateLimit)
        await prisma().event.create({
          data: {
            id: createId(),
            tenantId: pc.tenantId,
            projectId: pc.projectId,
            kind: 'shopify.apply.attempt',
            payload: {
              priceChangeId: pc.id,
              variantId,
              attempt,
              rateLimit: serializedRateLimit,
            } satisfies Prisma.InputJsonValue,
          },
        })

        try {
          const result = await connector.pricing.updatePrice({
            externalId: variantId,
            price: pc.toAmount,
            currency: pc.currency,
            metadata: {
              priceChangeId: pc.id,
              projectId: pc.projectId,
            },
          })

          if (result.success) {
            updateResult = result
            const completedAt = new Date().toISOString()
            attemptSummaries.push({
              attempt,
              success: true,
              retryable: false,
              rateLimit: serializedRateLimit,
              completedAt,
            })

            await prisma().event.create({
              data: {
                id: createId(),
                tenantId: pc.tenantId,
                projectId: pc.projectId,
                kind: 'shopify.apply.success',
                payload: {
                  priceChangeId: pc.id,
                  variantId,
                  attempt,
                  appliedAt: completedAt,
                  newPrice: result.newPrice ?? pc.toAmount,
                  oldPrice: result.oldPrice ?? pc.fromAmount,
                  currency: result.currency,
                  rateLimit: serializedRateLimit,
                } satisfies Prisma.InputJsonValue,
              },
            })

            break
          }

          const errorMessage = result.error || 'Shopify rejected this price update.'
          const retryable = Boolean(result.retryable)
          const willRetry = retryable && attempt < MAX_SHOPIFY_APPLY_ATTEMPTS
          const completedAt = new Date().toISOString()

          attemptSummaries.push({
            attempt,
            success: false,
            retryable,
            error: errorMessage,
            rateLimit: serializedRateLimit,
            completedAt,
          })

          await prisma().event.create({
            data: {
              id: createId(),
              tenantId: pc.tenantId,
              projectId: pc.projectId,
              kind: willRetry ? 'shopify.apply.retry' : 'shopify.apply.failed',
              payload: {
                priceChangeId: pc.id,
                variantId,
                attempt,
                retryable,
                error: errorMessage,
                rateLimit: serializedRateLimit,
              } satisfies Prisma.InputJsonValue,
            },
          })

          if (!willRetry) {
            failure = { message: errorMessage, retryable }
            break
          }

          const delayMs = BASE_RETRY_DELAY_MS * 2 ** (attempt - 1)
          attemptSummaries[attemptSummaries.length - 1].delayMs = delayMs
          await sleep(delayMs)
        } catch (err: unknown) {
          const retryMetadata = extractRetryMetadata(err)
          const willRetry = retryMetadata.retryable && attempt < MAX_SHOPIFY_APPLY_ATTEMPTS
          const completedAt = new Date().toISOString()

          attemptSummaries.push({
            attempt,
            success: false,
            retryable: retryMetadata.retryable,
            error: retryMetadata.message,
            errorType: retryMetadata.type,
            rateLimit: serializedRateLimit,
            completedAt,
          })

          await prisma().event.create({
            data: {
              id: createId(),
              tenantId: pc.tenantId,
              projectId: pc.projectId,
              kind: willRetry ? 'shopify.apply.retry' : 'shopify.apply.failed',
              payload: {
                priceChangeId: pc.id,
                variantId,
                attempt,
                retryable: retryMetadata.retryable,
                error: retryMetadata.message,
                rateLimit: serializedRateLimit,
                errorType: retryMetadata.type,
              } satisfies Prisma.InputJsonValue,
            },
          })

          if (!willRetry) {
            failure = { message: retryMetadata.message, retryable: retryMetadata.retryable }
            break
          }

          const delayMs = BASE_RETRY_DELAY_MS * 2 ** (attempt - 1)
          attemptSummaries[attemptSummaries.length - 1].delayMs = delayMs
          await sleep(delayMs)
        }
      }

      if (!updateResult || !updateResult.success) {
        const failureMessage = failure?.message ?? 'Shopify rejected this price update.'
        try {
          await prisma().priceChange.update({
            where: { id: pc.id },
            data: {
              connectorStatus: {
                target: 'shopify',
                state: 'ERROR',
                errorMessage: failureMessage,
                attempts: attemptSummaries,
              } satisfies Prisma.InputJsonValue,
            },
          })
        } catch (updateError) {
          console.error('Failed to persist Shopify connector failure status', updateError)
        }

        return errorJson({
          status: 502,
          error: 'ConnectorError',
          message: failureMessage,
          details: { retryable: failure?.retryable ?? false },
        })
      }

      shopifyContext = {
        target: 'shopify',
        connector,
        variantId,
        result: updateResult,
      }

      shopifyContext.result.metadata = {
        ...(shopifyContext.result.metadata ?? {}),
        attempts: attemptSummaries,
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
            updatedAt:
              shopifyContext.result.updatedAt instanceof Date
                ? shopifyContext.result.updatedAt.toISOString()
                : new Date(shopifyContext.result.updatedAt ?? Date.now()).toISOString(),
            metadata: {
              priceChangeId: pc.id,
              projectId: pc.projectId,
              oldPrice: shopifyContext.result.oldPrice ?? pc.fromAmount,
              newPrice: shopifyContext.result.newPrice ?? pc.toAmount,
              currency: pc.currency,
              attempts: shopifyContext.result.metadata?.attempts ?? null,
            },
          }
        : {
            target: connectorTarget,
            state: 'SYNCED',
            errorMessage: null,
          }

    try {
      const updated = await prisma().$transaction(async (tx) => {
        const currentPrice = await tx.price.findFirst({
          where: { skuId: pc.skuId, currency: pc.currency },
        })
        if (!currentPrice) {
          throw Object.assign(new Error('PRICE_NOT_FOUND'), { code: 'PRICE_NOT_FOUND' })
        }

        await tx.priceVersion.create({
          data: {
            id: createId(),
            priceId: currentPrice.id,
            amount: currentPrice.amount,
            note: `Apply price change ${pc.id}`,
          },
        })

        await tx.price.update({
          where: { id: currentPrice.id },
          data: { amount: pc.toAmount },
        })

        await tx.event.create({
          data: {
            id: createId(),
            tenantId: pc.tenantId,
            projectId: pc.projectId,
            kind: 'PRICE_APPLIED',
            payload: {
              priceChangeId: pc.id,
              skuId: pc.skuId,
              from: pc.fromAmount,
              to: pc.toAmount,
            },
          },
        })

        const approvedBy =
          pc.status === 'PENDING' && !pc.approvedBy ? access.session.userId ?? null : pc.approvedBy ?? null

        return tx.priceChange.update({
          where: { id: pc.id },
          data: {
            status: 'APPLIED',
            appliedAt: now,
            approvedBy,
            policyResult: evaluation,
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
            price: pc.fromAmount,
            currency: pc.currency,
            metadata: {
              priceChangeId: pc.id,
              projectId: pc.projectId,
              reason: 'revert-after-db-failure',
            },
          })
        } catch (revertError) {
          console.error('Failed to revert Shopify price after database failure', revertError)
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
        : 'Failed to apply price change.'
      return errorJson({
        status: 500,
        error: 'ApplyFailed',
        message: errorMessage,
      })
    }
  })
)

export const OPTIONS = withSecurity(async () => new NextResponse(null, { status: 204 }))
