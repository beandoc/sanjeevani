/**
 * Sanjeevani Caregiver Dyad & Care Gap Estimation Engine
 * Quantifies the mismatch between patient care demand (Katz ADL / Lawton IADL / Multimorbidity)
 * and caregiver physical/temporal capacity (Age, Health, Employment, Kinship, Formal Support Infrastructure).
 */

import { performsHeavyTransfers, resolveSupportTypes } from './formal-support';

export type FormalSupportType =
  | 'none'
  | 'paid_attendant_12h'
  | 'paid_attendant_24h'
  | 'trained_nurse_12h'
  | 'trained_nurse_24h'
  | 'medical_assistant'
  | 'multi_family_rotation';

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
  nightShiftArrangement: 'formal_24h_staff' | 'family_rotation' | 'primary_solo';
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
  notes?: string;
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
  // Lawton IADL: 5 Core Home Items
  lawtonIadl: {
    medicationManagement: boolean;
    finances: boolean;
    mealPreparation: boolean;
    housekeeping: boolean;
    transportation: boolean;
  };
  cognitiveBehavioralLoad: 'none' | 'mild_forgetfulness' | 'wandering_agitation' | 'severe_sundowning';
  fallHistoryLast6Months: number;
  isBedBound: boolean;
  weightKg?: number;
  heightCm?: number;
  assistiveDevices?: AssistiveDeviceInventory;
}

export interface CareGapEvaluationResult {
  // Katz ADL Score (0-6, where 6 is fully independent, 0 is total dependence)
  katzAdlScore: number;
  katzDependenceLevel: 'independent' | 'moderate_impairment' | 'severe_dependence';
  
  // Lawton IADL Score (0-5)
  lawtonIadlScore: number;

  // Demand vs Capacity in Hours/Day
  patientCareDemandHours: number;
  caregiverSafeCapacityHours: number;
  formalSupportAbsorbedHours: number;
  familySupportAbsorbedHours: number;
  netCareGapHours: number; // Max(0, Demand - (Safe Capacity + Formal Support + Family Support))
  
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
  caregiverInjuryRiskScore: number; // 0 to 100%
  caregiverBurnoutRiskLevel: 'low' | 'moderate' | 'high' | 'critical';

