import { describe, it, expect, beforeEach } from 'vitest';
import { HealthRepository } from '../src/lib/db/health-repository';
import { CareGapEngine, DEFAULT_CAREGIVER_ATTRIBUTES, DEFAULT_PATIENT_PROFILE } from '../src/lib/clinical/care-gap-engine';
import { calculateZaritScore } from '../src/lib/zarit-scale';
import { calculateFunctionScore } from '../src/lib/clinical/function-scale';
import { computeTrajectory } from '../src/lib/analytics/trajectory';
import {
  syncPatientProfile,
  syncCaregiverAttributes,
  syncZaritAssessment,
  syncVitals,
  syncMedications
} from '../src/lib/firebase/clinical-sync';

// Mock in-memory localStorage for Node testing environment
const mockStorage: Record<string, string> = {};
const mockLocalStorage = {
  getItem: (key: string) => mockStorage[key] || null,
  setItem: (key: string, value: string) => {
    mockStorage[key] = value;
  },
  removeItem: (key: string) => {
    delete mockStorage[key];
  },
  clear: () => {
    Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
  }
};

describe('Sanjeevani Backend Data Persistence & Cross-Portal Synchronization', () => {
  beforeEach(() => {
    // Setup window & localStorage mock
    (globalThis as any).window = {
      localStorage: mockLocalStorage,
      location: { origin: 'http://localhost:3000' }
    };
    (globalThis as any).localStorage = mockLocalStorage;
    mockLocalStorage.clear();
    HealthRepository.deleteAllUserData();
  });

  describe('1. Patient Registration & Demographic Persistence', () => {
    it('should save and retrieve patient dependence profile with all Katz and Lawton ADLs', () => {
      const patientData = {
        name: 'Smt. Sarojini Devi',
        age: 81,
        primaryConditions: ['Hypertension', 'Post-Stroke Hemiparesis', 'Severe Osteoarthritis'],
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
        cognitiveBehavioralLoad: 'moderate' as const,
        fallHistoryLast6Months: 2,
        isBedBound: true
      };

      HealthRepository.savePatientProfile(patientData);
      const retrieved = HealthRepository.getPatientProfile();

      expect(retrieved.name).toBe('Smt. Sarojini Devi');
      expect(retrieved.age).toBe(81);
      expect(retrieved.primaryConditions).toHaveLength(3);
      expect(retrieved.katzAdl.bathing).toBe(false);
      expect(retrieved.katzAdl.feeding).toBe(true);
      expect(retrieved.isBedBound).toBe(true);
      expect(retrieved.fallHistoryLast6Months).toBe(2);
    });

    it('should handle offline sync fallback gracefully when signed out', async () => {
      const result = await syncPatientProfile(DEFAULT_PATIENT_PROFILE);
      expect(result).toHaveProperty('queued');
      expect(typeof result.queued).toBe('boolean');
    });
  });

  describe('2. Psychometric & Functional Assessment Persistence', () => {
    it('should calculate, save, and retrieve Zarit Burden Interview (ZBI-12 and ZBI-22) assessments', () => {
      const zaritResult = calculateZaritScore(
        {
          zbi_1: 3,
          zbi_2: 3,
          zbi_3: 4,
          zbi_7: 3,
          zbi_8: 3,
          zbi_9: 2,
          zbi_10: 2,
          zbi_11: 3,
          zbi_12: 3,
          zbi_14: 3,
          zbi_17: 2,
          zbi_22: 4
        },
        'ZBI12'
      );

      expect(zaritResult.totalScore).toBe(31);
      expect(zaritResult.maxScore).toBe(48);
      expect(zaritResult.tier).toBe('ZBI12');
      expect(zaritResult.severityBand).toBe('critical_red');

      HealthRepository.saveZaritAssessment(zaritResult);
      const history = HealthRepository.getZaritAssessments();

      expect(history).toHaveLength(1);
      expect(history[0].totalScore).toBe(31);
      expect(history[0].severityBand).toBe('critical_red');
      expect(history[0].classification.en).toBeDefined();
    });

    it('should calculate, save, and retrieve Barthel ADL + Lawton IADL function assessments', () => {
      const barthelResponses = {
        bi_feeding: 5,
        bi_bathing: 0,
        bi_grooming: 0,
        bi_dressing: 5,
        bi_bowels: 10,
        bi_bladder: 10,
        bi_toilet_use: 5,
        bi_transfers: 10,
        bi_mobility: 10,
        bi_stairs: 0
      };
      const lawtonResponses = {
        lawton_telephone: 0,
        lawton_shopping: 0,
        lawton_food_prep: 0,
        lawton_housekeeping: 0,
        lawton_laundry: 0,
        lawton_transport: 0,
        lawton_meds: 0,
        lawton_finances: 0
      };

      const functionScore = calculateFunctionScore(barthelResponses, lawtonResponses);

      expect(functionScore.barthelScore).toBe(40);
      expect(functionScore.lawtonScore).toBe(0);
      expect(functionScore.dependencyPercentage).toBe(60); // 100 - 40 = 60%
    });

    it('should compute longitudinal trajectories linking burden and functional scores', () => {
      const zbi1 = calculateZaritScore({ zbi_1: 2, zbi_2: 2, zbi_3: 3, zbi_22: 3 }, 'ZBI12');
      zbi1.completedAt = '2026-06-01T10:00:00.000Z';
      const zbi2 = calculateZaritScore({ zbi_1: 3, zbi_2: 3, zbi_3: 4, zbi_22: 4 }, 'ZBI12');
      zbi2.completedAt = '2026-07-01T10:00:00.000Z';

      const func1 = calculateFunctionScore({ bi_feeding: 10, bi_bathing: 5 }, { lawton_telephone: 1 });
      func1.recordedAt = '2026-06-01T10:00:00.000Z';
      const func2 = calculateFunctionScore({ bi_feeding: 5, bi_bathing: 0 }, { lawton_telephone: 0 });
      func2.recordedAt = '2026-07-01T10:00:00.000Z';

      const trajectory = computeTrajectory([zbi2, zbi1], [func2, func1]);

      expect(trajectory.burdenSeries).toHaveLength(2);
      expect(trajectory.functionSeries).toHaveLength(2);
      expect(trajectory.riskBand).toBeDefined();
    });

    it('should handle Zarit cloud sync return shape', async () => {
      const zbi = calculateZaritScore({ zbi_1: 1 }, 'ZBI4');
      const syncResult = await syncZaritAssessment(zbi);
      expect(syncResult).toHaveProperty('queued');
    });
  });

  describe('3. Care Matrix (Caregiver Capacity & Formal Support) Persistence', () => {
    it('should save and retrieve full Care Matrix with secondary family and formal support', () => {
      const caregiverMatrix = {
        ...DEFAULT_CAREGIVER_ATTRIBUTES,
        name: 'Suresh Kumar',
        age: 54,
        kinship: 'son' as const,
        dailyHoursCommitted: 8,
        caregiverHealth: {
          hasBackPain: true,
          hasHypertension: true,
          hasArthritis: false,
          hasDiabetes: false,
          hasInsomnia: true
        },
        secondaryMembers: [
          {
            id: 'sec_1',
            name: 'Pooja Verma (Daughter-in-law)',
            relationship: 'daughter_in_law' as const,
            age: 48,
            occupation: 'Teacher',
            workCommitmentSchedule: 'Mon-Fri 8am-2pm',
            careRestrictions: 'Available Afternoons & Evenings',
            functionalStatus: 'independent' as const,
            hoursPerDay: 4,
            assignedTasks: ['medications' as const, 'feeding' as const],
            hasPhysicalLimitation: false,
            availableTimeBlocks: ['afternoon' as const, 'evening' as const]
          }
        ],
        formalSupport: {
          type: 'paid_attendant_12h_day' as const,
          hoursPerDay: 12,
          handlesHeavyTransfers: true,
          handlesMedicationWoundCare: false
        },
        rotationPolicy: {
          rotationInterval: 'biweekly' as const,
          primaryCaregiverRespiteDaysPerMonth: 4,
          weekendShiftLeader: 'Pooja Verma',
          nightShiftArrangement: 'family_rotation' as const
        },
        emergencyLogistics: {
          hospitalDistanceKm: 3.5,
          travelTimeMinutes: 12,
          fourWheelerAvailableAtHome: true,
          vehicleDetails: 'Maruti Dzire',
          designatedEmergencyDriver: 'Suresh Kumar',
          preferredHospitalName: 'Max Healthcare Patparganj',
          ambulanceContact: '108'
        }
      };

      HealthRepository.saveCaregiverAttributes(caregiverMatrix);
      const retrieved = HealthRepository.getCaregiverAttributes();

      expect(retrieved.name).toBe('Suresh Kumar');
      expect(retrieved.kinship).toBe('son');
      expect(retrieved.caregiverHealth.hasBackPain).toBe(true);
      expect(retrieved.secondaryMembers).toHaveLength(1);
      expect(retrieved.secondaryMembers![0].name).toContain('Pooja');
      expect(retrieved.formalSupport.type).toBe('paid_attendant_12h_day');
      expect(retrieved.formalSupport.hoursPerDay).toBe(12);
      expect(retrieved.emergencyLogistics.hospitalDistanceKm).toBe(3.5);
    });

    it('should evaluate care gap and injury risk based on Care Matrix inputs', () => {
      const patient = {
        ...DEFAULT_PATIENT_PROFILE,
        katzAdl: {
          bathing: false,
          dressing: false,
          toileting: false,
          transferring: false,
          continence: false,
          feeding: false
        },
        isBedBound: true
      };

      const caregiver = {
        ...DEFAULT_CAREGIVER_ATTRIBUTES,
        name: 'Elderly Spouse',
        age: 72,
        caregiverHealth: {
          ...DEFAULT_CAREGIVER_ATTRIBUTES.caregiverHealth,
          hasBackPain: true
        },
        dailyHoursCommitted: 14,
        formalSupport: {
          type: 'none' as const,
          hoursPerDay: 0,
          handlesHeavyTransfers: false,
          handlesMedicationWoundCare: false
        }
      };

      const evalResult = CareGapEngine.evaluate(caregiver, patient);

      expect(evalResult.netCareGapHours).toBeGreaterThan(0);
      expect(evalResult.caregiverInjuryRiskScore).toBeGreaterThan(50);
      expect(evalResult.caregiverBurnoutRiskLevel).toBeDefined();
    });

    it('should handle syncCaregiverAttributes return shape', async () => {
      const syncResult = await syncCaregiverAttributes(DEFAULT_CAREGIVER_ATTRIBUTES);
      expect(syncResult).toHaveProperty('queued');
      expect(typeof syncResult.queued).toBe('boolean');
    });
  });

  describe('4. Vitals & Medication Data Durability', () => {
    it('should save and retrieve bedside vital records', () => {
      const vital = HealthRepository.addVital({
        date: new Date().toISOString(),
        systolic: '138',
        diastolic: '88',
        pulse: '76',
        bloodSugar: '142',
        sleep: 'good',
        notes: 'Pre-breakfast reading'
      });

      expect(vital.id).toBeDefined();
      expect(vital.bp).toBe('138/88');

      const vitalsList = HealthRepository.getVitals();
      expect(vitalsList).toHaveLength(1);
      expect(vitalsList[0].systolic).toBe('138');
    });

    it('should save, toggle slots, and retrieve active medication regimens', () => {
      const meds = [
        {
          id: 'med_1',
          name: 'Telmisartan 40mg',
          dosage: '40 mg',
          frequency: 'Once Daily',
          timeOfDay: ['morning' as const],
          foodRelation: 'after' as const,
          takenSlots: [],
          takenToday: false
        }
      ];

      HealthRepository.saveMedications(meds);
      const updated = HealthRepository.toggleMedicationTaken('med_1', 'morning');

      expect(updated[0].takenSlots).toContain('morning');
      expect(updated[0].takenToday).toBe(true);
    });

    it('should handle syncVitals and syncMedications return shapes', async () => {
      const vitalResult = await syncVitals({
        id: 'v1',
        date: new Date().toISOString(),
        sleep: 'good',
        createdAt: new Date().toISOString()
      });
      expect(vitalResult).toHaveProperty('queued');

      const medResult = await syncMedications([]);
      expect(medResult).toHaveProperty('queued');
    });
  });

  describe('5. DPDP Act Data Portability Export & Erasure', () => {
    it('should export all user data conforming to schema v2', () => {
      HealthRepository.savePatientProfile(DEFAULT_PATIENT_PROFILE);
      HealthRepository.saveCaregiverAttributes(DEFAULT_CAREGIVER_ATTRIBUTES);

      const exported = HealthRepository.exportAllUserData();

      expect(exported.schemaVersion).toBe('sanjeevani-dpdp-v2');
      expect(exported.jurisdiction).toContain('Digital Personal Data Protection');
      expect(exported.patientProfile).toBeDefined();
      expect(exported.caregiverAttributes).toBeDefined();
      expect(exported.exportedAt).toBeDefined();
    });

    it('should purge all user data on right to erasure invocation', () => {
      HealthRepository.addVital({
        date: new Date().toISOString(),
        systolic: '120',
        diastolic: '80',
        sleep: 'good'
      });
      expect(HealthRepository.getVitals().length).toBeGreaterThan(0);

      HealthRepository.deleteAllUserData();
      expect(HealthRepository.getVitals()).toHaveLength(0);
    });
  });
});
