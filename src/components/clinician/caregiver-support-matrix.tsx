'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Users2,
  HeartHandshake,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Briefcase,
  UserCheck,
  Edit3,
  Activity,
  Sparkles,
  Home,
  CheckCircle2
} from 'lucide-react';
import {
  CaregiverAttributes,
  PatientDependenceProfile,
  CareGapEngine,
  FormalSupportType
} from '@/lib/clinical/care-gap-engine';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface CaregiverSupportMatrixProps {
  patientUid: string;
  caregiver: CaregiverAttributes | null;
  patient: PatientDependenceProfile | null;
  onSave: (attrs: CaregiverAttributes) => Promise<void>;
}

export function CaregiverSupportMatrix({
  patientUid,
  caregiver,
  patient,
  onSave
}: CaregiverSupportMatrixProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [name, setName] = useState(caregiver?.name || 'Caregiver');
  const [age, setAge] = useState(caregiver?.age || 54);
  const [kinship, setKinship] = useState<CaregiverAttributes['kinship']>(caregiver?.kinship || 'spouse');
  const [coResidence, setCoResidence] = useState<CaregiverAttributes['coResidence']>(caregiver?.coResidence || 'lives_together');
  const [employment, setEmployment] = useState<CaregiverAttributes['employment']>(caregiver?.employment || 'homemaker');
  const [secondaryFamilyCount, setSecondaryFamilyCount] = useState(caregiver?.otherFamilyMembersCount ?? 1);
  const [supportType, setSupportType] = useState<FormalSupportType>(caregiver?.formalSupport?.type || 'none');
  const [supportHours, setSupportHours] = useState(caregiver?.formalSupport?.hoursPerDay || 0);
  const [handlesTransfers, setHandlesTransfers] = useState(caregiver?.formalSupport?.handlesHeavyTransfers || false);
  const [handlesMeds, setHandlesMeds] = useState(caregiver?.formalSupport?.handlesMedicationWoundCare || false);

  // Caregiver Health Constraints
  const [hasBackPain, setHasBackPain] = useState(caregiver?.caregiverHealth?.hasBackPain || false);
  const [hasHypertension, setHasHypertension] = useState(caregiver?.caregiverHealth?.hasHypertension || false);
  const [hasArthritis, setHasArthritis] = useState(caregiver?.caregiverHealth?.hasArthritis || false);
  const [hasInsomnia, setHasInsomnia] = useState(caregiver?.caregiverHealth?.hasInsomnia || false);

  // Real-time Care Gap Evaluation
  const currentCaregiver: CaregiverAttributes = caregiver || {
    name: 'Primary Caregiver',
    age: 54,
    gender: 'female',
    kinship: 'spouse',
    coResidence: 'lives_together',
    education: 'graduate',
    employment: 'homemaker',
    caregiverHealth: {
      hasBackPain: false,
      hasHypertension: false,
      hasArthritis: false,
      hasDiabetes: false,
      hasInsomnia: false
    },
    dailyHoursCommitted: 8,
    monthlyOutOfPocketBurden: 'manageable',
    formalTrainingReceived: false,
    formalSupport: {
      type: 'none',
      hoursPerDay: 0,
      handlesHeavyTransfers: false,
      handlesMedicationWoundCare: false
    }
  };

  const gapEval = CareGapEngine.evaluate(currentCaregiver, patient);

  const handleSupportTypeChange = (type: FormalSupportType) => {
    setSupportType(type);
    if (type === 'paid_attendant_12h') {
      setSupportHours(12);
      setHandlesTransfers(true);
    } else if (type === 'paid_attendant_24h') {
      setSupportHours(20);
      setHandlesTransfers(true);
      setHandlesMeds(true);
    } else if (type === 'trained_nurse_12h') {
      setSupportHours(12);
      setHandlesMeds(true);
      setHandlesTransfers(true);
    } else if (type === 'trained_nurse_24h') {
      setSupportHours(20);
      setHandlesMeds(true);
      setHandlesTransfers(true);
    } else if (type === 'none') {
      setSupportHours(0);
      setHandlesTransfers(false);
      setHandlesMeds(false);
    }
  };

  const handleSaveModal = async () => {
    setIsSaving(true);
    try {
      const updated: CaregiverAttributes = {
        ...currentCaregiver,
        name,
        age: Number(age),
        kinship,
        coResidence,
        employment,
        otherFamilyMembersCount: Number(secondaryFamilyCount),
        caregiverHealth: {
          hasBackPain,
          hasHypertension,
          hasArthritis,
          hasDiabetes: false,
          hasInsomnia
        },
        formalSupport: {
          type: supportType,
          hoursPerDay: Number(supportHours),
          handlesHeavyTransfers: handlesTransfers,
          handlesMedicationWoundCare: handlesMeds
        }
      };

      await onSave(updated);
      setOpen(false);
      toast({
        title: 'Caregiver & Support Matrix Saved',
        description: 'Updated care capacity, attendant hours, and family dynamics.'
      });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Could Not Save',
        description: err instanceof Error ? err.message : 'Please try again.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const hasFormalSupport = currentCaregiver.formalSupport && currentCaregiver.formalSupport.type !== 'none' && currentCaregiver.formalSupport.hoursPerDay > 0;

  return (
    <Card className="rounded-3xl border-primary/20 shadow-xs overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/50 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Users2 className="w-4 h-4 text-primary" />
            Caregiver Network & Formal Support Matrix
          </CardTitle>
          <CardDescription className="text-xs">
            Multi-caregiver dynamics, formal attendant deployment (12h/24h), and calculated care gap.
          </CardDescription>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5 font-bold shrink-0">
              <Edit3 className="w-3.5 h-3.5" /> Configure Support Matrix
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Users2 className="w-4 h-4 text-primary" />
                Configure Caregiver & Formal Attendant Infrastructure
              </DialogTitle>
              <DialogDescription className="text-xs">
                Adjust primary caregiver attributes, secondary family assistance, and deployed paid attendant hours.
              </DialogDescription>
            </DialogHeader>

            <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-4 my-2 text-xs">
              {/* Section 1: Primary Caregiver Identity */}
              <div className="space-y-3 p-3.5 rounded-2xl border border-border/70 bg-card">
                <p className="font-bold text-foreground uppercase tracking-wider text-[11px]">
                  1. Primary Caregiver Identity & Kinship
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Caregiver Name</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} className="h-8 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Age (Years)</Label>
                    <Input type="number" value={age} onChange={(e) => setAge(Number(e.target.value))} className="h-8 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Kinship</Label>
                    <select
                      value={kinship}
                      onChange={(e) => setKinship(e.target.value as any)}
                      className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
                    >
                      <option value="spouse">Spouse (Wife / Husband)</option>
                      <option value="son">Son</option>
                      <option value="daughter">Daughter</option>
                      <option value="daughter_in_law">Daughter-in-law</option>
                      <option value="sibling">Sibling</option>
                      <option value="other">Other Relative</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <Label className="text-xs">Living Arrangement</Label>
                    <select
                      value={coResidence}
                      onChange={(e) => setCoResidence(e.target.value as any)}
                      className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
                    >
                      <option value="lives_together">Lives Together in Same Household</option>
                      <option value="nearby">Lives Nearby (Same City / Short Travel)</option>
                      <option value="long_distance">Long Distance</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Employment Status</Label>
                    <select
                      value={employment}
                      onChange={(e) => setEmployment(e.target.value as any)}
                      className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
                    >
                      <option value="homemaker">Homemaker (Full Time Home)</option>
                      <option value="full_time">Full-Time Job (40+ hrs/wk)</option>
                      <option value="part_time">Part-Time / Flexible</option>
                      <option value="retired">Retired Senior</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Secondary Family Members */}
              <div className="space-y-2 p-3.5 rounded-2xl border border-border/70 bg-card">
                <p className="font-bold text-foreground uppercase tracking-wider text-[11px]">
                  2. Family Support Network
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Secondary Family Members Assisting</Label>
                    <select
                      value={secondaryFamilyCount}
                      onChange={(e) => setSecondaryFamilyCount(Number(e.target.value))}
                      className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
                    >
                      <option value={0}>0 (Solo Caregiver — No Secondary Support)</option>
                      <option value={1}>1 Member (e.g. Working Son / Daughter assisting)</option>
                      <option value={2}>2 Members (Shared Family Rotation)</option>
                      <option value={3}>3+ Members (Joint Family Network)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 3: Formal Attendant & Nursing Deployment */}
              <div className="space-y-3 p-3.5 rounded-2xl border border-primary/40 bg-primary/5">
                <p className="font-bold text-primary uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  3. Formal Support & Paid Attendant Deployment
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Support Category</Label>
                    <select
                      value={supportType}
                      onChange={(e) => handleSupportTypeChange(e.target.value as FormalSupportType)}
                      className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs font-semibold"
                    >
                      <option value="none">None (100% Family Burden)</option>
                      <option value="paid_attendant_12h">Paid Day Attendant (10–12 Hours/Day)</option>
                      <option value="paid_attendant_24h">Full 24h Live-in Attendant</option>
                      <option value="trained_nurse_12h">Trained Nurse (12h Wound/Meds/Transfers)</option>
                      <option value="trained_nurse_24h">Trained Nurse (24h Intensive Clinical)</option>
                      <option value="medical_assistant">Medical Assistant</option>
                      <option value="multi_family_rotation">Formal Multi-Family Shift Rota</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Attendant Hours / Day</Label>
                    <Input
                      type="number"
                      value={supportHours}
                      onChange={(e) => setSupportHours(Number(e.target.value))}
                      className="h-8 text-xs font-mono"
                      placeholder="e.g. 10"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={handlesTransfers}
                      onChange={(e) => setHandlesTransfers(e.target.checked)}
                      className="rounded text-primary"
                    />
                    <span className="text-xs">Attendant handles heavy transfers / bathing (Relieves Lumbar Strain)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={handlesMeds}
                      onChange={(e) => setHandlesMeds(e.target.checked)}
                      className="rounded text-primary"
                    />
                    <span className="text-xs">Attendant handles medications & nursing hygiene</span>
                  </label>
                </div>
              </div>

              {/* Section 4: Caregiver Health Constraints */}
              <div className="space-y-2 p-3.5 rounded-2xl border border-border/70 bg-card">
                <p className="font-bold text-foreground uppercase tracking-wider text-[11px]">
                  4. Primary Caregiver Physical Health Constraints
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-border/60 cursor-pointer">
                    <input type="checkbox" checked={hasBackPain} onChange={(e) => setHasBackPain(e.target.checked)} className="rounded text-primary" />
                    <span className="text-xs">Back Pain / Spine</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-border/60 cursor-pointer">
                    <input type="checkbox" checked={hasArthritis} onChange={(e) => setHasArthritis(e.target.checked)} className="rounded text-primary" />
                    <span className="text-xs">Arthritis</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-border/60 cursor-pointer">
                    <input type="checkbox" checked={hasHypertension} onChange={(e) => setHasHypertension(e.target.checked)} className="rounded text-primary" />
                    <span className="text-xs">Hypertension</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-border/60 cursor-pointer">
                    <input type="checkbox" checked={hasInsomnia} onChange={(e) => setHasInsomnia(e.target.checked)} className="rounded text-primary" />
                    <span className="text-xs">Sleep Strain</span>
                  </label>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-2 border-t border-border/50">
              <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)} className="text-xs">
                Cancel
              </Button>
              <Button type="button" size="sm" onClick={handleSaveModal} disabled={isSaving} className="text-xs font-bold bg-primary">
                {isSaving ? 'Saving…' : 'Save Support Matrix'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 space-y-4">
        {/* Row 1: Badges & Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Box 1: Primary Caregiver */}
          <div className="p-3.5 rounded-2xl border border-border/60 bg-card space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-primary" /> Primary Caregiver
            </span>
            <p className="text-sm font-bold text-foreground">
              {currentCaregiver.name} ({currentCaregiver.age} yrs)
            </p>
            <p className="text-xs text-muted-foreground capitalize">
              {currentCaregiver.kinship.replace('_', ' ')} • {currentCaregiver.coResidence.replace('_', ' ')}
            </p>
            <div className="flex flex-wrap gap-1 pt-1">
              {currentCaregiver.caregiverHealth.hasBackPain && (
                <Badge variant="outline" className="text-[9px] text-amber-700 dark:text-amber-300 border-amber-500/30">
                  Lumbar Strain
                </Badge>
              )}
              {currentCaregiver.caregiverHealth.hasInsomnia && (
                <Badge variant="outline" className="text-[9px] text-purple-700 dark:text-purple-300 border-purple-500/30">
                  Sleep Strain
                </Badge>
              )}
              {currentCaregiver.employment === 'full_time' && (
                <Badge variant="outline" className="text-[9px] text-blue-700 dark:text-blue-300 border-blue-500/30">
                  Full-Time Job
                </Badge>
              )}
            </div>
          </div>

          {/* Box 2: Formal Attendant / Support */}
          <div className={cn(
            'p-3.5 rounded-2xl border space-y-1.5',
            hasFormalSupport ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-amber-500/30 bg-amber-500/5'
          )}>
            <span className="text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 text-muted-foreground">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Formal Attendant Support
            </span>
            <p className="text-sm font-bold text-foreground">
              {hasFormalSupport
                ? `${currentCaregiver.formalSupport?.hoursPerDay}h/day Paid Support`
                : 'Solo Family Care (No Attendant)'}
            </p>
            <p className="text-xs text-muted-foreground capitalize">
              {currentCaregiver.formalSupport?.type?.replace(/_/g, ' ') || 'None'}
            </p>
            <p className="text-[11px] text-muted-foreground pt-0.5">
              {currentCaregiver.otherFamilyMembersCount
                ? `+ ${currentCaregiver.otherFamilyMembersCount} secondary family assisting`
                : 'No secondary family assistance'}
            </p>
          </div>

          {/* Box 3: Care Gap & Burnout Risk Engine */}
          <div className="p-3.5 rounded-2xl border border-border/60 bg-card space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-primary" /> Calculated Care Gap
            </span>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-foreground">
                {gapEval.netCareGapHours > 0 ? `${gapEval.netCareGapHours.toFixed(1)}h Deficit` : 'Sustainable (0h Gap)'}
              </span>
              <Badge className={cn(
                'text-[10px] font-bold uppercase',
                gapEval.caregiverBurnoutRiskLevel === 'critical'
                  ? 'bg-red-600 text-white'
                  : gapEval.caregiverBurnoutRiskLevel === 'high'
                  ? 'bg-amber-600 text-white'
                  : 'bg-emerald-600 text-white'
              )}>
                {gapEval.caregiverBurnoutRiskLevel} Burnout Risk
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Patient Demand: <strong>{gapEval.patientCareDemandHours.toFixed(1)}h</strong> · Attendant Absorbed: <strong>{gapEval.formalSupportAbsorbedHours.toFixed(1)}h</strong>
            </p>
            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden mt-1">
              <div
                className={cn(
                  'h-full transition-all',
                  gapEval.caregiverInjuryRiskScore > 50 ? 'bg-red-500' : 'bg-emerald-500'
                )}
                style={{ width: `${Math.min(100, gapEval.caregiverInjuryRiskScore)}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground block">
              Caregiver Spine / Injury Strain: {gapEval.caregiverInjuryRiskScore}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
