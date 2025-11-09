/**
 * Pricing Rule Transform Engine
 * Applies price transformations with constraints
 */

export type TransformOperation = 'percent' | 'absolute' | 'set' | 'multiply';

export interface Transform {
  op: TransformOperation;
  value?: number; // For percent, absolute, set
  factor?: number; // For multiply
  floor?: number | null; // Minimum price constraint
  ceil?: number | null; // Maximum price constraint (alias: ceiling)
  ceiling?: number | null; // Maximum price constraint
  round?: 'none' | 'up' | 'down' | 'nearest' | 'nearest_99';
  precision?: number; // Decimal precision (default: 2)
}

export interface PriceSnapshot {
  unit_amount: number; // Price in cents or smallest currency unit
  currency: string;
  compare_at?: number | null; // Compare-at price
}

export interface TransformResult {
  before: PriceSnapshot;
  after: PriceSnapshot;
  applied: boolean; // False if no change needed
  reason?: string; // Explanation for no change
  trace: {
    operation: string;
    inputPrice: number;
    intermediatePrice: number;
    constraints: {
      floor?: number;
      ceiling?: number;
      applied: string[];
    };
    finalPrice: number;
  };
}

/**
 * Apply transform to a price
 */
export function applyTransform(
  priceSnapshot: PriceSnapshot,
  transform: Transform
): TransformResult {
  const inputPrice = priceSnapshot.unit_amount;
  const trace: TransformResult['trace'] = {
    operation: transform.op,
    inputPrice,
    intermediatePrice: 0,
    constraints: {
      floor: transform.floor ?? undefined,
      ceiling: transform.ceil ?? transform.ceiling ?? undefined,
      applied: [],
    },
    finalPrice: 0,
  };

  // Step 1: Apply transform operation
  const intermediatePrice = applyOperation(inputPrice, transform);
  trace.intermediatePrice = intermediatePrice;

  // Step 2: Apply constraints (floor/ceiling)
  let finalPrice = applyConstraints(intermediatePrice, transform, trace.constraints);

  // Step 3: Apply rounding
  finalPrice = applyRounding(finalPrice, transform);

  trace.finalPrice = finalPrice;

  // Check if price actually changed
  const priceChanged = Math.abs(finalPrice - inputPrice) >= 0.01;

  return {
    before: { ...priceSnapshot },
    after: {
      ...priceSnapshot,
      unit_amount: Math.round(finalPrice),
    },
    applied: priceChanged,
    reason: priceChanged ? undefined : 'Price unchanged after transform',
    trace,
  };
}

/**
 * Apply the transform operation
 */
function applyOperation(price: number, transform: Transform): number {
  switch (transform.op) {
    case 'percent': {
      if (transform.value === undefined) {
        throw new Error('Percent transform requires value');
      }
      // Value is percentage change (e.g., -10 for 10% discount)
      return price * (1 + transform.value / 100);
    }

    case 'absolute': {
      if (transform.value === undefined) {
        throw new Error('Absolute transform requires value');
      }
      // Value is absolute amount to add/subtract (in cents)
      return price + transform.value;
    }

    case 'set': {
      if (transform.value === undefined) {
        throw new Error('Set transform requires value');
      }
      // Value is the new price (in cents)
      return transform.value;
    }

    case 'multiply': {
      if (transform.factor === undefined) {
        throw new Error('Multiply transform requires factor');
      }
      // Factor is the multiplier (e.g., 1.2 for 20% markup)
      return price * transform.factor;
    }

    default:
      throw new Error(`Unknown transform operation: ${transform.op}`);
  }
}

/**
 * Apply floor and ceiling constraints
 */
function applyConstraints(
  price: number,
  transform: Transform,
  constraints: { floor?: number; ceiling?: number; applied: string[] }
): number {
  let constrainedPrice = price;

  // Apply floor (minimum)
  const floor = transform.floor;
  if (floor !== null && floor !== undefined && constrainedPrice < floor) {
    constrainedPrice = floor;
    constraints.applied.push(`floor:${floor}`);
  }

  // Apply ceiling (maximum)
  const ceiling = transform.ceil ?? transform.ceiling;
  if (ceiling !== null && ceiling !== undefined && constrainedPrice > ceiling) {
    constrainedPrice = ceiling;
    constraints.applied.push(`ceiling:${ceiling}`);
  }

  return constrainedPrice;
}

/**
 * Apply rounding strategy
 */
function applyRounding(price: number, transform: Transform): number {
  const roundingMode = transform.round ?? 'none';
  const precision = transform.precision ?? 2;

  switch (roundingMode) {
    case 'none':
      return price;

    case 'up':
      return Math.ceil(price / Math.pow(10, 2 - precision)) * Math.pow(10, 2 - precision);

    case 'down':
      return Math.floor(price / Math.pow(10, 2 - precision)) * Math.pow(10, 2 - precision);

    case 'nearest':
      return Math.round(price / Math.pow(10, 2 - precision)) * Math.pow(10, 2 - precision);

    case 'nearest_99': {
      // Round to nearest .99 (e.g., 1234 -> 1299)
      const dollars = Math.floor(price / 100);
      return dollars * 100 + 99;
    }

    default:
      return price;
  }
}

/**
 * Batch apply transforms to multiple prices
 */
export function batchApplyTransform(
  prices: PriceSnapshot[],
  transform: Transform
): TransformResult[] {
  return prices.map(price => applyTransform(price, transform));
}

/**
 * Validate transform JSON against schema
 */
export function validateTransform(transform: unknown): Transform {
  if (!transform || typeof transform !== 'object') {
    throw new Error('Transform must be an object');
  }

  const t = transform as Transform;

  if (!t.op || !['percent', 'absolute', 'set', 'multiply'].includes(t.op)) {
    throw new Error('Transform must have valid op: percent, absolute, set, or multiply');
  }

  if (['percent', 'absolute', 'set'].includes(t.op) && t.value === undefined) {
    throw new Error(`Transform op ${t.op} requires value`);
  }

  if (t.op === 'multiply' && t.factor === undefined) {
    throw new Error('Multiply transform requires factor');
  }

  // Validate constraints
  if (t.floor !== null && t.floor !== undefined && t.floor < 0) {
    throw new Error('Floor constraint must be non-negative');
  }

  const ceiling = t.ceil ?? t.ceiling;
  if (ceiling !== null && ceiling !== undefined && ceiling < 0) {
    throw new Error('Ceiling constraint must be non-negative');
  }

  if (
    t.floor !== null &&
    t.floor !== undefined &&
    ceiling !== null &&
    ceiling !== undefined &&
    t.floor > ceiling
  ) {
    throw new Error('Floor cannot be greater than ceiling');
  }

  return t;
}

/**
 * Create a price snapshot from product pricing data
 */
export function createPriceSnapshot(
  unitAmount: number,
  currency: string,
  compareAt?: number | null
): PriceSnapshot {
  return {
    unit_amount: unitAmount,
    currency,
    compare_at: compareAt,
  };
}

/**
 * Calculate percentage change
 */
export function calculatePercentageChange(before: number, after: number): number {
  if (before === 0) return 0;
  return ((after - before) / before) * 100;
}

/**
 * Format price for display
 */
export function formatPrice(cents: number, currency: string = 'USD'): string {
  const dollars = cents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(dollars);
}
