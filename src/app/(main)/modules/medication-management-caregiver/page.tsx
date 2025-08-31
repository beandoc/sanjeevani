
'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ArrowLeft, HeartHandshake, Siren, Repeat, ListChecks } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useProfile } from '@/context/role-context';
import { useEffect, useState } from 'react';
import { SectionCard } from '@/components/cards/section-card';

const MODULE_ID = 'medication-management-caregiver';
const SECTIONS = 4;

export default function MedicationManagementCaregiverPage() {
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
          Helping Your Loved One Stay Safe with Medicines
        </h1>
        <p className="text-muted-foreground">
          A guide for family caregivers to manage medications safely and be a key partner in healthcare.
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
        <AccordionItem value="item-1">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <HeartHandshake className="h-6 w-6 text-primary" />
              Why Older Adults Need Extra Help
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <SectionCard
              sectionId={1}
              title="Your Loved One's Most Important Safety Net"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(1)}
            >
                <p>
                  As people age, they often develop more health conditions and need more medicines. Taking many medications (polypharmacy) increases the chance of problems.
                </p>
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    About 1 in 5 people over 70 takes five or more different medicines.
                  </li>
                  <li>
                    The body handles medicines differently with age, making side effects more likely.
                  </li>
                  <li>
                    A medication problem can be a major reason for a hospital admission.
                  </li>
                </ul>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Siren className="h-6 w-6 text-destructive" />
              Spotting Medication Problem Warning Signs
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <SectionCard
              sectionId={2}
              title="Look for Sudden Changes"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(2)}
            >
                 <p>A bad reaction to a medicine in an older person might not be what you expect. It often looks like a sudden change in their overall condition. Never dismiss these signs as "just getting old."</p>
                 <h4 className="font-semibold">Key Warning Signs:</h4>
                 <ul className="list-disc space-y-2 pl-5">
                    <li>Sudden confusion, memory problems, or acting strangely (delirium).</li>
                    <li>More falls, or new dizziness and unsteadiness.</li>
                    <li>New or worsening bladder or bowel control issues.</li>
                    <li>Unusual sleepiness or being hard to wake up.</li>
                    <li>Sudden loss of appetite or feeling very tired.</li>
                    <li>A new depressed mood or loss of interest in things.</li>
                </ul>
                <p className="mt-4 font-semibold text-destructive">Always consider that a new symptom might be a medication side effect and call the doctor.</p>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="item-3">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Repeat className="h-6 w-6 text-primary" />
              The "Domino Effect" of Prescribing
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <SectionCard
              sectionId={3}
              title="Understanding the Prescribing Cascade"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(3)}
            >
                <p>
                  Sometimes, a side effect from Drug #1 is mistaken for a new health problem. The doctor might then prescribe Drug #2 to treat that side effect. This can lead to even more problems. This is called the prescribing cascade.
                </p>
                <h4 className="font-semibold">Example:</h4>
                <p>A blood pressure pill (Drug #1) causes swollen ankles. The doctor sees the swelling and prescribes a water pill (Drug #2) to fix it. The water pill can then cause dizziness, leading to a fall.</p>
                <p className="mt-2 font-medium">You can help stop this by telling the doctor about any new symptom that appears after a medicine is started or changed.</p>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="item-4">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <ListChecks className="h-6 w-6 text-primary" />
              Your Action Plan for Medication Safety
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <SectionCard
              sectionId={4}
              title="Simple Steps, Big Impact"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(4)}
            >
                 <ul className="list-disc space-y-4 pl-5">
                    <li>
                        <strong>Keep an "All-Meds" Master List:</strong> Maintain one updated list of every prescription, over-the-counter item, vitamin, and supplement. Note the name, dose, and reason for each. Bring this list to EVERY appointment.
                    </li>
                    <li>
                        <strong>Use One Pharmacy:</strong> Fill all prescriptions at the same pharmacy. This allows the pharmacist to spot dangerous interactions.
                    </li>
                    <li>
                        <strong>Use a Pill Organizer:</strong> A weekly pill box helps prevent missed or double doses.
                    </li>
                     <li>
                        <strong>Ask Questions at Discharge:</strong> Leaving the hospital is high-risk. Go over the final medication list with the nurse or doctor and ask: "What is each new medicine for?", "Which medicines should be stopped?", and "Who do I call if I have a problem?".
                    </li>
                </ul>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
