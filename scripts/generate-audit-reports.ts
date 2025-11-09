#!/usr/bin/env tsx
/**
 * Generate Sample Audit Reports for QA
 *
 * This script generates sample audit reports for 2 tenants to demonstrate
 * the audit trail functionality.
 */

interface AuditRecord {
  id: string
  tenantId: string
  projectId: string | null
  entity: string
  entityId: string
  action: string
  actor: string
  explain: Record<string, any> | null
  createdAt: Date
}

// Generate sample audit data for 2 tenants
function generateSampleAuditData(): AuditRecord[] {
  const baseTime = new Date('2025-01-01T00:00:00Z')

  return [
    // Tenant 1 - Demo Company
    {
      id: 'audit_1',
      tenantId: 'tenant_demo',
      projectId: 'proj_demo',
      entity: 'PriceChange',
      entityId: 'pc_001',
      action: 'approved',
      actor: 'user_alice',
      explain: {
        status: 'APPROVED',
        approvedBy: 'user_alice',
        timestamp: new Date(baseTime.getTime()).toISOString(),
        fromAmount: 4990,
        toAmount: 5490,
        currency: 'USD',
        correlationId: 'corr_demo_001',
        reason: 'Seasonal price adjustment',
      },
      createdAt: new Date(baseTime.getTime()),
    },
    {
      id: 'audit_2',
      tenantId: 'tenant_demo',
      projectId: 'proj_demo',
      entity: 'PriceChange',
      entityId: 'pc_001',
      action: 'applied',
      actor: 'system',
      explain: {
        status: 'APPLIED',
        timestamp: new Date(baseTime.getTime() + 60000).toISOString(),
        fromAmount: 4990,
        toAmount: 5490,
        currency: 'USD',
        correlationId: 'corr_demo_001',
        appliedBy: 'system',
        connectorStatus: 'synced',
      },
      createdAt: new Date(baseTime.getTime() + 60000),
    },
    {
      id: 'audit_3',
      tenantId: 'tenant_demo',
      projectId: 'proj_demo',
      entity: 'PriceChange',
      entityId: 'pc_002',
      action: 'rejected',
      actor: 'user_bob',
      explain: {
        status: 'REJECTED',
        timestamp: new Date(baseTime.getTime() + 120000).toISOString(),
        fromAmount: 9990,
        toAmount: 12990,
        currency: 'USD',
        correlationId: 'corr_demo_002',
        reason: 'Price increase too high',
        previousStatus: 'PENDING',
      },
      createdAt: new Date(baseTime.getTime() + 120000),
    },
    {
      id: 'audit_4',
      tenantId: 'tenant_demo',
      projectId: 'proj_demo',
      entity: 'Product',
      entityId: 'prod_001',
      action: 'created',
      actor: 'user_alice',
      explain: {
        timestamp: new Date(baseTime.getTime() + 180000).toISOString(),
        productName: 'Premium Widget',
        sku: 'WIDGET-001',
        correlationId: 'corr_demo_003',
      },
      createdAt: new Date(baseTime.getTime() + 180000),
    },
    {
      id: 'audit_5',
      tenantId: 'tenant_demo',
      projectId: 'proj_demo',
      entity: 'PriceChange',
      entityId: 'pc_003',
      action: 'approved',
      actor: 'user_charlie',
      explain: {
        status: 'APPROVED',
        approvedBy: 'user_charlie',
        timestamp: new Date(baseTime.getTime() + 240000).toISOString(),
        fromAmount: 2990,
        toAmount: 2490,
        currency: 'USD',
        correlationId: 'corr_demo_004',
        reason: 'Clearance sale',
      },
      createdAt: new Date(baseTime.getTime() + 240000),
    },

    // Tenant 2 - Acme Corp
    {
      id: 'audit_6',
      tenantId: 'tenant_acme',
      projectId: 'proj_acme',
      entity: 'PriceChange',
      entityId: 'pc_101',
      action: 'approved',
      actor: 'user_david',
      explain: {
        status: 'APPROVED',
        approvedBy: 'user_david',
        timestamp: new Date(baseTime.getTime()).toISOString(),
        fromAmount: 7990,
        toAmount: 8490,
        currency: 'USD',
        correlationId: 'corr_acme_001',
        reason: 'Inflation adjustment',
      },
      createdAt: new Date(baseTime.getTime()),
    },
    {
      id: 'audit_7',
      tenantId: 'tenant_acme',
      projectId: 'proj_acme',
      entity: 'PriceChange',
      entityId: 'pc_101',
      action: 'applied',
      actor: 'system',
      explain: {
        status: 'APPLIED',
        timestamp: new Date(baseTime.getTime() + 60000).toISOString(),
        fromAmount: 7990,
        toAmount: 8490,
        currency: 'USD',
        correlationId: 'corr_acme_001',
        appliedBy: 'system',
        connectorStatus: 'synced',
      },
      createdAt: new Date(baseTime.getTime() + 60000),
    },
    {
      id: 'audit_8',
      tenantId: 'tenant_acme',
      projectId: 'proj_acme',
      entity: 'PriceChange',
      entityId: 'pc_101',
      action: 'rolled_back',
      actor: 'user_eve',
      explain: {
        status: 'ROLLED_BACK',
        timestamp: new Date(baseTime.getTime() + 300000).toISOString(),
        fromAmount: 8490,
        toAmount: 7990,
        currency: 'USD',
        correlationId: 'corr_acme_002',
        reason: 'Customer complaints',
        previousStatus: 'APPLIED',
      },
      createdAt: new Date(baseTime.getTime() + 300000),
    },
    {
      id: 'audit_9',
      tenantId: 'tenant_acme',
      projectId: 'proj_acme',
      entity: 'PriceChange',
      entityId: 'pc_102',
      action: 'approved',
      actor: 'user_frank',
      explain: {
        status: 'APPROVED',
        approvedBy: 'user_frank',
        timestamp: new Date(baseTime.getTime() + 360000).toISOString(),
        fromAmount: 1990,
        toAmount: 2290,
        currency: 'USD',
        correlationId: 'corr_acme_003',
        reason: 'Cost increase',
      },
      createdAt: new Date(baseTime.getTime() + 360000),
    },
    {
      id: 'audit_10',
      tenantId: 'tenant_acme',
      projectId: 'proj_acme',
      entity: 'Product',
      entityId: 'prod_101',
      action: 'updated',
      actor: 'user_david',
      explain: {
        timestamp: new Date(baseTime.getTime() + 420000).toISOString(),
        productName: 'Deluxe Gadget',
        sku: 'GADGET-101',
        correlationId: 'corr_acme_004',
        changes: {
          description: 'Updated product description',
        },
      },
      createdAt: new Date(baseTime.getTime() + 420000),
    },
  ]
}

