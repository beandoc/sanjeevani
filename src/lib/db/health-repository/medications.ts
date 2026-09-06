/** Active medication regimen and per-slot adherence toggles. */

import type { MedicationItem } from './types';
import { STORAGE_KEYS } from './storage-keys';
import { DEFAULT_MEDICATIONS } from './defaults';
// --- 7. Medications Regimen ---

export function getMedications(): MedicationItem[] {
  const todayStr = new Date().toISOString().slice(0, 10);
  let meds: MedicationItem[] = DEFAULT_MEDICATIONS;

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.MEDICATIONS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) meds = parsed;
      }
    } catch (e) {
      console.error('Error reading medications:', e);
    }
  }

  // Daily reset check: If lastTakenDate is from a previous calendar day, reset today's taken slots
  return meds.map((m) => {
    const isSameDay = m.lastTakenDate && m.lastTakenDate.slice(0, 10) === todayStr;
    const takenSlots = isSameDay ? (m.takenSlots || (m.takenToday ? m.timeOfDay : [])) : [];
    const takenToday = takenSlots.length > 0 && m.timeOfDay.every((s) => takenSlots.includes(s));
    return {
      ...m,
      takenSlots,
      takenToday
    };
  });
}

export function saveMedications(meds: MedicationItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.MEDICATIONS, JSON.stringify(meds));
  } catch (e) {
    console.error('Error saving medications:', e);
  }
}

/** A clinician's own local durability cache for a patient's regimen, so a
 * Firestore write failure doesn't lose the edit entirely (see saveMedicationsFor
 * in clinical-sync.ts, which previously had no local fallback at all). */
export function getMedicationsFor(patientUid: string): MedicationItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.MEDICATIONS}_${patientUid}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error(`Error reading medications for ${patientUid}:`, e);
    return [];
  }
}

export function saveMedicationsFor(patientUid: string, meds: MedicationItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${STORAGE_KEYS.MEDICATIONS}_${patientUid}`, JSON.stringify(meds));
  } catch (e) {
    console.error(`Error saving medications for ${patientUid}:`, e);
  }
}

export function toggleMedicationTaken(
  medId: string,
  slot?: 'morning' | 'afternoon' | 'evening' | 'bedtime' | 'sos'
): MedicationItem[] {
  const meds = getMedications();
  const todayStr = new Date().toISOString();

  const updated = meds.map((m) => {
    if (m.id === medId) {
      let currentSlots = [...(m.takenSlots || [])];
      if (slot) {
        if (currentSlots.includes(slot)) {
          currentSlots = currentSlots.filter((s) => s !== slot);
        } else {
          currentSlots.push(slot);
        }
      } else {
        // Toggle all slots for this medicine
        const allCompleted = m.timeOfDay.every((s) => currentSlots.includes(s));
        currentSlots = allCompleted ? [] : [...m.timeOfDay];
      }

      const isFullyTaken = m.timeOfDay.length > 0 && m.timeOfDay.every((s) => currentSlots.includes(s));
      return {
        ...m,
        takenSlots: currentSlots,
        takenToday: isFullyTaken,
        lastTakenDate: todayStr
      };
    }
    return m;
  });

  saveMedications(updated);
  return updated;
}
