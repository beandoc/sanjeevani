
'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ArrowLeft, AlertTriangle, HeartPulse, Activity, UserCheck } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useProfile } from '@/context/role-context';
import { useEffect, useState } from 'react';
import { SectionCard } from '@/components/cards/section-card';

const MODULE_ID = 'ischaemic-heart-disease-caregiver';
const SECTIONS = 4;

export default function IschaemicHeartDiseaseCaregiverPage() {
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
          Caring for a Loved One with Heart Disease: A Practical Guide
        </h1>
        <p className="text-muted-foreground">
          This guide will help you recognize the unique signs of a heart problem in an older adult and understand how you can support their health and well-being.
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
        <AccordionItem value="item-1">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-destructive" />
              Warning Signs of a Heart Problem: It’s Not Always Chest Pain!
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <SectionCard
              sectionId={1}
              title="Atypical Warning Signs"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(1)}
            >
                <p>
                  One of the most important things you can do is learn the unusual warning signs of heart trouble in seniors. A heart attack or angina (chest pain from the heart) might not look like it does in movies.
                </p>
                <p className="font-semibold">Call for help immediately if your loved one shows any of these new or sudden symptoms:</p>
                <ul className="list-disc space-y-2 pl-5">
                  <li>Shortness of breath while resting or with minimal activity.</li>
                  <li>Unusual and sudden fatigue or weakness.</li>
                  <li>Dizziness, lightheadedness, or fainting spells.</li>
                  <li>New or worsening confusion, sleepiness, or a change in mental status.</li>
                  <li>Pain in the stomach area, shoulder, or back instead of the chest.</li>
                </ul>
                <p className="mt-4 font-medium">Treat these signs as seriously as you would chest pain. They can be the body’s way of signaling that the heart isn't getting enough oxygen.</p>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <HeartPulse className="h-6 w-6 text-primary" />
              How You Can Help: The Power of a Healthy Lifestyle
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <SectionCard
              sectionId={2}
              title="Healthy Lifestyle Support"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(2)}
            >
                    <p>You can be a powerful partner in managing your loved one's heart health.</p>
                    <h4 className="font-semibold">Encourage Movement:</h4>
                    <p>The science is clear: all movement counts. You don't need to push for intense workouts. Encouraging daily walks and celebrating their ability to walk a little farther or faster makes a huge difference.</p>
                     <h4 className="font-semibold mt-4">Promote a Heart-Healthy Diet:</h4>
                    <p>A Mediterranean-style diet is proven to protect the heart. This means focusing on:</p>
                     <ul className="list-disc space-y-2 pl-5">
                        <li>Fruits and vegetables</li>
                        <li>Fish (especially those with omega-3 fatty acids)</li>
                        <li>Nuts and whole grains</li>
                        <li>Using olive oil</li>
                    </ul>
                    <h4 className="font-semibold mt-4">Support Quitting Smoking:</h4>
                    <p>It is never too late to quit smoking. The benefits to the heart and blood vessels begin almost immediately.</p>
              </SectionCard>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-3">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Activity className="h-6 w-6 text-primary" />
              After a Heart Attack or Procedure: The Road to Recovery
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <SectionCard
              sectionId={3}
              title="Cardiac Rehab"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(3)}
            >
                <p>If your loved one has a heart event, their doctor will likely recommend cardiac rehabilitation. This is a medically supervised program of exercise, education, and support.</p>
                <h4 className="font-semibold">Why is it so Important?</h4>
                <p>Cardiac rehab is one of the best things an older person can do for their recovery. It is proven to:</p>
                <ul className="list-disc space-y-2 pl-5">
                    <li>Reduce the risk of dying by a significant amount.</li>
                    <li>Help them regain strength and confidence.</li>
                    <li>Improve their overall quality of life and mental health.</li>
                </ul>
                <p className="mt-2 font-medium">Please strongly encourage them to attend if it is offered.</p>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-4">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <UserCheck className="h-6 w-6 text-primary" />
              A "Personalized" Treatment Plan
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <SectionCard
              sectionId={4}
              title="The Goal is Quality of Life"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(4)}
            >
                 <p>You may notice that your loved one's treatment is different from that of a younger person or even another person their age. This is intentional and important.</p>
                 <p>The doctor creates a personalized plan that considers the whole person, not just the disease. This includes their:</p>
                 <ul className="list-disc space-y-2 pl-5">
                    <li>Overall strength and frailty.</li>
                    <li>Other health conditions they may have.</li>
                    <li>Personal wishes and goals for their health.</li>
                </ul>
                <p className="mt-4 font-medium">The goal of treatment for an older person is always to improve their quality of life. Sometimes, this means choosing a less aggressive medication or procedure to avoid side effects and complications like falls or bleeding. This is a sign of good, thoughtful care.</p>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
