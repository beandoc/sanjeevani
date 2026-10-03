import { describe, it, expect, afterEach } from 'vitest';
import {
  estimateCareDemand,
  classifyAgainstCapacity,
  isBandUninformative,
  gradedResponsesFromLegacyKatz,
  katzFromBarthelResponses,
  lawtonFlagsFromResponses,
  BARTHEL_TASK_WEIGHTS,
  BAND_WIDTH,
  CALIBRATION,
  CALIBRATION_REGISTRY,
  MIN_EPISODES_FOR_CALIBRATION,
  type CareDemandInput,
  type CareTimeEstimate
} from './care-demand-model';
import { BARTHEL_ITEMS, LAWTON_ITEMS } from './function-scale';

/** Every Barthel/Lawton item at its most independent level. */
const independent = (): Pick<CareDemandInput, 'barthelResponses' | 'lawtonResponses'> => ({
  barthelResponses: Object.fromEntries(
    BARTHEL_ITEMS.map((i) => [i.id, Math.max(...i.options.map((o) => o.value))])
  ),
  lawtonResponses: Object.fromEntries(
    LAWTON_ITEMS.map((i) => [i.id, Math.max(...i.options.map((o) => o.value))])
  )
});

/** Every item fully dependent. */
const dependent = (): Pick<CareDemandInput, 'barthelResponses' | 'lawtonResponses'> => ({
  barthelResponses: Object.fromEntries(BARTHEL_ITEMS.map((i) => [i.id, 0])),
  lawtonResponses: Object.fromEntries(LAWTON_ITEMS.map((i) => [i.id, 0]))
});

const clinicianObserved = { assessmentSource: 'clinician_observed' as const };

describe('estimateCareDemand — band invariants', () => {
  it('orders every band low <= point <= high and never goes negative', () => {
    const band = estimateCareDemand({ ...dependent(), ...clinicianObserved });
    const estimates: CareTimeEstimate[] = [
      band.directCare, band.supervision, band.onCall, band.activeCare, band.combined,
      ...Object.values(band.blockDemands)
    ];
    for (const e of estimates) {
      expect(e.lowHours).toBeLessThanOrEqual(e.pointHours);
      expect(e.pointHours).toBeLessThanOrEqual(e.highHours);
      expect(e.lowHours).toBeGreaterThanOrEqual(0);
    }
  });

  it('widens the band monotonically as assessment items go unanswered', () => {
    const full = estimateCareDemand({ ...dependent(), ...clinicianObserved });
    const partial = { ...dependent() };
    delete partial.barthelResponses!.bi_bathing;
    delete partial.barthelResponses!.bi_dressing;
    const gappy = estimateCareDemand({ ...partial, ...clinicianObserved });

    expect(gappy.bandRelativeHalfWidth).toBeGreaterThan(full.bandRelativeHalfWidth);
    expect(gappy.inputCompleteness.missing.length).toBe(2);
  });

  it('widens the band for proxy and self report over clinician observation', () => {
    const observed = estimateCareDemand({ ...dependent(), assessmentSource: 'clinician_observed' });
    const proxy = estimateCareDemand({ ...dependent(), assessmentSource: 'family_proxy' });
    const unrecorded = estimateCareDemand({ ...dependent(), assessmentSource: 'not_recorded' });

    expect(proxy.bandRelativeHalfWidth).toBeGreaterThan(observed.bandRelativeHalfWidth);
    expect(unrecorded.bandRelativeHalfWidth).toBeGreaterThan(proxy.bandRelativeHalfWidth);
    expect(proxy.bandBasis.join(' ')).toMatch(/overestimate assistance time/i);
  });

  it('always states the published variance ceiling as a reason the band is wide', () => {
    const band = estimateCareDemand({ ...dependent(), ...clinicianObserved });
    expect(band.bandBasis.join(' ')).toMatch(/16-24%/);
    // With an empty registry nothing is measured, so the basis says so plainly.
    expect(band.bandBasis.join(' ')).toMatch(/has been measured locally|measured locally/i);
  });

  it('caps the half-width and reports when the band is uninformative', () => {
    const worst = estimateCareDemand({
      legacyKatzAdl: { bathing: false, dressing: false, toileting: false, transferring: false, continence: false, feeding: false },
      assessmentSource: 'not_recorded'
    });
    expect(worst.bandRelativeHalfWidth).toBeLessThanOrEqual(BAND_WIDTH.max);
    expect(isBandUninformative(worst)).toBe(true);
  });
});

