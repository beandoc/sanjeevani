/**
 * The two append-only clinical series: Zarit caregiver-burden interviews and
 * Barthel/Lawton function scores, each with a per-dyad variant.
 */

import { STORAGE_KEYS } from './storage-keys';
import { ZaritEvaluationResult } from '@/lib/zarit-scale';
import type { FunctionEvaluationResult } from '@/lib/clinical/function-scale';
// --- 5. Zarit Assessments History ---

export function getZaritAssessments(): ZaritEvaluationResult[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ZARIT);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => {
            if (!item || typeof item !== 'object') return null;
            const classification =
              typeof item.classification === 'object' && item.classification !== null
                ? {
                    en: item.classification.en || 'Standard Assessment',
                    hi: item.classification.hi || item.classification.en || 'मानक मूल्यांकन',
                    mr: item.classification.mr || item.classification.en || 'मानक मूल्यांकन'
                  }
                : {
                    en: String(item.classification || 'Standard Assessment'),
                    hi: String(item.classification || 'मानक मूल्यांकन'),
                    mr: String(item.classification || 'मानक मूल्यांकन')
                  };

            return {
              ...item,
              tier: item.tier || 'ZBI22',
              totalScore: Number(item.totalScore ?? 0),
              maxScore: Number(item.maxScore ?? 88),
              normalizedPercentage: Number(item.normalizedPercentage ?? 0),
              severityBand: item.severityBand || 'normal',
              classification,
              domainCapacities: item.domainCapacities || {
                psychosocial: null,
                resource: null,
                physical: null,
                safety: null,
                cognitive_behavioral: null,
                medical: null
              },
              factors: item.factors || {},
              redFlags: Array.isArray(item.redFlags) ? item.redFlags : [],
              isCrisisTriggered: Boolean(item.isCrisisTriggered),
              prescriptions: Array.isArray(item.prescriptions) ? item.prescriptions : [],
              completedAt: item.completedAt || new Date().toISOString()
            } as ZaritEvaluationResult;
          })
          .filter((item): item is ZaritEvaluationResult => item !== null)
          .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
      }
    }
  } catch (e) {
    console.error('Error reading Zarit history:', e);
  }
  return [];
}

function normalizeZaritAssessment(item: unknown): ZaritEvaluationResult | null {
  if (!item || typeof item !== 'object') return null;
  const raw = item as Record<string, any>;
  const classification =
    typeof raw.classification === 'object' && raw.classification !== null
      ? {
          en: raw.classification.en || 'Standard Assessment',
          hi: raw.classification.hi || raw.classification.en || 'मानक मूल्यांकन',
          mr: raw.classification.mr || raw.classification.en || 'मानक मूल्यांकन'
        }
      : {
          en: String(raw.classification || 'Standard Assessment'),
          hi: String(raw.classification || 'मानक मूल्यांकन'),
          mr: String(raw.classification || 'मानक मूल्यांकन')
        };

  return {
    ...raw,
    tier: raw.tier || 'ZBI22',
    totalScore: Number(raw.totalScore ?? 0),
    maxScore: Number(raw.maxScore ?? 88),
    normalizedPercentage: Number(raw.normalizedPercentage ?? 0),
    severityBand: raw.severityBand || 'normal',
    classification,
    domainCapacities: raw.domainCapacities || {
      psychosocial: null,
      resource: null,
      physical: null,
      safety: null,
      cognitive_behavioral: null,
      medical: null
    },
    factors: raw.factors || {},
    redFlags: Array.isArray(raw.redFlags) ? raw.redFlags : [],
    isCrisisTriggered: Boolean(raw.isCrisisTriggered),
    prescriptions: Array.isArray(raw.prescriptions) ? raw.prescriptions : [],
    completedAt: raw.completedAt || new Date().toISOString()
  } as ZaritEvaluationResult;
}

export function saveZaritAssessment(result: ZaritEvaluationResult): ZaritEvaluationResult[] {
  const current = getZaritAssessments();

  // A double-click (or a retry after a slow render) on the finish button
  // saves the identical result twice. Two points at the same timestamp
  // don't just duplicate a row — they inflate `n` toward the reliability
  // floor and push the OLS fit toward the sxx=0 degenerate case, so guard
  // against near-simultaneous saves of the same completion.
  const DUPLICATE_WINDOW_MS = 5000;
  const isDuplicate = current.some(
    (prev) =>
      prev.tier === result.tier &&
      prev.totalScore === result.totalScore &&
      Math.abs(new Date(prev.completedAt).getTime() - new Date(result.completedAt).getTime()) <
        DUPLICATE_WINDOW_MS
  );
  if (isDuplicate) return current;

  // At the recommended cadence (isReassessmentDue in zarit-scale.ts: ~21
  // days for ZBI-4, quarterly for ZBI-22/12), 30 records is under 2.5 years
  // of history for what is often a multi-year caregiving journey — and the
  // Firestore mirror (clinical-sync.ts) keeps every record uncapped, so a
  // long-running local device and the cloud copy silently diverge in
  // length. 180 covers a decade of quarterly assessments (or several years
  // of mixed-cadence use) while still bounding local storage.
  const MAX_LOCAL_ZARIT_HISTORY = 180;
  const updated = [result, ...current].slice(0, MAX_LOCAL_ZARIT_HISTORY);
  try {
    localStorage.setItem(STORAGE_KEYS.ZARIT, JSON.stringify(updated));
  } catch (e) {
    console.error('Error saving Zarit assessment:', e);
  }
  return updated;
}

