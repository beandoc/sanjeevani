'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  ArrowLeft,
  ShieldAlert,
  BookOpen,
  UserRound,
  AlertCircle,
  Activity,
  Pill,
  Stethoscope,
  HeartHandshake,
  Brain,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import Link from 'next/link';
import { simulationsData } from '@/lib/simulations-data';

interface CategoryConfig {
  icon: React.ElementType;
  badgeClass: string;
  stripe: string;
}

const categoryStyles: Record<string, CategoryConfig> = {
  'Emergency & Safety': {
    icon: ShieldAlert,
    badgeClass: 'text-rose-700 dark:text-rose-300 bg-rose-500/10 border-rose-500/20',
    stripe: 'from-rose-500 via-red-500 to-rose-600',
  },
  'Medication Safety': {
    icon: Pill,
    badgeClass: 'text-amber-700 dark:text-amber-300 bg-amber-500/10 border-amber-500/20',
    stripe: 'from-amber-500 via-orange-500 to-amber-600',
  },
  'Clinical Care': {
    icon: Stethoscope,
    badgeClass: 'text-blue-700 dark:text-blue-300 bg-blue-500/10 border-blue-500/20',
    stripe: 'from-blue-500 via-cyan-500 to-indigo-600',
  },
  'Practical Nursing': {
    icon: HeartHandshake,
    badgeClass: 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/20',
    stripe: 'from-emerald-500 via-teal-500 to-emerald-600',
  },
  'Dementia Care': {
    icon: Brain,
    badgeClass: 'text-purple-700 dark:text-purple-300 bg-purple-500/10 border-purple-500/20',
    stripe: 'from-purple-500 via-violet-500 to-purple-600',
  },
  'Caregiver Wellness': {
    icon: Sparkles,
    badgeClass: 'text-teal-700 dark:text-teal-300 bg-teal-500/10 border-teal-500/20',
    stripe: 'from-teal-500 via-emerald-500 to-cyan-600',
  },
};

const defaultCategoryStyle: CategoryConfig = {
  icon: Activity,
  badgeClass: 'text-primary bg-primary/10 border-primary/20',
  stripe: 'from-primary to-blue-600',
};

