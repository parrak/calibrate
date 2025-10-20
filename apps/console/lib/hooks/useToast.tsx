'use client'
import { useEffect, useState } from 'react'

export function useToast() {
  const [msg, setMsg] = useState<string|null>(null)
  useEffect(()=>{ if(!msg) return; const t=setTimeout(()=>setMsg(null),2200); return ()=>clearTimeout(t) },[msg])
  const Toast = msg ? (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-surface border border-border rounded-lg px-3 py-2 text-sm shadow">
      {msg}
    </div>
  ) : null
  return { Toast, setMsg }
}
