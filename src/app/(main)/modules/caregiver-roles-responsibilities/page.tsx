'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  ArrowLeft,
  HeartHandshake,
  Home,
  Shield,
  Activity,
  Users,
  Brain,
  Stethoscope,
  Sparkles,
  Music,
  BookOpen,
  MapPin,
  Pill,
  Smile,
  Heart,
  Eye,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useProfile } from '@/context/role-context';
import { useEffect, useState } from 'react';
import { SectionCard } from '@/components/cards/section-card';

const MODULE_ID = 'caregiver-roles-responsibilities';
const SECTIONS = 4;

export default function CaregiverRolesPage() {
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
            Caregiver Mastery
          </Badge>
          <Badge variant="secondary" className="text-[10px]">
            4 Practical Lessons • 20 Min
          </Badge>
        </div>
        <h1 className="text-3xl font-bold font-headline">
          The Essential Role of Caregivers: Daily Care, Resource Management & Psychological Support
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Master the four pillars of primary caregiving: personal ADL assistance, home environmental adaptation, social and recreational stimulation, and empathetic mental health counseling for aging loved ones.
        </p>
      </div>

      {/* Overview Card */}
      <Card className="border-border bg-card/60 shadow-xs">
        <CardContent className="p-4 sm:p-5 space-y-3">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-foreground">Definition of the Primary Caregiver</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                A primary caregiver is anyone who assumes central responsibility for meeting the daily physical, psychological, and medical needs of a sick or older individual—functioning as their primary advocate, care coordinator, and emotional anchor.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accordion Lessons */}
      <Accordion type="single" collapsible className="w-full space-y-4" defaultValue="item-1">
        {/* Lesson 1: Direct Personal Care */}
        <AccordionItem value="item-1" className="border border-border/80 rounded-2xl overflow-hidden bg-card shadow-xs">
          <AccordionTrigger className="px-5 py-4 text-base font-bold hover:no-underline hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3">
              <HeartHandshake className="h-5 w-5 text-primary" />
              <span>Lesson 1: Personal Care & ADL Assistance with Dignity</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5 pt-2">
            <SectionCard
              sectionId={1}
              title="1.1 Core Activities of Daily Living (ADLs)"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(1)}
            >
              <div className="space-y-3 text-xs leading-relaxed text-muted-foreground">
                <p>
                  Meeting fundamental physiological needs is the first cornerstone of caregiving. When older adults experience motor weakness or cognitive decline, caregivers step in to assist with:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded-xl border border-border bg-background space-y-1">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Hygiene & Bathing
                    </span>
                    <p className="text-[11px]">
                      Providing sponge baths or assisting with shower chairs, ensuring warm water temperature, skin inspection for rashes, and gentle drying of skin folds.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border border-border bg-background space-y-1">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Oral Health & Brushing
                    </span>
                    <p className="text-[11px]">
                      Daily brushing with soft-bristle brushes, tongue cleaning, and denture hygiene to prevent aspiration pneumonia and oral candidiasis.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border border-border bg-background space-y-1">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Assisted Feeding & Nutrition
                    </span>
                    <p className="text-[11px]">
                      Ensuring upright 90-degree sitting posture during meals, small bite sizes, adequate hydration, and managing dysphagia (swallowing difficulties).
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border border-border bg-background space-y-1">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Toileting & Elimination
                    </span>
                    <p className="text-[11px]">
                      Scheduled bathroom trips, bedside commode assistance, perineal cleaning, and prompt adult diaper changes to protect skin integrity.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-foreground font-medium mt-2">
                  🛡️ <strong>Preserving Dignity:</strong> Always explain each care step before touching the person (&quot;I am going to help you wash your hands now, Maa&quot;) and ensure physical privacy by closing doors and covering unwashed areas.
                </div>
              </div>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>

        {/* Lesson 2: Resource Stewardship & Home Modification */}
        <AccordionItem value="item-2" className="border border-border/80 rounded-2xl overflow-hidden bg-card shadow-xs">
          <AccordionTrigger className="px-5 py-4 text-base font-bold hover:no-underline hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3">
              <Home className="h-5 w-5 text-emerald-600" />
              <span>Lesson 2: Resource Management, Home Setup & Clinical Liaison</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5 pt-2">
            <SectionCard
              sectionId={2}
              title="2.1 Optimizing the Home Setup & Healthcare Coordination"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(2)}
            >
              <div className="space-y-3 text-xs leading-relaxed text-muted-foreground">
                <p>
                  A primary caregiver must act as an efficient household manager and clinical advocate within available family capacities:
                </p>

                <h4 className="font-bold text-foreground text-sm pt-2">Key Operational Responsibilities:</h4>
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    <strong>Adapting the Home Environment:</strong> Installing grab bars in bathrooms, placing anti-skid rubber mats, removing loose rugs, ensuring bright night-lights along the pathway to the toilet, and adjusting bed height to prevent falls.
                  </li>
                  <li>
                    <strong>Financial Resource Stewardship:</strong> Budgeting for regular medicines, adult diapers, medical disposables, and nutritional supplements while exploring government schemes (PMJAY / ECHS / Senior Citizen Concessions).
                  </li>
                  <li>
                    <strong>Symptom Monitoring:</strong> Tracking blood pressure, pulse, blood sugar, weight, temperature, and bowel movements regularly to identify early clinical decompensation.
                  </li>
                  <li>
                    <strong>Clinical Coordination:</strong> Serving as the main contact point for doctors, nurses, and physiotherapists—bringing an organized medication list and vital logs to every outpatient clinic visit.
                  </li>
                </ul>
              </div>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>

        {/* Lesson 3: Medication Timing, Recreation & Social Life */}
        <AccordionItem value="item-3" className="border border-border/80 rounded-2xl overflow-hidden bg-card shadow-xs">
          <AccordionTrigger className="px-5 py-4 text-base font-bold hover:no-underline hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3">
              <Music className="h-5 w-5 text-amber-500" />
              <span>Lesson 3: Medication Discipline, Recreation & Social Connection</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5 pt-2">
            <SectionCard
              sectionId={3}
              title="3.1 Fostering Mental Stimulation & Meaningful Social Engagement"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(3)}
            >
              <div className="space-y-3 text-xs leading-relaxed text-muted-foreground">
                <p>
                  Caregiving goes far beyond physical nursing. Stimulating the mind and nurturing social bonds prevents severe cognitive decline and late-life depression:
                </p>

                <h4 className="font-bold text-foreground text-sm pt-2">Daily Strategies for Social & Mental Vitality:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <div className="p-3 rounded-xl border border-border bg-background space-y-1">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                      Listening & Reading
                    </span>
                    <p className="text-[11px]">
                      Engage in active listening. Read newspapers, sacred texts, or novels aloud, and play soothing devotional or classical music.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border border-border bg-background space-y-1">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      Outdoor Outings
                    </span>
                    <p className="text-[11px]">
                      If ambulatory or wheelchair-accessible, arrange visits to local parks, community gardens, or religious places (temples, gurudwaras, mosques).
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border border-border bg-background space-y-1">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-rose-500" />
                      Family & Digital Ties
                    </span>
                    <p className="text-[11px]">
                      Encourage frequent visits from grandchildren, friends, and relatives. Facilitate video calls with distant family members.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-foreground font-medium mt-2">
                  💊 <strong>Medication Synchronization:</strong> Always pair medication schedules with daily anchor routines (e.g. immediately after morning breakfast or bedtime milk) to maintain 100% adherence.
                </div>
              </div>
            </SectionCard>
          </AccordionContent>
        </AccordionItem>

        {/* Lesson 4: Psychological Support & Managing Fear of Death */}
        <AccordionItem value="item-4" className="border border-border/80 rounded-2xl overflow-hidden bg-card shadow-xs">
          <AccordionTrigger className="px-5 py-4 text-base font-bold hover:no-underline hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3">
              <Heart className="h-5 w-5 text-rose-600" />
              <span>Lesson 4: Emotional Counseling, Mood Support & Dignity</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5 pt-2">
            <SectionCard
              sectionId={4}
              title="4.1 Navigating Depression, Frustration & the Fear of Death"
              onComplete={handleSectionComplete}
              isCompleted={completedSections.has(4)}
            >
              <div className="space-y-3 text-xs leading-relaxed text-muted-foreground">
                <p>
                  Aging and loss of health often trigger intense emotional turbulence in older adults, including loss of control, frustration, mood swings, anxiety, and existential dread.
                </p>

                <h4 className="font-bold text-foreground text-sm pt-2">Empathetic Caregiver Approaches:</h4>
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    <strong>Understanding Mood & Anger:</strong> When an elderly person expresses irritability, recognize that it is often masked depression, fear of helplessness, or physical pain rather than personal animosity.
                  </li>
                  <li>
                    <strong>Addressing the Fear of Death (Thanatophobia):</strong> Many seniors harbor deep anxiety about suffering, dying alone, or becoming a burden to their children. Provide gentle reassurance, listen without judgment, and emphasize that they will always be cared for with love.
                  </li>
                  <li>
                    <strong>Pain Management & Quality of Life:</strong> Pain should never be dismissed as &quot;normal for old age&quot;. Collaborate closely with doctors to achieve optimal pain relief, enabling restful sleep and peaceful wakefulness.
                  </li>
                </ul>

                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-950 dark:text-rose-200 mt-2 space-y-1">
                  <span className="font-bold text-xs flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    The Golden Rule of Geriatric Care
                  </span>
                  <p className="text-[11px] leading-relaxed">
                    Treat older persons with the same patience, dignity, and unconditional respect that you would wish to receive in your own vulnerable twilight years.
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
          <Link href="/care-circle">
            <span>Coordinate in Care Circle</span>
            <Users className="w-3.5 h-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
