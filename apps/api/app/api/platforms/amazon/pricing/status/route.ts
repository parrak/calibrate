import { NextRequest, NextResponse } from 'next/server'
import { ConnectorRegistry } from '@calibr/platform-connector'
import { pollFeedUntilDone, downloadAndParseFeedResult } from '@calibr/amazon-connector'
import '@/lib/platforms/register'
import { withSecurity } from '@/lib/security-headers'

export const runtime = 'nodejs'

export const GET = withSecurity(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const feedId = searchParams.get('feed') || searchParams.get('id')
    const parse = searchParams.get('parse') === 'true'
    if (!feedId) {
      return NextResponse.json({ error: 'feed query param is required' }, { status: 400 })
    }
    if (!ConnectorRegistry.isRegistered('amazon')) {
      return NextResponse.json({ error: 'Amazon connector not registered' }, { status: 500 })
    }
    const status = await pollFeedUntilDone(feedId, { intervalMs: 1000, timeoutMs: 15000 })
    let summary: unknown
    if (parse && status.done && status.resultDocumentId) {
      summary = await downloadAndParseFeedResult(status.resultDocumentId)
    }
    return NextResponse.json({ status, summary })
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
})

export const OPTIONS = withSecurity(async (_req: NextRequest) => new NextResponse(null, { status: 204 }))

