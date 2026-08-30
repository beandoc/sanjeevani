'use client';

import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { AlertTriangle, Bed, CheckCircle2, ClipboardList, HeartHandshake, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  buildCareIntelligenceSummary,
  type CareIntelligenceSummary,
  type ClinicalSignalSeverity
} from '@/lib/clinical/care-intelligence';
import type {
  CareGapEvaluationResult,
  CaregiverAttributes,
  DailyCareLog,
  PatientDependenceProfile,
  VitalRecord
} from '@/lib/db/health-repository';
import { HealthRepository } from '@/lib/db/health-repository';
import { getDailyCareLogsFor, subscribeToDailyCareLogsFor } from '@/lib/firebase/clinical-sync';
import type { ZaritEvaluationResult } from '@/lib/zarit-scale';
import { cn } from '@/lib/utils';

interface CareIntelligencePanelProps {
  patientUid?: string;
  patientName?: string | null;
  logs?: DailyCareLog[];
  latestZarit?: ZaritEvaluationResult | null;
  careGap?: CareGapEvaluationResult | null;
  caregiver?: CaregiverAttributes | null;
  patient?: PatientDependenceProfile | null;
  vitals?: VitalRecord[];
  mode?: 'family' | 'clinician';
}

const severityStyle: Record<ClinicalSignalSeverity, string> = {
  urgent: 'bg-red-600 text-white border-red-600',
  watch: 'bg-amber-500 text-white border-amber-500',
  info: 'bg-blue-500 text-white border-blue-500'
};

export function CareIntelligencePanel({
  patientUid,
  patientName,
  logs,
  latestZarit,
  careGap,
  caregiver,
  patient,
  vitals,
  mode = 'family'
}: CareIntelligencePanelProps) {
  const [liveLogs, setLiveLogs] = useState<DailyCareLog[]>(logs || []);

  useEffect(() => {
    if (logs) {
      setLiveLogs(logs);
      return;
    }

    let unsubscribe = () => {};
    if (patientUid) {
      void getDailyCareLogsFor(patientUid).then(setLiveLogs);
      unsubscribe = subscribeToDailyCareLogsFor(patientUid, setLiveLogs);
    } else {
      setLiveLogs(HealthRepository.getDailyCareLogs());
    }
    return () => unsubscribe();
  }, [logs, patientUid]);

  const summary: CareIntelligenceSummary = useMemo(
    () =>
      buildCareIntelligenceSummary({
        logs: liveLogs,
        latestZarit,
        careGap,
        caregiver,
        patient,
        vitals
      }),
    [careGap, caregiver, latestZarit, liveLogs, patient, vitals]
  );

  const urgentSignals = summary.signals.filter((signal) => signal.severity === 'urgent');
  const isClinician = mode === 'clinician';

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <Card className="border-border bg-card shadow-xs xl:col-span-2">
        <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-primary" />
                {isClinician ? 'Clinician Query Summary' : 'Family Daily Digest'}
              </CardTitle>
              <CardDescription className="text-xs">
                {patientName || 'Patient'} daily status, red flags, and caregiver action priorities.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-[10px] font-mono">
                {summary.digest.date ? format(new Date(summary.digest.date), 'dd MMM yyyy') : 'No date'}
              </Badge>
              <Badge className={cn('text-[10px] font-bold', urgentSignals.length ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white')}>
                {urgentSignals.length ? `${urgentSignals.length} urgent` : 'No urgent flag'}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="rounded-xl border border-border/70 bg-background p-3">
            <p className="text-sm font-bold text-foreground">{summary.digest.headline}</p>
            {summary.digest.remarks && (
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{summary.digest.remarks}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
            <DigestCell label="Vitals" value={summary.digest.vitalsSummary} />
            <DigestCell label="Feeds" value={summary.digest.nutritionSummary} />
            <DigestCell label="Output" value={summary.digest.outputSummary} />
            <DigestCell label="Meds" value={summary.digest.medicationSummary} />
            <DigestCell label="Sleep" value={summary.digest.sleepSummary} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-foreground">
              <ShieldAlert className="w-4 h-4 text-red-600" />
              Delirium, Fall, Medication, Hydration, and Vitals Flags
            </div>
            {summary.signals.length === 0 ? (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                No red flags generated from the latest saved logs.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {summary.signals.slice(0, isClinician ? 8 : 4).map((signal) => (
                  <div key={signal.id} className="rounded-xl border border-border/70 bg-background p-3 text-xs space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-foreground">{signal.title}</span>
                      <Badge className={cn('text-[9px] uppercase font-bold', severityStyle[signal.severity])}>
                        {signal.severity}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">{signal.detail}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card className={cn('border shadow-xs', summary.respitePrescription.needed ? 'border-red-500/40 bg-red-500/5' : 'border-border bg-card')}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Bed className="w-4 h-4 text-red-600" />
              Respite Prescription
            </CardTitle>
            <CardDescription className="text-xs">
              Converts burden, care gap, and daily risk into a practical relief order.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex items-baseline justify-between">
              <span className="text-muted-foreground font-semibold">Status</span>
              <Badge className={cn('uppercase text-[10px] font-bold', summary.respitePrescription.needed ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white')}>
                {summary.respitePrescription.urgency}
              </Badge>
            </div>
            <p className="text-sm font-black text-foreground">
              {summary.respitePrescription.needed
                ? `${summary.respitePrescription.recommendedDaysPerMonth} respite days/month`
                : 'No new respite trigger'}
            </p>
            <p className="text-muted-foreground leading-relaxed">
              {summary.respitePrescription.needed
                ? `${summary.respitePrescription.recommendedHoursPerWeek} hours/week. ${summary.respitePrescription.recommendedSupport}.`
                : 'Continue routine family rotation and daily monitoring.'}
            </p>
            {summary.respitePrescription.reasons.slice(0, 3).map((reason) => (
              <p key={reason} className="text-[11px] text-red-700 dark:text-red-300 flex gap-1.5">
                <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                <span>{reason}</span>
              </p>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <HeartHandshake className="w-4 h-4 text-emerald-600" />
              Caregiver Action Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {summary.actionPlan.map((item) => (
              <div key={item.id} className="rounded-xl border border-border/70 bg-background p-3 text-xs space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-foreground">{item.title}</span>
                  <Badge variant="outline" className="text-[9px] uppercase font-bold">
                    {item.urgency.replace('_', ' ')}
                  </Badge>
                </div>
                <p className="text-muted-foreground leading-relaxed">{item.action}</p>
                {isClinician && (
                  <p className="text-[10px] text-primary font-semibold">
                    Owner: {item.owner.replace('_', ' ')} | {item.rationale}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DigestCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/40 border border-border/50 p-2 min-h-[66px]">
      <span className="block text-[10px] font-bold uppercase text-muted-foreground">{label}</span>
      <span className="block text-[11px] font-semibold text-foreground leading-snug line-clamp-3">{value}</span>
    </div>
  );
}