// Generate a formatted audit report
function generateAuditReport(tenantId: string, tenantName: string, records: AuditRecord[]): string {
  const tenantRecords = records.filter((r) => r.tenantId === tenantId)

  let report = `
╔═══════════════════════════════════════════════════════════════════════════════╗
║                         AUDIT TRAIL REPORT                                    ║
║                                                                               ║
║  Tenant: ${tenantName.padEnd(68)} ║
║  Tenant ID: ${tenantId.padEnd(65)} ║
║  Report Generated: ${new Date().toISOString().padEnd(58)} ║
║  Total Records: ${String(tenantRecords.length).padEnd(64)} ║
╚═══════════════════════════════════════════════════════════════════════════════╝

`

  // Group by entity type
  const byEntity = new Map<string, AuditRecord[]>()
  tenantRecords.forEach((record) => {
    const existing = byEntity.get(record.entity) || []
    existing.push(record)
    byEntity.set(record.entity, existing)
  })

  // Summary section
  report += `SUMMARY BY ENTITY TYPE:\n`
  report += `${'─'.repeat(80)}\n`
  byEntity.forEach((records, entity) => {
    report += `  ${entity.padEnd(30)} ${String(records.length).padStart(5)} records\n`
  })
  report += `\n`

  // Detailed records
  report += `DETAILED AUDIT TRAIL:\n`
  report += `${'═'.repeat(80)}\n\n`

  tenantRecords.forEach((record, index) => {
    report += `[${index + 1}] ${record.createdAt.toISOString()}\n`
    report += `    Entity:       ${record.entity} (${record.entityId})\n`
    report += `    Action:       ${record.action.toUpperCase()}\n`
    report += `    Actor:        ${record.actor}\n`

    if (record.explain) {
      report += `    Details:\n`
      Object.entries(record.explain).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          report += `      ${key}: ${JSON.stringify(value)}\n`
        } else {
          report += `      ${key}: ${value}\n`
        }
      })
    }

    report += `\n`
  })

  // Action summary
  const byAction = new Map<string, number>()
  tenantRecords.forEach((record) => {
    const count = byAction.get(record.action) || 0
    byAction.set(record.action, count + 1)
  })

  report += `${'═'.repeat(80)}\n`
  report += `ACTION SUMMARY:\n`
  report += `${'─'.repeat(80)}\n`
  byAction.forEach((count, action) => {
    report += `  ${action.padEnd(30)} ${String(count).padStart(5)}\n`
  })

  // Correlation ID tracking
  const correlationIds = new Set<string>()
  tenantRecords.forEach((record) => {
    if (record.explain?.correlationId) {
      correlationIds.add(record.explain.correlationId)
    }
  })

  report += `\n`
  report += `CORRELATION TRACKING:\n`
  report += `${'─'.repeat(80)}\n`
  report += `  Total unique correlation IDs: ${correlationIds.size}\n`
  report += `  Correlation IDs:\n`
  Array.from(correlationIds).forEach((id) => {
    const relatedRecords = tenantRecords.filter(
      (r) => r.explain?.correlationId === id
    )
    report += `    ${id} (${relatedRecords.length} events)\n`
  })

  report += `\n${'═'.repeat(80)}\n`
  report += `End of Report\n`
  report += `${'═'.repeat(80)}\n`

  return report
}

// Main execution
function main() {
  console.log('Generating Sample Audit Reports for QA...\n')

  const auditData = generateSampleAuditData()

  // Generate report for Tenant 1 (Demo Company)
  const report1 = generateAuditReport('tenant_demo', 'Demo Company', auditData)
  console.log(report1)
  console.log('\n\n')

  // Generate report for Tenant 2 (Acme Corp)
  const report2 = generateAuditReport('tenant_acme', 'Acme Corp', auditData)
  console.log(report2)

  console.log('\n✅ Sample audit reports generated successfully!\n')
  console.log('These reports demonstrate:')
  console.log('  • Audit trail for price change approvals, applications, and rejections')
  console.log('  • Correlation ID tracking across related events')
  console.log('  • Actor attribution for all actions')
  console.log('  • Detailed explain traces with timestamps')
  console.log('  • Summary statistics by entity and action type')
}

main()
