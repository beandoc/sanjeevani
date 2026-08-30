'use client';

import React, { useState, useEffect } from 'react';
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
  User,
  MapPin
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
import {
  FORMAL_SUPPORT_OPTIONS,
  buildFormalSupport,
  resolveSupportTypes,
  toggleSupportType
} from '@/lib/clinical/formal-support';
import {
  listMyRoster,
  getPatientDisplayName,
  getPatientProfileFor,
  savePatientProfileFor,
  saveCaregiverAttributesFor,
  syncPatientProfile,
  syncCaregiverAttributes,
  claimDyadInvite,
  updateDyadInviteDraft,
  type DyadInvite
} from '@/lib/firebase/clinical-sync';
import { RegisterPatientDialog } from '@/components/clinician/register-patient-dialog';
import { useAuthUser } from '@/hooks/use-auth-user';
import { useToast } from '@/hooks/use-toast';
import { signInOrCreateDemoAccount } from '@/lib/firebase/auth';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const ONBOARDING_DRAFT_KEY = 'kutumbh_onboarding_draft';

export default function OnboardingIntakePage() {
  const router = useRouter();
  const { role, setRole, completeOnboarding } = useProfile();
  const { toast } = useToast();

  const [step, setStep] = useState<number>(() => {
    if (typeof window === 'undefined') return 1;
    try {
      const draft = localStorage.getItem(ONBOARDING_DRAFT_KEY);
      if (draft) return JSON.parse(draft).step || 1;
    } catch {
      // Ignore malformed drafts.
    }
    return 1;
  });
  const [selectedRole, setSelectedRole] = useState<Role>(() => {
    if (role === 'professional' || role === 'doctor') return 'doctor';
    if (role === 'nurse') return 'nurse';
    return 'caregiver';
  });
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);

  useEffect(() => {
    if (role === 'professional' || role === 'doctor') {
      setSelectedRole('doctor');
      if (step === 1 && typeof window !== 'undefined' && !localStorage.getItem(ONBOARDING_DRAFT_KEY)) {
        setStep(2);
      }
    } else if (role === 'nurse') {
      setSelectedRole('nurse');
      if (step === 1 && typeof window !== 'undefined' && !localStorage.getItem(ONBOARDING_DRAFT_KEY)) {
        setStep(2);
      }
    } else {
      setSelectedRole('caregiver');
    }
  }, [role, step]);

  // Working state for Patient & Caregiver
  const [patient, setPatient] = useState<PatientDependenceProfile>(() => {
    if (typeof window === 'undefined') return DEFAULT_PATIENT_PROFILE;
    try {
      const draft = localStorage.getItem(ONBOARDING_DRAFT_KEY);
      if (draft) return JSON.parse(draft).patient || HealthRepository.getPatientProfile() || DEFAULT_PATIENT_PROFILE;
    } catch {
      // Ignore malformed drafts.
    }
    return HealthRepository.getPatientProfile() || DEFAULT_PATIENT_PROFILE;
  });
  const [caregiver, setCaregiver] = useState<CaregiverAttributes>(() => {
    if (typeof window === 'undefined') return DEFAULT_CAREGIVER_ATTRIBUTES;
    try {
      const draft = localStorage.getItem(ONBOARDING_DRAFT_KEY);
      if (draft) return JSON.parse(draft).caregiver || HealthRepository.getCaregiverAttributes() || DEFAULT_CAREGIVER_ATTRIBUTES;
    } catch {
      // Ignore malformed drafts.
    }
    return HealthRepository.getCaregiverAttributes() || DEFAULT_CAREGIVER_ATTRIBUTES;
  });

  const [patientFirstName, setPatientFirstName] = useState('');
  const [patientLastName, setPatientLastName] = useState('');
  const [caregiverFirstName, setCaregiverFirstName] = useState('');
  const [caregiverLastName, setCaregiverLastName] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(
        ONBOARDING_DRAFT_KEY,
        JSON.stringify({ step, selectedRole, patient, caregiver, updatedAt: new Date().toISOString() })
      );
    } catch {
      // Draft persistence is a convenience; don't block the form.
    }
  }, [step, selectedRole, patient, caregiver]);

  // Sync patient name to first/last inputs
  useEffect(() => {
    if (patient.name) {
      const parts = patient.name.trim().split(/\s+/);
      const first = parts[0] || '';
      const last = parts.slice(1).join(' ') || '';
      if (first !== patientFirstName) setPatientFirstName(first);
      if (last !== patientLastName) setPatientLastName(last);
    }
  }, [patient.name]);

  // Sync caregiver name to first/last inputs
  useEffect(() => {
    if (caregiver.name) {
      const parts = caregiver.name.trim().split(/\s+/);
      const first = parts[0] || '';
      const last = parts.slice(1).join(' ') || '';
      if (first !== caregiverFirstName) setCaregiverFirstName(first);
      if (last !== caregiverLastName) setCaregiverLastName(last);
    }
  }, [caregiver.name]);

  const handlePatientFirstNameChange = (val: string) => {
    setPatientFirstName(val);
    setPatient((prev) => ({ ...prev, name: `${val.trim()} ${patientLastName.trim()}`.trim() }));
  };

  const handlePatientLastNameChange = (val: string) => {
    setPatientLastName(val);
    setPatient((prev) => ({ ...prev, name: `${patientFirstName.trim()} ${val.trim()}`.trim() }));
  };

  const handleCaregiverFirstNameChange = (val: string) => {
    setCaregiverFirstName(val);
    setCaregiver((prev) => ({ ...prev, name: `${val.trim()} ${caregiverLastName.trim()}`.trim() }));
  };

  const handleCaregiverLastNameChange = (val: string) => {
    setCaregiverLastName(val);
    setCaregiver((prev) => ({ ...prev, name: `${caregiverFirstName.trim()} ${val.trim()}`.trim() }));
  };

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

  // Doctor persona: Step 2 edits a specific granted patient's ADL profile
  // (synced to Firestore), not the single local profile the caregiver/nurse
  // personas use — a doctor has no local dyad of their own.
  const isDoctorPersona = selectedRole === 'doctor';
  const [doctorPatients, setDoctorPatients] = useState<{ patientUid: string; label: string }[]>([]);
  const [isLoadingRoster, setIsLoadingRoster] = useState(false);
  const [selectedPatientUid, setSelectedPatientUid] = useState<string | null>(null);
  const [isLoadingPatientProfile, setIsLoadingPatientProfile] = useState(false);
  // Set instead of selectedPatientUid when the doctor registers a brand-new
  // patient right here in Step 2 — there's no patientUid yet (the caregiver
  // hasn't signed up), so the ADL data collected below is held on the invite
  // itself (updateDyadInviteDraft) rather than written to a patientProfile doc.
  const [pendingInvite, setPendingInvite] = useState<DyadInvite | null>(null);

  const handlePatientRegistered = (invite: DyadInvite) => {
    setPendingInvite(invite);
    setSelectedPatientUid(null);
    setPatient((prev) => ({
      ...prev,
      name: invite.patientName,
      age: invite.patientAge,
      primaryConditions: invite.primaryConditions.length > 0 ? invite.primaryConditions : prev.primaryConditions
    }));
    if (invite.caregiverName) {
      setCaregiver((prev) => ({
        ...prev,
        name: invite.caregiverName || prev.name
      }));
    }
  };

  useEffect(() => {
    if (!isDoctorPersona) return;
    let cancelled = false;
    setIsLoadingRoster(true);
    listMyRoster()
      .then(async (entries) => {
        const withNames = await Promise.all(
          entries.map(async (e) => ({
            patientUid: e.patientUid,
            label: await getPatientDisplayName(e.patientUid)
          }))
        );
        if (!cancelled) setDoctorPatients(withNames);
      })
      .catch(() => {
        if (!cancelled) setDoctorPatients([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingRoster(false);
      });
    return () => {
      cancelled = true;
    };
    // Re-run if the user switches into doctor persona after the wizard mounted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDoctorPersona]);

  // Caregiver persona: claim a doctor-issued invite code (see
  // RegisterPatientDialog). Links the account to the issuing clinician and
  // seeds the local intake with the doctor's own patient data, so the
  // caregiver doesn't have to retype the name/age/conditions their doctor
  // already recorded.
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [isClaimingInvite, setIsClaimingInvite] = useState(false);
  const [claimedInviteName, setClaimedInviteName] = useState<string | null>(null);
  const { user } = useAuthUser();

  // Phone-number auto-claim (see autoClaimInviteByPhone/verifyCaregiverOtp)
  // already happened silently during sign-in, before this page even mounted
  // — no code was typed. Pick up whatever landed in the caregiver's synced
  // profile so Step 2 shows it pre-filled, same as the manual-code path.
  useEffect(() => {
    if (selectedRole !== 'caregiver' || !user || claimedInviteName) return;
    let cancelled = false;
    getPatientProfileFor(user.uid).then((profile) => {
      if (cancelled || !profile) return;
      setPatient(profile);
      setClaimedInviteName(profile.name || 'Your patient');
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRole, user]);

  const handleClaimInvite = async () => {
    if (!inviteCodeInput.trim()) return;
    setIsClaimingInvite(true);
    try {
      const invite = await claimDyadInvite(inviteCodeInput);
      setPatient((prev) =>
        invite.patientProfileDraft
          ? { ...invite.patientProfileDraft }
          : {
              ...prev,
              name: invite.patientName || prev.name,
              age: invite.patientAge || prev.age,
              primaryConditions:
                invite.primaryConditions.length > 0 ? invite.primaryConditions : prev.primaryConditions
            }
      );
      if (invite.caregiverName) {
        setCaregiver((prev) => ({
          ...prev,
          name: invite.caregiverName || prev.name
        }));
      }
      setClaimedInviteName(invite.patientName);
      toast({
        title: 'Invite Code Claimed',
        description: `Linked to your doctor. ${invite.patientName}'s details have been pre-filled below.`
      });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Could Not Claim Code',
        description: err instanceof Error ? err.message : 'Check the code and try again.'
      });
    } finally {
      setIsClaimingInvite(false);
    }
  };

  const handleSelectPatient = async (patientUid: string) => {
    setPendingInvite(null);
    setSelectedPatientUid(patientUid);
    setIsLoadingPatientProfile(true);
    try {
      const profile = await getPatientProfileFor(patientUid);
      setPatient(profile ?? { ...DEFAULT_PATIENT_PROFILE, name: '', age: 0 });
    } finally {
      setIsLoadingPatientProfile(false);
    }
  };

  const handleFinishOnboarding = async () => {
    if (isDoctorPersona) {
      // No local dyad belongs to the doctor's own account — write only to
      // whichever granted patient was selected, or attach the assessment to
      // a freshly-registered invite so it carries through once claimed.
      // Awaited (previously fire-and-forget with no error handling) so a
      // Firestore failure here — which HealthRepository's local write inside
      // these functions won't experience, but the cloud mirror can — is
      // surfaced to the doctor instead of silently vanishing right before
      // navigating away.
      try {
        if (selectedPatientUid) {
          await Promise.all([
            savePatientProfileFor(selectedPatientUid, patient),
            saveCaregiverAttributesFor(selectedPatientUid, caregiver)
          ]);
        } else if (pendingInvite) {
          await updateDyadInviteDraft(pendingInvite.inviteCode, patient);
        }
      } catch (err) {
        toast({
          variant: 'destructive',
          title: 'Could Not Save Assessment',
          description: err instanceof Error ? err.message : 'Please try again before leaving this page.'
        });
        return;
      }
    } else {
      HealthRepository.savePatientProfile(patient);
      HealthRepository.saveCaregiverAttributes(caregiver);
      await Promise.all([
        syncPatientProfile(patient),
        syncCaregiverAttributes(caregiver)
      ]);
    }
    setRole(selectedRole);
    completeOnboarding();
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ONBOARDING_DRAFT_KEY);
    }

    toast({
      title: 'Patient Setup Complete',
      description: `Your ${selectedRole === 'doctor' ? 'doctor' : selectedRole === 'nurse' ? 'nurse' : 'family care'} view is ready.`
    });

    if (selectedRole === 'doctor') {
      try {
        await signInOrCreateDemoAccount('doctor');
      } catch (err) {
        console.warn('Auto demo sign-in on doctor onboarding finish:', err);
      }
      router.push('/clinic/roster');
    } else {
      router.push('/dashboard');
    }
  };

  const isDoctorMode = role === 'doctor' || role === 'professional';
  const isNurseMode = role === 'nurse';

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
              {step === 1 && '1. Healthcare Role Calibration'}
              {step === 2 && '2. Patient Health Status & Functional ADLs'}
              {step === 3 && '3. Caregiver Profile & Formal Support Setup'}
              {step === 4 && '4. Baseline Care Gap Calibration & Launch'}
            </h1>
          </div>

          {/* Stepper Dots */}
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStep(s)}
                aria-label={`Go to setup step ${s}`}
                aria-current={step === s ? 'step' : undefined}
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
              </button>
            ))}
          </div>
        </div>

        {/* STEP 1: ROLE SELECTION (AUTO-SELECTED FOR DOCTOR / CLINICIAN PORTAL) */}
        {step === 1 && (
          <Card className="border-border shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold font-headline">
                    {isDoctorMode
                      ? 'Doctor / Geriatrician Portal Setup'
                      : isNurseMode
                      ? 'Nurse Shift Mode Intake'
                      : 'Caregiver Portal Setup'}
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    {isDoctorMode
                      ? 'Your Doctor / Geriatrician role has been auto-selected for your clinical workspace.'
                      : isNurseMode
                      ? 'Your Nurse / Attendant role has been auto-selected for clinical shift mode.'
                      : 'Your Family Caregiver role has been auto-selected for your home care workspace.'}
                  </CardDescription>
                </div>
                <Badge variant="default" className="bg-emerald-600 text-white text-[10px] font-mono shrink-0">
                  Auto-Selected
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Doctor Portal View: Dedicated Doctor Card (Family Caregiver & Nurse removed) */}
              {isDoctorMode && !showRoleSwitcher && (
                <div className="p-5 rounded-2xl border-2 border-blue-600 bg-blue-500/5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600">
                        <Stethoscope className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-foreground">Doctor / Geriatrician (Dr. Vivek)</h3>
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">Consulting Physician & Geriatric Specialist</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs text-blue-600 border-blue-500/30 bg-blue-500/10 font-bold">
                      Physician Portal Active
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed pt-1">
                    Your portal is auto-calibrated for clinical decision support: Patient Cohort Risk Roster, Dyad Trajectory Scissors, AGS Beers 2023 Med Safety, and OPD Teleconsultation Briefs.
                  </p>
                </div>
              )}

              {/* Nurse Portal View: Dedicated Nurse Card */}
              {isNurseMode && !showRoleSwitcher && (
                <div className="p-5 rounded-2xl border-2 border-emerald-600 bg-emerald-500/5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600">
                        <UserCheck className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-foreground">Nurse / Attendant (Nurse Sister Anjali)</h3>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Shift Care Attendant & Home Nurse</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-500/30 bg-emerald-500/10 font-bold">
                      Clinical Shift Mode Active
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed pt-1">
                    Your portal is auto-calibrated for bedside shift management: Shift Handoff, eMAR medication log, vital sign recording, and nursing checklists.
                  </p>
                </div>
              )}

              {/* Caregiver Portal or Expanded Role Switcher */}
              {(!isDoctorMode && !isNurseMode) || showRoleSwitcher ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                  {/* Option 1: Family Caregiver */}
                  <button
                    type="button"
                    onClick={() => setSelectedRole('caregiver')}
                    aria-pressed={selectedRole === 'caregiver'}
                    className={cn(
                      'p-4 rounded-2xl border-2 text-left transition-all flex flex-col justify-between space-y-3',
                      selectedRole === 'caregiver'
                        ? 'border-primary bg-primary/5 shadow-sm ring-2 ring-primary/20'
                        : 'border-border/80 hover:border-primary/40 bg-card'
                    )}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="p-2 rounded-xl bg-primary/10 text-primary">
                        <Heart className="w-5 h-5" />
                      </div>
                      {selectedRole === 'caregiver' && <CheckCircle2 className="w-5 h-5 text-primary" />}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-foreground">Family Caregiver</h3>
                      <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
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
                    aria-pressed={selectedRole === 'nurse'}
                    className={cn(
                      'p-4 rounded-2xl border-2 text-left transition-all flex flex-col justify-between space-y-3',
                      selectedRole === 'nurse'
                        ? 'border-emerald-600 bg-emerald-500/5 shadow-sm ring-2 ring-emerald-500/20'
                        : 'border-border/80 hover:border-emerald-500/40 bg-card'
                    )}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                        <UserCheck className="w-5 h-5" />
                      </div>
                      {selectedRole === 'nurse' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-foreground">Nurse / Attendant</h3>
                      <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
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
                    aria-pressed={selectedRole === 'doctor'}
                    className={cn(
                      'p-4 rounded-2xl border-2 text-left transition-all flex flex-col justify-between space-y-3',
                      selectedRole === 'doctor'
                        ? 'border-blue-600 bg-blue-500/5 shadow-sm ring-2 ring-blue-500/20'
                        : 'border-border/80 hover:border-blue-500/40 bg-card'
                    )}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600">
                        <Stethoscope className="w-5 h-5" />
                      </div>
                      {selectedRole === 'doctor' && <CheckCircle2 className="w-5 h-5 text-blue-600" />}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-foreground">Doctor / Geriatrician</h3>
                      <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                        Consulting physicians & specialists. Access Cohort Risk Roster, Dyad Trajectory Scissors, and OPD Briefs.
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[10px] self-start text-blue-600 border-blue-500/30">
                      Physician Portal
                    </Badge>
                  </button>
                </div>
              ) : null}

              {/* Doctor/professional accounts sign in through a dedicated login
                  and have no reason to preview the caregiver/nurse personas —
                  those already have their own separate logins. Only nurse mode
                  keeps the escape hatch. */}
              {!isDoctorMode && isNurseMode && (
                <div className="pt-2 flex justify-start">
                  <button
                    type="button"
                    onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
                    className="text-[11px] text-primary hover:underline font-semibold"
                  >
                    {showRoleSwitcher ? '← Hide persona options' : 'Change persona / View all 3 healthcare roles →'}
                  </button>
                </div>
              )}

              {/* Caregiver persona: claim a doctor-issued invite code. */}
              {selectedRole === 'caregiver' && (
                <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 space-y-2">
                  <Label className="text-xs font-bold text-primary uppercase tracking-wider">
                    Have an Invite Code from Your Doctor?
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    If your doctor pre-registered you, enter the code they shared to link your account and pre-fill
                    your patient&apos;s details.
                  </p>
                  {claimedInviteName ? (
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600">
                      <CheckCircle2 className="w-4 h-4" /> Linked to your doctor — {claimedInviteName}&apos;s details pre-filled below.
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        value={inviteCodeInput}
                        onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
                        placeholder="e.g. 7XK2QNPR"
                        className="h-9 text-sm font-mono tracking-widest"
                        aria-label="Doctor invite code"
                        maxLength={8}
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleClaimInvite}
                        disabled={isClaimingInvite || !inviteCodeInput.trim()}
                        className="text-xs font-bold shrink-0"
                      >
                        {isClaimingInvite ? 'Claiming…' : 'Claim'}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between pt-4 border-t border-border/60">
              <span className="text-[11px] text-muted-foreground self-center font-mono">
                Active: {selectedRole === 'doctor' ? 'Dr. Vivek (Doctor Portal)' : selectedRole === 'nurse' ? 'Nurse Sister Anjali' : 'Suresh Kumar'}
              </span>
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
                {(!isDoctorPersona || selectedPatientUid || pendingInvite) && (
                  <Badge variant="outline" className="font-mono text-xs">
                    Katz ADL: {evaluation.katzAdlScore}/6
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Doctor persona: a doctor has no dyad of their own — pick which
                  granted patient this ADL assessment belongs to. */}
              {isDoctorPersona && (
                <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" /> Select or Register Patient
                    </Label>
                    <RegisterPatientDialog
                      onRegistered={handlePatientRegistered}
                      trigger={
                        <Button type="button" size="sm" variant="outline" className="text-[11px] font-bold shrink-0 h-7 px-2.5">
                          + New Patient
                        </Button>
                      }
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Choose from patients who have granted you clinical access, or register a brand-new one.
                  </p>

                  {pendingInvite ? (
                    <div className="p-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-xs space-y-1">
                      <p className="font-bold text-emerald-700 dark:text-emerald-400">
                        Registering {pendingInvite.patientName} — share code{' '}
                        <span className="font-mono tracking-widest">{pendingInvite.inviteCode}</span> with the caregiver.
                      </p>
                      <p className="text-muted-foreground">
                        The ADL assessment below will be attached to this invite and applied automatically once the
                        caregiver claims it.
                      </p>
                    </div>
                  ) : isLoadingRoster ? (
                    <p className="text-xs text-muted-foreground py-2">Loading your patient roster…</p>
                  ) : doctorPatients.length === 0 ? (
                    <div className="p-3 rounded-xl border border-dashed border-border text-xs text-muted-foreground">
                      No patients have granted you access yet. Register a new one above, or ask a caregiver to share
                      access with your clinician account, then check{' '}
                      <Link href="/clinic/roster" className="text-primary underline font-semibold">
                        your roster
                      </Link>
                      .
                    </div>
                  ) : (
                    <Select
                      value={selectedPatientUid ?? undefined}
                      onValueChange={handleSelectPatient}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Choose a patient…" />
                      </SelectTrigger>
                      <SelectContent>
                        {doctorPatients.map((p) => (
                          <SelectItem key={p.patientUid} value={p.patientUid} className="text-xs">
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {isLoadingPatientProfile && (
                    <p className="text-xs text-muted-foreground">Loading patient profile…</p>
                  )}
                </div>
              )}

              {(!isDoctorPersona || selectedPatientUid || pendingInvite) && (
                <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid grid-cols-2 gap-2 col-span-1">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Patient First Name</Label>
                    <Input
                      value={patientFirstName}
                      onChange={(e) => handlePatientFirstNameChange(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Patient Last Name</Label>
                    <Input
                      value={patientLastName}
                      onChange={(e) => handlePatientLastNameChange(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Age (Years)</Label>
                    <Input
                      type="number"
                      value={patient.age || ''}
                      onChange={(e) => setPatient({ ...patient, age: parseInt(e.target.value) || 0 })}
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Weight (kg)</Label>
                    <Input
                      type="number"
                      value={patient.weightKg || ''}
                      onChange={(e) => setPatient({ ...patient, weightKg: parseInt(e.target.value) || undefined })}
                      placeholder="Optional"
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Height (cm)</Label>
                    <Input
                      type="number"
                      value={patient.heightCm || ''}
                      onChange={(e) => setPatient({ ...patient, heightCm: parseInt(e.target.value) || undefined })}
                      placeholder="Optional"
                      className="h-9 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  Home Nursing Address
                </Label>
                <Input
                  value={patient.homeCareAddress || ''}
                  onChange={(e) => setPatient({ ...patient, homeCareAddress: e.target.value })}
                  placeholder="House / society, locality, city, state"
                  className="h-9 text-xs"
                />
                <p className="text-[11px] text-muted-foreground">
                  Used as the emergency location setpoint for nearby pharmacy, hospital, ambulance, and medical supply searches.
                </p>
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
	                        aria-pressed={isIndep}
	                        aria-label={`${item.label}: ${isIndep ? 'independent' : 'needs help'}`}
	                        className={cn(
                          'p-3 rounded-xl border text-left flex flex-col justify-between transition-all',
                          isIndep
                            ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-900 dark:text-emerald-300 font-bold'
                            : 'border-rose-500/40 bg-rose-500/5 text-rose-900 dark:text-rose-300'
                        )}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <span className="text-xs font-bold">{item.label}</span>
	                          <Badge variant={isIndep ? 'default' : 'destructive'} className="text-xs font-mono">
	                            {isIndep ? 'Independent' : 'Needs help'}
	                          </Badge>
                        </div>
	                        <span className="text-xs text-muted-foreground">{item.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cognitive & Mobility Load */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
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

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Falls in Last 6 Months</Label>
                  <Select
                    value={String(patient.fallHistoryLast6Months || 0)}
                    onValueChange={(v) => setPatient({ ...patient, fallHistoryLast6Months: parseInt(v) || 0 })}
                  >
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0" className="text-xs">0 Falls (No Recent Fall)</SelectItem>
                      <SelectItem value="1" className="text-xs">1 Fall (Mild Fall Risk)</SelectItem>
                      <SelectItem value="2" className="text-xs">2+ Falls (High Risk Repeat Faller)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Primary Clinical Diagnoses / Multimorbidity */}
              <div className="space-y-2 pt-1">
                <Label className="text-xs font-bold text-primary uppercase tracking-wider">
                  Primary Geriatric Diagnoses & Chronic Conditions
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Hypertension',
                    'Type 2 Diabetes',
                    'Post-Stroke Hemiparesis',
                    "Parkinson's Disease",
                    "Alzheimer's / Dementia",
                    'Chronic Kidney Disease',
                    'Coronary Artery Disease',
                    'Osteoarthritis / Knee Pain',
                    'COPD / Asthma'
                  ].map((cond) => {
                    const isSelected = (patient.primaryConditions || []).some(
                      (c) => c.toLowerCase() === cond.toLowerCase()
                    );
                    return (
                      <button
                        key={cond}
                        type="button"
                        onClick={() => {
                          const current = patient.primaryConditions || [];
                          const updated = isSelected
                            ? current.filter((c) => c.toLowerCase() !== cond.toLowerCase())
                            : [...current, cond];
                          setPatient({ ...patient, primaryConditions: updated });
                        }}
                        className={cn(
                          'px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all',
                          isSelected
                            ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                            : 'bg-card text-muted-foreground border-border hover:border-primary/40'
                        )}
                      >
                        {isSelected ? `✓ ${cond}` : `+ ${cond}`}
                      </button>
                    );
                  })}
                </div>
              </div>
                </>
              )}
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
                  {FORMAL_SUPPORT_OPTIONS.map((opt) => {
                    const currentTypes = resolveSupportTypes(caregiver.formalSupport);
                    const isSelected = opt.id === 'none' ? currentTypes.length === 0 : currentTypes.includes(opt.id);

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
              {/* 4 Reconciled KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl border border-border bg-card text-center shadow-xs">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block tracking-wider">Patient Demand</span>
                  <span className="text-2xl font-black font-mono text-foreground">{evaluation.patientCareDemandHours}h</span>
                  <span className="text-[10px] text-muted-foreground block">daily care load</span>
                </div>

                <div className="p-3.5 rounded-2xl border border-border bg-card text-center shadow-xs">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block tracking-wider">Available Capacity</span>
                  <span className="text-2xl font-black font-mono text-emerald-600">{evaluation.totalAvailableCapacityHours}h</span>
                  <span className="text-[10px] text-muted-foreground block">
                    {evaluation.caregiverSafeCapacityHours}h primary + {evaluation.formalSupportAbsorbedHours + evaluation.familySupportAbsorbedHours}h team
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl border border-border bg-card text-center shadow-xs">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block tracking-wider">Net Care Gap</span>
                  <span className={cn('text-2xl font-black font-mono', evaluation.netCareGapHours > 2 ? 'text-rose-600' : 'text-emerald-600')}>
                    {evaluation.netCareGapHours > 0 ? `+${evaluation.netCareGapHours}h` : '0h'}
                  </span>
                  <Badge variant="outline" className="text-[9px] uppercase font-mono mt-0.5">
                    {evaluation.careGapSeverity.replace('_', ' ')}
                  </Badge>
                </div>

                <div className="p-3.5 rounded-2xl border border-border bg-card text-center shadow-xs">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block tracking-wider">Lifting Strain (NIOSH)</span>
                  <span className={cn('text-2xl font-black font-mono', evaluation.liftingIndex > 2.0 ? 'text-rose-600' : evaluation.liftingIndex > 1.0 ? 'text-amber-600' : 'text-emerald-600')}>
                    {evaluation.liftingIndex.toFixed(1)} LI
                  </span>
                  <span className="text-[10px] text-muted-foreground block">{evaluation.caregiverInjuryRiskScore}% injury risk</span>
                </div>
              </div>

              {/* Diurnal Schedule Preview */}
              {evaluation.blockGaps && (
                <div className="p-4 rounded-2xl bg-muted/20 border border-border/60 space-y-2">
                  <Label className="text-[11px] font-bold text-primary uppercase tracking-wider block">
                    Diurnal Block Baseline Schedule (Demand vs Capacity)
                  </Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { key: 'morning_rush', label: 'Morning Rush', time: '07:00-10:00', icon: '🌅' },
                      { key: 'afternoon', label: 'Midday', time: '12:00-15:00', icon: '☀️' },
                      { key: 'evening', label: 'Evening Peak', time: '18:00-21:00', icon: '🌆' },
                      { key: 'night_watch', label: 'Night Watch', time: '22:00-06:00', icon: '🌙' }
                    ].map((b) => {
                      const bg = evaluation.blockGaps[b.key as keyof typeof evaluation.blockGaps];
                      const hasGap = bg && bg.gapHours > 0;
                      return (
                        <div
                          key={b.key}
                          className={cn(
                            'p-2.5 rounded-xl border text-center text-xs space-y-0.5',
                            hasGap
                              ? 'bg-rose-500/5 border-rose-500/30'
                              : 'bg-emerald-500/5 border-emerald-500/30'
                          )}
                        >
                          <div className="flex items-center justify-between text-[11px] font-semibold">
                            <span>{b.icon} {b.label}</span>
                            <span className="font-mono text-[10px]">{b.time}</span>
                          </div>
                          <div className="flex items-center justify-between font-mono text-[11px] pt-1">
                            <span className="text-muted-foreground">Dem: {bg ? bg.demandHours.toFixed(1) : 0}h</span>
                            <span className={cn('font-bold', hasGap ? 'text-rose-600' : 'text-emerald-600')}>
                              {hasGap ? `Gap +${bg.gapHours.toFixed(1)}h` : 'Covered'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

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
