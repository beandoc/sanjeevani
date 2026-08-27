import { test, describe } from 'vitest';
import assert from 'node:assert';
import { StaffingRecommender } from '../src/lib/clinical/staffing-recommender';
import { CaregiverAttributes, PatientDependenceProfile } from '../src/lib/clinical/care-gap-engine';
import { CLINICAL_POLICY } from '../src/lib/clinical/clinical-policy';

describe('Multi-Tier Staffing Recommender Engine Tests', () => {
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
    formalTrainingReceived: false
  };

  const basePatient: PatientDependenceProfile = {
    name: 'Smt. Sarojini Devi',
    age: 81,
    primaryConditions: ['Hypertension', 'Severe Osteoarthritis'],
    katzAdl: {
      bathing: false,
      dressing: false,
      toileting: false,
      transferring: false,
      continence: true,
      feeding: true
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
    cognitiveBehavioralLoad: 'none',
    fallHistoryLast6Months: 1,
    isBedBound: false
  };

  test('Axis 1: Clinical Acuity prescribes Nurse for Stage 2+ pressure sores and suction apparatus', () => {
    const highAcuityPatient: PatientDependenceProfile = {
      ...basePatient,
      primaryConditions: ['Stage 3 Pressure Ulcer', 'Post-CVA Dysphagia'],
      assistiveDevices: {
        hospitalBed: 'motorized_multichannel',
        airWaterMattress: true,
        wheelchair: true,
        suctionApparatus: true,
        transferAids: true
      }
    };

    const report = StaffingRecommender.recommend(baseCaregiver, highAcuityPatient);

    assert.strictEqual(report.acuityAssessment.dominantSkillTier, 'nurse');
    assert.ok(report.acuityAssessment.highAcuityProcedures.length >= 2);
    assert.ok(report.ladder.some((rung) => rung.skillTier === 'nurse'));
  });

  test('Axis 1: High-risk polypharmacy with ACB >= 3 triggers nursing oversight recommendation', () => {
    const polypharmacyPatient: PatientDependenceProfile = {
      ...basePatient,
      currentMedications: [
        { name: 'Amitriptyline 25mg' }, // ACB = 3
        { name: 'Chlorpheniramine 4mg' }, // ACB = 3
        { name: 'Hydroxyzine 10mg' } // ACB = 3
      ]
    };

    const report = StaffingRecommender.recommend(baseCaregiver, polypharmacyPatient);

    assert.strictEqual(report.acuityAssessment.dominantSkillTier, 'nurse');
    assert.ok(report.acuityAssessment.pharmacotherapyRisk.hasHighRiskMeds);
    assert.ok(report.acuityAssessment.pharmacotherapyRisk.acbScore >= 3);
  });

  test('Axis 1: Rehabilitation dominant need selects Medical Assistant / Physio Aide', () => {
    const rehabPatient: PatientDependenceProfile = {
      ...basePatient,
      fallHistoryLast6Months: 3,
      primaryConditions: ['Post-Fall Mobility Impairment', 'Gait Instability'],
      katzAdl: {
        bathing: true,
        dressing: true,
        toileting: true,
        transferring: true,
        continence: true,
        feeding: true
      }
    };

    const report = StaffingRecommender.recommend(baseCaregiver, rehabPatient);

    assert.strictEqual(report.acuityAssessment.dominantSkillTier, 'physio_assistant');
    assert.ok(report.ladder.some((rung) => rung.skillTier === 'physio_assistant'));
  });

  test('Axis 2: Severe sundowning and bed-bound status triggers nocturnal & 24h shift recommendations', () => {
    const nocturnalPatient: PatientDependenceProfile = {
      ...basePatient,
      cognitiveBehavioralLoad: 'severe_sundowning',
      isBedBound: true
    };

    const report = StaffingRecommender.recommend(baseCaregiver, nocturnalPatient);

    assert.ok(report.diurnalPattern.deficitBlocks.includes('night_watch'));
    assert.ok(report.ladder.some((rung) => rung.shiftWindow === 'night_12h' || rung.shiftWindow === 'live_in_24h'));
  });

  test('Family First: Capable secondary family members generate zero-cost redistribution option', () => {
    const caregiverWithFamily: CaregiverAttributes = {
      ...baseCaregiver,
      secondaryMembers: [
        {
          id: 'fam_1',
          name: 'Pooja (Daughter)',
          relationship: 'daughter',
          age: 28,
          hoursPerDay: 2,
          hasPhysicalLimitation: false,
          assignedTasks: ['heavy_transfers', 'medications']
        }
      ]
    };

    const report = StaffingRecommender.recommend(caregiverWithFamily, basePatient);

    const familyOption = report.ladder.find((r) => r.supportType === 'family_redistribution');
    assert.ok(familyOption !== undefined, 'Must contain family redistribution candidate');
    assert.strictEqual(familyOption?.costTierRank, 1);
  });

  test('Ladder Structure: Produces valid 3-rung ladder with actual simulated metrics', () => {
    const report = StaffingRecommender.recommend(baseCaregiver, basePatient);

    assert.strictEqual(report.ladder.length, 3);
    const [minViable, rec, opt] = report.ladder;

    assert.strictEqual(minViable.rung, 'minimum_viable');
    assert.strictEqual(rec.rung, 'recommended');
    assert.strictEqual(opt.rung, 'optimal');
    assert.strictEqual(report.policyVersion, CLINICAL_POLICY.version);
    assert.strictEqual(report.decisionSupportStatus, 'requires_clinician_review');

    // Verify all simulated metrics are populated numbers
    for (const rung of report.ladder) {
      assert.ok(typeof rung.simulatedResult.netCareGapHours === 'number');
      assert.ok(typeof rung.simulatedResult.careGapIndex === 'number');
      assert.ok(typeof rung.simulatedResult.liftingIndex === 'number');
      assert.ok(typeof rung.simulatedResult.caregiverInjuryRiskScore === 'number');
      assert.ok(['low', 'moderate', 'high', 'critical'].includes(rung.simulatedResult.caregiverBurnoutRiskLevel));
    }

    // Optimal option must provide lower residual gap than baseline
    assert.ok(opt.simulatedResult.netCareGapHours <= rec.simulatedResult.netCareGapHours);
  });
});
