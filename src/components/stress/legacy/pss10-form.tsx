'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  PSS10_QUESTIONS,
  ZBI12_QUESTIONS,
  LIKERT_OPTIONS,
  AssessmentInstrumentType,
  calculatePSS10Score,
  calculateZBI12Score,
  getSeverity,
  normalizeScore,
  STRESS_LEVEL_INFO,
  StressAssessmentEntry,
} from '@/lib/stress-scale';
import {
  BrainCircuit,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Sparkles,
  Info,
  ChevronRight,
  ChevronLeft,
  Scale,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AssessmentFormProps {
  onSaveAssessment: (entry: StressAssessmentEntry) => void;
  defaultCareCondition?: string;
}

export function PSS10Form({ onSaveAssessment, defaultCareCondition = 'General Frailty' }: AssessmentFormProps) {
  const [instrument, setInstrument] = useState<AssessmentInstrumentType>('ZARIT_ZBI12');
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [notes, setNotes] = useState('');
  const [careCondition, setCareCondition] = useState(defaultCareCondition);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'stepper' | 'full'>('stepper');

  const questions = instrument === 'ZARIT_ZBI12' ? ZBI12_QUESTIONS : PSS10_QUESTIONS;
  const maxScore = instrument === 'ZARIT_ZBI12' ? 48 : 40;

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = questions.length;
  const progressPercent = Math.round((answeredCount / totalQuestions) * 100);
  const isComplete = answeredCount === totalQuestions;

  const currentScore = instrument === 'ZARIT_ZBI12' ? calculateZBI12Score(answers) : calculatePSS10Score(answers);
  const severity = getSeverity(currentScore, instrument);
  const normPct = normalizeScore(currentScore, instrument);
  const info = STRESS_LEVEL_INFO[severity];

  const handleSwitchInstrument = (inst: AssessmentInstrumentType) => {
    setInstrument(inst);
    setAnswers({});
    setCurrentStep(0);
  };

  const handleSelectOption = (questionId: number, value: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));

    if (viewMode === 'stepper' && currentStep < totalQuestions - 1) {
      setTimeout(() => {
        setCurrentStep((prev) => Math.min(totalQuestions - 1, prev + 1));
      }, 250);
    }
  };

  const handleQuickFill = (preset: 'low' | 'moderate' | 'high') => {
    const newAnswers: Record<number, number> = {};
    questions.forEach((q) => {
      if (preset === 'low') {
        newAnswers[q.id] = q.isReversed ? 3 : (instrument === 'ZARIT_ZBI12' ? 0 : 1);
      } else if (preset === 'moderate') {
        newAnswers[q.id] = 2;
      } else {
        newAnswers[q.id] = q.isReversed ? 0 : (instrument === 'ZARIT_ZBI12' ? 3 : 4);
      }
    });
    setAnswers(newAnswers);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isComplete) return;

    const newEntry: StressAssessmentEntry = {
      id: `assessment-${Date.now()}`,
      date: new Date().toISOString(),
      instrument,
      answers,
      totalScore: currentScore,
      maxScore,
      normalizedPercentage: normPct,
      severity,
      notes: notes.trim() || undefined,
      careRecipientCondition: careCondition,
    };

    onSaveAssessment(newEntry);
  };

  const activeQuestion = questions[currentStep] || questions[0];

  return (
    <div className="space-y-6">
      {/* Instrument Selection Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-2 bg-muted/60 rounded-2xl border">
        <div className="flex items-center gap-2 px-2">
          <Scale className="h-5 w-5 text-primary" />
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Select Standardized Battery:
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant={instrument === 'ZARIT_ZBI12' ? 'default' : 'outline'}
            onClick={() => handleSwitchInstrument('ZARIT_ZBI12')}
            className="text-xs font-semibold rounded-xl"
          >
            ⭐ Zarit Burden Scale (ZBI-12)
          </Button>
          <Button
            type="button"
            size="sm"
            variant={instrument === 'COHEN_PSS10' ? 'default' : 'outline'}
            onClick={() => handleSwitchInstrument('COHEN_PSS10')}
            className="text-xs font-semibold rounded-xl"
          >
            Sheldon Cohen Stress (PSS-10)
          </Button>
        </div>
      </div>

      {/* Main Questionnaire Card */}
      <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5 shadow-md">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary font-semibold">
                  {instrument === 'ZARIT_ZBI12' ? 'Caregiver-Specific Burden' : 'Perceived Stress Scale'}
                </Badge>
                <Badge variant="secondary" className="text-xs font-mono">
                  {instrument === 'ZARIT_ZBI12' ? 'Zarit ZBI-12' : 'Cohen PSS-10'}
                </Badge>
              </div>
              <CardTitle className="font-headline text-2xl">
                {instrument === 'ZARIT_ZBI12'
                  ? 'Zarit Caregiver Burden Interview (ZBI-12)'
                  : 'Sheldon Cohen Perceived Stress Scale (PSS-10)'}
              </CardTitle>
              <CardDescription className="text-sm">
                {instrument === 'ZARIT_ZBI12'
                  ? 'The worldwide gold standard for assessing caregiver strain, role captivity, and physical/emotional exhaustion.'
                  : 'Measures how unpredictable, uncontrollable, and overloaded your life has felt during the past month.'}
              </CardDescription>
            </div>

            {/* View Mode & Quick Demo Fill */}
            <div className="flex items-center gap-2 pt-2 md:pt-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode(viewMode === 'stepper' ? 'full' : 'stepper')}
                className="text-xs"
              >
                {viewMode === 'stepper' ? 'Show All Questions' : 'Step-by-Step Mode'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleQuickFill('moderate')}
                className="text-xs text-muted-foreground hover:text-foreground"
                title="Quickly fill sample answers"
              >
                <Sparkles className="mr-1 h-3.5 w-3.5" /> Sample Fill
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Progress Bar & Live Score Badge */}
        <CardContent className="space-y-3 pt-0">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Progress: <strong className="text-foreground">{answeredCount} of {totalQuestions}</strong> answered
            </span>
            {answeredCount > 0 && (
              <span className="font-medium">
                Live Score: <span className="font-bold text-foreground">{currentScore}/{maxScore}</span> ({info.title})
              </span>
            )}
          </div>
          <Progress value={progressPercent} className="h-2" />
        </CardContent>
      </Card>

      {/* Stepper View */}
      {viewMode === 'stepper' && (
        <Card className="shadow-lg border-border/80">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Question {currentStep + 1} of {totalQuestions}
              </span>
              {activeQuestion.isReversed ? (
                <Badge variant="outline" className="text-[11px] text-muted-foreground border-dashed">
                  Positive Resilience Item (Reverse Scored)
                </Badge>
              ) : activeQuestion.domain ? (
                <Badge variant="secondary" className="text-[10px] uppercase font-mono">
                  Domain: {activeQuestion.domain.replace('_', ' ')}
                </Badge>
              ) : null}
            </div>
            <CardTitle className="font-headline text-xl leading-snug pt-2">
              {activeQuestion.question}
            </CardTitle>
            <CardDescription className="text-xs flex items-center gap-1.5 pt-1 text-muted-foreground">
              <Info className="h-3.5 w-3.5 shrink-0 text-primary" />
              {activeQuestion.explanation}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {LIKERT_OPTIONS.map((opt) => {
                const qId = activeQuestion.id;
                const isSelected = answers[qId] === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelectOption(qId, opt.value)}
                    className={cn(
                      'flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                      isSelected
                        ? 'bg-primary text-primary-foreground border-primary shadow-md scale-[1.02]'
                        : 'bg-card hover:bg-accent/50 hover:border-primary/40 text-card-foreground'
                    )}
                  >
                    <span className="text-sm font-bold">{opt.label}</span>
                    <span
                      className={cn(
                        'text-xs mt-1 font-mono',
                        isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'
                      )}
                    >
                      {opt.scoreDescription}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Stepper Navigation Controls */}
            <div className="flex items-center justify-between pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
                disabled={currentStep === 0}
              >
                <ChevronLeft className="mr-1 h-4 w-4" /> Previous
              </Button>

              <div className="flex items-center gap-1">
                {questions.map((q, idx) => (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentStep(idx)}
                    className={cn(
                      'h-2.5 w-2.5 rounded-full transition-all',
                      idx === currentStep
                        ? 'w-6 bg-primary'
                        : answers[q.id] !== undefined
                        ? 'bg-primary/40'
                        : 'bg-secondary'
                    )}
                    aria-label={`Jump to question ${idx + 1}`}
                  />
                ))}
              </div>

              <Button
                type="button"
                variant={currentStep === totalQuestions - 1 ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentStep((prev) => Math.min(totalQuestions - 1, prev + 1))}
                disabled={currentStep === totalQuestions - 1}
              >
                Next <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Full View (All Questions on Single Page) */}
      {viewMode === 'full' && (
        <div className="space-y-4">
          {questions.map((q, idx) => {
            const isAnswered = answers[q.id] !== undefined;
            return (
              <Card
                key={q.id}
                className={cn(
                  'transition-all duration-200',
                  isAnswered ? 'border-primary/30 bg-card' : 'border-border/60 bg-card/60'
                )}
              >
                <CardHeader className="py-3 px-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {idx + 1}
                        </span>
                        <CardTitle className="text-base font-semibold">{q.question}</CardTitle>
                      </div>
                      <p className="text-xs text-muted-foreground pl-8">{q.explanation}</p>
                    </div>
                    {q.isReversed ? (
                      <Badge variant="outline" className="text-[10px] whitespace-nowrap">
                        Reversed
                      </Badge>
                    ) : q.domain ? (
                      <Badge variant="secondary" className="text-[10px] whitespace-nowrap uppercase font-mono">
                        {q.domain.replace('_', ' ')}
                      </Badge>
                    ) : null}
                  </div>
                </CardHeader>

                <CardContent className="py-3 px-5 pl-8">
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {LIKERT_OPTIONS.map((opt) => {
                      const isSelected = answers[q.id] === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handleSelectOption(q.id, opt.value)}
                          className={cn(
                            'p-2.5 rounded-lg border text-center transition-all text-xs font-medium focus:outline-none',
                            isSelected
                              ? 'bg-primary text-primary-foreground border-primary shadow-sm font-semibold'
                              : 'bg-secondary/40 hover:bg-secondary text-secondary-foreground'
                          )}
                        >
                          <div>{opt.label}</div>
                          <div
                            className={cn(
                              'text-[10px]',
                              isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground'
                            )}
                          >
                            {opt.scoreDescription}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Context Details (Care Condition & Notes) */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-headline">Clinical Context & Observation Notes</CardTitle>
          <CardDescription className="text-xs">
            Documenting the primary care condition and personal context helps track changes in stress score over time.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="care-condition" className="text-xs font-semibold">
              Primary Care Recipient Condition
            </Label>
            <Input
              id="care-condition"
              value={careCondition}
              onChange={(e) => setCareCondition(e.target.value)}
              placeholder="e.g. Dementia, Stroke Recovery, Parkinson's, Frailty"
              className="text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="assessment-notes" className="text-xs font-semibold">
              Caregiver Reflection / Notes (Optional)
            </Label>
            <Textarea
              id="assessment-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Struggled with nighttime confusion, feeling exhausted from medication schedule..."
              rows={2}
              className="text-sm resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Live Result Summary & Submission */}
      {isComplete ? (
        <Card
          className={cn(
            'border-2 shadow-xl transition-all duration-300 animate-fade-in',
            info.borderClass,
            info.bgLight
          )}
        >
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Assessment Completed ({instrument === 'ZARIT_ZBI12' ? 'Zarit ZBI-12' : 'Cohen PSS-10'})
                </span>
                <CardTitle className="font-headline text-2xl flex items-center gap-2 mt-1">
                  Score: <span className="font-extrabold text-3xl">{currentScore}/{maxScore}</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    ({normPct}% Burden Index)
                  </span>
                </CardTitle>
              </div>
              <Badge
                variant={info.badgeVariant}
                className="text-sm px-3 py-1 font-semibold self-start sm:self-auto"
              >
                {info.title}
              </Badge>
            </div>
            <CardDescription className="text-sm font-medium pt-2 text-foreground/90">
              {info.description}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3 text-xs text-muted-foreground border-t pt-3">
            <div>
              <strong className="text-foreground">Clinical Interpretation:</strong> {info.clinicalMeaning}
            </div>
            <div>
              <strong className="text-foreground">Recommended Next Step:</strong> {info.recommendedAction}
            </div>
          </CardContent>

          <CardFooter className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t bg-card/60">
            <p className="text-xs text-muted-foreground">
              Saving will update your longitudinal burden curve and generate a targeted Rescue Plan.
            </p>
            <Button
              type="button"
              onClick={handleSubmit}
              className="w-full sm:w-auto font-bold shadow-lg"
              size="lg"
            >
              <CheckCircle2 className="mr-2 h-5 w-5" /> Save & Generate Rescue Plan
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl border border-dashed bg-muted/40 text-muted-foreground text-xs gap-3">
          <span>
            Please answer all <strong>{totalQuestions}</strong> questions to calculate your complete {instrument === 'ZARIT_ZBI12' ? 'Zarit Burden' : 'Cohen PSS'} score and view your rescue plan.
          </span>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => handleQuickFill('moderate')}
            className="shrink-0"
          >
            Auto-Fill Sample
          </Button>
        </div>
      )}
    </div>
  );
}
