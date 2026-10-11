/**
 * Care allocation integrity — reproduction harness.
 *
 * Every expectation in this file states the behaviour the allocation model is
 * supposed to have. The ones marked `test.fails` are reproductions of defects
 * that exist today: vitest passes them *because* the assertion throws, so the
 * suite stays green while the defect is on record, and each one turns red the
 * moment its fix lands — at which point it is converted to a plain `test`.
 *
 * The defects, and the remediation step that owns each:
 *
 *   step 2  A*  FIXED — relief was granted by staff *label*: zero scheduled
 *               hours, or an explicitly out-of-scope task, still bought
 *               coverage and capacity.
 *   step 2  B*  FIXED — the clinician's two scope checkboxes were inert in the
 *               engine while the roster honoured them, so the two disagreed.
 *   step 3  C*  one shared "attendant hours/day" scalar is applied per hire,
 *               so absorbed care can exceed the hours actually purchased.
 *   step 4  D*  committed family hours do not reconcile to credited +
 *               uncredited, and the ledger's task/time table is authored
 *               independently of the model that produces headline demand.
 *   step 4  E*  the ledger reads legacy Katz booleans, so a graded Barthel
 *               assessment and a stale boolean can disagree about the same
 *               patient.
 *   step 6  F*  diary calibration never reaches CareGapEngine.evaluate.
 *
 * Both the engine and the roster are asserted wherever a rule is supposed to
 * bind both, so a fix cannot satisfy one surface and leave the other behind.
 */

import { describe, test } from 'vitest';
import assert from 'node:assert';
import {
  CareGapEngine,
  DEFAULT_CAREGIVER_ATTRIBUTES,
  DEFAULT_PATIENT_PROFILE,
  type CaregiverAttributes,
  type FormalSupportType,
  type PatientDependenceProfile,
  type SecondaryFamilyMember
} from '../src/lib/clinical/care-gap-engine';
import { ShiftAllocator } from '../src/lib/clinical/shift-allocator';
import { BARTHEL_ITEMS, LAWTON_ITEMS } from '../src/lib/clinical/function-scale';

/* ------------------------------------------------------------------ *
 * Fixtures
 * ------------------------------------------------------------------ */

const FIXED_NOW = new Date('2026-10-11T09:00:00Z');

/** Maximally dependent on the legacy boolean instruments. */
const dependentPatient: PatientDependenceProfile = {
  ...DEFAULT_PATIENT_PROFILE,
  name: 'Dependent Patient',
  age: 80,
  katzAdl: { bathing: false, dressing: false, toileting: false, transferring: false, continence: false, feeding: false },
  lawtonIadl: {
    telephone: false,
    shopping: false,
    mealPreparation: false,
    housekeeping: false,
    laundry: false,
    transportation: false,
    medicationManagement: false,
    finances: false
  },
  isBedBound: true,
  cognitiveBehavioralLoad: 'wandering_agitation',
  isFunctionalAssessmentCompleted: true,
  assistiveDevices: {
    hospitalBed: 'none',
    airWaterMattress: false,
    wheelchair: false,
    suctionApparatus: false,
    transferAids: false
  }
};

/**
 * A senior spouse carer with real health deductions, committing enough hours
 * that the 1.0 h safe-capacity floor cannot mask a change in those deductions.
 */
const seniorSpouse = (over: Partial<CaregiverAttributes> = {}): CaregiverAttributes => ({
  ...DEFAULT_CAREGIVER_ATTRIBUTES,
  name: 'Primary Carer',
  age: 72,
  kinship: 'spouse',
  coResidence: 'lives_together',
  employment: 'homemaker',
  dailyHoursCommitted: 10,
  secondaryMembers: [],
  caregiverHealth: {
    hasBackPain: true,
    hasHypertension: true,
    hasArthritis: true,
    hasDiabetes: false,
    hasInsomnia: true
  },
  ...over
});

const team = (
  types: FormalSupportType[],
  hoursPerDay: number,
  scope: { transfers?: boolean; meds?: boolean } = {}
): NonNullable<CaregiverAttributes['formalSupport']> => ({
  type: types[0] ?? 'none',
  types,
  hoursPerDay,
  handlesHeavyTransfers: scope.transfers ?? true,
  handlesMedicationWoundCare: scope.meds ?? true
});

