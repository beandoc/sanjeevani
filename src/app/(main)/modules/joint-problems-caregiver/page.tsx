
'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ArrowLeft, Bone, Shield, Utensils, HeartPulse, Activity } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useProfile } from '@/context/role-context';
import { useEffect, useState } from 'react';
import { SectionCard } from '@/components/cards/section-card';

const MODULE_ID = 'joint-problems-caregiver';
const SECTIONS = 4;

export default function JointProblemsCaregiverPage() {
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
          Understanding Joint Pain & Arthritis
        </h1>
        <p className="text-muted-foreground">
          A guide for caregivers on managing common joint problems like osteoarthritis and gout.
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
        <AccordionItem value="item-1">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Bone className="h-6 w-6 text-primary" />
              Osteoarthritis (OA): The "Wear and Tear" Arthritis
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <SectionCard
              sectionId={1}
              title="What is Osteoarthritis?"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(1)}
            >
                <p>
                  Osteoarthritis is the most common type of arthritis in older adults. It happens when the protective cartilage that cushions the ends of the bones wears down over time. It often affects the hands, knees, hips, and spine.
                </p>
                <h4 className="font-semibold">Key Signs to Watch For:</h4>
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    <strong>Pain:</strong> The joint may hurt during or after movement.
                  </li>
                  <li>
                    <strong>Stiffness:</strong> Joint stiffness is most noticeable upon waking up or after being inactive. It usually lasts for less than an hour.
                  </li>
                  <li>
                    <strong>Bony Lumps:</strong> Hard lumps can form around the affected joint, especially on the fingers.
                  </li>
                   <li>
                    <strong>Loss of Flexibility:</strong> They may not be able to move the joint through its full range of motion.
                  </li>
                </ul>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-primary" />
              Gout: Sudden and Severe Attacks
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <SectionCard
              sectionId={2}
              title="What is Gout?"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(2)}
            >
                <p>Gout is a form of inflammatory arthritis characterized by sudden, severe attacks of pain, swelling, redness, and tenderness in the joints, often at the base of the big toe. It's caused by the buildup of uric acid crystals in a joint.</p>
                 <h4 className="font-semibold">Key Signs of a Gout Attack:</h4>
                 <ul className="list-disc space-y-2 pl-5">
                    <li>
                        <strong>Intense Joint Pain:</strong> Gout usually affects the large joint of the big toe, but it can occur in any joint.
                    </li>
                    <li>
                        <strong>Lingering Discomfort:</strong> After the most severe pain subsides, some joint discomfort may last from a few days to a few weeks.
                    </li>
                    <li>
                        <strong>Inflammation and Redness:</strong> The affected joint becomes swollen, tender, warm, and red.
                    </li>
                </ul>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-3">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Activity className="h-6 w-6 text-primary" />
              Non-Medication Management Strategies
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <SectionCard
              sectionId={3}
              title="Helping to Manage Pain and Improve Function"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(3)}
            >
                <p>
                  For many types of arthritis, non-drug therapies are the cornerstone of management.
                </p>
                <ul className="list-disc space-y-2 pl-5">
                    <li>
                        <strong>Exercise:</strong> Gentle exercises like walking, swimming, or tai chi can strengthen the muscles around joints, improve flexibility, and reduce pain. A physical therapist can create a safe program.
                    </li>
                    <li>
                        <strong>Weight Management:</strong> If overweight, losing even a small amount of weight can significantly reduce stress on weight-bearing joints like the hips and knees.
                    </li>
                    <li>
                        <strong>Assistive Devices:</strong> Canes or walkers can help reduce the load on a painful joint and improve stability, reducing the risk of falls.
                    </li>
                     <li>
                        <strong>Braces or Splints:</strong> These can help support and protect a painful joint during activities.
                    </li>
                </ul>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="item-4">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Utensils className="h-6 w-6 text-primary" />
              Dietary Considerations for Gout
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <SectionCard
              sectionId={4}
              title="Foods to Limit"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(4)}
            >
                 <p>For individuals with gout, certain foods can trigger an attack by raising uric acid levels.</p>
                 <ul className="list-disc space-y-2 pl-5">
                    <li>
                        <strong>Red Meat and Organ Meats:</strong> These are high in purines, which the body breaks down into uric acid.
                    </li>
                    <li>
                        <strong>Seafood:</strong> Certain types of seafood, like shellfish, are also high in purines.
                    </li>
                    <li>
                        <strong>Alcohol:</strong> Beer and liquor, in particular, can increase uric acid levels and trigger gout attacks.
                    </li>
                </ul>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
