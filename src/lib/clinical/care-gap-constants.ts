/**
 * Sanjeevani Care Gap Engine — Clinical Constants & Literature Provenance
 *
 * Every parameter used in the Care Gap Estimation Engine is extracted here.
 *
 * CITATION RULE (added 2026-10-03, after an audit found a reference that did not
 * support its claim — see `DEMAND_PER_ADL_DEFICIT_HOURS`):
 *
 *   A citation may support the validity of an *input* or the existence of a
 *   *term*. It may never be used to license the *magnitude* of a coefficient
 *   unless that citation reports a measured value in a comparable population.
 *   Every coefficient in this file is therefore tagged
 *   `@calibration expert-consensus, uncalibrated`, because none of them has been
 *   calibrated against measured care time. An earlier version of this header
 *   described some parameters as "Empirically Anchored"; that claim was not
 *   supportable and has been withdrawn.
 *
 * THE EVIDENCE CEILING FOR CARE-HOUR PREDICTION
 *
 * This matters for how any output built on these constants may be presented.
 * Case-mix systems purpose-built to predict care time — calibrated against
 * observed hours, spanning function, cognition, behaviour, clinical complexity
 * and rehabilitation — still explain only a minority of individual variation in
 * home-care hours:
 *
 *   interRAI-CA   16%  of formal home-care service hour variance
 *   interRAI-HC   24%  (33 clusters, complex-needs clients)
 *   RUG-III/HC    23.34% of combined paid + unpaid care time
 *
 * @citation Parsons M, Rouse P, Sajtos L, Harrison J, Parsons J, Gestro L.
 *           Developing and utilising a new funding model for home-care services
 *           in New Zealand. Health Soc Care Community. 2018;26(3):345-355.
 * @citation Bolster-Foucault C, Holyoke P. Resource Utilization Groups in
 *           transitional home care: validating the RUG-III/HC case-mix system in
 *           hospital-to-home care programs. BMC Health Serv Res. 2023;23:1324.
 *
 * RUG-III reaches 55.5% variance explained, but that figure is per-diem *cost*
 * in a *nursing home* derived from direct 24-hour nursing-time measurement. It
 * is the institutional best case and does not transfer to domiciliary care.
 * @citation Fries BE, Schneider DP, Foley WJ, Gavazzi M, Burke R, Cornelius E.
 *           Refining a case-mix measure for nursing homes: Resource Utilization
 *           Groups (RUG-III). Med Care. 1994;32(7):668-685.
 *
 * The instrument family actually designed to convert dependency into care hours
 * and cost — and therefore the correct comparator for any model in this
 * codebase — is the Northwick Park Dependency Score and its Care Needs
 * Assessment.
 * @citation Turner-Stokes L, Sutch S, Dredge R. Healthcare tariffs for specialist
 *           inpatient neurorehabilitation services: rationale and development of
 *           a UK casemix and costing methodology. Clin Rehabil. 2011;26(3):264-279.
 *
 * Consequence: a model built on these inputs must emit a *range*, must keep
 * hands-on, supervision and on-call time separate, and must never be presented
 * as determining an individual patient's required hours. See
 * `./care-demand-model.ts`, which supersedes the per-deficit hour constants
 * below.
 *
 * Target Setting: Indian Geriatric & Palliative Home Care (LASI / Longitudinal Ageing Study in India context,
 * multigenerational joint families, filial caregiving, out-of-pocket financial toxicity).
 */

export type FormalSupportType =
  | 'trained_nurse_24h'
  | 'paid_attendant_24h'
  | 'trained_nurse_12h'
  | 'paid_attendant_12h'
  | 'medical_assistant'
  | 'multi_family_rotation'
  | 'none';

/**
 * Semantic Engine Version (semver) stamped on all evaluations for clinical auditability.
 */
export const CARE_GAP_ENGINE_VERSION = '2.3.0';

/* ------------------------------------------------------------------ *
 * 1. PATIENT CARE DEMAND CONSTANTS
 * ------------------------------------------------------------------ */

