
'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ArrowLeft, Brain, Pill, Activity, Smile, UserCheck } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useProfile } from '@/context/role-context';
import { useEffect, useState } from 'react';
import { SectionCard } from '@/components/cards/section-card';

const MODULE_ID = 'parkinsonism-care';
const SECTIONS = 5;

export default function ParkinsonismCareModulePage() {
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
          Living with Parkinson's Disease: A Detailed Guide for Families and Caregivers
        </h1>
        <p className="text-muted-foreground">
          This guide provides families with in-depth information to understand the many symptoms of Parkinson's Disease (PD), how to be an effective partner in treatment, and ways to manage daily life.
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
        <AccordionItem value="item-1">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Brain className="h-6 w-6 text-primary" />
              Chapter 1: Understanding What's Happening
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <SectionCard
              sectionId={1}
              title="What is Parkinson's Disease?"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(1)}
            >
                <p>
                  Parkinson's is a slowly progressing disease of the brain that primarily affects movement. Imagine your brain has a message center that uses a special chemical called dopamine to send signals that tell your muscles to move smoothly and with coordination. In Parkinson's, the brain cells that make dopamine start to disappear, so these messages get weaker and distorted.
                </p>
                <h4 className="font-semibold">How It Typically Starts</h4>
                <p>
                  The beginning of PD is very gradual. It often starts with a minor symptom on one side of the body, like a slight tremor in one hand or a feeling of stiffness in one leg. It can take months or even years before the symptoms become more obvious and affect both sides of the body.
                </p>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <UserCheck className="h-6 w-6 text-primary" />
              Chapter 2: Recognizing the Symptoms - A Head-to-Toe Guide
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 space-y-4">
            <SectionCard
              sectionId={2}
              title="Movement and Non-Movement Symptoms"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(2)}
            >
                <h4 className="font-semibold">The Main Movement (Motor) Symptoms</h4>
                <p>
                  <strong>The Parkinson's Tremor:</strong> This is the most well-known symptom. It is a shaking that is most obvious when the hand or limb is at rest. The tremor often improves or disappears when your loved one is actively using that hand.
                </p>
                <p>
                  <strong>Slowness and Smallness of Movement (Bradykinesia):</strong> This is often the most disabling symptom. It's a "shrinking" of movement. You might notice:
                </p>
                <ul className="list-disc space-y-2 pl-5">
                  <li>Difficulty with fine motor tasks like buttoning a shirt or using utensils.</li>
                  <li>A change in handwriting, making it very small (micrographia).</li>
                  <li>A loss of facial expression, sometimes called a "masked face."</li>
                  <li>Difficulty getting up from a chair or turning over in bed.</li>
                </ul>
                <p>
                  <strong>Stiffness (Rigidity):</strong> Muscles can feel constantly tight, leading to aches and pains and a reduced range of motion.
                </p>
                <p>
                  <strong>Walking and Balance Problems:</strong> This usually appears later in the disease. Look for:
                </p>
                <ul className="list-disc space-y-2 pl-5">
                  <li>A stooped-over posture.</li>
                  <li>Shuffling steps, where the feet barely leave the floor.</li>
                  <li>A lack of arm swing when walking.</li>
                  <li>A feeling of being "stuck to the floor" (known as "freezing"). This makes falls a very serious risk.</li>
                </ul>
                <h4 className="font-semibold mt-4">The "Hidden" Non-Movement (Non-Motor) Symptoms</h4>
                <p>
                  These symptoms are a direct result of Parkinson's and can be just as challenging as the movement problems.
                </p>
                <p>
                  <strong>Dizziness When Standing Up (Orthostatic Hypotension):</strong> This is a sudden drop in blood pressure upon standing that can cause lightheadedness, blurry vision, or even fainting. Encourage your loved one to get up slowly from a seated or lying position.
                </p>
                <p>
                  <strong>Constipation:</strong> This is extremely common, affecting about half of all patients. It's caused by the disease slowing down the digestive system.
                </p>
                <p>
                  <strong>Mood and Mind:</strong>
                </p>
                 <ul className="list-disc space-y-2 pl-5">
                    <li>Depression and Anxiety: It's very important to know that these are part of the brain changes of PD, not just a reaction to having the illness. They are treatable.</li>
                    <li>Memory Problems: Serious memory loss and dementia are not an early feature of Parkinson's. If they occur, it is only after many years with the disease.</li>
                </ul>
                <p>
                  <strong>Other Common Issues:</strong> You may also notice problems with sleep, excessive drooling, urinary urgency, and a very soft voice.
                </p>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-3">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Pill className="h-6 w-6 text-primary" />
              Chapter 3: Medications - Your Role as a Partner
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <SectionCard
              sectionId={3}
              title="Medication Management"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(3)}
            >
                <h4 className="font-semibold">The Main Medicine: Levodopa (L-dopa)</h4>
                <p>
                  The most powerful medication for Parkinson's is levodopa. It helps replace the missing dopamine in the brain and is very effective at treating the motor symptoms.
                </p>
                <ul className="list-disc space-y-2 pl-5">
                    <li>
                        <strong>The Golden Rule of Timing:</strong> To work properly, levodopa should be taken on an empty stomach, about 30 minutes before a meal. Food, especially protein, can interfere with how the medicine is absorbed.
                    </li>
                    <li>
                        <strong>Tracking "On" and "Off" Times:</strong> After a few years, you may notice the medication's effect doesn't last until the next dose. This is called "wearing-off." Your loved one may feel good and move well ("On" time) and then become slow and stiff before the next pill ("Off" time). Keeping a simple diary of these times is incredibly helpful for the doctor.
                    </li>
                    <li>
                        <strong>Side Effects to Report:</strong> Be sure to tell the doctor if you notice nausea, dizziness, or especially any new confusion, vivid dreams, or hallucinations (seeing things that aren't there).
                    </li>
                </ul>
                <h4 className="font-semibold mt-4">A Critical Warning: Other Medications Can Mimic PD</h4>
                <p>Some medications, particularly antipsychotics used to treat behavioral issues in dementia, can cause stiffness and slowness that look exactly like Parkinson's. If your loved one starts showing these symptoms after beginning a new medication, it is vital to contact the doctor immediately.</p>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="item-4">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Activity className="h-6 w-6 text-primary" />
              Chapter 4: Beyond the Pills - Therapies that Boost Quality of Life
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <SectionCard
              sectionId={4}
              title="Essential Therapies"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(4)}
            >
                <p>Medication is only one piece of the puzzle. Rehabilitation therapies are essential.</p>
                <ul className="list-disc space-y-2 pl-5">
                    <li>
                        <strong>Physical Therapy (PT):</strong> A physical therapist is an expert in movement. They can teach specific exercises and strategies to improve walking, increase balance, and prevent devastating falls.
                    </li>
                    <li>
                        <strong>Speech Therapy:</strong> A speech therapist does more than just help with speech. They can help with:
                        <ul className='list-disc space-y-2 pl-5 mt-2'>
                           <li>A soft voice, teaching techniques to speak more loudly and clearly.</li>
                           <li>Swallowing problems (dysphagia), which can become a serious risk in later stages.</li>
                        </ul>
                    </li>
                </ul>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-5">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Smile className="h-6 w-6 text-primary" />
              Chapter 5: Living Day-to-Day and Planning for the Future
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <SectionCard
              sectionId={5}
              title="Daily Life and Future Planning"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(5)}
            >
                <ul className="list-disc space-y-2 pl-5">
                    <li>
                        <strong>Home Safety:</strong> Make your home as safe as possible to prevent falls. Remove throw rugs, clear pathways, and install grab bars in the bathroom.
                    </li>
                    <li>
                        <strong>Patience and Support:</strong> Everyday tasks will take longer. Patience and encouragement are key. Help them stay socially connected and as physically active as possible.
                    </li>
                    <li>
                        <strong>Looking Ahead:</strong> Parkinson's is a long journey. As the disease advances, your loved one will need more help with daily activities. Planning for professional help, meals-on-wheels, and other services in advance can reduce stress later on.
                    </li>
                    <li>
                        <strong>Support for You:</strong> Being a caregiver is a marathon, not a sprint. Connect with local Parkinson's associations for resources, education, and support groups. Taking care of your own well-being is essential.
                    </li>
                </ul>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
