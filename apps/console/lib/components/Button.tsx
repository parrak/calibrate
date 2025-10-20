import clsx from 'clsx'
import React from 'react'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  as?: any; variant?: 'primary' | 'ghost' | 'danger'
}
export function Button({ as:Tag='button', variant='primary', className='', ...props }: Props) {
  const base = 'inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-brand/50'
  const variants: Record<string,string> = {
    primary: 'bg-brand text-black hover:opacity-90',
    ghost: 'bg-transparent text-fg border border-border hover:bg-surface',
    danger: 'bg-red-500 text-white hover:opacity-90'
  }
  return <Tag className={clsx(base, variants[variant], className)} {...props} />
}
