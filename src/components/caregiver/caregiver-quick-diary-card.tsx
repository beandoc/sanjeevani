'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  Sparkles,
  CheckCircle2,
  Users2,
  User,
  History
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  HealthRepository,
  type CaregiverDiaryEntry,
  type CaregiverDiaryTaskCategory,
  type CaregiverDurationBracket,
  DURATION_BRACKET_LABELS,
  TASK_CATEGORY_LABELS,
  DURATION_BRACKET_MINUTES
} from '@/lib/db/health-repository';
import { CaregiverDiaryHistoryDialog } from './caregiver-diary-history-dialog';

interface CaregiverQuickDiaryCardProps {
  patientUid?: string | null;
  patientName?: string;
  className?: string;
  onEntryLogged?: (entry: CaregiverDiaryEntry) => void;
}

export function CaregiverQuickDiaryCard({
  patientUid,
  patientName = 'Your Loved One',
  className,
  onEntryLogged
}: CaregiverQuickDiaryCardProps) {
  const [promptData, setPromptData] = useState(() => HealthRepository.getCurrentDiurnalPrompt());
  const [selectedTask, setSelectedTask] = useState<CaregiverDiaryTaskCategory>(promptData.suggestedTasks[0] || 'bathing_hygiene');
  const [selectedBracket, setSelectedBracket] = useState<CaregiverDurationBracket>('15_to_30m');
  const [staffCount, setStaffCount] = useState<1 | 2>(1);
  const [strain, setStrain] = useState<'mild' | 'moderate' | 'heavy_strain'>('mild');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [justLogged, setJustLogged] = useState<CaregiverDiaryEntry | null>(null);
  const [recentCount, setRecentCount] = useState(0);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Refresh diurnal prompt on mount and load recent entry counts
  useEffect(() => {
    const prompt = HealthRepository.getCurrentDiurnalPrompt();
    setPromptData(prompt);
    setSelectedTask(prompt.suggestedTasks[0] || 'bathing_hygiene');

    const updateCount = () => {
      const entries = HealthRepository.getCaregiverDiaryEntries(patientUid);
      setRecentCount(entries.length);
    };

    updateCount();
    window.addEventListener('sanjeevani:caregiver-diary-updated', updateCount);
    return () => window.removeEventListener('sanjeevani:caregiver-diary-updated', updateCount);
  }, [patientUid]);

  const handle1TapLog = () => {
    setIsSubmitting(true);
    try {
      const entry = HealthRepository.recordCaregiverDiaryEntry({
        patientUid: patientUid ?? null,
        timeBlock: promptData.timeBlock,
        taskCategory: selectedTask,
        durationBracket: selectedBracket,
        durationMinutes: DURATION_BRACKET_MINUTES[selectedBracket],
        staffCount,
        physicalStrain: strain
      });

      setJustLogged(entry);
      if (onEntryLogged) onEntryLogged(entry);

      // Auto-clear success banner after 4 seconds
      setTimeout(() => {
        setJustLogged(null);
      }, 4000);
    } catch (err) {
      console.error('Failed to log diary entry:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentTaskMeta = TASK_CATEGORY_LABELS[selectedTask];

  return (
    <>
      <Card className={cn('overflow-hidden border-primary/20 bg-gradient-to-br from-background via-background to-primary/5 shadow-sm', className)}>
        <CardHeader className="p-4 pb-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
                <Clock className="w-4 h-4" />
              </span>
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider px-2 py-0 border-primary/30 text-primary bg-primary/5">
                    {promptData.timeBlock === 'morning_rush' && '🌅 Morning Rush'}
                    {promptData.timeBlock === 'afternoon' && '☀️ Midday Care'}
                    {promptData.timeBlock === 'evening' && '🌆 Evening Routine'}
                    {promptData.timeBlock === 'night_watch' && '🌙 Night Watch'}
                  </Badge>
                  {recentCount > 0 && (
                    <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[9px] font-bold px-1.5 py-0">
                      ✓ {recentCount} Log{recentCount > 1 ? 's' : ''} Calibrating
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-sm font-bold text-foreground mt-1">
                  1-Tap Caregiver Time Check-In
                </CardTitle>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsHistoryOpen(true)}
              className="h-8 px-2.5 text-xs text-muted-foreground hover:text-primary gap-1"
              title="View Calibration History"
            >
              <History className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Log History</span>
            </Button>
          </div>
          <CardDescription className="text-xs text-muted-foreground pt-1">
            Confirm actual minutes spent on care tasks today. Feeds directly into {patientName}&apos;s calibration model.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-4 pt-0 space-y-3.5">
          {/* Success Banner */}
          {justLogged && (
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 flex items-center justify-between gap-2 text-xs animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="font-medium">
                  Logged <strong>{DURATION_BRACKET_LABELS[justLogged.durationBracket]}</strong> for {TASK_CATEGORY_LABELS[justLogged.taskCategory]?.label}!
                </span>
              </div>
              <span className="text-[10px] font-bold bg-emerald-500/20 px-2 py-0.5 rounded-full">
                Calibrated ✓
              </span>
            </div>
          )}

          {/* Task Category Quick Chips */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Select Care Task:
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {(Object.keys(TASK_CATEGORY_LABELS) as CaregiverDiaryTaskCategory[]).map((cat) => {
                const meta = TASK_CATEGORY_LABELS[cat];
                const isSelected = selectedTask === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedTask(cat)}
                    className={cn(
                      'shrink-0 text-xs px-2.5 py-1.5 rounded-xl border font-medium flex items-center gap-1.5 transition-all cursor-pointer',
                      isSelected
                        ? 'bg-primary text-primary-foreground border-primary font-bold shadow-xs'
                        : 'bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border-border/80'
                    )}
                  >
                    <span>{meta.icon}</span>
                    <span>{meta.label.split('&')[0].trim()}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 1-Tap Duration Bracket Buttons */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-foreground">
                How long did {currentTaskMeta.label} take?
              </span>
              <span className="text-muted-foreground text-[10px]">Tap to select</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['under_15m', '15_to_30m', '30_to_60m', '60_to_120m'] as CaregiverDurationBracket[]).map((bracket) => {
                const isSelected = selectedBracket === bracket;
                return (
                  <button
                    key={bracket}
                    type="button"
                    onClick={() => setSelectedBracket(bracket)}
                    className={cn(
                      'p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5',
                      isSelected
                        ? 'bg-primary text-primary-foreground border-primary font-bold shadow-xs scale-[1.02]'
                        : 'bg-background hover:bg-muted text-foreground border-border/80 hover:border-border'
                    )}
                  >
                    <span className="text-xs font-bold">{DURATION_BRACKET_LABELS[bracket]}</span>
                    <span className={cn('text-[10px]', isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
                      ~{DURATION_BRACKET_MINUTES[bracket]} mins
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Refinements: Staff Count & Strain */}
          <div className="p-2.5 rounded-xl bg-muted/30 border border-border/60 flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Staff Count */}
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground font-medium text-[11px]">Assistance:</span>
              <div className="inline-flex rounded-lg border border-border/80 p-0.5 bg-background">
                <button
                  type="button"
                  onClick={() => setStaffCount(1)}
                  className={cn(
                    'px-2 py-1 rounded-md text-[11px] font-semibold transition-all flex items-center gap-1 cursor-pointer',
                    staffCount === 1 ? 'bg-primary text-primary-foreground shadow-2xs' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <User className="w-3 h-3" /> 1 Person
                </button>
                <button
                  type="button"
                  onClick={() => setStaffCount(2)}
                  className={cn(
                    'px-2 py-1 rounded-md text-[11px] font-semibold transition-all flex items-center gap-1 cursor-pointer',
                    staffCount === 2 ? 'bg-rose-600 text-white shadow-2xs' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Users2 className="w-3 h-3" /> 2 People Needed
                </button>
              </div>
            </div>

            {/* Strain Level */}
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground font-medium text-[11px]">Effort:</span>
              <div className="inline-flex rounded-lg border border-border/80 p-0.5 bg-background">
                <button
                  type="button"
                  onClick={() => setStrain('mild')}
                  className={cn(
                    'px-2 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer',
                    strain === 'mild' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  🟢 Normal
                </button>
                <button
                  type="button"
                  onClick={() => setStrain('moderate')}
                  className={cn(
                    'px-2 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer',
                    strain === 'moderate' ? 'bg-amber-600 text-white shadow-2xs' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  🟡 Moderate
                </button>
                <button
                  type="button"
                  onClick={() => setStrain('heavy_strain')}
                  className={cn(
                    'px-2 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer',
                    strain === 'heavy_strain' ? 'bg-rose-600 text-white shadow-2xs' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  🔴 Heavy Strain
                </button>
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <Button
            onClick={handle1TapLog}
            disabled={isSubmitting}
            className="w-full h-10 font-bold text-xs sm:text-sm bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Confirm &amp; Record {DURATION_BRACKET_LABELS[selectedBracket]}</span>
          </Button>
        </CardContent>
      </Card>

      {/* History & Calibration Modal */}
      <CaregiverDiaryHistoryDialog
        open={isHistoryOpen}
        onOpenChange={setIsHistoryOpen}
        patientUid={patientUid}
        patientName={patientName}
      />
    </>
  );
}
