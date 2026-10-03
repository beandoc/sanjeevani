/**
 * Inpatient Pre-Discharge Care Timing Benchmark Store
 * ===================================================
 * Stores empirical pre-discharge care task timings recorded by ward nurses,
 * GDAs, and doctors during the 24-48h pre-discharge window.
 * Acts as the objective gold-standard benchmark ($T_hospital) to calibrate
 * home care demand and the Caregiver Support Matrix.
 */

import { STORAGE_KEYS } from './storage-keys';
import type { InpatientDischargeBenchmark } from './types';

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

export const DEFAULT_ENVIRONMENTAL_PENALTY = 1.35; // 35% time inflation at home

/**
 * Computes derived daily direct care minutes and home projected care hours.
 */
export function calculateBenchmarkSummary(params: {
  spongeBathMinutes: number;
  spongeBathStaffCount: 1 | 2;
  bedToChairTransferMinutes: number;
  transferStaffCount: 1 | 2;
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
  environmentalPenaltyMultiplier?: number;
}): {
  inpatientDirectCareMinutesPerDay: number;
  homeProjectedDirectCareHoursPerDay: number;
  requiresTwoPersonTransfers: boolean;
} {
  const penalty = params.environmentalPenaltyMultiplier ?? DEFAULT_ENVIRONMENTAL_PENALTY;

  // Repositioning episodes per day (24 hours / interval, e.g. 24/2 = 12 turns)
  const interval = Math.max(1, params.repositioningIntervalHours);
  const turnsPerDay = Math.min(24, Math.round(24 / interval));

  // Inpatient hands-on caregiver-minutes
  const bathMin = params.spongeBathMinutes * params.spongeBathStaffCount;
  // 3 transfers per day typical (morning up, afternoon rest, evening bed)
  const transferMin = params.bedToChairTransferMinutes * 3 * params.transferStaffCount;
  const feedingMin = params.mealFeedingMinutesPerMeal * params.mealsRequiringAssistancePerDay;
  const toiletingMin = params.toiletingDiaperMinutes * params.toiletingEpisodesPerDay * params.toiletingStaffCount;
  const turnMin = params.repositioningTurnMinutes * turnsPerDay * params.repositioningStaffCount;
  const medMin = params.medicationAdministrationMinutes * params.medicationSlotsPerDay;

  const totalInpatientMinutes = bathMin + transferMin + feedingMin + toiletingMin + turnMin + medMin;
  const homeProjectedMinutes = totalInpatientMinutes * penalty;
  const homeProjectedHours = Math.round((homeProjectedMinutes / 60) * 10) / 10;

  return {
    inpatientDirectCareMinutesPerDay: Math.round(totalInpatientMinutes),
    homeProjectedDirectCareHoursPerDay: homeProjectedHours,
    requiresTwoPersonTransfers: params.transferStaffCount === 2
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
    environmentalPenaltyMultiplier: penalty
  });

  const record: InpatientDischargeBenchmark = {
    ...benchmark,
    id: benchmark.id || `inpatient_bm_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    recordedAt: benchmark.recordedAt || new Date().toISOString(),
    environmentalPenaltyMultiplier: penalty,
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
