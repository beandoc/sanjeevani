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

    const qualityOfCareWarnings: string[] = [];
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
    if (hasCondition('aspiration') || hasCondition('dysphagia') || !safeKatz.feeding) {
      qualityOfCareWarnings.push(
        'Frequent aspiration risk or feeding dependency. Warrants speech therapy consultation and strict feeding positioning (90 degrees).'
      );
    }
    if (hasCondition('bed sore') || hasCondition('pressure ulcer') || hasCondition('pressure sore') || safePatient.isBedBound) {
      qualityOfCareWarnings.push(
        'Bed sore presence or high pressure ulcer risk. Warrants 2-hourly turning schedule and specialized water/air mattress.'
      );
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
      demandHours += 2.0;
    }

    // Recent fall vulnerability. Repeat fallers carry materially higher
    // supervision load than a single fall, so the count is graded rather than
    // collapsed to a boolean (capped so an outlier count cannot dominate).
    const fallCount = Math.max(0, safePatient.fallHistoryLast6Months ?? 0);
    if (fallCount > 0) {
      demandHours += Math.min(2.0, 1.0 + (fallCount - 1) * 0.5);
    }

    const patientCareDemandHours = Math.round(demandHours * 10) / 10;

    // 4. Compute Formal / Ancillary Support Hours Absorbed
    const selectedTypes = resolveSupportTypes(safeCaregiver.formalSupport);

    // Per-type task hours a support member can absorb from the family.
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
    // If no explicit secondaryMembers array was configured, fall back to legacy count buffer
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

    // Residual Patient Demand after Formal Staff & Family absorption
    const residualDemandOnPrimary = Math.max(0, patientCareDemandHours - formalSupportAbsorbedHours - familySupportAbsorbedHours);

    // 5. Compute Primary Caregiver Safe Daily Capacity (Hours/Day)
    let capacityHours = safeCaregiver.dailyHoursCommitted;

    // Employment deductions (Work fatigue reduces effective high-intensity care capacity)
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

    // Secondary Family Members Support Network Buffer
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

    // Team Allocations
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
    const clinicalFindings: string[] = [];
    const prescriptions: CareGapEvaluationResult['prescriptions'] = [];

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

    if (safeHealth.hasBackPain && !safeKatz.transferring && !isTransfersRelieved) {
      clinicalFindings.push(
        'High musculoskeletal injury risk: Caregiver has pre-existing back pain while patient is dependent in bed-to-chair transfers.'
      );
      prescriptions.push({
        id: 'rx_transfer_biomechanics',
        title: 'Transfer Assistive Equipment & Biomechanics Protocol',
        action: 'Acquire a transfer belt or swivel disc, adjust bed height to caregiver waist level, and review ergonomic pivot transfer techniques.',
        impact: 'Substantially reduces lumbar load during daily bed transfers.',
        urgency: 'urgent'
      });
    }

    // Gate on the resolved team, not formal.type — a dyad whose support was
    // saved as { type: 'none', types: [...] } was previously still told to hire
    // an attendant it already had.
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
        action: 'Explore Ayushman Bharat PM-JAY Senior Citizen cover (₹5 Lakhs/yr top-up) and state medical subsidies to alleviate 24/7 nursing financial strain.',
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
