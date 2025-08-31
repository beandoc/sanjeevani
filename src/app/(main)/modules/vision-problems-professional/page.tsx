
'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ArrowLeft, Stethoscope, Microscope, Eye, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useProfile } from '@/context/role-context';
import { useEffect, useState } from 'react';
import { SectionCard } from '@/components/cards/section-card';

const MODULE_ID = 'vision-problems-professional';
const SECTIONS = 3;

export default function VisionProblemsProfessionalPage() {
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
          Geriatric Ophthalmology: A Clinical Review
        </h1>
        <p className="text-muted-foreground">
          A module for PCPs on the diagnosis and management of common age-related eye conditions.
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
        <AccordionItem value="item-1">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-destructive" />
              The Red Eye: Red Flags and Differential
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 space-y-4">
            <SectionCard
              sectionId={1}
              title="Urgent vs. Non-Urgent Conditions"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(1)}
            >
                <p>
                  Most red eye presentations in primary care are benign. The key is to identify red flags that indicate a vision-threatening condition requiring same-day ophthalmology referral.
                </p>
                <h4 className="font-semibold">Red Flags for Emergent Referral:</h4>
                 <ul className="list-disc space-y-2 pl-5">
                    <li>Decreased visual acuity (not resolved with blinking)</li>
                    <li>Significant eye pain (more than irritation or foreign body sensation)</li>
                    <li>Photophobia</li>
                    <li>Ciliary flush (a ring of hyperemia around the limbus)</li>
                    <li>Corneal opacification or epithelial disruption (visible with fluorescein)</li>
                    <li>Pupil abnormalities (fixed, irregular)</li>
                    <li>Elevated intraocular pressure (IOP &gt; 40 mmHg is an emergency)</li>
                </ul>
                <h4 className="font-semibold mt-4">Common Benign Causes:</h4>
                <p>Conditions like blepharitis, dry eye syndrome, subconjunctival hemorrhage, and most cases of conjunctivitis can often be managed initially in the primary care setting. Treatment includes warm compresses, artificial tears, and topical antibiotics if a bacterial cause is strongly suspected.</p>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Microscope className="h-6 w-6 text-primary" />
              Common Age-Related Eye Diseases
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 space-y-4">
            <SectionCard
              sectionId={2}
              title="Common Age-Related Diseases"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(2)}
            >
                <h4 className="font-semibold">Dry Eye Disease (Keratoconjunctivitis Sicca)</h4>
                <p>A multifactorial disease causing discomfort, visual disturbance, and tear film instability. Risk factors include advanced age, female sex, Sjögren syndrome, and polypharmacy (especially diuretics, antihistamines, antidepressants). Management focuses on education, environmental modification, artificial tears (preservative-free preferred for frequent use), and addressing underlying conditions like blepharitis.</p>
                <h4 className="font-semibold mt-4">Age-Related Macular Degeneration (AMD)</h4>
                <p>A leading cause of irreversible vision loss. "Dry" (atrophic) AMD is more common, while "wet" (neovascular) AMD causes more severe vision loss. Key risk factors are age, smoking, and genetics. Patients should monitor for metamorphopsia with an Amsler grid. Management for intermediate/advanced AMD includes AREDS2 vitamin supplementation. Wet AMD is treated with intravitreal anti-VEGF injections.</p>
                <h4 className="font-semibold mt-4">Cataracts</h4>
                <p>Lens opacification causing decreased visual acuity, glare, and poor contrast sensitivity. The only treatment is surgical extraction with intraocular lens implantation. The indication for surgery is functional impairment, not a specific VA number. Surgery is highly effective and can improve quality of life, cognition, and reduce fall risk.</p>
                <h4 className="font-semibold mt-4">Glaucoma</h4>
                <p>A progressive optic neuropathy characterized by visual field loss, often asymptomatically until advanced stages. Elevated IOP is the primary modifiable risk factor. Other risks include age, African ethnicity, and family history. Management involves lowering IOP with topical medications (prostaglandin analogues are first-line), laser trabeculoplasty, or surgery.</p>
                <h4 className="font-semibold mt-4">Diabetic Retinopathy (DR)</h4>
                <p>A common microvascular complication of diabetes. Risk factors include duration of DM, poor glycemic control, and hypertension. All patients with DM require annual dilated fundus examinations for screening. Management involves strict control of glucose and blood pressure, with anti-VEGF injections and laser photocoagulation for vision-threatening stages (proliferative DR, macular edema).</p>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-3">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Stethoscope className="h-6 w-6 text-primary" />
              Medication Considerations
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 space-y-4">
            <SectionCard
              sectionId={3}
              title="Medication Considerations"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(3)}
            >
                <h4 className="font-semibold text-lg">Systemic Effects of Eye Drops</h4>
                <p>
                Systemic absorption of topical eye medications can be significant in older adults. Educate patients on nasolacrimal occlusion (gentle pressure on the inner canthus) or simple eye closure for 1-2 minutes after instillation to minimize absorption.
                </p>
                <ul className="list-disc space-y-2 pl-5">
                <li>
                    <strong>Beta-blockers (e.g., Timolol):</strong> Can cause bradycardia, hypotension, and bronchospasm. Use with caution in patients with COPD, asthma, or heart block.
                </li>
                <li>
                    <strong>Alpha-adrenergic agonists (e.g., Brimonidine):</strong> Can cause dry mouth and fatigue.
                </li>
                </ul>

                <h4 className="font-semibold text-lg mt-4">Ocular Effects of Systemic Medications</h4>
                <ul className="list-disc space-y-2 pl-5">
                    <li>
                        <strong>Anticholinergics & Antihistamines:</strong> Can exacerbate dry eye and carry a risk of inducing angle-closure glaucoma in predisposed individuals.
                    </li>
                    <li>
                        <strong>Corticosteroids:</strong> Long-term use can cause cataracts and elevated IOP.
                    </li>
                </ul>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
