/**
 * Seeds the two reference clinical dyads (baseline + longitudinal history)
 * used to demonstrate the clinician workspace.
 */

import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../client';
import { calculateZaritScore, type ZaritEvaluationResult } from '@/lib/zarit-scale';
import { calculateFunctionScore, type FunctionEvaluationResult } from '@/lib/clinical/function-scale';
import {
  DEFAULT_CAREGIVER_ATTRIBUTES,
  type PatientDependenceProfile,
  type CaregiverAttributes
} from '@/lib/clinical/care-gap-engine';
import {
  HealthRepository,
  type VitalRecord,
  type MedicationItem,
  type DailyCareLog
} from '@/lib/db/health-repository';
import { currentUid } from './internal';
import { createStaffInvite } from './access';
import type { DyadInvite } from './dyad-invites';

/* ------------------------------------------------------------------ *
 * Real Dyad Seeding & Firestore Persistence Engine
 * ------------------------------------------------------------------ */

export interface SeedResult {
  success: boolean;
  dyadCount: number;
  message: string;
  dyadUids: string[];
}

/**
 * Seeds clinically realistic Indian geriatric patient-caregiver dyads directly
 * into Cloud Firestore with full baseline assessments (Patient Profile, Katz ADL,
 * Lawton IADL, Caregiver Matrix) and longitudinal clinical observations (serial vitals,
 * follow-up Zarit burden interviews, functional scores, daily bedside care sheets,
 * and active medications).
 */
