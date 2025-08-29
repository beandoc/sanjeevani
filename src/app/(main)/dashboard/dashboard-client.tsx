
'use client';

import { useEffect, useState } from 'react';
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
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import type { PersonalizedPathOutput } from '@/ai/flows/personalized-learning-path';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslations, AbstractIntlMessages } from 'next-intl';

const iconMap: { [key: string]: React.ElementType } = {
  Dementia: BrainCircuit,
  'Heart Failure': HeartPulse,
  Stroke: Activity,
  Parkinsonism: User,
  'Kidney Failure': ShieldAlert,
  'Bed Bound': Accessibility,
};

const modules = [
  { title: 'Dementia Care', progress: 75, topic: 'Dementia' },
  { title: 'Heart Failure Management', progress: 40, topic: 'Heart Failure' },
  { title: 'Stroke Rehabilitation', progress: 10, topic: 'Stroke' },
];

function PersonalizedPathSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(2)].map((_, i) => (
        <div key={i} className="flex items-start gap-4 rounded-lg border p-4">
          <Skeleton className="h-12 w-12 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DashboardClient({messages}: {messages: AbstractIntlMessages}) {
  const t = useTranslations('DashboardPage');
  const [personalizedPath, setPersonalizedPath] = useState<PersonalizedPathOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchPersonalizedPath() {
      try {
        const response = await fetch('/api/personalized-path');
        if (!response.ok) {
          throw new Error('Failed to fetch personalized path');
        }
        const data = await response.json();
        setPersonalizedPath(data);
      } catch (err) {
        setError(true);
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchPersonalizedPath();
  }, []);

  return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-headline text-2xl">{t('learningPathTitle')}</CardTitle>
                <BookOpenCheck className="h-6 w-6 text-muted-foreground" />
              </div>
              {personalizedPath && (
                <CardDescription>{personalizedPath.reasoning}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <PersonalizedPathSkeleton />
              ) : error ? (
                <div className="flex items-center gap-4 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
                  <AlertTriangle className="h-6 w-6" />
                  <div className="flex-1">
                    <h3 className="font-semibold">{t('learningPathError')}</h3>
                    <p className="text-sm">{t('learningPathErrorMessage')}</p>
                  </div>
                </div>
              ) : (
                personalizedPath?.suggestedModules.map((module) => {
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
                })
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-headline text-2xl">{t('activeModulesTitle')}</CardTitle>
                <CardDescription>{t('activeModulesDescription')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {modules.map((mod) => {
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
                <CardTitle className="font-headline text-2xl">{t('practiceScenariosTitle')}</CardTitle>
                <CardDescription className="text-primary-foreground/80">
                  {t('practiceScenariosDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">{t('practiceScenariosIntro')}</p>
                <Button variant="secondary" className="w-full" asChild>
                  <Link href="/simulations">
                    {t('startSimulation')} <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
  );
}
