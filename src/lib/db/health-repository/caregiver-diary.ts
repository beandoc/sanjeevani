/**
 * Caregiver Diary Feedback Loop & Calibration Store
 * =================================================
 * Provides lightweight 1-tap mobile logging for caregivers to confirm hands-on
 * assistance duration and strain. Feeds local empirical calibration data
 * into the Care Demand Engine.
 */

import { STORAGE_KEYS } from './storage-keys';
import type {
  CaregiverDiaryEntry,
  CaregiverDiaryTimeBlock,
  CaregiverDiaryTaskCategory,
  CaregiverDurationBracket,
  CaregiverTaskCalibrationMetric,
  CaregiverDiaryCalibrationReport
} from './types';

const MAX_DIARY_ENTRIES = 1500;

export const DURATION_BRACKET_MINUTES: Record<CaregiverDurationBracket, number> = {
  under_15m: 10,
  '15_to_30m': 22.5,
  '30_to_60m': 45,
  '60_to_120m': 90,
  over_120m: 150
};

export const DURATION_BRACKET_LABELS: Record<CaregiverDurationBracket, string> = {
  under_15m: '< 15 mins',
  '15_to_30m': '15 – 30 mins',
  '30_to_60m': '30 – 60 mins',
  '60_to_120m': '1 – 2 hours',
  over_120m: '> 2 hours'
};

export const TASK_CATEGORY_LABELS: Record<CaregiverDiaryTaskCategory, { label: string; icon: string; defaultBlock: CaregiverDiaryTimeBlock }> = {
  transfers_mobility: {
    label: 'Bed-to-Chair Transfer & Walking',
    icon: '🦽',
    defaultBlock: 'morning_rush'
  },
  bathing_hygiene: {
    label: 'Morning Sponge / Bath & Dressing',
    icon: '🚿',
    defaultBlock: 'morning_rush'
  },
  feeding_meals: {
    label: 'Meal Feeding & Hydration',
    icon: '🥣',
    defaultBlock: 'afternoon'
  },
  medications: {
    label: 'Medications & Vital Monitoring',
    icon: '💊',
    defaultBlock: 'evening'
  },
  toileting_incontinence: {
    label: 'Toileting & Diaper Hygiene',
    icon: '🚽',
    defaultBlock: 'morning_rush'
  },
  night_repositioning: {
    label: 'Night Repositioning & Turns',
    icon: '🌙',
    defaultBlock: 'night_watch'
  },
  general_supervision: {
    label: 'Wandering Vigilance & Fall Supervision',
    icon: '👁️',
    defaultBlock: 'afternoon'
  }
};

const keyFor = (patientUid?: string | null) =>
  patientUid
    ? `${STORAGE_KEYS.CAREGIVER_DIARY_LOG}_${patientUid}`
    : STORAGE_KEYS.CAREGIVER_DIARY_LOG;

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

function normalizeDiaryEntry(raw: unknown): CaregiverDiaryEntry | null {
  if (!raw || typeof raw !== 'object') return null;
  const item = raw as Record<string, unknown>;
  if (typeof item.id !== 'string' || !item.id) return null;
  if (typeof item.date !== 'string' || !item.date) return null;

  const bracket = item.durationBracket as CaregiverDurationBracket;
  const durationMinutes =
    typeof item.durationMinutes === 'number' && Number.isFinite(item.durationMinutes)
      ? item.durationMinutes
      : DURATION_BRACKET_MINUTES[bracket] || 30;

  return {
    id: String(item.id),
    patientUid: item.patientUid ? String(item.patientUid) : null,
    recordedAt: typeof item.recordedAt === 'string' ? item.recordedAt : new Date().toISOString(),
    date: String(item.date),
    timeBlock: (item.timeBlock as CaregiverDiaryTimeBlock) || 'morning_rush',
    taskCategory: (item.taskCategory as CaregiverDiaryTaskCategory) || 'transfers_mobility',
    durationBracket: bracket || '15_to_30m',
    durationMinutes,
    staffCount: item.staffCount === 2 ? 2 : 1,
    physicalStrain: (item.physicalStrain as 'mild' | 'moderate' | 'heavy_strain') || 'mild',
    notes: typeof item.notes === 'string' ? item.notes : undefined
  };
}

