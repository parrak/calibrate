import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@calibr/db'
import { ConnectorRegistry } from '@calibr/platform-connector'
import { applyPriceChange, pollFeedUntilDone, downloadAndParseFeedResult } from '@calibr/amazon-connector'
import '@/lib/platforms/register'
import { withSecurity } from '@/lib/security-headers'

export const runtime = 'nodejs'

export const POST = withSecurity(async (request: NextRequest) => {
  try {
    const body = await request.json()
    const projectSlug: string | undefined = body?.project
    const sku: string | undefined = body?.sku || body?.skuCode
    const price: number | undefined = body?.price || body?.amount
    const currency: string = body?.currency || 'USD'
    const submit: boolean = body?.submit !== false
    const poll: boolean = body?.poll !== false

    if (!projectSlug || !sku || typeof price !== 'number') {
      return NextResponse.json(
        { error: 'project, sku and price are required' },
        { status: 400 },
      )
    }

    // Ensure amazon connector is registered
    if (!ConnectorRegistry.isRegistered('amazon')) {
      return NextResponse.json(
        { error: "Amazon connector not registered" },
        { status: 500 },
      )
    }

    // Validate project and integration
    const project = await prisma().project.findUnique({ where: { slug: projectSlug } })
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }
    const integration = await prisma().amazonIntegration.findFirst({
      where: {
        projectId: project.id,
        isActive: true,
      },
    })
    if (!integration) {
      return NextResponse.json(
        { error: 'Amazon integration is not connected for this project' },
        { status: 400 },
      )
    }

    // Submit price change (uses env creds or dry-run)
    const result = await applyPriceChange({
      skuCode: sku,
      currency,
      amount: price,
      submit,
    })

    if (!result.ok) {
      return NextResponse.json(
        { error: 'Failed to create/submit feed', details: result },
        { status: 500 },
      )
    }

    // If not submitting (document only), return early
    const feedId = (result.channelResult as any)?.feedId as string | undefined
    if (!submit || !poll || !feedId) {
      return NextResponse.json({ success: true, result })
    }

    // Poll status
    const status = await pollFeedUntilDone(feedId, { intervalMs: 1500, timeoutMs: 120000 })

    let summary: any = undefined
    if (status.done && status.resultDocumentId) {
      summary = await downloadAndParseFeedResult(status.resultDocumentId)
    }

    return NextResponse.json({ success: true, result, status, summary })
  } catch (error: any) {
    console.error('Amazon pricing route error:', error)
    return NextResponse.json(
      {
        error: 'Amazon pricing update failed',
        message: error?.message || String(error),
      },
      { status: 500 },
    )
  }
})

export const OPTIONS = withSecurity(async () => new NextResponse(null, { status: 204 }))

