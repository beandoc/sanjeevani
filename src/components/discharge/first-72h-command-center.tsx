'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  PhoneCall,
  UserCheck,
  Shield,
  Activity,
  Pill,
  RotateCw,
  Eye
} from 'lucide-react';
import {
  MilestoneTask,
  getDefaultFirst72HoursProtocol,
  MilestonePhase
} from '@/lib/clinical/discharge-home-os';

interface Props {
  patientName?: string;
  caregiverName?: string;
}

export function First72HoursCommandCenter({
  patientName = 'Smt. Savitri Sharma',
  caregiverName = 'Ramesh Kumar (Spouse) / Pankaj Sharma (Son)'
}: Props) {
  const [tasks, setTasks] = useState<MilestoneTask[]>(() =>
    getDefaultFirst72HoursProtocol(patientName, caregiverName)
  );

  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const progressPct = Math.round((completedCount / tasks.length) * 100);

  const toggleTaskStatus = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const nextStatus = t.status === 'completed' ? 'pending' : 'completed';
        return {
          ...t,
          status: nextStatus,
          completedAt: nextStatus === 'completed' ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined
        };
      })
    );
  };

  const getRoleBadge = (role: MilestoneTask['accountableRole']) => {
    switch (role) {
      case 'ward_nurse':
        return <Badge className="bg-sky-600 text-white text-[10px]">Ward Nurse</Badge>;
      case 'treating_doctor':
        return <Badge className="bg-indigo-600 text-white text-[10px]">Treating Doctor</Badge>;
      case 'home_nurse':
        return <Badge className="bg-purple-600 text-white text-[10px]">Home Nurse</Badge>;
      case 'home_attendant':
        return <Badge className="bg-emerald-600 text-white text-[10px]">Attendant / GDA</Badge>;
      case 'family_lead':
      default:
        return <Badge className="bg-amber-600 text-white text-[10px]">Family Lead</Badge>;
    }
  };

  const renderPhaseSection = (
    phase: MilestonePhase,
    phaseTitle: string,
    phaseSubtitle: string,
    badgeText: string
  ) => {
    const phaseTasks = tasks.filter((t) => t.phase === phase);

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-1 border-b border-border/50">
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-foreground flex items-center gap-2">
              <span>{phaseTitle}</span>
              <Badge variant="outline" className="text-[10px] font-semibold">
                {badgeText}
              </Badge>
            </h3>
            <p className="text-xs text-muted-foreground">{phaseSubtitle}</p>
          </div>
          <span className="text-xs font-mono text-muted-foreground">
            {phaseTasks.filter((t) => t.status === 'completed').length}/{phaseTasks.length} Done
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {phaseTasks.map((task) => {
            const isDone = task.status === 'completed';
            return (
              <div
                key={task.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  isDone
                    ? 'bg-emerald-500/5 border-emerald-500/30'
                    : 'bg-card border-border/70 hover:border-primary/40'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-xs font-bold ${
                          isDone ? 'line-through text-muted-foreground' : 'text-foreground'
                        }`}
                      >
                        {task.title}
                      </span>
                      {task.isCritical && (
                        <Badge variant="outline" className="text-[9px] border-destructive/40 text-destructive font-bold uppercase">
                          Safety Critical
                        </Badge>
                      )}
                      <span className="text-[11px] font-mono text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {task.dueWindowHours}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {task.description}
                    </p>

                    <div className="flex items-center gap-3 pt-1 text-xs">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <UserCheck className="w-3.5 h-3.5 text-primary" />
                        <span className="font-semibold text-foreground">{task.assignedPersonName}</span>
                      </div>
                      {getRoleBadge(task.accountableRole)}
                      {task.completedAt && (
                        <span className="text-[11px] text-emerald-600 font-mono">
                          Completed at {task.completedAt}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={isDone ? 'outline' : 'default'}
                      className={`text-xs font-bold gap-1.5 min-w-[110px] ${
                        isDone
                          ? 'border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10'
                          : 'bg-primary text-primary-foreground'
                      }`}
                      onClick={() => toggleTaskStatus(task.id)}
                    >
                      {isDone ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Completed</span>
                        </>
                      ) : (
                        <>
                          <Shield className="w-3.5 h-3.5" />
                          <span>Mark Done</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header & Progress */}
      <div className="bg-muted/40 border rounded-2xl p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-primary/40 text-primary font-bold">
                Operational Command
              </Badge>
              <span className="text-xs text-muted-foreground">• First 72 Hours Protocol</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
              <Clock className="w-6 h-6 text-primary" />
              First 72 Hours: Post-Acute Execution Protocol
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Every high-stakes milestone assigned to a named owner with due windows and active escalation routes.
            </p>
          </div>

          <div className="shrink-0 flex flex-col items-end gap-1">
            <span className="text-xs font-bold text-foreground font-mono">
              {completedCount} of {tasks.length} Completed ({progressPct}%)
            </span>
            <Progress value={progressPct} className="w-36 sm:w-44 h-2.5" />
          </div>
        </div>
      </div>

      {/* 3 Chronological Phases */}
      <div className="space-y-8">
        {renderPhaseSection(
          'phase_0_pre_arrival',
          'Phase 0: Pre-Arrival & Departure Handover',
          'Ward discharge gate clearance and home room preparation before vehicle arrival.',
          'Day 0 Departure'
        )}

        {renderPhaseSection(
          'phase_1_first_24h',
          'Phase 1: First 24 Hours (Acute Stabilization)',
          'First home medication dose, baseline sensorium, initial turning cycle, and night 1 safety.',
          'Hours 0 – 24'
        )}

        {renderPhaseSection(
          'phase_2_48_to_72h',
          'Phase 2: 48 to 72 Hours (Routine & Confidence Review)',
          'Doctor tele-transition follow-up, caregiver sleep pulse check, and sacral skin inspection.',
          'Hours 48 – 72'
        )}
      </div>
    </div>
  );
}
