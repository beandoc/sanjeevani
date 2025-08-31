
'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ArrowLeft, Dumbbell, HeartPulse, Bone, Shield, AlertTriangle, Stethoscope, Users } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useProfile } from '@/context/role-context';
import { useEffect, useState } from 'react';
import { SectionCard } from '@/components/cards/section-card';

const MODULE_ID = 'strength-training';
const SECTIONS = 4;

export default function StrengthTrainingProfessionalPage() {
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
          Prescribing Exercise for Older Adults
        </h1>
        <p className="text-muted-foreground">
          A module for healthcare professionals on promoting and prescribing physical activity.
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
        <AccordionItem value="item-1">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Stethoscope className="h-6 w-6 text-primary" />
              Physical Activity vs. Exercise
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 space-y-4">
            <SectionCard
              sectionId={1}
              title="Key Definitions for Clinical Practice"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(1)}
            >
                <p>
                  Understanding the distinction is crucial for patient education and prescription.
                </p>
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    <strong>Physical Activity:</strong> Any bodily movement that increases energy expenditure. Advise patients to integrate this into their lifestyle (e.g., gardening, taking stairs).
                  </li>
                  <li>
                    <strong>Exercise:</strong> Planned, structured, and repetitive activity with the goal of improving one or more components of fitness. This is what you formally prescribe.
                  </li>
                </ul>
                <p className="mt-4">
                  Physical function, measured by tools like gait speed or handgrip strength, is a powerful biomarker. It is often a better predictor of mortality and disability than the presence of many chronic diseases.
                </p>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-primary" />
              Principles of Exercise Prescription
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 space-y-4">
             <SectionCard
              sectionId={2}
              title="Prescription Principles"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(2)}
            >
                <ul className="list-disc space-y-4 pl-5 text-muted-foreground">
                    <li>
                        <strong className="text-card-foreground">Dose-Response Relationship:</strong> The benefits of exercise are tied to volume and intensity. A program to prevent disease may be insufficient to treat it. For example, high-intensity resistance training is more effective for cognitive decline than gentle stretching.
                    </li>
                    <li>
                        <strong className="text-card-foreground">Synergistic Modalities:</strong> A single exercise type is not enough. A comprehensive program must include multiple components to be effective.
                        <ul className="list-disc space-y-2 pl-5 mt-2">
                        <li><strong>Resistance Training:</strong> Critical for combating sarcopenia.</li>
                        <li><strong>Balance Training:</strong> Essential for fall prevention.</li>
                        <li><strong>Aerobic Activity:</strong> Crucial for cardiovascular health.</li>
                        </ul>
                    </li>
                    <li>
                        <strong className="text-card-foreground">The Importance of Power:</strong> Muscle power (generating force quickly) declines more rapidly than strength. Power training (explosive resistance exercises) is highly effective for improving functional outcomes in both fit and frail older adults.
                    </li>
                    <li>
                        <strong className="text-card-foreground">Address the Vicious Cycle:</strong> Higher perceived effort leads to inactivity and further deconditioning. Your role is to prescribe an appropriately dosed program to break this cycle and restore confidence.
                    </li>
                </ul>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="item-3">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <HeartPulse className="h-6 w-6 text-primary" />
              Exercise for Specific Medical Conditions
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 space-y-4">
            <SectionCard
              sectionId={3}
              title="Exercise for Chronic Conditions"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(3)}
            >
                <p>Strength training is a powerful tool in managing many chronic diseases:</p>
                <ul className="list-disc space-y-4 pl-5">
                <li>
                    <strong className="font-semibold text-card-foreground">Metabolic Health (Obesity, Diabetes):</strong> By building muscle, the body has more space to store glucose, which improves blood sugar control. It helps preserve muscle during weight loss and can reduce abdominal fat.
                </li>
                <li>
                    <strong className="font-semibold text-card-foreground">Cardiovascular Health (Heart Disease, Hypertension):</strong> It can lower blood pressure, improve cholesterol profiles, and is beneficial for patients with stable coronary artery disease and even chronic heart failure.
                </li>
                <li>
                    <strong className="font-semibold text-card-foreground">Musculoskeletal Health (Sarcopenia, Osteoarthritis, Back Pain):</strong> It's the most effective way to combat age-related muscle loss (sarcopenia). For osteoarthritis, strengthening the muscles around an affected joint can reduce pain and improve function. It can also alleviate chronic low back pain by strengthening the entire body.
                </li>
                </ul>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="item-4">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-destructive" />
              Understanding the Risks
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 space-y-4">
            <SectionCard
              sectionId={4}
              title="Safety and Risks"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(4)}
            >
                <p>
                When done correctly, strength training is extremely safe. Most injuries are due to poor technique or trying to do too much, too soon.
                </p>
                <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
                    <li>
                        <strong>Musculoskeletal Injury:</strong> The risk of strains or sprains is low with proper form and gradual progression. Most injuries are minor and heal quickly.
                    </li>
                    <li>
                        <strong>Cardiovascular Events:</strong> For those with known or occult heart disease, any vigorous exercise carries a small, temporary risk. Patients with stable heart conditions benefit greatly, but those with unstable symptoms should seek medical attention before exercising.
                    </li>
                    <li>
                        <strong>Special Populations:</strong> Patients with conditions like uncontrolled hypertension, advanced diabetic retinopathy, or recent aortic dissection should consult with you to determine safe exercise modifications.
                    </li>
                </ul>
                <p className="mt-4 font-semibold text-card-foreground">
                    The key to safety is starting with a manageable weight, focusing on good form, and increasing the challenge slowly and progressively over time.
                </p>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
