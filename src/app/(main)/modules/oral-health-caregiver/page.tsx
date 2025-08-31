
'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ArrowLeft, Smile, Search, Shield, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useProfile } from '@/context/role-context';
import { useEffect, useState } from 'react';
import { SectionCard } from '@/components/cards/section-card';

const MODULE_ID = 'oral-health-caregiver';
const SECTIONS = 3;

export default function OralHealthCaregiverPage() {
  const { getModuleProgress, updateModuleProgress } = useProfile();
  const [completedSections, setCompletedSections] = useState<Set<number>>(new Set());

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
          Back to Modules
        </Link>
      </Button>
      <div>
        <h1 className="text-3xl font-bold font-headline">
          Oral Health: A Caregiver's Guide
        </h1>
        <p className="text-muted-foreground">
          Learn how to manage daily oral care and identify common dental issues in older adults.
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
        <AccordionItem value="item-1">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Search className="h-6 w-6 text-primary" />
              Why Oral Health Matters
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <SectionCard
              sectionId={1}
              title="More Than Just a Pretty Smile"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(1)}
            >
                <p>
                  Good oral health is crucial for an older adult's overall health and quality of life. Poor oral health can lead to pain, difficulty eating, and serious infections. It can affect their ability to chew properly, which can lead to poor nutrition. It's important to remember that the mouth is a gateway to the rest of the body.
                </p>
                <h4 className="font-semibold">Key Connections:</h4>
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    <strong>Nutrition:</strong> Painful gums or loose teeth can make it hard to eat healthy foods.
                  </li>
                  <li>
                    <strong>Systemic Health:</strong> Bacteria from gum disease can travel to other parts of the body, potentially worsening conditions like heart disease or diabetes.
                  </li>
                  <li>
                    <strong>Quality of Life:</strong> Oral pain or bad breath can cause social embarrassment and isolation.
                  </li>
                </ul>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-primary" />
              Daily Care and Prevention
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <SectionCard
              sectionId={2}
              title="Tips for Daily Oral Hygiene"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(2)}
            >
                 <p>Helping with daily oral care is one of the most important things a caregiver can do.</p>
                 <ul className="list-disc space-y-2 pl-5">
                    <li>
                        <strong>Brushing:</strong> Brush teeth (or dentures) at least twice a day with a soft-bristled toothbrush. An electric toothbrush can be very effective and easier for someone with limited dexterity.
                    </li>
                    <li>
                        <strong>Denture Care:</strong> Remove dentures at night to give the gums a rest. Clean them daily with a denture brush and cleanser, and store them in water.
                    </li>
                    <li>
                        <strong>Flossing:</strong> Floss or use an alternative interdental cleaner daily if possible. Floss holders or threaders can make this easier.
                    </li>
                    <li>
                        <strong>Managing Dry Mouth:</strong> Many medications cause dry mouth, which increases the risk for cavities. Encourage sipping water, and suggest using sugar-free lozenges or an over-the-counter saliva substitute.
                    </li>
                </ul>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="item-3">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-destructive" />
              When to Get Professional Help
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <SectionCard
              sectionId={3}
              title="Signs That Require a Dental Visit"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(3)}
            >
                <p>Regular dental check-ups are important. You should also make an appointment if you notice any of the following:</p>
                 <ul className="list-disc space-y-2 pl-5">
                    <li>Pain in the mouth, teeth, or jaw.</li>
                    <li>Gums that are red, swollen, or bleeding.</li>
                    <li>Difficulty chewing or swallowing.</li>
                    <li>A broken tooth or a denture that doesn't fit well.</li>
                    <li>Sores, patches, or lumps in the mouth that don't heal.</li>
                </ul>
                <p className="mt-4 text-sm text-muted-foreground">Finding a dentist experienced in geriatric care can be very helpful, especially for frail or homebound individuals.</p>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
