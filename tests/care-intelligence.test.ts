import { describe, expect, it } from 'vitest';
import {
  analyzeDailyCareLogs,
  buildFamilyDailyDigest,
  buildCaregiverActionPlan,
  prescribeRespite
} from '../src/lib/clinical/care-intelligence';
import { CareGapEngine, DEFAULT_CAREGIVER_ATTRIBUTES, DEFAULT_PATIENT_PROFILE } from '../src/lib/clinical/care-gap-engine';
import type { DailyCareLog } from '../src/lib/db/health-repository';
import { calculateZaritScore } from '../src/lib/zarit-scale';

const baseLog: DailyCareLog = {
  id: 'daily_2026-08-30_full_day',
  date: '2026-08-30',
  shift: 'full_day',
  patientUid: 'dyad_test',
  patientName: 'Test Patient',
  recordedByName: 'Nurse A',
  recordedByRole: 'nurse',
  meals: {
    breakfast: 'Porridge',
    lunch: 'Dal rice',
    dinner: 'Khichdi'
  },
  monitoringRows: [
    {
      id: 'before_breakfast',
      timeLabel: 'Before Breakfast',
      bp: '182/112',
      pulse: '122',
      spo2: '89',
      bloodSugar: '312',
      remarks: 'Drowsy and confused after night.'
    }
  ],
  medications: [
    { id: 'm1', label: 'Metformin', slot: 'morning', given: true },
    { id: 'm2', label: 'Telmisartan', slot: 'morning', given: false }
  ],
  stoolPassed: false,
  urineMorningMl: '200',
  urineEveningMl: '150',
  waterIntakeMl: '600',
  catheterChanged: null,
  sleep: 'poor',
  generalRemarks: 'Near fall during transfer',
  createdAt: '2026-08-30T08:00:00.000Z',
  updatedAt: '2026-08-30T20:00:00.000Z'
};

describe('Care intelligence engine', () => {
  it('extracts family digest and clinician red flags from daily bedside logs', () => {
    const signals = analyzeDailyCareLogs([baseLog], new Date('2026-08-30T21:00:00.000Z'));
    expect(signals.some((signal) => signal.category === 'delirium')).toBe(true);
    expect(signals.some((signal) => signal.category === 'falls')).toBe(true);
    expect(signals.some((signal) => signal.category === 'vitals' && signal.severity === 'urgent')).toBe(true);

    const digest = buildFamilyDailyDigest([baseLog], new Date('2026-08-30T21:00:00.000Z'));
    expect(digest.headline).toContain('doctor review');
    expect(digest.medicationSummary).toBe('1/2 doses marked given');
  });

  it('prescribes respite and creates an actionable caregiver plan when burden and care gap are high', () => {
    const highBurden = calculateZaritScore(
      { zbi_1: 4, zbi_2: 4, zbi_3: 4, zbi_7: 4, zbi_8: 4, zbi_14: 4, zbi_22: 4 },
      'ZBI12'
    );
    const bedBoundPatient = {
      ...DEFAULT_PATIENT_PROFILE,
      isBedBound: true,
      katzAdl: {
        bathing: false,
        dressing: false,
        toileting: false,
        transferring: false,
        continence: false,
        feeding: false
      }
    };
    const soloCaregiver = {
      ...DEFAULT_CAREGIVER_ATTRIBUTES,
      formalSupport: {
        type: 'none' as const,
        hoursPerDay: 0,
        handlesHeavyTransfers: false,
        handlesMedicationWoundCare: false
      }
    };
    const careGap = CareGapEngine.evaluate(soloCaregiver, bedBoundPatient);
    const respite = prescribeRespite(highBurden, careGap, soloCaregiver, bedBoundPatient);
    expect(respite.needed).toBe(true);
    expect(respite.recommendedDaysPerMonth).toBeGreaterThanOrEqual(4);

    const plan = buildCaregiverActionPlan({
      logs: [baseLog],
      latestZarit: highBurden,
      careGap,
      caregiver: soloCaregiver,
      patient: bedBoundPatient,
      now: new Date('2026-08-30T21:00:00.000Z')
    });
    expect(plan.map((item) => item.id)).toContain('respite_plan');
    expect(plan.map((item) => item.id)).toContain('delirium_screen');
    expect(plan.map((item) => item.id)).toContain('fall_safety');
  });
});
