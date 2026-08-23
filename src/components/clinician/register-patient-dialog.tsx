'use client';

import { useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  UserPlus,
  Copy,
  CheckCircle2,
  Share2,
  Phone,
  User,
  HeartPulse,
  Sparkles,
  Smartphone,
  Check,
  Send,
  Info,
  Users2
} from 'lucide-react';
import { createDyadInvite, saveCaregiverAttributesFor, type DyadInvite } from '@/lib/firebase/clinical-sync';
import { CaregiverAttributes, DEFAULT_CAREGIVER_ATTRIBUTES, FormalSupportType } from '@/lib/clinical/care-gap-engine';
import { useToast } from '@/hooks/use-toast';

interface RegisterPatientDialogProps {
  /** Called once the invite is created — receives the full invite (including its code). */
  onRegistered?: (invite: DyadInvite) => void;
  /** Custom trigger element. Defaults to a standalone "Register New Patient" button. */
  trigger?: React.ReactNode;
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
 * Allows clinicians to pre-register a patient and caregiver, issue an 8-character
 * invite code, and share direct onboarding links via WhatsApp or SMS.
 */
export function RegisterPatientDialog({ onRegistered, trigger }: RegisterPatientDialogProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [issuedInvite, setIssuedInvite] = useState<DyadInvite | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);

  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [customCondition, setCustomCondition] = useState('');
  const [caregiverName, setCaregiverName] = useState('');
  const [caregiverPhone, setCaregiverPhone] = useState('');

  const [caregiverKinship, setCaregiverKinship] = useState<CaregiverAttributes['kinship']>('spouse');
  const [secondaryFamily, setSecondaryFamily] = useState<number>(0);
  const [formalSupportType, setFormalSupportType] = useState<FormalSupportType>('none');
  const [formalSupportHours, setFormalSupportHours] = useState<string>('0');

  const resetForm = () => {
    setPatientName('');
    setPatientAge('');
    setSelectedConditions([]);
    setCustomCondition('');
    setCaregiverName('');
    setCaregiverPhone('');
    setCaregiverKinship('spouse');
    setSecondaryFamily(0);
    setFormalSupportType('none');
    setFormalSupportHours('0');
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
    if (trimmed && !selectedConditions.includes(trimmed)) {
      setSelectedConditions([...selectedConditions, trimmed]);
      setCustomCondition('');
    }
  };

