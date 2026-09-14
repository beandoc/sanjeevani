import { describe, test, expect } from 'vitest';
import {
  HomeReadinessEngine,
  HomeReadinessInput,
  getDefaultFirst72HoursProtocol,
  CaregiverResilienceEngine,
  CaregiverOperationalPulse,
  RespiteEngine
} from '../src/lib/clinical/discharge-home-os';
import {
  DutyRosterEngine,
  RosterItem
} from '../src/lib/clinical/duty-roster-engine';

describe('Discharge-to-Home Operating System', () => {
  const baseReadyHomeInput: HomeReadinessInput = {
    patientName: 'Smt. Savitri Sharma',
    patientIsBedBound: true,
    patientFallRiskHigh: true,
    requiresSkilledNursing: false,
    requiresNightRepositioning: true,
    infrastructure: {
      hasGroundFloorOrLift: true,
      hasAttachedOrNearbyBathroom: true,
      hasContinuousWaterSupply: true,
      hasPowerBackupForEquipment: true,
      hasReliableMobileNetwork: true,
      distanceToHospitalKm: 4.5,
      ambulanceAccessConfirmed: true
    },
    equipment: {
      hospitalBedDelivered: true,
      airOrWaterMattressInflated: true,
      wheelchairOrCommodeAvailable: true,
      transferAidsAvailable: true
    },
    medications: {
      allDischargeMedsAcquired: true,
      firstHomeDoseTimetableConfirmed: true,
      refrigerationAvailableIfRequired: true,
      specializedSuppliesInHand: true
    },
    nightCaregiver: {
      confirmedCaregiverName: 'Pankaj Sharma (Son)',
      relationship: 'child',
      isOvernightPresent: true,
      hasPhysicalCapacityForTransfers: true,
      hasReceivedBedsideHandover: true
    },
    verifiedBy: 'Staff Nurse Sunita'
  };

  test('Home Readiness Safety Gate approves properly equipped home', () => {
    const result = HomeReadinessEngine.evaluate(baseReadyHomeInput);
    expect(result.status).toBe('safe_to_transition');
    expect(result.canSafelyAdmitTonight).toBe(true);
    expect(result.criticalBlockerCount).toBe(0);
    expect(result.blockers.length).toBe(0);
  });

  test('Day 0 Blocker flags missing night caregiver as critical block', () => {
    const unsafeInput: HomeReadinessInput = {
      ...baseReadyHomeInput,
      nightCaregiver: {
        ...baseReadyHomeInput.nightCaregiver,
        isOvernightPresent: false
      }
    };

    const result = HomeReadinessEngine.evaluate(unsafeInput);
    expect(result.status).toBe('safety_blocked');
    expect(result.canSafelyAdmitTonight).toBe(false);
    expect(result.criticalBlockerCount).toBeGreaterThanOrEqual(1);

    const blocker = result.blockers.find((b) => b.id === 'no_night_caregiver');
    expect(blocker).toBeDefined();
    expect(blocker?.severity).toBe('critical_blocker');
    expect(result.clinicalEscalationRecommendation).toContain('CRITICAL HOME SAFETY BLOCK');
  });

  test('Day 0 Blocker catches unacquired discharge medications', () => {
    const missingMedsInput: HomeReadinessInput = {
      ...baseReadyHomeInput,
      medications: {
        ...baseReadyHomeInput.medications,
        allDischargeMedsAcquired: false
      }
    };

    const result = HomeReadinessEngine.evaluate(missingMedsInput);
    expect(result.status).toBe('safety_blocked');
    expect(result.canSafelyAdmitTonight).toBe(false);
    expect(result.blockers.some((b) => b.id === 'meds_not_acquired')).toBe(true);
  });

  test('First 72 Hours protocol generates required chronological milestones', () => {
    const protocol = getDefaultFirst72HoursProtocol('Savitri Sharma', 'Ramesh Kumar');
    expect(protocol.length).toBeGreaterThanOrEqual(8);

    const firstDoseTask = protocol.find((t) => t.id === 'm1_first_dose');
    expect(firstDoseTask).toBeDefined();
    expect(firstDoseTask?.isCritical).toBe(true);
    expect(firstDoseTask?.phase).toBe('phase_1_first_24h');

    const doctorFollowup = protocol.find((t) => t.id === 'm2_doctor_nurse_telecall');
    expect(doctorFollowup).toBeDefined();
    expect(doctorFollowup?.accountableRole).toBe('treating_doctor');
  });

  test('Caregiver Resilience Pulse detects acute breakdown risk and triggers urgent alert', () => {
    const crisisPulse: CaregiverOperationalPulse = {
      id: 'pulse_1',
      caregiverName: 'Ramesh Kumar',
      timestamp: new Date().toISOString(),
      hoursOfSleepLastNight: 2.5,
      sleepDisruptedByCareCalls: true,
      canContinueCaregivingToday: 'cannot_continue_need_urgent_help',
      physicalStrainScore: 9,
      confidenceScore: 1,
      didScheduledHelpArrive: 'did_not_show_up'
    };

    const evaluation = CaregiverResilienceEngine.evaluatePulse(crisisPulse);
    expect(evaluation.resilienceStatus).toBe('crisis');
    expect(evaluation.respitePrescriptionNeeded).toBe(true);
    expect(evaluation.alertTriggered?.tier).toBe('urgent_escalation');
    expect(evaluation.alertTriggered?.slaMinutes).toBeLessThanOrEqual(60);
  });

  test('Proactive Respite Engine prescribes overnight shifts when sleep is <4h', () => {
    const lowSleepPulse: CaregiverOperationalPulse = {
      id: 'pulse_2',
      caregiverName: 'Ramesh Kumar',
      timestamp: new Date().toISOString(),
      hoursOfSleepLastNight: 3,
      sleepDisruptedByCareCalls: true,
      canContinueCaregivingToday: 'yes_with_difficulty',
      physicalStrainScore: 6,
      confidenceScore: 3,
      didScheduledHelpArrive: 'yes_on_time'
    };

    const prescription = RespiteEngine.generateRecommendation(lowSleepPulse, true, 8);
    expect(prescription.prescriptionType).toBe('overnight_sleep_shifts');
    expect(prescription.estimatedHoursReliefPerWeek).toBeGreaterThanOrEqual(24);
    expect(prescription.doctorApprovalRequired).toBe(true);
  });
});

