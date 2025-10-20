'use client'
import { useEffect, useState } from 'react'

type Item = { 
  id: string
  status: string
  currency: string
  fromAmount: number
  toAmount: number
  createdAt: string
  context?: any
  source?: string
}

export default function PriceChanges() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000'
      const res = await fetch(`${apiBase}/api/v1/price-changes?status=PENDING`, { 
        cache: 'no-store' 
      })
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      }
      
      const json = await res.json()
      setItems(json.items ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
      console.error('Load error:', err)
    } finally {
      setLoading(false)
    }
  }

  async function act(id: string, action: 'approve' | 'apply' | 'reject') {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000'
      const res = await fetch(`${apiBase}/api/v1/price-changes/${id}/${action}`, { 
        method: 'POST' 
      })
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      }
      
      await load() // Reload the list
    } catch (err) {
      console.error('Action error:', err)
      alert(`Failed to ${action} price change: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  useEffect(() => { 
    load() 
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-600">Loading price changes...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-red-800 font-medium">Error loading data</h3>
        <p className="text-red-600 text-sm mt-1">{error}</p>
        <button 
          onClick={load}
          className="mt-2 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Price Changes (Pending)</h1>
        <button 
          onClick={load}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {items.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-600">No pending price changes</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-900">ID</th>
                <th className="px-4 py-3 text-left font-medium text-gray-900">From → To</th>
                <th className="px-4 py-3 text-left font-medium text-gray-900">Currency</th>
                <th className="px-4 py-3 text-left font-medium text-gray-900">Δ%</th>
                <th className="px-4 py-3 text-left font-medium text-gray-900">Source</th>
                <th className="px-4 py-3 text-left font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.map(i => {
                const delta = ((i.toAmount - i.fromAmount) / i.fromAmount * 100).toFixed(1)
                const isIncrease = i.toAmount > i.fromAmount
                
                return (
                  <tr key={i.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">
                      {i.id.slice(-8)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium">
                        ${(i.fromAmount / 100).toFixed(2)} → ${(i.toAmount / 100).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{i.currency}</td>
                    <td className="px-4 py-3">
                      <span className={`font-medium ${isIncrease ? 'text-green-600' : 'text-red-600'}`}>
                        {isIncrease ? '+' : ''}{delta}%
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {i.source || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => act(i.id, 'approve')} 
                          className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                        >
                          Approve
                        </button>
                        <button 
                          onClick={() => act(i.id, 'apply')} 
                          className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
                        >
                          Apply
                        </button>
                        <button 
                          onClick={() => act(i.id, 'reject')} 
                          className="px-3 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700 transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
