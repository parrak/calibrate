import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyHmac } from '@calibr/security'

const db = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // Verify HMAC signature
    const authResult = await verifyHmac(request)
    if (!authResult.valid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    const projectId = searchParams.get('projectId')

    if (!tenantId || !projectId) {
      return NextResponse.json({ error: 'Missing tenantId or projectId' }, { status: 400 })
    }

    const rules = await db.competitorRule.findMany({
      where: {
        tenantId,
        projectId
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ rules })
  } catch (error) {
    console.error('Error fetching competitor rules:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify HMAC signature
    const authResult = await verifyHmac(request)
    if (!authResult.valid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { tenantId, projectId, name, description, rules } = body

    if (!tenantId || !projectId || !name || !rules) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const rule = await db.competitorRule.create({
      data: {
        tenantId,
        projectId,
        name,
        description,
        rules
      }
    })

    return NextResponse.json({ rule }, { status: 201 })
  } catch (error) {
    console.error('Error creating competitor rule:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
