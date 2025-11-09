'use client'
import { useCallback, useEffect, useState } from 'react'
import { EmptyState, Input, Button, Badge, Card, Skeleton } from '@/lib/components'
import { SimpleTable as Table } from '@/lib/components/SimpleTable'
import { catalogApi, ApiError } from '@/lib/api-client'
import { useToast } from '@/components/Toast'
import { Search, ChevronDown, ChevronRight, Filter } from 'lucide-react'

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

const fmt = (c: string, v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: c }).format(v / 100)

const ITEMS_PER_PAGE = 20

export default function ProjectCatalog({ params }: { params: { slug: string } }) {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [currencyFilter, setCurrencyFilter] = useState<string>('ALL')
  const [page, setPage] = useState(1)
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set())
  const toast = useToast()

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await catalogApi.listProducts(params.slug)
        const typedProducts = data as Product[]
        setProducts(typedProducts)
        setFilteredProducts(typedProducts)
      } catch (err) {
        const msg = err instanceof ApiError ? err.message : 'Failed to load catalog'
        setError(msg)
        toast.error(msg)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [params.slug, toast])

  // Extract unique currencies
  const currencies = useCallback(() => {
    const currencySet = new Set<string>()
    products.forEach((p) =>
      p.skus.forEach((sku) =>
        sku.prices.forEach((price) => currencySet.add(price.currency))
      )
    )
    return Array.from(currencySet).sort()
  }, [products])

  // Filter and search logic
  useEffect(() => {
    let result = products

    // Search by product name, code, or SKU code
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q) ||
          p.skus.some((sku) => sku.code.toLowerCase().includes(q))
      )
    }

    // Filter by currency
    if (currencyFilter !== 'ALL') {
      result = result.filter((p) =>
        p.skus.some((sku) =>
          sku.prices.some((price) => price.currency === currencyFilter)
        )
      )
    }

    setFilteredProducts(result)
    setPage(1) // Reset to first page when filters change
  }, [searchQuery, currencyFilter, products])

  const toggleProduct = (code: string) => {
    setExpandedProducts((prev) => {
      const next = new Set(prev)
      if (next.has(code)) {
        next.delete(code)
      } else {
        next.add(code)
      }
      return next
    })
  }

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE)
  const paginatedProducts = filteredProducts.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  )

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error) return <div className="p-6 text-red-600">Error: {error}</div>

  if (!products || products.length === 0) {
    return (
      <div className="p-6">
        <EmptyState title="No products found" desc="No products are available in this project." />
      </div>
    )
  }

  return (
    <main className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Product Catalog</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filteredProducts.length} of {products.length} products
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Search */}
          <div className="flex-1 min-w-[300px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by product name, code, or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Currency Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={currencyFilter}
              onChange={(e) => setCurrencyFilter(e.target.value)}
              className="px-3 py-2 border border-border rounded-md bg-surface text-sm"
            >
              <option value="ALL">All Currencies</option>
              {currencies().map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          {(searchQuery || currencyFilter !== 'ALL') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery('')
                setCurrencyFilter('ALL')
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      </Card>

      {/* Products List */}
      {filteredProducts.length === 0 ? (
        <EmptyState
          title="No matches found"
          desc="Try adjusting your search or filters."
        />
      ) : (
        <>
          <div className="space-y-4">
            {paginatedProducts.map((product) => {
              const isExpanded = expandedProducts.has(product.code)
              const totalSkus = product.skus.length
              const totalPrices = product.skus.reduce(
                (sum, sku) => sum + sku.prices.length,
                0
              )

              return (
                <Card key={product.code} className="overflow-hidden">
                  {/* Product Header */}
                  <button
                    onClick={() => toggleProduct(product.code)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-surface/60 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      )}
                      <div className="text-left">
                        <h3 className="font-semibold">{product.name}</h3>
                        <p className="text-sm text-gray-500">{product.code}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">
                        {totalSkus} SKU{totalSkus !== 1 ? 's' : ''}
                      </Badge>
                      <Badge variant="secondary">
                        {totalPrices} Price{totalPrices !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </button>

                  {/* Product Details */}
                  {isExpanded && (
                    <div className="border-t border-border">
                      <Table
                        head={
                          <tr className="text-left bg-gray-50">
                            <th className="px-4 py-3 font-medium">SKU Code</th>
                            <th className="px-4 py-3 font-medium">Currency</th>
                            <th className="px-4 py-3 font-medium">Price</th>
                            <th className="px-4 py-3 font-medium">Status</th>
                          </tr>
                        }
                      >
                        {product.skus.map((sku) =>
                          sku.prices
                            .filter(
                              (price) =>
                                currencyFilter === 'ALL' ||
                                price.currency === currencyFilter
                            )
                            .map((price, idx) => (
                              <tr
                                key={`${sku.code}-${price.currency}-${idx}`}
                                className="border-t border-border hover:bg-surface/40"
                              >
                                <td className="px-4 py-3 font-mono text-sm">
                                  {sku.code}
                                </td>
                                <td className="px-4 py-3">{price.currency}</td>
                                <td className="px-4 py-3 font-semibold">
                                  {fmt(price.currency, price.amount)}
                                </td>
                                <td className="px-4 py-3">
                                  <Badge variant="success">Active</Badge>
                                </td>
                              </tr>
                            ))
                        )}
                      </Table>
                    </div>
                  )}
                </Card>
              )
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </main>
  )
}