/** Merges a signed-in user's cloud Zarit history into this device's local
 * cache, keyed by completedAt (assessments have no separate id field). */
export function mergeZaritAssessments(cloudAssessments: ZaritEvaluationResult[]): ZaritEvaluationResult[] {
  if (typeof window === 'undefined') return [];
  const local = getZaritAssessments();
  const map = new Map<string, ZaritEvaluationResult>();
  for (const z of local) map.set(z.completedAt, z);
  for (const z of cloudAssessments) map.set(z.completedAt, z);
  const merged = Array.from(map.values())
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
    .slice(0, 180);
  try {
    localStorage.setItem(STORAGE_KEYS.ZARIT, JSON.stringify(merged));
  } catch (e) {
    console.error('Error merging cloud Zarit assessments:', e);
  }
  return merged;
}

export function getZaritAssessmentsFor(patientUid: string): ZaritEvaluationResult[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.ZARIT}_${patientUid}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => normalizeZaritAssessment(item))
      .filter((item): item is ZaritEvaluationResult => item !== null)
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
  } catch (e) {
    console.error(`Error reading Zarit history for ${patientUid}:`, e);
    return [];
  }
}

export function saveZaritAssessmentFor(patientUid: string, result: ZaritEvaluationResult): ZaritEvaluationResult[] {
  if (typeof window === 'undefined') return [];
  const current = getZaritAssessmentsFor(patientUid);
  const DUPLICATE_WINDOW_MS = 5000;
  const isDuplicate = current.some(
    (prev) =>
      prev.tier === result.tier &&
      prev.totalScore === result.totalScore &&
      Math.abs(new Date(prev.completedAt).getTime() - new Date(result.completedAt).getTime()) <
        DUPLICATE_WINDOW_MS
  );
  if (isDuplicate) return current;

  const updated = [result, ...current].slice(0, 180);
  try {
    localStorage.setItem(`${STORAGE_KEYS.ZARIT}_${patientUid}`, JSON.stringify(updated));
  } catch (e) {
    console.error(`Error saving Zarit assessment for ${patientUid}:`, e);
  }
  return updated;
}

export function getFunctionScoresFor(patientUid: string): FunctionEvaluationResult[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.FUNCTION_SCORES}_${patientUid}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => item && typeof item === 'object')
      .map((item) => ({
        ...item,
        barthelScore: Number(item.barthelScore ?? 0),
        barthelMax: Number(item.barthelMax ?? 100),
        lawtonScore: Number(item.lawtonScore ?? 0),
        lawtonMax: Number(item.lawtonMax ?? 8),
        dependencyPercentage: Number(item.dependencyPercentage ?? 100),
        recordedAt: item.recordedAt || new Date().toISOString()
      }) as FunctionEvaluationResult)
      .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
  } catch (e) {
    console.error(`Error reading function scores for ${patientUid}:`, e);
    return [];
  }
}

export function saveFunctionScoreFor(patientUid: string, result: FunctionEvaluationResult): FunctionEvaluationResult[] {
  if (typeof window === 'undefined') return [];
  const current = getFunctionScoresFor(patientUid);
  const DUPLICATE_WINDOW_MS = 5000;
  const isDuplicate = current.some(
    (prev) =>
      prev.barthelScore === result.barthelScore &&
      prev.lawtonScore === result.lawtonScore &&
      Math.abs(new Date(prev.recordedAt).getTime() - new Date(result.recordedAt).getTime()) <
        DUPLICATE_WINDOW_MS
  );
  if (isDuplicate) return current;

  const updated = [result, ...current].slice(0, 180);
  try {
    localStorage.setItem(`${STORAGE_KEYS.FUNCTION_SCORES}_${patientUid}`, JSON.stringify(updated));
  } catch (e) {
    console.error(`Error saving function score for ${patientUid}:`, e);
  }
  return updated;
}