function parsePatientProfile(profile: string) {
  const match = profile.match(/^([^(]+)\s*\((.+)\)$/);
  if (match) {
    return {
      name: match[1].trim(),
      details: match[2].trim(),
    };
  }
  return {
    name: profile,
    details: '',
  };
}

export default function SimulationDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const sim = simulationsData[slug];

  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  if (!sim) {
    return (
      <div className="p-8 text-center space-y-4 max-w-md mx-auto my-12 rounded-3xl border border-border/80 bg-card shadow-sm">
        <ShieldAlert className="w-12 h-12 text-destructive mx-auto" />
        <h2 className="text-xl font-bold font-headline">Simulation Case Not Found</h2>
        <p className="text-xs text-muted-foreground">The requested clinical scenario does not exist or has moved.</p>
        <Link href="/simulations">
          <Button size="sm" className="rounded-xl">Return to Simulation Lab</Button>
        </Link>
      </div>
    );
  }

  const catStyle = categoryStyles[sim.category] || defaultCategoryStyle;
  const CategoryIcon = catStyle.icon;
  const patient = parsePatientProfile(sim.patientProfile);

  const handleSubmit = () => {
    if (selectedOption === null) return;
    setHasSubmitted(true);
    try {
      const saved = localStorage.getItem('sanjeevani_simulations_progress');
      const progress = saved ? JSON.parse(saved) : {};
      const isCorrect = sim.options[selectedOption]?.isCorrect || false;
      progress[slug] = {
        completed: true,
        isCorrect,
        selectedOption,
        timestamp: Date.now(),
      };
      localStorage.setItem('sanjeevani_simulations_progress', JSON.stringify(progress));
    } catch {
      // ignore
    }
  };

  const handleReset = () => {
    setSelectedOption(null);
    setHasSubmitted(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4 sm:p-6 pb-16">
      {/* Navigation & Breadcrumb */}
      <div className="flex items-center justify-between gap-3">
        <Link href="/simulations">
          <Button variant="outline" size="sm" className="gap-2 text-xs rounded-xl shadow-2xs hover:bg-muted">
            <ArrowLeft className="w-3.5 h-3.5" /> All 21 Simulation Cases
          </Button>
        </Link>
        <span className="text-xs font-mono text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-md">
          Case #{slug}
        </span>
      </div>

      {/* Case Header Card */}
      <Card className="border-border/80 bg-card shadow-lg rounded-3xl overflow-hidden">
        {/* Top Category Gradient Stripe */}
        <div className={`h-2 w-full bg-gradient-to-r ${catStyle.stripe}`} />

        <CardHeader className="border-b border-border/60 bg-muted/10 p-6 sm:p-8 pb-6">
          <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${catStyle.badgeClass}`}
            >
              <CategoryIcon className="w-3.5 h-3.5" />
              <span>{sim.category}</span>
            </span>
            <span className="text-xs text-primary font-bold font-mono bg-primary/10 px-2.5 py-1 rounded-lg">
              Clinical Protocol
            </span>
          </div>

          <CardTitle className="text-2xl sm:text-3xl font-extrabold font-headline leading-snug text-foreground">
            {sim.title}
          </CardTitle>

          {/* Patient Profile Demographics Card */}
          <div className="mt-4 rounded-2xl bg-card border border-border/70 p-4 shadow-2xs flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
              <UserRound className="w-5 h-5" />
            </div>
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-foreground">{patient.name}</span>
                <span className="text-[10px] uppercase font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  Patient Demographics
                </span>
              </div>
              {patient.details && (
                <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                  {patient.details}
                </p>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 sm:p-8 space-y-6">
          {/* Clinical Scenario Description */}
          <div className="p-5 rounded-2xl bg-muted/30 border border-border/70 space-y-3">
            <span className="text-[11px] uppercase font-bold text-muted-foreground flex items-center gap-1.5 tracking-wider">
              <BookOpen className="w-4 h-4 text-primary" /> Observed Clinical Situation
            </span>
            <p className="text-sm sm:text-base text-foreground font-medium leading-relaxed">
              &ldquo;{sim.scenario}&rdquo;
            </p>

            {/* Key Clinical Vulnerability Box */}
            {sim.condition && (
              <div className="pt-2 border-t border-border/50">
                <div className="rounded-xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/20 p-3 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs leading-relaxed">
                    <strong className="text-amber-800 dark:text-amber-300 font-bold">
                      Key Clinical Vulnerability:{' '}
                    </strong>
                    <span className="text-amber-900/90 dark:text-amber-200/90 font-medium">
                      {sim.condition}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Question / Triage Decision Options */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm sm:text-base font-bold text-foreground font-headline">
                What is your immediate, safest clinical triage action?
              </h3>
              <span className="text-xs text-muted-foreground font-medium">
                Select one option
              </span>
            </div>

            <div className="space-y-3">
              {sim.options.map((opt, idx) => {
                const isSelected = selectedOption === idx;
                let cardStyle =
                  'border-border/80 bg-card hover:border-primary/50 hover:bg-muted/30 shadow-2xs';

                if (hasSubmitted) {
                  if (opt.isCorrect) {
                    cardStyle =
                      'border-emerald-500/80 bg-emerald-500/10 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 shadow-sm';
                  } else if (isSelected && !opt.isCorrect) {
                    cardStyle =
                      'border-destructive bg-destructive/10 text-destructive shadow-sm';
                  } else {
                    cardStyle = 'border-border/40 bg-background/50 opacity-60';
                  }
                } else if (isSelected) {
                  cardStyle =
                    'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm';
                }

                return (
                  <div
                    key={idx}
                    role="radio"
                    aria-checked={isSelected}
                    tabIndex={hasSubmitted ? -1 : 0}
                    onClick={() => !hasSubmitted && setSelectedOption(idx)}
                    onKeyDown={(e) => {
                      if (!hasSubmitted && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        setSelectedOption(idx);
                      }
                    }}
                    className={`p-4 sm:p-5 rounded-2xl border-2 transition-all duration-200 cursor-pointer flex items-start gap-3.5 ${cardStyle}`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full border-2 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 transition-colors ${
                        isSelected
                          ? 'border-primary bg-primary text-primary-foreground shadow-xs'
                          : 'border-muted-foreground/40 text-muted-foreground bg-muted/40'
                      }`}
                    >
                      {String.fromCharCode(65 + idx)}
                    </div>

                    <div className="space-y-2 flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium leading-relaxed">{opt.text}</p>

                      {hasSubmitted && (
                        <div className="pt-3 border-t border-border/40 text-xs space-y-1.5 animate-fade-in">
                          <p className="font-bold flex items-center gap-1.5">
                            {opt.isCorrect ? (
                              <span className="text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                                <CheckCircle2 className="w-4 h-4" /> Correct Choice & Clinical Standard
                              </span>
                            ) : (
                              <span className="text-destructive flex items-center gap-1">
                                <XCircle className="w-4 h-4" /> Suboptimal or Contraindicated Action
                              </span>
                            )}
                          </p>
                          <p className="text-foreground/90 leading-relaxed font-normal">{opt.feedback}</p>
                          <div className="p-2.5 rounded-xl bg-background/80 border border-border/60 text-[11px] leading-relaxed mt-1.5">
                            <strong className="text-primary font-bold">Evidence Protocol: </strong>
                            <span className="text-muted-foreground font-medium">{opt.recommendation}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-6 sm:p-8 bg-muted/20 border-t border-border/60 flex items-center justify-between gap-3">
          {!hasSubmitted ? (
            <Button
              onClick={handleSubmit}
              disabled={selectedOption === null}
              size="lg"
              className="font-bold text-xs sm:text-sm gap-2 ml-auto shadow-md rounded-xl px-6"
            >
              <span>Submit Clinical Decision</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <div className="flex items-center justify-between w-full gap-3 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="text-xs font-semibold gap-1.5 rounded-xl shadow-2xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry Scenario</span>
              </Button>
              <Link href="/simulations">
                <Button size="sm" className="font-bold text-xs gap-1.5 shadow-md rounded-xl">
                  <span>Explore More Cases</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
