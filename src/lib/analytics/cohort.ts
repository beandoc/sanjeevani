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
  getPatientDisplayName,
  getCaregiverAttributesFor,
  getPatientProfileFor,
  getVitalsFor,
  getAppointmentsFor
} from '@/lib/firebase/clinical-sync';
import { computeTrajectory, type RiskBand } from './trajectory';
import { isReassessmentDue, type ZbiTier } from '@/lib/zarit-scale';
import { CareGapEngine } from '@/lib/clinical/care-gap-engine';

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
  hasQocWarning?: boolean;
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
  try {
    const [roster, invites] = await Promise.all([listMyRoster(), listMyDyadInvites()]);
    if (roster.length === 0 && invites.length === 0) {
      return DEMO_COHORT_ROWS;
    }

    const rows = await Promise.all(
      roster.map(async ({ patientUid }) => {
        try {
          const [assessments, functionScores, displayName, caregiver, patientProfile, vitals, appointments] = await Promise.all([
            getZaritAssessmentsFor(patientUid),
            getFunctionScoresFor(patientUid),
            getPatientDisplayName(patientUid),
            getCaregiverAttributesFor(patientUid).catch(() => null),
            getPatientProfileFor(patientUid).catch(() => null),
            getVitalsFor(patientUid).catch(() => []),
            getAppointmentsFor(patientUid).catch(() => [])
          ]);
          const trajectory = computeTrajectory(assessments, functionScores);
          const latest = trajectory.burdenSeries[trajectory.burdenSeries.length - 1];
          const careGap = CareGapEngine.evaluate(caregiver, patientProfile, new Date(), vitals, appointments);
          const hasQocWarning = careGap.qualityOfCareWarnings.length > 0;
          return {
            patientUid,
            displayName,
            riskBand: trajectory.riskBand,
            burdenTrendPerMonth: trajectory.burdenSlope.slopePerMonth,
            latestBurdenPct: latest?.normalizedPercentage ?? null,
            hasRedFlag: latest?.hasRedFlag ?? false,
            latestAssessmentAgeDays: trajectory.latestAssessmentAgeDays,
            latestTier: latest?.tier ?? null,
            latestCompletedAt: latest?.date ?? null,
            hasQocWarning
          } satisfies CohortRow;
        } catch {
          return {
            patientUid,
            displayName: `Patient ${patientUid.slice(0, 8)}`,
            riskBand: 'insufficient-data',
            burdenTrendPerMonth: null,
            latestBurdenPct: null,
            hasRedFlag: false,
            latestAssessmentAgeDays: null,
            latestTier: null,
            latestCompletedAt: null,
            hasQocWarning: false
          } satisfies CohortRow;
        }
      })
    );

    // Merge registered rows with demo cohort so doctor always sees full cohort context
    const currentUids = new Set(rows.map((r) => r.patientUid));
    const demoToAdd = DEMO_COHORT_ROWS.filter((d) => !currentUids.has(d.patientUid));
    const allRows = [...rows, ...demoToAdd];

    allRows.sort((a, b) => RISK_BAND_ORDER[a.riskBand] - RISK_BAND_ORDER[b.riskBand]);
    return allRows;
  } catch (err) {
    console.warn('Could not load cohort roster, falling back to demo cohort:', err);
    return DEMO_COHORT_ROWS;
  }
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
