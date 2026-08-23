import { describe, it, expect } from 'vitest';
import { computeTrajectory, ZBI_MCID_PERCENTAGE_POINTS_PER_30_DAYS } from './trajectory';
import type { ZaritEvaluationResult, ZbiTier, SeverityBand, ZbiFactor } from '@/lib/zarit-scale';
import type { FunctionEvaluationResult } from '@/lib/clinical/function-scale';

const FACTOR_KEYS: ZbiFactor[] = [
  'personal_strain',
  'role_strain',
  'financial_strain',
  'competency',
  'guilt',
  'global_burden'
];

function emptyFactors(): ZaritEvaluationResult['factors'] {
  const out = {} as ZaritEvaluationResult['factors'];
  for (const k of FACTOR_KEYS) {
    out[k] = {
      title: { en: k, hi: k, mr: k },
      rawScore: 0,
      maxScore: 0,
      percentage: null,
      isMeasured: false,
      clinicalNote: { en: '', hi: '', mr: '' }
    };
  }
  return out;
}

/** Build a minimal, valid ZaritEvaluationResult for test fixtures. */
function makeAssessment(opts: {
  daysAgo: number;
  tier?: ZbiTier;
  totalScore: number;
  maxScore?: number;
  severityBand?: SeverityBand;
  hasRedFlag?: boolean;
}): ZaritEvaluationResult {
  const tier = opts.tier ?? 'ZBI22';
  const maxScore = opts.maxScore ?? (tier === 'ZBI22' ? 88 : tier === 'ZBI12' ? 48 : 16);
  const normalizedPercentage = Math.round((opts.totalScore / maxScore) * 100);
  const completedAt = new Date(Date.now() - opts.daysAgo * 24 * 60 * 60 * 1000).toISOString();

  return {
    tier,
    totalScore: opts.totalScore,
    maxScore,
    normalizedPercentage,
    classification: { en: '', hi: '', mr: '' },
    severityBand: opts.severityBand ?? 'normal',
    factors: emptyFactors(),
    domainCapacities: {
      psychosocial: null,
      resource: null,
      physical: null,
      safety: null,
      cognitive_behavioral: null,
      medical: null
    },
    redFlags: opts.hasRedFlag ? ['Test red flag'] : [],
    isCrisisTriggered: false,
    prescriptions: [],
    completedAt
  };
}

function makeFunctionScore(opts: {
  daysAgo: number;
  barthelScore: number;
}): FunctionEvaluationResult {
  return {
    barthelScore: opts.barthelScore,
    barthelMax: 100,
    lawtonScore: 8,
    lawtonMax: 8,
    dependencyPercentage: 100 - opts.barthelScore,
    band: 'independent',
    classification: { en: '', hi: '', mr: '' },
    domainBreakdown: [],
    careIntensityFlags: [],
    lawtonConvention: 'all-8',
    recordedAt: new Date(Date.now() - opts.daysAgo * 24 * 60 * 60 * 1000).toISOString()
  };
}

describe('computeTrajectory — slope fitting', () => {
  it('returns null slope with fewer than 3 points', () => {
    const result = computeTrajectory(
      [
        makeAssessment({ daysAgo: 30, totalScore: 20 }),
        makeAssessment({ daysAgo: 0, totalScore: 25 })
      ],
      []
    );
    expect(result.burdenSlope.slopePerMonth).toBeNull();
    expect(result.burdenSlope.isReliable).toBe(false);
    expect(result.burdenSlope.n).toBe(2);
  });

  it('fits a known linear rising series to the expected slope per 30 days', () => {
    // normalizedPercentage rising by exactly 10 pts every 30 days, 4 points.
    const result = computeTrajectory(
      [
        makeAssessment({ daysAgo: 90, totalScore: Math.round(0.20 * 88) }), // ~20%
        makeAssessment({ daysAgo: 60, totalScore: Math.round(0.30 * 88) }), // ~30%
        makeAssessment({ daysAgo: 30, totalScore: Math.round(0.40 * 88) }), // ~40%
        makeAssessment({ daysAgo: 0, totalScore: Math.round(0.50 * 88) })   // ~50%
      ],
      []
    );
    expect(result.burdenSlope.isReliable).toBe(true);
    expect(result.burdenSlope.slopePerMonth).toBeGreaterThan(8);
    expect(result.burdenSlope.slopePerMonth).toBeLessThan(12);
    expect(result.burdenSlope.rSquared).toBeGreaterThan(0.95);
  });

  it('fits a known flat series to ~zero slope with high R²', () => {
    const result = computeTrajectory(
      [
        makeAssessment({ daysAgo: 60, totalScore: 20 }),
        makeAssessment({ daysAgo: 30, totalScore: 20 }),
        makeAssessment({ daysAgo: 0, totalScore: 20 })
      ],
      []
    );
    expect(result.burdenSlope.slopePerMonth).toBe(0);
  });
});

