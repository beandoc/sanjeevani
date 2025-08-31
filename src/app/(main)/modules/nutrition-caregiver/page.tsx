
'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ArrowLeft, Utensils, Search, Brain, Handshake, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useProfile } from '@/context/role-context';
import { useEffect, useState } from 'react';
import { SectionCard } from '@/components/cards/section-card';

const MODULE_ID = 'nutrition-caregiver';
const SECTIONS = 4;

export default function NutritionCaregiverPage() {
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
          Nutrition and Feeding: A Caregiver's Guide
        </h1>
        <p className="text-muted-foreground">
          Understanding malnutrition and feeding problems in older adults.
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
        <AccordionItem value="item-1">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Search className="h-6 w-6 text-primary" />
              Recognizing Malnutrition
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <SectionCard
              sectionId={1}
              title="What is Malnutrition?"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(1)}
            >
                <p>
                  Malnutrition means an imbalance of nutrients. In older adults, it usually means "undernutrition"—not getting enough calories, protein, or other nutrients needed to keep the body healthy. It's a serious issue linked to more frequent hospital visits, falls, and other negative outcomes.
                </p>
                <h4 className="font-semibold">Key Signs to Watch For:</h4>
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    <strong>Unintentional Weight Loss:</strong> Losing weight without trying, especially a noticeable amount (e.g., 10 pounds in 6 months).
                  </li>
                  <li>
                    <strong>Poor Appetite:</strong> A consistent lack of interest in food or eating very little.
                  </li>
                  <li>
                    <strong>Fatigue and Weakness:</strong> A general loss of energy, strength, and increased tiredness.
                  </li>
                   <li>
                    <strong>Changes in Oral Health:</strong> Problems with teeth or dentures, or a dry mouth that makes it hard to eat.
                  </li>
                </ul>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Brain className="h-6 w-6 text-primary" />
              Common Causes and Risk Factors
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <SectionCard
              sectionId={2}
              title="Why Malnutrition Happens"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(2)}
            >
                 <p>Many factors can contribute to poor nutrition in older adults.</p>
                 <ul className="list-disc space-y-2 pl-5">
                    <li>
                        <strong>Social Factors:</strong> Eating alone, loneliness, or depression can reduce the desire to eat.
                    </li>
                    <li>
                        <strong>Financial Hardship:</strong> Not having enough money for nutritious food is a major barrier.
                    </li>
                    <li>
                        <strong>Physical Difficulties:</strong> Trouble shopping for food, cooking, or even feeding oneself due to mobility issues.
                    </li>
                    <li>
                        <strong>Medical Issues:</strong> Chronic illnesses, medication side effects that cause dry mouth or loss of taste, and dental problems can all impact eating.
                    </li>
                    <li>
                        <strong>Cognitive Changes:</strong> People with dementia may forget to eat or have changes in their brain that affect appetite.
                    </li>
                </ul>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-3">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-primary" />
              Feeding and Swallowing Problems (Dysphagia)
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <SectionCard
              sectionId={3}
              title="Identifying Swallowing Difficulties"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(3)}
            >
                <p>
                  Dysphagia is the medical term for difficulty swallowing. It's a common issue in older adults, especially after a stroke or with conditions like dementia.
                </p>
                <h4 className="font-semibold">Signs of a Swallowing Problem:</h4>
                <ul className="list-disc space-y-2 pl-5">
                    <li>
                        <strong>Coughing or Choking:</strong> Frequent coughing or choking during or after eating and drinking.
                    </li>
                    <li>
                        <strong>"Wet" or Gurgly Voice:</strong> A change in voice quality after swallowing.
                    </li>
                    <li>
                        <strong>Pocketing Food:</strong> Holding food in the cheeks instead of swallowing it.
                    </li>
                    <li>
                        <strong>Persistent Throat Clearing:</strong> Needing to clear the throat often while eating.
                    </li>
                </ul>
                <p className="mt-4 font-semibold text-destructive">If you notice these signs, it's crucial to report them to a doctor or speech therapist for a proper evaluation.</p>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="item-4">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Handshake className="h-6 w-6 text-primary" />
              Strategies to Help
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <SectionCard
              sectionId={4}
              title="Practical Tips to Improve Nutrition"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(4)}
            >
                 <ul className="list-disc space-y-2 pl-5">
                    <li>
                        <strong>Honor Food Preferences:</strong> Offer foods they enjoy. A favorite meal can be a powerful appetite stimulant.
                    </li>
                    <li>
                        <strong>Small, Frequent Meals:</strong> Six small meals may be less overwhelming than three large ones. Offer nutritious snacks between meals.
                    </li>
                    <li>
                        <strong>Fortify Foods:</strong> Increase calorie and protein content without increasing volume. Add protein powder, healthy oils, or cream to foods like oatmeal, soups, or mashed potatoes.
                    </li>
                     <li>
                        <strong>Create a Pleasant Mealtime Environment:</strong> Eat together, reduce distractions like the TV, and make mealtime a positive social event.
                    </li>
                    <li>
                        <strong>Offer Assistance:</strong> If needed, help with meal setup or feeding. Be patient and don't rush.
                    </li>
                     <li>
                        <strong>Look into Community Resources:</strong> Programs like Meals on Wheels can provide regular, nutritious meals for those who have trouble with food preparation.
                    </li>
                </ul>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
