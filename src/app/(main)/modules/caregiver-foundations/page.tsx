'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  ArrowLeft,
  HeartPulse,
  Home,
  Shield,
  Activity,
  Users,
  BrainCircuit,
  Stethoscope,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useProfile } from '@/context/role-context';
import { useEffect, useState } from 'react';
import { SectionCard } from '@/components/cards/section-card';

const MODULE_ID = 'caregiver-foundations';
const SECTIONS = 4;

export default function CaregiverFoundationsPage() {
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
            Foundational Core
          </Badge>
          <Badge variant="secondary" className="text-[10px]">
            4 Key Lessons • 15 Min
          </Badge>
        </div>
        <h1 className="text-3xl font-bold font-headline">
          The Need for Caregivers: Age-Related Changes, Chronic Illness & Home Care
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Understand why older adults experience declining functional independence, explore the chronic multimorbidity matrix, and learn why the home environment is the optimal sanctuary for long-term and end-of-life care.
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
              <h3 className="text-sm font-bold text-foreground">Core Clinical Learning Objective</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Aging entails physiological shifts that increase vulnerability to multi-system illnesses. Caregiving is not a static duty but a dynamic, adaptive partnership that evolves across uncertain timelines.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accordion Lessons */}
      <Accordion type="single" collapsible className="w-full space-y-4" defaultValue="item-1">
        {/* Lesson 1 */}
        <AccordionItem value="item-1" className="border border-border/80 rounded-2xl overflow-hidden bg-card shadow-xs">
          <AccordionTrigger className="px-5 py-4 text-base font-bold hover:no-underline hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-primary" />
              <span>Lesson 1: Age-Related Physiological Changes & Functional Decline</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5 pt-2">
            <SectionCard
              sectionId={1}
              title="1.1 The Loss of Functional Reserve (Homeostenosis)"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(1)}
            >
              <div className="space-y-3 text-xs leading-relaxed text-muted-foreground">
                <p>
                  As humans age, the physiological reserve of every organ system gradually diminishes. This natural process, known in geriatric medicine as <strong>homeostenosis</strong>, means that older individuals have less capacity to bounce back after physical stress, minor infections, or sudden environmental changes.
                </p>

                <h4 className="font-bold text-foreground text-sm pt-2">Why Functional Independence Declines:</h4>
                <ul className="list-disc space-y-1.5 pl-5">
                  <li>
                    <strong>Musculoskeletal Sarcopenia:</strong> Progressive loss of muscle mass and bone density (osteopenia/osteoporosis), leading to gait instability, reduced walking speed, and transfer difficulties.
                  </li>
                  <li>
                    <strong>Sensory Diminution:</strong> Visual impairment (cataracts, macular degeneration, glaucoma) and presbycusis (hearing loss) impair balance, spatial navigation, and communication.
                  </li>
                  <li>
                    <strong>Neurological & Reflex Slowing:</strong> Delayed postural reflexes significantly heighten fall risk and make simple tasks like buttoning shirts or climbing stairs fatiguing.
                  </li>
                  <li>
                    <strong>Cardiovascular & Pulmonary Decline:</strong> Stiffening arteries and decreased lung elasticity reduce stamina for basic activities of daily living (ADLs).
                  </li>
                </ul>

                <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-foreground font-medium mt-2">
                  💡 <strong>Caregiver Takeaway:</strong> Functional dependency is rarely due to &quot;lack of effort&quot; or stubbornness. It is the physiological consequence of altered organ reserve requiring empathetic, calibrated physical support.
                </div>
              </div>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>

        {/* Lesson 2 */}
        <AccordionItem value="item-2" className="border border-border/80 rounded-2xl overflow-hidden bg-card shadow-xs">
          <AccordionTrigger className="px-5 py-4 text-base font-bold hover:no-underline hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3">
              <Stethoscope className="h-5 w-5 text-rose-500" />
              <span>Lesson 2: The Chronic Multimorbidity Matrix</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5 pt-2">
            <SectionCard
              sectionId={2}
              title="2.1 Managing Multiple Chronic Conditions Simultaneously"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(2)}
            >
              <div className="space-y-3 text-xs leading-relaxed text-muted-foreground">
                <p>
                  Older adults rarely suffer from a single isolated illness. Instead, they typically navigate <strong>multimorbidity</strong>—the coexistence of two or more chronic health conditions requiring concurrent management.
                </p>

                <h4 className="font-bold text-foreground text-sm pt-2">Common Chronic Geriatric Illnesses:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <div className="p-3 rounded-xl border border-border bg-background space-y-1">
                    <span className="font-bold text-foreground">Cardiovascular & Metabolic</span>
                    <p className="text-[11px]">Hypertension, Ischaemic Heart Disease, Type 2 Diabetes, Chronic Kidney Disease.</p>
                  </div>
                  <div className="p-3 rounded-xl border border-border bg-background space-y-1">
                    <span className="font-bold text-foreground">Musculoskeletal & Mobility</span>
                    <p className="text-[11px]">Severe Osteoarthritis, Osteoporosis, Post-Fall Frailty, Lumbar Spondylosis.</p>
                  </div>
                  <div className="p-3 rounded-xl border border-border bg-background space-y-1">
                    <span className="font-bold text-foreground">Neurodegenerative & Mental</span>
                    <p className="text-[11px]">Alzheimer&apos;s & Vascular Dementia, Parkinson&apos;s Disease, Late-Life Depression, Post-Stroke Deficits.</p>
                  </div>
                  <div className="p-3 rounded-xl border border-border bg-background space-y-1">
                    <span className="font-bold text-foreground">Respiratory & Nutritional</span>
                    <p className="text-[11px]">COPD, Chronic Asthma, Aspiration Vulnerability, Geriatric Protein-Energy Malnutrition.</p>
                  </div>
                </div>

                <p className="pt-2">
                  Each chronic condition requires continuous medication schedules, diet modifications, and monitoring, increasing the complexity of care and necessitating vigilant caregiver coordination.
                </p>
              </div>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>

        {/* Lesson 3 */}
        <AccordionItem value="item-3" className="border border-border/80 rounded-2xl overflow-hidden bg-card shadow-xs">
          <AccordionTrigger className="px-5 py-4 text-base font-bold hover:no-underline hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3">
              <Home className="h-5 w-5 text-emerald-600" />
              <span>Lesson 3: Why Home is the Best Sanctuary for Long-Term Care</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5 pt-2">
            <SectionCard
              sectionId={3}
              title="3.1 The Therapeutic Power of the Home Environment"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(3)}
            >
              <div className="space-y-3 text-xs leading-relaxed text-muted-foreground">
                <p>
                  Clinical evidence consistently confirms that <strong>home is the most therapeutic and dignified setting</strong> for providing long-term and palliative care.
                </p>

                <h4 className="font-bold text-foreground text-sm pt-2">Advantages of Home-Based Long-Term Care:</h4>
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    <strong>Cognitive Familiarity & Delirium Prevention:</strong> Hospitalization frequently triggers acute disorientation and hospital-acquired delirium in elderly patients. Familiar bedrooms, lighting, clocks, and family voices provide psychological grounding.
                  </li>
                  <li>
                    <strong>Infection Reduction:</strong> Staying at home avoids exposure to multidrug-resistant hospital-acquired infections (nosocomial pathogens).
                  </li>
                  <li>
                    <strong>Preservation of Dignity & Autonomy:</strong> Seniors retain control over their daily routines, diet preferences, prayer rituals, and social interactions.
                  </li>
                  <li>
                    <strong>Dignity at the End of Life:</strong> Most older adults express a strong wish to spend their final days at home surrounded by loved ones rather than in an intensive care unit.
                  </li>
                </ul>
              </div>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>

        {/* Lesson 4 */}
        <AccordionItem value="item-4" className="border border-border/80 rounded-2xl overflow-hidden bg-card shadow-xs">
          <AccordionTrigger className="px-5 py-4 text-base font-bold hover:no-underline hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-amber-500" />
              <span>Lesson 4: The Adaptive Role & Trajectory of Caregiving</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5 pt-2">
            <SectionCard
              sectionId={4}
              title="4.1 Navigating Short, Long & Uncertain Care Timelines"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(4)}
            >
              <div className="space-y-3 text-xs leading-relaxed text-muted-foreground">
                <p>
                  Caregiving is not a fixed job description. The caregiver&apos;s responsibilities must constantly adapt as the care recipient&apos;s health fluctuates.
                </p>

                <h4 className="font-bold text-foreground text-sm pt-2">Understanding Disease Trajectories:</h4>
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    <strong>Short-Term Acute Care:</strong> Post-surgical recovery, fracture healing, or pneumonia rehabilitation, where intense initial care gradually tapers off.
                  </li>
                  <li>
                    <strong>Long-Term Progressive Decline:</strong> Dementia, Parkinson&apos;s, or ALS, where care demand steadily increases over years, requiring progressive external assistance.
                  </li>
                  <li>
                    <strong>Uncertain / Fluctuating Trajectory:</strong> Heart failure or COPD with acute exacerbations and stable remissions, creating unpredictable caregiver stress peaks.
                  </li>
                </ul>

                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-950 dark:text-amber-200 mt-2 space-y-1">
                  <span className="font-bold text-xs flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    Caregiver Longevity & Self-Preservation
                  </span>
                  <p className="text-[11px] leading-relaxed">
                    Because caregiving timelines are often prolonged and uncertain, primary caregivers must regularly evaluate their own strain using the <strong>Zarit Burden Scale</strong> and utilize <strong>Care Circles</strong> to prevent physical collapse and burnout.
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
          <Link href="/stress-calculator">
            <span>Evaluate Your Caregiver Strain</span>
            <HeartPulse className="w-3.5 h-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
