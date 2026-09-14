/**
 * Sanjeevani Discharge-to-Home Operating System
 *
 * Core engine for:
 * 1. Home Readiness Safety Gate ("Day 0 Blockers")
 * 2. First 72 Hours Operational Execution Protocol
 * 3. 2-Layer Caregiver Resilience & Pulse Tracker
 * 4. Closed-Loop Actionable Alert Model
 * 5. Proactive Respite Recommendation Engine
 *
 * Note: Medical discharge eligibility is established by the clinician in consonance
 * with the primary caregiver. This engine accepts the discharge order as an authoritative
 * baseline and evaluates domestic safety, operational viability, and caregiver capacity.
 */

// ==========================================
// 1. HOME READINESS SAFETY GATE & DAY 0
// ==========================================

export interface HomeInfrastructure {
  hasGroundFloorOrLift: boolean;
  hasAttachedOrNearbyBathroom: boolean;
  hasContinuousWaterSupply: boolean;
  hasPowerBackupForEquipment: boolean;
  hasReliableMobileNetwork: boolean;
  distanceToHospitalKm: number;
  ambulanceAccessConfirmed: boolean;
}

export interface EquipmentStatus {
  hospitalBedDelivered: boolean;
  airOrWaterMattressInflated: boolean;
  wheelchairOrCommodeAvailable: boolean;
  transferAidsAvailable: boolean; // gait belt, slide board
  suctionMachineAvailable?: boolean;
  oxygenConcentratorAvailable?: boolean;
  nebulizerAvailable?: boolean;
}

export interface Day0MedicationStatus {
  allDischargeMedsAcquired: boolean;
  firstHomeDoseTimetableConfirmed: boolean;
  refrigerationAvailableIfRequired: boolean;
  specializedSuppliesInHand: boolean; // insulin needles, dressing packs, catheter bags
}

export interface NightCaregiverCommitment {
  confirmedCaregiverName: string;
  relationship: 'spouse' | 'child' | 'sibling' | 'relative' | 'paid_attendant' | 'paid_nurse';
  isOvernightPresent: boolean;
  hasPhysicalCapacityForTransfers: boolean;
  hasReceivedBedsideHandover: boolean;
}

export interface HomeReadinessInput {
  patientName: string;
  patientIsBedBound: boolean;
  patientFallRiskHigh: boolean;
  requiresSkilledNursing: boolean; // wound, catheter, RT feed, oxygen
  requiresNightRepositioning: boolean;
  infrastructure: HomeInfrastructure;
  equipment: EquipmentStatus;
  medications: Day0MedicationStatus;
  nightCaregiver: NightCaregiverCommitment;
  verifiedBy: string; // e.g. "Staff Nurse Sunita / Medical Social Worker"
}

export type BlockerSeverity = 'critical_blocker' | 'high_caution' | 'moderate_advisory';

export interface Day0Blocker {
  id: string;
  category: 'infrastructure' | 'equipment' | 'medication' | 'caregiver' | 'safety';
  severity: BlockerSeverity;
  title: string;
  description: string;
  remediationAction: string;
}

export interface HomeReadinessEvaluation {
  status: 'safe_to_transition' | 'caution_remediation_needed' | 'safety_blocked';
  summary: string;
  canSafelyAdmitTonight: boolean;
  blockers: Day0Blocker[];
  criticalBlockerCount: number;
  cautionCount: number;
  clinicalEscalationRecommendation?: string;
  evaluatedAt: string;
}

