'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  UserPlus,
  Copy,
  CheckCircle2,
  Phone,
  User,
  HeartPulse,
  Check,
  Send,
  Stethoscope,
  ArrowRight,
  Bed,
  AlertTriangle,
  Users,
  Plus,
  X
} from 'lucide-react';
import {
  createDyadInvite,
  saveCaregiverAttributesFor,
  savePatientProfileFor,
  type DyadInvite
} from '@/lib/firebase/clinical-sync';
import { CaregiverAttributes, DEFAULT_CAREGIVER_ATTRIBUTES, FormalSupportType } from '@/lib/clinical/care-gap-engine';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase/client';
import { invalidateCohortCache } from '@/lib/analytics/cohort';

const DEMO_LOGIN_PASSWORD = 'test1234';

function deriveDemoLoginEmail(fullName: string, roleSuffix: 'caregiver' | 'nurse'): string | null {
  const first = fullName.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, '');
  if (!first) return null;
  return `${first}${roleSuffix}@kutumbh.com`;
}

const COMMON_COMORBIDITIES = [
  'Hypertension',
  'Diabetes T2',
  'Mild Cognitive Impairment',
  'Dementia / Alzheimer’s',
  'Osteoarthritis / Joint Pain',
  'Post-Stroke Rehabilitation',
  'Parkinson’s Disease',
  'COPD / Respiratory',
  'High Fall Risk',
  'Chronic Kidney Disease'
];

