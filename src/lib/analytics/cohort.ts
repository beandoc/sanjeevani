/**
 * Cohort-level aggregation for a clinician's roster.
 *
 * Extracted from the roster page so the same per-patient computation backs
 * both the full roster list (clinic/roster) and the doctor dashboard's
 * summary view — previously the dashboard showed a single local browser's
 * own dyad data instead of anything about the doctor's actual patients, and
 * fixing that means both surfaces need the identical trajectory/risk-band
 * logic, not two copies that can drift.
 */

import {
  listMyRoster,
  listMyDyadInvites,
  getZaritAssessmentsFor,
  getFunctionScoresFor,
  getPatientDisplayName
} from '@/lib/firebase/clinical-sync';
import { computeTrajectory, type RiskBand } from './trajectory';
import { isReassessmentDue, type ZbiTier } from '@/lib/zarit-scale';

export interface CohortRow {
  patientUid: string;
  displayName: string;
  riskBand: RiskBand;
  burdenTrendPerMonth: number | null;
  latestBurdenPct: number | null;
  hasRedFlag: boolean;
  latestAssessmentAgeDays: number | null;
  latestTier: ZbiTier | null;
  latestCompletedAt: string | null;
}

// A dyad that was escalating at last contact and has since gone quiet ranks
// directly below an active critical case — it is an unresolved risk, not an
// absence of information, and must not sort to the bottom of the roster.
export const RISK_BAND_ORDER: Record<RiskBand, number> = {
  critical: 0,
  'lost-to-follow-up': 1,
  deteriorating: 2,
  'insufficient-data': 3,
  stable: 4
};

export const RISK_BAND_STYLE: Record<RiskBand, string> = {
  critical: 'bg-red-600 text-white',
  'lost-to-follow-up': 'bg-orange-600 text-white',
  deteriorating: 'bg-amber-500 text-white',
  stable: 'bg-emerald-500 text-white',
  'insufficient-data': 'bg-slate-400 text-white'
};

const DEMO_COHORT_ROWS: CohortRow[] = [
  {
    patientUid: 'demo-sarojini',
    displayName: 'Smt. Sarojini Devi (Dyad #8102)',
    riskBand: 'critical',
    burdenTrendPerMonth: 4.2,
    latestBurdenPct: 64,
    hasRedFlag: true,
    latestAssessmentAgeDays: 2,
    latestTier: 'ZBI22',
    latestCompletedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    patientUid: 'demo-ramesh',
    displayName: 'Shri Ramesh Chand (Dyad #7641)',
    riskBand: 'deteriorating',
    burdenTrendPerMonth: 2.1,
    latestBurdenPct: 42,
    hasRedFlag: false,
    latestAssessmentAgeDays: 5,
    latestTier: 'ZBI22',
    latestCompletedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    patientUid: 'demo-kamla',
    displayName: 'Smt. Kamla Gupta (Dyad #8419)',
    riskBand: 'stable',
    burdenTrendPerMonth: -0.5,
    latestBurdenPct: 24,
    hasRedFlag: false,
    latestAssessmentAgeDays: 12,
    latestTier: 'ZBI12',
    latestCompletedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString()
  }
];

/**
 * Every active patient on the signed-in clinician's roster, with trajectory
 * risk already computed, sorted worst-first. Falls back to a fixed demo
 * cohort when there are zero real grants AND zero pre-registered invites.
 */
export async function loadCohortRoster(): Promise<CohortRow[]> {
  const [roster, invites] = await Promise.all([listMyRoster(), listMyDyadInvites()]);
  if (roster.length === 0) {
    return invites.length > 0 ? [] : DEMO_COHORT_ROWS;
  }

  const rows = await Promise.all(
    roster.map(async ({ patientUid }) => {
      const [assessments, functionScores, displayName] = await Promise.all([
        getZaritAssessmentsFor(patientUid),
        getFunctionScoresFor(patientUid),
        getPatientDisplayName(patientUid)
      ]);
      const trajectory = computeTrajectory(assessments, functionScores);
      const latest = trajectory.burdenSeries[trajectory.burdenSeries.length - 1];
      return {
        patientUid,
        displayName,
        riskBand: trajectory.riskBand,
        burdenTrendPerMonth: trajectory.burdenSlope.slopePerMonth,
        latestBurdenPct: latest?.normalizedPercentage ?? null,
        hasRedFlag: latest?.hasRedFlag ?? false,
        latestAssessmentAgeDays: trajectory.latestAssessmentAgeDays,
        latestTier: latest?.tier ?? null,
        latestCompletedAt: latest?.date ?? null
      } satisfies CohortRow;
    })
  );

  rows.sort((a, b) => RISK_BAND_ORDER[a.riskBand] - RISK_BAND_ORDER[b.riskBand]);
  return rows;
}

export interface CohortSummary {
  totalPatients: number;
  byRiskBand: Record<RiskBand, number>;
  redFlagCount: number;
  reassessmentDueCount: number;
}

export function summarizeCohort(rows: CohortRow[]): CohortSummary {
  const byRiskBand: Record<RiskBand, number> = {
    critical: 0,
    'lost-to-follow-up': 0,
    deteriorating: 0,
    'insufficient-data': 0,
    stable: 0
  };
  let redFlagCount = 0;
  let reassessmentDueCount = 0;

  for (const row of rows) {
    byRiskBand[row.riskBand]++;
    if (row.hasRedFlag) redFlagCount++;
    const dueCheck =
      row.latestTier && row.latestCompletedAt
        ? { tier: row.latestTier, completedAt: row.latestCompletedAt }
        : null;
    if (isReassessmentDue(dueCheck)) reassessmentDueCount++;
  }

  return { totalPatients: rows.length, byRiskBand, redFlagCount, reassessmentDueCount };
}
