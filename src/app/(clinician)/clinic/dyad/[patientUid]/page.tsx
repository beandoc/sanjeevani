'use client';

import { useEffect, useMemo, useState, use as usePromise } from 'react';
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
  Stethoscope,
  Users2,
  TrendingUp,
  BookOpen,
  Car,
  ShieldCheck,
  Calendar,
  FileText,
  Sparkles,
  Layers,
  HeartHandshake,
  ClipboardPlus,
  MapPin,
  Hospital,
  Store,
  Ambulance,
  ExternalLink
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
  getPatientProfileFor,
  savePatientProfileFor,
  getAppointmentsFor,
  subscribeToDyadClinicalData
} from '@/lib/firebase/clinical-sync';
import type { MedicationItem, VitalRecord } from '@/lib/db/health-repository';
import { CareGapEngine } from '@/lib/clinical/care-gap-engine';
import type { CaregiverAttributes, PatientDependenceProfile, AssistiveDeviceInventory } from '@/lib/clinical/care-gap-engine';
import { computeTrajectory, type TrajectoryResult, type CareMatrixInterventionMarker } from '@/lib/analytics/trajectory';
import { calculateZaritScore, type ZaritEvaluationResult, type ZbiFactor } from '@/lib/zarit-scale';
import { ScissorsChart } from '@/components/clinician/scissors-chart';
import { RiskHeader } from '@/components/clinician/risk-header';
import { FunctionAssessmentForm } from '@/components/clinical/function-assessment-form';
import { AssistedZaritAssessmentForm } from '@/components/clinical/assisted-zarit-assessment-form';
import { DailyCareLogPanel } from '@/components/clinical/daily-care-log-panel';
import { CareIntelligencePanel } from '@/components/clinical/care-intelligence-panel';
import { DoctorCareBlueprintDialog } from '@/components/clinician/doctor-care-blueprint-dialog';
import { CaregiverSupportMatrix } from '@/components/clinician/caregiver-support-matrix';
import { AssignModulesPanel } from '@/components/clinician/assign-modules-panel';
import type { ClinicalCareBlueprint } from '@/lib/clinical/care-gap-engine';
import { useToast } from '@/hooks/use-toast';
import { useAuthUser } from '@/hooks/use-auth-user';
import { cn } from '@/lib/utils';
import { EvidenceLevelBadge } from '@/components/clinical/evidence-level-badge';
import { CLINICAL_PROVENANCE } from '@/lib/clinical/provenance';

const FACTOR_LABELS: Record<ZbiFactor, string> = {
  personal_strain: 'Personal Strain',
  role_strain: 'Role Strain',
  financial_strain: 'Financial Strain',
  competency: 'Competency',
  guilt: 'Guilt',
  global_burden: 'Global Burden'
};

type DyadTab = 'matrix' | 'overview' | 'medications' | 'vitals' | 'dailyLogs' | 'modules' | 'emergency';

