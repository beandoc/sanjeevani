/**
 * Sanjeevani Caregiver Dyad & Care Gap Estimation Engine
 * Quantifies the mismatch between patient care demand (Katz ADL / Lawton IADL / Multimorbidity)
 * and caregiver physical/temporal capacity (Age, Health, Employment, Kinship, Formal Support Infrastructure).
 */

import { performsHeavyTransfers, resolveSupportTypes } from './formal-support';
import { calculateBiomechanicalLoad } from './biomechanical-load';
import { MedicationChecker } from './medication-checker';
import { CLINICAL_PROVENANCE, ClinicalProvenance } from './provenance';
import {
  assessClinicalDataQuality,
  ClinicalAssessmentMetadata,
  ClinicalDataQuality
} from './assessment-quality';
import { CLINICAL_POLICY } from './clinical-policy';
import {
  FormalSupportType,
  CARE_GAP_ENGINE_VERSION,
  BASELINE_CARE_DEMAND_HOURS,
  DEMAND_PER_ADL_DEFICIT_HOURS,
  DEMAND_PER_IADL_DEFICIT_HOURS,
  COGNITIVE_OVERHEAD_HOURS,
  BED_BOUND_OVERHEAD_HOURS,
  FALL_RISK_HOURS_BASE,
  FALL_RISK_HOURS_PER_REPEAT,
  FALL_RISK_HOURS_MAX,
  MAX_FORMAL_ABSORBABLE_FRACTION,
  FORMAL_PRODUCTIVITY_FACTORS,
  MULTI_STAFF_DIMINISHING_WEIGHTS,
  EMPLOYMENT_CAPACITY_CAPS,
  CAREGIVER_MINIMUM_SAFE_CAPACITY_HOURS,
  CAREGIVER_FUNCTIONAL_DEDUCTIONS,
  SENIOR_SPOUSE_KINSHIP_DEDUCTION,
  SENIOR_SPOUSE_KINSHIP_DEDUCTION_RELIEVED,
  CAREGIVER_HEALTH_DEDUCTIONS,
  INJURY_INDEX_BASELINE,
  BIOMECHANICAL_LOAD_MULTIPLIERS,
  ERGONOMIC_DEVICE_DISCOUNTS,
  FINANCIAL_STRAIN_MULTIPLIERS,
  GAP_CRITICAL_THRESHOLD,
  GAP_HIGH_THRESHOLD,
  INJURY_CRITICAL_THRESHOLD,
  INJURY_HIGH_THRESHOLD,
  INJURY_MODERATE_THRESHOLD,
  DIURNAL_BLOCK_CRITICALITY,
  DIURNAL_CONCENTRATION_EXPONENT,
  DIURNAL_INDEX_SATURATION_SCALE
} from './care-gap-constants';

export * from './care-gap-constants';

export type CareTask =
  | 'heavy_transfers'
  | 'bathing'
  | 'medications'
  | 'feeding'
  | 'night_care'
  | 'logistics_errands';

export type DiurnalTimeBlock = 'morning_rush' | 'afternoon' | 'evening' | 'night_watch';

export interface DiurnalBlockMeta {
  id: DiurnalTimeBlock;
  label: string;
  timeRange: string;
  icon: string;
  description: string;
  typicalTasks: CareTask[];
}

export const DIURNAL_TIME_BLOCKS: DiurnalBlockMeta[] = [
  {
    id: 'morning_rush',
    label: 'Morning Rush',
    timeRange: '07:00 - 10:00',
    icon: '🌅',
    description: 'High physical intensity: Bed-to-chair transfer, sponge bathing, morning BP/insulin meds & breakfast',
    typicalTasks: ['heavy_transfers', 'bathing', 'medications', 'feeding']
  },
  {
    id: 'afternoon',
    label: 'Midday & Logistics',
    timeRange: '12:00 - 15:00',
    icon: '☀️',
    description: 'Moderate load: Lunch feeding, hydration, turning, OPD clinic runs & pharmacy errands',
    typicalTasks: ['feeding', 'logistics_errands']
  },
  {
    id: 'evening',
    label: 'Evening Peak',
    timeRange: '18:00 - 21:00',
    icon: '🌆',
    description: 'Dinner assistance, evening meds, vital logging, and bed prep',
    typicalTasks: ['feeding', 'medications', 'heavy_transfers']
  },
  {
    id: 'night_watch',
    label: 'Night Watch / Sleep Guard',
    timeRange: '22:00 - 06:00',
    icon: '🌙',
    description: '2-hourly repositioning, incontinence diaper change, sundowning supervision',
    typicalTasks: ['night_care']
  }
];

export interface DiurnalScheduleConflict {
  memberId: string;
  memberName: string;
  conflictingTask: CareTask;
  taskWindow: DiurnalTimeBlock;
  workSchedule: string;
  recommendation: string;
}

export interface AssistiveDeviceInventory {
  hospitalBed: 'none' | 'manual_adjustable' | 'motorized_multichannel';
  airWaterMattress: boolean;
  wheelchair: boolean;
  suctionApparatus: boolean;
  transferAids: boolean; // swivel pivot disc, slide sheet, transfer gait belt
}

export const DEFAULT_ASSISTIVE_DEVICES: AssistiveDeviceInventory = {
  hospitalBed: 'none',
  airWaterMattress: false,
  wheelchair: false,
  suctionApparatus: false,
  transferAids: false
};

export interface SecondaryFamilyMember {
  id: string;
  name: string;
  relationship: 'son' | 'daughter' | 'daughter_in_law' | 'son_in_law' | 'spouse' | 'sibling' | 'grandchild' | 'other';
  age: number;
  occupation?: string;
  workCommitmentSchedule?: string;
  careRestrictions?: string;
  functionalStatus?: 'independent' | 'has_limitations';
  hoursPerDay: number;
  assignedTasks: CareTask[];
  hasPhysicalLimitation: boolean;
  availableTimeBlocks?: DiurnalTimeBlock[];
}

export interface EmergencyLogistics {
  hospitalDistanceKm: number;
  travelTimeMinutes: number;
  fourWheelerAvailableAtHome: boolean;
  vehicleDetails?: string;
  designatedEmergencyDriver?: string;
  preferredHospitalName?: string;
  ambulanceContact?: string;
}

export interface MonthlyRotationPolicy {
  rotationInterval: 'weekly' | 'biweekly' | 'monthly';
  primaryCaregiverRespiteDaysPerMonth: number;
  weekendShiftLeader?: string;
  nightShiftArrangement: 'formal_24h_staff' | 'formal_night_nurse' | 'family_rotation' | 'primary_solo';
}

export interface ClinicalCareBlueprint {
  id: string;
  prescribedByDoctor: string;
  prescribedAt: string; // ISO date
  clinicalSummary: string;
  recommendedSupportType: FormalSupportType | 'family_redistribution';
  recommendedShiftWindow: 'targeted_morning' | 'targeted_evening' | 'day_12h' | 'night_12h' | 'live_in_24h' | 'respite_coverage' | 'family_schedule';
  recommendedHoursPerDay: number;
  clinicalPrecautions: string[];
  recommendedAssistiveDevices: AssistiveDeviceInventory;
  recommendedRespiteDaysPerMonth: number;
  status: 'draft_prescribed' | 'adopted_by_family' | 'modified_by_family';
  clinicalReview?: {
    decision: 'issued_by_clinician' | 'family_modified_pending_review' | 'clinician_revised';
    reviewedAt: string;
    reviewedBy: string;
    policyVersion: string;
    decisionSupportStatus: 'requires_data_completion' | 'requires_clinician_review' | 'ready_for_clinician_review';
  };
}

