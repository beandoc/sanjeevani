'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, CheckCircle2, Clock, Plus, Save, Trash2, Users } from 'lucide-react';
import {
  HealthRepository,
  calculateBenchmarkSummary,
  summarizeInpatientObservations,
  type InpatientCareEpisodeObservation,
  type InpatientCareTaskCategory,
  type InpatientDischargeBenchmark,
  type InpatientObserverRole
} from '@/lib/db/health-repository';
import type { PatientDependenceProfile } from '@/lib/clinical/care-gap-engine';

interface Props {
  patientUid: string;
  patientName: string;
  patientProfile?: PatientDependenceProfile | null;
  onBenchmarkSaved?: (benchmark: InpatientDischargeBenchmark) => void;
  onBenchmarkCleared?: () => void;
  trigger?: React.ReactNode;
}

const TASKS: Array<{ id: InpatientCareTaskCategory; label: string; scheduleLabel: string }> = [
  { id: 'bathing_hygiene', label: 'Bathing / hygiene', scheduleLabel: 'episodes/day' },
  { id: 'transfers_mobility', label: 'Transfers / mobility', scheduleLabel: 'episodes/day' },
  { id: 'feeding_meals', label: 'Feeding assistance', scheduleLabel: 'meals/day' },
  { id: 'toileting_incontinence', label: 'Toileting / continence', scheduleLabel: 'episodes/day' },
  { id: 'repositioning', label: 'Bed repositioning', scheduleLabel: 'turns/day' },
  { id: 'medications', label: 'Medication administration', scheduleLabel: 'slots/day' }
];

type Schedules = Record<InpatientCareTaskCategory, number>;
const EMPTY_SCHEDULES: Schedules = {
  bathing_hygiene: 1,
  transfers_mobility: 0,
  feeding_meals: 0,
  toileting_incontinence: 0,
  repositioning: 0,
  medications: 0
};

const localDateTimeValue = (date = new Date()) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
};

const inferredBlock = (iso: string): NonNullable<InpatientCareEpisodeObservation['timeBlock']> => {
  const hour = new Date(iso).getHours();
  if (hour < 8 || hour >= 22) return 'night_watch';
  if (hour < 11) return 'morning_rush';
  if (hour < 17) return 'afternoon';
  return 'evening';
};

