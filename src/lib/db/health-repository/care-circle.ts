/**
 * The Care Circle: helper members, their coordination tasks, daily rollover,
 * and reconciliation against the caregiver support matrix.
 */

import type { CareCircleMember, CareCircleTask } from './types';
import { STORAGE_KEYS } from './storage-keys';
import { DEFAULT_CIRCLE_MEMBERS, DEFAULT_CIRCLE_TASKS } from './defaults';
import { UNASSIGNED_CARE_TASK_OWNER, MATRIX_MEMBER_PREFIX, matrixLinkedMemberId } from './types';

// --- 8. Care Circle Members & Tasks ---

export function getCareCircleMembers(): CareCircleMember[] {
  if (typeof window === 'undefined') return DEFAULT_CIRCLE_MEMBERS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CARE_CIRCLE_MEMBERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    const cgRaw = localStorage.getItem(STORAGE_KEYS.CAREGIVER_ATTRIBUTES);
    const cgName = cgRaw ? JSON.parse(cgRaw)?.name : null;
    if (cgName && !cgName.includes('(You)') && cgName !== 'Suresh Kumar' && cgName !== 'Primary Caregiver') {
      return [
        {
          id: 'mem_1',
          name: `${cgName} (You)`,
          role: 'Primary Caregiver',
          phone: '',
          isSelf: true,
          avatarColor: 'bg-emerald-600'
        }
      ];
    }
    const ptRaw = localStorage.getItem(STORAGE_KEYS.PATIENT_PROFILE);
    const ptName = ptRaw ? JSON.parse(ptRaw)?.name : null;
    if (ptName && ptName !== 'Smt. Sarojini Devi') {
      return [];
    }
  } catch (e) {
    console.error('Error reading circle members:', e);
  }
  return DEFAULT_CIRCLE_MEMBERS;
}

export function saveCareCircleMembers(members: CareCircleMember[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.CARE_CIRCLE_MEMBERS, JSON.stringify(members));
  } catch (e) {
    console.error('Error saving circle members:', e);
  }
}

export function getCareCircleTasks(): CareCircleTask[] {
  if (typeof window === 'undefined') return DEFAULT_CIRCLE_TASKS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CARE_CIRCLE_TASKS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
    const ptRaw = localStorage.getItem(STORAGE_KEYS.PATIENT_PROFILE);
    const ptName = ptRaw ? JSON.parse(ptRaw)?.name : null;
    if (ptName && ptName !== 'Smt. Sarojini Devi') {
      return [];
    }
  } catch (e) {
    console.error('Error reading circle tasks:', e);
  }
  return DEFAULT_CIRCLE_TASKS;
}

export function saveCareCircleTasks(tasks: CareCircleTask[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.CARE_CIRCLE_TASKS, JSON.stringify(tasks));
  } catch (e) {
    console.error('Error saving circle tasks:', e);
  }
}

export function toggleCareCircleTask(taskId: string): CareCircleTask[] {
  const tasks = getCareCircleTasks();
  const updated = tasks.map((t) => (t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t));
  saveCareCircleTasks(updated);
  return updated;
}

/** Today, in the same `YYYY-MM-DD` shape task due dates are stored in. */
export function careCircleToday(now: Date = new Date()): string {
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

/**
 * Rolls the task list forward to `today`.
 *
 * Daily tasks move to today and un-tick, so the list shows today's state rather than
 * yesterday's ticks. One-off tasks stay on their own date. Completed one-offs older than a
 * fortnight are dropped so the list stops growing without bound.
 */
export function rolloverCareCircleTasks(tasks: CareCircleTask[], now: Date = new Date()): CareCircleTask[] {
  const today = careCircleToday(now);
  const cutoff = careCircleToday(new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000));

  return tasks
    .filter((t) => !(t.recurrence !== 'daily' && t.isCompleted && (t.dueDate || today) < cutoff))
    .map((t) => {
      if (t.recurrence !== 'daily') return t;
      if (t.dueDate === today) return t;
      return { ...t, dueDate: today, isCompleted: false };
    });
}

/**
 * Re-points tasks at the current member roster: renames follow the member id, and tasks whose
 * owner has left the circle are flagged as unassigned rather than silently keeping a stale name.
 */
export function reconcileCareCircleTasks(
  tasks: CareCircleTask[],
  members: CareCircleMember[]
): CareCircleTask[] {
  const byId = new Map(members.map((m) => [m.id, m]));
  const byName = new Map(members.map((m) => [m.name.trim().toLowerCase(), m]));

  return tasks.map((task) => {
    // Backfill the link for tasks written before ids existed.
    if (!task.assignedToId) {
      const matched = byName.get((task.assignedToName || '').trim().toLowerCase());
      if (matched) return { ...task, assignedToId: matched.id, assignedToName: matched.name };
      return task.assignedToName === UNASSIGNED_CARE_TASK_OWNER
        ? task
        : { ...task, assignedToName: UNASSIGNED_CARE_TASK_OWNER };
    }

    const owner = byId.get(task.assignedToId);
    if (!owner) {
      return { ...task, assignedToId: undefined, assignedToName: UNASSIGNED_CARE_TASK_OWNER };
    }
    return owner.name === task.assignedToName ? task : { ...task, assignedToName: owner.name };
  });
}

/**
 * Mirrors the caregiver matrix's secondary members into the care circle: adds new people,
 * follows renames via the linked member id, and removes people who have left the matrix.
 * Previously this only ever appended, so a member deleted from the matrix stayed in the circle
 * forever and a rename produced a duplicate person.
 */
export function reconcileCareCircleMembers(
  existing: CareCircleMember[],
  secondaryMembers: Array<{ id: string; name: string }>
): CareCircleMember[] {
  const colorList = ['bg-blue-600', 'bg-emerald-600', 'bg-purple-600', 'bg-rose-600', 'bg-amber-600'];
  const linkedIds = new Set(secondaryMembers.map((m) => matrixLinkedMemberId(m.id)));

  // Keep everyone who was added directly to the circle; drop matrix-linked people who are gone.
  const kept = existing.filter((m) => !m.id.startsWith(MATRIX_MEMBER_PREFIX) || linkedIds.has(m.id));
  const byId = new Map(kept.map((m) => [m.id, m]));

  const result = [...kept];
  secondaryMembers.forEach((sec, index) => {
    const linkedId = matrixLinkedMemberId(sec.id);
    const name = (sec.name || '').trim() || `Family Helper ${index + 1}`;
    const found = byId.get(linkedId);
    if (found) {
      if (found.name !== name) {
        result[result.indexOf(found)] = { ...found, name };
      }
      return;
    }
    // Someone already in the circle under the same name — adopt them rather than duplicating.
    const sameName = result.find(
      (m) => !m.id.startsWith(MATRIX_MEMBER_PREFIX) && m.name.trim().toLowerCase() === name.toLowerCase()
    );
    if (sameName) return;

    result.push({
      id: linkedId,
      name,
      role: 'Family Member',
      phone: '',
      avatarColor: colorList[index % colorList.length],
      isSelf: false
    });
  });

  return result;
}
