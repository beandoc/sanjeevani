/**
 * Sanjeevani Health & Clinical Repository
 * Offline-first, privacy-compliant data repository conforming to DPDP Act 2023.
 * Supports complete data portability (export) and Right to Erasure (instant purge).
 */

import { ZaritEvaluationResult } from '@/lib/zarit-scale';
import type { FunctionEvaluationResult } from '@/lib/clinical/function-scale';
import {
  CaregiverAttributes,
  PatientDependenceProfile,
  LawtonIadlProfile,
  CareGapEvaluationResult,
  CareGapEngine,
  DEFAULT_CAREGIVER_ATTRIBUTES,
  DEFAULT_PATIENT_PROFILE
} from '@/lib/clinical/care-gap-engine';

export type { CaregiverAttributes, PatientDependenceProfile, LawtonIadlProfile, CareGapEvaluationResult };

export interface VitalRecord {
  id: string;
  date: string; // ISO string
  weight?: string;
  pulse?: string;
  bp?: string;
  systolic?: string;
  diastolic?: string;
  spo2?: string;
  bloodSugar?: string;
  sleep: 'good' | 'average' | 'poor';
  notes?: string;
  createdAt: string;
}

export type DailyCareShift = 'morning' | 'day' | 'evening' | 'night' | 'full_day';

export interface DailyCareLogVitalsRow {
  id: string;
  timeLabel: string;
  bloodSugar?: string;
  bp?: string;
  pulse?: string;
  spo2?: string;
  physiotherapy?: string;
  exercise?: string;
  remarks?: string;
}

export interface DailyCareLogMedication {
  id: string;
  label: string;
  slot: 'morning' | 'lunch' | 'evening' | 'night' | 'sos';
  given: boolean;
  notes?: string;
}

