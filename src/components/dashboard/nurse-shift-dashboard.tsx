'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  ExternalLink
} from 'lucide-react';
import { HealthRepository, type MedicationItem } from '@/lib/db/health-repository';
import {
  syncVitals,
  syncNursingProcedures,
  getNursingProceduresFor,
  getMedicationsFor,
  syncMedications
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
  const patient = HealthRepository.getPatientProfile();

  const [shiftType, setShiftType] = useState<'day_12h' | 'night_12h' | 'live_in_24h'>('day_12h');
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [pulse, setPulse] = useState('');
  const [bloodSugar, setBloodSugar] = useState('');
  const [spO2, setSpO2] = useState('');

  // Signed-in dyad uid — resolves so the nurse's shift readings and daily
  // sheet write to the SAME `users/{uid}/...` tree the family caregiver's
  // dashboard reads (see dashboard-client.tsx), not a device-only silo.
  const [currentUid, setCurrentUid] = useState<string>('');

  // Nursing Procedures Checklist. Previously plain React state with no
  // persistence at all — a page refresh silently discarded the whole shift's
  // completed-procedure record, and it was never visible to the doctor or
  // family. Now backed by HealthRepository (survives refresh) and mirrored
  // to Firestore once signed in, keyed by today's date so it resets daily.
  const [procedures, setProcedures] = useState<typeof DEFAULT_PROCEDURES>(DEFAULT_PROCEDURES);

  useEffect(() => {
    const unsubscribe = subscribeToAuthState((user) => {
      setCurrentUid(user?.uid || '');
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!currentUid) return;
    let cancelled = false;
    void getNursingProceduresFor(currentUid, todayStr()).then((saved) => {
      if (!cancelled && Object.keys(saved).length > 0) {
        setProcedures((prev) => ({ ...prev, ...saved }));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [currentUid]);

  const [medications, setMedications] = useState<MedicationItem[]>([]);

  useEffect(() => {
    const localMeds = HealthRepository.getMedications();
    setMedications(localMeds);
    if (!currentUid) return;
    let cancelled = false;
    void getMedicationsFor(currentUid).then((cloudMeds) => {
      if (!cancelled && cloudMeds.length > 0) {
        HealthRepository.saveMedications(cloudMeds);
        setMedications(HealthRepository.getMedications());
      }
    });
    return () => {
      cancelled = true;
    };
  }, [currentUid]);

  const handleToggleMedSlot = async (
    id: string,
    slot: 'morning' | 'afternoon' | 'evening' | 'bedtime' | 'sos'
  ) => {
    const updated = HealthRepository.toggleMedicationTaken(id, slot);
    if (currentUid) {
      void syncMedications(updated);
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
    if (currentUid) {
      void syncMedications(updated);
    }
    setMedications(updated);
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
      if (currentUid) void syncNursingProcedures(currentUid, todayStr(), updated);
      return updated;
    });
  };

  const handleLogShiftVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!systolic && !pulse && !bloodSugar) {
      toast({ variant: 'destructive', title: 'Empty Vitals', description: 'Enter at least one vital sign reading.' });
      return;
    }

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
    const { queued } = await syncVitals(saved);

    toast({
      title: queued ? '☁️ Shift Vitals Recorded — Saved to Cloud' : 'Shift Vitals Recorded',
      description: queued
        ? 'Logged and backed up to the patient trajectory record.'
        : 'Logged to permanent patient trajectory record.'
    });

    setSystolic('');
    setDiastolic('');
    setPulse('');
    setBloodSugar('');
    setSpO2('');
  };

  const completedCount = Object.values(procedures).filter(Boolean).length;
  const totalCount = Object.keys(procedures).length;

  return (
    <div className="space-y-6">
      {/* Nurse Shift Header */}
      <Card className="border-emerald-500/30 bg-emerald-500/5 shadow-sm">
        <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-600/10 text-emerald-600 shrink-0 mt-0.5">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] font-bold text-emerald-600 border-emerald-500/30 uppercase">
                  Trained Nurse / Medical Attendant Portal
                </Badge>
                <span className="text-xs text-muted-foreground font-mono">Shift Active</span>
              </div>
              <h2 className="text-lg font-bold text-foreground mt-0.5">
                Bedside Clinical Handoff & Shift Tasks — {patient.name} (Age {patient.age})
              </h2>
              <p className="text-xs text-muted-foreground max-w-xl leading-relaxed">
                Log vital signs, record Medication Administration (MAR), and execute bedside pressure-ulcer prevention protocols.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <Link href="/medications">
              <Button size="sm" variant="outline" className="gap-1.5 text-xs font-bold border-amber-500/40 text-amber-800 dark:text-amber-300 hover:bg-amber-500/10">
                <Pill className="w-4 h-4 text-amber-600" />
                <span>MAR / Meds ({completedDoses}/{totalScheduledDoses})</span>
              </Button>
            </Link>
            <Link href="/domiciliary">
              <Button size="sm" variant="outline" className="gap-1.5 text-xs font-bold border-emerald-500/30 text-emerald-700 dark:text-emerald-300">
                <Bed className="w-4 h-4" /> Bedside Companion
              </Button>
            </Link>
            <Link href="/vital-logs">
              <Button size="sm" className="gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white">
                <Activity className="w-4 h-4" /> Vitals History
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Grid: Shift Vitals Logging & Nursing Tasks Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Shift Vitals Quick Log */}
        <Card className="border-border bg-card shadow-xs">
          <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-emerald-600" />
                Shift Vital Signs Log (MAR Entry)
              </CardTitle>
              <div className="flex items-center gap-2">
                <Select value={shiftType} onValueChange={(value) => setShiftType(value as typeof shiftType)}>
                  <SelectTrigger id="nurse-shift-type" className="h-7 w-auto text-[10px] font-mono gap-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day_12h">Day (12h)</SelectItem>
                    <SelectItem value="night_12h">Night (12h)</SelectItem>
                    <SelectItem value="live_in_24h">Live-in (24h)</SelectItem>
                  </SelectContent>
                </Select>
                <Badge variant="outline" className="text-[10px] font-mono">
                  Real-Time
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-5">
            <form onSubmit={handleLogShiftVitals} className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
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
                <div className="space-y-1 col-span-2 sm:col-span-1">
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
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" size="sm" className="w-full sm:w-auto gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white min-h-[38px]">
                  <Save className="w-3.5 h-3.5" /> Save Shift Readings
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Card 2: Bedside Nursing Procedure Checklist */}
        <Card className="border-border bg-card shadow-xs">
          <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-emerald-600" />
                Shift Nursing Duties & Care Plan
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
                      ? 'border-emerald-500/50 bg-emerald-500/10 text-foreground'
                      : 'border-border/60 bg-muted/20 hover:border-emerald-500/40 text-muted-foreground'
                  )}
                >
                  <div className="space-y-0.5">
                    <span className={cn('text-xs font-bold block text-foreground', isChecked && 'line-through opacity-80')}>
                      {task.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{task.desc}</span>
                  </div>
                  <div className={cn('w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ml-2', isChecked ? 'bg-emerald-600 text-white border-emerald-600' : 'border-border')}>
                    {isChecked && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Shift Medication Administration Record (MAR) & Dose Reminders */}
      <Card className="border-border bg-card shadow-xs">
        <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Pill className="w-4 h-4 text-amber-600" />
                  Shift Medication Administration Record (MAR) & Dose Reminders
                </CardTitle>
                <Badge variant="outline" className="text-[10px] font-mono border-amber-500/30 text-amber-700 dark:text-amber-300">
                  Real-Time Dyad Sync
                </Badge>
              </div>
              <CardDescription className="text-xs mt-0.5">
                {completedDoses} of {totalScheduledDoses} scheduled doses administered today. Cross-synced in real time with the family caregiver portal.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                {doseAdherencePercentage}% Completed
              </span>
              <Link href="/medications">
                <Button variant="ghost" size="sm" className="h-8 text-xs font-semibold gap-1 text-primary hover:bg-primary/10">
                  <span>Full Screen & Beers Alerts</span>
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
              <Link href="/medications" className="text-xs font-bold text-primary hover:underline mt-1 inline-block">
                Add medicines on the Medication Schedule page →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {medications.map((med) => {
                const warning = MedicationChecker.checkBeersCriteria(med.name);
                const isAllTaken = med.takenToday;
                return (
                  <div
                    key={med.id}
                    className={cn(
                      'p-3.5 rounded-2xl border flex flex-col justify-between gap-3 transition-all',
                      isAllTaken ? 'border-border bg-muted/20 opacity-85' : 'border-border bg-card shadow-2xs hover:border-primary/40'
                    )}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-xs text-foreground">{med.name}</span>
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
                            isAllTaken ? 'bg-emerald-600 text-white' : 'text-amber-700 dark:text-amber-300 border-amber-500/40'
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
                                  'px-2.5 py-1 rounded-lg border text-[11px] font-semibold flex items-center gap-1 transition-all',
                                  isTaken
                                    ? 'border-emerald-500/80 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300'
                                    : 'border-border bg-background hover:border-emerald-500/50 text-foreground'
                                )}
                              >
                                <div
                                  className={cn(
                                    'w-3 h-3 rounded-full border flex items-center justify-center',
                                    isTaken ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-muted-foreground/50'
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
                        {med.prescribedBy ? `Dr: ${med.prescribedBy}` : 'Daily Schedule'}
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

      <DailyCareLogPanel
        patientUid={currentUid || undefined}
        patientName={patient.name}
        title="Nurse Daily Bedside Sheet"
        medications={medications}
      />

      <CareIntelligencePanel
        patientName={patient.name}
        latestZarit={HealthRepository.getZaritAssessments()[0] || null}
        careGap={HealthRepository.hasStoredDyadProfile() ? HealthRepository.getCareGapEvaluation() : null}
        caregiver={HealthRepository.getCaregiverAttributes()}
        patient={patient}
        vitals={HealthRepository.getVitals()}
        mode="clinician"
      />
    </div>
  );
}
