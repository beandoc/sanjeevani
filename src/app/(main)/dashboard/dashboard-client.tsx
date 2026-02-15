
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
} from 'lucide-react';
import Link from 'next/link';
import { useProfile } from '@/context/role-context';
import { allModules } from '@/lib/modules';
import { EmergencyContactCard } from '@/components/cards/emergency-contact-card';
import { getPersonalizedPath } from '@/lib/learning-paths';


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

type PersonalizedPathOutput = {
  suggestedModules: (typeof allModules[0] & { focusArea: string })[];
  reasoning: string;
}

export default function DashboardClient() {
  const { role, skillLevel, caregivingScenario, moduleProgress } = useProfile();
  const [personalizedPath, setPersonalizedPath] = useState<PersonalizedPathOutput | null>(null);

  useEffect(() => {
    const path = getPersonalizedPath(skillLevel, caregivingScenario);
    setPersonalizedPath(path);
  }, [skillLevel, caregivingScenario, role]);

  const activeModules = allModules
    .map(mod => ({
      ...mod,
      progress: moduleProgress[mod.id] || 0,
    }))
    .filter(mod => mod.progress > 0)
    .sort((a, b) => b.progress - a.progress);

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      {/* Personalized Path */}
      <Card
        className="lg:col-span-2 border-none shadow-xl bg-card/50 backdrop-blur-sm overflow-hidden animate-fade-in"
        style={{ animationDelay: '0.1s' }}
      >
        <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="font-headline text-2xl tracking-tight">Personalized Learning Path</CardTitle>
            <div className="bg-primary/10 p-2 rounded-full">
              <BookOpenCheck className="h-5 w-5 text-primary" />
            </div>
          </div>
          <CardDescription className="text-base leading-relaxed">
            {personalizedPath?.reasoning || 'Analyzing your profiles to curate the best learning journey...'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {!personalizedPath?.suggestedModules.length && (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-3 bg-secondary/20 rounded-2xl border border-dashed border-border">
              <Brain className="h-10 w-10 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground max-w-xs">
                Select your learning profile in settings to see personalized modules tailored for you.
              </p>
              <Button variant="secondary" size="sm" asChild>
                <Link href="/settings">Update Settings</Link>
              </Button>
            </div>
          )}

          <div className="grid gap-4">
            {personalizedPath?.suggestedModules.map((module, index) => {
              const Icon = iconMap[module.category] || BookOpenCheck;
              return (
                <Link
                  key={module.id}
                  href={`/modules/${module.id}`}
                  className="group flex items-center gap-4 rounded-2xl border border-transparent bg-white dark:bg-slate-900 p-5 shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:-translate-y-1 animate-slide-up"
                  style={{ animationDelay: `${0.2 + (index * 0.1)}s` }}
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 transition-colors group-hover:bg-primary/10">
                    <Icon className="h-7 w-7 text-slate-600 dark:text-slate-400 group-hover:text-primary transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg group-hover:text-primary transition-colors truncate">
                      {module.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {module.description}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                        {module.category}
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 translate-x-0 opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100 text-primary" />
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Sidebar Cards */}
      <div className="space-y-8">
        <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <EmergencyContactCard />
        </div>

        {/* Active Modules */}
        <Card
          className="border-none shadow-xl bg-card/50 backdrop-blur-sm animate-fade-in"
          style={{ animationDelay: '0.4s' }}
        >
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <CardTitle className="font-headline text-xl">In Progress</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {activeModules.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center bg-secondary/20 rounded-xl">
                <p className="text-sm text-muted-foreground">No modules in progress yet.</p>
                <Link href="/modules" className="text-xs text-primary font-semibold mt-1 hover:underline">
                  Browse Modules
                </Link>
              </div>
            ) : (
              activeModules.map((mod) => {
                const Icon = iconMap[mod.category] || BookOpenCheck;
                return (
                  <div key={mod.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 truncate">
                        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-sm font-semibold truncate">{mod.title}</span>
                      </div>
                      <span className="text-xs font-bold text-primary">{mod.progress}%</span>
                    </div>
                    <Progress value={mod.progress} className="h-1.5" />
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Practice Scenarios */}
        <Card
          className="relative overflow-hidden border-none shadow-2xl bg-slate-900 p-1 animate-fade-in"
          style={{ animationDelay: '0.5s' }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-blue-600/40 animate-gradient" />
          <div className="relative z-10 bg-slate-900/90 rounded-[calc(var(--radius)-4px)]">
            <CardHeader className="pb-4 text-white">
              <CardTitle className="font-headline text-xl">Practice Lab</CardTitle>
              <CardDescription className="text-slate-400">
                Interactive simulations to sharpen your skills in safe environment.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <Button variant="default" className="w-full bg-white text-slate-950 hover:bg-slate-200 shadow-lg shadow-white/5" asChild>
                <Link href="/simulations" className="font-bold">
                  Enter Simulation Lab <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </div>
        </Card>
      </div>
    </div>
  );
}
