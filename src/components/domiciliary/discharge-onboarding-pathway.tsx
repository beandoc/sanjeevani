'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Compass,
  CheckCircle2,
  Calendar,
  Sparkles,
  ShieldCheck,
  HeartHandshake,
  Activity,
  ArrowRight,
  BookOpen,
  RotateCcw
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { HealthRepository } from '@/lib/db/health-repository';
import { syncDischargeMilestones } from '@/lib/firebase/clinical-sync';

export interface PathwayPhase {
  phaseId: number;
  daysRange: string;
  title: string;
  subtitle: string;
  milestones: {
    id: string;
    label: string;
    description: string;
    moduleLink?: string;
  }[];
}

export const DISCHARGE_PHASES: PathwayPhase[] = [
  {
    phaseId: 1,
    daysRange: 'Days 1 – 3',
    title: 'Phase 1: Home Sanctuary & Fall-Proofing Setup',
    subtitle: 'Adapting physical environment, lighting, and medication dispensing.',
    milestones: [
      {
        id: 'p1_rugs',
        label: 'Clear Throw Rugs & Install Bathroom Grab Bars',
        description: 'Remove loose carpets and test shower chair stability with non-slip floor mat.',
        moduleLink: '/modules/fall-prevention'
      },
      {
        id: 'p1_medbox',
        label: 'Organize Weekly 7-Day Pill Dispenser',
        description: 'Separate morning empty-stomach medications from evening meals with written list.',
        moduleLink: '/modules/medication-management-caregiver'
      },
      {
        id: 'p1_emergency',
        label: 'Post Emergency Contacts Near Bed & Phone',
        description: 'Record consulting doctor, primary hospital emergency, and Tele-MANAS (14416).'
      }
    ]
  },
  {
    phaseId: 2,
    daysRange: 'Days 4 – 7',
    title: 'Phase 2: Transfer Biomechanics & Bedside Nursing',
    subtitle: 'Mastering ergonomic log-rolling, Q2H turning, and adaptive dressing.',
    milestones: [
      {
        id: 'p2_transfer',
        label: 'Practice Safe Bed-to-Chair Transfer with Gait Belt',
        description: 'Wear lumbar support belt; lift with knees bent and avoid twisting spine.',
        moduleLink: '/modules/bed-bound-care'
      },
      {
        id: 'p2_q2h',
        label: 'Establish 2-Hourly Turning Schedule & Heel Floatation',
        description: 'Place wedge pillows for 30° lateral oblique positioning and calf heel hover.',
        moduleLink: '/modules/bed-bound-care'
      },
      {
        id: 'p2_stroke_dress',
        label: 'Master the Hemiplegic Dressing Technique',
        description: 'Dress affected (weak) arm first; undress unaffected (strong) arm first.',
        moduleLink: '/modules/elderly-garments-adaptive-dressing'
      }
    ]
  },
  {
    phaseId: 3,
    daysRange: 'Days 8 – 10',
    title: 'Phase 3: Dysphagia Nutrition & Vital Sign Baselines',
    subtitle: 'Modifying food textures and screening for orthostatic blood pressure drops.',
    milestones: [
      {
        id: 'p3_dysphagia',
        label: 'Implement 90° Upright Feeding & Unaffected-Side Feed',
        description: 'Offer pureed/thickened diets with small 1/2 tsp boluses to prevent aspiration.',
        moduleLink: '/modules/stroke-rehab'
      },
      {
        id: 'p3_vitals',
        label: 'Log Sitting vs. Standing Blood Pressure',
        description: 'Screen for postural hypotension to prevent sudden morning fainting upon waking.',
        moduleLink: '/modules/hypertension-caregiver'
      },
      {
        id: 'p3_oral',
        label: 'Towel-Lined Sink Denture Hygiene Protocol',
        description: 'Clean dentures over cushioned sink; soak in water overnight for mucosal healing.',
        moduleLink: '/modules/oral-health-caregiver'
      }
    ]
  },
  {
    phaseId: 4,
    daysRange: 'Days 11 – 14',
    title: 'Phase 4: Caregiver Respite & Post-Training Reassessment',
    subtitle: 'Measuring longitudinal burden change and mobilizing family care circle.',
    milestones: [
      {
        id: 'p4_respite',
        label: 'Schedule 4-Hour Weekly Respite Block',
        description: 'Hand over bedside routine to secondary family member or paid attendant to rest.',
        moduleLink: '/modules/caregiver-roles-responsibilities'
      },
      {
        id: 'p4_zarit_retake',
        label: 'Take Follow-Up Zarit Burden Assessment',
        description: 'Evaluate your post-training stress score on the Stress Calculator.',
        moduleLink: '/stress-calculator'
      },
      {
        id: 'p4_brief',
        label: 'Generate Clinical Encounter Brief for OPD Follow-up',
        description: 'Print or export PDF summary to share with your consulting geriatrician.',
        moduleLink: '/dashboard'
      }
    ]
  }
];

