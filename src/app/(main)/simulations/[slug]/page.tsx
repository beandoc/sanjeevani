'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, ArrowRight, ArrowLeft, ShieldAlert, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { simulationsData } from '@/lib/simulations-data';

export default function SimulationDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const sim = simulationsData[slug];

  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  if (!sim) {
    return (
      <div className="p-8 text-center space-y-4 max-w-md mx-auto">
        <ShieldAlert className="w-12 h-12 text-destructive mx-auto" />
        <h2 className="text-xl font-bold">Simulation Case Not Found</h2>
        <p className="text-xs text-muted-foreground">The requested clinical scenario does not exist.</p>
        <Link href="/simulations">
          <Button size="sm">Return to Simulation Lab</Button>
        </Link>
      </div>
    );
  }

  const handleSubmit = () => {
    if (selectedOption === null) return;
    setHasSubmitted(true);
  };

  const handleReset = () => {
    setSelectedOption(null);
    setHasSubmitted(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4 sm:p-6">
      <Link href="/simulations">
        <Button variant="outline" size="sm" className="gap-2 text-xs">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to All 21 Simulation Cases
        </Button>
      </Link>

      {/* Case Header Card */}
      <Card className="border-border bg-card/80 shadow-md overflow-hidden">
        <CardHeader className="border-b border-border/60 bg-muted/20 pb-4">
          <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
            <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-wider">
              {sim.category}
            </Badge>
            <span className="text-xs text-primary font-bold font-mono">Case Protocol #{slug}</span>
          </div>
          <CardTitle className="text-2xl font-bold font-headline">{sim.title}</CardTitle>
          <CardDescription className="text-xs font-semibold text-primary/90 mt-1">
            Patient Profile: {sim.patientProfile}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Clinical Scenario Description */}
          <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 space-y-2">
            <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-primary" /> Observed Clinical Situation
            </span>
            <p className="text-sm text-foreground font-medium leading-relaxed">{sim.scenario}</p>
            <p className="text-xs text-muted-foreground font-medium pt-1">
              <strong>Key Vulnerability:</strong> {sim.condition}
            </p>
          </div>

          {/* Question / Triage Decision Options */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-foreground">
              What is your immediate, safest clinical action?
            </h3>

            <div className="space-y-2.5">
              {sim.options.map((opt, idx) => {
                const isSelected = selectedOption === idx;
                let cardStyle = 'border-border bg-background hover:border-primary/50';

                if (hasSubmitted) {
                  if (opt.isCorrect) {
                    cardStyle = 'border-emerald-500/80 bg-emerald-500/10 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200';
                  } else if (isSelected && !opt.isCorrect) {
                    cardStyle = 'border-destructive bg-destructive/10 text-destructive';
                  } else {
                    cardStyle = 'border-border/50 bg-background/50 opacity-60';
                  }
                } else if (isSelected) {
                  cardStyle = 'border-primary bg-primary/5 shadow-sm';
                }

                return (
                  <div
                    key={idx}
                    onClick={() => !hasSubmitted && setSelectedOption(idx)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 ${cardStyle}`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                        isSelected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-muted-foreground/40 text-muted-foreground'
                      }`}
                    >
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <p className="text-xs sm:text-sm font-medium leading-relaxed">{opt.text}</p>
                      {hasSubmitted && (
                        <div className="pt-2 border-t border-border/40 text-xs space-y-1">
                          <p className="font-semibold flex items-center gap-1.5">
                            {opt.isCorrect ? (
                              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 className="w-4 h-4" /> Correct Choice
                              </span>
                            ) : (
                              <span className="text-destructive flex items-center gap-1">
                                <XCircle className="w-4 h-4" /> Incorrect Action
                              </span>
                            )}
                          </p>
                          <p className="text-foreground/85 leading-relaxed">{opt.feedback}</p>
                          <p className="text-primary font-medium text-[11px] pt-0.5">
                            <strong>Clinical Protocol:</strong> {opt.recommendation}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-6 bg-muted/20 border-t border-border/60 flex items-center justify-between">
          {!hasSubmitted ? (
            <Button
              onClick={handleSubmit}
              disabled={selectedOption === null}
              className="font-bold text-xs gap-2 ml-auto shadow-md"
            >
              <span>Submit Clinical Decision</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          ) : (
            <div className="flex items-center justify-between w-full">
              <Button variant="outline" size="sm" onClick={handleReset} className="text-xs font-semibold">
                Retry Case
              </Button>
              <Link href="/simulations">
                <Button size="sm" className="font-bold text-xs gap-1.5 shadow-md">
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
