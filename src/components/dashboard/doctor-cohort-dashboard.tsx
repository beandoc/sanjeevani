'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Stethoscope,
  Users,
  AlertTriangle,
  CalendarClock,
  Activity,
  HeartPulse,
  ShieldAlert,
  Send,
  Bed,
  Clock,
  HeartHandshake,
  ChevronRight,
  ChevronLeft,
  UserMinus,
  Trash2,
  ClipboardList,
  UserRoundSearch,
  Calendar,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import Link from 'next/link';
import {
  loadCohortRoster,
  getCachedCohortRoster,
  summarizeCohort,
  RISK_BAND_STYLE,
  invalidateCohortCache,
  isDemoDyad,
  isSevereZbi,
  getZaritSeverityBand,
  type CohortRow
} from '@/lib/analytics/cohort';
import type { RiskBand } from '@/lib/analytics/trajectory';
import { isReassessmentDue } from '@/lib/zarit-scale';
import { HealthRepository } from '@/lib/db/health-repository';
import type { ClinicalSignal } from '@/lib/clinical/care-intelligence';
import { cn } from '@/lib/utils';
import { getDyadWorkflow } from '@/lib/clinical/dyad-workflow';
import { ClinicianQueryDashboard } from '@/components/clinician/clinician-query-dashboard';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import {
  dischargeOrDeletePatientDyad,
  purgeAllDemoDyads,
  requestReassessment,
  subscribeToReassessmentAlerts,
  subscribeToCohortClinicalData,
  dismissReassessmentAlert,
  type ReassessmentAlert
} from '@/lib/firebase/clinical-sync';

const RISK_BAND_LABEL: Record<RiskBand, string> = {
  critical: 'Critical (High Burnout Risk)',
  'lost-to-follow-up': 'Lost to Follow-Up',
  deteriorating: 'Deteriorating',
  'insufficient-data': 'Insufficient Data',
  stable: 'Stable'
};

type FilterType =
  | 'all'
  | 'urgent_today'
  | 'lost_to_follow_up'
  | 'severe_burnout'
  | 'reassessment_due'
  | 'bed_bound_pi'
  | 'care_gap'
  | 'critical'
  | 'respite';

function formatFormalSupport(type: string | undefined, hours?: number) {
  if (!hours || hours === 0) return '0h Solo';
  const t = (type || '').toLowerCase();
  let role = 'Attendant';
  if (t.includes('nurse')) role = 'Nurse';
  else if (t.includes('medical_assistant')) role = 'Med Asst';
  else if (t.includes('family')) role = 'Family Rota';
  return `${hours}h ${role}`;
}

