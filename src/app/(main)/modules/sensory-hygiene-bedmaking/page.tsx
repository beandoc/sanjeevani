'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  ArrowLeft,
  Eye,
  Ear,
  Bed,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Wind,
  Volume2,
  Droplets,
  Heart,
  Home
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useProfile } from '@/context/role-context';
import { useEffect, useState } from 'react';
import { SectionCard } from '@/components/cards/section-card';

const MODULE_ID = 'sensory-hygiene-bedmaking';
const SECTIONS = 4;

export default function SensoryHygieneBedmakingPage() {
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
          Back to All Modules
        </Link>
      </Button>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] font-bold text-primary border-primary/30 uppercase tracking-wider">
            Clinical Nursing Skills
          </Badge>
          <Badge variant="secondary" className="text-[10px]">
            4 Lessons • 20 Min
          </Badge>
        </div>
        <h1 className="text-3xl font-bold font-headline">
          Sensory Organ Hygiene (Eyes, Ears, Nose, Hearing Aids) & Clinical Bed-Making
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Master essential clinical nursing techniques for eye care (inner-to-outer canthus), hearing aid calibration, nasal cannula / NG tube sanitation, and wrinkle-free bed making to prevent pressure injuries and infections.
        </p>
      </div>

      {/* Clinical Overview Card */}
      <Card className="border-border bg-card/60 shadow-xs">
        <CardContent className="p-4 sm:p-5 space-y-3">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-foreground">Sensory & Environmental Protection</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Sensory organs (eyes, ears, nares) are the most delicate mucosal gateways in the human body. Gentle, aseptic cleaning prevents blindness from exposure keratitis, tympanic perforations, and aspiration infections.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accordion Lessons */}
      <Accordion type="single" collapsible className="w-full space-y-4" defaultValue="item-1">
        {/* Lesson 1: Eye Care */}
        <AccordionItem value="item-1" className="border border-border/80 rounded-2xl overflow-hidden bg-card shadow-xs">
          <AccordionTrigger className="px-5 py-4 text-base font-bold hover:no-underline hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3">
              <Eye className="h-5 w-5 text-primary" />
              <span>Lesson 1: Eye Care, Inner-to-Outer Canthus Technique & Infection Isolation</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5 pt-2">
            <SectionCard
              sectionId={1}
              title="1.1 Gentle Aseptic Ophthalmic Cleansing"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(1)}
            >
              <div className="space-y-3 text-xs leading-relaxed text-muted-foreground">
                <p>
                  The eye is the most sensitive mucosal organ. In bedridden, frail, or comatose older adults, incomplete eyelid closure (lagophthalmos) leads to rapid corneal desiccation, ulceration, and bacterial conjunctivitis.
                </p>

                <h4 className="font-bold text-foreground text-sm pt-2">Step-by-Step Eye Cleansing Protocol:</h4>
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    <strong>Direction of Wipe:</strong> Always cleanse from the <strong>inner canthus (near the nose) to the outer canthus (near the ear)</strong>. This prevents contaminated secretions and pus from entering the nasolacrimal duct.
                  </li>
                  <li>
                    <strong>Sterile Saline Solution:</strong> Use sterile normal saline (0.9% NaCl) or boiled, cooled water with sterile gauze squares. Use a fresh, clean corner of gauze for every single wipe!
                  </li>
                  <li>
                    <strong>Infection Cross-Contamination Rule:</strong> If one eye has conjunctivitis (discharge/redness), <strong>always clean the uninfected eye first</strong> and the infected eye second, using completely separate sterile wipes.
                  </li>
                  <li>
                    <strong>Lubricating Drops:</strong> Administer prescribed artificial tears / lubricating eye drops twice daily or as ordered to maintain corneal moisture.
                  </li>
                  <li>
                    <strong>Ophthalmic Red Flags:</strong> Inspect daily for conjunctival hyperemia (redness), purulent yellow discharge, eyelid crusting, photophobia (light sensitivity), or corneal cloudiness.
                  </li>
                </ul>
              </div>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>

        {/* Lesson 2: Ear Care & Hearing Aids */}
        <AccordionItem value="item-2" className="border border-border/80 rounded-2xl overflow-hidden bg-card shadow-xs">
          <AccordionTrigger className="px-5 py-4 text-base font-bold hover:no-underline hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3">
              <Ear className="h-5 w-5 text-emerald-600" />
              <span>Lesson 2: Ear Hygiene & Hearing Aid Maintenance and Insertion</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5 pt-2">
            <SectionCard
              sectionId={2}
              title="2.1 External Auditory Hygiene & Hearing Aid Optimization"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(2)}
            >
              <div className="space-y-3 text-xs leading-relaxed text-muted-foreground">
                <p>
                  Proper ear hygiene preserves hearing acuity and prevents dangerous wax impaction in older adults:
                </p>

                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-950 dark:text-rose-200 space-y-1">
                  <span className="font-bold text-xs flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    Strict Safety Warning: Never Insert Objects into the Ear Canal
                  </span>
                  <p className="text-[11px] leading-relaxed">
                    <strong>Never insert cotton swabs (Q-tips), bobby pins, toothpicks, or keys</strong> into the ear canal. Inserting objects pushes cerumen (earwax) deeper against the tympanic membrane, causing cerumen impaction, conductive hearing loss, and accidental eardrum perforation!
                  </p>
                </div>

                <h4 className="font-bold text-foreground text-sm pt-2">Cleaning the Pinna (External Ear):</h4>
                <p>
                  During the morning bath, use a clean corner of a moistened washcloth rotated gently into the concha and outer folds. A cotton-tipped applicator may be used strictly on the exterior pinna creases only.
                </p>

                <h4 className="font-bold text-foreground text-sm pt-3">Hearing Aid Protocol (Insertion & Calibration):</h4>
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    <strong>Casing Hygiene:</strong> Wipe the exterior shell daily with a clean, dry, lint-free cloth. Inspect earmold holes for cerumen clogs and remove with the provided wax pick. Never submerge hearing aids in water or alcohol!
                  </li>
                  <li>
                    <strong>Pre-Insertion Checks:</strong> Make sure the device is <strong>switched OFF and the volume dial is turned down</strong> to prevent deafening feedback squeals during insertion.
                  </li>
                  <li>
                    <strong>Ergonomic Insertion:</strong> Gently pull the patient&apos;s <strong>earlobe downward and backward</strong> with one hand to straighten the ear canal, while smoothly pressing the hearing aid earmold inward with the other hand.
                  </li>
                  <li>
                    <strong>Activation & Verification:</strong> Switch the device on and slowly adjust volume to the prescribed setting. Test auditory clarity by speaking slowly, clearly, and facing the patient in a calm, normal tone of voice.
                  </li>
                </ul>
              </div>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>

        {/* Lesson 3: Nasal Hygiene & O2 Cannula / NG Tube Care */}
        <AccordionItem value="item-3" className="border border-border/80 rounded-2xl overflow-hidden bg-card shadow-xs">
          <AccordionTrigger className="px-5 py-4 text-base font-bold hover:no-underline hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3">
              <Wind className="h-5 w-5 text-blue-500" />
              <span>Lesson 3: Nasal Care, Oxygen Cannula & Nasogastric (NG) Tube Sanitation</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5 pt-2">
            <SectionCard
              sectionId={3}
              title="3.1 Preventing Nares Crusting, Sinus Pressure & Tube Complications"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(3)}
            >
              <div className="space-y-3 text-xs leading-relaxed text-muted-foreground">
                <p>
                  Nasal passages filter air and warm inhaled breath. Dried crusts and secretions cause airway resistance, mouth breathing, and mucosal ulcerations:
                </p>

                <h4 className="font-bold text-foreground text-sm pt-2">Routine Nasal Hygiene:</h4>
                <ul className="list-disc space-y-1.5 pl-5">
                  <li>
                    <strong>Gentle Blowing:</strong> Encourage the patient to blow gently into soft facial tissues. Warn against harsh, violent blowing, which forces infected mucus into the eustachian tubes and sinuses, causing ear injury and epistaxis (nosebleeds).
                  </li>
                  <li>
                    <strong>Assisted Cleansing:</strong> If the patient is frail, gently cleanse the outer nostrils using a saline-moistened cotton-tipped applicator. <em>Never insert the applicator deeper than the cotton tip itself.</em>
                  </li>
                </ul>

                <h4 className="font-bold text-foreground text-sm pt-3">Special Oxygen Cannula & Nasogastric (NG) Tube Care (Every 8 Hours):</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded-xl border border-border bg-background space-y-1">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                      Nasal Cannula Oxygen Care
                    </span>
                    <p className="text-[11px]">
                      Inspect nares and over-the-ear contact points every 8 hours for pressure sores. Cleanse nasal prongs with saline gauze. Apply water-based lubricant (avoid petroleum jelly/Vaseline in oxygen users due to fire hazard).
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border border-border bg-background space-y-1">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                      Nasogastric (NG) Feeding Tube Care
                    </span>
                    <p className="text-[11px]">
                      Dried crusts collect around the tube insertion point. Cleanse the nostril with saline every 8 hours, and wash the external tube with mild soap and water. Change adhesive tape when loosened.
                    </p>
                  </div>
                </div>
              </div>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>

        {/* Lesson 4: Bed-Making & Room Environment */}
        <AccordionItem value="item-4" className="border border-border/80 rounded-2xl overflow-hidden bg-card shadow-xs">
          <AccordionTrigger className="px-5 py-4 text-base font-bold hover:no-underline hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3">
              <Bed className="h-5 w-5 text-amber-500" />
              <span>Lesson 4: Clinical Bed-Making & Creating a Healing Room Environment</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5 pt-2">
            <SectionCard
              sectionId={4}
              title="4.1 The Wrinkle-Free Bed Protocol & Environmental Comfort"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(4)}
            >
              <div className="space-y-3 text-xs leading-relaxed text-muted-foreground">
                <p>
                  For an ill or bed-bound older adult, the bed is their entire universe. A clean, comfortable bed directly promotes restorative sleep, accelerates physiological healing, and prevents catastrophic pressure sores.
                </p>

                <h4 className="font-bold text-foreground text-sm pt-2">Essential Bed-Making Supplies:</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  <div className="p-2 rounded-lg border border-border bg-background text-center">
                    <span className="font-bold text-foreground text-[11px] block">1. Mattress & Base</span>
                    <span className="text-[10px] text-muted-foreground">Air / Foam mattress</span>
                  </div>
                  <div className="p-2 rounded-lg border border-border bg-background text-center">
                    <span className="font-bold text-foreground text-[11px] block">2. Bottom Sheet</span>
                    <span className="text-[10px] text-muted-foreground">Tightly tucked corners</span>
                  </div>
                  <div className="p-2 rounded-lg border border-border bg-background text-center">
                    <span className="font-bold text-foreground text-[11px] block">3. Drawsheet Layer</span>
                    <span className="text-[10px] text-muted-foreground">Rubber + Cotton sheet</span>
                  </div>
                  <div className="p-2 rounded-lg border border-border bg-background text-center">
                    <span className="font-bold text-foreground text-[11px] block">4. Top Covers</span>
                    <span className="text-[10px] text-muted-foreground">Light breathable blanket</span>
                  </div>
                </div>

                <h4 className="font-bold text-foreground text-sm pt-3">The Clinical Value of Wrinkle-Free Bedding:</h4>
                <p>
                  Every wrinkle or crease in a bottom bedsheet exerts continuous focal shear pressure against the elderly patient&apos;s sacrum and trochanters, which can trigger a Stage 1 pressure ulcer within just 2 hours! Pull all sheets taut and utilize mitered (hospital) corners under the mattress.
                </p>

                <h4 className="font-bold text-foreground text-sm pt-3">Room Atmosphere & Odor Control:</h4>
                <ul className="list-disc space-y-1.5 pl-5">
                  <li>
                    <strong>Ventilation & Sunlight:</strong> Open windows for 20 minutes each morning for natural airflow and daylight to maintain circadian sleep rhythms.
                  </li>
                  <li>
                    <strong>Odor Management:</strong> Promptly dispose of soiled pads/diapers in sealed bins. Use gentle citrus room fresheners or natural camphor/essential oils to maintain a fresh, dignified ambiance.
                  </li>
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
          <Link href="/modules/bed-bound-care">
            <span>Next: Bed-Bound Care</span>
            <Bed className="w-3.5 h-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