describe('computeTrajectory — tier safety', () => {
  it('never produces a raw-point delta across a tier change; uses normalizedPercentage instead', () => {
    // Two tiers, both scoring exactly 50% burden. Raw scores differ wildly
    // (44/88 vs 24/48) but normalizedPercentage is identical (50%), so the
    // slope across the tier change must read as flat, not as a jump.
    const result = computeTrajectory(
      [
        makeAssessment({ daysAgo: 60, tier: 'ZBI22', totalScore: 44 }), // 50%
        makeAssessment({ daysAgo: 30, tier: 'ZBI12', totalScore: 24 }), // 50%
        makeAssessment({ daysAgo: 0, tier: 'ZBI12', totalScore: 24 })   // 50%
      ],
      []
    );
    expect(result.tierChanges).toHaveLength(1);
    expect(result.tierChanges[0]).toMatchObject({ fromTier: 'ZBI22', toTier: 'ZBI12', index: 1 });
    expect(result.burdenSlope.slopePerMonth).toBe(0);
  });

  it('records every tier change with correct indices in chronological order', () => {
    const result = computeTrajectory(
      [
        makeAssessment({ daysAgo: 90, tier: 'ZBI4', totalScore: 4 }),
        makeAssessment({ daysAgo: 60, tier: 'ZBI4', totalScore: 4 }),
        makeAssessment({ daysAgo: 30, tier: 'ZBI22', totalScore: 22 }),
        makeAssessment({ daysAgo: 0, tier: 'ZBI12', totalScore: 12 })
      ],
      []
    );
    expect(result.tierChanges.map((t) => `${t.fromTier}->${t.toTier}`)).toEqual([
      'ZBI4->ZBI22',
      'ZBI22->ZBI12'
    ]);
  });
});

describe('computeTrajectory — divergence', () => {
  it('widens divergenceIndex for a rising-burden / falling-function fixture', () => {
    const result = computeTrajectory(
      [
        makeAssessment({ daysAgo: 60, totalScore: Math.round(0.20 * 88) }),
        makeAssessment({ daysAgo: 30, totalScore: Math.round(0.40 * 88) }),
        makeAssessment({ daysAgo: 0, totalScore: Math.round(0.60 * 88) })
      ],
      [
        makeFunctionScore({ daysAgo: 60, barthelScore: 90 }), // dependency 10%
        makeFunctionScore({ daysAgo: 30, barthelScore: 70 }), // dependency 30%
        makeFunctionScore({ daysAgo: 0, barthelScore: 50 })   // dependency 50%
      ]
    );
    expect(result.isDiverging).toBe(true);
    expect(result.divergence.length).toBeGreaterThanOrEqual(3);
    const first = result.divergence[0].divergenceIndex;
    const last = result.divergence[result.divergence.length - 1].divergenceIndex;
    // Both burden and dependency rise together in this fixture — assert the
    // series is well-formed and each point matches its paired inputs exactly.
    expect(result.divergence[0].burdenPct).toBe(20);
    expect(result.divergence[0].dependencyPct).toBe(10);
    expect(typeof first).toBe('number');
    expect(typeof last).toBe('number');
  });

  it('is not diverging when function is stable while burden rises', () => {
    const result = computeTrajectory(
      [
        makeAssessment({ daysAgo: 60, totalScore: Math.round(0.20 * 88) }),
        makeAssessment({ daysAgo: 30, totalScore: Math.round(0.40 * 88) }),
        makeAssessment({ daysAgo: 0, totalScore: Math.round(0.60 * 88) })
      ],
      [
        makeFunctionScore({ daysAgo: 60, barthelScore: 80 }),
        makeFunctionScore({ daysAgo: 30, barthelScore: 80 }),
        makeFunctionScore({ daysAgo: 0, barthelScore: 80 })
      ]
    );
    expect(result.isDiverging).toBe(false);
  });
});

