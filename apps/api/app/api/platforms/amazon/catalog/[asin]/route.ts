import { NextRequest, NextResponse } from 'next/server'
import '@/lib/platforms/register'
import { ConnectorRegistry } from '@calibr/platform-connector'
import { withSecurity } from '@/lib/security-headers'

export const runtime = 'nodejs'

interface Params { params: Promise<{ asin: string }> }

export const GET = withSecurity(async (req: NextRequest, context: Params) => {
  try {
    const { asin } = await context.params
    if (!asin) return NextResponse.json({ error: 'asin required' }, { status: 400 })

    if (!ConnectorRegistry.isRegistered('amazon')) {
      return NextResponse.json({ error: 'Amazon connector not registered' }, { status: 404 })
    }
    const connector = await ConnectorRegistry.createConnector('amazon', { platform: 'amazon', name: 'Amazon', isActive: true })
    const item = await connector.products.get(asin)
    return NextResponse.json(item)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch item', message: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
})

export const OPTIONS = withSecurity(async (req: NextRequest) => new NextResponse(null, { status: 204 }))

