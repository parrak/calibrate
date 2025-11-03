"use client";
import { useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'

export default function AmazonCompetitivePage() {
  const { data: session } = useSession()

  const [asinInput, setAsinInput] = useState('')
  const [singleAsin, setSingleAsin] = useState('')
  const [history, setHistory] = useState<Array<{ id: string; retrievedAt: string; lowestPriceCents: number | null; buyBoxPriceCents: number | null; offerCount: number }>>([])
  const [trackResult, setTrackResult] = useState<{ results?: Array<{ asin: string; ok: boolean; error?: string }> } | null>(null)
  const [latest, setLatest] = useState<Record<string, unknown> | null>(null)
  const [recent, setRecent] = useState<Array<{ id: string; asin: string; lowestPriceCents: number | null; buyBoxPriceCents: number | null; offerCount: number }>>([])
  const [recentPage, setRecentPage] = useState(1)
  const [recentHasMore, setRecentHasMore] = useState(false)
  const [recentQuery, setRecentQuery] = useState('')
  const [cardView, setCardView] = useState(false)
  const [loading, setLoading] = useState(false)
  const [watchlist, setWatchlist] = useState<Array<{ id: string; asin: string }>>([])

  const base = process.env.NEXT_PUBLIC_API_BASE || 'https://api.calibr.lat'
  const token = (session as { apiToken?: string })?.apiToken

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
      const params = new URLSearchParams()
      params.set('limit', '20')
      params.set('page', String(recentPage))
      if (recentQuery) params.set('q', recentQuery)
      const res = await fetch(`${base}/api/platforms/amazon/competitive/recent?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        cache: 'no-store',
      })
      const data = await res.json()
      setRecent(Array.isArray(data?.items) ? data.items : [])
      setRecentHasMore(Boolean(data?.hasMore))
    } finally {
      setLoading(false)
    }
  }

  async function loadWatchlist() {
    try {
      const res = await fetch(`${base}/api/platforms/amazon/watchlist?limit=50`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        cache: 'no-store',
      })
      const data = await res.json() as { items?: Array<{ id: string; asin: string }> }
      setWatchlist(Array.isArray(data?.items) ? data.items : [])
    } catch (error) {
      console.error('Failed to load watchlist:', error)
    }
  }

  // Load recent on mount and when filters change (debounced)
  useEffect(() => {
    const t = setTimeout(() => {
      void loadRecent()
    }, 250)
    return () => clearTimeout(t)
  }, [recentPage, recentQuery, token])

  useEffect(() => { loadWatchlist() }, [token])

  return (
    <div className="max-w-3xl p-6 space-y-6">
      <h1 className="text-xl font-semibold">Amazon Competitive Pricing</h1>

      <section className="space-y-3">
        <h2 className="font-medium">Track Batch</h2>
        <BatchInput value={asinInput} onChange={setAsinInput} />
        <button onClick={trackBatch} disabled={loading} className="bg-blue-600 text-white px-3 py-1 rounded disabled:opacity-50">
          {loading ? 'Working...' : 'Track Now'}
        </button>
        {trackResult && (
          <div className="flex flex-wrap gap-2 mt-2">
            {(trackResult.results || []).map((r: { asin: string; ok: boolean; error?: string }) => (
              <span key={r.asin} className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${r.ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {r.asin}{!r.ok && `: ${r.error || 'error'}`}
              </span>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-medium">Recent ASINs</h2>
          <div className="flex items-center gap-2">
            <input
              value={recentQuery}
              onChange={(e) => { setRecentPage(1); setRecentQuery(e.target.value) }}
              placeholder="Search ASIN"
              className="border px-2 py-1 text-sm"
            />
            <button
              className={`text-sm px-2 py-1 rounded border ${cardView ? 'bg-gray-900 text-white' : ''}`}
              onClick={() => setCardView(!cardView)}
            >{cardView ? 'Table' : 'Cards'}</button>
          </div>
        </div>
        {!cardView ? (
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
            {recent.map((row: { id: string; asin: string; lowestPriceCents: number | null; buyBoxPriceCents: number | null; offerCount: number }) => (
              <tr key={row.id} className="border-t">
                  <td className="px-3 py-2 font-mono">{row.asin}</td>
                  <td className="px-3 py-2">{row.lowestPriceCents != null ? `$ ${(row.lowestPriceCents/100).toFixed(2)}` : '-'}</td>
                  <td className="px-3 py-2">{row.buyBoxPriceCents != null ? `$ ${(row.buyBoxPriceCents/100).toFixed(2)}` : '-'}</td>
                  <td className="px-3 py-2">{row.offerCount}</td>
                  <td className="px-3 py-2">
                    <Sparkline asin={row.asin} base={base} token={token} />
                  </td>
                  <td className="px-3 py-2 text-right space-x-2">
                    <WatchToggle
                      asin={row.asin}
                      base={base}
                      token={token}
                      watched={watchlist.some(w => w.asin === row.asin)}
                      onChanged={loadWatchlist}
                    />
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
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recent.map((row: { id: string; asin: string; lowestPriceCents: number | null; buyBoxPriceCents: number | null; offerCount: number }) => (
              <div key={row.id} className="border rounded p-3 bg-white">
                <div className="flex items-center justify-between">
                  <div className="font-mono text-sm">{row.asin}</div>
                  <TrendBadge asin={row.asin} base={base} token={token} />
                </div>
                <div className="mt-2 text-sm text-gray-700">
                  <div>Buy Box: {row.buyBoxPriceCents != null ? `$ ${(row.buyBoxPriceCents/100).toFixed(2)}` : '-'}</div>
                  <div>Lowest: {row.lowestPriceCents != null ? `$ ${(row.lowestPriceCents/100).toFixed(2)}` : '-'}</div>
                  <div>Offers: {row.offerCount}</div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <Sparkline asin={row.asin} base={base} token={token} />
                  <button
                    className="bg-blue-600 text-white px-2 py-1 rounded text-sm"
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
                </div>
              </div>
            ))}
            {recent.length === 0 && (
              <div className="text-gray-500">No data yet</div>
            )}
          </div>
        )}
        <div className="flex items-center justify-between mt-2">
          <button disabled={recentPage<=1} onClick={() => setRecentPage(p => Math.max(1, p-1))} className="px-2 py-1 border rounded disabled:opacity-50">Prev</button>
          <div className="text-xs text-gray-600">Page {recentPage}</div>
          <button disabled={!recentHasMore} onClick={() => setRecentPage(p => p+1)} className="px-2 py-1 border rounded disabled:opacity-50">Next</button>
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
                  {history.map((row: { id: string; retrievedAt: string; lowestPriceCents: number | null; buyBoxPriceCents: number | null; offerCount: number }) => (
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

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Watchlist</h2>
          <button
            onClick={async () => {
              await fetch(`${base}/api/platforms/amazon/competitive/cron/watchlist`, {
                method: 'POST',
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
              })
              await loadRecent(); await loadWatchlist()
            }}
            className="bg-gray-900 text-white px-3 py-1 rounded"
          >Run Now</button>
        </div>
        <div className="overflow-auto border rounded">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left">ASIN</th>
                <th className="px-3 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {watchlist.map((w: { id: string; asin: string }) => (
                <tr key={w.id} className="border-t">
                  <td className="px-3 py-2 font-mono">{w.asin}</td>
                  <td className="px-3 py-2 flex gap-2">
                    <WatchToggle asin={w.asin} base={base} token={token} watched onChanged={loadWatchlist} />
                    <button className="px-2 py-1 border rounded" onClick={async () => {
                      await fetch(`${base}/api/platforms/amazon/competitive`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                        body: JSON.stringify({ asin: w.asin })
                      })
                      await loadRecent()
                    }}>Track Now</button>
                  </td>
                </tr>
              ))}
              {watchlist.length === 0 && (
                <tr><td className="px-3 py-2 text-gray-500" colSpan={2}>Nothing here yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function Sparkline({ asin, base, token }: { asin: string; base: string; token?: string }) {
  const [points, setPoints] = useState<number[]>([])

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${base}/api/platforms/amazon/competitive?asin=${encodeURIComponent(asin)}&limit=10`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          cache: 'no-store'
        })
        const data = await res.json()
        const items = Array.isArray(data?.items) ? data.items : []
        const arr = items
          .map((r: { lowestPriceCents?: number | null; buyBoxPriceCents?: number | null }) => r.lowestPriceCents ?? r.buyBoxPriceCents)
          .filter((n): n is number => typeof n === 'number')
          .reverse() // oldest to newest
        setPoints(arr)
      } catch (error) {
        console.error('Failed to fetch sparkline data:', error)
      }
    })()
  }, [asin, base, token])

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

