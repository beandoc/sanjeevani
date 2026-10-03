/**
 * Care-time calibration log — Phase 0 instrumentation.
 *
 * Append-only record of every care-demand estimate and what the clinician
 * decided after seeing it. This is the cheapest useful calibration signal
 * available: it needs no diary study, no ethics submission for routine
 * service-evaluation use of already-collected clinical data, and it answers
 * the first-order question within weeks — is the model systematically wrong,
 * and in which direction.
 *
 * Inputs are stored verbatim so historical estimates can be recomputed under
 * new coefficients. A log that kept only outputs could improve future
 * estimates but could never check a calibration against the existing record.
 *
 * See docs/care-time-calibration-protocol.md.
 */

import type {
  CareDemandDecision,
  CareDemandEstimateLog,
  CareDemandEstimateSnapshot,
  CareDemandInputSnapshot
} from './types';
import { STORAGE_KEYS } from './storage-keys';

/** Keep roughly a year of estimates per dyad; enough to fit, bounded on device. */
const MAX_ENTRIES = 2000;

const keyFor = (patientUid?: string | null) =>
  patientUid
    ? `${STORAGE_KEYS.CARE_DEMAND_ESTIMATE_LOG}_${patientUid}`
    : STORAGE_KEYS.CARE_DEMAND_ESTIMATE_LOG;

const num = (v: unknown, fallback = 0): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

function normalizeNumberMap(v: unknown): Record<string, number> | undefined {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return undefined;
  const out: Record<string, number> = {};
  for (const [k, raw] of Object.entries(v as Record<string, unknown>)) {
    const n = Number(raw);
    if (Number.isFinite(n)) out[k] = n;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function normalizeStringArray(v: unknown): string[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const out = v.filter((x): x is string => typeof x === 'string');
  return out.length > 0 ? out : undefined;
}

/**
 * Parse one stored entry field-by-field with explicit runtime coercion.
 * localStorage is untrusted and may hold records written by an older build, so
 * nothing here trusts the shape it finds.
 */
function normalizeEntry(item: unknown): CareDemandEstimateLog | null {
  if (!item || typeof item !== 'object') return null;
  const raw = item as Record<string, unknown>;
  if (typeof raw.id !== 'string' || !raw.id) return null;

  const rawEst = (raw.estimate && typeof raw.estimate === 'object' ? raw.estimate : {}) as Record<string, unknown>;
  const estimate: CareDemandEstimateSnapshot = {
    activeCareLowHours: num(rawEst.activeCareLowHours),
    activeCarePointHours: num(rawEst.activeCarePointHours),
    activeCareHighHours: num(rawEst.activeCareHighHours),
    directCarePointHours: num(rawEst.directCarePointHours),
    supervisionPointHours: num(rawEst.supervisionPointHours),
    onCallPointHours: num(rawEst.onCallPointHours),
    coveragePointHours: num(rawEst.coveragePointHours),
    bandRelativeHalfWidth: num(rawEst.bandRelativeHalfWidth),
    requiresNightPresence: Boolean(rawEst.requiresNightPresence),
    inputGranularity: rawEst.inputGranularity === 'graded' ? 'graded' : 'legacy_binary',
    assessmentSource: String(rawEst.assessmentSource ?? 'not_recorded'),
    uncalibratedShare: num(rawEst.uncalibratedShare, 1),
    careGapClassification:
      rawEst.careGapClassification === 'covered' || rawEst.careGapClassification === 'deficit'
        ? rawEst.careGapClassification
        : 'indeterminate',
    netCareGapHours: num(rawEst.netCareGapHours),
    caregiverSafeCapacityHours: num(rawEst.caregiverSafeCapacityHours)
  };

  const rawIn = (raw.inputs && typeof raw.inputs === 'object' ? raw.inputs : {}) as Record<string, unknown>;
  const inputs: CareDemandInputSnapshot = {
    barthelResponses: normalizeNumberMap(rawIn.barthelResponses),
    lawtonResponses: normalizeNumberMap(rawIn.lawtonResponses),
    premorbidlyNotPerformedIadl: normalizeStringArray(rawIn.premorbidlyNotPerformedIadl),
    careTaskFrequencyOverrides: normalizeNumberMap(rawIn.careTaskFrequencyOverrides),
    cognitiveBehavioralLoad:
      typeof rawIn.cognitiveBehavioralLoad === 'string' ? rawIn.cognitiveBehavioralLoad : undefined,
    isBedBound: typeof rawIn.isBedBound === 'boolean' ? rawIn.isBedBound : undefined,
    fallHistoryLast6Months:
      rawIn.fallHistoryLast6Months === undefined ? undefined : num(rawIn.fallHistoryLast6Months),
    hasMotorizedBedAndRippleMattress:
      typeof rawIn.hasMotorizedBedAndRippleMattress === 'boolean'
        ? rawIn.hasMotorizedBedAndRippleMattress
        : undefined
  };

  let decision: CareDemandDecision | undefined;
  if (raw.decision && typeof raw.decision === 'object') {
    const d = raw.decision as Record<string, unknown>;
    const verdicts = ['accepted', 'revised_up', 'revised_down', 'rejected', 'not_recorded'] as const;
    const roles = ['doctor', 'nurse', 'medical_assistant', 'caregiver', 'other'] as const;
    decision = {
      decidedAt: typeof d.decidedAt === 'string' ? d.decidedAt : new Date().toISOString(),
      decidedByRole: (roles as readonly string[]).includes(String(d.decidedByRole))
        ? (d.decidedByRole as CareDemandDecision['decidedByRole'])
        : 'other',
      verdict: (verdicts as readonly string[]).includes(String(d.verdict))
        ? (d.verdict as CareDemandDecision['verdict'])
        : 'not_recorded',
      prescribedActiveCareHours:
        d.prescribedActiveCareHours === undefined ? undefined : num(d.prescribedActiveCareHours),
      prescribedCoverageHours:
        d.prescribedCoverageHours === undefined ? undefined : num(d.prescribedCoverageHours),
      prescribedSupportTypes: normalizeStringArray(d.prescribedSupportTypes),
      reason: typeof d.reason === 'string' ? d.reason : undefined
    };
  }

  return {
    id: raw.id,
    patientUid: typeof raw.patientUid === 'string' ? raw.patientUid : null,
    recordedAt: typeof raw.recordedAt === 'string' ? raw.recordedAt : new Date().toISOString(),
    engineVersion: String(raw.engineVersion ?? 'unknown'),
    policyVersion: String(raw.policyVersion ?? 'unknown'),
    estimate,
    inputs,
    ...(decision ? { decision } : {})
  };
}

function read(patientUid?: string | null): CareDemandEstimateLog[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(keyFor(patientUid));
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(normalizeEntry)
      .filter((e): e is CareDemandEstimateLog => e !== null)
      .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
  } catch (e) {
    console.error('Error reading care-demand estimate log:', e);
    return [];
  }
}

function write(entries: CareDemandEstimateLog[], patientUid?: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(keyFor(patientUid), JSON.stringify(entries.slice(0, MAX_ENTRIES)));
  } catch (e) {
    console.error('Error saving care-demand estimate log:', e);
  }
}

