/**
 * Reviewable policy values used by Sanjeevani's local decision-support models.
 *
 * These values are deliberately separate from validated instruments. They are
 * configuration for a clinician-reviewed planning aid, not clinical facts or
 * autonomous treatment rules. Changing a value requires a policy version bump
 * and documented clinical review.
 */

export const CLINICAL_POLICY = {
  version: '2026.10.03.1',
  reviewedAt: '2026-10-03',
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
    costTier: 8,
    /**
     * Which edge of the care-demand band each decision reads.
     *
     * The demand model emits a range, not a number, so every consumer must say
     * which edge it uses and why. Safety-critical coverage reads the
     * conservative (high) edge, because the cost of under-staffing a night
     * watch or a morning transfer falls on the patient and on an unpaid
     * caregiver's back. Cost tiering reads the midpoint, because budgeting to
     * the worst case over-purchases care that families pay for out of pocket.
     *
     * An asymmetric harm justifies an asymmetric rule.
     */
    bandEdgeForSafetyCoverage: 'high',
    bandEdgeForCostTiering: 'point'
  },
  /**
   * A care gap is asserted only when the entire demand band exceeds caregiver
   * capacity. Where the band straddles capacity the honest answer is
   * "indeterminate" and the UI should prompt for the missing inputs rather than
   * assert a deficit from an estimate that cannot support one.
   */
  gapRequiresWholeBandAboveCapacity: true
} as const;

export type ClinicalPolicy = typeof CLINICAL_POLICY;
