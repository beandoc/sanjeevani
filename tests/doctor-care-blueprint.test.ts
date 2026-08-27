import { test, describe } from 'vitest';
import assert from 'node:assert';
import {
  CaregiverAttributes,
  PatientDependenceProfile,
  ClinicalCareBlueprint,
  CareGapEngine,
  DEFAULT_ASSISTIVE_DEVICES
} from '../src/lib/clinical/care-gap-engine';
import { StaffingRecommender } from '../src/lib/clinical/staffing-recommender';
import { buildFormalSupport } from '../src/lib/clinical/formal-support';

describe("Doctor's Home Care Blueprint & Family Prescription Lifecycle", () => {
  const dependentPatient: PatientDependenceProfile = {
    name: 'Smt. Sarojini Devi',
    age: 78,
    primaryConditions: ['Post-Stroke Hemiparesis', 'Hypertension'],
    katzAdl: {
      bathing: false,
      dressing: false,
      toileting: false,
      transferring: false,
      continence: true,
      feeding: true
    },
    lawtonIadl: {
      telephone: true,
      shopping: false,
      mealPreparation: false,
      housekeeping: false,
      laundry: false,
      transportation: false,
      medicationManagement: false,
      finances: false
    },
    cognitiveBehavioralLoad: 'mild_forgetfulness',
    fallHistoryLast6Months: 1,
    isBedBound: true,
    weightKg: 65
  };

  const initialCaregiver: CaregiverAttributes = {
    name: 'Ramesh Kumar (Spouse)',
    age: 72,
    gender: 'male',
    kinship: 'spouse',
    coResidence: 'lives_together',
    education: 'graduate',
    employment: 'retired',
    dailyHoursCommitted: 6,
    monthlyOutOfPocketBurden: 'moderate_strain',
    formalTrainingReceived: false,
    caregiverHealth: {
      hasBackPain: true,
      hasHypertension: true,
      hasArthritis: true,
      hasDiabetes: false,
      hasInsomnia: true
    }
  };

  test('Step 1: Doctor engine evaluates acute gap and recommends structured 3-rung ladder', () => {
    const report = StaffingRecommender.recommend(initialCaregiver, dependentPatient);

    assert.ok(report.ladder.length >= 3, 'Must return 3-rung staffing ladder');
    assert.strictEqual(report.diurnalPattern.isSeniorSpouseAloneOvernight, true);
    assert.ok(report.acuityAssessment.clinicalReasons.length > 0);

    const recommended = report.ladder.find((r) => r.rung === 'recommended');
    assert.ok(recommended !== undefined, 'Must contain a recommended rung');
    assert.ok(
      recommended?.shiftWindow === 'day_12h' || recommended?.shiftWindow === 'live_in_24h' || recommended?.shiftWindow === 'night_12h',
      'Should recommend formal shift coverage for bed-bound patient and senior spouse'
    );
  });

  test('Step 2: Doctor drafts and stamps ClinicalCareBlueprint with directives and devices', () => {
    const report = StaffingRecommender.recommend(initialCaregiver, dependentPatient);
    const recommended = report.ladder.find((r) => r.rung === 'recommended')!;

    const blueprint: ClinicalCareBlueprint = {
      id: 'blueprint_sarojini_101',
      prescribedByDoctor: 'Dr. Vivek, MD (Geriatrician)',
      prescribedAt: new Date().toISOString(),
      clinicalSummary: recommended.clinicalJustification,
      recommendedSupportType: recommended.supportType,
      recommendedShiftWindow: recommended.shiftWindow,
      recommendedHoursPerDay: recommended.hoursPerDay,
      clinicalPrecautions: [
        'Senior spouse (72yo with back pain) must NOT perform solo bed-to-chair lifts.',
        'Strict Q2H repositioning to prevent sacral pressure sores.',
        'Review pressure-redistribution mattress need with wound-care nurse.'
      ],
      recommendedAssistiveDevices: {
        ...DEFAULT_ASSISTIVE_DEVICES,
        hospitalBed: 'motorized_multichannel',
        airWaterMattress: true,
        transferAids: true
      },
      recommendedRespiteDaysPerMonth: 4,
      status: 'draft_prescribed',
      clinicalReview: {
        decision: 'issued_by_clinician',
        reviewedAt: new Date().toISOString(),
        reviewedBy: 'Dr. Vivek, MD (Geriatrician)',
        policyVersion: report.policyVersion,
        decisionSupportStatus: report.decisionSupportStatus
      }
    };

    assert.strictEqual(blueprint.status, 'draft_prescribed');
    assert.strictEqual(blueprint.clinicalReview?.decision, 'issued_by_clinician');
    assert.strictEqual(blueprint.clinicalReview?.policyVersion, report.policyVersion);
    assert.strictEqual(blueprint.clinicalPrecautions.length, 3);
    assert.strictEqual(blueprint.recommendedAssistiveDevices.hospitalBed, 'motorized_multichannel');
  });

  test('Step 3: Family claims and adopts Doctor Blueprint into Care Circle Matrix', () => {
    const report = StaffingRecommender.recommend(initialCaregiver, dependentPatient);
    const recommended = report.ladder.find((r) => r.rung === 'recommended')!;

    const blueprint: ClinicalCareBlueprint = {
      id: 'blueprint_sarojini_101',
      prescribedByDoctor: 'Dr. Vivek, MD (Geriatrician)',
      prescribedAt: new Date().toISOString(),
      clinicalSummary: recommended.clinicalJustification,
      recommendedSupportType: recommended.supportType,
      recommendedShiftWindow: recommended.shiftWindow,
      recommendedHoursPerDay: recommended.hoursPerDay,
      clinicalPrecautions: [
        'Senior spouse must NOT perform solo bed-to-chair lifts.',
        'Strict Q2H repositioning protocol.'
      ],
      recommendedAssistiveDevices: {
        ...DEFAULT_ASSISTIVE_DEVICES,
        hospitalBed: 'motorized_multichannel',
        airWaterMattress: true,
        transferAids: true
      },
      recommendedRespiteDaysPerMonth: 4,
      status: 'draft_prescribed'
    };

    // Before adoption: Baseline gap without formal support
    const baseEval = CareGapEngine.evaluate(initialCaregiver, dependentPatient);
    assert.ok(baseEval.netCareGapHours > 4, 'Baseline unassisted care gap should be high');
    assert.ok(baseEval.liftingIndex > 1.5, 'Caregiver lifting index should be hazardous');

    // Family Adopts Blueprint:
    const formalTypes =
      blueprint.recommendedSupportType !== 'none' && blueprint.recommendedSupportType !== 'family_redistribution'
        ? [blueprint.recommendedSupportType]
        : [];
    const adoptedCaregiver: CaregiverAttributes = {
      ...initialCaregiver,
      formalSupport: buildFormalSupport(formalTypes),
      assistiveDevices: blueprint.recommendedAssistiveDevices,
      rotationPolicy: {
        rotationInterval: 'biweekly',
        primaryCaregiverRespiteDaysPerMonth: blueprint.recommendedRespiteDaysPerMonth,
        nightShiftArrangement: 'primary_solo',
        weekendShiftLeader: 'Family Son (Pankaj)'
      },
      careBlueprint: {
        ...blueprint,
        status: 'adopted_by_family'
      }
    };

    assert.strictEqual(adoptedCaregiver.careBlueprint?.status, 'adopted_by_family');
    assert.strictEqual(adoptedCaregiver.assistiveDevices?.hospitalBed, 'motorized_multichannel');

    // After adoption evaluation:
    const assistedEval = CareGapEngine.evaluate(adoptedCaregiver, dependentPatient);
    assert.ok(
      assistedEval.netCareGapHours < baseEval.netCareGapHours,
      'Adopting blueprint must significantly reduce net care gap'
    );
    assert.ok(
      assistedEval.liftingIndex < baseEval.liftingIndex,
      'Motorized bed and transfer staff must significantly relieve caregiver lifting strain'
    );
  });
});
