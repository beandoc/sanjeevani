
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, PersonStanding, Users, HeartPulse, Recycle, Brain, Shield, Stethoscope } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

export default function GeriatricRehabilitationPage() {
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
          Geriatric Rehabilitation: Restoring Function and Independence
        </h1>
        <p className="text-muted-foreground">
          This module explains the goals and methods of rehabilitation for older adults to help them function at the highest possible level.
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
        <AccordionItem value="item-1">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Stethoscope className="h-6 w-6 text-primary" />
              Understanding Disability
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>The World Health Organization (WHO) Model</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  This model shows that a person's ability to function is a mix of their health condition, personal factors (like age and motivation), and environmental factors (like their home setup). Rehabilitation focuses on improving body function, ability to do tasks, and participation in life, not just treating the disease.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>The Person-Environment Fit Model</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  Disability happens when there's a mismatch between a person's abilities and the demands of a task or their environment. Rehabilitation works by either increasing the person's ability (e.g., through exercise) or reducing the task's demand (e.g., using a raised toilet seat).
                </p>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Brain className="h-6 w-6 text-primary" />
              Key Concepts in Geriatric Rehabilitation
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 space-y-4">
            <p className="text-muted-foreground">Three key ideas are central to understanding rehabilitation in older adults:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong>Frailty:</strong> This is a state of increased vulnerability and physiological decline. Frail individuals are at a higher risk for bad outcomes like falls, hospitalizations, and disability.
              </li>
              <li>
                <strong>Resilience:</strong> This is the ability to withstand or recover from health stressors like an illness or surgery. It's not just the opposite of frailty; it's about the capacity to bounce back.
              </li>
              <li>
                <strong>Multimorbidity:</strong> This means having multiple chronic conditions at once. Treating a person with multimorbidity requires a holistic approach that considers how different conditions and their treatments interact.
              </li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-3">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Recycle className="h-6 w-6 text-primary" />
              Rehabilitation Interventions
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 space-y-4">
            <h4 className="font-semibold text-lg">Exercise</h4>
            <p>Exercise is a cornerstone of rehabilitation. It can be tailored to an individual's specific needs to improve strength, balance, flexibility, and endurance. Even for frail older adults, activities like progressive resistance training (weightlifting) can significantly improve muscle strength and function.</p>

            <h4 className="font-semibold text-lg">Assistive Technology and Equipment</h4>
            <p>These are tools and devices that make tasks easier or safer. This is a very common way to cope with disability.</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong>Mobility Aids:</strong> Canes, walkers, and wheelchairs help with balance, reduce weight on painful joints, and improve endurance. It's crucial that these devices are properly fitted and used correctly to prevent falls.
              </li>
              <li>
                <strong>Bathroom Aids:</strong> Raised toilet seats, grab bars, and shower chairs improve safety and independence in the bathroom, a common site for falls.
              </li>
              <li>
                <strong>Self-Care Aids:</strong> Tools like reachers and built-up utensils can help with dressing, eating, and other daily tasks.
              </li>
            </ul>

            <h4 className="font-semibold text-lg">Prosthetics and Orthotics</h4>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong>Prosthetics:</strong> These are artificial limbs for patients who have had an amputation. Choosing the right prosthesis depends on the person's overall health, functional goals, and the level of amputation.
              </li>
              <li>
                <strong>Orthotics:</strong> These are splints and braces that support a joint. Examples include knee braces for arthritis or an ankle-foot orthosis for foot drop after a stroke.
              </li>
            </ul>

            <h4 className="font-semibold text-lg">Environmental Modification</h4>
            <p>Changing the home environment can dramatically reduce disability. This can include simple changes like removing throw rugs or complex ones like installing a ramp. The goal is to make the environment fit the person's abilities.</p>
            
            <h4 className="font-semibold text-lg">Therapeutic Modalities</h4>
            <p>These are treatments like heat, cold, or electrical stimulation used by therapists to relieve pain, reduce swelling, and relax muscles. For example, a TENS (transcutaneous electrical nerve stimulation) unit can be used for pain control.</p>

            <h4 className="font-semibold text-lg">Swallowing Rehabilitation</h4>
            <p>For individuals with trouble swallowing (dysphagia), a speech-language pathologist can teach special techniques and dietary modifications (like thickening liquids) to make eating and drinking safer.</p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
