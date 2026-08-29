'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ChevronRight,
  RotateCcw,
  Sun,
  Moon,
  Utensils,
  Pill,
  Bath,
  Shirt,
  HeartPulse,
  Activity,
  Bed,
  HelpCircle,
  BookOpen
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export interface BedsideTask {
  id: string;
  timeSlot: string;
  period: 'morning' | 'afternoon' | 'evening' | 'night' | 'recurring';
  title: string;
  shortInstruction: string;
  detailedClinicalGuide: {
    rationale: string;
    steps: string[];
    criticalSafetyTip: string;
    moduleLink: string;
    moduleTitle: string;
  };
  icon: React.ElementType;
  isQ2H?: boolean;
}

export const BED_SIDE_TASKS: BedsideTask[] = [
  {
    id: 'morning_oral_denture',
    timeSlot: '07:00 AM',
    period: 'morning',
    title: 'Morning Oral & Denture Hygiene',
    shortInstruction: 'Clean dentures over a towel-lined sink with lukewarm water. Clean eye inner-to-outer canthus.',
    icon: Bath,
    detailedClinicalGuide: {
      rationale: 'Prevents dental stomatitis, aspiration pneumonia, and corneal exposure ulcers.',
      steps: [
        'Place a folded washcloth or paper towel at the bottom of the sink and fill with 2 inches of lukewarm water to prevent shattering if dropped.',
        'Firmly grasp the front of dentures using clean gauze or a washcloth.',
        'Use lukewarm water only (never hot water, which warps acrylic resin).',
        'Cleanse eyes from inner canthus (nasal side) to outer canthus using fresh saline gauze for each eye.'
      ],
      criticalSafetyTip: 'Never insert cotton swabs (Q-tips) into the ear canal or use hot water on dentures.',
      moduleLink: '/modules/oral-health-caregiver',
      moduleTitle: 'Oral Health & Denture Protocol'
    }
  },
  {
    id: 'morning_dressing_stroke',
    timeSlot: '08:00 AM',
    period: 'morning',
    title: 'Gentle Sponge/Bath & Hemiplegic Dressing',
    shortInstruction: 'Follow the Hemiplegia rule: Dress WEAK arm first, undress STRONG arm first. No-rub pat drying.',
    icon: Shirt,
    detailedClinicalGuide: {
      rationale: 'Protects fragile geriatric skin from friction tears and eliminates shoulder dislocation risk.',
      steps: [
        'Wash skin with mild pH-neutral soap and warm water; gently pat dry with a cotton towel without vigorous rubbing.',
        'Apply emollient moisturizer within 3 minutes while skin is still slightly damp.',
        'When dressing: slide the shirt sleeve onto the paralyzed/weak arm FIRST.',
        'When undressing: slip the sleeve off the strong arm FIRST.'
      ],
      criticalSafetyTip: 'Mandatory: Use electric shavers for patients on blood thinners (Aspirin/Warfarin) or with cognitive confusion.',
      moduleLink: '/modules/elderly-garments-adaptive-dressing',
      moduleTitle: 'Adaptive Garments & Dressing Guide'
    }
  },
  {
    id: 'morning_medications',
    timeSlot: '09:00 AM',
    period: 'morning',
    title: 'Morning Medication Administration',
    shortInstruction: 'Administer morning doses with proper food relation. Verify Beers Criteria warnings.',
    icon: Pill,
    detailedClinicalGuide: {
      rationale: 'Ensures optimal bioavailability, prevents gastric mucosal injury, and eliminates prescribing cascades.',
      steps: [
        'Administer Pantoprazole / PPI 30 minutes before breakfast on an empty stomach.',
        'Administer antihypertensives (Telmisartan) and diabetic medications (Metformin) after a solid meal.',
        'Keep a written pill log and use a labelled weekly dispenser box.'
      ],
      criticalSafetyTip: 'Never crush sustained-release (SR/ER) or enteric-coated tablets without pharmacist approval.',
      moduleLink: '/modules/medication-management-caregiver',
      moduleTitle: 'Medication Safety Module'
    }
  },
  {
    id: 'q2h_repositioning_1',
    timeSlot: '11:00 AM',
    period: 'morning',
    title: 'Q2H Pressure Sore Repositioning',
    shortInstruction: 'Log-roll patient 30° to the side. Float heels off mattress using calf pillows.',
    icon: Bed,
    isQ2H: true,
    detailedClinicalGuide: {
      rationale: 'Relieves capillary occlusion over sacrum and greater trochanters to prevent Stage 1 bedsores.',
      steps: [
        'Turn patient to 30-degree lateral oblique position with a wedge pillow supporting the back.',
        'Place a soft pillow under the lower calves so heels hover freely in the air.',
        'Never place patient directly on rubber mackintosh—ensure cotton drawsheet barrier.'
      ],
      criticalSafetyTip: 'Never vigorously massage or rub red, non-blanching bony skin spots.',
      moduleLink: '/modules/bed-bound-care',
      moduleTitle: 'Bed-Bound Care Protocol'
    }
  },
  {
    id: 'lunch_dysphagia_feeding',
    timeSlot: '01:00 PM',
    period: 'afternoon',
    title: 'Lunch & Dysphagia Safe Feeding Protocol',
    shortInstruction: 'Strict 90° upright seating. Feed small 1/2 tsp boluses into the unaffected side of mouth.',
    icon: Utensils,
    detailedClinicalGuide: {
      rationale: 'Prevents silent food aspiration into trachea, chemical pneumonitis, and choking episodes.',
      steps: [
        'Position patient at strict 90-degree upright angle (preferably seated out of bed in a sturdy chair).',
        'Introduce small 1/2 teaspoon boluses strictly into the unaffected (strong) side of the mouth.',
        'Use thickened liquids or pureed consistency as prescribed by therapist.',
        'Maintain upright seating for 30 minutes post-meal; check paralyzed cheek for food pocketing.'
      ],
      criticalSafetyTip: 'If patient coughs or clears throat repeatedly, pause immediately and tuck chin downward.',
      moduleLink: '/modules/stroke-rehab',
      moduleTitle: 'Stroke Rehab & Dysphagia Module'
    }
  },
  {
    id: 'afternoon_vitals_rom',
    timeSlot: '04:00 PM',
    period: 'afternoon',
    title: 'Vitals Logging & Passive Range-of-Motion (PROM)',
    shortInstruction: 'Log sitting vs. standing Blood Pressure. Perform gentle 10-minute joint range-of-motion.',
    icon: HeartPulse,
    detailedClinicalGuide: {
      rationale: 'Detects orthostatic hypotension early and prevents painful joint contractures and muscle shortening.',
      steps: [
        'Measure BP after 5 mins of rest, then measure standing to screen for dizziness/falls.',
        'Gently move wrists, elbows, ankles, and knees through comfortable pain-free arcs.',
        'Offer 150ml water to maintain hydration.'
      ],
      criticalSafetyTip: 'Never force a stiff joint past resistance or pull by the hemiplegic shoulder.',
      moduleLink: '/modules/fall-prevention',
      moduleTitle: 'Fall Prevention & Mobility'
    }
  },
  {
    id: 'night_oral_denture_removal',
    timeSlot: '09:00 PM',
    period: 'night',
    title: 'Night Denture Removal & Fall-Proof Ambient Lighting',
    shortInstruction: 'Remove dentures for overnight mucosal rest in a water container. Check nightlights.',
    icon: Moon,
    detailedClinicalGuide: {
      rationale: 'Allows gum tissue to heal, prevents fungal candida overgrowth, and prevents nocturnal falls.',
      steps: [
        'Remove dentures and store submerged in clean water or denture solution.',
        'Ensure path to bathroom is well-lit with warm motion-sensor nightlights.',
        'Ensure urinal / commode is within arm’s reach from bed with bed brakes locked.'
      ],
      criticalSafetyTip: 'Always remove dentures before sleeping to eliminate nighttime airway choking hazards.',
      moduleLink: '/modules/sensory-hygiene-bedmaking',
      moduleTitle: 'Sensory Care & Bed-Making'
    }
  }
];

