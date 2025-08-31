
'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ArrowLeft, HeartPulse, Pill, Scale, Soup, PhoneCall } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useProfile } from '@/context/role-context';
import { useEffect, useState } from 'react';
import { SectionCard } from '@/components/cards/section-card';

const MODULE_ID = 'heart-failure';
const SECTIONS = 5;

export default function HeartFailureModulePage() {
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
          Heart Failure Management: A Guide for Caregivers
        </h1>
        <p className="text-muted-foreground">
          This module will help you understand and manage care for someone living with heart failure.
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
        <AccordionItem value="item-1">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <HeartPulse className="h-6 w-6 text-primary" />
              What is Heart Failure?
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <SectionCard
              sectionId={1}
              title="Understanding the Condition"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(1)}
            >
                <p>
                  Heart failure, sometimes called congestive heart failure, doesn't mean the heart has stopped working. It means the heart muscle isn't pumping blood as well as it should. Because of this, the body doesn't get enough oxygen-rich blood, which can cause a variety of symptoms.
                </p>
                <h4 className="font-semibold">Key Points to Remember:</h4>
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    <strong>It's a Chronic Condition:</strong> Heart failure is a long-term condition that needs ongoing management.
                  </li>
                  <li>
                    <strong>Management is Key:</strong> With the right medications, lifestyle changes, and monitoring, people can live full lives with heart failure.
                  </li>
                  <li>
                    <strong>Symptoms Can Worsen:</strong> It's important to watch for changes and report them to the doctor.
                  </li>
                </ul>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Scale className="h-6 w-6 text-primary" />
              Monitoring Symptoms and Weight
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <SectionCard
              sectionId={2}
              title="Daily Checks Are Crucial"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(2)}
            >
                <p>One of the most important jobs of a caregiver is to help monitor for changes that could signal worsening heart failure. Fluid retention is a major concern.</p>
                 <ul className="list-disc space-y-2 pl-5">
                    <li>
                        <strong>Daily Weight:</strong> Weigh the person every morning, after using the bathroom but before eating. Use the same scale. Keep a log of the daily weights.
                    </li>
                    <li>
                        <strong>Watch for Swelling (Edema):</strong> Check the feet, ankles, legs, and abdomen for new or worsening swelling.
                    </li>
                    <li>
                        <strong>Shortness of Breath:</strong> Note any increased difficulty breathing, especially when lying down or with activity. Do they need more pillows to sleep?
                    </li>
                    <li>
                        <strong>Fatigue:</strong> Pay attention to increased tiredness or a sudden lack of energy.
                    </li>
                </ul>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-3">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Pill className="h-6 w-6 text-primary" />
              Managing Medications
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <SectionCard
              sectionId={3}
              title="Medication is a Lifeline"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(3)}
            >
                <p>
                  People with heart failure often take several medications. It's vital they are taken exactly as prescribed.
                </p>
                <ul className="list-disc space-y-2 pl-5">
                    <li>
                        <strong>Use a Pill Organizer:</strong> A weekly pillbox can help ensure no doses are missed.
                    </li>
                    <li>
                        <strong>Know the Medications:</strong> Keep an updated list of all medications, including the name, dose, and what it's for.
                    </li>
                    <li>
                        <strong>Diuretics ("Water Pills"):</strong> These help the body get rid of extra fluid. Be aware of their schedule and potential side effects like dizziness.
                    </li>
                    <li>
                        <strong>Never Stop a Medication:</strong> Do not stop or change any medication without talking to the doctor first.
                    </li>
                </ul>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="item-4">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Soup className="h-6 w-6 text-primary" />
              Diet and Fluid Intake
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <SectionCard
              sectionId={4}
              title="Low Sodium, Controlled Fluids"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(4)}
            >
                <ul className="list-disc space-y-2 pl-5">
                    <li>
                        <strong>Limit Sodium (Salt):</strong> Sodium makes the body hold onto fluid. Read food labels and avoid high-sodium processed foods, canned soups, and fast food.
                    </li>
                    <li>
                        <strong>Fluid Restriction:</strong> The doctor may recommend limiting total fluid intake (water, juice, soup, etc.). Keep track of how much they drink each day.
                    </li>
                    <li>
                        <strong>Focus on Heart-Healthy Foods:</strong> Encourage a diet rich in fruits, vegetables, and lean proteins.
                    </li>
                </ul>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-5">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <PhoneCall className="h-6 w-6 text-primary" />
              When to Call the Doctor
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <SectionCard
              sectionId={5}
              title="Know the Red Flags"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(5)}
            >
                <p>Contact the doctor or clinic right away if you notice:</p>
                <ul className="list-disc space-y-2 pl-5">
                    <li>
                        <strong>Weight gain of 2-3 pounds in one day, or 5 pounds in one week.</strong>
                    </li>
                    <li>
                        <strong>Increased swelling in the legs, ankles, or abdomen.</strong>
                    </li>
                    <li>
                        <strong>Increased shortness of breath, especially when resting.</strong>
                    </li>
                     <li>
                        <strong>A new or worsening cough or wheezing.</strong>
                    </li>
                     <li>
                        <strong>Feeling dizzy, lightheaded, or fainting.</strong>
                    </li>
                </ul>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>
        
      </Accordion>
    </div>
  );
}
