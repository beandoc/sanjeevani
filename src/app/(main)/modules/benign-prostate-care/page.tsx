
'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ArrowLeft, Droplets, Utensils, AlertTriangle, Pill } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useProfile } from '@/context/role-context';
import { useEffect, useState } from 'react';
import { SectionCard } from '@/components/cards/section-card';

const MODULE_ID = 'benign-prostate-care';
const SECTIONS = 4;

export default function BenignProstateCarePage() {
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
          Understanding Urinary Problems in Men (BPH)
        </h1>
        <p className="text-muted-foreground">
          A guide for caregivers on managing common urinary symptoms in older men.
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
        <AccordionItem value="item-1">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Droplets className="h-6 w-6 text-primary" />
              Common Urinary Symptoms (LUTS)
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <SectionCard
                sectionId={1}
                title="What to Watch For"
                onComplete={handleSectionComplete}
                isCompleted={completedSections.has(1)}
            >
                <p>
                  As men age, changes in the prostate gland can lead to Lower Urinary Tract Symptoms, often called LUTS. These are not a normal part of aging and should be discussed with a doctor.
                </p>
                <h4 className="font-semibold">Key Symptoms:</h4>
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    <strong>Storage Symptoms:</strong> Needing to urinate often during the day, waking up at night to urinate (nocturia), a sudden urge to go that's hard to ignore, and leaking urine.
                  </li>
                  <li>
                    <strong>Voiding Symptoms:</strong> A weak or slow urine stream, trouble starting urination (hesitancy), a stream that starts and stops, or straining to urinate.
                  </li>
                  <li>
                    <strong>After-Urination Symptoms:</strong> A feeling that the bladder isn't completely empty, or dribbling urine after leaving the toilet.
                  </li>
                </ul>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Utensils className="h-6 w-6 text-primary" />
              Lifestyle and Home Management
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <SectionCard
                sectionId={2}
                title="Practical Tips to Reduce Symptoms"
                onComplete={handleSectionComplete}
                isCompleted={completedSections.has(2)}
            >
                 <p>Simple changes can often make a big difference in managing symptoms.</p>
                 <ul className="list-disc space-y-2 pl-5">
                    <li>
                        <strong>Manage Fluid Intake:</strong> Avoid drinking fluids for 2 hours before bedtime to reduce nighttime urination.
                    </li>
                    <li>
                        <strong>Avoid Bladder Irritants:</strong> Caffeine (coffee, tea, soda) and alcohol can make symptoms worse. Carbonated drinks and artificial sweeteners can also be irritating.
                    </li>
                    <li>
                        <strong>Keep a Bladder Diary:</strong> Note down when symptoms occur, what was eaten or drunk, and urination frequency. This can help identify personal triggers.
                    </li>
                    <li>
                        <strong>Prevent Constipation:</strong> Straining from constipation can put pressure on the bladder. A high-fiber diet and adequate fluids can help.
                    </li>
                </ul>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="item-3">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Pill className="h-6 w-6 text-primary" />
              Understanding Medications
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <SectionCard
                sectionId={3}
                title="How Medications Can Help"
                onComplete={handleSectionComplete}
                isCompleted={completedSections.has(3)}
            >
                <p>
                  If lifestyle changes aren't enough, a doctor may prescribe medication.
                </p>
                <ul className="list-disc space-y-2 pl-5">
                    <li>
                        <strong>Alpha-blockers:</strong> These are often the first choice. They work by relaxing the muscles in the prostate and bladder neck, making it easier to urinate.
                    </li>
                    <li>
                        <strong>5-alpha-reductase inhibitors:</strong> These medications work by shrinking the prostate gland. They are most effective for men with larger prostates and may take up to 6 months to show results.
                    </li>
                    <li>
                        <strong>Review All Medications:</strong> Some other drugs (like certain cold medicines or alertness pills) can worsen urinary symptoms. Always discuss all medications, including over-the-counter ones, with the doctor.
                    </li>
                </ul>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="item-4">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-destructive" />
              When to See a Doctor
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <SectionCard
                sectionId={4}
                title="Important Signs to Report"
                onComplete={handleSectionComplete}
                isCompleted={completedSections.has(4)}
            >
                <p>It's important to involve a healthcare professional to get an accurate diagnosis and rule out more serious conditions.</p>
                 <ul className="list-disc space-y-2 pl-5">
                    <li>
                        If symptoms are significantly impacting quality of life (e.g., poor sleep, avoiding social activities).
                    </li>
                    <li>
                        If there is pain during urination, blood in the urine, or signs of a urinary tract infection (UTI).
                    </li>
                    <li>
                        If there is a complete inability to urinate, which is a medical emergency.
                    </li>
                    <li>
                        Before starting any new herbal supplements or over-the-counter remedies, as many are not proven to be effective.
                    </li>
                </ul>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
