import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@calibr/db';
import { trackPerformance } from '@/lib/performance-middleware';
import { withSecurity } from '@/lib/security-headers';

interface ErrorResponse {
  status: number;
  error: string;
  message: string;
}

function errorJson(error: ErrorResponse) {
  return NextResponse.json(
    { error: error.error, message: error.message },
    { status: error.status }
  );
}

async function requireProjectAccess(req: NextRequest, projectSlug: string, _minRole: string) {
  const project = await prisma().project.findUnique({
    where: { slug: projectSlug },
  });

  if (!project) {
    return {
      error: {
        status: 404,
        error: 'NotFound',
        message: 'Project not found',
      },
    };
  }

  const userId = 'system'; // Placeholder
  return {
    project,
    tenantId: project.tenantId,
    userId,
  };
}

/**
 * GET /api/v1/runs/:runId - Get run details
 */
export const GET = withSecurity(
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

    const access = await requireProjectAccess(req, projectSlug, 'VIEWER');
    if ('error' in access && access.error) {
      return errorJson(access.error);
    }
    if (!('project' in access)) {
      return errorJson({
        status: 500,
        error: 'InternalServerError',
        message: 'Failed to validate project access',
      });
    }

    try {
      const run = await prisma().ruleRun.findFirst({
        where: {
          id: runId,
          projectId: access.project.id,
          tenantId: access.tenantId,
        },
        include: {
          PricingRule: {
            select: {
              id: true,
              name: true,
              description: true,
              selectorJson: true,
              transformJson: true,
            },
          },
          RuleTarget: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      if (!run) {
        return errorJson({
          status: 404,
          error: 'NotFound',
          message: 'Run not found',
        });
      }

      // Get audit trail
      const auditEvents = await prisma().audit.findMany({
        where: {
          entity: 'RuleRun',
          entityId: runId,
          tenantId: access.tenantId,
        },
        orderBy: { createdAt: 'desc' },
      });

      // Get target status counts
      const targetCounts = await prisma().ruleTarget.groupBy({
        by: ['status'],
        where: { ruleRunId: runId },
        _count: true,
      });

      const counts = {
        QUEUED: 0,
        APPLIED: 0,
        FAILED: 0,
        PREVIEW: 0,
        ROLLED_BACK: 0,
      };

      targetCounts.forEach((tc) => {
        if (tc.status in counts) {
          counts[tc.status as keyof typeof counts] = tc._count;
        }
      });

      return NextResponse.json({
        ...run,
        targetCounts: counts,
        auditEvents,
      });
    } catch (err) {
      console.error('Error fetching run details:', err);
      return errorJson({
        status: 500,
        error: 'InternalServerError',
        message: 'Failed to fetch run details',
      });
    }
  })
);

