'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  HeartPulse,
  UserCheck,
  Stethoscope,
  Users,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Sparkles,
  Bed,
  Activity,
  Heart
} from 'lucide-react';
import { useProfile, Role } from '@/context/role-context';
import { HealthRepository } from '@/lib/db/health-repository';
import {
  CareGapEngine,
  DEFAULT_CAREGIVER_ATTRIBUTES,
  DEFAULT_PATIENT_PROFILE,
  CaregiverAttributes,
  PatientDependenceProfile
} from '@/lib/clinical/care-gap-engine';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function OnboardingIntakePage() {
  const router = useRouter();
  const { role, setRole, completeOnboarding } = useProfile();
  const { toast } = useToast();

  const [step, setStep] = useState<number>(1);
  const [selectedRole, setSelectedRole] = useState<Role>(role || 'caregiver');

  // Working state for Patient & Caregiver
  const [patient, setPatient] = useState<PatientDependenceProfile>(() => HealthRepository.getPatientProfile() || DEFAULT_PATIENT_PROFILE);
  const [caregiver, setCaregiver] = useState<CaregiverAttributes>(() => HealthRepository.getCaregiverAttributes() || DEFAULT_CAREGIVER_ATTRIBUTES);

  const evaluation = CareGapEngine.evaluate(caregiver, patient);

  const toggleKatzItem = (key: keyof PatientDependenceProfile['katzAdl']) => {
    setPatient((prev) => ({
      ...prev,
      katzAdl: {
        ...prev.katzAdl,
        [key]: !prev.katzAdl[key]
      }
    }));
  };

  const handleFinishOnboarding = () => {
    HealthRepository.savePatientProfile(patient);
    HealthRepository.saveCaregiverAttributes(caregiver);
    setRole(selectedRole);
    completeOnboarding();

    toast({
      title: 'Baseline Intake & Dyad Mapping Complete',
      description: `Your custom ${selectedRole === 'doctor' ? 'Doctor / Geriatrician' : selectedRole === 'nurse' ? 'Trained Nurse / Attendant' : 'Family Caregiver'} Dashboard is ready!`
    });

    if (selectedRole === 'doctor') {
      router.push('/clinic/roster');
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-3xl w-full space-y-6">
        {/* Step Indicator Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/60">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-[10px] font-bold text-primary border-primary/30 uppercase tracking-wider">
                Clinical Onboarding Wizard
              </Badge>
              <span className="text-xs text-muted-foreground font-mono">Step {step} of 4</span>
            </div>
            <h1 className="text-2xl font-bold font-headline">
              {step === 1 && '1. Select Your Healthcare Role'}
              {step === 2 && '2. Patient Health Status & Functional ADLs'}
              {step === 3 && '3. Caregiver Profile & Formal Support Setup'}
              {step === 4 && '4. Baseline Care Gap Calibration & Launch'}
            </h1>
          </div>

          {/* Stepper Dots */}
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={cn(
                  'w-7 h-7 rounded-full text-xs font-bold font-mono flex items-center justify-center transition-all',
                  step === s
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : step > s
                    ? 'bg-emerald-600 text-white'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {step > s ? '✓' : s}
              </div>
            ))}
          </div>
        </div>

        {/* STEP 1: ROLE SELECTION */}
        {step === 1 && (
          <Card className="border-border shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">How will you be using Sanjeevani?</CardTitle>
              <CardDescription className="text-xs">
                Your selected role activates tailored dashboards, workflows, clinical scales, and shift tools.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Option 1: Family Caregiver */}
                <button
                  type="button"
                  onClick={() => setSelectedRole('caregiver')}
                  className={cn(
                    'p-5 rounded-2xl border-2 text-left transition-all flex flex-col justify-between space-y-3',
                    selectedRole === 'caregiver'
                      ? 'border-primary bg-primary/5 shadow-sm ring-2 ring-primary/20'
                      : 'border-border/80 hover:border-primary/40 bg-card'
                  )}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                      <Heart className="w-5 h-5" />
                    </div>
                    {selectedRole === 'caregiver' && <CheckCircle2 className="w-5 h-5 text-primary" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground">Family Caregiver</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Primary family carers (son, daughter, spouse). Access Stress Gauge, Bedside Companion, and medication alerts.
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px] self-start">
                    Family Dashboard
                  </Badge>
                </button>

                {/* Option 2: Nurse / Medical Attendant */}
                <button
                  type="button"
                  onClick={() => setSelectedRole('nurse')}
                  className={cn(
                    'p-5 rounded-2xl border-2 text-left transition-all flex flex-col justify-between space-y-3',
                    selectedRole === 'nurse'
                      ? 'border-emerald-600 bg-emerald-500/5 shadow-sm ring-2 ring-emerald-500/20'
                      : 'border-border/80 hover:border-emerald-500/40 bg-card'
                  )}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    {selectedRole === 'nurse' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground">Nurse / Attendant</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Paid home-care nurses and general attendants. Access Shift Handoff, MAR log, and nursing checklists.
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px] self-start text-emerald-600 border-emerald-500/30">
                    Clinical Shift Mode
                  </Badge>
                </button>

                {/* Option 3: Doctor / Geriatrician */}
                <button
                  type="button"
                  onClick={() => setSelectedRole('doctor')}
                  className={cn(
                    'p-5 rounded-2xl border-2 text-left transition-all flex flex-col justify-between space-y-3',
                    selectedRole === 'doctor'
                      ? 'border-blue-600 bg-blue-500/5 shadow-sm ring-2 ring-blue-500/20'
                      : 'border-border/80 hover:border-blue-500/40 bg-card'
                  )}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    {selectedRole === 'doctor' && <CheckCircle2 className="w-5 h-5 text-blue-600" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground">Doctor / Geriatrician</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Consulting physicians & specialists. Access Cohort Risk Roster, Dyad Trajectory Scissors, and OPD Briefs.
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px] self-start text-blue-600 border-blue-500/30">
                    Physician Portal
                  </Badge>
                </button>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end pt-4 border-t border-border/60">
              <Button onClick={() => setStep(2)} className="gap-1.5 font-bold text-xs">
                <span>Continue to Patient Status</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* STEP 2: PATIENT STATUS & KATZ ADLs */}
        {step === 2 && (
          <Card className="border-border shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Patient Profile & Functional Independence</CardTitle>
                  <CardDescription className="text-xs">
                    Mark which activities of daily living (ADLs) the senior can perform independently.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="font-mono text-xs">
                  Katz ADL: {evaluation.katzAdlScore}/6
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Patient Full Name</Label>
                  <Input
                    value={patient.name}
                    onChange={(e) => setPatient({ ...patient, name: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Age (Years)</Label>
                  <Input
                    type="number"
                    value={patient.age}
                    onChange={(e) => setPatient({ ...patient, age: parseInt(e.target.value) || 0 })}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              {/* Katz 6-Item Assessment */}
              <div className="space-y-2 pt-2">
                <Label className="text-xs font-bold text-primary uppercase tracking-wider">
                  Katz Index of Activities of Daily Living (ADLs)
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {[
                    { key: 'bathing', label: 'Bathing & Shower', desc: 'Can bathe independently' },
                    { key: 'dressing', label: 'Dressing & Buttons', desc: 'Can dress without physical aid' },
                    { key: 'toileting', label: 'Toileting & Commode', desc: 'Can use toilet independently' },
                    { key: 'transferring', label: 'Bed/Chair Transfer', desc: 'Can stand and pivot without help' },
                    { key: 'continence', label: 'Continence Control', desc: 'Full bowel/bladder control' },
                    { key: 'feeding', label: 'Feeding / Eating', desc: 'Can chew and swallow food safely' },
                  ].map((item) => {
                    const isIndep = patient.katzAdl[item.key as keyof typeof patient.katzAdl];
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => toggleKatzItem(item.key as any)}
                        className={cn(
                          'p-3 rounded-xl border text-left flex flex-col justify-between transition-all',
                          isIndep
                            ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-900 dark:text-emerald-300 font-bold'
                            : 'border-rose-500/40 bg-rose-500/5 text-rose-900 dark:text-rose-300'
                        )}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <span className="text-xs font-bold">{item.label}</span>
                          <Badge variant={isIndep ? 'default' : 'destructive'} className="text-[9px] font-mono">
                            {isIndep ? 'Independent' : 'Dependent'}
                          </Badge>
                        </div>
                        <span className="text-[11px] text-muted-foreground">{item.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cognitive & Mobility Load */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Cognitive & Behavioral Status</Label>
                  <Select
                    value={patient.cognitiveBehavioralLoad}
                    onValueChange={(v: any) => setPatient({ ...patient, cognitiveBehavioralLoad: v })}
                  >
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" className="text-xs">No Cognitive Deficit (Alert)</SelectItem>
                      <SelectItem value="mild_forgetfulness" className="text-xs">Mild Forgetfulness / MCI</SelectItem>
                      <SelectItem value="wandering_agitation" className="text-xs">Wandering & Daytime Agitation</SelectItem>
                      <SelectItem value="severe_sundowning" className="text-xs">Severe Sundowning / Night Delirium</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Bed-Bound / Immobility State</Label>
                  <Select
                    value={patient.isBedBound ? 'yes' : 'no'}
                    onValueChange={(v) => setPatient({ ...patient, isBedBound: v === 'yes' })}
                  >
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no" className="text-xs">Mobile / Wheelchair Assisted</SelectItem>
                      <SelectItem value="yes" className="text-xs">Strictly Bed-Bound (Requires Q2H Turns)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between pt-4 border-t border-border/60">
              <Button variant="outline" size="sm" onClick={() => setStep(1)} className="gap-1.5 text-xs">
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
              <Button onClick={() => setStep(3)} className="gap-1.5 font-bold text-xs">
                <span>Continue to Caregiver Setup</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* STEP 3: CAREGIVER & FORMAL SUPPORT */}
        {step === 3 && (
          <Card className="border-border shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Caregiver Capacity & Formal Support Infrastructure</CardTitle>
              <CardDescription className="text-xs">
                Configure primary caregiver attributes and whether a paid attendant (12h/24h) or nurse is deployed.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Primary Caregiver Name</Label>
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
                  <Label className="text-xs font-semibold">Employment Status</Label>
                  <Select
                    value={caregiver.employment}
                    onValueChange={(v: any) => setCaregiver({ ...caregiver, employment: v })}
                  >
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full_time" className="text-xs">Full-Time (40+ hrs/wk)</SelectItem>
                      <SelectItem value="part_time" className="text-xs">Part-Time</SelectItem>
                      <SelectItem value="homemaker" className="text-xs">Homemaker</SelectItem>
                      <SelectItem value="retired" className="text-xs">Retired Senior</SelectItem>
                      <SelectItem value="unemployed" className="text-xs">Full-Time Carer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Formal Support Infrastructure */}
              <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" /> Formal Care Support Configuration
                  </Label>
                  <Badge variant={caregiver.formalSupport?.type !== 'none' ? 'default' : 'outline'} className="text-[10px] font-mono">
                    {caregiver.formalSupport?.type !== 'none' ? 'Support Active' : 'Solo Family'}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Support Staff Type</Label>
                    <Select
                      value={caregiver.formalSupport?.type || 'none'}
                      onValueChange={(v: any) => {
                        setCaregiver({
                          ...caregiver,
                          formalSupport: {
                            type: v,
                            hoursPerDay: v === 'paid_attendant_24h' || v === 'trained_nurse_24h' ? 24 : v === 'paid_attendant_12h' || v === 'trained_nurse_12h' ? 12 : v === 'medical_assistant' ? 6 : 0,
                            handlesHeavyTransfers: v !== 'none',
                            handlesMedicationWoundCare: v.includes('nurse') || v === 'medical_assistant'
                          }
                        });
                      }}
                    >
                      <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none" className="text-xs">None (Solo Family Caregiver)</SelectItem>
                        <SelectItem value="paid_attendant_12h" className="text-xs">Paid Attendant (12 Hours Day/Night)</SelectItem>
                        <SelectItem value="paid_attendant_24h" className="text-xs">Paid Attendant (24 Hours Live-In)</SelectItem>
                        <SelectItem value="trained_nurse_12h" className="text-xs">Certified Nurse (12 Hours)</SelectItem>
                        <SelectItem value="trained_nurse_24h" className="text-xs">Certified Nurse (24 Hours Live-In)</SelectItem>
                        <SelectItem value="medical_assistant" className="text-xs">Trained Medical Assistant / Physio Aide</SelectItem>
                        <SelectItem value="multi_family_rotation" className="text-xs">Multi-Caregiver Family Rotation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1 text-xs">
                    <Label className="text-[11px] font-semibold text-muted-foreground block">Caregiver Health Constraints</Label>
                    <label className="flex items-center gap-2 cursor-pointer mt-1">
                      <input
                        type="checkbox"
                        checked={caregiver.caregiverHealth.hasBackPain}
                        onChange={(e) => {
                          setCaregiver({
                            ...caregiver,
                            caregiverHealth: {
                              ...caregiver.caregiverHealth,
                              hasBackPain: e.target.checked
                            }
                          });
                        }}
                        className="rounded-sm text-primary"
                      />
                      <span className="text-[11px]">Caregiver has pre-existing back pain / lumbar strain</span>
                    </label>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between pt-4 border-t border-border/60">
              <Button variant="outline" size="sm" onClick={() => setStep(2)} className="gap-1.5 text-xs">
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
              <Button onClick={() => setStep(4)} className="gap-1.5 font-bold text-xs">
                <span>View Baseline Care Gap</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* STEP 4: BASELINE CARE GAP CALIBRATION & LAUNCH */}
        {step === 4 && (
          <Card className="border-border shadow-md overflow-hidden">
            <CardHeader className="bg-primary/5 border-b border-border/40 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-[10px] font-bold text-primary border-primary/30 uppercase">
                  Baseline Summary
                </Badge>
              </div>
              <CardTitle className="text-xl font-bold font-headline">
                Dyad Health & Care Gap Calibration
              </CardTitle>
              <CardDescription className="text-xs">
                Review your baseline demand vs capacity scores before entering your customized portal.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* 4 KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl border border-border bg-card text-center">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">Care Demand</span>
                  <span className="text-2xl font-black font-mono text-foreground">{evaluation.patientCareDemandHours}h</span>
                  <span className="text-[10px] text-muted-foreground block">per day</span>
                </div>

                <div className="p-3.5 rounded-xl border border-border bg-card text-center">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">Staff Absorbed</span>
                  <span className="text-2xl font-black font-mono text-emerald-600">{evaluation.formalSupportAbsorbedHours}h</span>
                  <span className="text-[10px] text-muted-foreground block">formal support</span>
                </div>

                <div className="p-3.5 rounded-xl border border-border bg-card text-center">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">Net Care Gap</span>
                  <span className={cn('text-2xl font-black font-mono', evaluation.netCareGapHours > 2 ? 'text-rose-600' : 'text-emerald-600')}>
                    {evaluation.netCareGapHours > 0 ? `+${evaluation.netCareGapHours}h` : '0h'}
                  </span>
                  <span className="text-[10px] text-muted-foreground block">{evaluation.careGapSeverity.replace('_', ' ')}</span>
                </div>

                <div className="p-3.5 rounded-xl border border-border bg-card text-center">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">Lumbar Risk</span>
                  <span className={cn('text-2xl font-black font-mono', evaluation.caregiverInjuryRiskScore >= 60 ? 'text-rose-600' : 'text-primary')}>
                    {evaluation.caregiverInjuryRiskScore}%
                  </span>
                  <span className="text-[10px] text-muted-foreground block">injury score</span>
                </div>
              </div>

              {/* Role Confirmation Banner */}
              <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-foreground">
                      Activating: {selectedRole === 'doctor' ? 'Doctor / Geriatrician Portal' : selectedRole === 'nurse' ? 'Trained Nurse / Medical Assistant Dashboard' : 'Family Caregiver Dashboard'}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      All clinical scales, bedside checklists, and tools are now calibrated for {patient.name}.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between pt-4 border-t border-border/60">
              <Button variant="outline" size="sm" onClick={() => setStep(3)} className="gap-1.5 text-xs">
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
              <Button onClick={handleFinishOnboarding} size="lg" className="gap-2 font-bold text-xs shadow-md">
                <CheckCircle2 className="w-4 h-4" /> Launch My Dashboard
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}
