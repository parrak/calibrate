/**
 * Pricing Rule Selector Engine
 * Evaluates selector predicates to match products
 */

import { PrismaClient, Product } from '@prisma/client';

export type SelectorCondition =
  | { all: true }
  | { tag: string | string[] }
  | { sku: string | string[] }
  | { price: { gt?: number; gte?: number; lt?: number; lte?: number; eq?: number; currency?: string } }
  | { field: string; op: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains' | 'startsWith' | 'endsWith'; value: unknown }
  | { and: SelectorCondition[] }
  | { or: SelectorCondition[] };

export interface ProductWithPricing extends Product {
  currentPrice?: number;
  currency?: string;
  variantId?: string;
}

/**
 * Evaluate a selector condition against products in the database
 */
export async function evaluateSelector(
  prismaClient: PrismaClient,
  selector: SelectorCondition,
  tenantId: string,
  projectId: string
): Promise<ProductWithPricing[]> {
  // Build Prisma where clause from selector
  const whereClause = buildWhereClause(selector, tenantId, projectId);

  // Execute query with pricing data
  const products = await prismaClient.product.findMany({
    where: whereClause,
    include: {
      PriceVersion: {
        where: {
          validTo: null, // Get current price version
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 1,
      },
    },
  });

  // Transform to ProductWithPricing
  return products.map(product => ({
    ...product,
    currentPrice: product.PriceVersion[0]?.unitAmount ?? undefined,
    currency: product.PriceVersion[0]?.currency || 'USD',
    variantId: extractVariantId(product.channelRefs),
  }));
}

/**
 * Build Prisma where clause from selector condition
 */
function buildWhereClause(
  condition: SelectorCondition,
  tenantId: string,
  projectId: string
): Record<string, unknown> {
  const baseWhere = {
    tenantId,
    projectId,
    active: true,
  };

  if ('all' in condition && condition.all) {
    return baseWhere;
  }

  if ('and' in condition) {
    return {
      ...baseWhere,
      AND: condition.and.map(c => buildWhereClause(c, tenantId, projectId)),
    };
  }

  if ('or' in condition) {
    return {
      ...baseWhere,
      OR: condition.or.map(c => buildWhereClause(c, tenantId, projectId)),
    };
  }

  if ('tag' in condition) {
    const tags = Array.isArray(condition.tag) ? condition.tag : [condition.tag];
    return {
      ...baseWhere,
      tags: {
        hasSome: tags,
      },
    };
  }

  if ('sku' in condition) {
    const skus = Array.isArray(condition.sku) ? condition.sku : [condition.sku];
    return {
      ...baseWhere,
      sku: {
        in: skus,
      },
    };
  }

  if ('price' in condition) {
    // Price conditions need to be handled via PriceVersion relation
    const priceWhere: Record<string, unknown>[] = [];

    if (condition.price.gt !== undefined) {
      priceWhere.push({
        PriceVersion: {
          some: {
            unitAmount: { gt: condition.price.gt },
            validTo: null,
          },
        },
      });
    }

    if (condition.price.gte !== undefined) {
      priceWhere.push({
        PriceVersion: {
          some: {
            unitAmount: { gte: condition.price.gte },
            validTo: null,
          },
        },
      });
    }

    if (condition.price.lt !== undefined) {
      priceWhere.push({
        PriceVersion: {
          some: {
            unitAmount: { lt: condition.price.lt },
            validTo: null,
          },
        },
      });
    }

    if (condition.price.lte !== undefined) {
      priceWhere.push({
        PriceVersion: {
          some: {
            unitAmount: { lte: condition.price.lte },
            validTo: null,
          },
        },
      });
    }

    if (condition.price.eq !== undefined) {
      priceWhere.push({
        PriceVersion: {
          some: {
            unitAmount: condition.price.eq,
            validTo: null,
          },
        },
      });
    }

    if (condition.price.currency) {
      priceWhere.push({
        PriceVersion: {
          some: {
            currency: condition.price.currency,
            validTo: null,
          },
        },
      });
    }

    return {
      ...baseWhere,
      AND: priceWhere,
    };
  }

  if ('field' in condition) {
    // Custom field conditions
    return {
      ...baseWhere,
      ...buildCustomFieldWhere(condition),
    };
  }

  return baseWhere;
}

/**
 * Build where clause for custom field conditions
 */
function buildCustomFieldWhere(condition: Extract<SelectorCondition, { field: string }>) {
  const { field, op, value } = condition;

  switch (op) {
    case 'eq':
      return { [field]: value };
    case 'ne':
      return { [field]: { not: value } };
    case 'gt':
      return { [field]: { gt: value } };
    case 'gte':
      return { [field]: { gte: value } };
    case 'lt':
      return { [field]: { lt: value } };
    case 'lte':
      return { [field]: { lte: value } };
    case 'in':
      return { [field]: { in: Array.isArray(value) ? value : [value] } };
    case 'contains':
      return { [field]: { contains: String(value) } };
    case 'startsWith':
      return { [field]: { startsWith: String(value) } };
    case 'endsWith':
      return { [field]: { endsWith: String(value) } };
    default:
      return {};
  }
}

/**
 * Extract variant ID from channelRefs JSON
 */
function extractVariantId(channelRefs: unknown): string | undefined {
  if (!channelRefs || typeof channelRefs !== 'object') {
    return undefined;
  }

  const refs = channelRefs as Record<string, unknown>;

  // Check for Shopify variant ID
  if (refs.shopify && typeof refs.shopify === 'object') {
    const shopify = refs.shopify as Record<string, unknown>;
    if (shopify.variantId && typeof shopify.variantId === 'string') {
      return shopify.variantId;
    }
  }

  return undefined;
}

/**
 * Validate selector JSON against schema
 */
export function validateSelector(selector: unknown): SelectorCondition {
  // Basic runtime validation
  if (!selector || typeof selector !== 'object') {
    throw new Error('Selector must be an object');
  }

  // TODO: Add JSON schema validation using selector.schema.json
  return selector as SelectorCondition;
}

/**
 * Count products matching selector (for preview)
 */
export async function countMatchingProducts(
  prismaClient: PrismaClient,
  selector: SelectorCondition,
  tenantId: string,
  projectId: string
): Promise<number> {
  const whereClause = buildWhereClause(selector, tenantId, projectId);

  return await prismaClient.product.count({
    where: whereClause,
  });
}