/**
 * DEPRECATED — retained only so legacy stored evaluations remain readable.
 *
 * This was a flat 1.5 h/day floor applied to every patient, which meant a fully
 * independent elder (Katz 6/6, Lawton 8/8) still generated 1.5 h of "demand"
 * and so could never show a zero care gap. The floor was unfalsifiable and it
 * guaranteed a non-zero deficit for well patients whose caregiver was
 * capacity-limited.
 *
 * WHO ICOPE was cited here as justification, but ICOPE argues for comprehensive
 * person-centred assessment and an individualised care plan. It is authority for
 * an assessment *approach*, not for a baseline hour constant. The Family
 * Caregiver Alliance and Indian Academy of Geriatrics citations were likewise
 * descriptive population statistics, not a per-patient floor.
 *
 * Replaced by item-level terms in `care-demand-model.ts`, where a patient with
 * no deficits correctly yields zero.
 *
 * @deprecated Use `estimateCareDemand` from `./care-demand-model`.
 * @calibration expert-consensus, uncalibrated
 */
export const BASELINE_CARE_DEMAND_HOURS = 1.5;

/**
 * DEPRECATED — flat hours per Katz ADL deficit. Superseded by graded,
 * frequency-aware item weights in `care-demand-model.ts`.
 *
 * CITATION CORRECTION. This constant previously carried three citations, none of
 * which supported it:
 *
 *  1. A reference to "NHATS & NSOC. Hours of Care by Self-Care ADL Impairment
 *     Count. J Am Geriatr Soc. 2016;64(11):2257-2264" was the stated anchor for
 *     the 1.0 h figure. That volume/issue/page range is in fact Lee DR, Kawas CH,
 *     Gibbs L, Corrada MM. "Prevalence of Frailty and Factors Associated with
 *     Frailty in Individuals Aged 90 and Older: The 90+ Study." J Am Geriatr Soc.
 *     2016;64(11):2257-2262 (PMID 27590837) — a frailty-prevalence study
 *     containing no care-hours data. The citation did not support the claim and
 *     has been removed.
 *  2. Katz 1963 establishes the instrument. It contains no time coefficient and
 *     cannot license an hours-per-deficit figure.
 *  3. The "CMS Home Health PPS personal care service-minutes allocation" figures
 *     were unsourced. HH PPS is an episode-level case-mix payment system; it does
 *     not publish per-task minute allocations.
 *
 * The underlying modelling error was treating an ordinal deficit count as a time
 * scale: all six ADLs weighted equally, no frequency, no assistance gradient, no
 * staff count. Bathing two or three times weekly and toileting eight times daily
 * cannot share one coefficient.
 *
 * @deprecated Use `BARTHEL_TASK_WEIGHTS` in `./care-demand-model`.
 * @calibration expert-consensus, uncalibrated
 */
export const DEMAND_PER_ADL_DEFICIT_HOURS = 1.0;

/**
 * DEPRECATED — flat hours per Lawton IADL deficit. Superseded by the two-factor,
 * frequency-amortised weights in `care-demand-model.ts`.
 *
 * CITATION CORRECTION:
 *  1. Lawton & Brody 1969 establishes the instrument and contains no time
 *     coefficient.
 *  2. The "RUG-III / RAI Home Care time studies" reference was used as though it
 *     supplied home-care IADL minutes. RUG-III (Fries et al., Med Care
 *     1994;32:668-685) measures *nursing-home* staff time; importing those
 *     figures into domiciliary IADL work is a transportability claim with no
 *     bridging study behind it.
 *
 * Two further structural problems with a single IADL coefficient:
 *  - The 8-item Lawton loads on two distinct factors, physical and cognitive
 *    IADL (Ng et al., J Gerontol A 2006;61:726-735). One coefficient treats
 *    "cannot manage finances" and "cannot do laundry" as the same quantity of
 *    care time.
 *  - IADL frequencies differ by an order of magnitude: meal preparation is three
 *    times daily, transport perhaps weekly. A per-deficit constant discards this.
 *
 * @deprecated Use `LAWTON_TASK_WEIGHTS` in `./care-demand-model`.
 * @calibration expert-consensus, uncalibrated
 */
export const DEMAND_PER_IADL_DEFICIT_HOURS = 0.35;

