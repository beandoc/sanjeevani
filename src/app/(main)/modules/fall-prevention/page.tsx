
'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Home, Shield, Utensils, HeartPulse, Phone, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useProfile } from '@/context/role-context';
import { useEffect, useState } from 'react';
import { SectionCard } from '@/components/cards/section-card';

const MODULE_ID = 'fall-prevention';
const SECTIONS = 5;

export default function FallPreventionModulePage() {
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
          Staying Steady and Safe: A Guide to Fall Prevention
        </h1>
        <p className="text-muted-foreground">
          This module is designed to empower older adults and their caregivers
          with the knowledge and tools to prevent falls and maintain
          independence.
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
        <AccordionItem value="item-1">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-primary" />
              Understanding Your Risk of Falling
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <SectionCard
                sectionId={1}
                title="Why falls happen more as we age"
                onComplete={handleSectionComplete}
                isCompleted={completedSections.has(1)}
            >
                <p>
                  As we get older, our bodies change. Common age-related changes like decreased vision, shifts in balance and muscle strength, and side effects from medications can make falls more likely.
                </p>
                <h4 className="font-semibold">What increases your personal risk?</h4>
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    <strong>Medical Conditions:</strong> Diagnoses like arthritis, osteoporosis, diabetes, or neurological disorders (e.g., Parkinson's disease) can affect your stability.
                  </li>
                  <li>
                    <strong>Medication Review:</strong> Certain medications, especially when taken together, can cause dizziness or drowsiness. It's vital to have a doctor or pharmacist review all your current medications regularly.
                  </li>
                  <li>
                    <strong>Previous Falls:</strong> If you've fallen in the past year, your risk of falling again is higher. This is often because the factors that caused the first fall are still present.
                  </li>
                  <li>
                    <strong>Sensory Changes:</strong> Changes in vision and hearing can significantly impact your balance and coordination.
                  </li>
                </ul>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Home className="h-6 w-6 text-primary" />
              Creating a Safe Home Environment
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <SectionCard
                sectionId={2}
                title="Practical steps for a safer home"
                onComplete={handleSectionComplete}
                isCompleted={completedSections.has(2)}
            >
                 <ul className="list-disc space-y-2 pl-5">
                    <li>
                        <strong>Clear the Clutter:</strong> Keep walkways clear of electrical cords, throw rugs, and other obstacles that could cause tripping.
                    </li>
                    <li>
                        <strong>Improve Lighting:</strong> Add nightlights in hallways, bathrooms, and bedrooms. Make sure light switches are easy to reach.
                    </li>
                    <li>
                        <strong>Bathroom Safety:</strong> Install grab bars in the shower and next to the toilet. Use non-slip mats and consider a shower chair for added stability.
                    </li>
                    <li>
                        <strong>Stairway Safety:</strong> Ensure handrails are on both sides of the stairs and that stairways are always well-lit.
                    </li>
                    <li>
                        <strong>Kitchen Safety:</strong> Arrange frequently used items on lower shelves to avoid using a step stool. Clean up any spills immediately to prevent slipping.
                    </li>
                </ul>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-3">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <HeartPulse className="h-6 w-6 text-primary" />
              The Role of Physical Activity
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <SectionCard
                sectionId={3}
                title="Maintaining strength and balance through exercise"
                onComplete={handleSectionComplete}
                isCompleted={completedSections.has(3)}
            >
                <ul className="list-disc space-y-2 pl-5">
                    <li>
                        <strong>Strength and Balance Exercises:</strong> Simple exercises like chair yoga, tai chi, or leg lifts can improve leg strength and balance. Look for local classes or online videos designed for seniors.
                    </li>
                    <li>
                        <strong>Walking Aids:</strong> If you use a cane or walker, make sure it is the correct height and that the rubber tips are not worn down. A physical therapist can help fit it properly.
                    </li>
                    <li>
                        <strong>Appropriate Footwear:</strong> Wear supportive, non-slip shoes both inside and outside the home. Avoid walking in socks or flimsy slippers.
                    </li>
                </ul>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-4">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Utensils className="h-6 w-6 text-primary" />
              Nutrition, Hydration, and Bone Health
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <SectionCard
                sectionId={4}
                title="How diet supports fall prevention"
                onComplete={handleSectionComplete}
                isCompleted={completedSections.has(4)}
            >
                <ul className="list-disc space-y-2 pl-5">
                    <li>
                        <strong>Vitamin D and Calcium:</strong> These are essential for strong bones. Get them from dairy products, fortified foods, and supplements if recommended by your doctor.
                    </li>
                    <li>
                        <strong>Stay Hydrated:</strong> Dehydration can cause dizziness and confusion. Drink plenty of water throughout the day.
                    </li>
                    <li>
                        <strong>Regular Meals:</strong> Don't skip meals. This helps prevent drops in blood sugar that can lead to lightheadedness and instability.
                    </li>
                </ul>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="item-5">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-primary" />
              What to Do If You Fall
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <SectionCard
                sectionId={5}
                title="Having a plan of action"
                onComplete={handleSectionComplete}
                isCompleted={completedSections.has(5)}
            >
                <ul className="list-disc space-y-2 pl-5">
                    <li>
                        <strong>How to Get Up Safely:</strong> Stay still for a moment to assess for injuries. If you feel you can get up, roll onto your hands and knees, crawl to a sturdy chair, and use it to help you stand.
                    </li>
                    <li>
                        <strong>When to Call for Help:</strong> If you are hurt or cannot get up, call for help. Use a medical alert device, a phone, or call out for assistance.
                    </li>
                    <li>
                        <strong>Emergency Plan:</strong> Consider a medical alert device, especially if you live alone. Keep a phone within reach at all times, and have emergency numbers posted in a visible place.
                    </li>
                </ul>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>

      </Accordion>
    </div>
  );
}
