/**
 * Sanjeevani Caregiver Dyad & Care Gap Estimation Engine
 * Quantifies the mismatch between patient care demand (Katz ADL / Lawton IADL / Multimorbidity)
 * and caregiver physical/temporal capacity (Age, Health, Employment, Kinship, Formal Support Infrastructure).
 */

export type FormalSupportType =
  | 'none'
  | 'paid_attendant_12h'
  | 'paid_attendant_24h'
  | 'trained_nurse_12h'
  | 'trained_nurse_24h'
  | 'medical_assistant'
  | 'multi_family_rotation';

export interface CaregiverAttributes {
  name: string;
  age: number;
  gender: 'female' | 'male' | 'other';
  kinship: 'spouse' | 'son' | 'daughter' | 'daughter_in_law' | 'sibling' | 'paid_attendant' | 'other';
  coResidence: 'lives_together' | 'nearby' | 'long_distance';
  education: 'primary' | 'secondary' | 'graduate' | 'post_graduate';
  employment: 'full_time' | 'part_time' | 'homemaker' | 'retired' | 'unemployed';
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
  netCareGapHours: number; // Max(0, Demand - (Safe Capacity + Formal Support))
  
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
  isBedBound: false
};

export class CareGapEngine {
  static evaluate(
    caregiver: CaregiverAttributes,
    patient: PatientDependenceProfile
  ): CareGapEvaluationResult {
    const safePatient = patient || DEFAULT_PATIENT_PROFILE;
    const safeCaregiver = caregiver || DEFAULT_CAREGIVER_ATTRIBUTES;

    const safeKatz = { ...DEFAULT_PATIENT_PROFILE.katzAdl, ...(safePatient.katzAdl || {}) };
    const safeIadl = { ...DEFAULT_PATIENT_PROFILE.lawtonIadl, ...(safePatient.lawtonIadl || {}) };
    const safeHealth = { ...DEFAULT_CAREGIVER_ATTRIBUTES.caregiverHealth, ...(safeCaregiver.caregiverHealth || {}) };

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
    if (patient.cognitiveBehavioralLoad === 'wandering_agitation') {
      demandHours += 2.5;
    } else if (patient.cognitiveBehavioralLoad === 'severe_sundowning') {
      demandHours += 4.0;
    } else if (patient.cognitiveBehavioralLoad === 'mild_forgetfulness') {
      demandHours += 1.0;
    }

    // Bed-bound 2-hourly turning and incontinence management
    if (patient.isBedBound) {
      demandHours += 2.0;
    }

    // Recent fall vulnerability
    if (patient.fallHistoryLast6Months > 0) {
      demandHours += 1.0;
    }

    const patientCareDemandHours = Math.round(demandHours * 10) / 10;

    // 4. Compute Formal / Ancillary Support Hours Absorbed
    let formalSupportAbsorbedHours = 0;
    const formal = caregiver.formalSupport;
    if (formal && formal.type !== 'none') {
      if (formal.type === 'paid_attendant_24h' || formal.type === 'trained_nurse_24h') {
        formalSupportAbsorbedHours = Math.min(patientCareDemandHours, 18.0);
      } else if (formal.type === 'paid_attendant_12h' || formal.type === 'trained_nurse_12h') {
        formalSupportAbsorbedHours = Math.min(patientCareDemandHours, 10.0);
      } else if (formal.type === 'medical_assistant') {
        formalSupportAbsorbedHours = Math.min(patientCareDemandHours, 6.0);
      } else if (formal.type === 'multi_family_rotation') {
        formalSupportAbsorbedHours = Math.min(patientCareDemandHours, formal.hoursPerDay || 6.0);
      }
    }
    formalSupportAbsorbedHours = Math.round(formalSupportAbsorbedHours * 10) / 10;

    // Residual Patient Demand after Formal Staff absorption
    const residualDemand = Math.max(0, patientCareDemandHours - formalSupportAbsorbedHours);

    // 5. Compute Primary Caregiver Safe Daily Capacity (Hours/Day)
    let capacityHours = caregiver.dailyHoursCommitted;

    // Employment deductions (Work fatigue reduces effective high-intensity care capacity)
    if (caregiver.employment === 'full_time') {
      capacityHours = Math.min(capacityHours, 5.0);
    } else if (caregiver.employment === 'part_time') {
      capacityHours = Math.min(capacityHours, 7.0);
    }

    // Caregiver's Own Health Reductions
    let healthDeduction = 0;
    if (caregiver.caregiverHealth.hasBackPain) healthDeduction += 1.5;
    if (caregiver.caregiverHealth.hasArthritis) healthDeduction += 1.0;
    if (caregiver.caregiverHealth.hasInsomnia) healthDeduction += 1.0;
    if (caregiver.age >= 65) healthDeduction += 1.5; // Senior caring for senior dyad

    const caregiverSafeCapacityHours = Math.max(1.5, Math.round((capacityHours - healthDeduction) * 10) / 10);

    // 6. Net Care Gap (Deficit in Hours/Day for the Primary Caregiver)
    const netCareGapHours = Math.max(0, Math.round((residualDemand - caregiverSafeCapacityHours) * 10) / 10);

    // 7. Care Gap Severity Classification
    let careGapSeverity: CareGapEvaluationResult['careGapSeverity'] = 'sustainable';
    if (netCareGapHours > 4.5) careGapSeverity = 'critical_overload';
    else if (netCareGapHours > 2.0) careGapSeverity = 'high_deficit';
    else if (netCareGapHours > 0.0) careGapSeverity = 'mild_deficit';

    // 8. Caregiver Musculoskeletal & Burnout Risk Score (0 - 100%)
    let injuryScore = 20;
    const isTransfersHandledByStaff = formal && (formal.handlesHeavyTransfers || formal.type === 'paid_attendant_24h' || formal.type === 'trained_nurse_24h' || formal.type === 'trained_nurse_12h');

    if (caregiver.caregiverHealth.hasBackPain && !patient.katzAdl.transferring) {
      injuryScore += isTransfersHandledByStaff ? 10 : 35; // 70% reduction in lumbar risk if staff handles lifts
    }
    if (caregiver.caregiverHealth.hasArthritis && !patient.katzAdl.bathing) {
      injuryScore += isTransfersHandledByStaff ? 5 : 20;
    }
    if (caregiver.age >= 60) injuryScore += 15;
    if (!caregiver.formalTrainingReceived) injuryScore += 15;
    if (netCareGapHours > 3.0) injuryScore += 20;
    
    // Formal support mitigates overall family injury strain
    if (formal && (formal.type === 'paid_attendant_24h' || formal.type === 'trained_nurse_24h')) {
      injuryScore = Math.max(10, injuryScore - 30);
    } else if (formal && (formal.type === 'paid_attendant_12h' || formal.type === 'trained_nurse_12h')) {
      injuryScore = Math.max(15, injuryScore - 20);
    }

    const caregiverInjuryRiskScore = Math.min(100, Math.max(10, injuryScore));

    let caregiverBurnoutRiskLevel: CareGapEvaluationResult['caregiverBurnoutRiskLevel'] = 'low';
    if (netCareGapHours > 4.0 || caregiverInjuryRiskScore >= 75) caregiverBurnoutRiskLevel = 'critical';
    else if (netCareGapHours > 2.0 || caregiverInjuryRiskScore >= 55) caregiverBurnoutRiskLevel = 'high';
    else if (netCareGapHours > 0.0) caregiverBurnoutRiskLevel = 'moderate';

    // 9. Clinical Findings & Prescriptions
    const clinicalFindings: string[] = [];
    const prescriptions: CareGapEvaluationResult['prescriptions'] = [];

    if (formal && formal.type !== 'none') {
      const formalLabel =
        formal.type === 'paid_attendant_24h'
          ? '24-Hour Paid Attendant'
          : formal.type === 'paid_attendant_12h'
          ? '12-Hour Paid Attendant'
          : formal.type === 'trained_nurse_24h'
          ? '24-Hour Certified Nurse'
          : formal.type === 'trained_nurse_12h'
          ? '12-Hour Certified Nurse'
          : formal.type === 'medical_assistant'
          ? 'Trained Medical Assistant'
          : 'Multi-Caregiver Family Rotation';

      clinicalFindings.push(
        `Formal Support Active (${formalLabel}): Absorbs ${formalSupportAbsorbedHours} hrs/day of patient physical demands, reducing primary family caregiver fatigue and musculoskeletal burden.`
      );
    }

    if (netCareGapHours > 0) {
      clinicalFindings.push(
        `Patient requires ${patientCareDemandHours} hrs/day of direct assistance (Katz ADL: ${katzAdlScore}/6). Net unmet care gap after formal support and caregiver capacity is ${netCareGapHours} hrs/day.`
      );
    } else {
      clinicalFindings.push(
        `Combined family capacity and formal care support (${caregiverSafeCapacityHours + formalSupportAbsorbedHours} hrs/day) successfully covers patient care demand (${patientCareDemandHours} hrs/day).`
      );
    }

    if (caregiver.caregiverHealth.hasBackPain && !patient.katzAdl.transferring && !isTransfersHandledByStaff) {
      clinicalFindings.push(
        'High musculoskeletal injury risk: Caregiver has pre-existing back pain while patient is dependent in bed-to-chair transfers.'
      );
      prescriptions.push({
        id: 'rx_transfer_biomechanics',
        title: 'Transfer Assistive Equipment & Biomechanics Protocol',
        action: 'Acquire a transfer belt or swivel disc, adjust bed height to caregiver waist level, and review ergonomic pivot transfer techniques.',
        impact: 'Reduces peak lumbar spine torque by 65% during daily bed transfers.',
        urgency: 'urgent'
      });
    }

    if (netCareGapHours >= 3.0 && (!formal || formal.type === 'none')) {
      prescriptions.push({
        id: 'rx_formal_attendant',
        title: 'Formal Respite / Semi-Skilled Attendant (4-6 Hours/Day)',
        action: 'Hire a certified daytime attendant for morning sponge bath, toileting, and transfer assistance, or register with local senior daycare.',
        impact: 'Directly absorbs the 4+ hour daily care deficit, preventing caregiver acute physical collapse.',
        urgency: 'urgent'
      });
    }

    if (caregiver.monthlyOutOfPocketBurden === 'severe_toxicity' && formal && (formal.type === 'paid_attendant_24h' || formal.type === 'trained_nurse_24h')) {
      prescriptions.push({
        id: 'rx_financial_counseling',
        title: 'Geriatric Financial Optimization & Govt Senior Schemes',
        action: 'Explore Ayushman Bharat PM-JAY Senior Citizen cover (₹5 Lakhs/yr top-up) and state medical subsidies to alleviate 24/7 nursing financial strain.',
        impact: 'Reduces catastrophic out-of-pocket health expenditure.',
        urgency: 'priority'
      });
    }

    if (caregiver.employment === 'full_time' && netCareGapHours > 1.5) {
      prescriptions.push({
        id: 'rx_care_circle_redistribution',
        title: 'Care Circle Family Task Delegation',
        action: 'Redistribute evening medication dispensing, grocery runs, and clinic logistics to secondary Care Circle members.',
        impact: 'Protects evening recovery sleep and reduces dual-role employment conflict.',
        urgency: 'priority'
      });
    }

    if (!caregiver.formalTrainingReceived) {
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
      netCareGapHours,
      careGapSeverity,
      caregiverInjuryRiskScore,
      caregiverBurnoutRiskLevel,
      clinicalFindings,
      prescriptions,
      evaluatedAt: new Date().toISOString()
    };
  }
}