export class HomeReadinessEngine {
  public static evaluate(input: HomeReadinessInput): HomeReadinessEvaluation {
    const blockers: Day0Blocker[] = [];

    // 1. Night Caregiver Safety Check
    if (!input.nightCaregiver.isOvernightPresent) {
      blockers.push({
        id: 'no_night_caregiver',
        category: 'caregiver',
        severity: 'critical_blocker',
        title: 'No Overnight Caregiver Confirmed for Night 1',
        description: 'No verified individual is committed to stay overnight with the patient on the first night of discharge.',
        remediationAction: 'Arrange a family rotation shift or urgent 12h night attendant before patient leaves hospital.'
      });
    } else if (input.patientIsBedBound && !input.nightCaregiver.hasPhysicalCapacityForTransfers) {
      blockers.push({
        id: 'caregiver_physical_inability',
        category: 'caregiver',
        severity: 'critical_blocker',
        title: 'Overnight Caregiver Cannot Safely Perform Transfers / Turns',
        description: 'The assigned overnight caregiver lacks the physical capacity or health to perform necessary repositioning or emergency transfers.',
        remediationAction: 'Assign a second able-bodied family member or deploy a trained GDA (attendant) for transfer assistance.'
      });
    }

    if (!input.nightCaregiver.hasReceivedBedsideHandover) {
      blockers.push({
        id: 'missing_bedside_handover',
        category: 'caregiver',
        severity: 'high_caution',
        title: 'Bedside Care Handover Incomplete',
        description: 'Primary caregiver has not received physical demonstration of bedside care, turning, or emergency red flags.',
        remediationAction: 'Complete in-person ward nursing handover prior to releasing discharge packet.'
      });
    }

    // 2. Equipment Check
    if (input.patientIsBedBound && !input.equipment.hospitalBedDelivered) {
      blockers.push({
        id: 'hospital_bed_missing',
        category: 'equipment',
        severity: 'critical_blocker',
        title: 'Motorized / Multi-Position Hospital Bed Not Delivered',
        description: 'A bed-bound dependent patient cannot be safely managed on a standard low domestic mattress without severe caregiver back strain and fall risk.',
        remediationAction: 'Confirm delivery and installation receipt from medical equipment vendor before dispatching ambulance.'
      });
    }

    if (input.patientIsBedBound && !input.equipment.airOrWaterMattressInflated) {
      blockers.push({
        id: 'air_mattress_missing',
        category: 'equipment',
        severity: 'high_caution',
        title: 'Pressure-Relief Alternating Air Mattress Not Installed',
        description: 'Immobilized patient is at extreme risk of developing Stage I-II sacral decubitus ulcer within 48 hours without pressure redistribution.',
        remediationAction: 'Inflate and verify alternating pressure cell cycle on bed before transferring patient.'
      });
    }

    if (input.patientFallRiskHigh && !input.equipment.transferAidsAvailable) {
      blockers.push({
        id: 'transfer_aids_missing',
        category: 'equipment',
        severity: 'high_caution',
        title: 'Transfer Aids / Gait Belt Missing',
        description: 'High fall risk patient requires mechanical transfer support or gait belt to protect both patient and carer during transfers.',
        remediationAction: 'Provide gait belt and transfer slide board kit from hospital store.'
      });
    }

    // 3. Medication & Supply Checks
    if (!input.medications.allDischargeMedsAcquired) {
      blockers.push({
        id: 'meds_not_acquired',
        category: 'medication',
        severity: 'critical_blocker',
        title: 'Discharge Medications Not Physically in Hand',
        description: 'Crucial acute discharge medicines (anticoagulants, antiepileptics, cardiac drugs, or antibiotics) have not been procured for Day 0.',
        remediationAction: 'Dispense mandatory 72-hour discharge pharmacy kit before vehicle departure.'
      });
    }

    if (!input.medications.firstHomeDoseTimetableConfirmed) {
      blockers.push({
        id: 'first_dose_unclear',
        category: 'medication',
        severity: 'high_caution',
        title: 'First Home Dose Schedule Not Reconciled',
        description: 'Caregiver is uncertain whether the next scheduled dose was given in the hospital ward or is due upon arriving home.',
        remediationAction: 'Staff nurse must mark exact clock times (e.g. 18:00 or 21:00) on physical medication envelope.'
      });
    }

    // 4. Infrastructure Checks
    if (!input.infrastructure.hasAttachedOrNearbyBathroom && !input.equipment.wheelchairOrCommodeAvailable) {
      blockers.push({
        id: 'toileting_inaccessible',
        category: 'infrastructure',
        severity: 'critical_blocker',
        title: 'Bathroom Inaccessible & No Bedside Commode Available',
        description: 'Patient cannot ambulate to bathroom and no portable commode chair has been arranged.',
        remediationAction: 'Arrange bedside commode chair or diaper sanitation protocol immediately.'
      });
    }

    if (!input.infrastructure.hasPowerBackupForEquipment && (input.equipment.oxygenConcentratorAvailable || input.equipment.suctionMachineAvailable)) {
      blockers.push({
        id: 'no_power_backup_critical',
        category: 'infrastructure',
        severity: 'critical_blocker',
        title: 'No Electrical Backup for Life-Support Equipment (O2/Suction)',
        description: 'Medical devices require uninterrupted power; frequent grid outages pose asphyxiation or desaturation hazards.',
        remediationAction: 'Provide backup oxygen cylinder (B/D type) with manual regulator or ensure inverter line.'
      });
    }

    // Calculate status
    const criticalCount = blockers.filter((b) => b.severity === 'critical_blocker').length;
    const cautionCount = blockers.filter((b) => b.severity === 'high_caution').length;

    let status: HomeReadinessEvaluation['status'] = 'safe_to_transition';
    let canSafelyAdmitTonight = true;
    let clinicalRecommendation: string | undefined = undefined;

    if (criticalCount > 0) {
      status = 'safety_blocked';
      canSafelyAdmitTonight = false;
      clinicalRecommendation =
        'CRITICAL HOME SAFETY BLOCK: The home environment or care staffing cannot support this patient tonight. Recommend delaying discharge by 24 hours or arranging a short-stay transitional rehabilitation/step-down facility.';
    } else if (cautionCount > 0) {
      status = 'caution_remediation_needed';
      canSafelyAdmitTonight = true;
      clinicalRecommendation =
        'CONDITIONAL TRANSITION: Patient may discharge once high-priority caution items (e.g. bedside handover, air mattress setup) are closed out by the primary nurse.';
    }

    const summary =
      criticalCount === 0 && cautionCount === 0
        ? 'Home is fully verified and prepared for safe patient arrival.'
        : `${criticalCount} critical blocker(s) and ${cautionCount} caution advisory item(s) detected.`;

    return {
      status,
      summary,
      canSafelyAdmitTonight,
      blockers,
      criticalBlockerCount: criticalCount,
      cautionCount,
      clinicalEscalationRecommendation: clinicalRecommendation,
      evaluatedAt: new Date().toISOString()
    };
  }
}

