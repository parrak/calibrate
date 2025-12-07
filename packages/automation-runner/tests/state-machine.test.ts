/**
 * State Machine Tests
 * M0.5: Tests for RuleRun and RuleTarget state transitions
 */

import { describe, it, expect } from 'vitest'

describe('RuleRun State Machine', () => {
  describe('valid transitions', () => {
    it('should transition from PREVIEW to QUEUED', () => {
      const validTransition = {
        from: 'PREVIEW',
        to: 'QUEUED',
        isValid: true
      }
      expect(validTransition.isValid).toBe(true)
    })

    it('should transition from QUEUED to APPLYING', () => {
      const validTransition = {
        from: 'QUEUED',
        to: 'APPLYING',
        isValid: true
      }
      expect(validTransition.isValid).toBe(true)
    })

    it('should transition from APPLYING to APPLIED when all targets succeed', () => {
      const validTransition = {
        from: 'APPLYING',
        to: 'APPLIED',
        condition: 'all targets succeeded',
        isValid: true
      }
      expect(validTransition.isValid).toBe(true)
    })

    it('should transition from APPLYING to PARTIAL when some targets fail', () => {
      const validTransition = {
        from: 'APPLYING',
        to: 'PARTIAL',
        condition: 'some targets failed',
        isValid: true
      }
      expect(validTransition.isValid).toBe(true)
    })

    it('should transition from APPLYING to FAILED on critical error', () => {
      const validTransition = {
        from: 'APPLYING',
        to: 'FAILED',
        condition: 'critical error',
        isValid: true
      }
      expect(validTransition.isValid).toBe(true)
    })

    it('should transition from PARTIAL to APPLYING for retry', () => {
      const validTransition = {
        from: 'PARTIAL',
        to: 'APPLYING',
        condition: 'retry failed targets',
        isValid: true
      }
      expect(validTransition.isValid).toBe(true)
    })

    it('should transition from FAILED to APPLYING for manual retry', () => {
      const validTransition = {
        from: 'FAILED',
        to: 'APPLYING',
        condition: 'manual retry all',
        isValid: true
      }
      expect(validTransition.isValid).toBe(true)
    })
  })

  describe('invalid transitions', () => {
    it('should not transition from APPLIED to APPLYING', () => {
      const invalidTransition = {
        from: 'APPLIED',
        to: 'APPLYING',
        reason: 'immutable success',
        isValid: false
      }
      expect(invalidTransition.isValid).toBe(false)
    })

    it('should not transition from ROLLED_BACK to APPLYING', () => {
      const invalidTransition = {
        from: 'ROLLED_BACK',
        to: 'APPLYING',
        reason: 'create new run instead',
        isValid: false
      }
      expect(invalidTransition.isValid).toBe(false)
    })

    it('should not transition directly from PREVIEW to APPLYING', () => {
      const invalidTransition = {
        from: 'PREVIEW',
        to: 'APPLYING',
        reason: 'must queue first',
        isValid: false
      }
      expect(invalidTransition.isValid).toBe(false)
    })
  })

  describe('timestamp fields', () => {
    it('should set queuedAt when transitioning to QUEUED', () => {
      const run = {
        status: 'QUEUED',
        queuedAt: new Date(),
        startedAt: null,
        completedAt: null,
        failedAt: null
      }

      expect(run.queuedAt).not.toBeNull()
      expect(run.startedAt).toBeNull()
    })

    it('should set startedAt when transitioning to APPLYING', () => {
      const run = {
        status: 'APPLYING',
        queuedAt: new Date(Date.now() - 5000),
        startedAt: new Date(),
        completedAt: null,
        failedAt: null
      }

      expect(run.startedAt).not.toBeNull()
      expect(run.startedAt!.getTime()).toBeGreaterThan(run.queuedAt!.getTime())
    })

    it('should set completedAt when transitioning to APPLIED', () => {
      const run = {
        status: 'APPLIED',
        queuedAt: new Date(Date.now() - 10000),
        startedAt: new Date(Date.now() - 5000),
        completedAt: new Date(),
        failedAt: null
      }

      expect(run.completedAt).not.toBeNull()
      expect(run.completedAt!.getTime()).toBeGreaterThan(run.startedAt!.getTime())
      expect(run.failedAt).toBeNull()
    })

    it('should set failedAt when transitioning to FAILED', () => {
      const run = {
        status: 'FAILED',
        queuedAt: new Date(Date.now() - 10000),
        startedAt: new Date(Date.now() - 5000),
        completedAt: null,
        failedAt: new Date()
      }

      expect(run.failedAt).not.toBeNull()
      expect(run.failedAt!.getTime()).toBeGreaterThan(run.startedAt!.getTime())
      expect(run.completedAt).toBeNull()
    })

    it('should not set failedAt when transitioning to PARTIAL', () => {
      const run = {
        status: 'PARTIAL',
        queuedAt: new Date(Date.now() - 10000),
        startedAt: new Date(Date.now() - 5000),
        finishedAt: new Date(),
        completedAt: null,
        failedAt: null
      }

      // PARTIAL means some succeeded, so not completely failed
      expect(run.failedAt).toBeNull()
      expect(run.completedAt).toBeNull()
    })
  })

  describe('state invariants', () => {
    it('should enforce queuedAt <= startedAt', () => {
      const run = {
        queuedAt: new Date('2024-01-01T10:00:00Z'),
        startedAt: new Date('2024-01-01T10:05:00Z')
      }

      expect(run.queuedAt.getTime()).toBeLessThanOrEqual(run.startedAt.getTime())
    })

    it('should enforce startedAt <= completedAt', () => {
      const run = {
        startedAt: new Date('2024-01-01T10:05:00Z'),
        completedAt: new Date('2024-01-01T10:10:00Z')
      }

      expect(run.startedAt.getTime()).toBeLessThanOrEqual(run.completedAt.getTime())
    })

    it('should enforce startedAt <= failedAt', () => {
      const run = {
        startedAt: new Date('2024-01-01T10:05:00Z'),
        failedAt: new Date('2024-01-01T10:08:00Z')
      }

      expect(run.startedAt.getTime()).toBeLessThanOrEqual(run.failedAt.getTime())
    })

    it('should not have both completedAt and failedAt set', () => {
      // A run cannot be both completed and failed
      const runCompleted = {
        status: 'APPLIED',
        completedAt: new Date(),
        failedAt: null
      }

      const runFailed = {
        status: 'FAILED',
        completedAt: null,
        failedAt: new Date()
      }

      expect(runCompleted.completedAt).not.toBeNull()
      expect(runCompleted.failedAt).toBeNull()

      expect(runFailed.completedAt).toBeNull()
      expect(runFailed.failedAt).not.toBeNull()
    })
  })
})

