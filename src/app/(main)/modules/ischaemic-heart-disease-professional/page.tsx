
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Stethoscope, Microscope, ShieldCheck, Activity } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function IschaemicHeartDiseaseProfessionalPage() {
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
          Managing Ischaemic Heart Disease in Older Adults
        </h1>
        <p className="text-muted-foreground">
          A nursing perspective on atypical presentations, risk management, and a patient-centered approach.
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
        <AccordionItem value="item-1">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Stethoscope className="h-6 w-6 text-primary" />
              The Geriatric Heart: Pathophysiology and Presentation
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <p>
                  IHD in older adults is not simply the same disease in an older body. Age-related cardiovascular changes create a unique clinical picture.
                </p>
                <h4 className="font-semibold">Atypical Presentation is the Norm:</h4>
                 <p>While you may see classic angina, it's often less severe or poorly defined. Be highly suspicious of IHD when an older patient presents with:</p>
                <ul className="list-disc space-y-2 pl-5">
                  <li>Dyspnoea (may be misdiagnosed as heart failure exacerbation)</li>
                  <li>Fatigue, dizziness, or syncope</li>
                  <li>New or worsening confusion or lethargy, especially in frail individuals.</li>
                  <li>Epigastric, shoulder, or back pain that might be mistaken for GI or musculoskeletal issues.</li>
                </ul>
                 <h4 className="font-semibold mt-4">Diagnostic Challenges:</h4>
                 <ul className="list-disc space-y-2 pl-5">
                    <li><strong>Masked Symptoms:</strong> Limited physical activity can mask exertional angina.</li>
                    <li><strong>Baseline ECG Changes:</strong> Pre-existing Q waves, bundle branch blocks, or LVH are common and can confound interpretation.</li>
                    <li><strong>Type 2 Myocardial Infarction (MI):</strong> Be aware that elevated troponins are often due to a supply-demand mismatch (Type 2 MI) from stressors like sepsis or tachyarrhythmias, for which PCI is less likely to be effective.</li>
                 </ul>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-primary" />
              Evidence-Based Prevention and Risk Management
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 space-y-4">
            <p>Prevention strategies must be tailored to the individual's risk profile and life expectancy.</p>
            <h4 className="font-semibold text-lg">Lifestyle is Potent Medicine:</h4>
            <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
                <li>
                    <strong>Physical Activity:</strong> Emphasize that "all movement counts." Even light activity and increasing walking pace are associated with significant risk reduction.
                </li>
                <li>
                    <strong>Diet:</strong> The Mediterranean diet, supplemented with olive oil or nuts, has been shown to reduce major CV events by 30% in older adults.
                </li>
            </ul>

            <h4 className="font-semibold text-lg mt-4">Pharmacological Prevention: Key Differences</h4>
             <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
                <li>
                    <strong>Aspirin:</strong> For primary prevention in adults ≥70, the ASPREE trial showed no benefit and increased hemorrhage risk. Its role in secondary prevention is well-established.
                </li>
                <li>
                    <strong>Statins:</strong> Strong evidence for secondary prevention. For primary prevention, benefit is smaller in those >75, requiring a careful risk-benefit discussion.
                </li>
                 <li>
                    <strong>Hypertension:</strong> Target SBP &lt;140 mmHg for most, with a more relaxed target of &lt;150 mmHg for frail patients.
                </li>
            </ul>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="item-3">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Microscope className="h-6 w-6 text-primary" />
              Managing Stable IHD and Acute Coronary Syndromes (ACS)
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 space-y-4">
            <h4 className="font-semibold text-lg">Stable IHD:</h4>
            <p>The goal is symptom control. Be mindful of common side effects of anti-anginals:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li><strong>Beta-blockers & Rate-Limiting CCBs:</strong> Increased risk of bradycardia and heart block when used together.</li>
              <li><strong>Dihydropyridine CCBs (Amlodipine):</strong> Can cause significant lower limb edema.</li>
              <li><strong>Verapamil:</strong> Often causes constipation.</li>
            </ul>

            <h4 className="font-semibold text-lg mt-4">Acute Coronary Syndromes (ACS):</h4>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong>Higher Risk Profile:</strong> Older adults have a greater risk of complications like bleeding, stroke, and contrast-induced AKI.
              </li>
              <li>
                <strong>Antiplatelet Therapy:</strong> Prasugrel is generally not recommended in patients ≥75 due to increased bleeding risk.
              </li>
              <li>
                <strong>Stenting Strategy:</strong> A drug-eluting stent (DES) with shorter dual antiplatelet therapy (DAPT) is now often preferred over bare-metal stents (BMS).
              </li>
            </ul>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="item-4">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Activity className="h-6 w-6 text-primary" />
              The Central Role of Rehabilitation and Patient-Centered Approach
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 space-y-4">
             <h4 className="font-semibold text-lg">Cardiac Rehabilitation:</h4>
            <p>
              This is a critically underutilized intervention. It is highly effective in older adults, reducing mortality by 21-33% at five years and improving functional capacity, quality of life, and mental health.
            </p>
             <h4 className="font-semibold text-lg mt-4">Holistic Decision-Making:</h4>
            <p>
              The best treatment plan is not disease-centered but patient-centered. It requires a comprehensive geriatric assessment that considers frailty, comorbidities, cognitive function, and most importantly, the patient's preferences and goals. For some, palliative care and symptom control may be more appropriate than aggressive intervention.
            </p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
