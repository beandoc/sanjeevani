import { describe, it, expect } from 'vitest';
import { getTailoredModuleIds } from './modules-personalization';

describe('getTailoredModuleIds', () => {
  it('matches conditions against primaryConditions strings, not a nonexistent diagnoses object', () => {
    // Regression: the old inline version in modules/page.tsx matched against
    // `patient.diagnoses.hypertension` etc., a shape PatientDependenceProfile
    // never had (it only has primaryConditions: string[]), so this bucket
    // was silently empty for every real user.
    const { moduleIds, matchedLabels } = getTailoredModuleIds(['Hypertension', 'Severe Osteoarthritis']);
    expect(moduleIds.has('hypertension-caregiver')).toBe(true);
    expect(moduleIds.has('joint-problems-caregiver')).toBe(true);
    expect(matchedLabels).toContain('Hypertension');
    expect(matchedLabels).toContain('Arthritis & Joint Pain');
  });

  it('matches case-insensitively and on substrings', () => {
    const { moduleIds } = getTailoredModuleIds(['mild cognitive decline']);
    expect(moduleIds.has('alzheimers-caregiver')).toBe(true);
    expect(moduleIds.has('dementia-care')).toBe(true);
  });

  it('adds the bed-bound bucket from Katz ADL dependence, independent of conditions', () => {
    const { moduleIds, matchedLabels } = getTailoredModuleIds([], { transferring: false, bathing: true });
    expect(moduleIds.has('bed-bound-care')).toBe(true);
    expect(matchedLabels).toContain('High ADL Dependence');
  });

  it('does not add the bed-bound bucket for a fully independent patient', () => {
    const { moduleIds } = getTailoredModuleIds([], { transferring: true, bathing: true });
    expect(moduleIds.has('bed-bound-care')).toBe(false);
  });

  it('returns an empty match set for no conditions and no ADL data', () => {
    const { moduleIds, matchedLabels } = getTailoredModuleIds(undefined, undefined);
    expect(moduleIds.size).toBe(0);
    expect(matchedLabels).toHaveLength(0);
  });

  it('does not false-positive an unrelated condition string', () => {
    const { moduleIds } = getTailoredModuleIds(['Post-Fall Frailty']);
    expect(moduleIds.size).toBe(0);
  });
});
