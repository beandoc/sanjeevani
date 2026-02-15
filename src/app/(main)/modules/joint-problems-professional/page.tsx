
'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ArrowLeft, Stethoscope, Microscope, Activity, Pill } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useProfile } from '@/context/role-context';
import { useEffect, useState } from 'react';
import { SectionCard } from '@/components/cards/section-card';
import { useTranslations } from 'next-intl';

const MODULE_ID = 'joint-problems-professional';
const SECTIONS = 4;

export default function JointProblemsProfessionalPage() {
  const { getModuleProgress, updateModuleProgress } = useProfile();
  const [completedSections, setCompletedSections] = useState<Set<number>>(new Set());
  const t = useTranslations('Modules.joint-problems-professional');
  const tPage = useTranslations('Modules.page');

  useEffect(() => {
    const progress = getModuleProgress(MODULE_ID);
    const completedCount = Math.floor((progress / 100) * SECTIONS);
    const completed = new Set<number>();
    for (let i = 1; i <= completedCount; i++) {
      completed.add(i);
    }
    setCompletedSections(completed);
  }, [getModuleProgress]);

  const handleSectionComplete = (sectionId: number) => {
    const newCompletedSections = new Set(completedSections);
    newCompletedSections.add(sectionId);
    setCompletedSections(newCompletedSections);
    const newProgress = (newCompletedSections.size / SECTIONS) * 100;
    updateModuleProgress(MODULE_ID, newProgress);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <Button variant="outline" asChild>
        <Link href="/modules">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {tPage('backToModules')}
        </Link>
      </Button>
      <div>
        <h1 className="text-3xl font-bold font-headline">
          {t('title')}
        </h1>
        <p className="text-muted-foreground">
          {t('subtitle')}
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
        <AccordionItem value="item-1">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Microscope className="h-6 w-6 text-primary" />
              {t('sections.item-1.trigger')}
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 space-y-4">
            <SectionCard
              sectionId={1}
              title={t('sections.item-1.title')}
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(1)}
            >
              <h4 className="font-semibold">{t('sections.item-1.content.h4_1')}</h4>
              <p>{t('sections.item-1.content.p1')}</p>
              <h4 className="font-semibold mt-4">{t('sections.item-1.content.h4_2')}</h4>
              <p>{t('sections.item-1.content.p2')}</p>
              <h4 className="font-semibold mt-4">{t('sections.item-1.content.h4_3')}</h4>
              <p>{t('sections.item-1.content.p3')}</p>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Stethoscope className="h-6 w-6 text-primary" />
              {t('sections.item-2.trigger')}
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 space-y-4">
            <SectionCard
              sectionId={2}
              title={t('sections.item-2.title')}
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(2)}
            >
              <ul className="list-disc space-y-2 pl-5">
                <li dangerouslySetInnerHTML={{ __html: t.raw('sections.item-2.content.li1') }} />
                <li dangerouslySetInnerHTML={{ __html: t.raw('sections.item-2.content.li2') }} />
                <li dangerouslySetInnerHTML={{ __html: t.raw('sections.item-2.content.li3') }} />
                <li dangerouslySetInnerHTML={{ __html: t.raw('sections.item-2.content.li4') }} />
                <li dangerouslySetInnerHTML={{ __html: t.raw('sections.item-2.content.li5') }} />
              </ul>
              <p dangerouslySetInnerHTML={{ __html: t.raw('sections.item-2.content.p1') }} />
            </SectionCard>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-3">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Pill className="h-6 w-6 text-primary" />
              {t('sections.item-3.trigger')}
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 space-y-4">
            <SectionCard
              sectionId={3}
              title={t('sections.item-3.title')}
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(3)}
            >
              <h4 className="font-semibold text-lg">{t('sections.item-3.content.h4_1')}</h4>
              <ul className="list-disc space-y-2 pl-5">
                <li dangerouslySetInnerHTML={{ __html: t.raw('sections.item-3.content.li1') }} />
                <li dangerouslySetInnerHTML={{ __html: t.raw('sections.item-3.content.li2') }} />
                <li dangerouslySetInnerHTML={{ __html: t.raw('sections.item-3.content.li3') }} />
                <li dangerouslySetInnerHTML={{ __html: t.raw('sections.item-3.content.li4') }} />
              </ul>

              <h4 className="font-semibold text-lg mt-4">{t('sections.item-3.content.h4_2')}</h4>
              <ul className="list-disc space-y-2 pl-5">
                <li dangerouslySetInnerHTML={{ __html: t.raw('sections.item-3.content.li5') }} />
                <li dangerouslySetInnerHTML={{ __html: t.raw('sections.item-3.content.li6') }} />
                <li dangerouslySetInnerHTML={{ __html: t.raw('sections.item-3.content.li7') }} />
              </ul>

              <h4 className="font-semibold text-lg mt-4">{t('sections.item-3.content.h4_3')}</h4>
              <ul className="list-disc space-y-2 pl-5">
                <li dangerouslySetInnerHTML={{ __html: t.raw('sections.item-3.content.li8') }} />
                <li dangerouslySetInnerHTML={{ __html: t.raw('sections.item-3.content.li9') }} />
                <li dangerouslySetInnerHTML={{ __html: t.raw('sections.item-3.content.li10') }} />
              </ul>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-4">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Activity className="h-6 w-6 text-primary" />
              {t('sections.item-4.trigger')}
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 space-y-4">
            <SectionCard
              sectionId={4}
              title={t('sections.item-4.title')}
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(4)}
            >
              <p>
                {t('sections.item-4.content.p1')}
              </p>
              <ul className="list-disc space-y-2 pl-5">
                <li dangerouslySetInnerHTML={{ __html: t.raw('sections.item-4.content.li1') }} />
                <li dangerouslySetInnerHTML={{ __html: t.raw('sections.item-4.content.li2') }} />
                <li dangerouslySetInnerHTML={{ __html: t.raw('sections.item-4.content.li3') }} />
                <li dangerouslySetInnerHTML={{ __html: t.raw('sections.item-4.content.li4') }} />
              </ul>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