// ==========================================
// 2. FIRST 72 HOURS EXECUTION PROTOCOL
// ==========================================

export type MilestonePhase = 'phase_0_pre_arrival' | 'phase_1_first_24h' | 'phase_2_48_to_72h';
export type MilestoneStatus = 'pending' | 'completed' | 'overdue' | 'escalated';

export interface MilestoneTask {
  id: string;
  phase: MilestonePhase;
  dueWindowHours: string; // e.g. "Within 2h of arrival", "Hour 6", "Hour 24"
  title: string;
  description: string;
  accountableRole: 'family_lead' | 'ward_nurse' | 'home_attendant' | 'home_nurse' | 'treating_doctor';
  assignedPersonName: string;
  status: MilestoneStatus;
  isCritical: boolean;
  completedAt?: string;
  completionProofNotes?: string;
  escalationDeadlineMinutes: number; // if overdue by X minutes, fire alert
}

export function getDefaultFirst72HoursProtocol(patientName: string, primaryCaregiverName: string): MilestoneTask[] {
  return [
    // Phase 0: Pre-Arrival & Departure Handover
    {
      id: 'm0_handover_signs',
      phase: 'phase_0_pre_arrival',
      dueWindowHours: 'At Discharge Gate',
      title: 'Discharge Pack Handover & Red-Flag Review',
      description: 'Nurse reviews red flag escalation card with caregiver (fever, breathlessness, sudden weakness, altered sensorium).',
      accountableRole: 'ward_nurse',
      assignedPersonName: 'Ward Staff Nurse',
      status: 'pending',
      isCritical: true,
      escalationDeadlineMinutes: 60
    },
    {
      id: 'm0_bed_ready',
      phase: 'phase_0_pre_arrival',
      dueWindowHours: '2h Before Arrival',
      title: 'Home Room & Equipment Readiness Verification',
      description: 'Confirm bed is dressed, mattress powered, pathways unobstructed, and water/commode within reach.',
      accountableRole: 'family_lead',
      assignedPersonName: primaryCaregiverName,
      status: 'pending',
      isCritical: true,
      escalationDeadlineMinutes: 120
    },

    // Phase 1: First 24 Hours
    {
      id: 'm1_first_dose',
      phase: 'phase_1_first_24h',
      dueWindowHours: 'Within 4h of Arrival',
      title: 'First Home Medication Dose Reconciled & Administered',
      description: 'Check discharge envelope; verify and administer the first home dose accurately on time.',
      accountableRole: 'family_lead',
      assignedPersonName: primaryCaregiverName,
      status: 'pending',
      isCritical: true,
      escalationDeadlineMinutes: 90
    },
    {
      id: 'm1_baseline_vitals',
      phase: 'phase_1_first_24h',
      dueWindowHours: 'Within 6h of Arrival',
      title: 'Home Baseline Vitals & Sensorium Check',
      description: 'Record baseline Blood Pressure, Pulse, SpO2, and confirm patient recognizes surroundings (delirium screening).',
      accountableRole: 'family_lead',
      assignedPersonName: primaryCaregiverName,
      status: 'pending',
      isCritical: false,
      escalationDeadlineMinutes: 180
    },
    {
      id: 'm1_turning_hydration',
      phase: 'phase_1_first_24h',
      dueWindowHours: 'Ongoing (Q2H)',
      title: 'Establish 2-Hourly Lateral Repositioning & Fluid Protocol',
      description: 'Rotate 30° left/right oblique position using wedge pillows; offer prescribed sips or enteral feed.',
      accountableRole: 'home_attendant',
      assignedPersonName: 'Primary Caregiver / Attendant',
      status: 'pending',
      isCritical: true,
      escalationDeadlineMinutes: 120
    },
    {
      id: 'm1_night1_safety',
      phase: 'phase_1_first_24h',
      dueWindowHours: '22:00 Night 1',
      title: 'Night 1 Sleep & Fall Protection Check',
      description: 'Bed rails up, night lamp illuminated, commode placed safely, caregiver in adjoining room or bedside.',
      accountableRole: 'family_lead',
      assignedPersonName: primaryCaregiverName,
      status: 'pending',
      isCritical: true,
      escalationDeadlineMinutes: 60
    },

    // Phase 2: 48 - 72 Hours
    {
      id: 'm2_pulse_check',
      phase: 'phase_2_48_to_72h',
      dueWindowHours: 'Hour 36 - 48',
      title: 'Caregiver Resilience & Night Burden Pulse Check',
      description: 'Complete 60-second pulse check on caregiver sleep, back strain, and willingness to sustain routine.',
      accountableRole: 'family_lead',
      assignedPersonName: primaryCaregiverName,
      status: 'pending',
      isCritical: true,
      escalationDeadlineMinutes: 240
    },
    {
      id: 'm2_doctor_nurse_telecall',
      phase: 'phase_2_48_to_72h',
      dueWindowHours: 'Hour 48 - 72',
      title: 'Clinical Follow-up Call (Doctor / Transition Nurse)',
      description: 'Review medication tolerance, bowel/bladder regulation, wound condition, and caregiver confidence.',
      accountableRole: 'treating_doctor',
      assignedPersonName: 'Tele-Transition Clinician',
      status: 'pending',
      isCritical: true,
      escalationDeadlineMinutes: 360
    },
    {
      id: 'm2_skin_integrity',
      phase: 'phase_2_48_to_72h',
      dueWindowHours: 'Hour 72',
      title: 'Full Sacral & Heel Skin Integrity Inspection',
      description: 'Check pressure points (sacrum, trochanters, heels) for non-blanching erythema (Stage I ulcer check).',
      accountableRole: 'home_nurse',
      assignedPersonName: 'Visiting Nurse / Caregiver',
      status: 'pending',
      isCritical: true,
      escalationDeadlineMinutes: 180
    }
  ];
}

