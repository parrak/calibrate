import { NextRequest, NextResponse } from 'next/server';
import { prisma, Prisma } from '@calibr/db';
import { trackPerformance } from '@/lib/performance-middleware';
import { withSecurity } from '@/lib/security-headers';
import { validateSelector } from '@/lib/pricing-rules/selector';
import { validateTransform } from '@/lib/pricing-rules/transform';

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
 * GET /api/v1/rules/:id - Get single pricing rule
 */
export const GET = withSecurity(
  trackPerformance(async (req: NextRequest, ...args: unknown[]) => {
    const context = args[0] as { params: Promise<{ id: string }> };
    const { id } = await context.params;

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
      const rule = await prisma().pricingRule.findFirst({
        where: {
          id,
          projectId: access.project.id,
          tenantId: access.tenantId,
          deletedAt: null,
        },
      });

      if (!rule) {
        return errorJson({
          status: 404,
          error: 'NotFound',
          message: 'Pricing rule not found',
        });
      }

      return NextResponse.json(rule);
    } catch (err) {
      console.error('Error fetching pricing rule:', err);
      return errorJson({
        status: 500,
        error: 'InternalServerError',
        message: 'Failed to fetch pricing rule',
      });
    }
  })
);

/**
 * PATCH /api/v1/rules/:id - Update pricing rule
 */
export const PATCH = withSecurity(
  trackPerformance(async (req: NextRequest, ...args: unknown[]) => {
    const context = args[0] as { params: Promise<{ id: string }> };
    const { id } = await context.params;

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

    // Validate selector and transform if provided
    try {
      if (body.selectorJson) {
        validateSelector(body.selectorJson);
      }
      if (body.transformJson) {
        validateTransform(body.transformJson);
      }
    } catch (err) {
      return errorJson({
        status: 400,
        error: 'ValidationError',
        message: err instanceof Error ? err.message : 'Invalid selector or transform',
      });
    }

    try {
      const rule = await prisma().$transaction(async tx => {
        // Check rule exists
        const existing = await tx.pricingRule.findFirst({
          where: {
            id,
            projectId: access.project.id,
            tenantId: access.tenantId,
            deletedAt: null,
          },
        });

        if (!existing) {
          throw new Error('NotFound');
        }

        // Update the rule
        const updated = await tx.pricingRule.update({
          where: { id },
          data: {
            name: body.name ?? existing.name,
            description: body.description !== undefined ? body.description : existing.description,
            selectorJson: (body.selectorJson ?? existing.selectorJson) as Prisma.InputJsonValue,
            transformJson: (body.transformJson ?? existing.transformJson) as Prisma.InputJsonValue,
            scheduleAt:
              body.scheduleAt !== undefined
                ? body.scheduleAt
                  ? new Date(body.scheduleAt)
                  : null
                : existing.scheduleAt,
            enabled: body.enabled !== undefined ? body.enabled : existing.enabled,
          },
        });

        // Create audit entry
        await tx.audit.create({
          data: {
            tenantId: access.tenantId,
            projectId: access.project.id,
            entity: 'PricingRule',
            entityId: updated.id,
            action: 'update',
            actor: access.userId,
            explain: {
              changes: Object.keys(body),
            } as Prisma.InputJsonValue,
          },
        });

        return updated;
      });

      return NextResponse.json(rule);
    } catch (err) {
      if (err instanceof Error && err.message === 'NotFound') {
        return errorJson({
          status: 404,
          error: 'NotFound',
          message: 'Pricing rule not found',
        });
      }
      console.error('Error updating pricing rule:', err);
      return errorJson({
        status: 500,
        error: 'InternalServerError',
        message: 'Failed to update pricing rule',
      });
    }
  })
);

/**
 * DELETE /api/v1/rules/:id - Soft delete pricing rule
 */
export const DELETE = withSecurity(
  trackPerformance(async (req: NextRequest, ...args: unknown[]) => {
    const context = args[0] as { params: Promise<{ id: string }> };
    const { id } = await context.params;

    const url = new URL(req.url);
    const projectSlug = url.searchParams.get('project')?.trim();
    if (!projectSlug) {
      return errorJson({
        status: 400,
        error: 'BadRequest',
        message: 'The `project` query parameter is required.',
      });
    }

    const access = await requireProjectAccess(req, projectSlug, 'ADMIN');
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
      await prisma().$transaction(async tx => {
        // Check rule exists
        const existing = await tx.pricingRule.findFirst({
          where: {
            id,
            projectId: access.project.id,
            tenantId: access.tenantId,
            deletedAt: null,
          },
        });

        if (!existing) {
          throw new Error('NotFound');
        }

        // Soft delete by setting deletedAt
        await tx.pricingRule.update({
          where: { id },
          data: {
            deletedAt: new Date(),
            enabled: false, // Also disable when deleted
          },
        });

        // Create audit entry
        await tx.audit.create({
          data: {
            tenantId: access.tenantId,
            projectId: access.project.id,
            entity: 'PricingRule',
            entityId: id,
            action: 'delete',
            actor: access.userId,
            explain: {
              rule: {
                id: existing.id,
                name: existing.name,
              },
            } as Prisma.InputJsonValue,
          },
        });
      });

      return NextResponse.json({ success: true }, { status: 200 });
    } catch (err) {
      if (err instanceof Error && err.message === 'NotFound') {
        return errorJson({
          status: 404,
          error: 'NotFound',
          message: 'Pricing rule not found',
        });
      }
      console.error('Error deleting pricing rule:', err);
      return errorJson({
        status: 500,
        error: 'InternalServerError',
        message: 'Failed to delete pricing rule',
      });
    }
  })
);
