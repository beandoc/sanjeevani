'use client';

import React, { useState, useMemo } from 'react';
import { ZaritEvaluationResult, ZbiFactor } from '@/lib/zarit-scale';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  AlertTriangle,
  ShieldAlert,
  HeartPulse,
  Award,
  CheckCircle2,
  FileText,
  RotateCcw,
  Sparkles,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Clock,
  Calendar,
  PhoneCall,
  Download,
  Share2,
  ExternalLink,
  ChevronRight,
  Activity,
  Layers
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { CrisisEscalationModal } from '@/components/crisis/crisis-escalation-modal';
import { SEVERITY_CONFIGS } from '@/lib/clinical/severity-theme';
import { computeTrajectory } from '@/lib/analytics/trajectory';

interface ZaritResultsViewProps {
  result: ZaritEvaluationResult;
  onRetake: () => void;
  lang?: 'en' | 'hi' | 'mr';
  pastAssessments?: ZaritEvaluationResult[];
}

export function ZaritResultsView({
  result,
  onRetake,
  lang = 'en',
  pastAssessments = []
}: ZaritResultsViewProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'factors' | 'prescriptions' | 'history'>('overview');

  const [isCrisisModalOpen, setIsCrisisModalOpen] = useState(false);
  const config = SEVERITY_CONFIGS[result?.severityBand] || SEVERITY_CONFIGS.normal;
  const redFlags = result?.redFlags || [];
  const prescriptions = result?.prescriptions || [];
  const domainCapacities = result?.domainCapacities || {};
  const factors = result?.factors || {};

  // The caregiver-facing trend. computeTrajectory is otherwise clinician-only
  // (roster/dyad pages); pastAssessments already includes the just-completed
  // result (health-repository returns it in saveZaritAssessment's response),
  // so this reflects the same series clinicians see, without a Barthel axis.
  const trajectory = useMemo(() => computeTrajectory(pastAssessments, []), [pastAssessments]);
  const priorAssessment = pastAssessments.find((a) => a.completedAt !== result?.completedAt);
  const scoreDelta =
    priorAssessment && result ? result.normalizedPercentage - priorAssessment.normalizedPercentage : null;

  const classificationText = typeof result?.classification === 'string'
    ? result.classification
    : (result?.classification?.[lang] || result?.classification?.en || 'Burden Assessment');

  const formatSafeDate = (isoString?: string) => {
    if (!isoString) return 'Recently';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return 'Recently';
      return d.toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short'
      });
    } catch {
      return 'Recently';
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <CrisisEscalationModal
        isOpen={isCrisisModalOpen}
        onClose={() => setIsCrisisModalOpen(false)}
        severityReason={redFlags.length > 0 ? redFlags.join(' • ') : `Zarit Burden Score: ${result?.totalScore || 0}/${result?.maxScore || 88}`}
        isSelfHarmBranch={Boolean(result?.isCrisisTriggered)}
      />

      {/* Top Banner Alert if Red Flags Exist */}
      {result?.isCrisisTriggered && (
        <div className="p-4 sm:p-5 rounded-2xl bg-destructive/10 border-2 border-destructive/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in-50">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-destructive/20 text-destructive mt-0.5 animate-pulse">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-destructive text-base sm:text-lg flex items-center gap-2">
                Clinical Safety & Crisis Escalation Triggered
              </h4>
              <p className="text-xs sm:text-sm text-destructive/90 mt-1 font-medium">
                {redFlags.length > 0 ? redFlags.join(' • ') : 'Severe caregiver fatigue requires immediate escalation.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsCrisisModalOpen(true)}
              className="gap-2 font-bold shadow-md whitespace-nowrap"
            >
              <PhoneCall className="w-4 h-4" /> Trigger Crisis Protocol
            </Button>
          </div>
        </div>
      )}

      {/* Main Score & Severity Diagnostic Card */}
      <Card className="border-border shadow-lg overflow-hidden">
        <div className={cn('p-6 sm:p-8 border-b transition-colors', config.bgColor)}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge className={cn('font-bold text-xs px-3 py-1 shadow-sm', config.badgeBg)}>
                  {result?.tier || 'ZBI'} Assessment Complete
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  {formatSafeDate(result?.completedAt)}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                {classificationText}
              </h2>
              <p className="text-sm text-foreground/80 max-w-2xl leading-relaxed">
                {config.desc[lang] || config.desc.en}
              </p>
            </div>

            {/* Score Ring Visualizer */}
            <div className="flex flex-col items-center justify-center p-5 bg-background/80 backdrop-blur-md rounded-2xl border border-border/80 shadow-md min-w-[160px]">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Burden Score</span>
              <div className="flex items-baseline gap-1 my-1">
                <span className={cn('text-4xl sm:text-5xl font-black font-mono', config.color)}>
                  {result?.totalScore ?? 0}
                </span>
                <span className="text-sm font-bold text-muted-foreground">/ {result?.maxScore ?? 88}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 mt-2 overflow-hidden">
                <div
                  className={cn('h-full transition-all duration-500', config.badgeBg)}
                  style={{ width: `${result?.normalizedPercentage ?? 0}%` }}
                />
              </div>
              <span className="text-[11px] font-bold text-muted-foreground mt-1.5">
                {result?.normalizedPercentage ?? 0}% Scaled Strain
              </span>
              {scoreDelta !== null && (
                <span
                  className={cn(
                    'text-[11px] font-bold mt-1 flex items-center gap-1',
                    scoreDelta > 0 ? 'text-rose-500' : scoreDelta < 0 ? 'text-emerald-500' : 'text-muted-foreground'
                  )}
                >
                  {scoreDelta > 0 ? (
                    <TrendingUp className="w-3.5 h-3.5" />
                  ) : scoreDelta < 0 ? (
                    <TrendingDown className="w-3.5 h-3.5" />
                  ) : null}
                  {scoreDelta === 0
                    ? 'No change since last assessment'
                    : `${scoreDelta > 0 ? '+' : ''}${scoreDelta} pts vs. last assessment`}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-border/60 bg-muted/20 px-6 gap-2 sm:gap-6 overflow-x-auto text-xs sm:text-sm font-semibold">
          <button
            onClick={() => setActiveTab('overview')}
            className={cn(
              'py-3.5 border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5',
              activeTab === 'overview'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <Activity className="w-4 h-4" /> Overview & Prescriptions
          </button>
          <button
            onClick={() => setActiveTab('factors')}
            className={cn(
              'py-3.5 border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5',
              activeTab === 'factors'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <Layers className="w-4 h-4" /> Subscale Factor Breakdown
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={cn(
              'py-3.5 border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5',
              activeTab === 'history'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <Calendar className="w-4 h-4" /> Longitudinal History ({pastAssessments.length})
          </button>
        </div>

        <CardContent className="p-6 sm:p-8">
          {/* TAB 1: OVERVIEW & PRESCRIPTIONS */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Prescriptions Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      Targeted Caregiver Support Suggestions
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Personalized action steps generated from ZBI score plus Sanjeevani triage rules.
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs font-semibold">
                    {prescriptions.length} Suggested Actions
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {prescriptions.map((rx) => {
                    const isUrgent = rx?.urgency === 'urgent';
                    const rxTitle = typeof rx?.title === 'string' ? rx.title : (rx?.title?.[lang] || rx?.title?.en || 'Clinical Recommendation');
                    const rxAction = typeof rx?.action === 'string' ? rx.action : (rx?.action?.[lang] || rx?.action?.en || '');
                    return (
                      <div
                        key={rx.id || Math.random()}
                        className={cn(
                          'p-5 rounded-2xl border transition-all flex flex-col justify-between',
                          isUrgent
                            ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60 shadow-sm'
                            : 'bg-card border-border/80 hover:border-primary/40 shadow-sm'
                        )}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] uppercase font-bold tracking-wider text-muted-foreground">
                              {rx.category || 'Prescription'}
                            </span>
                            <Badge
                              variant={isUrgent ? 'destructive' : 'secondary'}
                              className="text-[10px] font-bold uppercase tracking-wider"
                            >
                              {rx.urgency || 'routine'}
                            </Badge>
                          </div>
                          <h4 className="font-bold text-base text-foreground mb-1.5">
                            {rxTitle}
                          </h4>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {rxAction}
                          </p>
                        </div>

                        {rx.recommendedLink && (
                          <div className="mt-4 pt-3 border-t border-border/60">
                            <Link href={rx.recommendedLink}>
                              <Button
                                size="sm"
                                variant={isUrgent ? 'destructive' : 'outline'}
                                className="w-full gap-1.5 text-xs font-bold justify-between"
                              >
                                <span>{rx.linkText?.[lang] || rx.linkText?.en || 'Open Resource'}</span>
                                <ChevronRight className="w-4 h-4" />
                              </Button>
                            </Link>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Matched Dyad Domain Capacities (CCFM Interoperability) */}
              <div className="p-5 rounded-2xl bg-muted/30 border border-border/60">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                      <HeartPulse className="w-4 h-4 text-primary" />
                      Caregiver Domain Capacity Ratings (CCFM Scale)
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Calculates available support capacity across the 6 clinical dyad domains (100 = Full Capacity, 0 = Depleted).
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs font-mono">0 - 100% Ruler</Badge>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mt-4">
                  {Object.entries(domainCapacities).map(([dom, cap]) => {
                    const isMeasured = cap !== null && cap !== undefined;
                    const isLow = isMeasured && (cap as number) < 50;
                    return (
                      <div key={dom} className="p-3 rounded-xl bg-card border border-border/60 text-center">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block truncate">
                          {dom.replace('_', ' ')}
                        </span>
                        <span className={cn('text-xl font-extrabold font-mono my-1 block', !isMeasured ? 'text-muted-foreground text-base font-medium' : isLow ? 'text-rose-500' : 'text-primary')}>
                          {isMeasured ? `${cap}%` : 'N/A'}
                        </span>
                        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                          <div
                            className={cn('h-full', isLow ? 'bg-rose-500' : 'bg-primary')}
                            style={{ width: `${isMeasured ? (cap as number) : 0}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FACTOR BREAKDOWN */}
          {activeTab === 'factors' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold tracking-tight text-foreground">
                  Psychometric Factor Breakdown
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Detailed analysis of the 6 underlying drivers of caregiver burden from the Zarit scale.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(Object.entries(factors) as [ZbiFactor, typeof result.factors[ZbiFactor]][]).map(([key, factor]) => {
                  if (!factor || !factor.isMeasured) {
                    const factorTitle = factor?.title?.[lang] || factor?.title?.en || key.replace('_', ' ');
                    const clinicalNote = factor?.clinicalNote?.[lang] || factor?.clinicalNote?.en || 'Not assessed in this tier.';
                    return (
                      <div key={key} className="p-5 rounded-2xl bg-muted/30 border border-border/50 space-y-2 opacity-65">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-sm text-muted-foreground capitalize">
                            {factorTitle}
                          </h4>
                          <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground">
                            Unassessed in {result?.tier || 'Current Tier'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {clinicalNote}
                        </p>
                      </div>
                    );
                  }

                  const isHigh = (factor.percentage ?? 0) >= 50;
                  const factorTitle = factor.title?.[lang] || factor.title?.en || key.replace('_', ' ');
                  const clinicalNote = factor.clinicalNote?.[lang] || factor.clinicalNote?.en || '';
                  return (
                    <div key={key} className="p-5 rounded-2xl bg-card border border-border/80 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sm text-foreground capitalize">
                          {factorTitle}
                        </h4>
                        <Badge variant={isHigh ? 'destructive' : 'secondary'} className="text-xs font-mono font-bold">
                          {factor.percentage ?? 0}% Strain
                        </Badge>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs text-muted-foreground font-semibold">
                          <span>Raw Score: {factor.rawScore ?? 0} / {factor.maxScore ?? 0}</span>
                          <span>{factor.percentage ?? 0}%</span>
                        </div>
                        <Progress
                          value={factor.percentage ?? 0}
                          className={cn('h-2.5 rounded-full', isHigh ? '[&>div]:bg-rose-500' : '[&>div]:bg-primary')}
                        />
                      </div>

                      <p className="text-xs text-muted-foreground leading-relaxed pt-1 border-t border-border/40">
                        {clinicalNote}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: LONGITUDINAL HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold tracking-tight text-foreground">
                  Longitudinal Assessment History
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Track caregiver fatigue and burden trends over successive clinical evaluations.
                </p>
              </div>

              {(!pastAssessments || pastAssessments.length === 0) ? (
                <div className="p-8 text-center bg-muted/20 border border-dashed border-border rounded-2xl">
                  <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-semibold text-foreground">No prior assessments on record</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    This is your first completed assessment. Subsequent evaluations will appear here to illustrate trends.
                  </p>
                </div>
              ) : (
                <>
                  {/* Trend summary — the same computeTrajectory engine the
                      clinician roster uses, so the caregiver sees the identical
                      band and never a fabricated date, only a direction. */}
                  <div
                    className={cn(
                      'p-4 rounded-xl border flex items-center gap-3',
                      trajectory.riskBand === 'critical' || trajectory.riskBand === 'lost-to-follow-up'
                        ? 'bg-destructive/10 border-destructive/30'
                        : trajectory.riskBand === 'deteriorating'
                        ? 'bg-amber-500/10 border-amber-500/30'
                        : trajectory.riskBand === 'stable'
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : 'bg-muted/30 border-border/60'
                    )}
                  >
                    {trajectory.riskBand === 'stable' ? (
                      <TrendingDown className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : trajectory.riskBand === 'deteriorating' || trajectory.riskBand === 'critical' ? (
                      <TrendingUp className="w-5 h-5 text-rose-600 shrink-0" />
                    ) : (
                      <Clock className="w-5 h-5 text-muted-foreground shrink-0" />
                    )}
                    <div>
                      <p className="text-sm font-bold text-foreground capitalize">
                        {trajectory.riskBand.replace(/-/g, ' ')}
                        {trajectory.burdenSlope.isReliable && trajectory.burdenSlope.slopePerMonth !== null && (
                          <span className="font-mono font-normal text-muted-foreground ml-2 text-xs">
                            ({trajectory.burdenSlope.slopePerMonth > 0 ? '+' : ''}
                            {trajectory.burdenSlope.slopePerMonth} pts / 30 days)
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {trajectory.riskReasons[0] ||
                          'Complete at least 3 assessments spanning 3+ weeks to establish a trend.'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {pastAssessments.map((item, idx) => {
                      const itemClassification = typeof item?.classification === 'string'
                        ? item.classification
                        : (item?.classification?.[lang] || item?.classification?.en || 'Burden Assessment');
                      const itemDate = !item?.completedAt || isNaN(new Date(item.completedAt).getTime())
                        ? 'Past'
                        : new Date(item.completedAt).toLocaleDateString();
                      // pastAssessments is newest-first, so the next entry is the prior one.
                      const prior = pastAssessments[idx + 1];
                      const delta = prior ? item.normalizedPercentage - prior.normalizedPercentage : null;
                      return (
                        <div
                          key={idx}
                          className="p-4 rounded-xl bg-card border border-border/80 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs font-mono">
                              #{pastAssessments.length - idx}
                            </div>
                            <div>
                              <div className="font-bold text-sm text-foreground">
                                {itemClassification}
                              </div>
                              <div className="text-xs text-muted-foreground flex items-center gap-2">
                                <span>{itemDate}</span>
                                <span>•</span>
                                <span>{item?.tier || 'ZBI'} Tier</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-lg font-bold font-mono text-primary block">
                              {item?.totalScore ?? 0} / {item?.maxScore ?? 88}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-semibold uppercase flex items-center justify-end gap-1">
                              {item?.normalizedPercentage ?? 0}% Strain
                              {delta !== null && delta !== 0 && (
                                <span className={cn('flex items-center', delta > 0 ? 'text-rose-500' : 'text-emerald-500')}>
                                  {delta > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                  {Math.abs(delta)}
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Action Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-border/60 mt-8">
            <Button variant="outline" size="sm" onClick={onRetake} className="gap-2 w-full sm:w-auto">
              <RotateCcw className="w-4 h-4" /> Retake / New Assessment
            </Button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2 w-full sm:w-auto">
                <Download className="w-4 h-4" /> Export / Print Report
              </Button>
              <Link href="/dashboard" className="w-full sm:w-auto">
                <Button size="sm" className="gap-2 w-full font-bold shadow-sm">
                  Return to Dashboard <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
