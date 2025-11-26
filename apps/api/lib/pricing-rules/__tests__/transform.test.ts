import { describe, it, expect } from 'vitest';
import {
  applyTransform,
  createPriceSnapshot,
  validateTransform,
  calculatePercentageChange,
  formatPrice,
} from '../transform';

describe('Transform Engine', () => {
  describe('applyTransform', () => {
    it('should apply percentage discount', () => {
      const snapshot = createPriceSnapshot(1000, 'USD'); // $10.00
      const transform = {
        op: 'percent' as const,
        value: -10, // 10% off
      };

      const result = applyTransform(snapshot, transform);

      expect(result.applied).toBe(true);
      expect(result.after.unit_amount).toBe(900); // $9.00
      expect(result.trace.operation).toBe('percent');
      expect(result.trace.inputPrice).toBe(1000);
      expect(result.trace.finalPrice).toBe(900);
    });

    it('should apply percentage markup', () => {
      const snapshot = createPriceSnapshot(1000, 'USD');
      const transform = {
        op: 'percent' as const,
        value: 20, // 20% markup
      };

      const result = applyTransform(snapshot, transform);

      expect(result.applied).toBe(true);
      expect(result.after.unit_amount).toBe(1200); // $12.00
    });

    it('should apply absolute discount', () => {
      const snapshot = createPriceSnapshot(1500, 'USD'); // $15.00
      const transform = {
        op: 'absolute' as const,
        value: -300, // $3.00 off
      };

      const result = applyTransform(snapshot, transform);

      expect(result.applied).toBe(true);
      expect(result.after.unit_amount).toBe(1200); // $12.00
    });

    it('should set price to specific value', () => {
      const snapshot = createPriceSnapshot(1500, 'USD');
      const transform = {
        op: 'set' as const,
        value: 1999, // Set to $19.99
      };

      const result = applyTransform(snapshot, transform);

      expect(result.applied).toBe(true);
      expect(result.after.unit_amount).toBe(1999);
    });

    it('should multiply price by factor', () => {
      const snapshot = createPriceSnapshot(1000, 'USD');
      const transform = {
        op: 'multiply' as const,
        factor: 1.5,
      };

      const result = applyTransform(snapshot, transform);

      expect(result.applied).toBe(true);
      expect(result.after.unit_amount).toBe(1500);
    });

    it('should apply floor constraint', () => {
      const snapshot = createPriceSnapshot(1000, 'USD');
      const transform = {
        op: 'percent' as const,
        value: -50, // Would go to $5.00
        floor: 750, // But floor is $7.50
      };

      const result = applyTransform(snapshot, transform);

      expect(result.applied).toBe(true);
      expect(result.after.unit_amount).toBe(750);
      expect(result.trace.constraints.applied).toContain('floor:750');
    });

    it('should apply ceiling constraint', () => {
      const snapshot = createPriceSnapshot(1000, 'USD');
      const transform = {
        op: 'percent' as const,
        value: 100, // Would go to $20.00
        ceiling: 1500, // But ceiling is $15.00
      };

      const result = applyTransform(snapshot, transform);

      expect(result.applied).toBe(true);
      expect(result.after.unit_amount).toBe(1500);
      expect(result.trace.constraints.applied).toContain('ceiling:1500');
    });

    it('should round to nearest .99', () => {
      const snapshot = createPriceSnapshot(1234, 'USD'); // $12.34
      const transform = {
        op: 'set' as const,
        value: 1234,
        round: 'nearest_99' as const,
      };

      const result = applyTransform(snapshot, transform);

      expect(result.after.unit_amount).toBe(1299); // $12.99
    });

    it('should not apply if price unchanged', () => {
      const snapshot = createPriceSnapshot(1000, 'USD');
      const transform = {
        op: 'set' as const,
        value: 1000, // Same price
      };

      const result = applyTransform(snapshot, transform);

      expect(result.applied).toBe(false);
      expect(result.reason).toBe('Price unchanged after transform');
    });
  });

  describe('validateTransform', () => {
    it('should validate percent transform', () => {
      const transform = {
        op: 'percent',
        value: -10,
      };

      expect(() => validateTransform(transform)).not.toThrow();
    });

    it('should validate multiply transform', () => {
      const transform = {
        op: 'multiply',
        factor: 1.2,
      };

      expect(() => validateTransform(transform)).not.toThrow();
    });

    it('should reject missing value for percent', () => {
      const transform = {
        op: 'percent',
      };

      expect(() => validateTransform(transform)).toThrow('requires value');
    });

    it('should reject missing factor for multiply', () => {
      const transform = {
        op: 'multiply',
      };

      expect(() => validateTransform(transform)).toThrow('requires factor');
    });

    it('should reject invalid op', () => {
      const transform = {
        op: 'invalid',
        value: 10,
      };

      expect(() => validateTransform(transform)).toThrow('valid op');
    });

    it('should reject negative floor', () => {
      const transform = {
        op: 'percent',
        value: -10,
        floor: -100,
      };

      expect(() => validateTransform(transform)).toThrow('non-negative');
    });

    it('should reject floor > ceiling', () => {
      const transform = {
        op: 'percent',
        value: -10,
        floor: 2000,
        ceiling: 1000,
      };

      expect(() => validateTransform(transform)).toThrow('greater than ceiling');
    });
  });

  describe('utility functions', () => {
    it('should create price snapshot', () => {
      const snapshot = createPriceSnapshot(1299, 'USD', 1599);

      expect(snapshot.unit_amount).toBe(1299);
      expect(snapshot.currency).toBe('USD');
      expect(snapshot.compare_at).toBe(1599);
    });

    it('should calculate percentage change', () => {
      expect(calculatePercentageChange(1000, 1200)).toBe(20);
      expect(calculatePercentageChange(1000, 900)).toBe(-10);
      expect(calculatePercentageChange(0, 100)).toBe(0);
    });

    it('should format price', () => {
      expect(formatPrice(1299, 'USD')).toBe('$12.99');
      expect(formatPrice(0, 'USD')).toBe('$0.00');
      expect(formatPrice(100000, 'USD')).toBe('$1,000.00');
    });
  });
});
