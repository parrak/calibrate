import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@calibr/db';
import { trackPerformance } from '@/lib/performance-middleware';
import { withSecurity } from '@/lib/security-headers';

const PAGE_SIZE = 50;

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
  // TODO: Implement proper auth check
  // For now, just find the project
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

  // TODO: Get user from session and check membership/role
  const userId = 'system'; // Placeholder

  return {
    project,
    tenantId: project.tenantId,
    userId,
  };
}

/**
 * GET /api/v1/runs - List rule runs
 */
export const GET = withSecurity(
  trackPerformance(async (req: NextRequest) => {
    const url = new URL(req.url);
    const projectSlug = url.searchParams.get('project')?.trim();
    if (!projectSlug) {
      return errorJson({
        status: 400,
        error: 'BadRequest',
        message: 'The `project` query parameter is required.',
      });
    }

    const statusParam = url.searchParams.get('status')?.trim();
    const ruleIdParam = url.searchParams.get('ruleId')?.trim();
    const cursor = url.searchParams.get('cursor')?.trim();

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

    const where: {
      projectId: string;
      tenantId: string;
      status?: string;
      ruleId?: string;
    } = {
      projectId: access.project.id,
      tenantId: access.tenantId,
    };

    if (statusParam && ['PREVIEW', 'QUEUED', 'APPLYING', 'APPLIED', 'FAILED', 'ROLLED_BACK'].includes(statusParam)) {
      where.status = statusParam;
    }

    if (ruleIdParam) {
      where.ruleId = ruleIdParam;
    }

    const query: {
      where: typeof where;
      orderBy: { createdAt: 'desc' };
      take: number;
      cursor?: { id: string };
      skip?: number;
      include: {
        PricingRule: {
          select: {
            id: true;
            name: true;
          };
        };
        _count: {
          select: {
            RuleTarget: true;
          };
        };
      };
    } = {
      where,
      orderBy: { createdAt: 'desc' },
      take: PAGE_SIZE + 1,
      include: {
        PricingRule: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            RuleTarget: true,
          },
        },
      },
    };

    if (cursor) {
      query.cursor = { id: cursor };
      query.skip = 1;
    }

    try {
      const records = await prisma().ruleRun.findMany(query);
      const hasMore = records.length > PAGE_SIZE;
      const items = hasMore ? records.slice(0, PAGE_SIZE) : records;
      const nextCursor = hasMore ? items[items.length - 1].id : null;

      // Get target status counts for each run
      const runsWithCounts = await Promise.all(
        items.map(async (run) => {
          const targetCounts = await prisma().ruleTarget.groupBy({
            by: ['status'],
            where: { ruleRunId: run.id },
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

          return {
            ...run,
            targetCounts: counts,
            totalTargets: run._count.RuleTarget,
          };
        })
      );

      return NextResponse.json({
        items: runsWithCounts,
        nextCursor,
        count: runsWithCounts.length,
      });
    } catch (err) {
      console.error('Error fetching rule runs:', err);
      return errorJson({
        status: 500,
        error: 'InternalServerError',
        message: 'Failed to fetch rule runs',
      });
    }
  })
);

// Handle OPTIONS preflight requests
export const OPTIONS = withSecurity(async (_req: NextRequest) => {
  return new NextResponse(null, { status: 204 })
})

