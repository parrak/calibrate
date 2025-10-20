import React from 'react'
export function Badge({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center rounded-full bg-surface border border-border px-2 py-0.5 text-xs text-mute">{children}</span>
}
