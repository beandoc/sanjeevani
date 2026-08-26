import { test, describe } from 'vitest';
import assert from 'node:assert';
import { ShiftAllocator } from '../src/lib/clinical/shift-allocator';
import { CaregiverAttributes, PatientDependenceProfile, CareGapEngine } from '../src/lib/clinical/care-gap-engine';

describe('Deterministic Shift Allocator & Multi-Generational Calendar Tests', () => {
  const baseCaregiver: CaregiverAttributes = {
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
    dailyHoursCommitted: 5,
    monthlyOutOfPocketBurden: 'moderate_strain',
    formalTrainingReceived: false,
    secondaryMembers: [
      {
        id: 'sec_son_1',
        name: 'Rahul (Son)',
        relationship: 'grandchild',
        age: 24,
        hoursPerDay: 2,
        hasPhysicalLimitation: false,
        workCommitmentSchedule: 'Full-time IT job (09:00 - 18:00)',
        availableTimeBlocks: ['evening', 'night_watch'],
        assignedTasks: ['heavy_transfers', 'medications']
      },
      {
        id: 'sec_elder_1',
        name: 'Shanti Devi (Sister)',
        relationship: 'sibling',
        age: 67,
        hoursPerDay: 2,
        hasPhysicalLimitation: true,
        availableTimeBlocks: ['morning_rush', 'afternoon'],
        assignedTasks: ['feeding', 'medications']
      }
    ],
    rotationPolicy: {
      rotationInterval: 'biweekly',
      primaryCaregiverRespiteDaysPerMonth: 4,
      weekendShiftLeader: 'Rahul',
      nightShiftArrangement: 'family_rotation'
    }
  };

  const basePatient: PatientDependenceProfile = {
    name: 'Smt. Sarojini Devi',
    age: 81,
    primaryConditions: ['Hypertension', 'Severe Osteoarthritis', 'Post-Fall Frailty'],
    katzAdl: {
      bathing: false,
      dressing: false,
      toileting: false,
      transferring: false,
      continence: false,
      feeding: false
    },
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
    cognitiveBehavioralLoad: 'severe_sundowning',
    fallHistoryLast6Months: 1,
    isBedBound: true
  };

  test('Hard Constraints: Senior member (67y) with physical limitation is not assigned heavy transfers or bathing', () => {
    const roster = ShiftAllocator.allocate(baseCaregiver, basePatient);

    const morningShifts = roster.blocks.morning_rush;
    const seniorAssignment = morningShifts.find((s) => s.assignedMemberId === 'sec_elder_1');

    if (seniorAssignment) {
      assert.ok(
        !seniorAssignment.assignedTasks.includes('heavy_transfers'),
        'Senior physically-limited member must not be assigned heavy transfers'
      );
      assert.ok(
        !seniorAssignment.assignedTasks.includes('bathing'),
        'Senior physically-limited member must not be assigned bathing'
      );
    }
  });

  test('Hard Constraints: Full-time working helper is not assigned morning rush tasks', () => {
    const roster = ShiftAllocator.allocate(baseCaregiver, basePatient);

    const morningShifts = roster.blocks.morning_rush;
    const workingHelperMorning = morningShifts.find((s) => s.assignedMemberId === 'sec_son_1');
    assert.strictEqual(workingHelperMorning, undefined, 'Daytime worker must not be allocated to morning rush');

    // Rahul should be allocated to evening shift
    const eveningShifts = roster.blocks.evening;
    const workingHelperEvening = eveningShifts.find((s) => s.assignedMemberId === 'sec_son_1');
    assert.ok(workingHelperEvening !== undefined, 'Evening-available worker should be allocated to evening');
  });

  test('Respite Orders: Emits time-placed and task-specific respite relief orders', () => {
    const roster = ShiftAllocator.allocate(baseCaregiver, basePatient);

    assert.ok(roster.respiteOrders.length >= 4, 'Must allocate 4 monthly respite days');
    const order1 = roster.respiteOrders[0];

    assert.strictEqual(order1.dayNumber, 7);
    assert.strictEqual(order1.block, 'morning_rush');
    assert.ok(order1.specificTasks.length > 0);
    assert.ok(order1.orderText.includes('07:00–11:00') || order1.orderText.includes('relief shift'));
  });

  test('RFC 5545 iCalendar: Emits distinct VEVENTs per member per assigned block with RRULE and ATTENDEE', () => {
    const evalResult = CareGapEngine.evaluate(baseCaregiver, basePatient);
    const icsString = ShiftAllocator.generateCareRosterIcs(baseCaregiver, basePatient, evalResult);

    assert.ok(icsString.startsWith('BEGIN:VCALENDAR'));
    assert.ok(icsString.includes('VERSION:2.0'));
    assert.ok(icsString.includes('RRULE:FREQ=WEEKLY;COUNT=4'));
    assert.ok(icsString.includes('ATTENDEE;CN='));
    assert.ok(icsString.includes('DTSTART:'));
    assert.ok(icsString.includes('DTEND:'));
    assert.ok(icsString.includes('Respite Day'));
    assert.ok(icsString.endsWith('END:VCALENDAR'));
  });

  test('WhatsApp Digest: Emits formatted diurnal shift schedule with block breakdowns', () => {
    const evalResult = CareGapEngine.evaluate(baseCaregiver, basePatient);
    const digest = ShiftAllocator.generateWhatsAppCareDigest(baseCaregiver, basePatient, evalResult);

    assert.ok(digest.includes('SANJEEVANI') || digest.includes('KUTUMBH'));
    assert.ok(digest.includes('DIURNAL SHIFT ALLOCATIONS'));
    assert.ok(digest.includes('Morning Rush'));
    assert.ok(digest.includes('Night Watch'));
    assert.ok(digest.includes('RESPITE ORDERS & RELIEF SCHEDULE'));
    assert.ok(digest.includes('EMERGENCY PROTOCOL'));
  });
});
