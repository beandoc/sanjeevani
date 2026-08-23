'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  ArrowLeft,
  Smile,
  Search,
  Shield,
  AlertTriangle,
  Sparkles,
  Droplets,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useProfile } from '@/context/role-context';
import { useEffect, useState } from 'react';
import { SectionCard } from '@/components/cards/section-card';

const MODULE_ID = 'oral-health-caregiver';
const SECTIONS = 4;

export default function OralHealthCaregiverPage() {
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
      <Button variant="outline" size="sm" asChild className="gap-2 text-xs font-semibold">
        <Link href="/modules">
          <ArrowLeft className="h-4 w-4" />
          Back to Modules
        </Link>
      </Button>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] font-bold text-primary border-primary/30 uppercase tracking-wider">
            Oral Care Protocol
          </Badge>
          <Badge variant="secondary" className="text-[10px]">
            4 Lessons • 15 Min
          </Badge>
        </div>
        <h1 className="text-3xl font-bold font-headline">
          Oral Health & Denture Care: A Clinical Caregiver Guide
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Learn the correct clinical techniques for daily natural teeth brushing, safe denture handling and cleaning without fracture risk, xerostomia (dry mouth) management, and dental emergency red flags.
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full space-y-4" defaultValue="item-1">
        {/* Chapter 1 */}
        <AccordionItem value="item-1" className="border border-border/80 rounded-2xl overflow-hidden bg-card shadow-xs">
          <AccordionTrigger className="px-5 py-4 text-base font-bold hover:no-underline hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3">
              <Search className="h-5 w-5 text-primary" />
              <span>Lesson 1: Why Oral Health is Critical in Older Adults</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5 pt-2">
            <SectionCard
              sectionId={1}
              title="1.1 The Systemic Connection Between Mouth and Body"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(1)}
            >
              <div className="space-y-3 text-xs leading-relaxed text-muted-foreground">
                <p>
                  Good oral health is far more than cosmetic—it directly determines an older adult&apos;s nutritional status, systemic inflammation, and respiratory health.
                </p>
                <h4 className="font-bold text-foreground text-sm pt-2">Key Clinical Connections:</h4>
                <ul className="list-disc space-y-1.5 pl-5">
                  <li>
                    <strong>Aspiration Pneumonia Prevention:</strong> Poor oral hygiene allows pathogenic bacteria to proliferate on teeth and tongue. In frail seniors with impaired swallowing reflexes, aspirating oral bacteria into the lungs is a leading cause of fatal pneumonia.
                  </li>
                  <li>
                    <strong>Nutritional Preservation:</strong> Untreated dental caries, painful gingivitis, or loose prostheses prevent proper mastication of fibrous vegetables and proteins, causing rapid weight loss and sarcopenia.
                  </li>
                  <li>
                    <strong>Cardiovascular & Glycemic Control:</strong> Chronic periodontitis exacerbates systemic vascular inflammation and impairs glycemic stability in diabetic seniors.
                  </li>
                </ul>
              </div>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>

        {/* Chapter 2: Denture Care Protocol */}
        <AccordionItem value="item-2" className="border border-border/80 rounded-2xl overflow-hidden bg-card shadow-xs">
          <AccordionTrigger className="px-5 py-4 text-base font-bold hover:no-underline hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-emerald-600" />
              <span>Lesson 2: Denture Care & Safe Handling Protocol</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5 pt-2">
            <SectionCard
              sectionId={2}
              title="2.1 Proper Cleaning, Fracture Prevention & Night Storage"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(2)}
            >
              <div className="space-y-3 text-xs leading-relaxed text-muted-foreground">
                <p>
                  Dentures are expensive, fragile, and essential personal property. They must be cleaned with the same frequency and rigor as natural teeth to prevent denture stomatitis and bacterial biofilms.
                </p>

                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-950 dark:text-amber-200 space-y-1">
                  <span className="font-bold text-xs flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    Crucial Sink Safety Technique to Prevent Dropping & Fractures
                  </span>
                  <p className="text-[11px] leading-relaxed">
                    Always place a folded washcloth or paper towel at the bottom of the sink and fill it with 2 inches of lukewarm water before washing dentures. Work close to the sink bottom. If the slippery denture accidentally drops from your hands, the soft towel and water cushion will prevent the acrylic resin from shattering!
                  </p>
                </div>

                <h4 className="font-bold text-foreground text-sm pt-2">Step-by-Step Denture Hygiene Steps:</h4>
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    <strong>Grasp Securely:</strong> Use a dry gauze square or clean washcloth to firmly grip the front of the denture to prevent slipping from wet hands.
                  </li>
                  <li>
                    <strong>Lukewarm Water Only:</strong> Never use hot or boiling water, which will permanently warp and distort the denture shape, causing painful gum ulcers.
                  </li>
                  <li>
                    <strong>Gentle Brushing:</strong> Clean all surfaces using a soft denture brush and non-abrasive denture paste or mild soap. Avoid standard abrasive whitening toothpastes which scratch acrylic resin.
                  </li>
                  <li>
                    <strong>Mandatory Nightly Removal:</strong> Always remove dentures before bedtime. This allows the oral mucosa and gums to rest, prevents fungal candida overgrowth (denture-related stomatitis), and eliminates choking hazards during sleep.
                  </li>
                  <li>
                    <strong>Proper Overnight Storage:</strong> Store the clean denture in a labeled, covered container submerged in clean water or effervescent denture cleanser solution to keep the acrylic hydrated and pliable.
                  </li>
                </ul>
              </div>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>

        {/* Chapter 3: Natural Teeth & Dry Mouth */}
        <AccordionItem value="item-3" className="border border-border/80 rounded-2xl overflow-hidden bg-card shadow-xs">
          <AccordionTrigger className="px-5 py-4 text-base font-bold hover:no-underline hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3">
              <Droplets className="h-5 w-5 text-blue-500" />
              <span>Lesson 3: Natural Teeth, Flossing & Xerostomia (Dry Mouth)</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5 pt-2">
            <SectionCard
              sectionId={3}
              title="3.1 Managing Medication-Induced Dry Mouth and Plaque"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(3)}
            >
              <div className="space-y-3 text-xs leading-relaxed text-muted-foreground">
                <p>
                  Polypharmacy (antihypertensives, anticholinergics, diuretics) frequently causes severe dry mouth (xerostomia), which strips the oral cavity of antibacterial saliva:
                </p>

                <ul className="list-disc space-y-1.5 pl-5">
                  <li>
                    <strong>Soft Brushing Twice Daily:</strong> Use a soft-bristled manual or adaptive ergonomic electric toothbrush with pea-sized fluoride toothpaste.
                  </li>
                  <li>
                    <strong>Xerostomia Relief:</strong> Encourage frequent small sips of room-temperature water throughout the day. Apply alcohol-free moisturizing mouth rinses or artificial saliva sprays before meals.
                  </li>
                  <li>
                    <strong>Tongue & Palate Cleansing:</strong> Gently brush the dorsal surface of the tongue and palate with a soft brush to remove food residues and fungal biofilms.
                  </li>
                </ul>
              </div>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>

        {/* Chapter 4: Red Flags */}
        <AccordionItem value="item-4" className="border border-border/80 rounded-2xl overflow-hidden bg-card shadow-xs">
          <AccordionTrigger className="px-5 py-4 text-base font-bold hover:no-underline hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <span>Lesson 4: When to Seek Immediate Professional Dental Help</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5 pt-2">
            <SectionCard
              sectionId={4}
              title="4.1 Identifying Serious Oral Pathology"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(4)}
            >
              <div className="space-y-3 text-xs leading-relaxed text-muted-foreground">
                <p>
                  Promptly schedule an evaluation with a geriatric dentist if you observe any of the following clinical signs:
                </p>
                <ul className="list-disc space-y-1.5 pl-5">
                  <li>Persistent oral ulcer, white patch (leukoplakia), or red velvety patch (erythroplakia) lasting &gt;2 weeks.</li>
                  <li>Bleeding, swollen, or purulent (pus-discharging) gums.</li>
                  <li>Sudden refusal to eat or grimacing during chewing.</li>
                  <li>Ill-fitting, rocking, or broken dentures that produce visible pressure sores on the alveolar ridge.</li>
                </ul>
              </div>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Footer Navigation */}
      <div className="flex items-center justify-between pt-6 border-t border-border/60">
        <Button variant="outline" size="sm" asChild className="text-xs">
          <Link href="/modules">Browse All Modules</Link>
        </Button>
        <Button size="sm" asChild className="text-xs font-bold gap-1.5">
          <Link href="/modules/daily-caregiving-routine">
            <span>Next: Daily Care Blueprint</span>
            <Smile className="w-3.5 h-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
