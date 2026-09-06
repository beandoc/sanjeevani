'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Users2,
  HeartHandshake,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Briefcase,
  UserCheck,
  Edit3,
  Activity,
  Sparkles,
  Home,
  CheckCircle2,
  Plus,
  Trash2,
  Moon,
  Pill,
  Move,
  Flame,
  ArrowRight,
  Stethoscope,
  Car,
  Navigation,
  PhoneCall,
  Calendar,
  Wand2,
  Share2,
  Download,
  Printer,
  Bed,
  Wind,
  Accessibility,
  Copy,
  ExternalLink,
  Sun,
  Sunrise,
  Sunset
} from 'lucide-react';
import {
  CaregiverAttributes,
  PatientDependenceProfile,
  CareGapEngine,
  FormalSupportType,
  SecondaryFamilyMember,
  CareTask,
  EmergencyLogistics,
  MonthlyRotationPolicy,
  AssistiveDeviceInventory,
  DEFAULT_ASSISTIVE_DEVICES,
  DiurnalTimeBlock,
  DIURNAL_TIME_BLOCKS,
  generateWhatsAppCareDigest,
  generateCareRosterIcs
} from '@/lib/clinical/care-gap-engine';
import { ShiftAllocator, DIURNAL_BLOCK_META, type CareShiftRoster } from '@/lib/clinical/shift-allocator';
import { buildFormalSupport, resolveSupportTypes, toggleSupportType } from '@/lib/clinical/formal-support';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { ClinicalSafetyNote, EvidenceLevelBadge } from '@/components/clinical/evidence-level-badge';
import { CLINICAL_PROVENANCE } from '@/lib/clinical/provenance';

interface CaregiverSupportMatrixProps {
  patientUid: string;
  caregiver: CaregiverAttributes | null;
  patient: PatientDependenceProfile | null;
  onSave: (attrs: CaregiverAttributes, devices?: AssistiveDeviceInventory) => Promise<void>;
}

/**
 * Neutral stand-ins used only so the engine has a well-formed object to evaluate before a real
 * dyad has been documented. They deliberately describe a fully independent patient and an
 * unburdened caregiver: the surface gates every clinical number behind `hasPatientProfile` /
 * `hasCaregiverProfile`, and a populated demo profile here would defeat that gate by making the
 * engine's own data-quality check report nothing missing.
 */
const PLACEHOLDER_PATIENT: PatientDependenceProfile = {
  name: '',
  age: 0,
  primaryConditions: [],
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
  isBedBound: false,
  assistiveDevices: DEFAULT_ASSISTIVE_DEVICES
};

const PLACEHOLDER_CAREGIVER: CaregiverAttributes = {
  name: '',
  age: 0,
  gender: 'female',
  kinship: 'spouse',
  coResidence: 'lives_together',
  education: 'graduate',
  employment: 'homemaker',
  caregiverHealth: {
    hasBackPain: false,
    hasHypertension: false,
    hasArthritis: false,
    hasDiabetes: false,
    hasInsomnia: false
  },
  dailyHoursCommitted: 0,
  monthlyOutOfPocketBurden: 'manageable',
  formalTrainingReceived: false,
  secondaryMembers: [],
  rotationPolicy: {
    rotationInterval: 'biweekly',
    primaryCaregiverRespiteDaysPerMonth: 4,
    nightShiftArrangement: 'primary_solo'
  },
  formalSupport: {
    type: 'none',
    types: [],
    hoursPerDay: 0,
    handlesHeavyTransfers: false,
    handlesMedicationWoundCare: false
  }
};

const FORMAL_SUPPORT_OPTIONS: Array<{ id: FormalSupportType; label: string }> = [
  { id: 'paid_attendant_12h', label: 'Paid Day Attendant (10–12 h/day)' },
  { id: 'paid_attendant_24h', label: 'Full 24h Live-in Attendant' },
  { id: 'trained_nurse_12h', label: 'Trained Nurse (12h wound / meds / transfers)' },
  { id: 'trained_nurse_24h', label: 'Trained Nurse (24h intensive clinical)' },
  { id: 'medical_assistant', label: 'Medical Assistant / Physio Aide' },
  { id: 'multi_family_rotation', label: 'Formal Multi-Family Shift Rota' }
];

const AVAILABLE_TASKS: Array<{ id: CareTask; label: string; icon: string; desc: string }> = [
  { id: 'heavy_transfers', label: 'Heavy Transfers', icon: '💪', desc: 'Bed-to-chair lifts & wheelchair transfers' },
  { id: 'bathing', label: 'Bathing & Hygiene', icon: '🛁', desc: 'Sponge bath, diaper changes, and skin care' },
  { id: 'medications', label: 'Medications & Logs', icon: '💊', desc: 'Timely dispensing & blood sugar/BP logging' },
  { id: 'night_care', label: 'Night Watch', icon: '🌙', desc: 'Repositioning & night-time supervision' },
  { id: 'feeding', label: 'Feeding & Nutrition', icon: '🍲', desc: 'Meal prep, pureed feeding, and hydration' },
  { id: 'logistics_errands', label: 'Hospital Logistics', icon: '🚗', desc: 'OPD appointments, pharmacy & groceries' }
];