// ==========================================
// 3. 2-LAYER CAREGIVER RESILIENCE ENGINE
// ==========================================

export interface CaregiverOperationalPulse {
  id: string;
  caregiverName: string;
  timestamp: string;
  hoursOfSleepLastNight: number;
  sleepDisruptedByCareCalls: boolean;
  canContinueCaregivingToday: 'yes_confidently' | 'yes_with_difficulty' | 'cannot_continue_need_urgent_help';
  physicalStrainScore: number; // 0 (none) to 10 (incapacitating back/body pain)
  confidenceScore: number; // 1 (panicked/helpless) to 5 (fully in control)
  didScheduledHelpArrive: 'yes_on_time' | 'arrived_late' | 'did_not_show_up' | 'no_help_planned';
  notes?: string;
}

export type AlertSeverityTier = 'watch' | 'review_today' | 'urgent_escalation';

export interface OperationalAlert {
  id: string;
  tier: AlertSeverityTier;
  title: string;
  description: string;
  assignedOwnerRole: 'family_spokesperson' | 'visiting_nurse' | 'treating_doctor' | 'care_coordinator';
  slaMinutes: number;
  createdAt: string;
  status: 'open' | 'acknowledged' | 'resolved';
  closureAction?: string;
  resolvedAt?: string;
}