/**
 * Vigilance and emotional containment overhead by cognitive/behavioral disturbance pattern.
 * 
 * @citation Zarit SH, Reever KE, Bach-Peterson J. Relatives of the Impaired Elderly: Correlates of Feelings of Burden.
 *           Gerontologist. 1980;20(6):649-655.
 * @citation Teri L, Truax P, Logsdon R, et al. Assessment of Behavioral Problems in Dementia:
 *           The Revised Memory and Behavior Problems Checklist. Psychol Aging. 1992;7(4):622-631.
 *
 * Both citations establish that behavioural disturbance drives caregiver burden
 * and that it is measurable. Neither reports hours, so the magnitudes here are
 * not derived from them. Supervision need frequently dominates total care time
 * while basic ADLs remain intact, which is precisely what an ADL-only model
 * cannot see.
 * @calibration expert-consensus, uncalibrated
 */
export const COGNITIVE_OVERHEAD_HOURS = {
  none: 0,
  mild_forgetfulness: 1.0,
  wandering_agitation: 2.5,
  severe_sundowning: 4.0
} as const;

/**
 * 2-hourly repositioning, pressure ulcer prevention, and linen change overhead for bed-bound patients.
 * 
 * @citation European Pressure Ulcer Advisory Panel (EPUAP) & National Pressure Injury Advisory Panel (NPIAP).
 *           Prevention and Treatment of Pressure Ulcers/Injuries: Clinical Practice Guideline. 2019.
 * @calibration expert-consensus, uncalibrated (bed turning overhead difference with motorized bed & ripple mattress)
 */
export const BED_BOUND_OVERHEAD_HOURS = {
  standard: 2.0,
  withMotorizedBedAndRipple: 1.2
} as const;

/**
 * Fall history vigilance penalty (hours/day).
 * Repeat fallers require post-fall mobility escort, environment clearing, and gait supervision.
 * 
 * @citation Tinetti ME, Speechley M, Ginter SF. Risk Factors for Falls Among Elderly Persons Living in the Community.
 *           N Engl J Med. 1988;319(26):1701-1707.
 * @calibration expert-consensus, uncalibrated (scale: 1.0h base + 0.5h per additional fall up to 2.0h max)
 */
export const FALL_RISK_HOURS_BASE = 1.0;
export const FALL_RISK_HOURS_PER_REPEAT = 0.5;
export const FALL_RISK_HOURS_MAX = 2.0;

/* ------------------------------------------------------------------ *
 * 2. FORMAL & ANCILLARY STAFF PRODUCTIVITY CONSTANTS
 * ------------------------------------------------------------------ */

/**
 * Maximum fraction of total care demand absorbable by formal/paid attendants.
 * Residual 15% consists of non-delegable family coordination, emotional reassurance,
 * bedside medical decision-making, and supervisory oversight.
 * 
 * @citation CMS Guidelines for Respite & Home Health Aide Supervision (42 CFR § 484.80).
 * @calibration expert-consensus, uncalibrated
 */
export const MAX_FORMAL_ABSORBABLE_FRACTION = 0.85;

/**
 * Formal staff productivity factor (hands-on direct care delivered per scheduled staff hour).
 * 
 * @citation CMS Home Health PPS productivity ratio benchmarks (direct patient contact vs rest/charting).
 * @citation Indian Geriatric Home Care Practices (AIIMS / HelpAge India): 24h live-in domestic attendants (ayahs)
 *           often provide about 16h hands-on care with an 8h nocturnal rest/sleep window.
 *
 * Note that the 8h nocturnal window a live-in attendant spends resting is
 * precisely `onCall` time in `care-demand-model.ts`: present and available, but
 * not delivering hands-on care. Keeping the two apart is why that model reports
 * them as separate quantities.
 * @calibration expert-consensus, uncalibrated
 */
export interface FormalSupportSpec {
  nominalHours: number;
  productivityFactor: number;
}

