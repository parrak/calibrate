import React from 'react'
import { clsx } from 'clsx'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary'
}

export function Badge({ children, className, variant = 'default', ...props }: BadgeProps) {
  const baseClasses = "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
  
  const variantClasses = {
    default: "bg-gray-100 text-gray-800 border border-gray-200",
    success: "bg-green-100 text-green-800 border border-green-200",
    warning: "bg-yellow-100 text-yellow-800 border border-yellow-200",
    danger: "bg-red-100 text-red-800 border border-red-200",
    info: "bg-blue-100 text-blue-800 border border-blue-200",
    primary: "bg-blue-100 text-blue-800 border border-blue-200"
  }
  
  return (
    <span 
      className={clsx(baseClasses, variantClasses[variant], className)} 
      {...props}
    >
      {children}
    </span>
  )
}
