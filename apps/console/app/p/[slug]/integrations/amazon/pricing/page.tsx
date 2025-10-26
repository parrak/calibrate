"use client";
import { useState } from 'react'
import { useParams } from 'next/navigation'

export default function AmazonPricingPage() {
  const params = useParams() as { slug: string }
  const [sku, setSku] = useState('')
  const [price, setPrice] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [result, setResult] = useState<any>(null)
  const [status, setStatus] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/platforms/amazon/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project: params.slug, sku, price: Number(price), currency, submit: true, poll: false }),
      })
      const data = await res.json()
      setResult(data)
      setStatus(null)
    } finally {
      setLoading(false)
    }
  }

  async function poll() {
    const feedId = result?.result?.channelResult?.feedId
    if (!feedId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/platforms/amazon/pricing/status?feed=${encodeURIComponent(feedId)}&parse=true`)
      const data = await res.json()
      setStatus(data)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl p-6">
      <h1 className="text-xl font-semibold mb-4">Amazon Pricing Feed</h1>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="block text-sm">SKU</label>
          <input className="border px-2 py-1 w-full" value={sku} onChange={e => setSku(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm">Price</label>
          <input type="number" step="0.01" className="border px-2 py-1 w-full" value={price} onChange={e => setPrice(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm">Currency</label>
          <input className="border px-2 py-1 w-full" value={currency} onChange={e => setCurrency(e.target.value)} />
        </div>
        <button disabled={loading} className="bg-blue-600 text-white px-3 py-1 rounded disabled:opacity-50">{loading ? 'Working...' : 'Submit Feed'}</button>
      </form>

      {result && (
        <div className="mt-6">
          <h2 className="font-medium">Submission</h2>
          <pre className="text-xs bg-gray-100 p-2 overflow-auto">{JSON.stringify(result, null, 2)}</pre>
          <button onClick={poll} className="mt-2 bg-gray-700 text-white px-3 py-1 rounded">Poll Status</button>
        </div>
      )}

      {status && (
        <div className="mt-6">
          <h2 className="font-medium">Status</h2>
          <pre className="text-xs bg-gray-100 p-2 overflow-auto">{JSON.stringify(status, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}

