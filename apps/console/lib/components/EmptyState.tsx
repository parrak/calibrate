import React from 'react'

type Props = {
  title: string
  desc?: string
  children?: React.ReactNode
}

export function EmptyState({ title, desc, children }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
      <div className="text-lg font-medium text-gray-900 w-full">{title}</div>
      {desc && <div className="text-gray-600 max-w-md w-full">{desc}</div>}
      {children && <div className="w-full flex justify-center">{children}</div>}
    </div>
  )
}
