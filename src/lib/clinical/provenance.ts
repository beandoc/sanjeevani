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
  /**
   * Named limitations a reviewer should see before acting on the output.
   * Present so a low-confidence model states *why* it is low-confidence rather
   * than leaving the reader to infer it from a badge colour.
   */
  knownLimitations?: string[];
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
  careDemandModel: {
    source:
      'Sanjeevani item-level care-demand model: graded Barthel and Lawton responses composed as frequency x duration x staff required, with shared-setup credit, threshold terms, and separate hands-on / supervision / on-call time.',
    evidenceLevel: 'local-heuristic',
    population:
      'Indian home-care dyads. Coefficients are expert consensus and have not been calibrated against measured care time in this or any population.',
    lastReviewed: '2026-10-03',
    confidence: 'low',
    validated: false,
    note:
      'Outputs a planning range for clinician review, never a determination of required hours. Render the band, not the midpoint.',
    knownLimitations: [
      'Every coefficient is expert consensus and uncalibrated; no local time study has been run.',
      'Purpose-built, time-calibrated home-care case-mix systems explain only 16-24% of individual care-hour variance (Parsons 2018; Bolster-Foucault 2023). This model cannot exceed that ceiling.',
      'Katz and Lawton were validated to classify functional status, not to estimate care time; neither source paper contains a time coefficient.',
      'Proxy and self reports rate dependence level reasonably but consistently overestimate assistance time (Cotter 2002).',
      'Observed care hours reflect what is delivered under supply constraints, not what is clinically needed; a model fitted to delivered hours would reproduce rationing.',
      'Task frequencies default to model values unless a clinician overrides them per patient.',
      'Barthel option values are ordinal and not monotonic in care time (wheelchair-independent needs less help than walking with assistance), so no summed total is a time scale.',
      'This is a task-based planning estimate, not a validated care-time instrument. Where care time is the actual outcome of interest, measure it directly — the RUD instrument has validation for informal care time in community-dwelling dementia, and the interRAI Personal Support Algorithm provides an allocation framework that requires local calibration.',
      'Workload (caregiver-hours) and coverage (elapsed presence) are different units and are reported separately; they must never be added.',
      'Calibration status is tracked per coefficient in CALIBRATION_REGISTRY, and the band widens in proportion to how much of a given estimate rests on cells never measured locally. The registry is currently empty.'
    ]
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