describe('estimateCareDemand — the removed baseline floor', () => {
  it('yields zero demand for a fully independent patient with no other risk', () => {
    const band = estimateCareDemand({
      ...independent(),
      cognitiveBehavioralLoad: 'none',
      fallHistoryLast6Months: 0,
      isBedBound: false,
      ...clinicianObserved
    });
    // The old model applied a flat 1.5h/day baseline to every patient, so a
    // fully independent elder could never show a zero gap. That floor was
    // unfalsifiable and is gone.
    expect(band.activeCare.pointHours).toBe(0);
    expect(band.activeCare.lowHours).toBe(0);
    expect(band.directCare.pointHours).toBe(0);
    expect(band.requiresNightPresence).toBe(false);
    expect(band.drivers).toHaveLength(0);
  });
});

describe('estimateCareDemand — non-additivity', () => {
  it('credits shared setup so co-occurring morning tasks total less than the sum of each alone', () => {
    const only = (id: string) => {
      const r = independent();
      r.barthelResponses![id] = 0;
      return estimateCareDemand({ ...r, ...clinicianObserved }).directCare.pointHours;
    };
    const together = () => {
      const r = independent();
      r.barthelResponses!.bi_bathing = 0;
      r.barthelResponses!.bi_dressing = 0;
      r.barthelResponses!.bi_grooming = 0;
      return estimateCareDemand({ ...r, ...clinicianObserved });
    };
    const sumAlone = only('bi_bathing') + only('bi_dressing') + only('bi_grooming');
    const combined = together();

    expect(combined.directCare.pointHours).toBeLessThan(sumAlone);
    expect(combined.sharedOverheadCreditMinutes).toBeGreaterThan(0);
  });
});

describe('estimateCareDemand — two-person transfers', () => {
  it('charges a two-person transfer roughly double a one-person transfer', () => {
    const at = (value: number) => {
      const r = independent();
      r.barthelResponses!.bi_transfer = value;
      const band = estimateCareDemand({ ...r, ...clinicianObserved });
      return band.drivers.find((d) => d.itemId === 'bi_transfer');
    };
    const majorHelp = at(5);   // "major help (one or two people, physical)"
    const minorHelp = at(10);  // "minor help (verbal or physical)"

    expect(majorHelp?.staffRequired).toBe(2);
    expect(minorHelp?.staffRequired).toBe(1);
    // The difference comes from staff count, not from inflating a single-staff
    // duration — which a per-deficit hour constant could never express.
    expect(majorHelp!.minutesPerDay).toBeGreaterThan(minorHelp!.minutesPerDay * 1.8);
  });
});

describe('estimateCareDemand — frequency drives the estimate', () => {
  it('scales with task frequency at a fixed dependence level', () => {
    const base = independent();
    base.barthelResponses!.bi_toilet = 0;
    const normal = estimateCareDemand({ ...base, ...clinicianObserved });
    const frequent = estimateCareDemand({ ...base, frequencyOverrides: { bi_toilet: 12 }, ...clinicianObserved });

    expect(frequent.directCare.pointHours).toBeGreaterThan(normal.directCare.pointHours);
    expect(frequent.drivers.find((d) => d.itemId === 'bi_toilet')?.frequencyOverridden).toBe(true);
  });

  it('notes when frequencies are model defaults rather than clinician-confirmed', () => {
    const band = estimateCareDemand({ ...dependent(), ...clinicianObserved });
    expect(band.bandBasis.join(' ')).toMatch(/model defaults/i);
  });

  it('amortises a weekly IADL to far less daily time than a thrice-daily one', () => {
    const one = (id: string) => {
      const r = independent();
      r.lawtonResponses![id] = 0;
      return estimateCareDemand({ ...r, ...clinicianObserved });
    };
    const meals = one('iadl_food');       // 3x daily
    const transport = one('iadl_transport'); // ~weekly
    expect(meals.directCare.pointHours).toBeGreaterThan(transport.directCare.pointHours * 4);
  });
});

