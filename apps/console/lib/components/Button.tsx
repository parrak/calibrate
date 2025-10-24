import clsx from 'clsx'
import React from 'react'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  as?: any; variant?: 'primary' | 'ghost' | 'danger'
}
export function Button({ as:Tag='button', variant='primary', className='', ...props }: Props) {
  const base = 'inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-blue-500/50'
  const variants: Record<string,string> = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    ghost: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50',
    danger: 'bg-red-600 text-white hover:bg-red-700'
  }
  return <Tag className={clsx(base, variants[variant], className)} {...props} />
}