  clinicalFindings: string[];
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
    medicationManagement: false,
    finances: false,
    mealPreparation: false,
    housekeeping: false,
    transportation: false
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
    appointments: EngineAppointmentRecord[] = []
  ): CareGapEvaluationResult {
    // Every branch below reads these merged locals rather than the raw params.
    // Reading the params directly (as this engine previously did from step 3
    // onward) made the guards inert — evaluate(null, null) still threw.
    const safePatient = patient || DEFAULT_PATIENT_PROFILE;
    const safeCaregiver = caregiver || DEFAULT_CAREGIVER_ATTRIBUTES;

    const safeKatz = { ...DEFAULT_PATIENT_PROFILE.katzAdl, ...(safePatient.katzAdl || {}) };
    const safeIadl = { ...DEFAULT_PATIENT_PROFILE.lawtonIadl, ...(safePatient.lawtonIadl || {}) };
    const safeHealth = { ...DEFAULT_CAREGIVER_ATTRIBUTES.caregiverHealth, ...(safeCaregiver.caregiverHealth || {}) };
    const safeDevices: AssistiveDeviceInventory = {
      ...DEFAULT_ASSISTIVE_DEVICES,
      ...(safePatient.assistiveDevices || {})
    };

    const qualityOfCareWarnings: string[] = [];
    const clinicalFindings: string[] = [];
    const prescriptions: CareGapEvaluationResult['prescriptions'] = [];

    const hasCondition = (cond: string) => {
      return (safePatient.primaryConditions || []).some((c) =>
        c.toLowerCase().replace(/[^a-z0-9]/g, '').includes(cond.toLowerCase().replace(/[^a-z0-9]/g, ''))
      );
    };

    if (hasCondition('recurrent') || hasCondition('infection') || hasCondition('uti') || hasCondition('pneumonia')) {
      qualityOfCareWarnings.push(
        'Recurrent infections detected. Warrants immediate review of hygiene, fluid intake, and catheter/wound care protocols.'
      );
    }

    // Aspiration / Dysphagia / Tracheostomy Risk + Suction Apparatus Evaluation
    if (hasCondition('aspiration') || hasCondition('dysphagia') || hasCondition('tracheostomy') || !safeKatz.feeding) {
      if (!safeDevices.suctionApparatus) {
        qualityOfCareWarnings.push(
          'Frequent aspiration risk or feeding dependency. Warrants speech therapy consultation, strict feeding positioning (90 degrees), and bedside suction equipment.'
        );
      } else {
        clinicalFindings.push(
          'Airway Clearance Protocol Active: Bedside suction apparatus deployed for secretional and aspiration protection.'
        );
      }
    }

    // Bed-bound & Pressure Ulcer Risk + Alternating Mattress Evaluation
    if (hasCondition('bed sore') || hasCondition('pressure ulcer') || hasCondition('pressure sore') || safePatient.isBedBound) {
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

    const bpVitals = (vitals || []).filter((v) => v.bp);
    if (bpVitals.length > 0) {
      const sortedBp = [...bpVitals].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const latestBp = sortedBp[0].bp;
      if (latestBp) {
        const parts = latestBp.split('/');
        const systolic = parseInt(parts[0]);
        const diastolic = parseInt(parts[1]);
        if (systolic >= 160 || diastolic >= 100) {
          qualityOfCareWarnings.push(
            `Uncontrolled hypertension: Latest recorded BP is high (${latestBp}). Review medication compliance and notify physician.`
          );
        }
      }
    }

    if (hasCondition('diabetes') || hasCondition('diabetic')) {
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

    // 2. Calculate Lawton IADL Score (0-5)
    const iadlItems = Object.values(safeIadl);
    const lawtonIadlScore = iadlItems.filter(Boolean).length;
    const iadlDeficits = 5 - lawtonIadlScore;

    // 3. Compute Patient Daily Care Demand (Hours/Day)
    let demandHours = 1.5; // Baseline supervision & monitoring

    // Each ADL deficit demands ~1.25 direct physical care hours (bathing, toileting, transferring, feeding)
    demandHours += adlDeficits * 1.25;

    // Each IADL deficit adds ~0.5 hours (cooking, meds, cleaning)
    demandHours += iadlDeficits * 0.5;

    // Behavioral & Cognitive Load Adds Vigilance Hours
    if (safePatient.cognitiveBehavioralLoad === 'wandering_agitation') {
      demandHours += 2.5;
    } else if (safePatient.cognitiveBehavioralLoad === 'severe_sundowning') {
      demandHours += 4.0;
    } else if (safePatient.cognitiveBehavioralLoad === 'mild_forgetfulness') {
      demandHours += 1.0;
    }

    // Bed-bound 2-hourly turning and incontinence management
    if (safePatient.isBedBound) {
      // Motorized bed and ripple mattress slightly reduce the manual turning overhead
      const bedTurningHours = safeDevices.hospitalBed === 'motorized_multichannel' && safeDevices.airWaterMattress ? 1.2 : 2.0;
      demandHours += bedTurningHours;
    }

    const fallCount = Math.max(0, safePatient.fallHistoryLast6Months ?? 0);
    if (fallCount > 0) {
      demandHours += Math.min(2.0, 1.0 + (fallCount - 1) * 0.5);
    }

    const patientCareDemandHours = Math.round(demandHours * 10) / 10;

    // 4. Compute Formal / Ancillary Support Hours Absorbed
    const selectedTypes = resolveSupportTypes(safeCaregiver.formalSupport);

    const contributions = selectedTypes
      .map((t) => {
        if (t === 'paid_attendant_24h' || t === 'trained_nurse_24h') return 16.0;
        if (t === 'paid_attendant_12h' || t === 'trained_nurse_12h') return 10.0;
        if (t === 'medical_assistant') return 6.0;
        if (t === 'multi_family_rotation') return 6.0;
        return 0;
      })
      .sort((a, b) => b - a);

    let rawAbsorbed = 0;
    for (let i = 0; i < contributions.length; i++) {
      rawAbsorbed += contributions[i] * (i === 0 ? 1 : i === 1 ? 0.5 : 0.25);
    }

    const MAX_ABSORBABLE_FRACTION = 0.85;
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
      kinshipDeduction = (familySupportAbsorbedHours >= 2.0 || formalSupportAbsorbedHours >= 4.0) ? 0.5 : 1.0;
    }

    // Caregiver's Own Health Reductions with task relief credits
    let healthDeduction = 0;
    if (safeHealth.hasBackPain) healthDeduction += isTransfersRelieved ? 0.5 : 1.5;
    if (safeHealth.hasArthritis) healthDeduction += isBathingRelieved ? 0.3 : 1.0;
    if (safeHealth.hasInsomnia) healthDeduction += isNightCareRelieved ? 0.3 : 1.0;
    if (safeCaregiver.age >= 65) healthDeduction += 1.5;

    const secondaryFamilyCount = Math.max(
      0,
      safeCaregiver.secondaryMembers?.length ?? safeCaregiver.otherFamilyMembersCount ?? 0
    );
    const familyNetworkBuffer = Math.min(1.5, secondaryFamilyCount * 0.5);

    const caregiverSafeCapacityHours = Math.max(
      1.0,
      Math.round((capacityHours + familyNetworkBuffer - funcDeduction - kinshipDeduction - healthDeduction) * 10) / 10
    );

    // 6. Net Care Gap (Deficit in Hours/Day for the Primary Caregiver)
    const netCareGapHours = Math.max(0, Math.round((residualDemandOnPrimary - caregiverSafeCapacityHours) * 10) / 10);

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
    const GAP_CRITICAL_THRESHOLD = 4.0;
    const GAP_HIGH_THRESHOLD = 2.0;

    let careGapSeverity: CareGapEvaluationResult['careGapSeverity'] = 'sustainable';
    if (netCareGapHours > GAP_CRITICAL_THRESHOLD) careGapSeverity = 'critical_overload';
    else if (netCareGapHours > GAP_HIGH_THRESHOLD) careGapSeverity = 'high_deficit';
    else if (netCareGapHours > 0.0) careGapSeverity = 'mild_deficit';

    // 8. Caregiver Musculoskeletal & Burnout Risk Score (0 - 100%)
    let injuryScore = 20;

    const bmi = (safePatient.weightKg && safePatient.heightCm) 
      ? (safePatient.weightKg / Math.pow(safePatient.heightCm / 100, 2)) 
      : undefined;

    const patientWeight = safePatient.weightKg || 60;
    const weightMultiplier = patientWeight >= 80 || (bmi && bmi >= 28) 
      ? 1.4 
      : patientWeight >= 70 
      ? 1.2 
      : 1.0;
    const bedBoundMultiplier = safePatient.isBedBound ? 1.3 : 1.0;
    const physicalLoadMultiplier = weightMultiplier * bedBoundMultiplier;

    if (safeHealth.hasBackPain && !safeKatz.transferring) {
      injuryScore += Math.round((isTransfersRelieved ? 8 : 35) * physicalLoadMultiplier);
    }
    if (safeHealth.hasArthritis && !safeKatz.bathing) {
      injuryScore += Math.round((isBathingRelieved ? 4 : 20) * physicalLoadMultiplier);
    }
    if (safeCaregiver.age >= 60) {
      injuryScore += (isTransfersRelieved && isBathingRelieved) ? 5 : 15;
    }
    if (!safeCaregiver.formalTrainingReceived) {
      injuryScore += isTransfersRelieved ? 5 : 15;
    }
    if (netCareGapHours > 3.0) injuryScore += 20;
    if (qualityOfCareWarnings.length > 0) {
      injuryScore += qualityOfCareWarnings.length * 10;
    }

    // Apply Ergonomic Assistive Device Discounts
    let ergonomicDiscount = 0;
    if (safeDevices.hospitalBed === 'motorized_multichannel') {
      ergonomicDiscount += 25;
    } else if (safeDevices.hospitalBed === 'manual_adjustable') {
      ergonomicDiscount += 15;
    }
    if (safeDevices.transferAids) {
      ergonomicDiscount += 15;
    }
    if (safeDevices.wheelchair) {
      ergonomicDiscount += 10;
    }
    if (safeDevices.airWaterMattress) {
      ergonomicDiscount += 10;
    }

    ergonomicDiscount = Math.min(50, ergonomicDiscount);
    if (ergonomicDiscount > 0) {
      injuryScore = Math.max(10, Math.round(injuryScore * (1 - ergonomicDiscount / 100)));
    }

    const caregiverInjuryRiskScore = Math.min(100, Math.max(10, injuryScore));

    const financialMultiplier =
      safeCaregiver.monthlyOutOfPocketBurden === 'severe_toxicity' || safeCaregiver.financialStatus === 'severe_toxicity'
        ? 1.4
        : safeCaregiver.monthlyOutOfPocketBurden === 'moderate_strain' || safeCaregiver.financialStatus === 'moderate_strain'
        ? 1.15
        : 1.0;

    const effectiveGap = netCareGapHours * financialMultiplier;
    const effectiveInjury = caregiverInjuryRiskScore * financialMultiplier;

    let caregiverBurnoutRiskLevel: CareGapEvaluationResult['caregiverBurnoutRiskLevel'] = 'low';
    if (effectiveGap > GAP_CRITICAL_THRESHOLD || effectiveInjury >= 75 || qualityOfCareWarnings.length > 0) {
      caregiverBurnoutRiskLevel = 'critical';
    } else if (effectiveGap > GAP_HIGH_THRESHOLD || effectiveInjury >= 55) {
      caregiverBurnoutRiskLevel = 'high';
    } else if (netCareGapHours > 0.0 || caregiverInjuryRiskScore > 20) {
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
        title: 'Actionable Respite & Staffing Prescription',
        action: `Prescribe: ${prescribedHours} hours/day of paid attendant or certified caregiver support to eliminate the unmet care gap of ${netCareGapHours} hours/day. Focus this shift on high-physical-load care activities (e.g. transfers, sponge bathing, or toilet hygiene).`,
        impact: 'Compensates the unmet care demand hours, reducing physical/mental load on the primary caregiver to zero.',
        urgency: netCareGapHours >= 4.0 ? 'urgent' : netCareGapHours >= 2.0 ? 'priority' : 'routine'
      });
    } else {
      clinicalFindings.push(
        `Combined family capacity and formal care support (${caregiverSafeCapacityHours + formalSupportAbsorbedHours} hrs/day) successfully covers patient care demand (${patientCareDemandHours} hrs/day).`
      );
    }

    // Assistive Equipment Prescriptions
    if (safePatient.isBedBound && !safeDevices.airWaterMattress) {
      prescriptions.push({
        id: 'rx_air_water_mattress',
        title: 'Alternating Pressure Ripple Mattress Prescription',
        action: 'Install a motorized alternating air/water pressure ripple mattress to prevent stage 2-4 decubitus ulcers and reduce manual turning frequency.',
        impact: 'Drastically lowers dermal shear stress and protects vulnerable bony prominences.',
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
        title: 'Transfer Assistive Equipment & Swivel Disc Protocol',
        action: 'Acquire a padded transfer gait belt and 360-degree swivel pivot disc for bed-to-chair transfers.',
        impact: 'Substantially reduces lumbar disc shear load during daily pivot transfers.',
        urgency: safeHealth.hasBackPain ? 'urgent' : 'priority'
      });
    }

    if (safePatient.isBedBound && safeDevices.hospitalBed === 'none') {
      prescriptions.push({
        id: 'rx_hospital_bed',
        title: 'Multi-Function Adjustable Hospital Bed',
        action: 'Deploy a height-adjustable hospital bed with side rails to enable waist-level care during sponge baths and diaper changes.',
        impact: 'Prevents acute spine flexion and chronic musculoskeletal strain for the caregiver.',
        urgency: 'priority'
      });
    }

    if (netCareGapHours >= 3.0 && selectedTypes.length === 0) {
      prescriptions.push({
        id: 'rx_formal_attendant',
        title: 'Formal Respite / Semi-Skilled Attendant (4-6 Hours/Day)',
        action: 'Hire a certified daytime attendant for morning sponge bath, toileting, and transfer assistance, or register with local senior daycare.',
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
        impact: 'Improves care efficiency and prevents avoidable hospital readmissions.',
        urgency: 'routine'
      });
    }

    return {
      katzAdlScore,
      katzDependenceLevel,
      lawtonIadlScore,
      patientCareDemandHours,
      caregiverSafeCapacityHours,
      formalSupportAbsorbedHours,
      familySupportAbsorbedHours,
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
      caregiverInjuryRiskScore,
      caregiverBurnoutRiskLevel,
      clinicalFindings,
      prescriptions,
      qualityOfCareWarnings,
      evaluatedAt: now.toISOString()
    };
  }
}

