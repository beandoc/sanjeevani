/**
 * Sanjeevani Care Demand Model — item-level care-time estimation
 * =============================================================
 *
 * WHAT THIS IS, AND WHAT IT IS NOT
 * --------------------------------
 * This module estimates a *range* of care time from graded functional
 * assessment. It is a planning aid for clinician review. It is not a validated
 * determination of the care hours a patient requires, and nothing here should
 * be presented as one.
 *
 * The scientific reason for that caution is specific and quantitative. Katz
 * (1963) and Lawton & Brody (1969) were built to classify functional status.
 * Neither paper contains a time coefficient, and neither has been validated
 * against measured caregiving minutes. More importantly, the case-mix systems
 * that *were* purpose-built for this job — calibrated against observed time,
 * with dozens of groups spanning function, cognition, behaviour, clinical
 * complexity and rehabilitation — still explain only a minority of individual
 * variation in home-care hours:
 *
 *   - interRAI-CA:  16% of formal home-care service hour variance
 *   - interRAI-HC:  24% (33 clusters, complex-needs clients)
 *   - RUG-III/HC:   23.34% of combined paid + unpaid care time
 *
 * Roughly three-quarters of individual variation is therefore unexplained by
 * the best available instruments. A model built on this codebase's inputs
 * cannot do better. That is why every output here is a band, why the band is
 * wide, and why `pointHours` must never be rendered on its own.
 *
 * For contrast, RUG-III reaches 55.5% variance explained — but that is
 * *per-diem cost* in a *nursing home*, derived from direct 24-hour nursing-time
 * measurement. It is the institutional best case and does not transfer to home
 * care. It is cited here only to mark the ceiling, not as a basis.
 *
 * STRUCTURE
 * ---------
 * Three kinds of time are kept separate throughout, because conflating them is
 * what makes a single care-hours number unusable for staffing. 4 h of hands-on
 * transfers and 4 h of passive night presence have different costs, different
 * skill requirements and different caregiver health consequences:
 *
 *   directCare   hands-on task time: frequency x minutes x staff required
 *   supervision  active cognitive/behavioural vigilance, not hands-on
 *   onCall       passive availability / night presence
 *
 * Task time is composed as `frequencyPerDay x minutesPerEpisode x staffRequired`
 * rather than as a per-deficit hour constant, because frequency and staff count
 * carry most of the signal and a deficit flag carries neither. A transfer
 * scored "major help (one or two people)" is a two-person task; no single-staff
 * hour constant can express that.
 *
 * CALIBRATION STATUS
 * ------------------
 * Every numeric weight below is expert consensus and uncalibrated. The
 * citations support the existence and structure of a term, never the magnitude
 * of a coefficient. See `CALIBRATION` at the foot of this file for the protocol
 * that would change that.
 *
 * @citation Katz S, Ford AB, Moskowitz RW, et al. JAMA. 1963;185(12):914-919.
 * @citation Lawton MP, Brody EM. Gerontologist. 1969;9(3 Pt 1):179-186.
 * @citation Mahoney FI, Barthel DW. Md State Med J. 1965;14:61-65.
 * @citation Parsons M, Rouse P, Sajtos L, et al. Developing and utilising a new
 *           funding model for home-care services in New Zealand. Health Soc
 *           Care Community. 2018;26(3):345-355. (16% / 24% variance explained)
 * @citation Bolster-Foucault C, Holyoke P. Resource Utilization Groups in
 *           transitional home care: validating the RUG-III/HC case-mix system.
 *           BMC Health Serv Res. 2023;23:1324. (23.34% variance explained)
 * @citation Fries BE, Schneider DP, Foley WJ, et al. Refining a case-mix measure
 *           for nursing homes: RUG-III. Med Care. 1994;32(7):668-685.
 * @citation Turner-Stokes L, Sutch S, Dredge R. Healthcare tariffs for specialist
 *           inpatient neurorehabilitation services. Clin Rehabil. 2011;26(3):264-279.
 *           (Northwick Park Dependency Score -> Care Needs Assessment: the
 *           instrument family purpose-built to convert dependency into care
 *           hours and cost. The correct comparator for this model.)
 * @citation Ng TP, Niti M, Chiam PC, Kua EH. J Gerontol A Biol Sci Med Sci.
 *           2006;61(7):726-735. (Lawton loads on two factors — physical and
 *           cognitive IADL — and is cross-culturally valid incl. Indian elders.)
 * @citation Cotter EM, Burgio LD, Stevens AB, et al. Clin Rehabil. 2002;16(1):36-45.
 *           (Caregivers rate dependence level well but consistently overestimate
 *           assistance *time*; provided time is not needed time.)
 *
 * MEASURING CARE TIME DIRECTLY, RATHER THAN INFERRING IT
 *
 * The defensible way to obtain care hours is to measure them, keeping the
 * dependency instruments for what they were validated to do. Two established
 * routes, and what each can and cannot support:
 *
 *  - Resource Utilization in Dementia (RUD): has validation for informal
 *    care-time measurement in community-dwelling people with dementia, by
 *    caregiver diary/interview. The right instrument if care time is the
 *    outcome. Its validation does not establish a universal geriatric
 *    care-hours formula, and it is dementia-specific.
 *  - interRAI Personal Support Algorithm: an evidence-based framework for
 *    home-support allocation. Its service-hour outputs reflect the system it
 *    was developed in and require local calibration before use elsewhere.
 *
 * This module is neither. It is a task-based planning estimate, which is a
 * reasonable way to structure a conversation and an unreasonable way to settle
 * an entitlement.
 *
 * THE OVERLAP RULE
 *
 * Care time comes in two incompatible units and they must never be summed:
 *   caregiver-hours (workload) — two carers for 15 min is 30 caregiver-minutes
 *   elapsed hours (coverage)   — the same event occupies 15 minutes of clock
 *
 * A patient needing presence 12 h/day whose 3 h of task assistance happens
 * inside that window requires 12 h of coverage, not 15. Supervision is
 * therefore de-overlapped against hands-on care per block, and `coverage` is
 * reported separately from `activeCare`. A rota is built from coverage; a
 * workload and its cost are budgeted from activeCare.
 */

import {
  BARTHEL_ITEMS,
  LAWTON_ITEMS,
  type AssessmentSource,
  type FunctionItem
} from './function-scale';
import { CLINICAL_PROVENANCE, type ClinicalProvenance } from './provenance';
import type { DiurnalTimeBlock } from './care-gap-constants';

export type { DiurnalTimeBlock };

export type CareTimeType = 'directCare' | 'supervision' | 'onCall';

/** A care-time estimate in hours/day. `point` exists for charts only. */
export interface CareTimeEstimate {
  lowHours: number;
  pointHours: number;
  highHours: number;
}

export interface CareDemandDriver {
  itemId: string;
  label: string;
  domain: FunctionItem['domain'];
  timeType: CareTimeType;
  /** Episodes per day actually used (after any clinician override). */
  frequencyPerDay: number;
  minutesPerEpisode: number;
  staffRequired: number;
  minutesPerDay: number;
  blocks: DiurnalTimeBlock[];
  /** Set when a clinician overrode the default frequency. */
  frequencyOverridden?: boolean;
  /** True when this cell's minutes came from measurement rather than consensus. */
  calibrated: boolean;
  /** Observed episodes behind a calibrated cell. */
  calibrationEpisodeCount?: number;
}

