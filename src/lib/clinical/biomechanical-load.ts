/**
 * Sanjeevani Clinical Biomechanical Load & Ergonomic Constraint Engine
 * 
 * Qualitative patient-handling hazard and caregiver workload screen.
 * No NIOSH lifting index or spinal compression force is estimated for a person.
 */

import { INJURY_INDEX_BASELINE } from './care-gap-constants';
import type {
  CaregiverAttributes,
  PatientDependenceProfile,
  DiurnalTimeBlock,
  AssistiveDeviceInventory
} from './care-gap-engine';

export interface BiomechanicalAssessmentInput {
  caregiver: CaregiverAttributes;
  patient: PatientDependenceProfile;
  isTransfersRelievedByStaffOrFamily: boolean;
  isBathingRelievedByStaffOrFamily: boolean;
  isNightCareRelievedByStaffOrFamily: boolean;
  netCareGapHours: number;
  blockDemands?: Record<DiurnalTimeBlock, number>;
}

export interface BiomechanicalAssessmentResult {
  /** Deprecated: patient handling is outside the RNLE scope. */
  liftingIndex: null;
  /** Deprecated: no validated spinal compression estimate is available. */
  spinalCompressionKN: null;
  /** Estimated total manual patient handling transfer & repositioning events per 24h. */
  dailyTransferCount: number;
  /** Estimated nocturnal sleep fragmentation events per night due to caregiving & insomnia. */
  nocturnalSleepInterruptions: number;
  /** Standardized Biomechanical Lumbar Strain Index (0–100) mapped monotonically for dashboard compatibility. */
  caregiverInjuryRiskScore: number;
  /** Qualitative operational hazard tier. */
  caregiverInjuryRiskCategory: 'low' | 'moderate' | 'high' | 'severe';
  /** Qualitative manual-handling hazard tier for bounded planning without spurious precision. */
  manualHandlingHazardTier: 'low' | 'moderate' | 'high' | 'severe';
  /** Flag indicating whether dependent transfers require an OT/PT or Safe Patient Handling clinical assessment. */
  requiresClinicalPtOtReferral: boolean;
  /** Clinical referral recommendation text for manual handling. */
  clinicalReferralNotice?: string;
  /** Flag if lifting forces exceed standard NIOSH safety limits */
  isSafetyLimitExceeded: boolean;
  /** Clinical ergonomic explanations detailing equipment discounts and physical mechanics */
  ergonomicMechanisms: string[];
}

/**
 * Computes exact event-based biomechanical spinal load and caregiver injury risk.
 */
