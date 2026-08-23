/**
 * Comorbidity-based learning module personalization, shared between the
 * caregiver's own /modules page and the doctor-side per-patient module
 * assignment on the dyad detail page — one mapping, not two that can drift.
 *
 * Bug note: the previous inline version of this logic (in modules/page.tsx)
 * matched against `patient.diagnoses.hypertension` etc., a shape that never
 * existed on `PatientDependenceProfile` (which has `primaryConditions:
 * string[]`, not a `diagnoses` object). `tailoredModuleIds` was therefore
 * always empty for every real user — only the Katz-ADL-derived bed-bound
 * bucket ever fired. This version matches against the field that actually
 * gets populated (see DEFAULT_PATIENT_PROFILE in care-gap-engine.ts, e.g.
 * 'Hypertension', 'Mild Cognitive Decline', 'Severe Osteoarthritis').
 */

export const GENERAL_MODULE_IDS = [
  'caregiver-foundations',
  'caregiver-roles-responsibilities',
  'daily-caregiving-routine',
  'medication-management-caregiver',
  'fall-prevention',
  'nutrition-caregiver',
  'oral-health-caregiver',
  'elderly-garments-adaptive-dressing'
];

interface ConditionModuleMapping {
  label: string;
  /** Case-insensitive substrings matched against each primaryConditions entry. */
  keywords: string[];
  moduleIds: string[];
}

const CONDITION_MODULE_MAP: ConditionModuleMapping[] = [
  {
    label: 'Hypertension',
    keywords: ['hypertension', 'high blood pressure'],
    moduleIds: ['hypertension-caregiver', 'hypertension-professional']
  },
  {
    label: 'Heart Disease',
    keywords: ['ischemic heart', 'ischaemic heart', 'heart failure', 'cardiac', 'coronary'],
    moduleIds: ['ischaemic-heart-disease-caregiver', 'ischaemic-heart-disease-professional', 'heart-failure']
  },
  {
    label: 'Alzheimer’s / Dementia',
    keywords: ['alzheimer', 'dementia', 'cognitive decline', 'mci', 'cognitive impairment'],
    moduleIds: ['alzheimers-caregiver', 'dementia-care', 'alzheimers-professional', 'dementia-care-professional']
  },
  {
    label: 'Parkinson’s Disease',
    keywords: ['parkinson'],
    moduleIds: ['parkinsonism-care', 'parkinsonism-care-professional']
  },
  {
    label: 'Stroke Rehab',
    keywords: ['stroke', 'cva', 'hemiplegia'],
    moduleIds: ['stroke-rehab']
  },
  {
    label: 'BPH & Bladder',
    keywords: ['prostat', 'bph', 'bladder'],
    moduleIds: ['benign-prostate-care', 'benign-prostate-professional']
  },
  {
    label: 'Constipation',
    keywords: ['constipation'],
    moduleIds: ['constipation-caregiver', 'constipation-professional']
  },
  {
    label: 'Pneumonia / Respiratory',
    keywords: ['lung', 'copd', 'pneumonia', 'respiratory'],
    moduleIds: ['lung-infections-caregiver', 'lung-infections-professional']
  },
  {
    label: 'Vision Impairment',
    keywords: ['vision', 'cataract', 'eye'],
    moduleIds: ['vision-problems-caregiver', 'vision-problems-professional']
  },
  {
    label: 'Arthritis & Joint Pain',
    keywords: ['arthritis', 'joint', 'osteoarthritis'],
    moduleIds: ['joint-problems-caregiver', 'joint-problems-professional']
  }
];

export interface TailoredModulesResult {
  moduleIds: Set<string>;
  matchedLabels: string[];
}

/**
 * Modules suggested for a caregiver based on the patient's recorded
 * conditions and ADL dependence. Pure and deterministic — safe to call from
 * both the caregiver's own modules page and a clinician's dyad view.
 */
export function getTailoredModuleIds(
  primaryConditions: string[] | undefined,
  katzAdl?: { transferring: boolean; bathing: boolean }
): TailoredModulesResult {
  const moduleIds = new Set<string>();
  const matchedLabels: string[] = [];
  const lowerConditions = (primaryConditions || []).map((c) => c.toLowerCase());

  for (const entry of CONDITION_MODULE_MAP) {
    const matched = entry.keywords.some((kw) => lowerConditions.some((c) => c.includes(kw)));
    if (matched) {
      entry.moduleIds.forEach((id) => moduleIds.add(id));
      matchedLabels.push(entry.label);
    }
  }

  if (katzAdl && (!katzAdl.transferring || !katzAdl.bathing)) {
    moduleIds.add('bed-bound-care');
    moduleIds.add('sensory-hygiene-bedmaking');
    matchedLabels.push('High ADL Dependence');
  }

  return { moduleIds, matchedLabels };
}
