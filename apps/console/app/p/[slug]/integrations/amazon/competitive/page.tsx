"use client";
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useParams } from 'next/navigation'

export default function AmazonCompetitivePage() {
  const params = useParams() as { slug: string }
  const { data: session } = useSession()

  const [asinInput, setAsinInput] = useState('')
  const [singleAsin, setSingleAsin] = useState('')
  const [history, setHistory] = useState<any[]>([])
  const [trackResult, setTrackResult] = useState<any>(null)
  const [latest, setLatest] = useState<any>(null)
  const [recent, setRecent] = useState<any[]>([])
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
      setHistory(Array.isArray(data?.items) ? data.items : [])
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

  async function loadRecent() {
    setLoading(true)
    try {
      const res = await fetch(`${base}/api/platforms/amazon/competitive/recent?limit=20`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        cache: 'no-store',
      })
      const data = await res.json()
      setRecent(Array.isArray(data?.items) ? data.items : [])
    } finally {
      setLoading(false)
    }
  }

  // Load recent on first render
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useState(() => { loadRecent() })

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
        <h2 className="font-medium">Recent ASINs</h2>
        <div className="overflow-auto border rounded">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left">ASIN</th>
                <th className="px-3 py-2 text-left">Lowest</th>
                <th className="px-3 py-2 text-left">Buy Box</th>
                <th className="px-3 py-2 text-left">Offers</th>
                <th className="px-3 py-2 text-left">Trend</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {recent.map((row: any) => (
                <tr key={row.id} className="border-t">
                  <td className="px-3 py-2 font-mono">{row.asin}</td>
                  <td className="px-3 py-2">{row.lowestPriceCents != null ? `$ ${(row.lowestPriceCents/100).toFixed(2)}` : '-'}</td>
                  <td className="px-3 py-2">{row.buyBoxPriceCents != null ? `$ ${(row.buyBoxPriceCents/100).toFixed(2)}` : '-'}</td>
                  <td className="px-3 py-2">{row.offerCount}</td>
                  <td className="px-3 py-2">
                    <Sparkline asin={row.asin} base={base} token={token} />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      className="bg-blue-600 text-white px-2 py-1 rounded"
                      onClick={async () => {
                        setSingleAsin(row.asin)
                        setLoading(true)
                        try {
                          await fetch(`${base}/api/platforms/amazon/competitive`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              ...(token ? { Authorization: `Bearer ${token}` } : {}),
                            },
                            body: JSON.stringify({ asin: row.asin })
                          })
                          await loadRecent()
                          await fetchHistory()
                        } finally {
                          setLoading(false)
                        }
                      }}
                    >Track Now</button>
                  </td>
                </tr>
              ))}
              {recent.length === 0 && (
                <tr><td className="px-3 py-2 text-gray-500" colSpan={6}>No data yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-medium">Inspect Single ASIN</h2>
        <div className="flex gap-2">
          <input className="border px-2 py-1 flex-1" placeholder="ASIN" value={singleAsin} onChange={(e) => setSingleAsin(e.target.value)} />
          <button onClick={fetchHistory} className="bg-gray-700 text-white px-3 py-1 rounded">History</button>
          <button onClick={fetchLatest} className="bg-green-700 text-white px-3 py-1 rounded">Latest</button>
          <button
            onClick={async () => {
              if (!singleAsin) return
              setLoading(true)
              try {
                await fetch(`${base}/api/platforms/amazon/competitive`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                  },
                  body: JSON.stringify({ asin: singleAsin })
                })
                await fetchHistory()
              } finally {
                setLoading(false)
              }
            }}
            className="bg-blue-700 text-white px-3 py-1 rounded"
          >
            Track Now
          </button>
        </div>
        {latest && (
          <div>
            <h3 className="font-medium">Latest Snapshot</h3>
            <pre className="text-xs bg-gray-100 p-2 overflow-auto">{JSON.stringify(latest, null, 2)}</pre>
          </div>
        )}
        {history && history.length > 0 && (
          <div>
            <h3 className="font-medium mb-2">History</h3>
            <div className="overflow-auto border rounded">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left">Retrieved</th>
                    <th className="px-3 py-2 text-left">Lowest</th>
                    <th className="px-3 py-2 text-left">Buy Box</th>
                    <th className="px-3 py-2 text-left">Offers</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((row: any) => (
                    <tr key={row.id} className="border-t">
                      <td className="px-3 py-2">{new Date(row.retrievedAt).toLocaleString()}</td>
                      <td className="px-3 py-2">{row.lowestPriceCents != null ? `$ ${(row.lowestPriceCents/100).toFixed(2)}` : '-'}</td>
                      <td className="px-3 py-2">{row.buyBoxPriceCents != null ? `$ ${(row.buyBoxPriceCents/100).toFixed(2)}` : '-'}</td>
                      <td className="px-3 py-2">{row.offerCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

function Sparkline({ asin, base, token }: { asin: string; base: string; token?: string }) {
  const [points, setPoints] = useState<number[]>([])

  useState(() => {
    ;(async () => {
      try {
        const res = await fetch(`${base}/api/platforms/amazon/competitive?asin=${encodeURIComponent(asin)}&limit=10`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          cache: 'no-store'
        })
        const data = await res.json()
        const items = Array.isArray(data?.items) ? data.items : []
        const arr = items
          .map((r: any) => r.lowestPriceCents ?? r.buyBoxPriceCents)
          .filter((n: any) => typeof n === 'number')
          .reverse() // oldest to newest
        setPoints(arr)
      } catch {}
    })()
  })

  if (!points.length) return <span className="text-xs text-gray-400">—</span>

  const w = 80, h = 24, pad = 2
  const min = Math.min(...points), max = Math.max(...points)
  const range = Math.max(1, max - min)
  const step = (w - pad * 2) / Math.max(1, points.length - 1)
  const path = points
    .map((v, i) => {
      const x = pad + i * step
      const y = h - pad - ((v - min) / range) * (h - pad * 2)
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="text-blue-600">
      <path d={path} fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}