export interface CaregiverAttributes {
  name: string;
  age: number;
  gender: 'female' | 'male' | 'other';
  kinship: 'spouse' | 'son' | 'daughter' | 'daughter_in_law' | 'sibling' | 'grandchild' | 'paid_attendant' | 'other';
  coResidence: 'lives_together' | 'nearby' | 'long_distance';
  education: 'primary' | 'secondary' | 'graduate' | 'post_graduate';
  employment: 'full_time' | 'part_time' | 'homemaker' | 'retired' | 'unemployed';
  functionalCapacity?: 'fully_independent' | 'mild_frailty' | 'moderate_limitations' | 'severe_disability';
  otherFamilyMembersCount?: number;
  secondaryMembers?: SecondaryFamilyMember[];
  emergencyLogistics?: EmergencyLogistics;
  rotationPolicy?: MonthlyRotationPolicy;
  assistiveDevices?: AssistiveDeviceInventory;
  financialStatus?: 'manageable' | 'moderate_strain' | 'severe_toxicity';
  caregiverHealth: {
    hasBackPain: boolean;
    hasHypertension: boolean;
    hasArthritis: boolean;
    hasDiabetes: boolean;
    hasInsomnia: boolean;
  };
  dailyHoursCommitted: number;
  monthlyOutOfPocketBurden: 'manageable' | 'moderate_strain' | 'severe_toxicity';
  formalTrainingReceived: boolean;
  formalSupport?: {
    type: FormalSupportType;
    types?: FormalSupportType[];
    hoursPerDay: number;
    handlesHeavyTransfers: boolean;
    handlesMedicationWoundCare: boolean;
  };
  careBlueprint?: ClinicalCareBlueprint;
  assessmentMetadata?: ClinicalAssessmentMetadata;
  notes?: string;
}

export const CARE_GAP_MODEL_PARAMS = {
  baselineCareDemandHours: BASELINE_CARE_DEMAND_HOURS,
  demandPerAdlDeficitHours: DEMAND_PER_ADL_DEFICIT_HOURS,
  demandPerIadlDeficitHours: DEMAND_PER_IADL_DEFICIT_HOURS,
  cognitiveOverheadHours: COGNITIVE_OVERHEAD_HOURS,
  bedBoundOverheadHours: BED_BOUND_OVERHEAD_HOURS,
  maxFormalAbsorbableFraction: MAX_FORMAL_ABSORBABLE_FRACTION,
  injuryIndexBaseline: INJURY_INDEX_BASELINE,
  formalProductivityFactors: FORMAL_PRODUCTIVITY_FACTORS
} as const;

export interface LawtonIadlProfile {
  telephone: boolean;
  shopping: boolean;
  mealPreparation: boolean;
  housekeeping: boolean;
  laundry: boolean;
  transportation: boolean;
  medicationManagement: boolean;
  finances: boolean;
}

export interface PatientDependenceProfile {
  name: string;
  age: number;
  primaryConditions: string[];
  // Katz ADL: 6 Items (true = Independent / 1 pt, false = Dependent / 0 pt)
  katzAdl: {
    bathing: boolean;
    dressing: boolean;
    toileting: boolean;
    transferring: boolean;
    continence: boolean;
    feeding: boolean;
  };
  // Lawton-Brody IADL: 8 Standard Items (Lawton & Brody 1969)
  lawtonIadl: LawtonIadlProfile;
  cognitiveBehavioralLoad: 'none' | 'mild_forgetfulness' | 'wandering_agitation' | 'severe_sundowning';
  fallHistoryLast6Months: number;
  isBedBound: boolean;
  weightKg?: number;
  heightCm?: number;
  assistiveDevices?: AssistiveDeviceInventory;
  currentMedications?: Array<{ name: string; genericName?: string }>;
  assessmentMetadata?: ClinicalAssessmentMetadata;
}

export interface CareGapEvaluationResult {
  // Algorithm Engine Version for clinical auditability and longitudinal comparison
  engineVersion: string;
  policyVersion: string;
  dataQuality: ClinicalDataQuality;

  // Katz ADL Score (0-6, where 6 is fully independent, 0 is total dependence)
  katzAdlScore: number;
  katzDependenceLevel: 'independent' | 'moderate_impairment' | 'severe_dependence';
  
  // Lawton-Brody IADL Score (0-8)
  lawtonIadlScore: number;

  // Demand vs Capacity in Hours/Day
  patientCareDemandHours: number;
  caregiverSafeCapacityHours: number;
  formalSupportAbsorbedHours: number;
  familySupportAbsorbedHours: number;
  totalAvailableCapacityHours: number; // Derived: caregiverSafeCapacityHours + formalSupportAbsorbedHours + familySupportAbsorbedHours
  netCareGapHours: number; // Max(0, Demand - totalAvailableCapacityHours)
  
  teamAllocations: {
    primaryCaregiverHours: number;
    formalStaffHours: number;
    secondaryFamilyHours: number;
    unmetGapHours: number;
  };

  taskDelegationStatus: {
    transfersCovered: boolean;
    transfersCoveredBy: string[];
    medicationsCovered: boolean;
    medicationsCoveredBy: string[];
    nightCareCovered: boolean;
    nightCareCoveredBy: string[];
    bathingCovered: boolean;
    bathingCoveredBy: string[];
  };

  assistiveDeviceStatus: {
    hasHospitalBed: boolean;
    bedType: AssistiveDeviceInventory['hospitalBed'];
    hasAirWaterMattress: boolean;
    hasWheelchair: boolean;
    hasSuctionApparatus: boolean;
    hasTransferAids: boolean;
    ergonomicInjuryDiscountPercent: number;
  };

  diurnalCoverage: {
    morningCovered: boolean;
    afternoonCovered: boolean;
    eveningCovered: boolean;
    nightCovered: boolean;
    conflicts: DiurnalScheduleConflict[];
  };

  careGapSeverity: 'sustainable' | 'mild_deficit' | 'high_deficit' | 'critical_overload';
  
  // The Diurnal Care Gap Index (0-100 continuous, non-linear saturating score)
  careGapIndex: number;

  // Per-Block Diurnal Demand, Supply, and Gap Breakdown
  blockGaps: Record<
    DiurnalTimeBlock,
    {
      demandHours: number;
      supplyHours: number;
      gapHours: number;
      contributors: string[];
    }
  >;

  // NIOSH RNLE Lifting Index (real ergonomic metric: Actual Load / Recommended Weight Limit)
  liftingIndex: number;
  // Estimated L5/S1 spinal compression force in kN (NIOSH Action Limit: 3.4 kN)
  spinalCompressionKN: number;
  // Estimated daily transfer & manual repositioning events
  dailyTransferCount: number;
  // Estimated nocturnal micro-sleep interruptions per night
  nocturnalSleepInterruptions: number;

  // Standardized Biomechanical Lumbar Strain Index (0–100 score, based on NIOSH lifting criteria)
  caregiverInjuryRiskScore: number;
  caregiverInjuryRiskCategory: 'low' | 'moderate' | 'high' | 'severe';
  caregiverBurnoutRiskLevel: 'low' | 'moderate' | 'high' | 'critical';

  clinicalFindings: string[];
  provenance: {
    careGapModel: ClinicalProvenance;
    medicationScreen: ClinicalProvenance;
  };
  prescriptions: Array<{
    id: string;
    title: string;
    action: string;
    impact: string;
    urgency: 'routine' | 'priority' | 'urgent';
  }>;
  qualityOfCareWarnings: string[];
  evaluatedAt: string;
}

export const DEFAULT_CAREGIVER_ATTRIBUTES: CaregiverAttributes = {
  name: 'Suresh Kumar',
  age: 54,
  gender: 'male',
  kinship: 'son',
  coResidence: 'lives_together',
  education: 'graduate',
  employment: 'full_time',
  caregiverHealth: {
    hasBackPain: true,
    hasHypertension: true,
    hasArthritis: false,
    hasDiabetes: false,
    hasInsomnia: true
  },
  dailyHoursCommitted: 6,
  monthlyOutOfPocketBurden: 'moderate_strain',
  formalTrainingReceived: false,
  formalSupport: {
    type: 'none',
    hoursPerDay: 0,
    handlesHeavyTransfers: false,
    handlesMedicationWoundCare: false
  }
};

