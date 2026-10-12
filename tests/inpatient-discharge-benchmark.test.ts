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
    it('uses episode medians, recorded schedules and no default home inflation for new observations', () => {
      const observations = [
        { id: 'f1', taskCategory: 'feeding_meals' as const, observedAt: '2026-01-01T08:00:00.000Z', durationMinutes: 18, staffCount: 1 as const },
        { id: 'f2', taskCategory: 'feeding_meals' as const, observedAt: '2026-01-01T13:00:00.000Z', durationMinutes: 24, staffCount: 1 as const },
        { id: 'f3', taskCategory: 'feeding_meals' as const, observedAt: '2026-01-01T19:00:00.000Z', durationMinutes: 30, staffCount: 1 as const }
      ];
      const summary = calculateBenchmarkSummary({
        spongeBathMinutes: 0, spongeBathStaffCount: 1,
        bedToChairTransferMinutes: 0, transferStaffCount: 1, transferEpisodesPerDay: 0,
        mealFeedingMinutesPerMeal: 0, mealsRequiringAssistancePerDay: 3,
        toiletingDiaperMinutes: 0, toiletingEpisodesPerDay: 0, toiletingStaffCount: 1,
        repositioningTurnMinutes: 0, repositioningIntervalHours: 24, repositioningStaffCount: 1,
        medicationAdministrationMinutes: 0, medicationSlotsPerDay: 0,
        observations
      });

      expect(summary.inpatientDirectCareMinutesPerDay).toBe(72);
      expect(summary.homeProjectedDirectCareHoursPerDay).toBe(1.2);
    });

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

    it('anchors observed task time at discharge and updates only that task after reassessment', () => {
      const benchmark: InpatientDischargeBenchmark = {
        id: 'episode-bm', patientUid, recordedAt: '2026-01-01T00:00:00.000Z',
        observerRole: 'staff_nurse', observerName: 'Ward nurse', methodologyVersion: 'patient-episode-v1',
        observations: [
          { id: 'f1', taskCategory: 'feeding_meals', observedAt: '2026-01-01T08:00:00.000Z', durationMinutes: 20, staffCount: 1 },
          { id: 'f2', taskCategory: 'feeding_meals', observedAt: '2026-01-01T13:00:00.000Z', durationMinutes: 30, staffCount: 1 }
        ],
        baselineBarthelResponses: dependentBarthel,
        baselineFunctionalAssessedAt: '2026-01-01T00:00:00.000Z',
        spongeBathMinutes: 0, spongeBathStaffCount: 1,
        bedToChairTransferMinutes: 0, transferEpisodesPerDay: 0, transferStaffCount: 1,
        transferAssistType: 'one_person_pivot', mealFeedingMinutesPerMeal: 25,
        mealsRequiringAssistancePerDay: 3, feedingAssistType: 'full_spoon_feeding',
        toiletingDiaperMinutes: 0, toiletingEpisodesPerDay: 0, toiletingStaffCount: 1,
        repositioningTurnMinutes: 0, repositioningIntervalHours: 24, repositioningStaffCount: 1,
        medicationAdministrationMinutes: 0, medicationSlotsPerDay: 0,
        environmentalPenaltyMultiplier: 1, inpatientDirectCareMinutesPerDay: 75,
        homeProjectedDirectCareHoursPerDay: 1.3, requiresTwoPersonTransfers: false
      };

      const baseline = estimateCareDemand({ barthelResponses: dependentBarthel, inpatientBenchmark: benchmark, functionalAssessedAt: '2026-01-01T00:00:00.000Z' });
      const feeding = baseline.drivers.find((d) => d.itemId === 'inpatient_feeding_meals');
      expect(feeding?.minutesPerDay).toBe(75);
      expect(baseline.patientSpecificEstimate?.functionAdjustmentApplied).toBe(false);

      const improved = estimateCareDemand({
        barthelResponses: { ...dependentBarthel, bi_feeding: 10 },
        inpatientBenchmark: benchmark,
        functionalAssessedAt: '2026-02-01T00:00:00.000Z'
      });
      expect(improved.drivers.some((d) => d.itemId === 'inpatient_feeding_meals')).toBe(false);
      expect(improved.patientSpecificEstimate?.functionAdjustmentApplied).toBe(true);
      expect(improved.patientSpecificEstimate?.taskAdjustments.find((t) => t.taskCategory === 'feeding_meals')?.currentCaregiverMinutesPerDay).toBe(0);
      expect(improved.activeCare.pointHours).toBeLessThan(baseline.activeCare.pointHours);
      expect(benchmark.observations?.length).toBe(2);
    });

    it('also updates an empirical task from a later Katz-only reassessment', () => {
      const dependentKatz = { bathing: false, dressing: false, toileting: false, transferring: false, continence: false, feeding: false };
      const benchmark = {
        id: 'katz-episode-bm', patientUid, recordedAt: '2026-01-01T00:00:00.000Z',
        observerRole: 'staff_nurse' as const, observerName: 'Ward nurse',
        methodologyVersion: 'patient-episode-v1' as const,
        observations: [
          { id: 'f1', taskCategory: 'feeding_meals' as const, observedAt: '2026-01-01T08:00:00.000Z', durationMinutes: 20, staffCount: 1 as const },
          { id: 'f2', taskCategory: 'feeding_meals' as const, observedAt: '2026-01-01T13:00:00.000Z', durationMinutes: 20, staffCount: 1 as const }
        ],
        baselineKatzAdl: dependentKatz,
        spongeBathMinutes: 0, spongeBathStaffCount: 1 as const,
        bedToChairTransferMinutes: 0, transferEpisodesPerDay: 0, transferStaffCount: 1 as const,
        transferAssistType: 'one_person_pivot' as const, mealFeedingMinutesPerMeal: 20,
        mealsRequiringAssistancePerDay: 3, feedingAssistType: 'full_spoon_feeding' as const,
        toiletingDiaperMinutes: 0, toiletingEpisodesPerDay: 0, toiletingStaffCount: 1 as const,
        repositioningTurnMinutes: 0, repositioningIntervalHours: 24, repositioningStaffCount: 1 as const,
        medicationAdministrationMinutes: 0, medicationSlotsPerDay: 0,
        environmentalPenaltyMultiplier: 1, inpatientDirectCareMinutesPerDay: 60,
        homeProjectedDirectCareHoursPerDay: 1, requiresTwoPersonTransfers: false
      };

      const improved = estimateCareDemand({
        legacyKatzAdl: { ...dependentKatz, feeding: true },
        inpatientBenchmark: benchmark
      });
      expect(improved.patientSpecificEstimate?.functionAdjustmentApplied).toBe(true);
      expect(improved.patientSpecificEstimate?.taskAdjustments[0].currentCaregiverMinutesPerDay).toBe(0);
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

  describe('benchmarkCal — penalty, episode median priority, episodeCount', () => {
    const dependentBarthel = {
      bi_feeding: 0, bi_bathing: 0, bi_grooming: 0, bi_dressing: 0,
      bi_bowels: 0, bi_bladder: 0, bi_toilet: 0,
      bi_transfer: 0, bi_mobility: 0, bi_stairs: 0
    };

    it('legacy-summary-v0: applies 1.35x penalty when environmentalPenaltyMultiplier is undefined (old stored record)', () => {
      const legacyBenchmark = {
        id: 'legacy-bm', patientUid, recordedAt: new Date().toISOString(),
        observerRole: 'staff_nurse' as const, observerName: 'Nurse A',
        // No methodologyVersion and no environmentalPenaltyMultiplier → undefined → must use 1.35
        spongeBathMinutes: 20, spongeBathStaffCount: 1 as const,
        bedToChairTransferMinutes: 0, transferStaffCount: 1 as const,
        transferAssistType: 'one_person_pivot' as const,
        mealFeedingMinutesPerMeal: 0, mealsRequiringAssistancePerDay: 0,
        feedingAssistType: 'independent' as const,
        toiletingDiaperMinutes: 0, toiletingEpisodesPerDay: 0, toiletingStaffCount: 1 as const,
        repositioningTurnMinutes: 0, repositioningIntervalHours: 24, repositioningStaffCount: 1 as const,
        medicationAdministrationMinutes: 0, medicationSlotsPerDay: 0,
        environmentalPenaltyMultiplier: undefined as unknown as number,
        inpatientDirectCareMinutesPerDay: 20, homeProjectedDirectCareHoursPerDay: 0.45,
        requiresTwoPersonTransfers: false
      } as InpatientDischargeBenchmark;

      const result = estimateCareDemand({
        barthelResponses: { ...dependentBarthel },
        inpatientBenchmark: legacyBenchmark,
        assessmentSource: 'clinician_observed'
      });

      // 20 min (sponge bath) * 1.35 penalty = 27 min per episode
      const bathDriver = result.drivers.find((d) => d.itemId === 'bi_bathing');
      expect(bathDriver).toBeDefined();
      expect(bathDriver?.minutesPerEpisode).toBe(27);
      expect(bathDriver?.calibrated).toBe(true);
      expect(bathDriver?.evidenceSource).toBe('inpatient_observed');
    });

    it('patient-episode-v1 with summary fields only: uses field verbatim (penalty=1), episodeCount=1', () => {
      const summaryOnlyBenchmark: InpatientDischargeBenchmark = {
        id: 'ep-summary-bm', patientUid, recordedAt: new Date().toISOString(),
        observerRole: 'staff_nurse', observerName: 'Nurse B',
        methodologyVersion: 'patient-episode-v1',
        // No observations[] — inpatientObservationStats empty; benchmarkCal fires via summary field
        spongeBathMinutes: 25, spongeBathStaffCount: 1,
        bedToChairTransferMinutes: 0, transferStaffCount: 1,
        transferAssistType: 'one_person_pivot',
        mealFeedingMinutesPerMeal: 0, mealsRequiringAssistancePerDay: 0,
        feedingAssistType: 'independent',
        toiletingDiaperMinutes: 0, toiletingEpisodesPerDay: 0, toiletingStaffCount: 1,
        repositioningTurnMinutes: 0, repositioningIntervalHours: 24, repositioningStaffCount: 1,
        medicationAdministrationMinutes: 0, medicationSlotsPerDay: 0,
        environmentalPenaltyMultiplier: 1,
        inpatientDirectCareMinutesPerDay: 25, homeProjectedDirectCareHoursPerDay: 0.4,
        requiresTwoPersonTransfers: false
      };

      const result = estimateCareDemand({
        barthelResponses: { ...dependentBarthel },
        inpatientBenchmark: summaryOnlyBenchmark,
        assessmentSource: 'clinician_observed'
      });

      // 25 min * 1.0 = 25 — must NOT be inflated to 33 (25 * 1.35)
      const bathDriver = result.drivers.find((d) => d.itemId === 'bi_bathing');
      expect(bathDriver?.minutesPerEpisode).toBe(25);
      expect(bathDriver?.calibrationEpisodeCount).toBe(1);
    });

    it('patient-episode-v1 with observations: episode median beats summary field, episodeCount = observation count', () => {
      // Nurse entered 3 individual bathing observations; summary field is intentionally stale/wrong
      const episodeBenchmark: InpatientDischargeBenchmark = {
        id: 'ep-obs-bm', patientUid, recordedAt: new Date().toISOString(),
        observerRole: 'staff_nurse', observerName: 'Nurse C',
        methodologyVersion: 'patient-episode-v1',
        observations: [
          { id: 'b1', taskCategory: 'bathing_hygiene', observedAt: '2026-01-01T07:00:00Z', durationMinutes: 30, staffCount: 1 },
          { id: 'b2', taskCategory: 'bathing_hygiene', observedAt: '2026-01-02T07:00:00Z', durationMinutes: 40, staffCount: 1 },
          { id: 'b3', taskCategory: 'bathing_hygiene', observedAt: '2026-01-03T07:00:00Z', durationMinutes: 35, staffCount: 1 }
        ],
        baselineBarthelResponses: dependentBarthel,
        // Stale summary field (10 min) must be overridden by episode median (35 min)
        spongeBathMinutes: 10, spongeBathStaffCount: 1,
        bedToChairTransferMinutes: 0, transferStaffCount: 1,
        transferAssistType: 'one_person_pivot',
        mealFeedingMinutesPerMeal: 0, mealsRequiringAssistancePerDay: 0,
        feedingAssistType: 'independent',
        toiletingDiaperMinutes: 0, toiletingEpisodesPerDay: 0, toiletingStaffCount: 1,
        repositioningTurnMinutes: 0, repositioningIntervalHours: 24, repositioningStaffCount: 1,
        medicationAdministrationMinutes: 0, medicationSlotsPerDay: 0,
        environmentalPenaltyMultiplier: 1,
        inpatientDirectCareMinutesPerDay: 105, homeProjectedDirectCareHoursPerDay: 1.75,
        requiresTwoPersonTransfers: false
      };

      // When observations[] exist, the Barthel loop guard skips addDriver for bi_bathing entirely.
      // The episode observation block takes over and produces an inpatient_bathing_hygiene driver.
      const result = estimateCareDemand({
        barthelResponses: { ...dependentBarthel },
        inpatientBenchmark: episodeBenchmark,
        assessmentSource: 'clinician_observed'
      });

      const bathDriver = result.drivers.find((d) => d.itemId === 'inpatient_bathing_hygiene');
      expect(bathDriver).toBeDefined();
      // median([30, 35, 40]) = 35; penalty = 1.0
      expect(bathDriver?.minutesPerEpisode).toBe(35);
      expect(bathDriver?.calibrated).toBe(true);   // observationCount (3) >= 2
      expect(bathDriver?.calibrationEpisodeCount).toBe(3);
      expect(bathDriver?.evidenceSource).toBe('inpatient_observed');

      // The stale summary field (10 min) must not appear anywhere as a driver
      expect(result.drivers.find((d) => d.itemId === 'bi_bathing' && d.minutesPerEpisode === 10)).toBeUndefined();
    });

    it('calculates dynamic patient care activities and narrows prediction band to ±15%', () => {
      const dynamicActivities = [
        {
          id: 'act_suction',
          name: 'Airway Suctioning',
          category: 'airway_respiratory' as const,
          durationMinutes: 10,
          staffCount: 1 as const,
          frequencyPerDay: 5 // 50 mins
        },
        {
          id: 'act_ryles',
          name: "Ryle's Tube Feeding",
          category: 'enteral_nutrition' as const,
          durationMinutes: 25,
          staffCount: 1 as const,
          frequencyPerDay: 4 // 100 mins
        },
        {
          id: 'act_turns',
          name: 'Two-Person Bed Repositioning',
          category: 'skin_positioning' as const,
          durationMinutes: 10,
          staffCount: 2 as const,
          frequencyPerDay: 6 // 10 * 6 * 2 = 120 mins
        }
      ];

      const result = estimateCareDemand({
        dynamicNursingActivities: dynamicActivities,
        assessmentSource: 'clinician_observed'
      });

      // Daily staff workload: 50 + 100 + 120 = 270 staff-minutes = 4.5 hours
      const rawDriverMins = result.drivers
        .filter((d) => d.itemId.startsWith('dynamic_'))
        .reduce((sum, d) => sum + d.minutesPerDay, 0);
      expect(rawDriverMins).toBe(270);
      // Net active care workload accounts for shared setup credit
      expect(result.activeCare.pointHours).toBe(3.8);
      // Prediction interval should be tight (around 0.15, ±15%)
      expect(result.bandRelativeHalfWidth).toBeLessThanOrEqual(0.20);
      expect(result.activeCare.lowHours).toBe(3.1);
      expect(result.activeCare.highHours).toBe(4.6);
      // 2-person handling requirement must be retained
      expect(result.requiresTwoPersonTransfers).toBe(true);
      // Drivers must include the dynamic activities
      expect(result.drivers.some((d) => d.label === 'Airway Suctioning')).toBe(true);
      expect(result.drivers.some((d) => d.label === "Ryle's Tube Feeding")).toBe(true);
      expect(result.drivers.some((d) => d.label === 'Two-Person Bed Repositioning')).toBe(true);
    });

    it('persists dynamic activities in InpatientDischargeBenchmark and reflects in CareGapEngine', () => {
      const benchmarkData = {
        patientUid,
        observerRole: 'doctor' as const,
        observerName: 'Dr. Sharma',
        spongeBathMinutes: 0,
        spongeBathStaffCount: 1 as const,
        bedToChairTransferMinutes: 0,
        transferStaffCount: 1 as const,
        transferAssistType: 'one_person_pivot' as const,
        mealFeedingMinutesPerMeal: 0,
        mealsRequiringAssistancePerDay: 0,
        feedingAssistType: 'independent' as const,
        toiletingDiaperMinutes: 0,
        toiletingEpisodesPerDay: 0,
        toiletingStaffCount: 1 as const,
        repositioningTurnMinutes: 0,
        repositioningIntervalHours: 24,
        repositioningStaffCount: 1 as const,
        medicationAdministrationMinutes: 0,
        medicationSlotsPerDay: 0,
        environmentalPenaltyMultiplier: 1,
        dynamicActivities: [
          {
            id: 'dyn_1',
            name: 'Tracheal Suctioning & Secretions',
            category: 'airway_respiratory' as const,
            durationMinutes: 12,
            staffCount: 1 as const,
            frequencyPerDay: 5
          }
        ]
      };

      const saved = saveInpatientDischargeBenchmark(benchmarkData);
      expect(saved.dynamicActivities?.length).toBe(1);
      expect(saved.inpatientDirectCareMinutesPerDay).toBe(60); // 12 * 5 = 60 mins (1.0 hr)
      expect(saved.homeProjectedDirectCareHoursPerDay).toBe(1.0);

      const retrieved = getInpatientDischargeBenchmark(patientUid);
      expect(retrieved?.dynamicActivities?.[0].name).toBe('Tracheal Suctioning & Secretions');

      const evaluation = CareGapEngine.evaluate(
        DEFAULT_CAREGIVER_ATTRIBUTES,
        {
          ...DEFAULT_PATIENT_PROFILE,
          inpatientBenchmark: retrieved!
        }
      );

      expect(evaluation.careDemandBand.inpatientBenchmarkApplied).toBe(true);
      expect(evaluation.careDemandBand.drivers.some((d) => d.label === 'Tracheal Suctioning & Secretions')).toBe(true);
    });
  });
});
