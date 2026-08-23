'use client';

import { useState, useEffect } from 'react';
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
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  PhoneCall,
  Bed,
  Compass,
  UserCheck,
  Building2
} from 'lucide-react';
import Link from 'next/link';
import { useProfile, Role } from '@/context/role-context';
import { allModules } from '@/lib/modules';
import { EmergencyContactCard } from '@/components/cards/emergency-contact-card';
import { getPersonalizedPath, PersonalizedPathResult } from '@/lib/learning-paths';
import { HealthRepository, MedicationItem, CareGapEvaluationResult } from '@/lib/db/health-repository';
import { ZaritEvaluationResult } from '@/lib/zarit-scale';
import { NurseShiftDashboard } from '@/components/dashboard/nurse-shift-dashboard';
import { DoctorCohortDashboard } from '@/components/dashboard/doctor-cohort-dashboard';

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

export default function DashboardClient() {
  const { role, setRole, skillLevel, caregivingScenario, moduleProgress } = useProfile();
  const [personalizedPath, setPersonalizedPath] = useState<PersonalizedPathResult | null>(null);
  const [latestZarit, setLatestZarit] = useState<ZaritEvaluationResult | null>(null);
  const [medications, setMedications] = useState<MedicationItem[]>([]);
  const [careGap, setCareGap] = useState<CareGapEvaluationResult | null>(null);

  useEffect(() => {
    const path = getPersonalizedPath(skillLevel, caregivingScenario, role);
    setPersonalizedPath(path);

    const assessments = HealthRepository.getZaritAssessments();
    if (assessments.length > 0) {
      setLatestZarit(assessments[0]);
    }

    const meds = HealthRepository.getMedications();
    setMedications(meds);

    const gap = HealthRepository.getCareGapEvaluation();
    setCareGap(gap);
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

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Role Switcher & Onboarding Bridge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-muted/40 rounded-2xl border border-border/60">
        <div className="flex items-center gap-1.5 p-1 bg-background rounded-xl border border-border/60">
          <button
            type="button"
            onClick={() => setRole('caregiver')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              role === 'caregiver'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <HeartPulse className="w-3.5 h-3.5" />
            <span>Family Caregiver</span>
          </button>
          <button
            type="button"
            onClick={() => setRole('nurse')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              role === 'nurse'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Nurse / Attendant</span>
          </button>
          <button
            type="button"
            onClick={() => setRole('doctor')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              role === 'doctor' || role === 'professional'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>Doctor / OPD</span>
          </button>
        </div>

        <Link href="/onboarding">
          <Button variant="ghost" size="sm" className="h-8 text-xs font-semibold gap-1 text-primary hover:bg-primary/10">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Intake & Dyad Setup Wizard</span>
          </Button>
        </Link>
      </div>

      {/* Render Role-Specific Views */}
      {role === 'nurse' ? (
        <NurseShiftDashboard />
      ) : role === 'doctor' || role === 'professional' ? (
        <DoctorCohortDashboard />
      ) : (
        <>
      {/* 1. Quick KPI Cards Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Zarit Burden Gauge Metric */}
        <Link href="/stress-calculator" className="group">
          <Card className="border-border bg-card hover:border-primary/50 hover:shadow-md transition-all h-full">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                  Burden & Stress Gauge
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
                    <Badge variant={latestZarit.severityBand === 'critical_red' ? 'destructive' : 'secondary'} className="text-[10px] ml-auto font-mono">
                      {latestZarit.normalizedPercentage ?? 0}%
                    </Badge>
                  </>
                ) : (
                  <span className="text-sm font-bold text-primary">Take Assessment →</span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground truncate">
                {latestZarit
                  ? (typeof latestZarit.classification === 'string'
                      ? latestZarit.classification
                      : (latestZarit.classification?.en || 'Burden Assessment'))
                  : 'Establish clinical baseline'}
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Medication Schedule Metric */}
        <Link href="/medications" className="group">
          <Card className="border-border bg-card hover:border-primary/50 hover:shadow-md transition-all h-full">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                  Today&apos;s Doses
                </span>
                <Pill className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-foreground">
                  {completedDoses} / {totalScheduledDoses}
                </span>
                <span className="text-xs text-muted-foreground font-semibold">Doses Taken</span>
                <Badge variant="outline" className="text-[10px] ml-auto font-mono">
                  {totalScheduledDoses > 0 ? Math.round((completedDoses / totalScheduledDoses) * 100) : 0}%
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground truncate">
                {medications.length} active prescriptions tracked
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Care Gap Metric */}
        <Link href="/settings" className="group">
          <Card className="border-border bg-card hover:border-primary/50 hover:shadow-md transition-all h-full">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                  Care Gap Deficit
                </span>
                <Activity className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-black ${careGap && careGap.netCareGapHours > 2 ? 'text-rose-600' : 'text-foreground'}`}>
                  {careGap ? (careGap.netCareGapHours > 0 ? `+${careGap.netCareGapHours}h` : '0h') : '0h'}
                </span>
                <span className="text-xs text-muted-foreground font-semibold">Deficit / Day</span>
                <Badge variant={careGap && careGap.netCareGapHours > 2 ? 'destructive' : 'outline'} className="text-[10px] ml-auto uppercase">
                  {careGap ? careGap.careGapSeverity.replace('_', ' ') : 'Balanced'}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground truncate">
                Demand: {careGap?.patientCareDemandHours || 0}h vs Cap: {careGap?.caregiverSafeCapacityHours || 0}h
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Government Telemedicine Hub */}
        <Link href="/sehat-opd" className="group">
          <Card className="border-border bg-card hover:border-primary/50 hover:shadow-md transition-all h-full">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                  Govt Teleconsultation
                </span>
                <Building2 className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-base font-bold text-foreground">
                  eSanjeevani & SeHAT
                </span>
              </div>
              <p className="text-[11px] text-primary font-semibold flex items-center gap-1">
                <span>Free Online OPD</span>
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
                    Caregiver Crisis Escalation Notice
                  </CardTitle>
                  <Badge variant="destructive" className="text-xs uppercase font-mono">
                    Urgent
                  </Badge>
                </div>
                <CardDescription className="text-xs text-rose-900/80 dark:text-rose-300">
                  Critical strain markers detected on your recent evaluation. Please access support immediately.
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
                    <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider text-primary border-primary/30">
                      Real-Time Bedside Companion
                    </Badge>
                    <span className="text-xs font-mono text-muted-foreground">• Q2H Turning Clock Active</span>
                  </div>
                  <h3 className="font-bold text-sm sm:text-base text-foreground">
                    Home Care Daily Routine & JIT Emergency Action Cards
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-xl leading-relaxed">
                    Live bedside checklist, 2-hourly turning countdown, emergency flash protocols (choking/delirium), and 14-day post-discharge roadmap.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <Button asChild size="sm" className="font-bold text-xs gap-1.5 shadow-xs">
                  <Link href="/domiciliary">
                    <span>Open Bedside Hub</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Clinical Learning & Recommendations */}
          <Card className="border-border bg-card shadow-sm overflow-hidden">
            <CardHeader className="border-b border-border/40 bg-muted/20 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="font-headline text-lg sm:text-xl">Clinical Learning Path</CardTitle>
                    <CardDescription className="text-xs">
                      Deterministic recommendations calibrated for <strong>{caregivingScenario}</strong> ({skillLevel} level).
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono border-primary/30 text-primary hidden sm:inline-flex">
                  Rules Engine Active
                </Badge>
              </div>
              {personalizedPath?.reasoning && (
                <p className="text-xs text-muted-foreground pt-2 leading-relaxed">
                  {personalizedPath.reasoning}
                </p>
              )}
            </CardHeader>

            <CardContent className="space-y-3 pt-4">
              <div className="grid gap-3">
                {personalizedPath?.suggestedModules.map((module) => {
                  const Icon = iconMap[module.category] || BookOpenCheck;
                  return (
                    <Link
                      key={module.id}
                      href={`/modules/${module.id}`}
                      className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-border/70 bg-card hover:border-primary/40 hover:shadow-md transition-all gap-3"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors mt-0.5">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                              {module.title}
                            </h3>
                            <Badge variant="secondary" className="text-[10px] capitalize">
                              {module.category}
                            </Badge>
                            {module.urgency === 'critical' && (
                              <Badge variant="destructive" className="text-[10px]">
                                Priority
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {module.description}
                          </p>
                          {module.clinicalRationale && module.clinicalRationale.length > 0 && (
                            <p className="text-[11px] text-primary/90 font-medium">
                              💡 {module.clinicalRationale[0]}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 shrink-0">
                        <span className="text-xs font-mono font-bold text-muted-foreground">
                          {module.matchScore}% Match
                        </span>
                        <ArrowRight className="h-4 w-4 text-primary group-hover:translate-x-1 transition-transform" />
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
                  Tailored Caregiver Micro-Actions
                </CardTitle>
                <CardDescription className="text-xs">
                  Clinical action steps derived from your recent health logs and psychometrics.
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
                      <Badge variant="outline" className="text-[10px] capitalize">
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
              <CardTitle className="text-base font-bold">Care Operations Hub</CardTitle>
              <CardDescription className="text-xs">Essential clinical tools.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2.5">
              <Link href="/stress-calculator" className="p-3 rounded-xl border border-border bg-background hover:border-primary/40 transition-all space-y-1">
                <HeartPulse className="w-4 h-4 text-rose-500" />
                <p className="font-bold text-xs text-foreground">Zarit Burden Scale</p>
                <p className="text-[10px] text-muted-foreground">Stress & fatigue gauge</p>
              </Link>

              <Link href="/medications" className="p-3 rounded-xl border border-border bg-background hover:border-primary/40 transition-all space-y-1">
                <Pill className="w-4 h-4 text-amber-500" />
                <p className="font-bold text-xs text-foreground">Medications</p>
                <p className="text-[10px] text-muted-foreground">Schedule & Beers alerts</p>
              </Link>

              <Link href="/care-circle" className="p-3 rounded-xl border border-border bg-background hover:border-primary/40 transition-all space-y-1">
                <Users className="w-4 h-4 text-blue-500" />
                <p className="font-bold text-xs text-foreground">Care Circle</p>
                <p className="text-[10px] text-muted-foreground">Share vitals & tasks</p>
              </Link>

              <Link href="/reports" className="p-3 rounded-xl border border-border bg-background hover:border-primary/40 transition-all space-y-1">
                <FileText className="w-4 h-4 text-emerald-500" />
                <p className="font-bold text-xs text-foreground">Clinical Brief</p>
                <p className="text-[10px] text-muted-foreground">Export PDF for OPD</p>
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
