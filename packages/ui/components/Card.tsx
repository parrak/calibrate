import React from 'react'
import { clsx } from 'clsx'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  variant?: 'default' | 'outlined' | 'elevated'
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export function Card({ 
  children, 
  className, 
  variant = 'default', 
  padding = 'md',
  ...props 
}: CardProps) {
  return (
    <div
      className={clsx(
        'rounded-lg',
        {
          'bg-white border border-gray-200': variant === 'default',
          'bg-white border-2 border-gray-300': variant === 'outlined',
          'bg-white shadow-lg border border-gray-100': variant === 'elevated',
        },
        {
          'p-0': padding === 'none',
          'p-3': padding === 'sm',
          'p-4': padding === 'md',
          'p-6': padding === 'lg',
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function CardHeader({ children, className, ...props }: CardHeaderProps) {
  return (
    <div
      className={clsx('flex flex-col space-y-1.5 pb-4', className)}
      {...props}
    >
      {children}
    </div>
  )
}

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode
}

export function CardTitle({ children, className, ...props }: CardTitleProps) {
  return (
    <h3
      className={clsx('text-lg font-semibold leading-none tracking-tight', className)}
      {...props}
    >
      {children}
    </h3>
  )
}

export interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode
}

export function CardDescription({ children, className, ...props }: CardDescriptionProps) {
  return (
    <p
      className={clsx('text-sm text-gray-600', className)}
      {...props}
    >
      {children}
    </p>
  )
}

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function CardContent({ children, className, ...props }: CardContentProps) {
  return (
    <div className={clsx('pt-0', className)} {...props}>
      {children}
    </div>
  )
}

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function CardFooter({ children, className, ...props }: CardFooterProps) {
  return (
    <div
      className={clsx('flex items-center pt-4', className)}
      {...props}
    >
      {children}
    </div>
  )
}
