/**
 * Rules DSL — M1.1: Pricing Engine MVP
 * 
 * Defines the domain-specific language for pricing rules:
 * - Selector: Predicates to match products/SKUs
 * - Transform: How to modify prices (percentage, absolute, floors/ceilings)
 * - Schedule: When to apply the rule
 */

/**
 * Selector predicates for matching products/SKUs
 */
export type SelectorPredicate =
  | { type: 'all' } // Match all products
  | { type: 'sku'; skuCodes: string[] } // Match specific SKUs
  | { type: 'tag'; tags: string[] } // Match products with tags
  | { type: 'priceRange'; min?: number; max?: number; currency?: string } // Match by price range
  | { type: 'custom'; field: string; operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains'; value: unknown } // Custom field matching

export type Selector = {
  predicates: SelectorPredicate[]
  operator?: 'AND' | 'OR' // Default: AND
}

/**
 * Transform operations
 */
export type Transform =
  | { type: 'percentage'; value: number } // Percentage change (e.g., +10%, -5%)
  | { type: 'absolute'; value: number } // Absolute change (e.g., +$5.00, -$2.50)
  | { type: 'set'; value: number } // Set to specific price
  | { type: 'multiply'; factor: number } // Multiply by factor

/**
 * Transform constraints (floors/ceilings)
 */
export type TransformConstraints = {
  floor?: number // Minimum price after transform
  ceiling?: number // Maximum price after transform
  maxPctDelta?: number // Maximum percentage change allowed
}

/**
 * Complete transform definition
 */
export type TransformDefinition = {
  transform: Transform
  constraints?: TransformConstraints
}

/**
 * Schedule definition
 */
export type Schedule = {
  type: 'immediate' | 'scheduled' | 'recurring'
  scheduledAt?: Date // For 'scheduled' type
  cron?: string // For 'recurring' type (e.g., "0 0 * * *" for daily)
  timezone?: string // Timezone for scheduling
}

/**
 * Complete pricing rule definition
 */
export type PricingRule = {
  id?: string
  name: string
  description?: string
  selector: Selector
  transform: TransformDefinition
  schedule?: Schedule
  enabled?: boolean
}

/**
 * Evaluate selector against a product/SKU
 */
export function evaluateSelector(
  selector: Selector,
  context: {
    skuCode?: string
    tags?: string[]
    price?: number
    currency?: string
    [key: string]: unknown // For custom fields
  }
): boolean {
  const { predicates, operator = 'AND' } = selector

  if (predicates.length === 0) {
    return true // Empty selector matches all
  }

  const results = predicates.map((pred) => {
    switch (pred.type) {
      case 'all':
        return true

      case 'sku':
        return pred.skuCodes.includes(context.skuCode || '')

      case 'tag':
        if (!context.tags || context.tags.length === 0) return false
        return pred.tags.some((tag) => context.tags!.includes(tag))

      case 'priceRange':
        if (context.price === undefined) return false
        if (pred.currency && context.currency !== pred.currency) return false
        if (pred.min !== undefined && context.price < pred.min) return false
        if (pred.max !== undefined && context.price > pred.max) return false
        return true

      case 'custom':
        const fieldValue = context[pred.field]
        if (fieldValue === undefined) return false

        switch (pred.operator) {
          case 'eq':
            return fieldValue === pred.value
          case 'ne':
            return fieldValue !== pred.value
          case 'gt':
            return Number(fieldValue) > Number(pred.value)
          case 'gte':
            return Number(fieldValue) >= Number(pred.value)
          case 'lt':
            return Number(fieldValue) < Number(pred.value)
          case 'lte':
            return Number(fieldValue) <= Number(pred.value)
          case 'in':
            return Array.isArray(pred.value) && pred.value.includes(fieldValue)
          case 'contains':
            return String(fieldValue).includes(String(pred.value))
          default:
            return false
        }

      default:
        return false
    }
  })

  return operator === 'AND' ? results.every((r) => r) : results.some((r) => r)
}

/**
 * Apply transform to a price
 */
export function applyTransform(
  currentPrice: number,
  transformDef: TransformDefinition
): number {
  const { transform, constraints } = transformDef
  let newPrice: number

  switch (transform.type) {
    case 'percentage':
      newPrice = currentPrice * (1 + transform.value / 100)
      break

    case 'absolute':
      newPrice = currentPrice + transform.value
      break

    case 'set':
      newPrice = transform.value
      break

    case 'multiply':
      newPrice = currentPrice * transform.factor
      break

    default:
      throw new Error(`Unknown transform type: ${(transform as any).type}`)
  }

  // Apply constraints
  if (constraints) {
    if (constraints.floor !== undefined) {
      newPrice = Math.max(newPrice, constraints.floor)
    }
    if (constraints.ceiling !== undefined) {
      newPrice = Math.min(newPrice, constraints.ceiling)
    }
    if (constraints.maxPctDelta !== undefined) {
      const deltaPct = Math.abs((newPrice - currentPrice) / currentPrice) * 100
      if (deltaPct > constraints.maxPctDelta) {
        // Clamp to max delta
        const maxDelta = currentPrice * (constraints.maxPctDelta / 100)
        if (newPrice > currentPrice) {
          newPrice = currentPrice + maxDelta
        } else {
          newPrice = currentPrice - maxDelta
        }
      }
    }
  }

  return Math.round(newPrice * 100) / 100 // Round to 2 decimal places
}

/**
 * Calculate price diff from transform
 */
export function calculatePriceDiff(
  currentPrice: number,
  transformDef: TransformDefinition
): { from: number; to: number; delta: number; deltaPct: number } {
  const to = applyTransform(currentPrice, transformDef)
  const delta = to - currentPrice
  const deltaPct = currentPrice === 0 ? (to > 0 ? 100 : 0) : (delta / currentPrice) * 100

  return {
    from: currentPrice,
    to,
    delta,
    deltaPct: Math.round(deltaPct * 100) / 100
  }
}

