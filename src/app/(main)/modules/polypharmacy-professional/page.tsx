
'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ArrowLeft, Stethoscope, AlertTriangle, Repeat, Activity } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useProfile } from '@/context/role-context';
import { useEffect, useState } from 'react';
import { SectionCard } from '@/components/cards/section-card';

const MODULE_ID = 'polypharmacy-professional';
const SECTIONS = 4;

export default function PolypharmacyProfessionalPage() {
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
          Medication Safety in Geriatric Care
        </h1>
        <p className="text-muted-foreground">
          A nurse's guide to identifying, preventing, and managing adverse drug events (ADEs) in older patients.
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
        <AccordionItem value="item-1">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Stethoscope className="h-6 w-6 text-primary" />
              Understanding the Scope of the Problem
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <SectionCard
              sectionId={1}
              title="ADEs: A Common and Preventable Harm"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(1)}
            >
                <p>
                  An Adverse Drug Event (ADE) is any harm involving a medication, including side effects and errors. With older adults receiving 59% of all prescriptions, your vigilance is critical.
                </p>
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    <strong>High Prevalence:</strong> About 20% of people over 70 take five or more medications (polypharmacy), significantly increasing ADE risk.
                  </li>
                  <li>
                    <strong>Hospital Impact:</strong> ADEs cause ~6.5% of hospital admissions for older adults and affect up to 37% of older inpatients.
                  </li>
                </ul>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-primary" />
              Vulnerability and Atypical Presentation
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <SectionCard
              sectionId={2}
              title="Why Older Adults Are More Susceptible"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(2)}
            >
                 <p>Vulnerability stems from comorbidity, frailty, and age-related physiological changes that alter drug pharmacokinetics and pharmacodynamics.</p>
                 <p>An ADE in an older adult often presents atypically as a geriatric syndrome. Be alert for:</p>
                 <ul className="list-disc space-y-2 pl-5 font-medium">
                    <li>Delirium (sudden confusion)</li>
                    <li>Falls</li>
                    <li>New-onset incontinence</li>
                    <li>Functional decline or loss of mobility</li>
                </ul>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-3">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Repeat className="h-6 w-6 text-primary" />
              The Prescribing Cascade
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <SectionCard
              sectionId={3}
              title="Your Role is to Break the Chain"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(3)}
            >
                <p>
                  The prescribing cascade is a dangerous cycle where a drug's side effect is misinterpreted as a new medical condition, leading to another prescription to treat the side effect.
                </p>
                <p className="font-semibold">When an older patient presents with a new symptom (especially a geriatric syndrome), always ask: "Could this be a medication side effect?" before assuming it's a new disease.</p>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="item-4">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Activity className="h-6 w-6 text-primary" />
              Nursing Interventions Across the Continuum
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <SectionCard
              sectionId={4}
              title="Key Actions at Transition Points"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(4)}
            >
                <h4 className="font-semibold">On Admission:</h4>
                <p>Obtain an accurate drug history, including OTCs and supplements. Use collateral history and probe for non-concordance.</p>
                <h4 className="font-semibold mt-2">During Ward Stay:</h4>
                <p>Perform ongoing monitoring for subtle ADE signs. Question the appropriateness of each drug, check renal function, and be vigilant with high-risk meds (anticoagulants, opiates).</p>
                <h4 className="font-semibold mt-2">At Discharge:</h4>
                <p>Conduct thorough medication reconciliation. Provide clear patient and family education on new meds, stopped meds, and specific side effects to watch for.</p>
                <p className="mt-2 font-medium">Utilize screening tools like the STOPP/START criteria to identify potentially inappropriate prescribing.</p>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
