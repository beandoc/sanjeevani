'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  HeartPulse,
  Users,
  Activity,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Search,
  CheckCircle2,
  Stethoscope,
  RefreshCw,
  Sparkles,
  Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  loadCohortRoster,
  invalidateCohortCache,
  RISK_BAND_STYLE,
  type CohortRow
} from '@/lib/analytics/cohort';
import {
  computeTrajectory,
  type TrajectoryResult,
  type RiskBand,
  ZBI_MCID_PERCENTAGE_POINTS_PER_30_DAYS
} from '@/lib/analytics/trajectory';
import {
  getZaritAssessmentsFor,
  getFunctionScoresFor,
  getCaregiverAttributesFor,
  getPatientProfileFor,
  getPatientDisplayName
} from '@/lib/firebase/clinical-sync';
import { RiskHeader } from '@/components/clinician/risk-header';
import { cn } from '@/lib/utils';
import { calculateZaritScore } from '@/lib/zarit-scale';

const ScissorsChart = dynamic(
  () => import('@/components/clinician/scissors-chart').then((m) => m.ScissorsChart),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 sm:h-80 w-full flex items-center justify-center bg-muted/20 rounded-2xl animate-pulse">
        <span className="text-xs text-muted-foreground flex items-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-primary" />
          Rendering Longitudinal Scissors Trajectory...
        </span>
      </div>
    )
  }
);

const RISK_BAND_LABEL: Record<RiskBand, string> = {
  critical: 'Critical',
  'lost-to-follow-up': 'Lost to Follow-Up',
  deteriorating: 'Deteriorating',
  stable: 'Stable',
  'insufficient-data': 'Insufficient Data'
};

type FilterCategory = 'all' | 'critical' | 'deteriorating' | 'stable' | 'other';

