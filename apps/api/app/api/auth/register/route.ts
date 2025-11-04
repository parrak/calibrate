import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@calibr/db'
import { withSecurity } from '@/lib/security-headers'
import { hash } from 'bcryptjs'
import isEmail from 'validator/lib/isEmail'
import { createId } from '@paralleldrive/cuid2'

const MIN_PASSWORD_LENGTH = 8

export const POST = withSecurity(async (req: NextRequest) => {
  try {
    const body = await req.json().catch(() => null)
    const rawEmail = typeof body?.email === 'string' ? body.email.trim() : ''
    const password = typeof body?.password === 'string' ? body.password : ''
    const name = typeof body?.name === 'string' ? body.name.trim() : ''
    const company = typeof body?.company === 'string' ? body.company.trim() : ''

    if (!rawEmail || !isEmail(rawEmail)) {
      return NextResponse.json(
        { error: 'A valid email address is required' },
        { status: 400 }
      )
    }

    if (!password || password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long` },
        { status: 400 }
      )
    }

    if (password.length > 128) {
      return NextResponse.json(
        { error: 'Password must be 128 characters or fewer' },
        { status: 400 }
      )
    }

    const email = rawEmail.toLowerCase()
    const db = prisma()

    const existingUser = await db.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    const tenantName =
      company ||
      name ||
      `${email.split('@')[0] || 'calibrate'}'s Workspace`

    const passwordHash = await hash(password, 10)

    const result = await db.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          id: createId(),
          name: tenantName,
        },
      })

      const user = await tx.user.create({
        data: {
          id: createId(),
          email,
          name: name || email.split('@')[0],
          role: 'OWNER',
          tenantId: tenant.id,
          passwordHash,
        },
      })

      return { tenant, user }
    })

    return NextResponse.json(
      {
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          role: result.user.role,
          tenantId: result.user.tenantId,
        },
        tenant: {
          id: result.tenant.id,
          name: result.tenant.name,
        },
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    console.error('User registration failed:', error)
    return NextResponse.json(
      { error: 'Failed to register user', message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
})

export const OPTIONS = withSecurity(async () => {
  return new NextResponse(null, { status: 204 })
})