export const DEFAULT_PATIENT_PROFILE: PatientDependenceProfile = {
  name: 'Smt. Sarojini Devi',
  age: 81,
  primaryConditions: ['Hypertension', 'Mild Cognitive Decline', 'Severe Osteoarthritis', 'Post-Fall Frailty'],
  katzAdl: {
    bathing: false,
    dressing: false,
    toileting: false,
    transferring: false,
    continence: true,
    feeding: true
  },
  lawtonIadl: {
    telephone: false,
    shopping: false,
    mealPreparation: false,
    housekeeping: false,
    laundry: false,
    transportation: false,
    medicationManagement: false,
    finances: false
  },
  cognitiveBehavioralLoad: 'wandering_agitation',
  fallHistoryLast6Months: 2,
  isBedBound: false,
  weightKg: 62,
  heightCm: 155
};

export interface EngineVitalRecord {
  date: string;
  weight?: string;
  pulse?: string;
  bp?: string;
  systolic?: string;
  diastolic?: string;
  spo2?: string;
  bloodSugar?: string;
  sleep: 'good' | 'average' | 'poor';
}

export interface EngineAppointmentRecord {
  date: string;
  department: string;
  doctor: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

export class CareGapEngine {
  /**
   * @param now Injectable clock. Defaults to the current time; pass a fixed
   *            value in tests and anywhere a stable result identity matters.
   */
  static evaluate(
    caregiver: CaregiverAttributes | null | undefined,
    patient: PatientDependenceProfile | null | undefined,
    now: Date = new Date(),
    vitals: EngineVitalRecord[] = [],
    appointments: EngineAppointmentRecord[] = [],
    medications: Array<{ name: string; genericName?: string }> = []
  ): CareGapEvaluationResult {
    // Every branch below reads these merged locals rather than the raw params.
    // Reading the params directly (as this engine previously did from step 3
    // onward) made the guards inert — evaluate(null, null) still threw.
    const safePatient = patient || DEFAULT_PATIENT_PROFILE;
    const safeCaregiver = caregiver || DEFAULT_CAREGIVER_ATTRIBUTES;
    const dataQuality = assessClinicalDataQuality(safeCaregiver, safePatient, now);

    const safeKatz = { ...DEFAULT_PATIENT_PROFILE.katzAdl, ...(safePatient.katzAdl || {}) };
    const safeIadl: LawtonIadlProfile = { ...DEFAULT_PATIENT_PROFILE.lawtonIadl, ...(safePatient.lawtonIadl || {}) };
    const safeHealth = { ...DEFAULT_CAREGIVER_ATTRIBUTES.caregiverHealth, ...(safeCaregiver.caregiverHealth || {}) };
    const safeDevices: AssistiveDeviceInventory = {
      ...DEFAULT_ASSISTIVE_DEVICES,
      ...(safePatient.assistiveDevices || {})
    };

    const qualityOfCareWarnings: string[] = [];
    const clinicalFindings: string[] = [];
    const prescriptions: CareGapEvaluationResult['prescriptions'] = [];

    // Pharmacotherapy & Medication Acuity Evaluation (MedicationChecker)
    const activeMeds = (safePatient.currentMedications && safePatient.currentMedications.length > 0)
      ? safePatient.currentMedications
      : medications;

    if (activeMeds.length > 0) {
      const regEval = MedicationChecker.evaluateRegimen(activeMeds);
      regEval.warnings.forEach((w) => qualityOfCareWarnings.push(w));
      if (regEval.totalAcbScore >= 3 || regEval.stoppTriggers.length > 0 || regEval.warnings.length > 0) {
        clinicalFindings.push(
          `High-Risk Pharmacotherapy Complexity Detected: Cumulative ACB score (${regEval.totalAcbScore}) / STOPP criteria triggered. Warrants medication reconciliation and professional nursing oversight for drug titration.`
        );
      }
    }

    const conditionContainsToken = (conditionStr: string, token: string): boolean => {
      const normalized = conditionStr.trim();
      const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'i');
      return regex.test(normalized);
    };

    const hasCondition = (...tokens: string[]) => {
      return (safePatient.primaryConditions || []).some((condition) =>
        tokens.some((token) => conditionContainsToken(condition, token))
      );
    };

    if (hasCondition('recurrent', 'infection', 'uti', 'pneumonia', 'urinary tract infection')) {
      qualityOfCareWarnings.push(
        'Recurrent infections detected. Warrants immediate review of hygiene, fluid intake, and catheter/wound care protocols.'
      );
    }

    // Aspiration / Dysphagia / Tracheostomy Risk + Suction Apparatus Evaluation
    // Avoid false positive on isolated arthritic feeding difficulty unless accompanied by swallowing impairment or neurological conditions
    const hasSwallowingRisk = hasCondition('aspiration', 'dysphagia', 'tracheostomy', 'choking', 'swallowing');
    const hasNeuroFeedingDeficit = !safeKatz.feeding && hasCondition('stroke', 'cva', 'parkinson', 'als', 'dementia', 'bulbar', 'neuropathy');

    if (hasSwallowingRisk || hasNeuroFeedingDeficit) {
      if (!safeDevices.suctionApparatus) {
        qualityOfCareWarnings.push(
          'Frequent aspiration risk or dysphagia detected. Warrants speech therapy consultation, strict feeding positioning (90 degrees), and bedside suction equipment.'
        );
      } else {
        clinicalFindings.push(
          'Airway Clearance Protocol Active: Bedside suction apparatus deployed for secretional and aspiration protection.'
        );
      }
    }

    // Bed-bound & Pressure Ulcer Risk + Alternating Mattress Evaluation
    if (hasCondition('bed sore', 'pressure ulcer', 'pressure sore', 'decubitus') || safePatient.isBedBound) {
      if (!safeDevices.airWaterMattress) {
        qualityOfCareWarnings.push(
          'Bed sore presence or high pressure ulcer risk. Warrants 2-hourly turning schedule and specialized alternating water/air ripple mattress.'
        );
      } else {
        clinicalFindings.push(
          'Pressure Injury Protection Active: Alternating air/water ripple mattress in use, significantly reducing tissue ischemia.'
        );
      }
    }

    const bpVitals = (vitals || []).filter((v) => v.bp || (v.systolic && v.diastolic));
    if (bpVitals.length > 0) {
      const sortedBp = [...bpVitals].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const latest = sortedBp[0];
      let systolic = latest.systolic ? parseInt(latest.systolic) : NaN;
      let diastolic = latest.diastolic ? parseInt(latest.diastolic) : NaN;
      const bpStr = latest.bp || (latest.systolic && latest.diastolic ? `${latest.systolic}/${latest.diastolic}` : '');

      if ((isNaN(systolic) || isNaN(diastolic)) && latest.bp) {
        const parts = latest.bp.split('/');
        systolic = parseInt(parts[0]);
        diastolic = parseInt(parts[1]);
      }

      if (!isNaN(systolic) && !isNaN(diastolic)) {
        if (systolic >= 160 || diastolic >= 100) {
          qualityOfCareWarnings.push(
            `Uncontrolled hypertension: Latest recorded BP is high (${bpStr || `${systolic}/${diastolic}`}). Review medication compliance and notify physician.`
          );
        }
      }
    }

