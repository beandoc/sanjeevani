
'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ArrowLeft, Brain, Search, Shield, UserCheck, Siren, Pill } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useProfile } from '@/context/role-context';
import { useEffect, useState } from 'react';
import { SectionCard } from '@/components/cards/section-card';

const MODULE_ID = 'dementia-care';
const SECTIONS = 5;

export default function DeliriumCaregiverPage() {
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
          A Caregiver's Guide to Delirium: Understanding and Responding to Sudden Confusion
        </h1>
        <p className="text-muted-foreground">
          This detailed guide provides families with the essential information to recognize delirium, understand its causes, and play an active, crucial role in the prevention and care of a loved one experiencing this frightening condition.
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
        <AccordionItem value="item-1">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Siren className="h-6 w-6 text-primary" />
              Chapter 1: What is Delirium? A Medical Emergency
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <SectionCard
                sectionId={1}
                title="1.1 Defining Delirium"
                onComplete={handleSectionComplete}
                isCompleted={completedSections.has(1)}
            >
                <p>
                  Delirium is a sudden and drastic change in a person's mental state. Think of it as an "acute failure" of the brain's normal functioning. It is not dementia, which develops slowly over months or years. Delirium happens quickly, over hours or a few days.
                </p>
                <p className="font-semibold">
                  It is a medical emergency because it is always a sign of an underlying physical problem, like an infection or a medication side effect, that needs to be found and treated.
                </p>
                <h4 className="font-semibold mt-4">1.2 Why It's So Serious</h4>
                <p>Delirium is more than just confusion. It has serious consequences:</p>
                <ul className="list-disc space-y-2 pl-5">
                  <li>It can make a hospital stay longer and more complicated.</li>
                  <li>It increases the risk of falls and other injuries.</li>
                  <li>It can lead to a long-term decline in physical function and memory, even after the person leaves the hospital.</li>
                  <li>Recovery can be very slow, sometimes taking weeks or months.</li>
                </ul>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Brain className="h-6 w-6 text-primary" />
              Chapter 2: Why Does Delirium Happen? Triggers and Vulnerability
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
             <SectionCard
                sectionId={2}
                title="2.1 Triggers and Vulnerability"
                onComplete={handleSectionComplete}
                isCompleted={completedSections.has(2)}
            >
                 <p>Think of a person's brain health as a balancing scale. On one side is their vulnerability, and on the other are the triggers or insults.</p>
                 <h4 className="font-semibold">Vulnerability (Predisposing Factors):</h4>
                 <p>Some people are at a much higher risk. The biggest vulnerability factors are:</p>
                 <ul className="list-disc space-y-2 pl-5">
                    <li>Pre-existing dementia or memory loss.</li>
                    <li>Being very frail or having multiple health problems.</li>
                    <li>Poor vision or hearing.</li>
                </ul>
                 <h4 className="font-semibold mt-4">Triggers (Precipitating Factors):</h4>
                 <p>For a vulnerable person, it only takes a small trigger to tip the scale into delirium. Common triggers include:</p>
                 <ul className="list-disc space-y-2 pl-5">
                    <li><strong>Infections:</strong> Urinary tract infections (UTIs) and pneumonia are classic causes.</li>
                    <li><strong>Medications:</strong> New medications, especially sleeping pills, strong pain relievers, and over-the-counter allergy medicines (like Benadryl), are frequent culprits.</li>
                    <li><strong>Dehydration and Constipation:</strong> These simple problems can have a big impact on the brain.</li>
                    <li><strong>Pain:</strong> Uncontrolled pain is a powerful trigger.</li>
                    <li><strong>The Hospital Environment:</strong> Being in an unfamiliar place, having tubes and IV lines, not sleeping well, and undergoing surgery can all contribute.</li>
                </ul>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-3">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Search className="h-6 w-6 text-primary" />
              Chapter 3: How to Spot Delirium - Be a "Change Detector"
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
             <SectionCard
                sectionId={3}
                title="3.1 How to Spot Delirium"
                onComplete={handleSectionComplete}
                isCompleted={completedSections.has(3)}
            >
                <p>You know your loved one best. Your most important job is to spot sudden changes from their normal self. Delirium has a few key features:</p>
                <h4 className="font-semibold mt-4">The Core Signs</h4>
                <ul className="list-disc space-y-2 pl-5">
                    <li>
                        <strong>It Happens Suddenly & Comes and Goes:</strong> This is the biggest clue. They were fine yesterday, but today they are confused. You might also notice that they seem better in the morning but are much worse in the evening. This fluctuation is a hallmark of delirium.
                    </li>
                    <li>
                        <strong>They Can't Pay Attention (Inattention):</strong> This is the central feature. They might be unable to follow a conversation, be easily distracted by things in the room, or keep asking the same question over and over because they can't focus on the answer.
                    </li>
                </ul>
                <h4 className="font-semibold mt-4">The Two "Types" of Delirium</h4>
                <p>Delirium can look very different from person to person.</p>
                <ul className="list-disc space-y-2 pl-5">
                    <li>
                        <strong>Hyperactive Delirium (The Agitated Type):</strong> This is the type most people think of. The person may be restless, agitated, trying to get out of bed, pulling at IV lines, or seeing things that aren't there (hallucinations).
                    </li>
                     <li>
                        <strong>Hypoactive Delirium (The Quiet Type):</strong> This is actually more common and much harder to spot. The person is quiet, sleepy, withdrawn, and lethargic. It's easy to mistake this for depression or simply being tired from being sick. This type is just as serious.
                    </li>
                </ul>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="item-4">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <UserCheck className="h-6 w-6 text-primary" />
              Chapter 4: Your Role in Prevention and Care
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <SectionCard
                sectionId={4}
                title="4.1 Your Role as Caregiver"
                onComplete={handleSectionComplete}
                isCompleted={completedSections.has(4)}
            >
                <p>You are a vital member of the care team. Your presence and actions can make a huge difference.</p>
                <ul className="list-disc space-y-2 pl-5">
                    <li><strong>Be the Information Source:</strong> Tell the nurses and doctors what your loved one's normal mental state is like. This "baseline" information is critical for them to recognize a change.</li>
                    <li><strong>Create a Familiar Environment:</strong> Bring in family photos, a favorite blanket, or a clock from home. Make sure they have their glasses and hearing aids. Being able to see and hear clearly reduces confusion.</li>
                    <li><strong>Support Normal Routines:</strong> Help keep the room bright and active during the day. At night, help make it dark and quiet to promote sleep. As soon as it's safe, encourage them to get out of bed for meals and to walk in the hallway with help.</li>
                    <li><strong>Hydration:</strong> Gently encourage them to take sips of water or other fluids throughout the day.</li>
                    <li><strong>Communicate Calmly:</strong> Speak in a calm, simple manner. Reassure them if they are frightened. Avoid arguing or trying to reason with them if they are confused.</li>
                </ul>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-5">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Pill className="h-6 w-6 text-primary" />
              Chapter 5: Managing Difficult Behaviors and Understanding Medications
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
             <SectionCard
                sectionId={5}
                title="5.1 Managing Behaviors"
                onComplete={handleSectionComplete}
                isCompleted={completedSections.has(5)}
            >
                <h4 className="font-semibold">A Helpful Approach: Tolerate, Anticipate, Don't Agitate</h4>
                <p>When your loved one is agitated, it's often because they are trying to communicate an unmet need.</p>
                <ul className="list-disc space-y-2 pl-5">
                    <li>
                        <strong>Tolerate:</strong> If a behavior isn't harmful (like fidgeting with blankets), it's often best to allow it rather than trying to stop it, which can cause more agitation.
                    </li>
                    <li>
                        <strong>Anticipate:</strong> Think about what they might need. Are they in pain? Do they need to use the bathroom? Are they thirsty? Try to meet these needs before they become distressed.
                    </li>
                    <li>
                        <strong>Don't Agitate:</strong> The confused brain can't handle a lot of questions or commands. Instead of asking "Are you in pain?", you could say "It's time for your pain medicine."
                    </li>
                </ul>
                 <h4 className="font-semibold mt-4">5.2 The Truth About Medications for Delirium</h4>
                <p>This is one of the most important things for families to understand.</p>
                <ul className="list-disc space-y-2 pl-5">
                    <li>There is no "cure" medication for delirium. The only way to treat delirium is to find and fix the underlying cause (like treating the infection).</li>
                    <li>Antipsychotic medications (like Haldol or Risperdal) do not treat delirium. Studies have shown they don't make it go away faster or reduce its severity.</li>
                    <li>These medications have serious risks, including an increased risk of stroke and death in older adults with dementia.</li>
                    <li>They should only be used as a last resort if a person's agitation is so severe that they are a danger to themselves or others, and only after all other calming methods have failed. If they are used, it should be for the shortest time possible. Always ask the doctor what the plan is to stop the medication.</li>
                </ul>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>
        
      </Accordion>
    </div>
  );
}
