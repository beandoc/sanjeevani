
'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ArrowLeft, Stethoscope, Microscope, Pill, Activity } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useProfile } from '@/context/role-context';
import { useEffect, useState } from 'react';
import { SectionCard } from '@/components/cards/section-card';

const MODULE_ID = 'benign-prostate-professional';
const SECTIONS = 5;

export default function BenignProstateProfessionalPage() {
  const { getModuleProgress, updateModuleProgress } = useProfile();
  const [completedSections, setCompletedSections] = useState<Set<number>>(new Set());

  useEffect(() => {
    const progress = getModuleProgress(MODULE_ID);
    const completedCount = Math.floor((progress / 100) * SECTIONS);
    const completed = new Set<number>();
    for (let i = 1; i <= completedCount; i++) {
      completed.add(i);
    }
    setCompletedSections(completed);
  }, [getModuleProgress]);

  const handleSectionComplete = (sectionId: number) => {
    const newCompletedSections = new Set(completedSections);
    newCompletedSections.add(sectionId);
    setCompletedSections(newCompletedSections);
    const newProgress = (newCompletedSections.size / SECTIONS) * 100;
    updateModuleProgress(MODULE_ID, newProgress);
  };

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
          Evaluation and Management of Benign Prostatic Conditions
        </h1>
        <p className="text-muted-foreground">
          A clinical review of BPH and Prostatitis for healthcare professionals.
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
        <AccordionItem value="item-1">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Microscope className="h-6 w-6 text-primary" />
              Pathophysiology and Clinical Manifestations of BPH
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 space-y-4">
            <SectionCard
                sectionId={1}
                title="Anatomy, Physiology, and LUTS"
                onComplete={handleSectionComplete}
                isCompleted={completedSections.has(1)}
            >
                <p>
                  Benign Prostatic Hyperplasia (BPH) arises from the transitional zone of the prostate. Its pathophysiology involves both static and dynamic components. The <strong>static component</strong> results from glandular enlargement impinging on the urethra, while the <strong>dynamic component</strong> relates to the tension of prostatic smooth muscle, mediated by alpha-1 adrenergic receptors.
                </p>
                <p>
                  Lower Urinary Tract Symptoms (LUTS) are preferred over "prostatism" as they are not disease-specific. They are classified into:
                </p>
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    <strong>Storage (Irritative):</strong> Frequency, nocturia, urgency, and incontinence.
                  </li>
                  <li>
                    <strong>Voiding (Obstructive):</strong> Slow stream, intermittency, hesitancy, straining, and terminal dribble.
                  </li>
                  <li>
                    <strong>Postmicturition:</strong> Sensation of incomplete emptying and postmicturition dribble.
                  </li>
                </ul>
                <p>
                  Obstruction can induce secondary bladder wall changes (detrusor overactivity), contributing to LUTS and potentially leading to urinary retention.
                </p>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Stethoscope className="h-6 w-6 text-primary" />
              Assessment and Diagnosis of BPH
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 space-y-4">
            <SectionCard
                sectionId={2}
                title="Initial Evaluation"
                onComplete={handleSectionComplete}
                isCompleted={completedSections.has(2)}
            >
                <p>The diagnosis of BPH is clinical and one of exclusion. The initial workup should include:</p>
                 <ul className="list-disc space-y-2 pl-5">
                    <li>
                        <strong>Standardized Questionnaire:</strong> Use the International Prostate Symptom Score (IPSS) to quantify symptom severity.
                    </li>
                    <li>
                        <strong>History:</strong> Rule out other contributors like uncontrolled diabetes, neurologic conditions, UTIs, and review medications (e.g., diuretics, alpha-agonists).
                    </li>
                    <li>
                        <strong>Digital Rectal Exam (DRE):</strong> Assess prostate size, symmetry, and rule out nodules. Note that prostate size on DRE may not correlate with symptom severity.
                    </li>
                    <li>
                        <strong>Urinalysis:</strong> Performed to rule out UTI, hematuria, and glycosuria. An unremarkable UA is typical for BPH.
                    </li>
                     <li>
                        <strong>Optional Tests:</strong> Post-void residual (PVR) if retention is suspected. Serum creatinine to assess renal function. Urodynamics are typically reserved for pre-surgical evaluation.
                    </li>
                </ul>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="item-3">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Pill className="h-6 w-6 text-primary" />
              Pharmacological Management of BPH
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 space-y-4">
            <SectionCard
                sectionId={3}
                title="Pharmacological Approaches"
                onComplete={handleSectionComplete}
                isCompleted={completedSections.has(3)}
            >
                <div>
                  <h4 className="font-semibold text-card-foreground">Alpha-Blockers</h4>
                  <p>Target the dynamic component by relaxing smooth muscle. All are considered to have equal clinical effectiveness.</p>
                  <ul className="list-disc space-y-2 pl-5 mt-2">
                      <li><strong>Non-selective (Terazosin, Doxazosin):</strong> Require dose titration and BP monitoring.</li>
                      <li><strong>Alpha-1A Selective (Tamsulosin, Silodosin):</strong> Minimal effects on BP, but higher rates of ejaculatory dysfunction. Silodosin is highly selective.</li>
                      <li><strong>Alfuzosin:</strong> Lacks subtype selectivity but has minimal BP effects and low rates of ejaculatory dysfunction.</li>
                      <li><strong>Clinical Pearl:</strong> Warn patients about Intraoperative Floppy Iris Syndrome (IFIS) if cataract surgery is planned. It's prudent to delay initiation until after surgery.</li>
                  </ul>
                </div>
                <div className="mt-4">
                  <h4 className="font-semibold text-card-foreground">5-Alpha-Reductase Inhibitors (Finasteride, Dutasteride)</h4>
                  <p>Target the static component by reducing prostate size. Best for larger prostates (&gt;40g). May take up to 6 months for full effect. Reduces risk of acute retention and need for surgery.</p>
                  <ul className="list-disc space-y-2 pl-5 mt-2">
                      <li><strong>Side Effects:</strong> Primarily sexual (decreased libido, ED).</li>
                      <li><strong>PSA Levels:</strong> Reduce serum PSA by ~50% after 6 months; a new baseline is needed for cancer screening.</li>
                  </ul>
                </div>
                <div className="mt-4">
                  <h4 className="font-semibold text-card-foreground">Combination & Other Therapies</h4>
                  <ul className="list-disc space-y-2 pl-5">
                      <li><strong>Alpha-blocker + 5-ARI:</strong> More effective than monotherapy for men with large prostates in reducing clinical progression.</li>
                      <li><strong>Alpha-blocker + Anticholinergic:</strong> Can be used safely for predominant storage symptoms in men with PVR &lt;250 mL.</li>
                      <li><strong>PDE-5 Inhibitors (Tadalafil):</strong> FDA-approved for LUTS, improves IPSS score but not peak flow rate.</li>
                  </ul>
                </div>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="item-4">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Activity className="h-6 w-6 text-primary" />
              Surgical and Minimally Invasive Therapies for BPH
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 space-y-4">
            <SectionCard
                sectionId={4}
                title="Surgical Options"
                onComplete={handleSectionComplete}
                isCompleted={completedSections.has(4)}
            >
                <p>
                Indications include refractory LUTS, urinary retention, recurrent UTIs, bladder stones, or renal insufficiency from obstruction.
                </p>
                <ul className="list-disc space-y-2 pl-5">
                    <li>
                        <strong>TURP (Transurethral Resection of the Prostate):</strong> The long-standing gold standard. Bipolar TURP is safer as it avoids TUR syndrome.
                    </li>
                    <li>
                        <strong>TUIP (Transurethral Incision):</strong> Effective for smaller glands (&lt;30g) with lower risk of retrograde ejaculation.
                    </li>
                    <li>
                        <strong>Open Prostatectomy:</strong> Reserved for very large glands (&gt;80g).
                    </li>
                    <li>
                        <strong>Laser Therapies & TUMT:</strong> Evolving technologies that offer similar efficacy to TURP with potentially fewer side effects. Laser vaporization is the fastest-growing modality.
                    </li>
                    <li>
                        <strong>Emerging Therapies:</strong> Prostatic Urethral Lift (PUL), Convective Water Vapor Energy (WAVE), and Prostatic Artery Embolization (PAE) are newer, less invasive options with promising short-to-mid-term data.
                    </li>
                </ul>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>
        
         <AccordionItem value="item-5">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Stethoscope className="h-6 w-6 text-primary" />
              Prostatitis: Classification and Management
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 space-y-4">
            <SectionCard
                sectionId={5}
                title="Prostatitis Categories"
                onComplete={handleSectionComplete}
                isCompleted={completedSections.has(5)}
            >
                <p>Prostatitis is an infection or inflammation of the prostate. The NIH classification includes four categories:</p>
                <ul className="list-disc space-y-2 pl-5">
                    <li><strong>Category I (Acute Bacterial):</strong> Presents with acute UTI/systemic symptoms. Swollen, tender prostate on DRE. Prostatic massage is contraindicated. Treat with bactericidal antibiotics (e.g., fluoroquinolones, cephalosporins), parenterally if severe.</li>
                    <li><strong>Category II (Chronic Bacterial):</strong> Recurrent UTIs with the same organism. Requires a prolonged course (4-6 weeks) of oral antibiotics (fluoroquinolones).</li>
                    <li><strong>Category III (CP/CPPS):</strong> Most common type (&gt;90%). Primary symptom is urologic pain. Diagnosis of exclusion. Management is multimodal and phenotype-based (UPOINT system), using analgesics, anti-inflammatories, alpha-blockers, and non-pharmacologic approaches like cognitive behavioral therapy and acupuncture.</li>
                    <li><strong>Category IV (Asymptomatic Inflammatory):</strong> Incidental finding of leukocytes. No treatment required.</li>
                </ul>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