    if (hasCondition('diabetes', 'diabetic', 'type 2 diabetes', 'dm')) {
      const bsVitals = (vitals || []).filter((v) => v.bloodSugar);
      if (bsVitals.length === 0) {
        qualityOfCareWarnings.push(
          'Diabetes care monitoring gap: No blood glucose readings logged on the portal despite active diagnosis.'
        );
      } else {
        const sortedBs = [...bsVitals].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const lastLogDate = new Date(sortedBs[0].date).getTime();
        const daysSinceLastLog = (now.getTime() - lastLogDate) / (1000 * 60 * 60 * 24);
        if (daysSinceLastLog > 7) {
          qualityOfCareWarnings.push(
            `Diabetes care monitoring gap: No blood glucose logged in the last ${Math.round(daysSinceLastLog)} days.`
          );
        }
      }
    }

    const missedAppointments = (appointments || []).filter((appt) => {
      return (
        appt.status === 'scheduled' &&
        new Date(appt.date).getTime() < now.getTime() - (24 * 60 * 60 * 1000)
      );
    });
    if (missedAppointments.length > 0) {
      const apptList = missedAppointments
        .map((a) => `${a.department} (${new Date(a.date).toLocaleDateString()})`)
        .join(', ');
      qualityOfCareWarnings.push(
        `Missed hospital visits: Scheduled appointments are overdue and uncompleted: ${apptList}.`
      );
    }

    // 1. Calculate Katz ADL Score (0-6)
    const adlItems = Object.values(safeKatz);
    const katzAdlScore = adlItems.filter(Boolean).length;
    const adlDeficits = 6 - katzAdlScore;

    let katzDependenceLevel: CareGapEvaluationResult['katzDependenceLevel'] = 'independent';
    if (katzAdlScore <= 2) katzDependenceLevel = 'severe_dependence';
    else if (katzAdlScore <= 4) katzDependenceLevel = 'moderate_impairment';

    // 2. Calculate Lawton-Brody 8-Item IADL Score (0-8)
    const lawtonKeys: (keyof LawtonIadlProfile)[] = [
      'telephone',
      'shopping',
      'mealPreparation',
      'housekeeping',
      'laundry',
      'transportation',
      'medicationManagement',
      'finances'
    ];
    const lawtonIadlScore = lawtonKeys.filter((k) => safeIadl[k] === true).length;
    const iadlDeficits = 8 - lawtonIadlScore;

    // 3. Compute Patient Daily Care Demand (Hours/Day)
    let demandHours = CARE_GAP_MODEL_PARAMS.baselineCareDemandHours; // 1.5h baseline

    // Each ADL deficit demands ~1.0 direct physical care hours (bathing, toileting, transferring, feeding)
    demandHours += adlDeficits * CARE_GAP_MODEL_PARAMS.demandPerAdlDeficitHours;

    // Each Lawton-Brody IADL deficit adds ~0.35 hours (cooking, meds, laundry, cleaning, shopping, finances)
    demandHours += iadlDeficits * CARE_GAP_MODEL_PARAMS.demandPerIadlDeficitHours;

    // Behavioral & Cognitive Load Adds Vigilance Hours
    demandHours += CARE_GAP_MODEL_PARAMS.cognitiveOverheadHours[safePatient.cognitiveBehavioralLoad || 'none'] ?? 0;

    // Bed-bound 2-hourly turning and incontinence management
    if (safePatient.isBedBound) {
      // Motorized bed and ripple mattress slightly reduce the manual turning overhead
      const bedTurningHours = safeDevices.hospitalBed === 'motorized_multichannel' && safeDevices.airWaterMattress
        ? BED_BOUND_OVERHEAD_HOURS.withMotorizedBedAndRipple
        : BED_BOUND_OVERHEAD_HOURS.standard;
      demandHours += bedTurningHours;
    }

    const fallCount = Math.max(0, safePatient.fallHistoryLast6Months ?? 0);
    if (fallCount > 0) {
      demandHours += Math.min(
        FALL_RISK_HOURS_MAX,
        FALL_RISK_HOURS_BASE + (fallCount - 1) * FALL_RISK_HOURS_PER_REPEAT
      );
    }

    const patientCareDemandHours = Math.round(demandHours * 10) / 10;

    // 4. Compute Formal / Ancillary Support Hours Absorbed
    const selectedTypes = resolveSupportTypes(safeCaregiver.formalSupport);
    let rawAbsorbed = 0;

    if (selectedTypes.length > 0) {
      const configuredHours = safeCaregiver.formalSupport?.hoursPerDay;
      const hasConfiguredHours = typeof configuredHours === 'number' && !isNaN(configuredHours);

      const contributions = selectedTypes.map((t) => {
        const spec = CARE_GAP_MODEL_PARAMS.formalProductivityFactors[t] || { nominalHours: 12, productivityFactor: 10.0 / 12 };
        const shiftHours = hasConfiguredHours
          ? Math.min(spec.nominalHours, Math.max(0, configuredHours))
          : spec.nominalHours;
        return shiftHours * spec.productivityFactor;
      }).sort((a, b) => b - a);

      for (let i = 0; i < contributions.length; i++) {
        rawAbsorbed += contributions[i] * (i === 0 ? 1.0 : i === 1 ? 0.5 : 0.25);
      }
    }

    const MAX_ABSORBABLE_FRACTION = CARE_GAP_MODEL_PARAMS.maxFormalAbsorbableFraction;
    const formalSupportAbsorbedHours =
      Math.round(Math.min(patientCareDemandHours * MAX_ABSORBABLE_FRACTION, rawAbsorbed) * 10) / 10;

    // 4b. Secondary Family Members Support Network & Task Absorption
    const secondaryMembers = safeCaregiver.secondaryMembers || [];
    let rawFamilyHours = 0;
    for (const member of secondaryMembers) {
      rawFamilyHours += Math.max(0, member.hoursPerDay || 0);
    }
    if (secondaryMembers.length === 0 && (safeCaregiver.otherFamilyMembersCount ?? 0) > 0) {
      rawFamilyHours = Math.min(2.5, (safeCaregiver.otherFamilyMembersCount ?? 0) * 1.0);
    }

    const remainingDemandAfterStaff = Math.max(0, patientCareDemandHours - formalSupportAbsorbedHours);
    const familySupportAbsorbedHours = Math.round(Math.min(remainingDemandAfterStaff, rawFamilyHours) * 10) / 10;

    // Task Delegation Relief Analysis across Staff and Capable Family
    const transfersCoveredByStaff = selectedTypes.some(performsHeavyTransfers);
    const transfersCoveredByFamilyMembers = secondaryMembers
      .filter((m) => !m.hasPhysicalLimitation && m.age < 60 && m.assignedTasks.includes('heavy_transfers'))
      .map((m) => m.name || m.relationship.replace('_', ' '));
    const isTransfersRelieved = transfersCoveredByStaff || transfersCoveredByFamilyMembers.length > 0;

    const bathingCoveredByStaff = selectedTypes.some((t) => t === 'paid_attendant_12h' || t === 'paid_attendant_24h' || t === 'trained_nurse_12h' || t === 'trained_nurse_24h');
    const bathingCoveredByFamilyMembers = secondaryMembers
      .filter((m) => !m.hasPhysicalLimitation && m.assignedTasks.includes('bathing'))
      .map((m) => m.name || m.relationship.replace('_', ' '));
    const isBathingRelieved = bathingCoveredByStaff || bathingCoveredByFamilyMembers.length > 0;

    const nightCareCoveredByStaff = selectedTypes.some((t) => t.includes('24h'));
    const nightCareCoveredByFamilyMembers = secondaryMembers
      .filter((m) => m.assignedTasks.includes('night_care'))
      .map((m) => m.name || m.relationship.replace('_', ' '));
    const isNightCareRelieved = nightCareCoveredByStaff || nightCareCoveredByFamilyMembers.length > 0;

    const medsCoveredByStaff = (safeCaregiver.formalSupport?.handlesMedicationWoundCare ?? false) || selectedTypes.some((t) => t.includes('nurse'));
    const medsCoveredByFamilyMembers = secondaryMembers
      .filter((m) => m.assignedTasks.includes('medications'))
      .map((m) => m.name || m.relationship.replace('_', ' '));
    const isMedsRelieved = medsCoveredByStaff || medsCoveredByFamilyMembers.length > 0;

