import { NextRequest, NextResponse } from 'next/server'
import { withSecurity } from '@/lib/security-headers'

export const runtime = 'nodejs'

// GET /api/platforms/amazon/oauth/install?project=<slug>
export const GET = withSecurity(async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const projectSlug = searchParams.get('project')

  if (!projectSlug) {
    return NextResponse.json({ error: 'Project slug is required' }, { status: 400 })
  }

  const appId = process.env.AMAZON_SP_APP_ID
  if (!appId) {
    return NextResponse.json({ error: 'Amazon SP-API app not configured (AMAZON_SP_APP_ID)' }, { status: 500 })
  }

  // Amazon Seller Central authorization URL
  const authUrl = new URL('https://sellercentral.amazon.com/apps/authorize/consent')
  authUrl.searchParams.set('application_id', appId)
  authUrl.searchParams.set('state', projectSlug)
  authUrl.searchParams.set('version', 'beta')

  return NextResponse.json({ installUrl: authUrl.toString() })
})

export const OPTIONS = withSecurity(async () => new NextResponse(null, { status: 204 }))

