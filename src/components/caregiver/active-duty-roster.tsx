'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Moon,
  Sun,
  Sunrise,
  Sunset,
  AlertTriangle,
  UserCheck,
  ShieldCheck,
  Plus
} from 'lucide-react';
import {
  DutyRosterEngine,
  RosterItem,
  CareRole,
  ShiftTimeWindow,
  TaskType
} from '@/lib/clinical/duty-roster-engine';

const INITIAL_ROSTER: RosterItem[] = [
  {
    id: 'r_morning_transfer',
    taskType: 'heavy_transfer_bed_to_chair',
    taskLabel: 'Morning Bed-to-Wheelchair Transfer & Sponge Bath',
    timeWindow: 'morning_07_10',
    assignedRole: 'general_duty_attendant',
    assignedPersonName: 'Sunita (GDA Attendant)',
    backupPersonName: 'Pankaj (Son)',
    status: 'completed',
    isCriticalClinicalTask: true,
    completedAt: '08:30'
  },
  {
    id: 'r_morning_meds',
    taskType: 'oral_medication_prompting',
    taskLabel: 'Morning BP, Antiplatelet & Sugar Medications',
    timeWindow: 'morning_07_10',
    assignedRole: 'family_trained',
    assignedPersonName: 'Ramesh Kumar (Spouse)',
    status: 'completed',
    isCriticalClinicalTask: true,
    completedAt: '08:45'
  },
  {
    id: 'r_midday_feed',
    taskType: 'nasogastric_rt_tube_feed',
    taskLabel: 'Midday Enteral Tube Feed & Hydration Flush',
    timeWindow: 'midday_11_14',
    assignedRole: 'general_duty_attendant',
    assignedPersonName: 'Sunita (GDA Attendant)',
    status: 'accepted_by_member',
    isCriticalClinicalTask: true
  },
  {
    id: 'r_afternoon_physio',
    taskType: 'passive_physiotherapy_exercises',
    taskLabel: 'Passive Hemiplegic Range-of-Motion & Joint Stretch',
    timeWindow: 'afternoon_15_18',
    assignedRole: 'physiotherapist',
    assignedPersonName: 'Dr. Anand (Physio)',
    status: 'accepted_by_member',
    isCriticalClinicalTask: false
  },
  {
    id: 'r_evening_dress',
    taskType: 'deep_wound_dressing',
    taskLabel: 'Stage II Sacral Ulcer Sterile Cleansing & Hydrocolloid Dressing',
    timeWindow: 'evening_19_22',
    assignedRole: 'registered_nurse',
    assignedPersonName: 'Nurse Reena (Visiting RN)',
    status: 'accepted_by_member',
    isCriticalClinicalTask: true
  },
  {
    id: 'r_night_reposition',
    taskType: 'overnight_watch_and_monitoring',
    taskLabel: 'Night 2-Hourly Oblique Turning & Incontinence Check',
    timeWindow: 'night_watch_22_06',
    assignedRole: 'family_trained',
    assignedPersonName: 'Pankaj Sharma (Son)',
    backupPersonName: 'Ramesh Kumar (Spouse)',
    status: 'accepted_by_member',
    isCriticalClinicalTask: true
  }
];