  const handleSubmit = async () => {
    if (!patientName.trim()) {
      toast({
        variant: 'destructive',
        title: 'Patient Name Required',
        description: 'Please enter the patient’s full name or identifier.'
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

    setIsSubmitting(true);
    try {
      const invite = await createDyadInvite({
        patientName: patientName.trim(),
        patientAge: ageNum || 0,
        primaryConditions: selectedConditions,
        caregiverName: caregiverName.trim() || undefined,
        caregiverPhone: formattedPhone
      });

      // Persist the caregiver capacity & formal support matrix
      const hoursNum = Number(formalSupportHours) || 0;
      await saveCaregiverAttributesFor(`dyad_${invite.inviteCode}`, {
        ...DEFAULT_CAREGIVER_ATTRIBUTES,
        name: caregiverName.trim() || 'Primary Caregiver',
        kinship: caregiverKinship,
        otherFamilyMembersCount: secondaryFamily,
        formalSupport: {
          type: formalSupportType,
          hoursPerDay: hoursNum,
          handlesHeavyTransfers: formalSupportType !== 'none' && hoursNum > 0,
          handlesMedicationWoundCare: formalSupportType.includes('nurse')
        }
      });

      setIssuedInvite(invite);
      onRegistered?.(invite);
      toast({
        title: '✅ Patient & Support Matrix Registered',
        description: `Invite code ${invite.inviteCode} generated for ${invite.patientName}.`
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
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        {issuedInvite ? (
          /* SUCCESS STATE: Display Invite Code & Sharing Options */
          <div className="space-y-5 py-1">
            <DialogHeader>
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <div className="p-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold">Patient Registered Successfully</DialogTitle>
                  <DialogDescription className="text-xs mt-0.5">
                    {issuedInvite.patientName} ({issuedInvite.patientAge > 0 ? `${issuedInvite.patientAge} yrs` : 'Senior'}) is pre-linked to your roster.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {/* Invite Code Display Box */}
            <div className="p-5 rounded-2xl bg-muted/50 border border-border flex flex-col items-center justify-center text-center space-y-2">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Caregiver Access Invite Code
              </span>
              <button
                onClick={copyCode}
                className="group relative flex items-center justify-center gap-3 px-6 py-3 rounded-xl bg-card border-2 border-primary/40 hover:border-primary shadow-xs transition-all w-full max-w-xs"
                title="Click to copy code"
              >
                <span className="text-2xl sm:text-3xl font-mono font-black tracking-widest text-primary">
                  {issuedInvite.inviteCode}
                </span>
                <span className="p-1.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </span>
              </button>
              <p className="text-[11px] text-muted-foreground pt-1">
                {issuedInvite.caregiverPhone ? (
                  <>
                    Auto-links automatically when signing in with <strong className="font-mono text-foreground">{issuedInvite.caregiverPhone}</strong>
                  </>
                ) : (
                  'Caregiver enters this code during their first sign-in'
                )}
              </p>
            </div>

            {/* Direct Sharing Actions */}
            <div className="space-y-2.5">
              <span className="text-xs font-bold text-foreground block">Instant Share with Caregiver:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={shareViaWhatsApp}
                  className="gap-2 text-xs font-semibold h-10 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send via WhatsApp</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={copyFullMessage}
                  className="gap-2 text-xs font-semibold h-10 hover:bg-muted"
                >
                  {copiedMsg ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-primary" />}
                  <span>{copiedMsg ? 'Message Copied' : 'Copy Invitation Text'}</span>
                </Button>
              </div>
            </div>

            <DialogFooter className="gap-2 pt-2 border-t border-border/60">
              <Button variant="outline" size="sm" onClick={() => handleOpenChange(false)} className="text-xs font-semibold">
                Close
              </Button>
              <Button size="sm" onClick={resetForm} className="text-xs font-bold">
                Register Another Patient
              </Button>
            </DialogFooter>
          </div>
        ) : (
          /* FORM STATE: Input Patient & Caregiver Info */
          <div className="space-y-4 py-1">
            <DialogHeader>
              <div className="flex items-center gap-2 text-primary">
                <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold font-headline">Register New Patient</DialogTitle>
                  <DialogDescription className="text-xs mt-0.5">
                    Pre-register a senior patient and issue a claimable invite code for their caregiver.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4">
              {/* SECTION 1: Patient Details */}
              <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/70 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider">
                  <User className="w-3.5 h-3.5" />
                  <span>1. Patient Profile</span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs font-semibold">Patient Full Name <span className="text-destructive">*</span></Label>
                    <Input
                      placeholder="e.g. Ramesh Chandra Verma"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      className="h-9 text-xs"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Age (Years)</Label>
                    <Input
                      type="number"
                      placeholder="e.g. 74"
                      value={patientAge}
                      onChange={(e) => setPatientAge(e.target.value)}
                      className="h-9 text-xs font-mono"
                      min={0}
                      max={130}
                    />
                  </div>
                </div>

                {/* Comorbidities Quick Selector */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold flex items-center gap-1">
                      <HeartPulse className="w-3 h-3 text-rose-500" />
                      <span>Primary Conditions & Clinical Concerns</span>
                    </Label>
                    <span className="text-[10px] text-muted-foreground">Select all that apply</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1 bg-background/80 rounded-xl border border-border/60">
                    {COMMON_COMORBIDITIES.map((c) => {
                      const isSel = selectedConditions.includes(c);
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => toggleCondition(c)}
                          className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-all ${
                            isSel
                              ? 'bg-primary text-primary-foreground border-primary font-bold shadow-xs'
                              : 'bg-muted/50 hover:bg-muted border-border/80 text-foreground'
                          }`}
                        >
                          {isSel ? '✓ ' : '+ '}
                          {c}
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom condition input */}
                  <div className="flex gap-2 pt-1">
                    <Input
                      placeholder="Or type custom condition (e.g. Glaucoma)..."
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
                      className="h-8 text-xs shrink-0"
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </div>

              {/* SECTION 2: Caregiver Details & Auto-Link */}
              <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/70 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider">
                    <Phone className="w-3.5 h-3.5" />
                    <span>2. Caregiver Contact & Linkage</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-normal">
                    Optional but recommended
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Caregiver Name</Label>
                    <Input
                      placeholder="e.g. Suresh Verma (Son)"
                      value={caregiverName}
                      onChange={(e) => setCaregiverName(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Caregiver Mobile Number</Label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-xs font-bold text-muted-foreground">+91</span>
                      <Input
                        type="tel"
                        maxLength={10}
                        placeholder="9820012345"
                        value={caregiverPhone.replace(/\D/g, '').slice(-10)}
                        onChange={(e) => setCaregiverPhone(e.target.value)}
                        className="pl-10 h-9 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-2 rounded-xl bg-blue-500/5 border border-blue-500/20 text-[11px] text-muted-foreground">
                  <Info className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <p>
                    Adding their mobile number enables <strong>seamless 1-click auto-linking</strong> when the caregiver logs in via Mobile OTP.
                  </p>
                </div>
              </div>

              {/* SECTION 3: Multi-Caregiver Network & Formal Support Setup */}
              <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/70 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider">
                    <Users2 className="w-3.5 h-3.5" />
                    <span>3. Caregiver Role & Support Network</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-normal">
                    Calibrates Burnout Risk
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Primary Relationship (Kinship)</Label>
                    <select
                      value={caregiverKinship}
                      onChange={(e) => setCaregiverKinship(e.target.value as any)}
                      className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
                    >
                      <option value="spouse">Spouse (Wife / Husband)</option>
                      <option value="son">Son</option>
                      <option value="daughter">Daughter</option>
                      <option value="daughter_in_law">Daughter-in-law</option>
                      <option value="sibling">Sibling</option>
                      <option value="other">Other Relative / Attendant</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Secondary Family Support</Label>
                    <select
                      value={secondaryFamily}
                      onChange={(e) => setSecondaryFamily(Number(e.target.value))}
                      className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
                    >
                      <option value={0}>0 (Solo Elderly Caregiver — High Risk)</option>
                      <option value={1}>1 Member (Son / Daughter assisting)</option>
                      <option value={2}>2 Members (Shared Family Shift)</option>
                      <option value={3}>3+ Members (Joint Family Network)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Formal Attendant / Support</Label>
                    <select
                      value={formalSupportType}
                      onChange={(e) => setFormalSupportType(e.target.value as any)}
                      className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
                    >
                      <option value="none">None (100% Family Burden)</option>
                      <option value="paid_attendant_12h">Paid Day Attendant (10–12h/day)</option>
                      <option value="paid_attendant_24h">Full 24h Live-in Attendant</option>
                      <option value="trained_nurse_12h">Trained Nurse (12h Nursing/Transfers)</option>
                      <option value="trained_nurse_24h">Trained Nurse (24h Intensive)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Attendant Hours / Day</Label>
                    <Input
                      type="number"
                      placeholder="e.g. 10"
                      value={formalSupportHours}
                      onChange={(e) => setFormalSupportHours(e.target.value)}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 pt-2 border-t border-border/60">
              <Button type="button" variant="outline" size="sm" onClick={() => handleOpenChange(false)} className="text-xs font-semibold">
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSubmit}
                disabled={isSubmitting || !patientName.trim()}
                className="text-xs font-bold gap-1.5 shadow-sm"
              >
                {isSubmitting ? (
                  <span>Registering…</span>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Invite Code</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
