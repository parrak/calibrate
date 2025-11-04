'use client'

import type { Integration } from '@/lib/api-client'

interface IntegrationStatsProps {
  integrations: Integration[]
  loading?: boolean
}

export function IntegrationStats({ integrations, loading = false }: IntegrationStatsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-3"></div>
            <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
          </div>
        ))}
      </div>
    )
  }

  const stats = {
    total: integrations.length,
    connected: integrations.filter(i => i?.status === 'CONNECTED').length,
    syncing: integrations.filter(i => i?.syncStatus === 'SYNCING').length,
    errors: integrations.filter(i => i?.status === 'ERROR').length,
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <StatCard
        label="Total Platforms"
        value={stats.total}
        icon="🔗"
        color="gray"
      />
      <StatCard
        label="Connected"
        value={stats.connected}
        icon="✅"
        color="green"
      />
      <StatCard
        label="Syncing"
        value={stats.syncing}
        icon="🔄"
        color="blue"
      />
      <StatCard
        label="Errors"
        value={stats.errors}
        icon="⚠️"
        color="red"
      />
    </div>
  )
}

interface StatCardProps {
  label: string
  value: number
  icon: string
  color: 'gray' | 'green' | 'blue' | 'red'
}

function StatCard({ label, value, icon, color }: StatCardProps) {
  const colorClasses = {
    gray: 'bg-gray-50 border-gray-200',
    green: 'bg-green-50 border-green-200',
    blue: 'bg-blue-50 border-blue-200',
    red: 'bg-red-50 border-red-200',
  }

  const textColorClasses = {
    gray: 'text-gray-900',
    green: 'text-green-900',
    blue: 'text-blue-900',
    red: 'text-red-900',
  }

  const valueColorClasses = {
    gray: 'text-gray-600',
    green: 'text-green-600',
    blue: 'text-blue-600',
    red: 'text-red-600',
  }

  return (
    <div className={`${colorClasses[color]} rounded-lg border p-5`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className={`text-sm font-medium ${textColorClasses[color]}`}>
            {label}
          </p>
          <p className={`mt-2 text-3xl font-bold ${valueColorClasses[color]}`}>
            {value}
          </p>
        </div>
        <span className="text-2xl opacity-50" aria-hidden="true">
          {icon}
        </span>
      </div>
    </div>
  )
}