export function getCareDemandEstimateLog(patientUid?: string | null): CareDemandEstimateLog[] {
  return read(patientUid);
}

/**
 * Append one estimate.
 *
 * De-duplicated against the most recent entry: a re-render or a tab switch
 * recomputes the same estimate from the same inputs, and logging each one would
 * inflate `n` with correlated rows that a later analysis would read as
 * independent observations. Only a genuine change in inputs or output is kept.
 */
export function logCareDemandEstimate(
  entry: Omit<CareDemandEstimateLog, 'id' | 'recordedAt'> & { id?: string; recordedAt?: string }
): CareDemandEstimateLog[] {
  const current = read(entry.patientUid);
  const record: CareDemandEstimateLog = {
    ...entry,
    id: entry.id ?? `cde_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    recordedAt: entry.recordedAt ?? new Date().toISOString()
  };

  const last = current[0];
  if (
    last &&
    !record.decision &&
    JSON.stringify(last.inputs) === JSON.stringify(record.inputs) &&
    JSON.stringify(last.estimate) === JSON.stringify(record.estimate) &&
    last.policyVersion === record.policyVersion
  ) {
    return current;
  }

  const updated = [record, ...current];
  write(updated, entry.patientUid);
  return updated;
}

/**
 * Attach what the clinician decided to an existing estimate.
 *
 * This is the comparison that makes the log worth keeping: the model's range
 * against the hours a clinician actually settled on, with their reason.
 */
export function recordCareDemandDecision(
  estimateId: string,
  decision: CareDemandDecision,
  patientUid?: string | null
): CareDemandEstimateLog[] {
  const current = read(patientUid);
  const updated = current.map((e) => (e.id === estimateId ? { ...e, decision } : e));
  write(updated, patientUid);
  return updated;
}

/** The most recent estimate, for attaching a decision to. */
export function getLatestCareDemandEstimate(
  patientUid?: string | null
): CareDemandEstimateLog | null {
  return read(patientUid)[0] ?? null;
}

export interface CalibrationInLargeSummary {
  /** Estimates with a recorded clinician decision. */
  decidedCount: number;
  totalCount: number;
  /** Decisions where the clinician's figure fell inside the model's band. */
  withinBandCount: number;
  revisedUpCount: number;
  revisedDownCount: number;
  rejectedCount: number;
  /**
   * Mean signed error in hours/day: prescribed minus the model's midpoint.
   * Positive means the model reads LOW against clinical judgement.
   */
  meanSignedErrorHours: number | null;
  /** Mean absolute error in hours/day. */
  meanAbsoluteErrorHours: number | null;
}

/**
 * Calibration-in-the-large: is the model systematically wrong, and which way?
 *
 * This is not a substitute for measuring task times. Clinician judgement is a
 * convenience comparator, not ground truth — clinicians see the model's output
 * before deciding, so their figure is anchored by it and the two are not
 * independent. What this detects is a gross directional bias, which is exactly
 * the thing worth knowing before committing to a diary study.
 */
export function summarizeCalibrationInLarge(
  patientUid?: string | null
): CalibrationInLargeSummary {
  const entries = read(patientUid);
  const decided = entries.filter(
    (e) => e.decision && e.decision.verdict !== 'not_recorded'
  );

  let withinBand = 0;
  const signed: number[] = [];
  for (const e of decided) {
    const prescribed = e.decision?.prescribedActiveCareHours;
    if (prescribed === undefined) continue;
    if (
      prescribed >= e.estimate.activeCareLowHours &&
      prescribed <= e.estimate.activeCareHighHours
    ) {
      withinBand += 1;
    }
    signed.push(prescribed - e.estimate.activeCarePointHours);
  }

  const mean = (xs: number[]) =>
    xs.length === 0 ? null : Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 100) / 100;

  return {
    decidedCount: decided.length,
    totalCount: entries.length,
    withinBandCount: withinBand,
    revisedUpCount: decided.filter((e) => e.decision?.verdict === 'revised_up').length,
    revisedDownCount: decided.filter((e) => e.decision?.verdict === 'revised_down').length,
    rejectedCount: decided.filter((e) => e.decision?.verdict === 'rejected').length,
    meanSignedErrorHours: mean(signed),
    meanAbsoluteErrorHours: mean(signed.map(Math.abs))
  };
}

/** Analysis extract: flat rows for export to a statistician. */
export function exportCalibrationRows(patientUid?: string | null): Array<Record<string, unknown>> {
  return read(patientUid).map((e) => ({
    id: e.id,
    recordedAt: e.recordedAt,
    engineVersion: e.engineVersion,
    policyVersion: e.policyVersion,
    ...e.estimate,
    cognitiveBehavioralLoad: e.inputs.cognitiveBehavioralLoad ?? '',
    isBedBound: e.inputs.isBedBound ?? '',
    fallHistoryLast6Months: e.inputs.fallHistoryLast6Months ?? '',
    barthelAnswered: Object.keys(e.inputs.barthelResponses ?? {}).length,
    lawtonAnswered: Object.keys(e.inputs.lawtonResponses ?? {}).length,
    premorbidExclusions: (e.inputs.premorbidlyNotPerformedIadl ?? []).join('|'),
    frequencyOverrides: Object.keys(e.inputs.careTaskFrequencyOverrides ?? {}).join('|'),
    decisionVerdict: e.decision?.verdict ?? '',
    decidedByRole: e.decision?.decidedByRole ?? '',
    prescribedActiveCareHours: e.decision?.prescribedActiveCareHours ?? '',
    prescribedCoverageHours: e.decision?.prescribedCoverageHours ?? '',
    prescribedSupportTypes: (e.decision?.prescribedSupportTypes ?? []).join('|'),
    decisionReason: e.decision?.reason ?? ''
  }));
}
