
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Stethoscope, Microscope, ShieldCheck, AlertTriangle, UserCheck } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function LungInfectionsProfessionalPage() {
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
          Pneumonia in Older Adults: A Clinical Guide
        </h1>
        <p className="text-muted-foreground">
          A clinical framework for the assessment, triage, and management of pneumonia in geriatric patients.
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
        <AccordionItem value="item-1">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Microscope className="h-6 w-6 text-primary" />
              The Geriatric Context: Why Pneumonia is Different
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <p>
                  In older adults, pneumonia is not just a lung infection; it's a systemic event with high rates of hospitalization and mortality. The risk is elevated due to a confluence of age-related changes and common comorbidities.
                </p>
                <h4 className="font-semibold">Key Risk Factors:</h4>
                <ul className="list-disc space-y-2 pl-5">
                  <li><strong>Impaired Defenses:</strong> Reduced cough effectiveness, poor mucociliary clearance, and weakened cellular immunity.</li>
                  <li><strong>Aspiration:</strong> Microaspiration of oropharyngeal contents is a frequent cause, exacerbated by neurological diseases (stroke, dementia), dysphagia, GERD, and the use of sedative drugs.</li>
                  <li><strong>Comorbidities:</strong> Pre-existing conditions like COPD, heart failure, and diabetes significantly increase susceptibility.</li>
                </ul>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Stethoscope className="h-6 w-6 text-primary" />
              Assessment: Atypical is Typical
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 space-y-4">
            <Card>
                <CardContent className="pt-6 space-y-4">
                    <p>The classic presentation of lobar pneumonia is often absent. Your assessment must have a high index of suspicion for atypical signs.</p>
                    <h4 className="font-semibold">Subtle Respiratory Signs:</h4>
                     <p>Tachypnoea (respiratory rate &gt;30/min) is a more reliable sign than cough. Localized crackles may be faint or absent.</p>

                    <h4 className="font-semibold mt-4">Non-Respiratory Presentations:</h4>
                    <p>Pneumonia frequently manifests as a non-specific decline. Look for:</p>
                     <ul className="list-disc space-y-2 pl-5">
                        <li><strong>Delirium:</strong> An acute change in mental status may be the only presenting sign.</li>
                        <li><strong>Sepsis/Shock:</strong> Unexplained hypotension, tachycardia, or hypothermia.</li>
                        <li><strong>New Cardiac Events:</strong> Onset of new atrial fibrillation or a heart failure exacerbation.</li>
                        <li><strong>GI Symptoms:</strong> Abdominal pain, nausea, or paralytic ileus.</li>
                    </ul>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-3">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-primary" />
              Triage and Severity: When to Hospitalize (CRB-65)
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <p>The CRB-65 scale is a simple, effective tool for bedside triage to assess the severity and need for hospitalization. One point is given for each of the following:</p>
                <ul className="list-disc space-y-2 pl-5 font-medium">
                    <li><strong>C</strong>onfusion (new onset)</li>
                    <li><strong>R</strong>espiratory Rate (≥30/min)</li>
                    <li><strong>B</strong>lood Pressure (Systolic &lt;90 mmHg or Diastolic ≤60 mmHg)</li>
                    <li>Age ≥<strong>65</strong> years</li>
                </ul>
                <p className="font-semibold mt-4">Clinical Pearl: Every older patient will have a score of at least 1. A score of 1-2 warrants strong consideration for hospital referral. A score of 3-4 requires urgent admission.</p>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-4">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-primary" />
              Principles of Management and Prevention
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 space-y-4">
            <h4 className="font-semibold text-lg">General Supportive Care is Crucial</h4>
            <p>Focus on hydration, nutrition, oral care, and prevention of immobility complications (VTE, pressure ulcers).</p>
            
            <h4 className="font-semibold text-lg mt-4">The Critical 48-Hour Assessment</h4>
            <p>Clinical response at 48 hours is a key decision point. An unfavorable response is a red flag requiring re-evaluation for resistant organisms, complications, or an incorrect initial diagnosis (e.g., PE).</p>

            <h4 className="font-semibold text-lg mt-4">Prevention is the Best Treatment</h4>
             <ul className="list-disc space-y-2 pl-5">
                <li><strong>Vaccination:</strong> Advocate for and administer annual influenza and pneumococcal vaccines.</li>
                <li><strong>Aspiration Prevention:</strong> Screen for swallowing disorders, implement precautions, and advocate for reducing unnecessary sedative medications.</li>
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
