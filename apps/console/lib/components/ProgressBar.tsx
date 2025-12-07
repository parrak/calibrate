/**
 * ProgressBar Component
 * M1.7: Visual progress indicator for automation runs
 */

import { cn } from '@/lib/utils'

interface ProgressBarProps {
  value: number // 0-100
  max?: number
  className?: string
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'success' | 'warning' | 'error'
}

const sizeStyles = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
}

const variantStyles = {
  default: 'bg-blue-600',
  success: 'bg-emerald-600',
  warning: 'bg-yellow-600',
  error: 'bg-red-600',
}

export function ProgressBar({
  value,
  max = 100,
  className,
  showLabel = false,
  size = 'md',
  variant = 'default',
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))
  const isComplete = percentage >= 100

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center gap-2">
        <div className={cn('flex-1 bg-gray-200 rounded-full overflow-hidden', sizeStyles[size])}>
          <div
            className={cn(
              'h-full transition-all duration-300 ease-in-out rounded-full',
              isComplete ? variantStyles.success : variantStyles[variant]
            )}
            style={{ width: `${percentage}%` }}
            role="progressbar"
            aria-valuenow={value}
            aria-valuemin={0}
            aria-valuemax={max}
          />
        </div>
        {showLabel && (
          <div className="text-xs text-mute font-medium min-w-[3rem] text-right">
            {percentage.toFixed(0)}%
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * ProgressRing Component
 * Circular progress indicator for compact spaces
 */
interface ProgressRingProps {
  value: number
  max?: number
  size?: number
  strokeWidth?: number
  className?: string
  showLabel?: boolean
  variant?: 'default' | 'success' | 'warning' | 'error'
}

const ringVariantColors = {
  default: '#3b82f6', // blue-600
  success: '#10b981', // emerald-600
  warning: '#f59e0b', // yellow-600
  error: '#ef4444', // red-600
}

export function ProgressRing({
  value,
  max = 100,
  size = 40,
  strokeWidth = 4,
  className,
  showLabel = false,
  variant = 'default',
}: ProgressRingProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (percentage / 100) * circumference
  const isComplete = percentage >= 100

  const color = isComplete ? ringVariantColors.success : ringVariantColors[variant]

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-300 ease-in-out"
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium text-fg">{percentage.toFixed(0)}%</span>
        </div>
      )}
    </div>
  )
}
