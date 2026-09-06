'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Stethoscope,
  Users,
  AlertTriangle,
  RefreshCw,
  CalendarClock,
  BellRing,
  Activity,
  HeartPulse,
  ShieldAlert,
  Search,
  Send,
  Bed,
  Clock,
  Zap,
  ShieldCheck,
  HeartHandshake,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { loadCohortRoster, summarizeCohort, RISK_BAND_STYLE, type CohortRow } from '@/lib/analytics/cohort';
import type { RiskBand } from '@/lib/analytics/trajectory';
import { cn } from '@/lib/utils';
import { RegisterPatientDialog } from '@/components/clinician/register-patient-dialog';
import { ClinicianQueryDashboard } from '@/components/clinician/clinician-query-dashboard';
import { useToast } from '@/hooks/use-toast';
import {
  requestReassessment,
  subscribeToReassessmentAlerts,
  dismissReassessmentAlert,
  type ReassessmentAlert
} from '@/lib/firebase/clinical-sync';

const RISK_BAND_LABEL: Record<RiskBand, string> = {
  critical: 'Critical',
  'lost-to-follow-up': 'Lost to Follow-Up',
  deteriorating: 'Deteriorating',
  'insufficient-data': 'Insufficient Data',
  stable: 'Stable'
};

type FilterType = 'all' | 'critical' | 'care_gap' | 'bed_bound' | 'respite' | 'daily_red_flags' | 'reassessment_due';

function formatFormalSupport(type: string | undefined, hours?: number) {
  if (!hours || hours === 0) return '0h Solo';
  const t = (type || '').toLowerCase();
  let role = 'Attendant';
  if (t.includes('nurse')) role = 'Nurse';
  else if (t.includes('medical_assistant')) role = 'Med Asst';
  else if (t.includes('family')) role = 'Family Rota';
  return `${hours}h ${role}`;
}

function getActionableAlert(alertSnippet: string | null | undefined): string | null {
  if (!alertSnippet) return null;
  const lower = alertSnippet.toLowerCase();
  if (
    lower.includes('no nurse or medical assistant') ||
    lower.includes('decision-support limitation') ||
    lower.includes('fully compliant')
  ) {
    return null;
  }
  if (lower.includes('scheduled doses were not ticked')) {
    const match = alertSnippet.match(/(\d+\s*of\s*\d+)/i);
    return match ? `${match[1]} doses missed` : 'Missed doses reported';
  }
  return alertSnippet;
}

