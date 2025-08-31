
'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ArrowLeft, Brain, Microscope, Search, ShieldCheck, Activity, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useProfile } from '@/context/role-context';
import { useEffect, useState } from 'react';

const MODULE_ID = 'alzheimers-caregiver';
const SECTIONS = 5;

const SectionCard = ({
  title,
  children,
  sectionId,
  onComplete,
  isCompleted,
}: {
  title: string;
  children: React.ReactNode;
  sectionId: number;
  onComplete: (id: number) => void;
  isCompleted: boolean;
}) => (
  <Card>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">{children}</CardContent>
    <CardFooter>
      <Button
        onClick={() => onComplete(sectionId)}
        disabled={isCompleted}
        variant={isCompleted ? 'secondary' : 'default'}
      >
        <CheckCircle2 className="mr-2 h-4 w-4" />
        {isCompleted ? 'Completed' : 'Mark as Complete'}
      </Button>
    </CardFooter>
  </Card>
);

export default function AlzheimersCaregiverPage() {
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
          A Detailed Caregiver's Guide to Understanding Alzheimer's Disease
        </h1>
        <p className="text-muted-foreground">
          This guide provides families with in-depth information to understand what Alzheimer's is, how it progresses, how it is diagnosed, and how to recognize and manage the challenging behavioral changes that are part of the disease.
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
        <AccordionItem value="item-1">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Brain className="h-6 w-6 text-primary" />
              Chapter 1: What is Alzheimer's Disease?
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 space-y-4">
             <SectionCard
              sectionId={1}
              title="1.1 The Basics of the Disease"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(1)}
            >
              <p>
                Alzheimer's is a physical disease that causes a slow decline in memory, thinking, and reasoning skills. It is not a normal part of aging. It is the most common cause of dementia.
              </p>
              <p className="mt-4 font-semibold">What's Happening Inside the Brain?</p>
              <p>
                To understand Alzheimer's, it helps to picture the brain as a massive, busy network of communication lines. The disease creates two types of "roadblocks" that disrupt this communication:
              </p>
              <ul className="list-disc space-y-2 pl-5">
                  <li><strong>Plaques:</strong> These are sticky clumps that build up between the brain cells.</li>
                  <li><strong>Tangles:</strong> These are twisted fibers that build up inside the brain cells.</li>
              </ul>
              <p>
                Over many years, these plaques and tangles damage and kill brain cells, causing the brain to shrink and leading to the symptoms we see. This process actually starts long before any memory problems are noticeable.
              </p>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-primary" />
              Chapter 2: Understanding Risk Factors
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 space-y-4">
             <SectionCard
              sectionId={2}
              title="2.1 Things We Can and Can't Change"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(2)}
            >
              <p className="font-semibold">Things We Can't Change</p>
              <p>Some risk factors are simply part of who we are. It's important to remember that having a risk factor does not mean a person will get the disease.</p>
              <ul className="list-disc space-y-2 pl-5">
                  <li><strong>Age:</strong> This is the single biggest risk factor. The older a person gets, the higher their risk.</li>
                  <li><strong>Genetics:</strong> While rare, directly inherited forms exist. For most people, a gene called ApoE4 can increase the risk, but many people with this gene never get Alzheimer's, and many who get Alzheimer's don't have this gene.</li>
              </ul>
              <p className="font-semibold mt-4">Things We Can Influence</p>
              <p>Research shows that a healthy lifestyle can help protect the brain. You can play a huge role in encouraging these habits. The seven most important areas to focus on are:</p>
              <ul className="list-disc space-y-2 pl-5">
                  <li>Staying physically active.</li>
                  <li>Managing blood pressure and diabetes, especially in middle age.</li>
                  <li>Maintaining a healthy weight.</li>
                  <li>Not smoking.</li>
                  <li>Seeking treatment for depression.</li>
                  <li>Staying mentally and socially engaged.</li>
                  <li>Eating a healthy diet with plenty of fish, fruits, and vegetables.</li>
              </ul>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-3">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Activity className="h-6 w-6 text-primary" />
              Chapter 3: The Journey Through Alzheimer's
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <SectionCard
              sectionId={3}
              title="3.1 Understanding the Stages"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(3)}
            >
              <p>Alzheimer's progresses along a continuum. Recognizing these stages can help you understand the changes you are seeing.</p>
              <h4 className="font-semibold mt-4">The Earliest Sign: Subjective Cognitive Decline (SCD)</h4>
              <p>This is when a person starts to notice their own memory is slipping, but their performance on memory tests is still normal. It can be caused by many things, like stress, but it's important to mention it to the doctor.</p>
              <h4 className="font-semibold mt-4">The "In-Between" Stage: Mild Cognitive Impairment (MCI)</h4>
              <p>MCI is diagnosed when memory or thinking problems are noticeable to others and can be measured on tests, but the person is still able to manage their everyday life independently. They may need help with complex tasks like managing finances, but they can still handle their basic personal care.</p>
              <h4 className="font-semibold mt-4">The Dementia Stage</h4>
              <p>Dementia is diagnosed when the thinking and memory problems have become severe enough to interfere with a person's ability to live safely and independently. This stage is often broken down into:</p>
              <ul className="list-disc space-y-2 pl-5">
                  <li><strong>Mild:</strong> The person needs help with some daily tasks (like paying bills or remembering appointments) but can still manage many things on their own.</li>
                  <li><strong>Moderate:</strong> The person needs more help with basic tasks like dressing and grooming. Confusion worsens, and personality changes may become more pronounced.</li>
                  <li><strong>Severe:</strong> The person requires full-time, hands-on care for all their basic needs.</li>
              </ul>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="item-4">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Search className="h-6 w-6 text-primary" />
              Chapter 4: How a Diagnosis is Made
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <SectionCard
              sectionId={4}
              title="4.1 Your Role and What to Expect"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(4)}
            >
              <p className="font-semibold">Your Role as the Expert Observer</p>
              <p>There is no single, simple test for Alzheimer's. The doctor will act like a detective, putting together clues from many sources. You are the most important source of clues. Your description of the changes you've seen in your loved one over time is critical to the diagnosis.</p>
              <p className="font-semibold mt-4">What to Expect at the Appointment</p>
              <ul className="list-disc space-y-2 pl-5">
                  <li><strong>A Detailed Conversation:</strong> The doctor will ask about what symptoms you've noticed, when they started, and how they affect daily life.</li>
                  <li><strong>Memory and Thinking Tests:</strong> The doctor will do some brief tests in the office, like the "five-word test" or the "Mini-Mental State Exam" (MMSE) to get a snapshot of their cognitive function. They may also refer your loved one to a neuropsychologist for more detailed testing.</li>
                  <li><strong>Brain Scans (CT or MRI):</strong> A brain scan is a standard part of the workup. Its purpose is twofold:
                      <ul className="list-disc space-y-2 pl-5 mt-2">
                          <li>To rule out other problems that can cause memory loss, like a stroke, brain tumor, or fluid on the brain.</li>
                          <li>To look for signs of brain shrinkage, especially in the memory centers (the hippocampus), which is a hallmark of AD.</li>
                      </ul>
                  </li>
                  <li><strong>Other Advanced Tests:</strong> In some cases, especially when the diagnosis is unclear, the doctor may suggest a spinal tap (lumbar puncture) to look for the plaque and tangle proteins in the spinal fluid, or a special PET scan to see amyloid plaques in the brain.</li>
              </ul>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="item-5">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Microscope className="h-6 w-6 text-primary" />
              Chapter 5: Managing Behavioral Changes
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
             <SectionCard
              sectionId={5}
              title="5.1 Why Behaviors Change and What to Look For"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(5)}
            >
                <p className="font-semibold">Why Do Behaviors Change?</p>
                <p>The damage to the brain from Alzheimer's can cause changes in personality, mood, and behavior. It is crucial to remember that these behaviors are a symptom of the disease, not a willful act.</p>
                <p className="font-semibold mt-4">Common Behaviors in the Early and Moderate Stages</p>
                <p>The most common behavioral changes are often subtle at first. You might notice:</p>
                <ul className="list-disc space-y-2 pl-5">
                    <li><strong>Apathy:</strong> A loss of motivation and interest in activities they used to enjoy.</li>
                    <li><strong>Anxiety:</strong> Feeling worried, restless, or on edge.</li>
                    <li><strong>Depression (Dysphoria):</strong> Feeling sad, tearful, or hopeless.</li>
                    <li><strong>Irritability:</strong> Being easily annoyed or having a "short fuse."</li>
                    <li><strong>Agitation:</strong> Restlessness, pacing, or an inability to sit still.</li>
                </ul>
                <p className="mt-4 text-sm text-muted-foreground">When you see the doctor, they may use a questionnaire called the Neuropsychiatric Inventory (NPI). This is not a test for your loved one, but a structured way for the doctor to ask you about these behaviors. It helps them understand the severity of the symptoms and the amount of stress it is causing you as the caregiver, which is a very important part of the care plan.</p>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>
        
      </Accordion>
    </div>
  );
}
