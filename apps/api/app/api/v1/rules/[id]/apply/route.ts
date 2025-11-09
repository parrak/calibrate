import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@calibr/db';
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

async function requireProjectAccess(req: NextRequest, projectSlug: string, minRole: string) {
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
 * POST /api/v1/rules/:id/apply - Queue rule execution
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
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
        // Fetch the rule
        const rule = await prisma().pricingRule.findFirst({
          where: {
            id: params.id,
            projectId: access.project.id,
            tenantId: access.tenantId,
            deletedAt: null,
            enabled: true, // Only apply enabled rules
          },
        });

        if (!rule) {
          return errorJson({
            status: 404,
            error: 'NotFound',
            message: 'Pricing rule not found or not enabled',
          });
        }

        // Check if there's already a queued/applying run for this rule
        const existingRun = await prisma().ruleRun.findFirst({
          where: {
            ruleId: rule.id,
            status: {
              in: ['QUEUED', 'APPLYING'],
            },
          },
        });

        if (existingRun) {
          return errorJson({
            status: 409,
            error: 'Conflict',
            message: 'Rule already has a pending execution',
          });
        }

        // Evaluate selector to get matching products
        const selector = rule.selectorJson as SelectorCondition;
        const transform = rule.transformJson as Transform;

        const matchedProducts = await evaluateSelector(
          prisma,
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
          .filter((t): t is NonNullable<typeof t> => t !== null && t.applied); // Only keep applied changes

        if (targets.length === 0) {
          return errorJson({
            status: 400,
            error: 'NoTargets',
            message: 'No products matched or no price changes needed',
          });
        }

        // Create RuleRun and RuleTarget records for execution
        const applyRun = await prisma().$transaction(async tx => {
          // Create RuleRun
          const run = await tx.ruleRun.create({
            data: {
              tenantId: access.tenantId,
              projectId: access.project.id,
              ruleId: rule.id,
              status: 'QUEUED',
              scheduledFor: new Date(),
              explainJson: {
                matchedProducts: matchedProducts.length,
                appliedTargets: targets.length,
                selector: rule.selectorJson,
                transform: rule.transformJson,
                queuedBy: access.userId,
                queuedAt: new Date().toISOString(),
              },
            },
          });

          // Create RuleTarget records
          const targetRecords = targets.map(target => ({
            tenantId: access.tenantId,
            projectId: access.project.id,
            ruleRunId: run.id,
            productId: target.productId,
            variantId: target.variantId,
            beforeJson: target.before,
            afterJson: target.after,
            status: 'QUEUED' as const,
          }));

          await tx.ruleTarget.createMany({
            data: targetRecords,
          });

          // Create audit entry
          await tx.audit.create({
            data: {
              tenantId: access.tenantId,
              projectId: access.project.id,
              entity: 'RuleRun',
              entityId: run.id,
              action: 'apply',
              actor: access.userId,
              explain: {
                ruleId: rule.id,
                ruleName: rule.name,
                targetCount: targets.length,
              },
            },
          });

          // Create event for worker to pick up
          await tx.event.create({
            data: {
              tenantId: access.tenantId,
              projectId: access.project.id,
              kind: 'rule.apply.queued',
              payload: {
                ruleId: rule.id,
                runId: run.id,
                targetCount: targets.length,
              },
            },
          });

          return run;
        });

        // Return apply result
        return NextResponse.json({
          runId: applyRun.id,
          status: applyRun.status,
          targetCount: targets.length,
          message: 'Rule execution queued successfully',
        });
      } catch (err) {
        console.error('Error applying pricing rule:', err);
        return errorJson({
          status: 500,
          error: 'InternalServerError',
          message: 'Failed to apply pricing rule',
        });
      }
    })()
  );
}
