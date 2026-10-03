'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  Trash2,
  Download
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  HealthRepository,
  type CaregiverDiaryEntry,
  type CaregiverDiaryCalibrationReport,
  DURATION_BRACKET_LABELS,
  TASK_CATEGORY_LABELS
} from '@/lib/db/health-repository';

interface CaregiverDiaryHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientUid?: string | null;
  patientName?: string;
}

export function CaregiverDiaryHistoryDialog({
  open,
  onOpenChange,
  patientUid,
  patientName = 'Patient'
}: CaregiverDiaryHistoryDialogProps) {
  const [entries, setEntries] = useState<CaregiverDiaryEntry[]>([]);
  const [summary, setSummary] = useState<CaregiverDiaryCalibrationReport | null>(null);

  const loadData = useCallback(() => {
    const rawEntries = HealthRepository.getCaregiverDiaryEntries(patientUid);
    const sum = HealthRepository.getCaregiverDiaryCalibrationSummary(patientUid);
    setEntries(rawEntries);
    setSummary(sum);
  }, [patientUid]);

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open, loadData]);

  const handleDelete = (id: string) => {
    HealthRepository.deleteCaregiverDiaryEntry(id, patientUid);
    loadData();
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all caregiver diary logs for this dyad?')) {
      HealthRepository.clearCaregiverDiaryEntries(patientUid);
      loadData();
    }
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(entries, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `caregiver_diary_${patientUid || 'local'}_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl p-5 sm:p-6">
        <DialogHeader className="space-y-1">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-primary/10 text-primary">
                <Clock className="w-5 h-5" />
              </span>
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold text-foreground">
                  Caregiver Time Diary &amp; Calibration Log
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Empirical real-world task assistance observations for {patientName}.
                </DialogDescription>
              </div>
            </div>
            {summary && summary.totalEntries > 0 && (
              <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-bold px-2.5 py-1">
                ✓ {summary.totalEntries} Observations Recorded
              </Badge>
            )}
          </div>
        </DialogHeader>

        {/* Empirical Summary Metrics */}
        {summary && summary.totalEntries > 0 ? (
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-2xl border border-primary/20 bg-primary/5 flex flex-col justify-between gap-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Avg Daily Hands-on Care
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-extrabold text-primary">
                    {summary.empiricalDirectCareHours}
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground">hrs / day</span>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  Based on {summary.averageDailyHandsOnMinutes} mins measured daily
                </span>
              </div>

              <div className="p-3 rounded-2xl border border-border/80 bg-background flex flex-col justify-between gap-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Calibrated Task Types
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-extrabold text-foreground">
                    {Object.keys(summary.metricsByTask).length}
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground">distinct tasks</span>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  Directly replaces consensus priors
                </span>
              </div>

              <div className="p-3 rounded-2xl border border-border/80 bg-background flex flex-col justify-between gap-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Longitudinal Period
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xs font-bold text-foreground">
                    {summary.firstLoggedAt ? new Date(summary.firstLoggedAt).toLocaleDateString() : '—'}
                  </span>
                  <span className="text-xs text-muted-foreground">to</span>
                  <span className="text-xs font-bold text-foreground">
                    {summary.lastLoggedAt ? new Date(summary.lastLoggedAt).toLocaleDateString() : '—'}
                  </span>
                </div>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                  Active Real-World Feed
                </span>
              </div>
            </div>

            {/* Task Breakdown Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                Empirical Calibration by Task Category
              </h4>
              <div className="rounded-2xl border border-border/70 overflow-hidden divide-y divide-border/60 bg-muted/10 text-xs">
                {Object.values(summary.metricsByTask).map((metric) => {
                  const meta = TASK_CATEGORY_LABELS[metric.taskCategory];
                  return (
                    <div key={`${metric.taskCategory}_${metric.timeBlock}`} className="p-2.5 sm:p-3 flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{meta?.icon || '⏱️'}</span>
                        <div>
                          <div className="font-bold text-foreground">{meta?.label || metric.taskCategory}</div>
                          <div className="text-[10px] text-muted-foreground">
                            {metric.sampleCount} logged episode{metric.sampleCount > 1 ? 's' : ''} • Range: {metric.minMinutes}–{metric.maxMinutes} mins
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {metric.twoPersonFrequencyPercent > 0 && (
                          <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 text-[10px] font-bold px-1.5 py-0">
                            👥 {metric.twoPersonFrequencyPercent}% 2-Person
                          </Badge>
                        )}
                        <div className="text-right">
                          <div className="text-sm font-extrabold text-primary">
                            ~{metric.meanMinutes}m
                          </div>
                          <div className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold">
                            Empirical Mean
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chronological Log List */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Recorded Diary Entries ({entries.length})
                </h4>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportJson}
                    className="h-7 text-xs gap-1 cursor-pointer"
                  >
                    <Download className="w-3 h-3" /> Export JSON
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearAll}
                    className="h-7 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                  >
                    Clear All
                  </Button>
                </div>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {entries.map((entry) => {
                  const meta = TASK_CATEGORY_LABELS[entry.taskCategory];
                  return (
                    <div
                      key={entry.id}
                      className="p-2.5 rounded-xl border border-border/70 bg-background flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm shrink-0">{meta?.icon || '⏱️'}</span>
                        <div className="min-w-0">
                          <div className="font-semibold text-foreground truncate">
                            {meta?.label || entry.taskCategory}
                          </div>
                          <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 flex-wrap">
                            <span>{entry.date}</span>
                            <span>•</span>
                            <span className="capitalize">{entry.timeBlock.replace('_', ' ')}</span>
                            <span>•</span>
                            <span>{entry.staffCount === 2 ? '👥 2 People' : '👤 1 Person'}</span>
                            <span>•</span>
                            <span className={cn(
                              entry.physicalStrain === 'heavy_strain' ? 'text-rose-600 font-semibold' : 'text-muted-foreground'
                            )}>
                              {entry.physicalStrain.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="secondary" className="font-bold text-xs">
                          {DURATION_BRACKET_LABELS[entry.durationBracket]}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(entry.id)}
                          className="w-7 h-7 text-muted-foreground hover:text-rose-600"
                          title="Delete entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-10 text-center space-y-3">
            <span className="p-3 rounded-2xl bg-muted inline-block text-2xl">
              📝
            </span>
            <div className="space-y-1 max-w-sm mx-auto">
              <h4 className="text-sm font-bold text-foreground">No Diary Logs Yet</h4>
              <p className="text-xs text-muted-foreground">
                As the family or nurse records 1-tap checks from the home dashboard, real measured task times will appear here to auto-calibrate the care blueprint.
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="pt-3 border-t border-border/60">
          <Button
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto font-bold text-xs h-9"
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
