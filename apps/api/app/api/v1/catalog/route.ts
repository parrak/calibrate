import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@calibr/db'

export async function GET(req: NextRequest) {
  const productCode = req.nextUrl.searchParams.get('productCode')
  const projectSlug = req.nextUrl.searchParams.get('project')
  if (!productCode) {
    return NextResponse.json({ error: 'productCode required' }, { status: 400 })
  }
  if (!projectSlug) {
    return NextResponse.json({ error: 'project required' }, { status: 400 })
  }
  const project = await prisma().project.findUnique({ where: { slug: projectSlug } })
  if (!project) return NextResponse.json({ error: 'project not found' }, { status: 404 })

  const product = await prisma().product.findFirst({ 
    where: { code: productCode, projectId: project.id }, 
    include: { 
      skus: { 
        include: { prices: true } 
      } 
    } 
  })

  if (!product) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const skus = product.skus.map((s: any) => ({ 
    code: s.code, 
    prices: s.prices.map((p: any) => ({ 
      currency: p.currency, 
      amount: p.amount 
    })) 
  }))

  return NextResponse.json({ 
    product: { 
      code: product.code, 
      name: product.name 
    }, 
    skus 
  })
}
