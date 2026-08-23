import { test, describe } from 'vitest';
import assert from 'node:assert';
import { ClinicalRecommendationEngine } from '../src/lib/recommendations/rules-engine';
import { MedicationChecker } from '../src/lib/clinical/medication-checker';
import { ZaritEvaluationResult, calculateZaritScore, isReassessmentDue } from '../src/lib/zarit-scale';

describe('Zarit Caregiver Burden Psychometric Engine Tests', () => {
  test('ZBI-4 Rapid Triage must trigger crisis escalation on severe strain (>=12/16)', () => {
    // Caregiver answers Nearly Always (4) on all 4 rapid items
    const responses = { zbi_1: 4, zbi_7: 4, zbi_8: 4, zbi_14: 4 };
    const result = calculateZaritScore(responses, 'ZBI4');

    assert.strictEqual(result.totalScore, 16);
    assert.strictEqual(result.maxScore, 16);
    assert.strictEqual(result.severityBand, 'critical_red');
    assert.strictEqual(result.isCrisisTriggered, true);
    assert.ok(result.redFlags.length > 0);
  });

  test('ZBI-12 and ZBI-4 should mark unassessed factors as isMeasured=false, not 0% strain', () => {
    const responses = { zbi_1: 2, zbi_7: 2, zbi_8: 2, zbi_14: 2 };
    const resultZbi4 = calculateZaritScore(responses, 'ZBI4');

    // Unmeasured factors in ZBI-4
    assert.strictEqual(resultZbi4.factors.financial_strain.isMeasured, false);
    assert.strictEqual(resultZbi4.factors.financial_strain.percentage, null);
    assert.strictEqual(resultZbi4.factors.guilt.isMeasured, false);
    assert.strictEqual(resultZbi4.factors.guilt.percentage, null);

    // Unmeasured domain capacities should be null, not 100%
    assert.strictEqual(resultZbi4.domainCapacities.medical, null);
  });

  test('Tele-MANAS prescription should be generated on ZBI-4 / ZBI-12 when normalized burden >= 55%', () => {
    const responses = { zbi_1: 3, zbi_7: 3, zbi_8: 3, zbi_14: 3 }; // 12/16 = 75%
    const result = calculateZaritScore(responses, 'ZBI4');

    assert.ok(result.prescriptions.some((p) => p.id === 'rx_telemanas'));
  });
});

describe('Clinical Recommendation Rules Engine Tests', () => {
  test('should prioritize Fall Prevention and Parkinson modules for Parkinson scenario', () => {
    const output = ClinicalRecommendationEngine.evaluate({
      role: 'caregiver',
      skillLevel: 'beginner',
      caregivingScenario: "Parkinson's Disease",
      lastZarit: null
    });

    assert.ok(output.topRecommendations.length > 0);
    const topIds = output.topRecommendations.map((r) => r.moduleId);
    assert.ok(topIds.includes('parkinsonism-care') || topIds.includes('fall-prevention'));
    assert.strictEqual(output.crisisEscalationRequired, false);
  });

  test('Unclamped sorting should preserve distinct ranks and not collapse to catalog order', () => {
    // Create high-burden Zarit result
    const highZarit = calculateZaritScore({ zbi_1: 4, zbi_7: 4, zbi_8: 4, zbi_14: 4 }, 'ZBI4');
    const output = ClinicalRecommendationEngine.evaluate({
      role: 'caregiver',
      skillLevel: 'beginner',
      caregivingScenario: 'General Frailty',
      lastZarit: highZarit,
      completedSectionMap: { 'fall-prevention': { completedSections: ['s1', 's2'] } }
    });

    // Fall prevention has scenario 95 + beginner 100 + role 15 + partial boost 8 + zarit strain
    const topModule = output.topRecommendations[0];
    assert.strictEqual(topModule.moduleId, 'fall-prevention');
    assert.ok(output.topRecommendations[0].rawScore > output.topRecommendations[1].rawScore);
  });
});

describe('Beers Criteria & STOPP Interaction Engine Tests', () => {
  test('should NOT flag Cetirizine as 1st-generation anticholinergic (2nd gen safe)', () => {
    const warning = MedicationChecker.checkBeersCriteria('Cetirizine 10mg');
    assert.strictEqual(warning, null);
  });

  test('should flag Avil (Pheniramine) as High-Risk Anticholinergic with ACB = 3', () => {
    const warning = MedicationChecker.checkBeersCriteria('Avil 25mg (Pheniramine)');
    assert.ok(warning !== null);
    assert.strictEqual(warning?.severity, 'high-risk');
    assert.strictEqual(warning?.acbScore, 3);
  });

  test('should calculate Cumulative ACB score and STOPP Triple Whammy interaction', () => {
    const regimen = [
      { name: 'Avil 25mg' }, // ACB 3
      { name: 'Tryptomer 10mg (Amitriptyline)' }, // ACB 3
      { name: 'Telmisartan 40mg' }, // ARB
      { name: 'Combiflam (Ibuprofen)' }, // NSAID
      { name: 'Dytor 10mg (Torsemide)' }, // Diuretic
    ];

    const evalResult = MedicationChecker.evaluateRegimen(regimen);

    assert.strictEqual(evalResult.totalAcbScore, 6);
    assert.strictEqual(evalResult.acbRiskLevel, 'high-risk');
    assert.ok(evalResult.warnings.some((w) => w.includes('Triple Whammy')));
    assert.ok(evalResult.stoppTriggers.some((t) => t.includes('STOPP: Discontinue oral NSAID')));
  });
});

describe('isReassessmentDue — reassessment cadence', () => {
  const now = new Date('2026-06-15T00:00:00.000Z');
  const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

  test('is due with no prior assessment at all', () => {
    assert.strictEqual(isReassessmentDue(null, now), true);
    assert.strictEqual(isReassessmentDue(undefined, now), true);
  });

  test('ZBI-4 is due after ~21 days, not due sooner', () => {
    assert.strictEqual(isReassessmentDue({ tier: 'ZBI4', completedAt: daysAgo(10) }, now), false);
    assert.strictEqual(isReassessmentDue({ tier: 'ZBI4', completedAt: daysAgo(25) }, now), true);
  });

  test('ZBI-22 / ZBI-12 are due quarterly, not on the ZBI-4 cadence', () => {
    assert.strictEqual(isReassessmentDue({ tier: 'ZBI22', completedAt: daysAgo(25) }, now), false);
    assert.strictEqual(isReassessmentDue({ tier: 'ZBI22', completedAt: daysAgo(95) }, now), true);
    assert.strictEqual(isReassessmentDue({ tier: 'ZBI12', completedAt: daysAgo(95) }, now), true);
  });

  test('treats an unparseable completedAt as due', () => {
    assert.strictEqual(isReassessmentDue({ tier: 'ZBI22', completedAt: 'not-a-date' }, now), true);
  });
});