export class CaregiverResilienceEngine {
  public static evaluatePulse(pulse: CaregiverOperationalPulse): {
    resilienceStatus: 'sustainable' | 'strained' | 'crisis';
    alertTriggered?: OperationalAlert;
    respitePrescriptionNeeded: boolean;
    clinicalSummary: string;
  } {
    // 1. Critical Crisis Triggers
    if (pulse.canContinueCaregivingToday === 'cannot_continue_need_urgent_help') {
      return {
        resilienceStatus: 'crisis',
        respitePrescriptionNeeded: true,
        clinicalSummary: 'Caregiver has declared immediate inability to continue care tonight. Acute breakdown risk.',
        alertTriggered: {
          id: `alert_crisis_${Date.now()}`,
          tier: 'urgent_escalation',
          title: 'Caregiver Imminent Collapse / Care Abandonment Risk',
          description: `${pulse.caregiverName} reported inability to continue care today. Immediate shift relief required.`,
          assignedOwnerRole: 'care_coordinator',
          slaMinutes: 60,
          createdAt: new Date().toISOString(),
          status: 'open'
        }
      };
    }

    if (pulse.hoursOfSleepLastNight < 3.5 || pulse.physicalStrainScore >= 8) {
      return {
        resilienceStatus: 'crisis',
        respitePrescriptionNeeded: true,
        clinicalSummary: `Severe sleep deprivation (<3.5h) or severe physical pain (${pulse.physicalStrainScore}/10). High risk of transfer injury or delirium in patient.`,
        alertTriggered: {
          id: `alert_severe_strain_${Date.now()}`,
          tier: 'urgent_escalation',
          title: 'Severe Caregiver Exhaustion / High Injury Hazard',
          description: `Caregiver slept only ${pulse.hoursOfSleepLastNight}h with strain rating ${pulse.physicalStrainScore}/10. Urgent overnight or transfer relief indicated.`,
          assignedOwnerRole: 'treating_doctor',
          slaMinutes: 120,
          createdAt: new Date().toISOString(),
          status: 'open'
        }
      };
    }

    // 2. Review Today Triggers
    if (
      pulse.hoursOfSleepLastNight <= 5 ||
      pulse.physicalStrainScore >= 6 ||
      pulse.canContinueCaregivingToday === 'yes_with_difficulty' ||
      pulse.didScheduledHelpArrive === 'did_not_show_up'
    ) {
      const reason =
        pulse.didScheduledHelpArrive === 'did_not_show_up'
          ? 'Scheduled attendant failed to show up, leaving family stranded with sole burden.'
          : 'Caregiver reporting moderate physical strain, compromised sleep, and struggling to sustain routine.';

      return {
        resilienceStatus: 'strained',
        respitePrescriptionNeeded: true,
        clinicalSummary: reason,
        alertTriggered: {
          id: `alert_review_${Date.now()}`,
          tier: 'review_today',
          title: 'Caregiver Strain Warning — Review Shift Allocation Today',
          description: reason,
          assignedOwnerRole: 'care_coordinator',
          slaMinutes: 360,
          createdAt: new Date().toISOString(),
          status: 'open'
        }
      };
    }

    // 3. Watch Triggers
    if (pulse.confidenceScore <= 2 || pulse.sleepDisruptedByCareCalls) {
      return {
        resilienceStatus: 'strained',
        respitePrescriptionNeeded: false,
        clinicalSummary: 'Caregiver expressing low procedural confidence or mild nocturnal sleep disruption.',
        alertTriggered: {
          id: `alert_watch_${Date.now()}`,
          tier: 'watch',
          title: 'Watch: Low Caregiver Confidence / Nocturnal Anxiety',
          description: 'Offer nurse video demonstration and review night repositioning protocol.',
          assignedOwnerRole: 'visiting_nurse',
          slaMinutes: 720,
          createdAt: new Date().toISOString(),
          status: 'open'
        }
      };
    }

    // Healthy
    return {
      resilienceStatus: 'sustainable',
      respitePrescriptionNeeded: false,
      clinicalSummary: 'Caregiver reports sustainable sleep, manageable physical load, and good confidence.'
    };
  }
}

