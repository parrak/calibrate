import { NextRequest, NextResponse } from 'next/server'
import { authSecurityManager } from '@/lib/auth-security'

export async function POST(req: NextRequest) {
  try {
    const internal = req.headers.get('x-console-auth') || req.headers.get('x-internal-auth')
    const expected = process.env.CONSOLE_INTERNAL_TOKEN
    if (!expected || internal !== expected) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const body = await req.json()
    const userId: string | undefined = body?.userId
    const roles: string[] | undefined = body?.roles
    const projectId: string | undefined = body?.projectId
    const tenantId: string | undefined = body?.tenantId
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    const ctx = authSecurityManager.createAuthContext({ userId, roles: roles || ['admin'], projectId, tenantId })
    const token = authSecurityManager.generateSessionToken(ctx)
    return NextResponse.json({ token, context: ctx })
  } catch (err: unknown) {
    return NextResponse.json({ error: 'Failed to create session', message: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}

