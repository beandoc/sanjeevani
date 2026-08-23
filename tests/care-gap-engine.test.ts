import { test, describe } from 'node:test';
import assert from 'node:assert';
import { CareGapEngine, CaregiverAttributes, PatientDependenceProfile } from '../src/lib/clinical/care-gap-engine';

describe('Caregiver Dyad & Care Gap Engine Tests', () => {
  const sampleCaregiver: CaregiverAttributes = {
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
    dailyHoursCommitted: 6,
    monthlyOutOfPocketBurden: 'moderate_strain',
    formalTrainingReceived: false
  };

  const sampleDependentPatient: PatientDependenceProfile = {
    name: 'Smt. Sarojini Devi',
    age: 81,
    primaryConditions: ['Hypertension', 'Severe Osteoarthritis', 'Post-Fall Frailty'],
    katzAdl: {
      bathing: false, // 4 deficits
      dressing: false,
      toileting: false,
      transferring: false,
      continence: true,
      feeding: true
    },
    lawtonIadl: {
      medicationManagement: false,
      finances: false,
      mealPreparation: false,
      housekeeping: false,
      transportation: false
    },
    cognitiveBehavioralLoad: 'wandering_agitation',
    fallHistoryLast6Months: 1,
    isBedBound: false
  };

  test('should accurately calculate Katz ADL score and dependence level', () => {
    const result = CareGapEngine.evaluate(sampleCaregiver, sampleDependentPatient);

    // 2 items true (continence, feeding) -> score 2/6
    assert.strictEqual(result.katzAdlScore, 2);
    assert.strictEqual(result.katzDependenceLevel, 'severe_dependence');
    assert.strictEqual(result.lawtonIadlScore, 0);
  });

  test('should calculate patient care demand hours factoring in ADLs, cognition, and falls', () => {
    const result = CareGapEngine.evaluate(sampleCaregiver, sampleDependentPatient);

    // Baseline 1.5 + (4 ADLs * 1.25 = 5.0) + (5 IADLs * 0.5 = 2.5) + wandering (2.5) + fall (1.0) = 12.5 hrs/day
    assert.ok(result.patientCareDemandHours >= 10);
    assert.ok(result.caregiverSafeCapacityHours <= 5.0); // Full-time employment cap
    assert.ok(result.netCareGapHours > 4.5);
    assert.strictEqual(result.careGapSeverity, 'critical_overload');
  });

  test('should detect high lumbar injury risk when caregiver with back pain transfers dependent patient', () => {
    const result = CareGapEngine.evaluate(sampleCaregiver, sampleDependentPatient);

    assert.ok(result.caregiverInjuryRiskScore >= 70);
    assert.ok(result.clinicalFindings.some((f) => f.includes('musculoskeletal injury risk')));
    assert.ok(result.prescriptions.some((p) => p.id === 'rx_transfer_biomechanics'));
  });

  test('should show sustainable care gap for mild independent patient and retired caregiver', () => {
    const retiredCaregiver: CaregiverAttributes = {
      ...sampleCaregiver,
      employment: 'retired',
      dailyHoursCommitted: 8,
      caregiverHealth: {
        hasBackPain: false,
        hasHypertension: false,
        hasArthritis: false,
        hasDiabetes: false,
        hasInsomnia: false
      }
    };

    const independentPatient: PatientDependenceProfile = {
      ...sampleDependentPatient,
      katzAdl: {
        bathing: true,
        dressing: true,
        toileting: true,
        transferring: true,
        continence: true,
        feeding: true
      },
      lawtonIadl: {
        medicationManagement: true,
        finances: true,
        mealPreparation: true,
        housekeeping: true,
        transportation: true
      },
      cognitiveBehavioralLoad: 'none',
      fallHistoryLast6Months: 0
    };

    const result = CareGapEngine.evaluate(retiredCaregiver, independentPatient);

    assert.strictEqual(result.katzAdlScore, 6);
    assert.strictEqual(result.katzDependenceLevel, 'independent');
    assert.ok(result.netCareGapHours <= 0);
    assert.strictEqual(result.careGapSeverity, 'sustainable');
  });
});