export function DischargeOnboardingPathway() {
  const [completedMilestones, setCompletedMilestones] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setCompletedMilestones(HealthRepository.getDischargeMilestones());
  }, []);

  const toggleMilestone = (id: string) => {
    setCompletedMilestones((prev) => {
      const updated = { ...prev, [id]: !prev[id] };
      void syncDischargeMilestones(updated);
      return updated;
    });
  };

  const totalMilestones = DISCHARGE_PHASES.reduce((sum, p) => sum + p.milestones.length, 0);
  const completedCount = Object.values(completedMilestones).filter(Boolean).length;
  const progressPct = Math.round((completedCount / totalMilestones) * 100);

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <Card className="border-border/80 bg-primary/5 shadow-xs">
        <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0 mt-0.5">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider text-primary border-primary/30">
                  Discharge-to-Home Pathway
                </Badge>
                <span className="text-xs text-muted-foreground">14-Day Micro-Curriculum</span>
              </div>
              <h3 className="text-lg font-bold text-foreground mt-0.5">
                Transition to Home Domiciliary Roadmap
              </h3>
              <p className="text-xs text-muted-foreground max-w-xl mt-0.5 leading-relaxed">
                Step-by-step clinical milestones designed to transition recovered patients safely from hospital to home while protecting caregiver longevity.
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0 min-w-[160px]">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black font-mono text-primary">{progressPct}%</span>
              <span className="text-xs text-muted-foreground font-semibold">({completedCount}/{totalMilestones})</span>
            </div>
            <Progress value={progressPct} className="w-full h-2" />
          </div>
        </CardContent>
      </Card>

      {/* 4 Phases */}
      <div className="space-y-5">
        {DISCHARGE_PHASES.map((phase) => {
          const phaseCompleted = phase.milestones.filter((m) => completedMilestones[m.id]).length;
          const isPhaseDone = phaseCompleted === phase.milestones.length;

          return (
            <Card
              key={phase.phaseId}
              className={cn(
                'border transition-all rounded-2xl overflow-hidden shadow-xs',
                isPhaseDone ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-border/80 bg-card'
              )}
            >
              <CardHeader className="p-4 sm:p-5 border-b border-border/40 bg-muted/20">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-[10px] font-mono font-bold">
                        {phase.daysRange}
                      </Badge>
                      <span className="text-xs font-bold text-foreground">
                        {phase.title}
                      </span>
                    </div>
                    <CardDescription className="text-xs">
                      {phase.subtitle}
                    </CardDescription>
                  </div>
                  <Badge variant={isPhaseDone ? 'default' : 'secondary'} className="text-xs font-mono self-start sm:self-center">
                    {phaseCompleted} / {phase.milestones.length} Done
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-5 space-y-3">
                {phase.milestones.map((m) => {
                  const isDone = Boolean(completedMilestones[m.id]);

                  return (
                    <div
                      key={m.id}
                      className={cn(
                        'p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3',
                        isDone
                          ? 'border-emerald-500/30 bg-emerald-500/5'
                          : 'border-border/60 bg-background hover:border-primary/40'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => toggleMilestone(m.id)}
                          className={cn(
                            'mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0',
                            isDone
                              ? 'border-emerald-600 bg-emerald-600 text-white'
                              : 'border-muted-foreground/40 hover:border-primary'
                          )}
                          aria-label="Toggle milestone"
                        >
                          {isDone && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </button>
                        <div className="space-y-0.5">
                          <span className={cn('text-xs font-bold text-foreground block', isDone && 'line-through text-muted-foreground')}>
                            {m.label}
                          </span>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            {m.description}
                          </p>
                        </div>
                      </div>

                      {m.moduleLink && (
                        <Link href={m.moduleLink} className="self-end sm:self-center shrink-0">
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px] font-semibold gap-1 text-primary">
                            <span>Learn</span>
                            <ArrowRight className="w-3 h-3" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
