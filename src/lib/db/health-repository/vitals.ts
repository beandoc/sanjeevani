/** Vital sign readings, plus the per-dyad and cloud-merge variants. */

import type { VitalRecord } from './types';
import { STORAGE_KEYS } from './storage-keys';
// --- 2. Vitals Management ---

export function getVitals(): VitalRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.VITALS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }
    }
  } catch (e) {
    console.error('Error reading vitals:', e);
  }
  return [];
}

export function addVital(vital: Omit<VitalRecord, 'id' | 'createdAt'>): VitalRecord {
  const computedBp =
    vital.bp ||
    (vital.systolic && vital.diastolic
      ? `${vital.systolic}/${vital.diastolic}`
      : vital.systolic || undefined);

  const newRecord: VitalRecord = {
    ...vital,
    bp: computedBp,
    id: `vital_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    createdAt: new Date().toISOString()
  };
  const current = getVitals();
  const updated = [newRecord, ...current].slice(0, 100);
  try {
    localStorage.setItem(STORAGE_KEYS.VITALS, JSON.stringify(updated));
  } catch (e) {
    console.error('Error saving vital:', e);
  }
  return newRecord;
}

export function deleteVital(id: string): void {
  const current = getVitals();
  const filtered = current.filter((v) => v.id !== id);
  try {
    localStorage.setItem(STORAGE_KEYS.VITALS, JSON.stringify(filtered));
  } catch (e) {
    console.error('Error deleting vital:', e);
  }
}

// Vitals are an immutable clinical audit trail once synced to Firestore
// (firestore.rules explicitly forbids update/delete on the vitals
// subcollection — a doctor's view of the trend must not lose an entry the
// caregiver regrets). deleteVital above only removes this device's local
// cache copy; if the record already reached the cloud, a merge with
// getVitalsFor would otherwise resurrect it right back into view on the
// next load. This per-device "dismiss" list lets the caregiver hide an
// entry from their own history without erasing the clinical record.
export function getDismissedVitalIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('sanjeevani_dismissed_vital_ids');
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Error reading dismissed vital ids:', e);
    return [];
  }
}

export function dismissVital(id: string): void {
  if (typeof window === 'undefined') return;
  const ids = new Set(getDismissedVitalIds());
  ids.add(id);
  try {
    localStorage.setItem('sanjeevani_dismissed_vital_ids', JSON.stringify(Array.from(ids)));
  } catch (e) {
    console.error('Error dismissing vital:', e);
  }
}

export function undismissVital(id: string): void {
  if (typeof window === 'undefined') return;
  const ids = new Set(getDismissedVitalIds());
  ids.delete(id);
  try {
    localStorage.setItem('sanjeevani_dismissed_vital_ids', JSON.stringify(Array.from(ids)));
  } catch (e) {
    console.error('Error un-dismissing vital:', e);
  }
}

// --- 2a. Vitals recorded on a patient's behalf (clinician/nurse "for" a
// dyad, keyed separately from this device's own vitals above so a granted
// clinician's local durability doesn't collide with their own account). ---

export function getVitalsFor(patientUid: string): VitalRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.VITALS}_${patientUid}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (e) {
    console.error(`Error reading vitals for ${patientUid}:`, e);
    return [];
  }
}

export function saveVitalFor(patientUid: string, vital: VitalRecord): VitalRecord[] {
  if (typeof window === 'undefined') return [];
  const current = getVitalsFor(patientUid);
  if (current.some((v) => v.id === vital.id)) return current;
  const updated = [vital, ...current].slice(0, 200);
  try {
    localStorage.setItem(`${STORAGE_KEYS.VITALS}_${patientUid}`, JSON.stringify(updated));
  } catch (e) {
    console.error(`Error saving vital for ${patientUid}:`, e);
  }
  return updated;
}

/** Merges a signed-in user's cloud vitals into THIS device's own vitals
 * cache (the plain, non-"For" list most pages read via getVitals()) — so
 * a reading entered on another device shows up here too, not just in the
 * clinician "for" cache. Cloud wins on id collision (Firestore is
 * authoritative once signed in). */
export function mergeVitals(cloudVitals: VitalRecord[]): VitalRecord[] {
  if (typeof window === 'undefined') return [];
  const local = getVitals();
  const map = new Map<string, VitalRecord>();
  for (const v of local) map.set(v.id, v);
  for (const v of cloudVitals) map.set(v.id, v);
  const merged = Array.from(map.values())
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 200);
  try {
    localStorage.setItem(STORAGE_KEYS.VITALS, JSON.stringify(merged));
  } catch (e) {
    console.error('Error merging cloud vitals:', e);
  }
  return merged;
}