function getDaysAgo(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const diffMs = Date.now() - new Date(dateStr).getTime();
  if (isNaN(diffMs) || diffMs < 0) return 0;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
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
  const [rows, setRows] = useState<CohortRow[] | null>(() => getCachedCohortRoster());
  const [_isRefreshing, setIsRefreshing] = useState(false);
  const [isPurgingDummies, setIsPurgingDummies] = useState(false);
  const [dischargingUids, setDischargingUids] = useState<Set<string>>(new Set());
  const [alerts, setAlerts] = useState<ReassessmentAlert[]>([]);
  const [dismissingAlert, setDismissingAlert] = useState<ReassessmentAlert | null>(null);
  const [dismissResolution, setDismissResolution] = useState('called_caregiver');
  const [requestingUids, setRequestingUids] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();

  // Reset pagination to page 1 whenever search query or filter chip changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeFilter]);

  const hasDemoPatients = useMemo(() => {
    if (!rows) return false;
    return rows.some((r) => isDemoDyad(r.patientUid) || isDemoDyad(r.displayName));
  }, [rows]);

  const load = async (force = false) => {
    setIsRefreshing(true);
    const data = await loadCohortRoster(force);
    setRows(data);
    setIsRefreshing(false);
  };

  const handlePurgeDummies = async () => {
    setIsPurgingDummies(true);
    try {
      await purgeAllDemoDyads();
      invalidateCohortCache();
      await load(true);
      toast({
        title: 'Demo Patients Purged',
        description: 'Seeded dummy patients have been permanently removed.'
      });
    } catch {
      toast({
        variant: 'destructive',
        title: 'Purge Failed',
        description: 'Could not purge demo records. Please try again.'
      });
    } finally {
      setIsPurgingDummies(false);
    }
  };

  const handleDischargePatient = async (patientUid: string, displayName: string) => {
    setDischargingUids((prev) => new Set([...prev, patientUid]));
    try {
      await dischargeOrDeletePatientDyad(patientUid);
      invalidateCohortCache();
      await load(true);
      toast({
        title: 'Patient Discharged',
        description: `${displayName} has been removed from your active roster.`
      });
    } catch {
      toast({
        variant: 'destructive',
        title: 'Discharge Failed',
        description: 'Failed to remove patient. Please try again.'
      });
    } finally {
      setDischargingUids((prev) => {
        const next = new Set(prev);
        next.delete(patientUid);
        return next;
      });
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    const handleCohortUpdated = () => {
      invalidateCohortCache();
      void load(true);
    };
    window.addEventListener('sanjeevani:cohort-updated', handleCohortUpdated);
    return () => {
      window.removeEventListener('sanjeevani:cohort-updated', handleCohortUpdated);
    };
  }, []);

  const patientUidsKey = useMemo(() => {
    return (rows || []).map((row) => row.patientUid).sort().join(',');
  }, [rows]);

  useEffect(() => {
    if (!patientUidsKey) return;
    const uids = patientUidsKey.split(',').filter(Boolean);
    return subscribeToCohortClinicalData(uids, () => {
      invalidateCohortCache();
      void (async () => {
        setIsRefreshing(true);
        const fresh = await loadCohortRoster(true);
        setRows(fresh);
        setIsRefreshing(false);
      })();
    });
  }, [patientUidsKey]);

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

  const handleDismissAlert = async (alertId: string, resolution?: string) => {
    try {
      await dismissReassessmentAlert(alertId, resolution);
      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
      toast({
        title: 'Alert Resolved',
        description: 'The burden escalation alert has been resolved and audit logged.'
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
    const urgentTodayCount = rows.filter(
      (r) => r.patientAcuity === 'urgent' || (r.dailyLogSignals || []).some((signal) => signal.severity === 'urgent')
    ).length;
    const lostToFollowUpCount = rows.filter((r) => r.riskBand === 'lost-to-follow-up').length;
    const severeBurnoutCount = rows.filter((r) => isSevereZbi(r) || r.riskBand === 'critical').length;
    const reassessmentDueCount = rows.filter((r) => {
      const dueCheck = r.latestTier && r.latestCompletedAt ? { tier: r.latestTier, completedAt: r.latestCompletedAt } : null;
      return isReassessmentDue(dueCheck);
    }).length;
    const bedBoundOrPiCount = rows.filter(
      (r) => r.isBedBound || Boolean(r.worstPressureInjuryStage && r.worstPressureInjuryStage !== 'none')
    ).length;
    const qocWarnings = rows.filter((r) => r.hasQocWarning).length;
    const soloCaregivers = rows.filter((r) => r.workflow?.isCarePlanningReady && r.formalSupportHours === 0).length;
    const respiteNeeded = rows.filter((r) => r.respitePrescription?.needed).length;

    return {
      total,
      urgentTodayCount,
      lostToFollowUpCount,
      severeBurnoutCount,
      reassessmentDueCount,
      bedBoundOrPiCount,
      qocWarnings,
      soloCaregivers,
      respiteNeeded
    };
  }, [rows]);

  // Urgent patient alarms from daily care logs
  const urgentRowAlerts = useMemo(() => {
    if (!rows) return [];
    const list: Array<{
      patientUid: string;
      patientName: string;
      urgentSignal: ClinicalSignal;
    }> = [];
    for (const row of rows) {
      const topUrgent = (row.dailyLogSignals || []).find((s) => s.severity === 'urgent');
      if (topUrgent) {
        list.push({
          patientUid: row.patientUid,
          patientName: row.displayName,
          urgentSignal: topUrgent
        });
      }
    }
    return list;
  }, [rows]);

  // Today's appointments (P2 #21)
  const todayAppointments = useMemo(() => {
    try {
      const todayStr = new Date().toISOString().slice(0, 10);
      const appts = HealthRepository.getAppointments();
      return appts.filter((a) => a.date === todayStr && a.status !== 'cancelled');
    } catch {
      return [];
    }
  }, []);

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

      // Filter tabs & tiles
      if (activeFilter === 'urgent_today') {
        return row.patientAcuity === 'urgent' || (row.dailyLogSignals || []).some((s) => s.severity === 'urgent');
      }
      if (activeFilter === 'lost_to_follow_up') {
        return row.riskBand === 'lost-to-follow-up';
      }
      if (activeFilter === 'severe_burnout' || activeFilter === 'critical') {
        return isSevereZbi(row) || row.riskBand === 'critical' || Boolean(row.hasRedFlag);
      }
      if (activeFilter === 'reassessment_due') {
        const dueCheck = row.latestTier && row.latestCompletedAt ? { tier: row.latestTier, completedAt: row.latestCompletedAt } : null;
        return isReassessmentDue(dueCheck);
      }
      if (activeFilter === 'bed_bound_pi') {
        return row.isBedBound || Boolean(row.worstPressureInjuryStage && row.worstPressureInjuryStage !== 'none');
      }
      if (activeFilter === 'care_gap') return Boolean(row.hasQocWarning);
      if (activeFilter === 'respite') return Boolean(row.respitePrescription?.needed);
      return true;
    });
  }, [rows, searchQuery, activeFilter]);

  // Criticality weight helper for High-to-Low ordering
  const getCriticalityWeight = (row: CohortRow): number => {
    let score = 0;
    // Patient medical acute emergency sorts HIGHEST (+20,000):
    const hasUrgentSignal = row.patientAcuity === 'urgent' || (row.dailyLogSignals || []).some((s) => s.severity === 'urgent');
    if (hasUrgentSignal) score += 20000;

    // Caregiver risk bands:
    if (row.riskBand === 'critical') score += 10000;
    else if (row.riskBand === 'lost-to-follow-up') score += 7000;
    else if (row.riskBand === 'deteriorating') score += 5000;
    else if (row.riskBand === 'insufficient-data') score += 2000;
    else score += 1000; // stable

    // Patient watch acuity:
    if (row.patientAcuity === 'watch') score += 3000;

    // Severe ZBI / Red flags:
    if (isSevereZbi(row)) score += 3500;
    if (row.hasRedFlag) score += 2500;
    if (row.respitePrescription?.urgency === 'urgent') score += 1500;

    // Mobility & Skin integrity
    if (row.worstPressureInjuryStage && row.worstPressureInjuryStage !== 'none') score += 1800;
    if (row.isBedBound) score += 1200;
    if ((row.fallHistory || 0) > 0) score += (row.fallHistory || 0) * 800;

    // Zarit burden % (0 - 100)
    if (typeof row.latestBurdenPct === 'number') {
      score += row.latestBurdenPct * 10;
    }

    // Quality of care / Care gaps
    if (row.hasQocWarning) score += 500;
    if ((row.formalSupportHours ?? 0) === 0) score += 200;

    return score;
  };

  // Sort rows in order of criticality - High to low
  const sortedRows = useMemo(() => {
    return [...filteredRows].sort((a, b) => getCriticalityWeight(b) - getCriticalityWeight(a));
  }, [filteredRows]);

  const ITEMS_PER_PAGE = 8;
  const totalPages = Math.ceil(sortedRows.length / ITEMS_PER_PAGE) || 1;
  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedRows.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedRows, currentPage]);

  if (!rows) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-24 bg-muted/40 rounded-2xl border border-border/60" />
          ))}
        </div>
        <div className="h-96 bg-muted/30 rounded-3xl border border-border/60" />
      </div>
    );
  }

  const _summary = summarizeCohort(rows);

  return (
    <div className="space-y-5">
      {/* 1. TODAY'S SCHEDULE (OPD & HOME VISITS) */}
      {todayAppointments.length > 0 && (
        <div className="p-3 sm:p-3.5 rounded-xl border border-border/60 bg-muted/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2.5 text-foreground">
            <span className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0">
              <Calendar className="w-4 h-4" />
            </span>
            <div>
              <span className="font-bold">Today’s Schedule:</span>{' '}
              <span className="font-medium text-muted-foreground">
                {todayAppointments.length} appointment{todayAppointments.length === 1 ? '' : 's'} scheduled today
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {todayAppointments.map((apt) => {
              const timeDisplay = apt.date.includes('T')
                ? new Date(apt.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : 'Today';
              return (
                <span
                  key={apt.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-card border border-border/80 text-[11px] font-semibold text-foreground shrink-0 shadow-2xs"
                >
                  <Clock className="w-3 h-3 text-primary" />
                  <span>{timeDisplay}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="truncate max-w-[130px]">{apt.department || apt.doctor}</span>
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. ONE ROW OF CLICKABLE COUNT TILES ACTING AS FILTERS */}
      {cohortMetrics && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Tile 1: Active Clinical Dyads */}
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={cn(
              'p-3.5 rounded-xl border transition-all text-left flex flex-col justify-between gap-2 shadow-xs cursor-pointer',
              activeFilter === 'all'
                ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                : 'border-border/60 bg-card hover:bg-muted/40 hover:border-primary/40'
            )}
            title="All active clinical dyads in cohort"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider font-bold text-primary">
                Active Dyads
              </span>
              <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <Users className="w-4 h-4" />
              </span>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black font-mono text-foreground">
                {cohortMetrics.total}
              </p>
              <p className="text-[11px] text-muted-foreground font-medium mt-0.5 truncate">
                Total active dyads
              </p>
            </div>
          </button>

          {/* Tile 2: Urgent Today (Patient Acuity) */}
          <button
            type="button"
            onClick={() => setActiveFilter((prev) => (prev === 'urgent_today' ? 'all' : 'urgent_today'))}
            className={cn(
              'p-3.5 rounded-xl border transition-all text-left flex flex-col justify-between gap-2 shadow-xs cursor-pointer',
              activeFilter === 'urgent_today'
                ? 'border-orange-500 bg-orange-500/10 ring-1 ring-orange-500/30'
                : 'border-border/60 bg-card hover:bg-orange-500/5 hover:border-orange-500/40'
            )}
            title="Patients with urgent clinical signals today"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider font-bold text-orange-600 dark:text-orange-400">
                Urgent Today
              </span>
              <span className="p-1.5 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400">
                <AlertTriangle className="w-4 h-4" />
              </span>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black font-mono text-foreground">
                {cohortMetrics.urgentTodayCount}
              </p>
              <p className="text-[11px] text-muted-foreground font-medium mt-0.5 truncate">
                Acute signals
              </p>
            </div>
          </button>

          {/* Tile 3: Lost to Follow-up */}
          <button
            type="button"
            onClick={() => setActiveFilter((prev) => (prev === 'lost_to_follow_up' ? 'all' : 'lost_to_follow_up'))}
            className={cn(
              'p-3.5 rounded-xl border transition-all text-left flex flex-col justify-between gap-2 shadow-xs cursor-pointer',
              activeFilter === 'lost_to_follow_up'
                ? 'border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/30'
                : 'border-border/60 bg-card hover:bg-amber-500/5 hover:border-amber-500/40'
            )}
            title="Patients with no contact in >30 days"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider font-bold text-amber-600 dark:text-amber-400">
                Lost to Follow-up
              </span>
              <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Clock className="w-4 h-4" />
              </span>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black font-mono text-foreground">
                {cohortMetrics.lostToFollowUpCount}
              </p>
              <p className="text-[11px] text-muted-foreground font-medium mt-0.5 truncate">
                No recent contact
              </p>
            </div>
          </button>

          {/* Tile 4: Caregiver Critical: High Burnout Risk */}
          <button
            type="button"
            onClick={() => setActiveFilter((prev) => (prev === 'critical' || prev === 'severe_burnout' ? 'all' : 'critical'))}
            className={cn(
              'p-3.5 rounded-xl border transition-all text-left flex flex-col justify-between gap-2 shadow-xs cursor-pointer',
              activeFilter === 'critical' || activeFilter === 'severe_burnout'
                ? 'border-orange-500 bg-orange-500/10 ring-1 ring-orange-500/30'
                : 'border-border/60 bg-card hover:bg-orange-500/5 hover:border-orange-500/40'
            )}
            title="Dyad with high burnout risk"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider font-bold text-orange-600 dark:text-orange-400">
                High Burnout
              </span>
              <span className="p-1.5 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400">
                <Activity className="w-4 h-4" />
              </span>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black font-mono text-foreground">
                {cohortMetrics.severeBurnoutCount}
              </p>
              <p className="text-[11px] text-muted-foreground font-medium mt-0.5 truncate" title="Dyad with high burnout risk">
                High burnout risk
              </p>
            </div>
          </button>

          {/* Tile 5: Reassessment Due */}
          <button
            type="button"
            onClick={() => setActiveFilter((prev) => (prev === 'reassessment_due' ? 'all' : 'reassessment_due'))}
            className={cn(
              'p-3.5 rounded-xl border transition-all text-left flex flex-col justify-between gap-2 shadow-xs cursor-pointer',
              activeFilter === 'reassessment_due'
                ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500/30'
                : 'border-border/60 bg-card hover:bg-blue-500/5 hover:border-blue-500/40'
            )}
            title="Overdue Zarit assessments"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider font-bold text-blue-600 dark:text-blue-400">
                Reassessment
              </span>
              <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <CalendarClock className="w-4 h-4" />
              </span>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black font-mono text-foreground">
                {cohortMetrics.reassessmentDueCount}
              </p>
              <p className="text-[11px] text-muted-foreground font-medium mt-0.5 truncate">
                Overdue checks
              </p>
            </div>
          </button>

          {/* Tile 6: Bedbound / PI */}
          <button
            type="button"
            onClick={() => setActiveFilter((prev) => (prev === 'bed_bound_pi' ? 'all' : 'bed_bound_pi'))}
            className={cn(
              'p-3.5 rounded-xl border transition-all text-left flex flex-col justify-between gap-2 shadow-xs cursor-pointer',
              activeFilter === 'bed_bound_pi'
                ? 'border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/30'
                : 'border-border/60 bg-card hover:bg-amber-500/5 hover:border-amber-500/40'
            )}
            title="Immobility or pressure injury"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider font-bold text-amber-600 dark:text-amber-400">
                Bedbound / PI
              </span>
              <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Bed className="w-4 h-4" />
              </span>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black font-mono text-foreground">
                {cohortMetrics.bedBoundOrPiCount}
              </p>
              <p className="text-[11px] text-muted-foreground font-medium mt-0.5 truncate">
                Immobility & PI
              </p>
            </div>
          </button>
        </div>
      )}

      {/* 3. NEEDS ATTENTION TODAY ALERTS FEED */}
      {(urgentRowAlerts.length > 0 || alerts.length > 0) && (
        <Card className="border border-orange-500/40 bg-orange-500/5 shadow-xs animate-in fade-in duration-300 rounded-xl overflow-hidden">
          <CardHeader className="p-3.5 sm:p-4 pb-2">
            <CardTitle className="text-xs sm:text-sm font-bold text-orange-800 dark:text-orange-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5 uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 text-orange-600 animate-pulse" />
                Needs attention today ({urgentRowAlerts.length + alerts.length})
              </span>
              <span className="text-[11px] font-medium text-muted-foreground">Clinical action required</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5 p-3.5 sm:p-4 pt-0">
            {/* Urgent patient daily log signals */}
            {urgentRowAlerts.map((item) => (
              <div
                key={`urgent_${item.patientUid}_${item.urgentSignal.id}`}
                className="p-3.5 rounded-xl border border-orange-200 dark:border-orange-900/50 bg-card flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs shadow-2xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className="text-xs font-bold uppercase bg-orange-600 hover:bg-orange-700 text-white border-transparent">
                      Patient: Urgent Signal
                    </Badge>
                    <span className="font-bold text-foreground text-xs">{item.patientName}</span>
                    {item.urgentSignal.date && (
                      <span className="text-muted-foreground font-mono text-[11px]">
                        ({item.urgentSignal.date})
                      </span>
                    )}
                  </div>
                  <p className="text-foreground text-xs font-semibold">
                    ⚠ {item.urgentSignal.title}: <span className="font-normal text-muted-foreground">{item.urgentSignal.detail}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link href={`/clinic/dyad/${item.patientUid}`}>
                    <Button size="sm" className="h-8 text-xs font-bold gap-1 bg-orange-600 hover:bg-orange-700 text-white">
                      <Stethoscope className="w-3.5 h-3.5" /> Review Patient
                    </Button>
                  </Link>
                </div>
              </div>
            ))}

            {/* Caregiver ZBI escalation alerts */}
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="p-3.5 rounded-xl border border-orange-200 dark:border-orange-900/50 bg-card flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs shadow-2xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className="text-xs font-bold uppercase bg-orange-600 hover:bg-orange-700 text-white border-transparent">
                      {alert.needsCaregiverRespite ? 'Respite Needed' : 'Zarit Surge'}
                    </Badge>
                    <span className="font-bold text-foreground text-xs">{alert.patientName}</span>
                    <span className="text-muted-foreground font-mono text-[11px]">
                      ({new Date(alert.completedAt).toLocaleDateString()})
                    </span>
                  </div>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    Caregiver burden score escalated from <strong className="text-foreground font-semibold">{alert.previousScore}%</strong> to{' '}
                    <strong className="text-orange-600 dark:text-orange-400 font-black">{alert.newScore}%</strong>.
                    {alert.needsCaregiverRespite
                      ? ` ${alert.reason || 'Arrange caregiver respite and review the monthly support matrix.'}`
                      : ' Burden rose to severe range.'}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs font-bold border-orange-300 text-orange-700 dark:text-orange-300 hover:bg-orange-500/10"
                    onClick={() => setDismissingAlert(alert)}
                  >
                    Dismiss
                  </Button>
                  <Link href={`/clinic/dyad/${alert.patientUid || ''}`}>
                    <Button size="sm" className="h-8 text-xs font-bold gap-1 bg-orange-600 hover:bg-orange-700 text-white">
                      <Stethoscope className="w-3.5 h-3.5" /> Open Patient Record
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Dismiss Alert Audit Dialog */}
      <AlertDialog open={Boolean(dismissingAlert)} onOpenChange={(open) => !open && setDismissingAlert(null)}>
        <AlertDialogContent className="rounded-2xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-foreground">
              Resolve Alert: {dismissingAlert?.patientName}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Record the clinical action taken to address this caregiver burden escalation for the audit trail.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-2">
            <label htmlFor="cohort-alert-clinical-action" className="text-xs font-semibold text-foreground">
              Clinical Action Taken:
            </label>
            <select
              id="cohort-alert-clinical-action"
              value={dismissResolution}
              onChange={(e) => setDismissResolution(e.target.value)}
              className="w-full h-9 rounded-xl border border-input bg-background px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="called_caregiver">Called caregiver to assess support needs</option>
              <option value="arranged_respite">Arranged temporary caregiver respite</option>
              <option value="booked_visit">Booked clinic consultation / visit</option>
              <option value="acknowledged">Reviewed & not clinically relevant / acknowledged</option>
            </select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl text-xs font-semibold" onClick={() => setDismissingAlert(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={async () => {
                if (dismissingAlert) {
                  await handleDismissAlert(dismissingAlert.id, dismissResolution);
                  setDismissingAlert(null);
                }
              }}
            >
              Confirm & Dismiss
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 4. COMPOSITE PATIENT WORKLIST & QUERY ENGINE */}
      <Card className="border border-border/60 bg-card shadow-xs rounded-xl overflow-hidden">
        <Tabs defaultValue="worklist" className="w-full">
          <CardHeader className="p-3.5 sm:p-4 pb-3 border-b border-border/60 bg-muted/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  <span>Clinical Dyad Command Center</span>
                </CardTitle>
                <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">
                  OPD surveillance, clinical query triage, and active patient dyad worklist.
                </p>
              </div>

              <TabsList className="h-auto sm:h-8.5 bg-muted p-0.5 w-full sm:w-auto grid grid-cols-2 sm:flex border border-border/60 rounded-lg">
                <TabsTrigger
                  value="worklist"
                  className="h-8 sm:h-7.5 text-xs font-semibold px-2 sm:px-3 gap-1 sm:gap-1.5 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs text-muted-foreground rounded-md justify-center"
                >
                  <ClipboardList className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Active Worklist</span>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-mono font-bold shrink-0">
                    {sortedRows.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="queries"
                  className="h-8 sm:h-7.5 text-xs font-semibold px-2 sm:px-3 gap-1 sm:gap-1.5 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs text-muted-foreground rounded-md justify-center"
                >
                  <UserRoundSearch className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Signals by Category</span>
                </TabsTrigger>
              </TabsList>
            </div>
          </CardHeader>

          <CardContent className="p-3 sm:p-4 pt-3">
            <TabsContent value="worklist" className="m-0 space-y-3">
              {/* Filter chips: All, Urgent Today, Critical (High Burnout Risk), Lost to Follow-up, Reassessment Due, Bedbound/PI, etc. */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 max-w-full pb-1">
                {([
                  { key: 'all', label: `All (${rows.length})` },
                  { key: 'urgent_today', label: `Urgent Today (${cohortMetrics?.urgentTodayCount || 0})`, icon: <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />, title: 'Acute delirium, falls, or severe symptoms today' },
                  { key: 'critical', label: `Critical: High Burnout Risk (${cohortMetrics?.severeBurnoutCount || 0})`, icon: <Activity className="w-3.5 h-3.5 text-orange-500" />, title: 'Dyad with high burnout risk (critical trajectory / severe ZBI)' },
                  { key: 'lost_to_follow_up', label: `Lost to Follow-up (${cohortMetrics?.lostToFollowUpCount || 0})`, icon: <Clock className="w-3.5 h-3.5 text-amber-500" />, title: 'No contact in >30 days' },
                  { key: 'reassessment_due', label: `Reassessment Due (${cohortMetrics?.reassessmentDueCount || 0})`, icon: <CalendarClock className="w-3.5 h-3.5 text-blue-500" />, title: 'Overdue Zarit reassessment' },
                  { key: 'bed_bound_pi', label: `Bed-Bound / PI (${cohortMetrics?.bedBoundOrPiCount || 0})`, icon: <Bed className="w-3.5 h-3.5 text-amber-500" />, title: 'Immobility or pressure injury' },
                  { key: 'care_gap', label: `Gaps (${cohortMetrics?.qocWarnings || 0})`, icon: <ShieldAlert className="w-3.5 h-3.5 text-purple-500" />, title: 'Solo caregiver or care planning gaps' },
                  { key: 'respite', label: `Respite (${cohortMetrics?.respiteNeeded || 0})`, icon: <HeartHandshake className="w-3.5 h-3.5 text-amber-500" />, title: 'Respite care recommended' },
                ] as { key: FilterType; label: string; icon?: React.ReactNode; title?: string }[]).map(({ key, label, icon, title }) => (
                  <button
                    key={key}
                    onClick={() => setActiveFilter(key)}
                    title={title}
                    className={cn(
                      'inline-flex items-center gap-1.5 h-7.5 px-3 rounded-lg text-xs transition-all whitespace-nowrap shrink-0 border cursor-pointer',
                      activeFilter === key || (key === 'critical' && activeFilter === 'severe_burnout')
                        ? 'bg-primary text-primary-foreground border-primary shadow-xs font-bold'
                        : 'bg-background text-muted-foreground border-border hover:text-foreground hover:border-foreground/30 font-semibold'
                    )}
                  >
                    {icon}{label}
                  </button>
                ))}
              </div>

              {hasDemoPatients && (
                <div className="mb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 p-3 bg-amber-500/10 border border-amber-500/25 rounded-xl text-xs">
                  <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>Sample dummy patients detected in worklist.</span>
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-7 text-xs font-semibold gap-1.5 rounded-lg shrink-0 w-full sm:w-auto"
                    onClick={handlePurgeDummies}
                    disabled={isPurgingDummies}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {isPurgingDummies ? 'Purging…' : 'Purge Dummy Patients'}
                  </Button>
                </div>
              )}

              {sortedRows.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <Users className="w-8 h-8 text-muted-foreground/40 mx-auto" />
                  <p className="text-sm font-bold text-foreground">No patients matching filter</p>
                  <p className="text-xs text-muted-foreground">Try clearing search or selecting &apos;All&apos;.</p>
                  <Button variant="outline" size="sm" onClick={() => { setSearchQuery(''); setActiveFilter('all'); }}>
                    Reset Filters
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    {paginatedRows.map((row) => {
                      const actionableAlert = getActionableAlert(row.latestAlertSnippet);
                      const workflow = row.workflow || getDyadWorkflow({
                        patient: null,
                        caregiver: null,
                        functionAssessmentCount: 0,
                        burdenAssessmentCount: 0
                      });
                      const isIntakeInProgress = !workflow.isCarePlanningReady;
                      const topUrgentSignal = (row.dailyLogSignals || []).find((s) => s.severity === 'urgent');
                      const vitalDaysAgo = getDaysAgo(row.lastVitalAt);
                      const isVitalsStale = vitalDaysAgo !== null && vitalDaysAgo > 7;
                      const logDaysAgo = getDaysAgo(row.lastDailyLogDate);
                      const zbiSeverity = getZaritSeverityBand(row.latestTier, row.latestBurdenPct);
                      const zbiColor =
                        zbiSeverity === 'critical_red'
                          ? 'text-orange-600 dark:text-orange-400 font-bold'
                          : zbiSeverity === 'red'
                          ? 'text-amber-600 dark:text-amber-400 font-bold'
                          : zbiSeverity === 'amber'
                          ? 'text-yellow-600 dark:text-yellow-400 font-medium'
                          : 'text-foreground font-medium';

                      return (
                        <div
                          key={row.patientUid}
                          className="group p-3.5 rounded-xl transition-all duration-150 border border-border/60 bg-card hover:bg-muted/30 hover:border-border flex flex-col justify-between gap-3 shadow-2xs hover:shadow-xs min-h-[220px]"
                        >
                          {/* Top Content: Patient Acuity & Caregiver Risk Axes */}
                          <div className="space-y-2 min-w-0">
                            {/* Two Axes: Patient Acuity & Caregiver Risk */}
                            <div className="flex items-center justify-between gap-1.5 flex-wrap">
                              {topUrgentSignal ? (
                                <Badge className="text-xs font-bold gap-1 shrink-0 bg-orange-600 hover:bg-orange-700 text-white border-transparent">
                                  <AlertTriangle className="w-3 h-3 shrink-0" />
                                  <span>Patient: {topUrgentSignal.title}</span>
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    'text-xs font-semibold shrink-0',
                                    row.patientAcuity === 'watch'
                                      ? 'border-amber-400 text-amber-700 dark:text-amber-300 bg-amber-500/10'
                                      : 'text-muted-foreground bg-muted/50 border-border/60'
                                  )}
                                >
                                  Patient: {row.patientAcuity === 'watch' ? 'Watch' : 'Stable'}
                                </Badge>
                              )}

                              <Badge
                                className={cn(
                                  'text-xs font-bold uppercase px-2 py-0.5 leading-none shrink-0',
                                  isIntakeInProgress ? 'bg-muted-foreground text-background' : RISK_BAND_STYLE[row.riskBand]
                                )}
                                title="Caregiver risk axis: Critical indicates dyad with high burnout risk"
                              >
                                Caregiver: {isIntakeInProgress ? 'Intake' : (row.riskBand === 'critical' ? 'High Burnout Risk' : RISK_BAND_LABEL[row.riskBand])}
                              </Badge>
                            </div>

                            {/* Patient Demographics & CGA Chips (Row line 1) */}
                            <div className="space-y-1 min-w-0">
                              <h4 className="text-sm font-bold text-foreground capitalize truncate" title={row.displayName}>
                                {row.displayName.replace(/\s*\(\d+\s*yrs?\)/gi, '')}
                                {(row.age || row.gender) && (
                                  <span className="text-xs font-semibold text-muted-foreground ml-1.5 font-mono">
                                    · {row.age ? row.age : ''}{row.gender ? ` ${row.gender}` : ''}
                                  </span>
                                )}
                              </h4>

                              {/* CGA Chips: PI, Bedbound, Cognition, Polypharmacy, Falls (only when abnormal) */}
                              <div className="flex items-center gap-1 flex-wrap">
                                {row.worstPressureInjuryStage && row.worstPressureInjuryStage !== 'none' && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-bold bg-orange-500/15 text-orange-800 dark:text-orange-300 border border-orange-500/30">
                                    PI St {row.worstPressureInjuryStage}
                                  </span>
                                )}
                                {row.isBedBound && (
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-semibold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                                    <Bed className="w-3 h-3" /> Bed-Bound
                                  </span>
                                )}
                                {row.cognitiveLoad && row.cognitiveLoad !== 'none' && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-semibold bg-purple-500/15 text-purple-800 dark:text-purple-300 border border-purple-500/30">
                                    {row.cognitiveLoad === 'wandering_agitation'
                                      ? 'Wandering / Agitation'
                                      : row.cognitiveLoad === 'severe_sundowning'
                                      ? 'Sundowning'
                                      : 'Forgetfulness'}
                                  </span>
                                )}
                                {(row.activeMedicationCount || 0) >= 5 && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-semibold bg-primary/10 text-primary border border-primary/25">
                                    {row.activeMedicationCount} Meds (Polypharmacy)
                                  </span>
                                )}
                                {(row.fallHistory || 0) >= 1 && (
                                  <span
                                    className={cn(
                                      'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-semibold border',
                                      (row.fallHistory || 0) >= 2
                                        ? 'bg-orange-500/15 text-orange-800 dark:text-orange-300 border-orange-500/30'
                                        : 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30'
                                    )}
                                  >
                                    <AlertTriangle className="w-3 h-3" /> {row.fallHistory} fall{(row.fallHistory || 0) === 1 ? '' : 's'} / 6 mo
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Caregiver Identity & Daily Log Recency (Row line 2) */}
                            <div className="space-y-0.5 min-w-0">
                              <p className="text-xs text-muted-foreground truncate" title={row.caregiverName || undefined}>
                                Caregiver: <strong className="text-foreground font-semibold">{row.caregiverName || 'Not yet documented'}</strong>
                                {row.caregiverKinship && ` (${row.caregiverKinship})`}
                              </p>
                              <div className="flex items-center justify-between gap-1 text-[11px]">
                                {!isIntakeInProgress && (
                                  <span className="text-muted-foreground font-medium truncate">
                                    Support: <strong className={cn(row.formalSupportHours === 0 ? 'text-amber-600 dark:text-amber-400 font-semibold' : 'text-foreground')}>
                                      {formatFormalSupport(row.formalSupportType, row.formalSupportHours)}
                                    </strong>
                                  </span>
                                )}
                                {logDaysAgo !== null ? (
                                  <span className={cn('font-semibold shrink-0', logDaysAgo >= 7 ? 'text-orange-600 dark:text-orange-400' : logDaysAgo >= 3 ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground')}>
                                    Last log {logDaysAgo === 0 ? 'today' : `${logDaysAgo}d ago`}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground/60 shrink-0">No logs yet</span>
                                )}
                              </div>
                            </div>

                            {/* Conditions */}
                            {row.conditions && row.conditions.length > 0 && (
                              <p className="text-[11px] text-muted-foreground font-medium line-clamp-1 truncate" title={row.conditions.join(' · ')}>
                                {row.conditions.join(' · ')}
                              </p>
                            )}

                            {/* Alert / Workflow Banner */}
                            {isIntakeInProgress ? (
                              <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 text-[11px] font-semibold flex items-center gap-1.5">
                                <Activity className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">{workflow.completedSteps}/{workflow.totalSteps} · {workflow.nextAction}</span>
                              </div>
                            ) : actionableAlert ? (
                              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/25 text-[11px] font-semibold flex items-center gap-1.5" title={actionableAlert}>
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">{actionableAlert}</span>
                              </div>
                            ) : workflow.isRespiteEvaluationReady && row.respitePrescription?.needed ? (
                              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 text-[11px] font-medium flex items-center gap-1.5">
                                <HeartHandshake className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">Respite: {row.respitePrescription.recommendedDaysPerMonth}d/mo rec.</span>
                              </div>
                            ) : null}
                          </div>

                          {/* Bottom Content: Metrics Strip + Action Buttons */}
                          <div className="pt-2 border-t border-border/60 space-y-2">
                            {/* Metrics Bar: ZBI (tiered) and Vitals (with recency, greyed if >7d) */}
                            <div className="flex items-center justify-between gap-1 text-xs font-mono px-2.5 py-1.5 rounded-lg bg-muted/40 border border-border/50">
                              {isIntakeInProgress ? (
                                <div className="flex items-center justify-between w-full">
                                  <span className="text-[10px] text-muted-foreground font-sans font-semibold uppercase">Next Action</span>
                                  <span className="font-bold text-foreground capitalize">{workflow.nextOwner}</span>
                                </div>
                              ) : (
                                <>
                                  <div className="flex items-center gap-1">
                                    <span className="text-[10px] text-muted-foreground font-sans font-semibold uppercase">ZBI</span>
                                    <span className={cn('font-bold', zbiColor)}>
                                      {row.latestBurdenPct !== null ? `${row.latestBurdenPct}%` : '—'}
                                    </span>
                                  </div>
                                  {(row.lastVitalBp || row.lastVitalSpo2) && (
                                    <div className={cn('flex items-center gap-1', isVitalsStale ? 'text-muted-foreground/60 opacity-60' : 'text-foreground')}>
                                      {row.lastVitalBp && <span className="font-bold">BP {row.lastVitalBp}</span>}
                                      {row.lastVitalBp && row.lastVitalSpo2 && <span className="text-border">·</span>}
                                      {row.lastVitalSpo2 && <span className="font-bold">SpO₂ {row.lastVitalSpo2}</span>}
                                      {vitalDaysAgo !== null && (
                                        <span className="text-[10px] text-muted-foreground font-sans">
                                          · {vitalDaysAgo}d
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </>
                              )}
                            </div>

                            {/* Action Buttons Row */}
                            <div className="flex items-center justify-between gap-1">
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

                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      title={`Discharge / Remove ${row.displayName}`}
                                      disabled={dischargingUids.has(row.patientUid)}
                                      className="h-7 w-7 p-0 text-muted-foreground hover:text-red-600 hover:bg-red-500/10 rounded-md"
                                    >
                                      <UserMinus className="w-3.5 h-3.5" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="rounded-2xl">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Discharge {row.displayName}?</AlertDialogTitle>
                                      <AlertDialogDescription className="text-xs leading-relaxed">
                                        This will remove {row.displayName} from your active clinical worklist, revoke clinician grants, purge summaries, and archive their local record.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
                                        onClick={() => handleDischargePatient(row.patientUid, row.displayName)}
                                      >
                                        Discharge Patient
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>

                              <Button asChild size="sm" className="h-7 text-xs font-bold gap-1 px-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xs">
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

                  {/* Pagination inserted when number becomes more than 8 */}
                  {sortedRows.length > ITEMS_PER_PAGE && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3.5 border-t border-border/60">
                      <p className="text-xs text-muted-foreground font-medium">
                        Showing <strong className="text-foreground font-semibold">{(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, sortedRows.length)}</strong> of <strong className="text-foreground font-semibold">{sortedRows.length}</strong> patients <span className="text-[11px] text-muted-foreground">(Sorted High to low criticality)</span>
                      </p>

                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="h-8 px-2.5 text-xs font-semibold gap-1 rounded-lg"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                          <span>Previous</span>
                        </Button>

                        <div className="flex items-center gap-1">
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setCurrentPage(pageNum)}
                              className={cn(
                                'h-8 w-8 p-0 text-xs font-bold rounded-lg',
                                currentPage === pageNum
                                  ? 'bg-primary text-primary-foreground shadow-xs'
                                  : 'text-foreground border-border'
                              )}
                            >
                              {pageNum}
                            </Button>
                          ))}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="h-8 px-2.5 text-xs font-semibold gap-1 rounded-lg"
                        >
                          <span>Next</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="queries" className="m-0">
              <ClinicianQueryDashboard rows={rows} isEmbedded />
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>

      {/* 5. CLINICAL DECISION SUPPORT SHORTCUTS */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {[
          { href: '/medications', icon: <ShieldCheck className="w-3.5 h-3.5" />, label: 'Beers Criteria', color: 'text-emerald-600 hover:bg-emerald-500/10 border-emerald-500/30' },
          { href: '/simulations', icon: <Zap className="w-3.5 h-3.5" />, label: 'Geriatric Simulations', color: 'text-blue-600 hover:bg-blue-500/10 border-blue-500/30' },
          { href: '/stress-calculator', icon: <HeartPulse className="w-3.5 h-3.5" />, label: 'Zarit Calculator', color: 'text-purple-600 hover:bg-purple-500/10 border-purple-500/30' },
        ].map(({ href, icon, label, color }) => (
          <Link key={href} href={href} className="shrink-0">
            <button className={cn('inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border text-[11px] font-semibold transition-colors bg-card shrink-0', color)}>
              {icon}{label}
            </button>
          </Link>
        ))}
      </div>
    </div>
  );
}
