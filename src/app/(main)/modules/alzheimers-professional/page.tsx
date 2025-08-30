
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Brain, Microscope, Search, ShieldCheck, Activity, Stethoscope } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AlzheimersProfessionalPage() {
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
          A Comprehensive Nursing Guide to Alzheimer's Disease
        </h1>
        <p className="text-muted-foreground">
          This lesson provides a detailed clinical framework for understanding Alzheimer's Disease (AD) in the geriatric population, covering its pathophysiology, risk factors, the spectrum of cognitive decline, the diagnostic process including biomarkers, and the assessment of behavioral symptoms.
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
        <AccordionItem value="item-1">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Microscope className="h-6 w-6 text-primary" />
              Chapter 1: Foundations of Alzheimer's Disease
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>1.1 Defining the Disease and Its Pathological Hallmarks</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  Alzheimer's Disease is a progressive, degenerative brain disorder characterized by a decline in memory, cognition, and/or behavior that ultimately impacts Activities of Daily Living (ADLs). The disease is defined by two core neuropathological lesions:
                </p>
                <ul className="list-disc space-y-2 pl-5">
                  <li><strong>Senile (Amyloid) Plaques:</strong> Extracellular deposits of insoluble amyloid-β (Aβ) peptide filaments.</li>
                  <li><strong>Neurofibrillary Tangles (NFTs):</strong> Intracellular accumulations of hyperphosphorylated tau proteins.</li>
                </ul>
                <p>
                  These lesions have a synergistic effect, driving a neurodegenerative process that begins decades before clinical symptoms appear.
                </p>
              </CardContent>
            </Card>
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>1.2 Epidemiology and Genetic Considerations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <p><strong>Prevalence:</strong> AD is the most common form of dementia, accounting for 60–80% of all cases. Its prevalence doubles every five years after the age of 65.</p>
                 <p><strong>Sporadic vs. Familial AD:</strong></p>
                 <ul className="list-disc space-y-2 pl-5">
                    <li><strong>Sporadic AD (99% of cases):</strong> A complex disease with multiple risk factors.</li>
                    <li><strong>Familial AD (1% of cases):</strong> A rare, early-onset form (before age 50) caused by fully penetrant autosomal dominant mutations in the APP, PSEN1, or PSEN2 genes.</li>
                </ul>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-primary" />
              Chapter 2: Risk Factors: Non-Modifiable and Modifiable
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 space-y-4">
             <Card>
              <CardHeader>
                <CardTitle>2.1 Non-Modifiable Risk Factors</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <ul className="list-disc space-y-2 pl-5">
                    <li><strong>Age:</strong> The single greatest risk factor.</li>
                    <li><strong>Genetics (ApoE4):</strong> The apolipoprotein E4 (ApoE4) allele is the most significant genetic susceptibility factor for sporadic AD. The risk increases with the number of alleles:
                        <ul className="list-disc space-y-2 pl-5 mt-2">
                            <li>One ApoE4 allele: 3 to 5 times increased risk.</li>
                            <li>Two ApoE4 alleles: 10 to 12 times increased risk.</li>
                        </ul>
                    </li>
                </ul>
                <p className="mt-2 text-sm text-muted-foreground">It is crucial to understand that ApoE4 is a risk factor, not a deterministic gene; its presence is neither necessary nor sufficient to cause AD.</p>
              </CardContent>
            </Card>
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>2.2 Potentially Modifiable Risk Factors</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <p>Over half of the worldwide AD burden may be related to seven key modifiable risk factors. Prevention and management of these are a cornerstone of patient education.</p>
                 <ul className="list-disc space-y-2 pl-5">
                    <li>Low Educational Attainment</li>
                    <li>Midlife Hypertension</li>
                    <li>Midlife Obesity</li>
                    <li>Diabetes</li>
                    <li>Physical Inactivity (Highest estimated risk in the US & Europe)</li>
                    <li>Depression</li>
                    <li>Smoking</li>
                </ul>
                <p className="mt-2 font-semibold">A 10% reduction in the prevalence of these seven factors could reduce the 2050 prevalence of AD by over 8%.</p>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-3">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Brain className="h-6 w-6 text-primary" />
              Chapter 3: The Pathophysiological Cascade
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 space-y-4">
            <Card>
                <CardHeader><CardTitle>3.1 Amyloid and Tau Pathology</CardTitle></CardHeader>
                <CardContent>
                    <p><strong>The Amyloid Cascade Hypothesis:</strong> Evidence from biomarker studies suggests that the abnormal processing and deposition of amyloid-β is the initiating biological event, occurring up to 20 years before symptoms while individuals are still cognitively normal.</p>
                    <p className="mt-4"><strong>The Spread of Neurofibrillary Tangles (NFTs):</strong> Tau pathology follows a predictable, hierarchical pattern of spread:</p>
                    <ul className="list-disc space-y-2 pl-5 mt-2">
                        <li><strong>Subclinical Stage (decades):</strong> Begins in the hippocampal region (transentorhinal, entorhinal).</li>
                        <li><strong>Symptomatic Stage:</strong> Spreads to the associative neocortical regions (temporal, prefrontal, parietal).</li>
                    </ul>
                    <p className="mt-2">This topographical spread directly correlates with the progression of cognitive symptoms.</p>
                </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-4">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Activity className="h-6 w-6 text-primary" />
              Chapter 4: The Clinical Spectrum of Cognitive Decline
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 space-y-4">
             <h4 className="font-semibold text-lg">4.1 Subjective Cognitive Decline (SCD)</h4>
             <p>This is a patient's self-reported memory concern in the presence of normal performance on objective cognitive tests. While often linked to depression or anxiety, it can also be the very first symptomatic manifestation of preclinical AD.</p>

             <h4 className="font-semibold text-lg mt-4">4.2 Mild Cognitive Impairment (MCI)</h4>
             <p>MCI is a transitional state characterized by:</p>
             <ul className="list-disc space-y-2 pl-5">
                <li>A subjective cognitive complaint.</li>
                <li>Objective impairment in one or more cognitive domains (verified by testing).</li>
                <li>No significant impact on Activities of Daily Living (ADLs). This preservation of functional independence is the key feature that distinguishes MCI from dementia.</li>
             </ul>
             
             <h4 className="font-semibold text-lg mt-4">4.3 The Stages of Dementia</h4>
             <p>Dementia is diagnosed when cognitive impairment becomes severe enough to cause a significant impact on ADLs. Severity can be staged using validated scales:</p>
             <ul className="list-disc space-y-2 pl-5">
                <li><strong>Mini-Mental State Examination (MMSE):</strong>
                    <ul className="list-disc space-y-2 pl-5 mt-2">
                        <li>Mild Dementia: Score of 20-24</li>
                        <li>Moderate Dementia: Score of 10-19</li>
                        <li>Severe Dementia: Score of &lt;9</li>
                    </ul>
                </li>
                <li><strong>Severe Impairment Battery (SIB):</strong> Used for patients whose impairment is too severe for standard cognitive tests.</li>
             </ul>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="item-5">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Stethoscope className="h-6 w-6 text-primary" />
              Chapter 5: The Modern Diagnostic Process
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 space-y-4">
            <Card>
                <CardHeader><CardTitle>5.1 Clinical, Functional, and Behavioral Assessment</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                    <p><strong>Cognitive Assessment:</strong> Beyond the MMSE, a detailed neuropsychological evaluation is critical. Tests of episodic memory using free and cued recall (e.g., Grober and Buschke test) are highly sensitive for detecting the hippocampal amnesic syndrome characteristic of early AD.</p>
                    <p><strong>Functional Assessment:</strong> Use of standardized tools like the Katz ADL and Lawton IADL scales is essential to determine the functional impact required for a dementia diagnosis.</p>
                    <p><strong>Nutritional Assessment:</strong> The Mini Nutritional Assessment (MNA) should be incorporated, as a poor score has been shown to predict faster cognitive progression.</p>
                    <p><strong>Behavioral Assessment:</strong> The Neuropsychiatric Inventory (NPI) is a key tool for quantifying behavioral symptoms and their impact on caregiver burden. The most common early symptoms are apathy, anxiety, dysphoria (depression), and irritability.</p>
                </CardContent>
            </Card>
             <Card className="mt-4">
                <CardHeader><CardTitle>5.2 The Role of Biomarkers</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <p>Biomarkers are now central to an early and more accurate diagnosis.</p>
                    <ul className="list-disc space-y-2 pl-5">
                        <li><strong>Structural Brain Imaging (MRI):</strong> Has two main purposes:
                            <ul className="list-disc space-y-2 pl-5 mt-2">
                                <li>Exclusion: To rule out other causes like tumors, subdural hematomas, or normal-pressure hydrocephalus.</li>
                                <li>Confirmation: To identify patterns supportive of AD, specifically medial temporal lobe (hippocampal) atrophy.</li>
                            </ul>
                        </li>
                        <li><strong>Cerebrospinal Fluid (CSF) Biomarkers:</strong> A lumbar puncture can reveal the classic AD signature:
                             <ul className="list-disc space-y-2 pl-5 mt-2">
                                <li>Low Aβ42 (or a low Aβ42/Aβ40 ratio)</li>
                                <li>High total-tau (t-tau)</li>
                                <li>High phospho-tau (p-tau)</li>
                            </ul>
                        </li>
                        <li><strong>Functional Brain Imaging (PET Scans):</strong>
                            <ul className="list-disc space-y-2 pl-5 mt-2">
                                <li>FDG-PET: Measures glucose metabolism and reveals a characteristic pattern of bilateral parietotemporal hypometabolism in AD.</li>
                                <li>Amyloid-PET: Uses specific ligands (e.g., florbetapir) to visualize amyloid plaques in the brain, directly confirming the presence of amyloid pathology.</li>
                            </ul>
                        </li>
                        <li><strong>Emerging Blood Biomarkers:</strong> Ultrasensitive assays for plasma Aβ and Neurofilaments Light Chain (NFL) are in development and show promise as less invasive future diagnostic tools.</li>
                    </ul>
                </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
