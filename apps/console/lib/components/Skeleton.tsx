'use client'
import React from 'react'

export function Skeleton({ className = '' }: { className?: string }) {
  return <div data-testid="skeleton" className={`animate-pulse rounded bg-gray-200 ${className}`} />
}