export function DoctorCohortDashboard() {
  const [rows, setRows] = useState<CohortRow[] | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [alerts, setAlerts] = useState<ReassessmentAlert[]>([]);
  const [requestingUids, setRequestingUids] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const { toast } = useToast();

  const load = async () => {
    setIsRefreshing(true);
    const data = await loadCohortRoster();
    setRows(data);
    setIsRefreshing(false);
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    let initialFired = false;
    const unsubscribe = subscribeToReassessmentAlerts((nextAlerts) => {
      setAlerts(nextAlerts);
      if (!initialFired) {
        initialFired = true;
        return;
      }
      void load();
    });
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

  const handleRequestReassessment = async (patientUid: string, patientName?: string) => {
    setRequestingUids((prev) => new Set([...prev, patientUid]));
    try {
      await requestReassessment(patientUid);
      toast({
        title: 'Reassessment Requested',
        description: `Repeat Zarit Burden evaluation notice sent to ${patientName || 'caregiver'}.`
      });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Request Failed',
        description: err instanceof Error ? err.message : 'Please try again.'
      });
    } finally {
      // Previously only cleared on failure, so a SUCCESSFUL request left the
      // button permanently disabled for that row until a full page reload —
      // `requestingUids` is a transient in-flight flag, not a durable
      // "already requested" record (that lives server-side in
      // reassessmentRequests), so it must clear either way.
      setRequestingUids((prev) => {
        const updated = new Set(prev);
        updated.delete(patientUid);
        return updated;
      });
    }
  };

  const handleSendWhatsApp = (row: CohortRow) => {
    const careName = row.caregiverName || 'Caregiver';
    const patientName = row.displayName.split('(')[0].trim();
    const cleanPhone = (row.caregiverPhone || '+919820012345').replace(/\D/g, '');
    const text = encodeURIComponent(
      `Namaste ${careName}, this is Dr. Vivek from Sanjeevani Geriatric Clinic regarding ${patientName}'s care plan.\n\nPlease ensure vital signs (BP & SpO2) are logged and rotation shifts are maintained today.\nPortal link: ${typeof window !== 'undefined' ? window.location.origin : 'https://sanjeevani.health'}/dashboard`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  };

  // Clinical KPIs calculation across cohort
  const cohortMetrics = useMemo(() => {
    if (!rows) return null;
    const total = rows.length;
    const criticalCount = rows.filter((r) => r.riskBand === 'critical').length;
    const deterioratingCount = rows.filter((r) => r.riskBand === 'deteriorating').length;
    const redFlags = rows.filter((r) => r.hasRedFlag).length;
    const qocWarnings = rows.filter((r) => r.hasQocWarning).length;
    const bedBoundCount = rows.filter((r) => r.isBedBound).length;
    const highFallRisk = rows.filter((r) => (r.fallHistory || 0) >= 1).length;
    const soloCaregivers = rows.filter((r) => r.formalSupportHours === 0).length;
    const respiteNeeded = rows.filter((r) => r.respitePrescription?.needed).length;
    const dailyRedFlags = rows.filter((r) => (r.dailyLogSignals || []).some((signal) => signal.severity === 'urgent')).length;
    const dueForReassessment = rows.filter(
      (r) => r.latestAssessmentAgeDays !== null && r.latestAssessmentAgeDays >= 90
    ).length;

    const avgBurden =
      rows.filter((r) => r.latestBurdenPct !== null).length > 0
        ? Math.round(
            rows.reduce((acc, r) => acc + (r.latestBurdenPct || 0), 0) /
              rows.filter((r) => r.latestBurdenPct !== null).length
          )
        : 0;

    return {
      total,
      criticalCount,
      deterioratingCount,
      redFlags,
      qocWarnings,
      bedBoundCount,
      highFallRisk,
      soloCaregivers,
      respiteNeeded,
      dailyRedFlags,
      dueForReassessment,
      avgBurden
    };
  }, [rows]);

  // Filtered rows based on search & filter tabs
  const filteredRows = useMemo(() => {
    if (!rows) return [];
    return rows.filter((row) => {
      // Search match
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        row.displayName.toLowerCase().includes(query) ||
        (row.caregiverName && row.caregiverName.toLowerCase().includes(query)) ||
        (row.conditions && row.conditions.some((c) => c.toLowerCase().includes(query)));

      if (!matchesSearch) return false;

      // Tab filter
      if (activeFilter === 'critical') return row.riskBand === 'critical' || row.hasRedFlag;
      if (activeFilter === 'care_gap') return row.hasQocWarning;
      if (activeFilter === 'bed_bound') return row.isBedBound;
      if (activeFilter === 'respite') return row.respitePrescription?.needed;
      if (activeFilter === 'daily_red_flags') return (row.dailyLogSignals || []).some((signal) => signal.severity === 'urgent');
      if (activeFilter === 'reassessment_due')
        return row.latestAssessmentAgeDays !== null && row.latestAssessmentAgeDays >= 90;
      return true;
    });
  }, [rows, searchQuery, activeFilter]);

  if (!rows) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-primary/10 rounded-3xl border border-primary/20" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-muted/40 rounded-2xl border border-border/60" />
          ))}
        </div>
        <div className="h-96 bg-muted/30 rounded-3xl border border-border/60" />
      </div>
    );
  }

  const summary = summarizeCohort(rows);

  return (
    <div className="space-y-6">
      {/* 1. CLINICAL COCKPIT BANNER */}
      <div className="flex items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-lg bg-blue-500/10">
            <Stethoscope className="w-4 h-4 text-blue-600" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-foreground truncate">
              Clinical Dyad Overview · <span className="text-primary">{summary.totalPatients} Active</span>
            </h2>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" /> Real-time Dyad Surveillance
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => void load()}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn('w-3 h-3', isRefreshing && 'animate-spin')} /> Refresh
          </Button>
          <Link href="/clinic/roster">
            <Button variant="outline" size="sm" className="h-7 gap-1 text-xs">
              <Users className="w-3 h-3" /> Roster
            </Button>
          </Link>
          <RegisterPatientDialog onRegistered={() => void load()} />
        </div>
      </div>

      {/* 2. 4-PILLAR GERIATRIC SURVEILLANCE RADAR */}
      {cohortMetrics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          <div className="flex items-center gap-3 p-3 rounded-xl border border-border/60 bg-card">
            <span className="p-1.5 rounded-lg bg-red-500/10 text-red-600 shrink-0"><Activity className="w-3.5 h-3.5" /></span>
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">Burnout</p>
              <p className="text-sm font-black font-mono text-foreground">{cohortMetrics.criticalCount + cohortMetrics.deterioratingCount} <span className="text-[10px] font-normal text-muted-foreground">at-risk · ZBI avg {cohortMetrics.avgBurden}%</span></p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl border border-border/60 bg-card">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 shrink-0"><Bed className="w-3.5 h-3.5" /></span>
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">Mobility</p>
              <p className="text-sm font-black font-mono text-foreground">{cohortMetrics.bedBoundCount} <span className="text-[10px] font-normal text-muted-foreground">bed-bound · {cohortMetrics.highFallRisk} falls</span></p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl border border-border/60 bg-card">
            <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600 shrink-0"><HeartHandshake className="w-3.5 h-3.5" /></span>
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">Care Gap</p>
              <p className="text-sm font-black font-mono text-foreground">{cohortMetrics.soloCaregivers} <span className="text-[10px] font-normal text-muted-foreground">solo · {cohortMetrics.qocWarnings} gaps</span></p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl border border-border/60 bg-card">
            <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 shrink-0"><CalendarClock className="w-3.5 h-3.5" /></span>
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">Reassessment</p>
              <p className="text-sm font-black font-mono text-foreground">{cohortMetrics.dueForReassessment} <span className="text-[10px] font-normal text-muted-foreground">due · {cohortMetrics.dailyRedFlags} flags</span></p>
            </div>
          </div>
        </div>
      )}

      {/* 3. ACUTE CLINICAL ALERTS FEED */}
      {alerts.length > 0 && (
        <Card className="border-red-500/40 bg-red-500/5 shadow-sm animate-in fade-in duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-red-700 dark:text-red-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5 uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 text-red-600 animate-pulse" />
                Acute Escalation & High Burnout Triggers ({alerts.length})
              </span>
              <span className="text-[10px] font-normal text-muted-foreground">Action required</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5 p-5 pt-0">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="p-3.5 rounded-2xl border border-red-200 dark:border-red-900/50 bg-card flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs shadow-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive" className="text-[9px] font-bold uppercase">
                      {alert.needsCaregiverRespite ? 'Respite Needed' : 'Zarit Surge'}
                    </Badge>
                    <span className="font-bold text-foreground">{alert.patientName}</span>
                    <span className="text-muted-foreground font-mono text-[11px]">
                      ({new Date(alert.completedAt).toLocaleDateString()})
                    </span>
                  </div>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    Caregiver burden score escalated from <strong className="text-foreground">{alert.previousScore}%</strong> to{' '}
                    <strong className="text-red-600 font-black">{alert.newScore}%</strong>.
                    {alert.needsCaregiverRespite
                      ? ` ${alert.reason || 'Arrange caregiver respite and review the monthly support matrix.'}`
                      : ' High risk of immediate caregiver collapse.'}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs font-bold border-red-300 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30"
                    onClick={() => handleDismissAlert(alert.id)}
                  >
                    Dismiss
                  </Button>
                  <Link href={`/clinic/dyad/${alert.patientUid || 'demo-sarojini'}`}>
                    <Button size="sm" className="h-8 text-xs font-bold gap-1 bg-red-600 hover:bg-red-700 text-white">
                      <Stethoscope className="w-3.5 h-3.5" /> Open Dyad Workspace
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <ClinicianQueryDashboard rows={rows} />

      {/* 4. ACTIVE CLINICAL PATIENT WORKLIST WITH LIVE FILTERING */}
      <Card className="border-border bg-card shadow-xs">
        <CardHeader className="p-3 pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-primary" />
              Active Worklist ({filteredRows.length})
            </CardTitle>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-7 h-7 text-xs w-44"
                />
              </div>

              <div className="flex items-center gap-1 overflow-x-auto">
                {([
                  { key: 'all', label: `All (${rows.length})` },
                  { key: 'critical', label: `Critical (${summary.byRiskBand.critical})`, icon: <AlertTriangle className="w-3 h-3" /> },
                  { key: 'care_gap', label: `Gaps (${cohortMetrics?.qocWarnings || 0})`, icon: <ShieldAlert className="w-3 h-3" /> },
                  { key: 'bed_bound', label: `Bed-Bound (${cohortMetrics?.bedBoundCount || 0})`, icon: <Bed className="w-3 h-3" /> },
                  { key: 'respite', label: `Respite (${cohortMetrics?.respiteNeeded || 0})`, icon: <HeartHandshake className="w-3 h-3" /> },
                  { key: 'daily_red_flags', label: `Flags (${cohortMetrics?.dailyRedFlags || 0})`, icon: <BellRing className="w-3 h-3" /> },
                ] as { key: FilterType; label: string; icon?: React.ReactNode }[]).map(({ key, label, icon }) => (
                  <button
                    key={key}
                    onClick={() => setActiveFilter(key)}
                    className={cn(
                      'inline-flex items-center gap-1 h-6 px-2 rounded-md text-[11px] font-semibold border transition-colors whitespace-nowrap',
                      activeFilter === key
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-muted-foreground border-border hover:text-foreground hover:border-foreground/30'
                    )}
                  >
                    {icon}{label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-3 pt-1">
          {filteredRows.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Users className="w-8 h-8 text-muted-foreground/40 mx-auto" />
              <p className="text-sm font-bold text-foreground">No patients matching filter</p>
              <p className="text-xs text-muted-foreground">Try clearing search or changing the active filter chip.</p>
              <Button variant="outline" size="sm" onClick={() => { setSearchQuery(''); setActiveFilter('all'); }}>
                Reset Filters
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {filteredRows.map((row) => {
                const actionableAlert = getActionableAlert(row.latestAlertSnippet);

                return (
                  <div
                    key={row.patientUid}
                    className="group px-3 py-2.5 rounded-xl transition-colors hover:bg-muted/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                  >
                    {/* Left: 2 clean, structured clinical lines */}
                    <div className="flex-1 min-w-0 space-y-1">
                      {/* Line 1: Identity + Key High-Risk Tags + Caregiver */}
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <Badge className={cn('text-[9px] font-bold uppercase px-1.5 py-0 h-4 leading-none', RISK_BAND_STYLE[row.riskBand])}>
                          {RISK_BAND_LABEL[row.riskBand]}
                        </Badge>
                        <span className="text-xs sm:text-sm font-semibold text-foreground">{row.displayName}</span>

                        {row.isBedBound && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0 h-4 rounded text-[9px] font-medium bg-muted/80 text-muted-foreground border border-border/60">
                            <Bed className="w-2.5 h-2.5" /> Bed-Bound
                          </span>
                        )}
                        {(row.fallHistory || 0) >= 1 && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0 h-4 rounded text-[9px] font-medium bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20">
                            <AlertTriangle className="w-2.5 h-2.5" /> {row.fallHistory} Fall{row.fallHistory === 1 ? '' : 's'}
                          </span>
                        )}

                        <span className="text-border text-[10px] hidden sm:inline">•</span>

                        <span className="text-[11px] text-muted-foreground truncate">
                          Caregiver: <strong className="text-foreground font-medium">{row.caregiverName || 'Family'}</strong>
                          {row.caregiverKinship && ` (${row.caregiverKinship})`}
                          {' · '}
                          <span className={cn(row.formalSupportHours === 0 ? 'text-amber-600 font-semibold' : 'text-foreground/80 font-medium')}>
                            {formatFormalSupport(row.formalSupportType, row.formalSupportHours)}
                          </span>
                        </span>
                      </div>

                      {/* Line 2: Conditions + Actionable Alert + Respite Recommendation */}
                      <div className="flex flex-wrap items-center gap-2 text-[11px]">
                        {row.conditions && row.conditions.length > 0 && (
                          <span className="text-[10px] text-muted-foreground/80 truncate max-w-xs sm:max-w-md">
                            {row.conditions.join(' · ')}
                          </span>
                        )}

                        {actionableAlert && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/25">
                            <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                            <span className="truncate max-w-[240px] sm:max-w-xs">{actionableAlert}</span>
                          </span>
                        )}

                        {row.respitePrescription?.needed && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20">
                            <HeartHandshake className="w-2.5 h-2.5 shrink-0" />
                            <span>Respite: {row.respitePrescription.recommendedDaysPerMonth}d/mo rec.</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Metrics + Quick Actions */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/30 border border-border/50 text-[11px] font-mono">
                        <span className="text-[9px] text-muted-foreground font-sans font-semibold uppercase">ZBI</span>
                        <span className={cn('font-bold', row.latestBurdenPct && row.latestBurdenPct > 50 ? 'text-red-600' : 'text-foreground')}>
                          {row.latestBurdenPct !== null ? `${row.latestBurdenPct}%` : '—'}
                        </span>
                        {row.lastVitalBp && (
                          <>
                            <span className="text-border">|</span>
                            <span className="text-[9px] text-muted-foreground font-sans font-semibold uppercase">BP</span>
                            <span className="font-semibold text-foreground">{row.lastVitalBp}</span>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-0.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleSendWhatsApp(row)}
                          title="WhatsApp message to caregiver"
                          className="h-7 w-7 p-0 text-emerald-600 hover:bg-emerald-500/10 rounded-md"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRequestReassessment(row.patientUid, row.displayName)}
                          disabled={requestingUids.has(row.patientUid)}
                          title="Request Zarit Reassessment"
                          className="h-7 w-7 p-0 text-primary hover:bg-primary/10 rounded-md"
                        >
                          <CalendarClock className="w-3.5 h-3.5" />
                        </Button>

                        <Button asChild size="sm" className="h-7 text-xs font-semibold gap-1 px-2.5 rounded-md shadow-2xs">
                          <Link href={`/clinic/dyad/${row.patientUid}`}>
                            Open <ChevronRight className="w-3 h-3" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 5. CLINICAL DECISION SUPPORT SHORTCUTS */}
      <div className="flex items-center gap-2">
        {[
          { href: '/medications', icon: <ShieldCheck className="w-3.5 h-3.5" />, label: 'Beers Criteria', color: 'text-emerald-600 hover:bg-emerald-500/10 border-emerald-500/30' },
          { href: '/simulations', icon: <Zap className="w-3.5 h-3.5" />, label: 'Geriatric Simulations', color: 'text-blue-600 hover:bg-blue-500/10 border-blue-500/30' },
          { href: '/stress-calculator', icon: <HeartPulse className="w-3.5 h-3.5" />, label: 'Zarit Calculator', color: 'text-purple-600 hover:bg-purple-500/10 border-purple-500/30' },
        ].map(({ href, icon, label, color }) => (
          <Link key={href} href={href}>
            <button className={cn('inline-flex items-center gap-1.5 h-7 px-3 rounded-lg border text-[11px] font-semibold transition-colors bg-background', color)}>
              {icon}{label}
            </button>
          </Link>
        ))}
      </div>
    </div>
  );
}