export interface CareDemandBand {
  /** Hands-on caregiver-hours: frequency x duration x staff required. */
  directCare: CareTimeEstimate;
  /**
   * Active supervision, NET OF OVERLAP with hands-on care.
   *
   * A caregiver assisting with toileting is already supervising. Counting the
   * full supervision requirement on top of task time bills the same minutes
   * twice, which is the single most common way a task-based estimate inflates.
   * Only supervision time that falls outside hands-on care is counted here.
   */
  supervision: CareTimeEstimate;
  /** Passive availability — present but not engaged. */
  onCall: CareTimeEstimate;
  /**
   * `directCare + supervision` — the active care workload in caregiver-hours.
   *
   * THIS is the quantity comparable with a caregiver's capacity, and the one a
   * care gap must be computed against. `onCall` is deliberately excluded:
   * passive night presence is availability, not work, and a caregiver asleep
   * beside a patient is simultaneously "providing" 8 on-call hours and resting.
   * Adding those 8 hours to the active workload and then subtracting a
   * caregiver's 5-hour working capacity produces a deficit that is an artefact
   * of the units, not a finding about the patient.
   *
   * `supervision` here is already net of overlap — see the note on that field.
   */
  activeCare: CareTimeEstimate;
  /**
   * ELAPSED hours per day during which somebody must be present, as distinct
   * from the caregiver-hours of work performed.
   *
   * These are different units and must not be added together. If a patient
   * needs someone present 12 h/day and all 3 h of task assistance happens
   * inside that window, the coverage requirement is 12 h — not 15 h. Conversely
   * two caregivers assisting for 15 minutes produce 30 caregiver-minutes while
   * only 15 minutes elapse.
   *
   * `activeCare` answers "how much work is there?" (staffing cost, caregiver
   * burden). `coverage` answers "how long must someone be here?" (shift shape,
   * whether the patient can be left alone). A rota is built from `coverage`; a
   * workload is budgeted from `activeCare`.
   */
  coverage: CareTimeEstimate;
  /** Elapsed presence required per block — the basis for a shift pattern. */
  coverageByBlock: Record<DiurnalTimeBlock, CareTimeEstimate>;
  /**
   * Whether somebody must be present and available overnight. This is a
   * coverage question with a yes/no answer, not a quantity of hours to be
   * staffed against a capacity figure — which is why it is reported as a flag
   * alongside `onCall` rather than folded into `activeCare`.
   */
  requiresNightPresence: boolean;
  /**
   * `activeCare + onCall` — total burden, for display only. Mixing work and
   * availability makes this unusable for arithmetic; never compute a gap from it.
   */
  combined: CareTimeEstimate;

  drivers: CareDemandDriver[];
  blockDemands: Record<DiurnalTimeBlock, CareTimeEstimate>;
  /** Shared setup/transfer minutes credited back to avoid double counting. */
  sharedOverheadCreditMinutes: number;
  /**
   * Supervision minutes NOT charged because hands-on care was already happening
   * in those same minutes. Reported so the de-overlap is auditable rather than
   * invisible.
   */
  supervisionOverlapCreditMinutes: number;
  /**
   * How much of THIS estimate rests on measured versus never-measured
   * coefficients. Drives the proportional band term, and tells a clinician
   * whether the range in front of them is wide because of this patient's
   * profile or because of the model as a whole.
   */
  calibrationCoverage: {
    calibratedMinutesPerDay: number;
    uncalibratedMinutesPerDay: number;
    /** 0 = fully measured, 1 = nothing measured. */
    uncalibratedShare: number;
    /** Registry keys behind the unmeasured minutes, largest first. */
    uncalibratedCells: string[];
  };
  thresholdTerms: Array<{ id: string; label: string; timeType: CareTimeType; minutesPerDay: number }>;
  inputCompleteness: { answered: number; total: number; missing: string[] };
  assessmentSource: AssessmentSource;
  /** Why the band is as wide as it is — one human-readable reason per entry. */
  bandBasis: string[];
  /** Relative half-width actually applied, e.g. 0.45 for +/-45%. */
  bandRelativeHalfWidth: number;
  inputGranularity: 'graded' | 'legacy_binary';
  provenance: ClinicalProvenance;
}

/* ------------------------------------------------------------------ *
 * 1. TASK WEIGHTS — graded, per Barthel option value
 * ------------------------------------------------------------------ */

interface TaskWeight {
  /** Default episodes per day. Clinician-overridable; frequency is patient-specific. */
  frequencyPerDay: number;
  minutesPerEpisode: number;
  /** 2 where the task cannot be safely done by one person at this level. */
  staffRequired: number;
  timeType: CareTimeType;
  blocks: DiurnalTimeBlock[];
}

/**
 * IMPORTANT — Barthel option values are ordinal and NOT monotonic in care time.
 *
 * Two items break monotonicity, and the model must not "fix" them:
 *
 *   bi_mobility: value 5 = "wheelchair independent" needs LESS assistance time
 *                than value 10 = "walks with help of one person".
 *   bi_stairs:   value 0 = "unable" often means stairs are simply avoided,
 *                needing less assistance time than value 5 = "needs help".
 *
 * A lower Barthel score therefore does not always mean more care time. This is
 * a concrete demonstration of why a summed ordinal total cannot be treated as a
 * time scale, and why this model works item-by-item at the graded level.
 *
 * @calibration expert-consensus, uncalibrated — every frequency and duration
 *              below is a clinical estimate, not a measured value.
 */