    // Diurnal Time-Block Coverage & Schedule Conflict Detection
    let morningCovered = selectedTypes.some((t) => t.includes('12h') || t.includes('24h'));
    let afternoonCovered = selectedTypes.some((t) => t.includes('12h') || t.includes('24h') || t === 'medical_assistant');
    let eveningCovered = selectedTypes.some((t) => t.includes('12h') || t.includes('24h'));
    let nightCovered = selectedTypes.some((t) => t.includes('24h'));

    const diurnalConflicts: DiurnalScheduleConflict[] = [];

    for (const member of secondaryMembers) {
      const availableBlocks = member.availableTimeBlocks && member.availableTimeBlocks.length > 0
        ? member.availableTimeBlocks
        : ['morning_rush', 'evening'];

      if (availableBlocks.includes('morning_rush')) morningCovered = true;
      if (availableBlocks.includes('afternoon')) afternoonCovered = true;
      if (availableBlocks.includes('evening')) eveningCovered = true;
      if (availableBlocks.includes('night_watch')) nightCovered = true;

      const scheduleStr = (member.workCommitmentSchedule || member.occupation || '').toLowerCase();
      const isDaytimeJob = scheduleStr.includes('full') || scheduleStr.includes('9am') || scheduleStr.includes('9-') || scheduleStr.includes('10am') || scheduleStr.includes('10-');

      if (isDaytimeJob) {
        if (member.assignedTasks.includes('bathing') && !availableBlocks.includes('morning_rush')) {
          diurnalConflicts.push({
            memberId: member.id,
            memberName: member.name || member.relationship,
            conflictingTask: 'bathing',
            taskWindow: 'morning_rush',
            workSchedule: member.workCommitmentSchedule || 'Standard Working Hours',
            recommendation: 'Morning sponge bath clashes with work schedule. Reassign to paid attendant or early-morning helper.'
          });
        }
        if (member.assignedTasks.includes('heavy_transfers') && !availableBlocks.includes('morning_rush') && !availableBlocks.includes('evening')) {
          diurnalConflicts.push({
            memberId: member.id,
            memberName: member.name || member.relationship,
            conflictingTask: 'heavy_transfers',
            taskWindow: 'morning_rush',
            workSchedule: member.workCommitmentSchedule || 'Standard Working Hours',
            recommendation: 'Daytime work hours prevent morning transfer assistance. Reassign morning transfer to on-site caregiver.'
          });
        }
      }
    }

    // Residual Patient Demand after Formal Staff & Family absorption
    const residualDemandOnPrimary = Math.max(0, patientCareDemandHours - formalSupportAbsorbedHours - familySupportAbsorbedHours);

    // 5. Compute Primary Caregiver Safe Daily Capacity (Hours/Day)
    let capacityHours = safeCaregiver.dailyHoursCommitted;

    if (safeCaregiver.employment === 'full_time') {
      capacityHours = Math.min(capacityHours, 5.0);
    } else if (safeCaregiver.employment === 'part_time') {
      capacityHours = Math.min(capacityHours, 7.0);
    }

    // Caregiver Functional Capacity Reductions
    const funcCap = safeCaregiver.functionalCapacity || 'fully_independent';
    let funcDeduction = 0;
    if (funcCap === 'mild_frailty') funcDeduction = 1.0;
    else if (funcCap === 'moderate_limitations') funcDeduction = 2.5;
    else if (funcCap === 'severe_disability') funcDeduction = 4.5;

    // Kinship / Senior Dyad Strain
    let kinshipDeduction = 0;
    if (safeCaregiver.kinship === 'spouse' && safeCaregiver.age >= 65) {
      // Kinship relief driven strictly off explicit familySupportAbsorbedHours (or formal support)
      kinshipDeduction = (familySupportAbsorbedHours >= 2.0 || formalSupportAbsorbedHours >= 4.0) ? 0.5 : 1.0;
    }

    // Caregiver's Own Health Reductions with task relief credits
    let healthDeduction = 0;
    if (safeHealth.hasBackPain) healthDeduction += isTransfersRelieved ? 0.5 : 1.5;
    if (safeHealth.hasArthritis) healthDeduction += isBathingRelieved ? 0.3 : 1.0;
    if (safeHealth.hasInsomnia) healthDeduction += isNightCareRelieved ? 0.3 : 1.0;
    if (safeCaregiver.age >= 65) healthDeduction += 1.5;

    const caregiverSafeCapacityHours = Math.max(
      1.0,
      Math.round((capacityHours - funcDeduction - kinshipDeduction - healthDeduction) * 10) / 10
    );

    // 6. Net Care Gap (Deficit in Hours/Day for the Primary Caregiver)
    const totalAvailableCapacityHours = Math.round(
      (caregiverSafeCapacityHours + formalSupportAbsorbedHours + familySupportAbsorbedHours) * 10
    ) / 10;
    const netCareGapHours = Math.max(0, Math.round((patientCareDemandHours - totalAvailableCapacityHours) * 10) / 10);

    // 6b. Diurnal Per-Block Demand & Supply Distribution
    const blockDemands: Record<DiurnalTimeBlock, number> = {
      morning_rush: 0.5, // Baseline supervision split
      afternoon: 0.5,
      evening: 0.5,
      night_watch: 0
    };

    // ADLs
    if (!safeKatz.bathing) blockDemands.morning_rush += 1.0;
    if (!safeKatz.transferring) {
      blockDemands.morning_rush += 0.5;
      blockDemands.afternoon += 0.2;
      blockDemands.evening += 0.3;
    }
    if (!safeKatz.dressing) {
      blockDemands.morning_rush += 0.5;
      blockDemands.evening += 0.2;
    }
    if (!safeKatz.toileting) {
      blockDemands.morning_rush += 0.3;
      blockDemands.afternoon += 0.2;
      blockDemands.evening += 0.2;
      blockDemands.night_watch += 0.3;
    }
    if (!safeKatz.continence) {
      blockDemands.morning_rush += 0.2;
      blockDemands.afternoon += 0.2;
      blockDemands.evening += 0.2;
      blockDemands.night_watch += 0.2;
    }
    if (!safeKatz.feeding) {
      blockDemands.morning_rush += 0.4;
      blockDemands.afternoon += 0.4;
      blockDemands.evening += 0.4;
    }

    // IADLs (8 items)
    if (!safeIadl.mealPreparation) {
      blockDemands.morning_rush += 0.15;
      blockDemands.afternoon += 0.1;
      blockDemands.evening += 0.1;
    }
    if (!safeIadl.medicationManagement) {
      blockDemands.morning_rush += 0.15;
      blockDemands.afternoon += 0.05;
      blockDemands.evening += 0.15;
    }
    if (!safeIadl.housekeeping) {
      blockDemands.morning_rush += 0.15;
      blockDemands.afternoon += 0.2;
    }
    if (!safeIadl.laundry) {
      blockDemands.morning_rush += 0.15;
      blockDemands.afternoon += 0.2;
    }
    if (!safeIadl.shopping) blockDemands.afternoon += 0.35;
    if (!safeIadl.transportation) blockDemands.afternoon += 0.35;
    if (!safeIadl.finances) blockDemands.afternoon += 0.35;
    if (!safeIadl.telephone) {
      blockDemands.morning_rush += 0.1;
      blockDemands.afternoon += 0.15;
      blockDemands.evening += 0.1;
    }

