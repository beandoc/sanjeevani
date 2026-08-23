'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  ArrowLeft,
  Shirt,
  Sparkles,
  Shield,
  Sun,
  Heart,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Activity,
  Scissors,
  Droplets
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useProfile } from '@/context/role-context';
import { useEffect, useState } from 'react';
import { SectionCard } from '@/components/cards/section-card';

const MODULE_ID = 'elderly-garments-adaptive-dressing';
const SECTIONS = 4;

export default function AdaptiveClothingPage() {
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
            Dignity & Autonomy
          </Badge>
          <Badge variant="secondary" className="text-[10px]">
            4 Practical Lessons • 15 Min
          </Badge>
        </div>
        <h1 className="text-3xl font-bold font-headline">
          Adaptive Clothing & Garment Care: Preserving Dignity, Autonomy & Hygiene
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Master the selection of senior-friendly adaptive garments (Velcro closures, open-back designs), ergonomic dressing techniques for arthritis/stroke, and hygienic laundry protocols.
        </p>
      </div>

      {/* Clinical Overview Card */}
      <Card className="border-border bg-card/60 shadow-xs">
        <CardContent className="p-4 sm:p-5 space-y-3">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0 mt-0.5">
              <Shirt className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-foreground">The Dignity of Dressing</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                As joints stiffen with age, dressing becomes physically strenuous. Adaptive clothing empowers older adults to dress independently for longer, maintaining self-worth, emotional dignity, and social confidence.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accordion Lessons */}
      <Accordion type="single" collapsible className="w-full space-y-4" defaultValue="item-1">
        {/* Lesson 1: Psychology of Dressing */}
        <AccordionItem value="item-1" className="border border-border/80 rounded-2xl overflow-hidden bg-card shadow-xs">
          <AccordionTrigger className="px-5 py-4 text-base font-bold hover:no-underline hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3">
              <Heart className="h-5 w-5 text-rose-500" />
              <span>Lesson 1: The Psychology of Dressing & Preserving Self-Sufficiency</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5 pt-2">
            <SectionCard
              sectionId={1}
              title="1.1 Functional Mobility Constraints & Emotional Dignity"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(1)}
            >
              <div className="space-y-3 text-xs leading-relaxed text-muted-foreground">
                <p>
                  Aging entails physiological changes such as reduced shoulder abduction, spinal stiffness, tremors, and loss of fine pinch grip. Struggling with small buttons or tight necklines can cause profound frustration and helplessness.
                </p>

                <h4 className="font-bold text-foreground text-sm pt-2">Core Principles of Senior Dressing:</h4>
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    <strong>Maximizing Autonomy:</strong> Clothing should be designed to allow the senior to dress independently for as long as possible, even with mild cognitive decline or joint arthritis.
                  </li>
                  <li>
                    <strong>Age-Appropriate & Culturally Dignified:</strong> Garments should look elegant, fit well, and match the senior&apos;s personal cultural and aesthetic preferences (patterns, colors, designs).
                  </li>
                  <li>
                    <strong>Never Treating Patients Like Children:</strong> Avoid undignified makeshift solutions. Well-fitted clothing enhances self-respect when interacting with family, friends, and visitors.
                  </li>
                </ul>
              </div>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>

        {/* Lesson 2: Garment Selection */}
        <AccordionItem value="item-2" className="border border-border/80 rounded-2xl overflow-hidden bg-card shadow-xs">
          <AccordionTrigger className="px-5 py-4 text-base font-bold hover:no-underline hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3">
              <Shirt className="h-5 w-5 text-primary" />
              <span>Lesson 2: Garment Selection: Fabrics, Cuts & Adaptive Fasteners</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5 pt-2">
            <SectionCard
              sectionId={2}
              title="2.1 Choosing Senior-Friendly Fabrics and Closures"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(2)}
            >
              <div className="space-y-3 text-xs leading-relaxed text-muted-foreground">
                <p>
                  When selecting or tailoring clothing for older adults, prioritize ease of wear and skin comfort:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded-xl border border-border bg-background space-y-1">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Soft, Breathable & Iron-Free Fabrics
                    </span>
                    <p className="text-[11px]">
                      Choose breathable natural cottons, modal, or soft jersey knits. Avoid stiff synthetic polyesters or scratchy seams that cause skin irritation. Select wrinkle-resistant fabrics that look neat without ironing.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border border-border bg-background space-y-1">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Elastic Waistbands & Wide Openings
                    </span>
                    <p className="text-[11px]">
                      Use gentle elastic waistbands (avoid tight restrictive belts), wide necklines, and roomy cuffs that slip easily over stiff wrists and swollen arthritic ankles.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border border-border bg-background space-y-1">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Velcro & Magnetic Closures
                    </span>
                    <p className="text-[11px]">
                      Replace tiny buttons with Velcro brand closures, magnetic snap buttons, or large ring zipper pulls that require minimal finger dexterity for patients with Parkinson&apos;s or arthritis.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border border-border bg-background space-y-1">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Easy Grasp Fasteners
                    </span>
                    <p className="text-[11px]">
                      Attach cloth loops or key rings to zipper tabs so individuals with limited grip strength can easily pull zippers independently.
                    </p>
                  </div>
                </div>
              </div>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>

        {/* Lesson 3: Adaptive Dressing Techniques (Stroke/Arthritis) */}
        <AccordionItem value="item-3" className="border border-border/80 rounded-2xl overflow-hidden bg-card shadow-xs">
          <AccordionTrigger className="px-5 py-4 text-base font-bold hover:no-underline hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-blue-500" />
              <span>Lesson 3: Assisted Dressing, Open-Back Styles & Post-Stroke Technique</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5 pt-2">
            <SectionCard
              sectionId={3}
              title="3.1 Ergonomic Dressing Methods for Frail or Paralyzed Seniors"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(3)}
            >
              <div className="space-y-3 text-xs leading-relaxed text-muted-foreground">
                <p>
                  When physical assistance is required, using proper biomechanical techniques prevents joint dislocation and pain:
                </p>

                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-950 dark:text-blue-200 space-y-1">
                  <span className="font-bold text-xs flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    The Golden Stroke / Hemiplegia Dressing Rule
                  </span>
                  <p className="text-[11px] leading-relaxed">
                    <strong>When DRESSING:</strong> Dress the <em>affected (weak/paralyzed) limb FIRST</em>, followed by the strong limb.<br />
                    <strong>When UNDRESSING:</strong> Undress the <em>unaffected (strong) limb FIRST</em>, then gently slip the sleeve off the weak limb.
                  </p>
                </div>

                <h4 className="font-bold text-foreground text-sm pt-2">Specialized Adaptive Designs for Assisted Care:</h4>
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    <strong>Open-Back Tops & Shirts:</strong> Feature overlapping back panels with shoulder snaps. The caregiver slides the sleeves up the patient&apos;s arms from the front and snaps the back closed without forcing the senior to raise their arms or roll extensively.
                  </li>
                  <li>
                    <strong>Side-Zip & Open-Seam Pants:</strong> Full-length side zippers or Velcro seams allow trousers to open completely flat, enabling effortless catheter management and adult brief changes while lying in bed.
                  </li>
                </ul>
              </div>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>

        {/* Lesson 4: Hygiene, Laundry & Stock Planning */}
        <AccordionItem value="item-4" className="border border-border/80 rounded-2xl overflow-hidden bg-card shadow-xs">
          <AccordionTrigger className="px-5 py-4 text-base font-bold hover:no-underline hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3">
              <Sun className="h-5 w-5 text-amber-500" />
              <span>Lesson 4: Garment Hygiene, Laundry, Sunlight Disinfection & Inventory</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5 pt-2">
            <SectionCard
              sectionId={4}
              title="4.1 Cleanliness, Disinfection & Incontinence Stock Management"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(4)}
            >
              <div className="space-y-3 text-xs leading-relaxed text-muted-foreground">
                <p>
                  Clean clothing protects frail skin from moisture-associated dermatitis and bacterial colonization:
                </p>

                <h4 className="font-bold text-foreground text-sm pt-2">Daily Garment Hygiene Guidelines:</h4>
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    <strong>Daily Changes:</strong> Change clothing at least once daily, and <strong>immediately</strong> whenever garments become damp from perspiration, urinary leakage, or food spillages.
                  </li>
                  <li>
                    <strong>Mild Detergents:</strong> Wash elderly clothes with mild, hypoallergenic detergents. Avoid harsh bleach or heavy artificial perfumes that trigger contact dermatitis on fragile skin.
                  </li>
                  <li>
                    <strong>Sunlight Disinfection:</strong> Always dry washed garments outdoors in natural direct sunlight. Solar ultraviolet (UV) radiation acts as a natural, non-chemical antimicrobial disinfectant against fungal spores and bacteria.
                  </li>
                  <li>
                    <strong>Replacing Torn Garments:</strong> Promptly mend or replace frayed, torn, or stained clothes with fresh garments to preserve the older adult&apos;s dignity and self-image.
                  </li>
                </ul>

                <h4 className="font-bold text-foreground text-sm pt-3">Wardrobe Inventory Planning:</h4>
                <p>
                  Maintain an adequate supply of at least <strong>7–10 sets of easy-wear garments</strong>, calibrated to the household laundry schedule, the severity of urinary incontinence, and mealtime tremor spillages.
                </p>
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
            <span>Daily Care Routine</span>
            <Shirt className="w-3.5 h-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