export const BARTHEL_TASK_WEIGHTS: Record<string, Record<number, TaskWeight>> = {
  bi_feeding: {
    0: { frequencyPerDay: 3, minutesPerEpisode: 20, staffRequired: 1, timeType: 'directCare', blocks: ['morning_rush', 'afternoon', 'evening'] },
    5: { frequencyPerDay: 3, minutesPerEpisode: 5, staffRequired: 1, timeType: 'directCare', blocks: ['morning_rush', 'afternoon', 'evening'] },
    10: { frequencyPerDay: 0, minutesPerEpisode: 0, staffRequired: 0, timeType: 'directCare', blocks: [] }
  },
  bi_bathing: {
    0: { frequencyPerDay: 1, minutesPerEpisode: 25, staffRequired: 1, timeType: 'directCare', blocks: ['morning_rush'] },
    5: { frequencyPerDay: 0, minutesPerEpisode: 0, staffRequired: 0, timeType: 'directCare', blocks: [] }
  },
  bi_grooming: {
    0: { frequencyPerDay: 1, minutesPerEpisode: 10, staffRequired: 1, timeType: 'directCare', blocks: ['morning_rush'] },
    5: { frequencyPerDay: 0, minutesPerEpisode: 0, staffRequired: 0, timeType: 'directCare', blocks: [] }
  },
  bi_dressing: {
    0: { frequencyPerDay: 2, minutesPerEpisode: 12, staffRequired: 1, timeType: 'directCare', blocks: ['morning_rush', 'evening'] },
    5: { frequencyPerDay: 2, minutesPerEpisode: 6, staffRequired: 1, timeType: 'directCare', blocks: ['morning_rush', 'evening'] },
    10: { frequencyPerDay: 0, minutesPerEpisode: 0, staffRequired: 0, timeType: 'directCare', blocks: [] }
  },
  bi_bowels: {
    0: { frequencyPerDay: 2, minutesPerEpisode: 20, staffRequired: 1, timeType: 'directCare', blocks: ['morning_rush', 'evening', 'night_watch'] },
    5: { frequencyPerDay: 0.5, minutesPerEpisode: 15, staffRequired: 1, timeType: 'directCare', blocks: ['afternoon'] },
    10: { frequencyPerDay: 0, minutesPerEpisode: 0, staffRequired: 0, timeType: 'directCare', blocks: [] }
  },
  bi_bladder: {
    0: { frequencyPerDay: 6, minutesPerEpisode: 10, staffRequired: 1, timeType: 'directCare', blocks: ['morning_rush', 'afternoon', 'evening', 'night_watch'] },
    5: { frequencyPerDay: 1, minutesPerEpisode: 10, staffRequired: 1, timeType: 'directCare', blocks: ['afternoon', 'night_watch'] },
    10: { frequencyPerDay: 0, minutesPerEpisode: 0, staffRequired: 0, timeType: 'directCare', blocks: [] }
  },
  bi_toilet: {
    0: { frequencyPerDay: 6, minutesPerEpisode: 10, staffRequired: 1, timeType: 'directCare', blocks: ['morning_rush', 'afternoon', 'evening', 'night_watch'] },
    5: { frequencyPerDay: 6, minutesPerEpisode: 4, staffRequired: 1, timeType: 'directCare', blocks: ['morning_rush', 'afternoon', 'evening', 'night_watch'] },
    10: { frequencyPerDay: 0, minutesPerEpisode: 0, staffRequired: 0, timeType: 'directCare', blocks: [] }
  },
  bi_transfer: {
    // Two-person transfer. This is the case a single hour-constant cannot express.
    0: { frequencyPerDay: 8, minutesPerEpisode: 8, staffRequired: 2, timeType: 'directCare', blocks: ['morning_rush', 'afternoon', 'evening', 'night_watch'] },
    5: { frequencyPerDay: 8, minutesPerEpisode: 6, staffRequired: 2, timeType: 'directCare', blocks: ['morning_rush', 'afternoon', 'evening', 'night_watch'] },
    10: { frequencyPerDay: 8, minutesPerEpisode: 3, staffRequired: 1, timeType: 'directCare', blocks: ['morning_rush', 'afternoon', 'evening'] },
    15: { frequencyPerDay: 0, minutesPerEpisode: 0, staffRequired: 0, timeType: 'directCare', blocks: [] }
  },
  bi_mobility: {
    // Non-monotonic by design — see the note above this table.
    0: { frequencyPerDay: 4, minutesPerEpisode: 10, staffRequired: 1, timeType: 'directCare', blocks: ['morning_rush', 'afternoon', 'evening'] },
    5: { frequencyPerDay: 2, minutesPerEpisode: 5, staffRequired: 1, timeType: 'directCare', blocks: ['morning_rush', 'afternoon'] },
    10: { frequencyPerDay: 4, minutesPerEpisode: 8, staffRequired: 1, timeType: 'directCare', blocks: ['morning_rush', 'afternoon', 'evening'] },
    15: { frequencyPerDay: 0, minutesPerEpisode: 0, staffRequired: 0, timeType: 'directCare', blocks: [] }
  },
  bi_stairs: {
    // Non-monotonic by design — see the note above this table.
    0: { frequencyPerDay: 0.5, minutesPerEpisode: 10, staffRequired: 1, timeType: 'directCare', blocks: ['afternoon'] },
    5: { frequencyPerDay: 2, minutesPerEpisode: 5, staffRequired: 1, timeType: 'directCare', blocks: ['morning_rush', 'evening'] },
    10: { frequencyPerDay: 0, minutesPerEpisode: 0, staffRequired: 0, timeType: 'directCare', blocks: [] }
  }
};

/**
 * Lawton weights, routed by the instrument's two-factor structure (Ng 2006).
 *
 * Physical IADL (household / community) is hands-on work and amortises a
 * weekly or monthly task to a daily rate. Cognitive IADL (medications,
 * finances) costs oversight rather than hands-on minutes, so it is routed to
 * `supervision`. Summing the two and multiplying by one constant — as the
 * previous model did — treats "cannot manage finances" and "cannot do laundry"
 * as the same quantity of care. They are not.
 *
 * Only the dependent level (value 0) generates demand.
 *
 * @calibration expert-consensus, uncalibrated
 */
export const LAWTON_TASK_WEIGHTS: Record<string, TaskWeight> = {
  iadl_phone: { frequencyPerDay: 0.5, minutesPerEpisode: 5, staffRequired: 1, timeType: 'supervision', blocks: ['afternoon'] },
  iadl_shopping: { frequencyPerDay: 2 / 7, minutesPerEpisode: 60, staffRequired: 1, timeType: 'directCare', blocks: ['afternoon'] },
  iadl_food: { frequencyPerDay: 3, minutesPerEpisode: 25, staffRequired: 1, timeType: 'directCare', blocks: ['morning_rush', 'afternoon', 'evening'] },
  iadl_housekeeping: { frequencyPerDay: 1, minutesPerEpisode: 30, staffRequired: 1, timeType: 'directCare', blocks: ['afternoon'] },
  iadl_laundry: { frequencyPerDay: 3 / 7, minutesPerEpisode: 40, staffRequired: 1, timeType: 'directCare', blocks: ['afternoon'] },
  iadl_transport: { frequencyPerDay: 1 / 7, minutesPerEpisode: 90, staffRequired: 1, timeType: 'directCare', blocks: ['afternoon'] },
  iadl_medication: { frequencyPerDay: 2, minutesPerEpisode: 8, staffRequired: 1, timeType: 'supervision', blocks: ['morning_rush', 'evening'] },
  iadl_finances: { frequencyPerDay: 2 / 7, minutesPerEpisode: 30, staffRequired: 1, timeType: 'supervision', blocks: ['afternoon'] }
};

/* ------------------------------------------------------------------ *
 * 2. SHARED OVERHEAD, THRESHOLDS, SUPERVISION, ON-CALL
 * ------------------------------------------------------------------ */

/**
 * Co-occurring hands-on tasks share one setup and one positioning/transfer.
 * Bathing, dressing and toileting in a single morning routine are not three
 * independent time blocks. Credit back the duplicated setup rather than summing
 * naively — this is the structural fix for the additivity error.
 *
 * @calibration expert-consensus, uncalibrated
 */
export const SHARED_SETUP_MINUTES_PER_TASK = 5;
/** Credit is capped so it can never swallow a block's real work. */
export const SHARED_OVERHEAD_MAX_BLOCK_FRACTION = 0.4;

/**
 * Active vigilance by cognitive/behavioural pattern (hours/day), routed to
 * `supervision`. Supervision need frequently dominates care time while basic
 * ADLs remain intact, which ADL-only criteria cannot detect.
 *
 * @citation Zarit SH, Reever KE, Bach-Peterson J. Gerontologist. 1980;20(6):649-655.
 * @calibration expert-consensus, uncalibrated
 */