describe('estimateCareDemand — premorbid role is not functional loss', () => {
  it('gives the same demand whether never-performed items are scored dependent or excluded', () => {
    const never = ['iadl_food', 'iadl_housekeeping', 'iadl_laundry'];

    // A man who never cooked, scored "dependent" on the household items.
    const scoredDependent = independent();
    for (const id of never) scoredDependent.lawtonResponses![id] = 0;

    const withExclusions = estimateCareDemand({
      ...scoredDependent,
      premorbidlyNotPerformed: never,
      ...clinicianObserved
    });
    // The same patient with those items simply left out of the picture.
    const asIndependent = estimateCareDemand({ ...independent(), ...clinicianObserved });

    expect(withExclusions.activeCare.pointHours).toBe(asIndependent.activeCare.pointHours);
    expect(withExclusions.drivers.some((d) => never.includes(d.itemId))).toBe(false);
  });

  it('still charges for a task the patient can no longer perform', () => {
    const lost = independent();
    lost.lawtonResponses!.iadl_food = 0;
    const band = estimateCareDemand({ ...lost, ...clinicianObserved });
    // "Can no longer cook" is real care work; "never cooked" is not. The model
    // must distinguish them, which a bare dependent/independent flag cannot.
    expect(band.drivers.some((d) => d.itemId === 'iadl_food')).toBe(true);
    expect(band.activeCare.pointHours).toBeGreaterThan(0);
  });
});

describe('estimateCareDemand — the three time types stay separate', () => {
  it('reports night presence as on-call, not as hands-on work', () => {
    const band = estimateCareDemand({
      ...independent(),
      cognitiveBehavioralLoad: 'severe_sundowning',
      ...clinicianObserved
    });
    expect(band.requiresNightPresence).toBe(true);
    expect(band.onCall.pointHours).toBeGreaterThan(0);
    expect(band.directCare.pointHours).toBe(0);
    // Supervision is active vigilance, so sundowning lands there, not in on-call.
    expect(band.supervision.pointHours).toBeGreaterThan(0);
    // activeCare must exclude on-call, or it stops being comparable with a
    // caregiver's working capacity.
    expect(band.activeCare.pointHours).toBe(
      Math.round((band.directCare.pointHours + band.supervision.pointHours) * 10) / 10
    );
  });

  it('gives a hands-on patient and a night-presence patient opposite profiles', () => {
    const handsOn = independent();
    handsOn.barthelResponses!.bi_toilet = 0;
    handsOn.barthelResponses!.bi_dressing = 0;
    const a = estimateCareDemand({ ...handsOn, ...clinicianObserved });

    const b = estimateCareDemand({
      ...independent(),
      cognitiveBehavioralLoad: 'wandering_agitation',
      ...clinicianObserved
    });

    expect(a.directCare.pointHours).toBeGreaterThan(0);
    expect(a.onCall.pointHours).toBe(0);
    expect(b.directCare.pointHours).toBe(0);
    expect(b.onCall.pointHours).toBeGreaterThan(0);
  });

  it('never lets a block demand exceed its own wall-clock length', () => {
    const band = estimateCareDemand({ ...dependent(), isBedBound: true, cognitiveBehavioralLoad: 'severe_sundowning', ...clinicianObserved });
    // Night presence used to be folded into night_watch, pushing that block's
    // demand past the 8 hours the block actually contains.
    expect(band.blockDemands.night_watch.pointHours).toBeLessThanOrEqual(8);
  });
});