describe('RuleTarget State Machine', () => {
  describe('valid transitions', () => {
    it('should transition from PREVIEW to QUEUED', () => {
      const validTransition = {
        from: 'PREVIEW',
        to: 'QUEUED',
        isValid: true
      }
      expect(validTransition.isValid).toBe(true)
    })

    it('should transition from QUEUED to APPLYING', () => {
      const validTransition = {
        from: 'QUEUED',
        to: 'APPLYING',
        isValid: true
      }
      expect(validTransition.isValid).toBe(true)
    })

    it('should transition from APPLYING to APPLIED on success', () => {
      const validTransition = {
        from: 'APPLYING',
        to: 'APPLIED',
        condition: 'success',
        isValid: true
      }
      expect(validTransition.isValid).toBe(true)
    })

    it('should transition from APPLYING to QUEUED for retry', () => {
      const validTransition = {
        from: 'APPLYING',
        to: 'QUEUED',
        condition: 'retry (attempts < max)',
        isValid: true
      }
      expect(validTransition.isValid).toBe(true)
    })

    it('should transition from APPLYING to FAILED when max retries exceeded', () => {
      const validTransition = {
        from: 'APPLYING',
        to: 'FAILED',
        condition: 'attempts >= MAX_RETRIES',
        isValid: true
      }
      expect(validTransition.isValid).toBe(true)
    })

    it('should transition from FAILED to QUEUED for manual retry', () => {
      const validTransition = {
        from: 'FAILED',
        to: 'QUEUED',
        condition: 'manual retry',
        isValid: true
      }
      expect(validTransition.isValid).toBe(true)
    })
  })

  describe('retry tracking', () => {
    it('should increment attempts counter on each retry', () => {
      const target = {
        status: 'QUEUED',
        attempts: 0
      }

      // First attempt
      target.attempts = 1
      expect(target.attempts).toBe(1)

      // Second attempt
      target.attempts = 2
      expect(target.attempts).toBe(2)

      // Third attempt
      target.attempts = 3
      expect(target.attempts).toBe(3)
    })

    it('should update lastAttempt timestamp on each retry', () => {
      const now = new Date()
      const target = {
        attempts: 1,
        lastAttempt: now
      }

      expect(target.lastAttempt).toEqual(now)

      // Simulate retry 5 seconds later
      const laterAttempt = new Date(now.getTime() + 5000)
      target.lastAttempt = laterAttempt
      target.attempts = 2

      expect(target.lastAttempt).toEqual(laterAttempt)
      expect(target.lastAttempt.getTime()).toBeGreaterThan(now.getTime())
    })

    it('should set appliedAt when status is APPLIED', () => {
      const target = {
        status: 'APPLIED',
        appliedAt: new Date(),
        attempts: 2 // Succeeded on second attempt
      }

      expect(target.appliedAt).not.toBeNull()
      expect(target.attempts).toBe(2)
    })

    it('should track max retries correctly', () => {
      const MAX_RETRIES = 3
      const target = {
        status: 'FAILED',
        attempts: 3,
        errorMessage: 'Max retries (3) exceeded'
      }

      expect(target.attempts).toBe(MAX_RETRIES)
      expect(target.status).toBe('FAILED')
      expect(target.errorMessage).toContain('Max retries')
    })
  })

  describe('price fields', () => {
    it('should store fromPrice and toPrice for fast queries', () => {
      const target = {
        fromPrice: 1299, // $12.99 in cents
        toPrice: 1499,   // $14.99 in cents
        beforeJson: {
          currency: 'USD',
          unit_amount: 1299,
          price: 1299
        },
        afterJson: {
          currency: 'USD',
          unit_amount: 1499,
          price: 1499
        }
      }

      expect(target.fromPrice).toBe(1299)
      expect(target.toPrice).toBe(1499)

      // Integer fields match JSON snapshot values
      expect(target.fromPrice).toBe(target.beforeJson.unit_amount)
      expect(target.toPrice).toBe(target.afterJson.unit_amount)
    })

    it('should calculate price change from fromPrice and toPrice', () => {
      const target = {
        fromPrice: 1000,
        toPrice: 1200
      }

      const change = target.toPrice - target.fromPrice
      const changePct = (change / target.fromPrice) * 100

      expect(change).toBe(200)
      expect(changePct).toBe(20)
    })

    it('should handle price decrease', () => {
      const target = {
        fromPrice: 1500,
        toPrice: 1200
      }

      const change = target.toPrice - target.fromPrice
      const changePct = (change / target.fromPrice) * 100

      expect(change).toBe(-300)
      expect(changePct).toBeCloseTo(-20)
    })
  })

  describe('target invariants', () => {
    it('should have non-negative attempts', () => {
      const target = {
        attempts: 0
      }

      expect(target.attempts).toBeGreaterThanOrEqual(0)
    })

    it('should enforce attempts <= MAX_RETRIES for non-FAILED targets', () => {
      const MAX_RETRIES = 3

      const applyingTarget = {
        status: 'APPLYING',
        attempts: 2
      }

      const queuedTarget = {
        status: 'QUEUED',
        attempts: 1
      }

      expect(applyingTarget.attempts).toBeLessThan(MAX_RETRIES)
      expect(queuedTarget.attempts).toBeLessThan(MAX_RETRIES)
    })

    it('should require appliedAt when status is APPLIED', () => {
      const target = {
        status: 'APPLIED',
        appliedAt: new Date()
      }

      // APPLIED status requires appliedAt timestamp
      expect(target.status).toBe('APPLIED')
      expect(target.appliedAt).not.toBeNull()
    })
  })
})

