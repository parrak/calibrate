/**
 * Dead Letter Queue (DLQ) Service
 * M1.6: Manages failed targets and provides reporting/retry capabilities
 */

import { prisma, EventWriter } from '@calibr/db'
        projectId,
        entityId: projectId,
        actor: 'automation-runner',
          totalFailed: report.totalFailed,
          recommendations: report.recommendations
        } as any
      }
    })
  }

  /**
   * Purge old failed targets
   * Removes targets that have been in DLQ for > retention period
   */
  async purgeOldEntries(projectId: string, olderThanMs: number = 7 * 24 * 60 * 60 * 1000) {
    const threshold = new Date(Date.now() - olderThanMs)

    const result = await prisma().ruleTarget.deleteMany({
      where: {
        projectId,
        status: 'FAILED',
        lastAttempt: {
          lt: threshold
        }
      }
    })

    logger.info(`[DLQ] Purged ${result.count} old failed targets from project ${projectId}`)

    return result.count
  }
}

/**
 * Create a singleton DLQ service
 */
let dlqInstance: DLQService | null = null

export function getDLQService(): DLQService {
  if (!dlqInstance) {
    dlqInstance = new DLQService()
  }
  return dlqInstance
}
