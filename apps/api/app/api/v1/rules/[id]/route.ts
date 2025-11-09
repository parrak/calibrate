import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@calibr/db';
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

async function requireProjectAccess(req: NextRequest, projectSlug: string, minRole: string) {
  // TODO: Implement proper auth check
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
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return withSecurity(
    trackPerformance(async () => {
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
      if ('error' in access) {
        return errorJson(access.error);
      }

      try {
        const rule = await prisma().pricingRule.findFirst({
          where: {
            id: params.id,
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
    })()
  );
}

/**
 * PATCH /api/v1/rules/:id - Update pricing rule
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return withSecurity(
    trackPerformance(async () => {
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
              id: params.id,
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
            where: { id: params.id },
            data: {
              name: body.name ?? existing.name,
              description: body.description !== undefined ? body.description : existing.description,
              selectorJson: body.selectorJson ?? existing.selectorJson,
              transformJson: body.transformJson ?? existing.transformJson,
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
              },
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
    })()
  );
}

/**
 * DELETE /api/v1/rules/:id - Soft delete pricing rule
 */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  return withSecurity(
    trackPerformance(async () => {
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
      if ('error' in access) {
        return errorJson(access.error);
      }

      try {
        await prisma().$transaction(async tx => {
          // Check rule exists
          const existing = await tx.pricingRule.findFirst({
            where: {
              id: params.id,
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
            where: { id: params.id },
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
              entityId: params.id,
              action: 'delete',
              actor: access.userId,
              explain: {
                rule: {
                  id: existing.id,
                  name: existing.name,
                },
              },
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
    })()
  );
}