export default function RegisterPatientPage() {
  const { toast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [issuedInvite, setIssuedInvite] = useState<DyadInvite | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);

  // Patient Demographic State
  const [patientFirstName, setPatientFirstName] = useState('');
  const [patientLastName, setPatientLastName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientWeight, setPatientWeight] = useState('');
  const [patientHeight, setPatientHeight] = useState('');
  const [conditionsList, setConditionsList] = useState<string[]>(COMMON_COMORBIDITIES);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [customCondition, setCustomCondition] = useState('');

  // Primary Caregiver State
  const [caregiverFirstName, setCaregiverFirstName] = useState('');
  const [caregiverLastName, setCaregiverLastName] = useState('');
  const [caregiverPhone, setCaregiverPhone] = useState('');
  const [caregiverAge, setCaregiverAge] = useState('');
  const [generatedCaregiverEmail, setGeneratedCaregiverEmail] = useState<string | null>(null);

  const [caregiverKinship, setCaregiverKinship] = useState<CaregiverAttributes['kinship']>('spouse');
  const [secondaryFamily, setSecondaryFamily] = useState<number>(0);
  const [formalSupportType, setFormalSupportType] = useState<FormalSupportType>('none');
  const [formalSupportHours, setFormalSupportHours] = useState<string>('0');

  // Baseline Clinical Intake State
  const [isBedBound, setIsBedBound] = useState(false);
  const [fallCount, setFallCount] = useState<number>(0);

  const resetForm = () => {
    setPatientFirstName('');
    setPatientLastName('');
    setPatientAge('');
    setPatientWeight('');
    setPatientHeight('');
    setConditionsList(COMMON_COMORBIDITIES);
    setSelectedConditions([]);
    setCustomCondition('');
    setCaregiverFirstName('');
    setCaregiverLastName('');
    setCaregiverPhone('');
    setCaregiverAge('');
    setGeneratedCaregiverEmail(null);
    setCaregiverKinship('spouse');
    setSecondaryFamily(0);
    setFormalSupportType('none');
    setFormalSupportHours('0');
    setIsBedBound(false);
    setFallCount(0);
    setIssuedInvite(null);
    setCopiedCode(false);
    setCopiedMsg(false);
  };

  const toggleCondition = (condition: string) => {
    if (selectedConditions.includes(condition)) {
      setSelectedConditions(selectedConditions.filter((c) => c !== condition));
    } else {
      setSelectedConditions([...selectedConditions, condition]);
    }
  };

  const handleAddCustomCondition = () => {
    const trimmed = customCondition.trim();
    if (!trimmed) return;

    // Check case-insensitive match against existing conditions
    const existing = conditionsList.find((c) => c.toLowerCase() === trimmed.toLowerCase());
    const conditionToAdd = existing || trimmed;

    if (!conditionsList.includes(conditionToAdd)) {
      setConditionsList((prev) => [...prev, conditionToAdd]);
    }
    if (!selectedConditions.includes(conditionToAdd)) {
      setSelectedConditions((prev) => [...prev, conditionToAdd]);
    }
    setCustomCondition('');
  };

  const removeCustomCondition = (conditionToRemove: string) => {
    setConditionsList((prev) => prev.filter((c) => c !== conditionToRemove));
    setSelectedConditions((prev) => prev.filter((c) => c !== conditionToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const patientName = `${patientFirstName.trim()} ${patientLastName.trim()}`.trim();
    const caregiverName = `${caregiverFirstName.trim()} ${caregiverLastName.trim()}`.trim();

    if (!patientFirstName.trim() || !patientLastName.trim()) {
      toast({
        variant: 'destructive',
        title: 'Patient Name Required',
        description: 'Please enter the patient’s first and last name.'
      });
      return;
    }

    const ageNum = parseInt(patientAge, 10);
    if (patientAge && (isNaN(ageNum) || ageNum < 0 || ageNum > 130)) {
      toast({
        variant: 'destructive',
        title: 'Invalid Age',
        description: 'Please enter a valid age between 0 and 130.'
      });
      return;
    }

    const cleanPhone = caregiverPhone.replace(/\D/g, '');
    const formattedPhone = cleanPhone
      ? cleanPhone.length === 10
        ? `+91${cleanPhone}`
        : cleanPhone.startsWith('91')
        ? `+${cleanPhone}`
        : `+${cleanPhone}`
      : undefined;

    const caregiverEmail = caregiverName.trim() ? deriveDemoLoginEmail(caregiverName, 'caregiver') : null;

    setIsSubmitting(true);
    try {
      if (auth && !auth.currentUser) {
        throw new Error('Sign in with a verified clinician account before registering a patient.');
      }

      const invite = await createDyadInvite({
        patientName: patientName.trim(),
        patientAge: ageNum || 0,
        primaryConditions: selectedConditions,
        caregiverName: caregiverName.trim() || undefined,
        caregiverPhone: formattedPhone,
        caregiverEmail,
        weightKg: patientWeight ? Number(patientWeight) : null,
        heightCm: patientHeight ? Number(patientHeight) : null,
        caregiverKinship
      });

      setGeneratedCaregiverEmail(caregiverEmail);

      const hoursNum = Number(formalSupportHours) || 0;
      const dyadUid = `dyad_${invite.inviteCode}`;
      const caregiverAgeNum = Number(caregiverAge);

      await saveCaregiverAttributesFor(dyadUid, {
        ...DEFAULT_CAREGIVER_ATTRIBUTES,
        name: caregiverName.trim() || 'Primary Caregiver',
        age: caregiverAgeNum > 0 ? caregiverAgeNum : DEFAULT_CAREGIVER_ATTRIBUTES.age,
        kinship: caregiverKinship,
        otherFamilyMembersCount: secondaryFamily,
        formalSupport: {
          type: formalSupportType,
          hoursPerDay: hoursNum,
          handlesHeavyTransfers: formalSupportType !== 'none' && hoursNum > 0,
          handlesMedicationWoundCare: formalSupportType.includes('nurse')
        }
      });

      await savePatientProfileFor(dyadUid, {
        name: patientName.trim(),
        age: ageNum || 0,
        primaryConditions: selectedConditions,
        katzAdl: {
          bathing: false,
          dressing: false,
          toileting: false,
          transferring: false,
          continence: false,
          feeding: false
        },
        lawtonIadl: {
          telephone: false,
          shopping: false,
          mealPreparation: false,
          housekeeping: false,
          laundry: false,
          transportation: false,
          medicationManagement: false,
          finances: false
        },
        isFunctionalAssessmentCompleted: false,
        cognitiveBehavioralLoad: selectedConditions.some((c) =>
          c.toLowerCase().includes('dementia') || c.toLowerCase().includes('cognitive')
        )
          ? 'wandering_agitation'
          : 'none',
        fallHistoryLast6Months: Number(fallCount) || 0,
        isBedBound,
        weightKg: patientWeight ? Number(patientWeight) : undefined,
        heightCm: patientHeight ? Number(patientHeight) : undefined
      });

      invalidateCohortCache();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('sanjeevani:cohort-updated', { detail: { invite } }));
      }
      setIssuedInvite(invite);
      toast({
        title: '✅ Patient & Caregiver Registered',
        description: `${invite.patientName} baseline & dyad profile saved to active cohort roster.`
      });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Could Not Register Patient',
        description: err instanceof Error ? err.message : 'Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyCode = () => {
    if (!issuedInvite) return;
    navigator.clipboard.writeText(issuedInvite.inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
    toast({ title: 'Invite Code Copied', description: `${issuedInvite.inviteCode} copied to clipboard.` });
  };

  const getShareMessage = () => {
    if (!issuedInvite) return '';
    const careName = issuedInvite.caregiverName || 'Caregiver';
    const appUrl = typeof window !== 'undefined' ? `${window.location.origin}/login` : 'https://sanjeevani.health/login';
    return `Namaste ${careName}, Dr. Vivek has registered ${issuedInvite.patientName} on Sanjeevani Geriatric Care.\n\nUse Invite Code: *${issuedInvite.inviteCode}*\nSign in at: ${appUrl} to track health vitals, medication reminders, and tailored geriatric care modules.`;
  };

  const copyShareMessage = () => {
    navigator.clipboard.writeText(getShareMessage());
    setCopiedMsg(true);
    setTimeout(() => setCopiedMsg(false), 2500);
    toast({ title: 'Message Copied', description: 'WhatsApp / SMS onboarding message copied to clipboard.' });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-3 sm:p-6 pb-20">
      {/* Header Bar */}
      <div className="pb-2 border-b border-border/60">
        <div>
          <h1 className="text-xl sm:text-2xl font-black font-headline text-foreground flex items-center gap-2.5">
            <UserPlus className="w-5 h-5 text-primary" />
            <span>Add New Patient & Clinical Dyad</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Register a patient and primary caregiver into your active cohort to begin longitudinal geriatric surveillance.
          </p>
        </div>
      </div>

      {issuedInvite ? (
        /* SUCCESS CONFIRMATION WORKSPACE */
        <Card className="border border-emerald-500/40 bg-gradient-to-br from-emerald-500/[0.05] via-card to-card shadow-lg rounded-2xl overflow-hidden animate-in fade-in duration-300">
          <CardHeader className="p-5 sm:p-6 pb-3 border-b border-emerald-500/20 bg-emerald-500/[0.03]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg font-bold text-foreground">
                  Patient & Caregiver Dyad Successfully Registered!
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Longitudinal geriatric record initialized in cloud cohort database. Share the invite code below to link the caregiver.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-5 sm:p-6 space-y-6">
            {/* Invite Code Box */}
            <div className="p-5 rounded-2xl bg-muted/50 border border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                  Dyad Claim Code (Share with Family Caregiver)
                </span>
                <p className="font-mono text-2xl sm:text-3xl font-black text-foreground tracking-wider select-all">
                  {issuedInvite.inviteCode}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  The family caregiver enters this code during signup to establish the bidirectional clinical dyad.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                <Button
                  onClick={copyCode}
                  className="h-10 text-xs font-bold gap-1.5 rounded-xl bg-primary text-primary-foreground shadow-sm flex-1 sm:flex-none"
                >
                  {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={copyShareMessage}
                  className="h-10 text-xs font-semibold gap-1.5 rounded-xl border-border hover:bg-muted flex-1 sm:flex-none"
                >
                  {copiedMsg ? <Check className="w-4 h-4 text-emerald-600" /> : <Send className="w-4 h-4 text-emerald-600" />}
                  <span>{copiedMsg ? 'Message Copied' : 'Share Text'}</span>
                </Button>
              </div>
            </div>

            {/* Dyad Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-border/60 bg-card space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <User className="w-4 h-4 text-blue-500" />
                  <span>Patient Identity</span>
                </div>
                <div className="space-y-1 text-xs">
                  <p className="font-semibold text-foreground text-sm">{issuedInvite.patientName}</p>
                  <p className="text-muted-foreground">Age: {issuedInvite.patientAge} Years</p>
                  {issuedInvite.primaryConditions?.length > 0 && (
                     <div className="flex flex-wrap gap-1 pt-1">
                      {issuedInvite.primaryConditions.map((cond) => (
                        <Badge key={cond} variant="secondary" className="text-[10px]">
                          {cond}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-xl border border-border/60 bg-card space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <HeartPulse className="w-4 h-4 text-rose-500" />
                  <span>Primary Family Caregiver</span>
                </div>
                <div className="space-y-1 text-xs">
                  <p className="font-semibold text-foreground text-sm">{issuedInvite.caregiverName || 'Primary Family Caregiver'}</p>
                  <p className="text-muted-foreground">Kinship: <strong className="text-foreground capitalize">{issuedInvite.caregiverKinship || caregiverKinship}</strong></p>
                  {issuedInvite.caregiverPhone && (
                    <p className="text-muted-foreground flex items-center gap-1 font-mono text-[11px]">
                      <Phone className="w-3 h-3" /> {issuedInvite.caregiverPhone}
                    </p>
                  )}
                  {generatedCaregiverEmail && (
                    <p className="text-[11px] text-muted-foreground pt-1">
                      Demo Login: <code className="text-foreground font-mono font-semibold">{generatedCaregiverEmail}</code> (pw: <code className="text-foreground font-mono">{DEMO_LOGIN_PASSWORD}</code>)
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Navigation Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-border/60">
              <Button
                variant="outline"
                onClick={resetForm}
                className="text-xs font-semibold h-9 rounded-xl w-full sm:w-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Register Another Patient</span>
              </Button>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <Link href="/clinic/roster" className="w-full sm:w-auto">
                  <Button variant="outline" className="text-xs font-semibold h-9 rounded-xl w-full sm:w-auto">
                    <Users className="w-3.5 h-3.5 text-primary" />
                    <span>View Roster</span>
                  </Button>
                </Link>
                <Link href={`/clinic/dyad/${issuedInvite.dyadUid || `dyad_${issuedInvite.inviteCode}`}`} className="w-full sm:w-auto">
                  <Button className="text-xs font-bold h-9 gap-1.5 rounded-xl bg-primary text-primary-foreground shadow-sm w-full sm:w-auto">
                    <Stethoscope className="w-3.5 h-3.5" />
                    <span>Open Dyad Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* REGISTRATION FORM */
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* SECTION 1: Patient Demographics */}
          <Card className="border-border bg-card shadow-xs rounded-2xl overflow-hidden">
            <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border/50 bg-muted/20">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                <User className="w-4 h-4 text-primary" />
                <span>1. Patient Demographics & Identification</span>
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Enter the care recipient’s primary identification and biometric baseline.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="patientFirstName" className="text-xs font-semibold">
                    Patient First Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="patientFirstName"
                    placeholder="e.g. Ramesh"
                    value={patientFirstName}
                    onChange={(e) => setPatientFirstName(e.target.value)}
                    required
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="patientLastName" className="text-xs font-semibold">
                    Patient Last Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="patientLastName"
                    placeholder="e.g. Sharma"
                    value={patientLastName}
                    onChange={(e) => setPatientLastName(e.target.value)}
                    required
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="patientAge" className="text-xs font-semibold">
                    Age (Years) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="patientAge"
                    type="number"
                    min="1"
                    max="125"
                    placeholder="e.g. 78"
                    value={patientAge}
                    onChange={(e) => setPatientAge(e.target.value)}
                    required
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="patientWeight" className="text-xs font-semibold">
                    Weight (kg) <span className="text-muted-foreground font-normal">(Optional)</span>
                  </Label>
                  <Input
                    id="patientWeight"
                    type="number"
                    step="0.1"
                    placeholder="e.g. 62.5"
                    value={patientWeight}
                    onChange={(e) => setPatientWeight(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="patientHeight" className="text-xs font-semibold">
                    Height (cm) <span className="text-muted-foreground font-normal">(Optional)</span>
                  </Label>
                  <Input
                    id="patientHeight"
                    type="number"
                    placeholder="e.g. 165"
                    value={patientHeight}
                    onChange={(e) => setPatientHeight(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SECTION 2: Clinical Baseline & Mobility Profile */}
          <Card className="border-border bg-card shadow-xs rounded-2xl overflow-hidden">
            <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border/50 bg-muted/20">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                <HeartPulse className="w-4 h-4 text-rose-500" />
                <span>2. Clinical Profile, Conditions & Mobility</span>
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Select known comorbidities and baseline fall risk to configure proactive care flags.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Common Geriatric Comorbidities</Label>
                <div className="flex flex-wrap gap-1.5">
                  {conditionsList.map((condition) => {
                    const isSelected = selectedConditions.includes(condition);
                    const isCustom = !COMMON_COMORBIDITIES.includes(condition);
                    return (
                      <button
                        type="button"
                        key={condition}
                        onClick={() => toggleCondition(condition)}
                        className={cn(
                          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer',
                          isSelected
                            ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                            : 'bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border-border/80'
                        )}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                        <span>{condition}</span>
                        {isCustom && (
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                              e.stopPropagation();
                              removeCustomCondition(condition);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.stopPropagation();
                                e.preventDefault();
                                removeCustomCondition(condition);
                              }
                            }}
                            className="ml-0.5 -mr-1 p-0.5 rounded-full hover:bg-black/20 dark:hover:bg-white/20 text-current opacity-70 hover:opacity-100 transition-opacity"
                            title="Remove condition"
                          >
                            <X className="w-3 h-3" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Condition Add */}
              <div className="flex items-center gap-2 max-w-md pt-1">
                <Input
                  placeholder="Other condition (e.g. Atrial Fibrillation)…"
                  value={customCondition}
                  onChange={(e) => setCustomCondition(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomCondition();
                    }
                  }}
                  className="h-8 text-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddCustomCondition}
                  disabled={!customCondition.trim()}
                  className="h-8 text-xs font-semibold shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  <span>Add</span>
                </Button>
              </div>

              {/* Mobility & Fall Risk */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border/50">
                <div className="p-3.5 rounded-xl border border-border/70 bg-muted/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold flex items-center gap-1.5 text-foreground cursor-pointer">
                      <Bed className="w-4 h-4 text-amber-500" />
                      <span>Bed-Bound Status</span>
                    </Label>
                    <button
                      type="button"
                      onClick={() => setIsBedBound(!isBedBound)}
                      className={cn(
                        'px-3 py-1 rounded-full text-xs font-bold border transition-colors cursor-pointer',
                        isBedBound
                          ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                          : 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
                      )}
                    >
                      {isBedBound ? 'Bed-Bound' : 'Ambulatory'}
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {isBedBound
                      ? 'Enables the 2-hour turn timer and pressure injury prevention schedule on the attendant portal.'
                      : 'Patient can ambulate independently or with mild assistive devices.'}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-border/70 bg-muted/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="fallCount" className="text-xs font-bold flex items-center gap-1.5 text-foreground">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      <span>Fall History (Last 6 Months)</span>
                    </Label>
                    <Input
                      id="fallCount"
                      type="number"
                      min="0"
                      max="20"
                      value={fallCount}
                      onChange={(e) => setFallCount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="w-16 h-7 text-xs font-mono font-bold text-center"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {fallCount > 0
                      ? 'Automatically activates fall precautions and home hazard checklist alerts.'
                      : 'No reported falls in the past six months.'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SECTION 3: Primary Family Caregiver Profile & Support Matrix */}
          <Card className="border-border bg-card shadow-xs rounded-2xl overflow-hidden">
            <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border/50 bg-muted/20">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                <Users className="w-4 h-4 text-blue-500" />
                <span>3. Primary Family Caregiver & Support Matrix</span>
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Document caregiver contact to calculate initial Zarit risk baseline and link to patient.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="caregiverFirstName" className="text-xs font-semibold">
                    Caregiver First Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="caregiverFirstName"
                    placeholder="e.g. Sunita"
                    value={caregiverFirstName}
                    onChange={(e) => setCaregiverFirstName(e.target.value)}
                    required
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="caregiverLastName" className="text-xs font-semibold">
                    Caregiver Last Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="caregiverLastName"
                    placeholder="e.g. Sharma"
                    value={caregiverLastName}
                    onChange={(e) => setCaregiverLastName(e.target.value)}
                    required
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="caregiverPhone" className="text-xs font-semibold">
                    WhatsApp / Phone Number <span className="text-muted-foreground font-normal">(Optional)</span>
                  </Label>
                  <Input
                    id="caregiverPhone"
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={caregiverPhone}
                    onChange={(e) => setCaregiverPhone(e.target.value)}
                    className="h-9 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="caregiverKinship" className="text-xs font-semibold">
                    Kinship / Relation
                  </Label>
                  <select
                    id="caregiverKinship"
                    value={caregiverKinship}
                    onChange={(e) => setCaregiverKinship(e.target.value as CaregiverAttributes['kinship'])}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="spouse">Spouse</option>
                    <option value="child">Son / Daughter</option>
                    <option value="child_in_law">Son/Daughter-in-law</option>
                    <option value="sibling">Sibling</option>
                    <option value="other_relative">Other Relative</option>
                    <option value="friend_neighbor">Friend / Neighbor</option>
                    <option value="formal_caregiver">Formal Attendant</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="caregiverAge" className="text-xs font-semibold">
                    Caregiver Age <span className="text-muted-foreground font-normal">(Years)</span>
                  </Label>
                  <Input
                    id="caregiverAge"
                    type="number"
                    min="18"
                    max="100"
                    placeholder="e.g. 52"
                    value={caregiverAge}
                    onChange={(e) => setCaregiverAge(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <Link href="/clinic/roster" className="w-full sm:w-auto">
              <Button type="button" variant="ghost" className="h-10 text-xs font-semibold w-full sm:w-auto">
                Discard
              </Button>
            </Link>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-10 px-6 text-xs font-bold gap-2 rounded-xl bg-primary text-primary-foreground shadow-sm cursor-pointer w-full sm:w-auto"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                  <span>Registering Dyad…</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Register Patient & Generate Invite</span>
                </>
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
