'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
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
  Info,
  Stethoscope,
  ArrowRight,
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

interface RegisterPatientDialogProps {
  /** Called once the invite is created — receives the full invite (including its code). */
  onRegistered?: (invite: DyadInvite) => void;
  /** Custom trigger element. Defaults to a standalone "Register New Patient" button. */
  trigger?: React.ReactNode;
}

/** Shared default password for auto-generated demo logins — see the
 * "Assign a Nurse" section below. Not a real credential-issuance flow yet
 * (that needs its own reset/invite-email system); this exists so a doctor
 * can hand a caregiver/nurse working credentials on the spot at discharge. */
const DEMO_LOGIN_PASSWORD = 'test1234';

/**
 * abhishekcaregiver@kutumbh.com / shilpanurse@kutumbh.com style auto-login.
 * Derived from first name only, so two different patients whose caregivers
 * happen to share a first name would collide on the same generated email —
 * a known limitation for this demo-stage convenience feature, not something
 * actively detected or avoided yet. Whichever invite is claimed first wins;
 * the other stays unclaimed until manually reassigned.
 */
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

/**
 * Doctor-initiated patient registration dialog.
 * Pre-registers a patient and caregiver directly into the clinician's active roster,
 * saves their Care Matrix & clinical baseline, and generates a claimable invite code.
 */
