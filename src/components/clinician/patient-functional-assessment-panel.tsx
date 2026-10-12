'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Activity,
  AlertTriangle,
  ClipboardPlus,
  ArrowRight,
  ArrowLeft,
  ShieldAlert,
  Sparkles,
  Bed,
  Layers,
  Calendar,
  RefreshCw,
  Clock,
  Building2,
  CheckCircle2,
  Edit3,
  Save
} from 'lucide-react';
import { FunctionAssessmentForm } from '@/components/clinical/function-assessment-form';
import type { PatientDependenceProfile, CareGapEvaluationResult } from '@/lib/clinical/care-gap-engine';
import type { FunctionEvaluationResult } from '@/lib/clinical/function-scale';
import { cn } from '@/lib/utils';
import { CareDemandBandValue } from '@/components/clinical/care-demand-band';
import { EvidenceLevelBadge } from '@/components/clinical/evidence-level-badge';
import {
  HealthRepository,
  calculateBenchmarkSummary,
  type InpatientDischargeBenchmark,
  type DynamicNursingCareActivity
} from '@/lib/db/health-repository';
import { CaregiverDiaryHistoryDialog } from '@/components/caregiver/caregiver-diary-history-dialog';
import { InpatientDischargeBenchmarkDialog } from './inpatient-discharge-benchmark-dialog';

interface KatzDomainCareTimingCardProps {
  title: string;
  icon: React.ReactNode;
  isIndependent: boolean;
  isAssessed: boolean;
  isUpdating: boolean;
  onToggle: (val: boolean) => void;
  descriptionIndependent: string;
  descriptionDependent: string;
  impactIndependent: string;
  impactDependent: string;
  activityName: string;
  activityCategoryLabel?: string;
  minutes: number;
  frequency: number;
  frequencyUnit?: 'day' | 'week';
  staff?: 1 | 2;
  allowStaffToggle?: boolean;
  extraTurnHours?: number;
  extraDynamicActivities?: DynamicNursingCareActivity[];
  domainType?: 'katz_physical' | 'lawton_iadl';
  onSaveTiming: (minutes: number, frequency: number, staff: 1 | 2) => Promise<void>;
}

