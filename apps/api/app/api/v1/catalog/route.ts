import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@calibr/db'

export async function GET(req: NextRequest) {
  const productCode = req.nextUrl.searchParams.get('productCode')
  if (!productCode) {
    return NextResponse.json({ error: 'productCode required' }, { status: 400 })
  }

  const product = await prisma.product.findFirst({ 
    where: { code: productCode }, 
    include: { 
      skus: { 
        include: { prices: true } 
      } 
    } 
  })

  if (!product) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const skus = product.skus.map(s => ({ 
    code: s.code, 
    prices: s.prices.map(p => ({ 
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
