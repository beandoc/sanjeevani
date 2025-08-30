
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, HeartHandshake, Siren, Repeat, ListChecks } from 'lucide-react';
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
          Helping Your Loved One Stay Safe with Medicines
        </h1>
        <p className="text-muted-foreground">
          A guide for family caregivers to manage medications safely and be a key partner in healthcare.
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
        <AccordionItem value="item-1">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <HeartHandshake className="h-6 w-6 text-primary" />
              Why Older Adults Need Extra Help
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <Card>
              <CardHeader>
                <CardTitle>Your Loved One's Most Important Safety Net</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  As people age, they often develop more health conditions and need more medicines. Taking many medications (polypharmacy) increases the chance of problems.
                </p>
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    About 1 in 5 people over 70 takes five or more different medicines.
                  </li>
                  <li>
                    The body handles medicines differently with age, making side effects more likely.
                  </li>
                  <li>
                    A medication problem can be a major reason for a hospital admission.
                  </li>
                </ul>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Siren className="h-6 w-6 text-destructive" />
              Spotting Medication Problem Warning Signs
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <Card>
              <CardHeader>
                <CardTitle>Look for Sudden Changes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <p>A bad reaction to a medicine in an older person might not be what you expect. It often looks like a sudden change in their overall condition. Never dismiss these signs as "just getting old."</p>
                 <h4 className="font-semibold">Key Warning Signs:</h4>
                 <ul className="list-disc space-y-2 pl-5">
                    <li>Sudden confusion, memory problems, or acting strangely (delirium).</li>
                    <li>More falls, or new dizziness and unsteadiness.</li>
                    <li>New or worsening bladder or bowel control issues.</li>
                    <li>Unusual sleepiness or being hard to wake up.</li>
                    <li>Sudden loss of appetite or feeling very tired.</li>
                    <li>A new depressed mood or loss of interest in things.</li>
                </ul>
                <p className="mt-4 font-semibold text-destructive">Always consider that a new symptom might be a medication side effect and call the doctor.</p>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="item-3">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Repeat className="h-6 w-6 text-primary" />
              The "Domino Effect" of Prescribing
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <Card>
              <CardHeader>
                <CardTitle>Understanding the Prescribing Cascade</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  Sometimes, a side effect from Drug #1 is mistaken for a new health problem. The doctor might then prescribe Drug #2 to treat that side effect. This can lead to even more problems. This is called the prescribing cascade.
                </p>
                <h4 className="font-semibold">Example:</h4>
                <p>A blood pressure pill (Drug #1) causes swollen ankles. The doctor sees the swelling and prescribes a water pill (Drug #2) to fix it. The water pill can then cause dizziness, leading to a fall.</p>
                <p className="mt-2 font-medium">You can help stop this by telling the doctor about any new symptom that appears after a medicine is started or changed.</p>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="item-4">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <ListChecks className="h-6 w-6 text-primary" />
              Your Action Plan for Medication Safety
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <Card>
              <CardHeader>
                <CardTitle>Simple Steps, Big Impact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <ul className="list-disc space-y-4 pl-5">
                    <li>
                        <strong>Keep an "All-Meds" Master List:</strong> Maintain one updated list of every prescription, over-the-counter item, vitamin, and supplement. Note the name, dose, and reason for each. Bring this list to EVERY appointment.
                    </li>
                    <li>
                        <strong>Use One Pharmacy:</strong> Fill all prescriptions at the same pharmacy. This allows the pharmacist to spot dangerous interactions.
                    </li>
                    <li>
                        <strong>Use a Pill Organizer:</strong> A weekly pill box helps prevent missed or double doses.
                    </li>
                     <li>
                        <strong>Ask Questions at Discharge:</strong> Leaving the hospital is high-risk. Go over the final medication list with the nurse or doctor and ask: "What is each new medicine for?", "Which medicines should be stopped?", and "Who do I call if I have a problem?".
                    </li>
                </ul>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
