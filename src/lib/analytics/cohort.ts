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
  syncCohortSummary,
  getCohortSummary
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
import { getDyadWorkflow, type DyadWorkflow } from '@/lib/clinical/dyad-workflow';

export type PatientAcuity = 'urgent' | 'watch' | 'none';

export const PATIENT_ACUITY_ORDER: Record<PatientAcuity, number> = {
  urgent: 0,
  watch: 1,
  none: 2
};

export function derivePatientAcuity(signals?: ClinicalSignal[]): PatientAcuity {
  if (!signals || signals.length === 0) return 'none';
  if (signals.some((s) => s.severity === 'urgent')) return 'urgent';
  if (signals.some((s) => s.severity === 'watch')) return 'watch';
  return 'none';
}

export interface CohortRow {
  patientUid: string;
  displayName: string;
  patientAcuity?: PatientAcuity;
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
  lastVitalAt?: string | null;
  latestAlertSnippet?: string | null;
  dailyLogCount?: number;
  lastDailyLogDate?: string | null;
  dailyLogSignals?: ClinicalSignal[];
  respitePrescription?: RespitePrescription;
  /** CGA fields */
  age?: number | null;
  gender?: string | null;
  cognitiveLoad?: string | null;
  worstPressureInjuryStage?: string | null;
  activeMedicationCount?: number | null;
  /** Documentation state, not a clinical risk score. Drives safe worklist copy. */
  workflow?: DyadWorkflow;
}

export function compareCohortRows(a: CohortRow, b: CohortRow): number {
  const aAcuity = a.patientAcuity || derivePatientAcuity(a.dailyLogSignals);
  const bAcuity = b.patientAcuity || derivePatientAcuity(b.dailyLogSignals);
  const aUrgent = aAcuity === 'urgent' ? 0 : 1;
  const bUrgent = bAcuity === 'urgent' ? 0 : 1;
  if (aUrgent !== bUrgent) return aUrgent - bUrgent;

  const bandDiff = (RISK_BAND_ORDER[a.riskBand] ?? 4) - (RISK_BAND_ORDER[b.riskBand] ?? 4);
  if (bandDiff !== 0) return bandDiff;

  const aDate = a.dailyLogSignals?.find((s) => s.severity === 'urgent')?.date || a.lastDailyLogDate || a.latestCompletedAt || '';
  const bDate = b.dailyLogSignals?.find((s) => s.severity === 'urgent')?.date || b.lastDailyLogDate || b.latestCompletedAt || '';
  if (aDate !== bDate) return bDate.localeCompare(aDate);
  return 0;
}

export function getZaritSeverityBand(
  tier: ZbiTier | null,
  normalizedPct: number | null
): 'normal' | 'amber' | 'red' | 'critical_red' {
  if (normalizedPct === null) return 'normal';
  if (tier === 'ZBI12') {
    const raw = (normalizedPct / 100) * 48;
    if (raw >= 28) return 'critical_red';
    if (raw >= 17) return 'red';
    if (raw >= 12) return 'amber';
    return 'normal';
  }
  if (tier === 'ZBI4') {
    const raw = (normalizedPct / 100) * 16;
    if (raw >= 12) return 'critical_red';
    if (raw >= 10) return 'red';
    if (raw >= 6) return 'amber';
    return 'normal';
  }
  // Default to ZBI22 cutoffs (0-20, 21-40, 41-60, 61-88)
  const raw = (normalizedPct / 100) * 88;
  if (raw > 60) return 'critical_red';
  if (raw > 40) return 'red';
  if (raw > 20) return 'amber';
  return 'normal';
}

export function isSevereZbi(row: CohortRow): boolean {
  if (row.latestBurdenPct === null) return false;
  return getZaritSeverityBand(row.latestTier, row.latestBurdenPct) === 'critical_red';
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
  critical: 'bg-orange-600 text-white',
  'lost-to-follow-up': 'bg-amber-600 text-white',
  deteriorating: 'bg-amber-500 text-white',
  stable: 'bg-emerald-500 text-white',
  'insufficient-data': 'bg-slate-400 text-white'
};

