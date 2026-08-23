'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  ArrowRight,
  AlertTriangle,
  RefreshCw,
  Clock,
  Send,
  Copy,
  Check,
  Phone,
  UserCheck,
  Sparkles,
  Stethoscope,
  HeartPulse,
  Plus
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

export default function ClinicianRosterPage() {
  const { user, isLoading: authLoading } = useAuthUser();
  const { role } = useProfile();
  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);
  const [rows, setRows] = useState<RosterRow[] | null>(null);
  const [invites, setInvites] = useState<DyadInvite[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const load = async () => {
    setIsRefreshing(true);
    try {
      const [rosterRows, myInvites] = await Promise.all([
        user ? loadCohortRoster() : [],
        user ? listMyDyadInvites() : []
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

  const shareViaWhatsApp = (e: React.MouseEvent, invite: DyadInvite) => {
    e.preventDefault();
    e.stopPropagation();
    const careName = invite.caregiverName || 'Caregiver';
    const appUrl = typeof window !== 'undefined' ? `${window.location.origin}/login` : 'https://sanjeevani.health/login';
    const msg = encodeURIComponent(
      `Namaste ${careName}, Dr. Vivek has registered ${invite.patientName} on Sanjeevani Geriatric Care.\n\nUse Invite Code: *${invite.inviteCode}*\nSign in at: ${appUrl} to track vitals, medication reminders, and tailored geriatric care modules.`
    );
    const rawPhone = invite.caregiverPhone?.replace(/\D/g, '') || '';
    const url = rawPhone ? `https://wa.me/${rawPhone}?text=${msg}` : `https://api.whatsapp.com/send?text=${msg}`;
    window.open(url, '_blank');
  };

  if (!isMounted) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto p-4 sm:p-6 animate-pulse">
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
    <div className="space-y-6 max-w-6xl mx-auto p-4 sm:p-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider mb-1">
            <Stethoscope className="w-4 h-4" />
            <span>Consulting Physician Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-headline text-foreground flex items-center gap-2.5">
            <Users className="w-7 h-7 text-primary" />
            Patient Clinical Roster
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Active patient surveillance, caregiver strain metrics, and longitudinal trajectories.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs font-semibold"
            onClick={() => void load()}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isRefreshing && 'animate-spin')} /> Refresh
          </Button>
          <RegisterPatientDialog onRegistered={() => void load()} />
        </div>
      </div>

      {/* Patient List Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-wider text-muted-foreground">
            <HeartPulse className="w-4 h-4 text-primary" />
            <span>Patients Under Care ({rows?.length || 0})</span>
          </h2>
          <span className="text-xs text-muted-foreground font-mono">
            Sorted by risk profile
          </span>
        </div>

        {rows === null && <p className="text-sm text-muted-foreground">Loading patient roster…</p>}

        {rows !== null && rows.length === 0 && (
          <Card className="border-dashed rounded-3xl">
            <CardContent className="p-10 text-center text-muted-foreground text-sm space-y-3">
              <Users className="w-10 h-10 mx-auto text-muted-foreground/50" />
              <div>
                <p className="font-bold text-base text-foreground">No patients on your clinical roster yet.</p>
                <p className="text-xs max-w-md mx-auto text-muted-foreground mt-1">
                  Click the &quot;Register New Patient&quot; button above to add senior patients and immediately start tracking their care.
                </p>
              </div>
              <div className="pt-2">
                <RegisterPatientDialog onRegistered={() => void load()} />
              </div>
            </CardContent>
          </Card>
        )}

        {rows !== null && rows.length > 0 && (
          <div className="space-y-3">
            {rows.map((row) => {
              const matchedInvite = inviteByPatientUid.get(row.patientUid);

              return (
                <Link key={row.patientUid} href={`/clinic/dyad/${row.patientUid}`}>
                  <Card className="hover:border-primary/60 transition-all shadow-xs rounded-2xl overflow-hidden hover:shadow-md border-border/80">
                    <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Left: Patient Name & Risk Band */}
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <Badge className={cn('font-bold text-[10px] uppercase shrink-0', BAND_STYLE[row.riskBand])}>
                            {row.riskBand}
                          </Badge>
                          <h3 className="font-bold text-base text-foreground truncate">{row.displayName}</h3>
                          {matchedInvite && (
                            <Badge variant="outline" className="text-[10px] border-primary/30 text-primary font-mono">
                              Registered by you
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                          {row.latestAssessmentAgeDays !== null ? (
                            <span>Last assessed {row.latestAssessmentAgeDays}d ago</span>
                          ) : (
                            <span className="text-primary font-medium">Ready for clinical assessment</span>
                          )}

                          {matchedInvite?.caregiverName && (
                            <>
                              <span>•</span>
                              <span>Caregiver: <strong>{matchedInvite.caregiverName}</strong></span>
                            </>
                          )}
                          {matchedInvite?.caregiverPhone && (
                            <span className="font-mono opacity-80">({matchedInvite.caregiverPhone})</span>
                          )}
                        </div>
                      </div>

                      {/* Right: Scores & Actions */}
                      <div className="flex items-center gap-3 shrink-0 flex-wrap justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-border/50">
                        {row.hasRedFlag && (
                          <div className="flex items-center gap-1 text-red-600 bg-red-500/10 px-2.5 py-1 rounded-lg" title="Clinical Red Flag Triggered">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-bold uppercase">Red Flag</span>
                          </div>
                        )}

                        {row.latestBurdenPct !== null && (
                          <div className="text-right px-2">
                            <span className="text-sm font-mono font-black text-foreground">{row.latestBurdenPct}%</span>
                            <span className="text-[10px] text-muted-foreground block">Zarit Burden</span>
                          </div>
                        )}

                        {matchedInvite && !matchedInvite.claimedAt && (
                          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={(e) => copyCode(e, matchedInvite.inviteCode)}
                              className="px-2.5 py-1 rounded-lg bg-muted hover:bg-muted/80 border border-border text-xs font-mono font-bold flex items-center gap-1.5 transition-colors"
                              title="Click to copy caregiver invite code"
                            >
                              <span>{matchedInvite.inviteCode}</span>
                              {copiedCode === matchedInvite.inviteCode ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3 text-muted-foreground" />
                              )}
                            </button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={(e) => shareViaWhatsApp(e, matchedInvite)}
                              className="h-7 px-2 text-[11px] gap-1 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10"
                            >
                              <Send className="w-3 h-3" />
                              <span className="hidden sm:inline">WhatsApp</span>
                            </Button>
                          </div>
                        )}

                        <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