export const FORMAL_PRODUCTIVITY_FACTORS: Record<FormalSupportType, FormalSupportSpec> = {
  trained_nurse_24h: { nominalHours: 24, productivityFactor: 16.0 / 24 }, // 16.0h / 24h = 0.667
  paid_attendant_24h: { nominalHours: 24, productivityFactor: 16.0 / 24 }, // 16.0h / 24h = 0.667
  trained_nurse_12h: { nominalHours: 12, productivityFactor: 10.0 / 12 }, // 10.0h / 12h = 0.833
  paid_attendant_12h: { nominalHours: 12, productivityFactor: 10.0 / 12 }, // 10.0h / 12h = 0.833
  medical_assistant: { nominalHours: 6, productivityFactor: 1.0 }, // 6.0h / 6h = 1.000
  // Multi-family rotation is informal family care coordination, NOT paid formal external staff.
  // Treating it as a flat 6h of formal capacity double-counts against secondary family member hours
  // and dangerously masks severe understaffing. Family capacity must be derived from actual eligible task coverage.
  multi_family_rotation: { nominalHours: 0, productivityFactor: 0 },
  none: { nominalHours: 0, productivityFactor: 0 }
};

/**
 * Diminishing returns weight series for multi-staff configurations (e.g. 24h nurse + day attendant).
 * First staff member delivers 100% of nominal capacity; second delivers 50%; third delivers 25%.
 * 
 * @calibration expert-consensus, uncalibrated
 */
export const MULTI_STAFF_DIMINISHING_WEIGHTS = [1.0, 0.5, 0.25] as const;

/* ------------------------------------------------------------------ *
 * 3. PRIMARY CAREGIVER CAPACITY & HEALTH DEDUCTIONS
 * ------------------------------------------------------------------ */

/**
 * Employment daily safe physical caregiving limits (hours/day).
 * Full-time employed carers have a strict physiological cap of 5.0h caregiving/day before acute burnout.
 * Part-time employed carers cap at 7.0h/day.
 * 
 * @citation Schulz R, Sherwood PR. Physical and Mental Health Effects of Family Caregiving. Am J Nurs. 2008;108(9 Suppl):23-27.
 * @citation NSSO 75th Round: Key Indicators of Household Social Consumption on Health in India. 2019.
 *
 * These establish that caregiving at volume harms caregiver health. Neither
 * defines a safe daily hour cap, so the specific caps below are a policy choice
 * rather than a measured threshold.
 * @calibration expert-consensus, uncalibrated
 */
export const EMPLOYMENT_CAPACITY_CAPS = {
  full_time: 5.0,
  part_time: 7.0
} as const;

/**
 * Minimum physiological floor for primary caregiver safe capacity (hours/day).
 */
export const CAREGIVER_MINIMUM_SAFE_CAPACITY_HOURS = 1.0;

/**
 * Caregiver functional capacity deduction (hours/day).
 * 
 * @calibration expert-consensus, uncalibrated
 */
export const CAREGIVER_FUNCTIONAL_DEDUCTIONS = {
  fully_independent: 0,
  mild_frailty: 1.0,
  moderate_limitations: 2.5,
  severe_disability: 4.5
} as const;

/**
 * Senior spouse dyad strain deduction (hours/day).
 * Spouses aged >= 65 caring for an impaired partner experience shared geriatric vulnerability.
 * Relieved to 0.5h if family or formal support absorbs significant daily care load.
 * 
 * @citation Vitaliano PP, Zhang J, Scanlan JM. Is Caregiving Hazardous to One's Physical Health? A Meta-Analysis.
 *           Psychol Bull. 2003;129(6):946-972.
 * @calibration expert-consensus, uncalibrated
 */
export const SENIOR_SPOUSE_KINSHIP_DEDUCTION = 1.0;
export const SENIOR_SPOUSE_KINSHIP_DEDUCTION_RELIEVED = 0.5;

/**
 * Caregiver health impairment deductions and task-relief offsets (hours/day).
 * 
 * @citation CDC / NIOSH Ergonomics for Manual Handling.
 * @calibration expert-consensus, uncalibrated
 */
export const CAREGIVER_HEALTH_DEDUCTIONS = {
  backPainUnrelieved: 1.5,
  backPainRelievedByStaffOrFamily: 0.5,
  arthritisUnrelieved: 1.0,
  arthritisRelievedByStaffOrFamily: 0.3,
  insomniaUnrelieved: 1.0,
  insomniaRelievedByNightCare: 0.3,
  age65PlusDeduction: 1.5
} as const;

