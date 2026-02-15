
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Bot } from 'lucide-react';
import Link from 'next/link';

import { useTranslations } from 'next-intl';

const simulations = [
  'managing-a-fall',
  'medication-confusion',
  'sudden-shortness-of-breath',
  'hypertension-dizziness',
  'polypharmacy-prescribing-cascade',
  'recognizing-delirium',
  'exercise-hesitancy',
  'constipation-management',
];

export default function SimulationsListPage() {
  const t = useTranslations('Simulations');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">{t('title')}</h1>
        <p className="text-muted-foreground">
          {t('subtitle')}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {simulations.map((slug) => (
          <Card key={slug} className="flex flex-col">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                  <Bot className="h-6 w-6 text-accent" />
                </div>
                <CardTitle className="font-headline text-xl">{t(`scenarios.${slug}.title`)}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <CardDescription>{t(`scenarios.${slug}.description`)}</CardDescription>
            </CardContent>
            <CardContent>
              <Button asChild className="w-full" variant="secondary">
                <Link href={`/simulations/${slug}`}>
                  {t('startSimulation')} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