function KatzDomainCareTimingCard({
  title,
  icon,
  isIndependent,
  isAssessed,
  isUpdating,
  onToggle,
  descriptionIndependent,
  descriptionDependent,
  impactIndependent,
  impactDependent,
  activityName,
  minutes,
  frequency,
  frequencyUnit = 'day',
  staff = 1,
  allowStaffToggle = false,
  extraTurnHours = 0,
  extraDynamicActivities = [],
  domainType = 'katz_physical',
  onSaveTiming
}: KatzDomainCareTimingCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editMinutes, setEditMinutes] = useState(minutes);
  const [editFrequency, setEditFrequency] = useState(frequency);
  const [editStaff, setEditStaff] = useState<1 | 2>(staff);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setEditMinutes(minutes);
    setEditFrequency(frequency);
    setEditStaff(staff);
  }, [minutes, frequency, staff]);

  const dailyFreq = frequencyUnit === 'week' ? frequency / 7 : frequency;
  const baseHours = (minutes * dailyFreq * (staff ?? 1)) / 60;
  const extraDynamicHours = extraDynamicActivities.reduce(
    (acc, act) => acc + (act.durationMinutes * act.frequencyPerDay * (act.staffCount ?? 1)) / 60,
    0
  );
  const totalDemandHours = Math.round((baseHours + extraTurnHours + extraDynamicHours) * 10) / 10;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveTiming(Number(editMinutes) || 1, Number(editFrequency) || 1, editStaff);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className={cn(
        'p-3.5 rounded-2xl border transition-all flex flex-col justify-between shadow-2xs',
        !isAssessed
          ? 'bg-card border-border/70'
          : isIndependent
          ? 'bg-emerald-500/5 border-emerald-500/30 dark:bg-emerald-950/20'
          : 'bg-rose-500/5 border-rose-500/30 dark:bg-rose-950/20'
      )}
    >
      <div>
        {/* Top Header: Title, Icon, Toggle Switch */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            {icon}
            <span className="font-bold text-xs text-foreground">{title}</span>
          </div>
          <Switch
            checked={isIndependent}
            onCheckedChange={onToggle}
            disabled={isUpdating}
            title={`Toggle independent vs dependent ${title}`}
          />
        </div>

        {/* Clinical Guidance Text */}
        <p className="text-xs text-foreground/80 leading-relaxed">
          {isIndependent ? descriptionIndependent : descriptionDependent}
        </p>

        {/* Impact On Caregiver Pill */}
        <div className="mt-2.5 pt-2 border-t border-border/40 flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground font-medium">Caregiver Impact:</span>
          <span
            className={cn(
              'font-bold',
              !isAssessed
                ? 'text-muted-foreground'
                : isIndependent
                ? 'text-emerald-700 dark:text-emerald-400'
                : 'text-rose-700 dark:text-rose-400'
            )}
          >
            {!isAssessed ? '● Pending Intake' : isIndependent ? impactIndependent : impactDependent}
          </span>
        </div>

        {/* ALIGNED NURSING ACTIVITY & TIMING BLOCK */}
        <div className="mt-3 pt-2.5 border-t border-border/60 space-y-2">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3 text-indigo-500" />
              <span>Nursing Timing & Care Demand</span>
            </span>
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="w-2.5 h-2.5" />
              <span>{isEditing ? 'Close' : 'Adjust Timing'}</span>
            </button>
          </div>

          {/* Quick Edit Form */}
          {isEditing ? (
            <div className="p-2.5 rounded-xl border border-indigo-500/30 bg-background/95 space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground block mb-0.5">
                    Duration (mins)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={180}
                    value={editMinutes}
                    onChange={(e) => setEditMinutes(Math.max(1, Number(e.target.value)))}
                    className="w-full px-2 py-1 text-xs font-mono font-bold rounded-lg border border-border bg-card focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground block mb-0.5">
                    {frequencyUnit === 'week' ? 'Freq (times/week)' : 'Freq (times/24h)'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={frequencyUnit === 'week' ? 28 : 24}
                    value={editFrequency}
                    onChange={(e) => setEditFrequency(Math.max(1, Number(e.target.value)))}
                    className="w-full px-2 py-1 text-xs font-mono font-bold rounded-lg border border-border bg-card focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {allowStaffToggle && (
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground block mb-1">
                    Staff Required
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEditStaff(1)}
                      className={cn(
                        'py-1 rounded-lg text-[11px] font-bold border cursor-pointer',
                        editStaff === 1
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-muted/50 border-border text-foreground hover:bg-muted'
                      )}
                    >
                      1 Person
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditStaff(2)}
                      className={cn(
                        'py-1 rounded-lg text-[11px] font-bold border cursor-pointer',
                        editStaff === 2
                          ? 'bg-rose-600 text-white border-rose-600'
                          : 'bg-muted/50 border-border text-foreground hover:bg-muted'
                      )}
                    >
                      2 Persons (Dual)
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-1.5 pt-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditing(false)}
                  className="h-7 text-[11px] px-2"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="h-7 text-[11px] px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  <Save className="w-3 h-3 mr-1" />
                  Save Timing
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="text-[11px] text-foreground/85 flex items-center justify-between">
                <span className="font-semibold truncate" title={activityName}>
                  {activityName}
                </span>
                {staff === 2 && (
                  <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-300 text-[9px] font-bold px-1 py-0 border-rose-500/30 shrink-0">
                    2-Staff Required
                  </Badge>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground font-mono">
                {minutes} mins × {frequency} {frequencyUnit === 'week' ? 'times/wk' : 'episodes/day'} {staff === 2 ? '(2 Staff)' : '(1 Staff)'}
              </p>

              {extraTurnHours > 0 && (
                <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono">
                  + 2-hourly turning turns: {extraTurnHours.toFixed(1)} hrs/day
                </p>
              )}

              {extraDynamicActivities.map((act) => (
                <p key={act.id} className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono truncate">
                  + {act.name}: {act.durationMinutes}m × {act.frequencyPerDay}x
                </p>
              ))}
            </div>
          )}

          {/* Dynamic Calculation Strip */}
          {!isAssessed ? (
            <div className="p-2 rounded-xl bg-muted/60 border border-border text-center text-[10px] text-muted-foreground font-semibold">
              Timing calibrated • Awaiting clinical baseline toggle
            </div>
          ) : isIndependent ? (
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between gap-1 text-[11px]">
              <span className="text-emerald-800 dark:text-emerald-300 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>0 Assistance Multiplier</span>
              </span>
              <div className="text-right">
                <span className="font-black font-mono text-emerald-900 dark:text-emerald-100">
                  0.0 h
                </span>
                <span className="block text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">
                  (Saved {totalDemandHours.toFixed(1)}h/day)
                </span>
              </div>
            </div>
          ) : (
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between gap-1 text-[11px]">
              <span className="text-amber-800 dark:text-amber-300 font-bold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>{domainType === 'lawton_iadl' ? 'Active Domestic Demand:' : 'Active Care Demand:'}</span>
              </span>
              <span className="font-black font-mono text-amber-900 dark:text-amber-100">
                {totalDemandHours.toFixed(1)} hrs/day
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const LawtonDomainCareTimingCard = KatzDomainCareTimingCard;

interface PatientFunctionalAssessmentPanelProps {
  patientUid: string;
  patientName: string;
  patientProfile: PatientDependenceProfile | null;
  functionScores: FunctionEvaluationResult[];
  careGapResult: CareGapEvaluationResult;
  isAssessed?: boolean;
  onSaveProfile: (updated: PatientDependenceProfile) => Promise<boolean | void>;
  onAssessmentCompleted: (result: FunctionEvaluationResult) => Promise<void>;
  onProceedToMatrix: () => void;
}

export function PatientFunctionalAssessmentPanel({
  patientUid,
  patientName,
  patientProfile,
  functionScores,
  careGapResult,
  isAssessed = false,
  onSaveProfile,
  onAssessmentCompleted,
  onProceedToMatrix
}: PatientFunctionalAssessmentPanelProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [intakePart, setIntakePart] = useState<'basic' | 'instrumental'>('basic');
  const [isDiaryModalOpen, setIsDiaryModalOpen] = useState(false);

  // Read caregiver empirical diary summary for live calibration feedback
  const diarySummary = HealthRepository.getCaregiverDiaryCalibrationSummary(patientUid);

  const benchmark = patientProfile?.inpatientBenchmark ?? HealthRepository.getInpatientDischargeBenchmark(patientUid);

  const allDynamicActivities: DynamicNursingCareActivity[] = [
    ...(patientProfile?.dynamicNursingActivities ?? []),
    ...(benchmark?.dynamicActivities ?? [])
  ];

  const handleBenchmarkSaved = async (newBenchmark: InpatientDischargeBenchmark) => {
    if (!patientProfile) return;
    setIsUpdating(true);
    try {
      const updated: PatientDependenceProfile = {
        ...patientProfile,
        inpatientBenchmark: newBenchmark
      };
      await onSaveProfile(updated);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBenchmarkCleared = async () => {
    if (!patientProfile) return;
    setIsUpdating(true);
    try {
      const { inpatientBenchmark: _unused, ...rest } = patientProfile;
      await onSaveProfile(rest as PatientDependenceProfile);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateDomainBenchmark = async (patch: Partial<InpatientDischargeBenchmark>) => {
    if (!patientProfile) return;
    setIsUpdating(true);
    try {
      const existingBm: InpatientDischargeBenchmark = benchmark || {
        id: `bm_${Date.now()}`,
        patientUid,
        recordedAt: new Date().toISOString(),
        observerRole: 'staff_nurse',
        observerName: 'Care Team',
        spongeBathMinutes: 25,
        spongeBathStaffCount: 1,
        dressingMinutes: 15,
        dressingSlotsPerDay: 2,
        bedToChairTransferMinutes: 12,
        transferEpisodesPerDay: 3,
        transferStaffCount: 2,
        transferAssistType: 'two_person_lift_or_sheet',
        mealFeedingMinutesPerMeal: 30,
        mealsRequiringAssistancePerDay: 3,
        feedingAssistType: 'setup_and_prompting',
        toiletingDiaperMinutes: 15,
        toiletingEpisodesPerDay: 4,
        toiletingStaffCount: 1,
        repositioningTurnMinutes: 10,
        repositioningIntervalHours: 3,
        repositioningStaffCount: 2,
        medicationAdministrationMinutes: 10,
        medicationSlotsPerDay: 3,
        environmentalPenaltyMultiplier: 1,
        inpatientDirectCareMinutesPerDay: 0,
        homeProjectedDirectCareHoursPerDay: 0,
        requiresTwoPersonTransfers: false
      };

      const updatedBm: InpatientDischargeBenchmark = {
        ...existingBm,
        ...patch,
        recordedAt: new Date().toISOString()
      };

      const summary = calculateBenchmarkSummary({
        spongeBathMinutes: updatedBm.spongeBathMinutes,
        spongeBathStaffCount: updatedBm.spongeBathStaffCount,
        bedToChairTransferMinutes: updatedBm.bedToChairTransferMinutes,
        transferStaffCount: updatedBm.transferStaffCount,
        transferEpisodesPerDay: updatedBm.transferEpisodesPerDay,
        mealFeedingMinutesPerMeal: updatedBm.mealFeedingMinutesPerMeal,
        mealsRequiringAssistancePerDay: updatedBm.mealsRequiringAssistancePerDay,
        toiletingDiaperMinutes: updatedBm.toiletingDiaperMinutes,
        toiletingEpisodesPerDay: updatedBm.toiletingEpisodesPerDay,
        toiletingStaffCount: updatedBm.toiletingStaffCount,
        repositioningTurnMinutes: updatedBm.repositioningTurnMinutes,
        repositioningIntervalHours: updatedBm.repositioningIntervalHours,
        repositioningStaffCount: updatedBm.repositioningStaffCount,
        medicationAdministrationMinutes: updatedBm.medicationAdministrationMinutes,
        medicationSlotsPerDay: updatedBm.medicationSlotsPerDay,
        dressingMinutes: updatedBm.dressingMinutes ?? 15,
        dressingSlotsPerDay: updatedBm.dressingSlotsPerDay ?? 2,
        mealPreparationMinutes: updatedBm.mealPreparationMinutes,
        mealPreparationSlotsPerDay: updatedBm.mealPreparationSlotsPerDay,
        housekeepingMinutes: updatedBm.housekeepingMinutes,
        housekeepingSlotsPerDay: updatedBm.housekeepingSlotsPerDay,
        laundryMinutes: updatedBm.laundryMinutes,
        laundrySlotsPerWeek: updatedBm.laundrySlotsPerWeek,
        shoppingMinutes: updatedBm.shoppingMinutes,
        shoppingSlotsPerWeek: updatedBm.shoppingSlotsPerWeek,
        transportationMinutes: updatedBm.transportationMinutes,
        transportationSlotsPerWeek: updatedBm.transportationSlotsPerWeek,
        telephoneMinutes: updatedBm.telephoneMinutes,
        telephoneSlotsPerDay: updatedBm.telephoneSlotsPerDay,
        financesMinutes: updatedBm.financesMinutes,
        financesSlotsPerWeek: updatedBm.financesSlotsPerWeek,
        environmentalPenaltyMultiplier: updatedBm.environmentalPenaltyMultiplier ?? 1,
        dynamicActivities: updatedBm.dynamicActivities
      });

      updatedBm.inpatientDirectCareMinutesPerDay = summary.inpatientDirectCareMinutesPerDay;
      updatedBm.homeProjectedDirectCareHoursPerDay = summary.homeProjectedDirectCareHoursPerDay;
      updatedBm.requiresTwoPersonTransfers = summary.requiresTwoPersonTransfers;

      HealthRepository.saveInpatientDischargeBenchmark(updatedBm);
      const updatedProfile: PatientDependenceProfile = {
        ...patientProfile,
        inpatientBenchmark: updatedBm
      };
      await onSaveProfile(updatedProfile);
    } finally {
      setIsUpdating(false);
    }
  };

  // Active Katz values: only true if patient has been assessed or explicitly edited
  const katz = isAssessed && patientProfile?.katzAdl
    ? patientProfile.katzAdl
    : {
        bathing: Boolean(patientProfile?.katzAdl?.bathing && isAssessed),
        dressing: Boolean(patientProfile?.katzAdl?.dressing && isAssessed),
        toileting: Boolean(patientProfile?.katzAdl?.toileting && isAssessed),
        transferring: Boolean(patientProfile?.katzAdl?.transferring && isAssessed),
        continence: Boolean(patientProfile?.katzAdl?.continence && isAssessed),
        feeding: Boolean(patientProfile?.katzAdl?.feeding && isAssessed)
      };

  // Active Lawton values
  const lawton = isAssessed && patientProfile?.lawtonIadl
    ? patientProfile.lawtonIadl
    : {
        telephone: Boolean(patientProfile?.lawtonIadl?.telephone && isAssessed),
        shopping: Boolean(patientProfile?.lawtonIadl?.shopping && isAssessed),
        mealPreparation: Boolean(patientProfile?.lawtonIadl?.mealPreparation && isAssessed),
        housekeeping: Boolean(patientProfile?.lawtonIadl?.housekeeping && isAssessed),
        laundry: Boolean(patientProfile?.lawtonIadl?.laundry && isAssessed),
        transportation: Boolean(patientProfile?.lawtonIadl?.transportation && isAssessed),
        medicationManagement: Boolean(patientProfile?.lawtonIadl?.medicationManagement && isAssessed),
        finances: Boolean(patientProfile?.lawtonIadl?.finances && isAssessed)
      };

  const katzScore = Object.values(katz).filter(Boolean).length;
  const lawtonScore = Object.values(lawton).filter(Boolean).length;
  const displayFunctionScores = isAssessed ? functionScores : [];
  const nextFunctionReviewAt = patientProfile?.functionalAssessedAt
    ? new Date(new Date(patientProfile.functionalAssessedAt).getTime() + 30 * 24 * 60 * 60 * 1000)
    : null;
  const functionReviewOverdue = !!nextFunctionReviewAt && nextFunctionReviewAt.getTime() <= Date.now();

  const handleToggleKatz = async (item: keyof typeof katz, nextVal: boolean) => {
    if (!patientProfile) return;
    setIsUpdating(true);
    try {
      const barthelPatchByKatz: Record<keyof typeof katz, Record<string, number>> = {
        bathing: { bi_bathing: nextVal ? 5 : 0, bi_grooming: nextVal ? 5 : 0 },
        dressing: { bi_dressing: nextVal ? 10 : 0 },
        toileting: { bi_toilet: nextVal ? 10 : 0 },
        transferring: {
          bi_transfer: nextVal ? 15 : 0,
          bi_mobility: nextVal ? 15 : 0,
          bi_stairs: nextVal ? 10 : 0
        },
        continence: { bi_bowels: nextVal ? 10 : 0, bi_bladder: nextVal ? 10 : 0 },
        feeding: { bi_feeding: nextVal ? 10 : 0 }
      };
      const currentGraded = patientProfile.gradedFunctionResponses;
      const updatedProfile: PatientDependenceProfile = {
        ...patientProfile,
        isFunctionalAssessmentCompleted: true,
        functionalAssessedAt: new Date().toISOString(),
        katzAdl: {
          ...katz,
          [item]: nextVal
        },
        ...(currentGraded?.barthel
          ? {
              gradedFunctionResponses: {
                ...currentGraded,
                barthel: { ...currentGraded.barthel, ...barthelPatchByKatz[item] }
              }
            }
          : {})
      };
      await onSaveProfile(updatedProfile);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleLawton = async (item: keyof typeof lawton, nextVal: boolean) => {
    if (!patientProfile) return;
    setIsUpdating(true);
    try {
      const lawtonItemIds: Record<keyof typeof lawton, string> = {
        telephone: 'iadl_phone', shopping: 'iadl_shopping', mealPreparation: 'iadl_food',
        housekeeping: 'iadl_housekeeping', laundry: 'iadl_laundry', transportation: 'iadl_transport',
        medicationManagement: 'iadl_medication', finances: 'iadl_finances'
      };
      const currentGraded = patientProfile.gradedFunctionResponses;
      const updatedProfile: PatientDependenceProfile = {
        ...patientProfile,
        isFunctionalAssessmentCompleted: true,
        functionalAssessedAt: new Date().toISOString(),
        lawtonIadl: {
          ...lawton,
          [item]: nextVal
        },
        ...(currentGraded?.lawton
          ? {
              gradedFunctionResponses: {
                ...currentGraded,
                lawton: { ...currentGraded.lawton, [lawtonItemIds[item]]: nextVal ? 1 : 0 }
              }
            }
          : {})
      };
      await onSaveProfile(updatedProfile);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleBedBound = async (nextVal: boolean) => {
    if (!patientProfile) return;
    setIsUpdating(true);
    try {
      const updatedProfile: PatientDependenceProfile = {
        ...patientProfile,
        isFunctionalAssessmentCompleted: true,
        functionalAssessedAt: new Date().toISOString(),
        isBedBound: nextVal,
        katzAdl: {
          ...katz,
          transferring: nextVal ? false : katz.transferring
        },
        ...(nextVal && patientProfile.gradedFunctionResponses?.barthel
          ? {
              gradedFunctionResponses: {
                ...patientProfile.gradedFunctionResponses,
                barthel: {
                  ...patientProfile.gradedFunctionResponses.barthel,
                  bi_transfer: 0,
                  bi_mobility: 0
                }
              }
            }
          : {})
      };
      await onSaveProfile(updatedProfile);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateFallCount = async (count: number) => {
    if (!patientProfile) return;
    setIsUpdating(true);
    try {
      const updatedProfile: PatientDependenceProfile = {
        ...patientProfile,
        fallHistoryLast6Months: Math.max(0, count)
      };
      await onSaveProfile(updatedProfile);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. CLINICAL FOUNDATION HERO BANNER */}
      <Card className="rounded-3xl border border-indigo-500/25 bg-gradient-to-br from-indigo-500/10 via-card to-background shadow-xs overflow-hidden">
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-3.5">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-indigo-600 text-white font-bold text-[10px] uppercase tracking-wider px-2 py-0.5">
                  Step 1 of Care Plan Workflow
                </Badge>
                <Badge variant="outline" className="text-xs font-semibold border-indigo-500/30 text-indigo-700 dark:text-indigo-300">
                  Katz Basic ADL & Lawton IADL
                </Badge>
                {!isAssessed && (
                  <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                    Intake Needed
                  </Badge>
                )}
                {isUpdating && (
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground animate-pulse">
                    <RefreshCw className="w-3 h-3 animate-spin text-primary" /> Saving...
                  </span>
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>Step 1: Patient Functional Assessment (ADL / IADL)</span>
              </h2>
              <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed max-w-4xl">
                Assess <strong>{patientName}</strong>&apos;s functional mobility. Katz ADL and Lawton-Brody IADL scores recorded below automatically determine care hours and shift coverage for Step 2 (Monthly Support Matrix).
              </p>
              {nextFunctionReviewAt && (
                <p className={cn(
                  'text-[11px] font-semibold',
                  functionReviewOverdue
                    ? 'text-rose-700 dark:text-rose-400'
                    : 'text-muted-foreground'
                )}>
                  {functionReviewOverdue ? 'Functional reassessment due' : 'Next monthly reassessment'}:{' '}
                  {nextFunctionReviewAt.toLocaleDateString()}. Reassess earlier after a clinical
                  change or follow-up visit.
                </p>
              )}
            </div>

            {/* Primary Action Buttons Bar */}
            <div className="grid w-full gap-2.5 pt-2 sm:flex sm:flex-wrap sm:items-center">
              <FunctionAssessmentForm
                onComplete={onAssessmentCompleted}
                trigger={
                  <Button
                    size="sm"
                    className="h-11 w-full gap-2 bg-indigo-600 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 sm:h-10 sm:w-auto"
                  >
                    <ClipboardPlus className="w-4 h-4" />
                    <span>Administer Standardized ADL / IADL</span>
                  </Button>
                }
              />
              <InpatientDischargeBenchmarkDialog
                patientUid={patientUid}
                patientName={patientName}
                patientProfile={patientProfile}
                onBenchmarkSaved={handleBenchmarkSaved}
                onBenchmarkCleared={handleBenchmarkCleared}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={onProceedToMatrix}
                className="h-11 w-full gap-1.5 border-border bg-background/80 text-xs font-semibold hover:bg-muted sm:h-10 sm:w-auto"
                title="Proceed to Step 2: Monthly Support Matrix to configure care shifts based on this assessment"
              >
                <span>Next: Monthly Support Matrix</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Core Foundation Metrics Strip */}
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Metric 1: Katz ADL Score */}
            <div className="p-3 sm:p-4 rounded-2xl border border-indigo-500/20 bg-background/70 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                Katz Basic ADL
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400">
                  {isAssessed ? katzScore : '--'}
                </span>
                <span className="text-xs font-semibold text-muted-foreground">/ 6 items</span>
              </div>
              <p className="text-[11px] font-semibold text-foreground/90 mt-1 capitalize">
                {isAssessed
                  ? (katzScore === 6
                    ? 'Fully Independent'
                    : katzScore >= 4
                    ? 'Moderate Impairment'
                    : 'Severe Dependence')
                  : <span className="text-amber-600 dark:text-amber-400">Pending Clinical Intake</span>}
              </p>
            </div>

            {/* Metric 2: Lawton IADL Score */}
            <div className="p-3 sm:p-4 rounded-2xl border border-border/70 bg-background/70 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                Lawton-Brody IADL
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black font-mono text-foreground">
                  {isAssessed ? lawtonScore : '--'}
                </span>
                <span className="text-xs font-semibold text-muted-foreground">/ 8 items</span>
              </div>
              <p className="text-[11px] font-semibold text-foreground/90 mt-1">
                {isAssessed ? 'Executive & Instrumental' : <span className="text-amber-600 dark:text-amber-400">Pending Clinical Intake</span>}
              </p>
            </div>

            {/* Metric 3: Calculated Care Demand */}
            <div className="col-span-2 p-3 sm:col-span-1 sm:p-4 rounded-2xl border border-border/70 bg-background/70 shadow-2xs">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Estimated Care Demand
                </span>
                {isAssessed && (
                  <EvidenceLevelBadge
                    provenance={careGapResult.careDemandBand.provenance}
                    label="Planning Range"
                  />
                )}
              </div>
              {isAssessed ? (
                <>
                  <CareDemandBandValue
                    estimate={careGapResult.careDemandBand.activeCare}
                    className="text-lg text-foreground"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Workload (hands-on + supervision). Presence required:{' '}
                    <strong className="text-foreground">{careGapResult.patientCoverageHours} h/day</strong>.
                  </p>
                  {diarySummary && diarySummary.totalEntries > 0 && (
                    <div className="pt-2 mt-1 border-t border-border/50 flex items-center justify-between gap-1.5">
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {diarySummary.totalEntries} Diary Logs Calibrating
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsDiaryModalOpen(true)}
                        className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
                      >
                        View Logs →
                      </button>
                    </div>
                  )}
                  {patientProfile?.inpatientBenchmark && (
                    <div className="pt-1.5 mt-1 border-t border-border/50 space-y-1">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {patientProfile.inpatientBenchmark.dynamicActivities?.length
                            ? `${patientProfile.inpatientBenchmark.dynamicActivities.length} timed nursing activities calibrated`
                            : careGapResult.careDemandBand.patientSpecificEstimate
                            ? `${careGapResult.careDemandBand.patientSpecificEstimate.observationCount} observed nursing episodes`
                            : 'Inpatient pre-discharge benchmark active'}
                        </span>
                        {(patientProfile.inpatientBenchmark.requiresTwoPersonTransfers || careGapResult.careDemandBand.requiresTwoPersonTransfers) && (
                          <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-300 text-[9px] font-bold px-1.5 py-0 border-rose-500/30">
                            2-Staff Required
                          </Badge>
                        )}
                      </div>
                      <p className="text-[10px] leading-snug text-muted-foreground">
                        Patient-specific pre-discharge care-time estimate based on observed nursing
                        episodes. Intended for care planning and clinician review; reassess after
                        transition home.
                      </p>
                      {careGapResult.careDemandBand.patientSpecificEstimate?.functionAdjustmentApplied && (
                        <p className="text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                          Updated task by task using the latest functional assessment from{' '}
                          {careGapResult.careDemandBand.patientSpecificEstimate.currentFunctionalAssessedAt
                            ? new Date(careGapResult.careDemandBand.patientSpecificEstimate.currentFunctionalAssessedAt).toLocaleDateString()
                            : 'this encounter'}.
                        </p>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <span className="text-2xl font-black font-mono text-foreground">--</span>
                  <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 mt-1">
                    Awaiting Functional Scoring
                  </p>
                </>
              )}
            </div>

            {/* Metric 4: Mobility & Bed Status */}
            <div className="col-span-2 p-3 sm:col-span-1 sm:p-4 rounded-2xl border border-border/70 bg-background/70 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                Mobility & Fall Profile
              </span>
              <div className="text-base font-bold text-foreground truncate mt-0.5">
                {isAssessed
                  ? (patientProfile?.isBedBound ? 'Bed-Bound' : 'Ambulatory / Mobilized')
                  : 'Pending Intake'}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                {patientProfile?.fallHistoryLast6Months ?? 0} fall(s) in last 6 months
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2-PART INTAKE WORKFLOW SUB-TABS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-muted/60 border border-border/70 w-fit">
          <button
            type="button"
            onClick={() => setIntakePart('basic')}
            className={cn(
              'px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer',
              intakePart === 'basic'
                ? 'bg-background text-foreground shadow-xs border border-border/80'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Layers className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Part 1: Basic ADLs & Mobility</span>
            <Badge
              variant="outline"
              className={cn(
                'text-[9px] px-1.5 py-0 font-bold',
                isAssessed
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {isAssessed ? `${katzScore}/6 Items` : '6 Items'}
            </Badge>
          </button>

          <button
            type="button"
            onClick={() => setIntakePart('instrumental')}
            className={cn(
              'px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer',
              intakePart === 'instrumental'
                ? 'bg-background text-foreground shadow-xs border border-border/80'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Part 2: Instrumental IADLs & History</span>
            <Badge
              variant="outline"
              className={cn(
                'text-[9px] px-1.5 py-0 font-bold',
                isAssessed
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {isAssessed ? `${lawtonScore}/8 Items` : '8 Items'}
            </Badge>
          </button>
        </div>

        {!isAssessed && (
          <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Baseline unassessed. Toggle items below or use the standardized assessment form.</span>
          </div>
        )}
      </div>

      {/* PART 1: BASIC ADLs & MOBILITY SURVEILLANCE */}
      {intakePart === 'basic' && (
        <div className="space-y-6">

      {/* 2. THE 6 BASIC ACTIVITIES OF DAILY LIVING (KATZ ADL) */}
      <Card className="rounded-3xl shadow-xs">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                <span>Katz Index of Independence in Activities of Daily Living (Basic ADL)</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Toggle items directly below to record immediate clinical observations. Changes instantly recalculate care demand hours.
              </CardDescription>
            </div>
            <Badge
              variant="outline"
              className={cn(
                'text-xs font-bold w-fit',
                !isAssessed && 'border-amber-500/30 text-amber-700 dark:text-amber-300 bg-amber-500/10'
              )}
            >
              {isAssessed ? `${katzScore} of 6 Independent` : 'Unassessed (0 of 6 evaluated)'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {/* ADL 1: Bed-to-Chair Transfers */}
          <KatzDomainCareTimingCard
            title="Bed-to-Chair Transfers"
            icon={<Bed className={cn('w-4 h-4', !isAssessed ? 'text-muted-foreground' : katz.transferring ? 'text-emerald-600' : 'text-rose-600')} />}
            isIndependent={katz.transferring}
            isAssessed={isAssessed}
            isUpdating={isUpdating}
            onToggle={(val) => void handleToggleKatz('transferring', val)}
            descriptionIndependent="Patient moves in and out of bed and chair independently without physical lifting."
            descriptionDependent="Requires physical assistance or mechanical aid. Drives caregiver lumbar injury risk."
            impactIndependent="No Solo Lift Strain"
            impactDependent="Heavy Lifting Slots"
            activityName="Bed-to-Chair Pivot Transfer & Turns"
            activityCategoryLabel="Mobility & Transfers"
            minutes={benchmark?.bedToChairTransferMinutes ?? 12}
            frequency={benchmark?.transferEpisodesPerDay ?? 3}
            staff={benchmark?.transferStaffCount ?? 2}
            allowStaffToggle={true}
            extraTurnHours={
              patientProfile?.isBedBound
                ? ((benchmark?.repositioningTurnMinutes ?? 10) * Math.round(24 / (benchmark?.repositioningIntervalHours || 3)) * (benchmark?.repositioningStaffCount ?? 2)) / 60
                : 0
            }
            extraDynamicActivities={allDynamicActivities.filter(
              (a) =>
                a.category === 'mobility_transfers' ||
                a.category === 'skin_positioning' ||
                a.name.toLowerCase().includes('transfer') ||
                a.name.toLowerCase().includes('pivot') ||
                a.name.toLowerCase().includes('turn')
            )}
            onSaveTiming={async (m, f, s) => {
              await handleUpdateDomainBenchmark({
                bedToChairTransferMinutes: m,
                transferEpisodesPerDay: f,
                transferStaffCount: s
              });
            }}
          />

          {/* ADL 2: Bathing */}
          <KatzDomainCareTimingCard
            title="Bathing & Hygiene"
            icon={<span className="text-sm">🛁</span>}
            isIndependent={katz.bathing}
            isAssessed={isAssessed}
            isUpdating={isUpdating}
            onToggle={(val) => void handleToggleKatz('bathing', val)}
            descriptionIndependent="Bathes self completely or needs help only for a single part (e.g. back)."
            descriptionDependent="Needs help bathing more than one part of body, entering/exiting tub, or bed-bath."
            impactIndependent="Independent Hygiene"
            impactDependent="Morning Shift Support"
            activityName="Bed Sponge Bath & Body Hygiene"
            activityCategoryLabel="Personal Hygiene"
            minutes={benchmark?.spongeBathMinutes ?? 25}
            frequency={1}
            staff={benchmark?.spongeBathStaffCount ?? 1}
            allowStaffToggle={true}
            extraDynamicActivities={allDynamicActivities.filter(
              (a) => a.name.toLowerCase().includes('bath') || a.name.toLowerCase().includes('sponge')
            )}
            onSaveTiming={async (m, _f, s) => {
              await handleUpdateDomainBenchmark({
                spongeBathMinutes: m,
                spongeBathStaffCount: s
              });
            }}
          />

          {/* ADL 3: Toileting */}
          <KatzDomainCareTimingCard
            title="Toileting"
            icon={<span className="text-sm">🚽</span>}
            isIndependent={katz.toileting}
            isAssessed={isAssessed}
            isUpdating={isUpdating}
            onToggle={(val) => void handleToggleKatz('toileting', val)}
            descriptionIndependent="Gets to toilet, cleans self, and arranges clothes without assistance."
            descriptionDependent="Needs help transferring to toilet, using commode chair, or managing bedpan."
            impactIndependent="Independent"
            impactDependent="Commode / Fall Risk"
            activityName="Commode Transfer & Elimination Assist"
            activityCategoryLabel="Toileting Assist"
            minutes={benchmark?.toiletingDiaperMinutes ?? 15}
            frequency={benchmark?.toiletingEpisodesPerDay ?? 4}
            staff={benchmark?.toiletingStaffCount ?? 1}
            allowStaffToggle={false}
            extraDynamicActivities={allDynamicActivities.filter(
              (a) => a.name.toLowerCase().includes('commode') || a.name.toLowerCase().includes('toilet')
            )}
            onSaveTiming={async (m, f, s) => {
              await handleUpdateDomainBenchmark({
                toiletingDiaperMinutes: m,
                toiletingEpisodesPerDay: f,
                toiletingStaffCount: s
              });
            }}
          />

          {/* ADL 4: Dressing */}
          <KatzDomainCareTimingCard
            title="Dressing"
            icon={<span className="text-sm">👕</span>}
            isIndependent={katz.dressing}
            isAssessed={isAssessed}
            isUpdating={isUpdating}
            onToggle={(val) => void handleToggleKatz('dressing', val)}
            descriptionIndependent="Gets clothes from closet and dresses completely without help (except tying shoes)."
            descriptionDependent="Needs assistance with buttons, fasteners, or must be partially/fully dressed."
            impactIndependent="Independent"
            impactDependent="Daily Dressing Assist"
            activityName="Morning & Evening Dressing Assistance"
            activityCategoryLabel="Dressing & Grooming"
            minutes={benchmark?.dressingMinutes ?? 15}
            frequency={benchmark?.dressingSlotsPerDay ?? 2}
            staff={1}
            allowStaffToggle={false}
            extraDynamicActivities={allDynamicActivities.filter((a) => a.name.toLowerCase().includes('dress'))}
            onSaveTiming={async (m, f) => {
              await handleUpdateDomainBenchmark({
                dressingMinutes: m,
                dressingSlotsPerDay: f
              });
            }}
          />

          {/* ADL 5: Continence */}
          <KatzDomainCareTimingCard
            title="Bladder & Bowel Continence"
            icon={<span className="text-sm">💧</span>}
            isIndependent={katz.continence}
            isAssessed={isAssessed}
            isUpdating={isUpdating}
            onToggle={(val) => void handleToggleKatz('continence', val)}
            descriptionIndependent="Exercises complete self-control over urination and defecation."
            descriptionDependent="Partial or total incontinence; requires diapers, scheduled changes, or catheter care."
            impactIndependent="Continent"
            impactDependent="Skin Care & Diapering"
            activityName="Adult Diaper Change & Perineal Hygiene"
            activityCategoryLabel="Continence Care"
            minutes={benchmark?.toiletingDiaperMinutes ?? 15}
            frequency={benchmark?.toiletingEpisodesPerDay ?? 4}
            staff={1}
            allowStaffToggle={false}
            extraDynamicActivities={allDynamicActivities.filter(
              (a) => a.name.toLowerCase().includes('diaper') || a.name.toLowerCase().includes('catheter')
            )}
            onSaveTiming={async (m, f) => {
              await handleUpdateDomainBenchmark({
                toiletingDiaperMinutes: m,
                toiletingEpisodesPerDay: f
              });
            }}
          />

          {/* ADL 6: Feeding */}
          <KatzDomainCareTimingCard
            title="Feeding"
            icon={<span className="text-sm">🍽️</span>}
            isIndependent={katz.feeding}
            isAssessed={isAssessed}
            isUpdating={isUpdating}
            onToggle={(val) => void handleToggleKatz('feeding', val)}
            descriptionIndependent="Gets food from plate into mouth independently (meat pre-cutting allowed)."
            descriptionDependent="Needs help spoon-feeding, drinks from sip-cup, or requires parenteral/tube feeds."
            impactIndependent="Independent"
            impactDependent="Aspiration Precautions"
            activityName="Oral Feeding Assist / Dysphagia Pacing"
            activityCategoryLabel="Enteral & Nutrition"
            minutes={benchmark?.mealFeedingMinutesPerMeal ?? 30}
            frequency={benchmark?.mealsRequiringAssistancePerDay ?? 3}
            staff={1}
            allowStaffToggle={false}
            extraDynamicActivities={allDynamicActivities.filter(
              (a) =>
                a.category === 'enteral_nutrition' ||
                a.name.toLowerCase().includes('feed') ||
                a.name.toLowerCase().includes('tube') ||
                a.name.toLowerCase().includes('meal')
            )}
            onSaveTiming={async (m, f) => {
              await handleUpdateDomainBenchmark({
                mealFeedingMinutesPerMeal: m,
                mealsRequiringAssistancePerDay: f
              });
            }}
          />
        </CardContent>
      </Card>

      {/* 3. MOBILITY, BED-BOUND STATUS & RECENT FALLS */}
      <Card className="rounded-3xl shadow-xs">
        <CardHeader className="pb-3 border-b border-border/60">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Mobility Posture, Bedbound State & Fall Risk Surveillance</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Directly influences physical handling hazard tiers and assistive device requirements.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Bed-bound status toggle */}
          <div className="p-4 rounded-2xl border border-border/70 bg-card flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="font-bold text-xs text-foreground">Bed-Bound Status</span>
              <Switch
                checked={patientProfile?.isBedBound ?? false}
                onCheckedChange={handleToggleBedBound}
                disabled={isUpdating}
              />
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {patientProfile?.isBedBound
                ? 'Patient is strictly confined to bed. Requires 2-hourly repositioning, pressure injury surveillance, and ripple mattress.'
                : 'Patient is able to sit up and mobilize out of bed with or without assistance.'}
            </p>
            <div className="mt-3 text-[11px] font-bold">
              {patientProfile?.isBedBound ? (
                <span className="text-rose-600">● Alternating Ripple Mattress Mandatory</span>
              ) : (
                <span className="text-emerald-600">✓ Ambulatory / Chair Mobilized</span>
              )}
            </div>
          </div>

          {/* Fall history in last 6 months */}
          <div className="p-4 rounded-2xl border border-border/70 bg-card flex flex-col justify-between">
            <span className="font-bold text-xs text-foreground mb-1">Falls in Last 6 Months</span>
            <div className="flex items-center gap-3 my-2">
              <Button
                size="sm"
                variant="outline"
                className="h-8 w-8 p-0 text-base font-bold"
                onClick={() => void handleUpdateFallCount((patientProfile?.fallHistoryLast6Months || 0) - 1)}
                disabled={isUpdating || (patientProfile?.fallHistoryLast6Months || 0) <= 0}
              >
                -
              </Button>
              <span className="text-2xl font-black font-mono text-foreground">
                {patientProfile?.fallHistoryLast6Months || 0}
              </span>
              <Button
                size="sm"
                variant="outline"
                className="h-8 w-8 p-0 text-base font-bold"
                onClick={() => void handleUpdateFallCount((patientProfile?.fallHistoryLast6Months || 0) + 1)}
                disabled={isUpdating}
              >
                +
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {(patientProfile?.fallHistoryLast6Months || 0) >= 2
                ? 'High Fall Risk: Grab bars, night sensor lights, and non-skid footwear advised.'
                : (patientProfile?.fallHistoryLast6Months || 0) === 1
                ? 'Moderate Fall Risk: Single fall on record.'
                : 'No recent fall events reported.'}
            </p>
          </div>

          {/* Biomechanical Handling Hazard Tier */}
          <div className="p-4 rounded-2xl border border-border/70 bg-card flex flex-col justify-between">
            <span className="font-bold text-xs text-foreground mb-1">NIOSH Manual Handling Tier</span>
            <div className="my-2">
              <Badge className={cn(
                'text-xs font-bold uppercase',
                !isAssessed
                  ? 'bg-muted text-muted-foreground border-border'
                  : careGapResult.manualHandlingHazardTier === 'severe'
                  ? 'bg-rose-600 text-white'
                  : careGapResult.manualHandlingHazardTier === 'high'
                  ? 'bg-amber-600 text-white'
                  : 'bg-emerald-600 text-white'
              )}>
                {isAssessed ? `${careGapResult.manualHandlingHazardTier} Hazard` : 'Pending Intake'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {isAssessed
                ? `Based on patient dependence (${katzScore}/6) and transfer requirements. High hazard requires assistive transfer equipment or formal attendant relief.`
                : 'Manual handling hazard classification will be derived once baseline transfer and mobility observations are entered.'}
            </p>
          </div>
        </CardContent>
      </Card>

          {/* Quick Sub-navigation Footer */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-border/70 bg-card shadow-2xs">
            <p className="text-xs text-muted-foreground">
              Completed basic physical mobility? Continue to instrumental daily living capabilities and assessment history.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIntakePart('instrumental')}
              className="text-xs font-semibold gap-1.5 cursor-pointer shrink-0 self-start sm:self-auto"
            >
              <span>Continue to Part 2: Instrumental IADLs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* PART 2: INSTRUMENTAL IADLs & ASSESSMENT HISTORY */}
      {intakePart === 'instrumental' && (
        <div className="space-y-6">

      {/* 4. LAWTON-BRODY INSTRUMENTAL ACTIVITIES OF DAILY LIVING (IADL) */}
      <Card className="rounded-3xl shadow-xs">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Lawton-Brody Instrumental Activities of Daily Living (IADL)</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Evaluates complex cognitive, organizational, and community tasks necessary for independent domestic living. Changes instantly recalculate domestic care and nursing demand hours.
              </CardDescription>
            </div>
            <Badge
              variant="outline"
              className={cn(
                'text-xs font-bold w-fit',
                !isAssessed && 'border-amber-500/30 text-amber-700 dark:text-amber-300 bg-amber-500/10'
              )}
            >
              {isAssessed ? `${lawtonScore} of 8 Independent` : 'Unassessed (0 of 8 evaluated)'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-6">
          {/* A. Core High-Impact Domestic & Clinical IADL Workload (Top 4 Heavy Cards) */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1 border-b border-border/40">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Core Clinical & Domestic Workload (Daily Direct Hours)</span>
              </span>
              <span className="text-[11px] text-muted-foreground">
                Primary time drivers for caregiver & home nursing shifts
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5">
              {/* IADL 1: Medication Management */}
              <LawtonDomainCareTimingCard
                title="Medication Management"
                icon={<span className="text-sm">💊</span>}
                isIndependent={lawton.medicationManagement}
                isAssessed={isAssessed}
                isUpdating={isUpdating}
                domainType="lawton_iadl"
                onToggle={(val) => void handleToggleLawton('medicationManagement', val)}
                descriptionIndependent="Takes correct medications in correct dosages and schedules independently."
                descriptionDependent="Requires nursing/caregiver oversight to prepare pillbox, verify dosages, and administer timely meds."
                impactIndependent="Self-Administers Correctly"
                impactDependent="High-Alert Drug Safety & Pill Admin"
                activityName="Oral / Injectable Med Administration & Pillbox Sort"
                minutes={benchmark?.medicationAdministrationMinutes ?? 10}
                frequency={benchmark?.medicationSlotsPerDay ?? 3}
                staff={1}
                allowStaffToggle={false}
                extraDynamicActivities={allDynamicActivities.filter(
                  (a) =>
                    a.category === 'medication_treatments' ||
                    a.name.toLowerCase().includes('med') ||
                    a.name.toLowerCase().includes('pill')
                )}
                onSaveTiming={async (m, f) => {
                  await handleUpdateDomainBenchmark({
                    medicationAdministrationMinutes: m,
                    medicationSlotsPerDay: f
                  });
                }}
              />

              {/* IADL 2: Food & Meal Preparation */}
              <LawtonDomainCareTimingCard
                title="Food & Meal Preparation"
                icon={<span className="text-sm">🍲</span>}
                isIndependent={lawton.mealPreparation}
                isAssessed={isAssessed}
                isUpdating={isUpdating}
                domainType="lawton_iadl"
                onToggle={(val) => void handleToggleLawton('mealPreparation', val)}
                descriptionIndependent="Plans, cooks, and serves adequate meals independently."
                descriptionDependent="Requires caregiver to prepare specialized soft/diabetic diet, cook meals, and deliver hot food."
                impactIndependent="Prepares Own Meals"
                impactDependent="Daily Cooking, Nutrition & Diet Mod"
                activityName="Meal Preparation & Specialized Diet Cooking"
                minutes={benchmark?.mealPreparationMinutes ?? 25}
                frequency={benchmark?.mealPreparationSlotsPerDay ?? 3}
                staff={1}
                allowStaffToggle={false}
                extraDynamicActivities={allDynamicActivities.filter(
                  (a) =>
                    a.name.toLowerCase().includes('cook') ||
                    a.name.toLowerCase().includes('meal prep') ||
                    a.name.toLowerCase().includes('food prep')
                )}
                onSaveTiming={async (m, f) => {
                  await handleUpdateDomainBenchmark({
                    mealPreparationMinutes: m,
                    mealPreparationSlotsPerDay: f
                  });
                }}
              />

              {/* IADL 3: Laundry & Linen Sanitization */}
              <LawtonDomainCareTimingCard
                title="Laundry & Linen Sanitization"
                icon={<span className="text-sm">🧺</span>}
                isIndependent={lawton.laundry}
                isAssessed={isAssessed}
                isUpdating={isUpdating}
                domainType="lawton_iadl"
                frequencyUnit="week"
                onToggle={(val) => void handleToggleLawton('laundry', val)}
                descriptionIndependent="Does personal laundry and washes small articles completely independently."
                descriptionDependent="Requires complete assistance with soiled linens, bedclothes, and thermal sanitization."
                impactIndependent="Does Personal Laundry"
                impactDependent="Soiled Linen Washing & Thermal Sanitization"
                activityName="Bed Linen Sanitization & Soiled Wash Cycles"
                minutes={benchmark?.laundryMinutes ?? 40}
                frequency={benchmark?.laundrySlotsPerWeek ?? 3}
                staff={1}
                allowStaffToggle={false}
                extraDynamicActivities={allDynamicActivities.filter(
                  (a) =>
                    a.name.toLowerCase().includes('laundry') ||
                    a.name.toLowerCase().includes('linen')
                )}
                onSaveTiming={async (m, f) => {
                  await handleUpdateDomainBenchmark({
                    laundryMinutes: m,
                    laundrySlotsPerWeek: f
                  });
                }}
              />

              {/* IADL 4: Housekeeping & Room Care */}
              <LawtonDomainCareTimingCard
                title="Housekeeping & Room Care"
                icon={<span className="text-sm">🧹</span>}
                isIndependent={lawton.housekeeping}
                isAssessed={isAssessed}
                isUpdating={isUpdating}
                domainType="lawton_iadl"
                onToggle={(val) => void handleToggleLawton('housekeeping', val)}
                descriptionIndependent="Maintains house alone or with occasional help for heavy domestic work."
                descriptionDependent="Requires daily surface cleaning, bed linen changes, room ventilation, and infection control."
                impactIndependent="Maintains Clean Living Space"
                impactDependent="Room Sanitation, Bed Linen & Disinfection"
                activityName="Patient Room Sanitation & Barrier Disinfection"
                minutes={benchmark?.housekeepingMinutes ?? 30}
                frequency={benchmark?.housekeepingSlotsPerDay ?? 1}
                staff={1}
                allowStaffToggle={false}
                extraDynamicActivities={allDynamicActivities.filter(
                  (a) =>
                    a.name.toLowerCase().includes('clean') ||
                    a.name.toLowerCase().includes('sanit') ||
                    a.name.toLowerCase().includes('housekeep')
                )}
                onSaveTiming={async (m, f) => {
                  await handleUpdateDomainBenchmark({
                    housekeepingMinutes: m,
                    housekeepingSlotsPerDay: f
                  });
                }}
              />
            </div>
          </div>

          {/* B. Community, Logistics & Cognitive IADL Workload (Remaining 4 Cards) */}
          <div className="space-y-3 pt-2 border-t border-border/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1 border-b border-border/40">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Logistics, Communication & Community IADL Workload</span>
              </span>
              <span className="text-[11px] text-muted-foreground">
                Community errands, escorted transit & clinical communication
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5">
              {/* IADL 5: Shopping & Medical Supplies */}
              <LawtonDomainCareTimingCard
                title="Shopping & Medical Supplies"
                icon={<span className="text-sm">🛒</span>}
                isIndependent={lawton.shopping}
                isAssessed={isAssessed}
                isUpdating={isUpdating}
                domainType="lawton_iadl"
                frequencyUnit="week"
                onToggle={(val) => void handleToggleLawton('shopping', val)}
                descriptionIndependent="Takes care of all shopping needs independently and manages transport."
                descriptionDependent="Needs caregiver to procure pharmacy supplies, groceries, catheters, and adult diapers."
                impactIndependent="Independent Procurement"
                impactDependent="Procuring Groceries, Medicines & Consumables"
                activityName="Pharmacy, Consumables & Grocery Procurement"
                minutes={benchmark?.shoppingMinutes ?? 60}
                frequency={benchmark?.shoppingSlotsPerWeek ?? 2}
                staff={1}
                allowStaffToggle={false}
                onSaveTiming={async (m, f) => {
                  await handleUpdateDomainBenchmark({
                    shoppingMinutes: m,
                    shoppingSlotsPerWeek: f
                  });
                }}
              />

              {/* IADL 6: Transportation */}
              <LawtonDomainCareTimingCard
                title="Transportation & Escort"
                icon={<span className="text-sm">🚗</span>}
                isIndependent={lawton.transportation}
                isAssessed={isAssessed}
                isUpdating={isUpdating}
                domainType="lawton_iadl"
                frequencyUnit="week"
                onToggle={(val) => void handleToggleLawton('transportation', val)}
                descriptionIndependent="Travels independently on public transport or drives personal vehicle."
                descriptionDependent="Cannot travel without caregiver escort, wheelchair ramp transport, or emergency ambulance."
                impactIndependent="Travels Independently"
                impactDependent="Wheelchair Cab / Escorted Hospital Visits"
                activityName="Escorted Clinical Visits & OPD Mobilization"
                minutes={benchmark?.transportationMinutes ?? 90}
                frequency={benchmark?.transportationSlotsPerWeek ?? 1}
                staff={1}
                allowStaffToggle={false}
                onSaveTiming={async (m, f) => {
                  await handleUpdateDomainBenchmark({
                    transportationMinutes: m,
                    transportationSlotsPerWeek: f
                  });
                }}
              />

              {/* IADL 7: Telephone Use */}
              <LawtonDomainCareTimingCard
                title="Telephone & Telehealth"
                icon={<span className="text-sm">📞</span>}
                isIndependent={lawton.telephone}
                isAssessed={isAssessed}
                isUpdating={isUpdating}
                domainType="lawton_iadl"
                onToggle={(val) => void handleToggleLawton('telephone', val)}
                descriptionIndependent="Operates telephone on own initiative, dials and answers independently."
                descriptionDependent="Unable to dial numbers, operate touchscreen, or requires supervision for doctor teleconsults."
                impactIndependent="Independent Phone Use"
                impactDependent="Dialing, Screen Assist & Teleconsult Supervision"
                activityName="Communication Assistance & Teleconsult Facilitation"
                minutes={benchmark?.telephoneMinutes ?? 5}
                frequency={benchmark?.telephoneSlotsPerDay ?? 1}
                staff={1}
                allowStaffToggle={false}
                onSaveTiming={async (m, f) => {
                  await handleUpdateDomainBenchmark({
                    telephoneMinutes: m,
                    telephoneSlotsPerDay: f
                  });
                }}
              />

              {/* IADL 8: Financial Management */}
              <LawtonDomainCareTimingCard
                title="Financial Management & Claims"
                icon={<span className="text-sm">💳</span>}
                isIndependent={lawton.finances}
                isAssessed={isAssessed}
                isUpdating={isUpdating}
                domainType="lawton_iadl"
                frequencyUnit="week"
                onToggle={(val) => void handleToggleLawton('finances', val)}
                descriptionIndependent="Manages financial matters independently (writes checks, pays bills, monitors bank)."
                descriptionDependent="Incapable of handling money, reconciling medical bills, or managing health insurance."
                impactIndependent="Manages Money Independently"
                impactDependent="Medical Expenses, Claims & Billing Settlement"
                activityName="Healthcare Billing, Claims & Resource Management"
                minutes={benchmark?.financesMinutes ?? 30}
                frequency={benchmark?.financesSlotsPerWeek ?? 2}
                staff={1}
                allowStaffToggle={false}
                onSaveTiming={async (m, f) => {
                  await handleUpdateDomainBenchmark({
                    financesMinutes: m,
                    financesSlotsPerWeek: f
                  });
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 5. HISTORICAL ASSESSMENTS TIMELINE */}
      <Card className="rounded-3xl shadow-xs">
        <CardHeader className="pb-3 border-b border-border/60">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span>Formal Functional Assessments History</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Standardized Barthel Index and Lawton-Brody evaluations recorded during clinical encounters.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {displayFunctionScores.length === 0 ? (
            <div className="p-6 rounded-2xl border border-dashed border-border/70 text-center space-y-3">
              <Activity className="w-8 h-8 text-indigo-500 mx-auto" />
              <div>
                <p className="text-sm font-bold text-foreground">No Formal Barthel/Lawton Assessments Logged</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                  No functional baseline has been conducted for this patient. Administering a formal 10-item Barthel assessment establishes standardized clinical trajectory monitoring.
                </p>
              </div>
              <FunctionAssessmentForm
                onComplete={onAssessmentCompleted}
                trigger={
                  <Button size="sm" className="h-9 text-xs font-bold gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs">
                    <ClipboardPlus className="w-3.5 h-3.5" />
                    <span>Administer Baseline Assessment Now</span>
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {functionScores.map((score, index) => (
                <div key={index} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground">
                        {new Date(score.recordedAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                      <Badge variant="outline" className="text-[10px] font-bold capitalize">
                        {score.band} Dependence
                      </Badge>
                      {index === 0 && (
                        <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[10px] border-emerald-500/30">
                          Latest assessment
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Barthel Index: <strong>{score.barthelScore}/100</strong> · Lawton IADL: <strong>{score.lawtonScore}/8</strong>
                    </p>
                    {score.careIntensityFlags.length > 0 && (
                      <p className="text-[11px] text-amber-700 dark:text-amber-400">
                        Care Intensity Drivers: {score.careIntensityFlags.join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

          {/* Quick Sub-navigation Footer */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-border/70 bg-card shadow-2xs">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIntakePart('basic')}
              className="text-xs font-semibold gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground self-start sm:self-auto"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Part 1: Basic ADLs</span>
            </Button>
            <Button
              size="sm"
              onClick={onProceedToMatrix}
              className="text-xs font-semibold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer self-start sm:self-auto"
            >
              <span>Proceed to Step 2: Monthly Support Matrix</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Caregiver Empirical Diary Observations Modal */}
      <CaregiverDiaryHistoryDialog
        open={isDiaryModalOpen}
        onOpenChange={setIsDiaryModalOpen}
        patientUid={patientUid}
        patientName={patientName}
      />
    </div>
  );
}
