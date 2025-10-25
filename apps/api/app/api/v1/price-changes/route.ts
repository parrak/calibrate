import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@calibr/db'
import { trackPerformance } from '@/lib/performance-middleware'
import { withSecurity } from '@/lib/security-headers'
import { inputValidator } from '@/lib/input-validation'

export const GET = withSecurity(trackPerformance(async (req: NextRequest) => {
  // Validate query parameters
  const validation = inputValidator.validateQueryParams(req, {
    project: {
      required: true,
      type: 'string',
      minLength: 3,
      maxLength: 50,
      pattern: /^[a-z0-9-]+$/,
      sanitize: true,
      trim: true
    },
    status: {
      required: false,
      type: 'string',
      enum: ['pending', 'approved', 'rejected', 'applied'],
      sanitize: true,
      trim: true
    }
  })

  if (!validation.valid) {
    return NextResponse.json({ 
      error: 'Invalid query parameters', 
      details: validation.errors 
    }, { status: 400 })
  }

  const { project: projectSlug, status } = validation.value

  const project = await prisma().project.findUnique({ where: { slug: projectSlug } })
  if (!project) return NextResponse.json({ error: 'project not found' }, { status: 404 })
  
  const where: any = { projectId: project.id }
  if (status) where.status = status

  const items = await prisma().priceChange.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 50
  })

  return NextResponse.json({ items })
}))