/* ------------------------------------------------------------------ *
 * 4. BIOMECHANICAL LUMBAR STRAIN & NIOSH / MAPO ERGONOMIC CONSTANTS
 * ------------------------------------------------------------------ */

/**
 * NIOSH Revised Lifting Equation (RNLE) Load Constant (LC) in kilograms.
 * Represents the maximum load acceptable under ideal conditions to 99% of men and 75% of women.
 * 
 * @citation Waters TR, Putz-Anderson V, Garg A, Fine LJ. Revised NIOSH Equation for the Design
 *           and Evaluation of Manual Lifting Tasks. Ergonomics. 1993;36(7):749-776.
 */
export const NIOSH_RNLE_LOAD_CONSTANT_KG = 23.0;

/**
 * NIOSH L5/S1 Spinal Compression Limits (kiloNewtons).
 * - Action Limit (AL): 3.4 kN (forces above this increase micro-fracture and disc herniation risk).
 * - Maximum Permissible Limit (MPL): 6.4 kN (unsafe for all workers).
 * 
 * @citation National Institute for Occupational Safety and Health (NIOSH). Work Practices Guide for Manual Lifting. 1981.
 * @citation Marras WS, Granata KP, Davis KG, et al. Effects of Load Mass and Dynamic Motion on Lumbar Spine Loading.
 *           Spine. 1999;24(20):2097-2107.
 */
export const NIOSH_SPINAL_COMPRESSION_ACTION_LIMIT_KN = 3.4;
export const NIOSH_SPINAL_COMPRESSION_MAX_LIMIT_KN = 6.4;

/**
 * Movement and Assistance of Hospital Patients (MAPO) Patient-Handling Parameters.
 * 
 * @citation Battevi N, Menoni O, Ricci MG, Cairoli S. MAPO index for risk assessment of patient
 *           manual handling in hospital wards. Ergonomics. 2006;49(7):671-687.
 */
export const MAPO_PATIENT_HANDLING_PARAMS = {
  /** Effective fraction of total body mass supported during transfer */
  effectiveTransferMassFractions: {
    bedToChair: 0.60,
    bedRepositioning: 0.35,
    sitToStand: 0.40,
    floorTransfer: 1.00
  },
  /** Equipment strain modifiers on RNLE multipliers (applied directly to physical lift geometry) */
  equipmentModifiers: {
    /** Motorized bed adjusts starting origin to ideal knuckle/waist level (75 cm) */
    motorizedBedVM: 0.95,
    manualAdjustableBedVM: 0.88,
    standardLowBedVM: 0.78,
    /** Swivel pivot disc and slide sheets eliminate trunk rotation and shear torque (0 deg angle) */
    transferAidsAM: 1.00,
    standardManualLiftAM: 0.71,
    /** Transfer gait belt / ergonomic grips provide secure coupling */
    transferAidsCM: 1.00,
    standardManualLiftCM: 0.90,
    /** Alternating pressure ripple mattress reduces friction resistance during in-bed turns by 40% */
    rippleMattressTurnFrictionDiscount: 0.40
  },
  /** Caregiver physical vulnerability factors on spinal tolerance limit */
  caregiverToleranceFactors: {
    ageUnder50: 1.00,
    age50To64: 0.85,
    age65Plus: 0.75,
    preExistingBackPainToleranceDiscount: 0.65, // Lowers compression threshold to 2.2 kN
    peripheralArthritisCouplingDiscount: 0.85
  }
} as const;

/**
 * Baseline musculoskeletal score for any active domestic caregiver.
 * 
 * @calibration expert-consensus, uncalibrated
 */
export const INJURY_INDEX_BASELINE = 20;

/**
 * Physical load multipliers for patient weight & bed-bound status during manual transfers.
 * 
 * @citation Waters TR, Putz-Anderson V, Garg A, Fine LJ. Revised NIOSH Equation for the Design
 *           and Evaluation of Manual Lifting Tasks. Ergonomics. 1993;36(7):749-776.
 */
export const BIOMECHANICAL_LOAD_MULTIPLIERS = {
  heavyWeightThresholdKg: 80,
  heavyWeightMultiplier: 1.4,
  moderateWeightThresholdKg: 70,
  moderateWeightMultiplier: 1.2,
  highBmiThreshold: 28,
  highBmiMultiplier: 1.4,
  standardWeightMultiplier: 1.0,
  bedBoundMultiplier: 1.3
} as const;