export default function DyadDetailPage({ params }: { params: Promise<{ patientUid: string }> }) {
  const { patientUid } = usePromise(params);
  const { toast } = useToast();
  const { user } = useAuthUser();
  const clinicianLabel = user?.displayName || 'Your Doctor';

  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<DyadTab>('matrix');
  const [displayName, setDisplayName] = useState<string>('');
  const [trajectory, setTrajectory] = useState<TrajectoryResult | null>(null);
  const [latestAssessment, setLatestAssessment] = useState<ZaritEvaluationResult | null>(null);
  const [medications, setMedications] = useState<MedicationItem[]>([]);
  const [vitals, setVitals] = useState<VitalRecord[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [caregiver, setCaregiver] = useState<CaregiverAttributes | null>(null);
  const [patientProfile, setPatientProfile] = useState<PatientDependenceProfile | null>(null);
  const [showCdssDetails, setShowCdssDetails] = useState(false);

  // Add Medication Dialog State
  const [isMedModalOpen, setIsMedModalOpen] = useState(false);
  const [medName, setMedName] = useState('');
  const [medDosage, setMedDosage] = useState('');
  const [medFrequency, setMedFrequency] = useState<'morning' | 'afternoon' | 'evening' | 'bedtime'>('morning');
  const [medIndication, setMedIndication] = useState('');
  const [medDuration, setMedDuration] = useState('');
  const [medRenalFunction, setMedRenalFunction] = useState('');
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
      const [assessmentsResult, functionScoresResult, nameResult, meds, vitalRecords, cgAttrs, prof, appts] = await Promise.all([
        getZaritAssessmentsFor(patientUid),
        getFunctionScoresFor(patientUid),
        getPatientDisplayName(patientUid),
        getMedicationsFor(patientUid).catch(() => []),
        getVitalsFor(patientUid).catch(() => []),
        getCaregiverAttributesFor(patientUid).catch(() => null),
        getPatientProfileFor(patientUid).catch(() => null),
        getAppointmentsFor(patientUid).catch(() => [])
      ]);
      let assessments = assessmentsResult;
      let functionScores = functionScoresResult;
      let name = nameResult;
      setMedications(meds);
      setVitals(vitalRecords);
      setAppointments(appts);
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

      const interventions: CareMatrixInterventionMarker[] = [];
      if (patientUid.startsWith('demo-') && assessments.length > 0) {
        interventions.push({
          id: 'iv_demo_1',
          date: assessments[0].completedAt,
          title: 'Care Matrix Deployed (12h Staff + Ripple Mattress)',
          type: 'formal_support',
          description: '12h Daytime Attendant deployed & Alternating Ripple Mattress installed.'
        });
      }

      setDisplayName(name);
      setTrajectory(computeTrajectory(assessments, functionScores, new Date(), interventions));
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

  useEffect(() => {
    if (!isMounted || patientUid.startsWith('demo-')) return;

    let refreshTimer: ReturnType<typeof setTimeout> | null = null;
    const unsubscribe = subscribeToDyadClinicalData(patientUid, () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => {
        void load();
      }, 150);
    });

    return () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      unsubscribe();
    };
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
        title: 'Saved Locally — Cloud Sync Failed',
        description: `Kept on this device; it will not yet appear on other portals. ${err instanceof Error ? err.message : 'Please retry when back online.'}`
      });
    }
  };

  const handleSaveCaregiverMatrix = async (attrs: CaregiverAttributes, devices?: AssistiveDeviceInventory) => {
    try {
      await saveCaregiverAttributesFor(patientUid, attrs);
      setCaregiver(attrs);
      if (devices && patientProfile) {
        const updatedProfile = { ...patientProfile, assistiveDevices: devices };
        await savePatientProfileFor(patientUid, updatedProfile);
        setPatientProfile(updatedProfile);
      }
      await load();
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Saved Locally — Cloud Sync Failed',
        description: `Kept on this device; it will not yet appear on other portals. ${err instanceof Error ? err.message : 'Please retry when back online.'}`
      });
    }
  };

  const handleBlueprintIssued = async (blueprint: ClinicalCareBlueprint) => {
    const updatedCaregiver: CaregiverAttributes = {
      ...(caregiver || {
        name: 'Primary Caregiver',
        age: 50,
        gender: 'female',
        kinship: 'daughter',
        coResidence: 'lives_together',
        education: 'graduate',
        employment: 'full_time',
        dailyHoursCommitted: 5,
        monthlyOutOfPocketBurden: 'moderate_strain',
        formalTrainingReceived: false,
        caregiverHealth: {
          hasBackPain: false,
          hasHypertension: false,
          hasArthritis: false,
          hasDiabetes: false,
          hasInsomnia: false
        }
      }),
      careBlueprint: blueprint,
      assistiveDevices: blueprint.recommendedAssistiveDevices,
      rotationPolicy: {
        ...(caregiver?.rotationPolicy || {
          rotationInterval: 'biweekly',
          primaryCaregiverRespiteDaysPerMonth: 4,
          nightShiftArrangement: 'primary_solo'
        }),
        primaryCaregiverRespiteDaysPerMonth: blueprint.recommendedRespiteDaysPerMonth
      }
    };

    try {
      await saveCaregiverAttributesFor(patientUid, updatedCaregiver);
      setCaregiver(updatedCaregiver);
      if (patientProfile) {
        const updatedProfile = { ...patientProfile, assistiveDevices: blueprint.recommendedAssistiveDevices };
        await savePatientProfileFor(patientUid, updatedProfile);
        setPatientProfile(updatedProfile);
      }
      await load();
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Saved Locally — Cloud Sync Failed',
        description: `Kept on this device; it will not yet appear on other portals. ${err instanceof Error ? err.message : 'Please retry when back online.'}`
      });
    }
  };

  const handleFunctionAssessmentSaved = async (result: Parameters<typeof recordFunctionScore>[1]) => {
    try {
      await recordFunctionScore(patientUid, result);
      toast({ title: 'Function Assessment Saved', description: 'The trajectory chart has been updated.' });
      await load();
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Saved Locally — Cloud Sync Failed',
        description: `Kept on this device; it will not yet appear on other portals. ${err instanceof Error ? err.message : 'Check your access to this dyad and try again.'}`
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
        timeOfDay: [medFrequency],
        foodRelation: 'after',
        indication: medIndication.trim() || undefined,
        duration: medDuration.trim() || undefined,
        renalFunctionEgfr: medRenalFunction.trim() || undefined
      };
      const updated = [...medications, newItem];
      await saveMedicationsFor(patientUid, updated);
      setMedications(updated);
      setMedName('');
      setMedDosage('');
      setMedIndication('');
      setMedDuration('');
      setMedRenalFunction('');
      setIsMedModalOpen(false);
      toast({
        title: 'Medication Added for Review',
        description: `${newItem.name} has been added to the dyad's active regimen.`
      });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Saved Locally — Cloud Sync Failed',
        description: `Kept on this device; it will not yet appear on other portals. ${err instanceof Error ? err.message : 'Please retry when back online.'}`
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
        title: 'Saved Locally — Cloud Sync Failed',
        description: `Kept on this device; it will not yet appear on other portals. ${err instanceof Error ? err.message : 'Please retry when back online.'}`
      });
    } finally {
      setIsSavingVital(false);
    }
  };

  // Computed once and reused by every tab so severity/warnings never disagree
  // between the header banner and the Daily Updates panel for the same instant.
  const careGapResult = useMemo(
    () => CareGapEngine.evaluate(caregiver, patientProfile, new Date(), vitals, appointments, medications),
    [caregiver, patientProfile, vitals, appointments, medications]
  );

  if (!isMounted || !trajectory) {
    return <p className="text-sm text-muted-foreground p-6">Loading dyad…</p>;
  }

  // Extract clean patient name and dyad identifiers
  const cleanPatientName = displayName.replace(/\s*\(Dyad\s*#[^)]+\)/i, '').trim() || displayName;
  const dyadCodeMatch = displayName.match(/\(Dyad\s*#([^)]+)\)/i);
  const dyadTag = dyadCodeMatch ? `Dyad #${dyadCodeMatch[1]}` : `Dyad #${patientUid.replace('demo-', '').toUpperCase()}`;
  // PatientDependenceProfile does not (yet) declare `gender` in its TS type, but the
  // underlying record may carry one — read defensively rather than hardcoding a value.
  const rawPatientGender = (patientProfile as (PatientDependenceProfile & { gender?: 'female' | 'male' | 'other' }) | null)?.gender;
  const patientGenderLabel = rawPatientGender
    ? rawPatientGender.charAt(0).toUpperCase() + rawPatientGender.slice(1)
    : 'Not specified';

  const patientInitials = cleanPatientName
    .replace(/^(Smt\.|Shri|Dr\.|Mr\.|Mrs\.|Ms\.)\s*/i, '')
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'PT';

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6">
      {/* Breadcrumb & Live Status Bar */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5 font-medium">
            <Link
              href="/clinic/roster"
              className="flex items-center gap-1 hover:text-foreground text-muted-foreground transition-colors group"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span>Patient Clinical Roster</span>
            </Link>
            <span className="text-border">/</span>
            <span className="text-foreground font-semibold">{cleanPatientName}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200/80 dark:border-emerald-800/80 shadow-2xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Active Care Surveillance
            </span>
          </div>
        </div>

        {/* Executive Patient Clinical Header */}
        <div className="p-4 sm:p-6 rounded-3xl border border-border/80 bg-card/90 backdrop-blur-xl shadow-xs space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Patient Identity & Clinical Metadata */}
            <div className="flex items-start sm:items-center gap-3.5 min-w-0">
              <div className="relative shrink-0">
                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-black text-base sm:text-lg shadow-sm ring-2 ring-blue-500/20">
                  {patientInitials}
                </div>
                <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-background border-2 border-card flex items-center justify-center text-primary shadow-2xs" title="Geriatric Dyad Patient">
                  <Stethoscope className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                </div>
              </div>

              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg sm:text-2xl font-black font-headline text-foreground tracking-tight truncate">
                    {cleanPatientName}
                  </h1>
                  <Badge variant="outline" className="font-semibold text-xs bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800 px-2 py-0.5">
                    {dyadTag}
                  </Badge>
                  <Badge variant="secondary" className="text-xs font-normal">
                    {patientProfile?.age || 78} Yrs • {patientGenderLabel}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1 font-medium text-foreground/90">
                    <Users2 className="w-3.5 h-3.5 text-primary" />
                    {caregiver?.name ? `Caregiver: ${caregiver.name} (${caregiver.kinship})` : 'Primary Caregiver Connected'}
                  </span>
                  <span className="hidden sm:inline text-border">•</span>
                  <span className="text-xs">
                    {caregiver?.coResidence === 'lives_together' ? 'Co-residing at home' : 'Family Care Circle'}
                  </span>
                  <span className="hidden sm:inline text-border">•</span>
                  <span className="font-semibold text-amber-600 dark:text-amber-400">
                    {latestAssessment ? `ZBI Strain: ${latestAssessment.totalScore}/88 (${latestAssessment.tier})` : 'ZBI: Score Intake Needed'}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => void load()}
                className="h-9 text-xs gap-1.5 bg-background/80 hover:bg-muted"
                title="Sync clinical observations and telemetry"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Refresh</span>
              </Button>

              <AssistedZaritAssessmentForm
                patientName={cleanPatientName}
                onComplete={handleZaritAssessmentSaved}
                trigger={
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 text-xs font-semibold gap-1.5 border-rose-500/30 text-rose-700 dark:text-rose-300 hover:bg-rose-500/10 bg-background/80"
                  >
                    <HeartHandshake className="w-3.5 h-3.5 text-rose-500" />
                    <span>ZBI Strain</span>
                  </Button>
                }
              />

              <FunctionAssessmentForm
                onComplete={handleFunctionAssessmentSaved}
                trigger={
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 text-xs font-semibold gap-1.5 border-indigo-500/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/10 bg-background/80"
                  >
                    <Activity className="w-3.5 h-3.5 text-indigo-500" />
                    <span>ADL / IADL</span>
                  </Button>
                }
              />

              <DoctorCareBlueprintDialog
                patientUid={patientUid}
                patientName={cleanPatientName}
                caregiver={caregiver}
                patientProfile={patientProfile}
                onBlueprintIssued={handleBlueprintIssued}
                trigger={
                  <Button
                    size="sm"
                    className="h-9 text-xs font-bold gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-blue-200" />
                    <span>Review Blueprint</span>
                  </Button>
                }
              />
            </div>
          </div>
        </div>
      </div>

      {/* Quality of Care Warning Banner / Compact CDSS Advisory Bar */}
      {careGapResult.qualityOfCareWarnings.length > 0 && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 dark:bg-amber-950/20 p-2.5 sm:px-4 text-xs shadow-2xs">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="font-bold text-amber-800 dark:text-amber-300 text-[11px] uppercase tracking-wider shrink-0">
                CDSS Advisory ({careGapResult.qualityOfCareWarnings.length}):
              </span>
              <p className="text-foreground/80 truncate text-xs">
                {careGapResult.qualityOfCareWarnings[0].replace(/^Decision-support limitation:\s*/i, '')}
                {careGapResult.qualityOfCareWarnings.length > 1 && (
                  <span className="text-muted-foreground ml-1">
                    (+{careGapResult.qualityOfCareWarnings.length - 1} more items)
                  </span>
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowCdssDetails(!showCdssDetails)}
              className="text-[11px] font-bold text-amber-700 dark:text-amber-300 hover:underline shrink-0 pl-2 cursor-pointer"
            >
              {showCdssDetails ? 'Collapse' : 'Show Details'}
            </button>
          </div>

          {showCdssDetails && (
            <div className="mt-2.5 pt-2.5 border-t border-amber-500/20 space-y-1.5 animate-in fade-in duration-200">
              {careGapResult.qualityOfCareWarnings.map((warning, index) => {
                const cleanWarning = warning.replace(/^Decision-support limitation:\s*/i, '');
                return (
                  <div
                    key={index}
                    className="p-2 rounded-xl border border-amber-200/70 dark:border-amber-800/60 bg-white/90 dark:bg-zinc-900/90 flex items-start gap-2 text-xs shadow-2xs"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                    <p className="text-foreground/90 leading-relaxed">{cleanWarning}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* HORIZONTAL WORKSPACE NAVIGATION TABS */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 no-scrollbar scroll-touch border-b border-border/60">
        {/* Tab 1: Care Support Matrix */}
        <button
          onClick={() => setActiveTab('matrix')}
          className={cn(
            'whitespace-nowrap px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border min-h-[42px] shrink-0',
            activeTab === 'matrix'
              ? 'bg-primary text-primary-foreground border-primary shadow-sm'
              : 'bg-card text-foreground hover:bg-muted/80 border-border/70'
          )}
        >
          <Users2 className="w-4 h-4" />
          <span>Monthly Support Matrix</span>
          <Badge className={cn('text-[9px] font-bold uppercase px-1.5 py-0.5 ml-1', activeTab === 'matrix' ? 'bg-white text-primary' : 'bg-primary/10 text-primary')}>
            Core
          </Badge>
        </button>

        {/* Tab 2: Trajectory & Overview */}
        <button
          onClick={() => setActiveTab('overview')}
          className={cn(
            'whitespace-nowrap px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border min-h-[42px] shrink-0',
            activeTab === 'overview'
              ? 'bg-primary text-primary-foreground border-primary shadow-sm'
              : 'bg-card text-foreground hover:bg-muted/80 border-border/70'
          )}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Trajectory & Scissors Chart</span>
          <Badge variant="outline" className="text-[9px] ml-1">
            {trajectory.riskBand}
          </Badge>
        </button>

        {/* Tab 3: Active Medications */}
        <button
          onClick={() => setActiveTab('medications')}
          className={cn(
            'whitespace-nowrap px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border min-h-[42px] shrink-0',
            activeTab === 'medications'
              ? 'bg-primary text-primary-foreground border-primary shadow-sm'
              : 'bg-card text-foreground hover:bg-muted/80 border-border/70'
          )}
        >
          <Pill className="w-4 h-4" />
          <span>Medicines & Regimen</span>
          <Badge variant="outline" className="text-[9px] ml-1">
            {medications.length}
          </Badge>
        </button>

        {/* Tab 4: Vitals & Observations */}
        <button
          onClick={() => setActiveTab('vitals')}
          className={cn(
            'whitespace-nowrap px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border min-h-[42px] shrink-0',
            activeTab === 'vitals'
              ? 'bg-primary text-primary-foreground border-primary shadow-sm'
              : 'bg-card text-foreground hover:bg-muted/80 border-border/70'
          )}
        >
          <HeartPulse className="w-4 h-4" />
          <span>Vital Signs</span>
          <Badge variant="outline" className="text-[9px] ml-1">
            {vitals.length}
          </Badge>
        </button>

        {/* Tab 5: Daily Bedside Updates */}
        <button
          onClick={() => setActiveTab('dailyLogs')}
          className={cn(
            'whitespace-nowrap px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border min-h-[42px] shrink-0',
            activeTab === 'dailyLogs'
              ? 'bg-primary text-primary-foreground border-primary shadow-sm'
              : 'bg-card text-foreground hover:bg-muted/80 border-border/70'
          )}
        >
          <FileText className="w-4 h-4" />
          <span>Daily Updates</span>
        </button>

        {/* Tab 5: Assigned Modules */}
        <button
          onClick={() => setActiveTab('modules')}
          className={cn(
            'whitespace-nowrap px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border min-h-[42px] shrink-0',
            activeTab === 'modules'
              ? 'bg-primary text-primary-foreground border-primary shadow-sm'
              : 'bg-card text-foreground hover:bg-muted/80 border-border/70'
          )}
        >
          <BookOpen className="w-4 h-4" />
          <span>Education & Guides</span>
        </button>

        {/* Tab 6: Emergency Readiness */}
        <button
          onClick={() => setActiveTab('emergency')}
          className={cn(
            'whitespace-nowrap px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border min-h-[42px] shrink-0',
            activeTab === 'emergency'
              ? 'bg-primary text-primary-foreground border-primary shadow-sm'
              : 'bg-card text-foreground hover:bg-muted/80 border-border/70'
          )}
        >
          <Car className="w-4 h-4 text-red-600" />
          <span>Emergency Logistics</span>
          {caregiver?.emergencyLogistics?.fourWheelerAvailableAtHome ? (
            <span className="w-2 h-2 rounded-full bg-emerald-500 ml-1" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping ml-1" />
          )}
        </button>
      </div>

      {/* FULL WIDTH MAIN WORKSPACE AREA */}
      <div className="w-full space-y-6">
        {/* TAB 1: CARE SUPPORT MATRIX & MONTHLY PLAN (HIGHLIGHTED FEATURE) */}
        {activeTab === 'matrix' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <CaregiverSupportMatrix
              patientUid={patientUid}
              caregiver={caregiver}
              patient={patientProfile}
              onSave={handleSaveCaregiverMatrix}
            />
          </div>
        )}

          {/* TAB 2: OVERVIEW & SCISSORS TRAJECTORY */}
          {(activeTab === 'overview') && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <RiskHeader trajectory={trajectory} />

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
            </div>
          )}

          {/* TAB 3: MEDICATIONS */}
          {(activeTab === 'medications') && (
            <Card className="rounded-3xl shadow-xs animate-in fade-in duration-200">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Pill className="w-4 h-4 text-primary" /> Active Medication Regimen
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {medications.length} medicine{medications.length === 1 ? '' : 's'} on file for {displayName}
                  </CardDescription>
                  <div className="pt-1">
                    <EvidenceLevelBadge provenance={CLINICAL_PROVENANCE.beersStoppScreen} />
                  </div>
                </div>

                <Dialog open={isMedModalOpen} onOpenChange={setIsMedModalOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="h-8 text-xs gap-1 font-semibold">
                      <Plus className="w-3.5 h-3.5" /> Add Medication
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6">
                    <DialogHeader>
                      <DialogTitle className="text-base font-bold">Add Medication for Review</DialogTitle>
                      <DialogDescription className="text-xs">
                        Add a medication for {displayName}. Confirm indication, dose, duration, renal function, and prescriber intent during reconciliation.
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                            onChange={(e) => setMedFrequency(e.target.value as typeof medFrequency)}
                            className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
                          >
                            <option value="morning">Morning</option>
                            <option value="afternoon">Afternoon</option>
                            <option value="evening">Evening</option>
                            <option value="bedtime">Bedtime</option>
                          </select>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">Indication</Label>
                        <Input
                          placeholder="e.g. BP, diabetes, pain, sleep"
                          value={medIndication}
                          onChange={(e) => setMedIndication(e.target.value)}
                          className="h-9 text-xs"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs font-semibold">Duration / Review Date</Label>
                          <Input
                            placeholder="e.g. 5 days, review in 2 weeks"
                            value={medDuration}
                            onChange={(e) => setMedDuration(e.target.value)}
                            className="h-9 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-semibold">Renal Function / eGFR</Label>
                          <Input
                            placeholder="e.g. eGFR 42, normal, unknown"
                            value={medRenalFunction}
                            onChange={(e) => setMedRenalFunction(e.target.value)}
                            className="h-9 text-xs"
                          />
                        </div>
                      </div>
                      <DialogFooter className="pt-2 flex-col sm:flex-row gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => setIsMedModalOpen(false)} className="w-full sm:w-auto">
                          Cancel
                        </Button>
                        <Button type="submit" size="sm" disabled={isSavingMed} className="bg-primary font-bold w-full sm:w-auto">
                          {isSavingMed ? 'Saving...' : 'Save Medication'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {medications.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">No medications logged yet.</p>
                ) : (
                  <div className="space-y-2">
                    {medications.map((m) => (
                      <div key={m.id} className="p-3 rounded-xl border border-border/60 bg-card flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-foreground">{m.name}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {m.dosage} · Slot: {m.timeOfDay.join(', ')}
                          </p>
                          {(m.indication || m.renalFunctionEgfr || m.duration) && (
                            <p className="text-[11px] text-muted-foreground">
                              {[m.indication, m.renalFunctionEgfr, m.duration].filter(Boolean).join(' · ')}
                            </p>
                          )}
                        </div>
                        <Badge variant="outline" className="text-[10px]">Active</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* TAB 4: VITALS */}
          {(activeTab === 'vitals') && (
            <Card className="rounded-3xl shadow-xs animate-in fade-in duration-200">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <HeartPulse className="w-4 h-4 text-primary" /> Vital Signs & Health Observations
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Blood pressure, pulse, and glucose logs
                  </CardDescription>
                </div>

                <Dialog open={isVitalModalOpen} onOpenChange={setIsVitalModalOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="h-8 text-xs gap-1 font-semibold">
                      <Plus className="w-3.5 h-3.5" /> Log Vital
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6">
                    <DialogHeader>
                      <DialogTitle className="text-base font-bold">Log Clinical Vital Reading</DialogTitle>
                      <DialogDescription className="text-xs">
                        Record BP, pulse, or blood sugar for {displayName}.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleLogVital} className="space-y-3 py-2">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs font-semibold">Blood Pressure (mmHg)</Label>
                          <Input
                            placeholder="e.g. 130/85"
                            value={vitalBp}
                            onChange={(e) => setVitalBp(e.target.value)}
                            className="h-9 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-semibold">Pulse (BPM)</Label>
                          <Input
                            placeholder="e.g. 74"
                            value={vitalPulse}
                            onChange={(e) => setVitalPulse(e.target.value)}
                            className="h-9 text-xs"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">Blood Sugar (mg/dL)</Label>
                        <Input
                          placeholder="e.g. 142"
                          value={vitalSugar}
                          onChange={(e) => setVitalSugar(e.target.value)}
                          className="h-9 text-xs"
                        />
                      </div>
                      <DialogFooter className="pt-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => setIsVitalModalOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" size="sm" disabled={isSavingVital} className="bg-primary font-bold">
                          {isSavingVital ? 'Saving…' : 'Record Vital'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {vitals.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">No vital records logged yet.</p>
                ) : (
                  <div className="space-y-2">
                    {vitals.slice(0, 10).map((v) => (
                      <div key={v.id} className="p-3 rounded-xl border border-border/60 bg-card flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-foreground font-mono">
                            {v.bp ? `BP: ${v.bp}` : ''} {v.pulse ? `· Pulse: ${v.pulse} bpm` : ''} {v.bloodSugar ? `· Sugar: ${v.bloodSugar} mg/dL` : ''}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(v.date).toLocaleDateString()} at {new Date(v.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-[10px] text-emerald-600">Logged</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* TAB 5: DAILY BEDSIDE UPDATES */}
          {(activeTab === 'dailyLogs') && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <CareIntelligencePanel
                patientUid={patientUid}
                patientName={displayName}
                latestZarit={latestAssessment}
                careGap={careGapResult}
                caregiver={caregiver}
                patient={patientProfile}
                vitals={vitals}
                mode="clinician"
              />
              <DailyCareLogPanel
                patientUid={patientUid}
                patientName={displayName}
                mode="readonly"
                title="Daily Bedside Updates"
                medications={medications}
              />
            </div>
          )}

          {/* TAB 6: MODULES */}
          {(activeTab === 'modules') && (
            <div className="animate-in fade-in duration-200">
              <AssignModulesPanel patientUid={patientUid} clinicianLabel={clinicianLabel} />
            </div>
          )}

          {/* TAB 7: EMERGENCY READINESS */}
          {(activeTab === 'emergency') && (
            <Card className="rounded-3xl border-red-500/20 shadow-xs animate-in fade-in duration-200">
              <CardHeader className="pb-3 border-b border-border/50 bg-red-500/5">
                <CardTitle className="text-base font-bold flex items-center gap-2 text-red-700 dark:text-red-400">
                  <Car className="w-5 h-5 text-red-600" /> Emergency Transit & Hospital Accessibility Readiness
                </CardTitle>
                <CardDescription className="text-xs">
                  Physical access to 4-wheeler, proximity to emergency triage, and designated transit escorts.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-card border border-border/70 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground">Hospital Distance</span>
                    {caregiver?.emergencyLogistics?.hospitalDistanceKm != null ? (
                      <>
                        <p className="text-xl font-mono font-black text-foreground">
                          {caregiver.emergencyLogistics.hospitalDistanceKm} km
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {caregiver?.emergencyLogistics?.travelTimeMinutes != null
                            ? `~${caregiver.emergencyLogistics.travelTimeMinutes} mins transit time`
                            : 'Transit time not configured'}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-xl font-mono font-black text-muted-foreground/60 italic">—</p>
                        <p className="text-[11px] text-muted-foreground italic">Not configured</p>
                      </>
                    )}
                  </div>
                  <div className="p-4 rounded-2xl bg-card border border-border/70 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground">4-Wheeler (Car) Readiness</span>
                    <div>
                      {caregiver?.emergencyLogistics ? (
                        caregiver.emergencyLogistics.fourWheelerAvailableAtHome ? (
                          <Badge className="bg-emerald-600 text-white font-bold text-xs py-1">Vehicle at Home</Badge>
                        ) : (
                          <Badge className="bg-red-600 text-white font-bold text-xs py-1">No Vehicle (Cab Dependent)</Badge>
                        )
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground font-bold text-xs py-1">Not configured</Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground pt-1">
                      {caregiver?.emergencyLogistics?.vehicleDetails || (
                        <span className="italic text-muted-foreground/70">Not configured</span>
                      )}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-card border border-border/70 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground">Emergency Driver</span>
                    <p className="text-base font-bold text-foreground">
                      {caregiver?.emergencyLogistics?.designatedEmergencyDriver || (
                        <span className="text-muted-foreground italic font-normal text-sm">Not configured</span>
                      )}
                    </p>
                    <p className="text-[11px] text-muted-foreground">Designated key holder for rapid triage transit</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-muted/30 border border-border/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold flex items-center gap-1.5 text-foreground">
                      <MapPin className="w-4 h-4 text-primary" />
                      Patient Home Address & Emergency Geolocation Setpoint:
                    </span>
                    <span className="font-mono text-primary font-bold">Helpline: {caregiver?.emergencyLogistics?.ambulanceContact || '108'}</span>
                  </div>
                  <p className="text-xs text-foreground bg-card p-2.5 rounded-xl border border-border/60">
                    {patientProfile?.homeCareAddress || 'H-402, Green Park Society, New Delhi (Default Registered Address)'}
                  </p>

                  <div className="pt-2 border-t border-border/50">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                      Live Google Search Around Patient Residence:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const addr = patientProfile?.homeCareAddress || 'AIIMS New Delhi';
                          window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`hospitals emergency near ${addr}`)}`, '_blank');
                        }}
                        className="p-2 rounded-xl border border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10 text-left transition-all flex items-center justify-between text-xs cursor-pointer"
                      >
                        <span className="flex items-center gap-1.5 font-bold text-rose-700 dark:text-rose-300">
                          <Hospital className="w-3.5 h-3.5 text-rose-600" />
                          Nearby Hospitals
                        </span>
                        <ExternalLink className="w-3 h-3 text-muted-foreground" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const addr = patientProfile?.homeCareAddress || 'AIIMS New Delhi';
                          window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`medical stores pharmacy near ${addr}`)}`, '_blank');
                        }}
                        className="p-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 text-left transition-all flex items-center justify-between text-xs cursor-pointer"
                      >
                        <span className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-300">
                          <Pill className="w-3.5 h-3.5 text-emerald-600" />
                          24x7 Pharmacies
                        </span>
                        <ExternalLink className="w-3 h-3 text-muted-foreground" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const addr = patientProfile?.homeCareAddress || 'AIIMS New Delhi';
                          window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`ambulance service near ${addr}`)}`, '_blank');
                        }}
                        className="p-2 rounded-xl border border-red-500/30 bg-red-500/5 hover:bg-red-500/10 text-left transition-all flex items-center justify-between text-xs cursor-pointer"
                      >
                        <span className="flex items-center gap-1.5 font-bold text-red-700 dark:text-red-300">
                          <Ambulance className="w-3.5 h-3.5 text-red-600" />
                          Ambulance Services
                        </span>
                        <ExternalLink className="w-3 h-3 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
      </div>
    </div>
  );
}
