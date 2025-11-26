import { NextRequest, NextResponse } from 'next/server';
import { prisma, Prisma } from '@calibr/db';
import { trackPerformance } from '@/lib/performance-middleware';
import { withSecurity } from '@/lib/security-headers';
import { evaluateSelector, type SelectorCondition } from '@/lib/pricing-rules/selector';
import { applyTransform, createPriceSnapshot, type Transform } from '@/lib/pricing-rules/transform';

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
 * POST /api/v1/rules/:id/preview - Preview rule execution
 */
export const POST = withSecurity(
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
      // Fetch the rule
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

        // Evaluate selector to get matching products
        const selector = rule.selectorJson as unknown as SelectorCondition;
        const transform = rule.transformJson as unknown as Transform;

        const matchedProducts = await evaluateSelector(
          prisma(),
          selector,
          access.tenantId,
          access.project.id
        );

        // Apply transforms and create targets
        const targets = matchedProducts
          .map(product => {
            if (!product.currentPrice) {
              return null; // Skip products without pricing
            }

            const before = createPriceSnapshot(product.currentPrice, product.currency || 'USD');
            const result = applyTransform(before, transform);

            return {
              productId: product.id,
              variantId: product.variantId || null,
              before: result.before,
              after: result.after,
              applied: result.applied,
              trace: result.trace,
            };
          })
          .filter((t): t is NonNullable<typeof t> => t !== null);

        // Create RuleRun and RuleTarget records for preview
        const previewRun = await prisma().$transaction(async tx => {
          // Create RuleRun
          const run = await tx.ruleRun.create({
            data: {
              tenantId: access.tenantId,
              projectId: access.project.id,
              ruleId: rule.id,
              status: 'PREVIEW',
              explainJson: {
                matchedProducts: matchedProducts.length,
                appliedTargets: targets.filter(t => t.applied).length,
                skippedTargets: targets.filter(t => !t.applied).length,
                selector: rule.selectorJson,
                transform: rule.transformJson,
              },
            },
          });

          // Create RuleTarget records (limited to avoid huge previews)
          const targetRecords = targets.slice(0, 1000).map(target => ({
            tenantId: access.tenantId,
            projectId: access.project.id,
            ruleRunId: run.id,
            productId: target.productId,
            variantId: target.variantId,
            beforeJson: target.before as unknown as Prisma.InputJsonValue,
            afterJson: target.after as unknown as Prisma.InputJsonValue,
            status: 'PREVIEW' as const,
          }));

          if (targetRecords.length > 0) {
            await tx.ruleTarget.createMany({
              data: targetRecords,
            });
          }

          // Create audit entry
          await tx.audit.create({
            data: {
              tenantId: access.tenantId,
              projectId: access.project.id,
              entity: 'RuleRun',
              entityId: run.id,
              action: 'preview',
              actor: access.userId,
              explain: {
                ruleId: rule.id,
                ruleName: rule.name,
                matchCount: targets.length,
              },
            },
          });

          return run;
        });

        // Return preview results
        return NextResponse.json({
          runId: previewRun.id,
          status: previewRun.status,
          matchedProducts: matchedProducts.length,
          targets: targets.slice(0, 100), // Return first 100 for display
          totalTargets: targets.length,
          appliedTargets: targets.filter(t => t.applied).length,
          skippedTargets: targets.filter(t => !t.applied).length,
          explain: previewRun.explainJson,
        });
      } catch (err) {
        console.error('Error previewing pricing rule:', err);
      return errorJson({
        status: 500,
        error: 'InternalServerError',
        message: 'Failed to preview pricing rule',
      });
    }
  })
);
