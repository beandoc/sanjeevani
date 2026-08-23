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
  Heart,
  User
} from 'lucide-react';
import { useProfile, Role } from '@/context/role-context';
import { HealthRepository } from '@/lib/db/health-repository';
import {
  CareGapEngine,
  DEFAULT_CAREGIVER_ATTRIBUTES,
  DEFAULT_PATIENT_PROFILE,
  CaregiverAttributes,
  PatientDependenceProfile,
  FormalSupportType
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
  const [patient, setPatient] = useState<PatientDependenceProfile>(() => {
    if (typeof window === 'undefined') return DEFAULT_PATIENT_PROFILE;
    return HealthRepository.getPatientProfile() || DEFAULT_PATIENT_PROFILE;
  });
  const [caregiver, setCaregiver] = useState<CaregiverAttributes>(() => {
    if (typeof window === 'undefined') return DEFAULT_CAREGIVER_ATTRIBUTES;
    return HealthRepository.getCaregiverAttributes() || DEFAULT_CAREGIVER_ATTRIBUTES;
  });

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
              {/* Section 1: Caregiver Identity & Relationship */}
              <div className="space-y-3">
                <Label className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Caregiver Identity & Family Relationship
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                    <Label className="text-xs font-semibold">Relationship to Patient</Label>
                    <Select
                      value={caregiver.kinship}
                      onValueChange={(v: any) => setCaregiver({ ...caregiver, kinship: v })}
                    >
                      <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="spouse" className="text-xs">Spouse / Partner</SelectItem>
                        <SelectItem value="son" className="text-xs">Son</SelectItem>
                        <SelectItem value="daughter" className="text-xs">Daughter</SelectItem>
                        <SelectItem value="daughter_in_law" className="text-xs">Daughter-in-Law</SelectItem>
                        <SelectItem value="grandchild" className="text-xs">Grandchild</SelectItem>
                        <SelectItem value="sibling" className="text-xs">Sibling</SelectItem>
                        <SelectItem value="paid_attendant" className="text-xs">Primary Paid Attendant</SelectItem>
                        <SelectItem value="other" className="text-xs">Other Relative</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Co-Residence Arrangement</Label>
                    <Select
                      value={caregiver.coResidence}
                      onValueChange={(v: any) => setCaregiver({ ...caregiver, coResidence: v })}
                    >
                      <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lives_together" className="text-xs">Lives Together in Same Household</SelectItem>
                        <SelectItem value="nearby" className="text-xs">Lives Nearby (&lt; 5 km)</SelectItem>
                        <SelectItem value="long_distance" className="text-xs">Different City / Long Distance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Education Level</Label>
                    <Select
                      value={caregiver.education}
                      onValueChange={(v: any) => setCaregiver({ ...caregiver, education: v })}
                    >
                      <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="primary" className="text-xs">Primary Schooling</SelectItem>
                        <SelectItem value="secondary" className="text-xs">Secondary / High School</SelectItem>
                        <SelectItem value="graduate" className="text-xs">College Graduate</SelectItem>
                        <SelectItem value="post_graduate" className="text-xs">Post-Graduate / Professional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Section 2: Functional Capacity & Health Status */}
              <div className="p-4 rounded-2xl bg-muted/20 border border-border/60 space-y-3">
                <Label className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" /> Functional Capacity & Health Constraints
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Employment Commitment</Label>
                    <Select
                      value={caregiver.employment}
                      onValueChange={(v: any) => setCaregiver({ ...caregiver, employment: v })}
                    >
                      <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full_time" className="text-xs">Full-Time Job (40+ hrs/wk)</SelectItem>
                        <SelectItem value="part_time" className="text-xs">Part-Time Employment</SelectItem>
                        <SelectItem value="homemaker" className="text-xs">Homemaker</SelectItem>
                        <SelectItem value="retired" className="text-xs">Retired Senior</SelectItem>
                        <SelectItem value="unemployed" className="text-xs">Full-Time Family Carer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Caregiver Functional Physical Capacity</Label>
                    <Select
                      value={caregiver.functionalCapacity || 'fully_independent'}
                      onValueChange={(v: any) => setCaregiver({ ...caregiver, functionalCapacity: v })}
                    >
                      <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fully_independent" className="text-xs">Fully Independent & Physically Fit</SelectItem>
                        <SelectItem value="mild_frailty" className="text-xs">Mild Physical Limitations / Frailty</SelectItem>
                        <SelectItem value="moderate_limitations" className="text-xs">Moderate Physical Limitations</SelectItem>
                        <SelectItem value="severe_disability" className="text-xs">Severe Physical Disability / Illness</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="pt-2">
                  <Label className="text-[11px] font-semibold text-muted-foreground block mb-1">Caregiver Pre-existing Health Constraints</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'hasBackPain', label: 'Lumbar Strain / Back Pain' },
                      { id: 'hasHypertension', label: 'Hypertension' },
                      { id: 'hasArthritis', label: 'Arthritis / Joint Stiffness' },
                      { id: 'hasInsomnia', label: 'Insomnia / Sleep Strain' }
                    ].map((item) => (
                      <label key={item.id} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-card border border-border/60 text-xs">
                        <input
                          type="checkbox"
                          checked={(caregiver.caregiverHealth as any)[item.id]}
                          onChange={(e) => {
                            setCaregiver({
                              ...caregiver,
                              caregiverHealth: {
                                ...caregiver.caregiverHealth,
                                [item.id]: e.target.checked
                              }
                            });
                          }}
                          className="rounded-sm text-primary"
                        />
                        <span className="text-[11px] font-medium leading-tight">{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Section 3: Family Network & Financial Capacity */}
              <div className="p-4 rounded-2xl bg-muted/20 border border-border/60 space-y-3">
                <Label className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> Family Network & Financial Support Status
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Other Secondary Family Members Assisting</Label>
                    <Select
                      value={String(caregiver.otherFamilyMembersCount ?? 1)}
                      onValueChange={(v: any) => setCaregiver({ ...caregiver, otherFamilyMembersCount: parseInt(v) })}
                    >
                      <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0" className="text-xs">Solo Caregiver (0 Other Family Members)</SelectItem>
                        <SelectItem value="1" className="text-xs">1 Secondary Family Member</SelectItem>
                        <SelectItem value="2" className="text-xs">2 Secondary Family Members</SelectItem>
                        <SelectItem value="3" className="text-xs">3+ Family Member Support Network</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Monthly Financial Burden / Out-of-Pocket Strain</Label>
                    <Select
                      value={caregiver.financialStatus || caregiver.monthlyOutOfPocketBurden}
                      onValueChange={(v: any) =>
                        setCaregiver({ ...caregiver, financialStatus: v, monthlyOutOfPocketBurden: v })
                      }
                    >
                      <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manageable" className="text-xs">Manageable Out-of-Pocket Budget</SelectItem>
                        <SelectItem value="moderate_strain" className="text-xs">Moderate Financial Strain</SelectItem>
                        <SelectItem value="severe_toxicity" className="text-xs">Severe Financial Toxicity / Medical Debt</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Section 4: Multi-Select Formal Support Infrastructure */}
              <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5" /> Caregiver Team & Medical Support Infrastructure
                    </Label>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Multi-select all clinical nurses, attendants, physio aides, and family members assisting.
                    </p>
                  </div>
                  <Badge variant={(caregiver.formalSupport?.types?.length || 0) > 0 ? 'default' : 'outline'} className="text-[10px] font-mono">
                    {(caregiver.formalSupport?.types?.length || 0) > 0
                      ? `${caregiver.formalSupport?.types?.length} Team Members Active`
                      : 'Solo Family'}
                  </Badge>
                </div>

                {/* Multi-Select Options Grid (Medical Help on Top) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {[
                    {
                      id: 'trained_nurse_24h' as FormalSupportType,
                      title: 'Certified Nurse (24h Live-In)',
                      category: 'Medical / Nursing Care',
                      desc: 'IV meds, wound care, catheter, vital monitoring',
                      isMedical: true
                    },
                    {
                      id: 'trained_nurse_12h' as FormalSupportType,
                      title: 'Certified Nurse (12h Shift)',
                      category: 'Medical / Nursing Care',
                      desc: 'Day or night clinical nursing shift',
                      isMedical: true
                    },
                    {
                      id: 'medical_assistant' as FormalSupportType,
                      title: 'Medical Assistant / Physio Aide',
                      category: 'Clinical & Physio Aide',
                      desc: 'Physiotherapy, exercise, vital logging',
                      isMedical: true
                    },
                    {
                      id: 'paid_attendant_24h' as FormalSupportType,
                      title: 'Paid Attendant (24h Live-In)',
                      category: 'Physical Assistance',
                      desc: 'Bathing, turning, feeding, continuous aid',
                      isMedical: false
                    },
                    {
                      id: 'paid_attendant_12h' as FormalSupportType,
                      title: 'Paid Attendant (12h Shift)',
                      category: 'Physical Assistance',
                      desc: 'Daily hygiene, mobility, and turn support',
                      isMedical: false
                    },
                    {
                      id: 'multi_family_rotation' as FormalSupportType,
                      title: 'Multi-Family Member Rotation',
                      category: 'Family Support Network',
                      desc: 'Shared caregiving among siblings & relatives',
                      isMedical: false
                    },
                    {
                      id: 'none' as FormalSupportType,
                      title: 'None (Solo Family Caregiver)',
                      category: 'Solo Family Care',
                      desc: 'Sole family carer managing all care responsibilities',
                      isMedical: false
                    }
                  ].map((opt) => {
                    const currentTypes =
                      caregiver.formalSupport?.types ||
                      (caregiver.formalSupport?.type && caregiver.formalSupport.type !== 'none'
                        ? [caregiver.formalSupport.type]
                        : []);
                    const isSelected = opt.id === 'none' ? currentTypes.length === 0 : currentTypes.includes(opt.id);

                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          let updated: FormalSupportType[] = [...currentTypes];
                          if (opt.id === 'none') {
                            updated = [];
                          } else {
                            if (updated.includes(opt.id)) {
                              updated = updated.filter((t) => t !== opt.id);
                            } else {
                              updated.push(opt.id);
                            }
                          }
                          const primary = updated.length > 0 ? updated[0] : 'none';
                          const hasMedical = updated.some((t) => t.includes('nurse') || t === 'medical_assistant');

                          setCaregiver({
                            ...caregiver,
                            formalSupport: {
                              type: primary,
                              types: updated,
                              hoursPerDay: updated.length * 8,
                              handlesHeavyTransfers: updated.length > 0,
                              handlesMedicationWoundCare: hasMedical
                            }
                          });
                        }}
                        className={cn(
                          'p-3 rounded-xl border text-left transition-all flex flex-col justify-between space-y-1.5',
                          isSelected
                            ? opt.isMedical
                              ? 'border-emerald-500/80 bg-emerald-500/10 text-emerald-950 dark:text-emerald-300 font-bold shadow-xs'
                              : 'border-primary bg-primary/10 text-foreground font-bold shadow-xs'
                            : 'border-border/70 hover:border-primary/40 bg-card'
                        )}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              readOnly
                              className="rounded text-primary pointer-events-none"
                            />
                            <span className="text-xs font-bold">{opt.title}</span>
                          </div>
                          <Badge
                            variant={isSelected ? (opt.isMedical ? 'default' : 'secondary') : 'outline'}
                            className={cn(
                              'text-[9px] font-mono shrink-0',
                              opt.isMedical && 'bg-emerald-600 text-white border-emerald-500/30'
                            )}
                          >
                            {opt.category}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-snug pl-5">{opt.desc}</p>
                      </button>
                    );
                  })}
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
