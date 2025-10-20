'use client'
import { useEffect } from 'react'
export function useKey(key: string, handler: (e: KeyboardEvent) => void) {
  useEffect(()=>{
    const on = (e: KeyboardEvent)=>{ if ((e.key === key)) handler(e) }
    window.addEventListener('keydown', on); return ()=>window.removeEventListener('keydown', on)
  },[key, handler])
}