export function RegisterPatientDialog({ onRegistered, trigger }: RegisterPatientDialogProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [issuedInvite, setIssuedInvite] = useState<DyadInvite | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);

  const [patientFirstName, setPatientFirstName] = useState('');
  const [patientLastName, setPatientLastName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientWeight, setPatientWeight] = useState('');
  const [patientHeight, setPatientHeight] = useState('');
  const [conditionsList, setConditionsList] = useState<string[]>(COMMON_COMORBIDITIES);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [customCondition, setCustomCondition] = useState('');
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

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) resetForm();
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

  const handleSubmit = async () => {
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

    // Clean phone number (strip whitespace, symbols)
    const cleanPhone = caregiverPhone.replace(/\D/g, '');
    const formattedPhone = cleanPhone ? (cleanPhone.length === 10 ? `+91${cleanPhone}` : cleanPhone.startsWith('91') ? `+${cleanPhone}` : `+${cleanPhone}`) : undefined;

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

      // Persist the caregiver capacity & formal support matrix
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

      // 1. Update baseline patient profile with registration demographics (functional assessment marked unassessed)
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
      onRegistered?.(invite);
      toast({
        title: '✅ Patient & Caregiver Registered',
        description: `${invite.patientName} baseline & dyad profile saved to Cloud Firestore backend.`
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

  const copyFullMessage = () => {
    const msg = getShareMessage();
    navigator.clipboard.writeText(msg);
    setCopiedMsg(true);
    setTimeout(() => setCopiedMsg(false), 2500);
    toast({ title: 'Invitation Message Copied', description: 'Ready to send via SMS or messaging.' });
  };

  const shareViaWhatsApp = () => {
    if (!issuedInvite) return;
    const msg = encodeURIComponent(getShareMessage());
    const rawPhone = issuedInvite.caregiverPhone?.replace(/\D/g, '') || '';
    const url = rawPhone ? `https://wa.me/${rawPhone}?text=${msg}` : `https://api.whatsapp.com/send?text=${msg}`;
    window.open(url, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" className="gap-1.5 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
            <UserPlus className="w-4 h-4" /> Register New Patient
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="w-[96vw] max-w-[96vw] sm:max-w-2xl md:max-w-3xl max-h-[92vh] sm:max-h-[88vh] p-0 flex flex-col gap-0 rounded-2xl sm:rounded-3xl border border-border/80 shadow-2xl bg-card overflow-hidden">
        {issuedInvite ? (
          /* SUCCESS STATE: Display Confirmation & Caregiver Sharing */
          <div className="flex flex-col h-full max-h-[92vh] sm:max-h-[88vh]">
            <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-border/60 bg-emerald-500/10 shrink-0 pr-12 flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shrink-0">
                <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-lg sm:text-xl font-bold font-headline text-foreground">
                  Patient Saved to Active Roster
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  {issuedInvite.patientName} ({issuedInvite.patientAge > 0 ? `${issuedInvite.patientAge} yrs` : 'Senior'}) and caregiver profile are active in your clinical cohort.
                </DialogDescription>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5 space-y-4">
              {/* Quick Action to open Patient Workspace */}
              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="text-xs">
                  <p className="font-bold text-foreground text-sm">Geriatric Care Dyad Ready</p>
                  <p className="text-muted-foreground text-xs mt-0.5">
                    Begin cognitive, Zarit burden, and ADL assessments immediately.
                  </p>
                </div>
                <Button asChild size="sm" className="text-xs font-bold gap-1.5 bg-primary text-primary-foreground shrink-0 w-full sm:w-auto h-9">
                  <Link href={`/clinic/dyad/${issuedInvite.dyadUid || 'dyad_' + issuedInvite.inviteCode}`} onClick={() => setIsOpen(false)}>
                    <Stethoscope className="w-3.5 h-3.5" />
                    <span>Open Workspace</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </Button>
              </div>

              {/* Caregiver Invite Code Display Box */}
              <div className="p-5 rounded-2xl bg-muted/40 border border-border flex flex-col items-center justify-center text-center space-y-2.5">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Caregiver Access & Auto-Link Code
                </span>
                <button
                  onClick={copyCode}
                  className="group relative flex items-center justify-center gap-3 px-6 py-3 rounded-2xl bg-background border-2 border-primary/40 hover:border-primary shadow-sm hover:shadow transition-all w-full max-w-xs cursor-pointer"
                  title="Click to copy code"
                >
                  <span className="text-2xl sm:text-3xl font-mono font-black tracking-widest text-primary">
                    {issuedInvite.inviteCode}
                  </span>
                  <span className="p-1.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </span>
                </button>
                <p className="text-xs text-muted-foreground pt-0.5">
                  {issuedInvite.caregiverPhone ? (
                    <>
                      Auto-links automatically when caregiver logs in with <strong className="font-mono text-foreground font-semibold">{issuedInvite.caregiverPhone}</strong>
                    </>
                  ) : (
                    'Caregiver enters this code on their login page'
                  )}
                </p>
              </div>

              {/* Auto-Generated Login — hand to the caregiver at discharge */}
              {generatedCaregiverEmail && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 space-y-2.5">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
                    Auto-Generated Login — Share at Discharge
                  </span>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs">
                    <span className="text-muted-foreground">Caregiver ({issuedInvite.caregiverName})</span>
                    <code className="font-mono font-bold text-foreground bg-background/80 px-2.5 py-1 rounded-lg border border-border/60 text-xs">
                      {generatedCaregiverEmail}
                    </code>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs pt-2 border-t border-emerald-500/20">
                    <span className="text-muted-foreground">Default password</span>
                    <code className="font-mono font-bold text-foreground bg-background/80 px-2.5 py-1 rounded-lg border border-border/60 text-xs">
                      {DEMO_LOGIN_PASSWORD}
                    </code>
                  </div>
                </div>
              )}

              {/* Direct Sharing Actions */}
              <div className="space-y-2 pt-1">
                <span className="text-xs font-bold text-foreground block">Share Portal Access with Family:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={shareViaWhatsApp}
                    className="gap-2 text-xs font-semibold h-10 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 w-full"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send via WhatsApp</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={copyFullMessage}
                    className="gap-2 text-xs font-semibold h-10 hover:bg-muted w-full"
                  >
                    {copiedMsg ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-primary" />}
                    <span>{copiedMsg ? 'Message Copied' : 'Copy Invitation Text'}</span>
                  </Button>
                </div>
              </div>
            </div>

            <div className="px-4 py-3 sm:px-6 sm:py-3.5 border-t border-border/70 bg-card/95 backdrop-blur-md flex flex-col-reverse sm:flex-row items-center justify-end gap-2 sm:gap-3 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenChange(false)}
                className="w-full sm:w-auto h-10 sm:h-9 text-xs sm:text-sm font-semibold"
              >
                Close
              </Button>
              <Button
                size="sm"
                onClick={resetForm}
                className="w-full sm:w-auto h-10 sm:h-9 text-xs sm:text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Register Another Patient
              </Button>
            </div>
          </div>
        ) : (
          /* FORM STATE: Input Patient & Caregiver Info */
          <div className="flex flex-col h-full max-h-[92vh] sm:max-h-[88vh]">
            {/* Header */}
            <div className="px-4 py-3.5 sm:px-6 sm:py-4.5 border-b border-border/60 bg-gradient-to-r from-blue-500/10 via-primary/5 to-transparent shrink-0 pr-12">
              <div className="flex items-center gap-3">
                <div className="p-2 sm:p-2.5 rounded-2xl bg-blue-500/15 border border-blue-500/30 text-blue-600 dark:text-blue-400 shrink-0 shadow-inner">
                  <UserPlus className="w-5 h-5 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <DialogTitle className="text-base sm:text-lg md:text-xl font-bold font-headline text-foreground tracking-tight">
                    Register New Patient & Care Dyad
                  </DialogTitle>
                  <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-0.5 line-clamp-1 sm:line-clamp-none">
                    Pre-register a senior patient and primary caregiver directly into your active clinical cohort.
                  </DialogDescription>
                </div>
              </div>

              {/* Step Badges */}
              <div className="flex items-center gap-1.5 pt-2.5 overflow-x-auto no-scrollbar">
                <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25 whitespace-nowrap">
                  1. Patient Details
                </span>
                <span className="text-muted-foreground/40 text-xs">›</span>
                <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 whitespace-nowrap">
                  2. Caregiver Contact & Linkage
                </span>
                <span className="text-muted-foreground/40 text-xs hidden sm:inline">•</span>
                <span className="text-[11px] text-muted-foreground hidden sm:inline">
                  Quick OPD Intake • Functional assessments can be done later
                </span>
              </div>
            </div>

            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5 space-y-4 sm:space-y-5">
              {/* SECTION 1: Patient Details */}
              <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                    <div className="p-1 rounded-md bg-blue-500/10">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <span>1. Patient Profile</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground font-medium">Fields with * are required</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">
                      Patient First Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      placeholder="e.g. Ramesh"
                      value={patientFirstName}
                      onChange={(e) => setPatientFirstName(e.target.value)}
                      className="h-10 sm:h-9 text-xs sm:text-sm"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">
                      Patient Last Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      placeholder="e.g. Verma"
                      value={patientLastName}
                      onChange={(e) => setPatientLastName(e.target.value)}
                      className="h-10 sm:h-9 text-xs sm:text-sm"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">
                      Age (Years)
                    </Label>
                    <Input
                      type="number"
                      placeholder="e.g. 74"
                      value={patientAge}
                      onChange={(e) => setPatientAge(e.target.value)}
                      className="h-10 sm:h-9 text-xs sm:text-sm font-mono"
                      min={0}
                      max={130}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">
                      Weight <span className="text-muted-foreground font-normal">(Optional)</span>
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        placeholder="e.g. 68"
                        value={patientWeight}
                        onChange={(e) => setPatientWeight(e.target.value)}
                        className="h-10 sm:h-9 text-xs sm:text-sm font-mono pr-9"
                        min={0}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none">
                        kg
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">
                      Height <span className="text-muted-foreground font-normal">(Optional)</span>
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        placeholder="e.g. 165"
                        value={patientHeight}
                        onChange={(e) => setPatientHeight(e.target.value)}
                        className="h-10 sm:h-9 text-xs sm:text-sm font-mono pr-9"
                        min={0}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none">
                        cm
                      </span>
                    </div>
                  </div>
                </div>

                {/* Comorbidities Quick Selector */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                      <HeartPulse className="w-3.5 h-3.5 text-rose-500" />
                      <span>Primary Conditions & Clinical Concerns</span>
                    </Label>
                    <span className="text-[11px] text-muted-foreground">Select all that apply</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 sm:gap-2 p-2.5 sm:p-3 bg-muted/30 rounded-xl border border-border/70">
                    {conditionsList.map((c) => {
                      const isSel = selectedConditions.includes(c);
                      const isCustom = !COMMON_COMORBIDITIES.includes(c);
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => toggleCondition(c)}
                          className={cn(
                            "text-xs font-medium px-2.5 sm:px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 touch-manipulation cursor-pointer select-none",
                            isSel
                              ? "bg-primary text-primary-foreground border-primary font-bold shadow-xs scale-[1.02]"
                              : "bg-background hover:bg-muted text-foreground border-border/80 hover:border-border"
                          )}
                        >
                          {isSel ? (
                            <Check className="w-3.5 h-3.5 shrink-0" />
                          ) : (
                            <span className="text-muted-foreground font-bold shrink-0">+</span>
                          )}
                          <span>{c}</span>
                          {isCustom && (
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={(e) => {
                                e.stopPropagation();
                                removeCustomCondition(c);
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

                  {/* Custom condition input */}
                  <div className="flex gap-2 pt-1">
                    <Input
                      placeholder="Or type custom condition (e.g. Glaucoma, Post-CABG)..."
                      value={customCondition}
                      onChange={(e) => setCustomCondition(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomCondition();
                        }
                      }}
                      className="h-10 sm:h-9 text-xs sm:text-sm"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddCustomCondition}
                      disabled={!customCondition.trim()}
                      className="h-10 sm:h-9 px-4 text-xs font-bold shrink-0"
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </div>

              {/* SECTION 2: Caregiver Details & Auto-Link */}
              <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                    <div className="p-1 rounded-md bg-emerald-500/10">
                      <Phone className="w-3.5 h-3.5" />
                    </div>
                    <span>2. Caregiver Contact & Linkage</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-semibold border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10">
                    Optional but recommended
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">Caregiver First Name</Label>
                    <Input
                      placeholder="e.g. Suresh"
                      value={caregiverFirstName}
                      onChange={(e) => setCaregiverFirstName(e.target.value)}
                      className="h-10 sm:h-9 text-xs sm:text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">Caregiver Last Name</Label>
                    <Input
                      placeholder="e.g. Verma"
                      value={caregiverLastName}
                      onChange={(e) => setCaregiverLastName(e.target.value)}
                      className="h-10 sm:h-9 text-xs sm:text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">
                      Relationship to Patient (Kinship)
                    </Label>
                    <select
                      value={caregiverKinship}
                      onChange={(e) => setCaregiverKinship(e.target.value as CaregiverAttributes['kinship'])}
                      className="h-10 sm:h-9 w-full rounded-lg border border-input bg-background px-3 text-xs sm:text-sm font-medium"
                    >
                      <option value="spouse">Spouse (Wife / Husband)</option>
                      <option value="son">Son</option>
                      <option value="daughter">Daughter</option>
                      <option value="daughter_in_law">Daughter-in-law</option>
                      <option value="sibling">Sibling (Brother / Sister)</option>
                      <option value="grandchild">Grandchild</option>
                      <option value="paid_attendant">Paid Attendant / Care Aide</option>
                      <option value="other">Other Relative / Friend</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">
                      Caregiver Age <span className="text-muted-foreground font-normal">(Years)</span>
                    </Label>
                    <Input
                      type="number"
                      min={12}
                      max={110}
                      placeholder="e.g. 52"
                      value={caregiverAge}
                      onChange={(e) => setCaregiverAge(e.target.value)}
                      className="h-10 sm:h-9 text-xs sm:text-sm font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Caregiver Mobile Number</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground font-mono">
                      +91
                    </span>
                    <Input
                      type="tel"
                      maxLength={10}
                      placeholder="9820012345"
                      value={caregiverPhone.replace(/\D/g, '').slice(-10)}
                      onChange={(e) => setCaregiverPhone(e.target.value)}
                      className="pl-12 h-10 sm:h-9 text-xs sm:text-sm font-mono tracking-wider"
                    />
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-500/10 border border-blue-500/25 text-xs text-foreground">
                  <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold text-blue-950 dark:text-blue-200">
                      1-Click Instant Linkage & Mobile Access
                    </p>
                    <p className="text-muted-foreground text-[11px] leading-relaxed">
                      Adding their mobile number enables <strong>seamless 1-click auto-linking</strong> when the caregiver logs in via Mobile OTP.
                      {caregiverFirstName.trim() && (
                        <>
                          {' '}An email login also works instantly:{' '}
                          <code className="font-mono font-bold text-foreground bg-background px-1.5 py-0.5 rounded border border-border/60 text-xs">
                            {deriveDemoLoginEmail(caregiverFirstName, 'caregiver')}
                          </code>
                          , password <code className="font-mono font-bold text-foreground bg-background px-1.5 py-0.5 rounded border border-border/60 text-xs">{DEMO_LOGIN_PASSWORD}</code>.
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Clinical Notice: Subsequent Assessment */}
              <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/70 text-xs text-muted-foreground flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <p className="font-semibold text-foreground">Post-Registration Clinical Intake</p>
                  <p className="text-[11px] leading-relaxed">
                    Mobility status, fall risk, Katz ADL, and attendant shifts are safely defaulted and can be customized anytime from the patient’s Dyad Workspace after registration.
                  </p>
                </div>
              </div>
            </div>

            {/* Sticky Action Footer */}
            <div className="px-4 py-3 sm:px-6 sm:py-3.5 border-t border-border/70 bg-card/95 backdrop-blur-md flex flex-col-reverse sm:flex-row items-center justify-between gap-2 sm:gap-3 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleOpenChange(false)}
                className="w-full sm:w-auto h-10 sm:h-9 text-xs sm:text-sm font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSubmit}
                disabled={isSubmitting || !patientFirstName.trim() || !patientLastName.trim()}
                className="w-full sm:w-auto h-10 sm:h-9 text-xs sm:text-sm font-bold gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    <span>Saving to Roster…</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Save & Register Patient</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
