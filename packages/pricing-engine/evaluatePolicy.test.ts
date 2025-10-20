import { describe, it, expect } from 'vitest'
import { evaluatePolicy } from './evaluatePolicy'

describe('evaluatePolicy', () => {
  it('should pass when within max percentage delta', () => {
    const result = evaluatePolicy(1000, 1100, { maxPctDelta: 0.15 })
    expect(result.ok).toBe(true)
    expect(result.checks).toHaveLength(1)
    expect(result.checks[0].name).toBe('maxPctDelta')
    expect(result.checks[0].ok).toBe(true)
  })

  it('should fail when exceeding max percentage delta', () => {
    const result = evaluatePolicy(1000, 1300, { maxPctDelta: 0.15 })
    expect(result.ok).toBe(false)
    expect(result.checks[0].ok).toBe(false)
  })

  it('should pass when above floor', () => {
    const result = evaluatePolicy(1000, 1200, { floor: 1000 })
    expect(result.ok).toBe(true)
    expect(result.checks[0].name).toBe('floor')
    expect(result.checks[0].ok).toBe(true)
  })

  it('should fail when below floor', () => {
    const result = evaluatePolicy(1000, 800, { floor: 1000 })
    expect(result.ok).toBe(false)
    expect(result.checks[0].ok).toBe(false)
  })

  it('should pass when below ceiling', () => {
    const result = evaluatePolicy(1000, 1200, { ceiling: 1500 })
    expect(result.ok).toBe(true)
    expect(result.checks[0].name).toBe('ceiling')
    expect(result.checks[0].ok).toBe(true)
  })

  it('should fail when above ceiling', () => {
    const result = evaluatePolicy(1000, 1600, { ceiling: 1500 })
    expect(result.ok).toBe(false)
    expect(result.checks[0].ok).toBe(false)
  })

  it('should handle zero current amount', () => {
    const result = evaluatePolicy(0, 100, { maxPctDelta: 0.5 })
    expect(result.ok).toBe(true)
    expect(result.checks[0].deltaPct).toBe(1)
  })

  it('should check daily budget', () => {
    const result = evaluatePolicy(1000, 1200, { 
      dailyBudgetPct: 0.25, 
      dailyBudgetUsedPct: 0.1 
    })
    expect(result.ok).toBe(true)
    expect(result.checks[0].name).toBe('dailyBudget')
    expect(result.checks[0].remaining).toBe(0.15)
  })

  it('should fail when exceeding daily budget', () => {
    const result = evaluatePolicy(1000, 1400, { 
      dailyBudgetPct: 0.25, 
      dailyBudgetUsedPct: 0.2 
    })
    expect(result.ok).toBe(false)
    expect(result.checks[0].ok).toBe(false)
  })

  it('should pass all checks when all conditions are met', () => {
    const result = evaluatePolicy(1000, 1100, {
      maxPctDelta: 0.15,
      floor: 900,
      ceiling: 1200,
      dailyBudgetPct: 0.25,
      dailyBudgetUsedPct: 0.05
    })
    expect(result.ok).toBe(true)
    expect(result.checks).toHaveLength(4)
    expect(result.checks.every(c => c.ok)).toBe(true)
  })

  it('should fail if any check fails', () => {
    const result = evaluatePolicy(1000, 1200, {
      maxPctDelta: 0.15,
      floor: 1100,
      ceiling: 1200
    })
    expect(result.ok).toBe(false)
    expect(result.checks.some(c => !c.ok)).toBe(true)
  })
})