describe('estimateCareDemand — legacy binary input', () => {
  it('produces a strictly wider band than graded input for the equivalent patient', () => {
    const katz = { bathing: false, dressing: false, toileting: false, transferring: false, continence: false, feeding: false };
    // Lawton supplied in both arms so neither is driven to the half-width cap by
    // unanswered items — the comparison under test is granularity, not completeness.
    const lawtonResponses = independent().lawtonResponses;
    const legacy = estimateCareDemand({ legacyKatzAdl: katz, lawtonResponses, ...clinicianObserved });
    const graded = estimateCareDemand({
      barthelResponses: gradedResponsesFromLegacyKatz(katz),
      lawtonResponses,
      ...clinicianObserved
    });

    expect(legacy.inputGranularity).toBe('legacy_binary');
    expect(graded.inputGranularity).toBe('graded');
    expect(legacy.bandRelativeHalfWidth).toBeGreaterThan(graded.bandRelativeHalfWidth);
    expect(legacy.bandBasis.join(' ')).toMatch(/graded assistance level/i);
  });
});

describe('estimateCareDemand — Barthel ordinality', () => {
  it('does not assume care time is monotonic in the Barthel option value', () => {
    // A wheelchair-independent patient (value 5) needs less assistance than one
    // who walks with the help of a person (value 10). The scale is ordinal, not
    // an interval time scale, and the model must reflect that rather than
    // "correcting" it. This is the clearest single demonstration of why a summed
    // Barthel or Katz total cannot be converted to hours.
    const w = BARTHEL_TASK_WEIGHTS.bi_mobility;
    const minutesAt = (v: number) => w[v].frequencyPerDay * w[v].minutesPerEpisode * w[v].staffRequired;
    expect(minutesAt(5)).toBeLessThan(minutesAt(10));
  });
});

describe('classifyAgainstCapacity', () => {
  const band = (low: number, point: number, high: number): CareTimeEstimate => ({
    lowHours: low, pointHours: point, highHours: high
  });

  it('asserts a deficit only when the entire band exceeds capacity', () => {
    expect(classifyAgainstCapacity(band(6, 8, 10), 5)).toBe('deficit');
  });

  it('reports indeterminate when the band straddles capacity', () => {
    // The honest answer. Asserting a deficit from an estimate whose own range
    // includes "covered" would be claiming more than the model can support.
    expect(classifyAgainstCapacity(band(3, 6, 9), 5)).toBe('indeterminate');
  });

  it('reports covered only when the whole band fits within capacity', () => {
    expect(classifyAgainstCapacity(band(1, 2, 4), 5)).toBe('covered');
  });
});

describe('estimateCareDemand — provenance', () => {
  it('carries unvalidated, low-confidence provenance with named limitations', () => {
    const band = estimateCareDemand({ ...dependent(), ...clinicianObserved });
    expect(band.provenance.validated).toBe(false);
    expect(band.provenance.confidence).toBe('low');
    expect(band.provenance.evidenceLevel).toBe('local-heuristic');
    expect(band.provenance.knownLimitations?.length).toBeGreaterThan(0);
  });

  it('attributes demand to specific items so a clinician can audit the estimate', () => {
    const band = estimateCareDemand({ ...dependent(), ...clinicianObserved });
    const transfer = band.drivers.find((d) => d.itemId === 'bi_transfer');
    expect(transfer).toBeDefined();
    expect(transfer!.minutesPerDay).toBeGreaterThan(0);
    // Drivers are ordered largest-first so the dominant cost is visible.
    expect(band.drivers[0].minutesPerDay).toBeGreaterThanOrEqual(band.drivers[1].minutesPerDay);
  });
});

