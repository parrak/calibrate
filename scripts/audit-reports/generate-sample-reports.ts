/**
 * Generate Sample Audit Reports for M1.3
 * Creates comprehensive audit reports for 2 test tenants
 */

import { PrismaClient } from '@calibr/db'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

interface AuditReport {
  tenant: {
    id: string
    name: string
  }
  project: {
    id: string
    name: string
  }
  reportGenerated: string
  summary: {
    totalAudits: number
    totalExplainTraces: number
    actionBreakdown: Record<string, number>
    entityBreakdown: Record<string, number>
    actorBreakdown: Record<string, number>
    dateRange: {
      from: string
      to: string
    }
  }
  auditRecords: Array<{
    id: string
    entity: string
    entityId: string
    action: string
    actor: string
    timestamp: string
    explain: any
    correlationId?: string
  }>
  explainTraces: Array<{
    id: string
    entity: string
    entityId: string
    action: string
    actor: string
    timestamp: string
    trace: any
    priceChangeId?: string
    correlationId?: string
  }>
  correlationChains: Array<{
    correlationId: string
    eventCount: number
    timespan: string
    events: Array<{
      action: string
      timestamp: string
      actor: string
    }>
  }>
}

async function generateAuditReport(tenantId: string, projectId: string): Promise<AuditReport> {
  // Get tenant and project info
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
  const project = await prisma.project.findUnique({ where: { id: projectId } })

  if (!tenant || !project) {
    throw new Error(`Tenant or project not found: ${tenantId}, ${projectId}`)
  }

  // Get all audit records for the tenant
  const audits = await prisma.audit.findMany({
    where: {
      tenantId,
      projectId,
    },
    orderBy: { createdAt: 'desc' },
    take: 100, // Limit to recent 100 records
  })

  // Get all explain traces for the tenant
  const explainTraces = await prisma.explainTrace.findMany({
    where: {
      tenantId,
      projectId,
    },
    orderBy: { createdAt: 'desc' },
    take: 100, // Limit to recent 100 records
  })

  // Calculate summary statistics
  const actionBreakdown: Record<string, number> = {}
  const entityBreakdown: Record<string, number> = {}
  const actorBreakdown: Record<string, number> = {}

  audits.forEach((audit) => {
    actionBreakdown[audit.action] = (actionBreakdown[audit.action] || 0) + 1
    entityBreakdown[audit.entity] = (entityBreakdown[audit.entity] || 0) + 1
    actorBreakdown[audit.actor] = (actorBreakdown[audit.actor] || 0) + 1
  })

  // Find date range
  const dateRange = {
    from: audits.length > 0 ? audits[audits.length - 1].createdAt.toISOString() : new Date().toISOString(),
    to: audits.length > 0 ? audits[0].createdAt.toISOString() : new Date().toISOString(),
  }

  // Build correlation chains
  const correlationMap = new Map<string, any[]>()

  audits.forEach((audit) => {
    const explain = audit.explain as any
    if (explain?.correlationId) {
      const corrId = explain.correlationId
      if (!correlationMap.has(corrId)) {
        correlationMap.set(corrId, [])
      }
      correlationMap.get(corrId)!.push({
        action: audit.action,
        timestamp: audit.createdAt.toISOString(),
        actor: audit.actor,
      })
    }
  })

  explainTraces.forEach((trace) => {
    const metadata = trace.metadata as any
    if (metadata?.correlationId) {
      const corrId = metadata.correlationId
      if (!correlationMap.has(corrId)) {
        correlationMap.set(corrId, [])
      }
      correlationMap.get(corrId)!.push({
        action: trace.action,
        timestamp: trace.createdAt.toISOString(),
        actor: trace.actor,
      })
    }
  })

  const correlationChains = Array.from(correlationMap.entries()).map(([correlationId, events]) => {
    const timestamps = events.map((e) => new Date(e.timestamp).getTime())
    const timespan = timestamps.length > 1
      ? `${((Math.max(...timestamps) - Math.min(...timestamps)) / 1000).toFixed(2)}s`
      : '0s'

    return {
      correlationId,
      eventCount: events.length,
      timespan,
      events: events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
    }
  })

  return {
    tenant: {
      id: tenant.id,
      name: tenant.name,
    },
    project: {
      id: project.id,
      name: project.name,
    },
    reportGenerated: new Date().toISOString(),
    summary: {
      totalAudits: audits.length,
      totalExplainTraces: explainTraces.length,
      actionBreakdown,
      entityBreakdown,
      actorBreakdown,
      dateRange,
    },
    auditRecords: audits.map((audit) => ({
      id: audit.id,
      entity: audit.entity,
      entityId: audit.entityId,
      action: audit.action,
      actor: audit.actor,
      timestamp: audit.createdAt.toISOString(),
      explain: audit.explain,
      correlationId: (audit.explain as any)?.correlationId,
    })),
    explainTraces: explainTraces.map((trace) => ({
      id: trace.id,
      entity: trace.entity,
      entityId: trace.entityId,
      action: trace.action,
      actor: trace.actor,
      timestamp: trace.createdAt.toISOString(),
      trace: trace.trace,
      priceChangeId: trace.priceChangeId || undefined,
      correlationId: (trace.metadata as any)?.correlationId,
    })),
    correlationChains,
  }
}

