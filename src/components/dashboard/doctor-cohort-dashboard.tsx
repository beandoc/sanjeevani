'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Stethoscope, Users, AlertTriangle, ArrowRight, RefreshCw, CalendarClock } from 'lucide-react';
import Link from 'next/link';
import { loadCohortRoster, summarizeCohort, RISK_BAND_STYLE, type CohortRow } from '@/lib/analytics/cohort';
import type { RiskBand } from '@/lib/analytics/trajectory';
import { cn } from '@/lib/utils';
import { RegisterPatientDialog } from '@/components/clinician/register-patient-dialog';

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

  const load = async () => {
    setIsRefreshing(true);
    setRows(await loadCohortRoster());
    setIsRefreshing(false);
  };

  useEffect(() => {
    void load();
  }, []);

  if (!rows) return null;

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

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs font-bold"
              onClick={() => void load()}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn('w-3.5 h-3.5', isRefreshing && 'animate-spin')} /> Refresh
            </Button>
            <Link href="/clinic/roster">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs font-bold border-blue-500/30 text-blue-700 dark:text-blue-300">
                <Users className="w-4 h-4" /> Full Cohort Roster
              </Button>
            </Link>
            <RegisterPatientDialog onRegistered={() => void load()} />
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

      {/* Needs Attention */}
      <Card className="border-border bg-card shadow-sm">
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
    </div>
  );
}
