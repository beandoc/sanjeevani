
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Stethoscope, AlertTriangle, Repeat, Activity } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function PolypharmacyProfessionalPage() {
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
            <Card>
              <CardHeader>
                <CardTitle>ADEs: A Common and Preventable Harm</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
              </CardContent>
            </Card>
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
            <Card>
              <CardHeader>
                <CardTitle>Why Older Adults Are More Susceptible</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <p>Vulnerability stems from comorbidity, frailty, and age-related physiological changes that alter drug pharmacokinetics and pharmacodynamics.</p>
                 <p>An ADE in an older adult often presents atypically as a geriatric syndrome. Be alert for:</p>
                 <ul className="list-disc space-y-2 pl-5 font-medium">
                    <li>Delirium (sudden confusion)</li>
                    <li>Falls</li>
                    <li>New-onset incontinence</li>
                    <li>Functional decline or loss of mobility</li>
                </ul>
              </CardContent>
            </Card>
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
            <Card>
              <CardHeader>
                <CardTitle>Your Role is to Break the Chain</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  The prescribing cascade is a dangerous cycle where a drug's side effect is misinterpreted as a new medical condition, leading to another prescription to treat the side effect.
                </p>
                <p className="font-semibold">When an older patient presents with a new symptom (especially a geriatric syndrome), always ask: "Could this be a medication side effect?" before assuming it's a new disease.</p>
              </CardContent>
            </Card>
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
            <Card>
              <CardHeader>
                <CardTitle>Key Actions at Transition Points</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <h4 className="font-semibold">On Admission:</h4>
                <p>Obtain an accurate drug history, including OTCs and supplements. Use collateral history and probe for non-concordance.</p>
                <h4 className="font-semibold mt-2">During Ward Stay:</h4>
                <p>Perform ongoing monitoring for subtle ADE signs. Question the appropriateness of each drug, check renal function, and be vigilant with high-risk meds (anticoagulants, opiates).</p>
                <h4 className="font-semibold mt-2">At Discharge:</h4>
                <p>Conduct thorough medication reconciliation. Provide clear patient and family education on new meds, stopped meds, and specific side effects to watch for.</p>
                <p className="mt-2 font-medium">Utilize screening tools like the STOPP/START criteria to identify potentially inappropriate prescribing.</p>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
