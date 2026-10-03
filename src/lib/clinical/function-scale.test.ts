import { describe, it, expect } from 'vitest';
import {
  BARTHEL_ITEMS,
  LAWTON_ITEMS,
  getBarthelBand,
  calculateFunctionScore,
  isComparableTo,
  LAWTON_MALE_5_OMITTED_ITEMS
} from './function-scale';

function allMax(responses: Record<string, number> = {}, items = BARTHEL_ITEMS) {
  const out: Record<string, number> = { ...responses };
  for (const item of items) {
    if (!(item.id in out)) {
      out[item.id] = Math.max(...item.options.map((o) => o.value));
    }
  }
  return out;
}

function allZero(items = BARTHEL_ITEMS) {
  const out: Record<string, number> = {};
  for (const item of items) out[item.id] = 0;
  return out;
}

describe('getBarthelBand boundaries', () => {
  it('bands the total-dependency boundary correctly (0/20/21)', () => {
    expect(getBarthelBand(0)).toBe('total');
    expect(getBarthelBand(20)).toBe('total');
    expect(getBarthelBand(21)).toBe('severe');
  });

  it('bands the severe/moderate boundary correctly (60/61)', () => {
    expect(getBarthelBand(60)).toBe('severe');
    expect(getBarthelBand(61)).toBe('moderate');
  });

  it('bands the moderate/slight boundary correctly (90/91)', () => {
    expect(getBarthelBand(90)).toBe('moderate');
    expect(getBarthelBand(91)).toBe('slight');
  });

  it('bands the slight/independent boundary correctly (99/100)', () => {
    expect(getBarthelBand(99)).toBe('slight');
    expect(getBarthelBand(100)).toBe('independent');
  });
});

describe('calculateFunctionScore', () => {
  it('scores full independence as 100/8 with 0 dependency', () => {
    const result = calculateFunctionScore(allMax(), allMax({}, LAWTON_ITEMS), 'enc_1');
    expect(result.barthelScore).toBe(100);
    expect(result.lawtonScore).toBe(8);
    expect(result.dependencyPercentage).toBe(0);
    expect(result.band).toBe('independent');
    expect(result.careIntensityFlags).toHaveLength(0);
    expect(result.encounterId).toBe('enc_1');
  });

  it('scores full dependence as 0/0 with 100 dependency and total band', () => {
    const result = calculateFunctionScore(allZero(BARTHEL_ITEMS), allZero(LAWTON_ITEMS));
    expect(result.barthelScore).toBe(0);
    expect(result.lawtonScore).toBe(0);
    expect(result.dependencyPercentage).toBe(100);
    expect(result.band).toBe('total');
  });

  it('flags care-intensity drivers only when fully lost (value 0)', () => {
    const responses = allMax();
    responses['bi_bowels'] = 0; // isCareIntensityDriver
    responses['bi_transfer'] = 5; // isCareIntensityDriver, but partial (not 0) -> should NOT flag
    const result = calculateFunctionScore(responses, allMax({}, LAWTON_ITEMS));
    const flagTexts = result.careIntensityFlags;
    expect(flagTexts).toContain('Bowel control');
    expect(flagTexts).not.toContain('Transfers (bed to chair and back)');
  });

  it('snaps an illegal response value to the nearest legal option instead of accepting it', () => {
    // bi_bathing only offers {0, 5}. A stray "3" should snap to 5 (closer) not be treated as raw 3.
    const responses = allMax();
    responses['bi_bathing'] = 3;
    const result = calculateFunctionScore(responses, allMax({}, LAWTON_ITEMS));
    // Total should still be 100 since 3 snaps to 5 (the max, same as before).
    expect(result.barthelScore).toBe(100);
  });

  it('treats a missing response as 0, not as a crash', () => {
    const responses = allMax();
    delete responses['bi_stairs'];
    const result = calculateFunctionScore(responses, allMax({}, LAWTON_ITEMS));
    expect(result.barthelScore).toBe(90); // 100 - 10 (stairs max)
  });

  it('records the premorbid-adjusted convention by default and scores all 8 items', () => {
    const result = calculateFunctionScore(allMax(), allZero(LAWTON_ITEMS));
    // The default no longer claims plain 'all-8'. It is
    // 'all-8-premorbid-adjusted': all 8 items are scored unless the assessor
    // marks specific ones as never performed. With no exclusions declared the
    // numeric result is identical to all-8, but the label records that the
    // premorbid question was in scope — which matters when comparing serially
    // against a record that did declare exclusions.
    expect(result.lawtonConvention).toBe('all-8-premorbid-adjusted');
    expect(result.lawtonExcludedItems).toEqual([]);
    expect(result.lawtonScore).toBe(0);
    expect(result.lawtonMax).toBe(8);
  });

  it('produces a domain breakdown whose percentages are internally consistent', () => {
    const result = calculateFunctionScore(allMax(), allMax({}, LAWTON_ITEMS));
    for (const d of result.domainBreakdown) {
      expect(d.percentage).toBe(Math.round((d.rawScore / d.maxScore) * 100));
    }
  });
});

