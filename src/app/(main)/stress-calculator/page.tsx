'use client';

import React, { useState, useEffect } from 'react';
import { ZaritCalculator } from '@/components/stress/zarit-calculator';
import { ZaritResultsView } from '@/components/stress/zarit-results-view';
import { ZaritEvaluationResult } from '@/lib/zarit-scale';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  HeartPulse,
  Brain,
  ShieldCheck,
  Award,
  Sparkles,
  Info,
  Clock,
  ArrowRight,
  BookOpen,
  Users,
  Activity
} from 'lucide-react';
import Link from 'next/link';

import { HealthRepository } from '@/lib/db/health-repository';
import { syncZaritAssessment } from '@/lib/firebase/clinical-sync';

export default function StressCalculatorPage() {
  const [currentResult, setCurrentResult] = useState<ZaritEvaluationResult | null>(null);
  const [history, setHistory] = useState<ZaritEvaluationResult[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setHistory(HealthRepository.getZaritAssessments());
  }, []);

  const handleComplete = (res: ZaritEvaluationResult) => {
    setCurrentResult(res);
    const updated = HealthRepository.saveZaritAssessment(res);
    setHistory(updated);
    // Best-effort mirror to Firestore so a clinician (if granted access) can
    // see it on the clinician dashboard. Never blocks or fails the local
    // save above, which remains the source of truth for this device.
    void syncZaritAssessment(res);
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRetake = () => {
    setCurrentResult(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-6xl space-y-8">
      {/* Top Clinical Breadcrumb / Intro */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            <span>Sanjeevani Clinical Care</span>
            <span>•</span>
            <span className="text-primary font-bold">Caregiver Fatigue & Burden Assessment</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <HeartPulse className="w-8 h-8 text-primary" />
            Caregiver Stress & Burden Gauge
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/assessment-guide">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs font-semibold">
              <BookOpen className="w-4 h-4" /> Clinical Guide
            </Button>
          </Link>
          <Link href="/modules">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs font-semibold">
              <Brain className="w-4 h-4" /> Learning Modules
            </Button>
          </Link>
        </div>
      </div>

      {/* Conditional View: In-Progress Calculator OR Completed Results */}
      {currentResult ? (
        <ZaritResultsView
          result={currentResult}
          onRetake={handleRetake}
          pastAssessments={history}
        />
      ) : (
        <div className="space-y-8">
          {/* Information & Clinical Background Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-border/80 bg-primary/5 shadow-sm">
              <CardContent className="p-5 flex items-start gap-3.5">
                <div className="p-2 rounded-xl bg-primary/10 text-primary mt-0.5">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground">Standardized ZBI Psychometrics</h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Evaluates multi-factorial caregiver strain based on the internationally validated Zarit Burden Interview.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/80 bg-muted/20 shadow-sm">
              <CardContent className="p-5 flex items-start gap-3.5">
                <div className="p-2 rounded-xl bg-muted text-muted-foreground mt-0.5">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground">Burnout & Crisis Prevention</h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Early identification of acute health degradation and caregiver role collapse before emergencies occur.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/80 bg-muted/20 shadow-sm">
              <CardContent className="p-5 flex items-start gap-3.5">
                <div className="p-2 rounded-xl bg-muted text-muted-foreground mt-0.5">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground">Automated Respite Prescriptions</h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Provides tailored action plans, respite care vouchers, tele-consultations, and task-sharing recommendations.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Interactive Calculator Engine */}
          <ZaritCalculator onComplete={handleComplete} />
        </div>
      )}
    </div>
  );
}
