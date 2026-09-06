/**
 * Seed data returned when a vault is empty — first-run defaults, not
 * user data.
 */

import type {
  UserConsentPreferences,
  EmergencyContact,
  MedicationItem,
  CareCircleMember,
  CareCircleTask
} from './types';
export const DEFAULT_CONSENT: UserConsentPreferences = {
  hasConsented: false,
  vitalsTrackingConsent: false,
  psychometricConsent: false,
  consentTimestamp: '',
  dpdpNoticeVersion: '2026.1'
};

export const DEFAULT_EMERGENCY_CONTACTS: EmergencyContact[] = [
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

export const DEFAULT_MEDICATIONS: MedicationItem[] = [
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

export const DEFAULT_CIRCLE_MEMBERS: CareCircleMember[] = [
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

export const DEFAULT_CIRCLE_TASKS: CareCircleTask[] = [
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
