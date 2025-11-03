'use client'
import { Drawer, DiffCard, PolicyList, JSONView, Button, StatusPill } from '@/lib/components'
import { useEffect, useState } from 'react'

type Item = {
  id:string; status:string; currency:string; fromAmount:number; toAmount:number;
  createdAt:string; context?:Record<string, unknown>; source?:string; policyResult?:{ ok:boolean; checks:Array<Record<string, unknown>> }
}

export function PriceChangeDrawer({
  open, onClose, item, onApprove, onApply, onReject, onRollback
}:{ open:boolean; onClose:()=>void; item:Item|null;
   onApprove:(id:string)=>void; onApply:(id:string)=>void; onReject:(id:string)=>void; onRollback:(id:string)=>void }) {
  const [i, setI] = useState<Item|null>(item)
  useEffect(()=>setI(item),[item])

  if(!i) return null
  return (
    <Drawer open={open} onClose={onClose} title={<div className="flex items-center gap-2">Change <span className="text-mute text-xs">{i.id}</span> <StatusPill status={i.status}/></div>}>
      <div className="space-y-4">
        <DiffCard currency={i.currency} fromAmount={i.fromAmount} toAmount={i.toAmount}/>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border bg-surface p-3">
            <div className="text-xs text-mute mb-1">Source</div>
            <div className="text-sm">{i.source ?? '—'}</div>
          </div>
          <div className="rounded-xl border border-border bg-surface p-3">
            <div className="text-xs text-mute mb-1">Created</div>
            <div className="text-sm">{new Date(i.createdAt).toLocaleString()}</div>
          </div>
        </div>
        <PolicyList checks={i.policyResult?.checks ?? []}/>
        <div>
          <div className="text-sm font-medium mb-2">Context</div>
          <JSONView value={i.context}/>
        </div>
        <div className="flex gap-2 pt-2">
          {i.status==='PENDING' && <Button onClick={()=>onApprove(i.id)}>Approve</Button>}
          {(i.status==='PENDING' || i.status==='APPROVED') && <Button onClick={()=>onApply(i.id)} variant="ghost">Apply</Button>}
          {i.status==='APPLIED' && <Button onClick={()=>onRollback(i.id)} variant="ghost">Rollback</Button>}
          {i.status!=='REJECTED' && <Button onClick={()=>onReject(i.id)} variant="danger">Reject</Button>}
        </div>
      </div>
    </Drawer>
  )
}
