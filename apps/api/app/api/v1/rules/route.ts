import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@calibr/db';
import { trackPerformance } from '@/lib/performance-middleware';
import { withSecurity } from '@/lib/security-headers';
import { validateSelector } from '@/lib/pricing-rules/selector';
import { validateTransform } from '@/lib/pricing-rules/transform';

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

async function requireProjectAccess(req: NextRequest, projectSlug: string, minRole: string) {
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
 * GET /api/v1/rules - List pricing rules
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

    const enabledParam = url.searchParams.get('enabled')?.trim();
    const q = url.searchParams.get('q')?.trim();
    const cursor = url.searchParams.get('cursor')?.trim();

    const access = await requireProjectAccess(req, projectSlug, 'VIEWER');
    if ('error' in access) {
      return errorJson(access.error);
    }

    const where: {
      projectId: string;
      tenantId: string;
      deletedAt: null;
      enabled?: boolean;
      OR?: Array<{ name: { contains: string; mode: 'insensitive' } }>;
    } = {
      projectId: access.project.id,
      tenantId: access.tenantId,
      deletedAt: null,
    };

    if (enabledParam === 'true') {
      where.enabled = true;
    } else if (enabledParam === 'false') {
      where.enabled = false;
    }

    if (q) {
      where.OR = [{ name: { contains: q, mode: 'insensitive' as const } }];
    }

    const query: {
      where: typeof where;
      orderBy: { createdAt: 'desc' };
      take: number;
      cursor?: { id: string };
      skip?: number;
    } = {
      where,
      orderBy: { createdAt: 'desc' },
      take: PAGE_SIZE + 1,
    };

    if (cursor) {
      query.cursor = { id: cursor };
      query.skip = 1;
    }

    try {
      const records = await prisma().pricingRule.findMany(query);
      const hasMore = records.length > PAGE_SIZE;
      const items = hasMore ? records.slice(0, PAGE_SIZE) : records;
      const nextCursor = hasMore ? items[items.length - 1].id : null;

      return NextResponse.json({
        items,
        nextCursor,
        count: items.length,
      });
    } catch (err) {
      console.error('Error fetching pricing rules:', err);
      return errorJson({
        status: 500,
        error: 'InternalServerError',
        message: 'Failed to fetch pricing rules',
      });
    }
  })
);

/**
 * POST /api/v1/rules - Create pricing rule
 */
export const POST = withSecurity(
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

    const access = await requireProjectAccess(req, projectSlug, 'EDITOR');
    if ('error' in access) {
      return errorJson(access.error);
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return errorJson({
        status: 400,
        error: 'BadRequest',
        message: 'Invalid JSON body',
      });
    }

    // Validate required fields
    if (!body.name || typeof body.name !== 'string') {
      return errorJson({
        status: 400,
        error: 'ValidationError',
        message: 'name is required and must be a string',
      });
    }

    if (!body.selectorJson) {
      return errorJson({
        status: 400,
        error: 'ValidationError',
        message: 'selectorJson is required',
      });
    }

    if (!body.transformJson) {
      return errorJson({
        status: 400,
        error: 'ValidationError',
        message: 'transformJson is required',
      });
    }

    // Validate selector and transform
    try {
      validateSelector(body.selectorJson);
      validateTransform(body.transformJson);
    } catch (err) {
      return errorJson({
        status: 400,
        error: 'ValidationError',
        message: err instanceof Error ? err.message : 'Invalid selector or transform',
      });
    }

    try {
      const rule = await prisma().$transaction(async tx => {
        // Create the rule
        const newRule = await tx.pricingRule.create({
          data: {
            tenantId: access.tenantId,
            projectId: access.project.id,
            name: body.name,
            description: body.description || null,
            selectorJson: body.selectorJson,
            transformJson: body.transformJson,
            scheduleAt: body.scheduleAt ? new Date(body.scheduleAt) : null,
            enabled: body.enabled ?? true,
            createdBy: access.userId,
          },
        });

        // Create audit entry
        await tx.audit.create({
          data: {
            tenantId: access.tenantId,
            projectId: access.project.id,
            entity: 'PricingRule',
            entityId: newRule.id,
            action: 'create',
            actor: access.userId,
            explain: {
              rule: {
                id: newRule.id,
                name: newRule.name,
              },
            },
          },
        });

        // Create event
        await tx.event.create({
          data: {
            tenantId: access.tenantId,
            projectId: access.project.id,
            kind: 'rule.created',
            payload: {
              ruleId: newRule.id,
              name: newRule.name,
              enabled: newRule.enabled,
            },
          },
        });

        return newRule;
      });

      return NextResponse.json(rule, { status: 201 });
    } catch (err) {
      console.error('Error creating pricing rule:', err);
      return errorJson({
        status: 500,
        error: 'InternalServerError',
        message: 'Failed to create pricing rule',
      });
    }
  })
);