function TrendBadge({ asin, base, token }: { asin: string; base: string; token?: string }) {
  const [dir, setDir] = useState<'up'|'down'|'flat'>('flat')
  const color = dir === 'up' ? 'text-red-600' : dir === 'down' ? 'text-green-600' : 'text-gray-500'

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${base}/api/platforms/amazon/competitive?asin=${encodeURIComponent(asin)}&limit=2`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          cache: 'no-store'
        })
        const data = await res.json()
        const items = Array.isArray(data?.items) ? data.items : []
        if (items.length >= 2) {
          const a = items[0].lowestPriceCents ?? items[0].buyBoxPriceCents
          const b = items[1].lowestPriceCents ?? items[1].buyBoxPriceCents
          if (a != null && b != null) setDir(b > a ? 'up' : b < a ? 'down' : 'flat')
        }
      } catch (error) {
        console.error('Failed to fetch trend badge data:', error)
      }
    })()
  }, [asin, base, token])

  return <span className={`text-xs ${color}`}>{dir === 'up' ? '↑' : dir === 'down' ? '↓' : '→'}</span>
}

function BatchInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [local, setLocal] = useState(value)
  useEffect(() => setLocal(value), [value])

  // Debounce propagate
  useEffect(() => {
    const t = setTimeout(() => onChange(local), 300)
    return () => clearTimeout(t)
  }, [local, onChange])

  const chips = useMemo(() => local.split(/\s+/).map(s => s.trim()).filter(Boolean).slice(0, 100), [local])

  return (
    <div>
      <textarea
        className="border w-full p-2 h-28"
        placeholder="Enter ASINs, one per line"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
      />
      <div className="mt-2 flex flex-wrap gap-1">
        {chips.map(c => (
          <span key={c} className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs font-mono">{c}</span>
        ))}
        {chips.length === 0 && <span className="text-xs text-gray-500">No ASINs parsed</span>}
      </div>
    </div>
  )
}

function WatchToggle({ asin, base, token, watched, onChanged, small }: { asin: string; base: string; token?: string; watched?: boolean; onChanged?: () => void; small?: boolean }) {
  const [busy, setBusy] = useState(false)
  const add = async () => {
    setBusy(true)
    try {
      await fetch(`${base}/api/platforms/amazon/watchlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ asin })
      })
      onChanged?.()
    } finally { setBusy(false) }
  }
  const remove = async () => {
    setBusy(true)
    try {
      const params = new URLSearchParams({ asin })
      await fetch(`${base}/api/platforms/amazon/watchlist?${params.toString()}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      onChanged?.()
    } finally { setBusy(false) }
  }
  return watched ? (
    <button onClick={remove} disabled={busy} className={`${small ? 'px-2 py-1 text-xs' : 'px-3 py-1'} border rounded text-red-600 border-red-300`}>
      {busy ? '...' : 'Unwatch'}
    </button>
  ) : (
    <button onClick={add} disabled={busy} className={`${small ? 'px-2 py-1 text-xs' : 'px-3 py-1'} border rounded text-gray-700`}>
      {busy ? '...' : 'Watch'}
    </button>
  )
}
