'use client';

import { useState } from 'react';
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
  Wand2
} from 'lucide-react';
import {
  CaregiverAttributes,
  PatientDependenceProfile,
  CareGapEngine,
  FormalSupportType,
  SecondaryFamilyMember,
  CareTask,
  EmergencyLogistics,
  MonthlyRotationPolicy
} from '@/lib/clinical/care-gap-engine';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface CaregiverSupportMatrixProps {
  patientUid: string;
  caregiver: CaregiverAttributes | null;
  patient: PatientDependenceProfile | null;
  onSave: (attrs: CaregiverAttributes) => Promise<void>;
}

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
          hasPhysicalLimitation: false
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
    caregiver?.rotationPolicy?.weekendShiftLeader || 'Son Rahul'
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
    caregiver?.emergencyLogistics?.designatedEmergencyDriver || 'Son Rahul'
  );
  const [preferredHospital, setPreferredHospital] = useState(
    caregiver?.emergencyLogistics?.preferredHospitalName || 'AIIMS Geriatric Emergency Wing'
  );
  const [ambulanceContact, setAmbulanceContact] = useState(
    caregiver?.emergencyLogistics?.ambulanceContact || '108 / 102 (National Helpline)'
  );

  // Formal Support Form State
  const [supportType, setSupportType] = useState<FormalSupportType>(caregiver?.formalSupport?.type || 'none');
  const [supportHours, setSupportHours] = useState(caregiver?.formalSupport?.hoursPerDay || 0);
  const [handlesTransfers, setHandlesTransfers] = useState(caregiver?.formalSupport?.handlesHeavyTransfers || false);
  const [handlesMeds, setHandlesMeds] = useState(caregiver?.formalSupport?.handlesMedicationWoundCare || false);

  // Caregiver Health Constraints
  const [hasBackPain, setHasBackPain] = useState(caregiver?.caregiverHealth?.hasBackPain || false);
  const [hasHypertension, setHasHypertension] = useState(caregiver?.caregiverHealth?.hasHypertension || false);
  const [hasArthritis, setHasArthritis] = useState(caregiver?.caregiverHealth?.hasArthritis || false);
  const [hasInsomnia, setHasInsomnia] = useState(caregiver?.caregiverHealth?.hasInsomnia || false);

  // Current Saved Caregiver & Evaluation
  const currentCaregiver: CaregiverAttributes = caregiver || {
    name: 'Primary Caregiver',
    age: 54,
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
    dailyHoursCommitted: 8,
    monthlyOutOfPocketBurden: 'manageable',
    formalTrainingReceived: false,
    secondaryMembers: [],
    emergencyLogistics: {
      hospitalDistanceKm: 4.5,
      travelTimeMinutes: 15,
      fourWheelerAvailableAtHome: true,
      vehicleDetails: 'Sedan (Parked at Home)',
      designatedEmergencyDriver: 'Son Rahul',
      preferredHospitalName: 'AIIMS Geriatric Center',
      ambulanceContact: '108'
    },
    rotationPolicy: {
      rotationInterval: 'biweekly',
      primaryCaregiverRespiteDaysPerMonth: 4,
      weekendShiftLeader: 'Son Rahul',
      nightShiftArrangement: 'family_rotation'
    },
    formalSupport: {
      type: 'none',
      hoursPerDay: 0,
      handlesHeavyTransfers: false,
      handlesMedicationWoundCare: false
    }
  };

  const currentEval = CareGapEngine.evaluate(currentCaregiver, patient);

  // Live Simulated Caregiver
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
      hasDiabetes: false,
      hasInsomnia
    },
    formalSupport: {
      type: supportType,
      hoursPerDay: Number(supportHours) || 0,
      handlesHeavyTransfers: handlesTransfers,
      handlesMedicationWoundCare: handlesMeds
    }
  };

  const simulatedEval = CareGapEngine.evaluate(simulatedCaregiver, patient);

  const handleSupportTypeChange = (type: FormalSupportType) => {
    setSupportType(type);
    if (type === 'paid_attendant_12h') {
      setSupportHours(12);
      setHandlesTransfers(true);
    } else if (type === 'paid_attendant_24h') {
      setSupportHours(20);
      setHandlesTransfers(true);
      setHandlesMeds(true);
    } else if (type === 'trained_nurse_12h') {
      setSupportHours(12);
      setHandlesMeds(true);
      setHandlesTransfers(true);
    } else if (type === 'trained_nurse_24h') {
      setSupportHours(20);
      setHandlesMeds(true);
      setHandlesTransfers(true);
    } else if (type === 'none') {
      setSupportHours(0);
      setHandlesTransfers(false);
      setHandlesMeds(false);
    }
  };

  const handleAddSecondaryMember = () => {
    const newMember: SecondaryFamilyMember = {
      id: `sec_${Date.now()}`,
      name: `Family Helper #${secondaryMembers.length + 1}`,
      relationship: 'daughter_in_law',
      age: 26,
      occupation: 'Working Professional',
      workCommitmentSchedule: 'Mon-Fri 10am-5pm',
      careRestrictions: 'Available early morning & night',
      functionalStatus: 'independent',
      hoursPerDay: 2.0,
      assignedTasks: ['medications', 'bathing'],
      hasPhysicalLimitation: false
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

  const handleAutoOptimizeTasks = () => {
    if (secondaryMembers.length === 0) {
      toast({
        title: 'No Family Members to Optimize',
        description: 'Add at least one secondary family member to distribute tasks.'
      });
      return;
    }

    const updated = secondaryMembers.map((m) => {
      const isYounger = m.age < 50 && !m.hasPhysicalLimitation;
      const tasks: CareTask[] = [];

      if (isYounger) {
        tasks.push('heavy_transfers');
        tasks.push('logistics_errands');
      } else {
        tasks.push('medications');
        tasks.push('feeding');
      }
      return { ...m, assignedTasks: tasks };
    });

    setSecondaryMembers(updated);
    toast({
      title: 'Tasks Intelligently Optimized',
      description: 'Heavy lifts assigned to younger capable members to protect primary caregiver lumbar spine.'
    });
  };

  const handleSaveModal = async () => {
    setIsSaving(true);
    try {
      await onSave(simulatedCaregiver);
      setOpen(false);
      toast({
        title: 'Monthly Care Support Matrix Saved',
        description: 'Multi-caregiver team plan, shift rotation rota, and emergency readiness updated.'
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
              ⭐ Core Clinical Pharmacy
            </Badge>
          </div>
          <CardDescription className="text-xs mt-0.5">
            Team building, intelligent skill-matching, monthly rotation policy, and emergency vehicle/hospital readiness.
          </CardDescription>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="default" className="h-8 text-xs gap-1.5 font-bold shrink-0 bg-primary shadow-xs">
              <Edit3 className="w-3.5 h-3.5" /> Configure & Prescribe Monthly Matrix
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Users2 className="w-4 h-4 text-primary" />
                Configure Monthly Care Support Matrix & Team Infrastructure
              </DialogTitle>
              <DialogDescription className="text-xs">
                Pool family members with occupations and restrictions, configure 12h/24h nursing shifts, schedule monthly rotation, and check emergency readiness.
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
                <div className="pt-2 border-t border-border/50">
                  <Label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                    Primary Caregiver Physical Health Constraints (Lumbar / Spine Strain)
                  </Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
                      <input type="checkbox" checked={hasInsomnia} onChange={(e) => setHasInsomnia(e.target.checked)} className="rounded text-primary" />
                      <span className="text-xs">Sleep Strain</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* SECTION 2: SECONDARY FAMILY MEMBERS TEAM POOL & TASK DELEGATION */}
              <div className="space-y-3 p-3.5 rounded-2xl border border-border/70 bg-card">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-foreground uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <HeartHandshake className="w-3.5 h-3.5 text-primary" /> 2. Secondary Family Support Network (Team Building)
                  </p>
                  <div className="flex items-center gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={handleAutoOptimizeTasks} className="h-7 text-xs gap-1 font-bold text-primary border-primary/30">
                      <Wand2 className="w-3 h-3" /> Auto-Distribute Tasks
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
                    {secondaryMembers.map((member) => (
                      <div key={member.id} className="p-3.5 rounded-xl border border-border/80 bg-muted/20 space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 flex-1">
                            <div className="space-y-1">
                              <Label className="text-[10px] text-muted-foreground font-semibold">Helper Name</Label>
                              <Input
                                value={member.name}
                                onChange={(e) => handleUpdateSecondaryMember(member.id, { name: e.target.value })}
                                placeholder="Name (e.g. Son Rahul)"
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

                        {/* Work Constraints & Care Availability */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-border/40 text-[11px]">
                          <div>
                            <Label className="text-[10px] text-muted-foreground">Work Schedule / Commitments:</Label>
                            <Input
                              value={member.workCommitmentSchedule || ''}
                              onChange={(e) => handleUpdateSecondaryMember(member.id, { workCommitmentSchedule: e.target.value })}
                              placeholder="e.g. Mon-Fri 9am-6pm"
                              className="h-6 text-xs"
                            />
                          </div>
                          <div>
                            <Label className="text-[10px] text-muted-foreground">Care Availability / Restrictions:</Label>
                            <Input
                              value={member.careRestrictions || ''}
                              onChange={(e) => handleUpdateSecondaryMember(member.id, { careRestrictions: e.target.value })}
                              placeholder="e.g. Evenings & Weekends Only"
                              className="h-6 text-xs"
                            />
                          </div>
                        </div>

                        {/* Task Assignment Pills */}
                        <div className="space-y-1 pt-1">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                            Designated Tasks for {member.name || 'Member'}:
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
                    ))}
                  </div>
                )}
              </div>

              {/* SECTION 3: FORMAL ATTENDANT & 12H/24H NURSING INFRASTRUCTURE */}
              <div className="space-y-3 p-3.5 rounded-2xl border border-primary/40 bg-primary/5">
                <p className="font-bold text-primary uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  3. Formal Support & Paid Attendant Deployment (12h / 24h Shifts)
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Support Category</Label>
                    <select
                      value={supportType}
                      onChange={(e) => handleSupportTypeChange(e.target.value as FormalSupportType)}
                      className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs font-semibold"
                    >
                      <option value="none">None (100% Family Burden)</option>
                      <option value="paid_attendant_12h">Paid Day Attendant (10–12 Hours/Day)</option>
                      <option value="paid_attendant_24h">Full 24h Live-in Attendant</option>
                      <option value="trained_nurse_12h">Trained Nurse (12h Wound/Meds/Transfers)</option>
                      <option value="trained_nurse_24h">Trained Nurse (24h Intensive Clinical)</option>
                      <option value="medical_assistant">Medical Assistant / Physio Aide</option>
                      <option value="multi_family_rotation">Formal Multi-Family Shift Rota</option>
                    </select>
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

              {/* SECTION 4: MONTHLY ROTATION POLICY & RESPITE SCHEDULE */}
              <div className="space-y-3 p-3.5 rounded-2xl border border-border/70 bg-card">
                <p className="font-bold text-foreground uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-primary" /> 4. Monthly Rotation Policy & Respite Schedule
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
                      placeholder="e.g. Son Rahul"
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 5: EMERGENCY & HOSPITAL LOGISTICS ACCESSIBILITY */}
              <div className="space-y-3 p-3.5 rounded-2xl border border-red-500/30 bg-red-500/5">
                <p className="font-bold text-red-700 dark:text-red-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5 text-red-600" /> 5. Emergency Logistics & Hospital Accessibility Infrastructure
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
                      placeholder="e.g. Son Rahul (Key holder)"
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
      </CardHeader>

      <CardContent className="p-4 sm:p-5 space-y-4">
        {/* ROW 1: FOUR KEY METRIC CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Card 1: Primary Caregiver */}
          <div className="p-3.5 rounded-2xl border border-border/60 bg-card space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-primary" /> Primary Caregiver
            </span>
            <p className="text-sm font-bold text-foreground">
              {currentCaregiver.name} ({currentCaregiver.age} yrs)
            </p>
            <p className="text-xs text-muted-foreground capitalize">
              {currentCaregiver.kinship.replace('_', ' ')} • {currentCaregiver.coResidence.replace('_', ' ')}
            </p>
            <div className="flex flex-wrap gap-1 pt-1">
              {currentCaregiver.caregiverHealth.hasBackPain && (
                <Badge variant="outline" className="text-[9px] text-amber-700 dark:text-amber-300 border-amber-500/30">
                  Lumbar Strain
                </Badge>
              )}
              {currentCaregiver.caregiverHealth.hasInsomnia && (
                <Badge variant="outline" className="text-[9px] text-purple-700 dark:text-purple-300 border-purple-500/30">
                  Sleep Strain
                </Badge>
              )}
              {currentCaregiver.employment === 'full_time' && (
                <Badge variant="outline" className="text-[9px] text-blue-700 dark:text-blue-300 border-blue-500/30">
                  Full-Time Job
                </Badge>
              )}
            </div>
          </div>

          {/* Card 2: Secondary Family Network */}
          <div className="p-3.5 rounded-2xl border border-border/60 bg-card space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1">
              <HeartHandshake className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Family Support Network
            </span>
            <p className="text-sm font-bold text-foreground">
              {(currentCaregiver.secondaryMembers?.length ?? 0) > 0
                ? `${currentCaregiver.secondaryMembers?.length} Helpers Pooled`
                : currentCaregiver.otherFamilyMembersCount
                ? `${currentCaregiver.otherFamilyMembersCount} Helpers`
                : 'Solo Caregiver (0 Helpers)'}
            </p>
            <p className="text-xs text-muted-foreground">
              Absorbs <strong>{currentEval.familySupportAbsorbedHours.toFixed(1)}h/day</strong> of care
            </p>
            <div className="flex flex-wrap gap-1 pt-1">
              {currentCaregiver.secondaryMembers?.map((m) => (
                <Badge key={m.id} variant="secondary" className="text-[9px] font-semibold">
                  {m.name || m.relationship}: {m.hoursPerDay}h
                </Badge>
              ))}
            </div>
          </div>

          {/* Card 3: Formal Staff / Nursing Infrastructure */}
          <div
            className={cn(
              'p-3.5 rounded-2xl border space-y-1.5',
              hasFormalSupport ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-amber-500/30 bg-amber-500/5'
            )}
          >
            <span className="text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 text-muted-foreground">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Formal Attendant Support
            </span>
            <p className="text-sm font-bold text-foreground">
              {hasFormalSupport ? `${currentCaregiver.formalSupport?.hoursPerDay}h/day Paid Support` : 'Solo Family Care'}
            </p>
            <p className="text-xs text-muted-foreground capitalize">
              {currentCaregiver.formalSupport?.type?.replace(/_/g, ' ') || 'None'}
            </p>
            <p className="text-[11px] text-muted-foreground pt-0.5">
              Absorbs <strong>{currentEval.formalSupportAbsorbedHours.toFixed(1)}h/day</strong> clinical/task load
            </p>
          </div>

          {/* Card 4: Care Equilibrium & Burnout Risk Engine */}
          <div className="p-3.5 rounded-2xl border border-border/60 bg-card space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-primary" /> Calculated Care Gap
            </span>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-foreground">
                {currentEval.netCareGapHours > 0 ? `${currentEval.netCareGapHours.toFixed(1)}h Deficit` : 'Sustainable (0h Gap)'}
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
            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden mt-1">
              <div
                className={cn(
                  'h-full transition-all',
                  currentEval.caregiverInjuryRiskScore > 50 ? 'bg-red-500' : 'bg-emerald-500'
                )}
                style={{ width: `${Math.min(100, currentEval.caregiverInjuryRiskScore)}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground block">
              Caregiver Spine / Injury Strain: {currentEval.caregiverInjuryRiskScore}%
            </span>
          </div>
        </div>

        {/* ROW 2: VISUAL STACKED ALLOCATION BAR */}
        <div className="p-4 rounded-2xl bg-muted/30 border border-border/70 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span className="text-xs font-bold text-foreground flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Patient Care Demand Hours Distribution ({currentEval.patientCareDemandHours} hrs/day Total)
            </span>
            <span className="text-[11px] text-muted-foreground">
              Capacity: Primary ({currentEval.teamAllocations.primaryCaregiverHours}h) + Formal Staff ({currentEval.teamAllocations.formalStaffHours}h) + Family ({currentEval.teamAllocations.secondaryFamilyHours}h)
            </span>
          </div>

          <div className="w-full h-4 rounded-xl bg-muted overflow-hidden flex shadow-inner">
            {primaryPct > 0 && (
              <div
                className="bg-purple-500 hover:bg-purple-600 transition-all flex items-center justify-center text-[9px] font-bold text-white"
                style={{ width: `${primaryPct}%` }}
                title={`Primary Caregiver: ${currentEval.teamAllocations.primaryCaregiverHours}h`}
              >
                {primaryPct > 10 ? `${primaryPct}%` : ''}
              </div>
            )}
            {formalPct > 0 && (
              <div
                className="bg-emerald-500 hover:bg-emerald-600 transition-all flex items-center justify-center text-[9px] font-bold text-white"
                style={{ width: `${formalPct}%` }}
                title={`Formal Staff: ${currentEval.teamAllocations.formalStaffHours}h`}
              >
                {formalPct > 10 ? `${formalPct}%` : ''}
              </div>
            )}
            {familyPct > 0 && (
              <div
                className="bg-blue-500 hover:bg-blue-600 transition-all flex items-center justify-center text-[9px] font-bold text-white"
                style={{ width: `${familyPct}%` }}
                title={`Secondary Family: ${currentEval.teamAllocations.secondaryFamilyHours}h`}
              >
                {familyPct > 10 ? `${familyPct}%` : ''}
              </div>
            )}
            {unmetPct > 0 && (
              <div
                className="bg-red-500 hover:bg-red-600 transition-all flex items-center justify-center text-[9px] font-bold text-white"
                style={{ width: `${unmetPct}%` }}
                title={`Unmet Care Gap: ${currentEval.teamAllocations.unmetGapHours}h`}
              >
                {unmetPct > 10 ? `${unmetPct}% Gap` : ''}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px] pt-0.5">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              Primary Caregiver ({currentEval.teamAllocations.primaryCaregiverHours}h)
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Formal Attendant / Nurse ({currentEval.teamAllocations.formalStaffHours}h)
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              Secondary Family ({currentEval.teamAllocations.secondaryFamilyHours}h)
            </span>
            {currentEval.teamAllocations.unmetGapHours > 0 && (
              <span className="flex items-center gap-1.5 font-bold text-red-600 dark:text-red-400">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                Unmet Gap ({currentEval.teamAllocations.unmetGapHours}h Deficit)
              </span>
            )}
          </div>
        </div>

        {/* ROW 3: TASK DELEGATION MATRIX GRID & EMERGENCY READINESS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Col 1 & 2: Task Delegation Grid */}
          <div className="lg:col-span-2 space-y-2">
            <p className="text-xs font-bold text-foreground uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5 text-primary" /> Task Delegation & Clinical Relief Matrix
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Task 1: Bed-to-Chair Transfers */}
              <div className="p-3 rounded-xl border border-border/70 bg-card space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold flex items-center gap-1.5">
                    <span>💪</span> Bed-to-Chair Transfers
                  </span>
                  {currentEval.taskDelegationStatus.transfersCovered ? (
                    <Badge className="bg-emerald-600 text-white text-[9px] font-bold">Relieved</Badge>
                  ) : (
                    <Badge className="bg-red-600 text-white text-[9px] font-bold">Spine Risk</Badge>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {currentEval.taskDelegationStatus.transfersCovered
                    ? `Covered by: ${currentEval.taskDelegationStatus.transfersCoveredBy.join(', ')}`
                    : 'Performed solo by primary caregiver (Causes acute lumbar strain)'}
                </p>
              </div>

              {/* Task 2: Sponge Bathing & Hygiene */}
              <div className="p-3 rounded-xl border border-border/70 bg-card space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold flex items-center gap-1.5">
                    <span>🛁</span> Bathing & Diapering
                  </span>
                  {currentEval.taskDelegationStatus.bathingCovered ? (
                    <Badge className="bg-emerald-600 text-white text-[9px] font-bold">Shared</Badge>
                  ) : (
                    <Badge variant="outline" className="text-amber-600 text-[9px]">Solo</Badge>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {currentEval.taskDelegationStatus.bathingCovered
                    ? `Covered by: ${currentEval.taskDelegationStatus.bathingCoveredBy.join(', ')}`
                    : 'Solely managed by primary caregiver'}
                </p>
              </div>

              {/* Task 3: Medications & Vitals */}
              <div className="p-3 rounded-xl border border-border/70 bg-card space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold flex items-center gap-1.5">
                    <span>💊</span> Medications & Clinical Logs
                  </span>
                  {currentEval.taskDelegationStatus.medicationsCovered ? (
                    <Badge className="bg-emerald-600 text-white text-[9px] font-bold">Covered</Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground text-[9px]">Primary Caregiver</Badge>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {currentEval.taskDelegationStatus.medicationsCovered
                    ? `Covered by: ${currentEval.taskDelegationStatus.medicationsCoveredBy.join(', ')}`
                    : 'Administered by primary caregiver'}
                </p>
              </div>

              {/* Task 4: Night Watch & Sleep Protection */}
              <div className="p-3 rounded-xl border border-border/70 bg-card space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold flex items-center gap-1.5">
                    <span>🌙</span> Night Watch / 24h Care
                  </span>
                  {currentEval.taskDelegationStatus.nightCareCovered ? (
                    <Badge className="bg-emerald-600 text-white text-[9px] font-bold">Protected</Badge>
                  ) : (
                    <Badge className="bg-purple-600 text-white text-[9px] font-bold">Sleep Disrupted</Badge>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {currentEval.taskDelegationStatus.nightCareCovered
                    ? `Night shift covered by: ${currentEval.taskDelegationStatus.nightCareCoveredBy.join(', ')}`
                    : 'Primary caregiver sleep disrupted by nighttime repositioning'}
                </p>
              </div>
            </div>
          </div>

          {/* Col 3: Emergency & Logistics Readiness */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-foreground uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5 text-red-600" /> Emergency Transit Readiness
            </p>

            <div className="p-3.5 rounded-xl border border-border/70 bg-card space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Nearest Hospital:</span>
                <span className="font-bold text-foreground">
                  {currentCaregiver.emergencyLogistics?.hospitalDistanceKm ?? 4.5} km ({currentCaregiver.emergencyLogistics?.travelTimeMinutes ?? 15} mins)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">4-Wheeler at Home:</span>
                {currentCaregiver.emergencyLogistics?.fourWheelerAvailableAtHome ? (
                  <Badge className="bg-emerald-600 text-white text-[9px] font-bold">Vehicle Parked</Badge>
                ) : (
                  <Badge className="bg-red-600 text-white text-[9px] font-bold">No Car (Cab Dependent)</Badge>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Emergency Driver:</span>
                <span className="font-semibold text-foreground">
                  {currentCaregiver.emergencyLogistics?.designatedEmergencyDriver || 'Son Rahul'}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-border/50 text-[11px]">
                <span className="text-muted-foreground">Hospital & Ambulance:</span>
                <span className="font-mono text-primary font-bold">
                  {currentCaregiver.emergencyLogistics?.ambulanceContact || '108'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
