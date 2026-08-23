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
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { useProfile } from '@/context/role-context';
import { allModules } from '@/lib/modules';
import { EmergencyContactCard } from '@/components/cards/emergency-contact-card';
import { getPersonalizedPath, PersonalizedPathResult } from '@/lib/learning-paths';
import { HealthRepository } from '@/lib/db/health-repository';
import { ZaritEvaluationResult } from '@/lib/zarit-scale';

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
  const { role, skillLevel, caregivingScenario, moduleProgress } = useProfile();
  const [personalizedPath, setPersonalizedPath] = useState<PersonalizedPathResult | null>(null);
  const [latestZarit, setLatestZarit] = useState<ZaritEvaluationResult | null>(null);

  useEffect(() => {
    const path = getPersonalizedPath(skillLevel, caregivingScenario, role);
    setPersonalizedPath(path);

    const assessments = HealthRepository.getZaritAssessments();
    if (assessments.length > 0) {
      setLatestZarit(assessments[0]);
    }
  }, [skillLevel, caregivingScenario, role]);

  const activeModules = allModules
    .map(mod => ({
      ...mod,
      progress: moduleProgress[mod.id] || 0,
    }))
    .filter(mod => mod.progress > 0)
    .sort((a, b) => b.progress - a.progress);

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 max-w-7xl mx-auto">
      {/* Main Column: Deterministic Clinical Recommendations & Prescriptions */}
      <div className="lg:col-span-2 space-y-8">
        {/* Clinical Recommendations Engine Card */}
        <Card className="border-border bg-card/80 shadow-md overflow-hidden">
          <CardHeader className="border-b border-border/60 bg-muted/20 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="font-headline text-xl">Clinical Decision & Learning Path</CardTitle>
                  <CardDescription className="text-xs">
                    Deterministic rules engine matched to {caregivingScenario} ({skillLevel} level).
                  </CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono border-primary/30 text-primary">
                Rules Engine Active
              </Badge>
            </div>
            {personalizedPath?.reasoning && (
              <p className="text-xs text-muted-foreground pt-2 leading-relaxed">
                {personalizedPath.reasoning}
              </p>
            )}
          </CardHeader>

          <CardContent className="space-y-4 pt-4">
            <div className="grid gap-3">
              {personalizedPath?.suggestedModules.map((module) => {
                const Icon = iconMap[module.category] || BookOpenCheck;
                return (
                  <Link
                    key={module.id}
                    href={`/modules/${module.id}`}
                    className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-border/70 bg-background hover:border-primary/40 hover:shadow-md transition-all gap-3"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors mt-0.5">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                            {module.title}
                          </h3>
                          <Badge variant="secondary" className="text-[10px]">
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

        {/* Clinical Prescriptions / Micro-actions */}
        {personalizedPath?.prescriptions && personalizedPath.prescriptions.length > 0 && (
          <Card className="border-border bg-card/60 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Tailored Caregiver Micro-Actions
              </CardTitle>
              <CardDescription className="text-xs">
                Clinical recommendations generated from your recent health logs and psychometric indices.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {personalizedPath.prescriptions.map((rx) => (
                <div
                  key={rx.id}
                  className="p-3.5 rounded-xl border border-border/80 bg-background/90 space-y-1"
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

      {/* Right Column: Emergency Card, Quick Links & Active Progress */}
      <div className="space-y-6">
        {/* National Emergency Card */}
        <EmergencyContactCard />

        {/* Quick Hub Navigator */}
        <Card className="border-border bg-card/80 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">Care Operations Hub</CardTitle>
            <CardDescription className="text-xs">Quick access to essential modules.</CardDescription>
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
              <p className="text-[10px] text-muted-foreground">Schedule & safety alerts</p>
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
        <Card className="border-border bg-card/60 shadow-sm">
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
                No active modules. Start exploring from the recommendations above!
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
