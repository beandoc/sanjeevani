/**
 * Longitudinal trajectory analytics: caregiver burden (Zarit) vs. care-recipient
 * function (Barthel/Lawton) over time, for the clinician dashboard.
 *
 * Design constraints, deliberately enforced by the types and functions here:
 *
 * 1. NO DATE FORECASTING. This module reports a categorical risk band and a
 *    trend direction/magnitude, never a projected "breakdown by" date. A
 *    linear extrapolation of a handful of ZBI points is not a validated
 *    predictor of caregiver breakdown, even though serial ZBI trajectories
 *    do correlate with institutionalization risk in the literature. Adding
 *    a confident date would overclaim what the underlying evidence supports.
 *
 * 2. NO CROSS-TIER RAW DELTAS. ZBI-22 (22 items), ZBI-12, and ZBI-4 are
 *    different instruments with different noise floors. A "rise" that is
 *    really a switch from ZBI-4 to ZBI-22 is measurement artefact, not
 *    clinical change. Every slope computed here either runs within one tier
 *    on raw score, or across tiers on normalizedPercentage only, and every
 *    tier change is surfaced to the caller so the UI can mark it.
 *
 * 3. INSUFFICIENT DATA IS A FIRST-CLASS RESULT, NOT A CRASH. Fewer than 3
 *    points returns null slopes and an explicit 'insufficient-data' band,
 *    never a fabricated trend line through noise.
 */

import type { ZaritEvaluationResult, ZbiTier } from '@/lib/zarit-scale';
import type { FunctionEvaluationResult } from '@/lib/clinical/function-scale';

/* ------------------------------------------------------------------ *
 * Minimal Clinically Important Difference (MCID) for the ZBI.
 *
 * Published MCID estimates for the Zarit Burden Interview are not firmly
 * established and vary by population and anchor method (~4-8 points on the
 * ZBI-22 scale). We take the conservative (larger) end so the engine does
 * not over-call "deteriorating" on ordinary week-to-week noise, and express
 * it as a percentage of normalizedPercentage so it applies uniformly across
 * tiers. This constant is reviewable clinical policy, not a magic number —
 * revisit if better-powered MCID data becomes available for this population.
 *
 * Reference range: Bédard et al. 2001 (ZBI-12 derivation); Higginson et al.,
 * Gérain & Zech 2019 (systematic review of caregiver burden MCID methods).
 * ------------------------------------------------------------------ */
export const ZBI_MCID_PERCENTAGE_POINTS_PER_30_DAYS = 9; // ~8pt/88 on ZBI-22, applied as normalized %

/* ------------------------------------------------------------------ *
 * Minimal important change for the care-recipient function axis.
 *
 * Expressed on dependencyPercentage (0-100, = 100 - Barthel), so it is
 * directly comparable to the Barthel literature: the minimal detectable
 * change on the Barthel Index is around 4 points and published MCID
 * estimates cluster near 9. We take a conservative mid value so ordinary
 * measurement noise on the function axis cannot, by itself, push a dyad into
 * the 'critical' divergence band.
 *
 * Previously this axis had NO threshold at all (any slope > 0 counted as
 * "declining"), which meant the divergence band was effectively gated on the
 * burden side only.
 * ------------------------------------------------------------------ */
export const BARTHEL_MCID_PERCENTAGE_POINTS_PER_30_DAYS = 5;

/* ------------------------------------------------------------------ *
 * Trend admissibility.
 *
 * Three points are necessary but not sufficient. Three assessments taken
 * across four days can be fit to a mathematically valid line whose slope,
 * expressed per 30 days, extrapolates roughly seven-fold beyond the window
 * actually observed — enough to report a triple-digit "points per 30 days"
 * rise on a 0-100 scale. A trend is only reported when the series also spans
 * a clinically meaningful stretch of time.
 *
 * The R² floor is applied to the *rising* decision rather than to
 * reliability, deliberately: a flat, noisy series is genuinely "stable"
 * information, not missing information.
 * ------------------------------------------------------------------ */
const MIN_OBSERVATION_SPAN_DAYS = 21;
const MIN_R_SQUARED_FOR_TREND = 0.4;

export type RiskBand =
  | 'stable'
  | 'deteriorating'
  | 'critical'
  | 'lost-to-follow-up'
  | 'insufficient-data';

export interface SlopeResult {
  /** Points per 30 days. Positive = rising. Null if insufficient data. */
  slopePerMonth: number | null;
  /** Coefficient of determination of the linear fit, 0-1. Null if insufficient data. */
  rSquared: number | null;
  /** Number of points the slope was fit over. */
  n: number;
  /** Days between the first and last point in the series. */
  spanDays: number;
  /**
   * True when the series has enough points, spans enough time, and the fit is
   * not degenerate (e.g. all-same-day points).
   */
  isReliable: boolean;
}

