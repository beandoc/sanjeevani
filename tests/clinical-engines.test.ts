import { test, describe } from 'node:test';
import assert from 'node:assert';
import { ClinicalRecommendationEngine } from '../src/lib/recommendations/rules-engine';
import { MedicationChecker } from '../src/lib/clinical/medication-checker';
import { ZaritEvaluationResult } from '../src/lib/zarit-scale';

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

  test('should trigger crisis escalation when Zarit score is severe or has red flags', () => {
    const mockZarit: ZaritEvaluationResult = {
      tier: 'ZBI22',
      totalScore: 68,
      maxScore: 88,
      normalizedPercentage: 77,
      severityBand: 'critical_red',
      classification: { en: 'Severe Burden', hi: 'गंभीर बोझ', mr: 'गंभीर ताण' },
      isCrisisTriggered: true,
      redFlags: ['Critical personal strain: feelings of severe exhaustion'],
      factors: {
        personal_strain: { rawScore: 20, maxScore: 24, percentage: 83, title: { en: 'Personal Strain', hi: '', mr: '' }, clinicalNote: { en: '', hi: '', mr: '' } },
        role_strain: { rawScore: 18, maxScore: 24, percentage: 75, title: { en: 'Role Strain', hi: '', mr: '' }, clinicalNote: { en: '', hi: '', mr: '' } },
        financial_strain: { rawScore: 3, maxScore: 4, percentage: 75, title: { en: 'Financial Strain', hi: '', mr: '' }, clinicalNote: { en: '', hi: '', mr: '' } },
        competency: { rawScore: 12, maxScore: 16, percentage: 75, title: { en: 'Competency', hi: '', mr: '' }, clinicalNote: { en: '', hi: '', mr: '' } },
        guilt: { rawScore: 11, maxScore: 16, percentage: 69, title: { en: 'Guilt', hi: '', mr: '' }, clinicalNote: { en: '', hi: '', mr: '' } },
        global_burden: { rawScore: 4, maxScore: 4, percentage: 100, title: { en: 'Global Anchor', hi: '', mr: '' }, clinicalNote: { en: '', hi: '', mr: '' } }
      },
      domainCapacities: {
        psychosocial: 80,
        resource: 75,
        physical: 80,
        safety: 70,
        cognitive_behavioral: 60,
        medical: 40
      },
      prescriptions: [],
      completedAt: new Date().toISOString()
    };

    const output = ClinicalRecommendationEngine.evaluate({
      role: 'caregiver',
      skillLevel: 'intermediate',
      caregivingScenario: 'Dementia',
      lastZarit: mockZarit
    });

    assert.strictEqual(output.crisisEscalationRequired, true);
    assert.ok(output.crisisTriggers.length > 0);
    assert.ok(output.clinicalPrescriptions.some((p) => p.id === 'rx-respite-block'));
  });
});

describe('Beers Criteria Geriatric Medication Safety Engine Tests', () => {
  test('should flag Chlorpheniramine / Avil as High-Risk Anticholinergic', () => {
    const warning = MedicationChecker.checkBeersCriteria('Avil 25mg (Pheniramine)');
    assert.ok(warning !== null);
    assert.strictEqual(warning?.severity, 'high-risk');
    assert.ok(warning?.rationale.includes('anticholinergic'));
  });

  test('should flag Alprazolam / Benzodiazepines for fall risk', () => {
    const warning = MedicationChecker.checkBeersCriteria('Alprazolam 0.25mg');
    assert.ok(warning !== null);
    assert.strictEqual(warning?.severity, 'high-risk');
    assert.ok(warning?.drugClass.includes('Benzodiazepines'));
  });

  test('should flag Oral NSAIDs (Diclofenac / Combiflam) for GI & Renal risks', () => {
    const warning = MedicationChecker.checkBeersCriteria('Combiflam tablet');
    assert.ok(warning !== null);
    assert.strictEqual(warning?.severity, 'high-risk');
    assert.ok(warning?.rationale.includes('kidney injury'));
  });

  test('should flag Amlodipine for Prescribing Cascade (Ankle edema)', () => {
    const warning = MedicationChecker.checkBeersCriteria('Amlodipine 5mg');
    assert.ok(warning !== null);
    assert.strictEqual(warning?.severity, 'prescribing-cascade');
  });

  test('should return null for standard safe geriatric drugs like Paracetamol or Telmisartan', () => {
    const warning = MedicationChecker.checkBeersCriteria('Telmisartan 40mg');
    assert.strictEqual(warning, null);
  });
});
