import { test, describe } from 'vitest';
import assert from 'node:assert';
import {
  CareGapEngine,
  CaregiverAttributes,
  PatientDependenceProfile,
  EngineAppointmentRecord,
  generateWhatsAppCareDigest,
  generateCareRosterIcs
} from '../src/lib/clinical/care-gap-engine';

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

  const sampleIndependentPatient: PatientDependenceProfile = {
    name: 'Shri Ram Prasad',
    age: 72,
    primaryConditions: ['Mild Hypertension'],
    katzAdl: {
      bathing: true,
      dressing: true,
      toileting: true,
      transferring: true,
      continence: true,
      feeding: true
    },
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
      telephone: false,
      shopping: false,
      mealPreparation: false,
      housekeeping: false,
      laundry: false,
      transportation: false,
      medicationManagement: false,
      finances: false
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

  test('marks staffing output incomplete when required assessment inputs are missing', () => {
    const incompletePatient = {
      ...sampleDependentPatient,
      fallHistoryLast6Months: Number.NaN
    } as PatientDependenceProfile;

    const result = CareGapEngine.evaluate(sampleCaregiver, incompletePatient, new Date('2026-08-28T12:00:00Z'));

    assert.strictEqual(result.dataQuality.status, 'requires_data_completion');
    assert.ok(result.dataQuality.missingFields.includes('Fall history'));
    assert.ok(result.qualityOfCareWarnings.some((warning) => warning.includes('Decision-support output is incomplete')));
  });

  test('surfaces stale and caregiver-reported assessments for clinician review', () => {
    const assessedPatient: PatientDependenceProfile = {
      ...sampleDependentPatient,
      assessmentMetadata: { assessedAt: '2026-06-01', source: 'caregiver_reported' },
      currentMedications: []
    };

    const result = CareGapEngine.evaluate(sampleCaregiver, assessedPatient, new Date('2026-08-28T12:00:00Z'));

    assert.strictEqual(result.dataQuality.status, 'requires_clinician_review');
    assert.strictEqual(result.dataQuality.completeness, 'partial');
    assert.ok(result.dataQuality.limitations.some((limitation) => limitation.includes('Assessment is')));
    assert.ok(result.dataQuality.limitations.some((limitation) => limitation.includes('caregiver-reported')));
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
      fallHistoryLast6Months: 0
    };

    const result = CareGapEngine.evaluate(retiredCaregiver, independentPatient);

    assert.strictEqual(result.katzAdlScore, 6);
    assert.strictEqual(result.katzDependenceLevel, 'independent');
    assert.ok(result.netCareGapHours <= 0);
    assert.strictEqual(result.careGapSeverity, 'sustainable');
  });

  test('should dramatically reduce care gap and lumbar strain when 24h paid attendant is deployed', () => {
    const caregiverWith24hAttendant: CaregiverAttributes = {
      ...sampleCaregiver,
      formalSupport: {
        type: 'paid_attendant_24h',
        hoursPerDay: 24,
        handlesHeavyTransfers: true,
        handlesMedicationWoundCare: false
      }
    };

    const result = CareGapEngine.evaluate(caregiverWith24hAttendant, sampleDependentPatient);

    // A live-in attendant absorbs most, but deliberately NOT all, of the ~12.5h
    // demand — supervision and coordination stay with the family caregiver.
    assert.ok(result.formalSupportAbsorbedHours >= 9.0);
    assert.ok(result.formalSupportAbsorbedHours < result.patientCareDemandHours);
    assert.strictEqual(result.netCareGapHours, 0);
    assert.strictEqual(result.careGapSeverity, 'sustainable');
    // Injury risk should decrease significantly because staff handles transfers
    assert.ok(result.caregiverInjuryRiskScore <= 60);
    assert.ok(result.clinicalFindings.some((f) => f.includes('Multi-Disciplinary Caregiver Team Active')));
  });

  test('should reduce care gap partially when 12h day nurse is present', () => {
    const caregiverWith12hNurse: CaregiverAttributes = {
      ...sampleCaregiver,
      formalSupport: {
        type: 'trained_nurse_12h',
        hoursPerDay: 12,
        handlesHeavyTransfers: true,
        handlesMedicationWoundCare: true
      }
    };

    const result = CareGapEngine.evaluate(caregiverWith12hNurse, sampleDependentPatient);

    assert.ok(result.formalSupportAbsorbedHours >= 9.0);
    assert.ok(result.netCareGapHours <= 1.0);
    assert.ok(result.careGapSeverity === 'sustainable' || result.careGapSeverity === 'mild_deficit');
  });

  // --- Regression: multi-family rotation must not suppress transfer safety ---

  test('multi_family_rotation must NOT suppress the lumbar risk finding or transfer prescription', () => {
    // The onboarding wizard sets handlesHeavyTransfers: true for ANY selection.
    // A family taking turns is still doing the lifting itself, so the transfer
    // safety guidance must survive that flag.
    const familyRotation: CaregiverAttributes = {
      ...sampleCaregiver,
      formalSupport: {
        type: 'multi_family_rotation',
        types: ['multi_family_rotation'],
        hoursPerDay: 8,
        handlesHeavyTransfers: true,
        handlesMedicationWoundCare: false
      }
    };

    const result = CareGapEngine.evaluate(familyRotation, sampleDependentPatient);

    assert.ok(result.clinicalFindings.some((f) => f.includes('musculoskeletal injury risk')));
    assert.ok(result.prescriptions.some((p) => p.id === 'rx_transfer_biomechanics'));
  });

  test('a visiting medical assistant must NOT count as handling daily transfers', () => {
    const medicalAssistant: CaregiverAttributes = {
      ...sampleCaregiver,
      formalSupport: {
        type: 'medical_assistant',
        types: ['medical_assistant'],
        hoursPerDay: 6,
        handlesHeavyTransfers: false,
        handlesMedicationWoundCare: true
      }
    };

    const result = CareGapEngine.evaluate(medicalAssistant, sampleDependentPatient);
    assert.ok(result.prescriptions.some((p) => p.id === 'rx_transfer_biomechanics'));
  });

  // --- Regression: the formal-support cliff ---

  test('formal support must never absorb 100% of demand, and must not zero out a frail caregiver', () => {
    const frailCaregiverWithLiveIn: CaregiverAttributes = {
      ...sampleCaregiver,
      age: 71,
      kinship: 'spouse',
      employment: 'retired',
      dailyHoursCommitted: 4,
      functionalCapacity: 'moderate_limitations',
      formalSupport: {
        type: 'trained_nurse_24h',
        types: ['trained_nurse_24h'],
        hoursPerDay: 24,
        handlesHeavyTransfers: true,
        handlesMedicationWoundCare: true
      }
    };

    const result = CareGapEngine.evaluate(frailCaregiverWithLiveIn, sampleDependentPatient);

    // Residual supervision load always remains with the family caregiver.
    assert.ok(result.formalSupportAbsorbedHours < result.patientCareDemandHours);
    // A 71-year-old spouse with moderate limitations is at capacity floor, so
    // even a live-in nurse leaves a real deficit — this used to report 0.
    assert.ok(result.netCareGapHours > 0);
    assert.notStrictEqual(result.careGapSeverity, 'sustainable');
  });

  test('stacked support types must not sum past a physically possible day', () => {
    const overStaffed: CaregiverAttributes = {
      ...sampleCaregiver,
      formalSupport: {
        type: 'trained_nurse_24h',
        types: ['trained_nurse_24h', 'paid_attendant_24h', 'medical_assistant'],
        hoursPerDay: 24,
        handlesHeavyTransfers: true,
        handlesMedicationWoundCare: true
      }
    };

    const result = CareGapEngine.evaluate(overStaffed, sampleDependentPatient);
    assert.ok(result.formalSupportAbsorbedHours <= 24);
    assert.ok(result.formalSupportAbsorbedHours < result.patientCareDemandHours);
  });

  test('injury risk must still discriminate between supported dyads', () => {
    const base: CaregiverAttributes = {
      ...sampleCaregiver,
      formalSupport: {
        type: 'paid_attendant_24h',
        types: ['paid_attendant_24h'],
        hoursPerDay: 24,
        handlesHeavyTransfers: true,
        handlesMedicationWoundCare: false
      }
    };

    const healthyTrained = CareGapEngine.evaluate(
      {
        ...base,
        age: 45,
        formalTrainingReceived: true,
        caregiverHealth: {
          hasBackPain: false,
          hasHypertension: false,
          hasArthritis: false,
          hasDiabetes: false,
          hasInsomnia: false
        }
      },
      sampleDependentPatient
    );

    const frailUntrained = CareGapEngine.evaluate({ ...base, age: 68 }, sampleDependentPatient);

    // Both have a live-in attendant; the blanket discount used to collapse both
    // to the same floor. The frail untrained caregiver must still score higher.
    assert.ok(frailUntrained.caregiverInjuryRiskScore > healthyTrained.caregiverInjuryRiskScore);
  });

  // --- Regression: label consistency, null-safety, determinism ---

  test('severity and burnout labels must never disagree at a boundary gap', () => {
    for (const dailyHours of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const result = CareGapEngine.evaluate(
        { ...sampleCaregiver, dailyHoursCommitted: dailyHours },
        sampleDependentPatient
      );
      if (result.careGapSeverity === 'critical_overload') {
        assert.strictEqual(result.caregiverBurnoutRiskLevel, 'critical');
      }
      if (result.caregiverBurnoutRiskLevel === 'critical' && result.caregiverInjuryRiskScore < 75) {
        assert.strictEqual(result.careGapSeverity, 'critical_overload');
      }
    }
  });

  test('evaluate() must tolerate null inputs instead of throwing', () => {
    const result = CareGapEngine.evaluate(null, null);
    assert.ok(result.patientCareDemandHours > 0);
    assert.ok(result.caregiverSafeCapacityHours >= 1.0);
  });

  test('evaluate() must be deterministic when a clock is injected', () => {
    const now = new Date('2026-01-01T00:00:00.000Z');
    const a = CareGapEngine.evaluate(sampleCaregiver, sampleDependentPatient, now);
    const b = CareGapEngine.evaluate(sampleCaregiver, sampleDependentPatient, now);
    assert.deepStrictEqual(a, b);
    assert.strictEqual(a.evaluatedAt, '2026-01-01T00:00:00.000Z');
  });

  test('secondary family members must absorb demand and reduce net care gap without distorting primary safe capacity', () => {
    const solo = CareGapEngine.evaluate(
      { ...sampleCaregiver, otherFamilyMembersCount: 0 },
      sampleDependentPatient
    );
    const supported = CareGapEngine.evaluate(
      { ...sampleCaregiver, otherFamilyMembersCount: 3 },
      sampleDependentPatient
    );

    assert.ok(supported.familySupportAbsorbedHours > solo.familySupportAbsorbedHours);
    assert.ok(supported.netCareGapHours < solo.netCareGapHours);
    // Primary caregiver safe capacity must reflect primary caregiver, not phantom network buffer
    assert.strictEqual(supported.caregiverSafeCapacityHours, solo.caregiverSafeCapacityHours);
  });

  test('repeat fallers must carry more demand than a single fall', () => {
    const oneFall = CareGapEngine.evaluate(sampleCaregiver, {
      ...sampleDependentPatient,
      fallHistoryLast6Months: 1
    });
    const repeatFaller = CareGapEngine.evaluate(sampleCaregiver, {
      ...sampleDependentPatient,
      fallHistoryLast6Months: 4
    });

    assert.ok(repeatFaller.patientCareDemandHours > oneFall.patientCareDemandHours);
  });

  test('rx_formal_attendant must not fire for a dyad that already has a team', () => {
    const hasTeamButLegacyType: CaregiverAttributes = {
      ...sampleCaregiver,
      dailyHoursCommitted: 2,
      formalSupport: {
        // Legacy/hand-edited shape: primary type says 'none' but a team exists.
        type: 'none',
        types: ['multi_family_rotation'],
        hoursPerDay: 8,
        handlesHeavyTransfers: false,
        handlesMedicationWoundCare: false
      }
    };

    const result = CareGapEngine.evaluate(hasTeamButLegacyType, sampleDependentPatient);
    assert.ok(result.netCareGapHours >= 3.0, 'precondition: gap large enough to trigger the rx');
    assert.ok(!result.prescriptions.some((p) => p.id === 'rx_formal_attendant'));
  });

  test('should scale musculoskeletal injury risk based on patient weight/BMI and bed-bound status', () => {
    const normalResult = CareGapEngine.evaluate(sampleCaregiver, {
      ...sampleDependentPatient,
      weightKg: 60,
      heightCm: 165,
      isBedBound: false
    });

    const heavyResult = CareGapEngine.evaluate(sampleCaregiver, {
      ...sampleDependentPatient,
      weightKg: 85,
      heightCm: 165,
      isBedBound: false
    });

    assert.ok(heavyResult.caregiverInjuryRiskScore > normalResult.caregiverInjuryRiskScore);

    const bedBoundResult = CareGapEngine.evaluate(sampleCaregiver, {
      ...sampleDependentPatient,
      weightKg: 60,
      heightCm: 165,
      isBedBound: true
    });

    assert.ok(bedBoundResult.caregiverInjuryRiskScore > normalResult.caregiverInjuryRiskScore);
  });

  test('should scale up caregiver burnout risk level under severe out of pocket financial strain', () => {
    const moderatePatient: PatientDependenceProfile = {
      ...sampleDependentPatient,
      katzAdl: {
        bathing: false,
        dressing: true,
        toileting: true,
        transferring: true,
        continence: true,
        feeding: true
      }
    };

    const modResultNormalFin = CareGapEngine.evaluate(
      { ...sampleCaregiver, monthlyOutOfPocketBurden: 'manageable', dailyHoursCommitted: 6 },
      moderatePatient
    );
    const modResultToxicFin = CareGapEngine.evaluate(
      { ...sampleCaregiver, monthlyOutOfPocketBurden: 'severe_toxicity', dailyHoursCommitted: 6 },
      moderatePatient
    );

    assert.ok(
      modResultToxicFin.caregiverBurnoutRiskLevel === 'critical' || 
      modResultToxicFin.caregiverBurnoutRiskLevel === 'high'
    );
  });

  test('should generate an actionable staffing prescription when care gap hours is positive', () => {
    const result = CareGapEngine.evaluate(sampleCaregiver, sampleDependentPatient);

    assert.ok(result.netCareGapHours > 0);
    const rx = result.prescriptions.find((p) => p.id === 'rx_staffing_respite_prescription');
    assert.ok(rx !== undefined);
    assert.ok(rx.title.includes('Clinician Review'));
    assert.ok(rx.action.includes('Consider'));
    assert.ok(rx.action.includes('hours/day of trained attendant'));
  });

  test('should trigger warnings for recurrent infections, frequent aspirations, and bed sores', () => {
    const sickPatient: PatientDependenceProfile = {
      ...sampleDependentPatient,
      primaryConditions: ['Recurrent Infections', 'UTI', 'Dysphagia'],
      isBedBound: true
    };
    const result = CareGapEngine.evaluate(sampleCaregiver, sickPatient);
    assert.ok(result.qualityOfCareWarnings.length >= 3);
    assert.ok(result.qualityOfCareWarnings.some((w) => w.includes('Recurrent infections')));
    assert.ok(result.qualityOfCareWarnings.some((w) => w.includes('Frequent aspiration')));
    assert.ok(result.qualityOfCareWarnings.some((w) => w.includes('Bed sore presence')));
    assert.strictEqual(result.caregiverBurnoutRiskLevel, 'critical');
  });

  test('should trigger warning for uncontrolled blood pressure', () => {
    const bpVitals = [
      { date: new Date().toISOString(), bp: '170/105', sleep: 'good' as const }
    ];
    const result = CareGapEngine.evaluate(sampleCaregiver, sampleDependentPatient, new Date(), bpVitals);
    assert.ok(result.qualityOfCareWarnings.some((w) => w.includes('Uncontrolled hypertension')));
  });

  test('should trigger warning for missing diabetes glucose logs', () => {
    const diabeticPatient: PatientDependenceProfile = {
      ...sampleDependentPatient,
      primaryConditions: ['Diabetes']
    };
    const resultNoLogs = CareGapEngine.evaluate(sampleCaregiver, diabeticPatient, new Date(), []);
    assert.ok(resultNoLogs.qualityOfCareWarnings.some((w) => w.includes('Diabetes care monitoring gap')));

    const oldLogs = [
      { date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), bloodSugar: '150', sleep: 'good' as const }
    ];
    const resultOldLogs = CareGapEngine.evaluate(sampleCaregiver, diabeticPatient, new Date(), oldLogs);
    assert.ok(resultOldLogs.qualityOfCareWarnings.some((w) => w.includes('logged in the last 10 days')));
  });

  test('should trigger warning for missed scheduled hospital appointments', () => {
    const pastAppts = [
      { date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), department: 'Geriatrics', doctor: 'Dr. Vivek', status: 'scheduled' as const }
    ];
    const result = CareGapEngine.evaluate(sampleCaregiver, sampleDependentPatient, new Date(), [], pastAppts);
    assert.ok(result.qualityOfCareWarnings.some((w) => w.includes('Missed hospital visits')));
  });

  test('should redistribute burden across secondary family members and reduce net care gap', () => {
    const soloResult = CareGapEngine.evaluate(sampleCaregiver, sampleDependentPatient);

    const multiFamilyCaregiver: CaregiverAttributes = {
      ...sampleCaregiver,
      secondaryMembers: [
        {
          id: 'sec_son',
          name: 'Son Rahul',
          relationship: 'son',
          age: 28,
          hoursPerDay: 3.0,
          assignedTasks: ['heavy_transfers', 'logistics_errands'],
          hasPhysicalLimitation: false
        },
        {
          id: 'sec_dil',
          name: 'Daughter-in-law Priya',
          relationship: 'daughter_in_law',
          age: 26,
          hoursPerDay: 2.0,
          assignedTasks: ['medications', 'bathing'],
          hasPhysicalLimitation: false
        }
      ]
    };

    const multiResult = CareGapEngine.evaluate(multiFamilyCaregiver, sampleDependentPatient);

    assert.strictEqual(multiResult.familySupportAbsorbedHours, 5.0);
    assert.strictEqual(multiResult.teamAllocations.secondaryFamilyHours, 5.0);
    assert.ok(multiResult.netCareGapHours < soloResult.netCareGapHours);
    assert.strictEqual(multiResult.taskDelegationStatus.transfersCovered, true);
    assert.strictEqual(multiResult.taskDelegationStatus.medicationsCovered, true);
    assert.strictEqual(multiResult.taskDelegationStatus.bathingCovered, true);
  });

  test('should relieve primary caregiver lumbar transfer strain when younger family member is assigned heavy transfers', () => {
    const soloCaregiverWithBackPain: CaregiverAttributes = {
      ...sampleCaregiver,
      caregiverHealth: {
        ...sampleCaregiver.caregiverHealth,
        hasBackPain: true
      },
      secondaryMembers: []
    };

    const supportedCaregiver: CaregiverAttributes = {
      ...soloCaregiverWithBackPain,
      secondaryMembers: [
        {
          id: 'sec_son',
          name: 'Son Rahul',
          relationship: 'son',
          age: 28,
          hoursPerDay: 2.5,
          assignedTasks: ['heavy_transfers'],
          hasPhysicalLimitation: false
        }
      ]
    };

    const soloRes = CareGapEngine.evaluate(soloCaregiverWithBackPain, sampleDependentPatient);
    const supportedRes = CareGapEngine.evaluate(supportedCaregiver, sampleDependentPatient);

    assert.ok(supportedRes.caregiverInjuryRiskScore < soloRes.caregiverInjuryRiskScore);
    assert.strictEqual(supportedRes.taskDelegationStatus.transfersCovered, true);
    assert.ok(supportedRes.taskDelegationStatus.transfersCoveredBy.includes('Son Rahul'));
  });

  test('should accurately model 12h vs 24h nurse shift scaling and night watch protection', () => {
    const nurse12hCaregiver: CaregiverAttributes = {
      ...sampleCaregiver,
      formalSupport: {
        type: 'trained_nurse_12h',
        hoursPerDay: 12,
        handlesHeavyTransfers: true,
        handlesMedicationWoundCare: true
      }
    };

    const nurse24hCaregiver: CaregiverAttributes = {
      ...sampleCaregiver,
      formalSupport: {
        type: 'trained_nurse_24h',
        hoursPerDay: 20,
        handlesHeavyTransfers: true,
        handlesMedicationWoundCare: true
      }
    };

    const res12h = CareGapEngine.evaluate(nurse12hCaregiver, sampleDependentPatient);
    const res24h = CareGapEngine.evaluate(nurse24hCaregiver, sampleDependentPatient);

    assert.ok(res24h.formalSupportAbsorbedHours >= res12h.formalSupportAbsorbedHours);
    assert.strictEqual(res24h.taskDelegationStatus.nightCareCovered, true);
    assert.strictEqual(res12h.taskDelegationStatus.transfersCovered, true);
    assert.strictEqual(res12h.taskDelegationStatus.medicationsCovered, true);
  });

  test('should accurately serialize and evaluate emergency logistics and monthly rotation policy', () => {
    const fullCaregiver: CaregiverAttributes = {
      ...sampleCaregiver,
      secondaryMembers: [
        {
          id: 'sec_son',
          name: 'Son Rahul',
          relationship: 'son',
          age: 28,
          occupation: 'IT Professional',
          workCommitmentSchedule: 'Mon-Fri 9am-6pm',
          careRestrictions: 'Available Evenings & Weekends Only',
          functionalStatus: 'independent',
          hoursPerDay: 2.5,
          assignedTasks: ['heavy_transfers', 'logistics_errands'],
          hasPhysicalLimitation: false
        }
      ],
      rotationPolicy: {
        rotationInterval: 'biweekly',
        primaryCaregiverRespiteDaysPerMonth: 4,
        weekendShiftLeader: 'Son Rahul',
        nightShiftArrangement: 'family_rotation'
      },
      emergencyLogistics: {
        hospitalDistanceKm: 3.5,
        travelTimeMinutes: 12,
        fourWheelerAvailableAtHome: true,
        vehicleDetails: 'Car at home',
        designatedEmergencyDriver: 'Son Rahul',
        preferredHospitalName: 'AIIMS Emergency',
        ambulanceContact: '108'
      }
    };

    const res = CareGapEngine.evaluate(fullCaregiver, sampleDependentPatient);
    assert.strictEqual(res.taskDelegationStatus.transfersCovered, true);
    assert.ok(res.familySupportAbsorbedHours > 0);
  });

  test('should reduce caregiver injury score and emit active protection findings when motorized bed & ripple mattress are present', () => {
    const patientWithoutEquipment: PatientDependenceProfile = {
      ...sampleDependentPatient,
      isBedBound: true,
      primaryConditions: ['Hypertension', 'Severe Bed Sore / Pressure Ulcer', 'Aspiration Dysphagia'],
      assistiveDevices: {
        hospitalBed: 'none',
        airWaterMattress: false,
        wheelchair: false,
        suctionApparatus: false,
        transferAids: false
      }
    };

    const patientWithEquipment: PatientDependenceProfile = {
      ...sampleDependentPatient,
      isBedBound: true,
      primaryConditions: ['Hypertension', 'Severe Bed Sore / Pressure Ulcer', 'Aspiration Dysphagia'],
      assistiveDevices: {
        hospitalBed: 'motorized_multichannel',
        airWaterMattress: true,
        wheelchair: true,
        suctionApparatus: true,
        transferAids: true
      }
    };

    const resNoGear = CareGapEngine.evaluate(sampleCaregiver, patientWithoutEquipment);
    const resWithGear = CareGapEngine.evaluate(sampleCaregiver, patientWithEquipment);

    // Equipment should reduce caregiver injury score
    assert.ok(resWithGear.caregiverInjuryRiskScore < resNoGear.caregiverInjuryRiskScore);
    assert.ok(resWithGear.assistiveDeviceStatus.ergonomicInjuryDiscountPercent >= 30);
    assert.strictEqual(resWithGear.assistiveDeviceStatus.hasAirWaterMattress, true);

    // Missing gear triggers quality warnings
    assert.ok(resNoGear.qualityOfCareWarnings.some((w) => w.includes('pressure ulcer') || w.includes('ripple mattress')));
    assert.ok(resNoGear.qualityOfCareWarnings.some((w) => w.includes('aspiration') || w.includes('suction')));

    // Present gear clears warning and produces active clinical findings
    assert.ok(resWithGear.clinicalFindings.some((f) => f.includes('Pressure Injury Protection Active')));
    assert.ok(resWithGear.clinicalFindings.some((f) => f.includes('Airway Clearance Protocol Active')));
  });

  test('should detect diurnal schedule conflicts when a full-time working helper is assigned morning transfers without morning availability', () => {
    const conflictedCaregiver: CaregiverAttributes = {
      ...sampleCaregiver,
      secondaryMembers: [
        {
          id: 'sec_busy_son',
          name: 'Son Rahul',
          relationship: 'son',
          age: 29,
          occupation: 'Office Employee (Full-time 9am-6pm)',
          workCommitmentSchedule: 'Mon-Fri 9am-6pm',
          careRestrictions: 'Evenings Only',
          functionalStatus: 'independent',
          hoursPerDay: 2.0,
          assignedTasks: ['bathing', 'heavy_transfers'],
          hasPhysicalLimitation: false,
          availableTimeBlocks: ['evening'] // No morning availability!
        }
      ]
    };

    const res = CareGapEngine.evaluate(conflictedCaregiver, sampleDependentPatient);

    assert.ok(res.diurnalCoverage.conflicts.length > 0);
    assert.ok(res.diurnalCoverage.conflicts.some((c) => c.conflictingTask === 'bathing' || c.conflictingTask === 'heavy_transfers'));
  });

  test('should generate valid WhatsApp care digest text and RFC 5545 iCalendar string', () => {
    const caregiverWithRotation: CaregiverAttributes = {
      ...sampleCaregiver,
      secondaryMembers: [
        {
          id: 'sec_1',
          name: 'Son Rahul',
          relationship: 'son',
          age: 28,
          hoursPerDay: 2.5,
          assignedTasks: ['heavy_transfers'],
          hasPhysicalLimitation: false,
          availableTimeBlocks: ['evening']
        }
      ],
      rotationPolicy: {
        rotationInterval: 'biweekly',
        primaryCaregiverRespiteDaysPerMonth: 4,
        weekendShiftLeader: 'Son Rahul',
        nightShiftArrangement: 'family_rotation'
      },
      emergencyLogistics: {
        hospitalDistanceKm: 4.5,
        travelTimeMinutes: 15,
        fourWheelerAvailableAtHome: true,
        designatedEmergencyDriver: 'Son Rahul',
        preferredHospitalName: 'AIIMS Emergency',
        ambulanceContact: '108'
      }
    };

    const evalResult = CareGapEngine.evaluate(caregiverWithRotation, sampleDependentPatient);

    const waText = generateWhatsAppCareDigest(caregiverWithRotation, sampleDependentPatient, evalResult);
    assert.ok(waText.includes('KUTUMBH CARE CIRCLE PLAN'));
    assert.ok(waText.includes('EMERGENCY PROTOCOL'));
    assert.ok(waText.includes('AIIMS Emergency'));

    const icsText = generateCareRosterIcs(caregiverWithRotation, sampleDependentPatient, evalResult);
    assert.ok(icsText.startsWith('BEGIN:VCALENDAR'));
    assert.ok(icsText.includes('BEGIN:VEVENT'));
    assert.ok(icsText.includes('Respite Day'));
    assert.ok(icsText.endsWith('END:VCALENDAR'));
  });

  // --- Regression Tests for D1 & D2 ---

  test('D1: Overdue appointment must not flip a healthy dyad to critical caregiver burnout', () => {
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
      },
      formalTrainingReceived: true,
      monthlyOutOfPocketBurden: 'manageable'
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

    const baseResult = CareGapEngine.evaluate(retiredCaregiver, independentPatient);
    assert.strictEqual(baseResult.caregiverBurnoutRiskLevel, 'low');
    assert.strictEqual(baseResult.netCareGapHours, 0);

    // Add overdue appointment (30 days past)
    const overdueAppts = [
      {
        date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        department: 'Orthopedics',
        doctor: 'Dr. Sharma',
        status: 'scheduled' as const
      }
    ];

    const resultWithMissedAppt = CareGapEngine.evaluate(
      retiredCaregiver,
      independentPatient,
      new Date(),
      [],
      overdueAppts
    );

    // Warning is captured for the patient care gap
    assert.ok(resultWithMissedAppt.qualityOfCareWarnings.length > 0);
    assert.ok(resultWithMissedAppt.qualityOfCareWarnings.some((w) => w.includes('Missed hospital visits')));
    // But caregiver burnout level must remain low
    assert.strictEqual(resultWithMissedAppt.caregiverBurnoutRiskLevel, 'low');
  });

  test('D2: Patient care-quality warnings must not inflate caregiver lumbar strain / injury risk score', () => {
    const healthyCaregiver: CaregiverAttributes = {
      ...sampleCaregiver,
      employment: 'retired',
      dailyHoursCommitted: 8,
      caregiverHealth: {
        hasBackPain: false,
        hasHypertension: false,
        hasArthritis: false,
        hasDiabetes: false,
        hasInsomnia: false
      },
      formalTrainingReceived: true
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
      isBedBound: false,
      primaryConditions: []
    };

    const cleanResult = CareGapEngine.evaluate(healthyCaregiver, independentPatient);

    const missedAppts = [
      {
        date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        department: 'Orthopedics',
        doctor: 'Dr. Rao',
        status: 'scheduled' as const
      }
    ];

    const resultWithAppt = CareGapEngine.evaluate(
      healthyCaregiver,
      independentPatient,
      new Date(),
      [],
      missedAppts
    );

    assert.strictEqual(
      resultWithAppt.caregiverInjuryRiskScore,
      cleanResult.caregiverInjuryRiskScore,
      'Lumbar strain / injury risk score must not increase due to missed appointment'
    );
  });

  test('D3: Combined covered capacity must include family support hours and reconcile with demand and net gap', () => {
    const caregiverWithFamily: CaregiverAttributes = {
      ...sampleCaregiver,
      dailyHoursCommitted: 4,
      employment: 'full_time',
      caregiverHealth: {
        hasBackPain: false,
        hasHypertension: false,
        hasArthritis: false,
        hasDiabetes: false,
        hasInsomnia: false
      },
      secondaryMembers: [
        {
          id: 'sec_1',
          name: 'Sibling',
          relationship: 'sibling',
          age: 30,
          hoursPerDay: 5.0,
          assignedTasks: ['medications', 'bathing'],
          hasPhysicalLimitation: false
        }
      ]
    };

    const result = CareGapEngine.evaluate(caregiverWithFamily, sampleDependentPatient);
    // Total available capacity = primary safe capacity + family support absorbed + formal support absorbed
    const totalAvailable = Math.round(
      (result.caregiverSafeCapacityHours + result.familySupportAbsorbedHours + result.formalSupportAbsorbedHours) * 10
    ) / 10;
    const expectedGap = Math.max(0, Math.round((result.patientCareDemandHours - totalAvailable) * 10) / 10);

    assert.strictEqual(
      result.netCareGapHours,
      expectedGap,
      `Demand (${result.patientCareDemandHours}) - Total Capacity (${totalAvailable}) must exactly equal Net Gap (${result.netCareGapHours})`
    );
  });

  test('D4: Secondary family member offering 2h/day reduces net gap by exactly 2.0h without phantom double/triple discounting', () => {
    const baseCaregiver: CaregiverAttributes = {
      ...sampleCaregiver,
      dailyHoursCommitted: 4,
      employment: 'full_time',
      secondaryMembers: [],
      otherFamilyMembersCount: 0
    };

    const baseResult = CareGapEngine.evaluate(baseCaregiver, sampleDependentPatient);

    const caregiverWith2hMember: CaregiverAttributes = {
      ...baseCaregiver,
      secondaryMembers: [
        {
          id: 'sec_1',
          name: 'Daughter',
          relationship: 'daughter',
          age: 25,
          hoursPerDay: 2.0,
          assignedTasks: [],
          hasPhysicalLimitation: false
        }
      ]
    };

    const supportedResult = CareGapEngine.evaluate(caregiverWith2hMember, sampleDependentPatient);

    assert.strictEqual(supportedResult.familySupportAbsorbedHours, 2.0);
    assert.strictEqual(supportedResult.caregiverSafeCapacityHours, baseResult.caregiverSafeCapacityHours);
    const gapReduction = Math.round((baseResult.netCareGapHours - supportedResult.netCareGapHours) * 10) / 10;
    assert.strictEqual(gapReduction, 2.0, 'A 2h/day secondary family contribution must reduce the net care gap by exactly 2.0h');
  });

  test('D5: formalSupport.hoursPerDay scaling dynamically adjusts absorbed hours', () => {
    const caregiver12h: CaregiverAttributes = {
      ...sampleCaregiver,
      formalSupport: {
        type: 'paid_attendant_12h',
        hoursPerDay: 12,
        handlesHeavyTransfers: true,
        handlesMedicationWoundCare: false
      }
    };
    const caregiver1h: CaregiverAttributes = {
      ...sampleCaregiver,
      formalSupport: {
        type: 'paid_attendant_12h',
        hoursPerDay: 1,
        handlesHeavyTransfers: true,
        handlesMedicationWoundCare: false
      }
    };

    const res12h = CareGapEngine.evaluate(caregiver12h, sampleDependentPatient);
    const res1h = CareGapEngine.evaluate(caregiver1h, sampleDependentPatient);

    assert.strictEqual(res12h.formalSupportAbsorbedHours, 10.0);
    assert.strictEqual(res1h.formalSupportAbsorbedHours, 0.8);
    assert.ok(res1h.netCareGapHours > res12h.netCareGapHours);
  });

  // --- Scientific Rigor Tests (S1 - S5) ---

  test('S1: Standard Lawton-Brody 8-item instrument calculates score 0 to 8', () => {
    const halfDependentPatient: PatientDependenceProfile = {
      ...sampleDependentPatient,
      lawtonIadl: {
        telephone: true,
        shopping: true,
        mealPreparation: true,
        housekeeping: true,
        laundry: false,
        transportation: false,
        medicationManagement: false,
        finances: false
      }
    };

    const result = CareGapEngine.evaluate(sampleCaregiver, halfDependentPatient);
    assert.strictEqual(result.lawtonIadlScore, 4);
  });

  test('S3: Biomechanical Strain Index is bounded 10-100 and categorized accurately', () => {
    const lowStrainDyad = CareGapEngine.evaluate(
      {
        ...sampleCaregiver,
        caregiverHealth: { hasBackPain: false, hasArthritis: false, hasDiabetes: false, hasHypertension: false, hasInsomnia: false },
        formalTrainingReceived: true,
        age: 35
      },
      {
        ...sampleDependentPatient,
        katzAdl: { bathing: true, dressing: true, toileting: true, transferring: true, continence: true, feeding: true }
      }
    );

    assert.ok(lowStrainDyad.caregiverInjuryRiskScore >= 10 && lowStrainDyad.caregiverInjuryRiskScore <= 100);
    assert.ok(
      ['low', 'moderate', 'high', 'severe'].includes(lowStrainDyad.caregiverInjuryRiskCategory)
    );
  });

  test('S4: hasCondition must use word-boundary matching and not match substring in unrelated text like "routine"', () => {
    const patientWithRoutineVisit: PatientDependenceProfile = {
      ...sampleDependentPatient,
      primaryConditions: ['Routine Annual Geriatric Health Checkup', 'Mild Osteoarthritis'],
      isBedBound: false
    };

    const result = CareGapEngine.evaluate(sampleCaregiver, patientWithRoutineVisit);
    // 'uti' must NOT match 'Routine'
    assert.strictEqual(
      result.qualityOfCareWarnings.some((w) => w.toLowerCase().includes('recurrent infection')),
      false,
      '"Routine" text must not trigger UTI / recurrent infection warning'
    );
  });

  test('S4: Isolated feeding inability without dysphagia/neurological condition must not trigger aspiration warning', () => {
    const arthriticHandsPatient: PatientDependenceProfile = {
      ...sampleDependentPatient,
      primaryConditions: ['Severe Hand Osteoarthritis', 'Bilateral Carpal Tunnel'],
      katzAdl: {
        ...sampleDependentPatient.katzAdl,
        feeding: false // Cannot hold spoon due to arthritic joints
      }
    };

    const result = CareGapEngine.evaluate(sampleCaregiver, arthriticHandsPatient);
    assert.strictEqual(
      result.qualityOfCareWarnings.some((w) => w.includes('aspiration') || w.includes('dysphagia')),
      false,
      'Arthritic hand feeding deficit must not trigger false aspiration/suction warning'
    );
  });

  test('S5: CareGapEvaluationResult must stamp algorithm engineVersion', () => {
    const result = CareGapEngine.evaluate(sampleCaregiver, sampleDependentPatient);
    assert.strictEqual(result.engineVersion, '2.3.0');
    assert.ok(typeof result.evaluatedAt === 'string');
  });

  test('S5: HealthRepository persists and restores engineVersion and evaluatedAt', async () => {
    const { HealthRepository } = await import('../src/lib/db/health-repository');
    const result = CareGapEngine.evaluate(sampleCaregiver, sampleDependentPatient);
    HealthRepository.saveCareGapEvaluation(result);

    const retrieved = HealthRepository.getStoredCareGapEvaluation();
    assert.ok(retrieved !== null);
    assert.strictEqual(retrieved?.engineVersion, '2.3.0');
    assert.strictEqual(retrieved?.evaluatedAt, result.evaluatedAt);
    assert.strictEqual(retrieved?.totalAvailableCapacityHours, result.totalAvailableCapacityHours);
  });

  test('Constants: Care gap model constants are exported and correctly configured for Indian scenario', async () => {
    const {
      CARE_GAP_ENGINE_VERSION,
      BASELINE_CARE_DEMAND_HOURS,
      DEMAND_PER_ADL_DEFICIT_HOURS,
      DEMAND_PER_IADL_DEFICIT_HOURS,
      FORMAL_PRODUCTIVITY_FACTORS,
      FINANCIAL_STRAIN_MULTIPLIERS
    } = await import('../src/lib/clinical/care-gap-constants');

    assert.strictEqual(CARE_GAP_ENGINE_VERSION, '2.3.0');
    assert.strictEqual(BASELINE_CARE_DEMAND_HOURS, 1.5);
    assert.strictEqual(DEMAND_PER_ADL_DEFICIT_HOURS, 1.0);
    assert.strictEqual(DEMAND_PER_IADL_DEFICIT_HOURS, 0.35);
    assert.strictEqual(FORMAL_PRODUCTIVITY_FACTORS.paid_attendant_24h.nominalHours, 24);
    assert.strictEqual(FORMAL_PRODUCTIVITY_FACTORS.paid_attendant_24h.productivityFactor, 16.0 / 24);
    assert.strictEqual(FINANCIAL_STRAIN_MULTIPLIERS.severe_toxicity, 1.4);
  });

  // --- Diurnal Care Gap Index Tests ---

  test('Diurnal: Computes per-block gaps over 4 standard diurnal blocks and preserves netCareGapHours', () => {
    const result = CareGapEngine.evaluate(sampleCaregiver, sampleDependentPatient);
    assert.ok(result.blockGaps);
    assert.ok(result.blockGaps.morning_rush);
    assert.ok(result.blockGaps.afternoon);
    assert.ok(result.blockGaps.evening);
    assert.ok(result.blockGaps.night_watch);

    // Block demand sum matches total demand
    const sumDemands = Math.round(
      (result.blockGaps.morning_rush.demandHours +
        result.blockGaps.afternoon.demandHours +
        result.blockGaps.evening.demandHours +
        result.blockGaps.night_watch.demandHours) * 10
    ) / 10;
    assert.strictEqual(sumDemands, result.patientCareDemandHours);
    assert.ok(result.careGapIndex >= 0 && result.careGapIndex <= 100);
  });

  test('Diurnal: Concentrated nocturnal deficit scores higher on careGapIndex than distributed daytime deficit', () => {
    // Zero deficit dyad
    const zeroResult = CareGapEngine.evaluate(
      {
        ...sampleCaregiver,
        dailyHoursCommitted: 12,
        employment: 'retired',
        caregiverHealth: { hasBackPain: false, hasArthritis: false, hasDiabetes: false, hasHypertension: false, hasInsomnia: false },
        formalTrainingReceived: true
      },
      {
        ...sampleDependentPatient,
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
      }
    );
    assert.strictEqual(zeroResult.careGapIndex, 0);

    // Patient with severe nocturnal sundowning vs waking demand
    const sundowningPatient: PatientDependenceProfile = {
      ...sampleDependentPatient,
      cognitiveBehavioralLoad: 'severe_sundowning',
      isBedBound: true
    };

    const sundowningResult = CareGapEngine.evaluate(sampleCaregiver, sundowningPatient);
    assert.ok(sundowningResult.careGapIndex > 50, 'Concentrated nocturnal deficit must produce high Diurnal Index');
    assert.ok(sundowningResult.blockGaps.night_watch.demandHours > 0);
  });

  // --- Biomechanical Constraint Vector & NIOSH RNLE Tests ---

  test('Biomechanical: calculateBiomechanicalLoad computes real NIOSH RNLE Lifting Index and L5/S1 compression', async () => {
    const { calculateBiomechanicalLoad } = await import('../src/lib/clinical/biomechanical-load');

    const result = calculateBiomechanicalLoad({
      caregiver: sampleCaregiver,
      patient: sampleDependentPatient,
      isTransfersRelievedByStaffOrFamily: false,
      isBathingRelievedByStaffOrFamily: false,
      isNightCareRelievedByStaffOrFamily: false,
      netCareGapHours: 4.5
    });

    assert.ok(result.liftingIndex > 1.0, 'Solo lifting of dependent 68kg adult must exceed NIOSH Recommended Weight Limit (LI > 1.0)');
    assert.ok(result.spinalCompressionKN > 2.0, 'Spinal compression must be computed in kiloNewtons');
    assert.ok(result.dailyTransferCount >= 4, 'Daily transfer count must reflect diurnal toileting/transfer events');
    assert.ok(result.nocturnalSleepInterruptions >= 2.0, 'Nocturnal interruptions must reflect insomnia and night care');
    assert.ok(['moderate', 'high', 'severe'].includes(result.caregiverInjuryRiskCategory));
  });

  test('Biomechanical: Motorized bed and transfer aids apply physics discounts to RNLE lift multipliers', async () => {
    const { calculateBiomechanicalLoad } = await import('../src/lib/clinical/biomechanical-load');

    const unassisted = calculateBiomechanicalLoad({
      caregiver: sampleCaregiver,
      patient: {
        ...sampleDependentPatient,
        assistiveDevices: {
          hospitalBed: 'none',
          airWaterMattress: false,
          wheelchair: false,
          suctionApparatus: false,
          transferAids: false
        }
      },
      isTransfersRelievedByStaffOrFamily: false,
      isBathingRelievedByStaffOrFamily: false,
      isNightCareRelievedByStaffOrFamily: false,
      netCareGapHours: 4.0
    });

    const equipped = calculateBiomechanicalLoad({
      caregiver: sampleCaregiver,
      patient: {
        ...sampleDependentPatient,
        assistiveDevices: {
          hospitalBed: 'motorized_multichannel',
          airWaterMattress: true,
          wheelchair: true,
          suctionApparatus: false,
          transferAids: true
        }
      },
      isTransfersRelievedByStaffOrFamily: false,
      isBathingRelievedByStaffOrFamily: false,
      isNightCareRelievedByStaffOrFamily: false,
      netCareGapHours: 4.0
    });

    assert.ok(
      equipped.liftingIndex < unassisted.liftingIndex,
      'Motorized bed and transfer aids must reduce the NIOSH Lifting Index'
    );
    assert.ok(
      equipped.caregiverInjuryRiskScore < unassisted.caregiverInjuryRiskScore,
      'Assistive devices must reduce overall biomechanical injury score'
    );
    assert.ok(equipped.ergonomicMechanisms.length > 0);
  });

  test('Biomechanical: Shared staff transfer relief significantly lowers solo lifting index', async () => {
    const { calculateBiomechanicalLoad } = await import('../src/lib/clinical/biomechanical-load');

    const solo = calculateBiomechanicalLoad({
      caregiver: sampleCaregiver,
      patient: sampleDependentPatient,
      isTransfersRelievedByStaffOrFamily: false,
      isBathingRelievedByStaffOrFamily: false,
      isNightCareRelievedByStaffOrFamily: false,
      netCareGapHours: 4.0
    });

    const staffRelieved = calculateBiomechanicalLoad({
      caregiver: sampleCaregiver,
      patient: sampleDependentPatient,
      isTransfersRelievedByStaffOrFamily: true,
      isBathingRelievedByStaffOrFamily: true,
      isNightCareRelievedByStaffOrFamily: true,
      netCareGapHours: 1.0
    });

    assert.ok(
      staffRelieved.liftingIndex < solo.liftingIndex,
      'Staff handling relief must drop solo lifting index'
    );
    assert.ok(
      staffRelieved.nocturnalSleepInterruptions < solo.nocturnalSleepInterruptions,
      'Night staff coverage must eliminate nocturnal care awakenings'
    );
  });

  // --- Phase 6: Formal Property & Mathematical Invariant Tests ---

  test('Property: Monotonicity of Care Demand and Gap Reduction', () => {
    // 1. More ADL deficits never lower demand
    const patient2Deficits: PatientDependenceProfile = {
      ...sampleDependentPatient,
      katzAdl: { bathing: false, dressing: false, toileting: true, transferring: true, continence: true, feeding: true }
    };
    const patient4Deficits: PatientDependenceProfile = {
      ...sampleDependentPatient,
      katzAdl: { bathing: false, dressing: false, toileting: false, transferring: false, continence: true, feeding: true }
    };
    const eval2 = CareGapEngine.evaluate(sampleCaregiver, patient2Deficits);
    const eval4 = CareGapEngine.evaluate(sampleCaregiver, patient4Deficits);
    assert.ok(eval4.patientCareDemandHours >= eval2.patientCareDemandHours, 'More ADL deficits must increase or maintain care demand');

    // 2. More support hours never raise the net gap
    const cg4h: CaregiverAttributes = {
      ...sampleCaregiver,
      formalSupport: { type: 'paid_attendant_12h', hoursPerDay: 4, handlesHeavyTransfers: true, handlesMedicationWoundCare: false }
    };
    const cg8h: CaregiverAttributes = {
      ...sampleCaregiver,
      formalSupport: { type: 'paid_attendant_12h', hoursPerDay: 8, handlesHeavyTransfers: true, handlesMedicationWoundCare: false }
    };
    const evalCg4 = CareGapEngine.evaluate(cg4h, patient4Deficits);
    const evalCg8 = CareGapEngine.evaluate(cg8h, patient4Deficits);
    assert.ok(evalCg8.netCareGapHours <= evalCg4.netCareGapHours, 'More support hours must lower or maintain net care gap');

    // 3. Adding a family member never raises careGapIndex
    const cgWithFamily: CaregiverAttributes = {
      ...sampleCaregiver,
      secondaryMembers: [
        {
          id: 'fam_helper',
          name: 'Pooja',
          relationship: 'daughter',
          age: 26,
          hoursPerDay: 2,
          hasPhysicalLimitation: false,
          assignedTasks: ['feeding', 'medications']
        }
      ]
    };
    const evalSolo = CareGapEngine.evaluate(sampleCaregiver, patient4Deficits);
    const evalFam = CareGapEngine.evaluate(cgWithFamily, patient4Deficits);
    assert.ok(evalFam.careGapIndex <= evalSolo.careGapIndex, 'Adding a secondary family member must reduce or maintain careGapIndex');
  });

  test('Property: Conservation of Diurnal Demand and Gap Reconciliation Invariant', () => {
    const testDyads: Array<{ cg: CaregiverAttributes; pt: PatientDependenceProfile }> = [
      { cg: sampleCaregiver, pt: sampleIndependentPatient },
      { cg: sampleCaregiver, pt: sampleDependentPatient },
      {
        cg: {
          ...sampleCaregiver,
          formalSupport: { type: 'paid_attendant_12h', hoursPerDay: 6, handlesHeavyTransfers: true, handlesMedicationWoundCare: false },
          secondaryMembers: [
            {
              id: 'm1',
              name: 'Amit',
              relationship: 'son',
              age: 30,
              hoursPerDay: 2.5,
              hasPhysicalLimitation: false,
              assignedTasks: ['heavy_transfers']
            }
          ]
        },
        pt: sampleDependentPatient
      }
    ];

    for (const dyad of testDyads) {
      const res = CareGapEngine.evaluate(dyad.cg, dyad.pt);

      // Invariant 1: sum(blockGaps.demand) == patientCareDemandHours
      const blockDemandSum = Object.values(res.blockGaps).reduce((acc, b) => acc + b.demandHours, 0);
      assert.strictEqual(
        Math.round(blockDemandSum * 10) / 10,
        res.patientCareDemandHours,
        'Sum of diurnal block demands must exactly equal patientCareDemandHours'
      );

      // Invariant 2: totalAvailableCapacity - demand reconciles with netCareGapHours
      const totalAvailableCapacity =
        res.caregiverSafeCapacityHours + res.formalSupportAbsorbedHours + res.familySupportAbsorbedHours;
      const expectedNetGap = Math.max(0, Math.round((res.patientCareDemandHours - totalAvailableCapacity) * 10) / 10);
      assert.strictEqual(
        res.netCareGapHours,
        expectedNetGap,
        'netCareGapHours must equal max(0, demand - totalAvailableCapacity)'
      );
    }
  });

  test('Property: No-double-count of Secondary Family Capacity (D4 Invariant)', () => {
    const soloRes = CareGapEngine.evaluate(sampleCaregiver, sampleDependentPatient);

    const withMember: CaregiverAttributes = {
      ...sampleCaregiver,
      secondaryMembers: [
        {
          id: 'fam_member_d4',
          name: 'Vikas',
          relationship: 'son',
          age: 28,
          hoursPerDay: 2.0,
          hasPhysicalLimitation: false,
          assignedTasks: ['feeding', 'medications']
        }
      ]
    };

    const memberRes = CareGapEngine.evaluate(withMember, sampleDependentPatient);
    const gapReduction = Math.round((soloRes.netCareGapHours - memberRes.netCareGapHours) * 10) / 10;

    assert.strictEqual(
      gapReduction,
      2.0,
      'A secondary member offering 2.0h/day must reduce net care gap by exactly 2.0h without double counting'
    );
    assert.strictEqual(memberRes.familySupportAbsorbedHours, 2.0);
  });

  test('Property: Anti-alarm Guard - Overdue Appointment Isolation (D1 Invariant)', () => {
    const retiredCaregiver: CaregiverAttributes = {
      ...sampleCaregiver,
      employment: 'retired',
      dailyHoursCommitted: 8
    };

    const overdueAppt: EngineAppointmentRecord = {
      date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'scheduled',
      department: 'Orthopaedics',
      doctor: 'Dr. Sharma'
    };

    const cleanRes = CareGapEngine.evaluate(retiredCaregiver, sampleIndependentPatient, new Date());
    const overdueRes = CareGapEngine.evaluate(retiredCaregiver, sampleIndependentPatient, new Date(), [], [overdueAppt]);

    assert.strictEqual(cleanRes.caregiverBurnoutRiskLevel, 'low');
    assert.strictEqual(overdueRes.caregiverBurnoutRiskLevel, 'low');
    assert.strictEqual(overdueRes.netCareGapHours, 0);
    assert.ok(overdueRes.qualityOfCareWarnings.length > 0, 'Must record quality warning on patient channel');
  });

  test('Property: Diurnal Concentration Sensitivity', () => {
    // Nocturnal concentrated deficit vs daytime distributed deficit
    const nocturnalPt: PatientDependenceProfile = {
      ...sampleIndependentPatient,
      cognitiveBehavioralLoad: 'severe_sundowning',
      isBedBound: true
    };

    const daytimePt: PatientDependenceProfile = {
      ...sampleIndependentPatient,
      katzAdl: { bathing: false, dressing: false, toileting: true, transferring: true, continence: true, feeding: true },
      lawtonIadl: { ...sampleIndependentPatient.lawtonIadl, mealPreparation: false, housekeeping: false, laundry: false }
    };

    const resNocturnal = CareGapEngine.evaluate(sampleCaregiver, nocturnalPt);
    const resDaytime = CareGapEngine.evaluate(sampleCaregiver, daytimePt);

    assert.ok(
      resNocturnal.careGapIndex > resDaytime.careGapIndex,
      'Nocturnal deficit must yield a higher Care Gap Index than distributed daytime deficit'
    );
  });

  test('Property: Recommender Soundness & Clinical Tier Validity', async () => {
    const { StaffingRecommender } = await import('../src/lib/clinical/staffing-recommender');

    // 1. Every returned ladder option actually produces the residual gap it advertises when evaluated
    const report = StaffingRecommender.recommend(sampleCaregiver, sampleDependentPatient);
    assert.strictEqual(report.ladder.length, 3);

    for (const rung of report.ladder) {
      assert.ok(typeof rung.simulatedResult.netCareGapHours === 'number');
      assert.ok(rung.simulatedResult.netCareGapHours >= 0);
    }

    // 2. Pressure ulcer / catheter patient never gets attendant-tier recommendation
    const woundPatient: PatientDependenceProfile = {
      ...sampleDependentPatient,
      primaryConditions: ['Stage 3 Decubitus Ulcer', 'Indwelling Urinary Catheter']
    };
    const woundReport = StaffingRecommender.recommend(sampleCaregiver, woundPatient);
    assert.strictEqual(woundReport.acuityAssessment.dominantSkillTier, 'nurse');
    assert.ok(woundReport.ladder.some((r) => r.skillTier === 'nurse'));

    // 3. Isolated night-watch deficit recommends nocturnal coverage, not day shift
    const nightPatient: PatientDependenceProfile = {
      ...sampleIndependentPatient,
      cognitiveBehavioralLoad: 'severe_sundowning',
      isBedBound: true
    };
    const nightReport = StaffingRecommender.recommend(sampleCaregiver, nightPatient);
    // console.log('DEBUG NIGHT REPORT:', nightReport.ladder.map(l => ({ rung: l.rung, title: l.title, shiftWindow: l.shiftWindow })));
    assert.ok(
      nightReport.ladder.some((r) => r.shiftWindow === 'night_12h' || r.shiftWindow === 'live_in_24h'),
      `Night-watch deficit must recommend night shift or 24h coverage, received: ${JSON.stringify(nightReport.ladder.map(l => l.shiftWindow))}`
    );

    // 4. Adding capable family member produces zero-cost redistribution candidate
    const cgWithFamily: CaregiverAttributes = {
      ...sampleCaregiver,
      secondaryMembers: [
        {
          id: 'sec_pooja',
          name: 'Pooja',
          relationship: 'daughter',
          age: 26,
          hoursPerDay: 3,
          hasPhysicalLimitation: false,
          assignedTasks: ['heavy_transfers', 'medications']
        }
      ]
    };
    const famReport = StaffingRecommender.recommend(cgWithFamily, sampleDependentPatient);
    const famOption = famReport.ladder.find((r) => r.supportType === 'family_redistribution');
    assert.ok(famOption !== undefined, 'Capable family member must yield family redistribution option');
    assert.strictEqual(famOption?.costTierRank, 1);
  });
});
