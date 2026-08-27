/**
 * Sanjeevani Multi-Tier Staffing Recommender Engine
 * 
 * Determines exact clinical skill tier (Nurse vs Medical Assistant vs Attendant vs Family)
 * and diurnal shift window (Targeted 4-6h vs Day 12h vs Night 12h vs 24h Live-in)
 * using a deterministic "enumerate → simulate → rank" optimization method.
 * 
 * Optimization Objective:
 * Minimizes (in order):
 * 1. Unresolved safety-critical diurnal blocks (Night Watch & Morning Rush).
 * 2. Residual net care gap hours (demand vs supply deficit).
 * 3. Caregiver peak biomechanical lifting index (NIOSH RNLE hazard).
 * 4. Out-of-pocket financial burden tier (family-first cost conservation).
 */

import {
  FormalSupportType,
  DiurnalTimeBlock,
  CareTask,
  CaregiverAttributes,
  PatientDependenceProfile,
  CareGapEvaluationResult,
  CareGapEngine
} from './care-gap-engine';
import { MedicationChecker } from './medication-checker';
import { CLINICAL_PROVENANCE, ClinicalProvenance } from './provenance';

export type StaffingSkillTier = 'nurse' | 'physio_assistant' | 'attendant' | 'family';

export type StaffingShiftWindow =
  | 'targeted_morning'
  | 'targeted_evening'
  | 'day_12h'
  | 'night_12h'
  | 'live_in_24h'
  | 'respite_coverage'
  | 'family_schedule';

export type StaffingLadderRung = 'minimum_viable' | 'recommended' | 'optimal';

export interface SimulatedStaffingOption {
  rung: StaffingLadderRung;
  title: string;
  supportType: FormalSupportType | 'family_redistribution';
  shiftWindow: StaffingShiftWindow;
  hoursPerDay: number;
  skillTier: StaffingSkillTier;
  clinicalJustification: string;
  resolvedBlocks: DiurnalTimeBlock[];
  resolvedTasks: string[];
  simulatedResult: {
    netCareGapHours: number;
    careGapIndex: number;
    liftingIndex: number;
    spinalCompressionKN: number;
    caregiverInjuryRiskScore: number;
    caregiverBurnoutRiskLevel: 'low' | 'moderate' | 'high' | 'critical';
    careGapSeverity: 'sustainable' | 'mild_deficit' | 'high_deficit' | 'critical_overload';
  };
  affordabilityFit: string;
  costTierRank: number; // 1 = Family/Zero, 2 = Targeted, 3 = Day 12h, 4 = Night 12h, 5 = 24h Live-in
  rankScore: number;
}

export interface StaffingRecommendationReport {
  provenance: ClinicalProvenance;
  acuityAssessment: {
    dominantSkillTier: StaffingSkillTier;
    clinicalReasons: string[];
    highAcuityProcedures: string[];
    pharmacotherapyRisk: {
      hasHighRiskMeds: boolean;
      acbScore: number;
      stoppTriggers: string[];
    };
  };
  diurnalPattern: {
    deficitBlocks: DiurnalTimeBlock[];
    primaryDeficitWindow: string;
    isSeniorSpouseAloneOvernight: boolean;
  };
  ladder: SimulatedStaffingOption[];
  respiteRecommendation?: {
    respiteDaysPerMonth: number;
    reliefPlan: string;
  };
  evaluatedAt: string;
}

