import { NextRequest, NextResponse } from 'next/server'
import { withSecurity } from '@/lib/security-headers'
import { prisma } from '@calibr/db'
import { createId } from '@paralleldrive/cuid2'

export const runtime = 'nodejs'

async function exchangeCodeForTokens(params: {
  code: string
  redirectUri: string
  clientId: string
  clientSecret: string
}) {
  const res = await fetch('https://api.amazon.com/auth/o2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: params.code,
      redirect_uri: params.redirectUri,
      client_id: params.clientId,
      client_secret: params.clientSecret,
    }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`LWA token exchange failed (${res.status}): ${text}`)
  }
  return (await res.json()) as { access_token?: string; refresh_token?: string; expires_in?: number }
}

// GET /api/platforms/amazon/oauth/callback?spapi_oauth_code=...&selling_partner_id=...&state=<projectSlug>
export const GET = withSecurity(async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const code = url.searchParams.get('spapi_oauth_code')
    const sellingPartnerId = url.searchParams.get('selling_partner_id')
    const projectSlug = url.searchParams.get('state')

    if (!code || !sellingPartnerId || !projectSlug) {
      return NextResponse.json({ error: 'Missing required query params' }, { status: 400 })
    }

    const clientId = process.env.AMAZON_LWA_CLIENT_ID
    const clientSecret = process.env.AMAZON_LWA_CLIENT_SECRET
    if (!clientId || !clientSecret) {
      return NextResponse.json({ error: 'Amazon LWA not configured (AMAZON_LWA_CLIENT_ID/SECRET)' }, { status: 500 })
    }

    // Build redirect URI matching Seller Central app config
    const origin = `${url.protocol}//${url.host}`
    const redirectUri = `${origin}/api/platforms/amazon/oauth/callback`

    const tokens = await exchangeCodeForTokens({ code, redirectUri, clientId, clientSecret })
    const refreshToken = tokens.refresh_token
    const accessToken = tokens.access_token
    const expiresIn = tokens.expires_in

    if (!refreshToken) {
      return NextResponse.json({ error: 'Missing refresh_token from LWA' }, { status: 500 })
    }

    // Persist integration
    const db = prisma()
    const project = await db.project.findUnique({ where: { slug: projectSlug } })
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const tokenExpiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000) : null

    const integration = await db.amazonIntegration.upsert({
      where: {
        projectId_sellerId: { projectId: project.id, sellerId: sellingPartnerId },
      },
      create: {
        id: createId(),
        projectId: project.id,
        sellerId: sellingPartnerId,
        marketplaceId: 'ATVPDKIKX0DER',
        region: 'us-east-1',
        refreshToken,
        accessToken: accessToken || null,
        tokenExpiresAt,
        isActive: true,
      },
      update: {
        refreshToken,
        accessToken: accessToken || null,
        tokenExpiresAt,
        isActive: true,
      },
    })

    // Redirect back to console integration page
    const consoleBase = process.env.NEXT_PUBLIC_CONSOLE_URL || (process.env.CONSOLE_BASE_URL ?? '')
    if (consoleBase) {
      return NextResponse.redirect(`${consoleBase}/p/${projectSlug}/integrations/amazon?connected=1`)
    }

    return NextResponse.json({ ok: true, integration: { id: integration.id, sellerId: integration.sellerId } })
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
})

export const OPTIONS = withSecurity(async () => new NextResponse(null, { status: 204 }))

