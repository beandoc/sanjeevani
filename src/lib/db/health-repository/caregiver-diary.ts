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
 * Computes an empirical calibration report aggregating observed caregiver task times.
 */
export function getCaregiverDiaryCalibrationSummary(
  patientUid?: string | null
): CaregiverDiaryCalibrationReport {
  const entries = getCaregiverDiaryEntries(patientUid);

  if (entries.length === 0) {
    return {
      patientUid: patientUid ?? null,
      totalEntries: 0,
      metricsByTask: {},
      averageDailyHandsOnMinutes: 0,
      empiricalDirectCareHours: 0
    };
  }

  const grouped: Record<string, CaregiverDiaryEntry[]> = {};
  for (const entry of entries) {
    const key = `${entry.taskCategory}__${entry.timeBlock}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(entry);
  }

  const metricsByTask: Record<string, CaregiverTaskCalibrationMetric> = {};

  for (const [key, items] of Object.entries(grouped)) {
    const durations = items.map((i) => i.durationMinutes);
    const sum = durations.reduce((acc, d) => acc + d, 0);
    const mean = Math.round((sum / items.length) * 10) / 10;
    const min = Math.min(...durations);
    const max = Math.max(...durations);
    const twoPersonCount = items.filter((i) => i.staffCount === 2).length;
    const twoPersonPercent = Math.round((twoPersonCount / items.length) * 100);

    metricsByTask[key] = {
      taskCategory: items[0].taskCategory,
      timeBlock: items[0].timeBlock,
      sampleCount: items.length,
      meanMinutes: mean,
      minMinutes: min,
      maxMinutes: max,
      twoPersonFrequencyPercent: twoPersonPercent,
      lastLoggedAt: items[0].recordedAt
    };
  }

  // Calculate distinct daily totals to estimate average hands-on minutes/day
  const byDate: Record<string, number> = {};
  for (const entry of entries) {
    byDate[entry.date] = (byDate[entry.date] || 0) + entry.durationMinutes * entry.staffCount;
  }

  const days = Object.values(byDate);
  const avgDailyMinutes =
    days.length > 0
      ? Math.round(days.reduce((a, b) => a + b, 0) / days.length)
      : 0;

  const empiricalDirectCareHours = Math.round((avgDailyMinutes / 60) * 10) / 10;

  return {
    patientUid: patientUid ?? null,
    totalEntries: entries.length,
    firstLoggedAt: entries[entries.length - 1]?.recordedAt,
    lastLoggedAt: entries[0]?.recordedAt,
    metricsByTask,
    averageDailyHandsOnMinutes: avgDailyMinutes,
    empiricalDirectCareHours
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