export const SUPERVISION_HOURS_BY_COGNITIVE_LOAD = {
  none: 0,
  mild_forgetfulness: 1.0,
  wandering_agitation: 2.5,
  severe_sundowning: 4.0
} as const;

/**
 * Passive night presence (hours/day), routed to `onCall`. This is availability,
 * not hands-on work: it must not be priced or staffed as though it were, and it
 * must not raise the required skill tier on its own.
 *
 * @calibration expert-consensus, uncalibrated
 */
export const ON_CALL_NIGHT_PRESENCE_HOURS = 8.0;

/**
 * 2-hourly repositioning and pressure-injury prevention for bed-bound patients.
 * Hands-on, so it lands in `directCare`.
 *
 * @citation EPUAP/NPIAP. Prevention and Treatment of Pressure Ulcers/Injuries:
 *           Clinical Practice Guideline. 2019. (supports the 2-hourly interval)
 * @calibration expert-consensus, uncalibrated (minutes per turn)
 */
export const BED_BOUND_REPOSITIONING = {
  episodesPerDay: 12,
  minutesPerEpisode: 8,
  /** Motorized bed + alternating-pressure mattress reduce manual turning work. */
  equipmentDiscount: 0.4
} as const;

/**
 * Post-fall mobility escort and gait supervision. Active vigilance, so
 * `supervision`.
 *
 * @citation Tinetti ME, Speechley M, Ginter SF. N Engl J Med. 1988;319(26):1701-1707.
 * @calibration expert-consensus, uncalibrated
 */
export const FALL_SUPERVISION = { baseHours: 1.0, perRepeatHours: 0.5, maxHours: 2.0 } as const;

/* ------------------------------------------------------------------ *
 * 3. BAND WIDTH
 * ------------------------------------------------------------------ */

/**
 * Uncertainty is not a decoration here — it is the main finding.
 *
 * The base half-width is anchored on the published ceiling for this class of
 * model: purpose-built, time-calibrated home-care case-mix systems explain only
 * 16-24% of individual hour variance (Parsons 2018; Bolster-Foucault 2023).
 * A model that claimed tighter bounds than those systems achieve would be
 * claiming more than the field supports.
 *
 * @calibration expert-consensus, uncalibrated
 */
export const BAND_WIDTH = {
  /** Base, from uncalibrated coefficients against a ~20%-variance-explained ceiling. */
  base: 0.4,
  /** Added per unanswered assessment item. */
  perMissingItem: 0.05,
  /** Added by reporting source; proxies overestimate assistance time (Cotter 2002). */
  bySource: {
    clinician_observed: 0,
    mixed: 0.1,
    family_proxy: 0.15,
    self_report: 0.15,
    not_recorded: 0.2
  } as Record<AssessmentSource, number>,
  /**
   * Added in PROPORTION to how much of this patient's estimate rests on
   * coefficients that have never been measured.
   *
   * This replaced a flat +0.10 applied to every patient regardless of profile.
   * A flat term says the same thing about a patient whose demand is dominated by
   * a well-measured toileting cell and one whose demand is dominated by an
   * unmeasured two-person floor transfer, which is exactly backwards. The
   * uncertainty belongs to the individual estimate, not to the model as a whole.
   *
   * Multiplied by the uncalibrated share of estimated minutes, so it falls to 0
   * as the registry fills and reaches this value when nothing is calibrated.
   */
  perUncalibratedShare: 0.15,
  /** Added when only legacy binary Katz data exists instead of graded Barthel. */
  legacyBinaryInput: 0.2,
  /** Hard cap; beyond this the estimate is not informative and should say so. */
  max: 0.75
} as const;

/* ------------------------------------------------------------------ *
 * 4. INPUT
 * ------------------------------------------------------------------ */

export interface CareDemandInput {
  /** Graded Barthel responses keyed by item id. Preferred input. */
  barthelResponses?: Record<string, number>;
  /** Graded Lawton responses keyed by item id. */
  lawtonResponses?: Record<string, number>;
  /**
   * Legacy 6-item boolean Katz (true = independent). Used only when graded
   * Barthel is unavailable; mapped pessimistically and the band widens.
   */
  legacyKatzAdl?: {
    bathing: boolean;
    dressing: boolean;
    toileting: boolean;
    transferring: boolean;
    continence: boolean;
    feeding: boolean;
  };
  /** Legacy 8-item boolean Lawton (true = independent). */
  legacyLawtonIadl?: Record<string, boolean>;
  /** Lawton item ids the patient never performed premorbidly. Contribute zero. */
  premorbidlyNotPerformed?: string[];
  /** Clinician overrides for episodes/day, keyed by item id. */
  frequencyOverrides?: Record<string, number>;
  cognitiveBehavioralLoad?: keyof typeof SUPERVISION_HOURS_BY_COGNITIVE_LOAD;
  isBedBound?: boolean;
  fallHistoryLast6Months?: number;
  hasMotorizedBedAndRippleMattress?: boolean;
  assessmentSource?: AssessmentSource;
}

/* ------------------------------------------------------------------ *
 * 5. ESTIMATOR
 * ------------------------------------------------------------------ */

const ALL_BLOCKS: DiurnalTimeBlock[] = ['morning_rush', 'afternoon', 'evening', 'night_watch'];

/**
 * Wall-clock length of each diurnal block, in minutes. A coverage requirement
 * cannot exceed the block it sits in.
 */
const BLOCK_LENGTH_MINUTES: Record<DiurnalTimeBlock, number> = {
  morning_rush: 3 * 60,
  afternoon: 3 * 60,
  evening: 3 * 60,
  night_watch: 8 * 60
};

const round1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Nearest defined option value at or below `value`, for tolerant lookup.
 *
 * Returns the matched level as well as the weight, because the calibration
 * registry is keyed by level: a tolerant lookup that silently matched a
 * different level than it reported would attribute one cell's measurement to
 * another cell's estimate.
 */
function resolveWeightWithLevel(
  table: Record<number, TaskWeight>,
  value: number
): { weight: TaskWeight; level: number } | undefined {
  if (table[value]) return { weight: table[value], level: value };
  const keys = Object.keys(table).map(Number).sort((a, b) => a - b);
  let chosen: number | undefined;
  for (const k of keys) if (k <= value) chosen = k;
  const level = chosen === undefined ? keys[0] : chosen;
  const weight = table[level];
  return weight ? { weight, level } : undefined;
}

/**
 * Map legacy boolean Katz to the pessimistic graded Barthel level, so a binary
 * "dependent" is never silently treated as though it carried the gradient.
 * The band widens separately via `BAND_WIDTH.legacyBinaryInput`.
 */
export function gradedResponsesFromLegacyKatz(
  katz: NonNullable<CareDemandInput['legacyKatzAdl']>
): Record<string, number> {
  return {
    bi_feeding: katz.feeding ? 10 : 0,
    bi_bathing: katz.bathing ? 5 : 0,
    bi_grooming: katz.bathing ? 5 : 0,
    bi_dressing: katz.dressing ? 10 : 0,
    bi_bowels: katz.continence ? 10 : 0,
    bi_bladder: katz.continence ? 10 : 0,
    bi_toilet: katz.toileting ? 10 : 0,
    bi_transfer: katz.transferring ? 15 : 0,
    bi_mobility: katz.transferring ? 15 : 0,
    bi_stairs: katz.transferring ? 10 : 0
  };
}

