'use client';

import { useEffect, useState, use as usePromise } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  ArrowLeft,
  User,
  AlertTriangle,
  Pill,
  HeartPulse,
  Plus,
  Activity,
  CheckCircle2,
  RefreshCw,
  Stethoscope
} from 'lucide-react';
import {
  getZaritAssessmentsFor,
  getFunctionScoresFor,
  getPatientDisplayName,
  recordFunctionScore,
  getMedicationsFor,
  saveMedicationsFor,
  getVitalsFor,
  recordVitalFor,
  recordZaritAssessmentFor,
  getCaregiverAttributesFor,
  saveCaregiverAttributesFor,
  getPatientProfileFor
} from '@/lib/firebase/clinical-sync';
import type { MedicationItem, VitalRecord } from '@/lib/db/health-repository';
import type { CaregiverAttributes, PatientDependenceProfile } from '@/lib/clinical/care-gap-engine';
import { computeTrajectory, type TrajectoryResult } from '@/lib/analytics/trajectory';
import { calculateZaritScore, type ZaritEvaluationResult, type ZbiFactor } from '@/lib/zarit-scale';
import { ScissorsChart } from '@/components/clinician/scissors-chart';
import { RiskHeader } from '@/components/clinician/risk-header';
import { FunctionAssessmentForm } from '@/components/clinical/function-assessment-form';
import { AssistedZaritAssessmentForm } from '@/components/clinical/assisted-zarit-assessment-form';
import { CaregiverSupportMatrix } from '@/components/clinician/caregiver-support-matrix';
import { AssignModulesPanel } from '@/components/clinician/assign-modules-panel';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const FACTOR_LABELS: Record<ZbiFactor, string> = {
  personal_strain: 'Personal Strain',
  role_strain: 'Role Strain',
  financial_strain: 'Financial Strain',
  competency: 'Competency',
  guilt: 'Guilt',
  global_burden: 'Global Burden'
};