const DEMO_COHORT_ROWS: CohortRow[] = [
  {
    patientUid: 'demo-ramesh',
    displayName: 'Shri Ramesh Chand (Dyad #7641)',
    patientAcuity: 'watch',
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
    lastVitalAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
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
    },
    age: 76,
    gender: 'M',
    cognitiveLoad: 'wandering_agitation',
    worstPressureInjuryStage: null,
    activeMedicationCount: 6,
    workflow: {
      stage: 'longitudinal_monitoring', completedSteps: 6, totalSteps: 6,
      isCarePlanningReady: true, isRespiteEvaluationReady: true,
      nextOwner: 'shared', nextAction: 'Continue remote check-ins; review changes in function and caregiver burden together.', missing: []
    }
  },
  {
    patientUid: 'demo-kamla',
    displayName: 'Smt. Kamla Gupta (Dyad #8419)',
    patientAcuity: 'none',
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
    lastVitalAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
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
    },
    age: 82,
    gender: 'F',
    cognitiveLoad: 'mild_forgetfulness',
    worstPressureInjuryStage: null,
    activeMedicationCount: 3,
    workflow: {
      stage: 'longitudinal_monitoring', completedSteps: 6, totalSteps: 6,
      isCarePlanningReady: true, isRespiteEvaluationReady: true,
      nextOwner: 'shared', nextAction: 'Continue remote check-ins; review changes in function and caregiver burden together.', missing: []
    }
  }
];

const COHORT_STORAGE_KEY = 'sanjeevani_cohort_roster_cache';
let cachedCohortRows: CohortRow[] | null = null;
let cacheExpiry = 0;
let inFlightCohortPromise: Promise<CohortRow[]> | null = null;

export function getCachedCohortRoster(): CohortRow[] | null {
  if (cachedCohortRows && cachedCohortRows.length > 0) return cachedCohortRows;
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(COHORT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        cachedCohortRows = parsed;
        cacheExpiry = Date.now() + 60000;
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed reading persistent cohort cache:', e);
  }
  return null;
}

export function setCachedCohortRoster(rows: CohortRow[]): void {
  cachedCohortRows = rows;
  cacheExpiry = Date.now() + 60000;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(COHORT_STORAGE_KEY, JSON.stringify(rows));
    } catch (e) {
      console.warn('Failed writing persistent cohort cache:', e);
    }
  }
}

export function invalidateCohortCache(): void {
  cachedCohortRows = null;
  cacheExpiry = 0;
  inFlightCohortPromise = null;
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(COHORT_STORAGE_KEY);
    } catch {}
  }
}

/** Older materialized summaries did not record workflow readiness. Treating
 * them as clinically complete is unsafe; they are refreshed from source data
 * on the next client aggregation. */
function normalizeSummaryRow(row: CohortRow): CohortRow {
  const patientAcuity = row.patientAcuity || derivePatientAcuity(row.dailyLogSignals);
  if (row.workflow) return { ...row, patientAcuity };
  return {
    ...row,
    patientAcuity,
    hasQocWarning: false,
    respitePrescription: undefined,
    workflow: getDyadWorkflow({ patient: null, caregiver: null, functionAssessmentCount: 0, burdenAssessmentCount: 0 })
  };
}

/**
 * Every active patient on the signed-in clinician's roster, with trajectory
 * risk already computed, sorted worst-first. Falls back to a fixed demo
 * cohort when there are zero real grants AND zero pre-registered invites.
 * Includes in-flight deduplication and persistent storage caching for instant
 * 0ms first-paints.
 */