export interface DailyCareLog {
  id: string;
  date: string; // YYYY-MM-DD
  shift: DailyCareShift;
  patientUid?: string | null;
  patientName?: string | null;
  recordedByName?: string | null;
  recordedByRole: 'nurse' | 'medical_assistant' | 'caregiver' | 'doctor' | 'unknown';
  meals: {
    breakfast?: string;
    lunch?: string;
    eveningSnack?: string;
    dinner?: string;
    feedNotes?: string;
  };
  monitoringRows: DailyCareLogVitalsRow[];
  medications: DailyCareLogMedication[];
  stoolPassed: boolean | null;
  urineMorningMl?: string;
  urineEveningMl?: string;
  waterIntakeMl?: string;
  catheterChanged: boolean | null;
  sleep: 'good' | 'average' | 'poor' | 'not_recorded';
  generalRemarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentRecord {
  id: string;
  date: string; // ISO string
  department: string;
  doctor: string;
  notes?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface ModuleSectionProgress {
  moduleId: string;
  completedSections: string[]; // Array/Set of section IDs e.g. ['item-1', 'item-2']
  lastAccessedAt: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  relation: string;
  phone: string;
  isPrimary: boolean;
  notifyOnCrisis: boolean;
}

export interface MedicationItem {
  id: string;
  name: string;
  genericName?: string;
  dosage: string;
  frequency: string; // e.g. "Once daily", "Twice daily"
  timeOfDay: ('morning' | 'afternoon' | 'evening' | 'bedtime' | 'sos')[];
  foodRelation: 'before' | 'after' | 'with' | 'any';
  indication?: string;
  startDate?: string;
  duration?: string;
  renalFunctionEgfr?: string;
  riskHistory?: string[];
  instructions?: string;
  prescribedBy?: string;
  beersWarning?: string;
  takenToday?: boolean;
  takenSlots?: ('morning' | 'afternoon' | 'evening' | 'bedtime' | 'sos')[];
  lastTakenDate?: string;
}

export interface CareCircleMember {
  id: string;
  name: string;
  role: 'Primary Caregiver' | 'Family Member' | 'Home Nurse' | 'Visiting Doctor';
  phone: string;
  isSelf: boolean;
  avatarColor: string;
}

export interface CareCircleTask {
  id: string;
  title: string;
  assignedToName: string;
  category: 'meds' | 'physio' | 'hygiene' | 'appointment' | 'general';
  time: string;
  isCompleted: boolean;
  dueDate: string;
}

export interface UserConsentPreferences {
  hasConsented: boolean;
  vitalsTrackingConsent: boolean;
  psychometricConsent: boolean;
  consentTimestamp: string;
  dpdpNoticeVersion: string;
}

const STORAGE_KEYS = {
  CONSENT: 'sanjeevani_dpdp_consent',
  VITALS: 'sanjeevani_vitals_vault',
  DAILY_CARE_LOGS: 'sanjeevani_daily_care_logs_vault',
  APPOINTMENTS: 'sanjeevani_appointments_vault',
  ZARIT: 'sanjeevani_zarit_vault',
  FUNCTION_SCORES: 'sanjeevani_function_scores_vault',
  MODULE_PROGRESS: 'sanjeevani_module_sections_vault',
  USER_PROFILE: 'sanjeevani_user_profile',
  EMERGENCY_CONTACTS: 'sanjeevani_emergency_contacts',
  MEDICATIONS: 'sanjeevani_medications_vault',
  CARE_CIRCLE_MEMBERS: 'sanjeevani_circle_members',
  CARE_CIRCLE_TASKS: 'sanjeevani_circle_tasks',
  CAREGIVER_ATTRIBUTES: 'sanjeevani_caregiver_attributes',
  PATIENT_PROFILE: 'sanjeevani_patient_dependence_profile',
  CARE_GAP_EVALUATION: 'sanjeevani_care_gap_evaluation',
  CLINICIAN_PATIENTS: 'sanjeevani_clinician_patients',
  DYAD_INVITES: 'sanjeevani_dyad_invites'
};

export interface RegisteredPatientRecord {
  patientUid: string;
  inviteCode: string;
  patientName: string;
  patientAge: number;
  primaryConditions: string[];
  caregiverName?: string | null;
  caregiverPhone?: string | null;
  weightKg?: number | null;
  heightCm?: number | null;
  patientProfile?: PatientDependenceProfile;
  caregiverAttributes?: CaregiverAttributes;
  createdAt: string;
}

const DEFAULT_CONSENT: UserConsentPreferences = {
  hasConsented: false,
  vitalsTrackingConsent: false,
  psychometricConsent: false,
  consentTimestamp: '',
  dpdpNoticeVersion: '2026.1'
};

const DEFAULT_EMERGENCY_CONTACTS: EmergencyContact[] = [
  {
    id: 'contact_1',
    name: 'Family Doctor (Dr. Arvind Sharma)',
    relation: 'Primary Physician',
    phone: '9820012345',
    isPrimary: true,
    notifyOnCrisis: true
  },
  {
    id: 'contact_2',
    name: 'Son / Secondary Caregiver (Rajesh)',
    relation: 'Family',
    phone: '9819098765',
    isPrimary: false,
    notifyOnCrisis: true
  }
];

const DEFAULT_MEDICATIONS: MedicationItem[] = [
  {
    id: 'med_1',
    name: 'Telmisartan 40mg',
    genericName: 'Telmisartan (ARB)',
    dosage: '40 mg',
    frequency: 'Once Daily',
    timeOfDay: ['morning'],
    foodRelation: 'after',
    instructions: 'Monitor standing BP regularly. Avoid sudden rising.',
    prescribedBy: 'Dr. Arvind Sharma',
    takenToday: false
  },
  {
    id: 'med_2',
    name: 'Metformin 500mg',
    genericName: 'Metformin Hydrochloride',
    dosage: '500 mg',
    frequency: 'Twice Daily',
    timeOfDay: ['morning', 'evening'],
    foodRelation: 'with',
    instructions: 'Take with main meals to minimize gastric discomfort.',
    prescribedBy: 'Dr. Arvind Sharma',
    takenToday: false
  },
  {
    id: 'med_3',
    name: 'Pantoprazole 40mg',
    genericName: 'Pantoprazole (PPI)',
    dosage: '40 mg',
    frequency: 'Once Daily',
    timeOfDay: ['morning'],
    foodRelation: 'before',
    instructions: 'Take 30 mins before morning tea/breakfast.',
    prescribedBy: 'Dr. Arvind Sharma',
    takenToday: false
  }
];

const DEFAULT_CIRCLE_MEMBERS: CareCircleMember[] = [
  {
    id: 'mem_1',
    name: 'Suresh Kumar (You)',
    role: 'Primary Caregiver',
    phone: '9821011223',
    isSelf: true,
    avatarColor: 'bg-emerald-600'
  },
  {
    id: 'mem_2',
    name: 'Rajesh Kumar',
    role: 'Family Member',
    phone: '9819098765',
    isSelf: false,
    avatarColor: 'bg-blue-600'
  },
  {
    id: 'mem_3',
    name: 'Sister Sunita',
    role: 'Home Nurse',
    phone: '9833044556',
    isSelf: false,
    avatarColor: 'bg-purple-600'
  }
];

const DEFAULT_CIRCLE_TASKS: CareCircleTask[] = [
  {
    id: 'task_1',
    title: 'Morning Blood Pressure & Pulse Check',
    assignedToName: 'Suresh Kumar (You)',
    category: 'meds',
    time: '08:00 AM',
    isCompleted: false,
    dueDate: new Date().toISOString().slice(0, 10)
  },
  {
    id: 'task_2',
    title: 'Post-Breakfast Knee & Ankle Physio Exercises',
    assignedToName: 'Sister Sunita',
    category: 'physio',
    time: '10:30 AM',
    isCompleted: false,
    dueDate: new Date().toISOString().slice(0, 10)
  },
  {
    id: 'task_3',
    title: 'Buy Monthly Insulin & Telmisartan Refills',
    assignedToName: 'Rajesh Kumar',
    category: 'meds',
    time: '05:00 PM',
    isCompleted: false,
    dueDate: new Date().toISOString().slice(0, 10)
  }
];

export class HealthRepository {
  // --- 1. Consent Management (DPDP Act 2023) ---

  static getConsent(): UserConsentPreferences {
    if (typeof window === 'undefined') return DEFAULT_CONSENT;
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CONSENT);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.error('Error reading consent from storage:', e);
    }
    return DEFAULT_CONSENT;
  }