function legacyLawtonToResponses(flags: Record<string, boolean>): Record<string, number> {
  const byId: Record<string, string> = {
    iadl_phone: 'telephone',
    iadl_shopping: 'shopping',
    iadl_food: 'mealPreparation',
    iadl_housekeeping: 'housekeeping',
    iadl_laundry: 'laundry',
    iadl_transport: 'transportation',
    iadl_medication: 'medicationManagement',
    iadl_finances: 'finances'
  };
  const out: Record<string, number> = {};
  for (const [itemId, flagKey] of Object.entries(byId)) {
    const v = flags[flagKey];
    if (typeof v === 'boolean') out[itemId] = v ? 1 : 0;
  }
  return out;
}

/**
 * Estimate care demand as three separate banded time types.
 *
 * Returns a band, never a determination. Callers must render the band and must
 * not present `pointHours` alone.
 */
export function estimateCareDemand(input: CareDemandInput): CareDemandBand {
  const source: AssessmentSource = input.assessmentSource ?? 'not_recorded';
  const excluded = new Set(input.premorbidlyNotPerformed ?? []);
  const overrides = input.frequencyOverrides ?? {};

  const usingLegacy = !input.barthelResponses && !!input.legacyKatzAdl;
  const barthel = input.barthelResponses
    ?? (input.legacyKatzAdl ? gradedResponsesFromLegacyKatz(input.legacyKatzAdl) : {});
  const lawton = input.lawtonResponses
    ?? (input.legacyLawtonIadl ? legacyLawtonToResponses(input.legacyLawtonIadl) : {});

  const drivers: CareDemandDriver[] = [];
  // Minutes attributable to measured vs never-measured coefficients. The band
  // widens in proportion to the unmeasured share, so uncertainty tracks this
  // patient's actual profile rather than being a flat global constant.
  let calibratedMinutes = 0;
  let uncalibratedMinutes = 0;
  const uncalibratedDrivers: Array<{ label: string; minutesPerDay: number; key: string }> = [];
  const missing: string[] = [];
  let answered = 0;
  const total = BARTHEL_ITEMS.length + LAWTON_ITEMS.filter((i) => !excluded.has(i.id)).length;

  // ---- Barthel: graded, per-item, frequency x minutes x staff ----
  const blockMinutes: Record<DiurnalTimeBlock, Record<CareTimeType, number>> = {
    morning_rush: { directCare: 0, supervision: 0, onCall: 0 },
    afternoon: { directCare: 0, supervision: 0, onCall: 0 },
    evening: { directCare: 0, supervision: 0, onCall: 0 },
    night_watch: { directCare: 0, supervision: 0, onCall: 0 }
  };
  const blockHandsOnTaskCount: Record<DiurnalTimeBlock, number> = {
    morning_rush: 0, afternoon: 0, evening: 0, night_watch: 0
  };
  // Elapsed wall-clock minutes of hands-on care per block, as distinct from
  // caregiver-minutes. Two carers for 15 minutes is 30 caregiver-minutes but
  // only 15 minutes elapsed, and it is elapsed time that overlaps supervision.
  const blockElapsedDirectCare: Record<DiurnalTimeBlock, number> = {
    morning_rush: 0, afternoon: 0, evening: 0, night_watch: 0
  };

  const addDriver = (item: FunctionItem, w: TaskWeight, calibrationKey: string) => {
    // A measured coefficient replaces the consensus default. A clinician's
    // explicit frequency override still wins over both: they are describing
    // this patient, the study described a population.
    const cal = isCellCalibrated(calibrationKey) ? CALIBRATION_REGISTRY[calibrationKey] : undefined;
    const minutesPerEpisode = cal?.minutesPerEpisode ?? w.minutesPerEpisode;
    const defaultFreq = cal?.frequencyPerDay ?? w.frequencyPerDay;
    const freq = overrides[item.id] ?? defaultFreq;

    const minutesPerDay = freq * minutesPerEpisode * w.staffRequired;
    if (minutesPerDay <= 0 || w.blocks.length === 0) return;

    if (cal) {
      calibratedMinutes += minutesPerDay;
    } else {
      uncalibratedMinutes += minutesPerDay;
      uncalibratedDrivers.push({ label: item.text.en, minutesPerDay, key: calibrationKey });
    }

    drivers.push({
      itemId: item.id,
      label: item.text.en,
      domain: item.domain,
      timeType: w.timeType,
      frequencyPerDay: freq,
      minutesPerEpisode,
      staffRequired: w.staffRequired,
      minutesPerDay,
      blocks: w.blocks,
      calibrated: !!cal,
      ...(cal?.episodeCount !== undefined ? { calibrationEpisodeCount: cal.episodeCount } : {}),
      ...(overrides[item.id] !== undefined ? { frequencyOverridden: true } : {})
    });
    const perBlock = minutesPerDay / w.blocks.length;
    const elapsedPerBlock = perBlock / Math.max(1, w.staffRequired);
    for (const b of w.blocks) {
      blockMinutes[b][w.timeType] += perBlock;
      if (w.timeType === 'directCare') {
        blockElapsedDirectCare[b] += elapsedPerBlock;
        if (item.domain === 'self_care' || item.domain === 'mobility' || item.domain === 'continence') {
          blockHandsOnTaskCount[b] += 1;
        }
      }
    }
  };

  for (const item of BARTHEL_ITEMS) {
    const raw = barthel[item.id];
    if (typeof raw !== 'number' || Number.isNaN(raw)) {
      missing.push(item.text.en);
      continue;
    }
    answered += 1;
    const table = BARTHEL_TASK_WEIGHTS[item.id];
    if (!table) continue;
    const resolved = resolveWeightWithLevel(table, raw);
    if (resolved) addDriver(item, resolved.weight, barthelCalibrationKey(item.id, resolved.level));
  }

  // ---- Lawton: two-factor routing, premorbid exclusions contribute zero ----
  for (const item of LAWTON_ITEMS) {
    if (excluded.has(item.id)) continue;
    const raw = lawton[item.id];
    if (typeof raw !== 'number' || Number.isNaN(raw)) {
      missing.push(item.text.en);
      continue;
    }
    answered += 1;
    if (raw !== 0) continue; // only full dependence generates demand
    const w = LAWTON_TASK_WEIGHTS[item.id];
    if (w) addDriver(item, w, item.id);
  }

  // ---- Shared setup/transfer credit, per block ----
  let sharedOverheadCreditMinutes = 0;
  for (const b of ALL_BLOCKS) {
    const n = blockHandsOnTaskCount[b];
    if (n < 2) continue;
    const raw = (n - 1) * SHARED_SETUP_MINUTES_PER_TASK;
    const capped = Math.min(raw, blockMinutes[b].directCare * SHARED_OVERHEAD_MAX_BLOCK_FRACTION);
    const elapsedShare = blockMinutes[b].directCare > 0
      ? capped * (blockElapsedDirectCare[b] / blockMinutes[b].directCare)
      : 0;
    blockMinutes[b].directCare -= capped;
    blockElapsedDirectCare[b] = Math.max(0, blockElapsedDirectCare[b] - elapsedShare);
    sharedOverheadCreditMinutes += capped;
  }

  // ---- Threshold terms ----
  const thresholdTerms: CareDemandBand['thresholdTerms'] = [];

  if (input.isBedBound) {
    const discount = input.hasMotorizedBedAndRippleMattress ? BED_BOUND_REPOSITIONING.equipmentDiscount : 0;
    const mins = BED_BOUND_REPOSITIONING.episodesPerDay * BED_BOUND_REPOSITIONING.minutesPerEpisode * (1 - discount);
    thresholdTerms.push({ id: 'bed_bound_repositioning', label: '2-hourly repositioning (pressure-injury prevention)', timeType: 'directCare', minutesPerDay: mins });
    for (const b of ALL_BLOCKS) {
      blockMinutes[b].directCare += mins / ALL_BLOCKS.length;
      blockElapsedDirectCare[b] += mins / ALL_BLOCKS.length;
    }
  }

  // Double incontinence: both continence items fully dependent.
  if (barthel.bi_bowels === 0 && barthel.bi_bladder === 0) {
    const mins = 30;
    thresholdTerms.push({ id: 'double_incontinence', label: 'Double incontinence — additional skin and linen care', timeType: 'directCare', minutesPerDay: mins });
    for (const b of ALL_BLOCKS) {
      blockMinutes[b].directCare += mins / ALL_BLOCKS.length;
      blockElapsedDirectCare[b] += mins / ALL_BLOCKS.length;
    }
  }

  const cogLoad = input.cognitiveBehavioralLoad ?? 'none';
  const cogHours = SUPERVISION_HOURS_BY_COGNITIVE_LOAD[cogLoad] ?? 0;
  if (cogHours > 0) {
    const mins = cogHours * 60;
    thresholdTerms.push({ id: 'cognitive_supervision', label: `Active supervision (${cogLoad.replace(/_/g, ' ')})`, timeType: 'supervision', minutesPerDay: mins });
    // Weighted toward evening/night where behavioural symptoms concentrate.
    blockMinutes.morning_rush.supervision += mins * 0.2;
    blockMinutes.afternoon.supervision += mins * 0.2;
    blockMinutes.evening.supervision += mins * 0.3;
    blockMinutes.night_watch.supervision += mins * 0.3;
  }

  const falls = Math.max(0, input.fallHistoryLast6Months ?? 0);
  if (falls > 0) {
    const hours = Math.min(FALL_SUPERVISION.maxHours, FALL_SUPERVISION.baseHours + (falls - 1) * FALL_SUPERVISION.perRepeatHours);
    const mins = hours * 60;
    thresholdTerms.push({ id: 'fall_supervision', label: 'Post-fall escort and gait supervision', timeType: 'supervision', minutesPerDay: mins });
    blockMinutes.morning_rush.supervision += mins * 0.35;
    blockMinutes.afternoon.supervision += mins * 0.3;
    blockMinutes.evening.supervision += mins * 0.35;
  }

  // Passive night presence — availability, not hands-on work.
  const needsNightPresence =
    !!input.isBedBound ||
    cogLoad === 'wandering_agitation' ||
    cogLoad === 'severe_sundowning' ||
    barthel.bi_bladder === 0 ||
    barthel.bi_transfer === 0;
  if (needsNightPresence) {
    const mins = ON_CALL_NIGHT_PRESENCE_HOURS * 60;
    thresholdTerms.push({ id: 'night_presence', label: 'Passive night presence / on-call availability', timeType: 'onCall', minutesPerDay: mins });
    blockMinutes.night_watch.onCall += mins;
  }

  // ---- Band width ----
  const bandBasis: string[] = [];
  let half: number = BAND_WIDTH.base;
  bandBasis.push(
    'Purpose-built home-care case-mix systems explain only 16-24% of individual care-hour variance (Parsons 2018; Bolster-Foucault 2023), so a wide band is the honest output.'
  );
  // Uncertainty from unmeasured coefficients, scaled to this patient's profile.
  const attributedMinutes = calibratedMinutes + uncalibratedMinutes;
  const uncalibratedShare = attributedMinutes > 0 ? uncalibratedMinutes / attributedMinutes : 1;
  if (uncalibratedShare > 0) {
    half += BAND_WIDTH.perUncalibratedShare * uncalibratedShare;
    const topUnmeasured = [...uncalibratedDrivers]
      .sort((a, b) => b.minutesPerDay - a.minutesPerDay)
      .slice(0, 3)
      .map((d) => d.label);
    bandBasis.push(
      uncalibratedShare >= 0.999
        ? 'No coefficient in this estimate has been measured locally; all are expert consensus.'
        : `${Math.round(uncalibratedShare * 100)}% of this estimate rests on coefficients never measured locally${
            topUnmeasured.length > 0 ? ` (largest: ${topUnmeasured.join(', ')})` : ''
          }.`
    );
  }

  if (missing.length > 0) {
    half += missing.length * BAND_WIDTH.perMissingItem;
    bandBasis.push(`${missing.length} assessment item(s) unanswered.`);
  }
  const srcAdd = BAND_WIDTH.bySource[source] ?? BAND_WIDTH.bySource.not_recorded;
  if (srcAdd > 0) {
    half += srcAdd;
    bandBasis.push(
      source === 'not_recorded'
        ? 'Reporting source not recorded.'
        : `Reported by ${source.replace(/_/g, ' ')}; proxy and self report overestimate assistance time (Cotter 2002).`
    );
  }
  if (usingLegacy) {
    half += BAND_WIDTH.legacyBinaryInput;
    bandBasis.push('Only legacy binary Katz data available; the graded assistance level that carries the time signal is missing.');
  }
  if (Object.keys(overrides).length === 0) {
    bandBasis.push('Task frequencies are model defaults, not clinician-confirmed for this patient.');
  }
  half = Math.min(half, BAND_WIDTH.max);

  const toEstimate = (minutesPerDay: number): CareTimeEstimate => {
    const point = minutesPerDay / 60;
    return {
      lowHours: round1(Math.max(0, point * (1 - half))),
      pointHours: round1(point),
      highHours: round1(point * (1 + half))
    };
  };

  // ---- De-overlap supervision against hands-on care, per block ----
  //
  // A caregiver assisting with toileting is already supervising; billing the
  // supervision requirement on top of the task time charges the same minutes
  // twice. Only supervision falling OUTSIDE hands-on care is counted.
  //
  // Done per block rather than on the daily total, because 2 h of supervision
  // needed in the evening is not discharged by 2 h of hands-on care delivered
  // in the morning.
  let supervisionOverlapCreditMinutes = 0;
  // The supervision requirement before de-overlap, kept because the elapsed
  // coverage window is driven by what was *required*, not by what was left over
  // after hands-on care absorbed part of it.
  const supervisionRequiredByBlock: Record<DiurnalTimeBlock, number> = {
    morning_rush: 0, afternoon: 0, evening: 0, night_watch: 0
  };
  for (const b of ALL_BLOCKS) {
    const required = blockMinutes[b].supervision;
    supervisionRequiredByBlock[b] = required;
    if (required <= 0) continue;
    const absorbed = Math.min(required, blockElapsedDirectCare[b]);
    blockMinutes[b].supervision = required - absorbed;
    supervisionOverlapCreditMinutes += absorbed;
  }

  const totalByType: Record<CareTimeType, number> = { directCare: 0, supervision: 0, onCall: 0 };
  for (const b of ALL_BLOCKS) {
    totalByType.directCare += blockMinutes[b].directCare;
    totalByType.supervision += blockMinutes[b].supervision;
    totalByType.onCall += blockMinutes[b].onCall;
  }

  // ---- Elapsed coverage requirement, per block ----
  //
  // How long somebody must be present, which is NOT the sum of the workload.
  // Within a block, the presence requirement is the longer of the supervision
  // window and the elapsed hands-on time — they happen in the same minutes, not
  // in series. On-call presence is elapsed by definition and adds to coverage.
  // Capped at the block's own wall-clock length; a 3-hour block cannot require
  // 4 hours of presence.
  const coverageMinutesByBlock: Record<DiurnalTimeBlock, number> = {
    morning_rush: 0, afternoon: 0, evening: 0, night_watch: 0
  };
  let totalCoverageMinutes = 0;
  for (const b of ALL_BLOCKS) {
    // Hands-on care and supervision occupy the SAME minutes, so presence is the
    // longer of the two, never their sum. On-call is a separate stretch of
    // elapsed time and does add.
    const awakePresence = Math.max(blockElapsedDirectCare[b], supervisionRequiredByBlock[b]);
    const capped = Math.min(awakePresence + blockMinutes[b].onCall, BLOCK_LENGTH_MINUTES[b]);
    coverageMinutesByBlock[b] = capped;
    totalCoverageMinutes += capped;
  }

  const directCare = toEstimate(totalByType.directCare);
  const supervision = toEstimate(totalByType.supervision);
  const onCall = toEstimate(totalByType.onCall);
  const activeCare = toEstimate(totalByType.directCare + totalByType.supervision);
  const coverage = toEstimate(totalCoverageMinutes);
  const combined = toEstimate(totalByType.directCare + totalByType.supervision + totalByType.onCall);

  // Block demands carry ACTIVE care only. Folding 8 hours of passive night
  // presence into `night_watch` made that block's demand exceed the block's own
  // wall-clock length, so every night read as under-covered regardless of the
  // patient. Night presence is reported via `requiresNightPresence`.
  const blockDemands = ALL_BLOCKS.reduce((acc, b) => {
    const m = blockMinutes[b];
    acc[b] = toEstimate(m.directCare + m.supervision);
    return acc;
  }, {} as Record<DiurnalTimeBlock, CareTimeEstimate>);

  return {
    directCare,
    supervision,
    onCall,
    activeCare,
    coverage,
    coverageByBlock: ALL_BLOCKS.reduce((acc, b) => {
      acc[b] = toEstimate(coverageMinutesByBlock[b]);
      return acc;
    }, {} as Record<DiurnalTimeBlock, CareTimeEstimate>),
    requiresNightPresence: needsNightPresence,
    combined,
    drivers: drivers.sort((a, b) => b.minutesPerDay - a.minutesPerDay),
    blockDemands,
    sharedOverheadCreditMinutes: Math.round(sharedOverheadCreditMinutes),
    supervisionOverlapCreditMinutes: Math.round(supervisionOverlapCreditMinutes),
    calibrationCoverage: {
      calibratedMinutesPerDay: Math.round(calibratedMinutes),
      uncalibratedMinutesPerDay: Math.round(uncalibratedMinutes),
      uncalibratedShare: Math.round(uncalibratedShare * 100) / 100,
      uncalibratedCells: [...uncalibratedDrivers]
        .sort((a, b) => b.minutesPerDay - a.minutesPerDay)
        .map((d) => d.key)
    },
    thresholdTerms,
    inputCompleteness: { answered, total, missing },
    assessmentSource: source,
    bandBasis,
    bandRelativeHalfWidth: Math.round(half * 100) / 100,
    inputGranularity: usingLegacy ? 'legacy_binary' : 'graded',
    provenance: CLINICAL_PROVENANCE.careDemandModel
  };
}