const helper = (over: Partial<SecondaryFamilyMember> = {}): SecondaryFamilyMember => ({
  id: 'helper_1',
  name: 'Rajeev',
  relationship: 'son',
  age: 30,
  occupation: 'Private',
  workCommitmentSchedule: '',
  careRestrictions: '',
  functionalStatus: 'independent',
  hoursPerDay: 10,
  assignedTasks: ['heavy_transfers', 'bathing', 'medications', 'feeding', 'night_care', 'logistics_errands'],
  hasPhysicalLimitation: false,
  availableTimeBlocks: ['morning_rush', 'afternoon', 'evening', 'night_watch'],
  acceptanceStatus: 'accepted',
  ...over
});

const evaluate = (caregiver: CaregiverAttributes, patient = dependentPatient) =>
  CareGapEngine.evaluate(caregiver, patient, FIXED_NOW);

/** Total hours the configured team is actually scheduled for, per the clinician's own numbers. */
const NOMINAL: Record<string, number> = {
  trained_nurse_24h: 24,
  paid_attendant_24h: 24,
  trained_nurse_12h: 12,
  paid_attendant_12h: 12,
  medical_assistant: 6,
  multi_family_rotation: 0,
  none: 0
};

/* ------------------------------------------------------------------ *
 * A. Relief must be earned by scheduled hours, not by a staff label
 * ------------------------------------------------------------------ */

describe('A. unsupported relief from a staff label (step 2)', () => {
  test('A1: a hire with zero scheduled hours changes nothing about the primary carer', () => {
    const none = evaluate(seniorSpouse());
    const zeroHourHire = evaluate(seniorSpouse({ formalSupport: team(['paid_attendant_24h'], 0) }));

    assert.strictEqual(zeroHourHire.formalSupportAbsorbedHours, 0, 'zero hours must absorb zero hours');
    // ...and therefore must not buy the carer any capacity or lower her hazard tier.
    assert.strictEqual(
      zeroHourHire.caregiverSafeCapacityHours,
      none.caregiverSafeCapacityHours,
      'zero scheduled hours must not raise the carer safe capacity'
    );
    assert.strictEqual(
      zeroHourHire.manualHandlingHazardTier,
      none.manualHandlingHazardTier,
      'zero scheduled hours must not lower the manual-handling tier'
    );
    assert.ok(
      zeroHourHire.netCareGapHours >= none.netCareGapHours,
      'zero scheduled hours must not shrink the care gap'
    );
  });

  test('A2: a 24h label with zero scheduled hours does not count as night cover', () => {
    const r = evaluate(seniorSpouse({ formalSupport: team(['paid_attendant_24h'], 0) }));
    assert.strictEqual(r.taskDelegationStatus.nightCareCovered, false);
    assert.strictEqual(r.taskDelegationStatus.nightCareCoverage, 'none');
    assert.strictEqual(r.diurnalCoverage.nightCovered, false);
  });

  test('A3: a 12h day shift does not silently cover the night watch', () => {
    // Already holds: night cover is gated on a 24h type, and a 12h day shift covers the morning
    // and evening transfer blocks. This is the behaviour A2 and A4 must not regress.
    const r = evaluate(seniorSpouse({ formalSupport: team(['paid_attendant_12h'], 12) }));
    assert.strictEqual(r.taskDelegationStatus.nightCareCovered, false, '12h day cover is not night cover');
    assert.ok(
      r.taskDelegationStatus.transfersCoverage === 'complete',
      'a day attendant scheduled for 12h does cover the morning and evening transfers'
    );
  });

  test('A4: a 24h type cut back to a 12h shift loses its night coverage claim', () => {
    // The clinician selected the live-in option, then set the hours to 12. The hours are the
    // commitment; the label is not.
    const r = evaluate(seniorSpouse({ formalSupport: team(['paid_attendant_24h'], 12) }));
    assert.strictEqual(r.taskDelegationStatus.nightCareCovered, false);
  });
});

/* ------------------------------------------------------------------ *
 * B. The clinician's scope checkboxes must bind the engine too
 * ------------------------------------------------------------------ */

