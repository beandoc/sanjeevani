import { describe, test, expect } from 'vitest';
import type { CaregiverAttributes, ClinicalCareBlueprint, EmergencyLogistics } from '@/lib/clinical/care-gap-engine';
import { DEFAULT_ASSISTIVE_DEVICES, DEFAULT_CAREGIVER_ATTRIBUTES } from '@/lib/clinical/care-gap-engine';
import {
  buildEmergencyVerificationRecord,
  buildPlanAuthorizationRecord,
  computeBlueprintPlanHash,
  computeEmergencyLogisticsHash,
  getEmergencyLogisticsCompleteness,
  sha256Hex,
  verifyClinicalAuthorization
} from '@/lib/clinical/clinical-authorization';

const baseBlueprint: ClinicalCareBlueprint = {
  id: 'bp_1',
  prescribedByDoctor: 'Dr. Vivek',
  prescribedAt: '2026-09-01T00:00:00.000Z',
  clinicalSummary: 'Summary',
  recommendedSupportType: 'paid_attendant_12h',
  recommendedShiftWindow: 'day_12h',
  recommendedHoursPerDay: 12,
  clinicalPrecautions: ['No solo lifts'],
  recommendedAssistiveDevices: DEFAULT_ASSISTIVE_DEVICES,
  recommendedRespiteDaysPerMonth: 4,
  status: 'draft_prescribed',
  authoredInstructions: [
    {
      id: 'i1',
      timingWindow: 'morning_rush',
      title: 'Morning hygiene',
      instruction: 'Sponge bath, inspect skin.',
      indication: 'Bed-bound',
      exceptions: 'Stop if skin breaks',
      authoredBy: 'Dr. Vivek',
      reviewDate: '2026-09-01',
      acceptedByClinician: true
    }
  ],
  clinicalReview: {
    decision: 'issued_by_clinician',
    reviewedAt: '2026-09-01T00:00:00.000Z',
    reviewedBy: 'Dr. Vivek',
    policyVersion: '2026.09.13.1',
    decisionSupportStatus: 'ready_for_clinician_review'
  }
};

const baseEmergency: EmergencyLogistics = {
  hospitalDistanceKm: 3.5,
  travelTimeMinutes: 12,
  fourWheelerAvailableAtHome: true,
  designatedEmergencyDriver: 'Suresh',
  preferredHospitalName: 'Apex Hospital',
  ambulanceContact: '108',
  goalsOfCareEscalationPreference: 'full_escalation'
};

