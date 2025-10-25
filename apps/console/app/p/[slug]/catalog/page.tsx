'use client'
import { useEffect, useState } from 'react'
import { EmptyState } from '@/lib/components'
import { SimpleTable as Table } from '@/lib/components/SimpleTable'

type Product = {
  code: string
  name: string
  skus: Array<{
    code: string
    prices: Array<{
      currency: string
      amount: number
    }>
  }>
}

const api = process.env.NEXT_PUBLIC_API_BASE
const fmt = (c: string, v: number) => `${c} ${(v/100).toFixed(2)}`

export default function ProjectCatalog({ params }: { params: { slug: string } }) {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`${api}/api/v1/catalog?project=${params.slug}&productCode=PRO`, { 
          cache: 'no-store' 
        })
        const json = await res.json()
        setProduct(json)
      } catch (error) {
        console.error('Failed to load catalog:', error)
      }
      setLoading(false)
    }
    load()
  }, [params.slug])

  if (loading) return <div className="p-6">Loading…</div>

  if (!product) {
    return (
      <div className="p-6">
        <EmptyState 
          title="No products found" 
          desc="No products are available in this project."
        />
      </div>
    )
  }

  return (
    <main className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-2">{product.name}</h1>
        <p className="text-gray-600">Product Code: {product.code}</p>
      </div>

      <div className="bg-white rounded-lg shadow">
        <Table head={
          <tr className="text-left">
            <th className="px-4 py-3">SKU Code</th>
            <th className="px-4 py-3">Currency</th>
            <th className="px-4 py-3">Amount</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        }>
          {product.skus.map((sku) => 
            sku.prices.map((price, index) => (
              <tr key={`${sku.code}-${price.currency}`} className="border-t border-border hover:bg-surface/60">
                <td className="px-4 py-3">{sku.code}</td>
                <td className="px-4 py-3">{price.currency}</td>
                <td className="px-4 py-3">{fmt(price.currency, price.amount)}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                </td>
              </tr>
            ))
          )}
        </Table>
      </div>
    </main>
  )
}
