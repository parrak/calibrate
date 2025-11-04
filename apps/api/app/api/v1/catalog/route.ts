import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@calibr/db'
import { withSecurity } from '@/lib/security-headers'

export const GET = withSecurity(async (req: NextRequest) => {
  const productCode = req.nextUrl.searchParams.get('productCode')
  const projectSlug = req.nextUrl.searchParams.get('project')

  if (!projectSlug) {
    return NextResponse.json({ error: 'project required' }, { status: 400 })
  }
  const project = await prisma().project.findUnique({ where: { slug: projectSlug } })
  if (!project) return NextResponse.json({ error: 'project not found' }, { status: 404 })

  // If productCode is provided, return single product
  if (productCode) {
    const product = await prisma().product.findFirst({
      where: { code: productCode, projectId: project.id },
      include: {
        Sku: {
          include: { Price: true }
        }
      }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const skus = product.Sku.map((s) => ({
      code: s.code,
      prices: s.Price.map((p) => ({
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

  // If no productCode, return all products for the project
  const products = await prisma().product.findMany({
    where: { projectId: project.id },
    include: {
      Sku: {
        include: { Price: true }
      }
    },
    orderBy: {
      createdAt: 'desc' // Most recently synced products first
    }
  })

  // Log for debugging
  console.log(`Catalog API: Found ${products.length} products for project ${projectSlug} (projectId: ${project.id})`)

  const productsWithSkus = products.map((product) => {
    const skus = product.Sku.map((s) => ({
      code: s.code,
      prices: s.Price.map((p) => ({
        currency: p.currency,
        amount: p.amount
      }))
    }))

    return {
      product: {
        code: product.code,
        name: product.name
      },
      skus
    }
  })

  return NextResponse.json({ products: productsWithSkus })
})

// Handle OPTIONS preflight requests
export const OPTIONS = withSecurity(async (_req: NextRequest) => {
  return new NextResponse(null, { status: 204 })
})
