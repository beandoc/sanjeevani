'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Users,
  UserPlus,
  CheckCircle2,
  Clock,
  Share2,
  Copy,
  CalendarCheck,
  Plus,
  ShieldCheck,
  PhoneCall,
  Activity,
  Calendar,
  Sparkles,
  Bed,
  Settings2,
  Wind,
  Accessibility
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HealthRepository, CareCircleMember, CareCircleTask } from '@/lib/db/health-repository';
import { useToast } from '@/hooks/use-toast';
import { useAuthUser } from '@/hooks/use-auth-user';
import {
  CaregiverAttributes,
  PatientDependenceProfile,
  CareGapEngine,
  AssistiveDeviceInventory,
  DEFAULT_ASSISTIVE_DEVICES,
  FormalSupportType,
  generateWhatsAppCareDigest,
  generateCareRosterIcs
} from '@/lib/clinical/care-gap-engine';
import {
  getCaregiverAttributesFor,
  saveCaregiverAttributesFor,
  getPatientProfileFor,
  syncCareCircle,
  getCareCircleFor
} from '@/lib/firebase/clinical-sync';
import { CaregiverSupportMatrix } from '@/components/clinician/caregiver-support-matrix';
import { buildFormalSupport } from '@/lib/clinical/formal-support';
import { Stethoscope, FileSignature, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ClinicalSafetyNote, EvidenceLevelBadge } from '@/components/clinical/evidence-level-badge';
import { CLINICAL_PROVENANCE } from '@/lib/clinical/provenance';

