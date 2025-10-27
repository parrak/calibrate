'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/lib/components/Tabs'
import { CompetitorMonitor } from '@/components/CompetitorMonitor'
import { CompetitorRules } from '@/components/CompetitorRules'

export default function CompetitorsPage({ params }: { params: { slug: string } }) {
  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Competitors</h1>
        <p className="mt-1 text-sm text-gray-500">
          Monitor competitor prices and manage your monitoring rules for project "{params.slug}".
        </p>
      </div>

      <Tabs defaultValue="monitor" className="w-full" aria-label="Competitor tools">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="monitor">Monitor</TabsTrigger>
          <TabsTrigger value="rules">Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="monitor">
          <CompetitorMonitor projectSlug={params.slug} />
        </TabsContent>

        <TabsContent value="rules">
          <CompetitorRules projectSlug={params.slug} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