describe('estimateCareDemand — supervision must not double-count task time', () => {
  it('does not charge supervision minutes that hands-on care already occupies', () => {
    // A caregiver assisting with toileting is already supervising. Counting the
    // full supervision requirement on top of the task time bills the same
    // minutes twice — the classic inflation in task-based estimates.
    const supervisionOnly = estimateCareDemand({
      ...independent(),
      cognitiveBehavioralLoad: 'wandering_agitation',
      ...clinicianObserved
    });

    const withTasks = { ...independent() };
    withTasks.barthelResponses!.bi_toilet = 0;
    withTasks.barthelResponses!.bi_dressing = 0;
    withTasks.barthelResponses!.bi_bathing = 0;
    const both = estimateCareDemand({
      ...withTasks,
      cognitiveBehavioralLoad: 'wandering_agitation',
      ...clinicianObserved
    });

    // Supervision is credited down where hands-on care overlaps it.
    expect(both.supervision.pointHours).toBeLessThan(supervisionOnly.supervision.pointHours);
    expect(both.supervisionOverlapCreditMinutes).toBeGreaterThan(0);

    // And the total is therefore less than naive addition would give.
    const naive = supervisionOnly.supervision.pointHours + both.directCare.pointHours;
    expect(both.activeCare.pointHours).toBeLessThan(naive);
  });

  it('de-overlaps per block, so morning care does not discharge evening supervision', () => {
    // Supervision needed in the evening is not satisfied by hands-on care
    // delivered in the morning; they are different minutes.
    const morningOnly = { ...independent() };
    morningOnly.barthelResponses!.bi_bathing = 0; // morning_rush only
    const band = estimateCareDemand({
      ...morningOnly,
      cognitiveBehavioralLoad: 'severe_sundowning',
      ...clinicianObserved
    });
    // Sundowning supervision is weighted to evening and night, so most of it
    // survives the morning task overlap.
    expect(band.supervision.pointHours).toBeGreaterThan(0);
  });
});

describe('estimateCareDemand — coverage is elapsed time, not workload', () => {
  it('reports coverage as the longer of supervision and hands-on, never their sum', () => {
    const r = { ...independent() };
    r.barthelResponses!.bi_toilet = 0;
    const band = estimateCareDemand({
      ...r,
      cognitiveBehavioralLoad: 'wandering_agitation',
      ...clinicianObserved
    });
    // If somebody must be present for a supervision window and the task
    // assistance happens inside it, coverage is the window — not window + task.
    const naiveSum = band.directCare.pointHours + band.supervision.pointHours + band.onCall.pointHours;
    expect(band.coverage.pointHours).toBeLessThanOrEqual(naiveSum);
  });

  it('never requires more presence in a block than the block is long', () => {
    const band = estimateCareDemand({
      ...dependent(),
      isBedBound: true,
      cognitiveBehavioralLoad: 'severe_sundowning',
      ...clinicianObserved
    });
    expect(band.coverageByBlock.morning_rush.pointHours).toBeLessThanOrEqual(3);
    expect(band.coverageByBlock.afternoon.pointHours).toBeLessThanOrEqual(3);
    expect(band.coverageByBlock.evening.pointHours).toBeLessThanOrEqual(3);
    expect(band.coverageByBlock.night_watch.pointHours).toBeLessThanOrEqual(8);
    expect(band.coverage.pointHours).toBeLessThanOrEqual(24);
  });

  it('separates two-carer workload from elapsed time', () => {
    // Two carers for 15 minutes is 30 caregiver-minutes but 15 minutes elapsed.
    const r = { ...independent() };
    r.barthelResponses!.bi_transfer = 5; // two-person transfer
    const band = estimateCareDemand({ ...r, ...clinicianObserved });
    const transfer = band.drivers.find((d) => d.itemId === 'bi_transfer')!;
    expect(transfer.staffRequired).toBe(2);
    // Workload counts both carers; coverage counts the clock once.
    expect(band.directCare.pointHours).toBeGreaterThan(band.coverage.pointHours);
  });
});

