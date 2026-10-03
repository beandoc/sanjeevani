'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Building2,
  Clock,
  ShieldAlert,
  Save,
  Trash2,
  CheckCircle2,
  Users,
  Home,
  Check
} from 'lucide-react';
import {
  HealthRepository,
  type InpatientDischargeBenchmark,
  type InpatientObserverRole,
  type InpatientTransferAssistType,
  type InpatientFeedingAssistType,
  DEFAULT_ENVIRONMENTAL_PENALTY,
  calculateBenchmarkSummary
} from '@/lib/db/health-repository';
import type { PatientDependenceProfile } from '@/lib/clinical/care-gap-engine';

interface InpatientDischargeBenchmarkDialogProps {
  patientUid: string;
  patientName: string;
  patientProfile?: PatientDependenceProfile | null;
  onBenchmarkSaved?: (benchmark: InpatientDischargeBenchmark) => void;
  onBenchmarkCleared?: () => void;
  trigger?: React.ReactNode;
}

export function InpatientDischargeBenchmarkDialog({
  patientUid,
  patientName,
  patientProfile,
  onBenchmarkSaved,
  onBenchmarkCleared,
  trigger
}: InpatientDischargeBenchmarkDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const [observerRole, setObserverRole] = useState<InpatientObserverRole>('staff_nurse');
  const [observerName, setObserverName] = useState('');
  const [wardOrBedNumber, setWardOrBedNumber] = useState('');

  // Timed Tasks
  const [spongeBathMinutes, setSpongeBathMinutes] = useState(25);
  const [spongeBathStaffCount, setSpongeBathStaffCount] = useState<1 | 2>(1);

  const [bedToChairTransferMinutes, setBedToChairTransferMinutes] = useState(8);
  const [transferStaffCount, setTransferStaffCount] = useState<1 | 2>(1);
  const [transferAssistType, setTransferAssistType] =
    useState<InpatientTransferAssistType>('one_person_pivot');

  const [mealFeedingMinutesPerMeal, setMealFeedingMinutesPerMeal] = useState(20);
  const [mealsRequiringAssistancePerDay, setMealsRequiringAssistancePerDay] = useState(3);
  const [feedingAssistType, setFeedingAssistType] =
    useState<InpatientFeedingAssistType>('full_spoon_feeding');

  const [toiletingDiaperMinutes, setToiletingDiaperMinutes] = useState(12);
  const [toiletingEpisodesPerDay, setToiletingEpisodesPerDay] = useState(5);
  const [toiletingStaffCount, setToiletingStaffCount] = useState<1 | 2>(1);

  const [repositioningTurnMinutes, setRepositioningTurnMinutes] = useState(5);
  const [repositioningIntervalHours, setRepositioningIntervalHours] = useState(2);
  const [repositioningStaffCount, setRepositioningStaffCount] = useState<1 | 2>(1);

  const [medicationAdministrationMinutes, setMedicationAdministrationMinutes] = useState(5);
  const [medicationSlotsPerDay, setMedicationSlotsPerDay] = useState(3);

  const [environmentalPenaltyMultiplier, setEnvironmentalPenaltyMultiplier] = useState(
    DEFAULT_ENVIRONMENTAL_PENALTY
  );
  const [clinicalDischargeNotes, setClinicalDischargeNotes] = useState('');

  // Existing benchmark from local store
  const [existingBenchmark, setExistingBenchmark] =
    useState<InpatientDischargeBenchmark | null>(null);

  useEffect(() => {
    if (!open) return;
    const bm =
      patientProfile?.inpatientBenchmark ||
      HealthRepository.getInpatientDischargeBenchmark(patientUid);

    if (bm) {
      setExistingBenchmark(bm);
      setObserverRole(bm.observerRole);
      setObserverName(bm.observerName || '');
      setWardOrBedNumber(bm.wardOrBedNumber || '');
      setSpongeBathMinutes(bm.spongeBathMinutes);
      setSpongeBathStaffCount(bm.spongeBathStaffCount);
      setBedToChairTransferMinutes(bm.bedToChairTransferMinutes);
      setTransferStaffCount(bm.transferStaffCount);
      setTransferAssistType(bm.transferAssistType);
      setMealFeedingMinutesPerMeal(bm.mealFeedingMinutesPerMeal);
      setMealsRequiringAssistancePerDay(bm.mealsRequiringAssistancePerDay);
      setFeedingAssistType(bm.feedingAssistType);
      setToiletingDiaperMinutes(bm.toiletingDiaperMinutes);
      setToiletingEpisodesPerDay(bm.toiletingEpisodesPerDay);
      setToiletingStaffCount(bm.toiletingStaffCount);
      setRepositioningTurnMinutes(bm.repositioningTurnMinutes);
      setRepositioningIntervalHours(bm.repositioningIntervalHours);
      setRepositioningStaffCount(bm.repositioningStaffCount);
      setMedicationAdministrationMinutes(bm.medicationAdministrationMinutes);
      setMedicationSlotsPerDay(bm.medicationSlotsPerDay);
      setEnvironmentalPenaltyMultiplier(
        bm.environmentalPenaltyMultiplier || DEFAULT_ENVIRONMENTAL_PENALTY
      );
      setClinicalDischargeNotes(bm.clinicalDischargeNotes || '');
    } else {
      setExistingBenchmark(null);
    }
  }, [open, patientUid, patientProfile]);

  // Derived calculations in real-time
  const derived = calculateBenchmarkSummary({
    spongeBathMinutes,
    spongeBathStaffCount,
    bedToChairTransferMinutes,
    transferStaffCount,
    mealFeedingMinutesPerMeal,
    mealsRequiringAssistancePerDay,
    toiletingDiaperMinutes,
    toiletingEpisodesPerDay,
    toiletingStaffCount,
    repositioningTurnMinutes,
    repositioningIntervalHours,
    repositioningStaffCount,
    medicationAdministrationMinutes,
    medicationSlotsPerDay,
    environmentalPenaltyMultiplier
  });

  const handleSave = () => {
    setIsSaving(true);
    setSuccessMsg(null);
    try {
      const saved = HealthRepository.saveInpatientDischargeBenchmark({
        id: existingBenchmark?.id,
        patientUid,
        observerRole,
        observerName: observerName.trim() || 'Ward Clinical Staff',
        wardOrBedNumber: wardOrBedNumber.trim() || undefined,
        spongeBathMinutes,
        spongeBathStaffCount,
        bedToChairTransferMinutes,
        transferStaffCount,
        transferAssistType,
        mealFeedingMinutesPerMeal,
        mealsRequiringAssistancePerDay,
        feedingAssistType,
        toiletingDiaperMinutes,
        toiletingEpisodesPerDay,
        toiletingStaffCount,
        repositioningTurnMinutes,
        repositioningIntervalHours,
        repositioningStaffCount,
        medicationAdministrationMinutes,
        medicationSlotsPerDay,
        environmentalPenaltyMultiplier,
        clinicalDischargeNotes: clinicalDischargeNotes.trim() || undefined
      });

      setExistingBenchmark(saved);
      setSuccessMsg('Inpatient pre-discharge benchmark saved and calibrated!');

      if (onBenchmarkSaved) {
        onBenchmarkSaved(saved);
      }

      setTimeout(() => {
        setSuccessMsg(null);
        setOpen(false);
      }, 900);
    } catch (err) {
      console.error('Error saving benchmark:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to clear this inpatient discharge benchmark?')) {
      HealthRepository.clearInpatientDischargeBenchmark(patientUid);
      setExistingBenchmark(null);
      if (onBenchmarkCleared) {
        onBenchmarkCleared();
      }
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            size="sm"
            variant="outline"
            className="h-10 text-xs font-bold gap-2 border-indigo-500/40 text-indigo-700 dark:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20"
          >
            <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>
              {existingBenchmark
                ? 'Pre-Discharge Benchmark (Active)'
                : 'Hospital Benchmark (T_hosp)'}
            </span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto p-4 sm:p-6 rounded-3xl">
        <DialogHeader className="space-y-1.5 pb-2 border-b border-border/60">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className="bg-indigo-600 text-white font-bold text-[10px] tracking-wider uppercase">
              Clinical Inpatient Timing
            </Badge>
            <Badge
              variant="outline"
              className="text-xs border-indigo-500/30 text-indigo-700 dark:text-indigo-300 font-semibold"
            >
              Gold-Standard Empirical Baseline ($T_{'{hospital}'}$)
            </Badge>
            {existingBenchmark && (
              <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px] font-bold">
                Benchmark Active
              </Badge>
            )}
          </div>
          <DialogTitle className="text-lg sm:text-xl font-bold flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Pre-Discharge Care Timing Benchmark: {patientName}</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            Record timed care episodes measured by hospital staff (nurse, GDA, PT, doctor) in the
            24–48h pre-discharge window. This replaces generic consensus averages with measured
            reality, applying an environmental translation multiplier ($\theta \approx 1.35\times$)
            for home care planning.
          </DialogDescription>
        </DialogHeader>

        {/* Live Derived Header Summary Card */}
        <Card className="rounded-2xl border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 via-card to-background shadow-xs overflow-hidden">
          <CardContent className="p-3.5 sm:p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Inpatient Direct Care ($T_{'{hosp}'}$)
              </span>
              <div className="text-xl font-black font-mono text-foreground flex items-baseline gap-1">
                <span>{(derived.inpatientDirectCareMinutesPerDay / 60).toFixed(1)}</span>
                <span className="text-xs font-normal text-muted-foreground">hrs/day</span>
              </div>
              <p className="text-[10px] text-muted-foreground">
                {derived.inpatientDirectCareMinutesPerDay} hands-on caregiver-mins in ward
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                Home Projected Workload ($T_{'{home}'}$)
              </span>
              <div className="text-xl font-black font-mono text-indigo-600 dark:text-indigo-400 flex items-baseline gap-1">
                <span>{derived.homeProjectedDirectCareHoursPerDay.toFixed(1)}</span>
                <span className="text-xs font-normal text-muted-foreground">hrs/day</span>
              </div>
              <p className="text-[10px] text-muted-foreground">
                $T_{'{hosp}'} \times {environmentalPenaltyMultiplier}\times$ environmental penalty
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Transfer Staffing Protocol
              </span>
              <div>
                {transferStaffCount === 2 ? (
                  <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30 text-[10px] font-bold flex items-center gap-1 w-fit">
                    <ShieldAlert className="w-3 h-3 text-rose-600" />
                    Mandatory 2-Person Transfer
                  </Badge>
                ) : (
                  <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px] font-bold flex items-center gap-1 w-fit">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    1-Person Assisted
                  </Badge>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground">
                {transferStaffCount === 2
                  ? 'Flags safety alert in Caregiver Support Matrix'
                  : 'Single caregiver transfer feasible'}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-5 pt-1">
          {/* 1. Observer & Ward Metadata */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-primary" />
              <span>1. Observer & Pre-Discharge Location</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label
                  htmlFor="benchmark-observer-role"
                  className="text-xs font-semibold text-foreground/80 block mb-1"
                >
                  Staff Role
                </label>
                <select
                  id="benchmark-observer-role"
                  value={observerRole}
                  onChange={(e) => setObserverRole(e.target.value as InpatientObserverRole)}
                  className="w-full text-xs font-medium rounded-xl border border-input bg-background p-2 focus:ring-1 focus:ring-primary focus:outline-hidden"
                >
                  <option value="staff_nurse">Staff Nurse (RN)</option>
                  <option value="doctor">Treating Physician / Geriatrician</option>
                  <option value="general_duty_assistant">General Duty Assistant (GDA)</option>
                  <option value="physiotherapist">Physiotherapist (PT)</option>
                  <option value="occupational_therapist">Occupational Therapist (OT)</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="benchmark-observer-name"
                  className="text-xs font-semibold text-foreground/80 block mb-1"
                >
                  Observer Name / ID
                </label>
                <input
                  id="benchmark-observer-name"
                  type="text"
                  placeholder="e.g., Nurse Priya, RN"
                  value={observerName}
                  onChange={(e) => setObserverName(e.target.value)}
                  className="w-full text-xs font-medium rounded-xl border border-input bg-background p-2 focus:ring-1 focus:ring-primary focus:outline-hidden"
                />
              </div>

              <div>
                <label
                  htmlFor="benchmark-ward-bed"
                  className="text-xs font-semibold text-foreground/80 block mb-1"
                >
                  Ward / Bed Number
                </label>
                <input
                  id="benchmark-ward-bed"
                  type="text"
                  placeholder="e.g., Ward 4B, Bed 12"
                  value={wardOrBedNumber}
                  onChange={(e) => setWardOrBedNumber(e.target.value)}
                  className="w-full text-xs font-medium rounded-xl border border-input bg-background p-2 focus:ring-1 focus:ring-primary focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* 2. Measured Inpatient Task Timings */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span>2. Observed Hands-On Task Timings (Pre-Discharge Window)</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Task A: Sponge Bath */}
              <div className="p-3.5 rounded-2xl border border-border/70 bg-card/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">Sponge / Bed Bath</span>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    1x daily
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label
                      htmlFor="benchmark-bath-min"
                      className="text-[11px] text-muted-foreground block mb-1"
                    >
                      Duration (mins)
                    </label>
                    <input
                      id="benchmark-bath-min"
                      type="number"
                      min={5}
                      max={90}
                      step={5}
                      value={spongeBathMinutes}
                      onChange={(e) => setSpongeBathMinutes(Number(e.target.value))}
                      className="w-full text-xs font-semibold font-mono rounded-xl border border-input bg-background p-2"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="benchmark-bath-staff"
                      className="text-[11px] text-muted-foreground block mb-1"
                    >
                      Staff Required
                    </label>
                    <select
                      id="benchmark-bath-staff"
                      value={spongeBathStaffCount}
                      onChange={(e) => setSpongeBathStaffCount(Number(e.target.value) as 1 | 2)}
                      className="w-full text-xs font-semibold rounded-xl border border-input bg-background p-2"
                    >
                      <option value={1}>1 Staff (Single-hand)</option>
                      <option value={2}>2 Staff (Dual-assist)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Task B: Bed-to-Chair Transfer */}
              <div
                className={`p-3.5 rounded-2xl border ${
                  transferStaffCount === 2
                    ? 'border-rose-500/40 bg-rose-500/5'
                    : 'border-border/70 bg-card/60'
                } space-y-2.5`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">Bed-to-Chair Transfer</span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-bold ${
                      transferStaffCount === 2
                        ? 'border-rose-500/30 text-rose-700 dark:text-rose-300'
                        : ''
                    }`}
                  >
                    {transferStaffCount === 2 ? '2-Staff Required' : '1-Staff Assist'}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label
                      htmlFor="benchmark-transfer-min"
                      className="text-[11px] text-muted-foreground block mb-1"
                    >
                      Mins / Transfer
                    </label>
                    <input
                      id="benchmark-transfer-min"
                      type="number"
                      min={2}
                      max={45}
                      value={bedToChairTransferMinutes}
                      onChange={(e) => setBedToChairTransferMinutes(Number(e.target.value))}
                      className="w-full text-xs font-semibold font-mono rounded-xl border border-input bg-background p-2"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="benchmark-transfer-staff"
                      className="text-[11px] text-muted-foreground block mb-1"
                    >
                      Staff Required
                    </label>
                    <select
                      id="benchmark-transfer-staff"
                      value={transferStaffCount}
                      onChange={(e) => setTransferStaffCount(Number(e.target.value) as 1 | 2)}
                      className="w-full text-xs font-semibold rounded-xl border border-input bg-background p-2"
                    >
                      <option value={1}>1 Staff (Standby / Pivot)</option>
                      <option value={2}>2 Staff (Heavy Lift / Slide)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="benchmark-transfer-assist"
                    className="text-[11px] text-muted-foreground block mb-1"
                  >
                    Transfer Assist Type
                  </label>
                  <select
                    id="benchmark-transfer-assist"
                    value={transferAssistType}
                    onChange={(e) =>
                      setTransferAssistType(e.target.value as InpatientTransferAssistType)
                    }
                    className="w-full text-xs font-medium rounded-xl border border-input bg-background p-2"
                  >
                    <option value="walker_standby">Walker / Cane Standby Assistance</option>
                    <option value="one_person_pivot">1-Person Weight-Bearing Pivot</option>
                    <option value="two_person_lift_or_sheet">2-Person Draw-Sheet / Body Lift</option>
                    <option value="mechanical_hoist">Mechanical Patient Hoist</option>
                  </select>
                </div>
              </div>

              {/* Task C: Meal Feeding */}
              <div className="p-3.5 rounded-2xl border border-border/70 bg-card/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">Meal Assistance & Feeding</span>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {mealsRequiringAssistancePerDay} meals/day
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label
                      htmlFor="benchmark-meal-min"
                      className="text-[11px] text-muted-foreground block mb-1"
                    >
                      Mins / Meal
                    </label>
                    <input
                      id="benchmark-meal-min"
                      type="number"
                      min={5}
                      max={60}
                      step={5}
                      value={mealFeedingMinutesPerMeal}
                      onChange={(e) => setMealFeedingMinutesPerMeal(Number(e.target.value))}
                      className="w-full text-xs font-semibold font-mono rounded-xl border border-input bg-background p-2"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="benchmark-meal-count"
                      className="text-[11px] text-muted-foreground block mb-1"
                    >
                      Assisted Meals/Day
                    </label>
                    <input
                      id="benchmark-meal-count"
                      type="number"
                      min={0}
                      max={5}
                      value={mealsRequiringAssistancePerDay}
                      onChange={(e) =>
                        setMealsRequiringAssistancePerDay(Number(e.target.value))
                      }
                      className="w-full text-xs font-semibold font-mono rounded-xl border border-input bg-background p-2"
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="benchmark-feeding-assist"
                    className="text-[11px] text-muted-foreground block mb-1"
                  >
                    Feeding Technique
                  </label>
                  <select
                    id="benchmark-feeding-assist"
                    value={feedingAssistType}
                    onChange={(e) =>
                      setFeedingAssistType(e.target.value as InpatientFeedingAssistType)
                    }
                    className="w-full text-xs font-medium rounded-xl border border-input bg-background p-2"
                  >
                    <option value="setup_and_prompting">Setup, Cutting Food & Prompting</option>
                    <option value="full_spoon_feeding">Full Spoon-by-Spoon Feeding</option>
                    <option value="enteral_tube_feeding">Enteral Tube Feeding (RT / PEG)</option>
                    <option value="independent">Independent</option>
                  </select>
                </div>
              </div>

              {/* Task D: Toileting & Diaper Hygiene */}
              <div className="p-3.5 rounded-2xl border border-border/70 bg-card/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">
                    Toileting & Diaper Changes
                  </span>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {toiletingEpisodesPerDay} episodes/day
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label
                      htmlFor="benchmark-toilet-min"
                      className="text-[11px] text-muted-foreground block mb-1"
                    >
                      Mins / Change
                    </label>
                    <input
                      id="benchmark-toilet-min"
                      type="number"
                      min={5}
                      max={45}
                      value={toiletingDiaperMinutes}
                      onChange={(e) => setToiletingDiaperMinutes(Number(e.target.value))}
                      className="w-full text-xs font-semibold font-mono rounded-xl border border-input bg-background p-2"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="benchmark-toilet-count"
                      className="text-[11px] text-muted-foreground block mb-1"
                    >
                      Episodes / 24h
                    </label>
                    <input
                      id="benchmark-toilet-count"
                      type="number"
                      min={1}
                      max={12}
                      value={toiletingEpisodesPerDay}
                      onChange={(e) => setToiletingEpisodesPerDay(Number(e.target.value))}
                      className="w-full text-xs font-semibold font-mono rounded-xl border border-input bg-background p-2"
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="benchmark-toilet-staff"
                    className="text-[11px] text-muted-foreground block mb-1"
                  >
                    Staff Required per Change
                  </label>
                  <select
                    id="benchmark-toilet-staff"
                    value={toiletingStaffCount}
                    onChange={(e) => setToiletingStaffCount(Number(e.target.value) as 1 | 2)}
                    className="w-full text-xs font-semibold rounded-xl border border-input bg-background p-2"
                  >
                    <option value={1}>1 Staff (Single-carer diaper change)</option>
                    <option value={2}>2 Staff (Log roll / contracture assist)</option>
                  </select>
                </div>
              </div>

              {/* Task E: Bedbound Repositioning */}
              <div className="p-3.5 rounded-2xl border border-border/70 bg-card/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">
                    Skin / Turning Schedule (q2h)
                  </span>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    q{repositioningIntervalHours}h turns
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label
                      htmlFor="benchmark-turn-min"
                      className="text-[11px] text-muted-foreground block mb-1"
                    >
                      Mins / Turn
                    </label>
                    <input
                      id="benchmark-turn-min"
                      type="number"
                      min={2}
                      max={20}
                      value={repositioningTurnMinutes}
                      onChange={(e) => setRepositioningTurnMinutes(Number(e.target.value))}
                      className="w-full text-xs font-semibold font-mono rounded-xl border border-input bg-background p-2"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="benchmark-turn-interval"
                      className="text-[11px] text-muted-foreground block mb-1"
                    >
                      Turn Interval
                    </label>
                    <select
                      id="benchmark-turn-interval"
                      value={repositioningIntervalHours}
                      onChange={(e) => setRepositioningIntervalHours(Number(e.target.value))}
                      className="w-full text-xs font-medium rounded-xl border border-input bg-background p-2"
                    >
                      <option value={2}>Every 2 Hours (Standard)</option>
                      <option value={3}>Every 3 Hours</option>
                      <option value={4}>Every 4 Hours</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Task F: Medications */}
              <div className="p-3.5 rounded-2xl border border-border/70 bg-card/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">
                    Medication Administration
                  </span>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {medicationSlotsPerDay} slots/day
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label
                      htmlFor="benchmark-med-min"
                      className="text-[11px] text-muted-foreground block mb-1"
                    >
                      Mins / Slot
                    </label>
                    <input
                      id="benchmark-med-min"
                      type="number"
                      min={2}
                      max={25}
                      value={medicationAdministrationMinutes}
                      onChange={(e) =>
                        setMedicationAdministrationMinutes(Number(e.target.value))
                      }
                      className="w-full text-xs font-semibold font-mono rounded-xl border border-input bg-background p-2"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="benchmark-med-slots"
                      className="text-[11px] text-muted-foreground block mb-1"
                    >
                      Medication Slots/Day
                    </label>
                    <input
                      id="benchmark-med-slots"
                      type="number"
                      min={1}
                      max={6}
                      value={medicationSlotsPerDay}
                      onChange={(e) => setMedicationSlotsPerDay(Number(e.target.value))}
                      className="w-full text-xs font-semibold font-mono rounded-xl border border-input bg-background p-2"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Environmental Translation Multiplier */}
          <div className="space-y-2 p-3.5 rounded-2xl border border-indigo-500/20 bg-indigo-500/5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Home className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>3. Home Environmental Adaptation Penalty ($\theta$)</span>
              </span>
              <Badge className="bg-indigo-600 text-white font-mono text-xs font-bold">
                {environmentalPenaltyMultiplier}x Multiplier
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Hospital timing reflects professional nursing efficiency in an ergonomic environment.
              Home care encounters domestic bed heights, narrow door frames, and family anxiety.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setEnvironmentalPenaltyMultiplier(1.2)}
                className={`p-2 rounded-xl text-left border text-xs transition-all cursor-pointer ${
                  environmentalPenaltyMultiplier === 1.2
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 font-bold text-indigo-900 dark:text-indigo-200 shadow-2xs'
                    : 'border-border/70 hover:bg-muted/50 text-foreground/80'
                }`}
              >
                <div className="font-bold flex items-center justify-between">
                  <span>1.20x Adaptation</span>
                  {environmentalPenaltyMultiplier === 1.2 && <Check className="w-3 h-3 text-indigo-600" />}
                </div>
                <span className="text-[10px] text-muted-foreground block mt-0.5">
                  Optimal Home (Motorized hospital bed, wide doors, trained carer)
                </span>
              </button>

              <button
                type="button"
                onClick={() => setEnvironmentalPenaltyMultiplier(1.35)}
                className={`p-2 rounded-xl text-left border text-xs transition-all cursor-pointer ${
                  environmentalPenaltyMultiplier === 1.35
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 font-bold text-indigo-900 dark:text-indigo-200 shadow-2xs'
                    : 'border-border/70 hover:bg-muted/50 text-foreground/80'
                }`}
              >
                <div className="font-bold flex items-center justify-between">
                  <span>1.35x Standard (Recommended)</span>
                  {environmentalPenaltyMultiplier === 1.35 && (
                    <Check className="w-3 h-3 text-indigo-600" />
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground block mt-0.5">
                  Standard Indian Home (Low domestic bed, family handling)
                </span>
              </button>

              <button
                type="button"
                onClick={() => setEnvironmentalPenaltyMultiplier(1.6)}
                className={`p-2 rounded-xl text-left border text-xs transition-all cursor-pointer ${
                  environmentalPenaltyMultiplier === 1.6
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 font-bold text-indigo-900 dark:text-indigo-200 shadow-2xs'
                    : 'border-border/70 hover:bg-muted/50 text-foreground/80'
                }`}
              >
                <div className="font-bold flex items-center justify-between">
                  <span>1.60x High Barrier</span>
                  {environmentalPenaltyMultiplier === 1.6 && <Check className="w-3 h-3 text-indigo-600" />}
                </div>
                <span className="text-[10px] text-muted-foreground block mt-0.5">
                  High Barrier (Elderly solitary carer, narrow bathroom steps)
                </span>
              </button>
            </div>
          </div>

          {/* 4. Clinical Discharge Notes */}
          <div className="space-y-1.5">
            <label
              htmlFor="benchmark-discharge-notes"
              className="text-xs font-semibold text-foreground/80 block"
            >
              Clinical Pre-Discharge Notes & Handling Directives
            </label>
            <textarea
              id="benchmark-discharge-notes"
              rows={2}
              placeholder="e.g., Patient requires bilateral knee braces before standing; tolerates chair sitting max 45 minutes before discomfort."
              value={clinicalDischargeNotes}
              onChange={(e) => setClinicalDischargeNotes(e.target.value)}
              className="w-full text-xs font-medium rounded-xl border border-input bg-background p-2.5 focus:ring-1 focus:ring-primary focus:outline-hidden"
            />
          </div>

          {successMsg && (
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t border-border/60">
          <div>
            {existingBenchmark && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                Clear Benchmark
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              className="text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="text-xs font-bold gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save & Calibrate Care Blueprint'}</span>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
