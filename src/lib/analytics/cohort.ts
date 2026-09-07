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
  getAppointmentsFor,
  getDailyCareLogsFor,
  syncCohortSummary
} from '@/lib/firebase/clinical-sync';
import { auth } from '@/lib/firebase/client';
import { HealthRepository } from '@/lib/db/health-repository';
import { computeTrajectory, type RiskBand } from './trajectory';
import { isReassessmentDue, type ZbiTier } from '@/lib/zarit-scale';
import { CareGapEngine } from '@/lib/clinical/care-gap-engine';
import {
  analyzeDailyCareLogs,
  prescribeRespite,
  type ClinicalSignal,
  type RespitePrescription
} from '@/lib/clinical/care-intelligence';

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
  conditions?: string[];
  caregiverName?: string | null;
  caregiverKinship?: string | null;
  caregiverPhone?: string | null;
  formalSupportHours?: number;
  formalSupportType?: string;
  isBedBound?: boolean;
  fallHistory?: number;
  lastVitalBp?: string | null;
  lastVitalSpo2?: string | null;
  latestAlertSnippet?: string | null;
  dailyLogCount?: number;
  lastDailyLogDate?: string | null;
  dailyLogSignals?: ClinicalSignal[];
  respitePrescription?: RespitePrescription;
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
    latestCompletedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    hasQocWarning: true,
    conditions: ['Post-Stroke Hemiparesis', 'Severe Osteoarthritis', 'Hypertension'],
    caregiverName: 'Suresh Kumar',
    caregiverKinship: 'Spouse (Solo 78y)',
    caregiverPhone: '+919820012345',
    formalSupportHours: 0,
    formalSupportType: 'None (100% Family)',
    isBedBound: true,
    fallHistory: 2,
    lastVitalBp: '168/102',
    lastVitalSpo2: '94%',
    latestAlertSnippet: 'Solo elderly spouse handling heavy nocturnal bed-turns. BP spike 168/102.',
    dailyLogCount: 1,
    lastDailyLogDate: new Date().toISOString().slice(0, 10),
    dailyLogSignals: [
      {
        id: 'demo_delirium',
        category: 'delirium',
        severity: 'urgent',
        title: 'Possible delirium or acute behavior change',
        detail: 'Evening sundowning and low sleep reported in bedside handoff.',
        source: 'daily_log',
        date: new Date().toISOString().slice(0, 10)
      }
    ],
    respitePrescription: {
      needed: true,
      urgency: 'urgent',
      recommendedDaysPerMonth: 8,
      recommendedHoursPerWeek: 24,
      recommendedSupport: 'Formal respite attendant plus family night rotation this week',
      reasons: ['High caregiver burden (64%).', 'No formal attendant support is recorded.']
    }
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
    latestCompletedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    hasQocWarning: false,
    conditions: ['Parkinson’s Disease', 'Diabetes T2', 'Gait Freezing'],
    caregiverName: 'Anjali Sharma',
    caregiverKinship: 'Daughter (Working)',
    caregiverPhone: '+919819098765',
    formalSupportHours: 4,
    formalSupportType: 'Part-time Attendant',
    isBedBound: false,
    fallHistory: 1,
    lastVitalBp: '134/86',
    lastVitalSpo2: '97%',
    latestAlertSnippet: 'Transfer assistance fatigue rising; evening sundowning reported.',
    dailyLogCount: 1,
    lastDailyLogDate: new Date().toISOString().slice(0, 10),
    dailyLogSignals: [
      {
        id: 'demo_fall',
        category: 'falls',
        severity: 'watch',
        title: 'Fall or unsafe transfer signal',
        detail: 'Gait freezing and prior fall history need mobility review.',
        source: 'profile',
        date: new Date().toISOString().slice(0, 10)
      }
    ],
    respitePrescription: {
      needed: true,
      urgency: 'priority',
      recommendedDaysPerMonth: 4,
      recommendedHoursPerWeek: 12,
      recommendedSupport: 'Planned weekly half-day respite and backup family roster',
      reasons: ['Rising caregiver burden (42%).']
    }
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
    latestCompletedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    hasQocWarning: false,
    conditions: ['Mild Cognitive Impairment', 'Hypertension'],
    caregiverName: 'Rajesh Gupta',
    caregiverKinship: 'Son',
    caregiverPhone: '+919876543210',
    formalSupportHours: 8,
    formalSupportType: 'Day Attendant',
    isBedBound: false,
    fallHistory: 0,
    lastVitalBp: '122/78',
    lastVitalSpo2: '98%',
    latestAlertSnippet: 'Cognitive stimulation & medication schedule fully compliant.',
    dailyLogCount: 1,
    lastDailyLogDate: new Date().toISOString().slice(0, 10),
    dailyLogSignals: [],
    respitePrescription: {
      needed: false,
      urgency: 'none',
      recommendedDaysPerMonth: 0,
      recommendedHoursPerWeek: 0,
      recommendedSupport: 'Monthly backup caregiver coverage',
      reasons: []
    }
  }
];