/**
 * Ergonomic assistive device discounts on the cumulative biomechanical strain tally (%).
 * 
 * @citation Nelson A, Baptiste AS. Evidence-Based Practices for Safe Patient Handling and Movement.
 *           Online J Issues Nurs. 2004;9(3):4.
 * @calibration expert-consensus, uncalibrated
 */
export const ERGONOMIC_DEVICE_DISCOUNTS = {
  motorizedHospitalBed: 25,
  manualAdjustableBed: 15,
  transferAidsGaitBeltDisc: 15,
  wheelchair: 10,
  airWaterMattress: 10,
  maxDiscountPercent: 50
} as const;

/* ------------------------------------------------------------------ *
 * 5. FINANCIAL TOXICITY & BURNOUT MULTIPLIERS
 * ------------------------------------------------------------------ */

/**
 * Out-of-pocket medical expenditure (OOPME) burden multiplier.
 * In India, where >60% of geriatric healthcare is financed out-of-pocket, severe financial toxicity
 * compounds physiological caregiver stress into acute burnout.
 * 
 * @citation Pandey A, Ploubidis GB, Clarke L, Dandona L. Trends in Catastrophic Health Spending in India.
 *           Bull World Health Organ. 2018;96(5):319-328.
 * @citation Longitudinal Ageing Study in India (LASI) Wave-1. Ministry of Health & Family Welfare, GoI; 2020.
 * @calibration expert-consensus, uncalibrated
 */
export const FINANCIAL_STRAIN_MULTIPLIERS = {
  severe_toxicity: 1.4,
  moderate_strain: 1.15,
  manageable: 1.0
} as const;

/* ------------------------------------------------------------------ *
 * 6. CLINICAL THRESHOLDS FOR SEVERITY & BURNOUT
 * ------------------------------------------------------------------ */

export const GAP_CRITICAL_THRESHOLD = 4.5;
export const GAP_HIGH_THRESHOLD = 2.0;

export const INJURY_CRITICAL_THRESHOLD = 75;
export const INJURY_HIGH_THRESHOLD = 55;
export const INJURY_MODERATE_THRESHOLD = 30;

/* ------------------------------------------------------------------ *
 * 7. DIURNAL CARE GAP INDEX CONSTANTS (NON-LINEAR SATURATION)
 * ------------------------------------------------------------------ */

export type DiurnalTimeBlock = 'morning_rush' | 'afternoon' | 'evening' | 'night_watch';

/**
 * Block criticality weighting factors.
 * - Morning Rush (1.3x): High physical intensity (transfers, hygiene, time-sensitive meds/breakfast).
 * - Afternoon (0.8x): Elective/flexible domestic chores and medical errands.
 * - Evening Peak (1.1x): Dinner, nocturnal prep, caregiver cumulative daytime fatigue.
 * - Night Watch (1.6x): Nocturnal sleep disruption, nocturia, dark-environment fall risk, sundowning agitation.
 * 
 * @citation Schulz R, Beach SR. Caregiving as a Risk Factor for Mortality: The Caregiver Health Effects Study.
 *           JAMA. 1999;282(23):2215-2219. (Nocturnal sleep interruption accelerates caregiver physiological decline).
 * @calibration expert-consensus, uncalibrated
 */
export const DIURNAL_BLOCK_CRITICALITY: Record<DiurnalTimeBlock, number> = {
  morning_rush: 1.3,
  afternoon: 0.8,
  evening: 1.1,
  night_watch: 1.6
};

/**
 * Non-linear concentration power exponent (1.25).
 * Concentrated deficit in a single time-block generates higher physiological and clinical strain
 * than the same total hours distributed evenly across multiple blocks.
 * 
 * @calibration expert-consensus, uncalibrated
 */
export const DIURNAL_CONCENTRATION_EXPONENT = 1.25;

/**
 * Saturation scale constant for Diurnal Care Gap Index (0-100).
 * 
 * @calibration expert-consensus, uncalibrated
 */
export const DIURNAL_INDEX_SATURATION_SCALE = 3.5;