describe('B. formal-support scope toggles (step 2)', () => {
  test('B1: unchecking "handles heavy transfers / bathing" removes that credit', () => {
    const inScope = evaluate(seniorSpouse({ formalSupport: team(['paid_attendant_24h'], 24, { transfers: true }) }));
    const outOfScope = evaluate(seniorSpouse({ formalSupport: team(['paid_attendant_24h'], 24, { transfers: false }) }));

    assert.strictEqual(inScope.taskDelegationStatus.transfersCovered, true);
    assert.strictEqual(outOfScope.taskDelegationStatus.transfersCovered, false, 'an out-of-scope task is not covered');
    assert.strictEqual(outOfScope.taskDelegationStatus.bathingCovered, false, 'the toggle covers bathing with it');
    assert.ok(
      outOfScope.caregiverSafeCapacityHours < inScope.caregiverSafeCapacityHours,
      'the carer still does the lifting, so her back-pain deduction must stand'
    );
  });

  test('B2: unchecking "handles medications / wound care" removes that credit', () => {
    const inScope = evaluate(seniorSpouse({ formalSupport: team(['trained_nurse_12h'], 12, { meds: true }) }));
    const outOfScope = evaluate(seniorSpouse({ formalSupport: team(['trained_nurse_12h'], 12, { meds: false }) }));

    assert.strictEqual(inScope.taskDelegationStatus.medicationsCovered, true);
    assert.strictEqual(outOfScope.taskDelegationStatus.medicationsCovered, false);
  });

  test('B3: the engine and the roster agree about what formal staff are scoped for', () => {
    // The roster already honours the scope toggles; the engine ignores them. Whichever way the
    // rule finally reads, one set of rules has to drive both surfaces.
    const caregiver = seniorSpouse({ formalSupport: team(['paid_attendant_24h'], 24, { transfers: false }) });
    const engineResult = evaluate(caregiver);
    const roster = ShiftAllocator.allocate(caregiver, dependentPatient);

    const staffHoldsTransfers = Object.values(roster.blocks)
      .flat()
      .some((shift) => shift.role === 'formal_staff' && shift.assignedTasks.includes('heavy_transfers'));

    assert.strictEqual(
      engineResult.taskDelegationStatus.transfersCovered,
      staffHoldsTransfers,
      'the simulator and the roster must not disagree about who lifts the patient'
    );
  });
});

/* ------------------------------------------------------------------ *
 * C. One hours field across several hires
 * ------------------------------------------------------------------ */

describe('C. shared staff-hours scalar (step 3)', () => {
  test.fails('C1: absorbed care never exceeds the hours the team is scheduled for', () => {
    // The field reads "Attendant Hours / Day". Entering 6 and selecting three hires currently
    // gives each hire 6h, so the team absorbs more care than anybody was paid to deliver.
    const r = evaluate(
      seniorSpouse({
        formalSupport: team(['trained_nurse_12h', 'paid_attendant_12h', 'medical_assistant'], 6)
      })
    );
    assert.ok(
      r.formalSupportAbsorbedHours <= 6,
      `absorbed ${r.formalSupportAbsorbedHours}h from 6 scheduled hours`
    );
  });

  test.fails('C2: the hours field is not inert once several hires are selected', () => {
    const types: FormalSupportType[] = ['trained_nurse_12h', 'paid_attendant_12h', 'medical_assistant'];
    const lean = evaluate(seniorSpouse({ formalSupport: team(types, 6) }));
    const full = evaluate(seniorSpouse({ formalSupport: team(types, types.reduce((s, t) => s + NOMINAL[t], 0)) }));

    assert.ok(
      full.formalSupportAbsorbedHours - lean.formalSupportAbsorbedHours > 1,
      `6 scheduled hours and ${types.reduce((s, t) => s + NOMINAL[t], 0)} must not absorb nearly the same care ` +
        `(${lean.formalSupportAbsorbedHours}h vs ${full.formalSupportAbsorbedHours}h)`
    );
  });

  test('C3: a single hire is credited no more than its own shift length', () => {
    // Already holds: min(nominalHours, configuredHours) binds per type.
    const r = evaluate(seniorSpouse({ formalSupport: team(['paid_attendant_12h'], 40) }));
    assert.ok(r.formalSupportAbsorbedHours <= 12);
  });
});

/* ------------------------------------------------------------------ *
 * D. Family hours must reconcile
 * ------------------------------------------------------------------ */

