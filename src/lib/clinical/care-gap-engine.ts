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
  /**
   * @param now Injectable clock. Defaults to the current time; pass a fixed
   *            value in tests and anywhere a stable result identity matters.
   */
  static evaluate(
    caregiver: CaregiverAttributes | null | undefined,
    patient: PatientDependenceProfile | null | undefined,
    now: Date = new Date()
  ): CareGapEvaluationResult {
    // Every branch below reads these merged locals rather than the raw params.
    // Reading the params directly (as this engine previously did from step 3
    // onward) made the guards inert — evaluate(null, null) still threw.
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

    // Support members overlap in time — two 24h attendants do not cover 32
    // hours of a 24-hour day. The largest contributor counts in full; each
    // subsequent one is discounted, so stacking types has diminishing returns
    // instead of summing to a physically impossible total.
    let rawAbsorbed = 0;
    for (let i = 0; i < contributions.length; i++) {
      rawAbsorbed += contributions[i] * (i === 0 ? 1 : i === 1 ? 0.5 : 0.25);
    }

    // Formal support absorbs hands-on task hours, not the family caregiver's
    // supervision, care coordination and emotional labour. Capping absorption
    // at 100% of demand let a single live-in attendant drive the net gap to
    // exactly zero regardless of the caregiver's own age, health or job, which
    // contradicts the burden literature: paid help attenuates caregiver load,
    // it does not eliminate it. This residual floor keeps a fully staffed dyad
    // visible rather than reporting it as "sustainable" by construction.
    const MAX_ABSORBABLE_FRACTION = 0.85;
    const formalSupportAbsorbedHours =
      Math.round(Math.min(patientCareDemandHours * MAX_ABSORBABLE_FRACTION, rawAbsorbed) * 10) / 10;

    // Residual Patient Demand after Formal Staff absorption
    const residualDemand = Math.max(0, patientCareDemandHours - formalSupportAbsorbedHours);

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

    // Kinship / Senior Dyad Strain. The >= 65 health deduction below already
    // captures the caregiver's own ageing, so this adds only the increment
    // specific to a senior spouse dyad (co-resident, no relief shift).
    let kinshipDeduction = 0;
    if (safeCaregiver.kinship === 'spouse' && safeCaregiver.age >= 65) {
      kinshipDeduction = 1.0;
    }

    // Caregiver's Own Health Reductions
    let healthDeduction = 0;
    if (safeHealth.hasBackPain) healthDeduction += 1.5;
    if (safeHealth.hasArthritis) healthDeduction += 1.0;
    if (safeHealth.hasInsomnia) healthDeduction += 1.0;
    if (safeCaregiver.age >= 65) healthDeduction += 1.5; // Senior caring for senior dyad

    // Secondary Family Members Support Network Buffer. Secondary relatives take
    // discrete tasks (a grocery run, an evening medication round) rather than
    // full shifts, so the buffer is deliberately smaller than a formal support
    // contribution and is capped well below it.
    const secondaryFamilyCount = Math.max(0, safeCaregiver.otherFamilyMembersCount ?? 0);
    const familyNetworkBuffer = Math.min(1.5, secondaryFamilyCount * 0.5);

    const caregiverSafeCapacityHours = Math.max(
      1.0,
      Math.round(
        (capacityHours + familyNetworkBuffer - funcDeduction - kinshipDeduction - healthDeduction) * 10
      ) / 10
    );

    // 6. Net Care Gap (Deficit in Hours/Day for the Primary Caregiver)
    const netCareGapHours = Math.max(0, Math.round((residualDemand - caregiverSafeCapacityHours) * 10) / 10);

    // 7. Care Gap Severity Classification.
    // These boundaries are the single source of truth for both the severity
    // label and the burnout level below; they previously disagreed (4.5 vs 4.0),
    // so a 4.2h gap rendered "High Deficit" and "Critical Burnout" side by side.
    const GAP_CRITICAL_THRESHOLD = 4.0;
    const GAP_HIGH_THRESHOLD = 2.0;

    let careGapSeverity: CareGapEvaluationResult['careGapSeverity'] = 'sustainable';
    if (netCareGapHours > GAP_CRITICAL_THRESHOLD) careGapSeverity = 'critical_overload';
    else if (netCareGapHours > GAP_HIGH_THRESHOLD) careGapSeverity = 'high_deficit';
    else if (netCareGapHours > 0.0) careGapSeverity = 'mild_deficit';

    // 8. Caregiver Musculoskeletal & Burnout Risk Score (0 - 100%)
    let injuryScore = 20;

    // Only a dedicated attendant or nurse physically performs the daily
    // bed-to-chair lifts. A visiting medical assistant / physio aide does not,
    // and a multi-family rotation means the lifting is still being done by
    // untrained family members — the exact population that needs the transfer
    // safety guidance below. Neither may suppress lumbar-risk output.
    const isTransfersHandledByStaff = selectedTypes.some(performsHeavyTransfers);

    if (safeHealth.hasBackPain && !safeKatz.transferring) {
      injuryScore += isTransfersHandledByStaff ? 10 : 35;
    }
    if (safeHealth.hasArthritis && !safeKatz.bathing) {
      injuryScore += isTransfersHandledByStaff ? 5 : 20;
    }
    if (safeCaregiver.age >= 60) injuryScore += 15;
    if (!safeCaregiver.formalTrainingReceived) injuryScore += 15;
    if (netCareGapHours > 3.0) injuryScore += 20;

    // NOTE: formal support is already discounted inside the per-condition
    // branches above, which is where it is clinically meaningful (staff perform
    // the lifts, so the caregiver's own back is spared). An additional blanket
    // deduction here used to collapse every supported dyad into a 10-30 band,
    // where a frail 68-year-old with back pain scored identically to a healthy
    // trained caregiver. One discount only.
    const caregiverInjuryRiskScore = Math.min(100, Math.max(10, injuryScore));

    let caregiverBurnoutRiskLevel: CareGapEvaluationResult['caregiverBurnoutRiskLevel'] = 'low';
    if (netCareGapHours > GAP_CRITICAL_THRESHOLD || caregiverInjuryRiskScore >= 75) {
      caregiverBurnoutRiskLevel = 'critical';
    } else if (netCareGapHours > GAP_HIGH_THRESHOLD || caregiverInjuryRiskScore >= 55) {
      caregiverBurnoutRiskLevel = 'high';
    } else if (netCareGapHours > 0.0) {
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
    } else {
      clinicalFindings.push(
        `Combined family capacity and formal care support (${caregiverSafeCapacityHours + formalSupportAbsorbedHours} hrs/day) successfully covers patient care demand (${patientCareDemandHours} hrs/day).`
      );
    }

    if (safeHealth.hasBackPain && !safeKatz.transferring && !isTransfersHandledByStaff) {
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
      netCareGapHours,
      careGapSeverity,
      caregiverInjuryRiskScore,
      caregiverBurnoutRiskLevel,
      clinicalFindings,
      prescriptions,
      evaluatedAt: now.toISOString()
    };
  }
}