export function recordCaregiverDiaryEntry(
  entry: Omit<CaregiverDiaryEntry, 'id' | 'recordedAt' | 'date'> & { date?: string }
): CaregiverDiaryEntry {
  const newEntry: CaregiverDiaryEntry = {
    ...entry,
    id: `diary_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    recordedAt: new Date().toISOString(),
    date: entry.date || new Date().toISOString().split('T')[0],
    durationMinutes: entry.durationMinutes || DURATION_BRACKET_MINUTES[entry.durationBracket] || 25
  };

  try {
    const k = keyFor(entry.patientUid);
    const existing = getCaregiverDiaryEntries(entry.patientUid);
    const updated = [newEntry, ...existing].slice(0, MAX_DIARY_ENTRIES);
    setStorageItem(k, JSON.stringify(updated));

    // Also dispatch a custom event for live multi-tab / widget reactivity if in browser
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('sanjeevani:caregiver-diary-updated', { detail: newEntry }));
    }
  } catch (err) {
    console.error('[HealthRepository] Failed to store Caregiver Diary Entry:', err);
  }

  return newEntry;
}

export function getCaregiverDiaryEntries(
  patientUid?: string | null,
  limit?: number
): CaregiverDiaryEntry[] {
  try {
    const k = keyFor(patientUid);
    const raw = getStorageItem(k);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const normalized = parsed
      .map(normalizeDiaryEntry)
      .filter((e): e is CaregiverDiaryEntry => e !== null)
      .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());

    return typeof limit === 'number' && limit > 0 ? normalized.slice(0, limit) : normalized;
  } catch (err) {
    console.error('[HealthRepository] Failed to read Caregiver Diary Entries:', err);
    return [];
  }
}

export function deleteCaregiverDiaryEntry(
  id: string,
  patientUid?: string | null
): boolean {
  try {
    const k = keyFor(patientUid);
    const entries = getCaregiverDiaryEntries(patientUid);
    const filtered = entries.filter((e) => e.id !== id);
    setStorageItem(k, JSON.stringify(filtered));
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('sanjeevani:caregiver-diary-updated'));
    }
    return true;
  } catch {
    return false;
  }
}

export function clearCaregiverDiaryEntries(patientUid?: string | null): void {
  try {
    const k = keyFor(patientUid);
    removeStorageItem(k);
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('sanjeevani:caregiver-diary-updated'));
    }
  } catch {}
}

/**
 * Compute the median of a sorted numeric array. Returns 0 for empty arrays.
 */
function computeMedian(sorted: number[]): number {
  if (sorted.length === 0) return 0;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round(((sorted[mid - 1] + sorted[mid]) / 2) * 10) / 10
    : sorted[mid];
}

/**
 * Computes an empirical calibration report aggregating observed caregiver task times.
 *
 * Design decisions:
 *   - **Median, not mean**, is the primary duration estimate. A single rushed
 *     episode or one outlier should not drag the calibration.
 *   - **Unsafe episodes excluded from duration estimation.** A `safetyConcern`
 *     episode was delivered under compromised technique — it may have taken 8
 *     minutes instead of 20 precisely because corners were cut. Including it
 *     in the median pulls the estimate down where care is worst. It still
 *     counts toward `unsafeEntries` and `totalEntries`.
 *   - **Missed episodes excluded from duration estimation.** A `missed` entry
 *     records that care was not delivered; its duration (usually 0) must never
 *     lower the calibration for what the task actually takes.
 *   - Evidence quality is classified conservatively: 'preliminary' until 7+
 *     distinct observation days, 'repeated_home_observation' after.
 */
export function getCaregiverDiaryCalibrationSummary(
  patientUid?: string | null
): CaregiverDiaryCalibrationReport {
  const entries = getCaregiverDiaryEntries(patientUid);

  const emptyReport: CaregiverDiaryCalibrationReport = {
    patientUid: patientUid ?? null,
    totalEntries: 0,
    metricsByTask: {},
    averageDailyHandsOnMinutes: 0,
    empiricalDirectCareHours: 0,
    observationDays: 0,
    deliveredEntries: 0,
    partiallyDeliveredEntries: 0,
    missedEntries: 0,
    unsafeEntries: 0,
    averageDailyUnmetMinutes: 0,
    homeReportedUnmetCareHours: 0,
    concurrentEntries: 0,
    evidenceQuality: 'none',
    metricsByCategory: {}
  };

  if (entries.length === 0) return emptyReport;

  // --- Aggregate counts ---
  let deliveredEntries = 0;
  let partiallyDeliveredEntries = 0;
  let missedEntries = 0;
  let unsafeEntries = 0;
  let concurrentEntries = 0;

  for (const e of entries) {
    if (e.safetyConcern) unsafeEntries++;
    if (e.concurrentWithOtherActivity) concurrentEntries++;
    switch (e.careStatus) {
      case 'partially_delivered': partiallyDeliveredEntries++; break;
      case 'missed': missedEntries++; break;
      default: deliveredEntries++; break; // undefined or 'delivered'
    }
  }

  // --- Group by task × block ---
  const grouped: Record<string, CaregiverDiaryEntry[]> = {};
  for (const entry of entries) {
    const key = `${entry.taskCategory}__${entry.timeBlock}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(entry);
  }

  const metricsByTask: Record<string, CaregiverTaskCalibrationMetric> = {};

  for (const [key, items] of Object.entries(grouped)) {
    // Duration estimation: exclude missed and unsafe episodes.
    // A rushed episode (safetyConcern) took less time *because* technique was
    // compromised — including it would train the model to expect less where
    // care is worst. A missed episode's duration is zero by definition.
    const safeDurations = items
      .filter((i) => i.careStatus !== 'missed' && !i.safetyConcern)
      .map((i) => i.durationMinutes)
      .sort((a, b) => a - b);

    // If every episode in this group was unsafe or missed, fall back to all
    // durations so the metric is not empty — but mark it via the report-level
    // unsafeEntries count.
    const allDurations = items.map((i) => i.durationMinutes).sort((a, b) => a - b);
    const durations = safeDurations.length > 0 ? safeDurations : allDurations;

    const sum = durations.reduce((acc, d) => acc + d, 0);
    const mean = Math.round((sum / durations.length) * 10) / 10;
    const median = computeMedian(durations);
    const min = durations[0];
    const max = durations[durations.length - 1];
    const twoPersonCount = items.filter((i) => i.staffCount === 2).length;
    const twoPersonPercent = Math.round((twoPersonCount / items.length) * 100);

    metricsByTask[key] = {
      taskCategory: items[0].taskCategory,
      timeBlock: items[0].timeBlock,
      sampleCount: items.length,
      meanMinutes: mean,
      medianMinutes: median,
      minMinutes: min,
      maxMinutes: max,
      twoPersonFrequencyPercent: twoPersonPercent,
      lastLoggedAt: items[0].recordedAt
    };
  }

  // --- Per-category aggregate (collapses time blocks) ---
  const categoryGrouped: Record<string, CaregiverDiaryEntry[]> = {};
  for (const entry of entries) {
    if (!categoryGrouped[entry.taskCategory]) categoryGrouped[entry.taskCategory] = [];
    categoryGrouped[entry.taskCategory].push(entry);
  }

  const metricsByCategory: Partial<Record<CaregiverDiaryTaskCategory, CaregiverTaskCalibrationMetric>> = {};
  for (const [cat, items] of Object.entries(categoryGrouped)) {
    const safeDurations = items
      .filter((i) => i.careStatus !== 'missed' && !i.safetyConcern)
      .map((i) => i.durationMinutes)
      .sort((a, b) => a - b);
    const allDurations = items.map((i) => i.durationMinutes).sort((a, b) => a - b);
    const durations = safeDurations.length > 0 ? safeDurations : allDurations;
    const sum = durations.reduce((acc, d) => acc + d, 0);
    const mean = Math.round((sum / durations.length) * 10) / 10;
    const median = computeMedian(durations);
    const twoPersonCount = items.filter((i) => i.staffCount === 2).length;

    metricsByCategory[cat as CaregiverDiaryTaskCategory] = {
      taskCategory: cat as CaregiverDiaryTaskCategory,
      timeBlock: items[0].timeBlock, // dominant block — informational only
      sampleCount: items.length,
      meanMinutes: mean,
      medianMinutes: median,
      minMinutes: durations[0],
      maxMinutes: durations[durations.length - 1],
      twoPersonFrequencyPercent: Math.round((twoPersonCount / items.length) * 100),
      lastLoggedAt: items[0].recordedAt
    };
  }

  // --- Daily totals ---
  const byDate: Record<string, { handsOnMinutes: number; unmetMinutes: number }> = {};
  for (const entry of entries) {
    if (!byDate[entry.date]) byDate[entry.date] = { handsOnMinutes: 0, unmetMinutes: 0 };
    // Only count delivered/partial durations toward hands-on time
    if (entry.careStatus !== 'missed') {
      byDate[entry.date].handsOnMinutes += entry.durationMinutes * entry.staffCount;
    }
    if (typeof entry.unmetMinutes === 'number' && entry.unmetMinutes > 0) {
      byDate[entry.date].unmetMinutes += entry.unmetMinutes;
    }
  }

  const dayValues = Object.values(byDate);
  const observationDays = dayValues.length;
  const avgDailyMinutes =
    observationDays > 0
      ? Math.round(dayValues.reduce((a, d) => a + d.handsOnMinutes, 0) / observationDays)
      : 0;
  const avgDailyUnmetMinutes =
    observationDays > 0
      ? Math.round(dayValues.reduce((a, d) => a + d.unmetMinutes, 0) / observationDays * 10) / 10
      : 0;

  const empiricalDirectCareHours = Math.round((avgDailyMinutes / 60) * 10) / 10;
  const homeReportedUnmetCareHours = Math.round((avgDailyUnmetMinutes / 60) * 10) / 10;

  // --- Evidence quality ---
  // 'none' with no entries (handled above), 'preliminary' until 7 distinct
  // observation days, 'repeated_home_observation' after. A single interview or
  // a single day of logging is provisional and labelled as such.
  const evidenceQuality: 'none' | 'preliminary' | 'repeated_home_observation' =
    observationDays >= 7 ? 'repeated_home_observation' : 'preliminary';

  return {
    patientUid: patientUid ?? null,
    totalEntries: entries.length,
    firstLoggedAt: entries[entries.length - 1]?.recordedAt,
    lastLoggedAt: entries[0]?.recordedAt,
    metricsByTask,
    averageDailyHandsOnMinutes: avgDailyMinutes,
    empiricalDirectCareHours,
    observationDays,
    deliveredEntries,
    partiallyDeliveredEntries,
    missedEntries,
    unsafeEntries,
    averageDailyUnmetMinutes: avgDailyUnmetMinutes,
    homeReportedUnmetCareHours,
    concurrentEntries,
    evidenceQuality,
    metricsByCategory
  };
}