export default function ScissorsTrajectoryPage() {
  const [rows, setRows] = useState<CohortRow[] | null>(null);
  const [isLoadingCohort, setIsLoadingCohort] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');
  const [selectedDyadUid, setSelectedDyadUid] = useState<string | null>(null);
  const [selectedTrajectory, setSelectedTrajectory] = useState<TrajectoryResult | null>(null);
  const [isLoadingTrajectory, setIsLoadingTrajectory] = useState(false);
  const [selectedPatientName, setSelectedPatientName] = useState<string>('');
  const [selectedCaregiverName, setSelectedCaregiverName] = useState<string>('');
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);

  // Fetch cohort roster
  const loadCohort = useCallback(async (force = false) => {
    if (force) {
      invalidateCohortCache();
      setIsRefreshing(true);
    } else {
      setIsLoadingCohort(true);
    }

    try {
      const cohort = await loadCohortRoster(force);
      setRows(cohort);
      if (!selectedDyadUid && cohort.length > 0) {
        setSelectedDyadUid(cohort[0].patientUid);
      }
    } catch (err) {
      console.error('Failed to load cohort roster for trajectory:', err);
    } finally {
      setIsLoadingCohort(false);
      setIsRefreshing(false);
    }
  }, [selectedDyadUid]);

  useEffect(() => {
    void loadCohort();
  }, [loadCohort]);

  // When selectedDyadUid changes, fetch dyad trajectory details
  useEffect(() => {
    if (!selectedDyadUid) {
      setSelectedTrajectory(null);
      return;
    }

    let isCancelled = false;
    setIsLoadingTrajectory(true);

    const loadDyadTrajectory = async () => {
      try {
        const [assessmentsRes, functionScoresRes, displayNameRes, caregiverRes, profileRes] =
          await Promise.all([
            getZaritAssessmentsFor(selectedDyadUid).catch(() => []),
            getFunctionScoresFor(selectedDyadUid).catch(() => []),
            getPatientDisplayName(selectedDyadUid).catch(() => 'Patient Dyad'),
            getCaregiverAttributesFor(selectedDyadUid).catch(() => null),
            getPatientProfileFor(selectedDyadUid).catch(() => null)
          ]);

        if (isCancelled) return;

        let assessments = assessmentsRes;
        const functionScores = functionScoresRes;
        let displayName = displayNameRes;

        // Fallbacks for demo dyads matching dyad page behavior
        if (selectedDyadUid.startsWith('demo-') && assessments.length === 0) {
          if (selectedDyadUid.includes('ramesh') || selectedDyadUid.includes('7641')) {
            displayName = 'Shri Ramesh Chand (Dyad #7641)';
            assessments = [
              calculateZaritScore(
                { zbi_1: 2, zbi_2: 2, zbi_3: 2, zbi_7: 2, zbi_8: 2, zbi_14: 2, zbi_22: 2 },
                'ZBI22'
              )
            ];
          } else {
            displayName = 'Smt. Kamla Gupta (Dyad #8419)';
            assessments = [
              calculateZaritScore(
                { zbi_1: 1, zbi_2: 1, zbi_3: 1, zbi_7: 1, zbi_8: 1, zbi_14: 1, zbi_22: 1 },
                'ZBI12'
              )
            ];
          }
        }

        const trajectory = computeTrajectory(assessments, functionScores);
        setSelectedTrajectory(trajectory);
        setSelectedPatientName(displayName);
        setSelectedCaregiverName(caregiverRes?.name || 'Primary Caregiver');
        setSelectedConditions(profileRes?.primaryConditions || []);
      } catch (err) {
        console.error('Failed to load dyad trajectory:', err);
        if (!isCancelled) {
          setSelectedTrajectory(computeTrajectory([], []));
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingTrajectory(false);
        }
      }
    };

    void loadDyadTrajectory();

    return () => {
      isCancelled = true;
    };
  }, [selectedDyadUid]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    if (!rows) return [];
    return rows.filter((row) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        row.displayName.toLowerCase().includes(q) ||
        (row.caregiverName ? row.caregiverName.toLowerCase().includes(q) : false) ||
        row.patientUid.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (activeFilter === 'critical') return row.riskBand === 'critical';
      if (activeFilter === 'deteriorating') return row.riskBand === 'deteriorating';
      if (activeFilter === 'stable') return row.riskBand === 'stable';
      if (activeFilter === 'other')
        return row.riskBand === 'lost-to-follow-up' || row.riskBand === 'insufficient-data';
      return true;
    });
  }, [rows, searchQuery, activeFilter]);

  // Cohort summary counts
  const summary = useMemo(() => {
    if (!rows) return { total: 0, critical: 0, deteriorating: 0, stable: 0, other: 0 };
    return {
      total: rows.length,
      critical: rows.length ? rows.filter((r) => r.riskBand === 'critical').length : 0,
      deteriorating: rows.length ? rows.filter((r) => r.riskBand === 'deteriorating').length : 0,
      stable: rows.length ? rows.filter((r) => r.riskBand === 'stable').length : 0,
      other: rows.length
        ? rows.filter(
            (r) => r.riskBand === 'lost-to-follow-up' || r.riskBand === 'insufficient-data'
          ).length
        : 0
    };
  }, [rows]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-primary mb-1">
            <HeartPulse className="w-4 h-4 text-blue-500" />
            <span>Kutumbh Clinician OPD Suite</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">Longitudinal Analytics</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground flex items-center gap-2.5">
            Scissors Trajectory Analytics
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl">
            Dual-axis longitudinal monitoring: Caregiver Strain (Zarit Burden Index) vs.
            Care-Recipient Dependency (Barthel Index). Detect divergence velocity before institutionalization or caregiver breakdown.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadCohort(true)}
            disabled={isRefreshing}
            className="h-9 text-xs font-semibold gap-1.5 border-border/80 bg-background/80 hover:bg-muted"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isRefreshing && 'animate-spin')} />
            <span>Refresh</span>
          </Button>
          <Link href="/clinic/roster">
            <Button
              variant="outline"
              size="sm"
              className="h-9 text-xs font-semibold gap-1.5 border-border/80 bg-background/80 hover:bg-muted"
            >
              <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Patient Roster</span>
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button
              size="sm"
              className="h-9 text-xs font-semibold gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Doctor Dashboard</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Cohort Metric Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card className="rounded-2xl border-border/70 shadow-2xs">
          <CardContent className="p-3.5 sm:p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Total Dyads</span>
              <Users className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-black mt-1 text-foreground">{summary.total}</div>
            <span className="text-[11px] text-muted-foreground">Active cohort monitoring</span>
          </CardContent>
        </Card>

        <Card
          onClick={() => setActiveFilter('critical')}
          className={cn(
            'rounded-2xl border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10 cursor-pointer transition-all shadow-2xs',
            activeFilter === 'critical' && 'ring-2 ring-rose-500'
          )}
        >
          <CardContent className="p-3.5 sm:p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-700 dark:text-rose-400">Critical Divergence</span>
              <AlertTriangle className="w-4 h-4 text-rose-600 animate-pulse" />
            </div>
            <div className="text-2xl font-black mt-1 text-rose-700 dark:text-rose-400">
              {summary.critical}
            </div>
            <span className="text-[11px] text-rose-600/80 dark:text-rose-400/80">Widening scissors gap</span>
          </CardContent>
        </Card>

        <Card
          onClick={() => setActiveFilter('deteriorating')}
          className={cn(
            'rounded-2xl border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 cursor-pointer transition-all shadow-2xs',
            activeFilter === 'deteriorating' && 'ring-2 ring-amber-500'
          )}
        >
          <CardContent className="p-3.5 sm:p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400">Deteriorating</span>
              <TrendingUp className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black mt-1 text-amber-700 dark:text-amber-400">
              {summary.deteriorating}
            </div>
            <span className="text-[11px] text-amber-600/80 dark:text-amber-400/80">Burden rising &gt; MCID</span>
          </CardContent>
        </Card>

        <Card
          onClick={() => setActiveFilter('stable')}
          className={cn(
            'rounded-2xl border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 cursor-pointer transition-all shadow-2xs',
            activeFilter === 'stable' && 'ring-2 ring-emerald-500'
          )}
        >
          <CardContent className="p-3.5 sm:p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Compensated</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black mt-1 text-emerald-700 dark:text-emerald-400">
              {summary.stable}
            </div>
            <span className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80">Equilibrium maintained</span>
          </CardContent>
        </Card>

        <Card
          onClick={() => setActiveFilter('other')}
          className={cn(
            'rounded-2xl border-slate-500/30 bg-slate-500/5 hover:bg-slate-500/10 cursor-pointer transition-all col-span-2 sm:col-span-1 shadow-2xs',
            activeFilter === 'other' && 'ring-2 ring-slate-500'
          )}
        >
          <CardContent className="p-3.5 sm:p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Intake Needed</span>
              <Info className="w-4 h-4 text-slate-500" />
            </div>
            <div className="text-2xl font-black mt-1 text-slate-700 dark:text-slate-300">
              {summary.other}
            </div>
            <span className="text-[11px] text-slate-500">Follow-up overdue</span>
          </CardContent>
        </Card>
      </div>

      {/* Clinical Scissors Concept Banner */}
      <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-teal-500/10 p-4 sm:p-5 text-xs text-foreground/90">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-blue-600 text-white shrink-0 mt-0.5 shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="space-y-1 leading-relaxed">
            <h2 className="font-bold text-sm text-foreground">
              Clinical Science: The Geriatric &ldquo;Scissors Effect&rdquo;
            </h2>
            <p className="text-muted-foreground text-[11px] sm:text-xs">
              Longitudinal research demonstrates that geriatric emergencies occur when caregiver burden (red line, normalized Zarit Burden %)
              surges while care-recipient functional dependency (blue line, inverted Barthel Index) accelerates downward.
              When the distance between the two curves widens beyond the Minimum Clinically Important Difference (MCID = &plusmn;5% / 30 days),
              it heralds sudden care collapse, avoidable ER transfers, or institutionalization.
            </p>
          </div>
        </div>
      </div>

      {/* Main Dual-Pane Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Dyad Selector List */}
        <div className="lg:col-span-4 space-y-3">
          <Card className="rounded-3xl border-border/70 shadow-xs">
            <CardHeader className="p-4 pb-2 space-y-2.5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Cohort Dyads</span>
                </CardTitle>
                <Badge variant="outline" className="text-[10px] font-semibold">
                  {filteredRows.length} showing
                </Badge>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search patient, caregiver..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-xs rounded-xl"
                />
              </div>

              {/* Filter Pills */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {(['all', 'critical', 'deteriorating', 'stable', 'other'] as FilterCategory[]).map(
                  (cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveFilter(cat)}
                      className={cn(
                        'px-2 py-0.5 rounded-lg text-[10px] font-semibold capitalize transition-all border cursor-pointer',
                        activeFilter === cat
                          ? 'bg-primary text-primary-foreground border-primary shadow-2xs'
                          : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted'
                      )}
                    >
                      {cat}
                    </button>
                  )
                )}
              </div>
            </CardHeader>

            <CardContent className="p-2 pt-0 max-h-[580px] overflow-y-auto space-y-1.5 divide-y divide-border/40">
              {isLoadingCohort ? (
                <div className="p-6 text-center text-xs text-muted-foreground space-y-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-primary mx-auto" />
                  <span>Loading cohort trajectories...</span>
                </div>
              ) : filteredRows.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  No dyads match your current filter or query.
                </div>
              ) : (
                filteredRows.map((row) => {
                  const isSelected = row.patientUid === selectedDyadUid;
                  return (
                    <button
                      key={row.patientUid}
                      onClick={() => setSelectedDyadUid(row.patientUid)}
                      className={cn(
                        'w-full text-left p-3 rounded-2xl transition-all cursor-pointer flex flex-col gap-1.5 pt-2.5',
                        isSelected
                          ? 'bg-blue-500/10 border border-blue-500/40 shadow-xs'
                          : 'hover:bg-muted/60 border border-transparent'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span className="font-bold text-xs text-foreground block truncate capitalize">
                            {row.displayName.replace(/\s*\(\d+\s*yrs?\)/gi, '')}
                          </span>
                          <span className="text-[11px] text-muted-foreground block truncate">
                            Caregiver: {row.caregiverName || 'Primary Caregiver'}
                          </span>
                        </div>
                        <Badge
                          className={cn(
                            'text-[9px] px-1.5 py-0 font-bold shrink-0',
                            RISK_BAND_STYLE[row.riskBand] || 'bg-muted text-foreground'
                          )}
                        >
                          {RISK_BAND_LABEL[row.riskBand] || row.riskBand}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-muted-foreground/90 pt-1 border-t border-border/30">
                        <span className="flex items-center gap-1">
                          <Activity className="w-3 h-3 text-blue-500" />
                          <span>
                            {row.burdenTrendPerMonth !== null
                              ? `${row.burdenTrendPerMonth > 0 ? '+' : ''}${row.burdenTrendPerMonth.toFixed(1)}%/mo`
                              : 'Baseline'}
                          </span>
                        </span>

                        <span>
                          {row.latestAssessmentAgeDays !== null
                            ? `${row.latestAssessmentAgeDays}d ago`
                            : 'Score pending'}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Interactive Scissors Trajectory Studio */}
        <div className="lg:col-span-8 space-y-4">
          {selectedTrajectory && selectedDyadUid ? (
            <div className="space-y-4">
              {/* Selected Dyad Banner */}
              <Card className="rounded-3xl border-border/80 shadow-xs overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-rose-500" />
                <CardHeader className="p-4 sm:p-5 pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-base sm:text-lg font-bold text-foreground">
                          {selectedPatientName}
                        </CardTitle>
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {selectedDyadUid.startsWith('demo-') ? 'DEMO DYAD' : selectedDyadUid}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs text-muted-foreground mt-0.5">
                        Caregiver Dyad: <span className="font-semibold text-foreground">{selectedCaregiverName}</span>
                        {selectedConditions.length > 0 && (
                          <span> • Diagnoses: {selectedConditions.slice(0, 3).join(', ')}</span>
                        )}
                      </CardDescription>
                    </div>

                    <Link href={`/clinic/dyad/${selectedDyadUid}`}>
                      <Button
                        size="sm"
                        className="h-8 text-xs font-semibold gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-xs shrink-0"
                      >
                        <span>Open Dyad Workspace</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>

                <CardContent className="p-4 sm:p-5 pt-0 space-y-4">
                  {/* Categorical Risk Banner */}
                  <RiskHeader trajectory={selectedTrajectory} />

                  {/* Chart Card */}
                  <div className="rounded-2xl border border-border/70 p-3 sm:p-4 bg-card/60 backdrop-blur-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                      <div>
                        <h3 className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-1.5">
                          <Activity className="w-4 h-4 text-blue-500" />
                          <span>Longitudinal Scissors Chart</span>
                        </h3>
                        <p className="text-[11px] text-muted-foreground">
                          Normalized Zarit Burden (red curve, rising = strain) plotted with Inverted Barthel Dependency (blue curve, rising = decline).
                        </p>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] font-medium shrink-0">
                        <span className="flex items-center gap-1.5">
                          <span className="w-3 h-1.5 rounded-full bg-rose-500" />
                          <span className="text-rose-600 dark:text-rose-400 font-bold">Caregiver Burden %</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-3 h-1.5 rounded-full bg-blue-500" />
                          <span className="text-blue-600 dark:text-blue-400 font-bold">Patient Dependency %</span>
                        </span>
                      </div>
                    </div>

                    {isLoadingTrajectory ? (
                      <div className="h-64 sm:h-80 w-full flex items-center justify-center bg-muted/20 rounded-xl animate-pulse">
                        <span className="text-xs text-muted-foreground flex items-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                          Calculating trajectory math...
                        </span>
                      </div>
                    ) : (
                      <ScissorsChart trajectory={selectedTrajectory} />
                    )}
                  </div>

                  {/* Quantitative Slope & Clinical Decision Callouts */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div className="rounded-2xl border border-border/60 bg-muted/30 p-3 space-y-1">
                      <span className="text-[11px] font-medium text-muted-foreground block">
                        Caregiver Burden Velocity
                      </span>
                      <div className="text-lg font-bold text-foreground flex items-center gap-1.5">
                        {selectedTrajectory.burdenSlope.slopePerMonth !== null ? (
                          <>
                            {selectedTrajectory.burdenSlope.slopePerMonth > 0 ? (
                              <TrendingUp className="w-4 h-4 text-rose-500" />
                            ) : (
                              <TrendingDown className="w-4 h-4 text-emerald-500" />
                            )}
                            <span>
                              {selectedTrajectory.burdenSlope.slopePerMonth > 0 ? '+' : ''}
                              {selectedTrajectory.burdenSlope.slopePerMonth.toFixed(1)}% / mo
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">Insufficient baseline</span>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground/80 block">
                        MCID threshold: &plusmn;{ZBI_MCID_PERCENTAGE_POINTS_PER_30_DAYS}% per 30 days
                      </span>
                    </div>

                    <div className="rounded-2xl border border-border/60 bg-muted/30 p-3 space-y-1">
                      <span className="text-[11px] font-medium text-muted-foreground block">
                        Functional Dependency Velocity
                      </span>
                      <div className="text-lg font-bold text-foreground flex items-center gap-1.5">
                        {selectedTrajectory.functionSlope.slopePerMonth !== null ? (
                          <>
                            {selectedTrajectory.functionSlope.slopePerMonth > 0 ? (
                              <TrendingUp className="w-4 h-4 text-amber-500" />
                            ) : (
                              <TrendingDown className="w-4 h-4 text-blue-500" />
                            )}
                            <span>
                              {selectedTrajectory.functionSlope.slopePerMonth > 0 ? '+' : ''}
                              {selectedTrajectory.functionSlope.slopePerMonth.toFixed(1)}% / mo
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">ADL tracking pending</span>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground/80 block">
                        Barthel index inverted (rising = dependency)
                      </span>
                    </div>

                    <div className="rounded-2xl border border-border/60 bg-muted/30 p-3 space-y-1">
                      <span className="text-[11px] font-medium text-muted-foreground block">
                        Clinical Action Recommendation
                      </span>
                      <div className="text-xs font-bold text-foreground">
                        {selectedTrajectory.riskBand === 'critical' && 'Immediate Respite & Emergency Transport Review'}
                        {selectedTrajectory.riskBand === 'deteriorating' && '30-Day Reassessment & Med Burden Audit'}
                        {selectedTrajectory.riskBand === 'stable' && 'Routine 60-90 Day Dyad Follow-up'}
                        {selectedTrajectory.riskBand === 'lost-to-follow-up' && 'Outreach to Dyad for Vital/ZBI Check'}
                        {selectedTrajectory.riskBand === 'insufficient-data' && 'Schedule Baseline Functional Assessment'}
                      </div>
                      <span className="text-[10px] text-muted-foreground/80 block">
                        Tailored to AGS &amp; Zarit Clinical Guidelines
                      </span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/50">
                    <div className="text-[11px] text-muted-foreground">
                      Viewing longitudinal history: {selectedTrajectory.burdenSeries.length} ZBI intake{selectedTrajectory.burdenSeries.length === 1 ? '' : 's'},{' '}
                      {selectedTrajectory.functionSeries.length} ADL intake{selectedTrajectory.functionSeries.length === 1 ? '' : 's'}.
                    </div>

                    <div className="flex items-center gap-2">
                      <Link href={`/clinic/dyad/${selectedDyadUid}?tab=overview`}>
                        <Button variant="outline" size="sm" className="h-8 text-xs font-semibold gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-blue-500" />
                          <span>Detailed Scissors &amp; Matrix</span>
                        </Button>
                      </Link>
                      <Link href={`/clinic/dyad/${selectedDyadUid}?tab=assessments`}>
                        <Button size="sm" className="h-8 text-xs font-semibold gap-1.5 bg-blue-600 hover:bg-blue-700 text-white">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Log New Assessment</span>
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="rounded-3xl border-border/80 p-12 text-center">
              <HeartPulse className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
              <h2 className="text-base font-bold text-foreground">Select a Dyad to View Trajectory</h2>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Choose a patient from the roster on the left to examine their longitudinal burden-function divergence curves.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