describe('reconciling the two functional assessments', () => {
  it('derives Katz booleans from graded Barthel so the two cannot drift apart', () => {
    const graded = independent().barthelResponses!;
    const katz = katzFromBarthelResponses(graded);
    expect(katz).toEqual({
      bathing: true, dressing: true, toileting: true,
      transferring: true, continence: true, feeding: true
    });
  });

  it('treats partial assistance as dependence, since Katz cannot express a gradient', () => {
    const graded = { ...independent().barthelResponses! };
    graded.bi_transfer = 10; // "minor help" — real help, but not full dependence
    const katz = katzFromBarthelResponses(graded)!;
    // Mapping down to a boolean must never understate dependence.
    expect(katz.transferring).toBe(false);
  });

  it('marks continence dependent when either bowel or bladder needs help', () => {
    const graded = { ...independent().barthelResponses! };
    graded.bi_bladder = 5;
    const katz = katzFromBarthelResponses(graded)!;
    // Katz has one continence item where Barthel has two; dependence in either
    // means continence care is required.
    expect(katz.continence).toBe(false);
  });

  it('returns undefined rather than guessing when graded data is incomplete', () => {
    const partial = { ...independent().barthelResponses! };
    delete partial.bi_toilet;
    expect(katzFromBarthelResponses(partial)).toBeUndefined();
  });

  it('derives the legacy Lawton flags from graded responses', () => {
    const graded = { ...independent().lawtonResponses! };
    graded.iadl_food = 0;
    const flags = lawtonFlagsFromResponses(graded);
    expect(flags.mealPreparation).toBe(false);
    expect(flags.finances).toBe(true);
  });
});

