'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { priceChangesApi } from '@/lib/api-client'

interface Stats {
  pending: number
  approvedToday: number
  appliedToday: number
}

export default function ProjectDashboard({ params }: { params: { slug: string } }) {
  const [stats, setStats] = useState<Stats>({ pending: 0, approvedToday: 0, appliedToday: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true)
        setError(null)

        const changesRaw = await priceChangesApi.list(params.slug)

        const now = new Date()
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

        interface PriceChange {
          status: string
          updatedAt?: string
          appliedAt?: string
        }

        const changes = changesRaw as unknown as PriceChange[]

        const stats: Stats = {
          pending: changes.filter((c) => c.status === 'PENDING').length,
          approvedToday: changes.filter(
            (c) => c.status === 'APPROVED' && c.updatedAt && new Date(c.updatedAt) >= todayStart
          ).length,
          appliedToday: changes.filter(
            (c) => c.status === 'APPLIED' && c.appliedAt && new Date(c.appliedAt) >= todayStart
          ).length,
        }

        setStats(stats)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [params.slug])

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Overview of your pricing changes and quick actions</p>
      </div>

      {/* Stats Grid */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Pending Changes" value={stats.pending} loading={loading} color="blue" icon="⏳" />
          <StatCard title="Approved Today" value={stats.approvedToday} loading={loading} color="green" icon="✅" />
          <StatCard title="Applied Today" value={stats.appliedToday} loading={loading} color="purple" icon="🚀" />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href={`/p/${params.slug}/price-changes`}
            className="flex items-center justify-between bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors group"
          >
            <span className="font-medium">Review Price Changes</span>
            <span aria-hidden className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
          <Link
            href={`/p/${params.slug}/catalog`}
            className="flex items-center justify-between bg-gray-700 text-white px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors group"
          >
            <span className="font-medium">View Catalog</span>
            <span aria-hidden className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

interface StatCardProps {
  title: string
  value: number
  loading: boolean
  color: 'blue' | 'green' | 'purple'
  icon: string
}

function StatCard({ title, value, loading, color, icon }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-900 border-blue-200',
    green: 'bg-green-50 text-green-900 border-green-200',
    purple: 'bg-purple-50 text-purple-900 border-purple-200',
  }

  const valueColorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
  }

  return (
    <div className={`${colorClasses[color]} border rounded-lg p-4`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium">{title}</p>
          {loading ? (
            <div className="mt-2 h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
          ) : (
            <p className={`mt-2 text-3xl font-bold ${valueColorClasses[color]}`}>{value}</p>
          )}
        </div>
        <span className="text-2xl opacity-50" aria-hidden>
          {icon}
        </span>
      </div>
    </div>
  )
}

