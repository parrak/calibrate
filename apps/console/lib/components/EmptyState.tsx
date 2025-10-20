import React from 'react'

type Props = {
  title: string
  desc?: string
  children?: React.ReactNode
}

export function EmptyState({ title, desc, children }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="text-lg font-medium text-fg mb-2">{title}</div>
      {desc && <div className="text-mute mb-4 max-w-md">{desc}</div>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  )
}
