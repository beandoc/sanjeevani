'use client';

import React, { useState, useEffect } from 'react';
import {
  ZbiTier,
  ZbiItem,
  getItemsForTier,
  LIKERT_OPTIONS,
  calculateZaritScore,
  ZaritEvaluationResult
} from '@/lib/zarit-scale';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  HeartPulse,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Layers,
  HelpCircle,
  Clock,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ZaritCalculatorProps {
  onComplete: (result: ZaritEvaluationResult) => void;
  lang?: 'en' | 'hi' | 'mr';
}

export function ZaritCalculator({ onComplete, lang = 'en' }: ZaritCalculatorProps) {
  const [tier, setTier] = useState<ZbiTier>('ZBI22');
  const [items, setItems] = useState<ZbiItem[]>(() => getItemsForTier('ZBI22'));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, number>>({});
  const [activeLang, setActiveLang] = useState<'en' | 'hi' | 'mr'>(lang);

  useEffect(() => {
    setActiveLang(lang);
  }, [lang]);

  useEffect(() => {
    const tierItems = getItemsForTier(tier);
    setItems(tierItems);
    setCurrentIndex(0);
    // Keep existing responses that belong to this tier, reset missing
    setResponses((prev) => {
      const valid: Record<string, number> = {};
      tierItems.forEach((it) => {
        if (prev[it.id] !== undefined) {
          valid[it.id] = prev[it.id];
        }
      });
      return valid;
    });
  }, [tier]);

  const currentItem = items[currentIndex];
  const totalQuestions = items.length;
  const answeredCount = Object.keys(responses).length;
  const progressPct = Math.round((answeredCount / totalQuestions) * 100);
  const isFullyAnswered = answeredCount === totalQuestions;

  // Live Score Calculator
  const currentLiveScore = Object.values(responses).reduce((sum, v) => sum + v, 0);
  const maxPossibleScore = tier === 'ZBI22' ? 88 : tier === 'ZBI12' ? 48 : 16;

  const handleSelectOption = (value: number) => {
    if (!currentItem) return;
    setResponses((prev) => ({
      ...prev,
      [currentItem.id]: value
    }));

    // Auto-advance to next question if not on last item
    if (currentIndex < totalQuestions - 1) {
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
      }, 180);
    }
  };

  const handleFinish = () => {
    const result = calculateZaritScore(responses, tier);
    onComplete(result);
  };

  const handleReset = () => {
    setResponses({});
    setCurrentIndex(0);
  };

  const factorDisplayLabels: Record<string, { en: string; hi: string; mr: string }> = {
    personal_strain: { en: 'Personal Strain', hi: 'व्यक्तिगत तनाव', mr: 'वैयक्तिक ताण' },
    role_strain: { en: 'Role Conflict', hi: 'भूमिका संघर्ष', mr: 'जबाबदाऱ्यांचा ताण' },
    financial_strain: { en: 'Financial Strain', hi: 'आर्थिक भार', mr: 'आर्थिक ताण' },
    competency: { en: 'Care Competency', hi: 'देखभाल क्षमता', mr: 'काळजी घेण्याची क्षमता' },
    guilt: { en: 'Self-Expectation', hi: 'आत्म-अपेक्षा', mr: 'अपराधीपणाची भावना' },
    global_burden: { en: 'Global Burden Anchor', hi: 'समग्र बोझ', mr: 'एकूण ताण' }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Tier Switcher */}
      <div className="bg-card border border-border/80 rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-semibold px-2.5 py-0.5">
                Standardized Psychometric Tool
              </Badge>
              <Badge variant="secondary" className="text-xs">
                Clinical Grade
              </Badge>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <HeartPulse className="w-6 h-6 text-primary animate-pulse" />
              Zarit Caregiver Burden Scale (ZBI)
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Quantify caregiver fatigue, evaluate role strain, and generate targeted respite suggestions for review.
            </p>
          </div>

          {/* Tier Selector Buttons */}
          <div className="flex flex-wrap items-center gap-2 p-1.5 bg-muted/60 rounded-xl border border-border/60">
            <button
              onClick={() => setTier('ZBI22')}
              className={cn(
                'px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all',
                tier === 'ZBI22'
                  ? 'bg-background text-foreground shadow-sm font-extrabold border border-border'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              ZBI-22 (Full Scale)
            </button>
            <button
              onClick={() => setTier('ZBI12')}
              className={cn(
                'px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all',
                tier === 'ZBI12'
                  ? 'bg-background text-foreground shadow-sm font-extrabold border border-border'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              ZBI-12 (Clinical 12)
            </button>
            <button
              onClick={() => setTier('ZBI4')}
              className={cn(
                'px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all',
                tier === 'ZBI4'
                  ? 'bg-background text-foreground shadow-sm font-extrabold border border-border'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              ZBI-4 (Rapid Triage)
            </button>
          </div>
        </div>

        {/* Status Bar */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-border/60 text-xs">
          <div className="p-2.5 rounded-xl bg-muted/30 border border-border/40">
            <span className="text-muted-foreground block">Active Tier:</span>
            <span className="font-bold text-foreground text-sm">
              {tier === 'ZBI22' ? 'ZBI-22 Full Scale' : tier === 'ZBI12' ? 'ZBI-12 Short Form' : 'ZBI-4 Screening'}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-muted/30 border border-border/40">
            <span className="text-muted-foreground block">Items Answered:</span>
            <span className="font-bold text-foreground text-sm">
              {answeredCount} of {totalQuestions} ({progressPct}%)
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-muted/30 border border-border/40">
            <span className="text-muted-foreground block">Running Raw Score:</span>
            <span className="font-bold text-primary text-sm">
              {currentLiveScore} / {maxPossibleScore} pts
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-muted/30 border border-border/40 flex items-center justify-between">
            <div>
              <span className="text-muted-foreground block">Language:</span>
              <span className="font-bold text-foreground uppercase">{activeLang}</span>
            </div>
            <div className="flex gap-1">
              {(['en', 'hi', 'mr'] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setActiveLang(l)}
                  className={cn(
                    'px-1.5 py-0.5 rounded text-[10px] font-bold uppercase transition-colors',
                    activeLang === l ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  )}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5 font-medium">
            <span>Assessment Progress</span>
            <span>{progressPct}% Completed</span>
          </div>
          <Progress value={progressPct} className="h-2 rounded-full" />
        </div>
      </div>

      {/* Main Question Card */}
      {currentItem && (
        <Card className="border-border shadow-md overflow-hidden transition-all duration-300">
          <CardHeader className="bg-muted/20 border-b border-border/60 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-xs px-2.5 py-1 bg-background font-bold border-primary/30 text-primary">
                  Question {currentIndex + 1} of {totalQuestions}
                </Badge>
                <Badge variant="secondary" className="text-xs font-semibold">
                  {factorDisplayLabels[currentItem.factor]?.[activeLang] || currentItem.factor}
                </Badge>
                {currentItem.isRedFlagTrigger && (
                  <Badge variant="destructive" className="text-xs flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" /> Critical Safety Indicator
                  </Badge>
                )}
              </div>
              <span className="text-xs text-muted-foreground hidden sm:inline">
                Item ID: {currentItem.id}
              </span>
            </div>

            <CardTitle className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-foreground mt-4 leading-relaxed">
              {currentItem.text[activeLang] || currentItem.text.en}
            </CardTitle>
            {activeLang !== 'en' && (
              <CardDescription className="text-xs text-muted-foreground italic mt-1">
                EN: {currentItem.text.en}
              </CardDescription>
            )}
          </CardHeader>

          <CardContent className="p-4 sm:p-8 space-y-4">
            {/* Likert Response Options */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {LIKERT_OPTIONS.map((opt) => {
                const isSelected = responses[currentItem.id] === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => handleSelectOption(opt.value)}
                    className={cn(
                      'group relative p-4 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between hover:scale-[1.02] active:scale-[0.98]',
                      isSelected
                        ? 'border-primary bg-primary/10 ring-2 ring-primary shadow-sm text-foreground'
                        : 'border-border bg-card hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <div className="flex items-center justify-between w-full mb-3">
                      <span
                        className={cn(
                          'w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-colors',
                          isSelected
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'bg-muted text-muted-foreground group-hover:bg-muted/80'
                        )}
                      >
                        {opt.value}
                      </span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-primary animate-in zoom-in-50" />}
                    </div>
                    <div>
                      <div className="font-bold text-sm sm:text-base text-foreground">
                        {opt.label[activeLang] || opt.label.en}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5 font-medium">
                        {opt.description[activeLang] || opt.description.en}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Stepper Navigation Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-border/60 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="text-xs text-muted-foreground hover:text-destructive gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset
                </Button>

                {currentIndex < totalQuestions - 1 ? (
                  <Button
                    size="sm"
                    onClick={() => setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
                    disabled={responses[currentItem.id] === undefined}
                    className="gap-1.5"
                  >
                    Next Question <ChevronRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={handleFinish}
                    disabled={!isFullyAnswered}
                    className="bg-primary text-primary-foreground shadow-md hover:bg-primary/90 gap-1.5 font-bold"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Complete & Compute Burden
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Jump Question Matrix */}
      <div className="bg-card border border-border/80 rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" /> Question Navigator
          </h3>
          <span className="text-xs font-semibold text-muted-foreground">
            {answeredCount} of {totalQuestions} Answered
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {items.map((item, idx) => {
            const isAnswered = responses[item.id] !== undefined;
            const isCurrent = idx === currentIndex;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentIndex(idx)}
                className={cn(
                  'w-8 h-8 rounded-lg text-xs font-bold transition-all flex items-center justify-center',
                  isCurrent
                    ? 'ring-2 ring-primary ring-offset-2 bg-primary text-primary-foreground font-black'
                    : isAnswered
                    ? 'bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80 border border-border/60'
                )}
                title={`Q${idx + 1}: ${item.text.en}`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        {isFullyAnswered && (
          <div className="mt-4 pt-4 border-t border-border/60 flex items-center justify-between bg-primary/5 p-3 rounded-xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-primary">
              <CheckCircle2 className="w-4 h-4" /> All questions completed!
            </div>
            <Button size="sm" onClick={handleFinish} className="gap-1.5 font-bold shadow-sm">
              View Comprehensive Results <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