let cachedCohortRows: CohortRow[] | null = null;
let cacheExpiry = 0;
let inFlightCohortPromise: Promise<CohortRow[]> | null = null;

export function invalidateCohortCache(): void {
  cachedCohortRows = null;
  cacheExpiry = 0;
  inFlightCohortPromise = null;
}

/**
 * Every active patient on the signed-in clinician's roster, with trajectory
 * risk already computed, sorted worst-first. Falls back to a fixed demo
 * cohort when there are zero real grants AND zero pre-registered invites.
 * Includes in-flight deduplication and 15s short-term memory caching to
 * prevent network flood storms.
 */
export async function loadCohortRoster(forceRefresh = false): Promise<CohortRow[]> {
  const now = Date.now();
  if (!forceRefresh && cachedCohortRows && now < cacheExpiry) {
    return cachedCohortRows;
  }
  if (!forceRefresh && inFlightCohortPromise) {
    return inFlightCohortPromise;
  }

  const archived = new Set(HealthRepository.getArchivedDyads());
  const isNotArchived = (uid: string) => {
    if (!uid) return false;
    const lower = uid.toLowerCase();
    const upper = uid.toUpperCase();

    if (
      archived.has(uid) ||
      archived.has(uid.replace('dyad_', '')) ||
      archived.has(`dyad_${uid}`)
    ) {
      return false;
    }
    if (
      (lower.includes('sarojini') || upper.includes('SAROJINI81')) &&
      (archived.has('demo-sarojini') || archived.has('dyad_sarojini_devi') || archived.has('SAROJINI81') || archived.has('sarojini_devi'))
    ) {
      return false;
    }
    if (
      (lower.includes('ramesh') || upper.includes('RAMESH76')) &&
      (archived.has('demo-ramesh') || archived.has('dyad_ramesh_chand') || archived.has('RAMESH76') || archived.has('ramesh_chand'))
    ) {
      return false;
    }
    if (
      lower.includes('kamla') &&
      (archived.has('demo-kamla') || archived.has('kamla_gupta') || archived.has('dyad_kamla_gupta'))
    ) {
      return false;
    }
    return true;
  };

  const fetchPromise = (async () => {
    // 1. Fast path: Attempt BFF aggregation endpoint first
    if (typeof window !== 'undefined' && !forceRefresh) {
      try {
        const bffRes = await fetch('/api/clinic/cohort', {
          headers: { 'Content-Type': 'application/json' }
        });
        if (bffRes.ok) {
          const data = await bffRes.json();
          if (Array.isArray(data?.rows) && data.rows.length > 0) {
            const bffRows = (data.rows as CohortRow[]).filter((r) => isNotArchived(r.patientUid));
            bffRows.sort((a, b) => RISK_BAND_ORDER[a.riskBand] - RISK_BAND_ORDER[b.riskBand]);
            return bffRows;
          }
        }
      } catch {
        // Fall through to resilient client-side aggregation
      }
    }

    try {
      const [rawRoster, rawInvites] = await Promise.all([listMyRoster(), listMyDyadInvites()]);
      const roster = rawRoster.filter((r) => isNotArchived(r.patientUid));
      const invites = rawInvites.filter(
        (inv) => isNotArchived(inv.inviteCode) && (!inv.dyadUid || isNotArchived(inv.dyadUid))
      );

      if (roster.length === 0 && invites.length === 0) {
        const localRegistered = HealthRepository.getRegisteredPatients();
        if (localRegistered && localRegistered.length > 0) {
          return [];
        }
        return DEMO_COHORT_ROWS.filter((r) => isNotArchived(r.patientUid));
      }

      const inviteMap = new Map<string, (typeof invites)[number]>();
      for (const inv of invites) {
        if (inv.dyadUid) inviteMap.set(inv.dyadUid, inv);
        inviteMap.set(`dyad_${inv.inviteCode}`, inv);
      }

      const rows = await Promise.all(
        roster.map(async ({ patientUid }) => {
          try {
            const matchedInvite = inviteMap.get(patientUid);
            const [assessments, functionScores, displayName, caregiver, patientProfile, vitals, appointments, dailyLogs] = await Promise.all([
              getZaritAssessmentsFor(patientUid),
              getFunctionScoresFor(patientUid),
              getPatientDisplayName(patientUid),
              getCaregiverAttributesFor(patientUid).catch(() => null),
              getPatientProfileFor(patientUid).catch(() => null),
              getVitalsFor(patientUid).catch(() => []),
              getAppointmentsFor(patientUid).catch(() => []),
              getDailyCareLogsFor(patientUid).catch(() => [])
            ]);
            const trajectory = computeTrajectory(assessments, functionScores);
            const latest = trajectory.burdenSeries[trajectory.burdenSeries.length - 1];
            const careGap = CareGapEngine.evaluate(caregiver, patientProfile, new Date(), vitals, appointments);
            const hasQocWarning = careGap.qualityOfCareWarnings.length > 0;
            const latestVital = vitals?.[0];
            const dailyLogSignals = analyzeDailyCareLogs(dailyLogs);
            const respitePrescription = prescribeRespite(assessments[0] || null, careGap, caregiver, patientProfile);
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
              hasQocWarning,
              conditions: patientProfile?.primaryConditions || [],
              caregiverName: caregiver?.name || matchedInvite?.caregiverName || null,
              caregiverKinship: caregiver?.kinship || null,
              caregiverPhone: matchedInvite?.caregiverPhone || null,
              formalSupportHours: caregiver?.formalSupport?.hoursPerDay || 0,
              formalSupportType: caregiver?.formalSupport?.type || 'None',
              isBedBound: patientProfile?.isBedBound || false,
              fallHistory: patientProfile?.fallHistoryLast6Months || 0,
              lastVitalBp: latestVital?.bp || (latestVital?.systolic && latestVital?.diastolic ? `${latestVital.systolic}/${latestVital.diastolic}` : null),
              lastVitalSpo2: latestVital?.spo2 ? `${latestVital.spo2}%` : null,
              latestAlertSnippet: dailyLogSignals[0]?.detail || (hasQocWarning ? careGap.qualityOfCareWarnings[0] : null),
              dailyLogCount: dailyLogs.length,
              lastDailyLogDate: dailyLogs[0]?.date || null,
              dailyLogSignals,
              respitePrescription
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

      const validRows = rows.filter((r) => isNotArchived(r.patientUid));
      validRows.sort((a, b) => RISK_BAND_ORDER[a.riskBand] - RISK_BAND_ORDER[b.riskBand]);

      // Deduplicate rows by normalized patient display name
      const seenPatientNames = new Set<string>();
      const dedupedRows: CohortRow[] = [];
      for (const row of validRows) {
        const norm = row.displayName
          .replace(/^(Smt\.|Shri|Dr\.|Mr\.|Mrs\.|Ms\.)\s*/i, '')
          .replace(/\s*\(Dyad\s*#[^)]+\)/i, '')
          .trim()
          .toLowerCase();
        if (norm && seenPatientNames.has(norm)) {
          continue;
        }
        if (norm) seenPatientNames.add(norm);
        dedupedRows.push(row);
      }

      // Persist the just-computed rows to the materialized cache so the
      // BFF fast path (src/app/api/clinic/cohort/route.ts) can serve the
      // next load in one query instead of repeating this N+1 aggregation.
      const clinicianUid = auth?.currentUser?.uid;
      if (clinicianUid) {
        for (const row of dedupedRows) {
          syncCohortSummary(row.patientUid, {
            ...row,
            clinicianUid,
            riskBandOrder: RISK_BAND_ORDER[row.riskBand]
          });
        }
      }

      return dedupedRows;
    } catch (err) {
      console.warn('Could not load cohort roster, checking fallback:', err);
      const localRegistered = HealthRepository.getRegisteredPatients();
      if (localRegistered && localRegistered.length > 0) {
        return [];
      }
      return DEMO_COHORT_ROWS.filter((r) => isNotArchived(r.patientUid));
    }
  })();

  inFlightCohortPromise = fetchPromise;
  try {
    const result = await fetchPromise;
    cachedCohortRows = result;
    cacheExpiry = Date.now() + 30000; // 30 seconds in-memory cache
    return result;
  } finally {
    inFlightCohortPromise = null;
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

export function isDemoDyad(patientUid: string): boolean {
  if (!patientUid) return false;
  const lower = patientUid.toLowerCase();
  const upper = patientUid.toUpperCase();
  return (
    lower.startsWith('demo-') ||
    lower.includes('sarojini') ||
    lower.includes('ramesh') ||
    lower.includes('kamla') ||
    upper.includes('SAROJINI81') ||
    upper.includes('RAMESH76')
  );
}