describe('Duty Roster & Role-Scope Guardrail Engine', () => {
  test('Prevents assigning catheter and wound care to domestic helper or untrained family', () => {
    const woundCheck = DutyRosterEngine.validateTaskRoleScope('deep_wound_dressing', 'domestic_helper');
    expect(woundCheck.isSafe).toBe(false);
    expect(woundCheck.severity).toBe('forbidden_scope_violation');
    expect(woundCheck.recommendedRole).toBe('registered_nurse');

    const catheterCheck = DutyRosterEngine.validateTaskRoleScope('catheter_care_and_emptying', 'family_untrained');
    expect(catheterCheck.isSafe).toBe(false);
    expect(catheterCheck.severity).toBe('forbidden_scope_violation');
    expect(catheterCheck.recommendedRole).toBe('registered_nurse');
  });

  test('Prevents domestic helper from performing heavy bed-to-chair transfers', () => {
    const transferCheck = DutyRosterEngine.validateTaskRoleScope('heavy_transfer_bed_to_chair', 'domestic_helper');
    expect(transferCheck.isSafe).toBe(false);
    expect(transferCheck.severity).toBe('unsafe_manual_handling');
    expect(transferCheck.recommendedRole).toBe('general_duty_attendant');
  });

  test('Permits trained GDA or nurse to perform turning and bed transfers', () => {
    const gdaTransfer = DutyRosterEngine.validateTaskRoleScope('heavy_transfer_bed_to_chair', 'general_duty_attendant');
    expect(gdaTransfer.isSafe).toBe(true);
    expect(gdaTransfer.severity).toBe('safe');
  });

  test('Audit flags uncovered night watch and dangerous scope assignments', () => {
    const roster: RosterItem[] = [
      {
        id: 'r1',
        taskType: 'heavy_transfer_bed_to_chair',
        taskLabel: 'Morning Bed Transfer',
        timeWindow: 'morning_07_10',
        assignedRole: 'domestic_helper', // VIOLATION
        assignedPersonName: 'Geeta (Housemaid)',
        status: 'accepted_by_member',
        isCriticalClinicalTask: true
      },
      {
        id: 'r2',
        taskType: 'overnight_watch_and_monitoring',
        taskLabel: 'Night Repositioning & Supervision',
        timeWindow: 'night_watch_22_06',
        assignedRole: 'general_duty_attendant',
        assignedPersonName: 'Unassigned',
        status: 'unassigned', // UNCOVERED NIGHT
        isCriticalClinicalTask: true
      }
    ];

    const audit = DutyRosterEngine.auditRosterCoverage(roster);
    expect(audit.isFullyCovered).toBe(false);
    expect(audit.scopeViolations.length).toBe(1);
    expect(audit.nightShiftCovered).toBe(false);
    expect(audit.auditSummary).toContain('DANGER');
  });
});
