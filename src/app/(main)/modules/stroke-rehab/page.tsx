'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  ArrowLeft,
  Brain,
  Shield,
  Home,
  MessageSquare,
  Activity,
  Utensils,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useProfile } from '@/context/role-context';
import { useEffect, useState } from 'react';
import { SectionCard } from '@/components/cards/section-card';

const MODULE_ID = 'stroke-rehab';
const SECTIONS = 6;

export default function StrokeRehabModulePage() {
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
            Neurological Recovery
          </Badge>
          <Badge variant="secondary" className="text-[10px]">
            6 Lessons • 25 Min
          </Badge>
        </div>
        <h1 className="text-3xl font-bold font-headline">
          Stroke Rehabilitation & Neuro-Care: A Comprehensive Clinical Guide
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Evidence-based strategies for post-stroke recovery—covering motor rehabilitation, hemiplegic safe transfers, dysphagia (swallowing) management, aspiration prevention, and aphasia communication.
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full space-y-4" defaultValue="item-1">
        {/* Chapter 1: Understanding Stroke */}
        <AccordionItem value="item-1" className="border border-border/80 rounded-2xl overflow-hidden bg-card shadow-xs">
          <AccordionTrigger className="px-5 py-4 text-base font-bold hover:no-underline hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3">
              <Brain className="h-5 w-5 text-primary" />
              <span>Lesson 1: Understanding Stroke and Neuroplastic Recovery</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5 pt-2">
            <SectionCard
              sectionId={1}
              title="1.1 What Happens in the Brain Post-Stroke"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(1)}
            >
              <div className="space-y-3 text-xs leading-relaxed text-muted-foreground">
                <p>
                  A stroke occurs when cerebral blood supply is interrupted (ischemic) or a blood vessel ruptures (hemorrhagic). The brain possesses remarkable <strong>neuroplasticity</strong>—the ability to rewire new neural pathways with patient, daily repetitive practice.
                </p>
                <h4 className="font-bold text-foreground text-sm pt-2">Common Post-Stroke Deficits:</h4>
                <ul className="list-disc space-y-1.5 pl-5">
                  <li><strong>Hemiparesis / Hemiplegia:</strong> Weakness or paralysis on the side opposite the brain lesion.</li>
                  <li><strong>Dysphagia:</strong> Paralysis of cranial nerves controlling the pharynx, causing severe swallowing impairment.</li>
                  <li><strong>Aphasia & Dysarthria:</strong> Language impairment (Broca&apos;s/Wernicke&apos;s) or slurred motor articulation.</li>
                  <li><strong>Post-Stroke Emotional Lability:</strong> Sudden crying or laughing, anxiety, and depression.</li>
                </ul>
              </div>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>

        {/* Chapter 2: Post-Stroke Dysphagia & Safe Feeding (NEW CORE LESSON) */}
        <AccordionItem value="item-2" className="border border-border/80 rounded-2xl overflow-hidden bg-card shadow-xs">
          <AccordionTrigger className="px-5 py-4 text-base font-bold hover:no-underline hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3">
              <Utensils className="h-5 w-5 text-rose-600" />
              <span>Lesson 2: Dysphagia Management & The Unaffected-Side Safe Feeding Protocol</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5 pt-2">
            <SectionCard
              sectionId={2}
              title="2.1 Recognizing Swallowing Dysfunction & Preventing Aspiration Pneumonia"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(2)}
            >
              <div className="space-y-3 text-xs leading-relaxed text-muted-foreground">
                <p>
                  In post-stroke and hemiplegic patients, pharyngeal muscle weakness frequently leads to <strong>aspiration</strong>—where food or liquid silently enters the trachea and lungs, causing fatal chemical pneumonitis and bacterial lung abscesses.
                </p>

                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-950 dark:text-amber-200 space-y-1">
                  <span className="font-bold text-xs flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    Warning Signs of Post-Stroke Dysphagia
                  </span>
                  <ul className="list-disc space-y-1 pl-5 text-[11px]">
                    <li>Sudden recurrent coughing, throat clearing, or choking during eating or drinking.</li>
                    <li>Food or saliva dribbling out from one corner of the mouth (lip seal weakness).</li>
                    <li>Food pooling/pocketing in the paralyzed cheek for long periods without swallowing.</li>
                    <li>Nasal regurgitation (fluids escaping through the nostrils during swallowing).</li>
                    <li>A &quot;wet&quot; or gurgly voice immediately after taking sips of water.</li>
                  </ul>
                </div>

                <h4 className="font-bold text-foreground text-sm pt-2">The Clinical Safe Feeding Protocol:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded-xl border border-border bg-background space-y-1">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Feed Strictly on Unaffected Side
                    </span>
                    <p className="text-[11px]">
                      Always introduce food and liquids into the <strong>unaffected (strong) side of the mouth</strong>. This allows intact lingual muscles to control the bolus and direct it safely down the esophagus.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border border-border bg-background space-y-1">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Small Boluses & Pureed/Thick Diet
                    </span>
                    <p className="text-[11px]">
                      Offer small, half-teaspoon boluses. Provide pureed, homogeneous soft textures or commercial food thickeners (nectar/honey consistency). Thin liquids like plain water are the most dangerous for aspiration!
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border border-border bg-background space-y-1">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Strict Upright 90° Seating
                    </span>
                    <p className="text-[11px]">
                      Seat the person upright at <strong>90 degrees in a dining chair</strong> (or fully elevated in bed with pillow support behind the head and shoulders). Never feed a reclined patient!
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border border-border bg-background space-y-1">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Post-Meal 30-Minute Upright Rest
                    </span>
                    <p className="text-[11px]">
                      Maintain an upright posture for at least 30 minutes after completing the meal. Inspect the paralyzed cheek with a penlight and clear any retained food pockets.
                    </p>
                  </div>
                </div>
              </div>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>

        {/* Chapter 3: Physical Recovery & ADL Assistance */}
        <AccordionItem value="item-3" className="border border-border/80 rounded-2xl overflow-hidden bg-card shadow-xs">
          <AccordionTrigger className="px-5 py-4 text-base font-bold hover:no-underline hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-primary" />
              <span>Lesson 3: Supporting Physical Recovery & Adaptive Dressing</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5 pt-2">
            <SectionCard
              sectionId={3}
              title="3.1 Mobility Exercises, Safe Transfers & Dressing Rules"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(3)}
            >
              <div className="space-y-3 text-xs leading-relaxed text-muted-foreground">
                <p>
                  Physical rehabilitation focuses on relearning movement patterns and preventing subluxation of the hemiplegic shoulder:
                </p>
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    <strong>Hemiplegic Dressing Rule:</strong> When dressing, put the sleeve on the <em>affected (weak) arm first</em>. When undressing, remove the sleeve from the <em>unaffected (strong) arm first</em>.
                  </li>
                  <li>
                    <strong>Shoulder Subluxation Protection:</strong> Never pull the patient up by their paralyzed arm or armpit. Always support under the scapula and use a transfer gait belt around the waist.
                  </li>
                  <li>
                    <strong>Passive Range of Motion:</strong> Support the elbow and wrist while gently elevating the arm through pain-free arcs twice daily.
                  </li>
                </ul>
              </div>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>

        {/* Chapter 4: Communication & Aphasia */}
        <AccordionItem value="item-4" className="border border-border/80 rounded-2xl overflow-hidden bg-card shadow-xs">
          <AccordionTrigger className="px-5 py-4 text-base font-bold hover:no-underline hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-blue-500" />
              <span>Lesson 4: Managing Communication Deficits (Aphasia)</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5 pt-2">
            <SectionCard
              sectionId={4}
              title="4.1 Strategies for Meaningful Speech Rehabilitation"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(4)}
            >
              <div className="space-y-3 text-xs leading-relaxed text-muted-foreground">
                <ul className="list-disc space-y-1.5 pl-5">
                  <li><strong>Maintain Eye Contact:</strong> Face the patient directly in a quiet room without TV or background noise.</li>
                  <li><strong>Short, Direct Sentences:</strong> Ask one simple question at a time (e.g. &quot;Do you want water?&quot; instead of &quot;Would you like tea, water, or juice?&quot;).</li>
                  <li><strong>Communication Boards:</strong> Use picture cards pointing to common needs (toilet, pain, drink, sleep).</li>
                </ul>
              </div>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>

        {/* Chapter 5: Home Safety Adaptation */}
        <AccordionItem value="item-5" className="border border-border/80 rounded-2xl overflow-hidden bg-card shadow-xs">
          <AccordionTrigger className="px-5 py-4 text-base font-bold hover:no-underline hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3">
              <Home className="h-5 w-5 text-emerald-600" />
              <span>Lesson 5: Adapting the Home Environment for Hemiplegia</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5 pt-2">
            <SectionCard
              sectionId={5}
              title="5.1 Fall-Proofing and Assistive Hardware"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(5)}
            >
              <div className="space-y-3 text-xs leading-relaxed text-muted-foreground">
                <ul className="list-disc space-y-1.5 pl-5">
                  <li>Install grab bars on the unaffected side of the toilet and shower.</li>
                  <li>Clear all floor rugs, electrical wires, and door thresholds.</li>
                  <li>Ensure the wheelchair footrests are swung away during all standing transfers.</li>
                </ul>
              </div>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>

        {/* Chapter 6: Preventing Secondary Strokes (FAST) */}
        <AccordionItem value="item-6" className="border border-border/80 rounded-2xl overflow-hidden bg-card shadow-xs">
          <AccordionTrigger className="px-5 py-4 text-base font-bold hover:no-underline hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-amber-500" />
              <span>Lesson 6: Secondary Stroke Prevention & The F.A.S.T. Protocol</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5 pt-2">
            <SectionCard
              sectionId={6}
              title="6.1 Emergency Recognition and Risk Management"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(6)}
            >
              <div className="space-y-3 text-xs leading-relaxed text-muted-foreground">
                <p>
                  Secondary stroke prevention requires strict control of hypertension, antiplatelet adherence (Aspirin/Clopidogrel), and statin therapy:
                </p>
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-950 dark:text-rose-200 mt-1">
                  <strong>F.A.S.T. Emergency Signs:</strong><br />
                  <strong>F (Face Drooping):</strong> One side of face droops when smiling.<br />
                  <strong>A (Arm Weakness):</strong> One arm drifts downward when raised.<br />
                  <strong>S (Speech Difficulty):</strong> Slurred or strange speech.<br />
                  <strong>T (Time to Call 112):</strong> Call emergency hospital immediately.
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
          <Link href="/modules/elderly-garments-adaptive-dressing">
            <span>Next: Adaptive Garment Care</span>
            <Brain className="w-3.5 h-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