export default function DyadDetailPage({ params }: { params: Promise<{ patientUid: string }> }) {
  const { patientUid } = usePromise(params);
  const { toast } = useToast();

  const [isMounted, setIsMounted] = useState(false);
  const [displayName, setDisplayName] = useState<string>('');
  const [trajectory, setTrajectory] = useState<TrajectoryResult | null>(null);
  const [latestAssessment, setLatestAssessment] = useState<ZaritEvaluationResult | null>(null);
  const [medications, setMedications] = useState<MedicationItem[]>([]);
  const [vitals, setVitals] = useState<VitalRecord[]>([]);
  const [caregiver, setCaregiver] = useState<CaregiverAttributes | null>(null);
  const [patientProfile, setPatientProfile] = useState<PatientDependenceProfile | null>(null);

  // Add Medication Dialog State
  const [isMedModalOpen, setIsMedModalOpen] = useState(false);
  const [medName, setMedName] = useState('');
  const [medDosage, setMedDosage] = useState('');
  const [medFrequency, setMedFrequency] = useState('Morning');
  const [isSavingMed, setIsSavingMed] = useState(false);

  // Add Vital Dialog State
  const [isVitalModalOpen, setIsVitalModalOpen] = useState(false);
  const [vitalBp, setVitalBp] = useState('');
  const [vitalPulse, setVitalPulse] = useState('');
  const [vitalSugar, setVitalSugar] = useState('');
  const [isSavingVital, setIsSavingVital] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const load = async () => {
    try {
      let assessments = await getZaritAssessmentsFor(patientUid);
      let functionScores = await getFunctionScoresFor(patientUid);
      let name = await getPatientDisplayName(patientUid);
      const [meds, vitalRecords, cgAttrs, prof] = await Promise.all([
        getMedicationsFor(patientUid).catch(() => []),
        getVitalsFor(patientUid).catch(() => []),
        getCaregiverAttributesFor(patientUid).catch(() => null),
        getPatientProfileFor(patientUid).catch(() => null)
      ]);
      setMedications(meds);
      setVitals(vitalRecords);
      setCaregiver(cgAttrs);
      setPatientProfile(prof);

      if (patientUid.startsWith('demo-')) {
        if (patientUid.includes('sarojini') || patientUid.includes('8102')) {
          name = 'Smt. Sarojini Devi (Dyad #8102)';
          assessments = [
            calculateZaritScore(
              { zbi_1: 3, zbi_2: 3, zbi_3: 4, zbi_4: 3, zbi_5: 3, zbi_7: 3, zbi_8: 3, zbi_14: 3, zbi_22: 4 },
              'ZBI22'
            ),
            calculateZaritScore(
              { zbi_1: 2, zbi_2: 2, zbi_3: 3, zbi_4: 2, zbi_5: 2, zbi_7: 2, zbi_8: 2, zbi_14: 2, zbi_22: 3 },
              'ZBI22'
            )
          ];
        } else if (patientUid.includes('ramesh') || patientUid.includes('7641')) {
          name = 'Shri Ramesh Chand (Dyad #7641)';
          assessments = [
            calculateZaritScore(
              { zbi_1: 2, zbi_2: 2, zbi_3: 2, zbi_7: 2, zbi_8: 2, zbi_14: 2, zbi_22: 2 },
              'ZBI22'
            )
          ];
        } else {
          name = 'Smt. Kamla Gupta (Dyad #8419)';
          assessments = [
            calculateZaritScore(
              { zbi_1: 1, zbi_2: 1, zbi_3: 1, zbi_7: 1, zbi_8: 1, zbi_14: 1, zbi_22: 1 },
              'ZBI12'
            )
          ];
        }
      }

      setDisplayName(name);
      setTrajectory(computeTrajectory(assessments, functionScores));
      setLatestAssessment(assessments[0] ?? null);
    } catch (err) {
      console.warn('Error loading dyad profile, falling back gracefully:', err);
      setDisplayName(patientUid.replace('demo-', '').replace('dyad_', 'Dyad '));
      setTrajectory(computeTrajectory([], []));
      setLatestAssessment(null);
    }
  };

  useEffect(() => {
    if (isMounted) {
      void load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted, patientUid]);

  const handleZaritAssessmentSaved = async (result: ZaritEvaluationResult) => {
    try {
      await recordZaritAssessmentFor(patientUid, result);
      toast({
        title: 'Caregiver Strain Score Saved',
        description: `ZBI ${result.tier} score recorded. Trajectory and factor analysis updated.`
      });
      await load();
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Could Not Save',
        description: err instanceof Error ? err.message : 'Please try again.'
      });
    }
  };

  const handleSaveCaregiverMatrix = async (attrs: CaregiverAttributes) => {
    await saveCaregiverAttributesFor(patientUid, attrs);
    setCaregiver(attrs);
  };

  const handleFunctionAssessmentSaved = async (result: Parameters<typeof recordFunctionScore>[1]) => {
    try {
      await recordFunctionScore(patientUid, result);
      toast({ title: 'Function Assessment Saved', description: 'The trajectory chart has been updated.' });
      await load();
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Could Not Save',
        description: err instanceof Error ? err.message : 'Check your access to this dyad and try again.'
      });
    }
  };

  const handleAddMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medName.trim()) return;
    setIsSavingMed(true);
    try {
      const newItem: MedicationItem = {
        id: `med_${Date.now()}`,
        name: medName.trim(),
        dosage: medDosage.trim() || 'As directed',
        frequency: 'Daily',
        timeOfDay: [medFrequency.toLowerCase() as any],
        foodRelation: 'after'
      };
      const updated = [...medications, newItem];
      await saveMedicationsFor(patientUid, updated);
      setMedications(updated);
      setMedName('');
      setMedDosage('');
      setIsMedModalOpen(false);
      toast({
        title: 'Prescription Added',
        description: `${newItem.name} has been added to the dyad's active regimen.`
      });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Could Not Save Medication',
        description: err instanceof Error ? err.message : 'Please try again.'
      });
    } finally {
      setIsSavingMed(false);
    }
  };

  const handleLogVital = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingVital(true);
    try {
      const newVital: VitalRecord = {
        id: `vital_${Date.now()}`,
        date: new Date().toISOString(),
        bp: vitalBp.trim() || undefined,
        pulse: vitalPulse.trim() || undefined,
        bloodSugar: vitalSugar.trim() || undefined,
        sleep: 'good',
        createdAt: new Date().toISOString()
      };
      await recordVitalFor(patientUid, newVital);
      setVitals([newVital, ...vitals]);
      setVitalBp('');
      setVitalPulse('');
      setVitalSugar('');
      setIsVitalModalOpen(false);
      toast({
        title: 'Vital Reading Logged',
        description: 'Observation saved to the patient record.'
      });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Could Not Save Vital',
        description: err instanceof Error ? err.message : 'Please try again.'
      });
    } finally {
      setIsSavingVital(false);
    }
  };

  if (!isMounted || !trajectory) {
    return <p className="text-sm text-muted-foreground p-6">Loading dyad…</p>;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-border/60">
        <div className="flex items-center gap-3">
          <Link href="/clinic/roster">
            <Button variant="outline" size="icon" className="h-9 w-9">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold font-headline">{displayName}</h1>
              <p className="text-xs text-muted-foreground">Caregiver burden vs. care-recipient functional trajectory</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => void load()} className="h-9 text-xs gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
          <AssistedZaritAssessmentForm
            patientName={displayName}
            onComplete={handleZaritAssessmentSaved}
          />
          <FunctionAssessmentForm onComplete={handleFunctionAssessmentSaved} />
        </div>
      </div>

      <RiskHeader trajectory={trajectory} />

      {/* Scissors Chart */}
      <Card className="rounded-3xl shadow-xs">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Longitudinal Scissors Trajectory</CardTitle>
          <CardDescription className="text-xs">
            Rising lines are worse on both series — a widening gap between them signals care demand
            outstripping caregiver capacity.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScissorsChart trajectory={trajectory} />
        </CardContent>
      </Card>

      {latestAssessment && (
        <Card className="rounded-3xl shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Latest Factor Breakdown</CardTitle>
            <CardDescription className="text-xs">
              {latestAssessment.tier} · {new Date(latestAssessment.completedAt).toLocaleDateString()}
              {latestAssessment.redFlags.length > 0 && (
                <span className="ml-2 inline-flex items-center gap-1 text-red-600 font-semibold">
                  <AlertTriangle className="w-3 h-3" /> {latestAssessment.redFlags.length} red flag
                  {latestAssessment.redFlags.length === 1 ? '' : 's'}
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {(Object.entries(latestAssessment.factors) as [ZbiFactor, typeof latestAssessment.factors[ZbiFactor]][]).map(
              ([key, factor]) => (
                <div key={key} className="p-3 rounded-xl border border-border/60 bg-card">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate">
                    {FACTOR_LABELS[key]}
                  </p>
                  {factor.isMeasured ? (
                    <p className="text-lg font-extrabold font-mono">{factor.percentage}%</p>
                  ) : (
                    <p className="text-xs text-muted-foreground italic mt-1">Not assessed in {latestAssessment.tier}</p>
                  )}
                </div>
              )
            )}
          </CardContent>
        </Card>
      )}

      {/* Multi-Caregiver Family Network & Formal Support Matrix */}
      <CaregiverSupportMatrix
        patientUid={patientUid}
        caregiver={caregiver}
        patient={patientProfile}
        onSave={handleSaveCaregiverMatrix}
      />

      {/* Medications and Vitals Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Active Medications */}
        <Card className="rounded-3xl shadow-xs">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Pill className="w-4 h-4 text-primary" /> Active Medications
              </CardTitle>
              <CardDescription className="text-xs">
                {medications.length} prescription{medications.length === 1 ? '' : 's'} on file
              </CardDescription>
            </div>

            <Dialog open={isMedModalOpen} onOpenChange={setIsMedModalOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="h-8 text-xs gap-1 font-semibold">
                  <Plus className="w-3.5 h-3.5" /> Add
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-base font-bold">Add Prescription / Medication</DialogTitle>
                  <DialogDescription className="text-xs">
                    Prescribed medication for {displayName}. Saved directly to the dyad record.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddMedication} className="space-y-3 py-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Medication Name</Label>
                    <Input
                      placeholder="e.g. Amlodipine, Donepezil, Paracetamol"
                      value={medName}
                      onChange={(e) => setMedName(e.target.value)}
                      className="h-9 text-xs"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Dosage</Label>
                      <Input
                        placeholder="e.g. 5mg, 500mg"
                        value={medDosage}
                        onChange={(e) => setMedDosage(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Slot</Label>
                      <select
                        value={medFrequency}
                        onChange={(e) => setMedFrequency(e.target.value)}
                        className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
                      >
                        <option value="Morning">Morning</option>
                        <option value="Afternoon">Afternoon</option>
                        <option value="Evening">Evening</option>
                        <option value="Night">Night</option>
                      </select>
                    </div>
                  </div>
                  <DialogFooter className="pt-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setIsMedModalOpen(false)} className="text-xs">
                      Cancel
                    </Button>
                    <Button type="submit" size="sm" disabled={isSavingMed || !medName.trim()} className="text-xs font-bold">
                      {isSavingMed ? 'Saving…' : 'Save Prescription'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="space-y-2">
            {medications.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">No medications recorded for this dyad.</p>
            ) : (
              medications.map((med) => (
                <div key={med.id} className="p-2.5 rounded-xl border border-border/60 flex items-center justify-between gap-2 bg-muted/20">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate text-foreground">{med.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {med.dosage} · {med.timeOfDay.join(', ')}
                    </p>
                  </div>
                  {med.beersWarning && (
                    <Badge variant="destructive" className="text-[9px] shrink-0">
                      Beers Flag
                    </Badge>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Vitals */}
        <Card className="rounded-3xl shadow-xs">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-primary" /> Recent Vitals
              </CardTitle>
              <CardDescription className="text-xs">Latest readings, newest first</CardDescription>
            </div>

            <Dialog open={isVitalModalOpen} onOpenChange={setIsVitalModalOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="h-8 text-xs gap-1 font-semibold">
                  <Plus className="w-3.5 h-3.5" /> Log Vitals
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-base font-bold">Log Clinical Vitals</DialogTitle>
                  <DialogDescription className="text-xs">
                    Record observation during OPD visit or consultation.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleLogVital} className="space-y-3 py-2">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">BP (mmHg)</Label>
                      <Input
                        placeholder="120/80"
                        value={vitalBp}
                        onChange={(e) => setVitalBp(e.target.value)}
                        className="h-9 text-xs font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Pulse (bpm)</Label>
                      <Input
                        type="number"
                        placeholder="72"
                        value={vitalPulse}
                        onChange={(e) => setVitalPulse(e.target.value)}
                        className="h-9 text-xs font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Sugar (mg/dL)</Label>
                      <Input
                        type="number"
                        placeholder="110"
                        value={vitalSugar}
                        onChange={(e) => setVitalSugar(e.target.value)}
                        className="h-9 text-xs font-mono"
                      />
                    </div>
                  </div>
                  <DialogFooter className="pt-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setIsVitalModalOpen(false)} className="text-xs">
                      Cancel
                    </Button>
                    <Button type="submit" size="sm" disabled={isSavingVital} className="text-xs font-bold">
                      {isSavingVital ? 'Saving…' : 'Record Reading'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="space-y-2">
            {vitals.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">No vitals logged for this dyad.</p>
            ) : (
              vitals.slice(0, 5).map((v) => (
                <div key={v.id} className="p-2.5 rounded-xl border border-border/60 flex items-center justify-between gap-2 bg-muted/20">
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {new Date(v.date).toLocaleDateString()}
                  </span>
                  <span className="text-xs font-mono font-bold text-foreground">
                    {[v.bp && `BP ${v.bp}`, v.pulse && `HR ${v.pulse}`, v.bloodSugar && `BS ${v.bloodSugar}`]
                      .filter(Boolean)
                      .join(' · ') || 'Observation recorded'}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Module Assignment Panel */}
      <AssignModulesPanel patientUid={patientUid} />

      {/* Clinician Quick Jump & Caregiver Portal Bridge */}
      <Card className="rounded-3xl border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card shadow-xs">
        <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-primary" />
              <span>Next Clinical Actions & Dyad Navigation</span>
            </h4>
            <p className="text-xs text-muted-foreground">
              Return to your patient cohort list or test the caregiver interface for this dyad.
            </p>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <Link href="/clinic/roster">
              <Button variant="outline" size="sm" className="h-9 text-xs font-semibold gap-1.5">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Roster
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" size="sm" className="h-9 text-xs font-semibold gap-1.5">
                Doctor Dashboard
              </Button>
            </Link>
            <Link href={`/modules?dyad=${patientUid}`}>
              <Button size="sm" className="h-9 text-xs font-bold gap-1.5 bg-primary text-primary-foreground">
                Preview Caregiver Portal
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
