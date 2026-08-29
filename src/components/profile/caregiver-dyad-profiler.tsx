'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users,
  Activity,
  HeartPulse,
  ShieldAlert,
  Clock,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Save,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Building2,
  Stethoscope
} from 'lucide-react';
import {
  HealthRepository,
  CaregiverAttributes,
  PatientDependenceProfile,
  CareGapEvaluationResult
} from '@/lib/db/health-repository';
import { CareGapEngine } from '@/lib/clinical/care-gap-engine';
import { StaffingRecommender } from '@/lib/clinical/staffing-recommender';
import {
  FORMAL_SUPPORT_OPTIONS,
  buildFormalSupport,
  resolveSupportTypes,
  toggleSupportType
} from '@/lib/clinical/formal-support';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  syncPatientProfile,
  syncCaregiverAttributes,
  getCaregiverAttributesFor,
  getPatientProfileFor
} from '@/lib/firebase/clinical-sync';
import { auth } from '@/lib/firebase/client';
import { ClinicalSafetyNote, EvidenceLevelBadge } from '@/components/clinical/evidence-level-badge';
import { CLINICAL_PROVENANCE } from '@/lib/clinical/provenance';

export function CaregiverDyadProfiler() {
  const [caregiver, setCaregiver] = useState<CaregiverAttributes | null>(null);
  const [patient, setPatient] = useState<PatientDependenceProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'caregiver' | 'patient' | 'gap'>('gap');
  const { toast } = useToast();

  const [caregiverFirstName, setCaregiverFirstName] = useState('');
  const [caregiverLastName, setCaregiverLastName] = useState('');

  // Sync caregiver name to first/last inputs
  useEffect(() => {
    if (caregiver?.name) {
      const parts = caregiver.name.trim().split(/\s+/);
      const first = parts[0] || '';
      const last = parts.slice(1).join(' ') || '';
      if (first !== caregiverFirstName) setCaregiverFirstName(first);
      if (last !== caregiverLastName) setCaregiverLastName(last);
    }
  }, [caregiver?.name]);

  const handleCaregiverFirstNameChange = (val: string) => {
    setCaregiverFirstName(val);
    setCaregiver((prev) => prev ? { ...prev, name: `${val.trim()} ${caregiverLastName.trim()}`.trim() } : null);
  };

  const handleCaregiverLastNameChange = (val: string) => {
    setCaregiverLastName(val);
    setCaregiver((prev) => prev ? { ...prev, name: `${caregiverFirstName.trim()} ${val.trim()}`.trim() } : null);
  };

  useEffect(() => {
    // Initial local read
    const localCg = HealthRepository.getCaregiverAttributes();
    const localPt = HealthRepository.getPatientProfile();
    setCaregiver(localCg);
    setPatient(localPt);

    // If authenticated, hydrate from cloud
    const uid = auth?.currentUser?.uid;
    if (uid) {
      Promise.all([
        getCaregiverAttributesFor(uid).catch(() => null),
        getPatientProfileFor(uid).catch(() => null)
      ]).then(([remoteCg, remotePt]) => {
        if (remoteCg) {
          setCaregiver(remoteCg);
          HealthRepository.saveCaregiverAttributes(remoteCg);
        }
        if (remotePt) {
          setPatient(remotePt);
          HealthRepository.savePatientProfile(remotePt);
        }
      });
    }
  }, []);

  // Derived, never stored. Every edit handler previously had to remember to
  // re-invoke the engine and setEvaluation; a handler that forgot silently
  // rendered stale numbers against fresh inputs.
  const evaluation: CareGapEvaluationResult | null = useMemo(
    () => (caregiver && patient ? CareGapEngine.evaluate(caregiver, patient) : null),
    [caregiver, patient]
  );

  const staffingReport = useMemo(
    () => (caregiver && patient && evaluation ? StaffingRecommender.recommend(caregiver, patient, evaluation) : null),
    [caregiver, patient, evaluation]
  );

  if (!caregiver || !patient || !evaluation) return null;

  const handleSave = async () => {
    HealthRepository.saveCaregiverAttributes(caregiver);
    HealthRepository.savePatientProfile(patient);
    // Durably mirrors edits to Firestore so a clinician with an active grant
    // sees the updated profile & care matrix, not just the onboarding snapshot.
    const [ptSync, cgSync] = await Promise.all([
      syncPatientProfile(patient),
      syncCaregiverAttributes(caregiver)
    ]);
    const queued = ptSync.queued || cgSync.queued;
    toast({
      title: queued ? '☁️ Dyad Profile & Care Matrix Saved to Cloud' : 'Dyad Profile Saved',
      description: queued
        ? 'Caregiver capacity, support matrix, and patient metrics updated and backed up.'
        : 'Caregiver capacity and patient dependence metrics updated.',
    });
  };

  const toggleCaregiverHealth = (key: keyof CaregiverAttributes['caregiverHealth']) => {
    setCaregiver({
      ...caregiver,
      caregiverHealth: {
        ...caregiver.caregiverHealth,
        [key]: !caregiver.caregiverHealth[key]
      }
    });
  };

  const toggleKatzAdl = (key: keyof PatientDependenceProfile['katzAdl']) => {
    setPatient({
      ...patient,
      katzAdl: {
        ...patient.katzAdl,
        [key]: !patient.katzAdl[key]
      }
    });
  };

  const toggleLawtonIadl = (key: keyof PatientDependenceProfile['lawtonIadl']) => {
    setPatient({
      ...patient,
      lawtonIadl: {
        ...patient.lawtonIadl,
        [key]: !patient.lawtonIadl[key]
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Profiler Header & Nav */}
      <Card className="border-border bg-card shadow-sm overflow-hidden">
        <CardHeader className="pb-4 border-b border-border/40 bg-muted/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-[10px] font-bold text-primary border-primary/30 uppercase tracking-wider">
                  Clinical Dyad Model v{evaluation.engineVersion || '2.3.0'}
                </Badge>
                <Badge variant={evaluation.netCareGapHours > 2 ? 'destructive' : 'secondary'} className="text-[10px] font-mono">
                  Care Gap: {evaluation.netCareGapHours > 0 ? `+${evaluation.netCareGapHours} hrs deficit` : 'Sustainable'}
                </Badge>
              </div>
              <CardTitle className="text-xl font-bold font-headline">
                Caregiver Dyad Profiler & Care Gap Engine
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                A clinician-reviewed planning model using documented function, caregiver capacity, and available support. It does not replace assessment or clinical judgment.
              </CardDescription>
            </div>

            <Button size="sm" onClick={handleSave} className="gap-1.5 font-bold text-xs shadow-md shrink-0">
              <Save className="w-4 h-4" /> Save Dyad Metrics
            </Button>
          </div>

          {/* Tab Selector */}
          <div className="flex p-1 bg-muted/70 rounded-xl gap-1.5 mt-4 max-w-lg">
            <button
              type="button"
              onClick={() => setActiveTab('gap')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'gap' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              1. Care Gap Analysis
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('caregiver')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'caregiver' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              2. Caregiver Attributes
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('patient')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'patient' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              3. Patient Dependence (ADL)
            </button>
          </div>
        </CardHeader>
      </Card>

      {/* TAB 1: Care Gap Overview & Staffing Recommendation */}
      {activeTab === 'gap' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <EvidenceLevelBadge provenance={CLINICAL_PROVENANCE.careGapHeuristic} />
            <EvidenceLevelBadge provenance={CLINICAL_PROVENANCE.staffingHeuristic} />
            <EvidenceLevelBadge provenance={CLINICAL_PROVENANCE.beersStoppScreen} />
          </div>
          <ClinicalSafetyNote>
            These outputs support a planning conversation. They are not diagnostic, prescribing, or staffing orders until reviewed and accepted by the clinical team.
          </ClinicalSafetyNote>
          {evaluation.dataQuality.completeness !== 'complete' && (
            <Card className="border-amber-500/40 bg-amber-500/5 shadow-xs">
              <CardContent className="p-4 flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-amber-950 dark:text-amber-200">
                    {evaluation.dataQuality.status === 'requires_data_completion'
                      ? 'Complete the missing assessment fields before using staffing options.'
                      : 'Staffing options require clinician review.'}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {[...evaluation.dataQuality.missingFields, ...evaluation.dataQuality.limitations].join(' ')}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-border bg-card shadow-xs">
              <CardContent className="p-4 space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Care Demand Estimate</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-foreground">{evaluation.patientCareDemandHours}</span>
                  <span className="text-xs text-muted-foreground font-semibold">Hours / Day</span>
                </div>
                <p className="text-[11px] text-muted-foreground">Based on {6 - evaluation.katzAdlScore}/6 ADL & {8 - evaluation.lawtonIadlScore}/8 IADL deficits</p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card shadow-xs">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Available Capacity Estimate</span>
                  <div className="flex items-center gap-1">
                    {evaluation.familySupportAbsorbedHours > 0 && (
                      <Badge variant="secondary" className="text-[9px] font-mono">
                        +{evaluation.familySupportAbsorbedHours}h Family
                      </Badge>
                    )}
                    {evaluation.formalSupportAbsorbedHours > 0 && (
                      <Badge variant="secondary" className="text-[9px] font-mono">
                        +{evaluation.formalSupportAbsorbedHours}h Formal
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-foreground">
                    {evaluation.totalAvailableCapacityHours}
                  </span>
                  <span className="text-xs text-muted-foreground font-semibold">Hours / Day</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Primary ({evaluation.caregiverSafeCapacityHours}h)
                  {evaluation.familySupportAbsorbedHours > 0 ? ` + Family (${evaluation.familySupportAbsorbedHours}h)` : ''}
                  {evaluation.formalSupportAbsorbedHours > 0 ? ` + Formal (${evaluation.formalSupportAbsorbedHours}h)` : ''}
                </p>
              </CardContent>
            </Card>

            <Card className={`border shadow-xs ${evaluation.netCareGapHours > 2 ? 'border-rose-500/30 bg-rose-500/5' : 'border-emerald-500/30 bg-emerald-500/5'}`}>
              <CardContent className="p-4 space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Net Care Gap Estimate</span>
                <div className="flex items-baseline gap-2">
                  <span className={`text-3xl font-black ${evaluation.netCareGapHours > 2 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {evaluation.netCareGapHours > 0 ? `+${evaluation.netCareGapHours}` : `${evaluation.netCareGapHours}`}
                  </span>
                  <span className="text-xs text-muted-foreground font-semibold">Hours / Day</span>
                </div>
                <Badge variant={evaluation.careGapSeverity === 'critical_overload' ? 'destructive' : 'outline'} className="text-[10px] font-bold uppercase">
                  {evaluation.careGapSeverity.replace('_', ' ')}
                </Badge>
              </CardContent>
            </Card>

            <Card className="border-border bg-card shadow-xs">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Manual-Handling Risk</span>
                  <Badge
                    variant={evaluation.liftingIndex >= 2.0 ? 'destructive' : evaluation.liftingIndex >= 1.0 ? 'secondary' : 'outline'}
                    className="text-[9px] font-mono capitalize"
                  >
                    {evaluation.caregiverInjuryRiskCategory || 'low'} hazard
                  </Badge>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className={`text-3xl font-black ${evaluation.liftingIndex >= 2.0 ? 'text-rose-600' : evaluation.liftingIndex >= 1.0 ? 'text-amber-600' : 'text-primary'}`}>
                    {typeof evaluation.liftingIndex === 'number' ? evaluation.liftingIndex.toFixed(1) : (evaluation.caregiverInjuryRiskScore / 40).toFixed(1)}
                  </span>
                  <span className="text-xs text-muted-foreground font-semibold">LI flag</span>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Planning estimate: {evaluation.spinalCompressionKN ?? 2.4} kN • {evaluation.nocturnalSleepInterruptions ?? 0} nocturnal wakes
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Diurnal Care Gap Index & Time-Block Matrix */}
          {evaluation.blockGaps && (
            <Card className="border-border bg-card shadow-sm overflow-hidden">
              <CardHeader className="pb-3 bg-muted/20 border-b border-border/40">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <CardTitle className="text-sm font-bold">
                      Diurnal Care Gap Planning Matrix
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-semibold">Diurnal Severity Index:</span>
                    <Badge
                      variant={evaluation.careGapIndex >= 70 ? 'destructive' : evaluation.careGapIndex >= 40 ? 'secondary' : 'outline'}
                      className="font-mono text-xs font-bold"
                    >
                      {evaluation.careGapIndex} / 100
                    </Badge>
                  </div>
                </div>
                <CardDescription className="text-xs text-muted-foreground mt-1">
                  Local model weighting of time-critical deficits. Use to focus clinician/family review on morning, evening, and night bottlenecks.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { id: 'morning_rush', label: 'Morning Rush', time: '07:00 - 10:00', icon: '🌅', crit: '1.3x Weight' },
                    { id: 'afternoon', label: 'Midday / Errands', time: '12:00 - 15:00', icon: '☀️', crit: '0.8x Weight' },
                    { id: 'evening', label: 'Evening Peak', time: '18:00 - 21:00', icon: '🌆', crit: '1.1x Weight' },
                    { id: 'night_watch', label: 'Night Watch', time: '22:00 - 06:00', icon: '🌙', crit: '1.6x Weight' }
                  ].map((block) => {
                    const bg = evaluation.blockGaps[block.id as keyof typeof evaluation.blockGaps];
                    if (!bg) return null;
                    const hasGap = bg.gapHours > 0;
                    return (
                      <div
                        key={block.id}
                        className={`p-3 rounded-xl border flex flex-col justify-between gap-2 transition-all ${
                          hasGap
                            ? 'border-rose-500/30 bg-rose-500/5'
                            : 'border-border bg-muted/20'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-bold flex items-center gap-1.5">
                              <span>{block.icon}</span> {block.label}
                            </span>
                            <Badge variant={hasGap ? 'destructive' : 'outline'} className="text-[9px] font-mono">
                              {hasGap ? `+${bg.gapHours}h Deficit` : 'Covered'}
                            </Badge>
                          </div>
                          <span className="text-[10px] text-muted-foreground font-mono">{block.time} • {block.crit}</span>
                        </div>

                        <div className="space-y-1 pt-2 border-t border-border/40 text-[11px]">
                          <div className="flex justify-between text-muted-foreground">
                            <span>Demand:</span>
                            <span className="font-semibold text-foreground">{bg.demandHours}h</span>
                          </div>
                          <div className="flex justify-between text-muted-foreground">
                            <span>Supply:</span>
                            <span className="font-semibold text-foreground">{bg.supplyHours}h</span>
                          </div>
                        </div>

                        {bg.contributors.length > 0 && (
                          <div className="pt-1 text-[10px] text-muted-foreground flex flex-wrap gap-1">
                            {bg.contributors.map((c, idx) => (
                              <span key={idx} className="bg-background/80 px-1.5 py-0.5 rounded border border-border/40">
                                {c}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Clinical Findings Box */}
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-primary" />
                Review Findings & Manual-Handling Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              {evaluation.clinicalFindings.map((f, i) => (
                <div key={i} className="p-3 rounded-xl bg-muted/40 border border-border/60 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span className="text-muted-foreground leading-relaxed">{f}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Multi-Tier Staffing Recommender Ladder */}
          {staffingReport && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div>
                  <h3 className="text-sm font-bold font-headline uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    Staffing Options for Clinician Review
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Policy {staffingReport.policyVersion} • Acuity-driven skill tier ({staffingReport.acuityAssessment.dominantSkillTier.replace('_', ' ')}) • Diurnal shift matching ({staffingReport.diurnalPattern.primaryDeficitWindow})
                  </p>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono capitalize self-start sm:self-auto">
                  {staffingReport.acuityAssessment.dominantSkillTier} Tier
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {staffingReport.ladder.map((option, idx) => (
                  <Card
                    key={idx}
                    className={`border transition-all flex flex-col justify-between ${
                      option.rung === 'recommended'
                        ? 'border-primary shadow-sm bg-primary/5 ring-1 ring-primary/20'
                        : 'border-border bg-card shadow-xs'
                    }`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <Badge
                          variant={option.rung === 'recommended' ? 'default' : option.rung === 'optimal' ? 'secondary' : 'outline'}
                          className="text-[9px] uppercase font-bold tracking-wider"
                        >
                          {option.rung.replace('_', ' ')}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground font-mono font-semibold">
                          {option.affordabilityFit}
                        </span>
                      </div>
                      <CardTitle className="text-xs font-bold leading-snug">{option.title}</CardTitle>
                      <CardDescription className="text-[11px] text-muted-foreground mt-1">
                        {option.clinicalJustification}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-xs pt-0">
                      <div className="p-2 rounded-lg bg-background/80 border border-border/40 space-y-1 text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Residual Gap:</span>
                          <span className="font-bold text-foreground">
                            {option.simulatedResult.netCareGapHours > 0 ? `+${option.simulatedResult.netCareGapHours}h/day` : '0.0h (Fully Covered)'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Caregiver Lifting Index:</span>
                          <span className="font-semibold text-foreground">
                            {option.simulatedResult.liftingIndex.toFixed(1)} LI
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Burnout Tier:</span>
                          <Badge variant="outline" className="text-[9px] capitalize py-0">
                            {option.simulatedResult.caregiverBurnoutRiskLevel}
                          </Badge>
                        </div>
                      </div>

                      <div className="pt-1 text-[10px] text-muted-foreground">
                        <span className="font-semibold text-foreground">Resolves: </span>
                        {option.resolvedTasks.slice(0, 2).join(', ')}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Targeted Care Gap Recommendations */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold font-headline uppercase tracking-wider text-muted-foreground">
              Suggested Interventions to Bridge the Gap
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {evaluation.prescriptions.map((rx) => (
                <Card key={rx.id} className="border-border bg-card shadow-xs hover:border-primary/40 transition-all">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-sm font-bold">{rx.title}</CardTitle>
                      <Badge variant={rx.urgency === 'urgent' ? 'destructive' : 'secondary'} className="text-[10px] uppercase font-mono">
                        {rx.urgency}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs">
                    <p className="text-muted-foreground leading-relaxed">
                      <strong>Action:</strong> {rx.action}
                    </p>
                    <p className="text-primary font-medium text-[11px] pt-1 border-t border-border/40">
                      <strong>Expected Impact:</strong> {rx.impact}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Caregiver Attributes Form */}
      {activeTab === 'caregiver' && (
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-bold">Caregiver Demographics & Health Profile</CardTitle>
            <CardDescription className="text-xs">
              Socio-economic background and physical health status of the primary caregiver.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-lg border border-border/60 bg-muted/20 p-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Functional Assessment Date</Label>
                <Input
                  type="date"
                  value={patient.assessmentMetadata?.assessedAt?.slice(0, 10) || ''}
                  onChange={(e) => setPatient({
                    ...patient,
                    assessmentMetadata: { ...patient.assessmentMetadata, assessedAt: e.target.value || undefined }
                  })}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Assessment Source</Label>
                <Select
                  value={patient.assessmentMetadata?.source || 'unknown'}
                  onValueChange={(value) => setPatient({
                    ...patient,
                    assessmentMetadata: { ...patient.assessmentMetadata, source: value as NonNullable<PatientDependenceProfile['assessmentMetadata']>['source'] }
                  })}
                >
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clinician_assisted" className="text-xs">Clinician-assisted</SelectItem>
                    <SelectItem value="caregiver_reported" className="text-xs">Caregiver-reported</SelectItem>
                    <SelectItem value="record_review" className="text-xs">Record review</SelectItem>
                    <SelectItem value="unknown" className="text-xs">Not recorded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="grid grid-cols-2 gap-2 col-span-1">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Caregiver First Name</Label>
                  <Input
                    value={caregiverFirstName}
                    onChange={(e) => handleCaregiverFirstNameChange(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Caregiver Last Name</Label>
                  <Input
                    value={caregiverLastName}
                    onChange={(e) => handleCaregiverLastNameChange(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Age (Years)</Label>
                <Input
                  type="number"
                  value={caregiver.age}
                  onChange={(e) => setCaregiver({ ...caregiver, age: parseInt(e.target.value) || 0 })}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Relationship / Kinship</Label>
                <Select
                  value={caregiver.kinship}
                  onValueChange={(v: any) => setCaregiver({ ...caregiver, kinship: v })}
                >
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="spouse" className="text-xs">Spouse (Senior Dyad)</SelectItem>
                    <SelectItem value="son" className="text-xs">Son</SelectItem>
                    <SelectItem value="daughter" className="text-xs">Daughter</SelectItem>
                    <SelectItem value="daughter_in_law" className="text-xs">Daughter-in-law</SelectItem>
                    <SelectItem value="sibling" className="text-xs">Sibling</SelectItem>
                    <SelectItem value="paid_attendant" className="text-xs">Paid Attendant / Nurse</SelectItem>
                    <SelectItem value="other" className="text-xs">Other Relative</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Employment Status</Label>
                <Select
                  value={caregiver.employment}
                  onValueChange={(v: any) => setCaregiver({ ...caregiver, employment: v })}
                >
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_time" className="text-xs">Full-Time Job (40+ hrs/wk)</SelectItem>
                    <SelectItem value="part_time" className="text-xs">Part-Time Job</SelectItem>
                    <SelectItem value="homemaker" className="text-xs">Homemaker</SelectItem>
                    <SelectItem value="retired" className="text-xs">Retired Senior</SelectItem>
                    <SelectItem value="unemployed" className="text-xs">Full-Time Family Carer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Educational Background</Label>
                <Select
                  value={caregiver.education}
                  onValueChange={(v: any) => setCaregiver({ ...caregiver, education: v })}
                >
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="primary" className="text-xs">Primary Schooling</SelectItem>
                    <SelectItem value="secondary" className="text-xs">Secondary / High School</SelectItem>
                    <SelectItem value="graduate" className="text-xs">Graduate Degree</SelectItem>
                    <SelectItem value="post_graduate" className="text-xs">Post-Graduate / Professional</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Daily Care Hours Available</Label>
                <Input
                  type="number"
                  value={caregiver.dailyHoursCommitted}
                  onChange={(e) => setCaregiver({ ...caregiver, dailyHoursCommitted: parseFloat(e.target.value) || 0 })}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {/* Caregiver Physical Health Checkboxes */}
            <div className="space-y-2 pt-2 border-t border-border/60">
              <Label className="text-xs font-semibold">Caregiver Health Constraints (Reduces Safe Physical Lifting Limit)</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                {[
                  { key: 'hasBackPain', label: 'Chronic Back Pain / Sciatica' },
                  { key: 'hasHypertension', label: 'Hypertension' },
                  { key: 'hasArthritis', label: 'Joint Pain / Arthritis' },
                  { key: 'hasDiabetes', label: 'Diabetes' },
                  { key: 'hasInsomnia', label: 'Chronic Sleep Deficit / Insomnia' },
                ].map((item) => {
                  const isChecked = caregiver.caregiverHealth[item.key as keyof typeof caregiver.caregiverHealth];
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => toggleCaregiverHealth(item.key as any)}
                      className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                        isChecked
                          ? 'border-rose-500/60 bg-rose-500/10 text-rose-800 dark:text-rose-300 font-bold'
                          : 'border-border bg-muted/30 text-muted-foreground hover:border-primary/40'
                      }`}
                    >
                      <span className="text-xs">{item.label}</span>
                      <div className={`w-4 h-4 rounded-md border flex items-center justify-center ${isChecked ? 'bg-rose-600 text-white border-rose-600' : 'border-border'}`}>
                        {isChecked && <CheckCircle2 className="w-3 h-3" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Formal & Ancillary Care Support Infrastructure */}
            <div className="space-y-3 pt-4 border-t border-border/60">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" /> Formal Care Support Infrastructure
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Customize if the family employs a paid attendant (12h/24h), private nurse, or shares tasks across family members.
                  </p>
                </div>
                <Badge variant={caregiver.formalSupport?.type !== 'none' ? 'default' : 'outline'} className="text-[10px] font-mono">
                  {caregiver.formalSupport?.type !== 'none' ? 'Support Active' : 'Solo Caregiver'}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs font-semibold">Caregiver Team & Medical Support</Label>
                  <p className="text-[11px] text-muted-foreground">
                    Select every nurse, attendant, physio aide, and family member assisting.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {FORMAL_SUPPORT_OPTIONS.map((opt) => {
                      const currentTypes = resolveSupportTypes(caregiver.formalSupport);
                      const isSelected =
                        opt.id === 'none' ? currentTypes.length === 0 : currentTypes.includes(opt.id);

                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() =>
                            setCaregiver({
                              ...caregiver,
                              formalSupport: buildFormalSupport(toggleSupportType(currentTypes, opt.id))
                            })
                          }
                          className={cn(
                            'p-2.5 rounded-lg border text-left transition-all',
                            isSelected
                              ? opt.isMedical
                                ? 'border-emerald-500/80 bg-emerald-500/10 font-bold'
                                : 'border-primary bg-primary/10 font-bold'
                              : 'border-border/70 hover:border-primary/40 bg-card'
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              readOnly
                              className="rounded text-primary pointer-events-none"
                            />
                            <span className="text-[11px] font-bold">{opt.title}</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground leading-snug pl-5 mt-0.5">
                            {opt.desc}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Capabilities are derived from who is on the team, not toggled
                    by hand — a family rotation cannot declare itself to be
                    handling transfers and suppress the lumbar-risk guidance. */}
                {resolveSupportTypes(caregiver.formalSupport).length > 0 && (
                  <div className="space-y-1.5 text-xs pt-1 sm:col-span-2">
                    <Label className="text-[11px] font-semibold text-muted-foreground block">
                      Derived Support Capabilities
                    </Label>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge
                        variant={caregiver.formalSupport?.handlesHeavyTransfers ? 'default' : 'outline'}
                        className="text-[10px]"
                      >
                        {caregiver.formalSupport?.handlesHeavyTransfers
                          ? 'Staff performs heavy transfers'
                          : 'Family performs heavy transfers'}
                      </Badge>
                      <Badge
                        variant={caregiver.formalSupport?.handlesMedicationWoundCare ? 'default' : 'outline'}
                        className="text-[10px]"
                      >
                        {caregiver.formalSupport?.handlesMedicationWoundCare
                          ? 'Staff handles medication / wound care'
                          : 'Family handles medication / wound care'}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 3: Patient Functional Dependence (Katz ADL & Lawton IADL) */}
      {activeTab === 'patient' && (
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold">Katz ADL & Lawton IADL Functional Dependence</CardTitle>
                <CardDescription className="text-xs">
                  Tick each item where the patient is <strong>independent</strong>. Unchecked items indicate direct care deficit.
                </CardDescription>
              </div>
              <Badge variant="outline" className="font-mono text-xs">
                Katz Score: {evaluation.katzAdlScore}/6
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Katz ADL 6-item Grid */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-primary uppercase tracking-wider">
                1. Katz Activities of Daily Living (ADLs) — Physical Survival
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[
                  { key: 'bathing', label: 'Bathing & Sponge Washing', desc: 'Can bathe without assistance' },
                  { key: 'dressing', label: 'Dressing & Buttons', desc: 'Picks clothes and dresses self' },
                  { key: 'toileting', label: 'Toileting & Commode', desc: 'Gets to toilet, cleans, arranages clothes' },
                  { key: 'transferring', label: 'Transfer (Bed to Chair)', desc: 'Moves in/out of bed independently' },
                  { key: 'continence', label: 'Bowel / Bladder Continence', desc: 'Full control of sphincter' },
                  { key: 'feeding', label: 'Feeding & Swallowing', desc: 'Gets food from plate to mouth' },
                ].map((adl) => {
                  const isIndep = patient.katzAdl[adl.key as keyof typeof patient.katzAdl];
                  return (
                    <button
                      key={adl.key}
                      type="button"
                      onClick={() => toggleKatzAdl(adl.key as any)}
                      className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                        isIndep
                          ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-900 dark:text-emerald-300 font-bold'
                          : 'border-rose-500/40 bg-rose-500/5 text-rose-900 dark:text-rose-300'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="text-xs font-bold">{adl.label}</span>
                        <Badge variant={isIndep ? 'default' : 'destructive'} className="text-[9px] font-mono uppercase">
                          {isIndep ? 'Independent' : 'Dependent (Care Gap)'}
                        </Badge>
                      </div>
                      <span className="text-[11px] text-muted-foreground">{adl.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Lawton-Brody IADL 8-item Standard Grid */}
            <div className="space-y-2 pt-2 border-t border-border/60">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-primary uppercase tracking-wider">
                  2. Lawton-Brody Instrumental ADLs (IADLs) — 8-Item Standard
                </Label>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {evaluation.lawtonIadlScore}/8 Independent
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { key: 'telephone', label: 'Telephone & Phone Use' },
                  { key: 'shopping', label: 'Provisions & Shopping' },
                  { key: 'mealPreparation', label: 'Cooking & Meals' },
                  { key: 'housekeeping', label: 'Housekeeping' },
                  { key: 'laundry', label: 'Personal Laundry' },
                  { key: 'transportation', label: 'Travel & Transport' },
                  { key: 'medicationManagement', label: 'Medication Admin' },
                  { key: 'finances', label: 'Finances & Money' },
                ].map((iadl) => {
                  const isIndep = !!patient.lawtonIadl[iadl.key as keyof typeof patient.lawtonIadl];
                  return (
                    <button
                      key={iadl.key}
                      type="button"
                      onClick={() => toggleLawtonIadl(iadl.key as any)}
                      className={`p-2.5 rounded-xl border text-left flex flex-col justify-between gap-1.5 transition-all ${
                        isIndep
                          ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-900 dark:text-emerald-300 font-bold'
                          : 'border-border bg-muted/30 text-muted-foreground'
                      }`}
                    >
                      <span className="text-xs leading-snug">{iadl.label}</span>
                      <Badge variant={isIndep ? 'outline' : 'secondary'} className="text-[9px] self-start">
                        {isIndep ? 'Independent' : 'Needs Help'}
                      </Badge>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cognitive & Behavioral Load */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border/60">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Cognitive & Behavioral Pattern</Label>
                <Select
                  value={patient.cognitiveBehavioralLoad}
                  onValueChange={(v: any) => {
                    const updated = { ...patient, cognitiveBehavioralLoad: v };
                    setPatient(updated);
                  }}
                >
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" className="text-xs">Intact Cognition</SelectItem>
                    <SelectItem value="mild_forgetfulness" className="text-xs">Mild Forgetfulness / Early MCI</SelectItem>
                    <SelectItem value="wandering_agitation" className="text-xs">Agitation, Wandering & Repetitive Queries (+2.5 hrs/day)</SelectItem>
                    <SelectItem value="severe_sundowning" className="text-xs">Severe Nocturnal Sundowning (+4.0 hrs/day)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Falls in Last 6 Months</Label>
                <Input
                  type="number"
                  value={patient.fallHistoryLast6Months}
                  onChange={(e) => {
                    const updated = { ...patient, fallHistoryLast6Months: parseInt(e.target.value) || 0 };
                    setPatient(updated);
                  }}
                  className="h-9 text-xs"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
