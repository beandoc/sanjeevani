import { describe, it, expect } from 'vitest';
import { CareGapEngine } from '../src/lib/clinical/care-gap-engine';
import { StaffingRecommender } from '../src/lib/clinical/staffing-recommender';
import {
  PatientDependenceProfile,
  CaregiverAttributes
} from '../src/lib/clinical/care-gap-engine';
import { DynamicNursingCareActivity } from '../src/lib/db/health-repository/types';

describe('Clinical Smoke Test: Bed-Bound Comorbid Patient with Elderly Solo Caregiver with Lumbar Spondylosis', () => {
  // 1. Setup Patient Profile
  const dynamicNursingActivities: DynamicNursingCareActivity[] = [
    {
      id: 'act_suction',
      name: 'Bedside Airway Suctioning',
      category: 'airway_respiratory',
      durationMinutes: 15,
      staffCount: 1,
      frequencyPerDay: 4,
      diurnalBlocks: ['morning_rush', 'afternoon', 'evening', 'night_watch']
    },
    {
      id: 'act_ryles_tube',
      name: "Ryle's Tube / Enteral Feeding",
      category: 'enteral_nutrition',
      durationMinutes: 30,
      staffCount: 1,
      frequencyPerDay: 5,
      diurnalBlocks: ['morning_rush', 'afternoon', 'evening']
    },
    {
      id: 'act_two_person_turns',
      name: 'Two-Person Bed Repositioning & Q3H Turning',
      category: 'skin_positioning',
      durationMinutes: 15,
      staffCount: 2,
      frequencyPerDay: 8,
      diurnalBlocks: ['morning_rush', 'afternoon', 'evening', 'night_watch']
    },
    {
      id: 'act_diaper_changes',
      name: 'Adult Diaper Change & Continence Care',
      category: 'hygiene_continence',
      durationMinutes: 15,
      staffCount: 1,
      frequencyPerDay: 5,
      diurnalBlocks: ['morning_rush', 'afternoon', 'evening', 'night_watch']
    },
    {
      id: 'act_two_person_bath',
      name: 'Two-Person Full Bedside Sponge Bath',
      category: 'hygiene_continence',
      durationMinutes: 30,
      staffCount: 2,
      frequencyPerDay: 1,
      diurnalBlocks: ['morning_rush']
    }
  ];

  const patientProfile: PatientDependenceProfile = {
    name: 'Ramesh Sharma',
    age: 72,
    gender: 'male',
    weightKg: 68,
    heightCm: 168,
    isBedBound: true,
    cognitiveBehavioralLoad: 'none',
    fallHistoryLast6Months: 0,
    primaryConditions: [
      'Ischemic Stroke with dense hemiplegia',
      'Lumbar spondylosis with radiculopathy',
      'Neurogenic dysphagia',
      'Severe urinary and fecal incontinence'
    ],
    // Katz ADL: Total Dependence (0/6)
    katzAdl: {
      bathing: false,
      dressing: false,
      toileting: false,
      transferring: false,
      continence: false,
      feeding: false
    },
    // Lawton IADL: Total Dependence (0/8)
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
    currentMedications: [
      { name: 'Aspirin 75mg' },
      { name: 'Atorvastatin 40mg' },
      { name: 'Amlodipine 5mg' },
      { name: 'Pantoprazole 40mg' },
      { name: 'Baclofen 10mg' }
    ],
    assistiveDevices: {
      hospitalBed: 'none',
      airWaterMattress: false,
      wheelchair: true,
      suctionApparatus: true,
      transferAids: false
    },
    dynamicNursingActivities
  };

  // 2. Setup Caregiver Attributes: Elderly Solo Wife with Lumbar Spondylosis + Minor Granddaughter
  const caregiverProfile: CaregiverAttributes = {
    name: 'Savitri Sharma',
    age: 68, // Elderly spouse
    gender: 'female',
    kinship: 'spouse',
    coResidence: 'lives_together',
    education: 'secondary',
    employment: 'homemaker',
    dailyHoursCommitted: 8,
    monthlyOutOfPocketBurden: 'moderate_strain',
    financialStatus: 'moderate_strain',
    caregiverHealth: {
      hasBackPain: true, // Lumbar spondylosis
      hasArthritis: true,
      hasInsomnia: true,
      hasHypertension: false,
      hasDiabetes: false
    },
    formalTrainingReceived: false,
    secondaryMembers: [
      {
        id: 'member_granddaughter',
        name: 'Aanya (Granddaughter)',
        relationship: 'grandchild',
        age: 15, // Minor adolescent student
        hasPhysicalLimitation: false,
        hoursPerDay: 2,
        acceptanceStatus: 'accepted',
        availableTimeBlocks: ['morning_rush', 'evening'],
        assignedTasks: ['heavy_transfers', 'medications', 'bathing'] // Erroneously requested tasks to test safeguarding filter
      }
    ]
  };

  it('evaluates patient functional dependence: Katz 0/6, Lawton 0/8', () => {
    const result = CareGapEngine.evaluate(caregiverProfile, patientProfile);
    expect(result.katzAdlScore).toBe(0);
    expect(result.katzDependenceLevel).toBe('severe_dependence');
    expect(result.lawtonIadlScore).toBe(0);
  });

  it('incorporates measured dynamic nursing activities with tight prediction range (<= 25%)', () => {
    const result = CareGapEngine.evaluate(caregiverProfile, patientProfile);

    // Active care midpoint should reflect high direct care demand
    expect(result.patientCareDemandHours).toBeGreaterThanOrEqual(7.5);

    // Prediction interval must NOT be wide like 4.8-16.5 hrs
    // With measured nursing activities, relative half width should be tightly bounded <= 25%
    expect(result.careDemandBand.bandRelativeHalfWidth).toBeLessThanOrEqual(0.25);

    // Verify drivers include the dynamic nursing activities
    const driverLabels = result.careDemandBand.drivers.map((d) => d.label);
    expect(driverLabels).toContain('Bedside Airway Suctioning');
    expect(driverLabels).toContain("Ryle's Tube / Enteral Feeding");
    expect(driverLabels).toContain('Two-Person Bed Repositioning & Q3H Turning');
    expect(driverLabels).toContain('Two-Person Full Bedside Sponge Bath');

    // Dual-staff requirement flag must be raised
    expect(result.careDemandBand.requiresTwoPersonTransfers).toBe(true);
  });

  it('safeguards minor granddaughter: excludes her from heavy transfers and bed bathing', () => {
    const result = CareGapEngine.evaluate(caregiverProfile, patientProfile);

    // Verify granddaughter was NOT credited for heavy transfers or bathing
    const transferSlot = result.allocationLedger.find((s) => s.task === 'heavy_transfers');
    if (transferSlot) {
      const allocatedToGranddaughter = transferSlot.allocatedTo.some(
        (a) => a.memberId === 'member_granddaughter'
      );
      expect(allocatedToGranddaughter).toBe(false);
    }

    const bathingSlot = result.allocationLedger.find((s) => s.task === 'bathing');
    if (bathingSlot) {
      const allocatedToGranddaughter = bathingSlot.allocatedTo.some(
        (a) => a.memberId === 'member_granddaughter'
      );
      expect(allocatedToGranddaughter).toBe(false);
    }

    // Verify adolescent safeguarding alert is emitted in clinical findings
    const hasSafeguardingAlert = result.clinicalFindings.some((f) =>
      f.includes('Adolescent Helper Safeguarding Alert') && f.includes('minor/student')
    );
    expect(hasSafeguardingAlert).toBe(true);
  });

  it('calculates severe lumbar strain and reduced safe capacity for 68yo spouse with spondylosis', () => {
    const result = CareGapEngine.evaluate(caregiverProfile, patientProfile);

    // Safe capacity for an elderly spouse with back pain, arthritis, and a bed-bound spouse
    // should drop from committed 8h to <= 2.5h safe capacity
    expect(result.caregiverSafeCapacityHours).toBeLessThanOrEqual(2.5);

    // Lumbar biomechanical strain and hazard tier
    expect(result.caregiverInjuryRiskScore).toBeGreaterThanOrEqual(70);
    expect(result.manualHandlingHazardTier).toBe('severe');
    expect(result.liftingIndex).toBeGreaterThan(2.0); // Exceeds safe lifting limit

    // Net care gap must be large (>= 7.0h/day)
    expect(result.netCareGapHours).toBeGreaterThanOrEqual(7.0);
    expect(result.caregiverBurnoutRiskLevel).toBe('critical');
  });

  it('staffing recommender: mandates Registered Nurse (due to suction & tube feeding) and recommends 24h Live-in or 12h shifts', () => {
    const baseline = CareGapEngine.evaluate(caregiverProfile, patientProfile);
    const report = StaffingRecommender.recommend(caregiverProfile, patientProfile, baseline);

    // Must mandate a Registered Nurse (not an attendant or physio aide)
    expect(report.acuityAssessment.dominantSkillTier).toBe('nurse');
    expect(report.acuityAssessment.highAcuityProcedures.length).toBeGreaterThanOrEqual(2);
    expect(
      report.acuityAssessment.highAcuityProcedures.some((p) => p.includes('Suctioning') || p.includes('Enteral'))
    ).toBe(true);

    // Must identify continuous 24h supervision deficit
    expect(report.diurnalPattern.primaryDeficitWindow).toBe('Continuous 24-Hour Supervision');

    // 2-person handling protocol alert must be generated
    expect(
      report.acuityAssessment.clinicalReasons.some((r) => r.includes('Dual-Staff / 2-Person Transfer Protocol'))
    ).toBe(true);

    // Adolescent safeguarding note must be present
    expect(
      report.acuityAssessment.clinicalReasons.some((r) => r.includes('Adolescent Safeguarding Protection'))
    ).toBe(true);

    // Staffing ladder must provide options
    expect(report.ladder.length).toBeGreaterThan(0);
    const recommendedOption = report.ladder.find((c) => c.rung === 'recommended') || report.ladder[0];
    expect(recommendedOption).toBeDefined();
    expect(recommendedOption.skillTier).toBe('nurse');
    expect(['live_in_24h', 'day_12h']).toContain(recommendedOption.shiftWindow);

    // Family redistribution must NOT be offered as absorbing heavy transfers because the only helper is a 15-year-old minor!
    const familyCandidate = report.ladder.find((c) => c.supportType === 'family_redistribution');
    expect(familyCandidate).toBeUndefined();
  });
});