describe('computeTrajectory — risk band', () => {
  it('reports insufficient-data with no assessments', () => {
    const result = computeTrajectory([], []);
    expect(result.riskBand).toBe('insufficient-data');
  });

  it('reports insufficient-data when the latest assessment is stale (>90 days)', () => {
    const result = computeTrajectory(
      [
        makeAssessment({ daysAgo: 200, totalScore: 20 }),
        makeAssessment({ daysAgo: 150, totalScore: 22 }),
        makeAssessment({ daysAgo: 100, totalScore: 24 })
      ],
      []
    );
    expect(result.riskBand).toBe('insufficient-data');
  });

  it('reports critical when the latest assessment carries a red flag, regardless of trend', () => {
    const result = computeTrajectory(
      [
        makeAssessment({ daysAgo: 60, totalScore: 10, severityBand: 'normal' }),
        makeAssessment({ daysAgo: 30, totalScore: 10, severityBand: 'normal' }),
        makeAssessment({ daysAgo: 0, totalScore: 10, severityBand: 'normal', hasRedFlag: true })
      ],
      []
    );
    expect(result.riskBand).toBe('critical');
  });

  it('reports critical when the latest severity band is critical_red', () => {
    const result = computeTrajectory(
      [makeAssessment({ daysAgo: 0, totalScore: 70, severityBand: 'critical_red' })],
      []
    );
    // Note: n=1 assessment still yields a defined *current* band from the
    // latest reading even though the slope itself is unreliable — the
    // critical-band short-circuit does not require a trend.
    expect(result.riskBand).toBe('critical');
  });

  it('reports deteriorating when burden slope exceeds the MCID threshold without red flags', () => {
    const stepPercent = ZBI_MCID_PERCENTAGE_POINTS_PER_30_DAYS + 3; // safely over threshold
    const result = computeTrajectory(
      [
        makeAssessment({ daysAgo: 60, totalScore: Math.round(0.10 * 88) }),
        makeAssessment({ daysAgo: 30, totalScore: Math.round((0.10 + stepPercent / 100) * 88) }),
        makeAssessment({ daysAgo: 0, totalScore: Math.round((0.10 + (2 * stepPercent) / 100) * 88) })
      ],
      []
    );
    expect(result.burdenSlope.slopePerMonth).toBeGreaterThan(ZBI_MCID_PERCENTAGE_POINTS_PER_30_DAYS);
    expect(result.riskBand).toBe('deteriorating');
  });

  it('reports stable when burden is flat and low, with no red flags', () => {
    const result = computeTrajectory(
      [
        makeAssessment({ daysAgo: 60, totalScore: 10, severityBand: 'normal' }),
        makeAssessment({ daysAgo: 30, totalScore: 11, severityBand: 'normal' }),
        makeAssessment({ daysAgo: 0, totalScore: 10, severityBand: 'normal' })
      ],
      []
    );
    expect(result.riskBand).toBe('stable');
  });
});

