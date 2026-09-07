'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BrainCircuit,
  HeartPulse,
  Activity,
  User,
  ShieldAlert,
  Accessibility,
  ArrowRight,
  BookOpenCheck,
  PersonStanding,
  HeartHandshake,
  Recycle,
  Stethoscope,
  Users,
  Eye,
  Bone,
  Droplets,
  Utensils,
  Pill,
  Smile,
  Dumbbell,
  Siren,
  Brain,
  Footprints,
  Shield,
  FileText,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  Sparkles,
  PhoneCall,
  Bed,
  Building2,
  Clock
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useProfile } from '@/context/role-context';
import { auth } from '@/lib/firebase/client';
import { allModules } from '@/lib/modules';
import { EmergencyContactCard } from '@/components/cards/emergency-contact-card';
import { getPersonalizedPath, PersonalizedPathResult } from '@/lib/learning-paths';
import {
  HealthRepository,
  MedicationItem,
  CareGapEvaluationResult,
  VitalRecord,
  AppointmentRecord
} from '@/lib/db/health-repository';
import { ZaritEvaluationResult, isReassessmentDue } from '@/lib/zarit-scale';
import { subscribeToReassessmentRequest, hydrateLocalCacheFromCloud } from '@/lib/firebase/clinical-sync';

// Code-split by persona: the nurse, doctor, and family views below are
// mutually exclusive (see the `role ===` branch), so a caregiver was
// downloading the whole clinician cohort dashboard — and vice versa — on
// every visit to /dashboard.
const NurseShiftDashboard = dynamic(() =>
  import('@/components/dashboard/nurse-shift-dashboard').then((m) => m.NurseShiftDashboard), {
  loading: () => <DashboardSkeleton />
});
const DoctorCohortDashboard = dynamic(() =>
  import('@/components/dashboard/doctor-cohort-dashboard').then((m) => m.DoctorCohortDashboard), {
  loading: () => <DashboardSkeleton />
});
const DailyCareLogPanel = dynamic(() =>
  import('@/components/clinical/daily-care-log-panel').then((m) => m.DailyCareLogPanel), {
  loading: () => <DashboardSkeleton />
});
const CareIntelligencePanel = dynamic(() =>
  import('@/components/clinical/care-intelligence-panel').then((m) => m.CareIntelligencePanel), {
  loading: () => <DashboardSkeleton />
});

function DashboardSkeleton() {
  return <div className="rounded-2xl border border-border/60 bg-muted/40 animate-pulse h-48" />;
}
import { EvidenceLevelBadge } from '@/components/clinical/evidence-level-badge';
import { CLINICAL_PROVENANCE } from '@/lib/clinical/provenance';
import type { CaregiverAttributes, PatientDependenceProfile } from '@/lib/clinical/care-gap-engine';

const iconMap: { [key: string]: React.ElementType } = {
  'Dementia Care': BrainCircuit,
  'Heart Failure': HeartPulse,
  'Stroke': Activity,
  'Parkinsonism Care': User,
  'Bed Bound Care': Accessibility,
  'Fall Prevention': PersonStanding,
  'Palliative Care': HeartHandshake,
  'Geriatric Rehabilitation': Recycle,
  'Geriatric Depression': Stethoscope,
  'Palliative Care Professional': Users,
  'Dementia': BrainCircuit,
  'Vision Problems': Eye,
  'Joint Problems': Bone,
  'Urinary Problems': Droplets,
  'Nutrition': Utensils,
  'Alzheimer\'s Disease': BrainCircuit,
  'Heart Disease': HeartPulse,
  'Delirium': Brain,
  'Hypertension': HeartPulse,
  'Medication Safety': Shield,
  'Oral Health': Smile,
  'Exercise': Dumbbell,
  'Constipation': Utensils,
  'Pneumonia': Siren,
  'Podogeriatrics': Footprints,
  'Clinical Nutrition': Utensils,
  'Geriatric Ophthalmology': Eye,
  'Geriatric Oral Health': Smile,
  'Rheumatic Disorders': Bone,
  'Foot Care': Footprints,
};

