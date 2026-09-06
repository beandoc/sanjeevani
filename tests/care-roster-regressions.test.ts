import { describe, test } from 'vitest';
import assert from 'node:assert';
import {
  CareGapEngine,
  DEFAULT_CAREGIVER_ATTRIBUTES,
  DEFAULT_PATIENT_PROFILE,
  type CaregiverAttributes,
  type PatientDependenceProfile,
  type SecondaryFamilyMember
} from '../src/lib/clinical/care-gap-engine';
import { ShiftAllocator, BLOCK_DURATION_HOURS } from '../src/lib/clinical/shift-allocator';
import {
  HealthRepository,
  UNASSIGNED_CARE_TASK_OWNER,
  matrixLinkedMemberId,
  type CareCircleMember,
  type CareCircleTask
} from '../src/lib/db/health-repository';

const member = (over: Partial<SecondaryFamilyMember> & { id: string }): SecondaryFamilyMember => ({
  name: over.id.toUpperCase(),
  relationship: 'son',
  age: 30,
  hoursPerDay: 4,
  assignedTasks: [],
  hasPhysicalLimitation: false,
  functionalStatus: 'independent',
  availableTimeBlocks: ['evening'],
  ...over
});

const dependentPatient: PatientDependenceProfile = {
  ...DEFAULT_PATIENT_PROFILE,
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
  isBedBound: true
};

const teamCaregiver: CaregiverAttributes = {
  ...DEFAULT_CAREGIVER_ATTRIBUTES,
  name: 'Primary',
  employment: 'full_time',
  dailyHoursCommitted: 4,
  secondaryMembers: [
    member({ id: 'a', assignedTasks: ['heavy_transfers'] }),
    member({ id: 'b', assignedTasks: ['bathing'] }),
    member({ id: 'c', assignedTasks: ['feeding'] })
  ]
};