export function DailyBedsideRoutine() {
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});
  const [activeTaskModal, setActiveTaskModal] = useState<BedsideTask | null>(null);
  const [filterPeriod, setFilterPeriod] = useState<string>('all');
  const [q2hTimerSeconds, setQ2hTimerSeconds] = useState<number>(7200); // 2 hours = 7200s

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sanjeevani_bedside_tasks_today');
      if (saved) {
        try {
          setCompletedTasks(JSON.parse(saved));
        } catch {
          // ignore
        }
      }
    }
  }, []);

  // 2-hour countdown timer ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setQ2hTimerSeconds((prev) => (prev > 0 ? prev - 1 : 7200));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleTask = (id: string) => {
    setCompletedTasks((prev) => {
      const updated = { ...prev, [id]: !prev[id] };
      if (typeof window !== 'undefined') {
        localStorage.setItem('sanjeevani_bedside_tasks_today', JSON.stringify(updated));
      }
      return updated;
    });
  };

  const handleResetDay = () => {
    setCompletedTasks({});
    if (typeof window !== 'undefined') {
      localStorage.removeItem('sanjeevani_bedside_tasks_today');
    }
  };

  const resetQ2hTimer = () => {
    setQ2hTimerSeconds(7200);
  };

  const totalTasks = BED_SIDE_TASKS.length;
  const completedCount = Object.values(completedTasks).filter(Boolean).length;
  const compliancePct = Math.round((completedCount / totalTasks) * 100);

  const formatTimer = (secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const filteredTasks = filterPeriod === 'all'
    ? BED_SIDE_TASKS
    : BED_SIDE_TASKS.filter((t) => t.period === filterPeriod);

  return (
    <div className="space-y-6">
      {/* Top Banner: Real-time Compliance + Q2H Turning Timer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Compliance Card */}
        <Card className="border-border/80 bg-card shadow-sm md:col-span-2">
          <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  Live Domiciliary Bedside Routine
                </span>
                <h3 className="text-lg font-bold text-foreground mt-0.5">
                  Today&apos;s Home Care Protocol Compliance
                </h3>
              </div>
              <Badge variant={compliancePct === 100 ? 'default' : 'secondary'} className="font-mono text-xs">
                {completedCount} / {totalTasks} Completed
              </Badge>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-muted-foreground">Adherence Rate</span>
                <span className="text-primary font-mono">{compliancePct}%</span>
              </div>
              <Progress value={compliancePct} className="h-2.5" />
            </div>

            <div className="flex items-center justify-between pt-1 text-xs">
              <span className="text-muted-foreground">Synchronized with patient biological rhythm</span>
              <Button variant="ghost" size="sm" onClick={handleResetDay} className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground">
                <RotateCcw className="w-3 h-3 mr-1" /> Reset Day
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Q2H Pressure Sore Countdown Timer */}
        <Card className="border-amber-500/30 bg-amber-500/5 shadow-sm">
          <CardContent className="p-5 flex flex-col justify-between h-full space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-300 flex items-center gap-1">
                <Bed className="w-3.5 h-3.5" aria-hidden="true" />
                Q2H Turning Clock
              </span>
              <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-700 dark:text-amber-300">
                2-Hour Cycle
              </Badge>
            </div>

            <div
              className="text-center py-1"
              role="timer"
              aria-live="polite"
              aria-atomic="true"
              aria-label={`Time remaining until next lateral repositioning: ${formatTimer(q2hTimerSeconds)}`}
            >
              <div className="text-3xl font-black font-mono text-amber-950 dark:text-amber-100 tracking-tight">
                {formatTimer(q2hTimerSeconds)}
              </div>
              <span className="text-[11px] text-amber-800/80 dark:text-amber-300/80 font-medium">
                Next Lateral Repositioning
              </span>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={resetQ2hTimer}
              aria-label="Log patient turning event and reset countdown timer to 2 hours"
              className="w-full text-xs font-bold border-amber-500/40 hover:bg-amber-500/10 text-amber-900 dark:text-amber-200"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" aria-hidden="true" /> Log Turn & Reset (2h)
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Task Filters */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
        <div className="flex items-center gap-1.5">
          {['all', 'morning', 'afternoon', 'night'].map((p) => (
            <Button
              key={p}
              size="sm"
              variant={filterPeriod === p ? 'default' : 'outline'}
              onClick={() => setFilterPeriod(p)}
              className="h-8 text-xs font-semibold capitalize"
            >
              {p}
            </Button>
          ))}
        </div>
        <span className="text-[11px] text-muted-foreground hidden sm:inline">
          Tap any card to view step-by-step clinical guidance
        </span>
      </div>

      {/* Timeline Task Cards */}
      <div className="space-y-3">
        {filteredTasks.map((task) => {
          const Icon = task.icon;
          const isDone = Boolean(completedTasks[task.id]);

          return (
            <div
              key={task.id}
              className={cn(
                'p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card',
                isDone
                  ? 'border-emerald-500/40 bg-emerald-500/5'
                  : 'border-border/80 hover:border-primary/40 hover:shadow-xs'
              )}
            >
              <div className="flex items-start gap-3.5">
                <button
                  onClick={() => toggleTask(task.id)}
                  className={cn(
                    'mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors shrink-0',
                    isDone
                      ? 'border-emerald-600 bg-emerald-600 text-white'
                      : 'border-muted-foreground/40 hover:border-primary'
                  )}
                  aria-label="Toggle task completion"
                >
                  {isDone && <CheckCircle2 className="w-4 h-4" />}
                </button>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-primary font-mono flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {task.timeSlot}
                    </span>
                    <span className={cn('text-sm font-bold text-foreground', isDone && 'line-through text-muted-foreground')}>
                      {task.title}
                    </span>
                    {task.isQ2H && (
                      <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-700 dark:text-amber-300">
                        Pressure Ulcer Protocol
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {task.shortInstruction}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTaskModal(task)}
                  className="h-8 text-xs font-semibold gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5 text-primary" />
                  <span>Flash Guide</span>
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Clinical Flash Guide Modal */}
      {activeTaskModal && (
        <Dialog open={Boolean(activeTaskModal)} onOpenChange={(open) => !open && setActiveTaskModal(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-wider mb-1">
                <Sparkles className="w-4 h-4" />
                <span>Bedside Clinical Flash Guide</span>
              </div>
              <DialogTitle className="text-xl font-bold font-headline">
                {activeTaskModal.title}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {activeTaskModal.detailedClinicalGuide.rationale}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-2">
                  Action Steps:
                </h4>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  {activeTaskModal.detailedClinicalGuide.steps.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold font-mono text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs space-y-1">
                <span className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" /> Critical Clinical Precaution:
                </span>
                <p className="text-[11px] leading-relaxed">
                  {activeTaskModal.detailedClinicalGuide.criticalSafetyTip}
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <Link href={activeTaskModal.detailedClinicalGuide.moduleLink}>
                  <Button variant="outline" size="sm" className="text-xs gap-1.5 font-semibold">
                    <span>Full Module: {activeTaskModal.detailedClinicalGuide.moduleTitle}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
                <Button
                  size="sm"
                  onClick={() => {
                    toggleTask(activeTaskModal.id);
                    setActiveTaskModal(null);
                  }}
                  className="text-xs font-bold"
                >
                  Mark Done
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
