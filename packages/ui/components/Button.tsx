import clsx from 'clsx'
import React from 'react'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  as?: any; variant?: 'primary' | 'ghost' | 'danger'
}
export function Button({ as:Tag='button', variant='primary', className='', ...props }: Props) {
  const base = 'inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand/50 disabled:opacity-50 disabled:cursor-not-allowed'
  const variants: Record<string,string> = {
    primary: 'bg-brand text-black hover:bg-brand-700 active:bg-brand-700',
    ghost: 'bg-transparent text-gray-700 border border-gray-300 hover:bg-gray-50 active:bg-gray-100',
    danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800'
  }
  return <Tag className={clsx(base, variants[variant], className)} {...props} />
}
