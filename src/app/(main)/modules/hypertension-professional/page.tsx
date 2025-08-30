
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Stethoscope, Microscope, Activity, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HypertensionProfessionalPage() {
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
          Hypertension in Older Adults: A Nurse's Guide
        </h1>
        <p className="text-muted-foreground">
          A clinical overview of the unique aspects of hypertension in the geriatric population.
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
        <AccordionItem value="item-1">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Microscope className="h-6 w-6 text-primary" />
              The Pathophysiology of "Old" Arteries
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Arterial Stiffening and Hemodynamics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  Hypertension in older adults is primarily driven by age-related vascular change. Arterial stiffening from fractured elastin fibers leads to increased Systolic Blood Pressure (SBP) and reduced Diastolic Blood Pressure (DBP), resulting in a widened pulse pressure. Isolated Systolic Hypertension (ISH) (SBP ≥140 / DBP &lt;90) is the most common form.
                </p>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Stethoscope className="h-6 w-6 text-primary" />
              Individualized Targets: Moving Beyond a Single Number
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Balancing Risk and Quality of Life</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <p>A "one-size-fits-all" approach can be harmful. Individualize BP targets based on patient status:</p>
                 <ul className="list-disc space-y-2 pl-5">
                    <li>
                        <strong>Independent & Fit:</strong> A target of &lt;130/80 mmHg is reasonable.
                    </li>
                    <li>
                        <strong>Partially Dependent:</strong> A target of &lt;140/90 mmHg is often more appropriate.
                    </li>
                    <li>
                        <strong>Dependent & Frail:</strong> A more conservative target of &lt;150/90 mmHg prioritizes safety and quality of life.
                    </li>
                </ul>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="item-3">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-primary" />
              Key Management Challenges & Clinical Pearls
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Vigilance for Specific Complications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-card-foreground">Orthostatic Hypotension</h4>
                  <p>A drop of &gt;20/10 mmHg within three minutes of standing. Risk increases with the number of causative medications. Monitor standing BPs closely.</p>
                </div>
                <div className="mt-4">
                  <h4 className="font-semibold text-card-foreground">Falls</h4>
                  <p>Antihypertensive therapy is associated with a 40% increased risk of serious fall injury. Be most vigilant in the first 30-45 days after initiating or intensifying therapy.</p>
                </div>
                <div className="mt-4">
                  <h4 className="font-semibold text-card-foreground">Frailty</h4>
                  <p>In frail older adults, a low BP is often associated with increased mortality (the "U-shaped" curve). Frailty modifies the risk-benefit equation.</p>
                </div>
                <div className="mt-4">
                  <h4 className="font-semibold text-card-foreground">Dementia</h4>
                  <p>Aggressive late-life BP lowering may accelerate cognitive decline. A suggested target is a daytime SBP of 130 to 145 mmHg to avoid cerebral hypoperfusion.</p>
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
