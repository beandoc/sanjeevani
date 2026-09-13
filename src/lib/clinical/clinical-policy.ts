/**
 * Reviewable policy values used by Sanjeevani's local decision-support models.
 *
 * These values are deliberately separate from validated instruments. They are
 * configuration for a clinician-reviewed planning aid, not clinical facts or
 * autonomous treatment rules. Changing a value requires a policy version bump
 * and documented clinical review.
 */

export const CLINICAL_POLICY = {
  version: '2026.09.13.1',
  reviewedAt: '2026-09-13',
  reviewCadenceDays: 180,
  assessmentFreshnessDays: 30,
  comprehensiveGeriatricAssessmentDomains: [
    'What matters most / goals of care',
    'Cognition and delirium risk',
    'Mood and caregiver distress',
    'Mobility, falls, and transfer safety',
    'Medication indication, dose, duration, interactions, and renal function',
    'Nutrition and swallowing risk',
    'Continence, skin, and pressure injury risk',
    'Vision, hearing, pain, and sleep',
    'Emergency plan, transport, and social support'
  ],
  staffingRanking: {
    unresolvedNightGap: 120,
    unresolvedMorningGap: 60,
    residualGapPerHour: 15,
    /**
     * Manual-handling penalty by qualitative hazard tier. The NIOSH lifting equation was not
     * designed for patient transfers, so the exact lifting index is reported for context only and
     * never weighs a staffing decision; the auditable tier does.
     */
    manualHandlingHazardTier: { low: 0, moderate: 15, high: 40, severe: 75 },
    costTier: 8
  }
} as const;

export type ClinicalPolicy = typeof CLINICAL_POLICY;
