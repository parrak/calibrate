/**
 * Rules Worker - Processes queued pricing rule executions
 * Polls for QUEUED RuleRuns and applies price changes to Shopify
 */

import { PrismaClient } from '@prisma/client';

const db = prisma();

interface RuleTarget {
  id: string;
  productId: string;
  variantId: string | null;
  beforeJson: {
    unit_amount: number;
    currency: string;
    compare_at?: number | null;
  };
  afterJson: {
    unit_amount: number;
    currency: string;
    compare_at?: number | null;
  };
}

interface ShopifyPriceUpdate {
  variantId: string;
  price: string;
  compareAtPrice?: string | null;
}

import { applyPriceToShopify, generateIdempotencyKey, isPriceUpdateApplied } from '@/lib/pricing-rules/shopify-integration';

/**
 * Apply price change to Shopify
 */
async function applyToShopify(
  tenantId: string,
  projectId: string,
  ruleRunId: string,
  update: ShopifyPriceUpdate
): Promise<{ success: boolean; error?: string }> {
  try {
    // Generate idempotency key
    const priceInCents = Math.round(parseFloat(update.price) * 100);
    const idempotencyKey = generateIdempotencyKey(
      tenantId,
      update.variantId,
      ruleRunId,
      priceInCents
    );

    // Check if already applied (idempotency)
    const alreadyApplied = await isPriceUpdateApplied(idempotencyKey);
    if (alreadyApplied) {
      console.log(`Price update already applied (idempotency key: ${idempotencyKey})`);
      return { success: true };
    }

    // Apply to Shopify
    const result = await applyPriceToShopify(projectId, {
      variantId: update.variantId,
      price: update.price,
      compareAtPrice: update.compareAtPrice,
    });

    return result;
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * Process a single RuleRun
 */
async function processRuleRun(runId: string): Promise<void> {
  console.log(`Processing RuleRun ${runId}...`);

  try {
    // Mark run as APPLYING
    await prisma().ruleRun.update({
      where: { id: runId },
      data: {
        status: 'APPLYING',
        startedAt: new Date(),
      },
    });

    // Fetch all QUEUED targets for this run
    const targets = (await prisma().ruleTarget.findMany({
      where: {
        ruleRunId: runId,
        status: 'QUEUED',
      },
    })) as unknown as RuleTarget[];

    console.log(`Found ${targets.length} targets to apply`);

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Process each target
    for (const target of targets) {
      try {
        // Skip targets without variantId (can't apply to Shopify)
        if (!target.variantId) {
          await prisma().ruleTarget.update({
            where: { id: target.id },
            data: {
              status: 'FAILED',
              errorMessage: 'No Shopify variant ID',
            },
          });
          errorCount++;
          errors.push(`Target ${target.id}: No Shopify variant ID`);
          continue;
        }

        // Get the run to access tenantId/projectId
        const run = await prisma().ruleRun.findUnique({
          where: { id: runId },
        });

        if (!run) {
          throw new Error('Run not found');
        }

        // Apply to Shopify
        const result = await applyToShopify(run.tenantId, run.projectId, run.id, {
          variantId: target.variantId,
          price: (target.afterJson.unit_amount / 100).toFixed(2),
          compareAtPrice: target.afterJson.compare_at
            ? (target.afterJson.compare_at / 100).toFixed(2)
            : null,
        });

        if (result.success) {
          // Update target status
          await prisma().ruleTarget.update({
            where: { id: target.id },
            data: {
              status: 'APPLIED',
            },
          });

          // Create PriceChange record
          await prisma().priceChange.create({
            data: {
              tenantId: run.tenantId,
              projectId: run.projectId,
              productId: target.productId,
              variantId: target.variantId,
              skuId: target.productId, // Using productId as fallback
              source: `rule:${run.ruleId}`,
              ruleRunId: run.id,
              fromAmount: target.beforeJson.unit_amount,
              toAmount: target.afterJson.unit_amount,
              currency: target.afterJson.currency,
              compareAtOld: target.beforeJson.compare_at || null,
              compareAtNew: target.afterJson.compare_at || null,
              status: 'APPLIED',
              appliedAt: new Date(),
              createdBy: 'rules-worker',
            },
          });

          successCount++;
        } else {
          await prisma().ruleTarget.update({
            where: { id: target.id },
            data: {
              status: 'FAILED',
              errorMessage: result.error,
            },
          });
          errorCount++;
          errors.push(`Target ${target.id}: ${result.error}`);
        }

        // Rate limit: wait between updates
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (err) {
        console.error(`Error processing target ${target.id}:`, err);
        await prisma().ruleTarget.update({
          where: { id: target.id },
          data: {
            status: 'FAILED',
            errorMessage: err instanceof Error ? err.message : 'Unknown error',
          },
        });
        errorCount++;
        errors.push(`Target ${target.id}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    // Update run status
    const finalStatus = errorCount === 0 ? 'APPLIED' : errorCount === targets.length ? 'FAILED' : 'APPLIED';

    await prisma().ruleRun.update({
      where: { id: runId },
      data: {
        status: finalStatus,
        finishedAt: new Date(),
        errorMessage: errors.length > 0 ? errors.slice(0, 10).join('; ') : null,
        explainJson: {
          ...((await prisma().ruleRun.findUnique({ where: { id: runId } }))?.explainJson as object),
          results: {
            successCount,
            errorCount,
            totalTargets: targets.length,
          },
        },
      },
    });

    console.log(`RuleRun ${runId} completed: ${successCount} success, ${errorCount} errors`);
  } catch (err) {
    console.error(`Fatal error processing RuleRun ${runId}:`, err);
    await prisma().ruleRun.update({
      where: { id: runId },
      data: {
        status: 'FAILED',
        finishedAt: new Date(),
        errorMessage: err instanceof Error ? err.message : 'Unknown fatal error',
      },
    });
  }
}

/**
 * Poll for queued runs and process them
 */
export async function pollAndProcessRuns(): Promise<void> {
  console.log('Polling for queued rule runs...');

  try {
    // Find QUEUED runs
    const queuedRuns = await prisma().ruleRun.findMany({
      where: {
        status: 'QUEUED',
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: 10, // Process max 10 runs per poll
    });

    if (queuedRuns.length === 0) {
      console.log('No queued runs found');
      return;
    }

    console.log(`Found ${queuedRuns.length} queued runs`);

    // Process each run sequentially (could parallelize with concurrency limit)
    for (const run of queuedRuns) {
      await processRuleRun(run.id);
    }
  } catch (err) {
    console.error('Error polling for rule runs:', err);
  }
}

/**
 * Start the worker (long-running process)
 */
export async function startWorker(intervalMs: number = 10000): Promise<void> {
  console.log(`Starting rules worker with interval ${intervalMs}ms`);

  // Process immediately on start
  await pollAndProcessRuns();

  // Then poll at interval
  setInterval(async () => {
    await pollAndProcessRuns();
  }, intervalMs);
}

// Allow running as standalone script
if (require.main === module) {
  console.log('Running rules worker...');
  startWorker().catch(console.error);
}
