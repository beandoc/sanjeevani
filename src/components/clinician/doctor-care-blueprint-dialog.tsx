'use client';

import React, { useState } from 'react';
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
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Stethoscope,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Bed,
  Clock,
  Send,
  Users,
  Activity,
  FileSignature
} from 'lucide-react';
import {
  CaregiverAttributes,
  PatientDependenceProfile,
  ClinicalCareBlueprint,
  AssistiveDeviceInventory,
  DEFAULT_ASSISTIVE_DEVICES,
  FormalSupportType
} from '@/lib/clinical/care-gap-engine';
import { StaffingRecommender, SimulatedStaffingOption } from '@/lib/clinical/staffing-recommender';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ClinicalSafetyNote, EvidenceLevelBadge } from '@/components/clinical/evidence-level-badge';
import { CLINICAL_PROVENANCE } from '@/lib/clinical/provenance';

interface DoctorCareBlueprintDialogProps {
  patientUid: string;
  patientName: string;
  caregiver: CaregiverAttributes | null;
  patientProfile: PatientDependenceProfile | null;
  onBlueprintIssued: (blueprint: ClinicalCareBlueprint) => Promise<void>;
  trigger?: React.ReactNode;
}

export function DoctorCareBlueprintDialog({
  patientUid,
  patientName,
  caregiver,
  patientProfile,
  onBlueprintIssued,
  trigger
}: DoctorCareBlueprintDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Derive staffing recommendation from the engine
  const safeCaregiver: CaregiverAttributes = caregiver || {
    name: 'Primary Caregiver',
    age: 50,
    gender: 'female',
    kinship: 'daughter',
    coResidence: 'lives_together',
    education: 'graduate',
    employment: 'full_time',
    dailyHoursCommitted: 5,
    monthlyOutOfPocketBurden: 'moderate_strain',
    formalTrainingReceived: false,
    caregiverHealth: {
      hasBackPain: false,
      hasHypertension: false,
      hasArthritis: false,
      hasDiabetes: false,
      hasInsomnia: false
    }
  };

  const safePatient: PatientDependenceProfile = patientProfile || {
    name: patientName,
    age: 75,
    primaryConditions: [],
    katzAdl: {
      bathing: false,
      dressing: false,
      toileting: true,
      transferring: false,
      continence: true,
      feeding: true
    },
    lawtonIadl: {
      telephone: true,
      shopping: false,
      mealPreparation: false,
      housekeeping: false,
      laundry: false,
      transportation: false,
      medicationManagement: false,
      finances: false
    },
    cognitiveBehavioralLoad: 'none',
    fallHistoryLast6Months: 0,
    isBedBound: false
  };

  const report = StaffingRecommender.recommend(safeCaregiver, safePatient);

  // Selected Option State (defaults to recommended ladder rung)
  const [selectedRung, setSelectedRung] = useState<'minimum_viable' | 'recommended' | 'optimal'>('recommended');
  const activeOption: SimulatedStaffingOption =
    report.ladder.find((r) => r.rung === selectedRung) || report.ladder[1] || report.ladder[0];

  // Customizable Precautions
  const defaultPrecautions = [
    ...(safeCaregiver.caregiverHealth.hasBackPain || safeCaregiver.age >= 60
      ? ['Primary caregiver must NOT perform solo manual bed-to-chair lifts (use 2-person assist or transfer aids).']
      : []),
    ...(safePatient.isBedBound
      ? ['Create an individualized repositioning plan, often every 2-3 hours depending on skin status, comfort, perfusion, and support surface.']
      : []),
    ...(safePatient.fallHistoryLast6Months >= 1
      ? ['High Fall Hazard: review bedside commode, footwear, lighting, and non-slip bathroom grab rails for fit and feasibility.']
      : []),
    ...(report.acuityAssessment.dominantSkillTier === 'nurse'
      ? ['Clinical Nursing Review: confirm wound dressing plan, catheter drainage hygiene, escalation signs, and local nursing scope of practice.']
      : []),
    'Maintain daily blood pressure and vitals log prior to morning medication administration.'
  ];

  const [precautions, setPrecautions] = useState<string[]>(defaultPrecautions);
  const [newPrecautionText, setNewPrecautionText] = useState('');
  const [doctorName, setDoctorName] = useState('Dr. Vivek (Geriatric Specialist)');
  const [respiteDays, setRespiteDays] = useState(4);

  // Assistive Devices
  const [devices, setDevices] = useState<AssistiveDeviceInventory>(
    safeCaregiver.assistiveDevices || {
      ...DEFAULT_ASSISTIVE_DEVICES,
      hospitalBed: safePatient.isBedBound ? 'motorized_multichannel' : 'none',
      airWaterMattress: safePatient.isBedBound || report.acuityAssessment.highAcuityProcedures.length > 0
    }
  );

  const handleAddPrecaution = () => {
    if (newPrecautionText.trim()) {
      setPrecautions([...precautions, newPrecautionText.trim()]);
      setNewPrecautionText('');
    }
  };

  const handleRemovePrecaution = (index: number) => {
    setPrecautions(precautions.filter((_, i) => i !== index));
  };

  const handleIssueBlueprint = async () => {
    if (report.decisionSupportStatus === 'requires_data_completion') {
      toast({
        variant: 'destructive',
        title: 'Assessment Data Incomplete',
        description: report.dataQuality.missingFields.join(', ')
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const blueprint: ClinicalCareBlueprint = {
        id: `blueprint_${Date.now()}`,
        prescribedByDoctor: doctorName.trim() || 'Dr. Vivek',
        prescribedAt: new Date().toISOString(),
        clinicalSummary: activeOption.clinicalJustification,
        recommendedSupportType: activeOption.supportType,
        recommendedShiftWindow: activeOption.shiftWindow,
        recommendedHoursPerDay: activeOption.hoursPerDay,
        clinicalPrecautions: precautions,
        recommendedAssistiveDevices: devices,
        recommendedRespiteDaysPerMonth: respiteDays,
        status: 'draft_prescribed',
        clinicalReview: {
          decision: 'issued_by_clinician',
          reviewedAt: new Date().toISOString(),
          reviewedBy: doctorName.trim() || 'Dr. Vivek',
          policyVersion: report.policyVersion,
          decisionSupportStatus: report.decisionSupportStatus
        }
      };

      await onBlueprintIssued(blueprint);
      toast({
        title: 'Reviewed Care Blueprint Issued',
        description: `Reviewed plan saved for ${patientName}. The family can now review and adopt it in their Care Circle.`
      });
      setOpen(false);
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Could Not Issue Blueprint',
        description: err instanceof Error ? err.message : 'Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" className="gap-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs">
            <Stethoscope className="w-4 h-4" />
            <span>Review Home Care Blueprint</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl p-4 sm:p-6">
        <DialogHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
            <FileSignature className="w-4 h-4" />
            <span>Clinical Decision Support & Home Care Planning</span>
          </div>
          <DialogTitle className="text-lg sm:text-xl font-bold font-headline">
            Review Home Care Blueprint for {patientName}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Review documented inputs and draft a home-care plan. The family receives the clinician-reviewed plan in their Kutumbh Care Circle to fine-tune and adopt.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          <div className="flex flex-wrap items-center gap-2">
            <EvidenceLevelBadge provenance={CLINICAL_PROVENANCE.staffingHeuristic} />
            <EvidenceLevelBadge provenance={CLINICAL_PROVENANCE.careGapHeuristic} />
            <EvidenceLevelBadge level="expert-consensus" label="Clinician Sign-Off" />
          </div>
          <ClinicalSafetyNote>
            The ladder below is a draft decision-support output. Confirm scope of practice, affordability, family capacity, transfer safety, wound/catheter needs, and medication review before issuing.
          </ClinicalSafetyNote>
          {report.decisionSupportStatus !== 'ready_for_clinician_review' && (
            <div className="p-3 rounded-xl border border-amber-500/40 bg-amber-500/5 text-xs">
              <p className="font-bold text-amber-900 dark:text-amber-200">
                {report.decisionSupportStatus === 'requires_data_completion'
                  ? 'Complete missing assessment data before issuing this plan.'
                  : 'Confirm the following limitations before issuing this plan.'}
              </p>
              <p className="text-muted-foreground mt-1">
                {[...report.dataQuality.missingFields, ...report.dataQuality.limitations].slice(0, 2).join(' • ')}
                {[...report.dataQuality.missingFields, ...report.dataQuality.limitations].length > 2 ? ' (and more)' : ''}
              </p>
            </div>
          )}
          {/* Clinical Acuity & Hazard Summary */}
          <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" /> Clinical Acuity & Required Tier
              </span>
              <Badge variant="outline" className="text-[10px] font-mono border-blue-500/30 text-blue-700 dark:text-blue-300">
                Tier: {report.acuityAssessment.dominantSkillTier.toUpperCase()}
              </Badge>
            </div>
            <p className="text-xs text-foreground leading-relaxed">
              <strong>Clinical Rationale:</strong> {report.acuityAssessment.clinicalReasons.join('. ') || 'Standard geriatric care support requirements.'}
            </p>
            {report.acuityAssessment.highAcuityProcedures.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {report.acuityAssessment.highAcuityProcedures.map((flag: string, idx: number) => (
                  <Badge key={idx} variant="destructive" className="text-[9px] font-mono gap-1">
                    <AlertTriangle className="w-3 h-3" /> {flag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Three-rung staffing options for clinician review */}
          <div className="space-y-3">
            <Label className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Select Staffing & Shift Window Option
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {report.ladder.map((opt) => {
                const isSelected = selectedRung === opt.rung;
                return (
                  <button
                    key={opt.rung}
                    type="button"
                    onClick={() => setSelectedRung(opt.rung)}
                    className={cn(
                      'p-3.5 rounded-2xl border text-left flex flex-col justify-between space-y-2 transition-all',
                      isSelected
                        ? 'border-blue-600 bg-blue-500/10 shadow-sm ring-2 ring-blue-500/30 font-bold'
                        : 'border-border bg-card hover:border-blue-400/40'
                    )}
                  >
                    <div className="flex items-center justify-between w-full">
                      <Badge
                        variant={opt.rung === 'recommended' ? 'default' : 'outline'}
                        className={cn(
                          'text-[9px] uppercase font-mono',
                          opt.rung === 'recommended' && 'bg-blue-600 text-white'
                        )}
                      >
                        {opt.rung.replace('_', ' ')}
                      </Badge>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-foreground leading-tight">{opt.title}</h4>
                      <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{opt.clinicalJustification}</p>
                    </div>
                    <div className="pt-1 border-t border-border/60 flex items-center justify-between text-[10px] font-mono">
                      <span className="text-emerald-600 font-semibold">Res Gap: {opt.simulatedResult.netCareGapHours}h</span>
                      <span className="text-muted-foreground">{opt.affordabilityFit.split('/')[0]}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Clinical Safety Directives & Precautions */}
          <div className="space-y-3">
            <Label className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Safety Notes & Precautions for Family
            </Label>
            <div className="space-y-2">
              {precautions.map((item, idx) => (
                <div key={idx} className="p-2.5 rounded-xl border border-border/80 bg-card flex items-start justify-between gap-2 text-xs">
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold font-mono">#{idx + 1}</span>
                    <span className="text-foreground leading-relaxed">{item}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemovePrecaution(idx)}
                    className="text-muted-foreground hover:text-rose-600 text-xs font-bold px-1"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-1">
              <Input
                value={newPrecautionText}
                onChange={(e) => setNewPrecautionText(e.target.value)}
                placeholder="Add custom safety note for the family..."
                className="h-9 text-xs"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddPrecaution();
                  }
                }}
              />
              <Button type="button" size="sm" variant="outline" onClick={handleAddPrecaution} className="text-xs shrink-0">
                + Add Note
              </Button>
            </div>
          </div>

          {/* Suggested Assistive Devices */}
          <div className="p-4 rounded-2xl bg-muted/20 border border-border/60 space-y-3">
            <Label className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Bed className="w-3.5 h-3.5" /> Suggested Assistive & Ergonomic Devices
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-border bg-card cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={devices.hospitalBed !== 'none'}
                  onChange={(e) =>
                    setDevices({
                      ...devices,
                      hospitalBed: e.target.checked ? 'motorized_multichannel' : 'none'
                    })
                  }
                  className="rounded text-primary"
                />
                <div>
                  <span className="font-bold block">Motorized Multi-Channel Hospital Bed</span>
                  <span className="text-[10px] text-muted-foreground">Enables electronic backrest elevation & eases caregiver transfer strain</span>
                </div>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-border bg-card cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={devices.airWaterMattress}
                  onChange={(e) => setDevices({ ...devices, airWaterMattress: e.target.checked })}
                  className="rounded text-primary"
                />
                <div>
                  <span className="font-bold block">Alternating Pressure Ripple Air Mattress</span>
                  <span className="text-[10px] text-muted-foreground">Supports pressure redistribution when combined with skin checks and repositioning</span>
                </div>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-border bg-card cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={devices.transferAids}
                  onChange={(e) => setDevices({ ...devices, transferAids: e.target.checked })}
                  className="rounded text-primary"
                />
                <div>
                  <span className="font-bold block">Transfer Aids (Gait Belt / Pivot Disc)</span>
                  <span className="text-[10px] text-muted-foreground">May reduce manual-handling load when matched to patient ability and training</span>
                </div>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-border bg-card cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={devices.wheelchair}
                  onChange={(e) => setDevices({ ...devices, wheelchair: e.target.checked })}
                  className="rounded text-primary"
                />
                <div>
                  <span className="font-bold block">Folding Commode / Transit Wheelchair</span>
                  <span className="text-[10px] text-muted-foreground">Safe toileting and room mobility</span>
                </div>
              </label>
            </div>
          </div>

          {/* Doctor Signature & Respite Days */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Reviewing Clinician Name</Label>
              <Input
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                placeholder="Dr. Vivek, MD (Geriatric Medicine)"
                className="h-9 text-xs font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Recommended Respite Days for Caregiver (Days/Mo)</Label>
              <Input
                type="number"
                min={1}
                max={10}
                value={respiteDays}
                onChange={(e) => setRespiteDays(parseInt(e.target.value) || 4)}
                className="h-9 text-xs font-mono"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 pt-4 border-t border-border/60">
          <Button variant="outline" size="sm" onClick={() => setOpen(false)} className="text-xs">
            Cancel
          </Button>
          <Button
            onClick={handleIssueBlueprint}
            disabled={isSubmitting || report.decisionSupportStatus === 'requires_data_completion'}
            size="sm"
            className="gap-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Issuing...' : 'Issue Reviewed Care Blueprint'}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