/** True when the band is too wide to support any staffing decision. */
export function isBandUninformative(band: CareDemandBand): boolean {
  return band.bandRelativeHalfWidth >= BAND_WIDTH.max;
}

/**
 * Gap semantics. A deficit is asserted only when the *entire* band exceeds
 * capacity. Where the band straddles capacity the answer is "indeterminate" and
 * the caller should prompt for the missing inputs rather than assert a deficit.
 */
export function classifyAgainstCapacity(
  band: CareTimeEstimate,
  capacityHours: number
): 'covered' | 'indeterminate' | 'deficit' {
  if (band.highHours <= capacityHours) return 'covered';
  if (band.lowHours > capacityHours) return 'deficit';
  return 'indeterminate';
}

/* ------------------------------------------------------------------ *
 * 6. CALIBRATION
 * ------------------------------------------------------------------ */

/**
 * What would make this model's output validated rather than asserted.
 *
 * Nothing below has been done. Until it has, the correct description of the
 * output is "an uncalibrated planning range for clinician review", and that is
 * what every surface in the app must say.
 *
 * Protocol:
 *  1. Define the outcome precisely and in advance — needed vs prescribed vs
 *     delivered vs paid vs unpaid hours. These are different quantities.
 *     Calibrating on *delivered* hours reproduces service rationing rather than
 *     estimating need, which is the central validity threat here.
 *  2. Measure the three time types separately (hands-on, supervision, on-call).
 *     A diary that records only a single total cannot calibrate this model.
 *  3. Independent development and validation samples — not a single refit.
 *  4. Report prediction error and prediction intervals, not correlations alone.
 *  5. Check calibration across severity levels, not only in aggregate.
 *  6. Test subgroups: sex, culture/language, dementia, living arrangement.
 *  7. Evaluate under-allocation explicitly. The harm here is asymmetric: an
 *     underestimate falls on an unpaid family caregiver's health.
 *  8. Compare against clinician-led multidisciplinary assessment as reference.
 *  9. Schedule reassessment and external validation.
 *
 * Minimum first step: a local time-diary study, n ~ 30-50 dyads, graded Barthel
 * plus a 3-day caregiver activity diary separating the three time types.
 */
