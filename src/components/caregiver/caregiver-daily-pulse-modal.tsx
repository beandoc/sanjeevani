'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  HeartPulse,
  Moon,
  Activity,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import {
  CaregiverOperationalPulse,
  CaregiverResilienceEngine,
  RespiteEngine,
  RespitePrescription
} from '@/lib/clinical/discharge-home-os';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caregiverName?: string;
  patientName?: string;
  onSubmitted?: (pulse: CaregiverOperationalPulse) => void;
}

export function CaregiverDailyPulseModal({
  open,
  onOpenChange,
  caregiverName = 'Ramesh Kumar',
  patientName = 'Savitri Sharma',
  onSubmitted
}: Props) {
  // Pulse fields
  const [sleepHours, setSleepHours] = useState<number>(5);
  const [sleepDisrupted, setSleepDisrupted] = useState<boolean>(true);
  const [canContinue, setCanContinue] = useState<CaregiverOperationalPulse['canContinueCaregivingToday']>(
    'yes_with_difficulty'
  );
  const [physicalStrain, setPhysicalStrain] = useState<number>(6);
  const [confidence, setConfidence] = useState<number>(3);
  const [helpAttendance, setHelpAttendance] = useState<CaregiverOperationalPulse['didScheduledHelpArrive']>(
    'yes_on_time'
  );

  const [submittedPulse, setSubmittedPulse] = useState<CaregiverOperationalPulse | null>(null);
  const [respiteOffer, setRespiteOffer] = useState<RespitePrescription | null>(null);

  const handleSubmit = () => {
    const pulse: CaregiverOperationalPulse = {
      id: `pulse_${Date.now()}`,
      caregiverName,
      timestamp: new Date().toISOString(),
      hoursOfSleepLastNight: sleepHours,
      sleepDisruptedByCareCalls: sleepDisrupted,
      canContinueCaregivingToday: canContinue,
      physicalStrainScore: physicalStrain,
      confidenceScore: confidence,
      didScheduledHelpArrive: helpAttendance
    };

    setSubmittedPulse(pulse);
    const evaluation = CaregiverResilienceEngine.evaluatePulse(pulse);
    if (evaluation.respitePrescriptionNeeded) {
      const rx = RespiteEngine.generateRecommendation(pulse, true, 8);
      setRespiteOffer(rx);
    } else {
      setRespiteOffer(null);
    }

    if (onSubmitted) {
      onSubmitted(pulse);
    }
  };

  const handleReset = () => {
    setSubmittedPulse(null);
    setRespiteOffer(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        {!submittedPulse ? (
          <div className="space-y-6">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-primary border-primary/30 text-[10px] font-bold">
                  60-Second Operational Check
                </Badge>
              </div>
              <DialogTitle className="text-xl font-extrabold flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-rose-500" />
                Caregiver Daily Resilience Pulse
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                How are you feeling today, {caregiverName}? Your health and sleep are the central safety barrier protecting {patientName}.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 text-xs">
              {/* Question 1: Sleep Hours */}
              <div className="space-y-2 p-3 rounded-xl bg-muted/40 border border-border/50">
                <div className="flex items-center justify-between">
                  <Label className="font-bold flex items-center gap-1.5">
                    <Moon className="w-4 h-4 text-indigo-500" />
                    How many hours of sleep did you get last night?
                  </Label>
                  <span
                    className={`font-mono text-sm font-extrabold ${
                      sleepHours < 4 ? 'text-destructive' : sleepHours < 6 ? 'text-amber-500' : 'text-emerald-600'
                    }`}
                  >
                    {sleepHours} hrs
                  </span>
                </div>
                <Slider
                  value={[sleepHours]}
                  min={1}
                  max={10}
                  step={0.5}
                  onValueChange={(val) => setSleepHours(val[0])}
                  className="py-1"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>1h (Exhausted)</span>
                  <span>4h (Critical threshold)</span>
                  <span>8h+ (Restful)</span>
                </div>
              </div>

              {/* Question 2: Can you sustain today? */}
              <div className="space-y-2 p-3 rounded-xl bg-muted/40 border border-border/50">
                <Label className="font-bold">Can you comfortably continue caregiving today?</Label>
                <RadioGroup
                  value={canContinue}
                  onValueChange={(v) => setCanContinue(v as any)}
                  className="grid grid-cols-1 gap-2 pt-1"
                >
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-border/60 bg-card cursor-pointer hover:border-primary/50">
                    <RadioGroupItem value="yes_confidently" />
                    <span className="font-medium text-xs">Yes, feeling capable and confident</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-border/60 bg-card cursor-pointer hover:border-primary/50">
                    <RadioGroupItem value="yes_with_difficulty" />
                    <span className="font-medium text-xs text-amber-600 dark:text-amber-400">
                      Struggling, but will manage today
                    </span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-destructive/40 bg-destructive/5 cursor-pointer hover:border-destructive">
                    <RadioGroupItem value="cannot_continue_need_urgent_help" />
                    <span className="font-bold text-xs text-destructive">
                      Cannot continue — urgent relief needed today
                    </span>
                  </label>
                </RadioGroup>
              </div>

              {/* Question 3: Physical Back / Muscle Strain */}
              <div className="space-y-2 p-3 rounded-xl bg-muted/40 border border-border/50">
                <div className="flex items-center justify-between">
                  <Label className="font-bold flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-orange-500" />
                    Physical Back / Body Strain Rating
                  </Label>
                  <span
                    className={`font-mono text-sm font-extrabold ${
                      physicalStrain >= 7
                        ? 'text-destructive'
                        : physicalStrain >= 5
                        ? 'text-amber-500'
                        : 'text-emerald-600'
                    }`}
                  >
                    {physicalStrain} / 10
                  </span>
                </div>
                <Slider
                  value={[physicalStrain]}
                  min={0}
                  max={10}
                  step={1}
                  onValueChange={(val) => setPhysicalStrain(val[0])}
                  className="py-1"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>0 (No ache)</span>
                  <span>5 (Moderate ache)</span>
                  <span>10 (Severe/Cannot lift)</span>
                </div>
              </div>

              {/* Question 4: Attendance */}
              <div className="space-y-2 p-3 rounded-xl bg-muted/40 border border-border/50">
                <Label className="font-bold">Did your planned helper / attendant show up?</Label>
                <RadioGroup
                  value={helpAttendance}
                  onValueChange={(v) => setHelpAttendance(v as any)}
                  className="grid grid-cols-2 gap-2 pt-1"
                >
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-border/60 bg-card cursor-pointer">
                    <RadioGroupItem value="yes_on_time" />
                    <span className="text-xs">Yes, on time</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-border/60 bg-card cursor-pointer">
                    <RadioGroupItem value="did_not_show_up" />
                    <span className="text-xs text-destructive font-bold">Did not show up</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-border/60 bg-card cursor-pointer">
                    <RadioGroupItem value="arrived_late" />
                    <span className="text-xs text-amber-600">Arrived late</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-border/60 bg-card cursor-pointer">
                    <RadioGroupItem value="no_help_planned" />
                    <span className="text-xs text-muted-foreground">No helper planned</span>
                  </label>
                </RadioGroup>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSubmit} className="bg-primary font-bold">
                Submit Pulse Check
              </Button>
            </DialogFooter>
          </div>
        ) : (
          /* Result & Proactive Respite Offer */
          <div className="space-y-5">
            <DialogHeader>
              <DialogTitle className="text-xl font-extrabold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Pulse Recorded Successfully
              </DialogTitle>
              <DialogDescription className="text-xs">
                Clinical safety evaluation completed for {caregiverName}.
              </DialogDescription>
            </DialogHeader>

            {respiteOffer ? (
              <div className="p-4 rounded-xl border border-indigo-500/30 bg-indigo-500/5 space-y-3">
                <div className="flex items-center justify-between">
                  <Badge className="bg-indigo-600 text-white text-[10px] font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Proactive Respite Prescribed
                  </Badge>
                  <span className="text-xs font-mono font-bold text-indigo-700 dark:text-indigo-300">
                    +{respiteOffer.estimatedHoursReliefPerWeek}h relief/wk
                  </span>
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-foreground">{respiteOffer.headline}</h4>
                  <p className="text-xs text-muted-foreground">{respiteOffer.scheduleProposal}</p>
                </div>

                <div className="text-xs bg-card p-2.5 rounded-lg border border-border/60 text-muted-foreground">
                  <strong>Clinical Rationale:</strong> {respiteOffer.clinicalRationale}
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <Button
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
                    onClick={handleReset}
                  >
                    Request Respite Dispatch
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-2">
                <h4 className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                  Resilience Buffer Sustainable
                </h4>
                <p className="text-xs text-emerald-800 dark:text-emerald-300">
                  Caregiver sleep and physical load are within safe margins. Keep up the hydration and scheduled rests!
                </p>
              </div>
            )}

            <DialogFooter>
              <Button size="sm" variant="outline" onClick={handleReset} className="w-full">
                Close
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
