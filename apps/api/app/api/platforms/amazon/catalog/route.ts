import { NextRequest, NextResponse } from 'next/server'
import '@/lib/platforms/register'
import { ConnectorRegistry } from '@calibr/platform-connector'
import { withSecurity } from '@/lib/security-headers'

export const runtime = 'nodejs'

export const GET = withSecurity(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || undefined
    const page = Number(searchParams.get('page') || '1')
    const limit = Number(searchParams.get('limit') || '25')

    if (!ConnectorRegistry.isRegistered('amazon')) {
      return NextResponse.json({ error: 'Amazon connector not registered' }, { status: 404 })
    }

    const connector = await ConnectorRegistry.createConnector('amazon', { platform: 'amazon', name: 'Amazon', isActive: true })

    const result = await connector.products.list({ search, page, limit })
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to list Amazon catalog', message: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
})

export const OPTIONS = withSecurity(async (req: NextRequest) => new NextResponse(null, { status: 204 }))

