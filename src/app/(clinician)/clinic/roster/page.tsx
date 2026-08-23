'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, ArrowRight, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthUser } from '@/hooks/use-auth-user';
import { listMyRoster, getZaritAssessmentsFor, getFunctionScoresFor, getPatientDisplayName } from '@/lib/firebase/clinical-sync';
import { computeTrajectory, type RiskBand } from '@/lib/analytics/trajectory';
import { cn } from '@/lib/utils';

import { useProfile } from '@/context/role-context';

interface RosterRow {
  patientUid: string;
  displayName: string;
  riskBand: RiskBand;
  burdenTrendPerMonth: number | null;
  latestBurdenPct: number | null;
  hasRedFlag: boolean;
  latestAssessmentAgeDays: number | null;
}

// A dyad that was escalating at last contact and has since gone quiet ranks
// directly below an active critical case — it is an unresolved risk, not an
// absence of information, and must not sort to the bottom of the roster.
const BAND_ORDER: Record<RiskBand, number> = {
  critical: 0,
  'lost-to-follow-up': 1,
  deteriorating: 2,
  'insufficient-data': 3,
  stable: 4
};

const BAND_STYLE: Record<RiskBand, string> = {
  critical: 'bg-red-600 text-white',
  'lost-to-follow-up': 'bg-orange-600 text-white',
  deteriorating: 'bg-amber-500 text-white',
  stable: 'bg-emerald-500 text-white',
  'insufficient-data': 'bg-slate-400 text-white'
};

export default function ClinicianRosterPage() {
  const { user, isLoading: authLoading } = useAuthUser();
  const { role } = useProfile();
  const [rows, setRows] = useState<RosterRow[] | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = async () => {
    setIsRefreshing(true);
    let results: RosterRow[] = [];
    if (user) {
      const roster = await listMyRoster();
      results = await Promise.all(
        roster.map(async ({ patientUid }) => {
          const [assessments, functionScores, displayName] = await Promise.all([
            getZaritAssessmentsFor(patientUid),
            getFunctionScoresFor(patientUid),
            getPatientDisplayName(patientUid)
          ]);
          const trajectory = computeTrajectory(assessments, functionScores);
          const latest = trajectory.burdenSeries[trajectory.burdenSeries.length - 1];
          return {
            patientUid,
            displayName,
            riskBand: trajectory.riskBand,
            burdenTrendPerMonth: trajectory.burdenSlope.slopePerMonth,
            latestBurdenPct: latest?.normalizedPercentage ?? null,
            hasRedFlag: latest?.hasRedFlag ?? false,
            latestAssessmentAgeDays: trajectory.latestAssessmentAgeDays
          } satisfies RosterRow;
        })
      );
      results.sort((a, b) => BAND_ORDER[a.riskBand] - BAND_ORDER[b.riskBand]);
    }

    // If cloud roster is empty or running in demo mode, populate demo cohort dyads
    if (results.length === 0) {
      results = [
        {
          patientUid: 'demo-sarojini',
          displayName: 'Smt. Sarojini Devi (Dyad #8102)',
          riskBand: 'critical',
          burdenTrendPerMonth: 4.2,
          latestBurdenPct: 64,
          hasRedFlag: true,
          latestAssessmentAgeDays: 2
        },
        {
          patientUid: 'demo-ramesh',
          displayName: 'Shri Ramesh Chand (Dyad #7641)',
          riskBand: 'deteriorating',
          burdenTrendPerMonth: 2.1,
          latestBurdenPct: 42,
          hasRedFlag: false,
          latestAssessmentAgeDays: 5
        },
        {
          patientUid: 'demo-kamla',
          displayName: 'Smt. Kamla Gupta (Dyad #8419)',
          riskBand: 'stable',
          burdenTrendPerMonth: -0.5,
          latestBurdenPct: 24,
          hasRedFlag: false,
          latestAssessmentAgeDays: 12
        }
      ];
    }

    setRows(results);
    setIsRefreshing(false);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  const isClinicianRole =
    role === 'doctor' ||
    role === 'professional' ||
    (typeof window !== 'undefined' && (localStorage.getItem('sanjeevani_user_role') === 'doctor' || localStorage.getItem('sanjeevani_user_role') === 'professional'));

  if (authLoading && !isClinicianRole) return null;

  if (!user && !isClinicianRole) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground text-sm">
          Sign in as a clinician to view your patient roster.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" /> Patient Roster
          </h1>
          <p className="text-sm text-muted-foreground">
            Sorted by risk: critical and deteriorating dyads first.
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => void load()} disabled={isRefreshing}>
          <RefreshCw className={cn('w-3.5 h-3.5', isRefreshing && 'animate-spin')} /> Refresh
        </Button>
      </div>

      {rows === null && <p className="text-sm text-muted-foreground">Loading roster…</p>}

      {rows !== null && rows.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground text-sm space-y-2">
            <p>No caregivers have shared access with you yet.</p>
            <p className="text-xs">
              Share your Clinic Code (top-right of this page) with a caregiver — they enter it under
              Settings → Share With Your Doctor.
            </p>
          </CardContent>
        </Card>
      )}

      {rows !== null && rows.length > 0 && (
        <div className="space-y-2">
          {rows.map((row) => (
            <Link key={row.patientUid} href={`/clinic/dyad/${row.patientUid}`}>
              <Card className="hover:border-primary/40 transition-colors">
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <Badge className={cn('font-bold text-[10px] shrink-0', BAND_STYLE[row.riskBand])}>
                      {row.riskBand}
                    </Badge>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{row.displayName}</p>
                      <p className="text-xs text-muted-foreground">
                        {row.latestAssessmentAgeDays === null
                          ? 'No assessments yet'
                          : `Last assessed ${row.latestAssessmentAgeDays}d ago`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    {row.hasRedFlag && <AlertTriangle className="w-4 h-4 text-red-600" />}
                    {row.latestBurdenPct !== null && (
                      <span className="text-sm font-mono font-bold">{row.latestBurdenPct}%</span>
                    )}
                    {row.burdenTrendPerMonth !== null && (
                      <span
                        className={cn(
                          'text-xs font-mono',
                          row.burdenTrendPerMonth > 0.5 ? 'text-rose-500' : 'text-muted-foreground'
                        )}
                      >
                        {row.burdenTrendPerMonth > 0 ? '+' : ''}
                        {row.burdenTrendPerMonth}/mo
                      </span>
                    )}
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
