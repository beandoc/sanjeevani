/** Bedside routine checklist and 14-day post-discharge milestones. */

// --- 6b. Domiciliary Checklists (Bedside Routine & Discharge Pathway) ---
// Previously these bypassed HealthRepository entirely — raw
// localStorage.setItem calls in the component itself with no Firestore
// mirror at all, so progress was 100% device-local and invisible to the
// doctor or another family member's device.

export function getBedsideRoutineChecklist(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem('sanjeevani_bedside_tasks_today');
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (e) {
    console.error('Error reading bedside routine checklist:', e);
    return {};
  }
}

export function saveBedsideRoutineChecklist(completedTasks: Record<string, boolean>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('sanjeevani_bedside_tasks_today', JSON.stringify(completedTasks));
  } catch (e) {
    console.error('Error saving bedside routine checklist:', e);
  }
}

export function getDischargeMilestones(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem('sanjeevani_discharge_milestones');
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (e) {
    console.error('Error reading discharge milestones:', e);
    return {};
  }
}

export function saveDischargeMilestones(completedMilestones: Record<string, boolean>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('sanjeevani_discharge_milestones', JSON.stringify(completedMilestones));
  } catch (e) {
    console.error('Error saving discharge milestones:', e);
  }
}
