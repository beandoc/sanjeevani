'use client';

import React, { useState } from 'react';
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

  const severityConfigs = {
    normal: {
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800',
      badgeBg: 'bg-emerald-500 text-white',
      desc: {
        en: 'Caregiver capacity is currently stable. Preventive self-care and routine ergonomic training recommended.',
        hi: 'देखभालकर्ता की स्थिति स्थिर है। नियमित स्व-देखभाल और बचाव के उपाय जारी रखें।',
        mr: 'काळजीवाहू व्यक्तीची स्थिती स्थिर आहे. नियमित स्वतःची काळजी आणि प्रतिबंधात्मक उपाय चालू ठेवा.'
      }
    },
    amber: {
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800',
      badgeBg: 'bg-amber-500 text-white',
      desc: {
        en: 'Moderate fatigue and emerging role strain detected. Recommended to schedule routine respite and divide duties.',
        hi: 'मध्यम स्तर का तनाव व थकान दर्ज हुई है। कार्यों का बंटवारा करने व साप्ताहिक विश्राम लेने की सलाह दी जाती है।',
        mr: 'मध्यम स्वरूपाचा ताण जाणवत आहे. कामाची विभागणी करा आणि नियमित विश्रांतीचे नियोजन करा.'
      }
    },
    red: {
      color: 'text-rose-600 dark:text-rose-400',
      bgColor: 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800',
      badgeBg: 'bg-rose-500 text-white',
      desc: {
        en: 'High caregiver strain exceeding safe burnout thresholds. Immediate task relief and clinical psychological consult advised.',
        hi: 'गंभीर स्तर का तनाव! बर्नआउट का अत्यधिक जोखिम। तुरंत मनोवैज्ञानिक परामर्श और सहायता प्राप्त करें।',
        mr: 'अतिशय गंभीर ताण आणि थकवा! तात्काळ मानसोपचारतज्ज्ञांचा सल्ला आणि मदत घेणे आवश्यक आहे.'
      }
    },
    critical_red: {
      color: 'text-red-700 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-950/50 border-red-300 dark:border-red-800',
      badgeBg: 'bg-red-600 text-white animate-pulse',
      desc: {
        en: 'Critical caregiver exhaustion and imminent collapse risk. Emergency respite intervention and mandatory care team rotation required.',
        hi: 'अति-गंभीर आपातकालीन स्थिति! तुरंत आपातकालीन विश्राम और परिवार के अन्य सदस्यों की भागीदारी अनिवार्य है।',
        mr: 'अति-गंभीर आणीबाणीची स्थिती! तात्काळ मदत आणि रुग्णाची काळजी घेणाऱ्या व्यक्तीची अदलाबदल आवश्यक.'
      }
    }
  };

  const [isCrisisModalOpen, setIsCrisisModalOpen] = useState(false);
  const config = severityConfigs[result.severityBand];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <CrisisEscalationModal
        isOpen={isCrisisModalOpen}
        onClose={() => setIsCrisisModalOpen(false)}
        severityReason={result.redFlags.length > 0 ? result.redFlags.join(' • ') : `Zarit Burden Score: ${result.totalScore}/${result.maxScore}`}
        isSelfHarmBranch={result.isCrisisTriggered}
      />

      {/* Top Banner Alert if Red Flags Exist */}
      {result.isCrisisTriggered && (
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
                {result.redFlags.length > 0 ? result.redFlags.join(' • ') : 'Severe caregiver fatigue requires immediate escalation.'}
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
                  {result.tier} Assessment Complete
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(result.completedAt).toLocaleDateString(undefined, {
                    dateStyle: 'medium',
                    timeStyle: 'short'
                  })}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                {result.classification[lang] || result.classification.en}
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
                  {result.totalScore}
                </span>
                <span className="text-sm font-bold text-muted-foreground">/ {result.maxScore}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 mt-2 overflow-hidden">
                <div
                  className={cn('h-full transition-all duration-500', config.badgeBg)}
                  style={{ width: `${result.normalizedPercentage}%` }}
                />
              </div>
              <span className="text-[11px] font-bold text-muted-foreground mt-1.5">
                {result.normalizedPercentage}% Scaled Strain
              </span>
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
                      Targeted Clinical Caregiver Prescriptions
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Personalized action steps generated automatically based on your specific subscale burdens.
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs font-semibold">
                    {result.prescriptions.length} Prescribed Actions
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.prescriptions.map((rx) => {
                    const isUrgent = rx.urgency === 'urgent';
                    return (
                      <div
                        key={rx.id}
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
                              {rx.category}
                            </span>
                            <Badge
                              variant={isUrgent ? 'destructive' : 'secondary'}
                              className="text-[10px] font-bold uppercase tracking-wider"
                            >
                              {rx.urgency}
                            </Badge>
                          </div>
                          <h4 className="font-bold text-base text-foreground mb-1.5">
                            {rx.title[lang] || rx.title.en}
                          </h4>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {rx.action[lang] || rx.action.en}
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
                  {Object.entries(result.domainCapacities).map(([dom, cap]) => {
                    const isMeasured = cap !== null;
                    const isLow = isMeasured && cap < 50;
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
                            style={{ width: `${isMeasured ? cap : 0}%` }}
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
                {(Object.entries(result.factors) as [ZbiFactor, typeof result.factors[ZbiFactor]][]).map(([key, factor]) => {
                  if (!factor.isMeasured) {
                    return (
                      <div key={key} className="p-5 rounded-2xl bg-muted/30 border border-border/50 space-y-2 opacity-65">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-sm text-muted-foreground">
                            {factor.title[lang] || factor.title.en}
                          </h4>
                          <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground">
                            Unassessed in {result.tier}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {factor.clinicalNote[lang] || factor.clinicalNote.en}
                        </p>
                      </div>
                    );
                  }

                  const isHigh = (factor.percentage ?? 0) >= 50;
                  return (
                    <div key={key} className="p-5 rounded-2xl bg-card border border-border/80 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sm text-foreground">
                          {factor.title[lang] || factor.title.en}
                        </h4>
                        <Badge variant={isHigh ? 'destructive' : 'secondary'} className="text-xs font-mono font-bold">
                          {factor.percentage}% Strain
                        </Badge>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs text-muted-foreground font-semibold">
                          <span>Raw Score: {factor.rawScore} / {factor.maxScore}</span>
                          <span>{factor.percentage}%</span>
                        </div>
                        <Progress
                          value={factor.percentage ?? 0}
                          className={cn('h-2.5 rounded-full', isHigh ? '[&>div]:bg-rose-500' : '[&>div]:bg-primary')}
                        />
                      </div>

                      <p className="text-xs text-muted-foreground leading-relaxed pt-1 border-t border-border/40">
                        {factor.clinicalNote[lang] || factor.clinicalNote.en}
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

              {pastAssessments.length === 0 ? (
                <div className="p-8 text-center bg-muted/20 border border-dashed border-border rounded-2xl">
                  <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-semibold text-foreground">No prior assessments on record</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    This is your first completed assessment. Subsequent evaluations will appear here to illustrate trends.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pastAssessments.map((item, idx) => (
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
                            {item.classification[lang] || item.classification.en}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <span>{new Date(item.completedAt).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>{item.tier} Tier</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-lg font-bold font-mono text-primary block">
                          {item.totalScore} / {item.maxScore}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-semibold uppercase">
                          {item.normalizedPercentage}% Strain
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
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
