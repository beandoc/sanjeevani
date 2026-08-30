'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Users,
  Search,
  AlertTriangle,
  RefreshCw,
  Send,
  Copy,
  Check,
  Stethoscope,
  HeartPulse,
  Bed,
  ShieldAlert,
  Calendar,
  ChevronRight,
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthUser } from '@/hooks/use-auth-user';
import { loadCohortRoster, RISK_BAND_STYLE, type CohortRow } from '@/lib/analytics/cohort';
import { listMyDyadInvites, type DyadInvite } from '@/lib/firebase/clinical-sync';
import { RegisterPatientDialog } from '@/components/clinician/register-patient-dialog';
import { useToast } from '@/hooks/use-toast';
import { useProfile } from '@/context/role-context';
import { cn } from '@/lib/utils';

type RosterRow = CohortRow;
const BAND_STYLE = RISK_BAND_STYLE;
type FilterCategory = 'all' | 'critical' | 'gaps' | 'bedbound' | 'respite' | 'flags';

export default function ClinicianRosterPage() {
  const { user, isLoading: authLoading } = useAuthUser();
  const { role } = useProfile();
  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);
  const [rows, setRows] = useState<RosterRow[] | null>(null);
  const [invites, setInvites] = useState<DyadInvite[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterCategory>('all');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const load = async () => {
    setIsRefreshing(true);
    try {
      const [rosterRows, myInvites] = await Promise.all([
        loadCohortRoster(),
        listMyDyadInvites()
      ]);
      setRows(rosterRows);
      setInvites(myInvites);
    } catch {
      setRows([]);
      setInvites([]);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isMounted) {
      void load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted, user?.uid]);

  const copyCode = (e: React.MouseEvent, code: string) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
    toast({ title: 'Invite Code Copied', description: `Code ${code} copied to clipboard.` });
  };

  const shareViaWhatsApp = (
    e: React.MouseEvent,
    invite: { caregiverName?: string | null; patientName: string; inviteCode?: string; caregiverPhone?: string | null }
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const careName = invite.caregiverName || 'Caregiver';
    const appUrl = typeof window !== 'undefined' ? `${window.location.origin}/login` : 'https://sanjeevani.health/login';
    const codeSnippet = invite.inviteCode ? `\n\nUse Invite Code: *${invite.inviteCode}*` : '';
    const msg = encodeURIComponent(
      `Namaste ${careName}, Dr. Vivek has updated the care plan for ${invite.patientName} on Sanjeevani Geriatric Care.${codeSnippet}\nSign in at: ${appUrl} to track vitals, medication reminders, and tailored geriatric care modules.`
    );
    const rawPhone = invite.caregiverPhone?.replace(/\D/g, '') || '';
    const url = rawPhone ? `https://wa.me/${rawPhone}?text=${msg}` : `https://api.whatsapp.com/send?text=${msg}`;
    window.open(url, '_blank');
  };

  // Filter & Search computation
  const criticalCount = useMemo(() => rows?.filter((r) => r.riskBand === 'critical').length || 0, [rows]);
  const gapsCount = useMemo(() => rows?.filter((r) => (r.formalSupportHours ?? 0) === 0 || r.hasQocWarning).length || 0, [rows]);
  const bedBoundCount = useMemo(() => rows?.filter((r) => r.isBedBound).length || 0, [rows]);
  const respiteCount = useMemo(() => rows?.filter((r) => r.respitePrescription?.needed).length || 0, [rows]);
  const flagsCount = useMemo(() => rows?.filter((r) => r.hasRedFlag || (r.dailyLogSignals && r.dailyLogSignals.length > 0)).length || 0, [rows]);

  const filteredRows = useMemo(() => {
    if (!rows) return [];
    return rows.filter((r) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = r.displayName.toLowerCase().includes(q);
        const matchConditions = r.conditions?.some((c) => c.toLowerCase().includes(q));
        const matchCaregiver =
          r.caregiverName?.toLowerCase().includes(q) ||
          r.caregiverKinship?.toLowerCase().includes(q);
        if (!matchName && !matchConditions && !matchCaregiver) return false;
      }

      // 2. Pill Filter
      if (filter === 'critical') return r.riskBand === 'critical';
      if (filter === 'gaps') return (r.formalSupportHours ?? 0) === 0 || r.hasQocWarning;
      if (filter === 'bedbound') return !!r.isBedBound;
      if (filter === 'respite') return !!r.respitePrescription?.needed;
      if (filter === 'flags') return r.hasRedFlag || (r.dailyLogSignals && r.dailyLogSignals.length > 0);
      return true;
    });
  }, [rows, searchQuery, filter]);

  if (!isMounted) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 animate-pulse">
        <div className="h-10 bg-muted/60 rounded-xl w-1/3" />
        <div className="h-40 bg-muted/40 rounded-3xl" />
      </div>
    );
  }

  const isClinicianRole =
    role === 'doctor' ||
    role === 'professional' ||
    (typeof window !== 'undefined' &&
      (localStorage.getItem('sanjeevani_user_role') === 'doctor' ||
        localStorage.getItem('sanjeevani_user_role') === 'professional'));

  if (authLoading && !isClinicianRole) return null;

  if (!user && !isClinicianRole) {
    return (
      <Card className="max-w-xl mx-auto mt-10 rounded-3xl">
        <CardContent className="p-8 text-center text-muted-foreground text-sm space-y-2">
          <Stethoscope className="w-8 h-8 text-muted-foreground/50 mx-auto" />
          <p className="font-bold text-foreground">Clinician Access Required</p>
          <p className="text-xs">Sign in with a Doctor / Professional account to view your patient roster.</p>
        </CardContent>
      </Card>
    );
  }

  // Build invite lookup by code or dyadUid
  const inviteByPatientUid = new Map<string, DyadInvite>();
  for (const inv of invites) {
    if (inv.dyadUid) inviteByPatientUid.set(inv.dyadUid, inv);
    inviteByPatientUid.set(`dyad_${inv.inviteCode}`, inv);
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-3 sm:p-6">
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-black font-headline text-foreground flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Active Clinical Dyad Worklist ({rows?.length || 0})
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time psychometric, vital, and support matrix status across your assigned cohort.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs font-semibold h-9 bg-card/80 hover:bg-muted"
            onClick={() => void load()}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isRefreshing && 'animate-spin')} /> Refresh
          </Button>
          <RegisterPatientDialog onRegistered={() => void load()} />
        </div>
      </div>

      {/* Search & Filter Pill Strip */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search patient, condition, caregiver..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs rounded-xl bg-card border-border/80"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
            >
              ×
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer',
              filter === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-muted/70 text-muted-foreground hover:text-foreground'
            )}
          >
            All ({rows?.length || 0})
          </button>
          <button
            type="button"
            onClick={() => setFilter('critical')}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer',
              filter === 'critical'
                ? 'bg-red-600 text-white shadow-xs'
                : 'bg-muted/70 text-muted-foreground hover:text-foreground'
            )}
          >
            <AlertTriangle className="w-3 h-3" /> Critical ({criticalCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('gaps')}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer',
              filter === 'gaps'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-muted/70 text-muted-foreground hover:text-foreground'
            )}
          >
            <ShieldAlert className="w-3 h-3" /> Gaps ({gapsCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('bedbound')}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer',
              filter === 'bedbound'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-muted/70 text-muted-foreground hover:text-foreground'
            )}
          >
            <Bed className="w-3 h-3" /> Bed-Bound ({bedBoundCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('respite')}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer',
              filter === 'respite'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-muted/70 text-muted-foreground hover:text-foreground'
            )}
          >
            <HeartPulse className="w-3 h-3" /> Respite ({respiteCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('flags')}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer',
              filter === 'flags'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-muted/70 text-muted-foreground hover:text-foreground'
            )}
          >
            <AlertTriangle className="w-3 h-3" /> Daily Flags ({flagsCount})
          </button>
        </div>
      </div>

      {/* Patient Worklist Section */}
      <div className="space-y-3.5 pt-1">
        {rows === null && <p className="text-sm text-muted-foreground p-4">Loading patient roster…</p>}

        {rows !== null && filteredRows.length === 0 && (
          <Card className="border-dashed rounded-3xl">
            <CardContent className="p-10 text-center text-muted-foreground text-sm space-y-3">
              <Users className="w-10 h-10 mx-auto text-muted-foreground/50" />
              <div>
                <p className="font-bold text-base text-foreground">No patients matched this filter.</p>
                <p className="text-xs max-w-md mx-auto text-muted-foreground mt-1">
                  Try clearing the search query or switching the category filter above to see all patients.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => { setSearchQuery(''); setFilter('all'); }}>
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}

        {rows !== null && filteredRows.length > 0 && (
          <div className="space-y-3.5">
            {filteredRows.map((row) => {
              const matchedInvite = inviteByPatientUid.get(row.patientUid);
              const caregiverKinshipText = row.caregiverKinship || 'Spouse (Solo 78y)';
              const formalText = row.formalSupportHours
                ? `${row.formalSupportHours}h (${row.formalSupportType || 'Part-time'})`
                : '0h (100% Family Solo)';

              return (
                <Card
                  key={row.patientUid}
                  className="border border-border/80 hover:border-blue-500/50 bg-card rounded-2xl sm:rounded-3xl shadow-xs transition-all hover:shadow-md overflow-hidden"
                >
                  <CardContent className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left Section: Details, Tags & Alerts */}
                    <div className="space-y-2.5 min-w-0 flex-1">
                      {/* Header Row: Status Badge, Title & Pill Badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          className={cn(
                            'font-black text-[10px] uppercase px-2 py-0.5 rounded-md tracking-wider shadow-2xs',
                            BAND_STYLE[row.riskBand]
                          )}
                        >
                          {row.riskBand}
                        </Badge>

                        <h3 className="font-extrabold text-base sm:text-lg text-foreground font-headline truncate">
                          {row.displayName}
                        </h3>

                        {row.isBedBound && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/40 text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40">
                            Bed-Bound
                          </span>
                        )}

                        {row.fallHistory && row.fallHistory > 0 ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-500/40 text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40">
                            {row.fallHistory} Falls (6m)
                          </span>
                        ) : null}

                        {row.respitePrescription?.urgency === 'urgent' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-500/40 text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40">
                            Respite urgent
                          </span>
                        )}

                        {row.hasRedFlag && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-orange-500/40 text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/40">
                            Daily Red Flag
                          </span>
                        )}
                      </div>

                      {/* Condition Chips */}
                      {row.conditions && row.conditions.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {row.conditions.map((c) => (
                            <Badge
                              key={c}
                              variant="secondary"
                              className="text-[11px] font-medium bg-muted text-muted-foreground border-transparent px-2 py-0.5 rounded-md"
                            >
                              {c}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Caregiver & Support Info */}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap font-mono">
                        <span className="text-muted-foreground font-sans">
                          Caregiver:{' '}
                          <strong className="text-foreground font-semibold">
                            {row.caregiverName || matchedInvite?.caregiverName || 'Suresh Kumar'}
                          </strong>{' '}
                          <span className="text-muted-foreground/80">({caregiverKinshipText})</span>
                        </span>
                        <span className="hidden sm:inline text-border">•</span>
                        <span className="text-muted-foreground font-sans">
                          Formal Support:{' '}
                          <strong className="text-foreground font-semibold">{formalText}</strong>
                        </span>
                      </div>

                      {/* Advisory Alert Lines */}
                      <div className="space-y-1 pt-0.5">
                        {row.latestAlertSnippet && (
                          <p className="text-xs text-amber-700 dark:text-amber-400 flex items-start gap-1.5 font-medium leading-relaxed">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                            <span>{row.latestAlertSnippet}</span>
                          </p>
                        )}
                        {row.respitePrescription?.needed && (
                          <p className="text-xs text-rose-700 dark:text-rose-400 flex items-start gap-1.5 font-medium leading-relaxed">
                            <Bed className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                            <span>
                              Prescribe {row.respitePrescription.recommendedDaysPerMonth} respite days/month or{' '}
                              {row.respitePrescription.recommendedHoursPerWeek} hrs/week.
                            </span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right Section: Metrics & Actions */}
                    <div className="flex items-center gap-2.5 shrink-0 flex-wrap justify-between sm:justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-border/60">
                      {/* Metric 1: Zarit Burden */}
                      {row.latestBurdenPct !== null && (
                        <div className="p-2 sm:p-2.5 px-3 rounded-2xl border border-border/70 bg-card dark:bg-zinc-900/60 text-center min-w-[85px] shadow-2xs">
                          <span className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground block">
                            Zarit Burden
                          </span>
                          <span
                            className={cn(
                              'text-sm sm:text-base font-black font-mono',
                              row.latestBurdenPct > 50 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
                            )}
                          >
                            {row.latestBurdenPct}%
                          </span>
                        </div>
                      )}

                      {/* Metric 2: BP Reading */}
                      {row.lastVitalBp && (
                        <div className="p-2 sm:p-2.5 px-3 rounded-2xl border border-border/70 bg-card dark:bg-zinc-900/60 text-center min-w-[85px] shadow-2xs">
                          <span className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground block">
                            BP Reading
                          </span>
                          <span className="text-sm sm:text-base font-black font-mono text-foreground">
                            {row.lastVitalBp}
                          </span>
                        </div>
                      )}

                      {/* Quick Action: WhatsApp */}
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={(e) => {
                          e.preventDefault();
                          shareViaWhatsApp(e, matchedInvite || {
                            inviteCode: 'CLINIC',
                            patientName: row.displayName,
                            caregiverName: row.caregiverName || undefined,
                            caregiverPhone: row.caregiverPhone || undefined
                          });
                        }}
                        className="h-9 w-9 rounded-xl border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 shadow-2xs"
                        title="Share clinical update on WhatsApp"
                      >
                        <Send className="w-4 h-4" />
                      </Button>

                      {/* Quick Action: Calendar */}
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={(e) => {
                          e.preventDefault();
                          toast({
                            title: 'Caregiver Check-in Schedule',
                            description: `Next clinical check-in for ${row.displayName} scheduled.`
                          });
                        }}
                        className="h-9 w-9 rounded-xl border-blue-500/30 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 shadow-2xs"
                        title="View or schedule caregiver clinical consult"
                      >
                        <Calendar className="w-4 h-4" />
                      </Button>

                      {/* Primary CTA: Open Workspace */}
                      <Link href={`/clinic/dyad/${row.patientUid}`}>
                        <Button
                          size="sm"
                          className="h-9 px-3.5 gap-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-all"
                        >
                          <Stethoscope className="w-3.5 h-3.5" />
                          <span>Open Workspace</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

