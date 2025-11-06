import clsx from 'clsx'
import React from 'react'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  as?: any; variant?: 'primary' | 'ghost' | 'danger'
}
export function Button({ as:Tag='button', variant='primary', className='', ...props }: Props) {
  const base = 'inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[color:var(--brand)]/50 disabled:opacity-50 disabled:cursor-not-allowed'
  const variants: Record<string,string> = {
    primary: 'bg-[color:var(--brand)]/90 text-white hover:bg-[color:var(--brand)] active:bg-[color:var(--brand)]',
    ghost: 'bg-transparent text-[color:var(--fg)] border border-[color:var(--border)] hover:bg-neutral-50 active:bg-neutral-100',
    danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800'
  }
  return <Tag className={clsx(base, variants[variant], className)} {...props} />
}
