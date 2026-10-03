import { describe, it, expect, beforeEach } from 'vitest';
import {
  getCareDemandEstimateLog,
  logCareDemandEstimate,
  recordCareDemandDecision,
  getLatestCareDemandEstimate,
  summarizeCalibrationInLarge,
  exportCalibrationRows
} from '../src/lib/db/health-repository/calibration-log';
import type { CareDemandEstimateLog } from '../src/lib/db/health-repository/types';
import { STORAGE_KEYS } from '../src/lib/db/health-repository/storage-keys';

// In-memory localStorage for the Node test environment.
const mockStorage: Record<string, string> = {};
const mockLocalStorage = {
  getItem: (key: string) => mockStorage[key] || null,
  setItem: (key: string, value: string) => {
    mockStorage[key] = value;
  },
  removeItem: (key: string) => {
    delete mockStorage[key];
  },
  clear: () => {
    Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
  }
};

const PATIENT = 'pt_calib_1';

const estimate = (overrides: Partial<CareDemandEstimateLog['estimate']> = {}) => ({
  activeCareLowHours: 3,
  activeCarePointHours: 6,
  activeCareHighHours: 9,
  directCarePointHours: 5,
  supervisionPointHours: 1,
  onCallPointHours: 8,
  coveragePointHours: 13,
  bandRelativeHalfWidth: 0.5,
  requiresNightPresence: true,
  inputGranularity: 'graded' as const,
  assessmentSource: 'clinician_observed',
  uncalibratedShare: 1,
  careGapClassification: 'indeterminate' as const,
  netCareGapHours: 2.5,
  caregiverSafeCapacityHours: 3.5,
  ...overrides
});

const inputs = (overrides: Partial<CareDemandEstimateLog['inputs']> = {}) => ({
  barthelResponses: { bi_toilet: 0, bi_transfer: 5 },
  lawtonResponses: { iadl_food: 0 },
  cognitiveBehavioralLoad: 'wandering_agitation',
  isBedBound: false,
  fallHistoryLast6Months: 1,
  ...overrides
});

const append = (
  e: Partial<Omit<CareDemandEstimateLog, 'id' | 'recordedAt'>> = {}
) =>
  logCareDemandEstimate({
    patientUid: PATIENT,
    engineVersion: '2.3.0',
    policyVersion: '2026.10.03.1',
    estimate: estimate(),
    inputs: inputs(),
    ...e
  });

describe('care-time calibration log', () => {
  beforeEach(() => {
    (globalThis as unknown as { window: unknown }).window = { localStorage: mockLocalStorage };
    (globalThis as unknown as { localStorage: unknown }).localStorage = mockLocalStorage;
    mockLocalStorage.clear();
  });

  it('appends an estimate scoped to the dyad', () => {
    append();
    const log = getCareDemandEstimateLog(PATIENT);
    expect(log).toHaveLength(1);
    expect(log[0].estimate.activeCarePointHours).toBe(6);
    expect(log[0].patientUid).toBe(PATIENT);
    // Scoped per dyad, so another patient's vault stays empty.
    expect(getCareDemandEstimateLog('pt_other')).toHaveLength(0);
  });

  it('stores the inputs verbatim so old estimates can be recomputed later', () => {
    append();
    const [entry] = getCareDemandEstimateLog(PATIENT);
    // Without the inputs, a calibration study could only improve future
    // estimates and could never check itself against the existing record.
    expect(entry.inputs.barthelResponses).toEqual({ bi_toilet: 0, bi_transfer: 5 });
    expect(entry.inputs.lawtonResponses).toEqual({ iadl_food: 0 });
    expect(entry.policyVersion).toBe('2026.10.03.1');
    expect(entry.engineVersion).toBe('2.3.0');
  });

  it('does not log an identical recomputation twice', () => {
    append();
    append();
    append();
    // A re-render or tab switch recomputes the same estimate from the same
    // inputs. Logging each one would inflate n with correlated rows that an
    // analysis would read as independent observations.
    expect(getCareDemandEstimateLog(PATIENT)).toHaveLength(1);
  });

  it('logs again when the inputs actually change', () => {
    append();
    append({ inputs: inputs({ isBedBound: true }) });
    expect(getCareDemandEstimateLog(PATIENT)).toHaveLength(2);
  });

  it('logs again when the policy version changes, even on identical inputs', () => {
    append();
    append({ policyVersion: '2026.12.01.1' });
    // The same inputs under new coefficients are a different estimate, and the
    // comparison between them is the point of versioning the log.
    expect(getCareDemandEstimateLog(PATIENT)).toHaveLength(2);
  });

  it('attaches a clinician decision to an existing estimate', () => {
    append();
    const latest = getLatestCareDemandEstimate(PATIENT)!;
    recordCareDemandDecision(
      latest.id,
      {
        decidedAt: new Date().toISOString(),
        decidedByRole: 'doctor',
        verdict: 'revised_up',
        prescribedActiveCareHours: 11,
        prescribedCoverageHours: 24,
        prescribedSupportTypes: ['paid_attendant_24h'],
        reason: 'optimal: 24h live-in'
      },
      PATIENT
    );
    const [entry] = getCareDemandEstimateLog(PATIENT);
    expect(entry.decision?.verdict).toBe('revised_up');
    expect(entry.decision?.prescribedActiveCareHours).toBe(11);
  });

  it('survives a corrupted or legacy stored record without losing the rest', () => {
    append();
    const key = `${STORAGE_KEYS.CARE_DEMAND_ESTIMATE_LOG}_${PATIENT}`;
    const good = JSON.parse(mockLocalStorage.getItem(key)!);
    // A record written by an older build, plus outright garbage.
    mockLocalStorage.setItem(
      key,
      JSON.stringify([{ id: 'legacy_1' }, null, 'nonsense', { noId: true }, ...good])
    );
    const log = getCareDemandEstimateLog(PATIENT);
    // The unparseable rows are dropped; the legacy row is coerced, not trusted.
    expect(log.length).toBe(2);
    const legacy = log.find((e) => e.id === 'legacy_1')!;
    expect(legacy.estimate.activeCarePointHours).toBe(0);
    expect(legacy.estimate.uncalibratedShare).toBe(1);
    expect(legacy.policyVersion).toBe('unknown');
  });

  it('returns an empty log rather than throwing when storage is unavailable', () => {
    delete (globalThis as unknown as { window?: unknown }).window;
    expect(getCareDemandEstimateLog(PATIENT)).toEqual([]);
    expect(getLatestCareDemandEstimate(PATIENT)).toBeNull();
  });
});