export async function seedRealDyadsToFirestore(): Promise<SeedResult> {
  const uid = currentUid() || 'doctor-vivek-uid';
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const createdUids: string[] = [];

  try {
    // =========================================================================
    // DYAD 1: Smt. Sarojini Devi (81y) & Suresh Kumar (78y spouse)
    // Acuity: Post-Stroke Hemiparesis, Severe Osteoarthritis, Hypertension, Bedbound
    // =========================================================================
    const d1Uid = 'dyad_sarojini_devi';
    const d1InviteCode = 'SAROJINI81';
    createdUids.push(d1Uid);

    const d1PatientProfile: PatientDependenceProfile = {
      name: 'Smt. Sarojini Devi',
      age: 81,
      primaryConditions: ['Post-Stroke Hemiparesis', 'Severe Osteoarthritis', 'Hypertension'],
      katzAdl: { bathing: false, dressing: false, toileting: false, transferring: false, continence: true, feeding: true },
      lawtonIadl: { telephone: true, shopping: false, mealPreparation: false, housekeeping: false, laundry: false, transportation: false, medicationManagement: false, finances: false },
      cognitiveBehavioralLoad: 'wandering_agitation',
      fallHistoryLast6Months: 2,
      isBedBound: true,
      weightKg: 58,
      heightCm: 154
    };

    const d1Caregiver: CaregiverAttributes = {
      ...DEFAULT_CAREGIVER_ATTRIBUTES,
      name: 'Suresh Kumar',
      kinship: 'spouse',
      dailyHoursCommitted: 14,
      formalSupport: {
        type: 'paid_attendant_12h',
        hoursPerDay: 12,
        handlesHeavyTransfers: true,
        handlesMedicationWoundCare: false
      },
      otherFamilyMembersCount: 1,
      caregiverHealth: {
        hasBackPain: true,
        hasHypertension: true,
        hasArthritis: true,
        hasDiabetes: false,
        hasInsomnia: true
      }
    };

    const d1Invite: DyadInvite = {
      inviteCode: d1InviteCode,
      dyadUid: d1Uid,
      clinicianUid: uid,
      clinicianLabel: 'Dr. Vivek',
      patientName: 'Smt. Sarojini Devi',
      patientAge: 81,
      primaryConditions: ['Post-Stroke Hemiparesis', 'Severe Osteoarthritis', 'Hypertension'],
      caregiverName: 'Suresh Kumar',
      caregiverPhone: '+919820012345',
      createdAt: new Date(now - 30 * dayMs).toISOString(),
      claimedAt: null,
      claimedByUid: null
    };

    const d1ZaritBaseline: ZaritEvaluationResult = {
      ...calculateZaritScore(
        { zbi_1: 3, zbi_2: 3, zbi_3: 4, zbi_4: 3, zbi_5: 3, zbi_7: 3, zbi_8: 3, zbi_14: 3, zbi_22: 4 },
        'ZBI22'
      ),
      completedAt: new Date(now - 30 * dayMs).toISOString()
    };

    const d1ZaritFollowup: ZaritEvaluationResult = {
      ...calculateZaritScore(
        { zbi_1: 2, zbi_2: 2, zbi_3: 3, zbi_4: 2, zbi_5: 2, zbi_7: 2, zbi_8: 2, zbi_14: 2, zbi_22: 3 },
        'ZBI22'
      ),
      completedAt: new Date(now - 3 * dayMs).toISOString()
    };

    const d1FuncBaseline: FunctionEvaluationResult = {
      ...calculateFunctionScore(
        { bi_feeding: 5, bi_bathing: 0, bi_grooming: 0, bi_dressing: 0, bi_bowels: 10, bi_bladder: 10, bi_toilet: 0, bi_transfers: 5, bi_mobility: 5, bi_stairs: 0 },
        { li_telephone: 1, li_shopping: 0, li_food: 0, li_housekeeping: 0, li_laundry: 0, li_transport: 0, li_meds: 0, li_finances: 0 }
      ),
      recordedAt: new Date(now - 30 * dayMs).toISOString()
    };

    const d1FuncFollowup: FunctionEvaluationResult = {
      ...calculateFunctionScore(
        { bi_feeding: 5, bi_bathing: 0, bi_grooming: 0, bi_dressing: 0, bi_bowels: 10, bi_bladder: 10, bi_toilet: 0, bi_transfers: 10, bi_mobility: 10, bi_stairs: 0 },
        { li_telephone: 1, li_shopping: 0, li_food: 0, li_housekeeping: 0, li_laundry: 0, li_transport: 0, li_meds: 0, li_finances: 0 }
      ),
      recordedAt: new Date(now - 3 * dayMs).toISOString()
    };

    const d1Vitals: VitalRecord[] = [
      { id: 'v_d1_1', date: new Date(now - 28 * dayMs).toISOString(), bp: '168/102', pulse: '88', bloodSugar: '160', sleep: 'poor', createdAt: new Date(now - 28 * dayMs).toISOString() },
      { id: 'v_d1_2', date: new Date(now - 21 * dayMs).toISOString(), bp: '158/96', pulse: '84', bloodSugar: '148', sleep: 'poor', createdAt: new Date(now - 21 * dayMs).toISOString() },
      { id: 'v_d1_3', date: new Date(now - 14 * dayMs).toISOString(), bp: '148/90', pulse: '80', bloodSugar: '138', sleep: 'average', createdAt: new Date(now - 14 * dayMs).toISOString() },
      { id: 'v_d1_4', date: new Date(now - 7 * dayMs).toISOString(), bp: '142/86', pulse: '78', bloodSugar: '132', sleep: 'average', createdAt: new Date(now - 7 * dayMs).toISOString() },
      { id: 'v_d1_5', date: new Date(now - 1 * dayMs).toISOString(), bp: '136/84', pulse: '74', bloodSugar: '126', sleep: 'good', createdAt: new Date(now - 1 * dayMs).toISOString() }
    ];

    const d1DailyLog: DailyCareLog = {
      id: `log_sarojini_${new Date().toISOString().slice(0, 10)}`,
      date: new Date().toISOString().slice(0, 10),
      shift: 'day',
      recordedByRole: 'nurse',
      recordedByName: 'Nurse Vidya',
      meals: {
        breakfast: 'Oatmeal porridge with crushed almonds',
        lunch: 'Pureed dal khichdi (75% completed)',
        feedNotes: 'Assisted feed upright 45 degrees, swallowed safely'
      },
      monitoringRows: [
        { id: 'r1', timeLabel: '08:00 AM', bp: '136/84', pulse: '74', bloodSugar: '126', remarks: 'Fasting' },
        { id: 'r2', timeLabel: '10:00 AM', spo2: '97%', remarks: 'Room air' },
        { id: 'r3', timeLabel: '12:00 PM', physiotherapy: 'Passive range of motion right arm', remarks: 'Turned left lateral' },
        { id: 'r4', timeLabel: '02:00 PM', remarks: 'Skin intact, barrier cream applied' }
      ],
      medications: [
        { id: 'm1', label: 'Amlodipine 5mg', slot: 'morning', given: true },
        { id: 'm2', label: 'Ecosprin 75mg', slot: 'lunch', given: true },
        { id: 'm3', label: 'Atorvastatin 20mg', slot: 'night', given: false }
      ],
      stoolPassed: true,
      catheterChanged: false,
      sleep: 'good',
      generalRemarks: 'Skin intact over sacrum. Alternating pressure mattress active. BP normalized on Amlodipine 5mg.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const d1Meds: MedicationItem[] = [
      { id: 'med_1', name: 'Amlodipine', dosage: '5 mg', frequency: 'Once Daily (Morning)', timeOfDay: ['morning'], foodRelation: 'after', indication: 'Hypertension', prescribedBy: 'Dr. Vivek', startDate: new Date(now - 30 * dayMs).toISOString() },
      { id: 'med_2', name: 'Atorvastatin', dosage: '20 mg', frequency: 'Once Daily (Bedtime)', timeOfDay: ['bedtime'], foodRelation: 'after', indication: 'Post-Stroke Secondary Prevention', prescribedBy: 'Dr. Vivek', startDate: new Date(now - 30 * dayMs).toISOString() },
      { id: 'med_3', name: 'Ecosprin', dosage: '75 mg', frequency: 'Once Daily (Post Lunch)', timeOfDay: ['afternoon'], foodRelation: 'after', indication: 'Antiplatelet', prescribedBy: 'Dr. Vivek', startDate: new Date(now - 30 * dayMs).toISOString() },
      { id: 'med_4', name: 'Pantoprazole', dosage: '40 mg', frequency: 'Once Daily (Before Breakfast)', timeOfDay: ['morning'], foodRelation: 'before', indication: 'Gastroprotection', prescribedBy: 'Dr. Vivek', startDate: new Date(now - 30 * dayMs).toISOString() }
    ];

    // =========================================================================
    // DYAD 2: Shri Ramesh Chand (76y) & Anjali Sharma (daughter)
    // Acuity: Parkinson's Disease, Type 2 Diabetes, Gait Freezing
    // =========================================================================
    const d2Uid = 'dyad_ramesh_chand';
    const d2InviteCode = 'RAMESH76';
    createdUids.push(d2Uid);

    const d2PatientProfile: PatientDependenceProfile = {
      name: 'Shri Ramesh Chand',
      age: 76,
      primaryConditions: ['Parkinson’s Disease', 'Diabetes T2', 'Gait Freezing'],
      katzAdl: { bathing: false, dressing: false, toileting: true, transferring: true, continence: true, feeding: true },
      lawtonIadl: { telephone: true, shopping: false, mealPreparation: false, housekeeping: false, laundry: false, transportation: false, medicationManagement: false, finances: false },
      cognitiveBehavioralLoad: 'none',
      fallHistoryLast6Months: 1,
      isBedBound: false,
      weightKg: 64,
      heightCm: 168
    };

    const d2Caregiver: CaregiverAttributes = {
      ...DEFAULT_CAREGIVER_ATTRIBUTES,
      name: 'Anjali Sharma',
      kinship: 'daughter',
      dailyHoursCommitted: 6,
      formalSupport: {
        type: 'paid_attendant_12h',
        hoursPerDay: 4,
        handlesHeavyTransfers: false,
        handlesMedicationWoundCare: false
      },
      otherFamilyMembersCount: 2
    };

    const d2Invite: DyadInvite = {
      inviteCode: d2InviteCode,
      dyadUid: d2Uid,
      clinicianUid: uid,
      clinicianLabel: 'Dr. Vivek',
      patientName: 'Shri Ramesh Chand',
      patientAge: 76,
      primaryConditions: ['Parkinson’s Disease', 'Diabetes T2', 'Gait Freezing'],
      caregiverName: 'Anjali Sharma',
      caregiverPhone: '+919819098765',
      createdAt: new Date(now - 25 * dayMs).toISOString(),
      claimedAt: null,
      claimedByUid: null
    };

    const d2ZaritBaseline: ZaritEvaluationResult = {
      ...calculateZaritScore(
        { zbi_1: 2, zbi_2: 2, zbi_3: 2, zbi_7: 2, zbi_8: 2, zbi_14: 2, zbi_22: 2 },
        'ZBI22'
      ),
      completedAt: new Date(now - 25 * dayMs).toISOString()
    };

    const d2ZaritFollowup: ZaritEvaluationResult = {
      ...calculateZaritScore(
        { zbi_1: 1, zbi_2: 2, zbi_3: 2, zbi_7: 1, zbi_8: 2, zbi_14: 1, zbi_22: 2 },
        'ZBI22'
      ),
      completedAt: new Date(now - 2 * dayMs).toISOString()
    };

    const d2FuncBaseline: FunctionEvaluationResult = {
      ...calculateFunctionScore(
        { bi_feeding: 10, bi_bathing: 0, bi_grooming: 5, bi_dressing: 5, bi_bowels: 10, bi_bladder: 10, bi_toilet: 10, bi_transfers: 10, bi_mobility: 10, bi_stairs: 0 },
        { li_telephone: 1, li_shopping: 0, li_food: 0, li_housekeeping: 0, li_laundry: 0, li_transport: 0, li_meds: 0, li_finances: 0 }
      ),
      recordedAt: new Date(now - 25 * dayMs).toISOString()
    };

    const d2FuncFollowup: FunctionEvaluationResult = {
      ...calculateFunctionScore(
        { bi_feeding: 10, bi_bathing: 5, bi_grooming: 5, bi_dressing: 5, bi_bowels: 10, bi_bladder: 10, bi_toilet: 10, bi_transfers: 10, bi_mobility: 10, bi_stairs: 0 },
        { li_telephone: 1, li_shopping: 0, li_food: 0, li_housekeeping: 0, li_laundry: 0, li_transport: 0, li_meds: 0, li_finances: 0 }
      ),
      recordedAt: new Date(now - 2 * dayMs).toISOString()
    };

    const d2Vitals: VitalRecord[] = [
      { id: 'v_d2_1', date: new Date(now - 24 * dayMs).toISOString(), bp: '138/86', pulse: '78', bloodSugar: '148', sleep: 'average', createdAt: new Date(now - 24 * dayMs).toISOString() },
      { id: 'v_d2_2', date: new Date(now - 16 * dayMs).toISOString(), bp: '134/84', pulse: '76', bloodSugar: '136', sleep: 'good', createdAt: new Date(now - 16 * dayMs).toISOString() },
      { id: 'v_d2_3', date: new Date(now - 8 * dayMs).toISOString(), bp: '130/82', pulse: '74', bloodSugar: '130', sleep: 'good', createdAt: new Date(now - 8 * dayMs).toISOString() },
      { id: 'v_d2_4', date: new Date(now - 1 * dayMs).toISOString(), bp: '128/80', pulse: '72', bloodSugar: '122', sleep: 'good', createdAt: new Date(now - 1 * dayMs).toISOString() }
    ];

    const d2Meds: MedicationItem[] = [
      { id: 'med_2_1', name: 'Syndopa Plus (Levodopa/Carbidopa)', dosage: '100/25 mg', frequency: 'Three times daily', timeOfDay: ['morning', 'afternoon', 'evening'], foodRelation: 'before', indication: 'Parkinsonism', prescribedBy: 'Dr. Vivek', startDate: new Date(now - 25 * dayMs).toISOString() },
      { id: 'med_2_2', name: 'Metformin', dosage: '500 mg', frequency: 'Twice Daily (Post Meals)', timeOfDay: ['morning', 'evening'], foodRelation: 'after', indication: 'Diabetes T2', prescribedBy: 'Dr. Vivek', startDate: new Date(now - 25 * dayMs).toISOString() },
      { id: 'med_2_3', name: 'Telmisartan', dosage: '40 mg', frequency: 'Once Daily (Morning)', timeOfDay: ['morning'], foodRelation: 'after', indication: 'Hypertension', prescribedBy: 'Dr. Vivek', startDate: new Date(now - 25 * dayMs).toISOString() }
    ];

    // Persist Dyad 1 & 2 locally to HealthRepository for immediate availability
    const dyads = [
      { uid: d1Uid, invite: d1Invite, profile: d1PatientProfile, caregiver: d1Caregiver, zarit: [d1ZaritFollowup, d1ZaritBaseline], func: [d1FuncFollowup, d1FuncBaseline], vitals: d1Vitals, meds: d1Meds, log: d1DailyLog },
      { uid: d2Uid, invite: d2Invite, profile: d2PatientProfile, caregiver: d2Caregiver, zarit: [d2ZaritFollowup, d2ZaritBaseline], func: [d2FuncFollowup, d2FuncBaseline], vitals: d2Vitals, meds: d2Meds, log: null }
    ];

    for (const d of dyads) {
      HealthRepository.saveDyadInvite(d.invite);
      HealthRepository.saveRegisteredPatient({
        patientUid: d.uid,
        inviteCode: d.invite.inviteCode,
        patientName: d.invite.patientName,
        patientAge: d.invite.patientAge,
        primaryConditions: d.invite.primaryConditions,
        caregiverName: d.invite.caregiverName,
        caregiverPhone: d.invite.caregiverPhone,
        weightKg: d.profile.weightKg ?? null,
        heightCm: d.profile.heightCm ?? null,
        patientProfile: d.profile,
        caregiverAttributes: d.caregiver,
        createdAt: d.invite.createdAt
      });
      HealthRepository.savePatientProfileFor(d.uid, d.profile);
      HealthRepository.saveCaregiverAttributesFor(d.uid, d.caregiver);
      for (const z of d.zarit) HealthRepository.saveZaritAssessmentFor(d.uid, z);
      for (const f of d.func) HealthRepository.saveFunctionScoreFor(d.uid, f);
      for (const v of d.vitals) HealthRepository.saveVitalFor(d.uid, v);
      HealthRepository.saveMedicationsFor(d.uid, d.meds);
      if (d.log) HealthRepository.saveDailyCareLogFor(d.uid, d.log);
    }

    // Persist to Cloud Firestore if connected
    if (db) {
      for (const d of dyads) {
        try {
          await setDoc(doc(db, 'dyadInvites', d.invite.inviteCode), d.invite);
          await setDoc(doc(db, 'users', d.uid), {
            role: 'caregiver',
            displayName: `${d.invite.patientName} (Caregiver: ${d.caregiver.name})`,
            createdAt: serverTimestamp()
          });
          await setDoc(doc(db, 'users', d.uid, 'patientProfile', 'current'), {
            ...d.profile,
            updatedAt: new Date().toISOString()
          });
          await setDoc(doc(db, 'users', d.uid, 'caregiverAttributes', 'current'), {
            ...d.caregiver,
            updatedAt: new Date().toISOString()
          });
          await setDoc(doc(db, 'users', d.uid, 'clinicianGrants', uid), {
            clinicianUid: uid,
            clinicianLabel: 'Dr. Vivek',
            grantedAt: d.invite.createdAt,
            revokedAt: null
          });
          // Sarojini Devi's dyad is specifically assigned to Nurse Vidya
          // (matches the seeded daily log's recordedByName) — a real,
          // per-dyad staff grant, not blanket access to every patient.
          if (d.uid === d1Uid) {
            await createStaffInvite(d.uid, 'NURSEVIDYA', 'Nurse Vidya');
          }
          await setDoc(doc(db, 'users', d.uid, 'medications', 'current'), {
            items: d.meds,
            updatedAt: new Date().toISOString()
          });

          // Subcollections: zaritAssessments
          for (const z of d.zarit) {
            const zId = `zarit_${new Date(z.completedAt).getTime()}`;
            await setDoc(doc(db, 'users', d.uid, 'zaritAssessments', zId), z);
          }

          // Subcollections: functionScores
          for (const f of d.func) {
            const fId = `func_${new Date(f.recordedAt).getTime()}`;
            await setDoc(doc(db, 'users', d.uid, 'functionScores', fId), f);
          }

          // Subcollections: vitals
          for (const v of d.vitals) {
            await setDoc(doc(db, 'users', d.uid, 'vitals', v.id), v);
          }

          // Subcollection: dailyCareLogs
          if (d.log) {
            await setDoc(doc(db, 'users', d.uid, 'dailyCareLogs', d.log.id), d.log);
          }
        } catch (subErr) {
          console.warn(`Firestore sync note for dyad ${d.uid}:`, subErr);
        }
      }
    }

    return {
      success: true,
      dyadCount: dyads.length,
      message: 'Real patient-caregiver dyads with baseline & longitudinal history successfully saved to Firestore backend.',
      dyadUids: createdUids
    };
  } catch (err) {
    console.error('Failed to seed real dyads:', err);
    return {
      success: false,
      dyadCount: 0,
      message: err instanceof Error ? err.message : 'Unknown error seeding dyads.',
      dyadUids: []
    };
  }
}
