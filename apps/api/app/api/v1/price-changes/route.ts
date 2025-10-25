import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@calibr/db'
import { trackPerformance } from '@/lib/performance-middleware'

export const GET = trackPerformance(async (req: NextRequest) => {
  const status = req.nextUrl.searchParams.get('status') ?? undefined
  const projectSlug = req.nextUrl.searchParams.get('project')
  if (!projectSlug) return NextResponse.json({ error: 'project required' }, { status: 400 })
  const project = await prisma().project.findUnique({ where: { slug: projectSlug } })
  if (!project) return NextResponse.json({ error: 'project not found' }, { status: 404 })
  const where: any = { projectId: project.id }
  if (status) where.status = status

  const items = await prisma().priceChange.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 50
  })

  const response = NextResponse.json({ items })
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
  return response
})