function getConditionMatchLabel(
  moduleId: string,
  conditionMatchTag?: string,
  patient?: PatientDependenceProfile | null
): string {
  if (conditionMatchTag) return conditionMatchTag;
  const id = moduleId.toLowerCase();
  const patientName = patient?.name || 'Patient';
  if (id.includes('hypertension')) return `Matches: ${patientName}'s Hypertension`;
  if (id.includes('alzheimer') || id.includes('dementia')) return `Matches: ${patientName}'s Dementia Care`;
  if (id.includes('bed-bound') || id.includes('bedmaking')) return `Matches: Bedbound Mobility & Ulcer Care`;
  if (id.includes('fall')) return `Matches: High Fall Risk Vigilance`;
  if (id.includes('medication')) return `Matches: Medication Safety & Beers List`;
  return 'Condition-Tailored Protocol';
}

export default function DashboardClient() {
  const { role, skillLevel, caregivingScenario, moduleProgress } = useProfile();
  const [personalizedPath, setPersonalizedPath] = useState<PersonalizedPathResult | null>(null);
  const [latestZarit, setLatestZarit] = useState<ZaritEvaluationResult | null>(null);
  const [medications, setMedications] = useState<MedicationItem[]>([]);
  const [vitals, setVitals] = useState<VitalRecord[]>([]);
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [careGap, setCareGap] = useState<CareGapEvaluationResult | null>(null);
  const [caregiver, setCaregiver] = useState<CaregiverAttributes | null>(null);
  const [patientProfile, setPatientProfile] = useState<PatientDependenceProfile | null>(null);
  const [currentUserUid, setCurrentUserUid] = useState<string>('');
  const [reassessmentRequest, setReassessmentRequest] = useState<{ requestedAt: string; requestedBy: string; status: string } | null>(null);

  useEffect(() => {
    if (!auth) return;
    const unsub = auth.onAuthStateChanged((user) => {
      setCurrentUserUid(user?.uid || '');
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!currentUserUid) return;
    const unsub = subscribeToReassessmentRequest(currentUserUid, (req) => {
      setReassessmentRequest(req);
    });

    let isMounted = true;
    void (async () => {
      try {
        await hydrateLocalCacheFromCloud(currentUserUid);
        if (isMounted) {
          const pt = HealthRepository.getPatientProfile();
          const meds = HealthRepository.getMedications();
          setPatientProfile(pt);
          setCaregiver(HealthRepository.getCaregiverAttributes());
          setMedications(meds);
          setVitals(HealthRepository.getVitals());
          setAppointments(HealthRepository.getAppointments());
          setCareGap(
            HealthRepository.hasStoredDyadProfile()
              ? HealthRepository.getCareGapEvaluation()
              : null
          );
          setPersonalizedPath(getPersonalizedPath(skillLevel, caregivingScenario, role, pt, meds));
        }
      } catch (err) {
        console.warn('Dashboard cloud hydration notice:', err);
      }
    })();

    return () => {
      isMounted = false;
      unsub();
    };
  }, [currentUserUid]);

  useEffect(() => {
    const pt = HealthRepository.getPatientProfile();
    const meds = HealthRepository.getMedications();
    setMedications(meds);
    setVitals(HealthRepository.getVitals());
    setAppointments(HealthRepository.getAppointments());
    setCaregiver(HealthRepository.getCaregiverAttributes());
    setPatientProfile(pt);

    const path = getPersonalizedPath(skillLevel, caregivingScenario, role, pt, meds);
    setPersonalizedPath(path);

    const assessments = HealthRepository.getZaritAssessments();
    if (assessments.length > 0) {
      setLatestZarit(assessments[0]);
    }

    setCareGap(
      HealthRepository.hasStoredDyadProfile()
        ? HealthRepository.getCareGapEvaluation()
        : null
    );
  }, [skillLevel, caregivingScenario, role]);

  const activeModules = allModules
    .map((mod) => ({
      ...mod,
      progress: moduleProgress[mod.id] || 0,
    }))
    .filter((mod) => mod.progress > 0)
    .sort((a, b) => b.progress - a.progress);

  // Medication Dose Math
  const totalScheduledDoses = medications.reduce((sum, m) => sum + m.timeOfDay.length, 0);
  const completedDoses = medications.reduce(
    (sum, m) => sum + (m.takenSlots?.length || (m.takenToday ? m.timeOfDay.length : 0)),
    0
  );
  const doseAdherencePercentage =
    totalScheduledDoses > 0 ? Math.round((completedDoses / totalScheduledDoses) * 100) : 0;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const latestVital = [...vitals].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  const lastVitalDate = latestVital ? new Date(latestVital.date) : null;
  const loggedVitalsToday = Boolean(lastVitalDate && lastVitalDate >= todayStart);
  const nextAppointment = appointments
    .filter((app) => new Date(app.date) >= todayStart)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
  const todayActionItems = [
    {
      href: '/medications',
      icon: Pill,
      title: totalScheduledDoses > 0 && completedDoses < totalScheduledDoses ? 'Record today\'s medicines' : 'Review medicines',
      detail:
        totalScheduledDoses > 0
          ? `${completedDoses} of ${totalScheduledDoses} doses recorded`
          : 'Add the medicines you track every day',
      status: totalScheduledDoses > 0 && completedDoses === totalScheduledDoses ? 'Done' : 'Due',
      tone: totalScheduledDoses > 0 && completedDoses === totalScheduledDoses ? 'text-emerald-700 bg-emerald-500/10 border-emerald-500/30' : 'text-amber-700 bg-amber-500/10 border-amber-500/30'
    },
    {
      href: '/vital-logs',
      icon: HeartPulse,
      title: loggedVitalsToday ? 'Vitals logged today' : 'Log today\'s vitals',
      detail: loggedVitalsToday ? 'Blood pressure, pulse, sugar, or notes are up to date' : 'Add BP, pulse, oxygen, sugar, weight, or notes',
      status: loggedVitalsToday ? 'Done' : 'Due',
      tone: loggedVitalsToday ? 'text-emerald-700 bg-emerald-500/10 border-emerald-500/30' : 'text-rose-700 bg-rose-500/10 border-rose-500/30'
    },
    {
      // Both branches route to /appointments: it hosts the scheduling form and
      // the upcoming-visit list on one page, so there is no separate booking
      // route to send the "no appointment yet" case to.
      href: '/appointments',
      icon: CalendarCheck,
      title: nextAppointment ? 'Next appointment' : 'Schedule a doctor visit',
      detail: nextAppointment
        ? `${nextAppointment.doctor} - ${new Date(nextAppointment.date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}`
        : 'Keep upcoming consultations visible to the family',
      status: nextAppointment ? 'Planned' : 'Add',
      tone: 'text-blue-700 bg-blue-500/10 border-blue-500/30'
    },
    {
      href: '/care-circle',
      icon: Users,
      title: 'Coordinate care team',
      detail: 'Assign family tasks, share updates, and keep emergency contacts close',
      status: 'Open',
      tone: 'text-sky-700 bg-sky-500/10 border-sky-500/30'
    }
  ];

  const completedActionsCount = todayActionItems.filter((item) => item.status === 'Done').length;
  const totalActionsCount = todayActionItems.length;
  const actionProgressPercent = Math.round((completedActionsCount / totalActionsCount) * 100);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Render Role-Specific Views */}
      {role === 'nurse' ? (
        <NurseShiftDashboard />
      ) : role === 'doctor' || role === 'professional' ? (
        <DoctorCohortDashboard />
      ) : (
        <>
          {reassessmentRequest && reassessmentRequest.status === 'pending' && (
            <Card className="border-amber-500 bg-amber-500/10 shadow-xs mb-6 animate-in fade-in duration-300">
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5">
                    <CalendarClock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-amber-900 dark:text-amber-300">
                      Repeat Assessment Requested by Physician
                    </h4>
                    <p className="text-xs text-amber-850 dark:text-amber-400 mt-0.5 leading-relaxed">
                      Your care team has requested a repeat Caregiver Burden Assessment to update your care plan.
                    </p>
                  </div>
                </div>
                <Link href="/stress-calculator" className="shrink-0">
                  <Button
                    size="sm"
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs"
                  >
                    Start ZBI Assessment
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* 1. Today Dashboard Command Station */}
          <Card className="border-border/80 bg-card shadow-sm overflow-hidden rounded-2xl sm:rounded-3xl border">
            <CardHeader className="border-b border-border/50 bg-gradient-to-r from-emerald-500/[0.05] via-transparent to-transparent pb-4 pt-5 px-5 sm:px-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <CardTitle className="font-headline text-lg sm:text-xl font-black tracking-tight text-foreground">
                      Today&apos;s Care Station
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-xs font-mono font-bold px-2.5 py-0.5 rounded-full',
                        completedActionsCount === totalActionsCount
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                          : 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 border-emerald-500/20'
                      )}
                    >
                      {completedActionsCount} of {totalActionsCount} Complete ({actionProgressPercent}%)
                    </Badge>
                  </div>
                  <CardDescription className="text-xs sm:text-sm text-muted-foreground">
                    Core daily bedside routines, medication administration, and safety surveillance for {patientProfile?.name || HealthRepository.getPatientProfile().name}.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button asChild variant="outline" size="sm" className="text-xs font-semibold gap-1.5 border-emerald-600/30 hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 w-full sm:w-auto h-8 shadow-xs">
                    <Link href="/domiciliary">
                      <Bed className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Bedside Companion</span>
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Action Progress Bar */}
              <div className="w-full bg-muted/60 rounded-full h-1.5 overflow-hidden mt-3.5">
                <div
                  className="bg-gradient-to-r from-emerald-600 to-teal-500 h-1.5 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${actionProgressPercent}%` }}
                />
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {todayActionItems.map((item) => {
                const Icon = item.icon;
                const isDone = item.status === 'Done';
                const isDue = item.status === 'Due';
                const isPlanned = item.status === 'Planned';

                return (
                  <Link
                    key={item.title}
                    href={item.href}
                    className="group flex items-start justify-between gap-3.5 rounded-2xl border border-border/80 bg-background/80 hover:bg-emerald-500/[0.03] hover:border-emerald-500/40 p-4 transition-all duration-200 shadow-xs hover:shadow-sm"
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors',
                        isDone
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          : isDue
                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                          : 'bg-primary/10 text-primary'
                      )}>
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <div className="min-w-0 space-y-1">
                        <h3 className="text-sm font-bold text-foreground group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {item.detail}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {isDone ? (
                        <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Done</span>
                        </span>
                      ) : isDue ? (
                        <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Due</span>
                        </span>
                      ) : isPlanned ? (
                        <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30">
                          <CalendarCheck className="w-3.5 h-3.5" />
                          <span>Planned</span>
                        </span>
                      ) : (
                        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${item.tone}`}>
                          {item.status}
                        </span>
                      )}
                      <ArrowRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:translate-x-1 transition-all hidden sm:inline-block" />
                    </div>
                  </Link>
                );
              })}
            </CardContent>
          </Card>

          <DailyCareLogPanel
            patientUid={currentUserUid || undefined}
            patientName={HealthRepository.getPatientProfile().name}
            mode="readonly"
            title="Family Daily Update"
          />

          <CareIntelligencePanel
            patientUid={currentUserUid || undefined}
            patientName={patientProfile?.name || HealthRepository.getPatientProfile().name}
            latestZarit={latestZarit}
            careGap={careGap}
            caregiver={caregiver}
            patient={patientProfile}
            vitals={vitals}
            mode="family"
          />

          {/* 2. Quick KPI Cards Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Zarit Burden Gauge Metric */}
            <Link href="/stress-calculator" className="group">
              <Card className="border-border/80 bg-card hover:border-emerald-500/50 hover:shadow-md transition-all h-full rounded-2xl">
                <CardContent className="p-4 sm:p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase font-bold text-muted-foreground tracking-wider">
                      Stress Check
                    </span>
                    <HeartPulse className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    {latestZarit ? (
                      <>
                        <span className="text-2xl font-black text-foreground">
                          {latestZarit.totalScore ?? 0}
                        </span>
                        <span className="text-xs text-muted-foreground font-mono">/ {latestZarit.maxScore ?? 88}</span>
                        <Badge variant={latestZarit.severityBand === 'critical_red' ? 'destructive' : 'secondary'} className="text-xs ml-auto font-mono font-bold">
                          {latestZarit.normalizedPercentage ?? 0}%
                        </Badge>
                      </>
                    ) : (
                      <span className="text-sm font-bold text-primary">Take Check</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {latestZarit
                      ? (typeof latestZarit.classification === 'string'
                          ? latestZarit.classification
                          : (latestZarit.classification?.en || 'Burden Assessment'))
                      : 'Establish clinical baseline'}
                  </p>
                  <div className="pt-1 flex items-center justify-between">
                    <EvidenceLevelBadge provenance={CLINICAL_PROVENANCE.zaritScore} className="w-fit" />
                    {latestZarit && isReassessmentDue(latestZarit) && (
                      <Badge variant="outline" className="text-[10px] font-bold text-amber-600 border-amber-500/40">
                        Due again
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Medication Schedule Metric */}
            <Link href="/medications" className="group">
              <Card className="border-border/80 bg-card hover:border-emerald-500/50 hover:shadow-md transition-all h-full rounded-2xl">
                <CardContent className="p-4 sm:p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase font-bold text-muted-foreground tracking-wider">
                      Medicines & Beers
                    </span>
                    <Pill className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-foreground">
                      {completedDoses} / {totalScheduledDoses}
                    </span>
                    <span className="text-xs text-muted-foreground font-semibold">Doses Taken</span>
                    <Badge variant="outline" className="text-xs ml-auto font-mono font-bold text-emerald-700 dark:text-emerald-300 border-emerald-500/40 bg-emerald-500/10">
                      {doseAdherencePercentage}%
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {medications.length} active medicine{medications.length === 1 ? '' : 's'} tracked
                  </p>
                  <div className="pt-1">
                    <EvidenceLevelBadge provenance={CLINICAL_PROVENANCE.beersStoppScreen} className="w-fit" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Care Gap Metric */}
            <Link href="/settings" className="group">
              <Card className="border-border/80 bg-card hover:border-emerald-500/50 hover:shadow-md transition-all h-full rounded-2xl">
                <CardContent className="p-4 sm:p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase font-bold text-muted-foreground tracking-wider">
                      Care Support Gap
                    </span>
                    <Activity className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-2xl font-black ${careGap && careGap.netCareGapHours > 2 ? 'text-rose-600' : 'text-foreground'}`}>
                      {careGap ? (careGap.netCareGapHours > 0 ? `+${careGap.netCareGapHours}h` : '0h') : 'Setup'}
                    </span>
                    <span className="text-xs text-muted-foreground font-semibold">Estimate</span>
                    <Badge variant={careGap && careGap.netCareGapHours > 2 ? 'destructive' : 'outline'} className="text-xs ml-auto uppercase font-bold">
                      {careGap ? careGap.careGapSeverity.replace('_', ' ') : 'Needed'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {careGap
                      ? `Demand: ${careGap.patientCareDemandHours}h vs Cap: ${careGap.caregiverSafeCapacityHours}h`
                      : 'Complete patient and caregiver setup first'}
                  </p>
                  <div className="pt-1">
                    <EvidenceLevelBadge provenance={CLINICAL_PROVENANCE.careGapHeuristic} className="w-fit" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Government Telemedicine Hub */}
            <Link href="/sehat-opd" className="group">
              <Card className="border-border/80 bg-card hover:border-emerald-500/50 hover:shadow-md transition-all h-full rounded-2xl">
                <CardContent className="p-4 sm:p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase font-bold text-muted-foreground tracking-wider">
                      Doctor Visits
                    </span>
                    <Building2 className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-black text-foreground">
                      Online OPD
                    </span>
                    <Badge variant="outline" className="text-xs ml-auto font-mono text-emerald-700 dark:text-emerald-300 border-emerald-500/40 bg-emerald-500/10">
                      SEHAT
                    </Badge>
                  </div>
                  <p className="text-xs text-primary font-semibold flex items-center gap-1 pt-1">
                    <span>Tele-consultation options</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>

      {/* 2. Main 2-Column Grid */}
      <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-3">
        {/* Left Column: Recommendations & Learning Path */}
        <div className="lg:col-span-2 space-y-6 sm:space-y-8">
          {/* Crisis Escalation Banner if Triggered */}
          {personalizedPath?.crisisEscalationRequired && (
            <Card className="border-rose-500/60 bg-rose-500/10 shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold text-rose-900 dark:text-rose-200 flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-rose-600 animate-pulse" />
                    Urgent Stress Support
                  </CardTitle>
                  <Badge variant="destructive" className="text-xs uppercase font-mono">
                    Urgent
                  </Badge>
                </div>
                <CardDescription className="text-xs text-rose-900/80 dark:text-rose-300">
                  Your recent check suggests high strain. Please use support now.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-1 text-xs">
                {personalizedPath.crisisTriggers.map((t, i) => (
                  <p key={i} className="font-semibold text-rose-800 dark:text-rose-300">
                    • {t}
                  </p>
                ))}
                  <Button asChild size="sm" className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs gap-1.5 h-8">
                    <a href="tel:14416">
                      <PhoneCall className="w-3.5 h-3.5" /> Call Tele-MANAS (14416)
                    </a>
                  </Button>
                  <Button asChild size="sm" variant="outline" className="border-rose-500/40 text-rose-700 dark:text-rose-300 font-bold text-xs gap-1.5 h-8 bg-background">
                    <a href="tel:14567">
                      <PhoneCall className="w-3.5 h-3.5" /> Elder Line (14567)
                    </a>
                  </Button>
              </CardContent>
            </Card>
          )}

          {/* Domiciliary Bedside Companion & JIT Emergency Access Card */}
          <Card className="border-primary/30 bg-primary/5 shadow-xs overflow-hidden">
            <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0 mt-0.5">
                  <Bed className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs font-bold uppercase tracking-wider text-primary border-primary/30">
                  Bedside Care
                    </Badge>
                    <span className="text-xs font-mono text-muted-foreground">2-hour turn timer</span>
                  </div>
                  <h3 className="font-bold text-sm sm:text-base text-foreground">
                    Daily Routine & Emergency Cards
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-xl leading-relaxed">
                    Bedside checklist, turning countdown, emergency cards, and a 14-day post-discharge plan.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <Button asChild size="sm" className="font-bold text-xs gap-1.5 shadow-xs">
                  <Link href="/domiciliary">
                    <span>Open Bedside Care</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Clinical Learning & Recommendations */}
          <Card className="border-border/80 bg-card shadow-sm overflow-hidden rounded-2xl sm:rounded-3xl border">
            <CardHeader className="border-b border-border/50 bg-gradient-to-r from-emerald-500/[0.04] via-transparent to-transparent pb-4 pt-5 px-5 sm:px-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="font-headline text-lg sm:text-xl font-black tracking-tight text-foreground">
                        Personalized Care Curriculum
                      </CardTitle>
                      <Badge variant="outline" className="text-xs font-mono font-bold border-emerald-500/30 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10">
                        Condition-Matched
                      </Badge>
                    </div>
                    <CardDescription className="text-xs sm:text-sm text-muted-foreground">
                      Clinically aligned for <strong>{caregivingScenario}</strong> &bull; Tailored to {patientProfile?.name || 'your care recipient'}&apos;s diagnoses &amp; mobility.
                    </CardDescription>
                  </div>
                </div>
                <Button asChild variant="outline" size="sm" className="text-xs font-semibold gap-1.5 border-emerald-600/30 hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 shrink-0 h-8 shadow-xs">
                  <Link href="/modules">
                    <BookOpenCheck className="w-3.5 h-3.5" />
                    <span>All Lessons</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </Button>
              </div>
              {personalizedPath?.reasoning && (
                <p className="text-xs text-muted-foreground pt-2.5 leading-relaxed">
                  {personalizedPath.reasoning}
                </p>
              )}
            </CardHeader>

            <CardContent className="space-y-3 p-4 sm:p-5">
              <div className="grid gap-3">
                {personalizedPath?.suggestedModules.map((module) => {
                  const Icon = iconMap[module.category] || BookOpenCheck;
                  const progress = moduleProgress[module.id] || 0;
                  const matchLabel = module.conditionMatchTag || getConditionMatchLabel(module.id, module.conditionMatchTag, patientProfile);

                  return (
                    <Link
                      key={module.id}
                      href={`/modules/${module.id}`}
                      className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-border/80 bg-background/70 hover:bg-emerald-500/[0.03] hover:border-emerald-500/40 hover:shadow-md transition-all duration-200 gap-3.5"
                    >
                      <div className="flex items-start gap-3.5 min-w-0">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors mt-0.5 shadow-xs">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-sm text-foreground group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
                              {module.title}
                            </h3>
                            <Badge variant="outline" className="text-[10px] font-bold border-emerald-500/30 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10">
                              {matchLabel}
                            </Badge>
                            {module.urgency === 'critical' && (
                              <Badge variant="destructive" className="text-[10px] font-bold">
                                Priority
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1 leading-relaxed">
                            {module.description}
                          </p>
                          {module.clinicalRationale && module.clinicalRationale.length > 0 && (
                            <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                              &bull; {module.clinicalRationale[0]}
                            </p>
                          )}
                          {progress > 0 && (
                            <div className="pt-1 w-full max-w-xs space-y-1">
                              <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                                <span>Progress</span>
                                <span className="text-emerald-600 font-bold">{progress}%</span>
                              </div>
                              <Progress value={progress} className="h-1 bg-muted" />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 shrink-0 self-end sm:self-center">
                        <span className="text-xs font-mono font-bold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full border border-border/60">
                          {module.matchScore}% Match
                        </span>
                        <ArrowRight className="h-4 w-4 text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Micro-Actions & Prescriptions */}
          {personalizedPath?.prescriptions && personalizedPath.prescriptions.length > 0 && (
            <Card className="border-border bg-card shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Suggested Care Actions
                </CardTitle>
                <CardDescription className="text-xs">
                  Small next steps from your care profile and recent logs.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {personalizedPath.prescriptions.map((rx) => (
                  <div
                    key={rx.id}
                    className="p-3.5 rounded-xl border border-border/80 bg-muted/20 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-foreground">{rx.title}</span>
                      <Badge variant="outline" className="text-xs capitalize">
                        {rx.category}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{rx.action}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Emergency Card, Quick Links & Progress */}
        <div className="space-y-6">
          {/* National Emergency Services */}
          <EmergencyContactCard />

          {/* Care Operations Hub */}
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">Quick Links</CardTitle>
              <CardDescription className="text-sm">Common care tools.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2.5">
              <Link href="/stress-calculator" className="p-3 rounded-xl border border-border bg-background hover:border-primary/40 transition-all space-y-1">
                <HeartPulse className="w-4 h-4 text-rose-500" />
                <p className="font-bold text-sm text-foreground">Stress Check</p>
                <p className="text-xs text-muted-foreground">Caregiver fatigue</p>
              </Link>

              <Link href="/medications" className="p-3 rounded-xl border border-border bg-background hover:border-primary/40 transition-all space-y-1">
                <Pill className="w-4 h-4 text-amber-500" />
                <p className="font-bold text-sm text-foreground">Medicines</p>
                <p className="text-xs text-muted-foreground">Schedule & alerts</p>
              </Link>

              <Link href="/care-circle" className="p-3 rounded-xl border border-border bg-background hover:border-primary/40 transition-all space-y-1">
                <Users className="w-4 h-4 text-blue-500" />
                <p className="font-bold text-sm text-foreground">Care Team</p>
                <p className="text-xs text-muted-foreground">Share tasks</p>
              </Link>

              <Link href="/reports" className="p-3 rounded-xl border border-border bg-background hover:border-primary/40 transition-all space-y-1">
                <FileText className="w-4 h-4 text-emerald-500" />
                <p className="font-bold text-sm text-foreground">Visit Notes</p>
                <p className="text-xs text-muted-foreground">Print summary</p>
              </Link>
            </CardContent>
          </Card>

          {/* Active Modules in Progress */}
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">Modules In Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeModules.length > 0 ? (
                activeModules.slice(0, 3).map((mod) => (
                  <Link key={mod.id} href={`/modules/${mod.id}`} className="block space-y-1.5 p-2 rounded-lg hover:bg-muted/40 transition-colors">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="truncate">{mod.title}</span>
                      <span className="font-mono text-primary">{mod.progress}%</span>
                    </div>
                    <Progress value={mod.progress} className="h-1.5" />
                  </Link>
                ))
              ) : (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No modules in progress. Tap any recommended module to begin learning!
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      </>
      )}
    </div>
  );
}