export function calculateBiomechanicalLoad(
  input: BiomechanicalAssessmentInput
): BiomechanicalAssessmentResult {
  const { caregiver, patient, isTransfersRelievedByStaffOrFamily, isBathingRelievedByStaffOrFamily, isNightCareRelievedByStaffOrFamily, netCareGapHours } = input;
  const safeHealth = caregiver.caregiverHealth || { hasBackPain: false, hasArthritis: false, hasInsomnia: false };
  const safeDevices: AssistiveDeviceInventory = patient.assistiveDevices || {
    hospitalBed: 'none',
    airWaterMattress: false,
    wheelchair: false,
    suctionApparatus: false,
    transferAids: false
  };

  const patientWeightKg = Math.max(35, Math.min(150, patient.weightKg || 60));
  const bmi = patient.heightCm ? patientWeightKg / Math.pow(patient.heightCm / 100, 2) : undefined;
  const isHighBmi = !!(bmi && bmi >= 28);

  const ergonomicMechanisms: string[] = [];

  // 1. Calculate Daily Transfer & Repositioning Frequency from Diurnal Schedule
  let dailyTransferCount = 0;

  // Bed-to-chair / morning transfer
  if (!patient.katzAdl.transferring) {
    dailyTransferCount += 2; // Morning out of bed + evening into bed
  }

  // Toileting transfers (commode / washroom)
  if (!patient.katzAdl.toileting || !patient.katzAdl.continence) {
    dailyTransferCount += 3; // Daytime toileting transfers
  }

  // Bathing transfer
  if (!patient.katzAdl.bathing) {
    dailyTransferCount += 1;
  }

  // Bed-bound repositioning / 2-hourly turning
  if (patient.isBedBound) {
    // 4 daytime turns + 3 nocturnal turns
    dailyTransferCount += safeDevices.airWaterMattress ? 4 : 7;
  }

  // Wheelchair eliminates unassisted carrying & ambulatory dragging steps
  if (safeDevices.wheelchair && dailyTransferCount > 2) {
    dailyTransferCount = Math.max(2, dailyTransferCount - 2);
    ergonomicMechanisms.push('Wheelchair reduces manual walking transfer carrying steps.');
  }

  // If transfers are relieved by staff or capable family members, caregiver's solo events drop

  // 2. Calculate Nocturnal Sleep Interruptions
  // Sourced from hasInsomnia + nocturnal turning/toileting caregiving events
  let nocturnalSleepInterruptions = 0;
  if (safeHealth.hasInsomnia) {
    nocturnalSleepInterruptions += 2; // Baseline primary insomnia awakenings
  }
  if (!isNightCareRelievedByStaffOrFamily) {
    if (patient.isBedBound) {
      nocturnalSleepInterruptions += safeDevices.airWaterMattress ? 1.5 : 3.0; // 2-hourly turns
    }
    if (!patient.katzAdl.continence || !patient.katzAdl.toileting) {
      nocturnalSleepInterruptions += 1.5; // Nocturnal diaper / bedpan changes
    }
    if (patient.cognitiveBehavioralLoad === 'severe_sundowning') {
      nocturnalSleepInterruptions += 2.5; // Nocturnal wandering / agitation check-ins
    }
  }
  nocturnalSleepInterruptions = Math.round(nocturnalSleepInterruptions * 10) / 10;

  if (safeDevices.hospitalBed !== 'none') ergonomicMechanisms.push('Adjustable bed is available for handling review.');
  if (safeDevices.transferAids) ergonomicMechanisms.push('Transfer aids are available; safe technique requires individual assessment.');

  // 7. Calculate Standardized 0-100 Biomechanical Lumbar Strain Score
  let strainScore = INJURY_INDEX_BASELINE;

  const weightMult = patientWeightKg >= 80 || isHighBmi ? 1.4 : patientWeightKg >= 70 ? 1.2 : 1.0;
  const bedMult = patient.isBedBound ? 1.3 : 1.0;
  const physicalLoadMultiplier = weightMult * bedMult;

  if (!patient.katzAdl.transferring) {
    const transferLoad = isTransfersRelievedByStaffOrFamily ? 8 : 25;
    strainScore += Math.round(transferLoad * physicalLoadMultiplier);
    if (safeHealth.hasBackPain) {
      strainScore += isTransfersRelievedByStaffOrFamily ? 4 : 10;
    }
  }

  if (!patient.katzAdl.bathing) {
    const bathingLoad = isBathingRelievedByStaffOrFamily ? 3 : 10;
    strainScore += Math.round(bathingLoad * physicalLoadMultiplier);
    if (safeHealth.hasArthritis) {
      strainScore += isBathingRelievedByStaffOrFamily ? 3 : 8;
    }
  }

  if (caregiver.age >= 60) {
    strainScore += isTransfersRelievedByStaffOrFamily ? 3 : 10;
  }

  if (!caregiver.formalTrainingReceived) {
    strainScore += isTransfersRelievedByStaffOrFamily ? 3 : 10;
  }

  // Equipment can affect handling exposure; it cannot erase insomnia or
  // unassigned work. Apply the heuristic adjustment only to handling points.
  let discountPct = 0;
  if (safeDevices.hospitalBed === 'motorized_multichannel') discountPct += 25;
  else if (safeDevices.hospitalBed === 'manual_adjustable') discountPct += 15;
  if (safeDevices.transferAids) discountPct += 15;
  if (safeDevices.wheelchair) discountPct += 10;
  if (safeDevices.airWaterMattress) discountPct += 10;
  discountPct = Math.min(50, discountPct);

  if (discountPct > 0) strainScore = INJURY_INDEX_BASELINE + Math.round((strainScore - INJURY_INDEX_BASELINE) * (1 - discountPct / 100));
  if (nocturnalSleepInterruptions >= 3.0) strainScore += 10;
  if (netCareGapHours > 3.0) strainScore += 10;

  const caregiverInjuryRiskScore = Math.min(100, Math.max(10, strainScore));

  // Operational category uses task exposure and caregiver limitations only.
  let caregiverInjuryRiskCategory: BiomechanicalAssessmentResult['caregiverInjuryRiskCategory'] = 'low';
  if (caregiverInjuryRiskScore >= 75) {
    caregiverInjuryRiskCategory = 'severe';
  } else if (caregiverInjuryRiskScore >= 55) {
    caregiverInjuryRiskCategory = 'high';
  } else if (caregiverInjuryRiskScore >= 30) {
    caregiverInjuryRiskCategory = 'moderate';
  }

  const manualHandlingHazardTier = caregiverInjuryRiskCategory;
  const isSafetyLimitExceeded = caregiverInjuryRiskCategory === 'high' || caregiverInjuryRiskCategory === 'severe';

  // Patient handling requires an individual safe handling assessment.
  ergonomicMechanisms.push(
    'Patient handling is outside the NIOSH lifting equation scope; review technique and equipment with PT/OT or a safe patient handling specialist.'
  );

  const requiresClinicalPtOtReferral = !patient.katzAdl.transferring || patient.isBedBound || manualHandlingHazardTier === 'high' || manualHandlingHazardTier === 'severe';
  const clinicalReferralNotice = requiresClinicalPtOtReferral
    ? 'Patient is dependent in transfers or bed-bound. Route to an Occupational Therapist (OT), Physiotherapist (PT), or certified Safe Patient Handling and Mobility (SPHM) specialist for an individualized transfer, equipment, and sling assessment.'
    : undefined;

  return {
    liftingIndex: null,
    spinalCompressionKN: null,
    dailyTransferCount,
    nocturnalSleepInterruptions,
    caregiverInjuryRiskScore,
    caregiverInjuryRiskCategory,
    manualHandlingHazardTier,
    requiresClinicalPtOtReferral,
    clinicalReferralNotice,
    isSafetyLimitExceeded,
    ergonomicMechanisms
  };
}