// ==========================================
// 4. PROACTIVE RESPITE RECOMMENDATION ENGINE
// ==========================================

export interface RespitePrescription {
  id: string;
  prescriptionType: 'daytime_relief_blocks' | 'overnight_sleep_shifts' | 'temporary_12h_attendant' | 'full_24h_respite_week';
  headline: string;
  scheduleProposal: string;
  clinicalRationale: string;
  estimatedHoursReliefPerWeek: number;
  doctorApprovalRequired: boolean;
  status: 'drafted_by_engine' | 'approved_by_doctor' | 'accepted_by_family' | 'declined';
}

export class RespiteEngine {
  public static generateRecommendation(
    pulse: CaregiverOperationalPulse,
    patientIsBedBound: boolean,
    uncoveredNightHours: number
  ): RespitePrescription {
    if (pulse.canContinueCaregivingToday === 'cannot_continue_need_urgent_help' || pulse.hoursOfSleepLastNight < 4) {
      return {
        id: `respite_rx_${Date.now()}`,
        prescriptionType: 'overnight_sleep_shifts',
        headline: 'Prescription: 3 Consecutive Overnight Relief Shifts (22:00 – 06:00)',
        scheduleProposal: 'Deploy a certified night attendant for 3 nights this week to allow primary caregiver 8 hours of uninterrupted sleep restoration.',
        clinicalRationale: 'Caregiver nocturnal sleep debt <4h impairs alertness, sharply increasing patient fall risk and caregiver medical morbidity.',
        estimatedHoursReliefPerWeek: 24,
        doctorApprovalRequired: true,
        status: 'drafted_by_engine'
      };
    }

    if (patientIsBedBound && pulse.physicalStrainScore >= 6) {
      return {
        id: `respite_rx_${Date.now()}`,
        prescriptionType: 'temporary_12h_attendant',
        headline: 'Prescription: Temporary 12-Hour Day Attendant Cover for 7 Days',
        scheduleProposal: 'Provide morning and midday shift (08:00 – 20:00) attendant to handle all heavy bed transfers, sponge bathing, and turning.',
        clinicalRationale: `Caregiver physical strain (${pulse.physicalStrainScore}/10) indicates imminent lumbar/musculoskeletal breakdown during bed transfers.`,
        estimatedHoursReliefPerWeek: 84,
        doctorApprovalRequired: true,
        status: 'drafted_by_engine'
      };
    }

    if (uncoveredNightHours > 0) {
      return {
        id: `respite_rx_${Date.now()}`,
        prescriptionType: 'overnight_sleep_shifts',
        headline: 'Prescription: Night Watch Attendant Coverage',
        scheduleProposal: `Formalize night shift cover to bridge the ${uncoveredNightHours}-hour uncovered repositioning block.`,
        clinicalRationale: 'Uncovered night hours in bed-bound care results in either decubitus ulcers or unviable caregiver sleep fragmentation.',
        estimatedHoursReliefPerWeek: uncoveredNightHours * 7,
        doctorApprovalRequired: true,
        status: 'drafted_by_engine'
      };
    }

    return {
      id: `respite_rx_${Date.now()}`,
      prescriptionType: 'daytime_relief_blocks',
      headline: 'Prescription: Two 6-Hour Scheduled Respite Blocks This Week',
      scheduleProposal: 'Schedule two afternoon blocks (12:00 – 18:00) covered by secondary family member or visiting respite attendant.',
      clinicalRationale: 'Prophylactic respite prevents gradual burnout and maintains psychological stamina.',
      estimatedHoursReliefPerWeek: 12,
      doctorApprovalRequired: false,
      status: 'drafted_by_engine'
    };
  }
}
