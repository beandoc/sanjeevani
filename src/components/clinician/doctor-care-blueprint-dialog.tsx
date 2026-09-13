'use client';

import React, { useEffect, useMemo, useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Stethoscope,
  CheckCircle2,
  AlertTriangle,
  Bed,
  Clock,
  Send,
  Activity,
  FileSignature,
  Plus,
  Trash2,
  ClipboardCheck
} from 'lucide-react';
import {
  CaregiverAttributes,
  PatientDependenceProfile,
  ClinicalCareBlueprint,
  ClinicianAuthoredInstruction,
  AssistiveDeviceInventory,
  DEFAULT_ASSISTIVE_DEVICES
} from '@/lib/clinical/care-gap-engine';
import { StaffingRecommender, SimulatedStaffingOption } from '@/lib/clinical/staffing-recommender';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ClinicalSafetyNote, EvidenceLevelBadge } from '@/components/clinical/evidence-level-badge';
import { CLINICAL_PROVENANCE } from '@/lib/clinical/provenance';
import {
  INSTRUCTION_DOMAIN_OPTIONS,
  INSTRUCTION_TIMING_OPTIONS,
  acceptInstruction,
  buildDraftInstructions,
  editInstruction,
  newBlankInstruction,
  validateAllForIssue
} from '@/lib/clinical/blueprint-instruction-drafts';

interface DoctorCareBlueprintDialogProps {
  patientName: string;
  caregiver: CaregiverAttributes | null;
  patientProfile: PatientDependenceProfile | null;
  /**
   * Receives the blueprint with every instruction explicitly accepted. The caller is responsible
   * for persisting it AND writing the clinician-only authorization record (plan hash) — see the
   * dyad page's `handleBlueprintIssued`.
   */
  onBlueprintIssued: (blueprint: ClinicalCareBlueprint) => Promise<void>;
  /** Signed-in clinician's display name; seeds the author field. */
  clinicianDisplayName?: string;
  trigger?: React.ReactNode;
}

