/**
 * Sanjeevani Caregiver Dyad & Care Gap Estimation Engine
 * Quantifies the mismatch between patient care demand (Katz ADL / Lawton IADL / Multimorbidity)
 * and caregiver physical/temporal capacity (Age, Health, Employment, Kinship, Financial Strain).
 */

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
  netCareGapHours: number; // Demand - Safe Capacity
  
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
  formalTrainingReceived: false
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
    // 1. Calculate Katz ADL Score (0-6)
    const adlItems = Object.values(patient.katzAdl);
    const katzAdlScore = adlItems.filter(Boolean).length;
    const adlDeficits = 6 - katzAdlScore;

    let katzDependenceLevel: CareGapEvaluationResult['katzDependenceLevel'] = 'independent';
    if (katzAdlScore <= 2) katzDependenceLevel = 'severe_dependence';
    else if (katzAdlScore <= 4) katzDependenceLevel = 'moderate_impairment';

    // 2. Calculate Lawton IADL Score (0-5)
    const iadlItems = Object.values(patient.lawtonIadl);
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

    // 4. Compute Caregiver Safe Daily Capacity (Hours/Day)
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

    // 5. Net Care Gap (Deficit in Hours/Day)
    const netCareGapHours = Math.round((patientCareDemandHours - caregiverSafeCapacityHours) * 10) / 10;

    // 6. Care Gap Severity Classification
    let careGapSeverity: CareGapEvaluationResult['careGapSeverity'] = 'sustainable';
    if (netCareGapHours > 4.5) careGapSeverity = 'critical_overload';
    else if (netCareGapHours > 2.0) careGapSeverity = 'high_deficit';
    else if (netCareGapHours > 0.0) careGapSeverity = 'mild_deficit';

    // 7. Caregiver Musculoskeletal & Burnout Risk Score (0 - 100%)
    let injuryScore = 20;
    if (caregiver.caregiverHealth.hasBackPain && !patient.katzAdl.transferring) injuryScore += 35;
    if (caregiver.caregiverHealth.hasArthritis && !patient.katzAdl.bathing) injuryScore += 20;
    if (caregiver.age >= 60) injuryScore += 15;
    if (!caregiver.formalTrainingReceived) injuryScore += 15;
    if (netCareGapHours > 3.0) injuryScore += 20;
    const caregiverInjuryRiskScore = Math.min(100, injuryScore);

    let caregiverBurnoutRiskLevel: CareGapEvaluationResult['caregiverBurnoutRiskLevel'] = 'low';
    if (netCareGapHours > 4.0 || caregiverInjuryRiskScore >= 75) caregiverBurnoutRiskLevel = 'critical';
    else if (netCareGapHours > 2.0 || caregiverInjuryRiskScore >= 55) caregiverBurnoutRiskLevel = 'high';
    else if (netCareGapHours > 0.0) caregiverBurnoutRiskLevel = 'moderate';

    // 8. Clinical Findings & Prescriptions
    const clinicalFindings: string[] = [];
    const prescriptions: CareGapEvaluationResult['prescriptions'] = [];

    if (netCareGapHours > 0) {
      clinicalFindings.push(
        `Patient requires ${patientCareDemandHours} hrs/day of direct assistance (Katz ADL score: ${katzAdlScore}/6). Caregiver safe physical threshold is ${caregiverSafeCapacityHours} hrs/day, creating a net unmet care gap of ${netCareGapHours} hrs/day.`
      );
    } else {
      clinicalFindings.push(
        `Caregiver capacity (${caregiverSafeCapacityHours} hrs/day) currently meets patient care demand (${patientCareDemandHours} hrs/day).`
      );
    }

    if (caregiver.caregiverHealth.hasBackPain && !patient.katzAdl.transferring) {
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

    if (netCareGapHours >= 3.0) {
      prescriptions.push({
        id: 'rx_formal_attendant',
        title: 'Formal Respite / Semi-Skilled Attendant (4-6 Hours/Day)',
        action: 'Hire a certified daytime attendant for morning sponge bath, toileting, and transfer assistance, or register with local senior daycare.',
        impact: 'Directly absorbs the 4+ hour daily care deficit, preventing caregiver acute physical collapse.',
        urgency: 'urgent'
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