export interface BurdenSeriesPoint {
  date: string; // ISO
  tier: ZbiTier;
  totalScore: number;
  maxScore: number;
  normalizedPercentage: number;
  severityBand: ZaritEvaluationResult['severityBand'];
  hasRedFlag: boolean;
  encounterId?: string;
}

export interface FunctionSeriesPoint {
  date: string; // ISO
  barthelScore: number;
  dependencyPercentage: number;
  band: FunctionEvaluationResult['band'];
  encounterId?: string;
}

export interface TierChangeMarker {
  /** Index into the burden series (chronological) where the tier changed. */
  index: number;
  fromTier: ZbiTier;
  toTier: ZbiTier;
  date: string;
}

export interface DivergencePoint {
  date: string;
  burdenPct: number;
  dependencyPct: number;
  /**
   * burdenPct - dependencyPct. Explicitly ordinal: the two scales are not
   * calibrated against one another, so only the *trend* of this value is
   * meaningful (is the gap widening?) — never its absolute magnitude, which
   * has no units and should never be presented to a clinician as a quantity.
   */
  divergenceIndex: number;
}

export interface TrajectoryResult {
  burdenSeries: BurdenSeriesPoint[];
  functionSeries: FunctionSeriesPoint[];
  tierChanges: TierChangeMarker[];
  burdenSlope: SlopeResult;
  functionSlope: SlopeResult; // slope of dependencyPercentage (higher = worse)
  divergence: DivergencePoint[];
  /** True once burden is rising and function is declining at the same time. */
  isDiverging: boolean;
  riskBand: RiskBand;
  /** Human-readable reasons behind the risk band, for the clinician UI. */
  riskReasons: string[];
  latestAssessmentAgeDays: number | null;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const STALE_ASSESSMENT_DAYS = 90;
const MIN_POINTS_FOR_TREND = 3;

/**
 * Ordinary least squares slope of y over time, expressed as units per 30 days.
 * x values are converted to days-since-first-point to keep the regression
 * numerically well-conditioned regardless of absolute date magnitude.
 */
function olsSlopePerMonth(points: { date: string; value: number }[]): SlopeResult {
  const n = points.length;
  if (n < MIN_POINTS_FOR_TREND) {
    return { slopePerMonth: null, rSquared: null, n, spanDays: 0, isReliable: false };
  }

  const sorted = [...points].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const t0 = new Date(sorted[0].date).getTime();
  const xs = sorted.map((p) => (new Date(p.date).getTime() - t0) / MS_PER_DAY);
  const ys = sorted.map((p) => p.value);

  const spanDays = Math.round(xs[xs.length - 1] - xs[0]);
  if (spanDays < MIN_OBSERVATION_SPAN_DAYS) {
    // Too short a window to extrapolate a per-30-day rate from.
    return { slopePerMonth: null, rSquared: null, n, spanDays, isReliable: false };
  }

  const xMean = xs.reduce((a, b) => a + b, 0) / n;
  const yMean = ys.reduce((a, b) => a + b, 0) / n;

  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - xMean;
    const dy = ys[i] - yMean;
    sxy += dx * dy;
    sxx += dx * dx;
    syy += dy * dy;
  }

  // Degenerate: all points on the same day (or duplicate timestamps).
  if (sxx === 0) {
    return { slopePerMonth: null, rSquared: null, n, spanDays, isReliable: false };
  }

  const slopePerDay = sxy / sxx;
  const slopePerMonth = slopePerDay * 30;

  // rSquared undefined when y has no variance at all (perfectly flat, real data) — treat as 1 (perfect fit to a flat line).
  const rSquared = syy === 0 ? 1 : Math.pow(sxy, 2) / (sxx * syy);

  return {
    slopePerMonth: Math.round(slopePerMonth * 100) / 100,
    rSquared: Math.round(rSquared * 100) / 100,
    n,
    spanDays,
    isReliable: true
  };
}

/**
 * The single definition of "burden is meaningfully rising", used by both the
 * risk band and the divergence flag. These previously disagreed: the band
 * required the MCID while divergence accepted any positive slope, so
 * `isDiverging` fired on pure noise.
 */
function isRisingBeyondMcid(slope: SlopeResult, mcid: number): boolean {
  return (
    slope.isReliable &&
    slope.slopePerMonth !== null &&
    slope.rSquared !== null &&
    slope.rSquared >= MIN_R_SQUARED_FOR_TREND &&
    slope.slopePerMonth >= mcid
  );
}

/**
 * Build the burden series from raw Zarit assessments, sorted chronologically,
 * and detect every tier change so the UI can mark discontinuities on the chart.
 */
