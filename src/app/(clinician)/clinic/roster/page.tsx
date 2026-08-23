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

interface RosterRow {
  patientUid: string;
  displayName: string;
  riskBand: RiskBand;
  burdenTrendPerMonth: number | null;
  latestBurdenPct: number | null;
  hasRedFlag: boolean;
  latestAssessmentAgeDays: number | null;
}

const BAND_ORDER: Record<RiskBand, number> = {
  critical: 0,
  deteriorating: 1,
  'insufficient-data': 2,
  stable: 3
};

const BAND_STYLE: Record<RiskBand, string> = {
  critical: 'bg-red-600 text-white',
  deteriorating: 'bg-amber-500 text-white',
  stable: 'bg-emerald-500 text-white',
  'insufficient-data': 'bg-slate-400 text-white'
};

export default function ClinicianRosterPage() {
  const { user, isLoading: authLoading } = useAuthUser();
  const [rows, setRows] = useState<RosterRow[] | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = async () => {
    if (!user) return;
    setIsRefreshing(true);
    const roster = await listMyRoster();
    const results = await Promise.all(
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
    setRows(results);
    setIsRefreshing(false);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  if (authLoading) return null;

  if (!user) {
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