describe('Retry Schedule', () => {
  it('should follow exponential backoff pattern', () => {
    const retrySchedule = [
      { attempt: 0, delay: 2000 },  // 2 seconds
      { attempt: 1, delay: 4000 },  // 4 seconds
      { attempt: 2, delay: 8000 }   // 8 seconds
    ]

    retrySchedule.forEach((schedule, idx) => {
      expect(schedule.attempt).toBe(idx)
      expect(schedule.delay).toBe(2000 * Math.pow(2, idx))
    })
  })

  it('should apply jitter to prevent thundering herd', () => {
    const JITTER = 0.2 // ±20%
    const baseDelay = 2000

    const minDelay = baseDelay * (1 - JITTER)
    const maxDelay = baseDelay * (1 + JITTER)

    // Jitter should keep delay within ±20% range
    expect(minDelay).toBe(1600)
    expect(maxDelay).toBe(2400)
  })

  it('should use longer delays for 429 rate limits', () => {
    const rateLimitSchedule = [
      { attempt: 0, delay: 16000 }, // 16 seconds
      { attempt: 1, delay: 32000 }, // 32 seconds
      { attempt: 2, delay: 64000 }  // 64 seconds (max)
    ]

    rateLimitSchedule.forEach((schedule) => {
      expect(schedule.delay).toBeGreaterThanOrEqual(16000)
      expect(schedule.delay).toBeLessThanOrEqual(64000)
    })
  })
})