export function InpatientDischargeBenchmarkDialog({ patientUid, patientName, patientProfile, onBenchmarkSaved, onBenchmarkCleared, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [existing, setExisting] = useState<InpatientDischargeBenchmark | null>(null);
  const [observerRole, setObserverRole] = useState<InpatientObserverRole>('staff_nurse');
  const [observerName, setObserverName] = useState('');
  const [wardOrBedNumber, setWardOrBedNumber] = useState('');
  const [observations, setObservations] = useState<InpatientCareEpisodeObservation[]>([]);
  const [schedules, setSchedules] = useState<Schedules>(EMPTY_SCHEDULES);
  const [task, setTask] = useState<InpatientCareTaskCategory>('bathing_hygiene');
  const [durationMinutes, setDurationMinutes] = useState(10);
  const [staffCount, setStaffCount] = useState<1 | 2>(1);
  const [observedAt, setObservedAt] = useState(localDateTimeValue());
  const [episodeNote, setEpisodeNote] = useState('');
  const [clinicalDischargeNotes, setClinicalDischargeNotes] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const bm = patientProfile?.inpatientBenchmark ?? HealthRepository.getInpatientDischargeBenchmark(patientUid);
    setExisting(bm);
    setObserverRole(bm?.observerRole ?? 'staff_nurse');
    setObserverName(bm?.observerName ?? '');
    setWardOrBedNumber(bm?.wardOrBedNumber ?? '');
    setObservations(bm?.observations ?? []);
    setSchedules({
      bathing_hygiene: 1,
      transfers_mobility: bm?.transferEpisodesPerDay ?? (bm?.bedToChairTransferMinutes ? 3 : 0),
      feeding_meals: bm?.mealsRequiringAssistancePerDay ?? 0,
      toileting_incontinence: bm?.toiletingEpisodesPerDay ?? 0,
      repositioning: bm?.repositioningIntervalHours ? Math.round(24 / bm.repositioningIntervalHours) : 0,
      medications: bm?.medicationSlotsPerDay ?? 0
    });
    setClinicalDischargeNotes(bm?.clinicalDischargeNotes ?? '');
    setMessage(null);
    setError(null);
  }, [open, patientUid, patientProfile]);

  const stats = useMemo(() => summarizeInpatientObservations(observations), [observations]);
  const taskValue = (category: InpatientCareTaskCategory) => stats[category]?.medianMinutes ?? 0;
  const taskStaff = (category: InpatientCareTaskCategory): 1 | 2 => stats[category]?.staffCount ?? 1;
  const repositioningInterval = schedules.repositioning > 0 ? Math.max(1, 24 / schedules.repositioning) : 24;

  const summary = calculateBenchmarkSummary({
    spongeBathMinutes: taskValue('bathing_hygiene'), spongeBathStaffCount: taskStaff('bathing_hygiene'),
    bedToChairTransferMinutes: taskValue('transfers_mobility'), transferStaffCount: taskStaff('transfers_mobility'), transferEpisodesPerDay: schedules.transfers_mobility,
    mealFeedingMinutesPerMeal: taskValue('feeding_meals'), mealsRequiringAssistancePerDay: schedules.feeding_meals,
    toiletingDiaperMinutes: taskValue('toileting_incontinence'), toiletingEpisodesPerDay: schedules.toileting_incontinence, toiletingStaffCount: taskStaff('toileting_incontinence'),
    repositioningTurnMinutes: taskValue('repositioning'), repositioningIntervalHours: repositioningInterval, repositioningStaffCount: taskStaff('repositioning'),
    medicationAdministrationMinutes: taskValue('medications'), medicationSlotsPerDay: schedules.medications,
    environmentalPenaltyMultiplier: 1, observations
  });

  const addObservation = () => {
    setError(null);
    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
      setError('Enter the measured duration for this episode.');
      return;
    }
    const iso = new Date(observedAt).toISOString();
    setObservations((current) => [...current, {
      id: `inpatient_obs_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      taskCategory: task, observedAt: iso, durationMinutes, staffCount,
      timeBlock: inferredBlock(iso), note: episodeNote.trim() || undefined
    }]);
    setEpisodeNote('');
  };

  const save = () => {
    setError(null);
    setMessage(null);
    if (observations.length === 0) {
      setError('Record at least one actually observed nursing episode before saving.');
      return;
    }
    if (!patientProfile?.isFunctionalAssessmentCompleted) {
      setError('Complete the discharge Barthel/Lawton or Katz assessment before saving this observation baseline.');
      return;
    }
    const dates = observations.map((o) => o.observedAt).sort();
    const saved = HealthRepository.saveInpatientDischargeBenchmark({
      id: existing?.id, recordedAt: existing?.recordedAt, patientUid, observerRole,
      observerName: observerName.trim() || 'Ward clinical staff',
      wardOrBedNumber: wardOrBedNumber.trim() || undefined,
      observations, observationWindowStart: dates[0], observationWindowEnd: dates[dates.length - 1],
      methodologyVersion: 'patient-episode-v1',
      baselineBarthelResponses: existing?.baselineBarthelResponses ?? patientProfile?.gradedFunctionResponses?.barthel,
      baselineLawtonResponses: existing?.baselineLawtonResponses ?? patientProfile?.gradedFunctionResponses?.lawton,
      baselineKatzAdl: existing?.baselineKatzAdl ?? patientProfile?.katzAdl,
      baselineIsBedBound: existing?.baselineIsBedBound ?? patientProfile?.isBedBound,
      baselineFunctionalAssessedAt: existing?.baselineFunctionalAssessedAt ?? patientProfile?.functionalAssessedAt,
      spongeBathMinutes: taskValue('bathing_hygiene'), spongeBathStaffCount: taskStaff('bathing_hygiene'),
      bedToChairTransferMinutes: taskValue('transfers_mobility'), transferEpisodesPerDay: schedules.transfers_mobility,
      transferStaffCount: taskStaff('transfers_mobility'),
      transferAssistType: taskStaff('transfers_mobility') === 2 ? 'two_person_lift_or_sheet' : 'one_person_pivot',
      mealFeedingMinutesPerMeal: taskValue('feeding_meals'), mealsRequiringAssistancePerDay: schedules.feeding_meals,
      feedingAssistType: schedules.feeding_meals > 0 ? 'full_spoon_feeding' : 'independent',
      toiletingDiaperMinutes: taskValue('toileting_incontinence'), toiletingEpisodesPerDay: schedules.toileting_incontinence,
      toiletingStaffCount: taskStaff('toileting_incontinence'), repositioningTurnMinutes: taskValue('repositioning'),
      repositioningIntervalHours: repositioningInterval, repositioningStaffCount: taskStaff('repositioning'),
      medicationAdministrationMinutes: taskValue('medications'), medicationSlotsPerDay: schedules.medications,
      environmentalPenaltyMultiplier: 1, clinicalDischargeNotes: clinicalDischargeNotes.trim() || undefined
    });
    setExisting(saved);
    setMessage('Patient-specific pre-discharge estimate saved.');
    onBenchmarkSaved?.(saved);
  };

  const clear = () => {
    HealthRepository.clearInpatientDischargeBenchmark(patientUid);
    setExisting(null);
    setObservations([]);
    setMessage(null);
    onBenchmarkCleared?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger ?? <Button>Record nursing episodes</Button>}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Building2 className="w-5 h-5 text-indigo-600" />Pre-discharge nursing observations: {patientName}</DialogTitle>
          <DialogDescription>Record actual episodes observed near discharge. The estimate is for care planning and clinician review and must be reassessed after transition home.</DialogDescription>
        </DialogHeader>

        {existing && existing.methodologyVersion !== 'patient-episode-v1' && <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200">This patient has a legacy one-value summary. Add raw episodes below before treating it as a patient-specific empirical estimate.</div>}

        <Card className="border-indigo-500/25"><CardContent className="grid gap-3 p-4 sm:grid-cols-3">
          <div><span className="text-[10px] uppercase text-muted-foreground">Observed workload</span><div className="font-mono text-xl font-black">{(summary.inpatientDirectCareMinutesPerDay / 60).toFixed(1)} h/day</div></div>
          <div><span className="text-[10px] uppercase text-muted-foreground">Evidence</span><div className="text-sm font-bold">{observations.length} episodes · {Object.keys(stats).length} tasks</div></div>
          <div><span className="text-[10px] uppercase text-muted-foreground">Method</span><div className="text-sm font-bold">Median time × schedule × staff</div><div className="text-[10px] text-muted-foreground">No universal home multiplier</div></div>
        </CardContent></Card>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-xs font-semibold">Observer role<select value={observerRole} onChange={(e) => setObserverRole(e.target.value as InpatientObserverRole)} className="mt-1 w-full rounded-xl border bg-background p-2"><option value="staff_nurse">Staff nurse</option><option value="gda_technician">GDA / technician</option><option value="doctor">Doctor</option><option value="physiotherapist">Physiotherapist</option><option value="occupational_therapist">Occupational therapist</option></select></label>
          <label className="text-xs font-semibold">Observer name<input value={observerName} onChange={(e) => setObserverName(e.target.value)} className="mt-1 w-full rounded-xl border bg-background p-2" placeholder="Name / designation" /></label>
          <label className="text-xs font-semibold">Ward / bed<input value={wardOrBedNumber} onChange={(e) => setWardOrBedNumber(e.target.value)} className="mt-1 w-full rounded-xl border bg-background p-2" /></label>
        </div>

        <div className="rounded-2xl border p-4 space-y-3">
          <div className="flex items-center gap-2 font-bold text-sm"><Clock className="w-4 h-4" /> Add an observed episode</div>
          <div className="grid gap-2 sm:grid-cols-5">
            <select value={task} onChange={(e) => setTask(e.target.value as InpatientCareTaskCategory)} className="rounded-xl border bg-background p-2 text-xs">{TASKS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}</select>
            <input type="datetime-local" value={observedAt} onChange={(e) => setObservedAt(e.target.value)} className="rounded-xl border bg-background p-2 text-xs" />
            <label className="flex items-center gap-1 rounded-xl border px-2 text-xs"><input type="number" min={1} max={180} value={durationMinutes} onChange={(e) => setDurationMinutes(Number(e.target.value))} className="w-full bg-transparent py-2 outline-none" /> min</label>
            <select value={staffCount} onChange={(e) => setStaffCount(Number(e.target.value) as 1 | 2)} className="rounded-xl border bg-background p-2 text-xs"><option value={1}>1 staff</option><option value={2}>2 staff</option></select>
            <Button type="button" size="sm" onClick={addObservation}><Plus className="mr-1 h-4 w-4" /> Add</Button>
          </div>
          <input value={episodeNote} onChange={(e) => setEpisodeNote(e.target.value)} className="w-full rounded-xl border bg-background p-2 text-xs" placeholder="Optional episode note: equipment, interruption, atypical event…" />
        </div>

        <div className="space-y-2">{TASKS.map((taskDef) => {
          const taskStats = stats[taskDef.id];
          const rows = observations.filter((o) => o.taskCategory === taskDef.id);
          return <div key={taskDef.id} className="rounded-xl border p-3">
            <div className="flex flex-wrap items-center justify-between gap-2"><div><div className="text-sm font-bold">{taskDef.label}</div><div className="text-[11px] text-muted-foreground">{taskStats ? `${taskStats.observationCount} observed · median ${taskStats.medianMinutes} min · range ${taskStats.minMinutes}–${taskStats.maxMinutes} · ${taskStats.staffCount} staff` : 'No observed episode'}</div></div>
              <label className="flex items-center gap-2 text-xs">Planned {taskDef.scheduleLabel}<input type="number" min={0} max={24} step={0.5} value={schedules[taskDef.id]} onChange={(e) => setSchedules((s) => ({ ...s, [taskDef.id]: Math.max(0, Number(e.target.value)) }))} className="w-20 rounded-lg border bg-background p-1.5 font-mono" /></label></div>
            {rows.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{rows.map((row) => <Badge key={row.id} variant="outline" className="gap-1 text-[10px]">{new Date(row.observedAt).toLocaleString()} · {row.durationMinutes} min · {row.staffCount} staff<button type="button" aria-label="Remove observation" onClick={() => setObservations((all) => all.filter((o) => o.id !== row.id))} className="ml-1 text-rose-600">×</button></Badge>)}</div>}
          </div>;
        })}</div>

        <div className="rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground"><Users className="mr-1 inline h-4 w-4" />The first save captures the discharge Barthel/Lawton or Katz state. Future reassessments adjust only matching tasks; raw nursing observations remain unchanged.</div>
        <textarea rows={2} value={clinicalDischargeNotes} onChange={(e) => setClinicalDischargeNotes(e.target.value)} className="w-full rounded-xl border bg-background p-2.5 text-xs" placeholder="Discharge handling instructions and home-context considerations" />
        {error && <div className="rounded-xl bg-rose-500/10 p-2.5 text-xs font-semibold text-rose-700">{error}</div>}
        {message && <div className="rounded-xl bg-emerald-500/10 p-2.5 text-xs font-semibold text-emerald-700"><CheckCircle2 className="mr-1 inline h-4 w-4" />{message}</div>}
        <DialogFooter className="flex items-center justify-between gap-2"><div>{existing && <Button type="button" variant="ghost" size="sm" onClick={clear} className="text-rose-600"><Trash2 className="mr-1 h-4 w-4" /> Clear</Button>}</div><Button type="button" onClick={save}><Save className="mr-1 h-4 w-4" /> Save empirical baseline</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
