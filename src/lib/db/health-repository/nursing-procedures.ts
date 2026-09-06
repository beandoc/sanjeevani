/** Per-date bedside nursing procedure checklists. */

// --- 7b. Nursing Procedures Checklist (per patient, per calendar date) ---
// Previously the nurse-shift dashboard's checklist was plain React state
// with no persistence at all — a page refresh silently discarded the
// shift's completed-procedure record. Keyed by date so it naturally
// resets each day, same convention as the daily reset in getMedications.

export function getNursingProceduresFor(patientUid: string, date: string): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(`sanjeevani_nursing_procedures_${patientUid}_${date}`);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (e) {
    console.error(`Error reading nursing procedures for ${patientUid}/${date}:`, e);
    return {};
  }
}

export function saveNursingProceduresFor(patientUid: string, date: string, procedures: Record<string, boolean>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`sanjeevani_nursing_procedures_${patientUid}_${date}`, JSON.stringify(procedures));
  } catch (e) {
    console.error(`Error saving nursing procedures for ${patientUid}/${date}:`, e);
  }
}