describe('calibration-in-the-large summary', () => {
  beforeEach(() => {
    (globalThis as unknown as { window: unknown }).window = { localStorage: mockLocalStorage };
    (globalThis as unknown as { localStorage: unknown }).localStorage = mockLocalStorage;
    mockLocalStorage.clear();
  });

  const withDecision = (prescribed: number, verdict: 'accepted' | 'revised_up' | 'revised_down', seed: number) =>
    append({
      inputs: inputs({ fallHistoryLast6Months: seed }),
      decision: {
        decidedAt: new Date().toISOString(),
        decidedByRole: 'doctor',
        verdict,
        prescribedActiveCareHours: prescribed
      }
    });

  it('reports nothing rather than guessing when no decisions are recorded', () => {
    append();
    const s = summarizeCalibrationInLarge(PATIENT);
    expect(s.totalCount).toBe(1);
    expect(s.decidedCount).toBe(0);
    expect(s.meanSignedErrorHours).toBeNull();
    expect(s.meanAbsoluteErrorHours).toBeNull();
  });

  it('detects the direction of a systematic bias', () => {
    // Model midpoint is 6h. Clinicians consistently commit far more.
    withDecision(10, 'revised_up', 1);
    withDecision(12, 'revised_up', 2);
    withDecision(11, 'revised_up', 3);

    const s = summarizeCalibrationInLarge(PATIENT);
    expect(s.decidedCount).toBe(3);
    expect(s.revisedUpCount).toBe(3);
    // Positive signed error means the model reads LOW against clinical
    // judgement — the first-order question this log exists to answer.
    expect(s.meanSignedErrorHours).toBeGreaterThan(3);
    expect(s.meanAbsoluteErrorHours).toBeGreaterThan(3);
  });

  it('counts decisions that landed inside the model band', () => {
    withDecision(6, 'accepted', 1);   // inside 3-9
    withDecision(8.5, 'accepted', 2); // inside 3-9
    withDecision(15, 'revised_up', 3); // outside
    const s = summarizeCalibrationInLarge(PATIENT);
    expect(s.withinBandCount).toBe(2);
    expect(s.revisedUpCount).toBe(1);
  });

  it('does not let signed errors cancel out in the absolute measure', () => {
    withDecision(2, 'revised_down', 1); // -4
    withDecision(10, 'revised_up', 2);  // +4
    const s = summarizeCalibrationInLarge(PATIENT);
    expect(s.meanSignedErrorHours).toBe(0);
    // A model that is wildly wrong in both directions is not a calibrated one,
    // so the absolute error must survive the cancellation.
    expect(s.meanAbsoluteErrorHours).toBe(4);
  });

  it('exports flat rows carrying both the estimate and the decision', () => {
    withDecision(10, 'revised_up', 1);
    const rows = exportCalibrationRows(PATIENT);
    expect(rows).toHaveLength(1);
    const row = rows[0];
    expect(row.activeCarePointHours).toBe(6);
    expect(row.prescribedActiveCareHours).toBe(10);
    expect(row.decisionVerdict).toBe('revised_up');
    expect(row.barthelAnswered).toBe(2);
    expect(row.policyVersion).toBe('2026.10.03.1');
  });
});
