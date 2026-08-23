import { describe, it, expect } from 'vitest';
import { resolveUnifiedRiskBand } from './severity-theme';

describe('resolveUnifiedRiskBand', () => {
  it('uses the validated Zarit band when the care-gap heuristic agrees or is lower', () => {
    expect(resolveUnifiedRiskBand('red', 'mild_deficit')).toEqual({ band: 'red', source: 'zarit' });
    expect(resolveUnifiedRiskBand('amber', 'sustainable')).toEqual({ band: 'amber', source: 'zarit' });
  });

  it('lets the care-gap heuristic escalate the Zarit band by exactly one step', () => {
    // Zarit says 'normal', but the hours heuristic sees a critical overload —
    // this must not silently stay 'normal', but also must not jump straight
    // to 'critical_red' off an unvalidated heuristic.
    expect(resolveUnifiedRiskBand('normal', 'critical_overload')).toEqual({
      band: 'amber',
      source: 'zarit-elevated-by-care-gap'
    });
  });

  it('never lets the care-gap heuristic push a validated red reading straight to critical', () => {
    expect(resolveUnifiedRiskBand('red', 'critical_overload')).toEqual({
      band: 'critical_red',
      source: 'zarit-elevated-by-care-gap'
    });
  });

  it('caps the unified band at critical_red even when already there', () => {
    expect(resolveUnifiedRiskBand('critical_red', 'critical_overload')).toEqual({
      band: 'critical_red',
      source: 'zarit'
    });
  });

  it('caps a care-gap-only reading below critical_red — that band requires a validated instrument', () => {
    const result = resolveUnifiedRiskBand(null, 'critical_overload');
    expect(result.band).not.toBe('critical_red');
    expect(result.band).toBe('red');
    expect(result.source).toBe('care-gap-only');
  });

  it('falls back to normal with no signal at all', () => {
    expect(resolveUnifiedRiskBand(null, null)).toEqual({ band: 'normal', source: 'none' });
  });

  it('uses the Zarit band alone when no care-gap evaluation exists', () => {
    expect(resolveUnifiedRiskBand('red', null)).toEqual({ band: 'red', source: 'zarit' });
  });
});
