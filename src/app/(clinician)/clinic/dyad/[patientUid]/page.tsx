'use client';

import { useEffect, useState, use as usePromise } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, AlertTriangle } from 'lucide-react';
import {
  getZaritAssessmentsFor,
  getFunctionScoresFor,
  getPatientDisplayName,
  recordFunctionScore
} from '@/lib/firebase/clinical-sync';
import { computeTrajectory, type TrajectoryResult } from '@/lib/analytics/trajectory';
import type { ZaritEvaluationResult, ZbiFactor } from '@/lib/zarit-scale';
import { ScissorsChart } from '@/components/clinician/scissors-chart';
import { RiskHeader } from '@/components/clinician/risk-header';
import { FunctionAssessmentForm } from '@/components/clinical/function-assessment-form';
import { useToast } from '@/hooks/use-toast';

const FACTOR_LABELS: Record<ZbiFactor, string> = {
  personal_strain: 'Personal Strain',
  role_strain: 'Role Strain',
  financial_strain: 'Financial Strain',
  competency: 'Competency',
  guilt: 'Guilt',
  global_burden: 'Global Burden'
};

export default function DyadDetailPage({ params }: { params: Promise<{ patientUid: string }> }) {
  const { patientUid } = usePromise(params);
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState<string>('');
  const [trajectory, setTrajectory] = useState<TrajectoryResult | null>(null);
  const [latestAssessment, setLatestAssessment] = useState<ZaritEvaluationResult | null>(null);

  const load = async () => {
    const [assessments, functionScores, name] = await Promise.all([
      getZaritAssessmentsFor(patientUid),
      getFunctionScoresFor(patientUid),
      getPatientDisplayName(patientUid)
    ]);
    setDisplayName(name);
    setTrajectory(computeTrajectory(assessments, functionScores));
    setLatestAssessment(assessments[0] ?? null);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientUid]);

  const handleFunctionAssessmentSaved = async (result: Parameters<typeof recordFunctionScore>[1]) => {
    try {
      await recordFunctionScore(patientUid, result);
      toast({ title: 'Function Assessment Saved', description: 'The trajectory chart has been updated.' });
      await load();
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Could Not Save',
        description: err instanceof Error ? err.message : 'Check your access to this dyad and try again.'
      });
    }
  };

  if (!trajectory) {
    return <p className="text-sm text-muted-foreground">Loading dyad…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/clinic/roster">
            <Button variant="outline" size="icon" className="h-9 w-9">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold">{displayName}</h1>
              <p className="text-xs text-muted-foreground">Caregiver burden vs. care-recipient function</p>
            </div>
          </div>
        </div>
        <FunctionAssessmentForm onComplete={handleFunctionAssessmentSaved} />
      </div>

      <RiskHeader trajectory={trajectory} />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Longitudinal Trajectory</CardTitle>
          <CardDescription className="text-xs">
            Rising lines are worse on both series — a widening gap between them signals care demand
            outstripping caregiver capacity.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScissorsChart trajectory={trajectory} />
        </CardContent>
      </Card>

      {latestAssessment && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Latest Factor Breakdown</CardTitle>
            <CardDescription className="text-xs">
              {latestAssessment.tier} · {new Date(latestAssessment.completedAt).toLocaleDateString()}
              {latestAssessment.redFlags.length > 0 && (
                <span className="ml-2 inline-flex items-center gap-1 text-red-600 font-semibold">
                  <AlertTriangle className="w-3 h-3" /> {latestAssessment.redFlags.length} red flag
                  {latestAssessment.redFlags.length === 1 ? '' : 's'}
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {(Object.entries(latestAssessment.factors) as [ZbiFactor, typeof latestAssessment.factors[ZbiFactor]][]).map(
              ([key, factor]) => (
                <div key={key} className="p-3 rounded-xl border border-border/60 bg-card">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate">
                    {FACTOR_LABELS[key]}
                  </p>
                  {factor.isMeasured ? (
                    <p className="text-lg font-extrabold font-mono">{factor.percentage}%</p>
                  ) : (
                    <p className="text-xs text-muted-foreground italic mt-1">Not assessed in {latestAssessment.tier}</p>
                  )}
                </div>
              )
            )}
          </CardContent>
        </Card>
      )}

      {latestAssessment?.redFlags && latestAssessment.redFlags.length > 0 && (
        <Card className="border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-800">
          <CardContent className="p-4 space-y-1.5">
            <p className="text-xs font-bold text-red-700 dark:text-red-400">Active Clinical Red Flags</p>
            {latestAssessment.redFlags.map((flag, i) => (
              <p key={i} className="text-xs text-red-700 dark:text-red-400">
                • {flag}
              </p>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
