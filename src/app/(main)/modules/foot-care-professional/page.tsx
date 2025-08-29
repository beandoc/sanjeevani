
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Stethoscope, Microscope, Footprints, Shield } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function FootCareProfessionalPage() {
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
          Podogeriatrics: A Clinical Overview
        </h1>
        <p className="text-muted-foreground">
          A review of common foot pathologies, assessment, and management in the older adult patient.
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
        <AccordionItem value="item-1">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Stethoscope className="h-6 w-6 text-primary" />
              Podogeriatric Assessment & Risk Stratification
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Comprehensive Evaluation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  A systematic assessment is essential for diagnosing foot pathology and stratifying risk, especially in patients with chronic diseases like diabetes.
                </p>
                <h4 className="font-semibold">Key Assessment Domains:</h4>
                 <ul className="list-disc space-y-2 pl-5">
                    <li>
                        <strong>Dermatologic:</strong> Inspect for hyperkeratosis, ulceration, xerosis, tinea pedis, cyanosis, and pre-ulcerative changes (e.g., subkeratotic hemorrhage).
                    </li>
                    <li>
                        <strong>Musculoskeletal:</strong> Evaluate for osseous deformities (hallux valgus, hammertoes), assess muscle strength, and check joint range of motion.
                    </li>
                    <li>
                        <strong>Peripheral Vascular:</strong> Palpate dorsalis pedis and posterior tibial pulses. Assess capillary refill time, look for trophic changes (e.g., hair loss), dependent rubor, and signs of venous insufficiency.
                    </li>
                     <li>
                        <strong>Neurologic:</strong> Test for loss of protective sensation using a 10g monofilament. Assess vibratory sense (pallesthesia), sharp/dull discrimination, and proprioception.
                    </li>
                </ul>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Microscope className="h-6 w-6 text-primary" />
              Common Nail and Skin Pathologies
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 space-y-4">
            <h4 className="font-semibold text-lg">Onychopathies (Nail Disorders)</h4>
            <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
                <li>
                    <strong>Onychomycosis:</strong> Fungal infection of the nail plate/bed. Presents as thickened, discolored, dystrophic nails. It's a chronic, communicable disease and serves as a focus of infection for tinea pedis. Management includes periodic debridement and topical antifungals. Systemic agents carry hepatotoxicity risks.
                </li>
                <li>
                    <strong>Onychocryptosis (Ingrown Toenail):</strong> Often results from deformity or improper care. Management requires removal of the offending nail spicule. If granulation tissue is present, chemical cautery (e.g., phenol) or surgical excision may be necessary after evaluating vascular status.
                </li>
                 <li>
                    <strong>Onychauxis & Onychogryphosis:</strong> Hypertrophy (thickening) of the nail, often from microtrauma. Gryphosis is a severe, deformed "ram's horn" presentation. Management is periodic debridement.
                </li>
            </ul>

            <h4 className="font-semibold text-lg mt-4">Dermatologic Conditions</h4>
             <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
                <li>
                    <strong>Xerosis and Fissures:</strong> Dry, cracked skin, especially on the heel, is a common entry point for infection. Management includes hydration and emollients, often with keratolytic agents like urea or lactic acid.
                </li>
                <li>
                    <strong>Hyperkeratotic Lesions (Calluses/Corns):</strong> Develop over bony prominences due to pressure and friction. They are a symptom of underlying biomechanical stress. If allowed to condense, they can cause localized avascularity and precipitate ulceration. Management includes debridement and pressure-reduction strategies (padding, orthoses, footwear changes).
                </li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-3">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Footprints className="h-6 w-6 text-primary" />
              The Diabetic Foot
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 space-y-4">
            <p>Early identification and intervention can prevent 50-75% of amputations in diabetic patients. Management is complicated by vascular impairment, neuropathy, and dermopathy.</p>
            <ul className="list-disc space-y-4 pl-5">
              <li>
                <strong className="font-semibold text-card-foreground">Neuropathy:</strong> Loss of protective sensation is a critical risk factor. Patients may not feel repetitive trauma, leading to ulceration. Motor neuropathy causes muscle atrophy and foot deformities (e.g., claw toes), which create high-pressure areas. Autonomic neuropathy leads to anhidrosis and dry, cracked skin.
              </li>
              <li>
                <strong className="font-semibold text-card-foreground">Vascular Impairment:</strong> Peripheral arterial disease (PAD) impairs wound healing. Signs include pallor on elevation, dependent rubor, weak/absent pulses, and trophic changes.
              </li>
               <li>
                <strong className="font-semibold text-card-foreground">Risk Assessment Models:</strong> Utilize models like the PAVE program to stratify patients into risk categories based on neuropathy, PAD, and foot deformities. High-risk patients require intensive management and frequent follow-up.
              </li>
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
