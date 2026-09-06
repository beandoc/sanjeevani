import { describe, expect, it } from 'vitest';
import { nutritionSafetyFlags } from './nutrition-safety';

describe('nutrition safety flags', () => {
  it('flags five-percent weight loss and low intake', () => {
    const result = nutritionSafetyFlags({ currentWeightKg: 57, baselineWeightKg: 60, intakePercentLast24h: 40, dysphagiaRisk: 'possible_risk' });
    expect(result.lossPercent).toBe(5);
    expect(result.flags).toHaveLength(3);
  });
});