export function CaregiverSupportMatrix({
  patientUid,
  caregiver,
  patient,
  onSave
}: CaregiverSupportMatrixProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sharing & Export Dialog States
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const [isPrintSheetOpen, setIsPrintSheetOpen] = useState(false);

  // Primary Caregiver Form State
  const [firstName, setFirstName] = useState(() => {
    const parts = (caregiver?.name || 'Caregiver').trim().split(/\s+/);
    return parts[0] || '';
  });
  const [lastName, setLastName] = useState(() => {
    const parts = (caregiver?.name || '').trim().split(/\s+/);
    return parts.slice(1).join(' ') || '';
  });
  const [age, setAge] = useState(caregiver?.age || 54);
  const [kinship, setKinship] = useState<CaregiverAttributes['kinship']>(caregiver?.kinship || 'spouse');
  const [coResidence, setCoResidence] = useState<CaregiverAttributes['coResidence']>(caregiver?.coResidence || 'lives_together');
  const [employment, setEmployment] = useState<CaregiverAttributes['employment']>(caregiver?.employment || 'homemaker');
  const [committedHours, setCommittedHours] = useState(caregiver?.dailyHoursCommitted || 8);

  // Secondary Family Network Form State
  const [secondaryMembers, setSecondaryMembers] = useState<SecondaryFamilyMember[]>(() => {
    if (caregiver?.secondaryMembers && caregiver.secondaryMembers.length > 0) {
      return caregiver.secondaryMembers;
    }
    if (caregiver?.otherFamilyMembersCount && caregiver.otherFamilyMembersCount > 0) {
      return [
        {
          id: 'sec_1',
          name: 'Son Rahul',
          relationship: 'son',
          age: 28,
          occupation: 'Software Engineer',
          workCommitmentSchedule: 'Mon-Fri 9am-6pm (WFH Hybrid)',
          careRestrictions: 'Available Evenings (6pm-10pm) & Weekends',
          functionalStatus: 'independent',
          hoursPerDay: 2.5,
          assignedTasks: ['heavy_transfers', 'logistics_errands'],
          hasPhysicalLimitation: false,
          availableTimeBlocks: ['evening']
        }
      ];
    }
    return [];
  });

  // Monthly Rotation Policy State
  const [rotationInterval, setRotationInterval] = useState<MonthlyRotationPolicy['rotationInterval']>(
    caregiver?.rotationPolicy?.rotationInterval || 'biweekly'
  );
  const [respiteDaysPerMonth, setRespiteDaysPerMonth] = useState(
    caregiver?.rotationPolicy?.primaryCaregiverRespiteDaysPerMonth || 4
  );
  const [weekendLeader, setWeekendLeader] = useState(
    caregiver?.rotationPolicy?.weekendShiftLeader || caregiver?.name || 'Primary Caregiver'
  );
  const [nightArrangement, setNightArrangement] = useState<MonthlyRotationPolicy['nightShiftArrangement']>(
    caregiver?.rotationPolicy?.nightShiftArrangement || 'family_rotation'
  );

  // Emergency & Logistics State
  const [hospitalDistanceKm, setHospitalDistanceKm] = useState(
    caregiver?.emergencyLogistics?.hospitalDistanceKm ?? 4.5
  );
  const [travelTimeMinutes, setTravelTimeMinutes] = useState(
    caregiver?.emergencyLogistics?.travelTimeMinutes ?? 15
  );
  const [fourWheelerAvailable, setFourWheelerAvailable] = useState(
    caregiver?.emergencyLogistics?.fourWheelerAvailableAtHome ?? true
  );
  const [vehicleDetails, setVehicleDetails] = useState(
    caregiver?.emergencyLogistics?.vehicleDetails || 'Sedan (Parked at Home)'
  );
  const [emergencyDriver, setEmergencyDriver] = useState(
    caregiver?.emergencyLogistics?.designatedEmergencyDriver || caregiver?.name || ''
  );
  const [preferredHospital, setPreferredHospital] = useState(
    caregiver?.emergencyLogistics?.preferredHospitalName || 'AIIMS Geriatric Emergency Wing'
  );
  const [ambulanceContact, setAmbulanceContact] = useState(
    caregiver?.emergencyLogistics?.ambulanceContact || '108 / 102 (National Helpline)'
  );

  // Formal Support Form State. Stored as a list so this surface round-trips the same
  // multi-select the onboarding and dyad-profiler screens write. Reading only `.type` here used
  // to silently collapse a combined team (attendant + medical assistant) down to one hire on
  // every save, because the document is written as a full overwrite.
  const [supportTypes, setSupportTypes] = useState<FormalSupportType[]>(
    () => resolveSupportTypes(caregiver?.formalSupport)
  );
  const [supportHours, setSupportHours] = useState(caregiver?.formalSupport?.hoursPerDay || 0);
  const [handlesTransfers, setHandlesTransfers] = useState(caregiver?.formalSupport?.handlesHeavyTransfers || false);
  const [handlesMeds, setHandlesMeds] = useState(caregiver?.formalSupport?.handlesMedicationWoundCare || false);

  // Caregiver Health Constraints
  const [hasBackPain, setHasBackPain] = useState(caregiver?.caregiverHealth?.hasBackPain || false);
  const [hasHypertension, setHasHypertension] = useState(caregiver?.caregiverHealth?.hasHypertension || false);
  const [hasArthritis, setHasArthritis] = useState(caregiver?.caregiverHealth?.hasArthritis || false);
  const [hasDiabetes, setHasDiabetes] = useState(caregiver?.caregiverHealth?.hasDiabetes || false);
  const [hasInsomnia, setHasInsomnia] = useState(caregiver?.caregiverHealth?.hasInsomnia || false);
  const [notes, setNotes] = useState(caregiver?.notes || '');

  // Assistive Equipment State
  const [hospitalBed, setHospitalBed] = useState<AssistiveDeviceInventory['hospitalBed']>(
    patient?.assistiveDevices?.hospitalBed || 'none'
  );
  const [airWaterMattress, setAirWaterMattress] = useState(
    patient?.assistiveDevices?.airWaterMattress || false
  );
  const [wheelchair, setWheelchair] = useState(
    patient?.assistiveDevices?.wheelchair || false
  );
  const [suctionApparatus, setSuctionApparatus] = useState(
    patient?.assistiveDevices?.suctionApparatus || false
  );
  const [transferAids, setTransferAids] = useState(
    patient?.assistiveDevices?.transferAids || false
  );

  // Current Saved Caregiver & Evaluation.
  //
  // These fall back to neutral placeholders, never to a populated demo dyad. A fabricated
  // profile here would flow straight into CareGapEngine.evaluate() and render a care-demand
  // figure, NIOSH lifting index and burnout tier that look real to a clinician — while the
  // engine's own dataQuality check stays silent, because the fake profile is complete.
  const hasCaregiverProfile = !!caregiver;
  const hasPatientProfile = !!patient;
  const isDyadDocumented = hasCaregiverProfile && hasPatientProfile;

  const currentCaregiver: CaregiverAttributes = caregiver || PLACEHOLDER_CAREGIVER;
  const currentPatient: PatientDependenceProfile = patient
    ? { ...patient, assistiveDevices: patient.assistiveDevices || DEFAULT_ASSISTIVE_DEVICES }
    : PLACEHOLDER_PATIENT;

  const currentEval = useMemo(
    () => CareGapEngine.evaluate(currentCaregiver, currentPatient),
    [currentCaregiver, currentPatient]
  );
  const dataQualityItems = [
    ...currentEval.dataQuality.missingFields,
    ...currentEval.dataQuality.limitations
  ];

  // Live Simulated Caregiver & Patient
  const simulatedCaregiver: CaregiverAttributes = {
    ...currentCaregiver,
    name: `${firstName.trim()} ${lastName.trim()}`.trim() || 'Primary Caregiver',
    age: Number(age) || 54,
    kinship,
    coResidence,
    employment,
    dailyHoursCommitted: Number(committedHours) || 8,
    secondaryMembers,
    otherFamilyMembersCount: secondaryMembers.length,
    emergencyLogistics: {
      hospitalDistanceKm: Number(hospitalDistanceKm) || 0,
      travelTimeMinutes: Number(travelTimeMinutes) || 0,
      fourWheelerAvailableAtHome: fourWheelerAvailable,
      vehicleDetails,
      designatedEmergencyDriver: emergencyDriver,
      preferredHospitalName: preferredHospital,
      ambulanceContact
    },
    rotationPolicy: {
      rotationInterval,
      primaryCaregiverRespiteDaysPerMonth: Number(respiteDaysPerMonth) || 0,
      weekendShiftLeader: weekendLeader,
      nightShiftArrangement: nightArrangement
    },
    caregiverHealth: {
      hasBackPain,
      hasHypertension,
      hasArthritis,
      hasDiabetes,
      hasInsomnia
    },
    notes: notes.trim() || undefined,
    formalSupport: {
      // buildFormalSupport keeps `type` and `types[]` consistent with each other; the explicit
      // hours and scope toggles below are the clinician's overrides on top of the type defaults.
      ...buildFormalSupport(supportTypes),
      hoursPerDay: Number(supportHours) || 0,
      handlesHeavyTransfers: handlesTransfers,
      handlesMedicationWoundCare: handlesMeds
    }
  };

  const simulatedPatient: PatientDependenceProfile = {
    ...currentPatient,
    assistiveDevices: {
      hospitalBed,
      airWaterMattress,
      wheelchair,
      suctionApparatus,
      transferAids
    }
  };

  const simulatedEval = useMemo(
    () => CareGapEngine.evaluate(simulatedCaregiver, simulatedPatient),
    [
      currentCaregiver,
      currentPatient,
      firstName,
      lastName,
      age,
      kinship,
      coResidence,
      employment,
      committedHours,
      secondaryMembers,
      hospitalDistanceKm,
      travelTimeMinutes,
      fourWheelerAvailable,
      vehicleDetails,
      emergencyDriver,
      preferredHospital,
      ambulanceContact,
      rotationInterval,
      respiteDaysPerMonth,
      weekendLeader,
      nightArrangement,
      hasBackPain,
      hasHypertension,
      hasArthritis,
      hasDiabetes,
      hasInsomnia,
      notes,
      supportTypes,
      supportHours,
      handlesTransfers,
      handlesMeds,
      hospitalBed,
      airWaterMattress,
      wheelchair,
      suctionApparatus,
      transferAids
    ]
  );

  /**
   * Re-seeds every form field from freshly loaded props.
   *
   * `caregiver` and `patient` arrive asynchronously, but this dialog's fields were seeded by
   * `useState` initializers that only ever run on the first render. The clinician workspace
   * mounts this component with `caregiver === null`, so the form held blank/default values while
   * the card behind it showed the real record — and because `simulatedCaregiver` overwrites
   * name, kinship, hours, secondaryMembers, rotation policy and emergency logistics from that
   * form state, saving after editing a single unrelated field wiped the family's whole roster.
   * The write is a full document overwrite, so there was nothing to recover.
   */
  const applyLoadedProfile = (cg: CaregiverAttributes | null, pt: PatientDependenceProfile | null) => {
    const parts = (cg?.name || '').trim().split(/\s+/).filter(Boolean);
    setFirstName(parts[0] || '');
    setLastName(parts.slice(1).join(' '));
    setAge(cg?.age ?? 54);
    setKinship(cg?.kinship || 'spouse');
    setCoResidence(cg?.coResidence || 'lives_together');
    setEmployment(cg?.employment || 'homemaker');
    setCommittedHours(cg?.dailyHoursCommitted ?? 8);
    setSecondaryMembers(cg?.secondaryMembers ? [...cg.secondaryMembers] : []);

    setRotationInterval(cg?.rotationPolicy?.rotationInterval || 'biweekly');
    setRespiteDaysPerMonth(cg?.rotationPolicy?.primaryCaregiverRespiteDaysPerMonth ?? 4);
    setWeekendLeader(cg?.rotationPolicy?.weekendShiftLeader || '');
    setNightArrangement(cg?.rotationPolicy?.nightShiftArrangement || 'primary_solo');

    setHospitalDistanceKm(cg?.emergencyLogistics?.hospitalDistanceKm ?? 0);
    setTravelTimeMinutes(cg?.emergencyLogistics?.travelTimeMinutes ?? 0);
    setFourWheelerAvailable(cg?.emergencyLogistics?.fourWheelerAvailableAtHome ?? false);
    setVehicleDetails(cg?.emergencyLogistics?.vehicleDetails || '');
    setEmergencyDriver(cg?.emergencyLogistics?.designatedEmergencyDriver || '');
    setPreferredHospital(cg?.emergencyLogistics?.preferredHospitalName || '');
    setAmbulanceContact(cg?.emergencyLogistics?.ambulanceContact || '108');

    setSupportTypes(resolveSupportTypes(cg?.formalSupport));
    setSupportHours(cg?.formalSupport?.hoursPerDay ?? 0);
    setHandlesTransfers(cg?.formalSupport?.handlesHeavyTransfers ?? false);
    setHandlesMeds(cg?.formalSupport?.handlesMedicationWoundCare ?? false);

    setHasBackPain(cg?.caregiverHealth?.hasBackPain ?? false);
    setHasHypertension(cg?.caregiverHealth?.hasHypertension ?? false);
    setHasArthritis(cg?.caregiverHealth?.hasArthritis ?? false);
    setHasDiabetes(cg?.caregiverHealth?.hasDiabetes ?? false);
    setHasInsomnia(cg?.caregiverHealth?.hasInsomnia ?? false);
    setNotes(cg?.notes || '');

    const devices = pt?.assistiveDevices || DEFAULT_ASSISTIVE_DEVICES;
    setHospitalBed(devices.hospitalBed);
    setAirWaterMattress(devices.airWaterMattress);
    setWheelchair(devices.wheelchair);
    setSuctionApparatus(devices.suctionApparatus);
    setTransferAids(devices.transferAids);
  };

  const syncedSignatureRef = useRef<string | null>(null);

  useEffect(() => {
    // Never clobber an edit in progress: only re-seed while the dialog is closed.
    if (open) return;
    const signature = JSON.stringify({ c: caregiver, d: patient?.assistiveDevices ?? null });
    if (signature === syncedSignatureRef.current) return;
    syncedSignatureRef.current = signature;
    applyLoadedProfile(caregiver, patient);
    // applyLoadedProfile only calls setters; re-running on its identity would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caregiver, patient, open]);

  const handleToggleSupportType = (type: FormalSupportType) => {
    const next = toggleSupportType(supportTypes, type);
    setSupportTypes(next);

    // Keep the derived hours and scope in step with the selection, so the clinician sees a
    // self-consistent team without having to re-enter the defaults by hand.
    const derived = buildFormalSupport(next);
    setSupportHours(derived.hoursPerDay);
    setHandlesTransfers(derived.handlesHeavyTransfers);
    setHandlesMeds(derived.handlesMedicationWoundCare);
  };

  const handleAddSecondaryMember = () => {
    // Seeded blank rather than with a sample schedule. The old default of 'Mon-Fri 10am-5pm'
    // matched the allocator's daytime-employment heuristic, so every member added here was
    // silently barred from morning and midday shifts and raised a false schedule conflict.
    const newMember: SecondaryFamilyMember = {
      id: `sec_${Date.now()}`,
      name: '',
      relationship: 'daughter_in_law',
      age: 30,
      occupation: '',
      workCommitmentSchedule: '',
      careRestrictions: '',
      functionalStatus: 'independent',
      hoursPerDay: 2.0,
      assignedTasks: [],
      hasPhysicalLimitation: false,
      availableTimeBlocks: ['morning_rush', 'evening']
    };
    setSecondaryMembers([...secondaryMembers, newMember]);
  };

  const handleUpdateSecondaryMember = (id: string, updates: Partial<SecondaryFamilyMember>) => {
    setSecondaryMembers(
      secondaryMembers.map((m) => (m.id === id ? { ...m, ...updates } : m))
    );
  };

  const handleRemoveSecondaryMember = (id: string) => {
    setSecondaryMembers(secondaryMembers.filter((m) => m.id !== id));
  };

  const handleToggleMemberTask = (memberId: string, task: CareTask) => {
    setSecondaryMembers(
      secondaryMembers.map((m) => {
        if (m.id !== memberId) return m;
        const exists = m.assignedTasks.includes(task);
        const updated = exists
          ? m.assignedTasks.filter((t) => t !== task)
          : [...m.assignedTasks, task];
        return { ...m, assignedTasks: updated };
      })
    );
  };

  const handleToggleMemberTimeBlock = (memberId: string, block: DiurnalTimeBlock) => {
    setSecondaryMembers(
      secondaryMembers.map((m) => {
        if (m.id !== memberId) return m;
        const current = m.availableTimeBlocks || ['morning_rush', 'evening'];
        const exists = current.includes(block);
        const updated = exists ? current.filter((b) => b !== block) : [...current, block];
        return { ...m, availableTimeBlocks: updated };
      })
    );
  };

  /**
   * Distributes the patient's actual outstanding responsibilities across the family pool.
   *
   * The previous implementation was a two-branch age test that ignored the patient entirely: it
   * gave heavy transfers to every member under 50 with no load balancing, could never assign
   * bathing or night care, and overwrote manual mappings with the same two tasks for everyone.
   * This version starts from what the patient actually needs, skips what formal staff already
   * cover, respects each member's declared availability windows and physical limits, and
   * balances the remaining work by committed hours.
   */
  const handleAutoOptimizeTasks = () => {
    if (secondaryMembers.length === 0) {
      toast({
        title: 'No Family Members to Optimize',
        description: 'Add at least one secondary family member to distribute tasks.'
      });
      return;
    }

    if (!hasPatientProfile) {
      toast({
        variant: 'destructive',
        title: 'Patient Profile Required',
        description: 'Auto-distribution schedules the patient’s real ADL/IADL deficits. Document the profile first.'
      });
      return;
    }

    // 1. What the patient actually needs, and in which window.
    const needed: Array<{ task: CareTask; blocks: DiurnalTimeBlock[] }> = [];
    if (!currentPatient.katzAdl.bathing) needed.push({ task: 'bathing', blocks: ['morning_rush'] });
    if (!currentPatient.katzAdl.transferring) needed.push({ task: 'heavy_transfers', blocks: ['morning_rush', 'evening'] });
    if (!currentPatient.katzAdl.feeding) needed.push({ task: 'feeding', blocks: ['morning_rush', 'afternoon', 'evening'] });
    if (!currentPatient.lawtonIadl.medicationManagement) needed.push({ task: 'medications', blocks: ['morning_rush', 'evening'] });
    if (
      !currentPatient.lawtonIadl.shopping ||
      !currentPatient.lawtonIadl.transportation ||
      !currentPatient.lawtonIadl.mealPreparation
    ) {
      needed.push({ task: 'logistics_errands', blocks: ['afternoon'] });
    }
    if (
      currentPatient.isBedBound ||
      !currentPatient.katzAdl.continence ||
      currentPatient.cognitiveBehavioralLoad === 'severe_sundowning'
    ) {
      needed.push({ task: 'night_care', blocks: ['night_watch'] });
    }

    if (needed.length === 0) {
      toast({
        title: 'Nothing to Distribute',
        description: 'The recorded ADL/IADL profile shows no delegable care tasks yet.'
      });
      return;
    }

    // 2. Tasks the paid team already owns are not the family's to carry.
    const staffTypes = supportTypes;
    const staffCovers = (task: CareTask): boolean => {
      if (staffTypes.length === 0) return false;
      const around = staffTypes.some((t) => t.includes('24h'));
      const daytime = staffTypes.some((t) => t.includes('12h') || t.includes('24h'));
      if (task === 'night_care') return around;
      if (task === 'heavy_transfers') return handlesTransfers && daytime;
      if (task === 'medications') return handlesMeds && (daytime || staffTypes.includes('medical_assistant'));
      if (task === 'bathing') return daytime;
      return false;
    };

    // 3. Load-balanced assignment over members who are actually free in the right window.
    const load = new Map<string, number>(secondaryMembers.map((m) => [m.id, 0]));
    const nextTasks = new Map<string, CareTask[]>(secondaryMembers.map((m) => [m.id, []]));
    const unassignable: CareTask[] = [];

    for (const { task, blocks } of needed) {
      if (staffCovers(task)) continue;

      const eligible = secondaryMembers.filter((m) => {
        const windows = m.availableTimeBlocks && m.availableTimeBlocks.length > 0 ? m.availableTimeBlocks : ['morning_rush', 'evening'];
        if (!blocks.some((b) => windows.includes(b))) return false;
        return ShiftAllocator.isMemberEligible(m, task).eligible;
      });

      if (eligible.length === 0) {
        unassignable.push(task);
        continue;
      }

      // Prefer whoever is carrying least so far, then whoever committed the most hours.
      eligible.sort((a, b) => {
        const byLoad = (load.get(a.id) ?? 0) - (load.get(b.id) ?? 0);
        if (byLoad !== 0) return byLoad;
        const byHours = (b.hoursPerDay || 0) - (a.hoursPerDay || 0);
        if (byHours !== 0) return byHours;
        return a.id.localeCompare(b.id);
      });

      const chosen = eligible[0];
      nextTasks.get(chosen.id)!.push(task);
      // Heavy transfers and night care carry more weight than a med round.
      load.set(chosen.id, (load.get(chosen.id) ?? 0) + (task === 'heavy_transfers' || task === 'night_care' ? 2 : 1));
    }

    setSecondaryMembers(secondaryMembers.map((m) => ({ ...m, assignedTasks: nextTasks.get(m.id) || [] })));

    const placed = Array.from(nextTasks.values()).reduce((sum, list) => sum + list.length, 0);
    toast({
      title: placed > 0 ? `Distributed ${placed} Responsibilit${placed === 1 ? 'y' : 'ies'}` : 'Nothing Left to Distribute',
      description: unassignable.length > 0
        ? `No eligible family member for: ${unassignable.map((t) => t.replace(/_/g, ' ')).join(', ')}. These stay with the primary caregiver or need paid cover.`
        : 'Balanced by availability window, physical limits, and committed hours. Review before saving.'
    });
  };

  const handleSaveModal = async () => {
    setIsSaving(true);
    try {
      await onSave(simulatedCaregiver, simulatedPatient.assistiveDevices);
      setOpen(false);
      toast({
        title: 'Monthly Care Support Matrix Saved',
        description: 'Multi-caregiver team plan, assistive devices, shift rotation rota, and emergency readiness updated.'
      });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Could Not Save',
        description: err instanceof Error ? err.message : 'Please try again.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Allocated roster for the saved matrix. Previously the allocator was only reachable through
  // the WhatsApp and .ics exports, so the schedule the app generated could never be reviewed or
  // corrected on screen before it went out to the family.
  const roster: CareShiftRoster | null = useMemo(
    () => (isDyadDocumented ? ShiftAllocator.allocate(currentCaregiver, currentPatient, currentEval) : null),
    [isDyadDocumented, currentCaregiver, currentPatient, currentEval]
  );

  const rosterBlockOrder: DiurnalTimeBlock[] = ['morning_rush', 'afternoon', 'evening', 'night_watch'];

  // WhatsApp Digest Share Handler
  const whatsAppText = isDyadDocumented
    ? generateWhatsAppCareDigest(currentCaregiver, currentPatient, currentEval)
    : 'Document the patient profile and caregiver matrix before sharing a care plan. This keeps placeholder data from being sent to the family as a real roster.';

  const handleCopyWhatsAppText = () => {
    navigator.clipboard.writeText(whatsAppText);
    toast({
      title: 'Copied to Clipboard!',
      description: 'WhatsApp Care Circle digest is ready to paste into family chat.'
    });
  };

  const handleOpenWhatsAppUrl = () => {
    const encoded = encodeURIComponent(whatsAppText);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  // ICS Calendar Download Handler
  const handleDownloadIcs = () => {
    if (!isDyadDocumented) {
      toast({
        variant: 'destructive',
        title: 'Dyad Not Documented Yet',
        description: 'A roster export needs a real patient profile and caregiver matrix on file.'
      });
      return;
    }
    const icsContent = generateCareRosterIcs(currentCaregiver, currentPatient, currentEval);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `sanjeevani-care-roster-${patientUid}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({
      title: 'Calendar Roster Downloaded (.ics)',
      description: 'Import into Google Calendar or Apple Calendar to sync shift and respite reminders.'
    });
  };

  const hasFormalSupport =
    currentCaregiver.formalSupport &&
    currentCaregiver.formalSupport.type !== 'none' &&
    currentCaregiver.formalSupport.hoursPerDay > 0;

  const totalDemand = Math.max(0.1, currentEval.patientCareDemandHours);
  const primaryPct = Math.round((currentEval.teamAllocations.primaryCaregiverHours / totalDemand) * 100);
  const formalPct = Math.round((currentEval.teamAllocations.formalStaffHours / totalDemand) * 100);
  const familyPct = Math.round((currentEval.teamAllocations.secondaryFamilyHours / totalDemand) * 100);
  const unmetPct = Math.max(0, 100 - primaryPct - formalPct - familyPct);

  return (
    <Card className="rounded-3xl border-primary/20 shadow-xs overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/50 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Users2 className="w-5 h-5 text-primary" />
              Monthly Care Support Matrix & Roster Plan
            </CardTitle>
            <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold uppercase tracking-wider">
              ⭐ Core Dyad Engine
            </Badge>
          </div>
          <CardDescription className="text-xs mt-0.5">
            Dyadic load balancing, assistive equipment modeling, diurnal shift matching, and emergency transit readiness.
          </CardDescription>
        </div>

        {/* TOP ACTION BUTTONS */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsWhatsAppOpen(true)}
            disabled={!isDyadDocumented}
            title={isDyadDocumented ? undefined : 'Document the dyad before sharing a care plan'}
            className="h-8 text-xs gap-1.5 font-bold text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-50 disabled:opacity-50"
          >
            <Share2 className="w-3.5 h-3.5" /> WhatsApp Digest
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleDownloadIcs}
            disabled={!isDyadDocumented}
            title={isDyadDocumented ? undefined : 'Document the dyad before exporting a roster'}
            className="h-8 text-xs gap-1.5 font-bold text-blue-700 dark:text-blue-400 border-blue-500/30 hover:bg-blue-50 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" /> Sync Calendar (.ics)
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsPrintSheetOpen(true)}
            disabled={!isDyadDocumented}
            title={isDyadDocumented ? undefined : 'Document the dyad before printing a bedside sheet'}
            className="h-8 text-xs gap-1.5 font-bold hover:bg-muted disabled:opacity-50"
          >
            <Printer className="w-3.5 h-3.5" /> Bedside Wall Sheet
          </Button>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="default" className="h-8 text-xs gap-1.5 font-bold shrink-0 bg-primary shadow-xs">
                <Edit3 className="w-3.5 h-3.5" /> Configure Matrix
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
              <DialogHeader>
                <DialogTitle className="text-sm sm:text-base font-bold flex items-center gap-2">
                  <Users2 className="w-4 h-4 text-primary" />
                  Configure Monthly Care Support Matrix & Assistive Infrastructure
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Model family helper diurnal shifts, assistive beds & suction gear, 12h/24h nursing, monthly respite rotas, and emergency transit readiness.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 my-2 text-xs">
                {/* LIVE SIMULATION STRIP */}
                <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/30 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-primary flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                      <Sparkles className="w-4 h-4 text-primary animate-pulse" /> Live Impact Simulator (Real-Time Sandbox)
                    </span>
                    <Badge
                      className={cn(
                        'text-[10px] font-bold uppercase',
                        simulatedEval.caregiverBurnoutRiskLevel === 'critical'
                          ? 'bg-red-600 text-white'
                          : simulatedEval.caregiverBurnoutRiskLevel === 'high'
                          ? 'bg-amber-600 text-white'
                          : simulatedEval.caregiverBurnoutRiskLevel === 'moderate'
                          ? 'bg-blue-600 text-white'
                          : 'bg-emerald-600 text-white'
                      )}
                    >
                      {simulatedEval.caregiverBurnoutRiskLevel} Burnout Risk
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                    <div className="p-2 rounded-xl bg-card border border-border/60">
                      <span className="text-[10px] text-muted-foreground block">Patient Demand</span>
                      <span className="text-sm font-black text-foreground">{simulatedEval.patientCareDemandHours}h/day</span>
                    </div>
                    <div className="p-2 rounded-xl bg-card border border-border/60">
                      <span className="text-[10px] text-muted-foreground block">Team Absorbed</span>
                      <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                        {(simulatedEval.formalSupportAbsorbedHours + simulatedEval.familySupportAbsorbedHours).toFixed(1)}h/day
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-card border border-border/60">
                      <span className="text-[10px] text-muted-foreground block">Net Care Gap</span>
                      <span
                        className={cn(
                          'text-sm font-black',
                          simulatedEval.netCareGapHours > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600'
                        )}
                      >
                        {simulatedEval.netCareGapHours > 0 ? `${simulatedEval.netCareGapHours}h Deficit` : '0.0h (Equilibrium)'}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-card border border-border/60">
                      <span className="text-[10px] text-muted-foreground block">Spine Injury Strain</span>
                      <span
                        className={cn(
                          'text-sm font-black',
                          simulatedEval.caregiverInjuryRiskScore > 50 ? 'text-amber-600' : 'text-emerald-600'
                        )}
                      >
                        {simulatedEval.caregiverInjuryRiskScore}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* SECTION 1: PRIMARY CAREGIVER IDENTITY */}
                <div className="space-y-3 p-3.5 rounded-2xl border border-border/70 bg-card">
                  <p className="font-bold text-foreground uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-primary" /> 1. Primary Caregiver Identity & Capacity
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="col-span-2 grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">First Name</Label>
                        <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="h-8 text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Last Name</Label>
                        <Input value={lastName} onChange={(e) => setLastName(e.target.value)} className="h-8 text-xs" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Age (Years)</Label>
                      <Input type="number" value={age} onChange={(e) => setAge(Number(e.target.value))} className="h-8 text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Kinship</Label>
                      <select
                        value={kinship}
                        onChange={(e) => setKinship(e.target.value as any)}
                        className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
                      >
                        <option value="spouse">Spouse (Wife / Husband)</option>
                        <option value="son">Son</option>
                        <option value="daughter">Daughter</option>
                        <option value="daughter_in_law">Daughter-in-law</option>
                        <option value="sibling">Sibling</option>
                        <option value="other">Other Relative</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div className="space-y-1">
                      <Label className="text-xs">Living Arrangement</Label>
                      <select
                        value={coResidence}
                        onChange={(e) => setCoResidence(e.target.value as any)}
                        className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
                      >
                        <option value="lives_together">Lives Together in Same Household</option>
                        <option value="nearby">Lives Nearby (Same City)</option>
                        <option value="long_distance">Long Distance</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Employment Status</Label>
                      <select
                        value={employment}
                        onChange={(e) => setEmployment(e.target.value as any)}
                        className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
                      >
                        <option value="homemaker">Homemaker (Full Time Home)</option>
                        <option value="full_time">Full-Time Job (40+ hrs/wk)</option>
                        <option value="part_time">Part-Time / Flexible</option>
                        <option value="retired">Retired Senior</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Committed Care Hours/Day</Label>
                      <Input
                        type="number"
                        value={committedHours}
                        onChange={(e) => setCommittedHours(Number(e.target.value))}
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                  </div>

                  {/* Primary Caregiver Physical Health Constraints */}
                  <div className="pt-2 border-t border-border/50 space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground block">
                      Primary Caregiver Physical Health Constraints & Medical Diagnoses
                    </Label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      <label className="flex items-center gap-2 p-2 rounded-lg border border-border/60 cursor-pointer hover:bg-muted/40">
                        <input type="checkbox" checked={hasBackPain} onChange={(e) => setHasBackPain(e.target.checked)} className="rounded text-primary" />
                        <span className="text-xs">Back Pain / Spine</span>
                      </label>
                      <label className="flex items-center gap-2 p-2 rounded-lg border border-border/60 cursor-pointer hover:bg-muted/40">
                        <input type="checkbox" checked={hasArthritis} onChange={(e) => setHasArthritis(e.target.checked)} className="rounded text-primary" />
                        <span className="text-xs">Arthritis</span>
                      </label>
                      <label className="flex items-center gap-2 p-2 rounded-lg border border-border/60 cursor-pointer hover:bg-muted/40">
                        <input type="checkbox" checked={hasHypertension} onChange={(e) => setHasHypertension(e.target.checked)} className="rounded text-primary" />
                        <span className="text-xs">Hypertension</span>
                      </label>
                      <label className="flex items-center gap-2 p-2 rounded-lg border border-border/60 cursor-pointer hover:bg-muted/40">
                        <input type="checkbox" checked={hasDiabetes} onChange={(e) => setHasDiabetes(e.target.checked)} className="rounded text-primary" />
                        <span className="text-xs">Diabetes T2</span>
                      </label>
                      <label className="flex items-center gap-2 p-2 rounded-lg border border-border/60 cursor-pointer hover:bg-muted/40">
                        <input type="checkbox" checked={hasInsomnia} onChange={(e) => setHasInsomnia(e.target.checked)} className="rounded text-primary" />
                        <span className="text-xs">Sleep Strain</span>
                      </label>
                    </div>

                    <div className="pt-1">
                      <Label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                        Caregiver Medical Notes & Lifting / Health Restrictions
                      </Label>
                      <Input
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="e.g. Lumbar disc herniation (L4-L5), takes antihypertensives, avoid heavy transfers solo"
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 2: ASSISTIVE DEVICES & ERGONOMIC EQUIPMENT INVENTORY */}
                <div className="space-y-3 p-3.5 rounded-2xl border border-indigo-500/30 bg-indigo-500/5">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <Bed className="w-4 h-4 text-indigo-600" /> 2. Assistive Devices & Ergonomic Bedside Equipment
                    </p>
                    <Badge variant="outline" className="text-[9px] text-indigo-600 border-indigo-500/30">
                      Ergonomic Discount Active
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Hospital Bed Function</Label>
                      <select
                        value={hospitalBed}
                        onChange={(e) => setHospitalBed(e.target.value as any)}
                        className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs font-medium"
                      >
                        <option value="none">Standard Home Bed (High Spine Strain)</option>
                        <option value="manual_adjustable">Manual Adjustable Head/Foot Bed</option>
                        <option value="motorized_multichannel">Motorized 3-Function Hospital Bed (Waist Height)</option>
                      </select>
                    </div>

                    <div className="space-y-2 pt-1">
                      <Label className="text-xs font-semibold block">Bedside Assistive Gear</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <label className="flex items-center gap-2 p-1.5 rounded-lg border border-border/70 bg-card cursor-pointer hover:bg-muted/50">
                          <input type="checkbox" checked={airWaterMattress} onChange={(e) => setAirWaterMattress(e.target.checked)} className="rounded text-primary" />
                          <span className="text-xs font-medium">Alternating Mattress</span>
                        </label>
                        <label className="flex items-center gap-2 p-1.5 rounded-lg border border-border/70 bg-card cursor-pointer hover:bg-muted/50">
                          <input type="checkbox" checked={wheelchair} onChange={(e) => setWheelchair(e.target.checked)} className="rounded text-primary" />
                          <span className="text-xs font-medium">Wheelchair Available</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <label className="flex items-center gap-2 p-2 rounded-lg border border-border/70 bg-card cursor-pointer hover:bg-muted/50">
                      <input type="checkbox" checked={transferAids} onChange={(e) => setTransferAids(e.target.checked)} className="rounded text-primary" />
                      <span className="text-xs">Swivel Pivot Disc & Transfer Gait Belt (Transfers)</span>
                    </label>
                    <label className="flex items-center gap-2 p-2 rounded-lg border border-border/70 bg-card cursor-pointer hover:bg-muted/50">
                      <input type="checkbox" checked={suctionApparatus} onChange={(e) => setSuctionApparatus(e.target.checked)} className="rounded text-primary" />
                      <span className="text-xs">Electric Suction Machine (Airway & Dysphagia)</span>
                    </label>
                  </div>
                </div>

                {/* SECTION 3: SECONDARY FAMILY MEMBERS TEAM POOL & DIURNAL TASK DELEGATION */}
                <div className="space-y-3 p-3.5 rounded-2xl border border-border/70 bg-card">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-foreground uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <HeartHandshake className="w-3.5 h-3.5 text-primary" /> 3. Secondary Family Support & Diurnal Shift Matching
                    </p>
                    <div className="flex items-center gap-2">
                      <Button type="button" size="sm" variant="outline" onClick={handleAutoOptimizeTasks} className="h-7 text-xs gap-1 font-bold text-primary border-primary/30">
                        <Wand2 className="w-3 h-3" /> Auto-Distribute
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={handleAddSecondaryMember} className="h-7 text-xs gap-1 font-bold">
                        <Plus className="w-3 h-3" /> Add Family Helper
                      </Button>
                    </div>
                  </div>

                  {secondaryMembers.length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-border text-center text-muted-foreground">
                      <p className="text-xs">No secondary family members added yet (Solo Caregiver arrangement).</p>
                      <p className="text-[11px] pt-1 text-primary cursor-pointer hover:underline" onClick={handleAddSecondaryMember}>
                        + Click here to pool sons, daughters, or relatives into the care matrix
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {secondaryMembers.map((member) => {
                        const availableBlocks = member.availableTimeBlocks || ['morning_rush', 'evening'];
                        return (
                          <div key={member.id} className="p-3.5 rounded-xl border border-border/80 bg-muted/20 space-y-2.5">
                            <div className="flex items-center justify-between gap-2">
                              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 flex-1">
                                <div className="space-y-1">
                                  <Label className="text-[10px] text-muted-foreground font-semibold">Helper Name</Label>
                                  <Input
                                    value={member.name}
                                    onChange={(e) => handleUpdateSecondaryMember(member.id, { name: e.target.value })}
                                    placeholder="Name (e.g. Relative or Helper)"
                                    className="h-7 text-xs font-semibold"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[10px] text-muted-foreground font-semibold">Kinship & Age</Label>
                                  <div className="flex items-center gap-1.5">
                                    <select
                                      value={member.relationship}
                                      onChange={(e) => handleUpdateSecondaryMember(member.id, { relationship: e.target.value as any })}
                                      className="h-7 w-full rounded-md border border-input bg-background px-2 text-xs"
                                    >
                                      <option value="son">Son</option>
                                      <option value="daughter">Daughter</option>
                                      <option value="daughter_in_law">Daughter-in-law</option>
                                      <option value="son_in_law">Son-in-law</option>
                                      <option value="sibling">Sibling</option>
                                      <option value="grandchild">Grandchild</option>
                                      <option value="other">Relative</option>
                                    </select>
                                    <Input
                                      type="number"
                                      value={member.age}
                                      onChange={(e) => handleUpdateSecondaryMember(member.id, { age: Number(e.target.value) })}
                                      placeholder="Age"
                                      className="h-7 w-14 text-xs"
                                    />
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[10px] text-muted-foreground font-semibold">Occupation</Label>
                                  <Input
                                    value={member.occupation || ''}
                                    onChange={(e) => handleUpdateSecondaryMember(member.id, { occupation: e.target.value })}
                                    placeholder="e.g. Software Engineer"
                                    className="h-7 text-xs"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[10px] text-muted-foreground font-semibold">Committed Hours/Day</Label>
                                  <Input
                                    type="number"
                                    step="0.5"
                                    value={member.hoursPerDay}
                                    onChange={(e) => handleUpdateSecondaryMember(member.id, { hoursPerDay: Number(e.target.value) })}
                                    placeholder="Hrs/day"
                                    className="h-7 text-xs font-mono"
                                  />
                                </div>
                              </div>

                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveSecondaryMember(member.id)}
                                className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>

                            {/* Diurnal Time Availability Windows */}
                            <div className="space-y-1 pt-1 border-t border-border/40">
                              <Label className="text-[10px] text-muted-foreground font-semibold">
                                Shift Availability Windows for {member.name || 'Member'}:
                              </Label>
                              <div className="flex flex-wrap gap-1.5">
                                {DIURNAL_TIME_BLOCKS.map((block) => {
                                  const isSelected = availableBlocks.includes(block.id);
                                  return (
                                    <button
                                      type="button"
                                      key={block.id}
                                      onClick={() => handleToggleMemberTimeBlock(member.id, block.id)}
                                      className={cn(
                                        'px-2 py-1 rounded-md text-[10px] font-semibold transition-all flex items-center gap-1 border',
                                        isSelected
                                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                          : 'bg-card text-muted-foreground border-border/70 hover:bg-muted'
                                      )}
                                    >
                                      <span>{block.icon}</span>
                                      <span>{block.label} ({block.timeRange})</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Occupational & Physical Constraints.
                                These drive the allocator's hard constraints. Without inputs they
                                were frozen at the seeded defaults, so a sample work schedule
                                silently disqualified every member from daytime shifts. */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-border/40">
                              <div className="space-y-1">
                                <Label className="text-[10px] text-muted-foreground font-semibold">
                                  Work Commitment (free text)
                                </Label>
                                <Input
                                  value={member.workCommitmentSchedule || ''}
                                  onChange={(e) =>
                                    handleUpdateSecondaryMember(member.id, { workCommitmentSchedule: e.target.value })
                                  }
                                  placeholder="e.g. Mon-Fri 9am-6pm, WFH Wed"
                                  className="h-7 text-xs"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[10px] text-muted-foreground font-semibold">
                                  Care Restrictions
                                </Label>
                                <Input
                                  value={member.careRestrictions || ''}
                                  onChange={(e) =>
                                    handleUpdateSecondaryMember(member.id, { careRestrictions: e.target.value })
                                  }
                                  placeholder="e.g. no lifting, not trained for medication"
                                  className="h-7 text-xs"
                                />
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 pt-0.5">
                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={member.hasPhysicalLimitation}
                                  onChange={(e) =>
                                    handleUpdateSecondaryMember(member.id, { hasPhysicalLimitation: e.target.checked })
                                  }
                                  className="rounded text-primary"
                                />
                                <span className="text-[11px]">Has a physical limitation (no transfers or bathing)</span>
                              </label>
                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={member.functionalStatus === 'has_limitations'}
                                  onChange={(e) =>
                                    handleUpdateSecondaryMember(member.id, {
                                      functionalStatus: e.target.checked ? 'has_limitations' : 'independent'
                                    })
                                  }
                                  className="rounded text-primary"
                                />
                                <span className="text-[11px]">Frail / not fully independent</span>
                              </label>
                            </div>

                            {/* Task Assignment Pills */}
                            <div className="space-y-1 pt-1">
                              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                                Designated Tasks:
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {AVAILABLE_TASKS.map((t) => {
                                  const isAssigned = member.assignedTasks.includes(t.id);
                                  return (
                                    <button
                                      type="button"
                                      key={t.id}
                                      onClick={() => handleToggleMemberTask(member.id, t.id)}
                                      className={cn(
                                        'px-2 py-1 rounded-md text-[11px] font-semibold transition-all flex items-center gap-1 border',
                                        isAssigned
                                          ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                                          : 'bg-card text-muted-foreground border-border/70 hover:bg-muted'
                                      )}
                                    >
                                      <span>{t.icon}</span>
                                      <span>{t.label}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Diurnal Schedule Conflict Warnings */}
                  {simulatedEval.diurnalCoverage.conflicts.length > 0 && (
                    <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 space-y-1.5">
                      <span className="font-bold text-amber-700 dark:text-amber-400 text-xs flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Diurnal Schedule Conflict Detected ({simulatedEval.diurnalCoverage.conflicts.length} Clashes)
                      </span>
                      {simulatedEval.diurnalCoverage.conflicts.map((c, i) => (
                        <p key={i} className="text-[11px] text-foreground">
                          • <strong>{c.memberName}</strong>: {c.recommendation} ({c.workSchedule})
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                {/* SECTION 4: FORMAL ATTENDANT & 12H/24H NURSING INFRASTRUCTURE */}
                <div className="space-y-3 p-3.5 rounded-2xl border border-primary/40 bg-primary/5">
                  <p className="font-bold text-primary uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                    4. Formal Support & Paid Attendant Deployment (12h / 24h Shifts)
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label className="text-xs font-semibold">
                        Support Team{' '}
                        <span className="font-normal text-muted-foreground">
                          (select every hire — a combined team is common)
                        </span>
                      </Label>
                      <div className="flex flex-wrap gap-1.5">
                        {FORMAL_SUPPORT_OPTIONS.map((opt) => {
                          const isOn = supportTypes.includes(opt.id);
                          return (
                            <button
                              type="button"
                              key={opt.id}
                              onClick={() => handleToggleSupportType(opt.id)}
                              className={cn(
                                'px-2 py-1 rounded-md text-[11px] font-semibold transition-all border',
                                isOn
                                  ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                                  : 'bg-card text-muted-foreground border-border/70 hover:bg-muted'
                              )}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                        <button
                          type="button"
                          onClick={() => handleToggleSupportType('none')}
                          className={cn(
                            'px-2 py-1 rounded-md text-[11px] font-semibold transition-all border',
                            supportTypes.length === 0
                              ? 'bg-foreground text-background border-foreground shadow-xs'
                              : 'bg-card text-muted-foreground border-border/70 hover:bg-muted'
                          )}
                        >
                          None (100% Family Burden)
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Attendant Hours / Day</Label>
                      <Input
                        type="number"
                        value={supportHours}
                        onChange={(e) => setSupportHours(Number(e.target.value))}
                        className="h-8 text-xs font-mono"
                        placeholder="e.g. 10"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={handlesTransfers}
                        onChange={(e) => setHandlesTransfers(e.target.checked)}
                        className="rounded text-primary"
                      />
                      <span className="text-xs">Attendant handles heavy transfers / bathing (Relieves Lumbar Strain)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={handlesMeds}
                        onChange={(e) => setHandlesMeds(e.target.checked)}
                        className="rounded text-primary"
                      />
                      <span className="text-xs">Attendant handles medications, catheter/wound care & nursing hygiene</span>
                    </label>
                  </div>
                </div>

                {/* SECTION 5: MONTHLY ROTATION POLICY & RESPITE SCHEDULE */}
                <div className="space-y-3 p-3.5 rounded-2xl border border-border/70 bg-card">
                  <p className="font-bold text-foreground uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-primary" /> 5. Monthly Rotation Policy & Respite Schedule
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Rotation Interval</Label>
                      <select
                        value={rotationInterval}
                        onChange={(e) => setRotationInterval(e.target.value as any)}
                        className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
                      >
                        <option value="weekly">Weekly Shift Swap</option>
                        <option value="biweekly">Bi-Weekly Rotation (Recommended)</option>
                        <option value="monthly">Monthly Fixed Rota</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Primary Respite Days / Month</Label>
                      <Input
                        type="number"
                        value={respiteDaysPerMonth}
                        onChange={(e) => setRespiteDaysPerMonth(Number(e.target.value))}
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Weekend Shift Leader</Label>
                      <Input
                        value={weekendLeader}
                        onChange={(e) => setWeekendLeader(e.target.value)}
                        placeholder="e.g. Primary Caregiver or Relative"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-3">
                      <Label className="text-xs">Night Watch Arrangement</Label>
                      <select
                        value={nightArrangement}
                        onChange={(e) => setNightArrangement(e.target.value as MonthlyRotationPolicy['nightShiftArrangement'])}
                        className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
                      >
                        <option value="primary_solo">Primary caregiver alone (highest burnout risk)</option>
                        <option value="family_rotation">Family members rotate the night watch</option>
                        <option value="formal_night_nurse">Paid night nurse</option>
                        <option value="formal_24h_staff">24h live-in staff cover the night</option>
                      </select>
                      <p className="text-[10px] text-muted-foreground">
                        Sets who the roster puts on the 22:00–06:00 block first.
                      </p>
                    </div>
                  </div>
                </div>

                {/* SECTION 6: EMERGENCY & HOSPITAL LOGISTICS ACCESSIBILITY */}
                <div className="space-y-3 p-3.5 rounded-2xl border border-red-500/30 bg-red-500/5">
                  <p className="font-bold text-red-700 dark:text-red-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Car className="w-3.5 h-3.5 text-red-600" /> 6. Emergency Logistics & Hospital Accessibility Infrastructure
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Distance to Nearest Hospital (km)</Label>
                      <Input
                        type="number"
                        step="0.5"
                        value={hospitalDistanceKm}
                        onChange={(e) => setHospitalDistanceKm(Number(e.target.value))}
                        className="h-8 text-xs font-mono"
                        placeholder="e.g. 4.5"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Estimated Transit Time (Mins)</Label>
                      <Input
                        type="number"
                        value={travelTimeMinutes}
                        onChange={(e) => setTravelTimeMinutes(Number(e.target.value))}
                        className="h-8 text-xs font-mono"
                        placeholder="e.g. 15"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">4-Wheeler (Car) at Home?</Label>
                      <select
                        value={fourWheelerAvailable ? 'yes' : 'no'}
                        onChange={(e) => setFourWheelerAvailable(e.target.value === 'yes')}
                        className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs font-bold"
                      >
                        <option value="yes">Yes (4-Wheeler Available at Home)</option>
                        <option value="no">No (Requires Auto / Cab on-call)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div className="space-y-1">
                      <Label className="text-xs">Designated Emergency Driver</Label>
                      <Input
                        value={emergencyDriver}
                        onChange={(e) => setEmergencyDriver(e.target.value)}
                        placeholder="e.g. Caregiver or Key Holder"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Preferred Emergency Hospital</Label>
                      <Input
                        value={preferredHospital}
                        onChange={(e) => setPreferredHospital(e.target.value)}
                        placeholder="e.g. AIIMS Geriatric Center"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Ambulance / Helpline</Label>
                      <Input
                        value={ambulanceContact}
                        onChange={(e) => setAmbulanceContact(e.target.value)}
                        placeholder="e.g. 108"
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="pt-2 border-t border-border/50">
                <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)} className="text-xs">
                  Cancel
                </Button>
                <Button type="button" size="sm" onClick={handleSaveModal} disabled={isSaving} className="text-xs font-bold bg-primary gap-1.5 shadow-sm">
                  <Sparkles className="w-3.5 h-3.5" />
                  {isSaving ? 'Saving Matrix…' : 'Prescribe & Save Monthly Matrix'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="p-5 sm:p-6 space-y-6">
        {/* DATA PROVENANCE GATE.
            Clinical figures below are computed from the stored dyad. Until both records exist
            they would be derived from neutral placeholders, so say so plainly rather than
            rendering a demand figure and lifting index a clinician could act on. */}
        {!isDyadDocumented && (
          <div className="p-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 space-y-1">
            <p className="text-sm font-bold text-amber-800 dark:text-amber-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Dyad not documented yet — figures below are not clinical
            </p>
            <p className="text-xs text-amber-900/80 dark:text-amber-200/80">
              {!hasPatientProfile && !hasCaregiverProfile
                ? 'No patient profile and no caregiver matrix are on file for this dyad.'
                : !hasPatientProfile
                ? 'No patient ADL/IADL profile is on file, so care demand cannot be estimated.'
                : 'No caregiver matrix is on file, so capacity and burnout risk cannot be estimated.'}{' '}
              Use <strong>Configure Matrix</strong> to record it. Roster exports stay disabled until then.
            </p>
          </div>
        )}

        {/* ROW 1: FOUR GENEROUSLY-SPACED KEY METRIC CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Primary Caregiver */}
          <div className="p-4 sm:p-5 rounded-2xl border border-border/70 bg-card space-y-2.5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-primary" /> Primary Caregiver
              </span>
              <div className="flex items-center gap-1.5">
                <Badge variant="outline" className="text-[10px] font-mono capitalize">
                  {currentCaregiver.kinship.replace('_', ' ')}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setOpen(true)}
                  className="h-6 w-6 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full"
                  title="Edit Caregiver Personal & Medical Details"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span className="sr-only">Edit Caregiver</span>
                </Button>
              </div>
            </div>
            <div>
              <p className="text-base font-bold text-foreground">
                {currentCaregiver.name}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {currentCaregiver.age} yrs • {currentCaregiver.coResidence.replace('_', ' ')} • {currentCaregiver.dailyHoursCommitted}h/day committed
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1 border-t border-border/50">
              {currentCaregiver.caregiverHealth.hasBackPain && (
                <Badge variant="outline" className="text-[10px] font-bold text-amber-700 dark:text-amber-300 border-amber-500/30 bg-amber-500/10">
                  Lumbar Strain
                </Badge>
              )}
              {currentCaregiver.caregiverHealth.hasInsomnia && (
                <Badge variant="outline" className="text-[10px] font-bold text-purple-700 dark:text-purple-300 border-purple-500/30 bg-purple-500/10">
                  Sleep Strain
                </Badge>
              )}
              {currentCaregiver.caregiverHealth.hasHypertension && (
                <Badge variant="outline" className="text-[10px] font-bold text-rose-700 dark:text-rose-300 border-rose-500/30 bg-rose-500/10">
                  Hypertension
                </Badge>
              )}
              {currentCaregiver.caregiverHealth.hasArthritis && (
                <Badge variant="outline" className="text-[10px] font-bold text-orange-700 dark:text-orange-300 border-orange-500/30 bg-orange-500/10">
                  Arthritis
                </Badge>
              )}
              {currentCaregiver.caregiverHealth.hasDiabetes && (
                <Badge variant="outline" className="text-[10px] font-bold text-cyan-700 dark:text-cyan-300 border-cyan-500/30 bg-cyan-500/10">
                  Diabetes T2
                </Badge>
              )}
              {currentCaregiver.employment === 'full_time' && (
                <Badge variant="outline" className="text-[10px] font-bold text-blue-700 dark:text-blue-300 border-blue-500/30 bg-blue-500/10">
                  Full-Time Job
                </Badge>
              )}
            </div>
            {currentCaregiver.notes && (
              <p className="text-[11px] text-muted-foreground italic bg-muted/40 px-2.5 py-1.5 rounded-lg border border-border/40 line-clamp-2" title={currentCaregiver.notes}>
                &ldquo;{currentCaregiver.notes}&rdquo;
              </p>
            )}
            <div className="pt-0.5">
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="text-[11px] font-semibold text-primary hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="w-3 h-3" /> Edit Personal & Medical Details
              </button>
            </div>
          </div>

          {/* Card 2: Secondary Family Network */}
          <div className="p-4 sm:p-5 rounded-2xl border border-border/70 bg-card space-y-2.5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
                <HeartHandshake className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Family Support Network
              </span>
            </div>
            <div>
              <p className="text-base font-bold text-foreground">
                {(currentCaregiver.secondaryMembers?.length ?? 0) > 0
                  ? `${currentCaregiver.secondaryMembers?.length} ${currentCaregiver.secondaryMembers?.length === 1 ? 'Helper' : 'Helpers'} Pooled`
                  : currentCaregiver.otherFamilyMembersCount
                  ? `${currentCaregiver.otherFamilyMembersCount} ${currentCaregiver.otherFamilyMembersCount === 1 ? 'Family Helper' : 'Family Helpers'}`
                  : 'Solo Caregiver (0 Helpers)'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Estimated relief: <strong className="text-foreground">{currentEval.familySupportAbsorbedHours.toFixed(1)}h/day</strong>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-border/50">
              {currentCaregiver.secondaryMembers && currentCaregiver.secondaryMembers.length > 0 ? (
                currentCaregiver.secondaryMembers.map((m) => (
                  <Badge key={m.id} variant="secondary" className="text-[10px] font-semibold">
                    {m.name || m.relationship}: {m.hoursPerDay}h
                  </Badge>
                ))
              ) : currentCaregiver.otherFamilyMembersCount && currentCaregiver.otherFamilyMembersCount > 0 ? (
                <span className="text-[11px] text-muted-foreground font-medium">
                  {currentCaregiver.otherFamilyMembersCount} informal {currentCaregiver.otherFamilyMembersCount === 1 ? 'member' : 'members'} (shift unallocated)
                </span>
              ) : (
                <span className="text-[11px] text-amber-600 font-semibold">No helpers pooled</span>
              )}
            </div>
          </div>

          {/* Card 3: Assistive Bed & Equipment */}
          <div className="p-4 sm:p-5 rounded-2xl border border-indigo-500/30 bg-indigo-500/5 space-y-2.5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-bold tracking-wider flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300">
                <Bed className="w-4 h-4 text-indigo-600" /> Assistive Equipment
              </span>
            </div>
            <div>
              <p className="text-base font-bold text-foreground capitalize">
                {currentEval.assistiveDeviceStatus.hasHospitalBed
                  ? currentEval.assistiveDeviceStatus.bedType.replace('_', ' ')
                  : 'Standard Bed'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Manual-handling relief estimate:{' '}
                {currentEval.assistiveDeviceStatus.ergonomicInjuryDiscountPercent > 0 ? (
                  <strong className="text-indigo-600 dark:text-indigo-400">
                    -{currentEval.assistiveDeviceStatus.ergonomicInjuryDiscountPercent}%
                  </strong>
                ) : (
                  <span className="text-muted-foreground font-medium">0% (Standard gear)</span>
                )}
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1 border-t border-indigo-500/20">
              {currentEval.assistiveDeviceStatus.hasAirWaterMattress ? (
                <Badge className="bg-indigo-600 text-white text-[10px] font-bold">Ripple Mattress</Badge>
              ) : (
                <span className="text-[11px] text-muted-foreground">Standard mattress</span>
              )}
            </div>
          </div>

          {/* Card 4: Care Equilibrium & Burnout Risk */}
          <div className="p-4 sm:p-5 rounded-2xl border border-border/70 bg-card space-y-2.5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-primary" /> Care Gap Estimate
              </span>
              <Badge
                className={cn(
                  'text-[10px] font-bold uppercase',
                  currentEval.caregiverBurnoutRiskLevel === 'critical'
                    ? 'bg-red-600 text-white'
                    : currentEval.caregiverBurnoutRiskLevel === 'high'
                    ? 'bg-amber-600 text-white'
                    : currentEval.caregiverBurnoutRiskLevel === 'moderate'
                    ? 'bg-blue-600 text-white'
                    : 'bg-emerald-600 text-white'
                )}
              >
                {currentEval.caregiverBurnoutRiskLevel} Risk
              </Badge>
            </div>
            <div>
              <p className={cn('text-base font-black font-mono', currentEval.netCareGapHours > 0 ? 'text-red-600' : 'text-emerald-600')}>
                {currentEval.netCareGapHours > 0 ? `${currentEval.netCareGapHours.toFixed(1)}h Deficit` : 'No Estimated Gap'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Manual-handling risk flag: <strong className="text-foreground font-mono">{currentEval.caregiverInjuryRiskScore}%</strong>
              </p>
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden mt-1">
              <div
                className={cn(
                  'h-full transition-all rounded-full',
                  currentEval.caregiverInjuryRiskScore > 50 ? 'bg-red-500' : 'bg-emerald-500'
                )}
                style={{ width: `${Math.min(100, currentEval.caregiverInjuryRiskScore)}%` }}
              />
            </div>
          </div>
        </div>

        {/* ROW 1b: ALLOCATED SHIFT ROSTER */}
        {roster && (
          <div className="p-5 rounded-2xl bg-muted/30 border border-border/70 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <span className="text-sm font-bold text-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                Allocated Shift Roster ({roster.cycleDays}-day rotation)
              </span>
              <span className="text-[11px] text-muted-foreground">
                Generated from designated responsibilities, availability windows and committed hours.
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              {rosterBlockOrder.map((blockKey) => {
                const meta = DIURNAL_BLOCK_META[blockKey];
                const shifts = roster.blocks[blockKey];
                const gaps = roster.uncoveredGaps.filter((g) => g.block === blockKey);
                return (
                  <div key={blockKey} className="p-3 rounded-xl bg-card border border-border/60 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <span aria-hidden>{meta.icon}</span> {meta.label}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground">{meta.timeRange}</span>
                    </div>

                    {shifts.length === 0 ? (
                      <p className="text-[11px] text-muted-foreground italic">No one rostered.</p>
                    ) : (
                      <ul className="space-y-1.5">
                        {shifts.map((shift, i) => (
                          <li key={`${shift.assignedMemberId}-${i}`} className="space-y-0.5">
                            <div className="flex items-baseline justify-between gap-2">
                              <span className="text-[11px] font-semibold text-foreground truncate">
                                {shift.assignedMemberName || 'Unnamed member'}
                              </span>
                              <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                                {shift.hoursAllocated}h
                              </span>
                            </div>
                            <p className="text-[10px] text-muted-foreground capitalize">
                              {shift.role.replace(/_/g, ' ')} ·{' '}
                              {shift.assignedTasks.length > 0
                                ? shift.assignedTasks.map((t) => t.replace(/_/g, ' ')).join(', ')
                                : 'supervision & presence'}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}

                    {gaps.length > 0 && (
                      <div className="pt-1.5 border-t border-border/50 space-y-1">
                        {gaps.map((g, i) => (
                          <p
                            key={`${g.task}-${i}`}
                            className="text-[10px] text-red-600 dark:text-red-400 font-semibold flex items-start gap-1"
                          >
                            <AlertTriangle className="w-3 h-3 mt-px shrink-0" />
                            <span className="capitalize">
                              {g.kind === 'unowned_task'
                                ? `${g.task.replace(/_/g, ' ')} — no eligible owner (${g.unmetHours}h)`
                                : `${g.unmetHours}h uncovered care deficit`}
                            </span>
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {roster.memberLoadSummary.length > 0 && (
              <div className="pt-1 flex flex-wrap gap-1.5">
                {roster.memberLoadSummary.map((m) => (
                  <Badge
                    key={m.memberId}
                    variant="outline"
                    className="text-[10px] font-semibold gap-1"
                    title={m.peakLiftingRisk}
                  >
                    {m.name || 'Unnamed'} · {m.dailyHours}h/day · {m.assignedBlocks.length} block
                    {m.assignedBlocks.length === 1 ? '' : 's'}
                  </Badge>
                ))}
              </div>
            )}

            {roster.respiteOrders.length > 0 && (
              <p className="text-[11px] text-muted-foreground">
                <strong className="text-foreground">Respite:</strong> {roster.respiteOrders.length} relief day
                {roster.respiteOrders.length === 1 ? '' : 's'} per month on day
                {roster.respiteOrders.length === 1 ? ' ' : 's '}
                {roster.respiteOrders.map((r) => r.dayNumber).join(', ')} ·{' '}
                {DIURNAL_BLOCK_META[roster.respiteOrders[0].block].label}.
              </p>
            )}
          </div>
        )}

        {/* ROW 2: VISUAL STACKED ALLOCATION BAR */}
        <div className="p-5 rounded-2xl bg-muted/30 border border-border/70 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span className="text-sm font-bold text-foreground flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Patient Care Demand Distribution ({currentEval.patientCareDemandHours} hrs/day estimate)
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              Estimated capacity: Primary ({currentEval.teamAllocations.primaryCaregiverHours}h) + Formal ({currentEval.teamAllocations.formalStaffHours}h) + Family ({currentEval.teamAllocations.secondaryFamilyHours}h)
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <EvidenceLevelBadge provenance={CLINICAL_PROVENANCE.careGapHeuristic} label="Care Demand Heuristic" />
            <EvidenceLevelBadge provenance={CLINICAL_PROVENANCE.staffingHeuristic} label="Staffing Model" />
            {currentEval.dataQuality.status !== 'ready_for_clinician_review' && (
              <Badge variant="outline" className="text-[10px] font-bold border-amber-500/40 text-amber-700 dark:text-amber-300">
                {currentEval.dataQuality.status.replace(/_/g, ' ')}
              </Badge>
            )}
            {dataQualityItems.length > 0 && (
              <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
                • Verify unconfirmed inputs with clinician before plan adoption
              </span>
            )}
          </div>

          <div className="w-full h-5 rounded-full bg-muted overflow-hidden flex shadow-inner">
            {primaryPct > 0 && (
              <div
                className="bg-purple-500 hover:bg-purple-600 transition-all flex items-center justify-center text-[10px] font-bold text-white"
                style={{ width: `${primaryPct}%` }}
                title={`Primary Caregiver: ${currentEval.teamAllocations.primaryCaregiverHours}h`}
              >
                {primaryPct > 10 ? `${primaryPct}% Primary` : ''}
              </div>
            )}
            {formalPct > 0 && (
              <div
                className="bg-emerald-500 hover:bg-emerald-600 transition-all flex items-center justify-center text-[10px] font-bold text-white"
                style={{ width: `${formalPct}%` }}
                title={`Formal Staff: ${currentEval.teamAllocations.formalStaffHours}h`}
              >
                {formalPct > 10 ? `${formalPct}% Staff` : ''}
              </div>
            )}
            {familyPct > 0 && (
              <div
                className="bg-blue-500 hover:bg-blue-600 transition-all flex items-center justify-center text-[10px] font-bold text-white"
                style={{ width: `${familyPct}%` }}
                title={`Secondary Family: ${currentEval.teamAllocations.secondaryFamilyHours}h`}
              >
                {familyPct > 10 ? `${familyPct}% Family` : ''}
              </div>
            )}
            {unmetPct > 0 && (
              <div
                className="bg-red-500 hover:bg-red-600 transition-all flex items-center justify-center text-[10px] font-bold text-white"
                style={{ width: `${unmetPct}%` }}
                title={`Unmet Care Gap: ${currentEval.teamAllocations.unmetGapHours}h`}
              >
                {unmetPct > 10 ? `${unmetPct}% Gap` : ''}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
            <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
              <span className="w-3 h-3 rounded-full bg-purple-500" />
              Primary Caregiver ({currentEval.teamAllocations.primaryCaregiverHours}h)
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              Formal Attendant ({currentEval.teamAllocations.formalStaffHours}h)
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
              <span className="w-3 h-3 rounded-full bg-blue-500" />
              Secondary Family ({currentEval.teamAllocations.secondaryFamilyHours}h)
            </span>
            {currentEval.teamAllocations.unmetGapHours > 0 && (
              <span className="flex items-center gap-1.5 font-bold text-red-600 dark:text-red-400">
                <span className="w-3 h-3 rounded-full bg-red-500" />
                Unmet Gap ({currentEval.teamAllocations.unmetGapHours}h Deficit)
              </span>
            )}
          </div>
        </div>

        {/* ROW 3: TASK DELEGATION MATRIX GRID & EMERGENCY READINESS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Col 1 & 2: Task Delegation Grid */}
          <div className="lg:col-span-2 space-y-3">
            <p className="text-sm font-bold font-headline text-foreground flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-primary" /> Task Delegation & Diurnal Shift Coverage
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Task 1: Bed-to-Chair Transfers */}
              <div className="p-4 rounded-2xl border border-border/70 bg-card space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold flex items-center gap-1.5">
                    <span>💪</span> Bed-to-Chair Transfers
                  </span>
                  {currentEval.taskDelegationStatus.transfersCovered ? (
                    <Badge className="bg-emerald-600 text-white text-[10px] font-bold">Relieved</Badge>
                  ) : (
                    <Badge className="bg-red-600 text-white text-[10px] font-bold">Spine Risk</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {currentEval.taskDelegationStatus.transfersCovered
                    ? `Covered by: ${currentEval.taskDelegationStatus.transfersCoveredBy.join(', ')}`
                    : 'Performed solo by primary caregiver (Causes acute lumbar strain)'}
                </p>
              </div>

              {/* Task 2: Sponge Bathing & Hygiene */}
              <div className="p-4 rounded-2xl border border-border/70 bg-card space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold flex items-center gap-1.5">
                    <span>🛁</span> Bathing & Diapering
                  </span>
                  {currentEval.taskDelegationStatus.bathingCovered ? (
                    <Badge className="bg-emerald-600 text-white text-[10px] font-bold">Shared</Badge>
                  ) : (
                    <Badge variant="outline" className="text-amber-600 text-[10px]">Solo</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {currentEval.taskDelegationStatus.bathingCovered
                    ? `Covered by: ${currentEval.taskDelegationStatus.bathingCoveredBy.join(', ')}`
                    : 'Solely managed by primary caregiver'}
                </p>
              </div>

              {/* Task 3: Medications & Vitals */}
              <div className="p-4 rounded-2xl border border-border/70 bg-card space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold flex items-center gap-1.5">
                    <span>💊</span> Medications & Clinical Logs
                  </span>
                  {currentEval.taskDelegationStatus.medicationsCovered ? (
                    <Badge className="bg-emerald-600 text-white text-[10px] font-bold">Covered</Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground text-[10px]">Primary Caregiver</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {currentEval.taskDelegationStatus.medicationsCovered
                    ? `Covered by: ${currentEval.taskDelegationStatus.medicationsCoveredBy.join(', ')}`
                    : 'Administered by primary caregiver'}
                </p>
              </div>

              {/* Task 4: Night Watch & Sleep Protection */}
              <div className="p-4 rounded-2xl border border-border/70 bg-card space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold flex items-center gap-1.5">
                    <span>🌙</span> Night Watch / 24h Care
                  </span>
                  {currentEval.taskDelegationStatus.nightCareCovered ? (
                    <Badge className="bg-emerald-600 text-white text-[10px] font-bold">Protected</Badge>
                  ) : (
                    <Badge className="bg-purple-600 text-white text-[10px] font-bold">Sleep Disrupted</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {currentEval.taskDelegationStatus.nightCareCovered
                    ? `Covered by: ${currentEval.taskDelegationStatus.nightCareCoveredBy.join(', ')}`
                    : 'No nocturnal attendant; primary caregiver woken 3+ times'}
                </p>
              </div>
            </div>
          </div>

          {/* Col 3: Emergency Transit Readiness */}
          <div className="space-y-3">
            <p className="text-sm font-bold font-headline text-foreground flex items-center gap-2">
              <Car className="w-4 h-4 text-red-600" /> Emergency Transit Readiness
            </p>

            <div className="p-4 sm:p-5 rounded-2xl border border-red-500/30 bg-red-500/5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground">Nearest Hospital:</span>
                <span className="text-sm font-bold font-mono text-foreground">
                  {currentCaregiver.emergencyLogistics?.hospitalDistanceKm ?? 4.5} km ({currentCaregiver.emergencyLogistics?.travelTimeMinutes ?? 15} mins)
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground">4-Wheeler at Home:</span>
                {currentCaregiver.emergencyLogistics?.fourWheelerAvailableAtHome ? (
                  <Badge className="bg-emerald-600 text-white text-[10px] font-bold">Vehicle Parked</Badge>
                ) : (
                  <Badge className="bg-red-600 text-white text-[10px] font-bold">No Car (Cab Dependent)</Badge>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground">Emergency Driver:</span>
                <span className="text-xs font-bold text-foreground">
                  {currentCaregiver.emergencyLogistics?.designatedEmergencyDriver?.trim() ||
                    (currentCaregiver.name ? `${currentCaregiver.name} (Caregiver)` : 'Not designated')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>

      {/* WHATSAPP CARE DIGEST MODAL */}
      <Dialog open={isWhatsAppOpen} onOpenChange={setIsWhatsAppOpen}>
        <DialogContent className="w-[95vw] sm:max-w-xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
              <Share2 className="w-5 h-5" />
              WhatsApp Care Circle Plan & Roster Digest
            </DialogTitle>
            <DialogDescription className="text-xs">
              Instant summary formatted with shift allocations, respite days, and emergency contacts for the family WhatsApp group.
            </DialogDescription>
          </DialogHeader>
          <div className="p-3 bg-muted rounded-xl font-mono text-xs whitespace-pre-wrap max-h-[50vh] overflow-y-auto border border-border/60 select-all">
            {whatsAppText}
          </div>
          <DialogFooter className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={handleCopyWhatsAppText} className="text-xs gap-1.5 font-bold w-full sm:w-auto">
              <Copy className="w-3.5 h-3.5" /> Copy Text
            </Button>
            <Button size="sm" onClick={handleOpenWhatsAppUrl} className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 w-full sm:w-auto">
              <ExternalLink className="w-3.5 h-3.5" /> Open in WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 1-PAGE BEDSIDE WALL SHEET PRINT PREVIEW MODAL */}
      <Dialog open={isPrintSheetOpen} onOpenChange={setIsPrintSheetOpen}>
        <DialogContent className="w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Printer className="w-5 h-5 text-primary" />
              1-Page Printable Bedside Care Roster
            </DialogTitle>
            <DialogDescription className="text-xs">
              High-contrast, large-print care instructions sheet designed to be taped on the patient's bedroom wall or kitchen refrigerator.
            </DialogDescription>
          </DialogHeader>

          <div id="bedside-wall-sheet" className="p-6 bg-white text-slate-900 rounded-2xl border-2 border-slate-900 space-y-4 font-sans text-xs">
            <div className="flex items-start justify-between border-b-2 border-slate-900 pb-3">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight text-slate-900">
                  Sanjeevani Bedside Care Plan & Shift Roster
                </h2>
                <p className="text-xs font-bold text-slate-600">
                  Patient: {currentPatient.name} (Age {currentPatient.age}) • Primary: {currentCaregiver.name} ({currentCaregiver.kinship})
                </p>
              </div>
              <div className="text-right font-mono text-[11px] font-bold">
                <span className="p-1 rounded bg-slate-900 text-white">EMERGENCY 108</span>
              </div>
            </div>

            {/* Emergency Hospital Banner */}
            <div className="p-3 bg-red-50 border-2 border-red-500 rounded-xl flex items-center justify-between text-xs font-bold text-red-900">
              <div>
                <span>🚨 EMERGENCY HOSPITAL: </span>
                <span className="text-sm font-black">{currentCaregiver.emergencyLogistics?.preferredHospitalName || 'AIIMS Emergency'}</span>
                <span className="font-normal text-slate-700"> ({currentCaregiver.emergencyLogistics?.hospitalDistanceKm} km / {currentCaregiver.emergencyLogistics?.travelTimeMinutes} mins)</span>
              </div>
              <div>
                <span>DRIVER: {currentCaregiver.emergencyLogistics?.designatedEmergencyDriver?.trim() || currentCaregiver.name || 'Not designated'}</span>
              </div>
            </div>

            {/* Daily Schedule Grids */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 border border-slate-300 rounded-xl space-y-1.5 bg-slate-50">
                <p className="font-black uppercase tracking-wider text-slate-900 text-[11px] flex items-center gap-1">
                  <Sunrise className="w-3.5 h-3.5 text-amber-600" /> Morning Routine (07:00 - 10:00)
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-slate-800 text-[11px]">
                  <li>Check blood pressure & morning sugar</li>
                  <li>Sponge bath, diaper change & skin inspection</li>
                  <li>Pivot transfer with belt to armchair</li>
                  <li>Morning medications with breakfast</li>
                </ul>
              </div>

              <div className="p-3 border border-slate-300 rounded-xl space-y-1.5 bg-slate-50">
                <p className="font-black uppercase tracking-wider text-slate-900 text-[11px] flex items-center gap-1">
                  <Moon className="w-3.5 h-3.5 text-purple-600" /> Night Watch Routine (22:00 - 06:00)
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-slate-800 text-[11px]">
                  <li>2-hourly repositioning & ripple mattress check</li>
                  <li>Night diaper check & fluid intake stop at 20:00</li>
                  <li>Bed rails locked & night light on for sundowning</li>
                  <li>Lead: {currentCaregiver.rotationPolicy?.nightShiftArrangement?.replace(/_/g, ' ') || 'Family Rotation'}</li>
                </ul>
              </div>
            </div>

            {/* Assistive Devices in Room */}
            <div className="p-3 border border-slate-300 rounded-xl bg-slate-50 space-y-1">
              <p className="font-bold uppercase text-[10px] text-slate-600">Equipment in Room:</p>
              <p className="text-xs text-slate-900 font-semibold">
                {[
                  currentEval.assistiveDeviceStatus.hasHospitalBed ? `Hospital Bed (${currentEval.assistiveDeviceStatus.bedType.replace('_', ' ')})` : 'Standard Bed',
                  currentEval.assistiveDeviceStatus.hasAirWaterMattress ? 'Alternating Ripple Mattress' : null,
                  currentEval.assistiveDeviceStatus.hasWheelchair ? 'Wheelchair' : null,
                  currentEval.assistiveDeviceStatus.hasSuctionApparatus ? 'Suction Machine' : null,
                  currentEval.assistiveDeviceStatus.hasTransferAids ? 'Transfer Gait Belt' : null
                ].filter(Boolean).join(' • ')}
              </p>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              size="sm"
              onClick={() => {
                window.print();
              }}
              className="text-xs font-bold gap-1.5 bg-primary"
            >
              <Printer className="w-3.5 h-3.5" /> Print Bedside Wall Sheet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
