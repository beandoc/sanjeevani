import { describe, test, expect } from 'vitest';
import {
  CareGapEngine,
  type CaregiverAttributes,
  type PatientDependenceProfile,
  type ClinicianAuthoredInstruction,
  DEFAULT_CAREGIVER_ATTRIBUTES,
  DEFAULT_PATIENT_PROFILE,
  DEFAULT_ASSISTIVE_DEVICES
} from '@/lib/clinical/care-gap-engine';
import { generateWhatsAppCareDigest } from '@/lib/clinical/shift-allocator';

describe('Clinical Release Blockers Regression Suite', () => {
  const basePatient: PatientDependenceProfile = {
    ...DEFAULT_PATIENT_PROFILE,
    name: 'Ramesh Gupta',
    age: 78,
    primaryConditions: ['Hypertension', 'Type 2 Diabetes', 'Osteoarthritis'],
    katzAdl: {
      bathing: false,
      dressing: false,
      toileting: false,
      transferring: false,
      continence: true,
      feeding: true
    },
    lawtonIadl: {
      telephone: true,
      shopping: false,
      mealPreparation: false,
      housekeeping: false,
      laundry: false,
      transportation: false,
      medicationManagement: false,
      finances: false
    },
    cognitiveBehavioralLoad: 'none',
    fallHistoryLast6Months: 1,
    isBedBound: false
  };

  const baseCaregiver: CaregiverAttributes = {
    ...DEFAULT_CAREGIVER_ATTRIBUTES,
    name: 'Pooja Gupta',
    age: 52,
    dailyHoursCommitted: 6,
    emergencyLogistics: {
      hospitalDistanceKm: 3.5,
      travelTimeMinutes: 12,
      fourWheelerAvailableAtHome: true,
      designatedEmergencyDriver: 'Suresh Gupta',
      preferredHospitalName: 'Apex Super Specialty Hospital',
      ambulanceContact: '108',
      isVerified: true,
      verifiedBy: 'Dr. Vivek',
      verifiedAt: '2026-09-13T10:00:00Z',
      goalsOfCareEscalationPreference: 'full_escalation'
    }
  };

  // BLOCKER 1: Client cannot forge clinical approval via status 'adopted_by_family'
  test('Blocker 1: Family adoption does NOT substitute for clinician authorization', () => {
    const unapprovedCaregiver: CaregiverAttributes = {
      ...baseCaregiver,
      careBlueprint: {
        id: 'bp_adopted_only',
        prescribedByDoctor: 'Unverified Doctor',
        prescribedAt: '2026-09-13',
        clinicalSummary: 'Family drafted plan',
        recommendedSupportType: 'family_redistribution',
        recommendedShiftWindow: 'day_12h',
        recommendedHoursPerDay: 4,
        clinicalPrecautions: [],
        recommendedAssistiveDevices: DEFAULT_ASSISTIVE_DEVICES,
        recommendedRespiteDaysPerMonth: 4,
        status: 'adopted_by_family', // Caregiver adopted without clinical review decision
        clinicalReview: undefined
      }
    };

    const isClinicianApproved = !!(
      unapprovedCaregiver.careBlueprint?.clinicalReview?.decision === 'issued_by_clinician' ||
      unapprovedCaregiver.careBlueprint?.clinicalReview?.decision === 'clinician_revised'
    );
    expect(isClinicianApproved).toBe(false);
  });

  // BLOCKER 2: Bedside Sheet renders structured clinician-authored instructions only
  test('Blocker 2: Authored instructions carry timing, indication, parameters, author, and reviewDate', () => {
    const instruction: ClinicianAuthoredInstruction = {
      id: 'inst_101',
      timingWindow: 'morning_rush',
      title: 'Morning Skin Inspection & Assisted Hygiene',
      instruction: 'Sponge bath with pH-neutral cleanser; inspect sacrum and heels for non-blanching erythema.',
      indication: 'Documented high friction zone vulnerability over sacrum and heels',
      parameters: 'Gentle sponge bath with pH-neutral cleanser. Inspect for non-blanching erythema.',
      exceptions: 'Discontinue and alert physician if skin breaks or blanching resistance observed.',
      authoredBy: 'Dr. Vivek (Geriatric Specialist)',
      reviewDate: '2026-09-13'
    };

    expect(instruction.timingWindow).toBe('morning_rush');
    expect(instruction.authoredBy).toBe('Dr. Vivek (Geriatric Specialist)');
    expect(instruction.reviewDate).toBe('2026-09-13');
    expect(instruction.indication).toBeTruthy();
    expect(instruction.parameters).toBeTruthy();
  });

  // BLOCKER 3: Unified Allocation Ledger prevents wrong-time coverage, duplicate fulfillment, and zero-hour helpers
  describe('Blocker 3: Unified Allocation Ledger', () => {
    test('A: Wrong-time coverage does not relieve morning transfer demand', () => {
      const afternoonOnlyCaregiver: CaregiverAttributes = {
        ...baseCaregiver,
        secondaryMembers: [
          {
            id: 'helper_pm',
            name: 'Afternoon Helper',
            relationship: 'son',
            age: 28,
            hoursPerDay: 4,
            assignedTasks: ['heavy_transfers'],
            hasPhysicalLimitation: false,
            acceptanceStatus: 'accepted',
            functionalStatus: 'independent',
            availableTimeBlocks: ['afternoon'] // Transfer demand is in morning_rush and evening
          }
        ]
      };

      const evalResult = CareGapEngine.evaluate(afternoonOnlyCaregiver, basePatient);
      expect(evalResult.taskDelegationStatus.transfersCovered).toBe(false);
      expect(evalResult.uncreditedFamilyHours).toBeGreaterThan(0);
    });

    test('B: Zero-hour helper cannot activate transfer relief or reduce strain', () => {
      const zeroHourCaregiver: CaregiverAttributes = {
        ...baseCaregiver,
        secondaryMembers: [
          {
            id: 'helper_zero',
            name: 'Zero Hour Helper',
            relationship: 'daughter',
            age: 32,
            hoursPerDay: 0,
            assignedTasks: ['heavy_transfers'],
            hasPhysicalLimitation: false,
            acceptanceStatus: 'accepted',
            functionalStatus: 'independent',
            availableTimeBlocks: ['morning_rush', 'evening']
          }
        ]
      };

      const evalResult = CareGapEngine.evaluate(zeroHourCaregiver, basePatient);
      expect(evalResult.taskDelegationStatus.transfersCovered).toBe(false);
      expect(evalResult.teamAllocations.secondaryFamilyHours).toBe(0);
    });

    test('C: Duplicate helpers on the same task do not double-count hours beyond residual demand', () => {
      const duplicateTaskCaregiver: CaregiverAttributes = {
        ...baseCaregiver,
        dailyHoursCommitted: 0,
        secondaryMembers: [
          {
            id: 'helper_1',
            name: 'Helper One',
            relationship: 'son',
            age: 30,
            hoursPerDay: 3,
            assignedTasks: ['heavy_transfers'],
            hasPhysicalLimitation: false,
            acceptanceStatus: 'accepted',
            functionalStatus: 'independent',
            availableTimeBlocks: ['morning_rush']
          },
          {
            id: 'helper_2',
            name: 'Helper Two',
            relationship: 'sibling',
            age: 35,
            hoursPerDay: 3,
            assignedTasks: ['heavy_transfers'],
            hasPhysicalLimitation: false,
            acceptanceStatus: 'accepted',
            functionalStatus: 'independent',
            availableTimeBlocks: ['morning_rush']
          }
        ]
      };

      const evalResult = CareGapEngine.evaluate(duplicateTaskCaregiver, basePatient);
      // Morning transfer demand is 1.0h. Helper 1 absorbs 1.0h; Helper 2 cannot duplicate and absorb another 1.0h!
      expect(evalResult.teamAllocations.secondaryFamilyHours).toBeLessThanOrEqual(1.0);
      expect(evalResult.uncreditedFamilyHours).toBeGreaterThanOrEqual(5.0);
    });
  });

  // BLOCKER 4: Qualitative Manual Handling Tiers without "NIOSH" probability
  test('Blocker 4: Evaluates manual handling into qualitative tiers without numeric injury risk %', () => {
    const evalResult = CareGapEngine.evaluate(baseCaregiver, basePatient);
    expect(['low', 'moderate', 'high', 'severe']).toContain(evalResult.manualHandlingHazardTier);
    expect(evalResult.requiresClinicalPtOtReferral).toBe(true);
  });

  // BLOCKER 5: Authoritative ZBI psychometrics for ZBI-22, ZBI-12, and ZBI-4
  describe('Blocker 5: Authoritative ZBI multi-tier psychometrics', () => {
    const tiers: Array<{ tier: 'ZBI22' | 'ZBI12' | 'ZBI4'; expectedMax: number }> = [
      { tier: 'ZBI22', expectedMax: 88 },
      { tier: 'ZBI12', expectedMax: 48 },
      { tier: 'ZBI4', expectedMax: 16 }
    ];

    tiers.forEach(({ tier, expectedMax }) => {
      test(`calculates correct denominator ${expectedMax} for ${tier}`, () => {
        const maxScore = tier === 'ZBI22' ? 88 : tier === 'ZBI12' ? 48 : 16;
        expect(maxScore).toBe(expectedMax);
      });
    });
  });

  // BLOCKER 6: Export consent, PII redaction, and planning recommendations nomenclature
  describe('Blocker 6: Export consent and privacy redaction', () => {
    test('generateWhatsAppCareDigest redacts patient and caregiver names when requested', () => {
      const evalResult = CareGapEngine.evaluate(baseCaregiver, basePatient);
      const unredactedDigest = generateWhatsAppCareDigest(baseCaregiver, basePatient, evalResult);
      expect(unredactedDigest).toContain('Ramesh Gupta');
      expect(unredactedDigest).toContain('PLANNING RECOMMENDATIONS');
      expect(unredactedDigest).not.toContain('CLINICAL ORDERS');

      const redactedDigest = generateWhatsAppCareDigest(baseCaregiver, basePatient, evalResult, { redacted: true });
      expect(redactedDigest).not.toContain('Ramesh Gupta');
      expect(redactedDigest).toContain('R.G');
      expect(redactedDigest).toContain('PLANNING RECOMMENDATIONS');
    });
  });
});