export default function CareCirclePage() {
  const { user } = useAuthUser();
  const { toast } = useToast();

  // Care Matrix & Dyad State
  const [caregiverAttrs, setCaregiverAttrs] = useState<CaregiverAttributes>(() => HealthRepository.getCaregiverAttributes());
  const [patientProfile, setPatientProfile] = useState<PatientDependenceProfile>(() => HealthRepository.getPatientProfile());

  // Care Circle Members & Tasks State
  const [members, setMembers] = useState<CareCircleMember[]>([]);
  const [tasks, setTasks] = useState<CareCircleTask[]>([]);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);

  // Task Form State
  const [taskTitle, setTaskTitle] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [taskTime, setTaskTime] = useState('09:00 AM');
  const [taskCategory, setTaskCategory] = useState<'meds' | 'physio' | 'hygiene' | 'appointment' | 'general'>('general');

  // Invite Form State
  const [newMemberFirstName, setNewMemberFirstName] = useState('');
  const [newMemberLastName, setNewMemberLastName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'Family Member' | 'Home Nurse' | 'Visiting Doctor'>('Family Member');
  const [newMemberPhone, setNewMemberPhone] = useState('');

  const circleInviteCode = 'KUTUMBH-CIRCLE-789';

  // Load dyad profile from Firestore if signed in, fallback to local repository
  useEffect(() => {
    async function loadDyadData() {
      if (user?.uid) {
        try {
          const [remoteAttrs, remoteProfile] = await Promise.all([
            getCaregiverAttributesFor(user.uid),
            getPatientProfileFor(user.uid)
          ]);
          if (remoteAttrs) {
            setCaregiverAttrs(remoteAttrs);
            HealthRepository.saveCaregiverAttributes(remoteAttrs);
          }
          if (remoteProfile) {
            setPatientProfile(remoteProfile);
          }
        } catch (err) {
          console.warn('Could not sync remote care matrix:', err);
        }
      }
    }
    void loadDyadData();
  }, [user]);

  // Load members & tasks. Previously local-storage-only with no Firestore
  // mirror at all, so a member/task added on one device (or by a nurse
  // signed into their own session) was invisible everywhere else, including
  // the doctor's dyad workspace. Cloud copy (when present) is authoritative
  // once signed in, mirroring the pattern used for caregiverAttributes above.
  useEffect(() => {
    let cancelled = false;
    async function loadCircle() {
      const localMembers = HealthRepository.getCareCircleMembers();
      const localTasks = HealthRepository.getCareCircleTasks();
      if (!cancelled) {
        setMembers(localMembers);
        setTasks(localTasks);
        if (localMembers.length > 0 && !assignedTo) setAssignedTo(localMembers[0].name);
      }
      if (!user?.uid) return;
      try {
        const remote = await getCareCircleFor(user.uid);
        if (remote && !cancelled) {
          HealthRepository.saveCareCircleMembers(remote.members);
          HealthRepository.saveCareCircleTasks(remote.tasks);
          setMembers(remote.members);
          setTasks(remote.tasks);
          if (remote.members.length > 0 && !assignedTo) setAssignedTo(remote.members[0].name);
        }
      } catch (err) {
        console.warn('Could not sync remote care circle:', err);
      }
    }
    void loadCircle();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Handle Save from the interactive CaregiverSupportMatrix builder
  const handleSaveMatrix = async (updatedAttrs: CaregiverAttributes, devices?: AssistiveDeviceInventory) => {
    try {
      const mergedAttrs: CaregiverAttributes = {
        ...updatedAttrs,
        assistiveDevices: devices || updatedAttrs.assistiveDevices || DEFAULT_ASSISTIVE_DEVICES
      };

      // 1. Save to local repository
      HealthRepository.saveCaregiverAttributes(mergedAttrs);
      setCaregiverAttrs(mergedAttrs);

      // 2. Save to Firestore so Hospital Doctor / Clinic Roster sees real-time changes
      if (user?.uid) {
        await saveCaregiverAttributesFor(user.uid, mergedAttrs);
      }

      // 3. Keep members list in sync with secondary family members
      if (mergedAttrs.secondaryMembers && mergedAttrs.secondaryMembers.length > 0) {
        const currentMembers = HealthRepository.getCareCircleMembers();
        const newMembersList = [...currentMembers];
        mergedAttrs.secondaryMembers.forEach((sec) => {
          if (!newMembersList.some((m) => m.name.toLowerCase() === sec.name.toLowerCase())) {
            newMembersList.push({
              id: `sec_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
              name: sec.name,
              role: 'Family Member',
              phone: '+91 98000 00000',
              avatarColor: 'bg-indigo-600',
              isSelf: false
            });
          }
        });
        HealthRepository.saveCareCircleMembers(newMembersList);
        setMembers(newMembersList);
        void syncCareCircle(newMembersList, tasks);
      }

      toast({
        title: 'Care Matrix Saved',
        description: 'Your changes are saved. Clinician-facing updates remain decision support until reviewed.',
      });
    } catch (err) {
      console.error('Failed to save care matrix:', err);
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: 'Could not sync matrix updates. Changes kept on your device.'
      });
    }
  };

  const handleToggleTask = (taskId: string) => {
    const updated = HealthRepository.toggleCareCircleTask(taskId);
    setTasks(updated);
    void syncCareCircle(members, updated);
    const task = updated.find((t) => t.id === taskId);
    if (task?.isCompleted) {
      toast({
        title: 'Task Completed',
        description: `"${task.title}" has been marked complete.`,
      });
    }
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    const currentTasks = HealthRepository.getCareCircleTasks();
    const newTask: CareCircleTask = {
      id: `task_${Date.now()}`,
      title: taskTitle.trim(),
      assignedToName: assignedTo || 'Caregiver',
      dueDate: new Date().toISOString().slice(0, 10),
      time: taskTime || '10:00 AM',
      category: taskCategory,
      isCompleted: false,
    };

    const updatedTasks = [newTask, ...currentTasks];
    HealthRepository.saveCareCircleTasks(updatedTasks);
    setTasks(updatedTasks);
    void syncCareCircle(members, updatedTasks);
    setTaskTitle('');
    setIsAddTaskOpen(false);
    toast({
      title: 'Care Task Assigned',
      description: `Task delegated to ${newTask.assignedToName}.`,
    });
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    const fullName = `${newMemberFirstName.trim()} ${newMemberLastName.trim()}`.trim();
    if (!fullName) return;

    const colorList = ['bg-blue-600', 'bg-emerald-600', 'bg-purple-600', 'bg-rose-600', 'bg-amber-600'];
    const randomColor = colorList[Math.floor(Math.random() * colorList.length)];

    const currentMembers = HealthRepository.getCareCircleMembers();
    const newMember: CareCircleMember = {
      id: `member_${Date.now()}`,
      name: fullName,
      role: newMemberRole,
      phone: newMemberPhone.trim() || '+91 98000 00000',
      avatarColor: randomColor,
      isSelf: false,
    };

    const updatedMembers = [...currentMembers, newMember];
    HealthRepository.saveCareCircleMembers(updatedMembers);
    setMembers(updatedMembers);
    void syncCareCircle(updatedMembers, tasks);
    setNewMemberFirstName('');
    setNewMemberLastName('');
    setNewMemberPhone('');
    setIsInviteOpen(false);
    toast({
      title: 'Member Added to Circle',
      description: `${newMember.name} is now part of the collaborative care circle.`,
    });
  };

  const copyInviteLink = () => {
    const inviteUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/care-circle?join=${circleInviteCode}`;
    navigator.clipboard?.writeText(inviteUrl);
    toast({
      title: 'Invite Link Copied',
      description: 'Care Circle invitation link copied to clipboard.',
    });
  };

  const shareViaWhatsApp = () => {
    const inviteUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/care-circle?join=${circleInviteCode}`;
    const text = `Join our family Kutumbh Care Circle to coordinate vitals, shifts and caregiving tasks for our loved one:\n${inviteUrl}\nInvite Code: *${circleInviteCode}*`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  // Evaluate live matrix metrics only when the user has a real dyad profile.
  const hasStoredDyadProfile = HealthRepository.hasStoredDyadProfile();
  const currentEval = hasStoredDyadProfile ? CareGapEngine.evaluate(caregiverAttrs, patientProfile) : null;
  const completedCount = tasks.filter((t) => t.isCompleted).length;
  const secondaryCount = caregiverAttrs.secondaryMembers?.length || 0;
  const respiteDays = caregiverAttrs.rotationPolicy?.primaryCaregiverRespiteDaysPerMonth ?? 4;
  const weekendLead = caregiverAttrs.rotationPolicy?.weekendShiftLeader || 'Family Lead';

  // Export Roster Calendar
  const handleExportIcs = () => {
    try {
      if (!currentEval) {
        toast({
          variant: 'destructive',
          title: 'Complete Patient Setup First',
          description: 'Roster export needs a real patient and caregiver profile, not demo defaults.'
        });
        return;
      }
      const ics = generateCareRosterIcs(caregiverAttrs, patientProfile, currentEval);
      const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `kutumbh_care_roster_${new Date().toISOString().slice(0, 10)}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({
        title: 'iCalendar Roster Exported',
        description: 'Synced with Google Calendar / Apple Calendar.',
      });
    } catch {
      toast({ variant: 'destructive', title: 'Export Failed', description: 'Could not generate calendar file.' });
    }
  };

  const handleApplyDoctorBlueprint = async () => {
    const bp = caregiverAttrs.careBlueprint;
    if (!bp) return;

    const formalTypes: FormalSupportType[] =
      bp.recommendedSupportType !== 'none' && bp.recommendedSupportType !== 'family_redistribution'
        ? [bp.recommendedSupportType as FormalSupportType]
        : [];
    const updatedAttrs: CaregiverAttributes = {
      ...caregiverAttrs,
      formalSupport: buildFormalSupport(formalTypes),
      assistiveDevices: bp.recommendedAssistiveDevices,
      rotationPolicy: {
        ...(caregiverAttrs.rotationPolicy || {
          rotationInterval: 'biweekly',
          primaryCaregiverRespiteDaysPerMonth: 4,
          nightShiftArrangement: 'primary_solo'
        }),
        primaryCaregiverRespiteDaysPerMonth: bp.recommendedRespiteDaysPerMonth
      },
      careBlueprint: {
        ...bp,
        status: 'adopted_by_family'
      }
    };

    HealthRepository.saveCaregiverAttributes(updatedAttrs);
    setCaregiverAttrs(updatedAttrs);
    if (user?.uid) {
      await saveCaregiverAttributesFor(user.uid, updatedAttrs);
    }
    toast({
      title: 'Clinician Recommendation Applied',
      description: `${bp.prescribedByDoctor}'s staffing tier, safety notes, and assistive devices are now active in your Care Matrix.`
    });
  };

  const waDigestText = currentEval
    ? generateWhatsAppCareDigest(caregiverAttrs, patientProfile, currentEval)
    : 'Complete patient setup before sharing a care roster. This prevents demo data from being sent as a real care plan.';

  const activeDevicesCount = Object.values(caregiverAttrs.assistiveDevices || DEFAULT_ASSISTIVE_DEVICES).filter(
    (v) => v === true || (typeof v === 'string' && v !== 'none')
  ).length;

  const blueprint = caregiverAttrs.careBlueprint;

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-3.5 sm:p-6">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-primary/10 via-background to-blue-500/10 p-5 rounded-3xl border border-primary/20 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" />
            <span>Kutumbh Care Network (कुटुम्ब) & Family Self-Service</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-headline tracking-tight text-foreground">
            Care Circle & Family Support Matrix
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-0.5 leading-relaxed max-w-2xl">
            Empowering family caregivers to update secondary members, work commitments, diurnal shifts, and assistive devices anytime without needing hospital visits.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportIcs}
            className="gap-1.5 text-xs font-bold shadow-xs"
          >
            <Calendar className="w-3.5 h-3.5 text-primary" />
            <span>Calendar (.ics)</span>
          </Button>

          <Dialog open={isWhatsAppOpen} onOpenChange={setIsWhatsAppOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs">
                <Share2 className="w-3.5 h-3.5" />
                <span>WhatsApp Roster</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg rounded-3xl">
              <DialogHeader>
                <DialogTitle className="text-lg font-headline flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-emerald-600" />
                  WhatsApp Care Plan Digest
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Copy and send this pre-formatted digest to your family WhatsApp care group.
                </DialogDescription>
              </DialogHeader>

              <div className="p-4 rounded-2xl bg-muted/60 border border-border/80 font-mono text-xs whitespace-pre-wrap max-h-80 overflow-y-auto leading-relaxed">
                {waDigestText}
              </div>

              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(waDigestText);
                    toast({ title: 'Copied to Clipboard', description: 'Paste it into your family WhatsApp group.' });
                  }}
                  className="gap-1.5 text-xs"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy Text
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    window.open(`https://wa.me/?text=${encodeURIComponent(waDigestText)}`, '_blank');
                  }}
                  className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Share2 className="w-3.5 h-3.5" /> Open WhatsApp
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Live Dyad Health & Rotation Status Pills */}
      {!hasStoredDyadProfile && (
        <Card className="border-amber-500/40 bg-amber-500/10 shadow-xs">
          <CardContent className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <h2 className="text-sm font-bold text-foreground">Patient Setup Needed</h2>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Care-gap numbers and roster exports stay hidden until a real patient profile and caregiver profile are documented.
              </p>
            </div>
            <Button asChild size="sm" className="text-xs font-bold">
              <a href="/onboarding">Complete Setup</a>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-border bg-card/70 shadow-xs">
          <CardContent className="p-3.5 space-y-1">
            <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1">
              <Users className="w-3 h-3 text-primary" /> Secondary Rota
            </span>
            <p className="text-lg font-black text-foreground">
              {secondaryCount} Member{secondaryCount === 1 ? '' : 's'}
            </p>
            <p className="text-[11px] text-muted-foreground truncate">
              {caregiverAttrs.secondaryMembers?.map((m) => m.name).join(', ') || 'Solo Caregiver'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/70 shadow-xs">
          <CardContent className="p-3.5 space-y-1">
            <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-500" /> Respite Policy
            </span>
            <p className="text-lg font-black text-foreground">
              {respiteDays} Days / Mo
            </p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold truncate">
              Weekend: {weekendLead}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/70 shadow-xs">
          <CardContent className="p-3.5 space-y-1">
            <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1">
              <Bed className="w-3 h-3 text-blue-500" /> Assistive Setup
            </span>
            <p className="text-lg font-black text-foreground">
              {activeDevicesCount} Active Aids
            </p>
            <p className="text-[11px] text-muted-foreground truncate">
              {caregiverAttrs.assistiveDevices?.hospitalBed === 'motorized_multichannel' ? 'Motorized Bed Active' : 'Standard Bed'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/70 shadow-xs">
          <CardContent className="p-3.5 space-y-1">
            <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1">
              <Activity className="w-3 h-3 text-rose-500" /> Tasks Delegated
            </span>
            <p className="text-lg font-black text-foreground">
              {tasks.length - completedCount} Pending
            </p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
              {completedCount} Completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs: Matrix & Roster Management vs Daily Tasks */}
      <Tabs defaultValue="matrix" className="space-y-6">
        <TabsList className="grid grid-cols-2 max-w-md h-10 p-1 bg-muted rounded-2xl">
          <TabsTrigger value="matrix" className="rounded-xl text-xs font-bold gap-1.5">
            <Settings2 className="w-3.5 h-3.5 text-primary" />
            <span>Family Rota & Infrastructure</span>
          </TabsTrigger>
          <TabsTrigger value="tasks" className="rounded-xl text-xs font-bold gap-1.5">
            <CalendarCheck className="w-3.5 h-3.5 text-primary" />
            <span>Daily Delegated Tasks</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: Family Support Matrix & Assistive Infrastructure Overview */}
        <TabsContent value="matrix" className="space-y-6">
          {/* Clinician Home Care Blueprint Card (if issued) */}
          {blueprint && (
            <Card className="border-blue-500/40 bg-gradient-to-r from-blue-500/10 via-background to-blue-500/5 shadow-xs overflow-hidden">
              <CardHeader className="pb-3 border-b border-blue-500/20">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-blue-600 text-white">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base font-bold font-headline">
                          Clinician-Reviewed Home Care Blueprint
                        </CardTitle>
                        <Badge
                          variant={blueprint.status === 'adopted_by_family' ? 'default' : 'outline'}
                          className={cn(
                            'text-[10px] font-mono',
                            blueprint.status === 'adopted_by_family'
                              ? 'bg-emerald-600 text-white'
                              : 'border-blue-500/40 text-blue-700 dark:text-blue-300'
                          )}
                        >
                          {blueprint.status === 'adopted_by_family' ? '✓ Adopted by Family' : 'Pending Family Adoption'}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs">
                        Drafted or issued by <strong>{blueprint.prescribedByDoctor}</strong> on{' '}
                        {new Date(blueprint.prescribedAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                      </CardDescription>
                    </div>
                  </div>
                  {blueprint.status !== 'adopted_by_family' && (
                    <Button
                      size="sm"
                      onClick={handleApplyDoctorBlueprint}
                      className="gap-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs shrink-0"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Apply Recommendation</span>
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <EvidenceLevelBadge provenance={CLINICAL_PROVENANCE.staffingHeuristic} />
                  <EvidenceLevelBadge level="expert-consensus" label="Clinician Review Required" />
                </div>
                <p className="text-foreground leading-relaxed">
                  <strong>Clinical Rationale:</strong> {blueprint.clinicalSummary}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded-xl bg-card border border-border/80 space-y-1">
                    <span className="font-bold text-primary block text-[11px] uppercase tracking-wider">
                      Suggested Staffing & Shift Window
                    </span>
                    <p className="font-semibold text-foreground">
                      {blueprint.recommendedSupportType.replace(/_/g, ' ').toUpperCase()} ({blueprint.recommendedHoursPerDay}h/day)
                    </p>
                    <p className="text-[11px] text-muted-foreground">Shift: {blueprint.recommendedShiftWindow.replace('_', ' ')}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-card border border-border/80 space-y-1">
                    <span className="font-bold text-primary block text-[11px] uppercase tracking-wider">
                      Suggested Devices & Respite
                    </span>
                    <p className="font-semibold text-foreground">
                      {blueprint.recommendedRespiteDaysPerMonth} Respite Days / Mo
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {blueprint.recommendedAssistiveDevices.hospitalBed === 'motorized_multichannel' ? 'Motorized Bed' : 'Standard Bed'}
                      {blueprint.recommendedAssistiveDevices.airWaterMattress ? ' + Ripple Air Mattress' : ''}
                    </p>
                  </div>
                </div>

                {blueprint.clinicalPrecautions.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <span className="font-bold text-foreground text-[11px] uppercase tracking-wider block">
                      Safety Notes for Family Review:
                    </span>
                    <div className="space-y-1">
                      {blueprint.clinicalPrecautions.map((prec, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-muted-foreground leading-relaxed">
                          <span className="text-blue-600 font-bold">•</span>
                          <span>{prec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <ClinicalSafetyNote>
                  Family changes to staffing, medicines, suction, wound care, tube feeding, or transfers should be reviewed by the care team.
                </ClinicalSafetyNote>
              </CardContent>
            </Card>
          )}

          {/* Monthly Care Support Matrix & Roster Plan Widget */}
          <CaregiverSupportMatrix
            patientUid={user?.uid || 'local-caregiver'}
            caregiver={caregiverAttrs}
            patient={patientProfile}
            onSave={handleSaveMatrix}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Active Family Members Breakdown */}
            <div className="lg:col-span-2 space-y-4">
              <Card className="border-border bg-card shadow-xs">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary" />
                      Secondary Family Roster & Shift Commitments
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Family members contributing to the care circle and their work-availability windows.
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {caregiverAttrs.secondaryMembers && caregiverAttrs.secondaryMembers.length > 0 ? (
                    caregiverAttrs.secondaryMembers.map((member) => (
                      <div
                        key={member.id}
                        className="p-4 rounded-2xl bg-muted/40 border border-border/80 space-y-2 hover:border-primary/30 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary font-black text-sm flex items-center justify-center shrink-0">
                              {member.name.charAt(0)}
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                                {member.name}
                                <Badge variant="outline" className="text-[10px] capitalize font-medium py-0 px-1.5">
                                  {member.relationship} • Age {member.age}
                                </Badge>
                              </h4>
                              <p className="text-xs text-muted-foreground">
                                <span className="font-semibold text-foreground/80">{member.occupation}</span>
                                {member.workCommitmentSchedule && ` (${member.workCommitmentSchedule})`}
                              </p>
                            </div>
                          </div>

                          <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md shrink-0">
                            {member.hoursPerDay}h / day
                          </span>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap pt-1 text-xs">
                          <span className="text-[11px] font-semibold text-muted-foreground">Diurnal Availability:</span>
                          {member.availableTimeBlocks && member.availableTimeBlocks.length > 0 ? (
                            member.availableTimeBlocks.map((blk) => (
                              <Badge key={blk} variant="secondary" className="text-[10px] capitalize">
                                {blk.replace('_', ' ')}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-[11px] text-muted-foreground">General</span>
                          )}

                          <span className="text-muted-foreground">|</span>
                          <span className="text-[11px] font-semibold text-muted-foreground">Assigned:</span>
                          {member.assignedTasks && member.assignedTasks.length > 0 ? (
                            member.assignedTasks.map((t) => (
                              <span key={t} className="text-[11px] bg-background border px-1.5 py-0.5 rounded font-mono text-muted-foreground">
                                {t.replace('_', ' ')}
                              </span>
                            ))
                          ) : (
                            <span className="text-[11px] text-muted-foreground">None specified</span>
                          )}
                        </div>

                        {member.careRestrictions && (
                          <p className="text-[11px] text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2 py-1 rounded-lg">
                            ⚠️ Note: {member.careRestrictions}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground border border-dashed rounded-2xl space-y-2">
                      <Users className="w-8 h-8 mx-auto text-muted-foreground/60" />
                      <p className="text-xs font-medium">No secondary family members configured yet.</p>
                      <p className="text-[11px] text-muted-foreground">
                        Click &quot;Configure Support Matrix&quot; to add sons, daughters, or relatives to distribute care hours.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Assistive Device Infrastructure Card */}
              <Card className="border-border bg-card shadow-xs">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Bed className="w-4 h-4 text-blue-500" />
                    Active Ergonomic & Assistive Infrastructure
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Home equipment configured to reduce manual-handling strain and support pressure-injury prevention.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className={`p-3 rounded-xl border flex items-center gap-3 ${caregiverAttrs.assistiveDevices?.hospitalBed === 'motorized_multichannel' ? 'bg-blue-500/10 border-blue-500/30' : 'bg-muted/30 border-border/60'}`}>
                      <Bed className="w-5 h-5 text-blue-500 shrink-0" />
                      <div>
                        <p className="font-bold text-xs">Hospital Motorized Bed</p>
                        <p className="text-[10px] text-muted-foreground">{caregiverAttrs.assistiveDevices?.hospitalBed === 'motorized_multichannel' ? 'Active (reduces bending and lift load)' : 'Standard bed'}</p>
                      </div>
                    </div>

                    <div className={`p-3 rounded-xl border flex items-center gap-3 ${caregiverAttrs.assistiveDevices?.airWaterMattress ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-muted/30 border-border/60'}`}>
                      <Sparkles className="w-5 h-5 text-emerald-500 shrink-0" />
                      <div>
                        <p className="font-bold text-xs">Ripple Air/Water Mattress</p>
                        <p className="text-[10px] text-muted-foreground">{caregiverAttrs.assistiveDevices?.airWaterMattress ? 'Active (Bed sore prevention)' : 'None'}</p>
                      </div>
                    </div>

                    <div className={`p-3 rounded-xl border flex items-center gap-3 ${caregiverAttrs.assistiveDevices?.wheelchair ? 'bg-purple-500/10 border-purple-500/30' : 'bg-muted/30 border-border/60'}`}>
                      <Accessibility className="w-5 h-5 text-purple-500 shrink-0" />
                      <div>
                        <p className="font-bold text-xs">Commode Wheelchair</p>
                        <p className="text-[10px] text-muted-foreground">{caregiverAttrs.assistiveDevices?.wheelchair ? 'Active (Safe toilet transfers)' : 'None'}</p>
                      </div>
                    </div>

                    <div className={`p-3 rounded-xl border flex items-center gap-3 ${caregiverAttrs.assistiveDevices?.suctionApparatus ? 'bg-rose-500/10 border-rose-500/30' : 'bg-muted/30 border-border/60'}`}>
                      <Wind className="w-5 h-5 text-rose-500 shrink-0" />
                      <div>
                        <p className="font-bold text-xs">Suction Apparatus</p>
                        <p className="text-[10px] text-muted-foreground">{caregiverAttrs.assistiveDevices?.suctionApparatus ? 'Active (Tracheostomy safe)' : 'None'}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Col: Respite Policy, Emergency Protocol & Quick Actions */}
            <div className="space-y-4">
              <Card className="border-border bg-card shadow-xs">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-500" />
                    Monthly Respite & Shifts
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Protected recovery schedule for {caregiverAttrs.name || 'Primary Caregiver'}.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400">Scheduled Respite</span>
                      <p className="font-bold text-sm text-foreground">{respiteDays} Days / Month</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-bold border-emerald-500/40 text-emerald-600">
                      Protected
                    </Badge>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Weekend Shift Leader:</span>
                      <span className="font-bold text-foreground">{weekendLead}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Night Shift Rotation:</span>
                      <span className="font-bold text-foreground capitalize">
                        {caregiverAttrs.rotationPolicy?.nightShiftArrangement?.replace(/_/g, ' ') || 'Solo Primary'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Emergency Readiness Box */}
              <Card className="border-border bg-card shadow-xs">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <PhoneCall className="w-4 h-4 text-rose-500" />
                    Emergency Protocol
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Preferred Hospital:</span>
                    <span className="font-bold text-foreground truncate max-w-[140px]">
                      {caregiverAttrs.emergencyLogistics?.preferredHospitalName || 'AIIMS / Local Emergency'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Transit Distance:</span>
                    <span className="font-bold text-foreground">
                      {caregiverAttrs.emergencyLogistics?.hospitalDistanceKm || 5} km ({caregiverAttrs.emergencyLogistics?.travelTimeMinutes || 20} mins)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Dedicated Driver:</span>
                    <span className="font-bold text-foreground truncate max-w-[140px]">
                      {caregiverAttrs.emergencyLogistics?.designatedEmergencyDriver || 'Key Holder'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">4-Wheeler at Home:</span>
                    <Badge variant={caregiverAttrs.emergencyLogistics?.fourWheelerAvailableAtHome ? 'default' : 'secondary'} className="text-[10px]">
                      {caregiverAttrs.emergencyLogistics?.fourWheelerAvailableAtHome ? 'Yes (Parked)' : 'Cab / Auto'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: Daily Delegated Tasks & Task Rota */}
        <TabsContent value="tasks" className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-lg text-foreground">Collaborative Daily Task Checklist</h3>
              <p className="text-xs text-muted-foreground">
                Delegate medications, bed turning, bathing, and clinic appointments among circle members.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5 font-bold text-xs">
                    <UserPlus className="w-3.5 h-3.5 text-primary" />
                    <span>Invite Member</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md rounded-3xl">
                  <form onSubmit={handleAddMember}>
                    <DialogHeader>
                      <DialogTitle className="text-lg font-headline">Invite Care Circle Member</DialogTitle>
                      <DialogDescription className="text-xs">
                        Add family members or healthcare assistants to coordinate vitals and tasks.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1.5">
                          <Label htmlFor="m-fname" className="text-xs font-semibold">First Name</Label>
                          <Input
                            id="m-fname"
                            placeholder="e.g. Ramesh"
                            value={newMemberFirstName}
                            onChange={(e) => setNewMemberFirstName(e.target.value)}
                            className="h-9 text-xs"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="m-lname" className="text-xs font-semibold">Last Name</Label>
                          <Input
                            id="m-lname"
                            placeholder="e.g. Kumar"
                            value={newMemberLastName}
                            onChange={(e) => setNewMemberLastName(e.target.value)}
                            className="h-9 text-xs"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Role in Care Ecosystem</Label>
                        <Select value={newMemberRole} onValueChange={(v: any) => setNewMemberRole(v)}>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Family Member" className="text-xs">Family Member (Secondary Caregiver)</SelectItem>
                            <SelectItem value="Home Nurse" className="text-xs">Home Attendant / Nurse</SelectItem>
                            <SelectItem value="Visiting Doctor" className="text-xs">Visiting Doctor / Physio</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="m-phone" className="text-xs font-semibold">Phone Number</Label>
                        <Input
                          id="m-phone"
                          placeholder="e.g. 9820012345"
                          value={newMemberPhone}
                          onChange={(e) => setNewMemberPhone(e.target.value)}
                          className="h-9 text-xs font-mono"
                        />
                      </div>

                      <div className="p-3.5 rounded-2xl bg-muted border border-border flex items-center justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-muted-foreground">Circle Invite Code</span>
                          <p className="font-mono font-bold text-sm text-foreground">{circleInviteCode}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button type="button" variant="ghost" size="sm" onClick={copyInviteLink} className="h-8 text-xs gap-1">
                            <Copy className="w-3.5 h-3.5" /> Copy
                          </Button>
                          <Button type="button" size="sm" onClick={shareViaWhatsApp} className="h-8 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white">
                            <Share2 className="w-3.5 h-3.5" /> WhatsApp
                          </Button>
                        </div>
                      </div>
                    </div>

                    <DialogFooter className="gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => setIsInviteOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" size="sm" className="font-bold">
                        Add Member
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1.5 font-bold text-xs shadow-md">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Assign Task</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md rounded-3xl">
                  <form onSubmit={handleAddTask}>
                    <DialogHeader>
                      <DialogTitle className="text-lg font-headline">Assign Collaborative Care Task</DialogTitle>
                      <DialogDescription className="text-xs">
                        Delegate physical nursing, medication purchase, or appointment transport.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="t-title" className="text-xs font-semibold">Task Title</Label>
                        <Input
                          id="t-title"
                          placeholder="e.g. 2-Hourly bed turning, Evening BP check..."
                          value={taskTitle}
                          onChange={(e) => setTaskTitle(e.target.value)}
                          className="h-9 text-xs"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold">Assign To</Label>
                          <Select value={assignedTo} onValueChange={setAssignedTo}>
                            <SelectTrigger className="h-9 text-xs">
                              <SelectValue placeholder="Select member" />
                            </SelectTrigger>
                            <SelectContent>
                              {members.map((m) => (
                                <SelectItem key={m.id} value={m.name} className="text-xs">
                                  {m.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="t-time" className="text-xs font-semibold">Target Time</Label>
                          <Input
                            id="t-time"
                            placeholder="e.g. 10:00 AM"
                            value={taskTime}
                            onChange={(e) => setTaskTime(e.target.value)}
                            className="h-9 text-xs"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Category</Label>
                        <Select value={taskCategory} onValueChange={(v: any) => setTaskCategory(v)}>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="meds" className="text-xs">Medication & Refills</SelectItem>
                            <SelectItem value="physio" className="text-xs">Physiotherapy & Mobility</SelectItem>
                            <SelectItem value="hygiene" className="text-xs">Hygiene & Positioning</SelectItem>
                            <SelectItem value="appointment" className="text-xs">Clinic Visit / Tele-OPD</SelectItem>
                            <SelectItem value="general" className="text-xs">General Support</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <DialogFooter className="gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => setIsAddTaskOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" size="sm" className="font-bold">
                        Assign Task
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Col: Circle Members List */}
            <div className="space-y-4 lg:col-span-1">
              <Card className="border-border bg-card/60 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold flex items-center justify-between">
                    <span>Circle Members</span>
                    <Badge variant="secondary" className="font-mono text-[10px]">
                      {members.length} Active
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Authorized caregivers in this patient circle.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="p-3 rounded-2xl bg-background border border-border/80 flex items-center justify-between gap-3 shadow-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl ${member.avatarColor} text-white flex items-center justify-center font-bold text-xs shrink-0`}
                        >
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-foreground flex items-center gap-1.5">
                            {member.name}
                            {member.isSelf && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-primary/10 text-primary font-mono">
                                You
                              </span>
                            )}
                          </h4>
                          <p className="text-[11px] text-muted-foreground">{member.role}</p>
                        </div>
                      </div>

                      <a href={`tel:${member.phone}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10 rounded-lg">
                          <PhoneCall className="w-3.5 h-3.5" />
                        </Button>
                      </a>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Right Col: Delegated Daily Care Tasks */}
            <div className="space-y-4 lg:col-span-2">
              <Card className="border-border bg-card shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <CalendarCheck className="w-5 h-5 text-primary" />
                      Today&apos;s Delegated Care Schedule
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {completedCount} of {tasks.length} tasks completed today.
                    </CardDescription>
                  </div>
                  <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                    {Math.round((completedCount / (tasks.length || 1)) * 100)}% Done
                  </span>
                </CardHeader>
                <CardContent className="space-y-3">
                  {tasks.length > 0 ? (
                    tasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => handleToggleTask(task.id)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                          task.isCompleted
                            ? 'bg-muted/40 border-border opacity-70'
                            : 'bg-background border-border/90 hover:border-primary/40 shadow-xs'
                        }`}
                      >
                        <div className="flex items-start gap-3.5">
                          <div
                            className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                              task.isCompleted
                                ? 'bg-primary border-primary text-primary-foreground'
                                : 'border-muted-foreground/40 bg-background'
                            }`}
                          >
                            {task.isCompleted && <CheckCircle2 className="w-4 h-4" />}
                          </div>
                          <div className="space-y-1">
                            <h4
                              className={`font-bold text-sm leading-tight ${
                                task.isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'
                              }`}
                            >
                              {task.title}
                            </h4>
                            <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                              <span className="flex items-center gap-1 font-mono text-[11px]">
                                <Clock className="w-3 h-3 text-primary" /> {task.time}
                              </span>
                              <span>•</span>
                              <span className="font-medium text-foreground/80">Assigned: {task.assignedToName}</span>
                              <span>•</span>
                              <Badge variant="outline" className="text-[10px] capitalize py-0 px-1.5">
                                {task.category}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-muted-foreground border border-dashed rounded-2xl">
                      <CalendarCheck className="w-10 h-10 mx-auto mb-2 text-muted-foreground/60" />
                      <p className="text-sm font-medium">No tasks assigned yet</p>
                      <p className="text-xs">Click &quot;Assign Task&quot; above to delegate care responsibilities.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