describe('D. family hour reconciliation (step 4)', () => {
  test.fails('D1: committed family hours equal credited plus uncredited', () => {
    // With a 12h hire absorbing most of the demand, the ledger credits the helper all 10 of his
    // hours and the aggregate clamp then keeps 1.7 of them. The other 8.3 are reported nowhere:
    // uncreditedFamilyHours is computed before the clamp, so it reads 0.
    const r = evaluate(
      seniorSpouse({
        otherFamilyMembersCount: 1,
        secondaryMembers: [helper()],
        formalSupport: team(['trained_nurse_12h'], 12)
      })
    );

    assert.strictEqual(
      Math.round((r.familySupportAbsorbedHours + r.uncreditedFamilyHours) * 10) / 10,
      10,
      `10 committed hours must reconcile; got ${r.familySupportAbsorbedHours} credited + ${r.uncreditedFamilyHours} uncredited`
    );
  });

  test.fails('D2: every uncredited hour carries a stated reason', () => {
    const r = evaluate(
      seniorSpouse({
        otherFamilyMembersCount: 1,
        secondaryMembers: [helper()],
        formalSupport: team(['trained_nurse_12h'], 12)
      })
    );
    assert.ok(r.uncreditedFamilyHours > 0, 'hours were discarded, so they must be reported as discarded');
    assert.ok(
      r.uncreditedFamilyReasons.some((reason) => /excess|residual|already covered|exceeds/i.test(reason)),
      `the reason for the discard must name it: ${JSON.stringify(r.uncreditedFamilyReasons)}`
    );
  });

  test('D3: declined, pending and unassigned helpers are never credited', () => {
    // Already holds — the residual allocation ledger guards all three.
    for (const over of [
      { acceptanceStatus: 'declined' as const },
      { acceptanceStatus: 'pending' as const },
      { assignedTasks: [] },
      { hoursPerDay: 0 }
    ]) {
      const r = evaluate(seniorSpouse({ otherFamilyMembersCount: 1, secondaryMembers: [helper(over)] }));
      assert.strictEqual(r.familySupportAbsorbedHours, 0, `${JSON.stringify(over)} must not be credited`);
      assert.ok(r.uncreditedFamilyReasons.length > 0, `${JSON.stringify(over)} must be explained`);
    }
  });

  test.fails('D4: the allocation ledger is built from the same demand as the headline figure', () => {
    // The ledger's task/time table is hand-authored (≈10.0 h for a fully dependent patient) while
    // the headline demand comes from the graded demand model (≈11.6 h). Family hours can never be
    // credited against the difference, and no screen explains why.
    const r = evaluate(seniorSpouse());
    const ledgerDemand = r.allocationLedger.reduce((sum, entry) => sum + entry.demandHours, 0);

    assert.ok(
      Math.abs(ledgerDemand - r.patientCareDemandHours) < 0.5,
      `ledger demand ${ledgerDemand.toFixed(1)}h must reconcile with headline demand ${r.patientCareDemandHours}h`
    );
  });
});

/* ------------------------------------------------------------------ *
 * E. One authoritative functional assessment
 * ------------------------------------------------------------------ */

const gradedBarthel = (over: Record<string, number> = {}) => ({
  ...Object.fromEntries(BARTHEL_ITEMS.map((i) => [i.id, Math.max(...i.options.map((o) => o.value))])),
  ...over
});
const gradedLawton = (over: Record<string, number> = {}) => ({
  ...Object.fromEntries(LAWTON_ITEMS.map((i) => [i.id, Math.max(...i.options.map((o) => o.value))])),
  ...over
});

