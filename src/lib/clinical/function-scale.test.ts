import { describe, it, expect } from 'vitest';
import {
  BARTHEL_ITEMS,
  LAWTON_ITEMS,
  getBarthelBand,
  calculateFunctionScore
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

  it('always records the all-8 Lawton convention', () => {
    const result = calculateFunctionScore(allMax(), allZero(LAWTON_ITEMS));
    expect(result.lawtonConvention).toBe('all-8');
    expect(result.lawtonScore).toBe(0);
  });

  it('produces a domain breakdown whose percentages are internally consistent', () => {
    const result = calculateFunctionScore(allMax(), allMax({}, LAWTON_ITEMS));
    for (const d of result.domainBreakdown) {
      expect(d.percentage).toBe(Math.round((d.rawScore / d.maxScore) * 100));
    }
  });
});
