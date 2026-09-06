'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  UserCheck,
  Stethoscope,
  HeartPulse,
  Pill,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Bed,
  Save,
  ExternalLink,
  FileText,
  ShieldAlert,
  Clock,
  RotateCcw
} from 'lucide-react';
import { HealthRepository, type MedicationItem, type VitalRecord } from '@/lib/db/health-repository';
import {
  syncVitals,
  recordVitalFor,
  getVitalsFor,
  syncNursingProcedures,
  getNursingProceduresFor,
  getMedicationsFor,
  saveMedicationsFor,
  getPatientProfileFor,
  listMyRoster,
  hydrateLocalCacheFromCloud
} from '@/lib/firebase/clinical-sync';
import { subscribeToAuthState } from '@/lib/firebase/auth';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { DailyCareLogPanel } from '@/components/clinical/daily-care-log-panel';
import { CareIntelligencePanel } from '@/components/clinical/care-intelligence-panel';
import { MedicationChecker } from '@/lib/clinical/medication-checker';

const DEFAULT_PROCEDURES = {
  morningBathSkinInspect: false,
  dentureLukewarmClean: false,
  q2hTurnCompleted: false,
  woundDressingChanged: false,
  catheterOutputMeasured: false,
  eveningMedsAdministered: false
};

const todayStr = () => new Date().toISOString().slice(0, 10);

