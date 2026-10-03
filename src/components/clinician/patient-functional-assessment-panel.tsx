'use client';

import React, { useState } from 'react';
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
  Building2
} from 'lucide-react';
import { FunctionAssessmentForm } from '@/components/clinical/function-assessment-form';
import type { PatientDependenceProfile, CareGapEvaluationResult } from '@/lib/clinical/care-gap-engine';
import type { FunctionEvaluationResult } from '@/lib/clinical/function-scale';
import { cn } from '@/lib/utils';
import { CareDemandBandValue } from '@/components/clinical/care-demand-band';
import { EvidenceLevelBadge } from '@/components/clinical/evidence-level-badge';
import { HealthRepository, type InpatientDischargeBenchmark } from '@/lib/db/health-repository';
import { CaregiverDiaryHistoryDialog } from '@/components/caregiver/caregiver-diary-history-dialog';
import { InpatientDischargeBenchmarkDialog } from './inpatient-discharge-benchmark-dialog';

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

  const handleBenchmarkSaved = async (benchmark: InpatientDischargeBenchmark) => {
    if (!patientProfile) return;
    setIsUpdating(true);
    try {
      const updated: PatientDependenceProfile = {
        ...patientProfile,
        inpatientBenchmark: benchmark
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

  const handleToggleKatz = async (item: keyof typeof katz, nextVal: boolean) => {
    if (!patientProfile) return;
    setIsUpdating(true);
    try {
      const updatedProfile: PatientDependenceProfile = {
        ...patientProfile,
        isFunctionalAssessmentCompleted: true,
        functionalAssessedAt: new Date().toISOString(),
        katzAdl: {
          ...katz,
          [item]: nextVal
        }
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
      const updatedProfile: PatientDependenceProfile = {
        ...patientProfile,
        isFunctionalAssessmentCompleted: true,
        functionalAssessedAt: new Date().toISOString(),
        lawtonIadl: {
          ...lawton,
          [item]: nextVal
        }
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
        }
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
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-2 max-w-3xl">
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
                <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Step 1: Patient Functional Assessment (ADL / IADL Baseline)
              </h2>
              <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed">
                Assess <strong>{patientName}</strong>&apos;s functional mobility. Katz ADL and Lawton-Brody IADL scores recorded below automatically determine care hours and shift coverage for Step 2 (Monthly Support Matrix).
              </p>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <FunctionAssessmentForm
                onComplete={onAssessmentCompleted}
                trigger={
                  <Button
                    size="sm"
                    className="h-10 text-xs font-bold gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
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
                className="h-10 text-xs font-semibold gap-1.5 border-border bg-background/80 hover:bg-muted cursor-pointer"
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
            <div className="p-3 sm:p-4 rounded-2xl border border-border/70 bg-background/70 shadow-2xs">
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
                    <div className="pt-1.5 mt-1 border-t border-border/50 flex items-center justify-between gap-1.5">
                      <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        Inpatient Calibrated (T_hosp × {patientProfile.inpatientBenchmark.environmentalPenaltyMultiplier}x)
                      </span>
                      {patientProfile.inpatientBenchmark.requiresTwoPersonTransfers && (
                        <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-300 text-[9px] font-bold px-1.5 py-0 border-rose-500/30">
                          2-Staff Required
                        </Badge>
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
            <div className="p-3 sm:p-4 rounded-2xl border border-border/70 bg-background/70 shadow-2xs">
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
        <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* ADL 1: Bed-to-Chair Transfers */}
          <div className={cn(
            'p-3.5 rounded-2xl border transition-all flex flex-col justify-between',
            !isAssessed
              ? 'bg-card border-border/70'
              : katz.transferring
              ? 'bg-card border-border/70'
              : 'bg-rose-500/5 border-rose-500/30 dark:bg-rose-950/20'
          )}>
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <Bed className={cn('w-4 h-4', !isAssessed ? 'text-muted-foreground' : katz.transferring ? 'text-emerald-600' : 'text-rose-600')} />
                  <span className="font-bold text-xs text-foreground">Bed-to-Chair Transfers</span>
                </div>
                <Switch
                  checked={katz.transferring}
                  onCheckedChange={(val) => void handleToggleKatz('transferring', val)}
                  disabled={isUpdating}
                  title="Toggle independent vs dependent transfers"
                />
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">
                {katz.transferring
                  ? 'Patient moves in and out of bed and chair independently without physical lifting.'
                  : 'Requires physical assistance or mechanical aid. Drives caregiver lumbar injury risk.'}
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-border/50 flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">Impact on Caregiver:</span>
              <span className={cn(
                'font-bold',
                !isAssessed
                  ? 'text-muted-foreground'
                  : katz.transferring
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-rose-700 dark:text-rose-400'
              )}>
                {!isAssessed
                  ? '● Pending Intake'
                  : katz.transferring
                  ? 'No Solo Lift Strain'
                  : 'Heavy Lifting Slots'}
              </span>
            </div>
          </div>

          {/* ADL 2: Bathing */}
          <div className={cn(
            'p-3.5 rounded-2xl border transition-all flex flex-col justify-between',
            !isAssessed
              ? 'bg-card border-border/70'
              : katz.bathing
              ? 'bg-card border-border/70'
              : 'bg-amber-500/5 border-amber-500/30 dark:bg-amber-950/20'
          )}>
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm">🛁</span>
                  <span className="font-bold text-xs text-foreground">Bathing & Hygiene</span>
                </div>
                <Switch
                  checked={katz.bathing}
                  onCheckedChange={(val) => void handleToggleKatz('bathing', val)}
                  disabled={isUpdating}
                  title="Toggle independent vs dependent bathing"
                />
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">
                {katz.bathing
                  ? 'Bathes self completely or needs help only for a single part (e.g. back).'
                  : 'Needs help bathing more than one part of body, entering/exiting tub, or bed-bath.'}
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-border/50 flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">Impact on Caregiver:</span>
              <span className={cn(
                'font-bold',
                !isAssessed
                  ? 'text-muted-foreground'
                  : katz.bathing
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-amber-700 dark:text-amber-400'
              )}>
                {!isAssessed
                  ? '● Pending Intake'
                  : katz.bathing
                  ? 'Independent Hygiene'
                  : 'Morning Shift Support'}
              </span>
            </div>
          </div>

          {/* ADL 3: Toileting */}
          <div className={cn(
            'p-3.5 rounded-2xl border transition-all flex flex-col justify-between',
            !isAssessed
              ? 'bg-card border-border/70'
              : katz.toileting
              ? 'bg-card border-border/70'
              : 'bg-amber-500/5 border-amber-500/30 dark:bg-amber-950/20'
          )}>
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm">🚽</span>
                  <span className="font-bold text-xs text-foreground">Toileting</span>
                </div>
                <Switch
                  checked={katz.toileting}
                  onCheckedChange={(val) => void handleToggleKatz('toileting', val)}
                  disabled={isUpdating}
                  title="Toggle independent vs dependent toileting"
                />
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">
                {katz.toileting
                  ? 'Gets to toilet, cleans self, and arranges clothes without assistance.'
                  : 'Needs help transferring to toilet, using commode chair, or managing bedpan.'}
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-border/50 flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">Impact on Caregiver:</span>
              <span className={cn(
                'font-bold',
                !isAssessed
                  ? 'text-muted-foreground'
                  : katz.toileting
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-amber-700 dark:text-amber-400'
              )}>
                {!isAssessed
                  ? '● Pending Intake'
                  : katz.toileting
                  ? 'Independent'
                  : 'Commode / Fall Risk'}
              </span>
            </div>
          </div>

          {/* ADL 4: Dressing */}
          <div className={cn(
            'p-3.5 rounded-2xl border transition-all flex flex-col justify-between',
            !isAssessed
              ? 'bg-card border-border/70'
              : katz.dressing
              ? 'bg-card border-border/70'
              : 'bg-amber-500/5 border-amber-500/30 dark:bg-amber-950/20'
          )}>
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm">👕</span>
                  <span className="font-bold text-xs text-foreground">Dressing</span>
                </div>
                <Switch
                  checked={katz.dressing}
                  onCheckedChange={(val) => void handleToggleKatz('dressing', val)}
                  disabled={isUpdating}
                  title="Toggle independent vs dependent dressing"
                />
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">
                {katz.dressing
                  ? 'Gets clothes from closet and dresses completely without help (except tying shoes).'
                  : 'Needs assistance with buttons, fasteners, or must be partially/fully dressed.'}
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-border/50 flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">Impact on Caregiver:</span>
              <span className={cn(
                'font-bold',
                !isAssessed
                  ? 'text-muted-foreground'
                  : katz.dressing
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-amber-700 dark:text-amber-400'
              )}>
                {!isAssessed
                  ? '● Pending Intake'
                  : katz.dressing
                  ? 'Independent'
                  : 'Daily Dressing Assist'}
              </span>
            </div>
          </div>

          {/* ADL 5: Continence */}
          <div className={cn(
            'p-3.5 rounded-2xl border transition-all flex flex-col justify-between',
            !isAssessed
              ? 'bg-card border-border/70'
              : katz.continence
              ? 'bg-card border-border/70'
              : 'bg-rose-500/5 border-rose-500/30 dark:bg-rose-950/20'
          )}>
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm">💧</span>
                  <span className="font-bold text-xs text-foreground">Bladder & Bowel Continence</span>
                </div>
                <Switch
                  checked={katz.continence}
                  onCheckedChange={(val) => void handleToggleKatz('continence', val)}
                  disabled={isUpdating}
                  title="Toggle continence vs incontinence"
                />
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">
                {katz.continence
                  ? 'Exercises complete self-control over urination and defecation.'
                  : 'Partial or total incontinence; requires diapers, scheduled changes, or catheter care.'}
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-border/50 flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">Impact on Caregiver:</span>
              <span className={cn(
                'font-bold',
                !isAssessed
                  ? 'text-muted-foreground'
                  : katz.continence
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-rose-700 dark:text-rose-400'
              )}>
                {!isAssessed
                  ? '● Pending Intake'
                  : katz.continence
                  ? 'Continent'
                  : 'Skin Care & Diapering'}
              </span>
            </div>
          </div>

          {/* ADL 6: Feeding */}
          <div className={cn(
            'p-3.5 rounded-2xl border transition-all flex flex-col justify-between',
            !isAssessed
              ? 'bg-card border-border/70'
              : katz.feeding
              ? 'bg-card border-border/70'
              : 'bg-rose-500/5 border-rose-500/30 dark:bg-rose-950/20'
          )}>
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm">🍽️</span>
                  <span className="font-bold text-xs text-foreground">Feeding</span>
                </div>
                <Switch
                  checked={katz.feeding}
                  onCheckedChange={(val) => void handleToggleKatz('feeding', val)}
                  disabled={isUpdating}
                  title="Toggle independent vs dependent feeding"
                />
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">
                {katz.feeding
                  ? 'Gets food from plate into mouth independently (meat pre-cutting allowed).'
                  : 'Needs help spoon-feeding, drinks from sip-cup, or requires parenteral/tube feeds.'}
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-border/50 flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">Impact on Caregiver:</span>
              <span className={cn(
                'font-bold',
                !isAssessed
                  ? 'text-muted-foreground'
                  : katz.feeding
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-rose-700 dark:text-rose-400'
              )}>
                {!isAssessed
                  ? '● Pending Intake'
                  : katz.feeding
                  ? 'Independent'
                  : 'Aspiration Precautions'}
              </span>
            </div>
          </div>
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
                Evaluates complex cognitive, organizational, and community tasks necessary for independent domestic living.
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
        <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { key: 'telephone' as const, label: 'Telephone Use', desc: 'Dials numbers and answers independently' },
            { key: 'shopping' as const, label: 'Shopping & Groceries', desc: 'Takes care of all shopping needs' },
            { key: 'mealPreparation' as const, label: 'Food Preparation', desc: 'Plans, cooks, and serves adequate meals' },
            { key: 'housekeeping' as const, label: 'Housekeeping', desc: 'Maintains domestic cleanliness' },
            { key: 'laundry' as const, label: 'Laundry', desc: 'Does personal laundry completely' },
            { key: 'transportation' as const, label: 'Transportation', desc: 'Travels independently or arranges cab' },
            { key: 'medicationManagement' as const, label: 'Medication Management', desc: 'Takes correct doses at correct times' },
            { key: 'finances' as const, label: 'Financial Management', desc: 'Manages money and bank matters' }
          ].map(({ key, label, desc }) => {
            const isIndep = lawton[key];
            return (
              <div
                key={key}
                className={cn(
                  'p-3 rounded-2xl border transition-all flex flex-col justify-between',
                  !isAssessed
                    ? 'bg-card border-border/70'
                    : isIndep
                    ? 'bg-card border-border/70'
                    : 'bg-muted/40 border-border/60'
                )}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="font-bold text-xs text-foreground truncate">{label}</span>
                  <Switch
                    checked={isIndep}
                    onCheckedChange={(val) => void handleToggleLawton(key, val)}
                    disabled={isUpdating}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground leading-tight mb-2">
                  {desc}
                </p>
                <div className="text-[10px] font-semibold">
                  {!isAssessed ? (
                    <span className="text-muted-foreground">● Pending Intake</span>
                  ) : isIndep ? (
                    <span className="text-emerald-600 dark:text-emerald-400">✓ Independent</span>
                  ) : (
                    <span className="text-muted-foreground">● Caregiver Assisted</span>
                  )}
                </div>
              </div>
            );
          })}
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
                          Latest Baseline
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
