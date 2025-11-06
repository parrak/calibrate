import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { authSecurityManager } from '@/lib/auth-security'
import { withSecurity } from '@/lib/security-headers'

const sessionPayloadSchema = z.object({
  userId: z.string().min(1, 'userId required'),
  roles: z.array(z.string()).optional(),
  projectId: z.string().min(1).optional(),
  tenantId: z.string().min(1).optional(),
})

const DEFAULT_ROLE = 'viewer'

export const POST = withSecurity(async function POST(req: NextRequest) {
  const expected = process.env.CONSOLE_INTERNAL_TOKEN
  if (!expected) {
    console.error('Missing CONSOLE_INTERNAL_TOKEN environment variable for auth session endpoint')
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
  }

  const provided = req.headers.get('x-console-auth')
  if (!provided || provided !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let json: unknown
  try {
    json = await req.json()
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = sessionPayloadSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({
      error: 'Invalid payload',
      issues: parsed.error.flatten(),
    }, { status: 400 })
  }

  const { userId, roles, projectId, tenantId } = parsed.data
  const normalizedRoles = Array.from(
    new Set(
      (roles ?? [])
        .map((role) => role.trim().toLowerCase())
        .filter((role) => role.length > 0)
    )
  )
  const effectiveRoles = normalizedRoles.length > 0 ? normalizedRoles : [DEFAULT_ROLE]
  const ctx = authSecurityManager.createAuthContext({
    userId,
    roles: effectiveRoles,
    projectId,
    tenantId,
  })
  const token = authSecurityManager.generateSessionToken(ctx)
  return NextResponse.json({ token, context: ctx })
})

export const OPTIONS = withSecurity(async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
})

