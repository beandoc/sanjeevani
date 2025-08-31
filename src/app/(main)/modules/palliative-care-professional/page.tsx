
'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ArrowLeft, Stethoscope, MessageSquare, ShieldPlus, Users } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useProfile } from '@/context/role-context';
import { useEffect, useState } from 'react';
import { SectionCard } from '@/components/cards/section-card';

const MODULE_ID = 'palliative-care-professional';
const SECTIONS = 3;

export default function PalliativeCareProfessionalPage() {
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
          Principles of Geriatric Palliative Care
        </h1>
        <p className="text-muted-foreground">
          An evidence-based module for health professionals on integrating palliative care for older adults with serious illness.
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
        <AccordionItem value="item-1">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Stethoscope className="h-6 w-6 text-primary" />
              Core Concepts and Patient Identification
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 space-y-4">
            <SectionCard
              sectionId={1}
              title="Defining Palliative Care and Identifying Patients"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(1)}
            >
                <p>
                  Palliative care is patient- and family-centered care that optimizes quality of life by anticipating, preventing, and treating suffering. It is appropriate at any age and at any stage in a serious illness and can be provided along with curative treatment.
                </p>
                <p>
                  In geriatrics, this is particularly crucial for patients with frailty, multimorbidity, and functional decline, where traditional disease-focused models may not align with patient goals.
                </p>
                <h4 className="font-semibold">Key Triggers for Palliative Care Consultation:</h4>
                 <ul className="list-disc space-y-2 pl-5">
                    <li>
                        <strong>Frequent hospitalizations:</strong> Two or more admissions for the same condition within a year.
                    </li>
                    <li>
                        <strong>Difficult-to-control symptoms:</strong> Persistent pain, dyspnea, nausea, or delirium despite standard treatment.
                    </li>
                    <li>
                        <strong>Functional decline:</strong> Unintentional weight loss, decreased mobility, or loss of ADL/IADL function.
                    </li>
                    <li>
                        <strong>Complex care needs:</strong> Multiple comorbidities, polypharmacy, and psychosocial distress.
                    </li>
                     <li>
                        <strong>Prognostic uncertainty:</strong> When asked the "surprise question": "Would you be surprised if this patient died in the next year?" and the answer is "no."
                    </li>
                </ul>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <ShieldPlus className="h-6 w-6 text-primary" />
              Domains of Palliative Assessment
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 space-y-4">
            <SectionCard
              sectionId={2}
              title="A Multi-Domain Assessment"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(2)}
            >
                <p className="text-muted-foreground">A comprehensive palliative assessment extends beyond the primary diagnosis. It should systematically evaluate multiple domains:</p>
                <ul className="list-disc space-y-4 pl-5">
                <li>
                    <strong className="font-semibold text-card-foreground">Physical Symptoms:</strong> Utilize validated scales (e.g., Edmonton Symptom Assessment System [ESAS], numeric rating scales for pain) to assess and monitor common symptoms like pain, dyspnea, fatigue, and constipation.
                </li>
                <li>
                    <strong className="font-semibold text-card-foreground">Psychosocial and Emotional Well-being:</strong> Screen for anxiety and depression (e.g., PHQ-9, GAD-7). Assess for social support, caregiver distress, and financial concerns.
                </li>
                <li>
                    <strong className="font-semibold text-card-foreground">Spiritual Needs:</strong> Explore sources of hope, meaning, and comfort. Spiritual distress is common in serious illness and can impact coping and decision-making. The FICA tool (Faith, Importance, Community, Address) can be a useful guide.
                </li>
                <li>
                    <strong className="font-semibold text-card-foreground">Understanding of Illness and Prognosis:</strong> Assess the patient's and family's understanding of the medical condition, its trajectory, and the goals of care. Address any misconceptions gently.
                </li>
                </ul>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-3">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-6 w-6 text-primary" />
              Communication and Goals of Care
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 space-y-4">
            <SectionCard
              sectionId={3}
              title="Communication Skills"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(3)}
            >
                <p>Effective communication is a cornerstone of palliative care. It is a procedural skill that can be learned and practiced.</p>
                <h4 className="font-semibold text-lg">Structured Communication Frameworks:</h4>
                <ul className="list-disc space-y-2 pl-5">
                <li>
                    <strong>SPIKES Protocol:</strong> A six-step protocol for delivering bad news (Setting, Perception, Invitation, Knowledge, Emotions, Strategy/Summary).
                </li>
                <li>
                    <strong>Ask-Tell-Ask:</strong> Assess the patient's understanding, provide information in small chunks, and then check their understanding before proceeding.
                </li>
                <li>
                    <strong>NURSE Mnemonic for Empathy:</strong> Naming the emotion, Understanding, Respecting, Supporting, and Exploring.
                </li>
                </ul>
                <h4 className="font-semibold text-lg mt-4">Goals of Care Discussions</h4>
                <ul className="list-disc space-y-2 pl-5">
                <li>
                    Move beyond the code status. Explore the patient's values, fears, and what makes life worth living for them.
                </li>
                <li>
                    Use open-ended questions: "What's most important to you as you think about the future?" or "What are you worried about?"
                </li>
                <li>
                    Make a recommendation based on the patient's goals. Frame treatment options in the context of what they can help the patient achieve (e.g., "This treatment may not cure the illness, but it could give you more time with good quality of life at home.").
                </li>
                </ul>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
