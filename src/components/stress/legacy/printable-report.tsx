'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  StressAssessmentEntry,
  STRESS_LEVEL_INFO,
  analyzeLongitudinalTrajectory,
} from '@/lib/stress-scale';
import { Printer, FileText, Calendar, Activity, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

interface PrintableReportProps {
  history: StressAssessmentEntry[];
  caregiverName?: string;
}

export function PrintableReportDialog({
  history,
  caregiverName = 'Family Caregiver',
}: PrintableReportProps) {
  if (!history || history.length === 0) return null;

  const latest = history[history.length - 1];
  const isZarit = latest.instrument === 'ZARIT_ZBI12';
  const severityInfo = STRESS_LEVEL_INFO[latest.severity];
  const maxScore = latest.maxScore || (isZarit ? 48 : 40);
  const analysis = analyzeLongitudinalTrajectory(
    history.slice(0, Math.max(0, history.length - 1)),
    latest.totalScore,
    latest.instrument || 'ZARIT_ZBI12'
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Printer className="h-4 w-4" /> Export / Print Clinical Summary
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-headline">
                Caregiver Burden & Fatigue Clinical Report
              </DialogTitle>
              <DialogDescription className="text-xs">
                Standardized Longitudinal Evaluation ({isZarit ? 'Zarit Burden Interview ZBI-12' : 'Cohen Perceived Stress PSS-10'})
              </DialogDescription>
            </div>
            <Button onClick={handlePrint} size="sm" className="gap-1.5 font-semibold">
              <Printer className="h-4 w-4" /> Print PDF
            </Button>
          </div>
        </DialogHeader>

        {/* Printable Paper View */}
        <div className="space-y-6 py-2 text-sm text-foreground print:p-0">
          {/* Header Metadata */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl border bg-muted/30 text-xs">
            <div>
              <span className="text-muted-foreground block">Caregiver:</span>
              <strong className="text-foreground">{caregiverName}</strong>
            </div>
            <div>
              <span className="text-muted-foreground block">Report Date:</span>
              <strong className="text-foreground">{format(new Date(), 'dd-MMM-yyyy')}</strong>
            </div>
            <div>
              <span className="text-muted-foreground block">Primary Condition:</span>
              <strong className="text-foreground">
                {latest.careRecipientCondition || 'Not specified'}
              </strong>
            </div>
            <div>
              <span className="text-muted-foreground block">Total Checkpoints:</span>
              <strong className="text-foreground">{history.length} assessments</strong>
            </div>
          </div>

          {/* Current Score Summary */}
          <div className="p-4 rounded-xl border space-y-2 bg-card">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base font-headline">Most Recent Standardized Score</h3>
              <Badge variant={severityInfo.badgeVariant} className="text-xs">
                {severityInfo.title}
              </Badge>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-headline">
                {latest.totalScore}/{maxScore}
              </span>
              <span className="text-xs text-muted-foreground">
                ({isZarit ? 'Zarit ZBI-12' : 'Cohen PSS-10'} — {latest.normalizedPercentage}% Burden Index)
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong>Clinical Significance:</strong> {severityInfo.clinicalMeaning}
            </p>
            {analysis.clinicalAlert && (
              <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                {analysis.clinicalAlert}
              </p>
            )}
          </div>

          {/* Longitudinal History Table */}
          <div className="space-y-2">
            <h4 className="font-bold text-sm">Longitudinal Assessment History</h4>
            <div className="border rounded-lg overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-muted/60 border-b">
                  <tr>
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5">Battery</th>
                    <th className="p-2.5">Score</th>
                    <th className="p-2.5">Severity</th>
                    <th className="p-2.5">Care Context</th>
                    <th className="p-2.5">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {[...history]
                    .reverse()
                    .map((item) => (
                      <tr key={item.id} className="hover:bg-muted/20">
                        <td className="p-2.5 font-medium">{format(new Date(item.date), 'dd-MMM-yyyy')}</td>
                        <td className="p-2.5 font-mono text-[11px]">
                          {item.instrument === 'ZARIT_ZBI12' ? 'ZBI-12' : 'PSS-10'}
                        </td>
                        <td className="p-2.5 font-bold">
                          {item.totalScore}/{item.maxScore || (item.instrument === 'ZARIT_ZBI12' ? 48 : 40)}
                        </td>
                        <td className="p-2.5 capitalize">{item.severity}</td>
                        <td className="p-2.5">{item.careRecipientCondition || '—'}</td>
                        <td className="p-2.5 text-muted-foreground">{item.notes || '—'}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Physician / Counselor Notes Block */}
          <div className="p-4 rounded-xl border border-dashed text-xs space-y-2">
            <h4 className="font-bold text-foreground">Clinician / Counselor Review Notes:</h4>
            <div className="h-16 border-b border-dashed border-muted-foreground/30" />
            <div className="flex justify-between text-[11px] text-muted-foreground pt-2">
              <span>Physician / Psychologist Signature: _______________________</span>
              <span>Date: _______________</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
