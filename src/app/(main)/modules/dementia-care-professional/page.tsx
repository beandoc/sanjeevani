
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Stethoscope, BrainCircuit, Pill, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function DementiaCareProfessionalPage() {
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
          Clinical Management of Dementia
        </h1>
        <p className="text-muted-foreground">
          An evidence-based module for healthcare professionals on the diagnosis and management of dementia syndromes.
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
        <AccordionItem value="item-1">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Stethoscope className="h-6 w-6 text-primary" />
              Diagnosis and Differential
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Establishing a Diagnosis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  A thorough diagnostic workup is essential. This includes a detailed history from the patient and a reliable informant, a complete physical and neurological exam, cognitive testing, and selected laboratory studies.
                </p>
                <h4 className="font-semibold">Key Diagnostic Steps:</h4>
                 <ul className="list-disc space-y-2 pl-5">
                    <li>
                        <strong>Clinical History:</strong> Onset, duration, and progression of symptoms. Focus on changes in memory, language, executive function, and behavior. Review medications.
                    </li>
                    <li>
                        <strong>Cognitive Assessment:</strong> Use validated screening tools (e.g., MMSE, MoCA, Mini-Cog) and consider neuropsychological testing for complex cases.
                    </li>
                    <li>
                        <strong>Laboratory Workup:</strong> At minimum, CBC, comprehensive metabolic panel, TSH, and Vitamin B12 level to rule out reversible causes.
                    </li>
                    <li>
                        <strong>Neuroimaging:</strong> Non-contrast head CT or MRI is recommended in most cases to rule out structural lesions (e.g., tumor, subdural hematoma, normal pressure hydrocephalus) and evaluate for cerebrovascular disease.
                    </li>
                </ul>
              </CardContent>
            </Card>
             <Card className="mt-4">
              <CardHeader>
                <CardTitle>Differential Diagnosis of Major Dementias</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <ul className="list-disc space-y-2 pl-5">
                    <li>
                        <strong>Alzheimer's Disease (AD):</strong> Most common type. Insidious onset with prominent early impairment in recent memory (amnestic presentation).
                    </li>
                    <li>
                        <strong>Vascular Dementia (VaD):</strong> Stepwise decline associated with clinical or radiographic evidence of cerebrovascular disease. Executive dysfunction is often prominent.
                    </li>
                    <li>
                        <strong>Lewy Body Dementia (LBD):</strong> Characterized by fluctuating cognition, visual hallucinations, and spontaneous parkinsonism. Severe neuroleptic sensitivity is a key feature.
                    </li>
                    <li>
                        <strong>Frontotemporal Dementia (FTD):</strong> Presents with prominent changes in personality and behavior (behavioral variant FTD) or progressive, fluent or non-fluent aphasia (primary progressive aphasia).
                    </li>
                </ul>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Pill className="h-6 w-6 text-primary" />
              Pharmacological Management
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 space-y-4">
            <h4 className="font-semibold text-lg">Cognitive Enhancers</h4>
            <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
                <li>
                    <strong>Cholinesterase Inhibitors (Donepezil, Rivastigmine, Galantamine):</strong> First-line for mild to moderate AD. May provide modest, temporary benefit in cognition, function, and behavior. Use with caution in patients with bradycardia or conduction abnormalities. Common side effects are gastrointestinal.
                </li>
                <li>
                    <strong>NMDA Receptor Antagonists (Memantine):</strong> Approved for moderate to severe AD, often used as an adjunct to a cholinesterase inhibitor. Generally well-tolerated.
                </li>
                 <li>
                    <strong>Anti-Amyloid Monoclonal Antibodies (Lecanemab, Donanemab):</strong> For patients with mild cognitive impairment or mild dementia due to AD with confirmed amyloid pathology. Requires careful patient selection and monitoring (e.g., for ARIA - Amyloid-Related Imaging Abnormalities).
                </li>
            </ul>

            <h4 className="font-semibold text-lg mt-4">Managing Behavioral Symptoms (BPSD)</h4>
             <p className="text-muted-foreground">Behavioral and Psychological Symptoms of Dementia (BPSD) are common and cause significant distress. The first-line approach should always be non-pharmacological.</p>
             <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
                <li>
                    <strong>Non-Pharmacological First:</strong> Identify and treat underlying causes (pain, infection, constipation, etc.). Modify the environment, simplify tasks, and use behavioral strategies (e.g., distraction, redirection).
                </li>
                <li>
                    <strong>Pharmacological (use with caution):</strong>
                    <ul className="list-disc space-y-2 pl-8 mt-2">
                        <li><strong>Antidepressants:</strong> SSRIs (e.g., Citalopram, Sertraline) can be effective for depression, anxiety, and agitation.</li>
                        <li><strong>Antipsychotics:</strong> Carry a black box warning for increased mortality in dementia. Reserve for severe, refractory aggression or psychosis that poses a risk of harm. Use the lowest possible dose for the shortest possible time.</li>
                        <li><strong>Avoid Benzodiazepines:</strong> Generally should be avoided due to risks of falls, sedation, and paradoxical agitation.</li>
                    </ul>
                </li>
            </ul>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="item-3">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-6 w-6 text-primary" />
              Safety and Care Planning
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 space-y-4">
            <ul className="list-disc space-y-2 pl-5">
                <li>
                    <strong>Driving Safety:</strong> Assess and discuss driving safety early and regularly. This is a major safety concern. Report to the DMV as required by local regulations if the patient is unsafe to drive.
                </li>
                <li>
                    <strong>Home Safety Evaluation:</strong> Recommend a home safety evaluation to reduce the risk of falls, burns, and wandering.
                </li>
                <li>
                    <strong>Advance Care Planning:</strong> Initiate conversations about goals of care and advance directives while the patient still has decision-making capacity. Encourage designation of a healthcare proxy.
                </li>
                <li>
                    <strong>Caregiver Support:</strong> Dementia care is extremely stressful. Assess for caregiver burnout and connect them to resources like the Alzheimer's Association and local support groups. Provide education on the disease process and behavioral management.
                </li>
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
