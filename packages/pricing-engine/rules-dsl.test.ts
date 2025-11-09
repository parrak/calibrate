/**
 * Rules DSL Tests — M1.1: Pricing Engine MVP
 */

import { describe, it, expect } from 'vitest'
import {
  type Selector,
  type TransformDefinition,
  evaluateSelector,
  applyTransform,
  calculatePriceDiff,
} from './rules-dsl'

describe('Rules DSL', () => {
  describe('evaluateSelector', () => {
    it('should match all products with "all" selector', () => {
      const selector: Selector = {
        predicates: [{ type: 'all' }]
      }
      const context = { skuCode: 'SKU-001' }
      expect(evaluateSelector(selector, context)).toBe(true)
    })

    it('should match specific SKUs', () => {
      const selector: Selector = {
        predicates: [{ type: 'sku', skuCodes: ['SKU-001', 'SKU-002'] }]
      }
      expect(evaluateSelector(selector, { skuCode: 'SKU-001' })).toBe(true)
      expect(evaluateSelector(selector, { skuCode: 'SKU-002' })).toBe(true)
      expect(evaluateSelector(selector, { skuCode: 'SKU-003' })).toBe(false)
    })

    it('should match products by tags', () => {
      const selector: Selector = {
        predicates: [{ type: 'tag', tags: ['sale', 'featured'] }]
      }
      expect(evaluateSelector(selector, { tags: ['sale', 'featured', 'new'] })).toBe(true)
      expect(evaluateSelector(selector, { tags: ['sale'] })).toBe(true)
      expect(evaluateSelector(selector, { tags: ['new'] })).toBe(false)
      expect(evaluateSelector(selector, {})).toBe(false)
    })

    it('should match products by price range', () => {
      const selector: Selector = {
        predicates: [{ type: 'priceRange', min: 10, max: 50, currency: 'USD' }]
      }
      expect(evaluateSelector(selector, { price: 25, currency: 'USD' })).toBe(true)
      expect(evaluateSelector(selector, { price: 5, currency: 'USD' })).toBe(false)
      expect(evaluateSelector(selector, { price: 60, currency: 'USD' })).toBe(false)
      expect(evaluateSelector(selector, { price: 25, currency: 'EUR' })).toBe(false)
    })

    it('should support AND operator (default)', () => {
      const selector: Selector = {
        predicates: [
          { type: 'tag', tags: ['sale'] },
          { type: 'priceRange', min: 10, max: 50 }
        ],
        operator: 'AND'
      }
      expect(evaluateSelector(selector, { tags: ['sale'], price: 25 })).toBe(true)
      expect(evaluateSelector(selector, { tags: ['sale'], price: 5 })).toBe(false)
      expect(evaluateSelector(selector, { tags: ['new'], price: 25 })).toBe(false)
    })

    it('should support OR operator', () => {
      const selector: Selector = {
        predicates: [
          { type: 'tag', tags: ['sale'] },
          { type: 'priceRange', min: 10, max: 50 }
        ],
        operator: 'OR'
      }
      expect(evaluateSelector(selector, { tags: ['sale'], price: 5 })).toBe(true)
      expect(evaluateSelector(selector, { tags: ['new'], price: 25 })).toBe(true)
      expect(evaluateSelector(selector, { tags: ['new'], price: 5 })).toBe(false)
    })

    it('should support custom field matching', () => {
      const selector: Selector = {
        predicates: [
          { type: 'custom', field: 'category', operator: 'eq', value: 'electronics' }
        ]
      }
      expect(evaluateSelector(selector, { category: 'electronics' })).toBe(true)
      expect(evaluateSelector(selector, { category: 'clothing' })).toBe(false)
    })
  })

  describe('applyTransform', () => {
    it('should apply percentage transform', () => {
      const transform: TransformDefinition = {
        transform: { type: 'percentage', value: 10 } // +10%
      }
      expect(applyTransform(100, transform)).toBe(110)
      expect(applyTransform(50, transform)).toBe(55)
    })

    it('should apply negative percentage transform', () => {
      const transform: TransformDefinition = {
        transform: { type: 'percentage', value: -5 } // -5%
      }
      expect(applyTransform(100, transform)).toBe(95)
    })

    it('should apply absolute transform', () => {
      const transform: TransformDefinition = {
        transform: { type: 'absolute', value: 5 }
      }
      expect(applyTransform(100, transform)).toBe(105)
      expect(applyTransform(50, transform)).toBe(55)
    })

    it('should apply set transform', () => {
      const transform: TransformDefinition = {
        transform: { type: 'set', value: 99.99 }
      }
      expect(applyTransform(100, transform)).toBe(99.99)
      expect(applyTransform(50, transform)).toBe(99.99)
    })

    it('should apply multiply transform', () => {
      const transform: TransformDefinition = {
        transform: { type: 'multiply', factor: 1.2 }
      }
      expect(applyTransform(100, transform)).toBe(120)
    })

    it('should respect floor constraint', () => {
      const transform: TransformDefinition = {
        transform: { type: 'percentage', value: -10 },
        constraints: { floor: 90 }
      }
      expect(applyTransform(100, transform)).toBe(90) // Would be 90, but floor is 90
      expect(applyTransform(200, transform)).toBe(180) // Would be 180, floor doesn't apply
    })

    it('should respect ceiling constraint', () => {
      const transform: TransformDefinition = {
        transform: { type: 'percentage', value: 20 },
        constraints: { ceiling: 150 }
      }
      expect(applyTransform(100, transform)).toBe(120) // Would be 120, ceiling doesn't apply
      expect(applyTransform(200, transform)).toBe(150) // Would be 240, but ceiling is 150
    })

    it('should respect maxPctDelta constraint', () => {
      const transform: TransformDefinition = {
        transform: { type: 'percentage', value: 50 },
        constraints: { maxPctDelta: 10 }
      }
      expect(applyTransform(100, transform)).toBe(110) // Clamped to +10%
    })

    it('should apply multiple constraints', () => {
      const transform: TransformDefinition = {
        transform: { type: 'percentage', value: 50 },
        constraints: {
          floor: 90,
          ceiling: 150,
          maxPctDelta: 10
        }
      }
      expect(applyTransform(100, transform)).toBe(110) // Clamped by maxPctDelta
    })
  })

  describe('calculatePriceDiff', () => {
    it('should calculate price diff correctly', () => {
      const transform: TransformDefinition = {
        transform: { type: 'percentage', value: 10 }
      }
      const diff = calculatePriceDiff(100, transform)
      expect(diff.from).toBe(100)
      expect(diff.to).toBe(110)
      expect(diff.delta).toBe(10)
      expect(diff.deltaPct).toBe(10)
    })

    it('should handle zero current price', () => {
      const transform: TransformDefinition = {
        transform: { type: 'set', value: 50 }
      }
      const diff = calculatePriceDiff(0, transform)
      expect(diff.from).toBe(0)
      expect(diff.to).toBe(50)
      expect(diff.delta).toBe(50)
      expect(diff.deltaPct).toBe(100)
    })
  })
})

