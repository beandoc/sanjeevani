'use client';

import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ClipboardPlus,
  Activity,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  Zap,
  RotateCcw,
  Check,
  RefreshCw
} from 'lucide-react';
import { BARTHEL_ITEMS, LAWTON_ITEMS, calculateFunctionScore } from '@/lib/clinical/function-scale';
import type { FunctionEvaluationResult } from '@/lib/clinical/function-scale';
import { cn } from '@/lib/utils';

interface FunctionAssessmentFormProps {
  onComplete: (result: FunctionEvaluationResult) => void | Promise<void>;
  trigger?: React.ReactNode;
}

/**
 * Modern clinical assessment modal for Barthel Index of ADLs (10 items)
 * and Lawton-Brody IADLs (8 items).
 * Provides live scoring, domain breakdown, rapid presets, and clear unabbreviated criteria.
 */
export function FunctionAssessmentForm({ onComplete, trigger }: FunctionAssessmentFormProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'barthel' | 'lawton'>('all');
  const [barthelResponses, setBarthelResponses] = useState<Record<string, number>>({});
  const [lawtonResponses, setLawtonResponses] = useState<Record<string, number>>({});
  const [assessmentDate, setAssessmentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [isSaving, setIsSaving] = useState(false);

  const totalItems = BARTHEL_ITEMS.length + LAWTON_ITEMS.length;
  const answeredBarthel = Object.keys(barthelResponses).length;
  const answeredLawton = Object.keys(lawtonResponses).length;
  const answeredItems = answeredBarthel + answeredLawton;
  const progressPercent = Math.round((answeredItems / totalItems) * 100);
  // Require every item to be answered before saving — an unanswered Barthel item
  // must NOT be silently treated as 0 (Total Dependency).
  const isComplete = answeredBarthel === BARTHEL_ITEMS.length && answeredLawton === LAWTON_ITEMS.length;

  // Live computed scores as clinician toggles options
  const liveScore = useMemo(
    () => calculateFunctionScore(barthelResponses, lawtonResponses),
    [barthelResponses, lawtonResponses]
  );

  const handlePresetIndependent = () => {
    const bMap: Record<string, number> = {};
    BARTHEL_ITEMS.forEach((item) => {
      bMap[item.id] = Math.max(...item.options.map((o) => o.value));
    });
    const lMap: Record<string, number> = {};
    LAWTON_ITEMS.forEach((item) => {
      lMap[item.id] = Math.max(...item.options.map((o) => o.value));
    });
    setBarthelResponses(bMap);
    setLawtonResponses(lMap);
  };

  const handleClearAll = () => {
    setBarthelResponses({});
    setLawtonResponses({});
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      const result = calculateFunctionScore(barthelResponses, lawtonResponses);
      const dateObj = new Date(assessmentDate);
      const now = new Date();
      dateObj.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
      result.recordedAt = dateObj.toISOString();

      await onComplete(result);
      setOpen(false);
      setBarthelResponses({});
      setLawtonResponses({});
      setAssessmentDate(new Date().toISOString().split('T')[0]);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" className="gap-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs">
            <ClipboardPlus className="w-3.5 h-3.5" />
            <span>Record Functional Assessment</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="w-[96vw] sm:max-w-3xl lg:max-w-4xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden rounded-3xl border border-border shadow-2xl bg-card">
        {/* 1. STICKY CLINICAL HEADER */}
        <DialogHeader className="p-4 sm:p-6 border-b border-border/70 bg-gradient-to-r from-indigo-500/10 via-card to-background shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5">
                  Standardized Assessment
                </Badge>
                <Badge variant="outline" className="text-xs font-semibold border-indigo-500/30 text-indigo-700 dark:text-indigo-300">
                  Barthel Index (ADLs) & Lawton-Brody (IADLs)
                </Badge>
              </div>
              <DialogTitle className="text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Functional Independence & Care Demand Intake
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Formal baseline evaluation of self-care independence, transfer safety, and domestic instrumental capabilities.
              </DialogDescription>
            </div>

            {/* Assessment Date Field */}
            <div className="flex items-center gap-2 self-start sm:self-auto bg-background/80 border border-border/80 rounded-2xl px-3 py-1.5 shadow-2xs">
              <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider leading-none">
                  Encounter Date
                </span>
                <input
                  type="date"
                  value={assessmentDate}
                  onChange={(e) => setAssessmentDate(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-foreground focus:outline-none cursor-pointer mt-0.5"
                />
              </div>
            </div>
          </div>

          {/* Live Progress & Score Preview Bar */}
          <div className="mt-4 pt-3 border-t border-border/50 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
            {/* Answered Counter & Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-muted-foreground">Evaluation Progress</span>
                <span className="text-foreground font-mono">{answeredItems} of {totalItems} items ({progressPercent}%)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-indigo-600 transition-all duration-300 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Live Barthel Score Pill */}
            <div className="p-2 sm:p-2.5 rounded-2xl border border-indigo-500/20 bg-background/80 flex items-center justify-between shadow-2xs">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Barthel ADL
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-black font-mono text-indigo-600 dark:text-indigo-400">
                    {liveScore.barthelScore}
                  </span>
                  <span className="text-[11px] font-medium text-muted-foreground">/ 100</span>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px] font-bold capitalize">
                {liveScore.band}
              </Badge>
            </div>

            {/* Live Lawton Score Pill */}
            <div className="p-2 sm:p-2.5 rounded-2xl border border-border/70 bg-background/80 flex items-center justify-between shadow-2xs">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Lawton IADL
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-black font-mono text-foreground">
                    {liveScore.lawtonScore}
                  </span>
                  <span className="text-[11px] font-medium text-muted-foreground">/ 8</span>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-muted-foreground">
                {liveScore.lawtonScore === 8 ? 'Full Autonomy' : 'Assisted'}
              </span>
            </div>
          </div>

          {/* Quick Presets & Section Navigator */}
          <div className="mt-3 flex items-center justify-between flex-wrap gap-2 pt-1">
            <div className="flex items-center gap-1.5 p-1 bg-muted/60 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={cn(
                  'px-3 py-1 rounded-lg text-xs font-bold transition-all',
                  activeTab === 'all'
                    ? 'bg-background text-foreground shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                All (18)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('barthel')}
                className={cn(
                  'px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5',
                  activeTab === 'barthel'
                    ? 'bg-background text-foreground shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Layers className="w-3.5 h-3.5 text-indigo-500" />
                <span>Basic ADL (10)</span>
                {answeredBarthel > 0 && (
                  <span className="text-[10px] font-mono opacity-70">({answeredBarthel}/10)</span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('lawton')}
                className={cn(
                  'px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5',
                  activeTab === 'lawton'
                    ? 'bg-background text-foreground shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>Lawton IADL (8)</span>
                {answeredLawton > 0 && (
                  <span className="text-[10px] font-mono opacity-70">({answeredLawton}/8)</span>
                )}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePresetIndependent}
                className="h-8 text-xs font-semibold gap-1.5 border-amber-500/40 text-amber-700 dark:text-amber-400 bg-amber-500/5 hover:bg-amber-500/10"
                title="Warning: prefills all 18 items as fully independent. Review each item before saving."
              >
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden sm:inline">Preset:</span> All Independent
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="h-8 text-xs font-medium text-muted-foreground hover:text-foreground gap-1"
                title="Reset all responses"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden sm:inline">Reset</span>
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* 2. SCROLLABLE ASSESSMENT ITEMS BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* SECTION A: BARTHEL BASIC ADL ITEMS */}
          {(activeTab === 'all' || activeTab === 'barthel') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Layers className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Barthel Index of Daily Living (10 Basic ADLs)</h3>
                    <p className="text-[11px] text-muted-foreground">
                      Measures patient neuromuscular self-care capacity (Mahoney & Barthel 1965).
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs font-mono font-bold">
                  {answeredBarthel} / 10 Evaluated
                </Badge>
              </div>

              <div className="space-y-4">
                {BARTHEL_ITEMS.map((item, index) => {
                  const currentVal = barthelResponses[item.id];
                  const hasSelection = currentVal !== undefined;

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        'p-4 rounded-3xl border transition-all bg-card/80 shadow-2xs',
                        hasSelection ? 'border-border/80' : 'border-border/50'
                      )}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-full bg-muted text-foreground/80 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                            {index + 1}
                          </span>
                          <span className="text-sm font-bold text-foreground">{item.text.en}</span>
                          <Badge variant="secondary" className="text-[10px] font-medium capitalize text-muted-foreground">
                            {item.domain.replace('_', ' ')}
                          </Badge>
                        </div>
                        {item.isCareIntensityDriver && (
                          <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[10px] font-bold w-fit">
                            ⚡ High Caregiver Load Driver
                          </Badge>
                        )}
                      </div>

                      {/* Options Grid with Full Text (No Truncation) */}
                      <div
                        className={cn(
                          'grid gap-2',
                          item.options.length === 2
                            ? 'grid-cols-1 sm:grid-cols-2'
                            : item.options.length === 3
                            ? 'grid-cols-1 sm:grid-cols-3'
                            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
                        )}
                      >
                        {item.options.map((opt) => {
                          const isSelected = currentVal === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() =>
                                setBarthelResponses((prev) => ({ ...prev, [item.id]: opt.value }))
                              }
                              className={cn(
                                'p-3 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer group',
                                isSelected
                                  ? 'border-indigo-600 bg-indigo-500/10 dark:bg-indigo-950/40 ring-2 ring-indigo-500/30 shadow-xs'
                                  : 'border-border/70 bg-card hover:bg-muted/50 hover:border-border'
                              )}
                            >
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <Badge
                                  variant={isSelected ? 'default' : 'secondary'}
                                  className={cn(
                                    'text-[10px] font-mono font-bold px-1.5 py-0.5',
                                    isSelected && 'bg-indigo-600 text-white'
                                  )}
                                >
                                  {opt.value} {opt.value === 1 ? 'pt' : 'pts'}
                                </Badge>
                                {isSelected ? (
                                  <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                                ) : (
                                  <div className="w-4 h-4 rounded-full border border-border/80 group-hover:border-foreground/40 shrink-0 transition-colors" />
                                )}
                              </div>
                              <span
                                className={cn(
                                  'text-xs leading-snug break-words',
                                  isSelected ? 'font-bold text-foreground' : 'text-foreground/80 font-medium'
                                )}
                              >
                                {opt.label.en}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION B: LAWTON-BRODY INSTRUMENTAL IADL ITEMS */}
          {(activeTab === 'all' || activeTab === 'lawton') && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Lawton-Brody Instrumental Activities (8 IADLs)</h3>
                    <p className="text-[11px] text-muted-foreground">
                      Measures cognitive and community autonomy necessary for living safely at home.
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs font-mono font-bold">
                  {answeredLawton} / 8 Evaluated
                </Badge>
              </div>

              <div className="space-y-4">
                {LAWTON_ITEMS.map((item, index) => {
                  const currentVal = lawtonResponses[item.id];
                  const hasSelection = currentVal !== undefined;

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        'p-4 rounded-3xl border transition-all bg-card/80 shadow-2xs',
                        hasSelection ? 'border-border/80' : 'border-border/50'
                      )}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-full bg-muted text-foreground/80 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                            {index + 1}
                          </span>
                          <span className="text-sm font-bold text-foreground">{item.text.en}</span>
                          <Badge variant="secondary" className="text-[10px] font-medium capitalize text-muted-foreground">
                            {item.domain.replace('_', ' ')}
                          </Badge>
                        </div>
                        {item.isCareIntensityDriver && (
                          <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[10px] font-bold w-fit">
                            ⚡ High Caregiver Load Driver
                          </Badge>
                        )}
                      </div>

                      {/* Options Grid with Full Text (No Truncation) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {item.options.map((opt) => {
                          const isSelected = currentVal === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() =>
                                setLawtonResponses((prev) => ({ ...prev, [item.id]: opt.value }))
                              }
                              className={cn(
                                'p-3 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer group',
                                isSelected
                                  ? 'border-indigo-600 bg-indigo-500/10 dark:bg-indigo-950/40 ring-2 ring-indigo-500/30 shadow-xs'
                                  : 'border-border/70 bg-card hover:bg-muted/50 hover:border-border'
                              )}
                            >
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <Badge
                                  variant={isSelected ? 'default' : 'secondary'}
                                  className={cn(
                                    'text-[10px] font-mono font-bold px-1.5 py-0.5',
                                    isSelected && 'bg-indigo-600 text-white'
                                  )}
                                >
                                  {opt.value} {opt.value === 1 ? 'pt' : 'pts'}
                                </Badge>
                                {isSelected ? (
                                  <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                                ) : (
                                  <div className="w-4 h-4 rounded-full border border-border/80 group-hover:border-foreground/40 shrink-0 transition-colors" />
                                )}
                              </div>
                              <span
                                className={cn(
                                  'text-xs leading-snug break-words',
                                  isSelected ? 'font-bold text-foreground' : 'text-foreground/80 font-medium'
                                )}
                              >
                                {opt.label.en}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 3. STICKY CLINICAL FOOTER */}
        <DialogFooter className="p-4 sm:p-5 border-t border-border/70 bg-card/95 backdrop-blur-xs shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap text-xs">
            <span className="text-muted-foreground font-semibold">Provisional Scoring:</span>
            <Badge variant="outline" className="font-mono text-xs font-bold border-indigo-500/30 text-indigo-700 dark:text-indigo-300">
              Barthel: {liveScore.barthelScore}/100 ({liveScore.band})
            </Badge>
            <Badge variant="outline" className="font-mono text-xs font-bold">
              Lawton: {liveScore.lawtonScore}/8
            </Badge>
            {!isComplete && (
              <span className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold">
                ⚠ {totalItems - answeredItems} item{totalItems - answeredItems !== 1 ? 's' : ''} unanswered — complete all to save
              </span>
            )}
            {isComplete && (
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                ✓ All {totalItems} items answered
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="text-xs font-semibold h-10 px-4"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!isComplete || isSaving}
              className="h-10 px-5 text-xs font-bold gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saving Assessment...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save Functional Assessment</span>
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
