'use client'
import { useEffect, useState } from 'react'
import { EmptyState } from '@/lib/components'
import { SimpleTable as Table } from '@/lib/components/SimpleTable'
import { catalogApi, ApiError } from '@/lib/api-client'
import { useToast } from '@/components/Toast'

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

const fmt = (c: string, v: number) => `${c} ${(v / 100).toFixed(2)}`

export default function ProjectCatalog({ params }: { params: { slug: string } }) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const toast = useToast()

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        // Note: API may not support listing; this will evolve.
        const data = await catalogApi.listProducts(params.slug)
        setProducts(data)
      } catch (err) {
        const msg = err instanceof ApiError ? err.message : 'Failed to load catalog'
        setError(msg)
        toast.error(msg)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [params.slug])

  if (loading)
    return (
      <div className="p-6 space-y-3">
        <div className="h-6 w-48 bg-gray-200 animate-pulse rounded" />
        <div className="h-32 w-full bg-gray-100 animate-pulse rounded" />
      </div>
    )
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>

  if (!products || products.length === 0) {
    return (
      <div className="p-6">
        <EmptyState title="No products found" desc="No products are available in this project." />
      </div>
    )
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-6">Catalog</h1>

      {products.map((product) => (
        <div key={product.code} className="mb-8">
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-1">{product.name}</h2>
            <p className="text-gray-600">Product Code: {product.code}</p>
          </div>

          <div className="bg-white rounded-lg shadow">
            <Table
              head={
                <tr className="text-left">
                  <th className="px-4 py-3">SKU Code</th>
                  <th className="px-4 py-3">Currency</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              }
            >
              {product.skus.map((sku) =>
                sku.prices.map((price) => (
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
        </div>
      ))}
    </main>
  )
}

