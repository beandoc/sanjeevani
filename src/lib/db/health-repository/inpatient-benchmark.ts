/**
 * Inpatient Pre-Discharge Care Timing Benchmark Store
 * ===================================================
 * Stores empirical pre-discharge care task timings recorded by ward nurses,
 * GDAs, and doctors during the 24-48h pre-discharge window.
 * Provides a patient-specific empirical baseline for care planning. Hospital
 * observations are contextual measurements, not a validated gold standard for
 * home care and are retained with their sample size and range.
 */

import { STORAGE_KEYS } from './storage-keys';
import type {
  DynamicNursingCareActivity,
  InpatientCareEpisodeObservation,
  InpatientCareTaskCategory,
  InpatientDischargeBenchmark
} from './types';

const inMemoryVault: Record<string, string> = {};

function getStorageItem(key: string): string | null {
  if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
    try {
      return localStorage.getItem(key);
    } catch {
      return inMemoryVault[key] ?? null;
    }
  }
  return inMemoryVault[key] ?? null;
}

function setStorageItem(key: string, value: string): void {
  inMemoryVault[key] = value;
  if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
    try {
      localStorage.setItem(key, value);
    } catch {}
  }
}

function removeStorageItem(key: string): void {
  delete inMemoryVault[key];
  if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
    try {
      localStorage.removeItem(key);
    } catch {}
  }
}

const keyFor = (patientUid: string) =>
  `${STORAGE_KEYS.INPATIENT_DISCHARGE_BENCHMARK}_${patientUid}`;

/** New observations are not inflated by an unvalidated universal home multiplier. */
export const DEFAULT_ENVIRONMENTAL_PENALTY = 1;

export interface InpatientTaskObservationSummary {
  taskCategory: InpatientCareTaskCategory;
  observationCount: number;
  medianMinutes: number;
  minMinutes: number;
  maxMinutes: number;
  staffCount: 1 | 2;
}

const median = (values: number[]): number => {
  const sorted = [...values].sort((a, b) => a - b);
  if (sorted.length === 0) return 0;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
};

/** Aggregate raw episodes without discarding their range or sample size. */
export function summarizeInpatientObservations(
  observations: InpatientCareEpisodeObservation[] = []
): Partial<Record<InpatientCareTaskCategory, InpatientTaskObservationSummary>> {
  const out: Partial<Record<InpatientCareTaskCategory, InpatientTaskObservationSummary>> = {};
  const categories: InpatientCareTaskCategory[] = [
    'bathing_hygiene',
    'transfers_mobility',
    'feeding_meals',
    'toileting_incontinence',
    'repositioning',
    'medications'
  ];
  for (const taskCategory of categories) {
    const rows = observations.filter(
      (o) => o.taskCategory === taskCategory && o.durationMinutes > 0
    );
    if (rows.length === 0) continue;
    const durations = rows.map((o) => o.durationMinutes);
    out[taskCategory] = {
      taskCategory,
      observationCount: rows.length,
      medianMinutes: Math.round(median(durations) * 10) / 10,
      minMinutes: Math.min(...durations),
      maxMinutes: Math.max(...durations),
      // If any observed episode required two staff, retain that safety requirement.
      staffCount: rows.some((o) => o.staffCount === 2) ? 2 : 1
    };
  }
  return out;
}

/**
 * Computes derived daily direct care minutes and home projected care hours.
 */
export function calculateBenchmarkSummary(params: {
  spongeBathMinutes: number;
  spongeBathStaffCount: 1 | 2;
  bedToChairTransferMinutes: number;
  transferStaffCount: 1 | 2;
  transferEpisodesPerDay?: number;
  mealFeedingMinutesPerMeal: number;
  mealsRequiringAssistancePerDay: number;
  toiletingDiaperMinutes: number;
  toiletingEpisodesPerDay: number;
  toiletingStaffCount: 1 | 2;
  repositioningTurnMinutes: number;
  repositioningIntervalHours: number;
  repositioningStaffCount: 1 | 2;
  medicationAdministrationMinutes: number;
  medicationSlotsPerDay: number;
  dressingMinutes?: number;
  dressingSlotsPerDay?: number;
  environmentalPenaltyMultiplier?: number;
  observations?: InpatientCareEpisodeObservation[];
  dynamicActivities?: DynamicNursingCareActivity[];
}): {
  inpatientDirectCareMinutesPerDay: number;
  homeProjectedDirectCareHoursPerDay: number;
  requiresTwoPersonTransfers: boolean;
} {
  const penalty = params.environmentalPenaltyMultiplier ?? DEFAULT_ENVIRONMENTAL_PENALTY;
  const observed = summarizeInpatientObservations(params.observations);
  const valueFor = (
    task: InpatientCareTaskCategory,
    fallbackMinutes: number,
    fallbackStaff: 1 | 2 = 1
  ) => ({
    minutes: observed[task]?.medianMinutes ?? fallbackMinutes,
    staff: observed[task]?.staffCount ?? fallbackStaff
  });

  // Repositioning episodes per day (24 hours / interval, e.g. 24/2 = 12 turns)
  const interval = Math.max(1, params.repositioningIntervalHours);
  const turnsPerDay = Math.min(24, Math.round(24 / interval));

  // Inpatient hands-on caregiver-minutes
  const bath = valueFor('bathing_hygiene', params.spongeBathMinutes, params.spongeBathStaffCount);
  const transfer = valueFor('transfers_mobility', params.bedToChairTransferMinutes, params.transferStaffCount);
  const feeding = valueFor('feeding_meals', params.mealFeedingMinutesPerMeal);
  const toileting = valueFor('toileting_incontinence', params.toiletingDiaperMinutes, params.toiletingStaffCount);
  const turning = valueFor('repositioning', params.repositioningTurnMinutes, params.repositioningStaffCount);
  const medications = valueFor('medications', params.medicationAdministrationMinutes);

  const bathMin = bath.minutes * bath.staff;
  const transferMin = transfer.minutes * (params.transferEpisodesPerDay ?? 3) * transfer.staff;
  const feedingMin = feeding.minutes * params.mealsRequiringAssistancePerDay * feeding.staff;
  const toiletingMin = toileting.minutes * params.toiletingEpisodesPerDay * toileting.staff;
  const turnMin = turning.minutes * turnsPerDay * turning.staff;
  const medMin = medications.minutes * params.medicationSlotsPerDay * medications.staff;
  const dressMin = (params.dressingMinutes ?? 0) * (params.dressingSlotsPerDay ?? 0);

  let dynamicMinutes = 0;
  let dynamicRequiresTwoStaff = false;
  if (params.dynamicActivities && params.dynamicActivities.length > 0) {
    for (const act of params.dynamicActivities) {
      if (act.durationMinutes > 0 && act.frequencyPerDay > 0) {
        dynamicMinutes += act.durationMinutes * act.frequencyPerDay * (act.staffCount ?? 1);
        if (act.staffCount === 2) dynamicRequiresTwoStaff = true;
      }
    }
  }

  const totalInpatientMinutes = bathMin + transferMin + feedingMin + toiletingMin + turnMin + medMin + dressMin + dynamicMinutes;
  const homeProjectedMinutes = totalInpatientMinutes * penalty;
  const homeProjectedHours = Math.round((homeProjectedMinutes / 60) * 10) / 10;

  return {
    inpatientDirectCareMinutesPerDay: Math.round(totalInpatientMinutes),
    homeProjectedDirectCareHoursPerDay: homeProjectedHours,
    requiresTwoPersonTransfers: transfer.staff === 2 || dynamicRequiresTwoStaff
  };
}

