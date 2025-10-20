'use client'
import { useEffect, useMemo, useState } from 'react'
import { Button, EmptyState, StatusPill, Table, useToast } from '@/lib/components'
import { PriceChangeDrawer } from '@/components/PriceChangeDrawer'

type Item = { id:string; status:string; currency:string; fromAmount:number; toAmount:number; createdAt:string; context?:any; source?:string; policyResult?:{ok:boolean; checks:any[]} }

const api = process.env.NEXT_PUBLIC_API_BASE
const fmt = (c:string, v:number)=> `${c} ${(v/100).toFixed(2)}`

export default function ProjectPriceChanges({ params }: { params: { slug: string } }) {
  const [items,setItems] = useState<Item[]>([])
  const [status,setStatus] = useState<'PENDING'|'APPROVED'|'APPLIED'|'REJECTED'|'FAILED'|'ROLLED_BACK'|'ALL'>('PENDING')
  const [loading,setLoading] = useState(true)
  const [open,setOpen] = useState(false)
  const [active,setActive] = useState<Item|null>(null)
  const { Toast, setMsg } = useToast()

  async function load() {
    setLoading(true)
    const qs = status==='ALL' ? '' : `?status=${status}`
    const res = await fetch(`${api}/api/v1/price-changes?project=${params.slug}${qs}`, { cache:'no-store' })
    const json = await res.json(); setItems(json.items ?? []); setLoading(false)
  }
  useEffect(()=>{ load() },[status, params.slug])

  const rows = useMemo(()=>items.map(i=>{
    const deltaPct = ((i.toAmount - i.fromAmount)/Math.max(1,i.fromAmount))*100
    return { ...i, deltaPct }
  }),[items])

  async function act(id:string, op:'approve'|'apply'|'reject'|'rollback') {
    const r = await fetch(`${api}/api/v1/price-changes/${id}/${op}`, { 
      method:'POST',
      headers: { 'X-Calibr-Project': params.slug }
    })
    if (r.ok) { setMsg(op==='apply'?'Applied':'OK'); await load() }
  }

  if (loading) return <div className="p-6">Loading…{Toast}</div>
  if (!rows.length) return (
    <div className="p-6">
      <EmptyState title="No items here." desc="Send a signed webhook to create a price suggestion.">
        <pre className="text-xs">curl -X POST https://api.calibr.lat/api/v1/webhooks/price-suggestion \
  -H "X-Calibr-Project: {params.slug}" \
  -H "X-Calibr-Signature: t=$ts,v1=$sig" ...</pre>
      </EmptyState>
      {Toast}
    </div>
  )

  return (
    <main className="p-6">
      {Toast}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Price Changes</h1>
        <div className="flex gap-2">
          {(['PENDING','APPROVED','APPLIED','REJECTED','FAILED','ROLLED_BACK','ALL'] as const).map(s=>
            <button key={s} onClick={()=>setStatus(s)} className={`px-2 py-1 rounded ${status===s?'bg-border':'text-mute hover:text-fg'}`}>{s}</button>
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
          const pctColor = i.deltaPct >= 0 ? 'text-emerald-300' : 'text-red-300'
          return (
            <tr key={i.id} className="border-t border-border hover:bg-surface/60">
              <td className="px-4 py-3">{i.context?.skuCode ?? '—'}</td>
              <td className="px-4 py-3">{fmt(i.currency, i.fromAmount)} → {fmt(i.currency, i.toAmount)}</td>
              <td className={`px-4 py-3 ${pctColor}`}>{pct}%</td>
              <td className="px-4 py-3">{i.source ?? '—'}</td>
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