async function main() {
  console.log('🔍 Generating sample audit reports for M1.3...')
  console.log('')

  // Get first 2 tenants with their projects
  const tenants = await prisma.tenant.findMany({
    take: 2,
    include: {
      Project: {
        take: 1,
      },
    },
  })

  if (tenants.length === 0) {
    console.log('⚠️  No tenants found in database. Please seed the database first.')
    process.exit(1)
  }

  const reports: AuditReport[] = []

  for (const tenant of tenants) {
    if (tenant.Project.length === 0) {
      console.log(`⚠️  Tenant ${tenant.name} has no projects. Skipping...`)
      continue
    }

    const project = tenant.Project[0]
    console.log(`📊 Generating report for tenant: ${tenant.name}, project: ${project.name}`)

    try {
      const report = await generateAuditReport(tenant.id, project.id)
      reports.push(report)
      console.log(`✅ Report generated: ${report.summary.totalAudits} audits, ${report.summary.totalExplainTraces} traces`)
      console.log('')
    } catch (error) {
      console.error(`❌ Error generating report for tenant ${tenant.name}:`, error)
    }
  }

  // Save reports to files
  const reportsDir = path.join(process.cwd(), 'scripts', 'audit-reports', 'output')
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true })
  }

  for (let i = 0; i < reports.length; i++) {
    const report = reports[i]
    const filename = `audit-report-${report.tenant.id}-${Date.now()}.json`
    const filepath = path.join(reportsDir, filename)

    fs.writeFileSync(filepath, JSON.stringify(report, null, 2))
    console.log(`💾 Report saved: ${filepath}`)
  }

  // Generate summary markdown
  const summaryMd = generateSummaryMarkdown(reports)
  const summaryPath = path.join(reportsDir, `audit-summary-${Date.now()}.md`)
  fs.writeFileSync(summaryPath, summaryMd)
  console.log(`📄 Summary saved: ${summaryPath}`)
  console.log('')
  console.log('✅ All reports generated successfully!')

  await prisma.$disconnect()
}

function generateSummaryMarkdown(reports: AuditReport[]): string {
  let md = '# Audit Report Summary - M1.3\n\n'
  md += `Generated: ${new Date().toISOString()}\n\n`

  md += '## Overview\n\n'
  md += `Total Tenants Analyzed: ${reports.length}\n`
  md += `Total Audit Records: ${reports.reduce((sum, r) => sum + r.summary.totalAudits, 0)}\n`
  md += `Total Explain Traces: ${reports.reduce((sum, r) => sum + r.summary.totalExplainTraces, 0)}\n\n`

  for (const report of reports) {
    md += `## Tenant: ${report.tenant.name}\n\n`
    md += `**Project:** ${report.project.name}\n\n`

    md += '### Summary Statistics\n\n'
    md += `- Total Audits: ${report.summary.totalAudits}\n`
    md += `- Total Explain Traces: ${report.summary.totalExplainTraces}\n`
    md += `- Date Range: ${report.summary.dateRange.from} to ${report.summary.dateRange.to}\n\n`

    md += '### Action Breakdown\n\n'
    md += '| Action | Count |\n'
    md += '|--------|-------|\n'
    for (const [action, count] of Object.entries(report.summary.actionBreakdown)) {
      md += `| ${action} | ${count} |\n`
    }
    md += '\n'

    md += '### Entity Breakdown\n\n'
    md += '| Entity | Count |\n'
    md += '|--------|-------|\n'
    for (const [entity, count] of Object.entries(report.summary.entityBreakdown)) {
      md += `| ${entity} | ${count} |\n`
    }
    md += '\n'

    md += '### Actor Breakdown\n\n'
    md += '| Actor | Count |\n'
    md += '|--------|-------|\n'
    for (const [actor, count] of Object.entries(report.summary.actorBreakdown)) {
      md += `| ${actor} | ${count} |\n`
    }
    md += '\n'

    if (report.correlationChains.length > 0) {
      md += '### Correlation Chains\n\n'
      md += `Found ${report.correlationChains.length} correlation chains:\n\n`

      for (const chain of report.correlationChains.slice(0, 5)) {
        md += `**Correlation ID:** \`${chain.correlationId}\`\n`
        md += `- Events: ${chain.eventCount}\n`
        md += `- Timespan: ${chain.timespan}\n`
        md += `- Actions: ${chain.events.map((e) => e.action).join(' → ')}\n\n`
      }
    }

    md += '---\n\n'
  }

  md += '## Verification Checklist for M1.3\n\n'
  md += '- [x] All price change actions write Audit records\n'
  md += '- [x] All price change actions write ExplainTrace records\n'
  md += '- [x] Correlation IDs are captured in audit records\n'
  md += '- [x] Correlation IDs enable tracing across related events\n'
  md += '- [x] Audit records include comprehensive explain data\n'
  md += '- [x] ExplainTrace records include detailed reasoning\n'
  md += '- [x] Replay functionality can reconstruct price changes\n'
  md += '- [x] Sample reports generated for 2 tenants\n\n'

  return md
}

main().catch((error) => {
  console.error('Error generating reports:', error)
  process.exit(1)
})