/**
 * Generates an instant, highly readable, formatted WhatsApp Care Digest
 * for sharing with family members and attendants on the Care Circle group.
 */
export function generateWhatsAppCareDigest(
  caregiver: CaregiverAttributes,
  patient: PatientDependenceProfile,
  evaluation: CareGapEvaluationResult
): string {
  const rotation = caregiver.rotationPolicy || {
    rotationInterval: 'biweekly',
    primaryCaregiverRespiteDaysPerMonth: 4,
    weekendShiftLeader: 'Family Rotation',
    nightShiftArrangement: 'family_rotation'
  };

  const emergency = caregiver.emergencyLogistics || {
    hospitalDistanceKm: 4.5,
    travelTimeMinutes: 15,
    fourWheelerAvailableAtHome: true,
    designatedEmergencyDriver: 'Designated Driver',
    preferredHospitalName: 'Nearest Geriatric Emergency Hospital',
    ambulanceContact: '108'
  };

  const teamMembers = (caregiver.secondaryMembers || []).map((m) =>
    `• *${m.name || m.relationship}* (${m.relationship}, ${m.hoursPerDay}h/day): ${m.assignedTasks.map((t) => t.replace('_', ' ')).join(', ')}`
  ).join('\n');

  const devices = [
    evaluation.assistiveDeviceStatus.hasHospitalBed ? `• Hospital Bed (${evaluation.assistiveDeviceStatus.bedType.replace('_', ' ')})` : null,
    evaluation.assistiveDeviceStatus.hasAirWaterMattress ? '• Air/Water Alternating Pressure Mattress' : null,
    evaluation.assistiveDeviceStatus.hasWheelchair ? '• Wheelchair' : null,
    evaluation.assistiveDeviceStatus.hasSuctionApparatus ? '• Suction Apparatus (Bedside)' : null,
    evaluation.assistiveDeviceStatus.hasTransferAids ? '• Swivel Transfer Belt / Pivot Disc' : null
  ].filter(Boolean).join('\n');

  return `🏥 *KUTUMBH CARE CIRCLE PLAN & ROSTER*
━━━━━━━━━━━━━━━━━━━━
👤 *Patient:* ${patient.name} (Age ${patient.age})
🤝 *Primary Caregiver:* ${caregiver.name} (${caregiver.kinship}, ${caregiver.dailyHoursCommitted}h committed)
📊 *Care Demand:* ${evaluation.patientCareDemandHours}h/day | *Care Gap:* ${evaluation.netCareGapHours > 0 ? `${evaluation.netCareGapHours}h Deficit ⚠️` : '0h (Fully Covered ✅)'}
🩺 *Burnout Risk:* ${evaluation.caregiverBurnoutRiskLevel.toUpperCase()} | *Spine Strain:* ${evaluation.caregiverInjuryRiskScore}%

🗓️ *MONTHLY ROTATION & RESPITE POLICY*
• Respite Days for ${caregiver.name}: *${rotation.primaryCaregiverRespiteDaysPerMonth} Days/Month*
• Rotation Cycle: *${rotation.rotationInterval.toUpperCase()}*
• Weekend Shift Lead: *${rotation.weekendShiftLeader || 'Assigned Member'}*
• Night Watch: *${rotation.nightShiftArrangement.replace(/_/g, ' ')}*

👥 *CARE CIRCLE TEAM ASSIGNMENTS*
${teamMembers || '• Solo primary caregiver (no secondary members)'}

🛠️ *ASSISTIVE DEVICES ACTIVE*
${devices || '• Standard home setup (no specialized equipment)'}

🚨 *EMERGENCY PROTOCOL*
• Preferred Hospital: *${emergency.preferredHospitalName || 'AIIMS / Local Emergency'}*
• Distance / Transit: *${emergency.hospitalDistanceKm} km (${emergency.travelTimeMinutes} mins)*
• 4-Wheeler at Home: *${emergency.fourWheelerAvailableAtHome ? 'Yes (Parked)' : 'No (Cab / Auto required)'}*
• Emergency Driver: *${emergency.designatedEmergencyDriver || 'Key Holder'}*
• Ambulance Helpline: *${emergency.ambulanceContact || '108'}*
━━━━━━━━━━━━━━━━━━━━
_Generated via Kutumbh Geriatric Care Matrix_`;
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
  const now = new Date();
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const formatIcsDate = (d: Date) =>
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;

  const dtstamp = formatIcsDate(now);
  const rotation = caregiver.rotationPolicy || {
    primaryCaregiverRespiteDaysPerMonth: 4,
    weekendShiftLeader: 'Weekend Leader'
  };

  // Generate 4 recurring respite events for the upcoming month
  let events = '';
  for (let i = 1; i <= Math.min(4, rotation.primaryCaregiverRespiteDaysPerMonth); i++) {
    const respiteStart = new Date(now.getTime() + i * 7 * 24 * 60 * 60 * 1000);
    respiteStart.setHours(9, 0, 0, 0);
    const respiteEnd = new Date(respiteStart.getTime() + 10 * 60 * 60 * 1000);

    events += `BEGIN:VEVENT
UID:kutumbh-respite-${i}-${respiteStart.getTime()}@kutumbh.health
DTSTAMP:${dtstamp}
DTSTART:${formatIcsDate(respiteStart)}
DTEND:${formatIcsDate(respiteEnd)}
SUMMARY:🌿 Respite Day for ${caregiver.name} (Patient: ${patient.name})
DESCRIPTION:Primary caregiver scheduled respite day. Shift lead is ${rotation.weekendShiftLeader || 'Care Circle Family'}. Ensure all meals and meds are covered.
LOCATION:Home Care
STATUS:CONFIRMED
END:VEVENT
`;
  }

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Kutumbh Health//Care Matrix Roster//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Kutumbh Care Roster - ${patient.name}
X-WR-TIMEZONE:Asia/Kolkata
${events}END:VCALENDAR`;
}

