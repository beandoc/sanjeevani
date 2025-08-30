
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Stethoscope, Microscope, Activity, Pill, Brain } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ParkinsonismCareProfessionalPage() {
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
          A Comprehensive Nursing Guide to Parkinson's Disease in the Older Adult
        </h1>
        <p className="text-muted-foreground">
          A detailed clinical framework for the assessment, diagnosis, and complex management of Parkinson's Disease in geriatric patients.
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
        <AccordionItem value="item-1">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Microscope className="h-6 w-6 text-primary" />
              Chapter 1: The Foundations of Parkinson's Disease in Geriatrics
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>1.1 Pathophysiology and Epidemiology</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  Parkinson's Disease is the second most common neurodegenerative disorder. Its key pathological hallmarks are a loss of dopaminergic neurons in the substantia nigra and the presence of Lewy Bodies (accumulations of α-synuclein).
                </p>
                <h4 className="font-semibold">Geriatric Epidemiology:</h4>
                <ul className="list-disc space-y-2 pl-5">
                  <li><strong>Prevalence:</strong> Affects approximately 1% of individuals over age 65.</li>
                  <li><strong>Late-Onset:</strong> Most patients in geriatric settings have long-standing disease and present with advanced complications.</li>
                </ul>
              </CardContent>
            </Card>
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>1.2 Risk Factors</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <ul className="list-disc space-y-2 pl-5">
                    <li><strong>Established Factors:</strong> A family history of PD is found in 6-10% of cases.</li>
                    <li><strong>Weak Associations:</strong> Rural living, exposure to pesticides/herbicides, and head injuries.</li>
                    <li><strong>Protective Factors:</strong> Cigarette smoking and coffee consumption appear to be protective.</li>
                </ul>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Stethoscope className="h-6 w-6 text-primary" />
              Chapter 2: Clinical Assessment: A Multifaceted Approach
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>2.1 The Cardinal Motor Signs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <p>PD signs are typically asymmetric at onset. Assess for:</p>
                 <ul className="list-disc space-y-2 pl-5">
                    <li><strong>Rest Tremor:</strong> 4–6 Hz frequency, most prominent at rest.</li>
                    <li><strong>Bradykinesia/Akinesia:</strong> Poverty of movement, loss of facial expression ("masked facies").</li>
                    <li><strong>Rigidity:</strong> "Lead-pipe" type of increased muscle tone on passive movement.</li>
                    <li><strong>Postural Instability:</strong> Occurs later and is a primary cause of falls.</li>
                </ul>
              </CardContent>
            </Card>
             <Card className="mt-4">
              <CardHeader>
                <CardTitle>2.2 Other Motor Manifestations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <ul className="list-disc space-y-2 pl-5">
                    <li><strong>Gait and Posture:</strong> Abnormal flexed posture, shuffling gait, reduced arm swing.</li>
                    <li><strong>Freezing of Gait:</strong> A feeling of feet being "glued to the floor."</li>
                </ul>
              </CardContent>
            </Card>
             <Card className="mt-4">
              <CardHeader>
                <CardTitle>2.3 The Critical Non-Motor Spectrum</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <p><strong>Autonomic Dysfunction:</strong> Orthostatic hypotension, constipation, sialorrhea, urinary urgency.</p>
                 <p><strong>Neuropsychiatric Symptoms:</strong> Depression, anxiety, and cognitive impairment. Note: Dementia is never an early sign of idiopathic PD.</p>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="item-3">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Brain className="h-6 w-6 text-primary" />
              Chapter 3: Differential Diagnosis in the Older Adult
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 space-y-4">
             <Card>
              <CardHeader>
                <CardTitle>3.1 Drug-Induced Parkinsonism (DIP)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>Extremely common. Caused by neuroleptics (antipsychotics) and antiemetics (metoclopramide). Signs are usually bilateral and symmetrical with no rest tremor. Prevention is key: avoid neuroleptics in older patients where possible.</p>
              </CardContent>
            </Card>
             <Card className="mt-4">
              <CardHeader>
                <CardTitle>3.2 Other Neurodegenerative Syndromes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <ul className="list-disc space-y-2 pl-5">
                    <li><strong>Lewy Body Dementia (LBD):</strong> Dementia occurs within months of or precedes parkinsonism.</li>
                    <li><strong>Progressive Supranuclear Palsy (PSP):</strong> Early falls, axial rigidity, and limited vertical gaze.</li>
                    <li><strong>Vascular Parkinsonism:</strong> Stepwise progression associated with strokes.</li>
                </ul>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-4">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Pill className="h-6 w-6 text-primary" />
              Chapter 4: Pharmacological Management
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 space-y-4">
             <Card>
              <CardHeader>
                <CardTitle>4.1 Levodopa (L-dopa): The Cornerstone of Therapy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <p>The main treatment for PD in older adults. "Start low and go slow." Administer 30 mins before meals for best absorption.</p>
                 <h4 className="font-semibold">Managing Complications:</h4>
                 <ul className="list-disc space-y-2 pl-5">
                    <li><strong>"Wearing-Off":</strong> Return of symptoms before next dose. Manage by increasing dosing frequency or adding COMT-inhibitor.</li>
                    <li><strong>Dyskinesias:</strong> Involuntary movements at peak dose. Amantadine can help.</li>
                    <li><strong>Psychiatric Side Effects:</strong> Hallucinations/delirium. Clozapine and Pimavanserin are effective treatments.</li>
                </ul>
              </CardContent>
            </Card>
             <Card className="mt-4">
              <CardHeader>
                <CardTitle>4.2 Medications to Avoid</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <ul className="list-disc space-y-2 pl-5">
                    <li><strong>Dopamine Agonists:</strong> High risk of severe psychiatric side effects in older adults.</li>
                    <li><strong>Anticholinergic Drugs:</strong> Never used in older people with PD due to high risk of delirium.</li>
                </ul>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="item-5">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Activity className="h-6 w-6 text-primary" />
              Chapter 5: Holistic and Rehabilitative Care
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <p>Management extends far beyond medication. Therapy sessions should be timed with the peak effect of L-dopa.</p>
                <ul className="list-disc space-y-2 pl-5">
                    <li>
                        <strong>Physical Therapy:</strong> Essential for gait training, balance, posture, and fall prevention.
                    </li>
                    <li>
                        <strong>Speech Therapy:</strong> Crucial for managing dysarthria (speech) and dysphagia (swallowing).
                    </li>
                    <li>
                        <strong>Supportive and Palliative Care:</strong> As the disease progresses, focus shifts to managing loss of independence and ensuring quality of life.
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
