import { NextRequest, NextResponse } from 'next/server'
import '@/lib/platforms/register'
import { ConnectorRegistry } from '@calibr/platform-connector'

export const runtime = 'nodejs'

interface Params { params: { asin: string } }

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { asin } = params
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
}

