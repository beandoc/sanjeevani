
'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Stethoscope, AlertTriangle, Pill, UserCheck } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { useProfile } from '@/context/role-context';
import { useEffect, useState } from 'react';
import { SectionCard } from '@/components/cards/section-card';

const MODULE_ID = 'constipation-caregiver';
const SECTIONS = 5;

export default function ConstipationCaregiverPage() {
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
          Helping Your Loved One with Constipation: A Practical Guide
        </h1>
        <p className="text-muted-foreground">
          This guide gives family caregivers the essential information to understand, prevent, and manage constipation in an older loved one safely and effectively.
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
        <AccordionItem value="item-1">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <UserCheck className="h-6 w-6 text-primary" />
              What is Constipation for an Older Person?
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <SectionCard
              sectionId={1}
              title="What is Constipation?"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(1)}
            >
                <p>
                  It's important to know that constipation isn't just about going to the bathroom less often. For older adults, the main complaints are often:
                </p>
                <ul className="list-disc space-y-2 pl-5">
                  <li>Straining and pushing to have a bowel movement.</li>
                  <li>Passing hard, dry, lumpy stools.</li>
                  <li>Feeling like they haven't fully emptied their bowels.</li>
                </ul>
                <p className="font-semibold">Key Fact: Constipation is not a normal part of getting older. Healthy, active seniors are not destined to have this problem. It's usually caused by other factors you can help with.</p>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Stethoscope className="h-6 w-6 text-primary" />
              The Most Common Causes (and What to Look For)
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <SectionCard
              sectionId={2}
              title="Common Causes"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(2)}
            >
                    <p>Constipation in older adults usually has multiple causes. The biggest ones are:</p>
                    <h4 className="font-semibold">Medications:</h4>
                    <p>This is a major cause. At your next doctor's visit, ask if any of your loved one's medications could be the problem. Common culprits include:</p>
                     <ul className="list-disc space-y-2 pl-5">
                        <li>Strong pain relievers (opiates like morphine or oxycodone)</li>
                        <li>Certain blood pressure pills (calcium channel blockers)</li>
                        <li>Some antidepressants</li>
                        <li>Iron supplements</li>
                    </ul>
                    <h4 className="font-semibold">Other Health Conditions:</h4>
                    <p>Problems like Parkinson's disease, diabetes, and stroke can directly affect how the bowels work.</p>
                    <h4 className="font-semibold">Being Immobile:</h4>
                    <p>Not moving around as much can slow down the digestive system.</p>
              </SectionCard>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-3">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Pill className="h-6 w-6 text-primary" />
              A Step-by-Step Plan to Help
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <SectionCard
              sectionId={3}
              title="Step-by-Step Plan"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(3)}
            >
                <h4 className="font-semibold">Step 1: Start with the Basics</h4>
                <ul className="list-disc space-y-4 pl-5">
                    <li>
                        <strong>Review Medicines:</strong> Make a list of every medication and supplement your loved one takes and bring it to the doctor. Ask, "Could any of these be causing constipation?"
                    </li>
                    <li>
                        <strong>Gentle Fibre:</strong> Encourage foods rich in fibre, like fruits, vegetables, and whole arains. If you use a fibre supplement (like Metamucil), make sure they drink plenty of extra water with it. <strong className="text-destructive">Warning:</strong> Do not give a fibre supplement if they are bedridden or you suspect a severe blockage.
                    </li>
                    <li>
                        <strong>Set a Routine:</strong> The urge to have a bowel movement is strongest after eating. Encourage your loved one to sit on the toilet for a few minutes about 30 minutes after a meal.
                    </li>
                </ul>
                <h4 className="font-semibold mt-4">Step 2: Try a Gentle Laxative</h4>
                <p>If the basics don't work, an osmotic laxative is a safe next step. A common one is polyethylene glycol (PEG), sold under brand names like Miralax. It works by gently drawing water into the stool to soften it.</p>
                <h4 className="font-semibold mt-4">Step 3: If Needed, a Stimulant Laxative</h4>
                <p>Products containing senna or bisacodyl (like Senokot or Dulcolax) stimulate the bowel to move. These are best used when gentler options haven't worked.</p>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-4">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-destructive" />
              When to Call the Doctor: "Red Flag" Symptoms
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <SectionCard
              sectionId={4}
              title="Red Flag Symptoms"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(4)}
            >
                 <p>Call the doctor right away if your loved one experiences any of the following:</p>
                 <ul className="list-disc space-y-2 pl-5 text-destructive font-medium">
                    <li>Constipation that starts suddenly and is a new problem.</li>
                    <li>Blood in the stool.</li>
                    <li>Losing weight without trying.</li>
                    <li>Severe stomach pain, bloating, or cramping.</li>
                    <li>Watery diarrhea after a period of no bowel movements. This could be a sign of a serious blockage called fecal impaction.</li>
                </ul>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-5">
            <AccordionTrigger className="text-xl font-semibold">
                <div className="flex items-center gap-3">
                    <UserCheck className="h-6 w-6 text-primary" />
                    A Simple Tool: The Stool Chart
                </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2">
                <SectionCard
                  sectionId={5}
                  title="The Bristol Stool Chart"
                  onComplete={handleSectionComplete}
                  isCompleted={completedSections.has(5)}
                >
                    <p>It can be awkward to talk about poop. The Bristol Stool Chart is a helpful medical tool that uses pictures to describe different types of stool. You can use it to help your loved one explain their symptoms to the doctor. Types 1 and 2 (separate hard lumps or lumpy and sausage-like) mean constipation.</p>
                    <div className="relative aspect-[4/3] w-full">
                        <Image src="https://picsum.photos/600/450" alt="Bristol Stool Chart" fill data-ai-hint="chart health" className="rounded-md object-cover" />
                    </div>
                </SectionCard>
            </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
