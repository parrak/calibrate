"use client";
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useParams } from 'next/navigation'

export default function AmazonCompetitivePage() {
  const params = useParams() as { slug: string }
  const { data: session } = useSession()

  const [asinInput, setAsinInput] = useState('')
  const [singleAsin, setSingleAsin] = useState('')
  const [history, setHistory] = useState<any>(null)
  const [trackResult, setTrackResult] = useState<any>(null)
  const [latest, setLatest] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const base = process.env.NEXT_PUBLIC_API_BASE || 'https://api.calibr.lat'
  const token = (session as any)?.apiToken as string | undefined

  async function trackBatch() {
    const asins = asinInput.split(/\s+/).map(s => s.trim()).filter(Boolean)
    if (!asins.length) return
    setLoading(true)
    setTrackResult(null)
    try {
      const res = await fetch(`${base}/api/platforms/amazon/competitive/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ asins })
      })
      const data = await res.json()
      setTrackResult(data)
    } finally {
      setLoading(false)
    }
  }

  async function fetchHistory() {
    if (!singleAsin) return
    setLoading(true)
    try {
      const res = await fetch(`${base}/api/platforms/amazon/competitive?asin=${encodeURIComponent(singleAsin)}&limit=20`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      })
      const data = await res.json()
      setHistory(data)
    } finally {
      setLoading(false)
    }
  }

  async function fetchLatest() {
    if (!singleAsin) return
    setLoading(true)
    try {
      const res = await fetch(`${base}/api/platforms/amazon/competitive/${encodeURIComponent(singleAsin)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      })
      const data = await res.json()
      setLatest(data)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl p-6 space-y-6">
      <h1 className="text-xl font-semibold">Amazon Competitive Pricing</h1>

      <section className="space-y-3">
        <h2 className="font-medium">Track Batch</h2>
        <textarea
          className="border w-full p-2 h-32"
          placeholder="Enter ASINs, one per line"
          value={asinInput}
          onChange={(e) => setAsinInput(e.target.value)}
        />
        <button onClick={trackBatch} disabled={loading} className="bg-blue-600 text-white px-3 py-1 rounded disabled:opacity-50">
          {loading ? 'Working...' : 'Track Now'}
        </button>
        {trackResult && (
          <pre className="text-xs bg-gray-100 p-2 overflow-auto">{JSON.stringify(trackResult, null, 2)}</pre>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-medium">Inspect Single ASIN</h2>
        <div className="flex gap-2">
          <input className="border px-2 py-1 flex-1" placeholder="ASIN" value={singleAsin} onChange={(e) => setSingleAsin(e.target.value)} />
          <button onClick={fetchHistory} className="bg-gray-700 text-white px-3 py-1 rounded">History</button>
          <button onClick={fetchLatest} className="bg-green-700 text-white px-3 py-1 rounded">Latest</button>
        </div>
        {latest && (
          <div>
            <h3 className="font-medium">Latest Snapshot</h3>
            <pre className="text-xs bg-gray-100 p-2 overflow-auto">{JSON.stringify(latest, null, 2)}</pre>
          </div>
        )}
        {history && (
          <div>
            <h3 className="font-medium">History</h3>
            <pre className="text-xs bg-gray-100 p-2 overflow-auto">{JSON.stringify(history, null, 2)}</pre>
          </div>
        )}
      </section>
    </div>
  )
}