    // Cognitive / Behavioral Load
    if (safePatient.cognitiveBehavioralLoad === 'mild_forgetfulness') {
      blockDemands.morning_rush += 0.35;
      blockDemands.afternoon += 0.35;
      blockDemands.evening += 0.3;
    } else if (safePatient.cognitiveBehavioralLoad === 'wandering_agitation') {
      blockDemands.morning_rush += 0.7;
      blockDemands.afternoon += 0.8;
      blockDemands.evening += 0.7;
      blockDemands.night_watch += 0.3;
    } else if (safePatient.cognitiveBehavioralLoad === 'severe_sundowning') {
      blockDemands.afternoon += 0.5;
      blockDemands.evening += 1.0;
      blockDemands.night_watch += 2.5;
    }

    // Bed-bound repositioning
    if (safePatient.isBedBound) {
      const turning = safeDevices.hospitalBed === 'motorized_multichannel' && safeDevices.airWaterMattress
        ? BED_BOUND_OVERHEAD_HOURS.withMotorizedBedAndRipple
        : BED_BOUND_OVERHEAD_HOURS.standard;
      const ratio = turning / 2.0;
      blockDemands.morning_rush += 0.4 * ratio;
      blockDemands.afternoon += 0.3 * ratio;
      blockDemands.evening += 0.3 * ratio;
      blockDemands.night_watch += 1.0 * ratio;
    }

    // Fall risk
    if (fallCount > 0) {
      const fHours = Math.min(FALL_RISK_HOURS_MAX, FALL_RISK_HOURS_BASE + (fallCount - 1) * FALL_RISK_HOURS_PER_REPEAT);
      blockDemands.morning_rush += fHours * 0.4;
      blockDemands.afternoon += fHours * 0.3;
      blockDemands.evening += fHours * 0.3;
    }

    // Normalize block demands to align exactly with patientCareDemandHours
    const rawTotalDemand = blockDemands.morning_rush + blockDemands.afternoon + blockDemands.evening + blockDemands.night_watch;
    if (rawTotalDemand > 0) {
      const normRatio = patientCareDemandHours / rawTotalDemand;
      blockDemands.morning_rush = Math.round(blockDemands.morning_rush * normRatio * 10) / 10;
      blockDemands.afternoon = Math.round(blockDemands.afternoon * normRatio * 10) / 10;
      blockDemands.evening = Math.round(blockDemands.evening * normRatio * 10) / 10;
      blockDemands.night_watch = Math.round(
        (patientCareDemandHours - blockDemands.morning_rush - blockDemands.afternoon - blockDemands.evening) * 10
      ) / 10;
    }

    // Distribute Supply across Blocks
    const blockSupplies: Record<DiurnalTimeBlock, { hours: number; contributors: string[] }> = {
      morning_rush: { hours: 0, contributors: [] },
      afternoon: { hours: 0, contributors: [] },
      evening: { hours: 0, contributors: [] },
      night_watch: { hours: 0, contributors: [] }
    };

    // Formal Staff Supply
    if (formalSupportAbsorbedHours > 0) {
      if (safeCaregiver.rotationPolicy?.nightShiftArrangement === 'formal_night_nurse') {
        const nightPortion = Math.min(blockDemands.night_watch, formalSupportAbsorbedHours * 0.75);
        const remaining = formalSupportAbsorbedHours - nightPortion;
        blockSupplies.night_watch.hours += nightPortion;
        blockSupplies.night_watch.contributors.push('Formal Night Staff');
        blockSupplies.evening.hours += remaining;
        blockSupplies.evening.contributors.push('Formal Night Staff');
      } else if (selectedTypes.some((t) => t.includes('24h'))) {
        const perBlock = formalSupportAbsorbedHours / 4;
        (['morning_rush', 'afternoon', 'evening', 'night_watch'] as DiurnalTimeBlock[]).forEach((b) => {
          blockSupplies[b].hours += perBlock;
          blockSupplies[b].contributors.push('Formal 24h Staff');
        });
      } else if (selectedTypes.some((t) => t.includes('12h') || t === 'multi_family_rotation')) {
        const perBlock = formalSupportAbsorbedHours / 3;
        (['morning_rush', 'afternoon', 'evening'] as DiurnalTimeBlock[]).forEach((b) => {
          blockSupplies[b].hours += perBlock;
          blockSupplies[b].contributors.push('Formal Day Staff');
        });
      } else if (selectedTypes.some((t) => t === 'medical_assistant')) {
        const perBlock = formalSupportAbsorbedHours / 2;
        (['morning_rush', 'afternoon'] as DiurnalTimeBlock[]).forEach((b) => {
          blockSupplies[b].hours += perBlock;
          blockSupplies[b].contributors.push('Medical Assistant');
        });
      }
    }

    // Secondary Family Supply
    for (const member of secondaryMembers) {
      const mHours = Math.max(0, member.hoursPerDay || 0);
      if (mHours > 0) {
        const blocks = member.availableTimeBlocks && member.availableTimeBlocks.length > 0
          ? member.availableTimeBlocks
          : (['morning_rush', 'evening'] as DiurnalTimeBlock[]);
        const perBlock = Math.min(mHours, familySupportAbsorbedHours) / blocks.length;
        blocks.forEach((b) => {
          blockSupplies[b].hours += perBlock;
          blockSupplies[b].contributors.push(`${member.name || member.relationship} (${mHours}h)`);
        });
      }
    }
    if (secondaryMembers.length === 0 && (safeCaregiver.otherFamilyMembersCount ?? 0) > 0 && familySupportAbsorbedHours > 0) {
      const perBlock = familySupportAbsorbedHours / 2;
      blockSupplies.morning_rush.hours += perBlock;
      blockSupplies.morning_rush.contributors.push('Family Network');
      blockSupplies.evening.hours += perBlock;
      blockSupplies.evening.contributors.push('Family Network');
    }

    // Primary Caregiver Safe Capacity Supply
    if (caregiverSafeCapacityHours > 0) {
      let primaryBlocks: DiurnalTimeBlock[] = ['morning_rush', 'afternoon', 'evening', 'night_watch'];
      if (safeCaregiver.employment === 'full_time') {
        primaryBlocks = ['morning_rush', 'evening', 'night_watch'];
      }
      const primaryPerBlock = caregiverSafeCapacityHours / primaryBlocks.length;
      primaryBlocks.forEach((b) => {
        blockSupplies[b].hours += primaryPerBlock;
        blockSupplies[b].contributors.push('Primary Caregiver');
      });
    }

    // Calculate Per-Block Gaps: gap_b = max(0, demand_b - supply_b)
    const blockGaps: Record<
      DiurnalTimeBlock,
      { demandHours: number; supplyHours: number; gapHours: number; contributors: string[] }
    > = {
      morning_rush: {
        demandHours: Math.round(blockDemands.morning_rush * 10) / 10,
        supplyHours: Math.round(blockSupplies.morning_rush.hours * 10) / 10,
        gapHours: Math.max(0, Math.round((blockDemands.morning_rush - blockSupplies.morning_rush.hours) * 10) / 10),
        contributors: blockSupplies.morning_rush.contributors
      },
      afternoon: {
        demandHours: Math.round(blockDemands.afternoon * 10) / 10,
        supplyHours: Math.round(blockSupplies.afternoon.hours * 10) / 10,
        gapHours: Math.max(0, Math.round((blockDemands.afternoon - blockSupplies.afternoon.hours) * 10) / 10),
        contributors: blockSupplies.afternoon.contributors
      },
      evening: {
        demandHours: Math.round(blockDemands.evening * 10) / 10,
        supplyHours: Math.round(blockSupplies.evening.hours * 10) / 10,
        gapHours: Math.max(0, Math.round((blockDemands.evening - blockSupplies.evening.hours) * 10) / 10),
        contributors: blockSupplies.evening.contributors
      },
      night_watch: {
        demandHours: Math.round(blockDemands.night_watch * 10) / 10,
        supplyHours: Math.round(blockSupplies.night_watch.hours * 10) / 10,
        gapHours: Math.max(0, Math.round((blockDemands.night_watch - blockSupplies.night_watch.hours) * 10) / 10),
        contributors: blockSupplies.night_watch.contributors
      }
    };