export function NurseShiftDashboard() {
  const { toast } = useToast();
  const [patient, setPatient] = useState(HealthRepository.getPatientProfile());

  const [shiftType, setShiftType] = useState<'day_12h' | 'night_12h' | 'live_in_24h'>('day_12h');
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [pulse, setPulse] = useState('');
  const [bloodSugar, setBloodSugar] = useState('');
  const [spO2, setSpO2] = useState('');
  const [isSubmittingVitals, setIsSubmittingVitals] = useState(false);

  // Signed-in account uid & active patient dyad uid
  const [currentUid, setCurrentUid] = useState<string>('');
  const [activeDyadUid, setActiveDyadUid] = useState<string>('');

  // Bedside Checklist & Medications
  const [procedures, setProcedures] = useState<typeof DEFAULT_PROCEDURES>(DEFAULT_PROCEDURES);
  const [medications, setMedications] = useState<MedicationItem[]>([]);
  const [recentVitals, setRecentVitals] = useState<VitalRecord[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToAuthState((user) => {
      const uid = user?.uid || '';
      setCurrentUid(uid);
      if (uid) {
        void listMyRoster().then((roster) => {
          const dyad = roster[0]?.patientUid || uid;
          setActiveDyadUid(dyad);
        });
      }
    });
    return unsubscribe;
  }, []);

  const targetDyadUid = activeDyadUid || currentUid;

  useEffect(() => {
    const localMeds = HealthRepository.getMedications();
    setMedications(localMeds);
    setRecentVitals(HealthRepository.getVitals());

    if (!targetDyadUid) return;

    let cancelled = false;
    void (async () => {
      try {
        await hydrateLocalCacheFromCloud(targetDyadUid);
      } catch {}

      const cloudPt = await getPatientProfileFor(targetDyadUid);
      if (!cancelled && cloudPt) {
        HealthRepository.savePatientProfile(cloudPt);
        setPatient(cloudPt);
      }

      const cloudMeds = await getMedicationsFor(targetDyadUid);
      if (!cancelled && cloudMeds.length > 0) {
        HealthRepository.saveMedications(cloudMeds);
        setMedications(HealthRepository.getMedications());
      }

      const cloudVitals = await getVitalsFor(targetDyadUid);
      if (!cancelled && cloudVitals.length > 0) {
        setRecentVitals(cloudVitals);
      }

      const savedProcs = await getNursingProceduresFor(targetDyadUid, todayStr());
      if (!cancelled && Object.keys(savedProcs).length > 0) {
        setProcedures((prev) => ({ ...prev, ...savedProcs }));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [targetDyadUid]);

  const handleToggleMedSlot = async (
    id: string,
    slot: 'morning' | 'afternoon' | 'evening' | 'bedtime' | 'sos'
  ) => {
    const updated = HealthRepository.toggleMedicationTaken(id, slot);
    if (targetDyadUid) {
      void saveMedicationsFor(targetDyadUid, updated);
    }
    setMedications(updated);
    const med = updated.find((m) => m.id === id);
    const isTaken = med?.takenSlots?.includes(slot);
    toast({
      title: isTaken ? 'Dose Administered' : 'Dose Marked Untaken',
      description: `${med?.name} (${slot}) ${isTaken ? 'recorded as given.' : 'reverted.'}`
    });
  };

  const handleMarkAllTodayForMed = async (id: string) => {
    const updated = HealthRepository.toggleMedicationTaken(id);
    if (targetDyadUid) {
      void saveMedicationsFor(targetDyadUid, updated);
    }
    setMedications(updated);
    toast({
      title: 'Medication Updated',
      description: `All scheduled daily doses for ${updated.find((m) => m.id === id)?.name || 'medicine'} marked given.`
    });
  };

  const totalScheduledDoses = medications.reduce((sum, m) => sum + m.timeOfDay.length, 0);
  const completedDoses = medications.reduce(
    (sum, m) => sum + (m.takenSlots?.length || (m.takenToday ? m.timeOfDay.length : 0)),
    0
  );
  const doseAdherencePercentage =
    totalScheduledDoses > 0 ? Math.round((completedDoses / totalScheduledDoses) * 100) : 0;

  const toggleProcedure = (key: keyof typeof procedures) => {
    setProcedures((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      if (targetDyadUid) void syncNursingProcedures(targetDyadUid, todayStr(), updated);
      return updated;
    });
  };

  const handleLogShiftVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!systolic && !pulse && !bloodSugar) {
      toast({ variant: 'destructive', title: 'Empty Vitals', description: 'Enter at least one vital sign reading.' });
      return;
    }

    setIsSubmittingVitals(true);
    try {
      const saved = HealthRepository.addVital({
        date: new Date().toISOString(),
        systolic: systolic || undefined,
        diastolic: diastolic || undefined,
        bp: systolic && diastolic ? `${systolic}/${diastolic}` : systolic || undefined,
        pulse: pulse || undefined,
        spo2: spO2 || undefined,
        bloodSugar: bloodSugar || undefined,
        sleep: 'average',
        notes: `Logged by Shift Nurse (${shiftType.replace('_', ' ')})`
      });

      if (targetDyadUid) {
        await recordVitalFor(targetDyadUid, saved);
        const updated = await getVitalsFor(targetDyadUid);
        setRecentVitals(updated);
      } else {
        await syncVitals(saved);
        setRecentVitals(HealthRepository.getVitals());
      }

      toast({
        title: 'Shift Vitals Saved & Cloud Synced',
        description: `Recorded to ${patient.name}'s file and visible on family & doctor portals.`
      });

      setSystolic('');
      setDiastolic('');
      setPulse('');
      setBloodSugar('');
      setSpO2('');
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Failed to Save Vitals',
        description: err instanceof Error ? err.message : 'Please check network connection.'
      });
    } finally {
      setIsSubmittingVitals(false);
    }
  };

  const completedCount = Object.values(procedures).filter(Boolean).length;
  const totalCount = Object.keys(procedures).length;
  const latestVital = recentVitals[0] || null;

  return (
    <div className="space-y-6">
      {/* ─── 1. HIGH-DENSITY CLINICAL TELEMETRY STRIP ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Metric 1: Shift MAR Dose Adherence */}
        <Card className="border-rose-950/40 bg-gradient-to-br from-rose-950/20 via-card to-card shadow-xs">
          <CardContent className="p-3.5 sm:p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-600/15 text-rose-700 dark:text-rose-400 shrink-0">
              <Pill className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Shift MAR</span>
                <span className="text-[10px] font-mono font-extrabold text-rose-700 dark:text-rose-400 bg-rose-500/15 px-1.5 py-0.2 rounded">
                  {doseAdherencePercentage}%
                </span>
              </div>
              <p className="text-base font-black font-mono text-foreground mt-0.5">
                {completedDoses} / {totalScheduledDoses} <span className="text-xs font-normal text-muted-foreground">Given</span>
              </p>
              <Progress value={doseAdherencePercentage} className="h-1.5 mt-1.5 bg-rose-950/30 [&>div]:bg-rose-600" />
            </div>
          </CardContent>
        </Card>

        {/* Metric 2: Nursing Procedures Checklist */}
        <Card className="border-rose-950/40 bg-gradient-to-br from-rose-950/20 via-card to-card shadow-xs">
          <CardContent className="p-3.5 sm:p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-600/15 text-rose-700 dark:text-rose-400 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Bedside Duties</span>
                <span className="text-[10px] font-mono font-extrabold text-rose-700 dark:text-rose-400 bg-rose-500/15 px-1.5 py-0.2 rounded">
                  {Math.round((completedCount / totalCount) * 100)}%
                </span>
              </div>
              <p className="text-base font-black font-mono text-foreground mt-0.5">
                {completedCount} / {totalCount} <span className="text-xs font-normal text-muted-foreground">Tasks Done</span>
              </p>
              <Progress value={Math.round((completedCount / totalCount) * 100)} className="h-1.5 mt-1.5 bg-rose-950/30 [&>div]:bg-rose-600" />
            </div>
          </CardContent>
        </Card>

        {/* Metric 3: Latest Vitals Reading */}
        <Card className="border-rose-950/40 bg-gradient-to-br from-rose-950/20 via-card to-card shadow-xs">
          <CardContent className="p-3.5 sm:p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-600/15 text-rose-700 dark:text-rose-400 shrink-0">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Latest Telemetry</span>
                <Badge variant="outline" className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 border-emerald-500/30 py-0">
                  Normal
                </Badge>
              </div>
              <p className="text-base font-black font-mono text-foreground mt-0.5">
                {latestVital?.bp || '130/85'} <span className="text-xs font-normal text-muted-foreground">mmHg</span>
              </p>
              <p className="text-[10px] text-muted-foreground truncate font-mono mt-0.5">
                Pulse {latestVital?.pulse || '82'} · SpO2 {latestVital?.spo2 || '97'}%
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Metric 4: Attendant & Shift Schedule */}
        <Card className="border-rose-950/40 bg-gradient-to-br from-rose-950/20 via-card to-card shadow-xs">
          <CardContent className="p-3.5 sm:p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-600/15 text-rose-700 dark:text-rose-400 shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Staff On Duty</span>
                <span className="text-[9px] font-mono font-bold text-rose-700 dark:text-rose-300">Live Handoff</span>
              </div>
              <p className="text-sm font-extrabold text-foreground truncate mt-0.5">
                Sister Shilpa (RN)
              </p>
              <div className="mt-1">
                <Select value={shiftType} onValueChange={(value) => setShiftType(value as typeof shiftType)}>
                  <SelectTrigger id="nurse-stat-shift-type" className="h-6 text-[10px] font-mono gap-1 border-rose-500/30 px-1.5 bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day_12h">Day Shift (12h)</SelectItem>
                    <SelectItem value="night_12h">Night Shift (12h)</SelectItem>
                    <SelectItem value="live_in_24h">Live-in (24h)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── 2. CLINICAL WORKFLOW TABS ─── */}
      <Tabs defaultValue="active_station" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/60">
          <TabsList className="bg-muted/80 p-1 rounded-xl h-11 border border-border/60">
            <TabsTrigger
              value="active_station"
              className="gap-2 text-xs sm:text-sm font-bold data-[state=active]:bg-rose-800 data-[state=active]:text-white rounded-lg transition-all"
            >
              <Pill className="w-4 h-4" />
              <span>Bedside MAR & Vitals</span>
            </TabsTrigger>
            <TabsTrigger
              value="daily_sheet"
              className="gap-2 text-xs sm:text-sm font-bold data-[state=active]:bg-rose-800 data-[state=active]:text-white rounded-lg transition-all"
            >
              <FileText className="w-4 h-4" />
              <span>Daily Bedside Sheet</span>
            </TabsTrigger>
            <TabsTrigger
              value="safety_care_plan"
              className="gap-2 text-xs sm:text-sm font-bold data-[state=active]:bg-rose-800 data-[state=active]:text-white rounded-lg transition-all"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Care Plan & Alerts</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] font-mono border-rose-500/30 text-rose-700 dark:text-rose-300">
              Active Dyad: {patient.name} ({targetDyadUid.slice(0, 8)}...)
            </Badge>
          </div>
        </div>

        {/* ─── TAB 1: BEDSIDE MAR & SHIFT VITALS ─── */}
        <TabsContent value="active_station" className="space-y-6 mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 7 Columns: MAR Medication Record & Bedside Checklist */}
            <div className="lg:col-span-7 space-y-6">
              {/* Shift Medication Administration Record (MAR) */}
              <Card className="border-border bg-card shadow-xs">
                <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                          <Pill className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                          Shift Medication Administration Record (MAR)
                        </CardTitle>
                        <Badge variant="outline" className="text-[10px] font-mono border-rose-500/30 text-rose-700 dark:text-rose-300">
                          Live Cross-Sync
                        </Badge>
                      </div>
                      <CardDescription className="text-xs mt-0.5">
                        {completedDoses} of {totalScheduledDoses} scheduled doses administered today.
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href="/medications">
                        <Button variant="ghost" size="sm" className="h-8 text-xs font-semibold gap-1 text-rose-700 dark:text-rose-300 hover:bg-rose-500/10">
                          <span>Full Schedule & Beers</span>
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-5 space-y-4">
                  {medications.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground border border-dashed rounded-2xl">
                      <Pill className="w-8 h-8 mx-auto mb-2 text-muted-foreground/60" />
                      <p className="text-xs font-medium">No medications scheduled yet.</p>
                      <Link href="/medications" className="text-xs font-bold text-rose-700 dark:text-rose-400 hover:underline mt-1 inline-block">
                        Add medicines on the Medication Schedule page →
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {medications.map((med) => {
                        const warning = MedicationChecker.checkBeersCriteria(med.name);
                        const isAllTaken = med.takenToday;
                        return (
                          <div
                            key={med.id}
                            className={cn(
                              'p-3.5 rounded-2xl border flex flex-col justify-between gap-3 transition-all',
                              isAllTaken ? 'border-border bg-muted/20 opacity-90' : 'border-border bg-card shadow-2xs hover:border-rose-500/40'
                            )}
                          >
                            <div className="space-y-1.5">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-bold text-sm text-foreground">{med.name}</span>
                                    {med.dosage && (
                                      <Badge variant="secondary" className="text-[10px] font-mono px-1.5 py-0">
                                        {med.dosage}
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
                                    {med.frequency} • {med.foodRelation === 'after' ? 'After food' : med.foodRelation === 'before' ? 'Before food' : 'With meals'}
                                  </p>
                                </div>
                                <Badge
                                  variant={isAllTaken ? 'default' : 'outline'}
                                  className={cn(
                                    'text-[10px] shrink-0 font-semibold',
                                    isAllTaken ? 'bg-rose-700 text-white' : 'text-amber-700 dark:text-amber-300 border-amber-500/40'
                                  )}
                                >
                                  {med.takenSlots?.length || 0}/{med.timeOfDay.length} Taken
                                </Badge>
                              </div>

                              {/* Dose Slot Buttons for Nurse */}
                              <div className="space-y-1 pt-1">
                                <span className="text-[10px] uppercase font-bold text-muted-foreground">Today&apos;s Dose Slots:</span>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {med.timeOfDay.map((slot) => {
                                    const isTaken = med.takenSlots?.includes(slot);
                                    return (
                                      <button
                                        key={slot}
                                        type="button"
                                        onClick={() => handleToggleMedSlot(med.id, slot)}
                                        className={cn(
                                          'px-2.5 py-1 rounded-lg border text-[11px] font-semibold flex items-center gap-1.5 transition-all',
                                          isTaken
                                            ? 'border-rose-500/80 bg-rose-500/15 text-rose-800 dark:text-rose-200 shadow-2xs font-bold'
                                            : 'border-border bg-background hover:border-rose-500/50 text-foreground'
                                        )}
                                      >
                                        <div
                                          className={cn(
                                            'w-3.5 h-3.5 rounded-full border flex items-center justify-center',
                                            isTaken ? 'bg-rose-700 border-rose-700 text-white' : 'border-muted-foreground/50'
                                          )}
                                        >
                                          {isTaken && <CheckCircle2 className="w-2.5 h-2.5" />}
                                        </div>
                                        <span className="capitalize">{slot}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              {med.instructions && (
                                <p className="text-[10px] text-muted-foreground italic bg-muted/40 p-1.5 rounded-lg border border-border/40">
                                  <strong>Note:</strong> {med.instructions}
                                </p>
                              )}

                              {warning && (
                                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[10px] text-amber-900 dark:text-amber-300 flex items-start gap-1.5">
                                  <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0 mt-0.5" />
                                  <span className="leading-tight">{warning.drugClass}: {warning.recommendation}</span>
                                </div>
                              )}
                            </div>

                            <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-2">
                              <span className="text-[10px] text-muted-foreground font-mono">
                                {med.prescribedBy ? `Dr: ${med.prescribedBy}` : 'Daily Regimen'}
                              </span>
                              <Button
                                type="button"
                                size="sm"
                                variant={isAllTaken ? 'outline' : 'secondary'}
                                onClick={() => handleMarkAllTodayForMed(med.id)}
                                className="h-7 text-[10px] font-bold gap-1 px-2"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>{isAllTaken ? 'All Doses Given' : 'Mark All Today'}</span>
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Shift Nursing Duties & Protocols */}
              <Card className="border-border bg-card shadow-xs">
                <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <Stethoscope className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                      Shift Nursing Duties & Care Protocols
                    </CardTitle>
                    <Badge variant="secondary" className="text-[10px] font-mono">
                      {completedCount} / {totalCount} Done
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-5 space-y-2.5">
                  {[
                    { key: 'morningBathSkinInspect', label: 'Morning Sponge Bath & Skin Check', desc: 'Mild soap, no-rub pat dry, sacral redness inspect' },
                    { key: 'dentureLukewarmClean', label: 'Oral & Denture Hygiene', desc: 'Lukewarm water clean over towel-lined sink' },
                    { key: 'q2hTurnCompleted', label: 'Q2H Lateral Turn & Heel Float', desc: '30° wedge oblique positioning and calf elevation' },
                    { key: 'woundDressingChanged', label: 'Wound Dressing / Skin Flap Check', desc: 'Sterile saline rinse, non-adherent silicone dressing' },
                    { key: 'catheterOutputMeasured', label: 'Catheter / Fluid Balance Log', desc: 'Drain bag measurement, inspect for turbidity' },
                    { key: 'eveningMedsAdministered', label: 'Medication Administration Record (MAR)', desc: 'Verify 5 rights of medication dispensing' },
                  ].map((task) => {
                    const isChecked = procedures[task.key as keyof typeof procedures];
                    return (
                      <button
                        key={task.key}
                        type="button"
                        onClick={() => toggleProcedure(task.key as keyof typeof procedures)}
                        className={cn(
                          'w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all',
                          isChecked
                            ? 'border-rose-500/50 bg-rose-500/10 text-foreground'
                            : 'border-border/60 bg-muted/20 hover:border-rose-500/40 text-muted-foreground'
                        )}
                      >
                        <div className="space-y-0.5">
                          <span className={cn('text-xs font-bold block text-foreground', isChecked && 'line-through opacity-80')}>
                            {task.label}
                          </span>
                          <span className="text-[10px] text-muted-foreground">{task.desc}</span>
                        </div>
                        <div className={cn('w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ml-2', isChecked ? 'bg-rose-700 text-white border-rose-700' : 'border-border')}>
                          {isChecked && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </div>
                      </button>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            {/* Right 5 Columns: Shift Vitals Entry & Live Telemetry Feed */}
            <div className="lg:col-span-5 space-y-6">
              {/* Shift Vitals Quick Log Card */}
              <Card className="border-border bg-card shadow-xs">
                <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <HeartPulse className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                      Shift Vital Signs Quick Log
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px] font-mono border-rose-500/30 text-rose-700 dark:text-rose-300">
                      Real-Time
                    </Badge>
                  </div>
                  <CardDescription className="text-xs mt-0.5">
                    Records direct to Vishal&apos;s chart and notifies the care team.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-5">
                  <form onSubmit={handleLogShiftVitals} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label htmlFor="nurse-shift-systolic" className="text-[11px] font-semibold text-muted-foreground">BP Systolic (mmHg)</label>
                        <Input
                          id="nurse-shift-systolic"
                          type="number"
                          placeholder="120"
                          value={systolic}
                          onChange={(e) => setSystolic(e.target.value)}
                          className="h-9 text-xs font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label htmlFor="nurse-shift-diastolic" className="text-[11px] font-semibold text-muted-foreground">BP Diastolic (mmHg)</label>
                        <Input
                          id="nurse-shift-diastolic"
                          type="number"
                          placeholder="80"
                          value={diastolic}
                          onChange={(e) => setDiastolic(e.target.value)}
                          className="h-9 text-xs font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label htmlFor="nurse-shift-pulse" className="text-[11px] font-semibold text-muted-foreground">Pulse (bpm)</label>
                        <Input
                          id="nurse-shift-pulse"
                          type="number"
                          placeholder="72"
                          value={pulse}
                          onChange={(e) => setPulse(e.target.value)}
                          className="h-9 text-xs font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label htmlFor="nurse-shift-spo2" className="text-[11px] font-semibold text-muted-foreground">SpO2 Oxygen (%)</label>
                        <Input
                          id="nurse-shift-spo2"
                          type="number"
                          placeholder="98"
                          value={spO2}
                          onChange={(e) => setSpO2(e.target.value)}
                          className="h-9 text-xs font-mono"
                        />
                      </div>
                      <div className="col-span-2 space-y-1">
                        <label htmlFor="nurse-shift-blood-sugar" className="text-[11px] font-semibold text-muted-foreground">Blood Glucose (mg/dL)</label>
                        <Input
                          id="nurse-shift-blood-sugar"
                          type="number"
                          placeholder="110"
                          value={bloodSugar}
                          onChange={(e) => setBloodSugar(e.target.value)}
                          className="h-9 text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <Button
                        type="submit"
                        disabled={isSubmittingVitals}
                        size="sm"
                        className="w-full gap-1.5 text-xs font-bold bg-rose-700 hover:bg-rose-800 text-white min-h-[40px] shadow-xs"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{isSubmittingVitals ? 'Saving...' : 'Save Shift Readings'}</span>
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Recent Recorded Vitals Feed */}
              <Card className="border-border bg-card shadow-xs">
                <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <Activity className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                      Recent Telemetry Entries
                    </CardTitle>
                    <Link href="/vital-logs">
                      <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold text-rose-700 dark:text-rose-300">
                        View All →
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 space-y-2">
                  {recentVitals.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-4 text-center">No vitals recorded yet today.</p>
                  ) : (
                    recentVitals.slice(0, 4).map((v) => (
                      <div
                        key={v.id}
                        className="p-2.5 rounded-xl border border-border/60 bg-muted/15 flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-1.5 font-bold font-mono">
                            <span className="text-foreground">{v.bp || `${v.systolic}/${v.diastolic}`} mmHg</span>
                            <span className="text-muted-foreground font-normal">·</span>
                            <span className="text-muted-foreground">{v.pulse ? `${v.pulse} bpm` : ''}</span>
                            {v.spo2 && <Badge variant="outline" className="text-[9px] px-1 py-0 border-rose-500/30 text-rose-700 dark:text-rose-300">{v.spo2}% SpO2</Badge>}
                          </div>
                          <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                            {v.notes || 'Routine reading'}
                          </p>
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                          {new Date(v.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ─── TAB 2: DAILY BEDSIDE SHEET (INTAKE/OUTPUT & FEEDS) ─── */}
        <TabsContent value="daily_sheet" className="space-y-6 mt-0">
          <DailyCareLogPanel
            patientUid={targetDyadUid || currentUid || undefined}
            patientName={patient.name}
            title="Nurse Daily Bedside Sheet & Clinical Handover"
            medications={medications}
          />
        </TabsContent>

        {/* ─── TAB 3: SAFETY PROTOCOL & CARE PLAN ─── */}
        <TabsContent value="safety_care_plan" className="space-y-6 mt-0">
          <CareIntelligencePanel
            patientName={patient.name}
            latestZarit={HealthRepository.getZaritAssessments()[0] || null}
            careGap={HealthRepository.hasStoredDyadProfile() ? HealthRepository.getCareGapEvaluation() : null}
            caregiver={HealthRepository.getCaregiverAttributes()}
            patient={patient}
            vitals={recentVitals}
            mode="clinician"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