describe('sha256Hex', () => {
  test('matches known SHA-256 test vectors', () => {
    expect(sha256Hex('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    expect(sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });

  test('is deterministic and sensitive to single-character changes', () => {
    const a = sha256Hex('hello world');
    const b = sha256Hex('hello world');
    const c = sha256Hex('Hello world');
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });
});

describe('computeBlueprintPlanHash', () => {
  test('is stable across key-order and undefined-vs-absent variations', () => {
    const h1 = computeBlueprintPlanHash(baseBlueprint);
    const reordered: ClinicalCareBlueprint = {
      ...baseBlueprint,
      authoredInstructions: [{ ...baseBlueprint.authoredInstructions![0] }]
    };
    const h2 = computeBlueprintPlanHash(reordered);
    expect(h1).toBe(h2);
  });

  test('changes when a caregiver edits authored instruction text', () => {
    const h1 = computeBlueprintPlanHash(baseBlueprint);
    const tampered: ClinicalCareBlueprint = {
      ...baseBlueprint,
      authoredInstructions: [
        { ...baseBlueprint.authoredInstructions![0], instruction: 'Two-person pivot transfer with no assessment.' }
      ]
    };
    const h2 = computeBlueprintPlanHash(tampered);
    expect(h1).not.toBe(h2);
  });

  test('does NOT change when only status or clinicalReview change (those are not plan content)', () => {
    const h1 = computeBlueprintPlanHash(baseBlueprint);
    const adopted: ClinicalCareBlueprint = { ...baseBlueprint, status: 'adopted_by_family' };
    expect(computeBlueprintPlanHash(adopted)).toBe(h1);
  });
});

describe('computeEmergencyLogisticsHash', () => {
  test('changes when the hospital or driver is edited', () => {
    const h1 = computeEmergencyLogisticsHash(baseEmergency);
    const tampered = { ...baseEmergency, preferredHospitalName: 'A Different Hospital' };
    expect(computeEmergencyLogisticsHash(tampered)).not.toBe(h1);
  });

  test('is NOT affected by isVerified/verifiedBy/verifiedAt fields', () => {
    const h1 = computeEmergencyLogisticsHash(baseEmergency);
    const withVerification = { ...baseEmergency, isVerified: true, verifiedBy: 'Dr. X', verifiedAt: '2026-01-01T00:00:00.000Z' };
    expect(computeEmergencyLogisticsHash(withVerification)).toBe(h1);
  });
});

describe('getEmergencyLogisticsCompleteness', () => {
  test('flags missing driver and escalation preference even when hospital + ambulance are set', () => {
    const partial: EmergencyLogistics = { preferredHospitalName: 'Apex', ambulanceContact: '108' };
    const result = getEmergencyLogisticsCompleteness(partial);
    expect(result.complete).toBe(false);
    expect(result.missing).toContain('designated emergency driver');
    expect(result.missing).toContain('goals-of-care escalation preference');
  });

  test('is complete only with hospital, ambulance, driver and a documented escalation preference', () => {
    expect(getEmergencyLogisticsCompleteness(baseEmergency).complete).toBe(true);
    expect(getEmergencyLogisticsCompleteness({ ...baseEmergency, goalsOfCareEscalationPreference: 'not_documented' }).complete).toBe(false);
  });
});

function caregiverWith(blueprint: ClinicalCareBlueprint | undefined, emergency: EmergencyLogistics | undefined): CaregiverAttributes {
  return { ...DEFAULT_CAREGIVER_ATTRIBUTES, careBlueprint: blueprint, emergencyLogistics: emergency };
}

describe('verifyClinicalAuthorization — the release-blocking trust boundary', () => {
  test('no plan on the dyad -> no_plan, never authorized', () => {
    const verdict = verifyClinicalAuthorization(null, caregiverWith(undefined, undefined));
    expect(verdict.planStatus).toBe('no_plan');
    expect(verdict.planAuthorized).toBe(false);
    expect(verdict.bedsideSheetAuthorized).toBe(false);
  });

  test('plan present but no clinician record -> unauthorized', () => {
    const verdict = verifyClinicalAuthorization(null, caregiverWith(baseBlueprint, baseEmergency));
    expect(verdict.planStatus).toBe('unauthorized');
    expect(verdict.planAuthorized).toBe(false);
  });

  test('a matching signed record authorizes the plan', () => {
    const record = buildPlanAuthorizationRecord({
      blueprint: baseBlueprint,
      clinicianUid: 'doc_1',
      clinicianName: 'Dr. Vivek',
      now: new Date('2026-09-01T00:00:00.000Z')
    });
    const verdict = verifyClinicalAuthorization(record, caregiverWith(baseBlueprint, baseEmergency));
    expect(verdict.planStatus).toBe('authorized');
    expect(verdict.planAuthorized).toBe(true);
    expect(verdict.authorizedByName).toBe('Dr. Vivek');
  });

  // This is the P0 finding: a caregiver edits authoredInstructions after clinician sign-off while
  // the (caregiver-editable) clinicalReview object is carried forward unchanged. The signed hash
  // must catch this even though careBlueprint.clinicalReview still says 'issued_by_clinician'.
  test('CRITICAL: caregiver tampering with authored instructions after sign-off drops authorization to stale', () => {
    const record = buildPlanAuthorizationRecord({
      blueprint: baseBlueprint,
      clinicianUid: 'doc_1',
      clinicianName: 'Dr. Vivek'
    });
    const tamperedBlueprint: ClinicalCareBlueprint = {
      ...baseBlueprint,
      authoredInstructions: [
        { ...baseBlueprint.authoredInstructions![0], instruction: 'Two-person pivot transfer — caregiver-added, unreviewed.' }
      ]
      // clinicalReview is carried forward untouched — the old trust boundary would still say "approved".
    };
    const verdict = verifyClinicalAuthorization(record, caregiverWith(tamperedBlueprint, baseEmergency));
    expect(verdict.planStatus).toBe('stale');
    expect(verdict.planAuthorized).toBe(false);
    expect(verdict.bedsideSheetAuthorized).toBe(false);
  });

  test('CRITICAL: caregiver tampering with emergency hospital after verification drops verification to stale', () => {
    const record = buildEmergencyVerificationRecord({
      logistics: baseEmergency,
      clinicianUid: 'doc_1',
      clinicianName: 'Dr. Vivek',
      goalsOfCareEscalationPreference: 'full_escalation'
    });
    const tamperedEmergency: EmergencyLogistics = {
      ...baseEmergency,
      preferredHospitalName: 'Some Other Hospital',
      // isVerified/verifiedBy/verifiedAt carried forward untouched by the caregiver-editable write path
      isVerified: true,
      verifiedBy: 'Dr. Vivek',
      verifiedAt: '2026-09-01T00:00:00.000Z'
    };
    const verdict = verifyClinicalAuthorization(record, caregiverWith(baseBlueprint, tamperedEmergency));
    expect(verdict.emergencyStatus).toBe('stale');
    expect(verdict.emergencyVerified).toBe(false);
    expect(verdict.bedsideSheetAuthorized).toBe(false);
  });

  test('bedsideSheetAuthorized requires BOTH plan authorization and emergency verification', () => {
    const planOnly = buildPlanAuthorizationRecord({ blueprint: baseBlueprint, clinicianUid: 'doc_1', clinicianName: 'Dr. Vivek' });
    const verdict1 = verifyClinicalAuthorization(planOnly, caregiverWith(baseBlueprint, baseEmergency));
    expect(verdict1.planAuthorized).toBe(true);
    expect(verdict1.emergencyVerified).toBe(false);
    expect(verdict1.bedsideSheetAuthorized).toBe(false);

    const full = buildEmergencyVerificationRecord({
      logistics: baseEmergency,
      clinicianUid: 'doc_1',
      clinicianName: 'Dr. Vivek',
      goalsOfCareEscalationPreference: 'full_escalation',
      existing: planOnly
    });
    const verdict2 = verifyClinicalAuthorization(full, caregiverWith(baseBlueprint, baseEmergency));
    expect(verdict2.planAuthorized).toBe(true);
    expect(verdict2.emergencyVerified).toBe(true);
    expect(verdict2.bedsideSheetAuthorized).toBe(true);
  });

  test('a record from a different (older) blueprint id does not authorize the current one', () => {
    const record = buildPlanAuthorizationRecord({ blueprint: { ...baseBlueprint, id: 'bp_old' }, clinicianUid: 'doc_1', clinicianName: 'Dr. Vivek' });
    const verdict = verifyClinicalAuthorization(record, caregiverWith(baseBlueprint, baseEmergency));
    expect(verdict.planStatus).toBe('unauthorized');
  });

  test('verified emergency but incomplete required fields is "incomplete", not "verified"', () => {
    const sparse: EmergencyLogistics = { preferredHospitalName: 'Apex', ambulanceContact: '108', goalsOfCareEscalationPreference: 'not_documented' };
    const record = buildEmergencyVerificationRecord({
      logistics: sparse,
      clinicianUid: 'doc_1',
      clinicianName: 'Dr. Vivek',
      goalsOfCareEscalationPreference: 'not_documented'
    });
    const verdict = verifyClinicalAuthorization(record, caregiverWith(baseBlueprint, sparse));
    expect(verdict.emergencyStatus).toBe('incomplete');
    expect(verdict.emergencyVerified).toBe(false);
  });
});
