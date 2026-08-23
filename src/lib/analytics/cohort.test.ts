import { describe, it, expect } from 'vitest';
import { summarizeCohort, type CohortRow } from './cohort';

function makeRow(overrides: Partial<CohortRow>): CohortRow {
  return {
    patientUid: 'p1',
    displayName: 'Test Patient',
    riskBand: 'stable',
    burdenTrendPerMonth: null,
    latestBurdenPct: null,
    hasRedFlag: false,
    latestAssessmentAgeDays: null,
    latestTier: null,
    latestCompletedAt: null,
    ...overrides
  };
}

describe('summarizeCohort', () => {
  it('counts patients per risk band', () => {
    const rows = [
      makeRow({ riskBand: 'critical' }),
      makeRow({ riskBand: 'critical' }),
      makeRow({ riskBand: 'stable' })
    ];
    const summary = summarizeCohort(rows);
    expect(summary.totalPatients).toBe(3);
    expect(summary.byRiskBand.critical).toBe(2);
    expect(summary.byRiskBand.stable).toBe(1);
    expect(summary.byRiskBand.deteriorating).toBe(0);
  });

  it('counts red flags independently of risk band', () => {
    const rows = [makeRow({ riskBand: 'stable', hasRedFlag: false }), makeRow({ riskBand: 'critical', hasRedFlag: true })];
    expect(summarizeCohort(rows).redFlagCount).toBe(1);
  });

  it('treats a patient with no assessment at all as due for reassessment', () => {
    const rows = [makeRow({ latestTier: null, latestCompletedAt: null })];
    expect(summarizeCohort(rows).reassessmentDueCount).toBe(1);
  });

  it('treats a recent ZBI-22 assessment as not yet due', () => {
    const rows = [
      makeRow({ latestTier: 'ZBI22', latestCompletedAt: new Date().toISOString() })
    ];
    expect(summarizeCohort(rows).reassessmentDueCount).toBe(0);
  });

  it('treats a stale ZBI-4 assessment as due sooner than a fresh ZBI-22', () => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const rows = [
      makeRow({ patientUid: 'p1', latestTier: 'ZBI4', latestCompletedAt: thirtyDaysAgo }),
      makeRow({ patientUid: 'p2', latestTier: 'ZBI22', latestCompletedAt: thirtyDaysAgo })
    ];
    const summary = summarizeCohort(rows);
    expect(summary.reassessmentDueCount).toBe(1);
  });

  it('returns zero counts for an empty roster', () => {
    const summary = summarizeCohort([]);
    expect(summary.totalPatients).toBe(0);
    expect(summary.redFlagCount).toBe(0);
    expect(summary.reassessmentDueCount).toBe(0);
  });
});