/** What a calibration study measured for one coefficient cell. */
export interface CoefficientCalibration {
  /** Measured mean minutes per episode. Overrides the consensus default. */
  minutesPerEpisode?: number;
  /** Measured mean episodes per day. Overrides the consensus default. */
  frequencyPerDay?: number;
  /**
   * Standard error of the duration estimate, in minutes. Reported so a
   * well-measured cell with a wide spread is not mistaken for a precise one.
   */
  minutesSe?: number;
  /** Observed episodes behind this cell. A cell with too few stays uncalibrated. */
  episodeCount: number;
  /** Whether the diary-to-observation bias correction was applied (Cotter 2002). */
  biasCorrectionApplied?: boolean;
  calibratedAt?: string;
}

/**
 * Minimum observed episodes before a cell counts as calibrated.
 *
 * Below this the estimate is noise wearing a measurement's clothes, and
 * treating it as calibrated would narrow the band on no real evidence.
 */
export const MIN_EPISODES_FOR_CALIBRATION = 20;

/**
 * Per-coefficient calibration registry.
 *
 * Keys: `<barthelItemId>:<optionValue>` for graded Barthel cells (e.g.
 * `bi_transfer:5`), and the bare item id for Lawton items (e.g. `iadl_food`).
 *
 * EMPTY BY DESIGN. Nothing here has been measured. A calibration study
 * populates it cell by cell — see `docs/care-time-calibration-protocol.md`.
 *
 * Partial calibration is the expected outcome, not a transitional state. Rare
 * cells (two-person floor transfers, severe-sundowning supervision) will not
 * reach `MIN_EPISODES_FOR_CALIBRATION` at any realistic sample size, so the
 * model has to work correctly while some cells are measured and others are not.
 * That is why uncertainty is tracked per cell and the band widens in proportion
 * to how much of a given patient's estimate rests on unmeasured ones, rather
 * than being a single global constant.
 */
