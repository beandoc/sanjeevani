import { describe, expect, it } from 'vitest';
import { calculateBraden, calculateFourAt, calculatePainad } from './clinical-assessments';

describe('clinical assessment arithmetic', () => {
  it('marks acute change in 4AT as urgent clinician review', () => {
    expect(calculateFourAt({ alertness: 0, amt4Errors: 0, monthsBackwards: 0, acuteChange: true })).toEqual({ score: 4, needsClinicalReview: true, urgent: true });
  });
  it('maps Braden score thresholds without treating them as diagnosis', () => {
    expect(calculateBraden([1, 1, 1, 1, 1, 1])).toEqual({ score: 6, band: 'very_high' });
  });
  it('flags PAINAD scores of two or more for review', () => {
    expect(calculatePainad([0, 1, 0, 1, 0])).toEqual({ score: 2, needsReview: true });
  });
});
