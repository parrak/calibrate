/**
 * Analytics Dashboard Page
 */

import { Suspense } from 'react'
import { AnalyticsDashboard } from './components/AnalyticsDashboard'

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
        <p className="text-gray-600">
          Insights and trends for your pricing data
        </p>
      </div>

      <Suspense fallback={<DashboardSkeleton />}>
        <AnalyticsDashboard projectSlug={slug} />
      </Suspense>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg border p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-lg border p-6 h-64 animate-pulse">
        <div className="h-full bg-gray-200 rounded"></div>
      </div>
    </div>
  )
}