describe('per-coefficient calibration registry', () => {
  // The registry is module-level mutable state so a calibration study can load
  // measured values into it. Tests must leave it as they found it.
  afterEach(() => {
    for (const key of Object.keys(CALIBRATION_REGISTRY)) delete CALIBRATION_REGISTRY[key];
  });

  const toiletHeavy = () => {
    const r = independent();
    r.barthelResponses!.bi_toilet = 0;
    return r;
  };

  it('reports everything as unmeasured while the registry is empty', () => {
    const band = estimateCareDemand({ ...toiletHeavy(), ...clinicianObserved });
    expect(band.calibrationCoverage.uncalibratedShare).toBe(1);
    expect(band.calibrationCoverage.calibratedMinutesPerDay).toBe(0);
    expect(band.calibrationCoverage.uncalibratedCells).toContain('bi_toilet:0');
    expect(band.drivers.every((d) => d.calibrated === false)).toBe(true);
  });

  it('uses a measured coefficient in place of the consensus default', () => {
    const consensus = estimateCareDemand({ ...toiletHeavy(), ...clinicianObserved });
    const consensusDriver = consensus.drivers.find((d) => d.itemId === 'bi_toilet')!;

    CALIBRATION_REGISTRY['bi_toilet:0'] = {
      minutesPerEpisode: 4, // measured shorter than the 10-minute assumption
      frequencyPerDay: 5,
      minutesSe: 1.1,
      episodeCount: 240,
      biasCorrectionApplied: true,
      calibratedAt: '2026-10-03'
    };

    const measured = estimateCareDemand({ ...toiletHeavy(), ...clinicianObserved });
    const measuredDriver = measured.drivers.find((d) => d.itemId === 'bi_toilet')!;

    expect(measuredDriver.minutesPerEpisode).toBe(4);
    expect(measuredDriver.frequencyPerDay).toBe(5);
    expect(measuredDriver.calibrated).toBe(true);
    expect(measuredDriver.calibrationEpisodeCount).toBe(240);
    expect(measuredDriver.minutesPerDay).toBeLessThan(consensusDriver.minutesPerDay);
  });

  it('ignores a cell with too few observed episodes rather than trusting noise', () => {
    CALIBRATION_REGISTRY['bi_toilet:0'] = {
      minutesPerEpisode: 4,
      episodeCount: MIN_EPISODES_FOR_CALIBRATION - 1
    };
    const band = estimateCareDemand({ ...toiletHeavy(), ...clinicianObserved });
    const driver = band.drivers.find((d) => d.itemId === 'bi_toilet')!;
    // Under-powered measurement must not narrow the band or move the estimate.
    expect(driver.calibrated).toBe(false);
    expect(driver.minutesPerEpisode).toBe(10);
    expect(band.calibrationCoverage.uncalibratedShare).toBe(1);
  });

  it('narrows the band as the registry fills, in proportion to minutes covered', () => {
    const before = estimateCareDemand({ ...dependent(), ...clinicianObserved });

    // Measure the single largest driver: the two-person transfer.
    const biggest = before.drivers[0];
    const key = before.calibrationCoverage.uncalibratedCells[0];
    CALIBRATION_REGISTRY[key] = {
      minutesPerEpisode: biggest.minutesPerEpisode,
      frequencyPerDay: biggest.frequencyPerDay,
      episodeCount: 300
    };

    const after = estimateCareDemand({ ...dependent(), ...clinicianObserved });

    expect(after.calibrationCoverage.uncalibratedShare).toBeLessThan(
      before.calibrationCoverage.uncalibratedShare
    );
    expect(after.bandRelativeHalfWidth).toBeLessThan(before.bandRelativeHalfWidth);
  });

  it('widens the band for the patient whose demand rests on unmeasured cells, not for the one whose does not', () => {
    // This is the whole point of a per-coefficient registry: two patients at the
    // same moment get different uncertainty, because different cells drive them.
    CALIBRATION_REGISTRY['bi_toilet:0'] = {
      minutesPerEpisode: 10,
      frequencyPerDay: 6,
      episodeCount: 400
    };

    const measuredProfile = estimateCareDemand({ ...toiletHeavy(), ...clinicianObserved });

    const unmeasured = independent();
    unmeasured.barthelResponses!.bi_transfer = 5; // unmeasured two-person transfer
    const unmeasuredProfile = estimateCareDemand({ ...unmeasured, ...clinicianObserved });

    expect(measuredProfile.calibrationCoverage.uncalibratedShare).toBe(0);
    expect(unmeasuredProfile.calibrationCoverage.uncalibratedShare).toBe(1);
    expect(measuredProfile.bandRelativeHalfWidth).toBeLessThan(
      unmeasuredProfile.bandRelativeHalfWidth
    );
  });

  it('names the largest unmeasured drivers once the registry is partly filled', () => {
    // With nothing measured the basis says so flatly; naming three of twenty
    // cells would imply the rest were fine. Once some cells ARE measured, the
    // remaining ones are worth naming, because they are what the clinician
    // could act on by confirming frequencies or commissioning measurement.
    const empty = estimateCareDemand({ ...dependent(), ...clinicianObserved });
    expect(empty.bandBasis.join(' ')).toMatch(/No coefficient in this estimate has been measured/i);

    CALIBRATION_REGISTRY['bi_toilet:0'] = {
      minutesPerEpisode: 10,
      frequencyPerDay: 6,
      episodeCount: 400
    };
    const partial = estimateCareDemand({ ...dependent(), ...clinicianObserved });
    const basis = partial.bandBasis.join(' ');
    expect(basis).toMatch(/% of this estimate rests on coefficients never measured locally/i);
    expect(basis).toMatch(/largest:/i);
  });

  it('keys Barthel cells by the level actually matched, not the raw response', () => {
    // A tolerant lookup that matched one level but reported another would credit
    // one cell's measurement to a different cell's estimate.
    const r = independent();
    r.barthelResponses!.bi_transfer = 7; // not a defined option; resolves down to 5
    const band = estimateCareDemand({ ...r, ...clinicianObserved });
    expect(band.calibrationCoverage.uncalibratedCells).toContain('bi_transfer:5');
    expect(band.calibrationCoverage.uncalibratedCells).not.toContain('bi_transfer:7');
  });

  it('lets a clinician frequency override beat a measured population frequency', () => {
    CALIBRATION_REGISTRY['bi_toilet:0'] = {
      minutesPerEpisode: 10,
      frequencyPerDay: 6,
      episodeCount: 400
    };
    const band = estimateCareDemand({
      ...toiletHeavy(),
      frequencyOverrides: { bi_toilet: 12 },
      ...clinicianObserved
    });
    const driver = band.drivers.find((d) => d.itemId === 'bi_toilet')!;
    // The clinician is describing this patient; the study described a population.
    expect(driver.frequencyPerDay).toBe(12);
    expect(driver.frequencyOverridden).toBe(true);
    expect(driver.calibrated).toBe(true);
  });

  it('keeps study-level calibration false until the registry actually covers estimates', () => {
    expect(CALIBRATION.calibrated).toBe(false);
    expect(CALIBRATION.measuredBandHalfWidth).toBeNull();
    expect(CALIBRATION.outcomeDefinition).toBeNull();
  });
});
