
'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ArrowLeft, Siren, AlertTriangle, ShieldCheck, HeartPulse } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useProfile } from '@/context/role-context';
import { useEffect, useState } from 'react';
import { SectionCard } from '@/components/cards/section-card';

const MODULE_ID = 'lung-infections-caregiver';
const SECTIONS = 4;

export default function LungInfectionsCaregiverPage() {
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
          Protecting Your Loved One from Pneumonia: A Guide for Family Caregivers
        </h1>
        <p className="text-muted-foreground">
          This guide will help you understand why pneumonia is a serious threat for older adults, how to spot its tricky warning signs, and what you can do to help prevent it.
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
        <AccordionItem value="item-1">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <HeartPulse className="h-6 w-6 text-primary" />
              What is Pneumonia, and Why is it So Serious for Seniors?
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <SectionCard
              sectionId={1}
              title="Understanding Pneumonia"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(1)}
            >
                <p>
                  Pneumonia is an infection deep in the lungs. It's not just a bad cold or bronchitis. For people over 65, it's one of the leading causes of hospitalization and death because their bodies have a harder time fighting off serious infections.
                </p>
                <h4 className="font-semibold">Key Risk Factors:</h4>
                <ul className="list-disc space-y-2 pl-5">
                  <li>Their immune system isn't as strong.</li>
                  <li>Their cough, which helps clear germs from the lungs, is often weaker.</li>
                  <li>They are more likely to have other health problems like heart disease, lung disease, or diabetes.</li>
                </ul>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Siren className="h-6 w-6 text-destructive" />
              Know the Warning Signs: Pneumonia Can Be a Master of Disguise
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <SectionCard
              sectionId={2}
              title="Atypical Warning Signs"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(2)}
            >
                 <p>In an older person, pneumonia often hides behind subtle and confusing signs. You are the person most likely to notice these changes first.</p>
                 <h4 className="font-semibold">Be on high alert for:</h4>
                 <ul className="list-disc space-y-2 pl-5">
                    <li><strong>Sudden Confusion or Delirium:</strong> If your loved one suddenly becomes disoriented, agitated, or unusually sleepy, it could be a sign of infection.</li>
                    <li><strong>Loss of Appetite:</strong> Refusing to eat or drink when they normally would.</li>
                    <li><strong>Fast Breathing:</strong> Notice if their breathing is much faster or more shallow than usual when they are resting.</li>
                    <li><strong>Falls or Dizziness:</strong> A sudden decline in their ability to get around or a new fall can be caused by the weakness and low oxygen from pneumonia.</li>
                    <li><strong>General Weakness:</strong> A sudden inability to perform their usual daily activities.</li>
                </ul>
                <p className="mt-4 font-semibold text-destructive">Important: A high fever and a bad cough might not be present at the beginning. Trust your instincts. If your loved one is "not themselves," it's worth a call to the doctor.</p>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="item-3">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-primary" />
              When to Get Help Immediately
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <SectionCard
              sectionId={3}
              title="Emergency Signs"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(3)}
            >
                <p>
                  You don't need to be a doctor to know when a situation is serious. Think about these four things:
                </p>
                <ul className="list-disc space-y-2 pl-5 font-medium">
                  <li>Is there new <strong>C</strong>onfusion?</li>
                  <li>Is their <strong>R</strong>espiratory rate (breathing) very fast?</li>
                  <li>Do they seem dizzy or faint (a sign of low <strong>B</strong>lood pressure)?</li>
                  <li>Are they over <strong>65</strong>?</li>
                </ul>
                <p className="mt-4 font-semibold">If you see these signs, especially new confusion or fast breathing, it's a medical emergency. You should seek help right away.</p>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="item-4">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-primary" />
              How You Can Help Prevent Pneumonia
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <SectionCard
              sectionId={4}
              title="Prevention Strategies"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(4)}
            >
                 <h4 className="font-semibold">Prevention is the most powerful tool you have.</h4>
                 <ul className="list-disc space-y-4 pl-5">
                    <li>
                        <strong>Get Them Vaccinated:</strong> This is the #1 thing you can do. Make sure they are up-to-date on their annual Flu Shot and the Pneumonia Vaccine. You should get vaccinated too!
                    </li>
                    <li>
                        <strong>Watch for Swallowing Problems:</strong> If your loved one frequently coughs or chokes when eating or drinking, this is a major risk factor. Tell their doctor.
                    </li>
                    <li>
                        <strong>Promote Good Oral Hygiene:</strong> Keeping their mouth clean with regular brushing reduces the number of germs that could get into their lungs.
                    </li>
                     <li>
                        <strong>Question Sedative Medications:</strong> Sleeping pills and certain antipsychotic drugs can interfere with swallowing. Ask the doctor if these medications are truly necessary.
                    </li>
                </ul>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