export function ActiveDutyRoster() {
  const [items, setItems] = useState<RosterItem[]>(INITIAL_ROSTER);

  const audit = useMemo(() => {
    return DutyRosterEngine.auditRosterCoverage(items);
  }, [items]);

  const toggleComplete = (id: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const nextStatus = item.status === 'completed' ? 'accepted_by_member' : 'completed';
        return {
          ...item,
          status: nextStatus,
          completedAt: nextStatus === 'completed' ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined
        };
      })
    );
  };

  const getRoleBadge = (role: CareRole) => {
    switch (role) {
      case 'registered_nurse':
        return <Badge className="bg-purple-600 text-white text-[10px]">Registered Nurse</Badge>;
      case 'physiotherapist':
        return <Badge className="bg-teal-600 text-white text-[10px]">Physiotherapist</Badge>;
      case 'general_duty_attendant':
        return <Badge className="bg-blue-600 text-white text-[10px]">Bedside GDA</Badge>;
      case 'family_trained':
        return <Badge className="bg-emerald-600 text-white text-[10px]">Family (Trained)</Badge>;
      case 'family_untrained':
        return <Badge className="bg-amber-600 text-white text-[10px]">Family (Untrained)</Badge>;
      case 'domestic_helper':
        return <Badge className="bg-slate-600 text-white text-[10px]">Domestic Helper</Badge>;
      default:
        return null;
    }
  };

  const getTimeWindowMeta = (window: ShiftTimeWindow) => {
    switch (window) {
      case 'morning_07_10':
        return { label: 'Morning Rush (07:00 – 10:00)', icon: Sunrise, color: 'text-amber-500' };
      case 'midday_11_14':
        return { label: 'Midday Shift (11:00 – 14:00)', icon: Sun, color: 'text-yellow-500' };
      case 'afternoon_15_18':
        return { label: 'Afternoon Care (15:00 – 18:00)', icon: Sun, color: 'text-orange-500' };
      case 'evening_19_22':
        return { label: 'Evening Peak (19:00 – 22:00)', icon: Sunset, color: 'text-rose-500' };
      case 'night_watch_22_06':
        return { label: 'Night Watch (22:00 – 06:00)', icon: Moon, color: 'text-indigo-500' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Coverage Audit Callout */}
      <div className="bg-muted/40 border rounded-2xl p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-primary/40 text-primary font-bold">
                Operational Care Matrix
              </Badge>
              <span className="text-xs text-muted-foreground">• Active Duty Roster</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" />
              Active Home Care Duty Roster
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Every task tied to a time window, accountable owner, role-scope validation, and completion proof.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            {audit.isFullyCovered ? (
              <Badge className="bg-emerald-600 text-white font-bold text-xs py-1 px-3">
                <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                100% COVERAGE VERIFIED
              </Badge>
            ) : (
              <Badge variant="destructive" className="font-bold text-xs py-1 px-3">
                <ShieldAlert className="w-3.5 h-3.5 mr-1" />
                COVERAGE GAPS PRESENT
              </Badge>
            )}
          </div>
        </div>

        {/* Audit Callout */}
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-3 ${
            audit.isFullyCovered
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
              : 'bg-destructive/10 border-destructive/30 text-destructive'
          }`}
        >
          {audit.isFullyCovered ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
          )}
          <span className="font-semibold">{audit.auditSummary}</span>
        </div>
      </div>

      {/* Roster Items */}
      <div className="grid grid-cols-1 gap-3.5">
        {items.map((item) => {
          const windowMeta = getTimeWindowMeta(item.timeWindow);
          const WindowIcon = windowMeta.icon;
          const validation = DutyRosterEngine.validateTaskRoleScope(item.taskType, item.assignedRole);
          const isDone = item.status === 'completed';

          return (
            <div
              key={item.id}
              className={`p-4 rounded-xl border transition-all ${
                !validation.isSafe
                  ? 'border-destructive bg-destructive/5'
                  : isDone
                  ? 'border-emerald-500/30 bg-emerald-500/5'
                  : 'border-border/70 bg-card hover:border-primary/40'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold text-muted-foreground flex items-center gap-1">
                      <WindowIcon className={`w-3.5 h-3.5 ${windowMeta.color}`} />
                      {windowMeta.label}
                    </span>
                    <span className="text-muted-foreground">•</span>
                    <span
                      className={`text-sm font-bold ${
                        isDone ? 'line-through text-muted-foreground' : 'text-foreground'
                      }`}
                    >
                      {item.taskLabel}
                    </span>
                    {item.isCriticalClinicalTask && (
                      <Badge variant="outline" className="text-[9px] border-destructive/40 text-destructive font-bold uppercase">
                        Critical
                      </Badge>
                    )}
                  </div>

                  {/* Scope Validation Alert */}
                  {!validation.isSafe && (
                    <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/30 text-xs text-destructive flex items-start gap-2">
                      <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <strong>Scope Safety Violation:</strong> {validation.violationReason}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 pt-1 flex-wrap text-xs">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <UserCheck className="w-3.5 h-3.5 text-primary" />
                      <span className="font-bold text-foreground">{item.assignedPersonName}</span>
                    </div>
                    {getRoleBadge(item.assignedRole)}
                    {item.backupPersonName && (
                      <span className="text-[11px] text-muted-foreground">
                        Backup: <strong>{item.backupPersonName}</strong>
                      </span>
                    )}
                    {item.completedAt && (
                      <span className="text-[11px] text-emerald-600 font-mono">
                        Done at {item.completedAt}
                      </span>
                    )}
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={isDone ? 'outline' : 'default'}
                    className={`text-xs font-bold gap-1.5 min-w-[120px] ${
                      isDone
                        ? 'border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10'
                        : 'bg-primary text-primary-foreground'
                    }`}
                    onClick={() => toggleComplete(item.id)}
                  >
                    {isDone ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Completed</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-3.5 h-3.5" />
                        <span>Acknowledge</span>
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
}
