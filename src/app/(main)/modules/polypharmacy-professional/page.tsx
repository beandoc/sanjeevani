
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Stethoscope, AlertTriangle, Syringe, FileCheck } from 'lucide-react';
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
          Polypharmacy and Deprescribing
        </h1>
        <p className="text-muted-foreground">
          A review of the risks of polypharmacy and evidence-based tools for medication management in older adults.
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
        <AccordionItem value="item-1">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-primary" />
              Polypharmacy: A Geriatric Syndrome
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <Card>
              <CardHeader>
                <CardTitle>The Case for Vigilance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  Polypharmacy is the use of multiple medications, often more than is medically necessary. It is a leading cause of avoidable hospital admissions, falls, disability, and even death in older adults. Every patient interaction requires a detailed medication review.
                </p>
                <h4 className="font-semibold">Key Physiologic Changes of Aging:</h4>
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    <strong>Decreased total body water and lean mass:</strong> Can lead to higher concentrations of water-soluble drugs.
                  </li>
                  <li>
                    <strong>Increased body fat:</strong> Can prolong the half-life of fat-soluble drugs, increasing the risk of side effects.
                  </li>
                  <li>
                    <strong>Reduced liver blood flow and kidney function:</strong> Can impair drug metabolism and excretion, causing drugs to build up in the system.
                  </li>
                </ul>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <FileCheck className="h-6 w-6 text-primary" />
              Essential Tools for Medication Management
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <Card>
              <CardHeader>
                <CardTitle>Evidence-Based Criteria</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <p>Becoming proficient with at least one of these tools is essential for providing high-quality care and identifying potentially inappropriate medications (PIMs).</p>
                 <ul className="list-disc space-y-4 pl-5">
                    <li>
                        <strong className="font-semibold">Beers Criteria:</strong> A widely used list of PIMs for older adults. It's a quick reference to help you avoid drugs with a high risk of adverse events.
                    </li>
                    <li>
                        <strong className="font-semibold">STOPP/START Criteria:</strong> Clinically practical tools that categorize PIMs by organ system (STOPP) and also identify Potential Prescribing Omissions (START criteria).
                    </li>
                    <li>
                        <strong className="font-semibold">Medication Appropriateness Index (MAI):</strong> A comprehensive, 10-point checklist that evaluates each medication's appropriateness. While time-consuming, it is an excellent educational tool for systematically reviewing complex drug regimens.
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