export function saveInpatientDischargeBenchmark(
  benchmark: Omit<
    InpatientDischargeBenchmark,
    'id' | 'recordedAt' | 'inpatientDirectCareMinutesPerDay' | 'homeProjectedDirectCareHoursPerDay' | 'requiresTwoPersonTransfers'
  > & {
    id?: string;
    recordedAt?: string;
    environmentalPenaltyMultiplier?: number;
  }
): InpatientDischargeBenchmark {
  const penalty = benchmark.environmentalPenaltyMultiplier ?? DEFAULT_ENVIRONMENTAL_PENALTY;
  const derived = calculateBenchmarkSummary({
    spongeBathMinutes: benchmark.spongeBathMinutes,
    spongeBathStaffCount: benchmark.spongeBathStaffCount,
    bedToChairTransferMinutes: benchmark.bedToChairTransferMinutes,
    transferStaffCount: benchmark.transferStaffCount,
    transferEpisodesPerDay: benchmark.transferEpisodesPerDay,
    mealFeedingMinutesPerMeal: benchmark.mealFeedingMinutesPerMeal,
    mealsRequiringAssistancePerDay: benchmark.mealsRequiringAssistancePerDay,
    toiletingDiaperMinutes: benchmark.toiletingDiaperMinutes,
    toiletingEpisodesPerDay: benchmark.toiletingEpisodesPerDay,
    toiletingStaffCount: benchmark.toiletingStaffCount,
    repositioningTurnMinutes: benchmark.repositioningTurnMinutes,
    repositioningIntervalHours: benchmark.repositioningIntervalHours,
    repositioningStaffCount: benchmark.repositioningStaffCount,
    medicationAdministrationMinutes: benchmark.medicationAdministrationMinutes,
    medicationSlotsPerDay: benchmark.medicationSlotsPerDay,
    environmentalPenaltyMultiplier: penalty,
    observations: benchmark.observations,
    dynamicActivities: benchmark.dynamicActivities
  });

  const record: InpatientDischargeBenchmark = {
    ...benchmark,
    id: benchmark.id || `inpatient_bm_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    recordedAt: benchmark.recordedAt || new Date().toISOString(),
    environmentalPenaltyMultiplier: penalty,
    methodologyVersion: benchmark.observations?.length
      ? 'patient-episode-v1'
      : benchmark.methodologyVersion ?? 'legacy-summary-v0',
    ...derived
  };

  try {
    const k = keyFor(benchmark.patientUid);
    setStorageItem(k, JSON.stringify(record));

    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(
        new CustomEvent('sanjeevani:inpatient-benchmark-updated', { detail: record })
      );
    }
  } catch (err) {
    console.error('[HealthRepository] Failed to save Inpatient Discharge Benchmark:', err);
  }

  return record;
}

export function getInpatientDischargeBenchmark(
  patientUid: string
): InpatientDischargeBenchmark | null {
  try {
    const k = keyFor(patientUid);
    const raw = getStorageItem(k);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !parsed.patientUid) return null;
    return parsed as InpatientDischargeBenchmark;
  } catch (err) {
    console.error('[HealthRepository] Failed to read Inpatient Discharge Benchmark:', err);
    return null;
  }
}

export function clearInpatientDischargeBenchmark(patientUid: string): void {
  try {
    const k = keyFor(patientUid);
    removeStorageItem(k);
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('sanjeevani:inpatient-benchmark-updated'));
    }
  } catch {}
}
