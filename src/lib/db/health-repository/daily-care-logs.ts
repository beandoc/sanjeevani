/** Daily bedside care sheets (one per date/shift). */

import type { DailyCareLog } from './types';
import { STORAGE_KEYS } from './storage-keys';
// --- 2b. Daily Bedside Care Logs ---

export function getDailyCareLogs(): DailyCareLog[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DAILY_CARE_LOGS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return normalizeDailyCareLogs(parsed);
  } catch (e) {
    console.error('Error reading daily care logs:', e);
    return [];
  }
}

export function saveDailyCareLog(log: DailyCareLog): DailyCareLog[] {
  if (typeof window === 'undefined') return [];
  const current = getDailyCareLogs();
  const updatedLog = {
    ...log,
    updatedAt: new Date().toISOString()
  };
  const updated = [
    updatedLog,
    ...current.filter((item) => item.id !== updatedLog.id)
  ].slice(0, 365);
  try {
    localStorage.setItem(STORAGE_KEYS.DAILY_CARE_LOGS, JSON.stringify(updated));
  } catch (e) {
    console.error('Error saving daily care log:', e);
  }
  return updated;
}

export function getDailyCareLogsFor(patientUid: string): DailyCareLog[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.DAILY_CARE_LOGS}_${patientUid}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return normalizeDailyCareLogs(parsed);
  } catch (e) {
    console.error(`Error reading daily care logs for ${patientUid}:`, e);
    return [];
  }
}

export function saveDailyCareLogFor(patientUid: string, log: DailyCareLog): DailyCareLog[] {
  if (typeof window === 'undefined') return [];
  const current = getDailyCareLogsFor(patientUid);
  const updatedLog = {
    ...log,
    patientUid,
    updatedAt: new Date().toISOString()
  };
  const updated = [
    updatedLog,
    ...current.filter((item) => item.id !== updatedLog.id)
  ].slice(0, 365);
  try {
    localStorage.setItem(`${STORAGE_KEYS.DAILY_CARE_LOGS}_${patientUid}`, JSON.stringify(updated));
  } catch (e) {
    console.error(`Error saving daily care log for ${patientUid}:`, e);
  }
  return updated;
}

function normalizeDailyCareLogs(items: unknown[]): DailyCareLog[] {
  return items
    .filter((item) => item && typeof item === 'object')
    .map((item) => {
      const raw = item as Record<string, any>;
      return {
        id: String(raw.id || `daily_${raw.date || new Date().toISOString().slice(0, 10)}_${raw.shift || 'full_day'}`),
        date: String(raw.date || new Date().toISOString().slice(0, 10)),
        shift: raw.shift || 'full_day',
        patientUid: raw.patientUid ?? null,
        patientName: raw.patientName ?? null,
        recordedByName: raw.recordedByName ?? null,
        recordedByRole: raw.recordedByRole || 'unknown',
        meals: raw.meals && typeof raw.meals === 'object' ? raw.meals : {},
        monitoringRows: Array.isArray(raw.monitoringRows) ? raw.monitoringRows : [],
        medications: Array.isArray(raw.medications) ? raw.medications : [],
        stoolPassed: typeof raw.stoolPassed === 'boolean' ? raw.stoolPassed : null,
        urineMorningMl: raw.urineMorningMl || undefined,
        urineEveningMl: raw.urineEveningMl || undefined,
        waterIntakeMl: raw.waterIntakeMl || undefined,
        catheterChanged: typeof raw.catheterChanged === 'boolean' ? raw.catheterChanged : null,
        sleep: raw.sleep || 'not_recorded',
        generalRemarks: raw.generalRemarks || undefined,
        createdAt: raw.createdAt || new Date().toISOString(),
        updatedAt: raw.updatedAt || raw.createdAt || new Date().toISOString()
      } as DailyCareLog;
    })
    .sort((a, b) => {
      const dateDelta = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateDelta !== 0) return dateDelta;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
}
