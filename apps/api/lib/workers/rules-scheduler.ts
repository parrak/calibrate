/**
 * Rules Scheduler - Checks for scheduled pricing rules and queues them
 * Polls for rules with scheduleAt <= now() and creates RuleRuns
 */

import { prisma, Prisma } from '@calibr/db';
import { evaluateSelector, type SelectorCondition } from '@/lib/pricing-rules/selector';
import { applyTransform, createPriceSnapshot, type Transform } from '@/lib/pricing-rules/transform';

/**
 * Check for scheduled rules and queue them
 */
export async function checkScheduledRules(): Promise<void> {
  console.log('Checking for scheduled rules...');

  try {
    const now = new Date();

    // Find enabled rules with scheduleAt <= now that haven't been run yet
    const scheduledRules = await prisma().pricingRule.findMany({
      where: {
        enabled: true,
        deletedAt: null,
        scheduleAt: {
          lte: now,
        },
      },
    });

    if (scheduledRules.length === 0) {
      console.log('No scheduled rules found');
      return;
    }

    console.log(`Found ${scheduledRules.length} scheduled rules`);

    for (const rule of scheduledRules) {
      try {
        // Check if there's already a run for this schedule
        const existingRun = await prisma().ruleRun.findFirst({
          where: {
            ruleId: rule.id,
            scheduledFor: rule.scheduleAt,
            status: {
              in: ['QUEUED', 'APPLYING', 'APPLIED'],
            },
          },
        });

        if (existingRun) {
          console.log(`Rule ${rule.id} already has a run for this schedule`);
          continue;
        }

        console.log(`Queueing scheduled rule ${rule.id}: ${rule.name}`);

        // Evaluate selector to get matching products
        const selector = rule.selectorJson as unknown as SelectorCondition;
        const transform = rule.transformJson as unknown as Transform;

        const matchedProducts = await evaluateSelector(
          prisma(),
          selector,
          rule.tenantId,
          rule.projectId
        );

        // Apply transforms and create targets
        const targets = matchedProducts
          .map(product => {
            if (!product.currentPrice) {
              return null;
            }

            const before = createPriceSnapshot(product.currentPrice, product.currency || 'USD');
            const result = applyTransform(before, transform);

            return {
              productId: product.id,
              variantId: product.variantId || null,
              before: result.before,
              after: result.after,
              applied: result.applied,
            };
          })
          .filter((t): t is NonNullable<typeof t> => t !== null && t.applied);

        if (targets.length === 0) {
          console.log(`Rule ${rule.id} has no matching products or changes`);

          // Still create a run to mark it as executed
          await prisma().ruleRun.create({
            data: {
              tenantId: rule.tenantId,
              projectId: rule.projectId,
              ruleId: rule.id,
              status: 'APPLIED',
              scheduledFor: rule.scheduleAt,
              startedAt: new Date(),
              finishedAt: new Date(),
              explainJson: {
                matchedProducts: matchedProducts.length,
                appliedTargets: 0,
                reason: 'No products matched or no changes needed',
              },
            },
          });

          continue;
        }

        // Create RuleRun and RuleTarget records
        await prisma().$transaction(async tx => {
          const run = await tx.ruleRun.create({
            data: {
              tenantId: rule.tenantId,
              projectId: rule.projectId,
              ruleId: rule.id,
              status: 'QUEUED',
              scheduledFor: rule.scheduleAt,
              explainJson: {
                matchedProducts: matchedProducts.length,
                appliedTargets: targets.length,
                scheduledBy: 'scheduler',
                scheduledAt: now.toISOString(),
              },
            },
          });

          // Create RuleTarget records
          const targetRecords = targets.map(target => ({
            tenantId: rule.tenantId,
            projectId: rule.projectId,
            ruleRunId: run.id,
            productId: target.productId,
            variantId: target.variantId,
            beforeJson: target.before as unknown as Prisma.InputJsonValue,
            afterJson: target.after as unknown as Prisma.InputJsonValue,
            status: 'QUEUED' as const,
          }));

          await tx.ruleTarget.createMany({
            data: targetRecords,
          });

          // Create audit entry
          await tx.audit.create({
            data: {
              tenantId: rule.tenantId,
              projectId: rule.projectId,
              entity: 'RuleRun',
              entityId: run.id,
              action: 'schedule',
              actor: 'scheduler',
              explain: {
                ruleId: rule.id,
                ruleName: rule.name,
                scheduledFor: rule.scheduleAt?.toISOString(),
                targetCount: targets.length,
              },
            },
          });

          // Create event
          await tx.event.create({
            data: {
              tenantId: rule.tenantId,
              projectId: rule.projectId,
              kind: 'rule.scheduled.queued',
              payload: {
                ruleId: rule.id,
                runId: run.id,
                scheduledFor: rule.scheduleAt?.toISOString(),
                targetCount: targets.length,
              },
            },
          });

          console.log(`Created run ${run.id} with ${targets.length} targets`);
        });

        // Clear the scheduleAt to prevent re-queuing (one-shot schedule)
        // For recurring schedules, this would be updated to next occurrence
        await prisma().pricingRule.update({
          where: { id: rule.id },
          data: {
            scheduleAt: null,
          },
        });
      } catch (err) {
        console.error(`Error queueing scheduled rule ${rule.id}:`, err);
      }
    }
  } catch (err) {
    console.error('Error checking scheduled rules:', err);
  }
}

/**
 * Start the scheduler (long-running process)
 */
export async function startScheduler(intervalMs: number = 60000): Promise<void> {
  console.log(`Starting rules scheduler with interval ${intervalMs}ms`);

  // Check immediately on start
  await checkScheduledRules();

  // Then check at interval
  setInterval(async () => {
    await checkScheduledRules();
  }, intervalMs);
}

// Allow running as standalone script
if (require.main === module) {
  console.log('Running rules scheduler...');
  startScheduler().catch(console.error);
}
