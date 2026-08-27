/**
 * Reviewable policy values used by Sanjeevani's local decision-support models.
 *
 * These values are deliberately separate from validated instruments. They are
 * configuration for a clinician-reviewed planning aid, not clinical facts or
 * autonomous treatment rules. Changing a value requires a policy version bump
 * and documented clinical review.
 */

export const CLINICAL_POLICY = {
  version: '2026.08.28.1',
  reviewedAt: '2026-08-28',
  reviewCadenceDays: 180,
  assessmentFreshnessDays: 30,
  staffingRanking: {
    unresolvedNightGap: 120,
    unresolvedMorningGap: 60,
    residualGapPerHour: 15,
    liftingIndex: 25,
    costTier: 8
  }
} as const;

export type ClinicalPolicy = typeof CLINICAL_POLICY;
