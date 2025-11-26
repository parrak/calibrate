'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { priceChangesApi } from '@/lib/api-client'

interface Stats {
  pending: number
  approvedToday: number
  appliedToday: number
}

export default function ProjectDashboard({ params }: { params: { slug: string } }) {
  const { data: session } = useSession()
  const [stats, setStats] = useState<Stats>({ pending: 0, approvedToday: 0, appliedToday: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const apiToken = (session as { apiToken?: string })?.apiToken

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true)
        setError(null)

        const changesRaw = await priceChangesApi.list(params.slug, apiToken)

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
  }, [params.slug, apiToken])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-fg">Dashboard</h1>
        <p className="mt-1 text-sm text-mute">Monitor your pricing operations at a glance</p>
      </div>

      {error && (
        <div className="p-4 bg-danger/10 border border-danger/20 rounded-xl text-sm text-danger">{error}</div>
      )}

      {/* Heartbeat Cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Pending Price Changes"
          value={loading ? '—' : stats.pending}
          href={`/p/${params.slug}/price-changes`}
          cta="Review now"
          icon="💰"
          loading={loading}
        />
        <MetricCard
          title="AI Suggestions"
          value={loading ? '—' : stats.approvedToday}
          href={`/p/${params.slug}/assistant`}
          cta="Open"
          icon="🤖"
          loading={loading}
        />
        <MetricCard
          title="Connector Health"
          value="All good"
          href={`/p/${params.slug}/integrations`}
          cta="View"
          icon="🔌"
          loading={loading}
        />
        <MetricCard
          title="Applied Today"
          value={loading ? '—' : stats.appliedToday}
          href={`/p/${params.slug}/analytics`}
          cta="See analytics"
          icon="📈"
          loading={loading}
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-fg mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href={`/p/${params.slug}/price-changes`}
            className="flex items-center justify-between bg-brand text-white px-4 py-3 rounded-lg hover:bg-brand/90 transition-all shadow-sm hover:shadow-md group font-semibold"
          >
            <span>Review Price Changes</span>
            <span aria-hidden className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
          <Link
            href={`/p/${params.slug}/catalog`}
            className="flex items-center justify-between bg-bg border border-border text-fg px-4 py-3 rounded-lg hover:bg-surface hover:border-brand/30 transition-all group font-semibold"
          >
            <span>View Catalog</span>
            <span aria-hidden className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

interface MetricCardProps {
  title: string
  value: string | number
  href: string
  cta: string
  icon?: string
  loading?: boolean
}

function MetricCard({ title, value, href, cta, icon, loading }: MetricCardProps) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4 hover:border-brand/30 transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div className="text-sm text-mute font-medium">{title}</div>
        {icon && <span className="text-xl opacity-60" aria-hidden="true">{icon}</span>}
      </div>
      <div className="flex items-end justify-between">
        {loading ? (
          <div className="h-9 w-16 bg-border animate-pulse rounded"></div>
        ) : (
          <div className="text-3xl font-semibold text-fg">{value}</div>
        )}
        <Link
          href={href}
          className="text-brand text-sm font-medium hover:underline transition-all"
        >
          {cta} →
        </Link>
      </div>
    </div>
  )
}

