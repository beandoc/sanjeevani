/**
 * Sanjeevani Health & Clinical Repository
 * Offline-first, privacy-compliant data repository conforming to DPDP Act 2023.
 * Supports complete data portability (export) and Right to Erasure (instant purge).
 */

import { ZaritEvaluationResult } from '@/lib/zarit-scale';

export interface VitalRecord {
  id: string;
  date: string; // ISO string
  weight?: string;
  pulse?: string;
  bp?: string;
  bloodSugar?: string;
  sleep: 'good' | 'average' | 'poor';
  notes?: string;
  createdAt: string;
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
  APPOINTMENTS: 'sanjeevani_appointments_vault',
  ZARIT: 'sanjeevani_zarit_vault',
  MODULE_PROGRESS: 'sanjeevani_module_sections_vault',
  USER_PROFILE: 'sanjeevani_user_profile',
  EMERGENCY_CONTACTS: 'sanjeevani_emergency_contacts',
  MEDICATIONS: 'sanjeevani_medications_vault',
  CARE_CIRCLE_MEMBERS: 'sanjeevani_circle_members',
  CARE_CIRCLE_TASKS: 'sanjeevani_circle_tasks'
};

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
    const newRecord: VitalRecord = {
      ...vital,
      id: `vital_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
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
          return parsed.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
        }
      }
    } catch (e) {
      console.error('Error reading Zarit history:', e);
    }
    return [];
  }

  static saveZaritAssessment(result: ZaritEvaluationResult): ZaritEvaluationResult[] {
    const current = this.getZaritAssessments();
    const updated = [result, ...current].slice(0, 30);
    try {
      localStorage.setItem(STORAGE_KEYS.ZARIT, JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving Zarit assessment:', e);
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

  // --- 9. Data Portability & Right to Erasure (DPDP Act 2023) ---

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
      careCircle: {
        members: this.getCareCircleMembers(),
        tasks: this.getCareCircleTasks()
      }
    };
  }

  static deleteAllUserData(): void {
    if (typeof window === 'undefined') return;
    try {
      Object.values(STORAGE_KEYS).forEach((key) => {
        localStorage.removeItem(key);
      });
    } catch (e) {
      console.error('Error purging user health data:', e);
    }
  }
}
