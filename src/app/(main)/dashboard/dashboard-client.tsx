
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
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { useProfile } from '@/context/role-context';
import {
  generatePersonalizedPath,
  type PersonalizedPathOutput,
  type ModulePerformance,
} from '@/ai/flows/personalized-learning-path';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const iconMap: { [key: string]: React.ElementType } = {
  'Dementia Care': BrainCircuit,
  'Heart Failure': HeartPulse,
  Stroke: Activity,
  'Parkinsonism Care': User,
  'Kidney Failure': ShieldAlert,
  'Bed Bound Care': Accessibility,
  'Fall Prevention': PersonStanding,
  'Palliative Care': HeartHandshake,
  'Geriatric Rehabilitation': Recycle,
  'Geriatric Depression': Stethoscope,
  'Palliative Care Professional': Users,
  'Dementia': BrainCircuit,
};

const initialActiveModules = [
  { title: 'Dementia Care', progress: 0, topic: 'Dementia Care' },
  { title: 'Heart Failure Management', progress: 0, topic: 'Heart Failure' },
  { title: 'Stroke Rehabilitation', progress: 0, topic: 'Stroke' },
];

// Dummy performance data
const performanceHistory: ModulePerformance[] = [
    { moduleId: 'fall-prevention', score: 75, timeSpent: 30 },
    { moduleId: 'dementia-care', score: 88, timeSpent: 45 },
];


export default function DashboardClient() {
  const { role, skillLevel, caregivingScenario } = useProfile();
  const [personalizedPath, setPersonalizedPath] = useState<PersonalizedPathOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeModules, setActiveModules] = useState(initialActiveModules);

  useEffect(() => {
    // Simulate dynamic progress by randomizing it on mount
    const randomizedModules = initialActiveModules.map(mod => ({
      ...mod,
      progress: Math.floor(Math.random() * 81) + 10, // Random progress between 10 and 90
    }));
    setActiveModules(randomizedModules);
  }, []);

  useEffect(() => {
    async function getPath() {
      setIsLoading(true);
      setError(null);
      try {
        const path = await generatePersonalizedPath({
          skillLevel,
          performanceHistory,
          caregivingScenario,
        });
        setPersonalizedPath(path);
      } catch (err) {
        console.error(err);
        setError('There was an error fetching your personalized learning path. Please try again later.');
      }
      setIsLoading(false);
    }
    getPath();
  }, [skillLevel, caregivingScenario, role]);


  return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-headline text-2xl">Personalized Learning Path</CardTitle>
                <BookOpenCheck className="h-6 w-6 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading && (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="ml-4 text-muted-foreground">Generating your learning path...</p>
                </div>
              )}
              {error && (
                 <Alert variant="destructive">
                    <ShieldAlert className="h-4 w-4" />
                    <AlertTitle>Could not load learning path</AlertTitle>
                    <AlertDescription>
                        {error}
                    </AlertDescription>
                </Alert>
              )}
              {!isLoading && !error && personalizedPath?.suggestedModules.map((module) => {
                  const Icon = iconMap[module.topic] || BookOpenCheck;
                  return (
                    <div
                      key={module.moduleId}
                      className="flex items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-secondary/50"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{module.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {module.description}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {module.estimatedDuration} min
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/modules/${module.moduleId}`}>
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  );
                })}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-headline text-2xl">Active Modules</CardTitle>
                <CardDescription>Continue where you left off.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {activeModules.map((mod) => {
                  const Icon = iconMap[mod.topic];
                  return (
                    <div key={mod.title}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
                          <span className="font-medium">{mod.title}</span>
                        </div>
                        <span className="text-muted-foreground">{mod.progress}%</span>
                      </div>
                      <Progress value={mod.progress} />
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-primary to-blue-600 text-primary-foreground">
              <CardHeader>
                <CardTitle className="font-headline text-2xl">Practice Scenarios</CardTitle>
                <CardDescription className="text-primary-foreground/80">
                  Hone your skills with real-world simulations.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="secondary" className="w-full" asChild>
                  <Link href="/simulations">
                    Start a Simulation <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
  );
}