  static saveConsent(consent: Partial<UserConsentPreferences>): UserConsentPreferences {
    if (typeof window === 'undefined') return DEFAULT_CONSENT;
    const current = this.getConsent();
    const updated: UserConsentPreferences = {
      ...current,
      ...consent,
      consentTimestamp: new Date().toISOString(),
      dpdpNoticeVersion: '2026.1'
    };
    try {
      localStorage.setItem(STORAGE_KEYS.CONSENT, JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving consent to storage:', e);
    }
    return updated;
  }

  // --- 2. Vitals Management ---

  static getVitals(): VitalRecord[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.VITALS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        }
      }
    } catch (e) {
      console.error('Error reading vitals:', e);
    }
    return [];
  }

  static addVital(vital: Omit<VitalRecord, 'id' | 'createdAt'>): VitalRecord {
    const computedBp =
      vital.bp ||
      (vital.systolic && vital.diastolic
        ? `${vital.systolic}/${vital.diastolic}`
        : vital.systolic || undefined);

    const newRecord: VitalRecord = {
      ...vital,
      bp: computedBp,
      id: `vital_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      createdAt: new Date().toISOString()
    };
    const current = this.getVitals();
    const updated = [newRecord, ...current].slice(0, 100);
    try {
      localStorage.setItem(STORAGE_KEYS.VITALS, JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving vital:', e);
    }
    return newRecord;
  }

  static deleteVital(id: string): void {
    const current = this.getVitals();
    const filtered = current.filter((v) => v.id !== id);
    try {
      localStorage.setItem(STORAGE_KEYS.VITALS, JSON.stringify(filtered));
    } catch (e) {
      console.error('Error deleting vital:', e);
    }
  }

  // Vitals are an immutable clinical audit trail once synced to Firestore
  // (firestore.rules explicitly forbids update/delete on the vitals
  // subcollection — a doctor's view of the trend must not lose an entry the
  // caregiver regrets). deleteVital above only removes this device's local
  // cache copy; if the record already reached the cloud, a merge with
  // getVitalsFor would otherwise resurrect it right back into view on the
  // next load. This per-device "dismiss" list lets the caregiver hide an
  // entry from their own history without erasing the clinical record.
  static getDismissedVitalIds(): string[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem('sanjeevani_dismissed_vital_ids');
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('Error reading dismissed vital ids:', e);
      return [];
    }
  }

  static dismissVital(id: string): void {
    if (typeof window === 'undefined') return;
    const ids = new Set(this.getDismissedVitalIds());
    ids.add(id);
    try {
      localStorage.setItem('sanjeevani_dismissed_vital_ids', JSON.stringify(Array.from(ids)));
    } catch (e) {
      console.error('Error dismissing vital:', e);
    }
  }

  static undismissVital(id: string): void {
    if (typeof window === 'undefined') return;
    const ids = new Set(this.getDismissedVitalIds());
    ids.delete(id);
    try {
      localStorage.setItem('sanjeevani_dismissed_vital_ids', JSON.stringify(Array.from(ids)));
    } catch (e) {
      console.error('Error un-dismissing vital:', e);
    }
  }

  // --- 2a. Vitals recorded on a patient's behalf (clinician/nurse "for" a
  // dyad, keyed separately from this device's own vitals above so a granted
  // clinician's local durability doesn't collide with their own account). ---

  static getVitalsFor(patientUid: string): VitalRecord[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(`${STORAGE_KEYS.VITALS}_${patientUid}`);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (e) {
      console.error(`Error reading vitals for ${patientUid}:`, e);
      return [];
    }
  }

  static saveVitalFor(patientUid: string, vital: VitalRecord): VitalRecord[] {
    if (typeof window === 'undefined') return [];
    const current = this.getVitalsFor(patientUid);
    if (current.some((v) => v.id === vital.id)) return current;
    const updated = [vital, ...current].slice(0, 200);
    try {
      localStorage.setItem(`${STORAGE_KEYS.VITALS}_${patientUid}`, JSON.stringify(updated));
    } catch (e) {
      console.error(`Error saving vital for ${patientUid}:`, e);
    }
    return updated;
  }

  /** Merges a signed-in user's cloud vitals into THIS device's own vitals
   * cache (the plain, non-"For" list most pages read via getVitals()) — so
   * a reading entered on another device shows up here too, not just in the
   * clinician "for" cache. Cloud wins on id collision (Firestore is
   * authoritative once signed in). */
  static mergeVitals(cloudVitals: VitalRecord[]): VitalRecord[] {
    if (typeof window === 'undefined') return [];
    const local = this.getVitals();
    const map = new Map<string, VitalRecord>();
    for (const v of local) map.set(v.id, v);
    for (const v of cloudVitals) map.set(v.id, v);
    const merged = Array.from(map.values())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 200);
    try {
      localStorage.setItem(STORAGE_KEYS.VITALS, JSON.stringify(merged));
    } catch (e) {
      console.error('Error merging cloud vitals:', e);
    }
    return merged;
  }

  // --- 2b. Daily Bedside Care Logs ---

  static getDailyCareLogs(): DailyCareLog[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.DAILY_CARE_LOGS);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return this.normalizeDailyCareLogs(parsed);
    } catch (e) {
      console.error('Error reading daily care logs:', e);
      return [];
    }
  }

  static saveDailyCareLog(log: DailyCareLog): DailyCareLog[] {
    if (typeof window === 'undefined') return [];
    const current = this.getDailyCareLogs();
    const updatedLog = {
      ...log,
      updatedAt: new Date().toISOString()
    };
    const updated = [
      updatedLog,
      ...current.filter((item) => item.id !== updatedLog.id)
    ].slice(0, 365);
    try {
      localStorage.setItem(STORAGE_KEYS.DAILY_CARE_LOGS, JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving daily care log:', e);
    }
    return updated;
  }

  static getDailyCareLogsFor(patientUid: string): DailyCareLog[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(`${STORAGE_KEYS.DAILY_CARE_LOGS}_${patientUid}`);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return this.normalizeDailyCareLogs(parsed);
    } catch (e) {
      console.error(`Error reading daily care logs for ${patientUid}:`, e);
      return [];
    }
  }

  static saveDailyCareLogFor(patientUid: string, log: DailyCareLog): DailyCareLog[] {
    if (typeof window === 'undefined') return [];
    const current = this.getDailyCareLogsFor(patientUid);
    const updatedLog = {
      ...log,
      patientUid,
      updatedAt: new Date().toISOString()
    };
    const updated = [
      updatedLog,
      ...current.filter((item) => item.id !== updatedLog.id)
    ].slice(0, 365);
    try {
      localStorage.setItem(`${STORAGE_KEYS.DAILY_CARE_LOGS}_${patientUid}`, JSON.stringify(updated));
    } catch (e) {
      console.error(`Error saving daily care log for ${patientUid}:`, e);
    }
    return updated;
  }

  private static normalizeDailyCareLogs(items: unknown[]): DailyCareLog[] {
    return items
      .filter((item) => item && typeof item === 'object')
      .map((item) => {
        const raw = item as Record<string, any>;
        return {
          id: String(raw.id || `daily_${raw.date || new Date().toISOString().slice(0, 10)}_${raw.shift || 'full_day'}`),
          date: String(raw.date || new Date().toISOString().slice(0, 10)),
          shift: raw.shift || 'full_day',
          patientUid: raw.patientUid ?? null,
          patientName: raw.patientName ?? null,
          recordedByName: raw.recordedByName ?? null,
          recordedByRole: raw.recordedByRole || 'unknown',
          meals: raw.meals && typeof raw.meals === 'object' ? raw.meals : {},
          monitoringRows: Array.isArray(raw.monitoringRows) ? raw.monitoringRows : [],
          medications: Array.isArray(raw.medications) ? raw.medications : [],
          stoolPassed: typeof raw.stoolPassed === 'boolean' ? raw.stoolPassed : null,
          urineMorningMl: raw.urineMorningMl || undefined,
          urineEveningMl: raw.urineEveningMl || undefined,
          waterIntakeMl: raw.waterIntakeMl || undefined,
          catheterChanged: typeof raw.catheterChanged === 'boolean' ? raw.catheterChanged : null,
          sleep: raw.sleep || 'not_recorded',
          generalRemarks: raw.generalRemarks || undefined,
          createdAt: raw.createdAt || new Date().toISOString(),
          updatedAt: raw.updatedAt || raw.createdAt || new Date().toISOString()
        } as DailyCareLog;
      })
      .sort((a, b) => {
        const dateDelta = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (dateDelta !== 0) return dateDelta;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }

  // --- 3. Appointments Management ---

  static getAppointments(): AppointmentRecord[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        }
      }
    } catch (e) {
      console.error('Error reading appointments:', e);
    }
    return [];
  }

  static addAppointment(apt: Omit<AppointmentRecord, 'id' | 'createdAt' | 'status'>): AppointmentRecord {
    const newRecord: AppointmentRecord = {
      ...apt,
      id: `apt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      status: 'scheduled',
      createdAt: new Date().toISOString()
    };
    const current = this.getAppointments();
    const updated = [...current, newRecord].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    try {
      localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving appointment:', e);
    }
    return newRecord;
  }

  static deleteAppointment(id: string): void {
    const current = this.getAppointments();
    const filtered = current.filter((a) => a.id !== id);
    try {
      localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(filtered));
    } catch (e) {
      console.error('Error deleting appointment:', e);
    }
  }

  // --- 4. Module Progress (Section-Set Model) ---

  static getModuleProgressMap(): Record<string, ModuleSectionProgress> {
    if (typeof window === 'undefined') return {};
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.MODULE_PROGRESS);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.error('Error reading module progress map:', e);
    }
    return {};
  }

  static getCompletedSections(moduleId: string): string[] {
    const map = this.getModuleProgressMap();
    return map[moduleId]?.completedSections || [];
  }

  static toggleSectionCompletion(moduleId: string, sectionId: string): string[] {
    const map = this.getModuleProgressMap();
    const currentSections = map[moduleId]?.completedSections || [];
    const sectionSet = new Set(currentSections);

    if (sectionSet.has(sectionId)) {
      sectionSet.delete(sectionId);
    } else {
      sectionSet.add(sectionId);
    }

    const updatedSections = Array.from(sectionSet);
    map[moduleId] = {
      moduleId,
      completedSections: updatedSections,
      lastAccessedAt: new Date().toISOString()
    };

    try {
      localStorage.setItem(STORAGE_KEYS.MODULE_PROGRESS, JSON.stringify(map));
    } catch (e) {
      console.error('Error saving section progress:', e);
    }

    return updatedSections;
  }

  // --- 5. Zarit Assessments History ---

  static getZaritAssessments(): ZaritEvaluationResult[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ZARIT);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed
            .map((item) => {
              if (!item || typeof item !== 'object') return null;
              const classification =
                typeof item.classification === 'object' && item.classification !== null
                  ? {
                      en: item.classification.en || 'Standard Assessment',
                      hi: item.classification.hi || item.classification.en || 'मानक मूल्यांकन',
                      mr: item.classification.mr || item.classification.en || 'मानक मूल्यांकन'
                    }
                  : {
                      en: String(item.classification || 'Standard Assessment'),
                      hi: String(item.classification || 'मानक मूल्यांकन'),
                      mr: String(item.classification || 'मानक मूल्यांकन')
                    };

              return {
                ...item,
                tier: item.tier || 'ZBI22',
                totalScore: Number(item.totalScore ?? 0),
                maxScore: Number(item.maxScore ?? 88),
                normalizedPercentage: Number(item.normalizedPercentage ?? 0),
                severityBand: item.severityBand || 'normal',
                classification,
                domainCapacities: item.domainCapacities || {
                  psychosocial: null,
                  resource: null,
                  physical: null,
                  safety: null,
                  cognitive_behavioral: null,
                  medical: null
                },
                factors: item.factors || {},
                redFlags: Array.isArray(item.redFlags) ? item.redFlags : [],
                isCrisisTriggered: Boolean(item.isCrisisTriggered),
                prescriptions: Array.isArray(item.prescriptions) ? item.prescriptions : [],
                completedAt: item.completedAt || new Date().toISOString()
              } as ZaritEvaluationResult;
            })
            .filter((item): item is ZaritEvaluationResult => item !== null)
            .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
        }
      }
    } catch (e) {
      console.error('Error reading Zarit history:', e);
    }
    return [];
  }

  private static normalizeZaritAssessment(item: unknown): ZaritEvaluationResult | null {
    if (!item || typeof item !== 'object') return null;
    const raw = item as Record<string, any>;
    const classification =
      typeof raw.classification === 'object' && raw.classification !== null
        ? {
            en: raw.classification.en || 'Standard Assessment',
            hi: raw.classification.hi || raw.classification.en || 'मानक मूल्यांकन',
            mr: raw.classification.mr || raw.classification.en || 'मानक मूल्यांकन'
          }
        : {
            en: String(raw.classification || 'Standard Assessment'),
            hi: String(raw.classification || 'मानक मूल्यांकन'),
            mr: String(raw.classification || 'मानक मूल्यांकन')
          };

    return {
      ...raw,
      tier: raw.tier || 'ZBI22',
      totalScore: Number(raw.totalScore ?? 0),
      maxScore: Number(raw.maxScore ?? 88),
      normalizedPercentage: Number(raw.normalizedPercentage ?? 0),
      severityBand: raw.severityBand || 'normal',
      classification,
      domainCapacities: raw.domainCapacities || {
        psychosocial: null,
        resource: null,
        physical: null,
        safety: null,
        cognitive_behavioral: null,
        medical: null
      },
      factors: raw.factors || {},
      redFlags: Array.isArray(raw.redFlags) ? raw.redFlags : [],
      isCrisisTriggered: Boolean(raw.isCrisisTriggered),
      prescriptions: Array.isArray(raw.prescriptions) ? raw.prescriptions : [],
      completedAt: raw.completedAt || new Date().toISOString()
    } as ZaritEvaluationResult;
  }

  static saveZaritAssessment(result: ZaritEvaluationResult): ZaritEvaluationResult[] {
    const current = this.getZaritAssessments();

    // A double-click (or a retry after a slow render) on the finish button
    // saves the identical result twice. Two points at the same timestamp
    // don't just duplicate a row — they inflate `n` toward the reliability
    // floor and push the OLS fit toward the sxx=0 degenerate case, so guard
    // against near-simultaneous saves of the same completion.
    const DUPLICATE_WINDOW_MS = 5000;
    const isDuplicate = current.some(
      (prev) =>
        prev.tier === result.tier &&
        prev.totalScore === result.totalScore &&
        Math.abs(new Date(prev.completedAt).getTime() - new Date(result.completedAt).getTime()) <
          DUPLICATE_WINDOW_MS
    );
    if (isDuplicate) return current;

    // At the recommended cadence (isReassessmentDue in zarit-scale.ts: ~21
    // days for ZBI-4, quarterly for ZBI-22/12), 30 records is under 2.5 years
    // of history for what is often a multi-year caregiving journey — and the
    // Firestore mirror (clinical-sync.ts) keeps every record uncapped, so a
    // long-running local device and the cloud copy silently diverge in
    // length. 180 covers a decade of quarterly assessments (or several years
    // of mixed-cadence use) while still bounding local storage.
    const MAX_LOCAL_ZARIT_HISTORY = 180;
    const updated = [result, ...current].slice(0, MAX_LOCAL_ZARIT_HISTORY);
    try {
      localStorage.setItem(STORAGE_KEYS.ZARIT, JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving Zarit assessment:', e);
    }
    return updated;
  }

  static getZaritAssessmentsFor(patientUid: string): ZaritEvaluationResult[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(`${STORAGE_KEYS.ZARIT}_${patientUid}`);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .map((item) => this.normalizeZaritAssessment(item))
        .filter((item): item is ZaritEvaluationResult => item !== null)
        .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
    } catch (e) {
      console.error(`Error reading Zarit history for ${patientUid}:`, e);
      return [];
    }
  }

  static saveZaritAssessmentFor(patientUid: string, result: ZaritEvaluationResult): ZaritEvaluationResult[] {
    if (typeof window === 'undefined') return [];
    const current = this.getZaritAssessmentsFor(patientUid);
    const DUPLICATE_WINDOW_MS = 5000;
    const isDuplicate = current.some(
      (prev) =>
        prev.tier === result.tier &&
        prev.totalScore === result.totalScore &&
        Math.abs(new Date(prev.completedAt).getTime() - new Date(result.completedAt).getTime()) <
          DUPLICATE_WINDOW_MS
    );
    if (isDuplicate) return current;

    const updated = [result, ...current].slice(0, 180);
    try {
      localStorage.setItem(`${STORAGE_KEYS.ZARIT}_${patientUid}`, JSON.stringify(updated));
    } catch (e) {
      console.error(`Error saving Zarit assessment for ${patientUid}:`, e);
    }
    return updated;
  }

  static getFunctionScoresFor(patientUid: string): FunctionEvaluationResult[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(`${STORAGE_KEYS.FUNCTION_SCORES}_${patientUid}`);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter((item) => item && typeof item === 'object')
        .map((item) => ({
          ...item,
          barthelScore: Number(item.barthelScore ?? 0),
          barthelMax: Number(item.barthelMax ?? 100),
          lawtonScore: Number(item.lawtonScore ?? 0),
          lawtonMax: Number(item.lawtonMax ?? 8),
          dependencyPercentage: Number(item.dependencyPercentage ?? 100),
          recordedAt: item.recordedAt || new Date().toISOString()
        }) as FunctionEvaluationResult)
        .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
    } catch (e) {
      console.error(`Error reading function scores for ${patientUid}:`, e);
      return [];
    }
  }

  static saveFunctionScoreFor(patientUid: string, result: FunctionEvaluationResult): FunctionEvaluationResult[] {
    if (typeof window === 'undefined') return [];
    const current = this.getFunctionScoresFor(patientUid);
    const DUPLICATE_WINDOW_MS = 5000;
    const isDuplicate = current.some(
      (prev) =>
        prev.barthelScore === result.barthelScore &&
        prev.lawtonScore === result.lawtonScore &&
        Math.abs(new Date(prev.recordedAt).getTime() - new Date(result.recordedAt).getTime()) <
          DUPLICATE_WINDOW_MS
    );
    if (isDuplicate) return current;

    const updated = [result, ...current].slice(0, 180);
    try {
      localStorage.setItem(`${STORAGE_KEYS.FUNCTION_SCORES}_${patientUid}`, JSON.stringify(updated));
    } catch (e) {
      console.error(`Error saving function score for ${patientUid}:`, e);
    }
    return updated;
  }

  // --- 6. Emergency Contacts ---

  static getEmergencyContacts(): EmergencyContact[] {
    if (typeof window === 'undefined') return DEFAULT_EMERGENCY_CONTACTS;
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.EMERGENCY_CONTACTS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error reading emergency contacts:', e);
    }
    return DEFAULT_EMERGENCY_CONTACTS;
  }

  static saveEmergencyContacts(contacts: EmergencyContact[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.EMERGENCY_CONTACTS, JSON.stringify(contacts));
    } catch (e) {
      console.error('Error saving emergency contacts:', e);
    }
  }

  // --- 7. Medications Regimen ---

  static getMedications(): MedicationItem[] {
    const todayStr = new Date().toISOString().slice(0, 10);
    let meds: MedicationItem[] = DEFAULT_MEDICATIONS;

    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.MEDICATIONS);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) meds = parsed;
        }
      } catch (e) {
        console.error('Error reading medications:', e);
      }
    }

    // Daily reset check: If lastTakenDate is from a previous calendar day, reset today's taken slots
    return meds.map((m) => {
      const isSameDay = m.lastTakenDate && m.lastTakenDate.slice(0, 10) === todayStr;
      const takenSlots = isSameDay ? (m.takenSlots || (m.takenToday ? m.timeOfDay : [])) : [];
      const takenToday = takenSlots.length > 0 && m.timeOfDay.every((s) => takenSlots.includes(s));
      return {
        ...m,
        takenSlots,
        takenToday
      };
    });
  }

  static saveMedications(meds: MedicationItem[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.MEDICATIONS, JSON.stringify(meds));
    } catch (e) {
      console.error('Error saving medications:', e);
    }
  }

  /** A clinician's own local durability cache for a patient's regimen, so a
   * Firestore write failure doesn't lose the edit entirely (see saveMedicationsFor
   * in clinical-sync.ts, which previously had no local fallback at all). */
  static getMedicationsFor(patientUid: string): MedicationItem[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(`${STORAGE_KEYS.MEDICATIONS}_${patientUid}`);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error(`Error reading medications for ${patientUid}:`, e);
      return [];
    }
  }

  static saveMedicationsFor(patientUid: string, meds: MedicationItem[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(`${STORAGE_KEYS.MEDICATIONS}_${patientUid}`, JSON.stringify(meds));
    } catch (e) {
      console.error(`Error saving medications for ${patientUid}:`, e);
    }
  }

  static toggleMedicationTaken(
    medId: string,
    slot?: 'morning' | 'afternoon' | 'evening' | 'bedtime' | 'sos'
  ): MedicationItem[] {
    const meds = this.getMedications();
    const todayStr = new Date().toISOString();

    const updated = meds.map((m) => {
      if (m.id === medId) {
        let currentSlots = [...(m.takenSlots || [])];
        if (slot) {
          if (currentSlots.includes(slot)) {
            currentSlots = currentSlots.filter((s) => s !== slot);
          } else {
            currentSlots.push(slot);
          }
        } else {
          // Toggle all slots for this medicine
          const allCompleted = m.timeOfDay.every((s) => currentSlots.includes(s));
          currentSlots = allCompleted ? [] : [...m.timeOfDay];
        }

        const isFullyTaken = m.timeOfDay.length > 0 && m.timeOfDay.every((s) => currentSlots.includes(s));
        return {
          ...m,
          takenSlots: currentSlots,
          takenToday: isFullyTaken,
          lastTakenDate: todayStr
        };
      }
      return m;
    });

    this.saveMedications(updated);
    return updated;
  }

  // --- 7b. Nursing Procedures Checklist (per patient, per calendar date) ---
  // Previously the nurse-shift dashboard's checklist was plain React state
  // with no persistence at all — a page refresh silently discarded the
  // shift's completed-procedure record. Keyed by date so it naturally
  // resets each day, same convention as the daily reset in getMedications.

  static getNursingProceduresFor(patientUid: string, date: string): Record<string, boolean> {
    if (typeof window === 'undefined') return {};
    try {
      const raw = localStorage.getItem(`sanjeevani_nursing_procedures_${patientUid}_${date}`);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (e) {
      console.error(`Error reading nursing procedures for ${patientUid}/${date}:`, e);
      return {};
    }
  }

  static saveNursingProceduresFor(patientUid: string, date: string, procedures: Record<string, boolean>): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(`sanjeevani_nursing_procedures_${patientUid}_${date}`, JSON.stringify(procedures));
    } catch (e) {
      console.error(`Error saving nursing procedures for ${patientUid}/${date}:`, e);
    }
  }

  // --- 8. Care Circle Members & Tasks ---

  static getCareCircleMembers(): CareCircleMember[] {
    if (typeof window === 'undefined') return DEFAULT_CIRCLE_MEMBERS;
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CARE_CIRCLE_MEMBERS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error reading circle members:', e);
    }
    return DEFAULT_CIRCLE_MEMBERS;
  }

  static saveCareCircleMembers(members: CareCircleMember[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.CARE_CIRCLE_MEMBERS, JSON.stringify(members));
    } catch (e) {
      console.error('Error saving circle members:', e);
    }
  }

  static getCareCircleTasks(): CareCircleTask[] {
    if (typeof window === 'undefined') return DEFAULT_CIRCLE_TASKS;
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CARE_CIRCLE_TASKS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error reading circle tasks:', e);
    }
    return DEFAULT_CIRCLE_TASKS;
  }

  static saveCareCircleTasks(tasks: CareCircleTask[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.CARE_CIRCLE_TASKS, JSON.stringify(tasks));
    } catch (e) {
      console.error('Error saving circle tasks:', e);
    }
  }

  static toggleCareCircleTask(taskId: string): CareCircleTask[] {
    const tasks = this.getCareCircleTasks();
    const updated = tasks.map((t) => (t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t));
    this.saveCareCircleTasks(updated);
    return updated;
  }

  // --- 9. Caregiver Dyad Profiling & Care Gap Estimation ---

  static getCaregiverAttributes(): CaregiverAttributes {
    if (typeof window === 'undefined') return DEFAULT_CAREGIVER_ATTRIBUTES;
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CAREGIVER_ATTRIBUTES);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          return {
            ...DEFAULT_CAREGIVER_ATTRIBUTES,
            ...parsed,
            caregiverHealth: { ...DEFAULT_CAREGIVER_ATTRIBUTES.caregiverHealth, ...(parsed.caregiverHealth || {}) },
            formalSupport: { ...DEFAULT_CAREGIVER_ATTRIBUTES.formalSupport, ...(parsed.formalSupport || {}) }
          };
        }
      }
    } catch (e) {
      console.error('Error reading caregiver attributes:', e);
    }
    return DEFAULT_CAREGIVER_ATTRIBUTES;
  }

  static hasStoredCaregiverAttributes(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      return Boolean(localStorage.getItem(STORAGE_KEYS.CAREGIVER_ATTRIBUTES));
    } catch {
      return false;
    }
  }

  static saveCaregiverAttributes(attrs: CaregiverAttributes): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.CAREGIVER_ATTRIBUTES, JSON.stringify(attrs));
    } catch (e) {
      console.error('Error saving caregiver attributes:', e);
    }
  }

  static getPatientProfile(): PatientDependenceProfile {
    if (typeof window === 'undefined') return DEFAULT_PATIENT_PROFILE;
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.PATIENT_PROFILE);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          const rawIadl = parsed.lawtonIadl || {};
          const migratedIadl: LawtonIadlProfile = {
            telephone: typeof rawIadl.telephone === 'boolean' ? rawIadl.telephone : true,
            shopping: typeof rawIadl.shopping === 'boolean' ? rawIadl.shopping : true,
            mealPreparation: typeof rawIadl.mealPreparation === 'boolean' ? rawIadl.mealPreparation : true,
            housekeeping: typeof rawIadl.housekeeping === 'boolean' ? rawIadl.housekeeping : true,
            laundry: typeof rawIadl.laundry === 'boolean' ? rawIadl.laundry : true,
            transportation: typeof rawIadl.transportation === 'boolean' ? rawIadl.transportation : true,
            medicationManagement: typeof rawIadl.medicationManagement === 'boolean' ? rawIadl.medicationManagement : true,
            finances: typeof rawIadl.finances === 'boolean' ? rawIadl.finances : true
          };
          return {
            ...DEFAULT_PATIENT_PROFILE,
            ...parsed,
            homeCareAddress:
              typeof parsed.homeCareAddress === 'string'
                ? parsed.homeCareAddress
                : DEFAULT_PATIENT_PROFILE.homeCareAddress,
            katzAdl: { ...DEFAULT_PATIENT_PROFILE.katzAdl, ...(parsed.katzAdl || {}) },
            lawtonIadl: migratedIadl
          };
        }
      }
    } catch (e) {
      console.error('Error reading patient profile:', e);
    }
    return DEFAULT_PATIENT_PROFILE;
  }

  static hasStoredPatientProfile(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      return Boolean(localStorage.getItem(STORAGE_KEYS.PATIENT_PROFILE));
    } catch {
      return false;
    }
  }

  static hasStoredDyadProfile(): boolean {
    return this.hasStoredCaregiverAttributes() && this.hasStoredPatientProfile();
  }

  static savePatientProfile(prof: PatientDependenceProfile): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.PATIENT_PROFILE, JSON.stringify(prof));
    } catch (e) {
      console.error('Error saving patient profile:', e);
    }
  }

  static getCareGapEvaluation(): CareGapEvaluationResult {
    const caregiver = this.getCaregiverAttributes();
    const patient = this.getPatientProfile();
    const result = CareGapEngine.evaluate(caregiver, patient);
    this.saveCareGapEvaluation(result);
    return result;
  }

  private static memoryEvaluationStore: CareGapEvaluationResult | null = null;

  static saveCareGapEvaluation(evaluation: CareGapEvaluationResult): void {
    this.memoryEvaluationStore = evaluation;
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.CARE_GAP_EVALUATION, JSON.stringify(evaluation));
    } catch (e) {
      console.error('Error saving care gap evaluation snapshot:', e);
    }
  }

  static getStoredCareGapEvaluation(): CareGapEvaluationResult | null {
    if (typeof window === 'undefined') return this.memoryEvaluationStore;
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CARE_GAP_EVALUATION);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Error reading stored care gap evaluation:', e);
    }
    return this.memoryEvaluationStore;
  }

  // --- 10. Data Portability & Right to Erasure (DPDP Act 2023) ---

  static exportAllUserData(): {
    exportedAt: string;
    schemaVersion: string;
    jurisdiction: string;
    consent: UserConsentPreferences;
    vitals: VitalRecord[];
    appointments: AppointmentRecord[];
    moduleProgress: Record<string, ModuleSectionProgress>;
    zaritAssessments: ZaritEvaluationResult[];
    emergencyContacts: EmergencyContact[];
    medications: MedicationItem[];
    dailyCareLogs: DailyCareLog[];
    caregiverAttributes: CaregiverAttributes;
    patientProfile: PatientDependenceProfile;
    careGapEvaluation: CareGapEvaluationResult | null;
    careCircle: {
      members: CareCircleMember[];
      tasks: CareCircleTask[];
    };
  } {
    return {
      exportedAt: new Date().toISOString(),
      schemaVersion: 'sanjeevani-dpdp-v2',
      jurisdiction: 'India (Digital Personal Data Protection Act 2023)',
      consent: this.getConsent(),
      vitals: this.getVitals(),
      appointments: this.getAppointments(),
      moduleProgress: this.getModuleProgressMap(),
      zaritAssessments: this.getZaritAssessments(),
      emergencyContacts: this.getEmergencyContacts(),
      medications: this.getMedications(),
      dailyCareLogs: this.getDailyCareLogs(),
      caregiverAttributes: this.getCaregiverAttributes(),
      patientProfile: this.getPatientProfile(),
      careGapEvaluation: this.hasStoredDyadProfile() ? this.getCareGapEvaluation() : null,
      careCircle: {
        members: this.getCareCircleMembers(),
        tasks: this.getCareCircleTasks()
      }
    };
  }

  // --- 10. Clinician Registered Patients & Dyad Invites ---

  static getRegisteredPatients(): RegisteredPatientRecord[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CLINICIAN_PATIENTS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Error reading clinician patients:', e);
    }
    return [];
  }

  static saveRegisteredPatient(patient: RegisteredPatientRecord): void {
    if (typeof window === 'undefined') return;
    try {
      const existing = this.getRegisteredPatients();
      const filtered = existing.filter((p) => p.patientUid !== patient.patientUid && p.inviteCode !== patient.inviteCode);
      const updated = [patient, ...filtered];
      localStorage.setItem(STORAGE_KEYS.CLINICIAN_PATIENTS, JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving clinician patient:', e);
    }
  }

  static getRegisteredPatient(patientUid: string): RegisteredPatientRecord | null {
    const list = this.getRegisteredPatients();
    return list.find((p) => p.patientUid === patientUid || p.inviteCode === patientUid.replace('dyad_', '')) || null;
  }

  static savePatientProfileFor(patientUid: string, profile: PatientDependenceProfile): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(`${STORAGE_KEYS.PATIENT_PROFILE}_${patientUid}`, JSON.stringify(profile));
      // Also update in registered patients list if found
      const patient = this.getRegisteredPatient(patientUid);
      if (patient) {
        this.saveRegisteredPatient({ ...patient, patientProfile: profile });
      }
    } catch (e) {
      console.error(`Error saving patient profile for ${patientUid}:`, e);
    }
  }

  static getPatientProfileFor(patientUid: string): PatientDependenceProfile | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(`${STORAGE_KEYS.PATIENT_PROFILE}_${patientUid}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          ...DEFAULT_PATIENT_PROFILE,
          ...parsed,
          katzAdl: { ...DEFAULT_PATIENT_PROFILE.katzAdl, ...(parsed.katzAdl || {}) },
          lawtonIadl: { ...DEFAULT_PATIENT_PROFILE.lawtonIadl, ...(parsed.lawtonIadl || {}) }
        };
      }
      const patient = this.getRegisteredPatient(patientUid);
      if (patient?.patientProfile) {
        return {
          ...DEFAULT_PATIENT_PROFILE,
          ...patient.patientProfile,
          katzAdl: { ...DEFAULT_PATIENT_PROFILE.katzAdl, ...(patient.patientProfile.katzAdl || {}) },
          lawtonIadl: { ...DEFAULT_PATIENT_PROFILE.lawtonIadl, ...(patient.patientProfile.lawtonIadl || {}) }
        };
      }
    } catch (e) {
      console.error(`Error reading patient profile for ${patientUid}:`, e);
    }
    return null;
  }

  static saveCaregiverAttributesFor(patientUid: string, attrs: CaregiverAttributes): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(`${STORAGE_KEYS.CAREGIVER_ATTRIBUTES}_${patientUid}`, JSON.stringify(attrs));
      const patient = this.getRegisteredPatient(patientUid);
      if (patient) {
        this.saveRegisteredPatient({ ...patient, caregiverAttributes: attrs });
      }
    } catch (e) {
      console.error(`Error saving caregiver attributes for ${patientUid}:`, e);
    }
  }

  static getCaregiverAttributesFor(patientUid: string): CaregiverAttributes | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(`${STORAGE_KEYS.CAREGIVER_ATTRIBUTES}_${patientUid}`);
      if (raw) return JSON.parse(raw);
      const patient = this.getRegisteredPatient(patientUid);
      if (patient?.caregiverAttributes) return patient.caregiverAttributes;
    } catch (e) {
      console.error(`Error reading caregiver attributes for ${patientUid}:`, e);
    }
    return null;
  }

  static getDyadInvites(): Array<{
    inviteCode: string;
    dyadUid?: string;
    clinicianUid: string;
    patientName: string;
    patientAge: number;
    primaryConditions: string[];
    caregiverName?: string | null;
    caregiverPhone?: string | null;
    createdAt: string;
    claimedAt: string | null;
    claimedByUid: string | null;
  }> {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.DYAD_INVITES);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Error reading dyad invites:', e);
    }
    return [];
  }

  static saveDyadInvite(invite: {
    inviteCode: string;
    dyadUid?: string;
    clinicianUid: string;
    patientName: string;
    patientAge: number;
    primaryConditions: string[];
    caregiverName?: string | null;
    caregiverPhone?: string | null;
    createdAt: string;
    claimedAt: string | null;
    claimedByUid: string | null;
  }): void {
    if (typeof window === 'undefined') return;
    try {
      const existing = this.getDyadInvites();
      const filtered = existing.filter((i) => i.inviteCode !== invite.inviteCode);
      const updated = [invite, ...filtered];
      localStorage.setItem(STORAGE_KEYS.DYAD_INVITES, JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving dyad invite:', e);
    }
  }

  static getDyadInvite(inviteCode: string) {
    const list = this.getDyadInvites();
    return list.find((i) => i.inviteCode.toUpperCase() === inviteCode.trim().toUpperCase()) || null;
  }

  static deleteAllUserData(): void {
    if (typeof window === 'undefined') return;
    try {
      Object.values(STORAGE_KEYS).forEach((key) => {
        localStorage.removeItem(key);
      });
      // Also remove dynamic per-patient keys.
      const dynamicKeysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (
          k &&
          (k.startsWith(STORAGE_KEYS.PATIENT_PROFILE) ||
            k.startsWith(STORAGE_KEYS.CAREGIVER_ATTRIBUTES) ||
            k.startsWith(STORAGE_KEYS.ZARIT) ||
            k.startsWith(STORAGE_KEYS.DAILY_CARE_LOGS) ||
            k.startsWith(STORAGE_KEYS.FUNCTION_SCORES))
        ) {
          dynamicKeysToRemove.push(k);
        }
      }
      dynamicKeysToRemove.forEach((key) => localStorage.removeItem(key));
    } catch (e) {
      console.error('Error purging user health data:', e);
    }
  }
}