describe('Care roster regressions', () => {
  test('B1: a member is rostered for the responsibility they were actually mapped to', () => {
    const roster = ShiftAllocator.allocate(teamCaregiver, dependentPatient);
    const evening = roster.blocks.evening;

    const a = evening.find((s) => s.assignedMemberId === 'a');
    assert.ok(a, 'the member designated for transfers should hold the evening transfer');
    assert.ok(a!.assignedTasks.includes('heavy_transfers'));

    // Designation used to be ignored entirely: every family member received the same
    // [heavy_transfers, feeding, medications] list regardless of what they were mapped to.
    const taskLists = evening.map((s) => s.assignedTasks.slice().sort().join(','));
    assert.strictEqual(new Set(taskLists).size, taskLists.length, 'members must not all get identical task lists');
  });

  test('B2: nobody is rostered for a task their limitations forbid', () => {
    const frail: CaregiverAttributes = {
      ...teamCaregiver,
      secondaryMembers: [
        member({
          id: 'frail',
          name: 'Frail Uncle',
          age: 72,
          hasPhysicalLimitation: true,
          functionalStatus: 'has_limitations',
          assignedTasks: [],
          availableTimeBlocks: ['morning_rush']
        })
      ]
    };
    const roster = ShiftAllocator.allocate(frail, dependentPatient);
    const shift = roster.blocks.morning_rush.find((s) => s.assignedMemberId === 'frail');

    // The old fallback handed ['feeding','medications'] to anyone merely present in the block,
    // even when every task had failed the eligibility check.
    assert.ok(shift, 'an eligible member should still be used to relieve the primary caregiver');
    assert.ok(!shift!.assignedTasks.includes('heavy_transfers'));
    assert.ok(!shift!.assignedTasks.includes('bathing'));
  });

  test('B2: a member with no permitted task in the block is not rostered at all', () => {
    const barred: CaregiverAttributes = {
      ...teamCaregiver,
      secondaryMembers: [
        member({
          id: 'barred',
          age: 70,
          hasPhysicalLimitation: true,
          careRestrictions: 'no medication, no night duty',
          availableTimeBlocks: ['night_watch']
        })
      ]
    };
    const roster = ShiftAllocator.allocate(barred, dependentPatient);
    assert.strictEqual(
      roster.blocks.night_watch.find((s) => s.assignedMemberId === 'barred'),
      undefined
    );
  });

  test('B3: no task has two owners in the same block, in any block', () => {
    const spread: CaregiverAttributes = {
      ...teamCaregiver,
      secondaryMembers: [
        member({ id: 'a', assignedTasks: ['heavy_transfers'], availableTimeBlocks: ['morning_rush', 'evening'] }),
        member({ id: 'b', assignedTasks: ['bathing'], availableTimeBlocks: ['morning_rush'] }),
        member({ id: 'c', assignedTasks: ['night_care'], availableTimeBlocks: ['night_watch'] })
      ]
    };
    const roster = ShiftAllocator.allocate(spread, dependentPatient);

    for (const block of ['morning_rush', 'afternoon', 'evening', 'night_watch'] as const) {
      const seen = new Map<string, string>();
      for (const shift of roster.blocks[block]) {
        for (const task of shift.assignedTasks) {
          const existing = seen.get(task);
          assert.ok(
            !existing,
            `${block}: ${task} is owned by both ${existing} and ${shift.assignedMemberName}; delegation must move work, not copy it`
          );
          seen.set(task, shift.assignedMemberName);
        }
      }
    }
  });

  test('B4: logistics errands become a schedulable midday responsibility', () => {
    const roster = ShiftAllocator.allocate(teamCaregiver, dependentPatient);
    const scheduled = roster.blocks.afternoon.some((s) => s.assignedTasks.includes('logistics_errands'));
    const flagged = roster.uncoveredGaps.some((g) => g.task === 'logistics_errands');
    assert.ok(scheduled || flagged, 'errands must either be owned or reported as a gap, never dropped');
  });

  test('D2: per-block family supply reconciles with the hours actually absorbed', () => {
    const independentPatient: PatientDependenceProfile = {
      ...DEFAULT_PATIENT_PROFILE,
      katzAdl: { bathing: true, dressing: true, toileting: true, transferring: true, continence: true, feeding: true },
      lawtonIadl: {
        telephone: true,
        shopping: true,
        mealPreparation: true,
        housekeeping: true,
        laundry: true,
        transportation: true,
        medicationManagement: true,
        finances: true
      },
      cognitiveBehavioralLoad: 'none',
      fallHistoryLast6Months: 0,
      isBedBound: false
    };
    const caregiver: CaregiverAttributes = {
      ...DEFAULT_CAREGIVER_ATTRIBUTES,
      // Zero primary capacity isolates the family contribution under test.
      dailyHoursCommitted: 0,
      secondaryMembers: [member({ id: 'a' }), member({ id: 'b' }), member({ id: 'c' })]
    };

    const result = CareGapEngine.evaluate(caregiver, independentPatient);
    // Contributor labels carry the member name and committed hours; the primary caregiver and
    // formal staff are labelled separately, so the family share can be isolated.
    const familySupply = Object.values(result.blockGaps).reduce((sum, b) => {
      const familyContributors = b.contributors.filter((c) => /^[ABC] \(/.test(c)).length;
      const allContributors = b.contributors.length || 1;
      return sum + (b.supplyHours * familyContributors) / allContributors;
    }, 0);

    // Each member used to be capped against the *pooled* absorbed total rather than given a
    // share of it, so three 4h members credited 4.5h against a pool of 1.5h.
    assert.ok(familySupply > 0, 'the family contribution must still be credited somewhere');
    assert.ok(
      familySupply <= result.familySupportAbsorbedHours + 0.05,
      `family block supply ${familySupply}h must not exceed the ${result.familySupportAbsorbedHours}h absorbed`
    );
  });

  test('D3: no single contributor supplies more hours than the block is long', () => {
    const caregiver: CaregiverAttributes = {
      ...DEFAULT_CAREGIVER_ATTRIBUTES,
      dailyHoursCommitted: 2,
      secondaryMembers: [member({ id: 'marathon', hoursPerDay: 12, availableTimeBlocks: ['evening'] })]
    };
    const result = CareGapEngine.evaluate(caregiver, dependentPatient);
    const contributors = result.blockGaps.evening.contributors.length;
    assert.ok(
      result.blockGaps.evening.supplyHours <= BLOCK_DURATION_HOURS.evening * contributors + 0.05,
      `evening supply ${result.blockGaps.evening.supplyHours}h exceeds ${contributors} person(s) × 3h window`
    );
  });

  test('D4: a block shortfall is split across unowned tasks, not repeated in full for each', () => {
    const soloCaregiver: CaregiverAttributes = {
      ...DEFAULT_CAREGIVER_ATTRIBUTES,
      name: 'Solo',
      employment: 'full_time',
      dailyHoursCommitted: 1,
      secondaryMembers: []
    };
    const roster = ShiftAllocator.allocate(soloCaregiver, dependentPatient);
    for (const block of ['morning_rush', 'afternoon', 'evening', 'night_watch'] as const) {
      const unmet = roster.uncoveredGaps
        .filter((g) => g.block === block)
        .reduce((sum, g) => sum + g.unmetHours, 0);
      const demand = CareGapEngine.evaluate(soloCaregiver, dependentPatient).blockGaps[block].demandHours;
      assert.ok(
        unmet <= demand + 0.6,
        `${block}: reported ${unmet}h unmet against ${demand}h of demand`
      );
    }
  });

  test('D5: the full prescribed respite count is honoured and evenly spaced', () => {
    const caregiver: CaregiverAttributes = {
      ...teamCaregiver,
      rotationPolicy: {
        rotationInterval: 'weekly',
        primaryCaregiverRespiteDaysPerMonth: 8,
        nightShiftArrangement: 'family_rotation'
      }
    };
    const roster = ShiftAllocator.allocate(caregiver, dependentPatient);
    // The allocator used to hard-cap at 4, silently truncating a clinician's order of up to 10.
    assert.strictEqual(roster.respiteOrders.length, 8);
    const days = roster.respiteOrders.map((o) => o.dayNumber);
    assert.deepStrictEqual(days, [...days].sort((a, b) => a - b));
    assert.ok(days[days.length - 1] <= 28);
  });

  test('D6: the rota cycle follows the family rotation interval', () => {
    const weekly = ShiftAllocator.allocate(
      { ...teamCaregiver, rotationPolicy: { rotationInterval: 'weekly', primaryCaregiverRespiteDaysPerMonth: 4, nightShiftArrangement: 'family_rotation' } },
      dependentPatient
    );
    const monthly = ShiftAllocator.allocate(
      { ...teamCaregiver, rotationPolicy: { rotationInterval: 'monthly', primaryCaregiverRespiteDaysPerMonth: 4, nightShiftArrangement: 'family_rotation' } },
      dependentPatient
    );
    assert.strictEqual(weekly.cycleDays, 7);
    assert.strictEqual(monthly.cycleDays, 28);
  });

  test('D6: the night-watch arrangement decides who takes the night block first', () => {
    const nightCapable = member({ id: 'night_owl', availableTimeBlocks: ['night_watch'], assignedTasks: ['night_care'] });

    const familyRota = ShiftAllocator.allocate(
      {
        ...teamCaregiver,
        secondaryMembers: [nightCapable],
        rotationPolicy: { rotationInterval: 'biweekly', primaryCaregiverRespiteDaysPerMonth: 4, nightShiftArrangement: 'family_rotation' }
      },
      dependentPatient
    );
    assert.strictEqual(familyRota.blocks.night_watch[0]?.assignedMemberId, 'night_owl');

    const primarySolo = ShiftAllocator.allocate(
      {
        ...teamCaregiver,
        secondaryMembers: [nightCapable],
        rotationPolicy: { rotationInterval: 'biweekly', primaryCaregiverRespiteDaysPerMonth: 4, nightShiftArrangement: 'primary_solo' }
      },
      dependentPatient
    );
    assert.strictEqual(primarySolo.blocks.night_watch[0]?.role, 'primary_caregiver');
  });

  test('A4: a combined formal team is read from types[], not just the first hire', () => {
    const combined: CaregiverAttributes = {
      ...DEFAULT_CAREGIVER_ATTRIBUTES,
      dailyHoursCommitted: 2,
      formalSupport: {
        type: 'medical_assistant',
        types: ['paid_attendant_12h', 'medical_assistant'],
        hoursPerDay: 18,
        handlesHeavyTransfers: true,
        handlesMedicationWoundCare: true
      }
    };
    const roster = ShiftAllocator.allocate(combined, dependentPatient);
    // A medical assistant alone never covers the evening; the 12h attendant in types[] does.
    const staffEvening = roster.blocks.evening.some((s) => s.role === 'formal_staff');
    assert.ok(staffEvening, 'the 12h attendant listed in types[] must be rostered');
  });

  test('D8: shifts recur daily for the rota cycle and every attendee has a distinct address', () => {
    const evaluation = CareGapEngine.evaluate(teamCaregiver, dependentPatient);
    const ics = ShiftAllocator.generateCareRosterIcs(teamCaregiver, dependentPatient, evaluation);

    assert.ok(ics.includes('RRULE:FREQ=DAILY;COUNT=14'));
    assert.ok(!ics.includes('FREQ=WEEKLY'));

    const attendees = [...ics.matchAll(/ATTENDEE;CN=[^:]*:mailto:([^\r\n]+)/g)].map((m) => m[1]);
    assert.ok(attendees.length > 1);
    assert.ok(
      new Set(attendees).size > 1,
      'every attendee shared one hardcoded address, so calendar clients collapsed them into one person'
    );
  });

  test('D8: a name containing a comma does not split an iCalendar property', () => {
    const commaNamed: CaregiverAttributes = { ...teamCaregiver, name: 'Devi, Sarojini' };
    const evaluation = CareGapEngine.evaluate(commaNamed, dependentPatient);
    const ics = ShiftAllocator.generateCareRosterIcs(commaNamed, dependentPatient, evaluation);
    assert.ok(ics.includes('Devi\\, Sarojini'));
  });
});

describe('Care circle membership churn', () => {
  const members: CareCircleMember[] = [
    { id: 'mem_self', name: 'Suresh', role: 'Primary Caregiver', phone: '1', isSelf: true, avatarColor: 'bg-emerald-600' }
  ];

  test('C1: matrix additions, renames and removals all propagate to the circle', () => {
    const afterAdd = HealthRepository.reconcileCareCircleMembers(members, [
      { id: 'sec_1', name: 'Rahul' },
      { id: 'sec_2', name: 'Priya' }
    ]);
    assert.strictEqual(afterAdd.length, 3);

    // A rename must follow the member, not create a second person.
    const afterRename = HealthRepository.reconcileCareCircleMembers(afterAdd, [
      { id: 'sec_1', name: 'Rahul Kumar' },
      { id: 'sec_2', name: 'Priya' }
    ]);
    assert.strictEqual(afterRename.length, 3);
    assert.ok(afterRename.some((m) => m.name === 'Rahul Kumar'));
    assert.ok(!afterRename.some((m) => m.name === 'Rahul'));

    // Removal used to be impossible: the sync only ever appended.
    const afterRemoval = HealthRepository.reconcileCareCircleMembers(afterRename, [{ id: 'sec_2', name: 'Priya' }]);
    assert.strictEqual(afterRemoval.length, 2);
    assert.ok(!afterRemoval.some((m) => m.id === matrixLinkedMemberId('sec_1')));

    // Clearing the matrix entirely must also clear its mirrored members.
    assert.strictEqual(HealthRepository.reconcileCareCircleMembers(afterRemoval, []).length, 1);
  });

  test('C2: tasks follow their owner by id and are flagged when the owner leaves', () => {
    const roster = HealthRepository.reconcileCareCircleMembers(members, [{ id: 'sec_1', name: 'Rahul' }]);
    const rahulId = matrixLinkedMemberId('sec_1');
    const tasks: CareCircleTask[] = [
      { id: 't1', title: 'Evening meds', assignedToId: rahulId, assignedToName: 'Rahul', category: 'meds', time: '18:00', isCompleted: false, dueDate: '2026-01-01' }
    ];

    const renamed = HealthRepository.reconcileCareCircleMembers(roster, [{ id: 'sec_1', name: 'Rahul Kumar' }]);
    assert.strictEqual(HealthRepository.reconcileCareCircleTasks(tasks, renamed)[0].assignedToName, 'Rahul Kumar');

    const removed = HealthRepository.reconcileCareCircleMembers(renamed, []);
    const orphaned = HealthRepository.reconcileCareCircleTasks(tasks, removed)[0];
    assert.strictEqual(orphaned.assignedToName, UNASSIGNED_CARE_TASK_OWNER);
    assert.strictEqual(orphaned.assignedToId, undefined);
  });

  test('C2: legacy name-bound tasks are linked to an id on first load', () => {
    const legacy: CareCircleTask[] = [
      { id: 't1', title: 'BP check', assignedToName: 'Suresh', category: 'meds', time: '08:00', isCompleted: false, dueDate: '2026-01-01' }
    ];
    assert.strictEqual(HealthRepository.reconcileCareCircleTasks(legacy, members)[0].assignedToId, 'mem_self');
  });

  test('C3: daily tasks roll over to today and un-tick; stale one-offs are pruned', () => {
    const now = new Date('2026-03-01T09:00:00');
    const today = HealthRepository.careCircleToday(now);
    const tasks: CareCircleTask[] = [
      { id: 'daily', title: 'Morning BP', assignedToName: 'Suresh', category: 'meds', time: '08:00', isCompleted: true, dueDate: '2026-02-27', recurrence: 'daily' },
      { id: 'onceOld', title: 'Collect report', assignedToName: 'Suresh', category: 'general', time: '11:00', isCompleted: true, dueDate: '2026-01-05', recurrence: 'once' },
      { id: 'onceOpen', title: 'Book OPD', assignedToName: 'Suresh', category: 'appointment', time: '11:00', isCompleted: false, dueDate: '2026-01-05', recurrence: 'once' }
    ];

    const rolled = HealthRepository.rolloverCareCircleTasks(tasks, now);
    const daily = rolled.find((t) => t.id === 'daily');
    assert.strictEqual(daily?.dueDate, today, "yesterday's date used to persist forever");
    assert.strictEqual(daily?.isCompleted, false, "yesterday's tick used to show as today's state");
    assert.strictEqual(rolled.find((t) => t.id === 'onceOld'), undefined);
    assert.ok(rolled.find((t) => t.id === 'onceOpen'), 'an open one-off must not be pruned');
  });
});
