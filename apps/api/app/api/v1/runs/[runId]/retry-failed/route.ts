import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@calibr/db';
import { DLQService } from '@calibr/automation-runner';
import { trackPerformance } from '@/lib/performance-middleware';
import { withSecurity } from '@/lib/security-headers';
import { requireProjectAccess, errorJson } from '../../../price-changes/utils';

/**
 * POST /api/v1/runs/:runId/retry-failed - Retry failed targets
 */
export const POST = withSecurity(
  trackPerformance(async (req: NextRequest, ...args: unknown[]) => {
    const context = args[0] as { params: Promise<{ runId: string }> };
    const params = await context.params;
    const runId = params.runId;

    const url = new URL(req.url);
    const projectSlug = url.searchParams.get('project')?.trim();
    if (!projectSlug) {
      return errorJson({
        status: 400,
        error: 'BadRequest',
        message: 'The `project` query parameter is required.',
      });
    }

    const access = await requireProjectAccess(req, projectSlug, 'EDITOR');
    if ('error' in access) {
      return errorJson(access.error);
    }

    try {
      const db = prisma();
      const body = await req.json().catch(() => ({}));
      const targetIds = Array.isArray(body.targetIds) ? body.targetIds : undefined;

      // Verify run exists and belongs to project
      const run = await db.ruleRun.findFirst({
        where: {
          id: runId,
          projectId: access.project.id,
          tenantId: access.project.tenantId,
        },
      });

      if (!run) {
        return errorJson({
          status: 404,
          error: 'NotFound',
          message: 'Run not found',
        });
      }

      if (run.status !== 'FAILED' && run.status !== 'PARTIAL') {
        return errorJson({
          status: 400,
          error: 'InvalidState',
          message: `Cannot retry run with status: ${run.status}`,
        });
      }

      // Retry failed targets
      const dlqService = new DLQService();
      const retriedTargets = await dlqService.retryFailed(runId, targetIds);

      // Create audit entry
      await db.audit.create({
        data: {
          tenantId: access.project.tenantId,
          projectId: access.project.id,
          entity: 'RuleRun',
          entityId: runId,
          action: 'retry_failed',
          actor: access.session.userId,
          explain: {
            retriedTargets: retriedTargets.length,
            totalFailed: retriedTargets.length,
            targetIds: targetIds ?? 'all',
          },
        },
      });

      // Create event for worker to pick up
      await db.event.create({
        data: {
          tenantId: access.project.tenantId,
          projectId: access.project.id,
          kind: 'rule.run.retry',
          payload: {
            runId,
            retriedTargets: retriedTargets.length,
            targetIds: targetIds ?? [],
          },
        },
      });

      return NextResponse.json({
        message: `Retried ${retriedTargets.length} failed targets`,
        runId,
        retriedCount: retriedTargets.length,
        targets: retriedTargets.map((t) => ({
          id: t.id,
          skuId: t.skuId,
          status: t.status,
          previousError: t.errorMessage,
        })),
      });
    } catch (err) {
      console.error('Error retrying failed targets:', err);
      return errorJson({
        status: 500,
        error: 'InternalServerError',
        message: 'Failed to retry failed targets',
      });
    }
  })
);

// Handle OPTIONS preflight requests
export const OPTIONS = withSecurity(async (_req: NextRequest) => {
  return new NextResponse(null, { status: 204 });
});
