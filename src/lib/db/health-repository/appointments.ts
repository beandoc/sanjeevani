/** Scheduled appointments. */

import type { AppointmentRecord } from './types';
import { STORAGE_KEYS } from './storage-keys';
// --- 3. Appointments Management ---

export function getAppointments(): AppointmentRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      }
    }
  } catch (e) {
    console.error('Error reading appointments:', e);
  }
  return [];
}

export function addAppointment(apt: Omit<AppointmentRecord, 'id' | 'createdAt' | 'status'>): AppointmentRecord {
  const newRecord: AppointmentRecord = {
    ...apt,
    id: `apt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    status: 'scheduled',
    createdAt: new Date().toISOString()
  };
  const current = getAppointments();
  const updated = [...current, newRecord].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  try {
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(updated));
  } catch (e) {
    console.error('Error saving appointment:', e);
  }
  return newRecord;
}

export function deleteAppointment(id: string): void {
  const current = getAppointments();
  const filtered = current.filter((a) => a.id !== id);
  try {
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(filtered));
  } catch (e) {
    console.error('Error deleting appointment:', e);
  }
}

/** Merges a signed-in user's cloud appointments into this device's local
 * cache — same reasoning as mergeVitals. Cloud wins on id collision. */
export function mergeAppointments(cloudAppointments: AppointmentRecord[]): AppointmentRecord[] {
  if (typeof window === 'undefined') return [];
  const local = getAppointments();
  const map = new Map<string, AppointmentRecord>();
  for (const a of local) map.set(a.id, a);
  for (const a of cloudAppointments) map.set(a.id, a);
  const merged = Array.from(map.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  try {
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(merged));
  } catch (e) {
    console.error('Error merging cloud appointments:', e);
  }
  return merged;
}
