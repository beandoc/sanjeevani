/**
 * Sanjeevani Clinical Biomechanical Load & Ergonomic Constraint Engine
 * 
 * Replaces static/ad-hoc injury scoring with physics-based, dyadic event modeling
 * anchored on:
 * 1. NIOSH Revised Lifting Equation (RNLE) (Waters et al., Ergonomics 1993).
 * 2. Movement and Assistance of Hospital Patients (MAPO) index (Battevi et al., Ergonomics 2006).
 * 
 * Models each manual patient transfer event (bed-to-chair, turning, commode, sit-to-stand)
 * from patient mass, transfer geometry, caregiver constraints (age, lumbar pathology,
 * arthritis, nocturnal micro-sleep interruptions), and equipment modifier terms.
 */

import {
  NIOSH_RNLE_LOAD_CONSTANT_KG,
  NIOSH_SPINAL_COMPRESSION_ACTION_LIMIT_KN,
  NIOSH_SPINAL_COMPRESSION_MAX_LIMIT_KN,
  MAPO_PATIENT_HANDLING_PARAMS,
  INJURY_INDEX_BASELINE
} from './care-gap-constants';
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
  /** NIOSH Lifting Index (LI = Actual Load / Recommended Weight Limit). >1.0 indicates elevated musculoskeletal hazard. */
  liftingIndex: number;
  /** Estimated peak L5/S1 spinal compressive force in kiloNewtons (NIOSH action limit: 3.4 kN). */
  spinalCompressionKN: number;
  /** Estimated total manual patient handling transfer & repositioning events per 24h. */
  dailyTransferCount: number;
  /** Estimated nocturnal sleep fragmentation events per night due to caregiving & insomnia. */
  nocturnalSleepInterruptions: number;
  /** Standardized Biomechanical Lumbar Strain Index (0–100) mapped monotonically for dashboard compatibility. */
  caregiverInjuryRiskScore: number;
  /** Clinical Risk Tier based on RNLE / MAPO index thresholds. */
  caregiverInjuryRiskCategory: 'low' | 'moderate' | 'high' | 'severe';
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
  const caregiverSoloTransfers = isTransfersRelievedByStaffOrFamily
    ? Math.max(0, Math.round(dailyTransferCount * 0.2))
    : dailyTransferCount;

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

  // 3. Compute NIOSH RNLE Multipliers & Recommended Weight Limit (RWL)
  // Base LC = 23 kg
  const LC = NIOSH_RNLE_LOAD_CONSTANT_KG;
  const HM = 0.75; // Standard reach distance (~33 cm from body)

  // Vertical Multiplier (VM): Motorized bed adjusts to optimal waist height (75 cm)
  let VM: number = MAPO_PATIENT_HANDLING_PARAMS.equipmentModifiers.standardLowBedVM;
  if (safeDevices.hospitalBed === 'motorized_multichannel') {
    VM = MAPO_PATIENT_HANDLING_PARAMS.equipmentModifiers.motorizedBedVM;
    ergonomicMechanisms.push('Motorized profiling bed adjusts origin to waist height (RNLE Vertical Multiplier: 0.95 vs 0.78).');
  } else if (safeDevices.hospitalBed === 'manual_adjustable') {
    VM = MAPO_PATIENT_HANDLING_PARAMS.equipmentModifiers.manualAdjustableBedVM;
    ergonomicMechanisms.push('Manual adjustable bed reduces vertical trunk flexion (RNLE VM: 0.88).');
  }

  // Asymmetry Multiplier (AM) & Coupling Multiplier (CM): Transfer aids eliminate trunk rotation
  let AM: number = MAPO_PATIENT_HANDLING_PARAMS.equipmentModifiers.standardManualLiftAM;
  let CM: number = MAPO_PATIENT_HANDLING_PARAMS.equipmentModifiers.standardManualLiftCM;
  if (safeDevices.transferAids) {
    AM = MAPO_PATIENT_HANDLING_PARAMS.equipmentModifiers.transferAidsAM;
    CM = MAPO_PATIENT_HANDLING_PARAMS.equipmentModifiers.transferAidsCM;
    ergonomicMechanisms.push('Swivel pivot disc & gait belt eliminate spinal twisting torque and optimize grip coupling (AM=1.0, CM=1.0).');
  }

  const DM = 0.85; // Standard vertical displacement (~50 cm lift)
  // Frequency Multiplier (FM) derived from daily transfer count
  const liftsPerHour = caregiverSoloTransfers / 16.0; // Over 16h waking day
  const FM = Math.max(0.45, Math.min(1.0, 1.0 - liftsPerHour * 0.12));

  const RWL = LC * HM * VM * DM * AM * FM * CM;

  // 4. Actual Patient Load Handled per Transfer Event
  // MAPO effective mass fraction for bed-to-chair transfer is 60% of patient weight
  let effectiveLiftFraction: number = MAPO_PATIENT_HANDLING_PARAMS.effectiveTransferMassFractions.bedToChair;
  if (patient.isBedBound && !patient.katzAdl.transferring) {
    effectiveLiftFraction = 0.50;
  }
  if (isHighBmi) {
    effectiveLiftFraction += 0.05; // Extra inertial bulk resistance
  }

  // Actual load in kg handled during primary lift
  const actualLoadKg = patientWeightKg * effectiveLiftFraction;

  // 5. NIOSH Lifting Index (LI)
  // If no transfers needed (fully independent), LI is nominal 0.2
  let liftingIndex = dailyTransferCount === 0
    ? 0.2
    : Math.round((actualLoadKg / RWL) * 100) / 100;

  if (isTransfersRelievedByStaffOrFamily) {
    liftingIndex = Math.round(liftingIndex * 0.4 * 100) / 100; // 60% load reduction from shared handling
  }

  // 6. Caregiver Physical Constraint Vector & Spinal Compression Estimation
  let caregiverTolerance = 1.0;
  if (caregiver.age >= 65) {
    caregiverTolerance *= MAPO_PATIENT_HANDLING_PARAMS.caregiverToleranceFactors.age65Plus;
  } else if (caregiver.age >= 50) {
    caregiverTolerance *= MAPO_PATIENT_HANDLING_PARAMS.caregiverToleranceFactors.age50To64;
  }

  if (safeHealth.hasBackPain) {
    caregiverTolerance *= MAPO_PATIENT_HANDLING_PARAMS.caregiverToleranceFactors.preExistingBackPainToleranceDiscount;
  }
  if (safeHealth.hasArthritis) {
    caregiverTolerance *= MAPO_PATIENT_HANDLING_PARAMS.caregiverToleranceFactors.peripheralArthritisCouplingDiscount;
  }

  // Sleep interruption penalty on core muscle stabilization
  if (nocturnalSleepInterruptions >= 3.0) {
    caregiverTolerance *= 0.88; // Micro-sleep loss decreases core neuromuscular reaction
  }

  // Estimate L5/S1 spinal compression force in kN (Chaffin & Andersson 1991, Waters 1993):
  // Upper body torso baseline compression ~1.2 kN.
  // Dynamic load moment: (Load * g * moment_arm_0.35m) / (erector_spinae_lever_arm_0.05m * 1000)
  const muscleLeverArmM = 0.05; // 5 cm erector spinae lever arm
  const horizontalMomentArmM = 0.35; // 35 cm horizontal distance from L5/S1
  const loadForceKN = (actualLoadKg * 9.81 * horizontalMomentArmM) / (muscleLeverArmM * 1000);
  let spinalCompressionKN = Math.round((1.2 + loadForceKN / (AM * VM)) * 10) / 10;
  if (isTransfersRelievedByStaffOrFamily) {
    spinalCompressionKN = Math.round((1.2 + (loadForceKN * 0.35) / (AM * VM)) * 10) / 10;
  }

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

  if (nocturnalSleepInterruptions >= 3.0) {
    strainScore += 10;
  }

  if (netCareGapHours > 3.0) {
    strainScore += 10;
  }

  // Apply device discounts to the final strain tally
  let discountPct = 0;
  if (safeDevices.hospitalBed === 'motorized_multichannel') discountPct += 25;
  else if (safeDevices.hospitalBed === 'manual_adjustable') discountPct += 15;
  if (safeDevices.transferAids) discountPct += 15;
  if (safeDevices.wheelchair) discountPct += 10;
  if (safeDevices.airWaterMattress) discountPct += 10;
  discountPct = Math.min(50, discountPct);

  if (discountPct > 0) {
    strainScore = Math.max(10, Math.round(strainScore * (1 - discountPct / 100)));
  }

  const caregiverInjuryRiskScore = Math.min(100, Math.max(10, strainScore));

  // Risk categorization based on Lifting Index and Spinal Compression
  let caregiverInjuryRiskCategory: BiomechanicalAssessmentResult['caregiverInjuryRiskCategory'] = 'low';
  if (liftingIndex >= 3.0 || spinalCompressionKN >= NIOSH_SPINAL_COMPRESSION_MAX_LIMIT_KN || caregiverInjuryRiskScore >= 75) {
    caregiverInjuryRiskCategory = 'severe';
  } else if (liftingIndex >= 2.0 || spinalCompressionKN >= NIOSH_SPINAL_COMPRESSION_ACTION_LIMIT_KN || caregiverInjuryRiskScore >= 55) {
    caregiverInjuryRiskCategory = 'high';
  } else if (liftingIndex >= 1.0 || caregiverInjuryRiskScore >= 30) {
    caregiverInjuryRiskCategory = 'moderate';
  }

  const isSafetyLimitExceeded = liftingIndex > 1.0 || spinalCompressionKN > NIOSH_SPINAL_COMPRESSION_ACTION_LIMIT_KN;

  return {
    liftingIndex,
    spinalCompressionKN,
    dailyTransferCount,
    nocturnalSleepInterruptions,
    caregiverInjuryRiskScore,
    caregiverInjuryRiskCategory,
    isSafetyLimitExceeded,
    ergonomicMechanisms
  };
}
