'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Stethoscope,
  Users,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  CalendarClock,
  BellRing,
  Activity,
  HeartPulse,
  ShieldAlert,
  Search,
  Send,
  PhoneCall,
  Bed,
  Sparkles,
  Clock,
  CheckCircle2,
  Zap,
  SlidersHorizontal,
  FileText,
  ShieldCheck,
  HeartHandshake,
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';
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

type FilterType = 'all' | 'critical' | 'care_gap' | 'bed_bound' | 'reassessment_due';

export function DoctorCohortDashboard() {
  const [rows, setRows] = useState<CohortRow[] | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [alerts, setAlerts] = useState<any[]>([]);
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
      <Card className="border border-blue-500/30 bg-blue-50/70 dark:bg-slate-900/90 shadow-sm">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="space-y-2 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-blue-600/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5">
                  <Stethoscope className="w-3.5 h-3.5 mr-1" />
                  Geriatric OPD Clinical Cockpit
                </Badge>
                <span className="text-xs text-muted-foreground font-mono flex items-center gap-1 font-semibold">
                  <Clock className="w-3.5 h-3.5 text-primary" /> Real-time Dyad Surveillance
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black font-headline tracking-tight text-foreground">
                Cohort Clinical Overview • {summary.totalPatients} Active Dyad{summary.totalPatients === 1 ? '' : 's'}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
                Bi-directional surveillance mapping patient functional trajectory (Barthel ADL) against caregiver psychometric strain (Zarit ZBI) and home safety support.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs font-bold bg-background hover:bg-muted text-foreground border-border shadow-xs"
                onClick={() => void load()}
                disabled={isRefreshing}
              >
                <RefreshCw className={cn('w-3.5 h-3.5', isRefreshing && 'animate-spin')} /> Refresh Live Data
              </Button>
              <Link href="/clinic/roster">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs font-bold bg-background hover:bg-muted text-blue-700 dark:text-blue-300 border-blue-500/30 shadow-xs"
                >
                  <Users className="w-3.5 h-3.5" /> Full Roster Matrix
                </Button>
              </Link>
              <RegisterPatientDialog onRegistered={() => void load()} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. 4-PILLAR GERIATRIC SURVEILLANCE RADAR */}
      {cohortMetrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Pillar 1: Trajectory Risk */}
          <Card className="border-border/80 bg-card hover:border-primary/40 transition-all shadow-xs">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Caregiver Burnout Radar
                </span>
                <span className="p-1.5 rounded-lg bg-red-500/10 text-red-600">
                  <Activity className="w-4 h-4" />
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-black font-mono text-foreground">
                    {cohortMetrics.criticalCount + cohortMetrics.deterioratingCount}
                  </span>
                  <span className="text-xs text-muted-foreground ml-1.5">at-risk dyads</span>
                </div>
                <Badge className="text-[10px] font-bold bg-red-600/10 text-red-700 dark:text-red-300 border-red-500/20">
                  Avg ZBI {cohortMetrics.avgBurden}%
                </Badge>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-1 border-t border-border/60">
                <span className="w-2 h-2 rounded-full bg-red-600" />
                <span>{cohortMetrics.criticalCount} Critical</span>
                <span className="text-border">•</span>
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>{cohortMetrics.deterioratingCount} Deteriorating</span>
              </div>
            </CardContent>
          </Card>

          {/* Pillar 2: Biomechanical & Bed-Bound Risk */}
          <Card className="border-border/80 bg-card hover:border-primary/40 transition-all shadow-xs">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Domiciliary & Mobility
                </span>
                <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600">
                  <Bed className="w-4 h-4" />
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-black font-mono text-foreground">
                    {cohortMetrics.bedBoundCount}
                  </span>
                  <span className="text-xs text-muted-foreground ml-1.5">bed-bound</span>
                </div>
                <Badge className="text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20">
                  {cohortMetrics.highFallRisk} Fall History
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground pt-1 border-t border-border/60 truncate">
                High risk for lumbar strain & pressure ulcers
              </p>
            </CardContent>
          </Card>

          {/* Pillar 3: Diurnal Care Gap / Solo Family Burden */}
          <Card className="border-border/80 bg-card hover:border-primary/40 transition-all shadow-xs">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Care Gap & Night Deficit
                </span>
                <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600">
                  <HeartHandshake className="w-4 h-4" />
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-black font-mono text-foreground">
                    {cohortMetrics.soloCaregivers}
                  </span>
                  <span className="text-xs text-muted-foreground ml-1.5">solo families</span>
                </div>
                <Badge className="text-[10px] font-bold bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20">
                  0h Attendant
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground pt-1 border-t border-border/60 truncate">
                {cohortMetrics.qocWarnings} dyads flagged with nocturnal gaps
              </p>
            </CardContent>
          </Card>

          {/* Pillar 4: Surveillance & Reassessment Vigilance */}
          <Card className="border-border/80 bg-card hover:border-primary/40 transition-all shadow-xs">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Surveillance Cadence
                </span>
                <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600">
                  <CalendarClock className="w-4 h-4" />
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-black font-mono text-foreground">
                    {cohortMetrics.dueForReassessment}
                  </span>
                  <span className="text-xs text-muted-foreground ml-1.5">reassessments due</span>
                </div>
                <Badge className="text-[10px] font-bold bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20">
                  &gt;90d Interval
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground pt-1 border-t border-border/60 truncate">
                {cohortMetrics.redFlags} active clinical red flag alerts
              </p>
            </CardContent>
          </Card>
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
                      Zarit Surge
                    </Badge>
                    <span className="font-bold text-foreground">{alert.patientName}</span>
                    <span className="text-muted-foreground font-mono text-[11px]">
                      ({new Date(alert.completedAt).toLocaleDateString()})
                    </span>
                  </div>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    Caregiver burden score escalated from <strong className="text-foreground">{alert.previousScore}%</strong> to{' '}
                    <strong className="text-red-600 font-black">{alert.newScore}%</strong>. High risk of immediate caregiver collapse.
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

      {/* 4. ACTIVE CLINICAL PATIENT WORKLIST WITH LIVE FILTERING */}
      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="p-5 pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base font-bold font-headline text-foreground flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                Active Clinical Dyad Worklist ({filteredRows.length})
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Real-time psychometric, vital, and support matrix status across your assigned cohort.
              </CardDescription>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search patient, condition, caregiver…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-9 text-xs"
                />
              </div>

              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                <Button
                  variant={activeFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveFilter('all')}
                  className="h-8 text-xs px-2.5 font-bold"
                >
                  All ({rows.length})
                </Button>
                <Button
                  variant={activeFilter === 'critical' ? 'destructive' : 'outline'}
                  size="sm"
                  onClick={() => setActiveFilter('critical')}
                  className="h-8 text-xs px-2.5 font-bold"
                >
                  🚨 Critical ({summary.byRiskBand.critical})
                </Button>
                <Button
                  variant={activeFilter === 'care_gap' ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => setActiveFilter('care_gap')}
                  className="h-8 text-xs px-2.5 font-bold"
                >
                  ⚠️ Gaps ({cohortMetrics?.qocWarnings || 0})
                </Button>
                <Button
                  variant={activeFilter === 'bed_bound' ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => setActiveFilter('bed_bound')}
                  className="h-8 text-xs px-2.5 font-bold"
                >
                  🛌 Bed-Bound ({cohortMetrics?.bedBoundCount || 0})
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5 pt-1">
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
            <div className="space-y-3">
              {filteredRows.map((row) => (
                <div
                  key={row.patientUid}
                  className="p-4 rounded-2xl border border-border/70 hover:border-primary/50 bg-card transition-all duration-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-2xs"
                >
                  {/* Left: Patient and Caregiver Profile */}
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={cn('text-[10px] font-bold uppercase tracking-wider', RISK_BAND_STYLE[row.riskBand])}>
                        {RISK_BAND_LABEL[row.riskBand]}
                      </Badge>
                      <h4 className="text-sm font-bold text-foreground truncate">
                        {row.displayName}
                      </h4>
                      {row.isBedBound && (
                        <Badge variant="outline" className="text-[9px] font-bold text-amber-700 dark:text-amber-300 border-amber-500/30 bg-amber-500/10">
                          Bed-Bound
                        </Badge>
                      )}
                      {(row.fallHistory || 0) >= 1 && (
                        <Badge variant="outline" className="text-[9px] font-bold text-red-700 dark:text-red-300 border-red-500/30 bg-red-500/10">
                          {row.fallHistory} Falls (6m)
                        </Badge>
                      )}
                    </div>

                    {/* Conditions */}
                    {row.conditions && row.conditions.length > 0 && (
                      <div className="flex flex-wrap gap-1 text-[11px] text-muted-foreground">
                        {row.conditions.map((c, i) => (
                          <span key={i} className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-muted/60 text-foreground/80 font-medium text-[10px]">
                            {c}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Caregiver & Support Details */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-0.5 font-mono">
                      <span>
                        Caregiver: <strong className="text-foreground">{row.caregiverName || 'Primary Family Member'}</strong>{' '}
                        {row.caregiverKinship && <span className="text-[11px]">({row.caregiverKinship})</span>}
                      </span>
                      <span>•</span>
                      <span>
                        Formal Support:{' '}
                        <strong className={row.formalSupportHours === 0 ? 'text-amber-600 font-bold' : 'text-foreground'}>
                          {row.formalSupportHours ? `${row.formalSupportHours}h/day (${row.formalSupportType})` : '0h (100% Family Solo)'}
                        </strong>
                      </span>
                    </div>

                    {/* Alert Snippet if available */}
                    {row.latestAlertSnippet && (
                      <p className="text-xs text-amber-700 dark:text-amber-300 font-medium flex items-center gap-1.5 pt-0.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>{row.latestAlertSnippet}</span>
                      </p>
                    )}
                  </div>

                  {/* Right: Clinical Telemetry & Direct Actions */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-border/50">
                    {/* Zarit Gauge */}
                    <div className="p-2.5 rounded-xl bg-muted/50 border border-border/60 text-center min-w-[85px]">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase block">Zarit Burden</span>
                      <span className={cn('text-base font-black font-mono', row.latestBurdenPct && row.latestBurdenPct > 50 ? 'text-red-600' : 'text-foreground')}>
                        {row.latestBurdenPct !== null ? `${row.latestBurdenPct}%` : 'N/A'}
                      </span>
                    </div>

                    {/* Vitals Telemetry */}
                    {row.lastVitalBp && (
                      <div className="p-2.5 rounded-xl bg-muted/50 border border-border/60 text-center min-w-[85px]">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase block">BP Reading</span>
                        <span className="text-xs font-mono font-bold text-foreground">{row.lastVitalBp}</span>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1.5 w-full sm:w-auto">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSendWhatsApp(row)}
                        title="Send Care Instructions via WhatsApp"
                        className="h-9 px-2.5 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 flex-1 sm:flex-none"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span className="sm:hidden text-xs">WhatsApp</span>
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRequestReassessment(row.patientUid, row.displayName)}
                        disabled={requestingUids.has(row.patientUid)}
                        title="Request Repeat ZBI Evaluation"
                        className="h-9 px-2.5 text-xs flex-1 sm:flex-none"
                      >
                        <CalendarClock className="w-3.5 h-3.5 text-primary" />
                        <span className="sm:hidden text-xs">Reassess</span>
                      </Button>

                      <Button asChild size="sm" className="h-9 text-xs font-bold gap-1.5 bg-primary text-primary-foreground shadow-xs flex-2 sm:flex-none">
                        <Link href={`/clinic/dyad/${row.patientUid}`}>
                          <Stethoscope className="w-3.5 h-3.5" />
                          <span>Open Workspace</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 5. CLINICAL DECISION SUPPORT SHORTCUTS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/medications" className="block group">
          <Card className="border-border bg-card hover:border-emerald-500/50 hover:shadow-md transition-all h-full">
            <CardContent className="p-4 flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-foreground group-hover:text-emerald-600 transition-colors">
                  Beers Criteria Safety Regimen
                </h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Screen geriatric medications against sedative, anticholinergic, and renal risk criteria for Indian seniors.
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/simulations" className="block group">
          <Card className="border-border bg-card hover:border-blue-500/50 hover:shadow-md transition-all h-full">
            <CardContent className="p-4 flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-foreground group-hover:text-blue-600 transition-colors">
                  21 Indian Geriatric Simulations
                </h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Interactive triage cases covering acute delirium, post-stroke dysphagia, gait freezing, and sundowning.
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/stress-calculator" className="block group">
          <Card className="border-border bg-card hover:border-purple-500/50 hover:shadow-md transition-all h-full">
            <CardContent className="p-4 flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 shrink-0">
                <HeartPulse className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-foreground group-hover:text-purple-600 transition-colors">
                  Psychometric Zarit Calculator
                </h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Quick clinical calculation of ZBI-4, ZBI-12, and ZBI-22 caregiver burden scores with Indian normative cutoffs.
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
