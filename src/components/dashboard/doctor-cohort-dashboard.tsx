'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Stethoscope, Users, AlertTriangle, ArrowRight, RefreshCw, CalendarClock, BellRing } from 'lucide-react';
import Link from 'next/link';
import { loadCohortRoster, summarizeCohort, RISK_BAND_STYLE, type CohortRow } from '@/lib/analytics/cohort';
import type { RiskBand } from '@/lib/analytics/trajectory';
import { cn } from '@/lib/utils';
import { RegisterPatientDialog } from '@/components/clinician/register-patient-dialog';
import { useToast } from '@/hooks/use-toast';
import {
  requestReassessment,
  subscribeToReassessmentAlerts,
  dismissReassessmentAlert
} from '@/lib/firebase/clinical-sync';

const RISK_BAND_LABEL: Record<RiskBand, string> = {
  critical: 'Critical',
  'lost-to-follow-up': 'Lost to Follow-Up',
  deteriorating: 'Deteriorating',
  'insufficient-data': 'Insufficient Data',
  stable: 'Stable'
};

// Same worst-first ranking as the roster, so the two views never disagree
// about which patients need attention first.
const NEEDS_ATTENTION_LIMIT = 5;

export function DoctorCohortDashboard() {
  const [rows, setRows] = useState<CohortRow[] | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [requestingUids, setRequestingUids] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const load = async () => {
    setIsRefreshing(true);
    setRows(await loadCohortRoster());
    setIsRefreshing(false);
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToReassessmentAlerts(setAlerts);
    return () => unsubscribe();
  }, []);

  const handleDismissAlert = async (alertId: string) => {
    try {
      await dismissReassessmentAlert(alertId);
      toast({
        title: 'Alert Dismissed',
        description: 'The caregiver burden warning has been cleared.'
      });
    } catch {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not dismiss alert. Please try again.'
      });
    }
  };

  const handleRequestReassessment = async (patientUid: string) => {
    setRequestingUids((prev) => new Set([...prev, patientUid]));
    try {
      await requestReassessment(patientUid);
      toast({
        title: 'Reassessment Request Sent',
        description: 'Caregiver has been notified on their portal to complete a repeat Zarit assessment.'
      });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Request Failed',
        description: err instanceof Error ? err.message : 'Please try again.'
      });
      setRequestingUids((prev) => {
        const updated = new Set(prev);
        updated.delete(patientUid);
        return updated;
      });
    }
  };

  if (!rows) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-blue-500/10 rounded-2xl border border-blue-500/20" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-muted/40 rounded-xl border border-border/60" />
          ))}
        </div>
        <div className="h-64 bg-muted/30 rounded-2xl border border-border/60" />
      </div>
    );
  }

  const summary = summarizeCohort(rows);
  const needsAttention = rows.slice(0, NEEDS_ATTENTION_LIMIT);

  return (
    <div className="space-y-6">
      {/* Doctor Header Banner */}
      <Card className="border-blue-500/30 bg-blue-500/5 shadow-sm">
        <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-blue-600/10 text-blue-600 shrink-0 mt-0.5">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] font-bold text-blue-600 border-blue-500/30 uppercase">
                  Consulting Geriatrician & Physician Portal
                </Badge>
                <span className="text-xs text-muted-foreground font-mono">OPD Clinical Surveillance</span>
              </div>
              <h2 className="text-lg font-bold text-foreground mt-0.5">
                Cohort Risk Overview — {summary.totalPatients} Patient{summary.totalPatients === 1 ? '' : 's'}
              </h2>
              <p className="text-xs text-muted-foreground max-w-xl leading-relaxed">
                Aggregate caregiver burden and functional trajectory risk across every dyad mapped to your clinician account.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs font-bold flex-1 sm:flex-none"
              onClick={() => void load()}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn('w-3.5 h-3.5', isRefreshing && 'animate-spin')} /> Refresh
            </Button>
            <Link href="/clinic/roster" className="flex-1 sm:flex-none">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs font-bold border-blue-500/30 text-blue-700 dark:text-blue-300 w-full sm:w-auto">
                <Users className="w-4 h-4" /> Full Cohort Roster
              </Button>
            </Link>
            <div className="w-full sm:w-auto">
              <RegisterPatientDialog onRegistered={() => void load()} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Distribution + Alert Counts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(['critical', 'lost-to-follow-up', 'deteriorating', 'stable'] as RiskBand[]).map((band) => (
          <Card key={band} className="border-border bg-card shadow-xs">
            <CardContent className="p-4 text-center space-y-1">
              <Badge className={cn('text-[10px] font-bold', RISK_BAND_STYLE[band])}>
                {RISK_BAND_LABEL[band]}
              </Badge>
              <p className="text-2xl font-black font-mono text-foreground">{summary.byRiskBand[band]}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Patients</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card className="border-border bg-card shadow-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-500/10 text-red-600 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-black font-mono text-foreground">{summary.redFlagCount}</p>
              <p className="text-xs text-muted-foreground">Active clinical red flag{summary.redFlagCount === 1 ? '' : 's'}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card shadow-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 shrink-0">
              <CalendarClock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-black font-mono text-foreground">{summary.reassessmentDueCount}</p>
              <p className="text-xs text-muted-foreground">Due for ZBI reassessment</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 1. Alerts Section (Increasing Caregiver Burden) */}
      {alerts.length > 0 && (
        <Card className="border-red-500/30 bg-red-500/5 shadow-xs animate-in fade-in duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-red-700 dark:text-red-400 flex items-center gap-1.5 uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-red-600 animate-pulse" />
              Caregiver Burden Escalation Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-5 pt-0">
            {alerts.map((alert) => (
              <div key={alert.id} className="p-3 rounded-xl border border-red-200 bg-white dark:bg-zinc-900 flex items-center justify-between gap-3 text-xs shadow-2xs">
                <div className="space-y-1">
                  <p className="font-bold text-foreground">
                    Caregiver for {alert.patientName} reported increased burden!
                  </p>
                  <p className="text-muted-foreground">
                    Zarit Burden Score rose from <span className="font-semibold">{alert.previousScore}%</span> to <span className="font-bold text-red-600">{alert.newScore}%</span> on {new Date(alert.completedAt).toLocaleDateString()}.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 shrink-0"
                  onClick={() => handleDismissAlert(alert.id)}
                >
                  Dismiss
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 2. Grid Roster and Reassessment Due columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Needs Attention */}
        <Card className="border-border bg-card shadow-sm h-fit">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">Needs Attention</h3>
              <Link href="/clinic/roster" className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
                View Full Roster <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {needsAttention.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">No patients mapped to your account yet.</p>
            ) : (
              <div className="space-y-2">
                {needsAttention.map((row) => (
                  <Link key={row.patientUid} href={`/clinic/dyad/${row.patientUid}`}>
                    <div className="p-3 rounded-xl border border-border/70 hover:border-primary/40 transition-colors flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Badge className={cn('text-[9px] font-bold shrink-0', RISK_BAND_STYLE[row.riskBand])}>
                          {row.riskBand}
                        </Badge>
                        <span className="text-xs font-semibold text-foreground truncate">{row.displayName}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {row.hasQocWarning && (
                          <Badge variant="outline" className="text-[8px] font-bold text-red-600 border-red-500/30 bg-red-500/5 px-1 py-0 h-4 shrink-0">
                            Care Alert
                          </Badge>
                        )}
                        {row.hasRedFlag && <AlertTriangle className="w-3.5 h-3.5 text-red-600" />}
                        {row.latestBurdenPct !== null && (
                          <span className="text-xs font-mono font-bold text-muted-foreground">{row.latestBurdenPct}%</span>
                        )}
                        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column: Reassessments Due (Last Done > 3 Months Ago) */}
        <Card className="border-border bg-card shadow-sm h-fit">
          <CardContent className="p-5 space-y-3">
            <h3 className="text-sm font-bold text-foreground">Repeat Reassessments Due (&gt; 3 Months Ago)</h3>
            {(() => {
              const repeatDuePatients = rows.filter((row) => {
                return row.latestAssessmentAgeDays !== null && row.latestAssessmentAgeDays >= 90;
              });

              if (repeatDuePatients.length === 0) {
                return <p className="text-xs text-muted-foreground py-4 text-center">No repeat assessments outstanding.</p>;
              }

              return (
                <div className="space-y-2">
                  {repeatDuePatients.map((row) => (
                    <div key={row.patientUid} className="p-3 rounded-xl border border-border/70 flex items-center justify-between gap-3 text-xs bg-muted/20">
                      <div className="space-y-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">{row.displayName}</p>
                        <p className="text-muted-foreground font-mono text-[10px]">
                          Last assessed {row.latestAssessmentAgeDays} days ago
                        </p>
                      </div>
                      <Button
                        size="sm"
                        className="h-8 text-xs font-bold shrink-0 bg-blue-600 hover:bg-blue-700 text-white"
                        disabled={requestingUids.has(row.patientUid)}
                        onClick={() => handleRequestReassessment(row.patientUid)}
                      >
                        {requestingUids.has(row.patientUid) ? 'Requested' : 'Request Redo'}
                      </Button>
                    </div>
                  ))}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