    // Calculate The Diurnal Care Gap Index (0-100 non-linear saturating score)
    let weightedDeficit = 0;
    (['morning_rush', 'afternoon', 'evening', 'night_watch'] as DiurnalTimeBlock[]).forEach((b) => {
      const g = blockGaps[b].gapHours;
      if (g > 0) {
        const crit = DIURNAL_BLOCK_CRITICALITY[b] ?? 1.0;
        weightedDeficit += crit * Math.pow(g, DIURNAL_CONCENTRATION_EXPONENT);
      }
    });

    const careGapIndex = Math.min(
      100,
      Math.max(
        0,
        Math.round(100 * (1 - Math.exp(-weightedDeficit / DIURNAL_INDEX_SATURATION_SCALE)))
      )
    );

    const primaryAbsorbedHours = Math.min(caregiverSafeCapacityHours, residualDemandOnPrimary);
    const unmetGapHours = netCareGapHours;

    const teamAllocations = {
      primaryCaregiverHours: Math.round(primaryAbsorbedHours * 10) / 10,
      formalStaffHours: formalSupportAbsorbedHours,
      secondaryFamilyHours: familySupportAbsorbedHours,
      unmetGapHours
    };

    const taskDelegationStatus = {
      transfersCovered: isTransfersRelieved,
      transfersCoveredBy: [
        ...(transfersCoveredByStaff ? ['Formal Attendant / Nurse'] : []),
        ...transfersCoveredByFamilyMembers
      ],
      medicationsCovered: isMedsRelieved,
      medicationsCoveredBy: [
        ...(medsCoveredByStaff ? ['Clinical Nurse'] : []),
        ...medsCoveredByFamilyMembers
      ],
      nightCareCovered: isNightCareRelieved,
      nightCareCoveredBy: [
        ...(nightCareCoveredByStaff ? ['24h Night Staff'] : []),
        ...nightCareCoveredByFamilyMembers
      ],
      bathingCovered: isBathingRelieved,
      bathingCoveredBy: [
        ...(bathingCoveredByStaff ? ['Attendant / Nurse'] : []),
        ...bathingCoveredByFamilyMembers
      ]
    };

    // 7. Care Gap Severity Classification
    let careGapSeverity: CareGapEvaluationResult['careGapSeverity'] = 'sustainable';
    if (netCareGapHours > GAP_CRITICAL_THRESHOLD) careGapSeverity = 'critical_overload';
    else if (netCareGapHours > GAP_HIGH_THRESHOLD) careGapSeverity = 'high_deficit';
    else if (netCareGapHours > 0.0) careGapSeverity = 'mild_deficit';

    // 8. Event-Based Biomechanical Load & Ergonomic Constraint Modeling (NIOSH RNLE / MAPO)
    const biomechanicalAssessment = calculateBiomechanicalLoad({
      caregiver: safeCaregiver,
      patient: safePatient,
      isTransfersRelievedByStaffOrFamily: isTransfersRelieved,
      isBathingRelievedByStaffOrFamily: isBathingRelieved,
      isNightCareRelievedByStaffOrFamily: isNightCareRelieved,
      netCareGapHours,
      blockDemands
    });

    const {
      liftingIndex,
      spinalCompressionKN,
      dailyTransferCount,
      nocturnalSleepInterruptions,
      caregiverInjuryRiskScore,
      caregiverInjuryRiskCategory,
      ergonomicMechanisms
    } = biomechanicalAssessment;

    let ergonomicDiscount = 0;
    if (safeDevices.hospitalBed === 'motorized_multichannel') ergonomicDiscount += ERGONOMIC_DEVICE_DISCOUNTS.motorizedHospitalBed;
    else if (safeDevices.hospitalBed === 'manual_adjustable') ergonomicDiscount += ERGONOMIC_DEVICE_DISCOUNTS.manualAdjustableBed;
    if (safeDevices.transferAids) ergonomicDiscount += ERGONOMIC_DEVICE_DISCOUNTS.transferAidsGaitBeltDisc;
    if (safeDevices.wheelchair) ergonomicDiscount += ERGONOMIC_DEVICE_DISCOUNTS.wheelchair;
    if (safeDevices.airWaterMattress) ergonomicDiscount += ERGONOMIC_DEVICE_DISCOUNTS.airWaterMattress;
    ergonomicDiscount = Math.min(ERGONOMIC_DEVICE_DISCOUNTS.maxDiscountPercent, ergonomicDiscount);

    if (ergonomicMechanisms.length > 0) {
      clinicalFindings.push(`Ergonomic Mechanism Active: ${ergonomicMechanisms.join(' ')}`);
    }

    const financialMultiplier =
      safeCaregiver.monthlyOutOfPocketBurden === 'severe_toxicity' || safeCaregiver.financialStatus === 'severe_toxicity'
        ? FINANCIAL_STRAIN_MULTIPLIERS.severe_toxicity
        : safeCaregiver.monthlyOutOfPocketBurden === 'moderate_strain' || safeCaregiver.financialStatus === 'moderate_strain'
        ? FINANCIAL_STRAIN_MULTIPLIERS.moderate_strain
        : FINANCIAL_STRAIN_MULTIPLIERS.manageable;

    const effectiveGap = netCareGapHours * financialMultiplier;
    const effectiveInjury = caregiverInjuryRiskScore * financialMultiplier;

    let caregiverBurnoutRiskLevel: CareGapEvaluationResult['caregiverBurnoutRiskLevel'] = 'low';
    if (effectiveGap > GAP_CRITICAL_THRESHOLD || effectiveInjury >= INJURY_CRITICAL_THRESHOLD) {
      caregiverBurnoutRiskLevel = 'critical';
    } else if (effectiveGap > GAP_HIGH_THRESHOLD || effectiveInjury >= INJURY_HIGH_THRESHOLD) {
      caregiverBurnoutRiskLevel = 'high';
    } else if (netCareGapHours > 0.0 || caregiverInjuryRiskScore > INJURY_MODERATE_THRESHOLD) {
      caregiverBurnoutRiskLevel = 'moderate';
    }

    // 9. Clinical Findings & Prescriptions
    if (selectedTypes.length > 0) {
      const typeLabels: { [k in FormalSupportType]: string } = {
        trained_nurse_24h: '24h Certified Nurse',
        trained_nurse_12h: '12h Certified Nurse',
        medical_assistant: 'Medical Assistant / Physio Aide',
        paid_attendant_24h: '24h Paid Attendant',
        paid_attendant_12h: '12h Paid Attendant',
        multi_family_rotation: 'Multi-Family Rotation',
        none: 'Solo Family Care'
      };

      const teamList = selectedTypes.map((t) => typeLabels[t] || t).join(' + ');

      clinicalFindings.push(
        `Multi-Disciplinary Caregiver Team Active (${teamList}): absorbs an estimated ${formalSupportAbsorbedHours} hrs/day of the patient's hands-on care demand. Supervision, care coordination and emotional load remain with the primary caregiver and are not offset by formal support.`
      );
    }