describe('Lawton scoring conventions', () => {
  const dependentHousehold = () => ({
    iadl_phone: 1,
    iadl_shopping: 1,
    iadl_food: 0,
    iadl_housekeeping: 0,
    iadl_laundry: 0,
    iadl_transport: 1,
    iadl_medication: 1,
    iadl_finances: 1
  });

  it('excludes premorbidly never-performed items from numerator and denominator', () => {
    // A man who never cooked, kept house or did laundry. Scoring those items as
    // "dependent" mistakes household role for functional incapacity — and in a
    // care-time model it manufactures demand for care nobody newly absorbs.
    const never = ['iadl_food', 'iadl_housekeeping', 'iadl_laundry'];
    const adjusted = calculateFunctionScore(allMax(), dependentHousehold(), {
      convention: 'all-8-premorbid-adjusted',
      premorbidlyNotPerformed: never
    });

    expect(adjusted.lawtonMax).toBe(5);
    expect(adjusted.lawtonScore).toBe(5);
    expect(adjusted.lawtonExcludedItems.sort()).toEqual([...never].sort());
  });

  it('scores the same patient as impaired when all 8 items are counted', () => {
    const plain = calculateFunctionScore(allMax(), dependentHousehold(), { convention: 'all-8' });
    expect(plain.lawtonMax).toBe(8);
    expect(plain.lawtonScore).toBe(5);
    expect(plain.lawtonExcludedItems).toEqual([]);
  });

  it('reproduces the legacy male-5 convention only when explicitly declared', () => {
    const male5 = calculateFunctionScore(allMax(), dependentHousehold(), { convention: 'male-5' });
    // Lawton & Brody (1969) omitted food preparation, housekeeping and laundry
    // for men. Retained for reproducibility, never applied automatically from
    // gender — premorbid flags are more informative and auditable.
    expect(male5.lawtonMax).toBe(5);
    expect(male5.lawtonExcludedItems.sort()).toEqual(
      [...LAWTON_MALE_5_OMITTED_ITEMS].sort()
    );
  });

  it('records the reporting source without letting it change the score', () => {
    const proxy = calculateFunctionScore(allMax(), allMax({}, LAWTON_ITEMS), {
      assessmentSource: 'family_proxy'
    });
    const observed = calculateFunctionScore(allMax(), allMax({}, LAWTON_ITEMS), {
      assessmentSource: 'clinician_observed'
    });
    expect(proxy.assessmentSource).toBe('family_proxy');
    expect(observed.assessmentSource).toBe('clinician_observed');
    expect(proxy.lawtonScore).toBe(observed.lawtonScore);
  });

  it('retains the raw graded responses so the assistance gradient survives persistence', () => {
    const responses = { ...allMax() };
    responses.bi_transfer = 5; // "major help (one or two people)" — a two-person task
    const result = calculateFunctionScore(responses, allMax({}, LAWTON_ITEMS));
    expect(result.barthelResponses.bi_transfer).toBe(5);
    expect(Object.keys(result.lawtonResponses)).toHaveLength(LAWTON_ITEMS.length);
  });

  it('refuses to treat differing conventions as a comparable trend', () => {
    const a = calculateFunctionScore(allMax(), dependentHousehold(), { convention: 'all-8' });
    const b = calculateFunctionScore(allMax(), dependentHousehold(), {
      convention: 'all-8-premorbid-adjusted',
      premorbidlyNotPerformed: ['iadl_food']
    });
    const c = calculateFunctionScore(allMax(), dependentHousehold(), { convention: 'all-8' });

    // Different denominators are different scales; plotting them as a trend
    // would show decline or recovery that never happened.
    expect(isComparableTo(a, b)).toBe(false);
    expect(isComparableTo(a, c)).toBe(true);
  });
});
