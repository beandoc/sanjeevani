'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, CheckCircle2, Clock, Plus, Save, Trash2, Users, ShieldAlert, Sparkles, Activity, Stethoscope, AlertTriangle } from 'lucide-react';
import {
  HealthRepository,
  calculateBenchmarkSummary,
  summarizeInpatientObservations,
  type DynamicNursingCareActivity,
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

interface ClinicalPreset {
  name: string;
  category: DynamicNursingCareActivity['category'];
  durationMinutes: number;
  staffCount: 1 | 2;
  frequencyPerDay: number;
  note?: string;
}

const CLINICAL_PRESETS: ClinicalPreset[] = [
  { name: 'Airway / Oral Suctioning', category: 'airway_respiratory', durationMinutes: 10, staffCount: 1, frequencyPerDay: 5, note: 'Secretion clearance & aspiration prevention' },
  { name: "Ryle's Tube / Enteral Feeding", category: 'enteral_nutrition', durationMinutes: 25, staffCount: 1, frequencyPerDay: 5, note: 'Gravity flush & bolus feed at 45° angle' },
  { name: 'Oral Dysphagia Feeding Assist', category: 'enteral_nutrition', durationMinutes: 30, staffCount: 1, frequencyPerDay: 3, note: 'Slow spoon feed with swallow pacing' },
  { name: 'Two-Person Bed Repositioning & Turns', category: 'skin_positioning', durationMinutes: 10, staffCount: 2, frequencyPerDay: 6, note: 'Q3H pressure ulcer relief & sheet slide' },
  { name: 'Adult Diaper Change & Perineal Care', category: 'hygiene_continence', durationMinutes: 15, staffCount: 1, frequencyPerDay: 4, note: 'Barrier cream & skin hygiene' },
  { name: 'Two-Person Transfer (Bed to Chair)', category: 'mobility_transfers', durationMinutes: 12, staffCount: 2, frequencyPerDay: 3, note: 'Dual-staff pivot/lift for high spinal safety' },
  { name: 'Bed Sponge Bath & Linen (2-Staff)', category: 'hygiene_continence', durationMinutes: 30, staffCount: 2, frequencyPerDay: 1, note: 'Full morning hygiene and bedding renewal' },
  { name: 'Wound Dressing & Ulcer Care', category: 'medication_treatments', durationMinutes: 20, staffCount: 1, frequencyPerDay: 1, note: 'Aseptic dressing change' },
  { name: 'Medication Administration & Vitals', category: 'medication_treatments', durationMinutes: 10, staffCount: 1, frequencyPerDay: 3, note: 'Crush/dissolve meds & vital sign logs' }
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
  
  // Dynamic patient care activities
  const [dynamicActivities, setDynamicActivities] = useState<DynamicNursingCareActivity[]>([]);
  
  // Activity form state
  const [customName, setCustomName] = useState('');
  const [customMinutes, setCustomMinutes] = useState(15);
  const [customStaff, setCustomStaff] = useState<1 | 2>(1);
  const [customFreq, setCustomFreq] = useState(4);
  const [customCategory, setCustomCategory] = useState<DynamicNursingCareActivity['category']>('custom');
  const [customNote, setCustomNote] = useState('');

  // Observation episode form state
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
    setDynamicActivities(bm?.dynamicActivities ?? []);
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

  const summary = useMemo(() => {
    return calculateBenchmarkSummary({
      spongeBathMinutes: taskValue('bathing_hygiene'), spongeBathStaffCount: taskStaff('bathing_hygiene'),
      bedToChairTransferMinutes: taskValue('transfers_mobility'), transferStaffCount: taskStaff('transfers_mobility'), transferEpisodesPerDay: schedules.transfers_mobility,
      mealFeedingMinutesPerMeal: taskValue('feeding_meals'), mealsRequiringAssistancePerDay: schedules.feeding_meals,
      toiletingDiaperMinutes: taskValue('toileting_incontinence'), toiletingEpisodesPerDay: schedules.toileting_incontinence, toiletingStaffCount: taskStaff('toileting_incontinence'),
      repositioningTurnMinutes: taskValue('repositioning'), repositioningIntervalHours: repositioningInterval, repositioningStaffCount: taskStaff('repositioning'),
      medicationAdministrationMinutes: taskValue('medications'), medicationSlotsPerDay: schedules.medications,
      environmentalPenaltyMultiplier: 1, observations,
      dynamicActivities
    });
  }, [stats, schedules, observations, dynamicActivities, repositioningInterval]);

  const totalCalculatedHours = summary.inpatientDirectCareMinutesPerDay / 60;
  const lowHours = Math.max(0, Math.round(totalCalculatedHours * 0.85 * 10) / 10);
  const highHours = Math.round(totalCalculatedHours * 1.15 * 10) / 10;
  const hasDualStaff = summary.requiresTwoPersonTransfers || dynamicActivities.some((a) => a.staffCount === 2);

  const addPresetActivity = (preset: ClinicalPreset) => {
    setError(null);
    const existingIdx = dynamicActivities.findIndex((a) => a.name.toLowerCase() === preset.name.toLowerCase());
    if (existingIdx >= 0) {
      setError(`"${preset.name}" is already in the patient's care plan.`);
      return;
    }
    const newAct: DynamicNursingCareActivity = {
      id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: preset.name,
      category: preset.category,
      durationMinutes: preset.durationMinutes,
      staffCount: preset.staffCount,
      frequencyPerDay: preset.frequencyPerDay,
      clinicalNote: preset.note
    };
    setDynamicActivities((prev) => [...prev, newAct]);
  };

  const addCustomActivity = () => {
    setError(null);
    if (!customName.trim()) {
      setError('Please provide a name for the nursing care activity (e.g. Suctioning, Ryle\'s Tube Feed).');
      return;
    }
    if (customMinutes <= 0 || !Number.isFinite(customMinutes)) {
      setError('Enter a valid duration in minutes for this activity.');
      return;
    }
    if (customFreq <= 0 || !Number.isFinite(customFreq)) {
      setError('Enter a valid 24-hour frequency (times per day) for this activity.');
      return;
    }

    const newAct: DynamicNursingCareActivity = {
      id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: customName.trim(),
      category: customCategory,
      durationMinutes: customMinutes,
      staffCount: customStaff,
      frequencyPerDay: customFreq,
      clinicalNote: customNote.trim() || undefined
    };
    setDynamicActivities((prev) => [...prev, newAct]);
    setCustomName('');
    setCustomNote('');
  };

  const removeActivity = (id: string) => {
    setDynamicActivities((prev) => prev.filter((a) => a.id !== id));
  };

  const updateActivityFreq = (id: string, delta: number) => {
    setDynamicActivities((prev) =>
      prev.map((a) => (a.id === id ? { ...a, frequencyPerDay: Math.max(0.5, a.frequencyPerDay + delta) } : a))
    );
  };

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
    if (observations.length === 0 && dynamicActivities.length === 0) {
      setError('Record at least one clinical care activity or observed nursing episode before saving.');
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
      dynamicActivities,
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
    setMessage('Patient-specific pre-discharge nursing assessment saved. Care demand ranges have been recalibrated.');
    onBenchmarkSaved?.(saved);
  };

  const clear = () => {
    HealthRepository.clearInpatientDischargeBenchmark(patientUid);
    setExisting(null);
    setObservations([]);
    setDynamicActivities([]);
    setMessage(null);
    onBenchmarkCleared?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="outline" className="h-11 w-full gap-2 border-indigo-500/30 bg-indigo-50/50 text-xs font-bold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:text-indigo-300 sm:h-10 sm:w-auto">
            <Activity className="w-4 h-4 text-indigo-600" />
            <span>Pre-Discharge Nursing Assessment</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="flex h-[94dvh] w-[calc(100vw-1rem)] max-w-4xl flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:h-auto sm:max-h-[92vh] sm:rounded-3xl">
        <div className="shrink-0 border-b bg-background p-4 pr-12 sm:p-6 sm:pr-12">
          <DialogHeader className="text-left">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <Badge className="bg-indigo-600 text-white text-[10px] uppercase font-bold tracking-wider">
                Clinical Care Timing Engine
              </Badge>
              {hasDualStaff && (
                <Badge className="bg-rose-600 text-white text-[10px] uppercase font-bold tracking-wider flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" /> 2-Person Dual Staff Required
                </Badge>
              )}
            </div>
            <DialogTitle className="flex items-start gap-2 text-base sm:items-center sm:text-lg font-black">
              <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600 sm:mt-0" />
              <span>Pre-Discharge Nursing Assessment: {patientName}</span>
            </DialogTitle>
            <DialogDescription className="text-xs leading-relaxed sm:text-sm text-muted-foreground">
              Define measured task times, 1 vs 2 staff requirements, and 24h frequencies for dependent activities (suctioning, tube feeds, turns, diaper changes).
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto overscroll-contain p-3 sm:p-6" style={{ WebkitOverflowScrolling: 'touch' }}>
          {/* LIVE IMPACT STRIP */}
          <Card className="border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 via-background to-indigo-500/5 shadow-sm">
            <CardContent className="grid gap-3 p-3.5 sm:grid-cols-4 sm:p-4 text-center">
              <div className="p-2 rounded-xl bg-background/90 border border-border/70">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                  Measured Direct Workload
                </span>
                <div className="font-mono text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400">
                  {totalCalculatedHours.toFixed(1)} <span className="text-xs font-normal">h/day</span>
                </div>
              </div>
              <div className="p-2 rounded-xl bg-background/90 border border-border/70">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                  Calibrated Planning Range
                </span>
                <div className="font-mono text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400">
                  {lowHours}–{highHours} <span className="text-xs font-normal">h/day</span>
                </div>
                <span className="text-[9px] text-muted-foreground">Tight ±15% clinical interval</span>
              </div>
              <div className="p-2 rounded-xl bg-background/90 border border-border/70">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                  Active Care Tasks
                </span>
                <div className="text-lg font-black text-foreground">
                  {dynamicActivities.length} <span className="text-xs text-muted-foreground">custom</span> + {observations.length} <span className="text-xs text-muted-foreground">episodes</span>
                </div>
              </div>
              <div className="p-2 rounded-xl bg-background/90 border border-border/70">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                  Manual Handling
                </span>
                <div className={`text-sm font-black uppercase mt-1 ${hasDualStaff ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {hasDualStaff ? '2-Staff Essential' : 'Single Staff Safe'}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* OBSERVER DETAILS */}
          <div className="grid gap-2.5 sm:grid-cols-3">
            <div>
              <label className="text-[11px] font-bold text-muted-foreground uppercase">Observer Role</label>
              <select
                value={observerRole}
                onChange={(e) => setObserverRole(e.target.value as InpatientObserverRole)}
                className="mt-1 h-9 w-full rounded-xl border bg-background px-2.5 text-xs font-medium"
              >
                <option value="staff_nurse">Staff Nurse (RN)</option>
                <option value="doctor">Treating Doctor / Resident</option>
                <option value="gda_technician">GDA / Nursing Attendant</option>
                <option value="physiotherapist">Physiotherapist</option>
                <option value="occupational_therapist">Occupational Therapist</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold text-muted-foreground uppercase">Observer Name / Designation</label>
              <input
                value={observerName}
                onChange={(e) => setObserverName(e.target.value)}
                className="mt-1 h-9 w-full rounded-xl border bg-background px-2.5 text-xs"
                placeholder="e.g. Sister Sunita, Ward 4"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-muted-foreground uppercase">Ward / Bed Number</label>
              <input
                value={wardOrBedNumber}
                onChange={(e) => setWardOrBedNumber(e.target.value)}
                className="mt-1 h-9 w-full rounded-xl border bg-background px-2.5 text-xs"
                placeholder="e.g. HDU Bed 12"
              />
            </div>
          </div>

          {/* SECTION 1: CLINICAL PRESETS (1-TAP QUICK ADD) */}
          <div className="space-y-2 rounded-2xl border border-border/80 bg-card p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-foreground">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> High-Acuity Clinical Presets (1-Tap Add)
              </span>
              <span className="text-[10px] text-muted-foreground">Click to add to patient care routine</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {CLINICAL_PRESETS.map((preset) => {
                const isAdded = dynamicActivities.some((a) => a.name.toLowerCase() === preset.name.toLowerCase());
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => addPresetActivity(preset)}
                    disabled={isAdded}
                    className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition-all ${
                      isAdded
                        ? 'border-emerald-500/30 bg-emerald-50/50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300 opacity-60 cursor-not-allowed'
                        : 'border-border bg-background hover:border-indigo-500 hover:bg-indigo-50/50 hover:text-indigo-700 dark:hover:bg-indigo-950/30 cursor-pointer shadow-2xs'
                    }`}
                  >
                    <Plus className="w-3 h-3 text-indigo-600" />
                    <span>{preset.name}</span>
                    <span className="text-[10px] text-muted-foreground">
                      ({preset.durationMinutes}m · {preset.staffCount}p · {preset.frequencyPerDay}×)
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 2: ADD DYNAMIC CARE ACTIVITY */}
          <div className="space-y-3 rounded-2xl border border-indigo-500/30 bg-indigo-500/5 p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                <Stethoscope className="w-3.5 h-3.5" /> Add Patient-Specific Care Activity
              </span>
              <span className="text-[10px] text-muted-foreground">Dynamic timings, staff count & 24h frequency</span>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-12">
              <div className="sm:col-span-4">
                <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-0.5">Activity Name</label>
                <input
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Suctioning, Ryle's Tube Feed"
                  className="h-10 w-full rounded-xl border bg-background px-2.5 text-xs font-semibold"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-0.5">Time (Mins)</label>
                <input
                  type="number"
                  min={1}
                  max={180}
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(Number(e.target.value))}
                  className="h-10 w-full rounded-xl border bg-background px-2 text-xs font-mono font-bold"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-0.5">Staff Count</label>
                <select
                  value={customStaff}
                  onChange={(e) => setCustomStaff(Number(e.target.value) as 1 | 2)}
                  className={`h-10 w-full rounded-xl border px-2 text-xs font-bold ${
                    customStaff === 2 ? 'border-rose-500/50 bg-rose-50 text-rose-700 dark:bg-rose-950/30' : 'bg-background'
                  }`}
                >
                  <option value={1}>1 Person</option>
                  <option value={2}>2 Persons (Dual Staff)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-0.5">24h Frequency</label>
                <input
                  type="number"
                  min={0.5}
                  max={24}
                  step={0.5}
                  value={customFreq}
                  onChange={(e) => setCustomFreq(Number(e.target.value))}
                  className="h-10 w-full rounded-xl border bg-background px-2 text-xs font-mono font-bold"
                />
              </div>

              <div className="sm:col-span-2 flex items-end">
                <Button
                  type="button"
                  onClick={addCustomActivity}
                  className="h-10 w-full gap-1 bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-700"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Task
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <input
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="Optional clinical note (e.g. requires 2 persons due to severe extensor spasticity)..."
                className="h-8 w-full rounded-xl border bg-background px-2.5 text-xs text-muted-foreground"
              />
            </div>
          </div>

          {/* ACTIVE DYNAMIC ACTIVITIES LIST */}
          {dynamicActivities.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <span>Configured Clinical Care Schedule ({dynamicActivities.length} Tasks)</span>
                <span>Workload Contribution</span>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {dynamicActivities.map((act) => {
                  const dailyStaffMins = act.durationMinutes * act.frequencyPerDay * act.staffCount;
                  const dailyHours = (dailyStaffMins / 60).toFixed(1);
                  return (
                    <div
                      key={act.id}
                      className="flex flex-col justify-between rounded-xl border border-border/80 bg-card p-3 shadow-2xs space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            {act.name}
                            {act.staffCount === 2 && (
                              <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-300 text-[9px] font-bold px-1.5 py-0 border-rose-500/30">
                                2-Staff
                              </Badge>
                            )}
                          </div>
                          {act.clinicalNote && (
                            <p className="text-[10px] text-muted-foreground leading-snug mt-0.5">{act.clinicalNote}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeActivity(act.id)}
                          aria-label={`Remove ${act.name}`}
                          className="text-muted-foreground hover:text-rose-600 text-base leading-none p-1 cursor-pointer"
                        >
                          ×
                        </button>
                      </div>

                      <div className="flex items-center justify-between border-t border-border/50 pt-2 text-xs">
                        <div className="flex items-center gap-1 text-[11px] font-mono">
                          <span>{act.durationMinutes}m</span>
                          <span className="text-muted-foreground">×</span>
                          <span className="font-bold">{act.frequencyPerDay}/day</span>
                          <span className="text-muted-foreground">×</span>
                          <span>{act.staffCount}p</span>
                          <div className="inline-flex gap-0.5 ml-1">
                            <button
                              type="button"
                              onClick={() => updateActivityFreq(act.id, -1)}
                              className="px-1 bg-muted rounded text-[10px] font-bold hover:bg-muted-foreground/20"
                            >
                              -
                            </button>
                            <button
                              type="button"
                              onClick={() => updateActivityFreq(act.id, 1)}
                              className="px-1 bg-muted rounded text-[10px] font-bold hover:bg-muted-foreground/20"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {dailyHours} h/day
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION 3: STANDARD ADL OBSERVED EPISODES */}
          <details className="rounded-2xl border border-border/80 bg-muted/20 p-3 sm:p-4 text-xs">
            <summary className="font-bold cursor-pointer text-muted-foreground hover:text-foreground">
              Optional: Log Individual Timed Nursing Episodes (Ward Benchmark)
            </summary>
            <div className="mt-3 space-y-3">
              <div className="grid gap-2 sm:grid-cols-5">
                <select value={task} onChange={(e) => setTask(e.target.value as InpatientCareTaskCategory)} className="h-10 rounded-xl border bg-background p-2 text-xs">
                  {TASKS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
                <input type="datetime-local" value={observedAt} onChange={(e) => setObservedAt(e.target.value)} className="h-10 rounded-xl border bg-background p-2 text-xs" />
                <label className="flex h-10 items-center gap-1 rounded-xl border px-2 text-xs">
                  <input type="number" min={1} max={180} value={durationMinutes} onChange={(e) => setDurationMinutes(Number(e.target.value))} className="w-full bg-transparent py-2 outline-none" /> min
                </label>
                <select value={staffCount} onChange={(e) => setStaffCount(Number(e.target.value) as 1 | 2)} className="h-10 rounded-xl border bg-background p-2 text-xs">
                  <option value={1}>1 staff</option>
                  <option value={2}>2 staff</option>
                </select>
                <Button type="button" className="h-10 w-full" onClick={addObservation}>
                  <Plus className="mr-1 h-3.5 w-3.5" /> Log Episode
                </Button>
              </div>

              {observations.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {observations.map((row) => (
                    <Badge key={row.id} variant="outline" className="gap-1 py-1 text-[10px]">
                      {new Date(row.observedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {row.taskCategory} · {row.durationMinutes}m · {row.staffCount}p
                      <button type="button" onClick={() => setObservations((all) => all.filter((o) => o.id !== row.id))} className="ml-1 text-rose-600 font-bold">×</button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </details>

          <textarea
            rows={2}
            value={clinicalDischargeNotes}
            onChange={(e) => setClinicalDischargeNotes(e.target.value)}
            className="w-full rounded-xl border bg-background p-2.5 text-xs"
            placeholder="Discharge handling instructions, emergency contact readiness, and home care precautions..."
          />

          {error && <div className="rounded-xl bg-rose-500/10 p-2.5 text-xs font-semibold text-rose-700 dark:text-rose-300">{error}</div>}
          {message && <div className="rounded-xl bg-emerald-500/10 p-2.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300"><CheckCircle2 className="mr-1 inline h-4 w-4" />{message}</div>}
        </div>

        <DialogFooter className="shrink-0 gap-2 border-t bg-background/95 p-3 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between sm:p-4">
          <div>
            {existing && (
              <Button type="button" variant="ghost" onClick={clear} className="h-11 w-full text-rose-600 sm:w-auto">
                <Trash2 className="mr-1 h-4 w-4" /> Clear Assessment
              </Button>
            )}
          </div>
          <Button type="button" onClick={save} className="h-11 w-full bg-indigo-600 text-white font-bold hover:bg-indigo-700 sm:w-auto">
            <Save className="mr-1 h-4 w-4" /> Save Nursing Assessment & Recalibrate Demand
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
