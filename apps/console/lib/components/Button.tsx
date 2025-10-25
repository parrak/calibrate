import clsx from 'clsx'
import React from 'react'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  as?: any; variant?: 'primary' | 'ghost' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
}
export function Button({ as:Tag='button', variant='primary', size='md', className='', ...props }: Props) {
  const base = 'inline-flex items-center justify-center rounded-md font-medium transition focus:outline-none focus:ring-2 focus:ring-blue-500/50'
  const variants: Record<string,string> = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    ghost: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    outline: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
  }
  const sizes: Record<string, string> = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base'
  }
  return <Tag className={clsx(base, variants[variant], sizes[size], className)} {...props} />
}
