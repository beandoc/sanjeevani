import { test, describe } from 'vitest';
import assert from 'node:assert';
import {
  CareGapEngine,
  CaregiverAttributes,
  PatientDependenceProfile,
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

  test('secondary family members must actually increase safe capacity', () => {
    const solo = CareGapEngine.evaluate(
      { ...sampleCaregiver, otherFamilyMembersCount: 0 },
      sampleDependentPatient
    );
    const supported = CareGapEngine.evaluate(
      { ...sampleCaregiver, otherFamilyMembersCount: 3 },
      sampleDependentPatient
    );

    assert.ok(supported.caregiverSafeCapacityHours > solo.caregiverSafeCapacityHours);
    assert.ok(supported.netCareGapHours < solo.netCareGapHours);
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
    assert.ok(rx.action.includes('Prescribe:'));
    assert.ok(rx.action.includes('hours/day of paid attendant'));
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
});
