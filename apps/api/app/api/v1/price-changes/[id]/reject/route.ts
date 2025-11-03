import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@calibr/db'
import { withSecurity } from '@/lib/security-headers'
import { trackPerformance } from '@/lib/performance-middleware'
import { errorJson, getPCForProject, requireProjectAccess, toPriceChangeDTO } from '../../utils'

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
    const access = await requireProjectAccess(req, projectSlug, 'EDITOR')
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
      return errorJson({ status: 409, error: 'AlreadyApplied', message: 'Applied price changes cannot be rejected.' })
    }
    if (pc.status === 'REJECTED') {
      return NextResponse.json({ ok: true, item: toPriceChangeDTO(pc) })
    }

    if (pc.status !== 'PENDING' && pc.status !== 'APPROVED' && pc.status !== 'FAILED') {
      return errorJson({
        status: 400,
        error: 'InvalidStatus',
        message: 'Only pending, approved, or failed price changes can be rejected.',
      })
    }

    const updated = await prisma().priceChange.update({
      where: { id: pc.id },
      data: {
        status: 'REJECTED',
        connectorStatus: pc.connectorStatus,
      },
    })

    return NextResponse.json({ ok: true, item: toPriceChangeDTO(updated) })
  })
)

export const OPTIONS = withSecurity(async () => new NextResponse(null, { status: 204 }))