export function DoctorCareBlueprintDialog({
  patientName,
  caregiver,
  patientProfile,
  onBlueprintIssued,
  clinicianDisplayName,
  trigger
}: DoctorCareBlueprintDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Derive staffing recommendation from the engine. safeCaregiver/safePatient
  // are memoized so their identity is stable across renders when caregiver/
  // patientProfile haven't changed — the placeholder object literal fallbacks
  // were previously recreated fresh every render, which defeated `report`'s
  // memoization whenever no real profile was passed in yet.
  const safeCaregiver: CaregiverAttributes = useMemo(
    () =>
      caregiver || {
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
      },
    [caregiver]
  );

  const safePatient: PatientDependenceProfile = useMemo(
    () =>
      patientProfile || {
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
      },
    [patientProfile, patientName]
  );

  const report = useMemo(
    () => StaffingRecommender.recommend(safeCaregiver, safePatient),
    [safeCaregiver, safePatient]
  );

  // Selected Option State (defaults to recommended ladder rung)
  const [selectedRung, setSelectedRung] = useState<'minimum_viable' | 'recommended' | 'optimal'>('recommended');
  const activeOption: SimulatedStaffingOption =
    report.ladder.find((r) => r.rung === selectedRung) || report.ladder[1] || report.ladder[0];

  const [doctorName, setDoctorName] = useState(clinicianDisplayName?.trim() || '');
  const [respiteDays, setRespiteDays] = useState(4);

  useEffect(() => {
    if (clinicianDisplayName && !doctorName) setDoctorName(clinicianDisplayName.trim());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clinicianDisplayName]);

  // Assistive Devices
  const [devices, setDevices] = useState<AssistiveDeviceInventory>(
    safeCaregiver.assistiveDevices || {
      ...DEFAULT_ASSISTIVE_DEVICES,
      hospitalBed: safePatient.isBedBound ? 'motorized_multichannel' : 'none',
      airWaterMattress: safePatient.isBedBound || report.acuityAssessment.highAcuityProcedures.length > 0
    }
  );

  // -------------------------------------------------------------------------------------------
  // Instruction review. Drafts are generated when the dialog opens (never at issue time), shown
  // as editable forms, and each must be explicitly accepted before the plan can be issued.
  // -------------------------------------------------------------------------------------------
  const [instructions, setInstructions] = useState<ClinicianAuthoredInstruction[]>([]);
  const [draftsSeeded, setDraftsSeeded] = useState(false);

  useEffect(() => {
    if (!open) {
      setDraftsSeeded(false);
      return;
    }
    if (draftsSeeded) return;
    const nursingNote =
      report.acuityAssessment.dominantSkillTier === 'nurse'
        ? ['Nursing review needed: confirm wound-dressing plan, catheter hygiene and escalation signs with the visiting nurse.']
        : [];
    setInstructions(
      buildDraftInstructions({
        patient: safePatient,
        caregiver: safeCaregiver,
        devices,
        authorName: doctorName.trim() || 'Clinician',
        precautions: nursingNote
      })
    );
    setDraftsSeeded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, draftsSeeded]);

  // Author name edits propagate to every unissued directive.
  useEffect(() => {
    const name = doctorName.trim();
    if (!name) return;
    setInstructions((prev) => prev.map((i) => (i.authoredBy === name ? i : { ...i, authoredBy: name, prescribedBy: name })));
  }, [doctorName]);

  const validation = useMemo(() => validateAllForIssue(instructions), [instructions]);
  const acceptedCount = instructions.filter((i) => i.acceptedByClinician).length;

  const updateInstruction = (id: string, patch: Partial<ClinicianAuthoredInstruction>) =>
    setInstructions((prev) => prev.map((i) => (i.id === id ? editInstruction(i, patch) : i)));
  const toggleAccept = (id: string) =>
    setInstructions((prev) =>
      prev.map((i) => (i.id === id ? (i.acceptedByClinician ? { ...i, acceptedByClinician: false, acceptedAt: undefined } : acceptInstruction(i)) : i))
    );
  const removeInstruction = (id: string) => setInstructions((prev) => prev.filter((i) => i.id !== id));
  const addInstruction = () => setInstructions((prev) => [...prev, newBlankInstruction(doctorName.trim() || 'Clinician')]);

  const canIssue =
    !isSubmitting &&
    report.decisionSupportStatus !== 'requires_data_completion' &&
    doctorName.trim().length > 0 &&
    validation.valid;

  const handleIssueBlueprint = async () => {
    if (report.decisionSupportStatus === 'requires_data_completion') {
      toast({
        variant: 'destructive',
        title: 'Assessment Data Incomplete',
        description: report.dataQuality.missingFields.join(', ')
      });
      return;
    }
    if (!doctorName.trim()) {
      toast({ variant: 'destructive', title: 'Author Required', description: 'Enter the issuing clinician\'s name.' });
      return;
    }
    if (!validation.valid) {
      const firstProblem = Object.entries(validation.perInstruction).find(([, v]) => !v.valid);
      toast({
        variant: 'destructive',
        title: instructions.length === 0 ? 'No Directives to Issue' : 'Directives Not Ready',
        description: firstProblem
          ? `"${instructions.find((i) => i.id === firstProblem[0])?.title || 'Untitled'}" is missing: ${firstProblem[1].problems.join(', ')}.`
          : 'Add at least one directive and accept each one.'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const doc = doctorName.trim();
      const authoredInstructions: ClinicianAuthoredInstruction[] = instructions.map((i) => ({
        ...i,
        authoredBy: doc,
        prescribedBy: doc
      }));
      const precautions = authoredInstructions
        .filter((i) => i.timingWindow === 'as_needed')
        .map((i) => (i.title ? `${i.title}: ${i.instruction}` : i.instruction));

      const blueprint: ClinicalCareBlueprint = {
        id: `blueprint_${Date.now()}`,
        prescribedByDoctor: doc,
        prescribedAt: new Date().toISOString(),
        clinicalSummary: activeOption.clinicalJustification,
        recommendedSupportType: activeOption.supportType,
        recommendedShiftWindow: activeOption.shiftWindow,
        recommendedHoursPerDay: activeOption.hoursPerDay,
        clinicalPrecautions: precautions,
        recommendedAssistiveDevices: devices,
        recommendedRespiteDaysPerMonth: respiteDays,
        status: 'draft_prescribed',
        authoredInstructions,
        // Display hint only. Authorization is proven by the clinician-only record + plan hash
        // written by the caller, never by this object (it lives in a caregiver-editable document).
        clinicalReview: {
          decision: 'issued_by_clinician',
          reviewedAt: new Date().toISOString(),
          reviewedBy: doc,
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

          {/* Directive review — every instruction is an editable form requiring explicit acceptance */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                <ClipboardCheck className="w-3.5 h-3.5" /> Directives for the Family — Review & Accept Each
              </Label>
              <Badge variant={validation.valid ? 'default' : 'outline'} className={cn('text-[10px] font-mono', validation.valid && 'bg-emerald-600 text-white')}>
                {acceptedCount}/{instructions.length} accepted
              </Badge>
            </div>
            <ClinicalSafetyNote>
              Drafts below were generated from documented deficits only and carry no guideline attribution. Edit any text; editing clears
              acceptance. Nothing is issued until every directive is accepted. No transfer method is drafted — record a PT/OT assessment
              before writing one.
            </ClinicalSafetyNote>

            {instructions.length === 0 && (
              <div className="p-4 rounded-xl border border-dashed border-border text-center text-xs text-muted-foreground">
                No directives yet. Add one below — a plan cannot be issued without at least one accepted directive.
              </div>
            )}

            <div className="space-y-3">
              {instructions.map((inst, idx) => {
                const v = validation.perInstruction[inst.id];
                const accepted = !!inst.acceptedByClinician;
                return (
                  <div
                    key={inst.id}
                    className={cn(
                      'p-3.5 rounded-2xl border space-y-2.5 text-xs',
                      accepted ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-border bg-card'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-blue-600">#{idx + 1}</span>
                        <Badge variant="outline" className="text-[9px] font-mono uppercase">
                          {inst.source === 'draft_generated' ? 'engine draft' : 'clinician authored'}
                        </Badge>
                        {inst.requiresPtOtAssessment && (
                          <Badge variant="destructive" className="text-[9px] font-mono gap-1">
                            <AlertTriangle className="w-3 h-3" /> PT/OT assessment required for any method
                          </Badge>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        aria-label="Remove directive"
                        onClick={() => removeInstruction(inst.id)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="space-y-1 sm:col-span-1">
                        <Label className="text-[10px] text-muted-foreground font-semibold">Title</Label>
                        <Input
                          value={inst.title || ''}
                          onChange={(e) => updateInstruction(inst.id, { title: e.target.value })}
                          placeholder="Short name for the wall sheet"
                          className="h-8 text-xs font-semibold"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground font-semibold">Timing</Label>
                        <select
                          value={inst.timingWindow}
                          onChange={(e) => updateInstruction(inst.id, { timingWindow: e.target.value as ClinicianAuthoredInstruction['timingWindow'] })}
                          className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
                        >
                          {INSTRUCTION_TIMING_OPTIONS.map((o) => (
                            <option key={o.id} value={o.id}>{o.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground font-semibold">Domain</Label>
                        <select
                          value={inst.clinicalDomain || ''}
                          onChange={(e) => updateInstruction(inst.id, { clinicalDomain: (e.target.value || undefined) as ClinicianAuthoredInstruction['clinicalDomain'] })}
                          className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
                        >
                          <option value="">—</option>
                          {INSTRUCTION_DOMAIN_OPTIONS.map((o) => (
                            <option key={o.id} value={o.id}>{o.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground font-semibold">Indication — why this patient needs it</Label>
                      <Input
                        value={inst.indication}
                        onChange={(e) => updateInstruction(inst.id, { indication: e.target.value })}
                        placeholder="e.g. Katz transfer dependence documented on 2026-09-01"
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground font-semibold">Exact action the caregiver performs</Label>
                      <Textarea
                        value={inst.instruction}
                        onChange={(e) => updateInstruction(inst.id, { instruction: e.target.value })}
                        rows={3}
                        className="text-xs leading-relaxed"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground font-semibold">Exceptions — when NOT to do it / when to stop and call</Label>
                        <Input
                          value={inst.exceptions || ''}
                          onChange={(e) => updateInstruction(inst.id, { exceptions: e.target.value })}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground font-semibold">Parameters (optional)</Label>
                        <Input
                          value={inst.parameters || ''}
                          onChange={(e) => updateInstruction(inst.id, { parameters: e.target.value })}
                          placeholder="Thresholds, frequency, equipment"
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-end gap-3 pt-1 border-t border-border/50">
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground font-semibold">Review every (days)</Label>
                        <Input
                          type="number"
                          min={1}
                          max={365}
                          value={inst.reviewIntervalDays ?? ''}
                          onChange={(e) => {
                            const n = parseInt(e.target.value, 10);
                            updateInstruction(inst.id, { reviewIntervalDays: Number.isFinite(n) && n > 0 ? Math.min(365, n) : undefined });
                          }}
                          className="h-8 w-24 text-xs font-mono"
                        />
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono pb-2">
                        Author: {inst.authoredBy || '—'} · Reviewed {inst.reviewDate || '—'} · Expires {inst.expiresAt || '—'}
                      </div>
                    </div>

                    {inst.requiresPtOtAssessment && (
                      <label className="flex items-start gap-2 p-2 rounded-lg bg-amber-500/5 border border-amber-500/30 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!inst.ptOtAssessmentRecorded}
                          onChange={(e) => updateInstruction(inst.id, { ptOtAssessmentRecorded: e.target.checked })}
                          className="mt-0.5"
                        />
                        <span className="text-[11px] leading-tight">
                          A physiotherapist/occupational therapist has assessed this patient&apos;s transfers and taught the family the method.
                          Only then may the action above describe a specific technique.
                        </span>
                      </label>
                    )}

                    {v && !v.valid && !accepted && v.problems.filter((p) => p !== 'explicit clinician acceptance').length > 0 && (
                      <p className="text-[11px] text-rose-600 dark:text-rose-400">
                        Missing: {v.problems.filter((p) => p !== 'explicit clinician acceptance').join(', ')}
                      </p>
                    )}

                    <label
                      className={cn(
                        'flex items-center gap-2 p-2 rounded-lg border cursor-pointer',
                        accepted ? 'border-emerald-500/60 bg-emerald-500/10' : 'border-border bg-muted/30'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={accepted}
                        disabled={!accepted && !!v && v.problems.some((p) => p !== 'explicit clinician acceptance')}
                        onChange={() => toggleAccept(inst.id)}
                      />
                      <span className="text-[11px] font-semibold">
                        I have read this directive in full and accept responsibility for issuing it to the family.
                      </span>
                    </label>
                  </div>
                );
              })}
            </div>

            <Button type="button" size="sm" variant="outline" onClick={addInstruction} className="text-xs gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Add directive
            </Button>
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
                  aria-label="Motorized Multi-Channel Hospital Bed"
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
                  aria-label="Alternating Pressure Ripple Air Mattress"
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
                  aria-label="Transfer Aids (Gait Belt / Pivot Disc)"
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
                  aria-label="Folding Commode / Transit Wheelchair"
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
                placeholder="Issuing clinician's full name and role"
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
            disabled={!canIssue}
            size="sm"
            className="gap-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Issuing...' : `Issue Plan (${acceptedCount}/${instructions.length} directives accepted)`}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