export class StaffingRecommender {
  /**
   * Evaluates dyad clinical acuity and diurnal gap distribution, enumerates candidate
   * staffing models, simulates each through CareGapEngine.evaluate(), and generates
   * a ranked 3-rung staffing prescription ladder.
   */
  static recommend(
    caregiver: CaregiverAttributes,
    patient: PatientDependenceProfile,
    baselineEvaluation?: CareGapEvaluationResult,
    now: Date = new Date()
  ): StaffingRecommendationReport {
    const baseEval = baselineEvaluation || CareGapEngine.evaluate(caregiver, patient, now);
    const safePatient = patient;
    const safeCaregiver = caregiver;

    // -------------------------------------------------------------------------
    // AXIS 1: CLINICAL ACUITY & SKILL TIER (WHO)
    // -------------------------------------------------------------------------
    const clinicalReasons: string[] = [];
    const highAcuityProcedures: string[] = [];

    const conditionsLower = (safePatient.primaryConditions || []).map((c) => c.toLowerCase());
    const hasCondition = (...tokens: string[]) =>
      conditionsLower.some((c) => tokens.some((t) => c.includes(t)));

    // 1. Invasive clinical procedures requiring a Registered Nurse
    const hasWoundOrBedSores = hasCondition('bed sore', 'pressure ulcer', 'wound', 'decubitus', 'dressing');
    const hasCatheterOrStoma = hasCondition('catheter', 'foley', 'stoma', 'colostomy', 'nephrostomy', 'tracheostomy');
    const hasSuction = !!safePatient.assistiveDevices?.suctionApparatus || hasCondition('suction', 'aspiration', 'dysphagia');

    if (hasWoundOrBedSores) {
      highAcuityProcedures.push('Stage 2+ Pressure Ulcer & Sterile Wound Dressing Protocol');
      clinicalReasons.push('Active pressure sores/wounds should be staged and reviewed by a clinician or wound-care nurse.');
    }
    if (hasCatheterOrStoma) {
      highAcuityProcedures.push('Urinary Catheter / Stoma Care & Infection Surveillance');
      clinicalReasons.push('Invasive catheter/stoma maintenance usually requires trained nursing oversight and infection surveillance.');
    }
    if (hasSuction) {
      highAcuityProcedures.push('Bedside Airway Suctioning & Secretion Management');
      clinicalReasons.push('High aspiration risk warrants clinician-led swallowing/airway plan and caregiver training.');
    }

    // 2. Pharmacotherapy & Medication Management Acuity
    const activeMeds = safePatient.currentMedications || [];
    const regEval = MedicationChecker.evaluateRegimen(activeMeds);
    const hasHighRiskMeds =
      regEval.totalAcbScore >= 3 ||
      regEval.stoppTriggers.length > 0 ||
      hasCondition('insulin', 'titration', 'narrow therapeutic', 'chemotherapy', 'warfarin', 'anticoagulation');

    if (hasHighRiskMeds) {
      clinicalReasons.push(
        `High-risk pharmacotherapy screen (ACB Score: ${regEval.totalAcbScore}, STOPP/Beers triggers: ${regEval.stoppTriggers.length}) warrants medication reconciliation.`
      );
    }
    if (!safePatient.lawtonIadl.medicationManagement && activeMeds.length >= 5) {
      clinicalReasons.push('Complex polypharmacy (5+ active formulations) with complete patient administration dependence.');
    }

    // 3. Rehabilitation vs Hands-on Personal Care
    const isRehabDominant =
      (safePatient.fallHistoryLast6Months >= 2 || hasCondition('stroke rehab', 'physiotherapy', 'parkinson rehab', 'gait training')) &&
      baseEval.katzAdlScore >= 4 &&
      !hasWoundOrBedSores &&
      !hasCatheterOrStoma;

    let dominantSkillTier: StaffingSkillTier = 'attendant';
    if (highAcuityProcedures.length > 0 || hasHighRiskMeds) {
      dominantSkillTier = 'nurse';
    } else if (isRehabDominant) {
      dominantSkillTier = 'physio_assistant';
      clinicalReasons.push('Patient is largely ADL-independent (Katz ≥ 4) with dominant need in mobility rehabilitation, gait training, and vital logging.');
    } else {
      dominantSkillTier = 'attendant';
      clinicalReasons.push('Patient needs non-invasive hands-on physical assistance (bathing, toileting, transfers, feeding) without sterile nursing procedures.');
    }

    // -------------------------------------------------------------------------
    // AXIS 2: DIURNAL DEFICIT WINDOW & SHIFT TIMING (WHEN)
    // -------------------------------------------------------------------------
    const blockGaps = baseEval.blockGaps;
    const deficitBlocks: DiurnalTimeBlock[] = [];
    if (blockGaps.morning_rush.gapHours > 0) deficitBlocks.push('morning_rush');
    if (blockGaps.afternoon.gapHours > 0) deficitBlocks.push('afternoon');
    if (blockGaps.evening.gapHours > 0) deficitBlocks.push('evening');
    if (blockGaps.night_watch.gapHours > 0) deficitBlocks.push('night_watch');

    const isSeniorSpouseAloneOvernight =
      safeCaregiver.kinship === 'spouse' &&
      safeCaregiver.age >= 65 &&
      (blockGaps.night_watch.gapHours > 0 || safePatient.isBedBound || safePatient.cognitiveBehavioralLoad === 'severe_sundowning');

    let primaryDeficitWindow = 'Daytime & Morning Transfers';
    if (deficitBlocks.includes('night_watch') && deficitBlocks.length === 1) {
      primaryDeficitWindow = 'Isolated Nocturnal Watch';
    } else if (deficitBlocks.includes('morning_rush') && deficitBlocks.includes('evening') && !deficitBlocks.includes('night_watch')) {
      primaryDeficitWindow = 'Waking Hours (Morning Rush + Evening Peak)';
    } else if (deficitBlocks.length >= 3 || isSeniorSpouseAloneOvernight) {
      primaryDeficitWindow = 'Continuous 24-Hour Supervision';
    }

    // -------------------------------------------------------------------------
    // STEP 3: ENUMERATE CANDIDATES & SIMULATE VIA CareGapEngine.evaluate()
    // -------------------------------------------------------------------------
    interface CandidateConfig {
      title: string;
      supportType: FormalSupportType | 'family_redistribution';
      shiftWindow: StaffingShiftWindow;
      skillTier: StaffingSkillTier;
      hoursPerDay: number;
      affordabilityFit: string;
      costTierRank: number;
      clinicalJustification: string;
      resolvedBlocks: DiurnalTimeBlock[];
      resolvedTasks: string[];
      modifiedCaregiver: CaregiverAttributes;
    }

    const candidates: CandidateConfig[] = [];

    // Candidate 1: Family Task Redistribution (Family First Ethos)
    const secondaryMembers = safeCaregiver.secondaryMembers || [];
    const capableUnconflictedMembers = secondaryMembers.filter(
      (m) => !m.hasPhysicalLimitation && m.age < 60
    );

    if (capableUnconflictedMembers.length > 0) {
      const updatedMembers = secondaryMembers.map((m) => {
        if (!m.hasPhysicalLimitation && m.age < 60) {
          return {
            ...m,
            hoursPerDay: Math.max(m.hoursPerDay || 0, 2.5),
            availableTimeBlocks: ['morning_rush', 'evening'] as DiurnalTimeBlock[],
            assignedTasks: Array.from(new Set([...m.assignedTasks, 'heavy_transfers' as CareTask, 'medications' as CareTask])) as CareTask[]
          };
        }
        return m;
      });

      candidates.push({
        title: 'Family Care Circle Task Redistribution',
        supportType: 'family_redistribution',
        shiftWindow: 'family_schedule',
        skillTier: 'family',
        hoursPerDay: 2.5,
        affordabilityFit: 'Zero Cost / Family Network Optimization',
        costTierRank: 1,
        clinicalJustification: 'Draft option: delegate morning transfer support and evening medication reminders across capable adult family members, with clinician/pharmacist review for medication administration tasks.',
        resolvedBlocks: ['morning_rush', 'evening'],
        resolvedTasks: ['Morning Bed-to-Chair Transfer', 'Evening Medication Dispensing', 'Dietary Prep'],
        modifiedCaregiver: {
          ...safeCaregiver,
          secondaryMembers: updatedMembers,
          formalSupport: undefined
        }
      });
    }

    // Candidate 2: Targeted 4h-6h Part-Time Helper (Morning Rush or Evening Window)
    if (deficitBlocks.includes('morning_rush') || deficitBlocks.includes('afternoon') || deficitBlocks.includes('evening') || deficitBlocks.length === 0) {
      const targetedHours = 4;
      const targetedType: FormalSupportType = dominantSkillTier === 'nurse' ? 'trained_nurse_12h' : 'paid_attendant_12h';
      candidates.push({
        title: dominantSkillTier === 'nurse' ? 'Targeted Morning Clinical Nurse Visit (4h)' : 'Targeted Morning / Evening Attendant (4h)',
        supportType: targetedType,
        shiftWindow: 'targeted_morning',
        skillTier: dominantSkillTier,
        hoursPerDay: targetedHours,
        affordabilityFit: 'Affordable Entry / ₹8,000 - ₹12,000/mo',
        costTierRank: 2,
        clinicalJustification: 'Draft option: targets peak transfer, bathing, and morning medication routine without incurring full 12h or 24h staffing expense.',
        resolvedBlocks: ['morning_rush'],
        resolvedTasks: ['Sponge Bathing', 'Bed-to-Chair Transfer', 'Morning Vitals & Medication Dispensing'],
        modifiedCaregiver: {
          ...safeCaregiver,
          formalSupport: {
            type: targetedType,
            hoursPerDay: targetedHours,
            handlesHeavyTransfers: true,
            handlesMedicationWoundCare: dominantSkillTier === 'nurse'
          }
        }
      });
    }

    // Candidate 3: Day 12h Shift (Nurse or Attendant)
    if (deficitBlocks.includes('morning_rush') || deficitBlocks.includes('afternoon') || deficitBlocks.includes('evening')) {
      const dayType: FormalSupportType = dominantSkillTier === 'nurse' ? 'trained_nurse_12h' : 'paid_attendant_12h';
      candidates.push({
        title: dominantSkillTier === 'nurse' ? 'Day 12h Certified Geriatric Nurse (08:00 - 20:00)' : 'Day 12h Trained Attendant / Ayah (08:00 - 20:00)',
        supportType: dayType,
        shiftWindow: 'day_12h',
        skillTier: dominantSkillTier,
        hoursPerDay: 12,
        affordabilityFit: 'Moderate / ₹16,000 - ₹24,000/mo',
        costTierRank: 3,
        clinicalJustification: 'Draft option: daytime coverage for morning rush, lunch feeding, afternoon mobility, and evening dinner prep, supporting primary caregiver employment.',
        resolvedBlocks: ['morning_rush', 'afternoon', 'evening'],
        resolvedTasks: ['Full ADL Assistance', 'Transfer Support', 'Meal Assistance', 'Wound Dressing & Vitals'],
        modifiedCaregiver: {
          ...safeCaregiver,
          formalSupport: {
            type: dayType,
            hoursPerDay: 12,
            handlesHeavyTransfers: true,
            handlesMedicationWoundCare: dominantSkillTier === 'nurse'
          }
        }
      });
    }

    // Candidate 4: Medical Assistant / Physio Aide (if rehab dominant)
    if (dominantSkillTier === 'physio_assistant' || safePatient.fallHistoryLast6Months >= 1) {
      candidates.push({
        title: 'Visiting Medical Assistant & Physiotherapy Aide (6h)',
        supportType: 'medical_assistant',
        shiftWindow: 'targeted_morning',
        skillTier: 'physio_assistant',
        hoursPerDay: 6,
        affordabilityFit: 'Targeted Clinical / ₹14,000 - ₹18,000/mo',
        costTierRank: 2,
        clinicalJustification: 'Draft option: supervised gait training, fall-prevention exercise practice, vital sign logging, and therapeutic repositioning.',
        resolvedBlocks: ['morning_rush', 'afternoon'],
        resolvedTasks: ['Gait Training', 'Fall Prevention Exercises', 'Vital Monitoring'],
        modifiedCaregiver: {
          ...safeCaregiver,
          formalSupport: {
            type: 'medical_assistant',
            hoursPerDay: 6,
            handlesHeavyTransfers: false,
            handlesMedicationWoundCare: false
          }
        }
      });
    }

    // Candidate 5: Night 12h Dedicated Watch (Nocturnal Incontinence / Sundowning)
    if (deficitBlocks.includes('night_watch') || isSeniorSpouseAloneOvernight || safePatient.isBedBound) {
      const nightType: FormalSupportType = dominantSkillTier === 'nurse' ? 'trained_nurse_24h' : 'paid_attendant_24h';
      candidates.push({
        title: 'Dedicated Night 12h Sleep Guard / Attendant (20:00 - 08:00)',
        supportType: nightType,
        shiftWindow: 'night_12h',
        skillTier: dominantSkillTier,
        hoursPerDay: 12,
        affordabilityFit: 'Focused Night Security / ₹18,000 - ₹25,000/mo',
        costTierRank: 4,
        clinicalJustification: 'Draft option: protects caregiver sleep by covering individualized repositioning, nocturnal continence care, and sundowning/wandering supervision.',
        resolvedBlocks: ['night_watch', 'morning_rush'],
        resolvedTasks: ['2-Hourly Pressure Sore Repositioning', 'Nocturnal Diaper Changes', 'Sundowning Agitation Containment'],
        modifiedCaregiver: {
          ...safeCaregiver,
          rotationPolicy: {
            ...(safeCaregiver.rotationPolicy || {
              rotationInterval: 'biweekly',
              primaryCaregiverRespiteDaysPerMonth: 4,
              weekendShiftLeader: 'Family Rotation'
            }),
            nightShiftArrangement: 'formal_night_nurse'
          },
          formalSupport: {
            type: nightType,
            hoursPerDay: 12,
            handlesHeavyTransfers: true,
            handlesMedicationWoundCare: dominantSkillTier === 'nurse'
          }
        }
      });
    }

    // Candidate 6: 24h Live-in Support (Nurse or Attendant)
    const liveInType: FormalSupportType = dominantSkillTier === 'nurse' ? 'trained_nurse_24h' : 'paid_attendant_24h';
    candidates.push({
      title: dominantSkillTier === 'nurse' ? '24h Live-in Certified Nursing Officer (ICU-Trained)' : '24h Live-in Attendant / Ayah (Complete Household Coverage)',
      supportType: liveInType,
      shiftWindow: 'live_in_24h',
      skillTier: dominantSkillTier,
      hoursPerDay: 24,
      affordabilityFit: 'Comprehensive Live-in / ₹32,000 - ₹45,000/mo',
      costTierRank: 5,
      clinicalJustification: 'Draft option: broad day-and-night support for high-dependency care needs such as bed-bound care, severe cognitive-behavioral symptoms, airway plan support, and total ADL assistance.',
      resolvedBlocks: ['morning_rush', 'afternoon', 'evening', 'night_watch'],
      resolvedTasks: ['Continuous Patient Handling', 'Airway / Wound Protocol', '24h Vigilance', 'Total ADL Relief'],
      modifiedCaregiver: {
        ...safeCaregiver,
        formalSupport: {
          type: liveInType,
          hoursPerDay: 24,
          handlesHeavyTransfers: true,
          handlesMedicationWoundCare: dominantSkillTier === 'nurse'
        }
      }
    });

    // -------------------------------------------------------------------------
    // STEP 4: SIMULATE & SCORE CANDIDATES
    // -------------------------------------------------------------------------
    const simulatedCandidates = candidates.map((cand) => {
      const sim = CareGapEngine.evaluate(cand.modifiedCaregiver, safePatient, now);

      // Multi-Criterion Optimization Function:
      // Minimize: (1) Unresolved safety blocks -> (2) Residual gap -> (3) Lifting Index -> (4) Cost Rank
      const unresolvedNightGap = sim.blockGaps.night_watch.gapHours > 0 ? 120 : 0;
      const unresolvedMorningGap = sim.blockGaps.morning_rush.gapHours > 0 ? 60 : 0;
      const safetyPenalty = unresolvedNightGap + unresolvedMorningGap;

      const gapPenalty = sim.netCareGapHours * 15;
      const ergonomicPenalty = sim.liftingIndex * 25;
      const costPenalty = cand.costTierRank * 8;

      const rankScore = Math.round(safetyPenalty + gapPenalty + ergonomicPenalty + costPenalty);

      return {
        ...cand,
        simulatedResult: {
          netCareGapHours: sim.netCareGapHours,
          careGapIndex: sim.careGapIndex,
          liftingIndex: sim.liftingIndex,
          spinalCompressionKN: sim.spinalCompressionKN,
          caregiverInjuryRiskScore: sim.caregiverInjuryRiskScore,
          caregiverBurnoutRiskLevel: sim.caregiverBurnoutRiskLevel,
          careGapSeverity: sim.careGapSeverity
        },
        rankScore
      };
    });

    // Sort ascending by rankScore (lowest penalty = best fit)
    simulatedCandidates.sort((a, b) => a.rankScore - b.rankScore);

    // -------------------------------------------------------------------------
    // STEP 5: ASSIGN 3-RUNG LADDER (minimum_viable, recommended, optimal)
    // -------------------------------------------------------------------------
    // 1. Minimum Viable: Lowest cost candidate that reduces acute deficit/burnout (family-first)
    const minViableCand = simulatedCandidates
      .filter((c) => c.costTierRank <= 2 || c.supportType === 'family_redistribution')
      .sort((a, b) => a.costTierRank - b.costTierRank)[0] || simulatedCandidates[0];

    // 2. Recommended: Best overall clinical and ergonomic score (rankScore leader)
    const recommendedCand = simulatedCandidates[0];

    // 3. Optimal: Maximum clinical and ergonomic protection (lowest residual gap and lowest lifting index)
    const optimalCand = [...simulatedCandidates].sort((a, b) => {
      if (a.simulatedResult.netCareGapHours !== b.simulatedResult.netCareGapHours) {
        return a.simulatedResult.netCareGapHours - b.simulatedResult.netCareGapHours;
      }
      return a.simulatedResult.liftingIndex - b.simulatedResult.liftingIndex;
    })[0];

    const ladder: SimulatedStaffingOption[] = [
      {
        ...minViableCand,
        rung: 'minimum_viable'
      },
      {
        ...recommendedCand,
        rung: 'recommended'
      },
      {
        ...optimalCand,
        rung: 'optimal'
      }
    ];

    // Deduplicate ladder entries if recommended and optimal coincide
    if (ladder[1].title === ladder[2].title && simulatedCandidates.length > 2) {
      const altOptimal = simulatedCandidates.find((c) => c.title !== ladder[1].title);
      if (altOptimal) {
        ladder[2] = { ...altOptimal, rung: 'optimal' };
      }
    }

    // Respite Care Recommendation
    let respiteRecommendation: StaffingRecommendationReport['respiteRecommendation'] = undefined;
    const respiteDays = safeCaregiver.rotationPolicy?.primaryCaregiverRespiteDaysPerMonth ?? 0;
    if (respiteDays > 0) {
      respiteRecommendation = {
        respiteDaysPerMonth: respiteDays,
        reliefPlan: `Deploy temporary relief attendant/nurse specifically for ${respiteDays} designated respite days/month to allow full caregiver physical and psychological recovery without recurring daily overhead.`
      };
    }

    return {
      provenance: CLINICAL_PROVENANCE.staffingHeuristic,
      acuityAssessment: {
        dominantSkillTier,
        clinicalReasons,
        highAcuityProcedures,
        pharmacotherapyRisk: {
          hasHighRiskMeds,
          acbScore: regEval.totalAcbScore,
          stoppTriggers: regEval.stoppTriggers
        }
      },
      diurnalPattern: {
        deficitBlocks,
        primaryDeficitWindow,
        isSeniorSpouseAloneOvernight
      },
      ladder,
      respiteRecommendation,
      evaluatedAt: now.toISOString()
    };
  }
}
