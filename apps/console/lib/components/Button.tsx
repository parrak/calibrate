import clsx from 'clsx'
import React from 'react'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  as?: React.ElementType; variant?: 'primary' | 'ghost' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
}
export function Button({ as:Tag='button', variant='primary', size='md', className='', ...props }: Props) {
  const base = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm'
  const variants: Record<string,string> = {
    primary: 'bg-brand text-white hover:bg-brand/90 focus:ring-brand/20',
    ghost: 'bg-surface text-fg border-2 border-border hover:bg-bg focus:ring-brand/20',
    danger: 'bg-danger text-white hover:bg-danger/90 focus:ring-danger/20',
    outline: 'bg-surface text-fg border-2 border-border hover:border-brand focus:ring-brand/20'
  }
  const sizes: Record<string, string> = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base'
  }
  return <Tag className={clsx(base, variants[variant], sizes[size], className)} {...props} />
}
