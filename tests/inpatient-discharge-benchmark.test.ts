import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateBenchmarkSummary,
  saveInpatientDischargeBenchmark,
  getInpatientDischargeBenchmark,
  clearInpatientDischargeBenchmark,
  DEFAULT_ENVIRONMENTAL_PENALTY
} from '../src/lib/db/health-repository';
import { estimateCareDemand } from '../src/lib/clinical/care-demand-model';
import { CareGapEngine, DEFAULT_PATIENT_PROFILE, DEFAULT_CAREGIVER_ATTRIBUTES } from '../src/lib/clinical/care-gap-engine';
import type { InpatientDischargeBenchmark } from '../src/lib/db/health-repository/types';

describe('Inpatient Pre-Discharge Care Timing Benchmark', () => {
  const patientUid = 'test-pt-inpatient-001';

  beforeEach(() => {
    clearInpatientDischargeBenchmark(patientUid);
  });

  describe('calculateBenchmarkSummary', () => {
    it('accurately computes inpatient minutes and applies 1.35x environmental penalty', () => {
      const summary = calculateBenchmarkSummary({
        spongeBathMinutes: 30,
        spongeBathStaffCount: 1, // 30 mins
        bedToChairTransferMinutes: 10,
        transferStaffCount: 2, // 10 * 3 transfers * 2 staff = 60 mins
        mealFeedingMinutesPerMeal: 20,
        mealsRequiringAssistancePerDay: 3, // 60 mins
        toiletingDiaperMinutes: 10,
        toiletingEpisodesPerDay: 4,
        toiletingStaffCount: 1, // 40 mins
        repositioningTurnMinutes: 5,
        repositioningIntervalHours: 2, // 12 turns * 5 = 60 mins
        repositioningStaffCount: 1,
        medicationAdministrationMinutes: 5,
        medicationSlotsPerDay: 3, // 15 mins
        environmentalPenaltyMultiplier: 1.35
      });

      // Total inpatient = 30 + 60 + 60 + 40 + 60 + 15 = 265 mins (approx 4.41 hrs)
      expect(summary.inpatientDirectCareMinutesPerDay).toBe(265);
      // Home projected = 265 * 1.35 = 357.75 mins -> 6.0 hrs
      expect(summary.homeProjectedDirectCareHoursPerDay).toBe(6.0);
      expect(summary.requiresTwoPersonTransfers).toBe(true);
    });

    it('flags requiresTwoPersonTransfers as false when single staff is sufficient', () => {
      const summary = calculateBenchmarkSummary({
        spongeBathMinutes: 20,
        spongeBathStaffCount: 1,
        bedToChairTransferMinutes: 5,
        transferStaffCount: 1,
        mealFeedingMinutesPerMeal: 15,
        mealsRequiringAssistancePerDay: 2,
        toiletingDiaperMinutes: 8,
        toiletingEpisodesPerDay: 3,
        toiletingStaffCount: 1,
        repositioningTurnMinutes: 4,
        repositioningIntervalHours: 4,
        repositioningStaffCount: 1,
        medicationAdministrationMinutes: 5,
        medicationSlotsPerDay: 2,
        environmentalPenaltyMultiplier: 1.2
      });

      expect(summary.requiresTwoPersonTransfers).toBe(false);
    });
  });

  describe('HealthRepository persistence', () => {
    it('saves, retrieves, and clears inpatient benchmark', () => {
      const benchmarkData = {
        patientUid,
        observerRole: 'staff_nurse' as const,
        observerName: 'Nurse Sunita, RN',
        wardOrBedNumber: 'Stepdown Ward 3, Bed 12',
        spongeBathMinutes: 25,
        spongeBathStaffCount: 1 as const,
        bedToChairTransferMinutes: 8,
        transferStaffCount: 2 as const,
        transferAssistType: 'two_person_lift_or_sheet' as const,
        mealFeedingMinutesPerMeal: 25,
        mealsRequiringAssistancePerDay: 3,
        feedingAssistType: 'full_spoon_feeding' as const,
        toiletingDiaperMinutes: 12,
        toiletingEpisodesPerDay: 5,
        toiletingStaffCount: 1 as const,
        repositioningTurnMinutes: 5,
        repositioningIntervalHours: 2,
        repositioningStaffCount: 1 as const,
        medicationAdministrationMinutes: 5,
        medicationSlotsPerDay: 3,
        environmentalPenaltyMultiplier: DEFAULT_ENVIRONMENTAL_PENALTY
      };

      const saved = saveInpatientDischargeBenchmark(benchmarkData);
      expect(saved.id).toBeDefined();
      expect(saved.patientUid).toBe(patientUid);
      expect(saved.requiresTwoPersonTransfers).toBe(true);
      expect(saved.homeProjectedDirectCareHoursPerDay).toBeGreaterThan(0);

      const retrieved = getInpatientDischargeBenchmark(patientUid);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.observerName).toBe('Nurse Sunita, RN');
      expect(retrieved?.requiresTwoPersonTransfers).toBe(true);

      clearInpatientDischargeBenchmark(patientUid);
      expect(getInpatientDischargeBenchmark(patientUid)).toBeNull();
    });
  });

  describe('estimateCareDemand Integration with Inpatient Benchmark', () => {
    const dependentBarthel = {
      bi_feeding: 0,
      bi_bathing: 0,
      bi_grooming: 0,
      bi_dressing: 0,
      bi_bowels: 0,
      bi_bladder: 0,
      bi_toilet: 0,
      bi_transfer: 0,
      bi_mobility: 0,
      bi_stairs: 0
    };

    it('calibrates care demand and applies environmental penalty from benchmark', () => {
      const benchmark: InpatientDischargeBenchmark = {
        id: 'bm-test-1',
        patientUid,
        recordedAt: new Date().toISOString(),
        observerRole: 'physiotherapist',
        observerName: 'Dr. A. Verma',
        spongeBathMinutes: 30,
        spongeBathStaffCount: 1,
        bedToChairTransferMinutes: 15,
        transferStaffCount: 2,
        transferAssistType: 'two_person_lift_or_sheet',
        mealFeedingMinutesPerMeal: 30,
        mealsRequiringAssistancePerDay: 3,
        feedingAssistType: 'full_spoon_feeding',
        toiletingDiaperMinutes: 15,
        toiletingEpisodesPerDay: 6,
        toiletingStaffCount: 1,
        repositioningTurnMinutes: 5,
        repositioningIntervalHours: 2,
        repositioningStaffCount: 1,
        medicationAdministrationMinutes: 10,
        medicationSlotsPerDay: 3,
        environmentalPenaltyMultiplier: 1.35,
        inpatientDirectCareMinutesPerDay: 350,
        homeProjectedDirectCareHoursPerDay: 7.9,
        requiresTwoPersonTransfers: true
      };

      const result = estimateCareDemand({
        barthelResponses: dependentBarthel,
        inpatientBenchmark: benchmark,
        assessmentSource: 'clinician_observed'
      });

      expect(result.inpatientBenchmarkApplied).toBe(true);
      expect(result.requiresTwoPersonTransfers).toBe(true);
      expect(result.calibrationCoverage.calibratedMinutesPerDay).toBeGreaterThan(0);
      expect(result.bandBasis.some((b) => b.includes('Inpatient Pre-Discharge Care Timing Benchmark'))).toBe(true);

      // Verify transfer driver picked up 2-person staff and benchmark timing * penalty
      const transferDriver = result.drivers.find((d) => d.itemId === 'bi_transfer');
      expect(transferDriver).toBeDefined();
      expect(transferDriver?.staffRequired).toBe(2);
      expect(transferDriver?.calibrated).toBe(true);
      // Inpatient 15 mins * 1.35 = ~20 mins per episode
      expect(transferDriver?.minutesPerEpisode).toBe(20);
    });
  });

  describe('CareGapEngine Evaluation with Inpatient Benchmark Safety Alert', () => {
    it('emits 2-person transfer safety alert and prescription when transferStaffCount is 2', () => {
      const benchmark: InpatientDischargeBenchmark = {
        id: 'bm-test-2',
        patientUid,
        recordedAt: new Date().toISOString(),
        observerRole: 'doctor',
        observerName: 'Dr. Rajesh Rao',
        spongeBathMinutes: 25,
        spongeBathStaffCount: 1,
        bedToChairTransferMinutes: 10,
        transferStaffCount: 2,
        transferAssistType: 'two_person_lift_or_sheet',
        mealFeedingMinutesPerMeal: 20,
        mealsRequiringAssistancePerDay: 3,
        feedingAssistType: 'full_spoon_feeding',
        toiletingDiaperMinutes: 12,
        toiletingEpisodesPerDay: 5,
        toiletingStaffCount: 1,
        repositioningTurnMinutes: 5,
        repositioningIntervalHours: 2,
        repositioningStaffCount: 1,
        medicationAdministrationMinutes: 5,
        medicationSlotsPerDay: 3,
        environmentalPenaltyMultiplier: 1.35,
        inpatientDirectCareMinutesPerDay: 280,
        homeProjectedDirectCareHoursPerDay: 6.3,
        requiresTwoPersonTransfers: true
      };

      const patient = {
        ...DEFAULT_PATIENT_PROFILE,
        inpatientBenchmark: benchmark,
        katzAdl: {
          ...DEFAULT_PATIENT_PROFILE.katzAdl,
          transferring: false
        }
      };

      // Lone family caregiver without 2-person formal support
      const caregiver = {
        ...DEFAULT_CAREGIVER_ATTRIBUTES,
        formalSupport: {
          type: 'none' as const,
          hoursPerDay: 0,
          handlesHeavyTransfers: false,
          handlesMedicationWoundCare: false
        }
      };

      const evaluation = CareGapEngine.evaluate(caregiver, patient);

      expect(evaluation.careDemandBand.inpatientBenchmarkApplied).toBe(true);
      expect(evaluation.clinicalFindings.some((f) => f.includes('Inpatient Benchmark Safety Alert'))).toBe(true);
      expect(evaluation.qualityOfCareWarnings.some((w) => w.includes('Pre-Discharge Benchmark Warning'))).toBe(true);
      expect(evaluation.prescriptions.some((p) => p.id === 'rx_two_person_transfer_safety')).toBe(true);
    });
  });
});
