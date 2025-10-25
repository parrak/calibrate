'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@calibrate/ui/components/tabs'
import { CompetitorMonitor } from '@/components/CompetitorMonitor'
import { CompetitorRules } from '@/components/CompetitorRules'

export default function CompetitorsPage({ params }: { params: { slug: string } }) {
  const [tenantId] = useState('tenant_1') // TODO: Get from auth context
  const [projectId] = useState('project_1') // TODO: Get from current project context

  return (
    <div className="py-6">
      <Tabs defaultValue="monitor" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="monitor">Monitor</TabsTrigger>
          <TabsTrigger value="rules">Rules</TabsTrigger>
        </TabsList>
        
        <TabsContent value="monitor">
          <CompetitorMonitor tenantId={tenantId} projectId={projectId} />
        </TabsContent>
        
        <TabsContent value="rules">
          <CompetitorRules tenantId={tenantId} projectId={projectId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