export async function loadCohortRoster(forceRefresh = false): Promise<CohortRow[]> {
  const now = Date.now();
  if (!forceRefresh && cachedCohortRows && now < cacheExpiry) {
    return cachedCohortRows;
  }
  if (!forceRefresh) {
    const persistent = getCachedCohortRoster();
    if (persistent && now < cacheExpiry) {
      return persistent;
    }
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
    // 1. Fast path: Attempt BFF aggregation endpoint first (only if session cookie exists)
    if (typeof window !== 'undefined' && !forceRefresh && document.cookie.includes('__session=')) {
      try {
        const bffRes = await fetch('/api/clinic/cohort', {
          headers: { 'Content-Type': 'application/json' }
        });
        if (bffRes.ok) {
          const data = await bffRes.json();
          if (Array.isArray(data?.rows) && data.rows.length > 0) {
            const bffRows = (data.rows as CohortRow[])
              .map(normalizeSummaryRow)
              .filter((r) => isNotArchived(r.patientUid));
            bffRows.sort(compareCohortRows);
            setCachedCohortRoster(bffRows);
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

      // Ensure all registered patients and invites are included in the roster
      const localRegistered = HealthRepository.getRegisteredPatients().filter(
        (p) => isNotArchived(p.patientUid) && (!p.inviteCode || isNotArchived(p.inviteCode))
      );
      const existingRosterUids = new Set(roster.map((r) => r.patientUid));
      for (const lp of localRegistered) {
        if (!existingRosterUids.has(lp.patientUid)) {
          roster.push({
            patientUid: lp.patientUid,
            grant: {
              clinicianUid: 'current-clinician',
              clinicianLabel: 'Doctor',
              grantedAt: lp.createdAt,
              revokedAt: null
            }
          });
          existingRosterUids.add(lp.patientUid);
        }
      }

      for (const inv of invites) {
        const dUid = inv.dyadUid || `dyad_${inv.inviteCode}`;
        if (!existingRosterUids.has(dUid) && isNotArchived(dUid)) {
          roster.push({
            patientUid: dUid,
            grant: {
              clinicianUid: inv.clinicianUid,
              clinicianLabel: inv.clinicianLabel ?? 'Doctor',
              grantedAt: inv.createdAt,
              revokedAt: null
            }
          });
          existingRosterUids.add(dUid);
        }
      }

      if (roster.length === 0 && invites.length === 0) {
        return DEMO_COHORT_ROWS.filter((r) => isNotArchived(r.patientUid));
      }

      const inviteMap = new Map<string, (typeof invites)[number]>();
      for (const inv of invites) {
        if (inv.dyadUid) inviteMap.set(inv.dyadUid, inv);
        inviteMap.set(`dyad_${inv.inviteCode}`, inv);
        inviteMap.set(inv.inviteCode, inv);
      }

      const rows = await Promise.all(
        roster.map(async ({ patientUid }) => {
          const matchedInvite = inviteMap.get(patientUid);
          const matchedLocal = localRegistered.find((lp) => lp.patientUid === patientUid);
          try {
            // Fast path: Check precomputed materialized summary to avoid 8 roundtrips
            if (!forceRefresh) {
              const precomputed = await getCohortSummary(patientUid);
              if (precomputed && precomputed.workflow) {
                return {
                  ...precomputed,
                  caregiverName: precomputed.caregiverName || matchedInvite?.caregiverName || null,
                  caregiverPhone: precomputed.caregiverPhone || matchedInvite?.caregiverPhone || null
                } satisfies CohortRow;
              }
            }

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
            const workflow = getDyadWorkflow({
              patient: patientProfile,
              caregiver,
              functionAssessmentCount: functionScores.length,
              burdenAssessmentCount: assessments.length
            });
            // Never produce a staffing gap or a respite prescription from the
            // registration/default profile. These are only meaningful after a
            // functional baseline and caregiver capacity check have been saved.
            const careGap = workflow.isCarePlanningReady
              ? CareGapEngine.evaluate(caregiver, patientProfile, new Date(), vitals, appointments)
              : null;
            const hasQocWarning = Boolean(careGap?.qualityOfCareWarnings.length);
            const latestVital = vitals?.[0];
            const dailyLogSignals = analyzeDailyCareLogs(dailyLogs);
            const patientAcuity = derivePatientAcuity(dailyLogSignals);
            const respitePrescription = workflow.isRespiteEvaluationReady && careGap
              ? prescribeRespite(assessments[0] || null, careGap, caregiver, patientProfile)
              : undefined;
            const resolvedDisplayName = (displayName && !displayName.startsWith('Patient '))
              ? displayName
              : (matchedInvite?.patientName
                  ? matchedInvite.patientName
                  : displayName);

            const wounds = patientProfile?.skinIntegrity?.wounds || [];
            let worstPressureInjuryStage: string | null = null;
            const stageWeights: Record<string, number> = {
              deep_tissue: 6,
              unstageable: 5,
              '4': 4,
              '3': 3,
              '2': 2,
              '1': 1,
              none: 0
            };
            for (const w of wounds) {
              if (w.stage && w.stage !== 'none') {
                const curWeight = stageWeights[w.stage] ?? 0;
                const prevWeight = worstPressureInjuryStage ? (stageWeights[worstPressureInjuryStage] ?? 0) : -1;
                if (curWeight > prevWeight) {
                  worstPressureInjuryStage = w.stage;
                }
              }
            }

            const activeMedicationCount = patientProfile?.currentMedications?.length ?? 0;
            const resolvedAge = patientProfile?.age ?? matchedLocal?.patientAge ?? matchedInvite?.patientAge ?? null;
            const rawGender = patientProfile?.gender ?? (caregiver as { patientGender?: string } | null)?.patientGender;
            const compactGender = rawGender
              ? (rawGender.toLowerCase().startsWith('f') ? 'F' : rawGender.toLowerCase().startsWith('m') ? 'M' : rawGender)
              : null;
            const cognitiveLoad = patientProfile?.cognitiveBehavioralLoad ?? null;
            const lastVitalAt = latestVital?.date || null;

            return {
              patientUid,
              displayName: resolvedDisplayName,
              patientAcuity,
              riskBand: trajectory.riskBand,
              burdenTrendPerMonth: trajectory.burdenSlope.slopePerMonth,
              latestBurdenPct: latest?.normalizedPercentage ?? null,
              hasRedFlag: latest?.hasRedFlag ?? false,
              latestAssessmentAgeDays: trajectory.latestAssessmentAgeDays,
              latestTier: latest?.tier ?? null,
              latestCompletedAt: latest?.date ?? null,
              hasQocWarning,
              conditions: patientProfile?.primaryConditions || matchedInvite?.primaryConditions || [],
              caregiverName: caregiver?.name || matchedInvite?.caregiverName || null,
              caregiverKinship: caregiver?.kinship || matchedInvite?.caregiverKinship || null,
              caregiverPhone: matchedInvite?.caregiverPhone || null,
              formalSupportHours: caregiver?.formalSupport?.hoursPerDay || 0,
              formalSupportType: caregiver?.formalSupport?.type || 'None',
              isBedBound: patientProfile?.isBedBound || false,
              fallHistory: patientProfile?.fallHistoryLast6Months || 0,
              lastVitalBp: latestVital?.bp || (latestVital?.systolic && latestVital?.diastolic ? `${latestVital.systolic}/${latestVital.diastolic}` : null),
              lastVitalSpo2: latestVital?.spo2 ? `${latestVital.spo2}%` : null,
              lastVitalAt,
              latestAlertSnippet: dailyLogSignals[0]?.detail || (hasQocWarning ? careGap?.qualityOfCareWarnings[0] || null : null),
              dailyLogCount: dailyLogs.length,
              lastDailyLogDate: dailyLogs[0]?.date || null,
              dailyLogSignals,
              respitePrescription,
              age: resolvedAge,
              gender: compactGender,
              cognitiveLoad,
              worstPressureInjuryStage,
              activeMedicationCount,
              workflow
            } satisfies CohortRow;
          } catch {
            return {
              patientUid,
              displayName: matchedInvite?.patientName
                ? matchedInvite.patientName
                : `Patient ${patientUid.slice(0, 8)}`,
              patientAcuity: 'none',
              riskBand: 'insufficient-data',
              burdenTrendPerMonth: null,
              latestBurdenPct: null,
              hasRedFlag: false,
              latestAssessmentAgeDays: null,
              latestTier: null,
              latestCompletedAt: null,
              hasQocWarning: false,
              conditions: matchedInvite?.primaryConditions || [],
              caregiverName: matchedInvite?.caregiverName || null,
              caregiverKinship: matchedInvite?.caregiverKinship || null,
              caregiverPhone: matchedInvite?.caregiverPhone || null,
              age: matchedLocal?.patientAge ?? matchedInvite?.patientAge ?? null,
              gender: null,
              cognitiveLoad: null,
              worstPressureInjuryStage: null,
              activeMedicationCount: null,
              lastVitalAt: null,
              workflow: getDyadWorkflow({ patient: null, caregiver: null, functionAssessmentCount: 0, burdenAssessmentCount: 0 })
            } satisfies CohortRow;
          }
        })
      );

      const validRows = rows.filter((r) => isNotArchived(r.patientUid));
      validRows.sort(compareCohortRows);

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
    setCachedCohortRoster(result);
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
  urgentAcuityCount: number;
  severeBurnoutCount: number;
  bedBoundOrPiCount: number;
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
  let urgentAcuityCount = 0;
  let severeBurnoutCount = 0;
  let bedBoundOrPiCount = 0;

  for (const row of rows) {
    byRiskBand[row.riskBand]++;
    if (row.hasRedFlag) redFlagCount++;
    const dueCheck =
      row.latestTier && row.latestCompletedAt
        ? { tier: row.latestTier, completedAt: row.latestCompletedAt }
        : null;
    if (isReassessmentDue(dueCheck)) reassessmentDueCount++;
    if (row.patientAcuity === 'urgent' || (row.dailyLogSignals || []).some((s) => s.severity === 'urgent')) {
      urgentAcuityCount++;
    }
    if (isSevereZbi(row) || row.riskBand === 'critical') {
      severeBurnoutCount++;
    }
    if (row.isBedBound || (row.worstPressureInjuryStage && row.worstPressureInjuryStage !== 'none')) {
      bedBoundOrPiCount++;
    }
  }

  return {
    totalPatients: rows.length,
    byRiskBand,
    redFlagCount,
    reassessmentDueCount,
    urgentAcuityCount,
    severeBurnoutCount,
    bedBoundOrPiCount
  };
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