    if (netCareGapHours > 0) {
      clinicalFindings.push(
        `Patient requires ${patientCareDemandHours} hrs/day of direct assistance (Katz ADL: ${katzAdlScore}/6). Net unmet care gap after formal support and caregiver capacity is ${netCareGapHours} hrs/day.`
      );
      const prescribedHours = Math.ceil(netCareGapHours + 0.5);
      prescriptions.push({
        id: 'rx_staffing_respite_prescription',
        title: 'Draft Respite & Staffing Option for Clinician Review',
        action: `Consider ${prescribedHours} hours/day of trained attendant or caregiver support to address the estimated unmet care gap of ${netCareGapHours} hours/day. Focus this shift on high-physical-load care activities such as transfers, sponge bathing, or toilet hygiene.`,
        impact: 'May reduce unmet care demand and caregiver strain; final staffing should be individualized by the clinical team and family.',
        urgency: netCareGapHours >= 4.0 ? 'urgent' : netCareGapHours >= 2.0 ? 'priority' : 'routine'
      });
    } else {
      const totalCoveredCapacity = Math.round(
        (caregiverSafeCapacityHours + formalSupportAbsorbedHours + familySupportAbsorbedHours) * 10
      ) / 10;
      clinicalFindings.push(
        `Combined family capacity and formal care support (${totalCoveredCapacity} hrs/day) successfully covers patient care demand (${patientCareDemandHours} hrs/day).`
      );
    }

    // Assistive Equipment Prescriptions
    if (safePatient.isBedBound && !safeDevices.airWaterMattress) {
      prescriptions.push({
        id: 'rx_air_water_mattress',
        title: 'Pressure-Redistribution Surface Review',
        action: 'Discuss a pressure-redistributing mattress or overlay with the clinician or wound-care nurse, alongside an individualized repositioning schedule.',
        impact: 'May reduce pressure-injury risk when combined with skin checks, moisture control, nutrition, and appropriate repositioning.',
        urgency: 'urgent'
      });
    }

    if (safeHealth.hasBackPain && !safeKatz.transferring && !isTransfersRelieved) {
      clinicalFindings.push(
        'High musculoskeletal injury risk: Caregiver has pre-existing back pain while patient is dependent in bed-to-chair transfers.'
      );
    }

    if (!safeKatz.transferring && (!safeDevices.transferAids || (safeHealth.hasBackPain && !isTransfersRelieved))) {
      prescriptions.push({
        id: 'rx_transfer_biomechanics',
        title: 'Transfer Assistive Equipment Review',
        action: 'Review transfer technique with a physiotherapist or trained nurse and consider a gait belt, slide sheet, or pivot aid if appropriate.',
        impact: 'May reduce manual-handling load when the device is matched to patient ability and caregiver training.',
        urgency: safeHealth.hasBackPain ? 'urgent' : 'priority'
      });
    }

    if (safePatient.isBedBound && safeDevices.hospitalBed === 'none') {
      prescriptions.push({
        id: 'rx_hospital_bed',
        title: 'Adjustable Bed / Bed-Height Review',
        action: 'Consider a height-adjustable bed or safe bed-height modification after reviewing fall risk, entrapment risk, and caregiver handling needs.',
        impact: 'Can reduce stooping during bedside care when used safely and matched to the home environment.',
        urgency: 'priority'
      });
    }

    if (netCareGapHours >= 3.0 && selectedTypes.length === 0) {
      prescriptions.push({
        id: 'rx_formal_attendant',
        title: 'Formal Respite / Trained Attendant Option',
        action: 'Consider a trained daytime attendant for morning sponge bath, toileting, and transfer assistance, or explore local senior daycare/respite services.',
        impact: 'Directly absorbs the daily care deficit, reducing the risk of acute caregiver physical collapse.',
        urgency: 'urgent'
      });
    }

    const hasLiveInStaff = selectedTypes.some(
      (t) => t === 'paid_attendant_24h' || t === 'trained_nurse_24h'
    );
    if (safeCaregiver.monthlyOutOfPocketBurden === 'severe_toxicity' && hasLiveInStaff) {
      prescriptions.push({
        id: 'rx_financial_counseling',
        title: 'Geriatric Financial Optimization & Govt Senior Schemes',
        action: 'Explore Ayushman Bharat PM-JAY Senior Citizen cover (₹5 Lakhs/yr top-up for 70+) and state medical subsidies to alleviate 24/7 nursing financial strain.',
        impact: 'Reduces catastrophic out-of-pocket health expenditure.',
        urgency: 'priority'
      });
    }

    if (safeCaregiver.employment === 'full_time' && netCareGapHours > 1.5) {
      prescriptions.push({
        id: 'rx_care_circle_redistribution',
        title: 'Care Circle Family Task Delegation',
        action: 'Redistribute evening medication dispensing, grocery runs, and clinic logistics to secondary Care Circle members.',
        impact: 'Protects evening recovery sleep and reduces dual-role employment conflict.',
        urgency: 'priority'
      });
    }

    if (!safeCaregiver.formalTrainingReceived) {
      prescriptions.push({
        id: 'rx_practical_nursing_training',
        title: 'Geriatric Home Nursing & Safe Positioning Modules',
        action: 'Complete Sanjeevani practical nursing modules on fall prevention, bed-bound care, and pressure sore staging.',
        impact: 'May improve care consistency and earlier recognition of avoidable complications.',
        urgency: 'routine'
      });
    }

    if (dataQuality.status === 'requires_data_completion') {
      qualityOfCareWarnings.push(
        `Decision-support output is incomplete until these inputs are documented: ${dataQuality.missingFields.join(', ')}.`
      );
    }
    dataQuality.limitations.forEach((limitation) => qualityOfCareWarnings.push(`Decision-support limitation: ${limitation}`));

    return {
      engineVersion: CARE_GAP_ENGINE_VERSION,
      policyVersion: CLINICAL_POLICY.version,
      dataQuality,
      katzAdlScore,
      katzDependenceLevel,
      lawtonIadlScore,
      patientCareDemandHours,
      caregiverSafeCapacityHours,
      formalSupportAbsorbedHours,
      familySupportAbsorbedHours,
      totalAvailableCapacityHours,
      netCareGapHours,
      teamAllocations,
      taskDelegationStatus,
      assistiveDeviceStatus: {
        hasHospitalBed: safeDevices.hospitalBed !== 'none',
        bedType: safeDevices.hospitalBed,
        hasAirWaterMattress: safeDevices.airWaterMattress,
        hasWheelchair: safeDevices.wheelchair,
        hasSuctionApparatus: safeDevices.suctionApparatus,
        hasTransferAids: safeDevices.transferAids,
        ergonomicInjuryDiscountPercent: ergonomicDiscount
      },
      diurnalCoverage: {
        morningCovered,
        afternoonCovered,
        eveningCovered,
        nightCovered,
        conflicts: diurnalConflicts
      },
      careGapSeverity,
      careGapIndex,
      blockGaps,
      liftingIndex,
      spinalCompressionKN,
      dailyTransferCount,
      nocturnalSleepInterruptions,
      caregiverInjuryRiskScore,
      caregiverInjuryRiskCategory,
      caregiverBurnoutRiskLevel,
      clinicalFindings,
      provenance: {
        careGapModel: CLINICAL_PROVENANCE.careGapHeuristic,
        medicationScreen: CLINICAL_PROVENANCE.beersStoppScreen
      },
      prescriptions,
      qualityOfCareWarnings,
      evaluatedAt: now.toISOString()
    };
  }
}

import { ShiftAllocator } from './shift-allocator';

export * from './shift-allocator';

/**
 * Generates an instant, highly readable, formatted WhatsApp Care Digest
 * for sharing with family members and attendants on the Care Circle group.
 */
export function generateWhatsAppCareDigest(
  caregiver: CaregiverAttributes,
  patient: PatientDependenceProfile,
  evaluation: CareGapEvaluationResult
): string {
  return ShiftAllocator.generateWhatsAppCareDigest(caregiver, patient, evaluation);
}

/**
 * Generates an RFC 5545 compliant iCalendar (.ics) string
 * for synchronizing respite days, weekend shifts, and emergency readiness
 * with Google Calendar / Apple Calendar.
 */
export function generateCareRosterIcs(
  caregiver: CaregiverAttributes,
  patient: PatientDependenceProfile,
  evaluation: CareGapEvaluationResult
): string {
  return ShiftAllocator.generateCareRosterIcs(caregiver, patient, evaluation);
}
