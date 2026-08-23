'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  ArrowLeft,
  Shield,
  Droplets,
  Bed,
  Utensils,
  Activity,
  Heart,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Scissors,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useProfile } from '@/context/role-context';
import { useEffect, useState } from 'react';
import { SectionCard } from '@/components/cards/section-card';

const MODULE_ID = 'bed-bound-care';
const SECTIONS = 4;

export default function BedBoundCareModulePage() {
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
            Clinical Nursing Protocol
          </Badge>
          <Badge variant="secondary" className="text-[10px]">
            4 Lessons • 20 Min
          </Badge>
        </div>
        <h1 className="text-3xl font-bold font-headline">
          Bed-Bound Patient Care: Skin Integrity, Pressure Prevention & Hair Care
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Master clinical protocols for geriatric skin care, no-rubbing pat drying, drawsheet moisture barriers, 2-hourly turning schedules, therapeutic back massages, and dignified hair care.
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full space-y-4" defaultValue="item-1">
        {/* Lesson 1: Skin Care & Pressure Ulcer Prevention */}
        <AccordionItem value="item-1" className="border border-border/80 rounded-2xl overflow-hidden bg-card shadow-xs">
          <AccordionTrigger className="px-5 py-4 text-base font-bold hover:no-underline hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-primary" />
              <span>Lesson 1: Skin Care, No-Rubbing Pat Drying & Pressure Sore Prevention</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5 pt-2">
            <SectionCard
              sectionId={1}
              title="1.1 Gentle Cleansing, Emollient Hydration & Repositioning Schedule"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(1)}
            >
              <div className="space-y-3 text-xs leading-relaxed text-muted-foreground">
                <p>
                  Geriatric skin is thin, fragile, and prone to tear with minimal friction. Preventing pressure ulcers (bedsores) and skin breakdown requires strict adherence to gentle cleansing:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded-xl border border-border bg-background space-y-1">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Mild Soap & Warm Water Only
                    </span>
                    <p className="text-[11px]">
                      Use gentle pH-neutral, non-scented cleansing soap and comfortably warm (not hot) water. Hot water strips protective epidermal lipids.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border border-border bg-background space-y-1">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Gentle Pat-Drying (No Rubbing!)
                    </span>
                    <p className="text-[11px]">
                      Never vigorously rub or scrub elderly skin with towels. Gently blot and pat dry with a soft cotton towel to prevent epidermal shear tears.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border border-border bg-background space-y-1">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Immediate Emollient Moisturizing
                    </span>
                    <p className="text-[11px]">
                      Apply moisturizing lotion or barrier cream within 3 minutes of bathing while the skin is still slightly damp to lock in stratum corneum moisture.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border border-border bg-background space-y-1">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Cotton Drawsheet Barrier
                    </span>
                    <p className="text-[11px]">
                      Never place a patient directly on rubber/plastic mackintoshes. Direct contact causes sweat traps and maceration. Always place a soft, breathable cotton bedsheet over rubber sheets.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-950 dark:text-amber-200 mt-2 space-y-1">
                  <span className="font-bold text-xs flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    2-Hourly (Q2H) Turning & Therapeutic Back Massages
                  </span>
                  <p className="text-[11px] leading-relaxed">
                    Change the patient&apos;s position at least every 2 hours (Left lateral 30° → Supine with sacral unweighting → Right lateral 30°). Perform gentle upward effleurage back massages over non-bony muscular areas to stimulate capillary circulation. <em>Never vigorously rub reddened, non-blanching bony areas (sacrum, trochanters, heels).</em>
                  </p>
                </div>
              </div>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>

        {/* Lesson 2: Hair Care & Scalp Health */}
        <AccordionItem value="item-2" className="border border-border/80 rounded-2xl overflow-hidden bg-card shadow-xs">
          <AccordionTrigger className="px-5 py-4 text-base font-bold hover:no-underline hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <span>Lesson 2: Hair Care, Scalp Assessment & Dignified Grooming</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5 pt-2">
            <SectionCard
              sectionId={2}
              title="2.1 Daily Brushing, Scalp Circulation & Hygiene"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(2)}
            >
              <div className="space-y-3 text-xs leading-relaxed text-muted-foreground">
                <p>
                  A person&apos;s appearance directly shapes their self-worth, emotional dignity, and psychological health. Proper hair care stimulates microcirculation and evenly distributes natural oils across the scalp:
                </p>

                <h4 className="font-bold text-foreground text-sm pt-2">Clinical Hair Care Protocol:</h4>
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    <strong>Morning Routine & Personal Styling:</strong> Make gentle brushing and combing an integral part of morning care. Always ask the patient about their preferred, age-appropriate hairstyle.
                  </li>
                  <li>
                    <strong>Sanitation & Non-Sharing Rule:</strong> Clean and sanitize combs/brushes after every use. Never share hair care items between family members to prevent fungal or parasitic cross-contamination.
                  </li>
                  <li>
                    <strong>Gentle Detangling:</strong> Handle hair gently. Hold hair near the roots and comb tangled ends first to prevent painful scalp traction.
                  </li>
                  <li>
                    <strong>Scalp Examination:</strong> During brushing, systematically inspect the scalp for alopecia areata (spot baldness), excessive flaking (dandruff), pediculosis (lice/nits), greasy sebum texture, or painful furuncles/boils.
                  </li>
                  <li>
                    <strong>Washing & Rapid Drying:</strong> Shampoo 1–2 times weekly using a mild, tear-free formula preferred by the patient. Dry and style hair promptly after washing using warm towels to prevent chills and hypothermia.
                  </li>
                  <li>
                    <strong>Safety Contraindications:</strong> Never use hot combs, heated curling irons, or unauthorized chemical hair dyes/coloring on frail bed-bound individuals.
                  </li>
                  <li>
                    <strong>Promote Independence:</strong> Whenever possible, hand the comb to the patient and encourage them to do as much as they can independently.
                  </li>
                </ul>
              </div>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>

        {/* Lesson 3: Mobility & Contracture Prevention */}
        <AccordionItem value="item-3" className="border border-border/80 rounded-2xl overflow-hidden bg-card shadow-xs">
          <AccordionTrigger className="px-5 py-4 text-base font-bold hover:no-underline hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-blue-500" />
              <span>Lesson 3: Passive Range-of-Motion & Contracture Prevention</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5 pt-2">
            <SectionCard
              sectionId={3}
              title="3.1 Preserving Joint Flexibility in Bed-Bound Patients"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(3)}
            >
              <div className="space-y-3 text-xs leading-relaxed text-muted-foreground">
                <p>
                  Immobility rapidly causes muscle shortening (contractures), deep vein thrombosis (DVT), and joint stiffness:
                </p>
                <ul className="list-disc space-y-1.5 pl-5">
                  <li>
                    <strong>Passive Range of Motion (PROM):</strong> Gently support and move each joint (ankles, knees, hips, wrists, shoulders) through its comfortable arc 2–3 times daily as taught by the physiotherapist.
                  </li>
                  <li>
                    <strong>Heel Floatation & Positioning:</strong> Place pillows under the lower calves to float the heels off the mattress surface, completely eliminating calcaneal pressure ulcers.
                  </li>
                </ul>
              </div>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>

        {/* Lesson 4: Nutrition, Hydration & Dignity */}
        <AccordionItem value="item-4" className="border border-border/80 rounded-2xl overflow-hidden bg-card shadow-xs">
          <AccordionTrigger className="px-5 py-4 text-base font-bold hover:no-underline hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3">
              <Utensils className="h-5 w-5 text-emerald-600" />
              <span>Lesson 4: High-Protein Nutrition, Hydration & Aspiration Safety</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5 pt-2">
            <SectionCard
              sectionId={4}
              title="4.1 Rebuilding Skin Collagen and Preventing Aspiration"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(4)}
            >
              <div className="space-y-3 text-xs leading-relaxed text-muted-foreground">
                <p>
                  Adequate protein (1.2–1.5g/kg/day) and vitamin C/Zinc are essential to maintain dermal thickness and repair cellular damage:
                </p>
                <ul className="list-disc space-y-1.5 pl-5">
                  <li>
                    <strong>Upright Feeding:</strong> Elevate the head of the bed to 60–90 degrees during all meals and maintain this position for 30 minutes post-meal to prevent silent aspiration.
                  </li>
                  <li>
                    <strong>Scheduled Sips of Water:</strong> Offer small sips of water every 1–2 hours while awake to preserve tissue turgor.
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
          <Link href="/modules/daily-caregiving-routine">
            <span>Daily Care Blueprint</span>
            <Bed className="w-3.5 h-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
