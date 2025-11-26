import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@calibr/db';
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
      // Verify run exists and belongs to project
      const run = await prisma().ruleRun.findFirst({
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

      // Find failed targets
      const failedTargets = await prisma().ruleTarget.findMany({
        where: {
          ruleRunId: runId,
          status: 'FAILED',
        },
      });

      if (failedTargets.length === 0) {
        return NextResponse.json({
          message: 'No failed targets to retry',
          retriedCount: 0,
        });
      }

      // Reset failed targets to QUEUED
      const result = await prisma().ruleTarget.updateMany({
        where: {
          ruleRunId: runId,
          status: 'FAILED',
        },
        data: {
          status: 'QUEUED',
          errorMessage: null,
        },
      });

      // Update run status back to QUEUED if it was FAILED
      if (run.status === 'FAILED') {
        await prisma().ruleRun.update({
          where: { id: runId },
          data: {
            status: 'QUEUED',
            errorMessage: null,
          },
        });
      }

      // Create audit entry
      await prisma().audit.create({
        data: {
          tenantId: access.project.tenantId,
          projectId: access.project.id,
          entity: 'RuleRun',
          entityId: runId,
          action: 'retry_failed',
          actor: access.session.userId,
          explain: {
            retriedTargets: result.count,
            totalFailed: failedTargets.length,
          },
        },
      });

      // Create event for worker to pick up
      await prisma().event.create({
        data: {
          tenantId: access.project.tenantId,
          projectId: access.project.id,
          kind: 'rule.run.retry',
          payload: {
            runId,
            retriedTargets: result.count,
          },
        },
      });

      return NextResponse.json({
        message: `Retried ${result.count} failed targets`,
        retriedCount: result.count,
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
  return new NextResponse(null, { status: 204 })
})

