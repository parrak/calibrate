import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@calibr/db'
import { withSecurity } from '@/lib/security-headers'
import { trackPerformance } from '@/lib/performance-middleware'
import { errorJson, getPCForProject, inferConnectorTarget, requireProjectAccess, toPriceChangeDTO } from '../../utils'
import { createId } from '@paralleldrive/cuid2'

export const POST = withSecurity(
  trackPerformance(async (req: NextRequest, context: { params: Promise<{ id: string }> }) => {
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
            connectorStatus: {
              target: connectorTarget,
              state: 'SYNCED',
              errorMessage: null,
            },
          },
        })
      })

      return NextResponse.json({ ok: true, item: toPriceChangeDTO(updated) })
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'code' in err && err.code === 'PRICE_NOT_FOUND') {
        return errorJson({
          status: 404,
          error: 'NotFound',
          message: 'Price record not found for this SKU and currency.',
        })
      }
      return errorJson({
        status: 500,
        error: 'RollbackFailed',
        message: err?.message ?? 'Failed to rollback price change.',
      })
    }
  })
)

export const OPTIONS = withSecurity(async () => new NextResponse(null, { status: 204 }))
