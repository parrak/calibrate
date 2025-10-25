'use client'
import { useEffect, useMemo, useState } from 'react'
import { Button, EmptyState, StatusPill, useToast } from '@/lib/components'
import { SimpleTable as Table } from '@/lib/components/SimpleTable'
import { PriceChangeDrawer } from '@/components/PriceChangeDrawer'
import { priceChangesApi, ApiError } from '@/lib/api-client'

type Item = { id:string; status:string; currency:string; fromAmount:number; toAmount:number; createdAt:string; context?:any; source?:string; policyResult?:{ok:boolean; checks:any[]} }

const fmt = (c:string, v:number)=> `${c} ${(v/100).toFixed(2)}`

export default function ProjectPriceChanges({ params }: { params: { slug: string } }) {
  const [items,setItems] = useState<Item[]>([])
  const [status,setStatus] = useState<'PENDING'|'APPROVED'|'APPLIED'|'REJECTED'|'FAILED'|'ROLLED_BACK'|'ALL'>('PENDING')
  const [loading,setLoading] = useState(true)
  const [error,setError] = useState<string|null>(null)
  const [open,setOpen] = useState(false)
  const [active,setActive] = useState<Item|null>(null)
  const { Toast, setMsg } = useToast()

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await priceChangesApi.list(params.slug)
      const filtered = status === 'ALL' ? data : data.filter((i: Item) => i.status === status)
      setItems(filtered)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Failed to load price changes')
      }
      console.error('Failed to load price changes:', err)
    } finally {
      setLoading(false)
    }
  }
  useEffect(()=>{ load() },[status, params.slug])

  const rows = useMemo(()=>items.map(i=>{
    const deltaPct = ((i.toAmount - i.fromAmount)/Math.max(1,i.fromAmount))*100
    return { ...i, deltaPct }
  }),[items])

  async function act(id:string, op:'approve'|'apply'|'reject'|'rollback') {
    try {
      if (op === 'approve') await priceChangesApi.approve(id)
      else if (op === 'apply') await priceChangesApi.apply(id)
      else if (op === 'reject') await priceChangesApi.reject(id)

      setMsg(op==='apply'?'Applied':'OK')
      await load()
    } catch (err) {
      setMsg('Error: ' + (err instanceof ApiError ? err.message : 'Operation failed'))
    }
  }

  if (loading) return <div className="p-6">Loading…{Toast}</div>
  if (error) return <div className="p-6 text-red-600">Error: {error} {Toast}</div>
  if (!rows.length) return (
    <div className="p-6">
      <EmptyState title="No items here." desc="Send a signed webhook to create a price suggestion.">
        <pre className="text-xs bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto max-w-2xl text-left">
{`curl -X POST https://api.calibr.lat/api/v1/webhooks/price-suggestion \\
  -H "X-Calibr-Project: demo" \\
  -H "X-Calibr-Signature: t=$ts,v1=$sig" \\
  -H "Content-Type: application/json" \\
  -d '{
    "skuCode": "PRO-MONTHLY",
    "fromAmount": 4900,
    "toAmount": 5200,
    "currency": "USD",
    "source": "MANUAL"
  }'`}
        </pre>
      </EmptyState>
      {Toast}
    </div>
  )

  return (
    <main className="p-6 max-w-7xl mx-auto">
      {Toast}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Price Changes</h1>
        <div className="flex gap-2 flex-wrap">
          {(['PENDING','APPROVED','APPLIED','REJECTED','FAILED','ROLLED_BACK','ALL'] as const).map(s=>
            <button
              key={s}
              onClick={()=>setStatus(s)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                status===s
                  ?'bg-blue-600 text-white shadow-sm'
                  :'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {s}
            </button>
          )}
        </div>
      </div>

      <Table head={
        <tr className="text-left">
          <th className="px-4 py-3">SKU</th>
          <th className="px-4 py-3">From → To</th>
          <th className="px-4 py-3">%Δ</th>
          <th className="px-4 py-3">Source</th>
          <th className="px-4 py-3">Status</th>
          <th className="px-4 py-3"></th>
        </tr>
      }>
        {rows.map(i=>{
          const pct = i.deltaPct.toFixed(1)
          const pctColor = i.deltaPct >= 0 ? 'text-green-700 font-semibold' : 'text-red-700 font-semibold'
          return (
            <tr key={i.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 font-medium text-gray-900">{i.context?.skuCode ?? '—'}</td>
              <td className="px-4 py-3 text-gray-700">{fmt(i.currency, i.fromAmount)} → {fmt(i.currency, i.toAmount)}</td>
              <td className={`px-4 py-3 ${pctColor}`}>{pct}%</td>
              <td className="px-4 py-3 text-gray-600">{i.source ?? '—'}</td>
              <td className="px-4 py-3"><StatusPill status={i.status} /></td>
              <td className="px-4 py-3 text-right space-x-2">
                <Button variant="ghost" onClick={() => { setActive(i); setOpen(true) }}>View</Button>
                <Button variant="ghost" onClick={()=>act(i.id,'approve')}>Approve</Button>
                <Button onClick={()=>act(i.id,'apply')}>Apply</Button>
              </td>
            </tr>
          )
        })}
      </Table>

      <PriceChangeDrawer
        open={open}
        onClose={()=>setOpen(false)}
        item={active}
        onApprove={(id)=>act(id,'approve')}
        onApply={(id)=>act(id,'apply')}
        onReject={(id)=>act(id,'reject')}
        onRollback={(id)=>act(id,'rollback')}
      />
    </main>
  )
}
