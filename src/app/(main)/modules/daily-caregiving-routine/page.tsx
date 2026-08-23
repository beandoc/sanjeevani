'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  ArrowLeft,
  CalendarCheck,
  Sparkles,
  Bath,
  Utensils,
  Pill,
  Accessibility,
  Car,
  HeartHandshake,
  Activity,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
  Smile,
  ShieldCheck
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useProfile } from '@/context/role-context';
import { useEffect, useState } from 'react';
import { SectionCard } from '@/components/cards/section-card';

const MODULE_ID = 'daily-caregiving-routine';
const SECTIONS = 4;

export default function DailyCaregivingRoutinePage() {
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
            Daily Practical Protocol
          </Badge>
          <Badge variant="secondary" className="text-[10px]">
            4 Actionable Lessons • 15 Min
          </Badge>
        </div>
        <h1 className="text-3xl font-bold font-headline">
          The Caregiver&apos;s Daily Blueprint: Personal Hygiene, Safe Transfers & Compassionate Care
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          A step-by-step master checklist for daily caregiver activities—covering morning grooming, prescribed therapeutic nutrition, ergonomic transfers (bed/toilet/car), and meaningful companionship.
        </p>
      </div>

      {/* Daily Routine Summary Card */}
      <Card className="border-border bg-card/60 shadow-xs">
        <CardContent className="p-4 sm:p-5 space-y-3">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0 mt-0.5">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-foreground">Structured Daily Rhythms</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Consistency is key in geriatric care. A predictable daily schedule prevents confusion, ensures timely drug administration, minimizes infection risks, and nurtures mutual warmth between caregiver and care recipient.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accordion Lessons */}
      <Accordion type="single" collapsible className="w-full space-y-4" defaultValue="item-1">
        {/* Lesson 1: Bathing, Grooming & Nail/Dental Care */}
        <AccordionItem value="item-1" className="border border-border/80 rounded-2xl overflow-hidden bg-card shadow-xs">
          <AccordionTrigger className="px-5 py-4 text-base font-bold hover:no-underline hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3">
              <Bath className="h-5 w-5 text-primary" />
              <span>Lesson 1: Morning Grooming, Hair Washing & Nail/Oral Hygiene</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5 pt-2">
            <SectionCard
              sectionId={1}
              title="1.1 The Daily Morning Hygiene Protocol"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(1)}
            >
              <div className="space-y-3 text-xs leading-relaxed text-muted-foreground">
                <p>
                  Every morning, the caregiver should systematically support personal grooming while encouraging the elderly individual to participate as much as their physical capability allows:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded-xl border border-border bg-background space-y-1">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Bathing & Shower Assistance
                    </span>
                    <p className="text-[11px]">
                      Test water warmth on your inner wrist. Use a stable shower chair or perform a gentle bed sponge bath with mild soap. Dry thoroughly between skin folds to prevent fungal intertrigo.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border border-border bg-background space-y-1">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Hair & Scalp Grooming
                    </span>
                    <p className="text-[11px]">
                      Regular shampooing with tear-free formula. Comb hair gently with a wide-toothed comb to stimulate scalp circulation and boost personal dignity.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border border-border bg-background space-y-1">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Fingernail & Toenail Care
                    </span>
                    <p className="text-[11px]">
                      Trim nails straight across after bathing when softened. Avoid cutting too close to the skin, especially in diabetic patients, to prevent paronychia and non-healing ulcers.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border border-border bg-background space-y-1">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Denture & Oral Hygiene
                    </span>
                    <p className="text-[11px]">
                      Clean dentures over a water-filled sink lined with a towel to prevent breakage if dropped. Grasp firmly with gauze squares, wash with lukewarm water only, and remove at night to allow gums to rest.
                    </p>
                  </div>
                </div>

                {/* Shaving & Facial Grooming Sub-protocol */}
                <div className="pt-3 mt-3 border-t border-border/60 space-y-2">
                  <h4 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Facial Shaving Protocol: Boosting Self-Esteem with Skin Safety
                  </h4>
                  <p>
                    Shaving maintains personal dignity and psychological well-being. Because geriatric skin is thin, fragile, and easily torn (senile purpura), follow these safety steps:
                  </p>
                  <ul className="list-disc space-y-1.5 pl-5">
                    <li>
                      <strong>Pre-Shave Dermatological Check:</strong> Inspect the face and neck for bulging warts, rashes, pigmented spots, open sores, or pimples before starting.
                    </li>
                    <li>
                      <strong>Timing & Skin Softening:</strong> Shave immediately after bathing or shampooing when facial hair is hydrated. Apply a warm, damp washcloth over the face for 1–2 minutes, followed by shaving gel/foam to soften stubble and prevent skin scraping.
                    </li>
                    <li>
                      <strong>Razor Biomechanics:</strong> Pull the skin gently taut with your free hand. Hold the manual razor at a <strong>45-degree angle</strong> and shave strictly <strong>in the direction of hair growth</strong> to eliminate painful pulling and micro-cuts.
                    </li>
                  </ul>

                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-950 dark:text-rose-200 mt-2 space-y-1">
                    <span className="font-bold text-xs flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      Critical Bleeding Safety Precaution: Electric Razors
                    </span>
                    <p className="text-[11px] leading-relaxed">
                      <strong>Never use manual razor blades</strong> on patients receiving anticoagulant / antiplatelet therapy (Aspirin, Clopidogrel, Warfarin, Apixaban), or patients with confusion, cognitive agitation, or severe tremors. <strong>Always use an electric rotary/foil razor</strong> to completely eliminate the risk of uncontrollable hemorrhage and skin lacerations.
                    </p>
                  </div>
                </div>
              </div>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>

        {/* Lesson 2: Doctor-Advised Nutrition & On-Time Medications */}
        <AccordionItem value="item-2" className="border border-border/80 rounded-2xl overflow-hidden bg-card shadow-xs">
          <AccordionTrigger className="px-5 py-4 text-base font-bold hover:no-underline hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3">
              <Utensils className="h-5 w-5 text-emerald-600" />
              <span>Lesson 2: Prescribed Therapeutic Nutrition & Timely Medications</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5 pt-2">
            <SectionCard
              sectionId={2}
              title="2.1 Meal Preparation & Precision Drug Administration"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(2)}
            >
              <div className="space-y-3 text-xs leading-relaxed text-muted-foreground">
                <p>
                  Nutrition and pharmacology work in synergy. The caregiver is the frontline guardian of the patient&apos;s diet and medication safety:
                </p>

                <h4 className="font-bold text-foreground text-sm pt-2">Doctor-Prescribed Diet Guidelines:</h4>
                <ul className="list-disc space-y-1.5 pl-5">
                  <li>
                    <strong>Hypertension / Heart Failure:</strong> Low-sodium meals (&lt;2g salt/day); avoid processed pickles, papads, and canned soups.
                  </li>
                  <li>
                    <strong>Diabetes Mellitus:</strong> Complex carbohydrates, high fiber (dal, oats, green vegetables), and strict avoidance of refined sugars.
                  </li>
                  <li>
                    <strong>Sarcopenia / Frailty:</strong> Adequate high-quality protein (paneer, eggs, lentils, soft chicken/fish) to rebuild muscle mass.
                  </li>
                  <li>
                    <strong>Hydration:</strong> Maintain 1.5 to 2 liters of fluid daily (unless fluid-restricted by a cardiologist for kidney/heart failure).
                  </li>
                </ul>

                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-foreground font-medium mt-2 space-y-1">
                  <span className="font-bold text-xs flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                    <Pill className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    Medication Synchronization Protocol
                  </span>
                  <p className="text-[11px]">
                    Administer medicines exactly as prescribed. Separate thyroid pills (empty stomach morning) from calcium/antacids (which block absorption). Never crush extended-release (ER/SR) tablets.
                  </p>
                </div>
              </div>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>

        {/* Lesson 3: Environmental Hygiene & Safe Transfers (Bed, Chair, Toilet, Car) */}
        <AccordionItem value="item-3" className="border border-border/80 rounded-2xl overflow-hidden bg-card shadow-xs">
          <AccordionTrigger className="px-5 py-4 text-base font-bold hover:no-underline hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3">
              <Accessibility className="h-5 w-5 text-blue-500" />
              <span>Lesson 3: Safe Environmental Sanitation & Ergonomic Transfers</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5 pt-2">
            <SectionCard
              sectionId={3}
              title="3.1 Clean Living Spaces & Fall-Proof Mobility Techniques"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(3)}
            >
              <div className="space-y-3 text-xs leading-relaxed text-muted-foreground">
                <p>
                  A clean, organized home prevents infections and catastrophic falls:
                </p>

                <h4 className="font-bold text-foreground text-sm pt-2">Environmental Sanitation:</h4>
                <ul className="list-disc space-y-1.5 pl-5">
                  <li>
                    <strong>Daily Bed Making & Linen Changes:</strong> Keep sheets taut and wrinkle-free to avoid pressure friction and shear injuries.
                  </li>
                  <li>
                    <strong>Sanitizing High-Touch Zones:</strong> Clean bathroom commodes, grab bars, kitchen counters, and bedside tables daily to prevent gastroenteritis and respiratory infections.
                  </li>
                </ul>

                <h4 className="font-bold text-foreground text-sm pt-2">Ergonomic Transfer Mechanics:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <div className="p-3 rounded-xl border border-border bg-background space-y-1">
                    <span className="font-bold text-foreground">Bed to Chair</span>
                    <p className="text-[11px]">Have patient sit upright for 1 minute first (prevent orthostatic dizziness), pivot on stronger leg, bend your knees (not your back).</p>
                  </div>
                  <div className="p-3 rounded-xl border border-border bg-background space-y-1">
                    <span className="font-bold text-foreground">Toilet Transfers</span>
                    <p className="text-[11px]">Ensure toilet seat riser and sturdy grab bars are within reach. Assist with gentle perineal cleaning to prevent UTIs.</p>
                  </div>
                  <div className="p-3 rounded-xl border border-border bg-background space-y-1">
                    <span className="font-bold text-foreground">Vehicle Ingress/Egress</span>
                    <p className="text-[11px]">Park close to curb, back the patient onto seat bottom-first, then swivel both legs into the vehicle together.</p>
                  </div>
                </div>
              </div>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>

        {/* Lesson 4: Health Monitoring & Compassionate Companionship */}
        <AccordionItem value="item-4" className="border border-border/80 rounded-2xl overflow-hidden bg-card shadow-xs">
          <AccordionTrigger className="px-5 py-4 text-base font-bold hover:no-underline hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3">
              <HeartHandshake className="h-5 w-5 text-rose-500" />
              <span>Lesson 4: Health Monitoring & The Power of Mutual Companionship</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5 pt-2">
            <SectionCard
              sectionId={4}
              title="4.1 Vigilant Health Tracking & The Therapeutic Bond"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(4)}
            >
              <div className="space-y-3 text-xs leading-relaxed text-muted-foreground">
                <p>
                  The caregiver is the most sensitive early-warning system for detecting subtle health changes before they become life-threatening emergencies:
                </p>

                <h4 className="font-bold text-foreground text-sm pt-2">Red Flags to Immediately Report to Doctors:</h4>
                <ul className="list-disc space-y-1.5 pl-5">
                  <li>Sudden confusion, drowsiness, or delirium (often an early sign of UTI or pneumonia).</li>
                  <li>New onset leg swelling (edema), sudden weight gain (&gt;1.5 kg in 2 days), or shortness of breath.</li>
                  <li>Unexplained falls, loss of appetite, or persistent fever.</li>
                </ul>

                <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-foreground font-medium mt-2 space-y-1">
                  <span className="font-bold text-xs flex items-center gap-1.5 text-primary">
                    <Smile className="w-3.5 h-3.5 text-primary shrink-0" />
                    The Magic of Mutual Companionship
                  </span>
                  <p className="text-[11px] leading-relaxed">
                    Caregiving is not a transactional service—it is a human partnership. Sharing laughter, reminiscing about old family memories, and enjoying quiet moments together releases oxytocin and endorphins in both patient and caregiver, dramatically reducing caregiver fatigue and elevating the care recipient&apos;s spirits.
                  </p>
                </div>
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
          <Link href="/vital-logs">
            <span>Log Daily Vitals</span>
            <Activity className="w-3.5 h-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
