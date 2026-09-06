/** Caregiver learning-module section progress. */

import type { ModuleSectionProgress } from './types';
import { STORAGE_KEYS } from './storage-keys';
// --- 4. Module Progress (Section-Set Model) ---

export function getModuleProgressMap(): Record<string, ModuleSectionProgress> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MODULE_PROGRESS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading module progress map:', e);
  }
  return {};
}

export function getCompletedSections(moduleId: string): string[] {
  const map = getModuleProgressMap();
  return map[moduleId]?.completedSections || [];
}

export function toggleSectionCompletion(moduleId: string, sectionId: string): string[] {
  const map = getModuleProgressMap();
  const currentSections = map[moduleId]?.completedSections || [];
  const sectionSet = new Set(currentSections);

  if (sectionSet.has(sectionId)) {
    sectionSet.delete(sectionId);
  } else {
    sectionSet.add(sectionId);
  }

  const updatedSections = Array.from(sectionSet);
  map[moduleId] = {
    moduleId,
    completedSections: updatedSections,
    lastAccessedAt: new Date().toISOString()
  };

  try {
    localStorage.setItem(STORAGE_KEYS.MODULE_PROGRESS, JSON.stringify(map));
  } catch (e) {
    console.error('Error saving section progress:', e);
  }

  return updatedSections;
}

/** Merges a signed-in user's cloud module-progress map into this device's
 * local cache. Per module, the union of completed sections wins (never
 * regresses progress already recorded on either side), and the later
 * lastAccessedAt is kept. */
export function mergeModuleProgress(cloudMap: Record<string, ModuleSectionProgress>): Record<string, ModuleSectionProgress> {
  if (typeof window === 'undefined') return {};
  const local = getModuleProgressMap();
  const merged: Record<string, ModuleSectionProgress> = { ...local };
  for (const [moduleId, cloudEntry] of Object.entries(cloudMap)) {
    const localEntry = local[moduleId];
    const sectionSet = new Set([...(localEntry?.completedSections || []), ...(cloudEntry.completedSections || [])]);
    merged[moduleId] = {
      moduleId,
      completedSections: Array.from(sectionSet),
      lastAccessedAt:
        !localEntry || new Date(cloudEntry.lastAccessedAt).getTime() > new Date(localEntry.lastAccessedAt).getTime()
          ? cloudEntry.lastAccessedAt
          : localEntry.lastAccessedAt
    };
  }
  try {
    localStorage.setItem(STORAGE_KEYS.MODULE_PROGRESS, JSON.stringify(merged));
  } catch (e) {
    console.error('Error merging cloud module progress:', e);
  }
  return merged;
}