describe('E. conflicting Katz and Barthel inputs (step 4)', () => {
  test.fails('E1: graded dependence drives the ledger even when a stale Katz boolean says otherwise', () => {
    const patient: PatientDependenceProfile = {
      ...dependentPatient,
      // Graded Barthel: fully dependent for transfers. This is the authoritative instrument.
      gradedFunctionResponses: { barthel: gradedBarthel({ bi_transfer: 0 }), lawton: gradedLawton() },
      // Stale legacy boolean left behind by a direct Katz toggle: "independent".
      katzAdl: { ...dependentPatient.katzAdl, transferring: true },
      functionAssessmentSource: 'clinician_observed'
    };

    const r = CareGapEngine.evaluate(seniorSpouse(), patient, FIXED_NOW);
    const transferDemand = r.allocationLedger
      .filter((e) => e.task === 'heavy_transfers')
      .reduce((sum, e) => sum + e.demandHours, 0);

    assert.ok(
      transferDemand > 0,
      'the graded assessment says the patient cannot transfer, so transfer work must appear in the ledger'
    );
  });

  test.fails('E2: a stale Katz boolean cannot invent work the graded assessment rules out', () => {
    const patient: PatientDependenceProfile = {
      ...dependentPatient,
      gradedFunctionResponses: { barthel: gradedBarthel(), lawton: gradedLawton() },
      // Stale boolean says dependent for bathing; graded says independent.
      katzAdl: { bathing: false, dressing: true, toileting: true, transferring: true, continence: true, feeding: true },
      isBedBound: false,
      cognitiveBehavioralLoad: 'none',
      functionAssessmentSource: 'clinician_observed'
    };

    const r = CareGapEngine.evaluate(seniorSpouse(), patient, FIXED_NOW);
    const bathingDemand = r.allocationLedger
      .filter((e) => e.task === 'bathing')
      .reduce((sum, e) => sum + e.demandHours, 0);

    assert.strictEqual(bathingDemand, 0, 'the graded assessment is authoritative in both directions');
  });
});

/* ------------------------------------------------------------------ *
 * F. Diary calibration reaching the simulator
 * ------------------------------------------------------------------ */

describe('F. diary calibration end to end (step 6)', () => {
  /**
   * `estimateCareDemand` accepts `diaryCalibration` and uses it, but nothing in
   * production passes it: CareGapEngine.evaluate() does not forward it and
   * PatientDependenceProfile has no field to carry it. The cast below stands in
   * for the field step 6 adds, and comes out with it.
   */
  const withDiary = (over: Record<string, unknown>): PatientDependenceProfile =>
    ({ ...dependentPatient, ...over } as PatientDependenceProfile);

  const bathingDiary = {
    patientUid: 'p1',
    totalEntries: 3,
    metricsByTask: {
      bathing_hygiene__morning_rush: {
        taskCategory: 'bathing_hygiene',
        timeBlock: 'morning_rush',
        sampleCount: 3,
        meanMinutes: 55, // measured, well above the 25 min consensus default
        minMinutes: 50,
        maxMinutes: 60,
        twoPersonFrequencyPercent: 0,
        lastLoggedAt: FIXED_NOW.toISOString()
      }
    },
    averageDailyHandsOnMinutes: 55,
    empiricalDirectCareHours: 0.9
  };

  test.fails('F1: a qualifying diary observation moves the demand the simulator shows', () => {
    const uncalibrated = CareGapEngine.evaluate(seniorSpouse(), dependentPatient, FIXED_NOW);
    const calibrated = CareGapEngine.evaluate(
      seniorSpouse(),
      withDiary({ diaryCalibration: bathingDiary }),
      FIXED_NOW
    );

    assert.notStrictEqual(
      calibrated.patientCareDemandHours,
      uncalibrated.patientCareDemandHours,
      'measured care time must reach the demand estimate'
    );
    const bathingDriver = calibrated.careDemandBand.drivers.find((d) => d.itemId === 'bi_bathing');
    assert.strictEqual(bathingDriver?.calibrated, true, 'the calibrated cell must be marked as measured');
  });

  // Passes vacuously today — no diary data reaches the engine at all, so of course the fallback
  // stands. It only becomes a real assertion once F1 is wired; keep both and it cannot regress
  // into "any observation recalibrates everything".
  test('F2: too few observations keep the consensus fallback and say so', () => {
    const thin = { ...bathingDiary, totalEntries: 1, metricsByTask: {
      bathing_hygiene__morning_rush: { ...bathingDiary.metricsByTask.bathing_hygiene__morning_rush, sampleCount: 1 }
    } };
    const uncalibrated = CareGapEngine.evaluate(seniorSpouse(), dependentPatient, FIXED_NOW);
    const sparse = CareGapEngine.evaluate(seniorSpouse(), withDiary({ diaryCalibration: thin }), FIXED_NOW);

    assert.strictEqual(
      sparse.patientCareDemandHours,
      uncalibrated.patientCareDemandHours,
      'one observation is not a calibration'
    );
    const driver = sparse.careDemandBand.drivers.find((d) => d.itemId === 'bi_bathing');
    assert.strictEqual(driver?.calibrated, false);
  });
});