function buildBurdenSeries(
  assessments: ZaritEvaluationResult[]
): { series: BurdenSeriesPoint[]; tierChanges: TierChangeMarker[] } {
  const sorted = [...assessments].sort(
    (a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
  );

  const series: BurdenSeriesPoint[] = sorted.map((a) => ({
    date: a.completedAt,
    tier: a.tier,
    totalScore: a.totalScore,
    maxScore: a.maxScore,
    normalizedPercentage: a.normalizedPercentage,
    severityBand: a.severityBand,
    hasRedFlag: a.redFlags.length > 0
  }));

  const tierChanges: TierChangeMarker[] = [];
  for (let i = 1; i < series.length; i++) {
    if (series[i].tier !== series[i - 1].tier) {
      tierChanges.push({
        index: i,
        fromTier: series[i - 1].tier,
        toTier: series[i].tier,
        date: series[i].date
      });
    }
  }

  return { series, tierChanges };
}

function buildFunctionSeries(scores: FunctionEvaluationResult[]): FunctionSeriesPoint[] {
  return [...scores]
    .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
    .map((s) => ({
      date: s.recordedAt,
      barthelScore: s.barthelScore,
      dependencyPercentage: s.dependencyPercentage,
      band: s.band,
      encounterId: s.encounterId
    }));
}

/**
 * Compute the burden slope. Uses normalizedPercentage (0-100, cross-tier safe)
 * rather than raw totalScore, so a tier change never masquerades as clinical
 * change. This is deliberately more conservative than a raw-score slope would
 * be within a single tier, in exchange for being always safe to compute.
 */
function computeBurdenSlope(series: BurdenSeriesPoint[]): SlopeResult {
  return olsSlopePerMonth(series.map((p) => ({ date: p.date, value: p.normalizedPercentage })));
}

function computeFunctionSlope(series: FunctionSeriesPoint[]): SlopeResult {
  return olsSlopePerMonth(series.map((p) => ({ date: p.date, value: p.dependencyPercentage })));
}

/**
 * Pair burden and function points into a divergence series for the scissors
 * chart's shaded region. Pairs each function point with the nearest burden
 * point in time (within a tolerance) rather than requiring exact date match,
 * since the two are recorded on independent schedules.
 */
function buildDivergenceSeries(
  burdenSeries: BurdenSeriesPoint[],
  functionSeries: FunctionSeriesPoint[],
  toleranceDays = 45
): DivergencePoint[] {
  if (burdenSeries.length === 0 || functionSeries.length === 0) return [];

  // Candidate pairings, closest first. A burden point may only be consumed
  // once: allowing reuse repeated a single burden reading across several chart
  // points, drawing a line that implies measurements which were never taken.
  const candidates: { fIndex: number; bIndex: number; dist: number }[] = [];
  for (let fIndex = 0; fIndex < functionSeries.length; fIndex++) {
    const fTime = new Date(functionSeries[fIndex].date).getTime();
    for (let bIndex = 0; bIndex < burdenSeries.length; bIndex++) {
      const dist = Math.abs(new Date(burdenSeries[bIndex].date).getTime() - fTime);
      if (dist <= toleranceDays * MS_PER_DAY) {
        candidates.push({ fIndex, bIndex, dist });
      }
    }
  }
  candidates.sort((a, b) => a.dist - b.dist);

  const usedFunction = new Set<number>();
  const usedBurden = new Set<number>();
  const points: DivergencePoint[] = [];

  for (const { fIndex, bIndex } of candidates) {
    if (usedFunction.has(fIndex) || usedBurden.has(bIndex)) continue;
    usedFunction.add(fIndex);
    usedBurden.add(bIndex);

    const fPoint = functionSeries[fIndex];
    const bPoint = burdenSeries[bIndex];
    points.push({
      date: fPoint.date,
      burdenPct: bPoint.normalizedPercentage,
      dependencyPct: fPoint.dependencyPercentage,
      divergenceIndex: bPoint.normalizedPercentage - fPoint.dependencyPercentage
    });
  }

  return points.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

function determineRiskBand(
  burdenSeries: BurdenSeriesPoint[],
  burdenSlope: SlopeResult,
  functionSlope: SlopeResult,
  latestAssessmentAgeDays: number | null
): { band: RiskBand; reasons: string[] } {
  const reasons: string[] = [];

  if (burdenSeries.length === 0) {
    return { band: 'insufficient-data', reasons: ['No caregiver burden assessments recorded yet.'] };
  }

  const latest = burdenSeries[burdenSeries.length - 1];

  if (
    latestAssessmentAgeDays === null ||
    latestAssessmentAgeDays < 0 ||
    latestAssessmentAgeDays > STALE_ASSESSMENT_DAYS
  ) {
    if (latestAssessmentAgeDays !== null && latestAssessmentAgeDays < 0) {
      reasons.push('Latest assessment is dated in the future — record cannot be trusted.');
      return { band: 'insufficient-data', reasons };
    }

    reasons.push(
      `Last assessment is ${latestAssessmentAgeDays ?? 'unknown'} days old (>${STALE_ASSESSMENT_DAYS}-day staleness threshold) — trend cannot be trusted.`
    );

    // A dyad that was escalating when we last saw it and has since gone quiet
    // is a higher-attention state than one we simply have too little data on.
    // Collapsing both into 'insufficient-data' sorted an unresolved red flag
    // to the bottom of the clinician roster.
    if (latest.severityBand === 'critical_red' || latest.severityBand === 'red' || latest.hasRedFlag) {
      reasons.push(
        latest.hasRedFlag
          ? 'Last contact triggered clinical red flags and has not been followed up.'
          : `Last contact was in the ${latest.severityBand === 'critical_red' ? 'critical' : 'high'}-burden band and has not been followed up.`
      );
      return { band: 'lost-to-follow-up', reasons };
    }

    return { band: 'insufficient-data', reasons };
  }

  // Critical: current band is severe, OR any red flag ever fired at the latest visit.
  if (latest.severityBand === 'critical_red') {
    reasons.push(`Latest assessment is in the critical severity band (${latest.normalizedPercentage}% burden).`);
  }
  if (latest.hasRedFlag) {
    reasons.push('Latest assessment triggered one or more clinical red flags.');
  }
  if (latest.severityBand === 'critical_red' || latest.hasRedFlag) {
    return { band: 'critical', reasons };
  }

  const isBurdenRising = isRisingBeyondMcid(burdenSlope, ZBI_MCID_PERCENTAGE_POINTS_PER_30_DAYS);
  // dependencyPercentage rising = function declining
  const isFunctionDeclining = isRisingBeyondMcid(
    functionSlope,
    BARTHEL_MCID_PERCENTAGE_POINTS_PER_30_DAYS
  );

  if (isBurdenRising && isFunctionDeclining) {
    reasons.push(
      `Caregiver burden rising ~${burdenSlope.slopePerMonth} pts/30 days while care-recipient dependency is rising ~${functionSlope.slopePerMonth} pts/30 days — widening gap between care demand and caregiver capacity.`
    );
    return { band: 'critical', reasons };
  }

  if (latest.severityBand === 'red' || isBurdenRising) {
    if (latest.severityBand === 'red') {
      reasons.push(`Latest assessment is in the high-burden band (${latest.normalizedPercentage}%).`);
    }
    if (isBurdenRising) {
      reasons.push(
        `Burden trending upward at ~${burdenSlope.slopePerMonth} pts/30 days, exceeding the ${ZBI_MCID_PERCENTAGE_POINTS_PER_30_DAYS}-pt minimal-important-change threshold.`
      );
    }
    return { band: 'deteriorating', reasons };
  }

  if (!burdenSlope.isReliable) {
    reasons.push(`Fewer than ${MIN_POINTS_FOR_TREND} assessments — trend direction not yet established.`);
    return { band: 'insufficient-data', reasons };
  }

  reasons.push('Burden stable or improving; no active red flags.');
  return { band: 'stable', reasons };
}

/**
 * Compute the full trajectory for one caregiver-patient dyad.
 * Pure function — no I/O, no side effects, fully unit-testable.
 */
export function computeTrajectory(
  assessments: ZaritEvaluationResult[],
  functionScores: FunctionEvaluationResult[],
  now: Date = new Date()
): TrajectoryResult {
  const { series: burdenSeries, tierChanges } = buildBurdenSeries(assessments);
  const functionSeries = buildFunctionSeries(functionScores);

  const burdenSlope = computeBurdenSlope(burdenSeries);
  const functionSlope = computeFunctionSlope(functionSeries);

  const divergence = buildDivergenceSeries(burdenSeries, functionSeries);

  // Same predicate the risk band uses — see isRisingBeyondMcid.
  const isDiverging =
    isRisingBeyondMcid(burdenSlope, ZBI_MCID_PERCENTAGE_POINTS_PER_30_DAYS) &&
    isRisingBeyondMcid(functionSlope, BARTHEL_MCID_PERCENTAGE_POINTS_PER_30_DAYS);

  const latestAssessmentAgeDays =
    burdenSeries.length > 0
      ? Math.round(
          (now.getTime() - new Date(burdenSeries[burdenSeries.length - 1].date).getTime()) / MS_PER_DAY
        )
      : null;

  const { band: riskBand, reasons: riskReasons } = determineRiskBand(
    burdenSeries,
    burdenSlope,
    functionSlope,
    latestAssessmentAgeDays
  );

  return {
    burdenSeries,
    functionSeries,
    tierChanges,
    burdenSlope,
    functionSlope,
    divergence,
    isDiverging,
    riskBand,
    riskReasons,
    latestAssessmentAgeDays
  };
}
