import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@calibr/db'

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get('status') ?? undefined
  const projectSlug = req.nextUrl.searchParams.get('project')
  if (!projectSlug) return NextResponse.json({ error: 'project required' }, { status: 400 })
  const project = await prisma.project.findUnique({ where: { slug: projectSlug } })
  if (!project) return NextResponse.json({ error: 'project not found' }, { status: 404 })
  const where: any = { projectId: project.id }
  if (status) where.status = status
  
  const items = await prisma.priceChange.findMany({ 
    where, 
    orderBy: { createdAt: 'desc' }, 
    take: 50 
  })
  
  return NextResponse.json({ items })
}
