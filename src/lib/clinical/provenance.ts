export type EvidenceLevel =
  | 'validated-instrument'
  | 'guideline'
  | 'expert-consensus'
  | 'local-heuristic';

export interface ClinicalProvenance {
  source: string;
  evidenceLevel: EvidenceLevel;
  population: string;
  lastReviewed: string;
  confidence: 'high' | 'moderate' | 'low';
  validated: boolean;
  note: string;
}

export const CLINICAL_PROVENANCE = {
  zaritScore: {
    source: 'Zarit Burden Interview scoring conventions',
    evidenceLevel: 'validated-instrument',
    population: 'Adult family caregivers; interpretation varies by population and short-form version.',
    lastReviewed: '2026-08-28',
    confidence: 'high',
    validated: true,
    note: 'Total score is the validated component; Sanjeevani red flags and action prompts are local triage overlays.'
  },
  careGapHeuristic: {
    source: 'Sanjeevani care-gap heuristic informed by Katz ADL, Lawton IADL, caregiver time-use literature, and local clinical review.',
    evidenceLevel: 'local-heuristic',
    population: 'Indian home-care dyads; not yet prospectively calibrated against outcomes.',
    lastReviewed: '2026-08-28',
    confidence: 'low',
    validated: false,
    note: 'Use for planning conversations and clinician review, not as an independent clinical prescription.'
  },
  staffingHeuristic: {
    source: 'Sanjeevani staffing ladder heuristic based on care-gap simulation and geriatric home-care workflow.',
    evidenceLevel: 'local-heuristic',
    population: 'Indian domiciliary elder-care settings; local cost and scope-of-practice assumptions required.',
    lastReviewed: '2026-08-28',
    confidence: 'low',
    validated: false,
    note: 'Recommendations should be treated as draft options until accepted or edited by a clinician.'
  },
  beersStoppScreen: {
    source: 'AGS Beers Criteria 2023 and STOPP/START version 3 selected high-yield rules.',
    evidenceLevel: 'guideline',
    population: 'Adults >=65; Beers was designed for the US and requires local formulary/context adaptation.',
    lastReviewed: '2026-08-28',
    confidence: 'moderate',
    validated: false,
    note: 'This implementation is a selected screening subset, not a complete medication review.'
  }
} satisfies Record<string, ClinicalProvenance>;
