
'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ArrowLeft, Stethoscope, Brain, Shield, Pill, Activity, Microscope } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useProfile } from '@/context/role-context';
import { useEffect, useState } from 'react';
import { SectionCard } from '@/components/cards/section-card';

const MODULE_ID = 'dementia-care-professional';
const SECTIONS = 5;

export default function DeliriumProfessionalPage() {
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
          A Comprehensive Nursing Guide to Delirium in the Older Adult
        </h1>
        <p className="text-muted-foreground">
          This lesson provides a detailed clinical framework for the assessment, differential diagnosis, and complex management of delirium in geriatric patients.
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
        <AccordionItem value="item-1">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Brain className="h-6 w-6 text-primary" />
              Chapter 1: The Foundations of Delirium
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 space-y-4">
            <SectionCard
                sectionId={1}
                title="1.1 Defining Delirium"
                onComplete={handleSectionComplete}
                isCompleted={completedSections.has(1)}
            >
                <p>
                  Delirium is a complex and acute neuropsychiatric syndrome, often described as acute brain failure. It represents a final common pathway for many acute illnesses and is characterized by a disturbance in attention, awareness, and cognition. Its presentation is highly variable, ranging from hypoactive lethargy to hyperactive agitation.
                </p>
                 <h4 className="font-semibold mt-4">1.2 Epidemiology and Consequences</h4>
                 <p>Delirium is a medical emergency associated with significant morbidity, mortality, and cost. It can accelerate cognitive decline, increase the risk of institutionalization, and lead to poorer functional outcomes.</p>
                 <h4 className="font-semibold mt-4">1.3 Delirium Phenotypes</h4>
                 <p>Recognizing motor subtypes (hypoactive, hyperactive, mixed) and clinical phenotypes (Postoperative Delirium, Delirium Superimposed on Dementia) is useful as they may have different etiologies and management strategies.</p>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Microscope className="h-6 w-6 text-primary" />
              Chapter 2: Pathophysiology and Risk Factors
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 space-y-4">
             <SectionCard
                sectionId={2}
                title="2.1 Pathophysiology and Risk Factors"
                onComplete={handleSectionComplete}
                isCompleted={completedSections.has(2)}
            >
                <h4 className="font-semibold">Pathophysiology</h4>
                <p>The Systems Integration Failure Hypothesis (SIFH) suggests delirium results from a breakdown in neuronal network connectivity, driven by factors like neuronal aging, neuroinflammation, and neurotransmitter imbalances. This complexity helps explain why single-agent pharmacological treatments have failed.</p>
                <h4 className="font-semibold mt-4">Predisposing and Precipitating Factors</h4>
                 <p>A patient's risk is a function of their baseline vulnerability (predisposing factors like dementia or frailty) and the acute insults they endure (precipitating factors like infection or new medications). Use mnemonics like "DELIRIUM IS VERY PAINFUL" to recall common triggers.</p>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="item-3">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Stethoscope className="h-6 w-6 text-primary" />
              Chapter 3: Clinical Identification and Diagnosis
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 space-y-4">
            <SectionCard
                sectionId={3}
                title="Screening vs. Diagnosis"
                onComplete={handleSectionComplete}
                isCompleted={completedSections.has(3)}
            >
                    <p>The gold standard for diagnosis remains the DSM-5 criteria. Daily screening of all hospitalized older adults is essential for early detection. The Confusion Assessment Method (CAM) is the most widely used tool, requiring (1) Acute Onset and Fluctuating Course and (2) Inattention, plus either (3) Disorganized Thinking or (4) Altered Level of Consciousness.</p>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="item-4">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-primary" />
              Chapter 4: Prevention - The First Line of Defense
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 space-y-4">
            <SectionCard
                sectionId={4}
                title="Prevention Strategies"
                onComplete={handleSectionComplete}
                isCompleted={completedSections.has(4)}
            >
                <p>Up to 40% of delirium cases are preventable through multicomponent, non-pharmacological interventions.</p>
                <h4 className="font-semibold mt-2">Evidence-Based Prevention Models</h4>
                <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Hospital Elder Life Program (HELP):</strong> A protocol-driven program targeting six key risk factors: cognitive impairment, sleep deprivation, immobility, vision impairment, hearing impairment, and dehydration.</li>
                    <li><strong>ABCDEF Bundle (for ICU):</strong> A mnemonic for a comprehensive bundle of care practices including pain management, early mobility, and family engagement.</li>
                </ul>
                <h4 className="font-semibold mt-4">Medication Management as Prevention</h4>
                <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Avoid High-Risk Medications:</strong> Scrutinize the medication list for anticholinergics (diphenhydramine), benzodiazepines, and other psychoactive drugs.</li>
                    <li><strong>Judicious Deprescribing:</strong> Taper chronic benzodiazepines or certain antidepressants to avoid withdrawal syndromes that can precipitate delirium.</li>
                </ul>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>

         <AccordionItem value="item-5">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Activity className="h-6 w-6 text-primary" />
              Chapter 5: Management of Delirium
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 space-y-4">
             <SectionCard
                sectionId={5}
                title="Management Strategies"
                onComplete={handleSectionComplete}
                isCompleted={completedSections.has(5)}
            >
                <h4 className="font-semibold">Non-Pharmacological Management: The Mainstay of Treatment</h4>
                <p>Once delirium occurs, non-pharmacological measures are the primary treatment. The T-A-DA (Tolerate, Anticipate, Don't Agitate) method is a useful behavioral management approach. This involves tolerating non-dangerous behaviors, anticipating patient needs, and minimizing agitating triggers.</p>
                <h4 className="font-semibold mt-4">Pharmacological Management: A Limited and High-Risk Role</h4>
                <p className="font-semibold">No agents are approved by the FDA for the treatment of delirium.</p>
                <ul className="list-disc pl-5 space-y-2 mt-2">
                    <li><strong>Benzodiazepines:</strong> Should not be used, as they can worsen delirium. The only exceptions are deliria due to alcohol or benzodiazepine withdrawal.</li>
                    <li><strong>Antipsychotics (e.g., Haloperidol):</strong> Have failed to show efficacy in reducing delirium duration or severity. They carry a Black Box warning for increased mortality in patients with dementia. Their use should be reserved only for cases where severe agitation poses an imminent danger, and only after all non-pharmacological methods have failed.</li>
                </ul>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