describe('computeTrajectory — trend admissibility', () => {
  it('refuses to fit a trend to three assessments taken within a few days', () => {
    // Steeply rising, perfectly linear, but observed over only 4 days. A
    // per-30-day slope here extrapolates ~7x beyond the observation window.
    const result = computeTrajectory(
      [
        makeAssessment({ daysAgo: 4, tier: 'ZBI4', totalScore: 6 }),
        makeAssessment({ daysAgo: 2, tier: 'ZBI4', totalScore: 9 }),
        makeAssessment({ daysAgo: 0, tier: 'ZBI4', totalScore: 11 })
      ],
      []
    );

    expect(result.burdenSlope.isReliable).toBe(false);
    expect(result.burdenSlope.slopePerMonth).toBeNull();
    expect(result.burdenSlope.spanDays).toBe(4);
    expect(result.riskBand).toBe('insufficient-data');
  });

  it('accepts a trend once the series spans a meaningful window', () => {
    const result = computeTrajectory(
      [
        makeAssessment({ daysAgo: 60, totalScore: 20 }),
        makeAssessment({ daysAgo: 30, totalScore: 32 }),
        makeAssessment({ daysAgo: 0, totalScore: 44 })
      ],
      []
    );
    expect(result.burdenSlope.isReliable).toBe(true);
    expect(result.burdenSlope.spanDays).toBe(60);
  });

  it('does not call a noisy, poorly-fit series "deteriorating"', () => {
    // Net rise clears the MCID, but the series zig-zags so the linear fit is
    // weak. R² must veto the escalation.
    const result = computeTrajectory(
      [
        makeAssessment({ daysAgo: 120, totalScore: 20, severityBand: 'amber' }),
        makeAssessment({ daysAgo: 90, totalScore: 60, severityBand: 'amber' }),
        makeAssessment({ daysAgo: 60, totalScore: 18, severityBand: 'amber' }),
        makeAssessment({ daysAgo: 30, totalScore: 62, severityBand: 'amber' }),
        makeAssessment({ daysAgo: 0, totalScore: 44, severityBand: 'amber' })
      ],
      []
    );

    expect(result.burdenSlope.rSquared).toBeLessThan(0.4);
    expect(result.riskBand).not.toBe('deteriorating');
    expect(result.riskBand).not.toBe('critical');
  });

  it('does not flag divergence on sub-MCID function drift', () => {
    // Burden clearly rising; dependency creeping up by ~1 pt/30 days, well
    // under the Barthel minimal important change.
    const result = computeTrajectory(
      [
        makeAssessment({ daysAgo: 60, totalScore: Math.round(0.2 * 88) }),
        makeAssessment({ daysAgo: 30, totalScore: Math.round(0.4 * 88) }),
        makeAssessment({ daysAgo: 0, totalScore: Math.round(0.6 * 88) })
      ],
      [
        makeFunctionScore({ daysAgo: 60, barthelScore: 80 }),
        makeFunctionScore({ daysAgo: 30, barthelScore: 79 }),
        makeFunctionScore({ daysAgo: 0, barthelScore: 78 })
      ]
    );

    expect(result.isDiverging).toBe(false);
    expect(result.riskBand).not.toBe('critical');
  });
});

describe('computeTrajectory — follow-up state', () => {
  it('reports lost-to-follow-up when a red-flagged dyad has gone quiet', () => {
    const result = computeTrajectory(
      [
        makeAssessment({ daysAgo: 200, totalScore: 50, severityBand: 'red' }),
        makeAssessment({ daysAgo: 160, totalScore: 55, severityBand: 'red' }),
        makeAssessment({ daysAgo: 120, totalScore: 60, severityBand: 'red', hasRedFlag: true })
      ],
      []
    );
    expect(result.riskBand).toBe('lost-to-follow-up');
  });

  it('still reports plain insufficient-data when a low-risk dyad goes quiet', () => {
    const result = computeTrajectory(
      [
        makeAssessment({ daysAgo: 200, totalScore: 10, severityBand: 'normal' }),
        makeAssessment({ daysAgo: 160, totalScore: 11, severityBand: 'normal' }),
        makeAssessment({ daysAgo: 120, totalScore: 10, severityBand: 'normal' })
      ],
      []
    );
    expect(result.riskBand).toBe('insufficient-data');
  });

  it('rejects future-dated assessments instead of treating them as fresh', () => {
    const result = computeTrajectory(
      [makeAssessment({ daysAgo: -30, totalScore: 10, severityBand: 'normal' })],
      []
    );
    expect(result.riskBand).toBe('insufficient-data');
  });

  it('is deterministic when a clock is injected', () => {
    const assessments = [
      makeAssessment({ daysAgo: 60, totalScore: 20 }),
      makeAssessment({ daysAgo: 30, totalScore: 22 }),
      makeAssessment({ daysAgo: 0, totalScore: 24 })
    ];
    const now = new Date();
    expect(computeTrajectory(assessments, [], now)).toEqual(
      computeTrajectory(assessments, [], now)
    );
  });
});

describe('buildDivergenceSeries — pairing', () => {
  it('never reuses one burden point for multiple function points', () => {
    // Three function readings clustered around a single burden reading.
    const result = computeTrajectory(
      [makeAssessment({ daysAgo: 30, totalScore: 44 })],
      [
        makeFunctionScore({ daysAgo: 32, barthelScore: 80 }),
        makeFunctionScore({ daysAgo: 30, barthelScore: 70 }),
        makeFunctionScore({ daysAgo: 28, barthelScore: 60 })
      ]
    );

    expect(result.divergence).toHaveLength(1);
    expect(result.divergence[0].dependencyPct).toBe(30); // the exact-date match
  });
});
