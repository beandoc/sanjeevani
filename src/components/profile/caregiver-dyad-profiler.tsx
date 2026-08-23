'use client';

import React, { useState, useEffect } from 'react';
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
import { useToast } from '@/hooks/use-toast';

export function CaregiverDyadProfiler() {
  const [caregiver, setCaregiver] = useState<CaregiverAttributes | null>(null);
  const [patient, setPatient] = useState<PatientDependenceProfile | null>(null);
  const [evaluation, setEvaluation] = useState<CareGapEvaluationResult | null>(null);
  const [activeTab, setActiveTab] = useState<'caregiver' | 'patient' | 'gap'>('gap');
  const { toast } = useToast();

  useEffect(() => {
    const loadedCaregiver = HealthRepository.getCaregiverAttributes();
    const loadedPatient = HealthRepository.getPatientProfile();
    setCaregiver(loadedCaregiver);
    setPatient(loadedPatient);
    setEvaluation(CareGapEngine.evaluate(loadedCaregiver, loadedPatient));
  }, []);

  if (!caregiver || !patient || !evaluation) return null;

  const handleSave = () => {
    HealthRepository.saveCaregiverAttributes(caregiver);
    HealthRepository.savePatientProfile(patient);
    const updatedEval = CareGapEngine.evaluate(caregiver, patient);
    setEvaluation(updatedEval);
    toast({
      title: 'Dyad Profile Saved',
      description: 'Caregiver capacity and patient dependence metrics updated.',
    });
  };

  const toggleCaregiverHealth = (key: keyof CaregiverAttributes['caregiverHealth']) => {
    const updatedCaregiver = {
      ...caregiver,
      caregiverHealth: {
        ...caregiver.caregiverHealth,
        [key]: !caregiver.caregiverHealth[key]
      }
    };
    setCaregiver(updatedCaregiver);
    setEvaluation(CareGapEngine.evaluate(updatedCaregiver, patient));
  };

  const toggleKatzAdl = (key: keyof PatientDependenceProfile['katzAdl']) => {
    const updatedPatient = {
      ...patient,
      katzAdl: {
        ...patient.katzAdl,
        [key]: !patient.katzAdl[key]
      }
    };
    setPatient(updatedPatient);
    setEvaluation(CareGapEngine.evaluate(caregiver, updatedPatient));
  };

  const toggleLawtonIadl = (key: keyof PatientDependenceProfile['lawtonIadl']) => {
    const updatedPatient = {
      ...patient,
      lawtonIadl: {
        ...patient.lawtonIadl,
        [key]: !patient.lawtonIadl[key]
      }
    };
    setPatient(updatedPatient);
    setEvaluation(CareGapEngine.evaluate(caregiver, updatedPatient));
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
                  Clinical Dyad Model
                </Badge>
                <Badge variant={evaluation.netCareGapHours > 2 ? 'destructive' : 'secondary'} className="text-[10px] font-mono">
                  Care Gap: {evaluation.netCareGapHours > 0 ? `+${evaluation.netCareGapHours} hrs deficit` : 'Sustainable'}
                </Badge>
              </div>
              <CardTitle className="text-xl font-bold font-headline">
                Caregiver Dyad Profiler & Care Gap Engine
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Quantifies patient care demands (Katz ADL / IADL) vs caregiver safe physical capacity (Age, Health, Employment).
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

      {/* TAB 1: Care Gap & Deficit Analysis */}
      {activeTab === 'gap' && (
        <div className="space-y-6">
          {/* Main KPI Gauges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-border bg-card shadow-xs">
              <CardContent className="p-4 space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Patient Care Demand</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-foreground">{evaluation.patientCareDemandHours}</span>
                  <span className="text-xs text-muted-foreground font-semibold">Hours / Day</span>
                </div>
                <p className="text-[11px] text-muted-foreground">Based on {6 - evaluation.katzAdlScore} ADL & {5 - evaluation.lawtonIadlScore} IADL deficits</p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card shadow-xs">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Available Capacity</span>
                  {evaluation.formalSupportAbsorbedHours > 0 && (
                    <Badge variant="secondary" className="text-[9px] font-mono">
                      +{evaluation.formalSupportAbsorbedHours}h Formal
                    </Badge>
                  )}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-foreground">
                    {evaluation.caregiverSafeCapacityHours + evaluation.formalSupportAbsorbedHours}
                  </span>
                  <span className="text-xs text-muted-foreground font-semibold">Hours / Day</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Family ({evaluation.caregiverSafeCapacityHours}h) + Formal ({evaluation.formalSupportAbsorbedHours}h)
                </p>
              </CardContent>
            </Card>

            <Card className={`border shadow-xs ${evaluation.netCareGapHours > 2 ? 'border-rose-500/30 bg-rose-500/5' : 'border-emerald-500/30 bg-emerald-500/5'}`}>
              <CardContent className="p-4 space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Net Care Gap (Deficit)</span>
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
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Caregiver Injury Risk</span>
                <div className="flex items-baseline gap-2">
                  <span className={`text-3xl font-black ${evaluation.caregiverInjuryRiskScore >= 60 ? 'text-rose-600' : 'text-primary'}`}>
                    {evaluation.caregiverInjuryRiskScore}%
                  </span>
                  <span className="text-xs text-muted-foreground font-semibold">Lumbar Strain</span>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono capitalize">
                  {evaluation.caregiverBurnoutRiskLevel} Risk Level
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* Clinical Findings Box */}
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-primary" />
                Clinical Findings & Biomechanical Analysis
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

          {/* Targeted Care Gap Prescriptions */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold font-headline uppercase tracking-wider text-muted-foreground">
              Prescribed Interventions to Bridge the Gap
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
                      <strong>Clinical Impact:</strong> {rx.impact}
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Caregiver Name</Label>
                <Input
                  value={caregiver.name}
                  onChange={(e) => setCaregiver({ ...caregiver, name: e.target.value })}
                  className="h-9 text-xs"
                />
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
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Formal Care Setup Type</Label>
                  <Select
                    value={caregiver.formalSupport?.type || 'none'}
                    onValueChange={(v: any) => {
                      const updated = {
                        ...caregiver,
                        formalSupport: {
                          type: v,
                          hoursPerDay: v === 'paid_attendant_24h' || v === 'trained_nurse_24h' ? 24 : v === 'paid_attendant_12h' || v === 'trained_nurse_12h' ? 12 : v === 'medical_assistant' ? 6 : 0,
                          handlesHeavyTransfers: v !== 'none',
                          handlesMedicationWoundCare: v.includes('nurse') || v === 'medical_assistant'
                        }
                      };
                      setCaregiver(updated);
                      setEvaluation(CareGapEngine.evaluate(updated, patient));
                    }}
                  >
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" className="text-xs">None (Solo Family Caregiver)</SelectItem>
                      <SelectItem value="paid_attendant_12h" className="text-xs">Paid General Attendant (12 Hours Day/Night)</SelectItem>
                      <SelectItem value="paid_attendant_24h" className="text-xs">Paid General Attendant (24 Hours Live-In)</SelectItem>
                      <SelectItem value="trained_nurse_12h" className="text-xs">Certified Geriatric Nurse (12 Hours)</SelectItem>
                      <SelectItem value="trained_nurse_24h" className="text-xs">Certified Geriatric Nurse (24 Hours Live-In)</SelectItem>
                      <SelectItem value="medical_assistant" className="text-xs">Trained Medical Assistant / Physio Aide</SelectItem>
                      <SelectItem value="multi_family_rotation" className="text-xs">Multi-Caregiver Family Rotation (Shared Care Circle)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {caregiver.formalSupport && caregiver.formalSupport.type !== 'none' && (
                  <div className="space-y-2 text-xs pt-1">
                    <Label className="text-[11px] font-semibold text-muted-foreground block">
                      Support Capabilities & Duties
                    </Label>
                    <div className="flex flex-col gap-1.5">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={caregiver.formalSupport.handlesHeavyTransfers}
                          onChange={(e) => {
                            const updated = {
                              ...caregiver,
                              formalSupport: {
                                ...caregiver.formalSupport!,
                                handlesHeavyTransfers: e.target.checked
                              }
                            };
                            setCaregiver(updated);
                            setEvaluation(CareGapEngine.evaluate(updated, patient));
                          }}
                          className="rounded-sm text-primary"
                        />
                        <span className="text-[11px]">Staff handles heavy physical transfers (Reduces family lumbar strain by 70%)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={caregiver.formalSupport.handlesMedicationWoundCare}
                          onChange={(e) => {
                            const updated = {
                              ...caregiver,
                              formalSupport: {
                                ...caregiver.formalSupport!,
                                handlesMedicationWoundCare: e.target.checked
                              }
                            };
                            setCaregiver(updated);
                            setEvaluation(CareGapEngine.evaluate(updated, patient));
                          }}
                          className="rounded-sm text-primary"
                        />
                        <span className="text-[11px]">Staff handles medication dosing, injections, or catheter/wound care</span>
                      </label>
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

            {/* Lawton IADL 5-item Grid */}
            <div className="space-y-2 pt-2 border-t border-border/60">
              <Label className="text-xs font-semibold text-primary uppercase tracking-wider">
                2. Lawton Instrumental ADLs (IADLs) — Home Maintenance
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[
                  { key: 'medicationManagement', label: 'Medication Administration' },
                  { key: 'finances', label: 'Managing Bank / Money' },
                  { key: 'mealPreparation', label: 'Cooking & Meal Preparation' },
                  { key: 'housekeeping', label: 'House Cleaning & Laundry' },
                  { key: 'transportation', label: 'Clinic Transport / Travel' },
                ].map((iadl) => {
                  const isIndep = patient.lawtonIadl[iadl.key as keyof typeof patient.lawtonIadl];
                  return (
                    <button
                      key={iadl.key}
                      type="button"
                      onClick={() => toggleLawtonIadl(iadl.key as any)}
                      className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                        isIndep
                          ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-900 dark:text-emerald-300 font-bold'
                          : 'border-border bg-muted/30 text-muted-foreground'
                      }`}
                    >
                      <span className="text-xs">{iadl.label}</span>
                      <Badge variant={isIndep ? 'outline' : 'secondary'} className="text-[9px]">
                        {isIndep ? 'Self' : 'Caregiver Needed'}
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
                    setEvaluation(CareGapEngine.evaluate(caregiver, updated));
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
                    setEvaluation(CareGapEngine.evaluate(caregiver, updated));
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