export const CALIBRATION_REGISTRY: Record<string, CoefficientCalibration> = {};

/** Registry key for a graded Barthel cell. */
export function barthelCalibrationKey(itemId: string, optionValue: number): string {
  return `${itemId}:${optionValue}`;
}

/** True when a cell has enough observed episodes to be trusted over consensus. */
export function isCellCalibrated(key: string): boolean {
  const entry = CALIBRATION_REGISTRY[key];
  return !!entry && entry.episodeCount >= MIN_EPISODES_FOR_CALIBRATION;
}

/**
 * Study-level calibration status, for provenance and the governance log.
 *
 * `calibrated` stays false until the registry covers the coefficients that
 * actually drive estimates in this population — not merely until some cells
 * have numbers in them.
 */
export const CALIBRATION = {
  calibrated: false,
  outcomeDefinition: null as null | 'needed' | 'delivered' | 'prescribed' | 'paid' | 'unpaid',
  developmentSampleN: 0,
  validationSampleN: 0,
  observedSubsampleN: 0,
  /** Measured out-of-sample prediction interval half-width, once known. */
  measuredBandHalfWidth: null as number | null,
  /** Held-out R-squared. Above ~0.4 suspect leakage, not success. */
  outOfSampleR2: null as number | null,
  /** Held-out share of patient-days where need exceeded the upper band edge. */
  underAllocationRate: null as number | null,
  lastCalibratedAt: null as string | null,
  notes:
    'Uncalibrated. Every coefficient is expert consensus. The band width is an assumption anchored on published variance ceilings, not this service\'s measured error. See docs/care-time-calibration-protocol.md.'
};

/* ------------------------------------------------------------------ *
 * 7. RECONCILING THE TWO FUNCTIONAL ASSESSMENTS
 * ------------------------------------------------------------------ */

/**
 * Derive the 6 boolean Katz items FROM graded Barthel responses.
 *
 * This codebase collected two functional assessments independently: a graded
 * Barthel/Lawton form, and a separate set of Katz checkboxes in onboarding and
 * the profiler. Nothing reconciled them, so the same patient could be recorded
 * as continent in one place and incontinent in the other, and the care-demand
 * model read the boolean set — discarding the assistance gradient that carries
 * most of the care-time signal.
 *
 * Graded Barthel is now the single source of truth. The Katz booleans are
 * derived from it for the displays, trajectory analytics and cohort code that
 * still consume them.
 *
 * "Independent" means fully independent at the Barthel item's top level;
 * anything less is dependence, because Katz has no way to express partial help.
 * Mapping that way loses information in the direction that matters least: it
 * never understates dependence.
 */
export function katzFromBarthelResponses(
  barthel: Record<string, number>
): { bathing: boolean; dressing: boolean; toileting: boolean; transferring: boolean; continence: boolean; feeding: boolean } | undefined {
  const required = ['bi_bathing', 'bi_dressing', 'bi_toilet', 'bi_transfer', 'bi_bowels', 'bi_bladder', 'bi_feeding'];
  if (required.some((id) => typeof barthel[id] !== 'number')) return undefined;

  const topLevel = (id: string): number => {
    const table = BARTHEL_TASK_WEIGHTS[id];
    return table ? Math.max(...Object.keys(table).map(Number)) : 0;
  };
  const independent = (id: string) => barthel[id] >= topLevel(id);

  return {
    bathing: independent('bi_bathing'),
    dressing: independent('bi_dressing'),
    toileting: independent('bi_toilet'),
    transferring: independent('bi_transfer'),
    // Katz has one continence item; Barthel has two. Dependence in either is
    // dependence — continence care is required if bowel OR bladder needs help.
    continence: independent('bi_bowels') && independent('bi_bladder'),
    feeding: independent('bi_feeding')
  };
}

/** Derive the legacy boolean Lawton profile from graded Lawton responses. */
export function lawtonFlagsFromResponses(
  lawton: Record<string, number>
): Record<string, boolean> {
  const byId: Record<string, string> = {
    iadl_phone: 'telephone',
    iadl_shopping: 'shopping',
    iadl_food: 'mealPreparation',
    iadl_housekeeping: 'housekeeping',
    iadl_laundry: 'laundry',
    iadl_transport: 'transportation',
    iadl_medication: 'medicationManagement',
    iadl_finances: 'finances'
  };
  const out: Record<string, boolean> = {};
  for (const [itemId, flagKey] of Object.entries(byId)) {
    const v = lawton[itemId];
    if (typeof v === 'number') out[flagKey] = v > 0;
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * 8. PHASE 0 INSTRUMENTATION — snapshotting an estimate for calibration
 * ------------------------------------------------------------------ */

/**
 * Flatten a band into the primitive snapshot the calibration log stores.
 *
 * Kept here, next to the model, so that adding an output to `CareDemandBand`
 * surfaces as a compile error at this function rather than silently producing a
 * log that is missing the new field. A calibration dataset with a silently
 * absent column is worse than no dataset, because the gap is invisible at
 * analysis time.
 */
export function snapshotCareDemandForCalibration(band: CareDemandBand): {
  activeCareLowHours: number;
  activeCarePointHours: number;
  activeCareHighHours: number;
  directCarePointHours: number;
  supervisionPointHours: number;
  onCallPointHours: number;
  coveragePointHours: number;
  bandRelativeHalfWidth: number;
  requiresNightPresence: boolean;
  inputGranularity: 'graded' | 'legacy_binary';
  assessmentSource: string;
  uncalibratedShare: number;
} {
  return {
    activeCareLowHours: band.activeCare.lowHours,
    activeCarePointHours: band.activeCare.pointHours,
    activeCareHighHours: band.activeCare.highHours,
    directCarePointHours: band.directCare.pointHours,
    supervisionPointHours: band.supervision.pointHours,
    onCallPointHours: band.onCall.pointHours,
    coveragePointHours: band.coverage.pointHours,
    bandRelativeHalfWidth: band.bandRelativeHalfWidth,
    requiresNightPresence: band.requiresNightPresence,
    inputGranularity: band.inputGranularity,
    assessmentSource: band.assessmentSource,
    uncalibratedShare: band.calibrationCoverage.uncalibratedShare
  };
}
