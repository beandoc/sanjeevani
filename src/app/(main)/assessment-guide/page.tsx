
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpen, Globe, Users, HeartHandshake, Cpu } from 'lucide-react';
import Link from 'next/link';

import { useTranslations } from 'next-intl';

const lessons = [
  {
    id: 'introduction',
    slug: '/assessment-guide/introduction',
    icon: BookOpen,
  },
  {
    id: 'workforce',
    slug: '/assessment-guide/workforce',
    icon: Users,
  },
  {
    id: 'clinical-content',
    slug: '/assessment-guide/clinical-content',
    icon: HeartHandshake,
  },
  {
    id: 'innovations',
    slug: '/assessment-guide/innovations',
    icon: Cpu,
  },
  {
    id: 'case-study',
    slug: '/assessment-guide/case-study',
    icon: Globe,
  },
];

export default function AssessmentGuidePage() {
  const t = useTranslations('AssessmentGuide');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">
          {t('title')}
        </h1>
        <p className="text-muted-foreground">
          {t('subtitle')}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {lessons.map((lesson) => {
          const Icon = lesson.icon;
          return (
            <Card key={lesson.slug} className="flex flex-col">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="font-headline text-xl">{t(`lessons.${lesson.id}.title`)}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <CardDescription>{t(`lessons.${lesson.id}.description`)}</CardDescription>
              </CardContent>
              <CardContent>
                <Button asChild className="w-full" variant="secondary">
                  <Link href={lesson.slug}>
                    {t('startLesson')} <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