/**
 * Returns contextual prompt recommendation based on current local hour.
 */
export function getCurrentDiurnalPrompt(): {
  timeBlock: CaregiverDiaryTimeBlock;
  suggestedTasks: CaregiverDiaryTaskCategory[];
  title: string;
  question: string;
} {
  const hour = new Date().getHours();

  if (hour >= 6 && hour < 11) {
    return {
      timeBlock: 'morning_rush',
      suggestedTasks: ['bathing_hygiene', 'transfers_mobility', 'feeding_meals'],
      title: 'Morning Care Check-In',
      question: 'How long did morning bed transfer & sponge bath take today?'
    };
  }

  if (hour >= 11 && hour < 16) {
    return {
      timeBlock: 'afternoon',
      suggestedTasks: ['feeding_meals', 'toileting_incontinence', 'general_supervision'],
      title: 'Midday Assistance Check-In',
      question: 'How long did lunch feeding, hydration & mobility support take?'
    };
  }

  if (hour >= 16 && hour < 21) {
    return {
      timeBlock: 'evening',
      suggestedTasks: ['medications', 'feeding_meals', 'transfers_mobility'],
      title: 'Evening Routine Check-In',
      question: 'How long did dinner feeding, evening meds & bed prep take?'
    };
  }

  return {
    timeBlock: 'night_watch',
    suggestedTasks: ['night_repositioning', 'toileting_incontinence', 'general_supervision'],
    title: 'Night Watch Check-In',
    question: 'How long did night turns or repositioning take tonight?'
  };
}
