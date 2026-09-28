import { describe, it, expect } from 'vitest';
import {
  calculateZaritScore,
  getItemsForTier,
  ZBI_12_ITEM_IDS,
  ZBI_4_ITEM_IDS,
  ZBI_22_ITEMS,
  SELF_HARM_SCREENING_QUESTION
} from './zarit-scale';

describe('Zarit Scale Psychometric Validation & Bédard Short Forms (C1 & C5)', () => {
  describe('C1: Validated Item Sets (Bédard et al. 2001)', () => {
    it('ZBI_12_ITEM_IDS strictly matches Bédard et al. 2001 (items 2, 3, 5, 6, 9, 10, 17, 18, 19, 20, 21, 22)', () => {
      const expectedZbi12 = [
        'zbi_2', 'zbi_3', 'zbi_5', 'zbi_6', 'zbi_9', 'zbi_10',
        'zbi_17', 'zbi_18', 'zbi_19', 'zbi_20', 'zbi_21', 'zbi_22'
      ];
      expect(ZBI_12_ITEM_IDS).toEqual(expectedZbi12);
      expect(ZBI_12_ITEM_IDS).toHaveLength(12);

      const items12 = getItemsForTier('ZBI12');
      expect(items12.map((i) => i.id)).toEqual(expectedZbi12);
    });

    it('ZBI_4_ITEM_IDS strictly matches Bédard screening version (items 2, 3, 9, 17)', () => {
      const expectedZbi4 = ['zbi_2', 'zbi_3', 'zbi_9', 'zbi_17'];
      expect(ZBI_4_ITEM_IDS).toEqual(expectedZbi4);
      expect(ZBI_4_ITEM_IDS).toHaveLength(4);

      const items4 = getItemsForTier('ZBI4');
      expect(items4.map((i) => i.id)).toEqual(expectedZbi4);
    });

    it('ZBI-12 cutoffs apply correctly (<12 low, <17 moderate, <28 high, >=28 critical)', () => {
      // Score 11 (normal)
      const lowResult = calculateZaritScore(
        { zbi_2: 3, zbi_3: 3, zbi_5: 3, zbi_6: 2 },
        'ZBI12'
      );
      expect(lowResult.totalScore).toBe(11);
      expect(lowResult.severityBand).toBe('normal');

      // Score 12 (amber)
      const modResult = calculateZaritScore(
        { zbi_2: 3, zbi_3: 3, zbi_5: 3, zbi_6: 3 },
        'ZBI12'
      );
      expect(modResult.totalScore).toBe(12);
      expect(modResult.severityBand).toBe('amber');

      // Score 17 (red)
      const highResult = calculateZaritScore(
        { zbi_2: 3, zbi_3: 3, zbi_5: 3, zbi_6: 3, zbi_9: 3, zbi_10: 2 },
        'ZBI12'
      );
      expect(highResult.totalScore).toBe(17);
      expect(highResult.severityBand).toBe('red');

      // Score 28 (critical_red)
      const critResult = calculateZaritScore(
        {
          zbi_2: 3, zbi_3: 3, zbi_5: 3, zbi_6: 3, zbi_9: 3, zbi_10: 3,
          zbi_17: 3, zbi_18: 3, zbi_19: 2, zbi_20: 2
        },
        'ZBI12'
      );
      expect(critResult.totalScore).toBe(28);
      expect(critResult.severityBand).toBe('critical_red');
      expect(critResult.isCrisisTriggered).toBe(true);
    });

    it('ZBI-4 cutoffs apply correctly (<=5 normal, <=9 amber, <=11 red, >=12 critical)', () => {
      // Score 5 (normal)
      const normalResult = calculateZaritScore({ zbi_2: 2, zbi_3: 2, zbi_9: 1 }, 'ZBI4');
      expect(normalResult.totalScore).toBe(5);
      expect(normalResult.severityBand).toBe('normal');

      // Score 6 (amber)
      const amberResult = calculateZaritScore({ zbi_2: 2, zbi_3: 2, zbi_9: 2 }, 'ZBI4');
      expect(amberResult.totalScore).toBe(6);
      expect(amberResult.severityBand).toBe('amber');

      // Score 10 (red)
      const redResult = calculateZaritScore({ zbi_2: 3, zbi_3: 3, zbi_9: 2, zbi_17: 2 }, 'ZBI4');
      expect(redResult.totalScore).toBe(10);
      expect(redResult.severityBand).toBe('red');

      // Score 12 (critical_red)
      const critResult = calculateZaritScore({ zbi_2: 3, zbi_3: 3, zbi_9: 3, zbi_17: 3 }, 'ZBI4');
      expect(critResult.totalScore).toBe(12);
      expect(critResult.severityBand).toBe('critical_red');
      expect(critResult.isCrisisTriggered).toBe(true);
    });
  });

  describe('C5: Normal Caregiving Dependency & Self-Harm Decoupling', () => {
    it('Item 8 (relative is dependent upon you) is NOT a red flag trigger', () => {
      const item8 = ZBI_22_ITEMS.find((item) => item.id === 'zbi_8');
      expect(item8).toBeDefined();
      expect(item8?.isRedFlagTrigger).toBeFalsy();

      // Even if scored 4 ("nearly always"), it does not add a red flag or trigger crisis alone
      const result = calculateZaritScore({ zbi_8: 4 }, 'ZBI22');
      expect(result.redFlags).toHaveLength(0);
      expect(result.isCrisisTriggered).toBe(false);
    });

    it('Single isolated red flag on non-critical overall score does NOT trigger crisis', () => {
      // Q7 = 4 ("afraid of future"), but total score is only 4/88 (normal band)
      const result = calculateZaritScore({ zbi_7: 4 }, 'ZBI22');
      expect(result.redFlags.length).toBe(1);
      expect(result.severityBand).toBe('normal');
      expect(result.isCrisisTriggered).toBe(false);
    });

    it('Triggers crisis when multiple (>= 2) red flags are flagged', () => {
      // Q7 = 4 and Q9 = 4 (both domain red flags)
      const result = calculateZaritScore({ zbi_7: 4, zbi_9: 4 }, 'ZBI22');
      expect(result.redFlags.length).toBeGreaterThanOrEqual(2);
      expect(result.isCrisisTriggered).toBe(true);
    });

    it('Triggers crisis when global anchor (Q22 >= 3) and overall burden is elevated', () => {
      // Q22 = 4 and overall score reaches high burden
      const responses: Record<string, number> = {
        zbi_1: 3, zbi_2: 3, zbi_3: 3, zbi_4: 3, zbi_5: 3, zbi_6: 3,
        zbi_7: 3, zbi_9: 3, zbi_10: 3, zbi_11: 3, zbi_12: 3, zbi_13: 3,
        zbi_14: 3, zbi_22: 4
      }; // 13*3 + 4 = 43/88 (red band)
      const result = calculateZaritScore(responses, 'ZBI22');
      expect(result.severityBand).toBe('red');
      expect(result.isCrisisTriggered).toBe(true);
    });

    it('Decouples self-harm screening from general Zarit burden', () => {
      // High burden without self-harm screening
      const highBurden = calculateZaritScore(
        { zbi_2: 4, zbi_3: 4, zbi_9: 4, zbi_17: 4 },
        'ZBI4'
      );
      expect(highBurden.isCrisisTriggered).toBe(true);
      expect(highBurden.selfHarmScreening).toBeUndefined();

      // High burden with PHQ-9 item 9 answered 0 ("Not at all")
      const highBurdenNoSelfHarm = calculateZaritScore(
        { zbi_2: 4, zbi_3: 4, zbi_9: 4, zbi_17: 4 },
        'ZBI4',
        0
      );
      expect(highBurdenNoSelfHarm.isCrisisTriggered).toBe(true);
      expect(highBurdenNoSelfHarm.selfHarmScreening?.administered).toBe(true);
      expect(highBurdenNoSelfHarm.selfHarmScreening?.score).toBe(0);
      expect(highBurdenNoSelfHarm.selfHarmScreening?.hasRisk).toBe(false);

      // Caregiver reporting explicit self-harm thoughts (score >= 1)
      const selfHarmRisk = calculateZaritScore(
        { zbi_2: 2, zbi_3: 2, zbi_9: 2, zbi_17: 2 },
        'ZBI4',
        1
      );
      expect(selfHarmRisk.selfHarmScreening?.administered).toBe(true);
      expect(selfHarmRisk.selfHarmScreening?.score).toBe(1);
      expect(selfHarmRisk.selfHarmScreening?.hasRisk).toBe(true);
      expect(selfHarmRisk.selfHarmScreening?.clinicalGuidance.en).toContain('Tele-MANAS');
    });

    it('SELF_HARM_SCREENING_QUESTION contains validated PHQ-9 item 9 phrasing and options', () => {
      expect(SELF_HARM_SCREENING_QUESTION.id).toBe('phq9_item9');
      expect(SELF_HARM_SCREENING_QUESTION.text.en).toContain('better off dead, or of hurting yourself');
      expect(SELF_HARM_SCREENING_QUESTION.options).toHaveLength(4);
      expect(SELF_HARM_SCREENING_QUESTION.options.map((o) => o.value)).toEqual([0, 1, 2, 3]);
    });
  });
});
