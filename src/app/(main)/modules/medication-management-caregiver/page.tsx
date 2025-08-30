
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Pill, AlertTriangle, List, HelpCircle, Siren } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function MedicationManagementCaregiverPage() {
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
          Medication Management: A Caregiver's Guide
        </h1>
        <p className="text-muted-foreground">
          Helping you navigate the risks of polypharmacy and prevent medication-related problems.
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
        <AccordionItem value="item-1">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-primary" />
              Understanding the Risks of Polypharmacy
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <Card>
              <CardHeader>
                <CardTitle>When a Cornucopia of Pills is Dangerous</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  Polypharmacy is when someone takes many different medications. The more medications a person takes, the higher their risk for serious side effects, including falls, confusion, dizziness, and even hospitalization.
                </p>
                <h4 className="font-semibold">Why Older Adults Are More at Risk:</h4>
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    As we age, our bodies change. The liver and kidneys become less efficient, which can cause drugs to build up in the system to toxic levels.
                  </li>
                  <li>
                    A new symptom like dizziness or weakness might not be a new illness, but a side effect of one of the medications. This is why it's vital to stay vigilant.
                  </li>
                </ul>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <List className="h-6 w-6 text-primary" />
              Your Role: Keeping a Master List
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <Card>
              <CardHeader>
                <CardTitle>The Most Important Tool</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <p>You are the first line of defense against medication errors. Maintaining a complete, up-to-date list of all medications is the most critical step.</p>
                 <ul className="list-disc space-y-2 pl-5">
                    <li>
                        <strong>What to Include:</strong> List every prescription medication, over-the-counter drug, vitamin, and supplement.
                    </li>
                    <li>
                        <strong>Key Details:</strong> For each item, note the dosage, how often it's taken, and the reason for taking it.
                    </li>
                    <li>
                        <strong>Keep it With You:</strong> Bring this list to every single doctor’s appointment and hospital visit. This is the single best way to prevent dangerous drug interactions.
                    </li>
                </ul>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="item-3">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <HelpCircle className="h-6 w-6 text-primary" />
              Your Role: Asking Questions
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <Card>
              <CardHeader>
                <CardTitle>Be an Active Partner</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  Don't hesitate to ask the doctor or pharmacist questions about any new or existing medication.
                </p>
                <h4 className="font-semibold">Key Questions to Ask:</h4>
                <ul className="list-disc space-y-2 pl-5">
                    <li>What is this medication for?</li>
                    <li>What is the lowest effective dose?</li>
                    <li>What are the potential side effects, and what should I watch for?</li>
                    <li>Is this medication absolutely necessary?</li>
                    <li>Can anything be safely stopped or "deprescribed?"</li>
                </ul>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="item-4">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Siren className="h-6 w-6 text-destructive" />
              Your Role: Watching for Red Flags
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <Card>
              <CardHeader>
                <CardTitle>Your Observations are Critical</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <p>Be on the lookout for new or unusual symptoms after a medication is started or the dose is changed. These could be signs of a drug interaction or side effect.</p>
                 <h4 className="font-semibold">Report these immediately:</h4>
                 <ul className="list-disc space-y-2 pl-5">
                    <li>Dizziness or lightheadedness</li>
                    <li>New or worsening confusion</li>
                    <li>Unusual fatigue or sleepiness</li>
                    <li>Changes in balance or new falls</li>
                    <li>Loss of appetite</li>
                </ul>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
