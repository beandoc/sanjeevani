'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Stethoscope,
  Users,
  AlertTriangle,
  FileText,
  Activity,
  ArrowRight,
  TrendingUp,
  Printer,
  HeartPulse,
  Sparkles,
  ClipboardList
} from 'lucide-react';
import Link from 'next/link';
import { HealthRepository } from '@/lib/db/health-repository';
import { ClinicalSummaryPrint } from '@/components/reports/clinical-summary-print';

export function DoctorCohortDashboard() {
  const patient = HealthRepository.getPatientProfile();
  const caregiver = HealthRepository.getCaregiverAttributes();
  const careGap = HealthRepository.getCareGapEvaluation();
  const zarit = HealthRepository.getZaritAssessments()[0];
  const vitals = HealthRepository.getVitals();
  const medications = HealthRepository.getMedications();

  return (
    <div className="space-y-6">
      {/* Doctor Header Banner */}
      <Card className="border-blue-500/30 bg-blue-500/5 shadow-sm">
        <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-blue-600/10 text-blue-600 shrink-0 mt-0.5">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] font-bold text-blue-600 border-blue-500/30 uppercase">
                  Consulting Geriatrician & Physician Portal
                </Badge>
                <span className="text-xs text-muted-foreground font-mono">OPD Clinical Surveillance</span>
              </div>
              <h2 className="text-lg font-bold text-foreground mt-0.5">
                Geriatric Dyad Trajectory & Cohort Surveillance
              </h2>
              <p className="text-xs text-muted-foreground max-w-xl leading-relaxed">
                Review multi-morbidity risk bands, caregiver burnout scissors curves, and generate OPD Clinical Care Briefs.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link href="/clinic/roster">
              <Button size="sm" variant="outline" className="gap-1.5 text-xs font-bold border-blue-500/30 text-blue-700 dark:text-blue-300">
                <Users className="w-4 h-4" /> Full Cohort Roster
              </Button>
            </Link>
            <Button
              size="sm"
              onClick={() => window.print()}
              className="gap-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Printer className="w-4 h-4" /> Print Encounter Brief
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dyad Triad Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Patient Functional Score */}
        <Card className="border-border bg-card shadow-xs">
          <CardHeader className="pb-2">
            <span className="text-[10px] uppercase font-bold text-muted-foreground">Patient Katz ADL Function</span>
            <CardTitle className="text-xl font-bold flex items-baseline gap-2">
              <span>{careGap?.katzAdlScore ?? 0}/6</span>
              <span className="text-xs font-normal text-muted-foreground capitalize">({careGap?.katzDependenceLevel ? careGap.katzDependenceLevel.replace('_', ' ') : 'Evaluation Pending'})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-xs text-muted-foreground">
            <p>• {Array.isArray(patient?.primaryConditions) && patient.primaryConditions.length > 0 ? patient.primaryConditions.join(', ') : 'Geriatric Multi-Morbidity'}</p>
            <p>• Cognitive: {patient?.cognitiveBehavioralLoad ? patient.cognitiveBehavioralLoad.replace('_', ' ') : 'Standard Load'}</p>
          </CardContent>
        </Card>

        {/* Caregiver Psychometrics */}
        <Card className="border-border bg-card shadow-xs">
          <CardHeader className="pb-2">
            <span className="text-[10px] uppercase font-bold text-muted-foreground">Caregiver ZBI Psychometric</span>
            <CardTitle className="text-xl font-bold flex items-baseline gap-2">
              <span>{zarit ? `${zarit.totalScore}/${zarit.maxScore}` : 'Not Assessed'}</span>
              {zarit && (
                <Badge variant={zarit.severityBand === 'critical_red' ? 'destructive' : 'outline'} className="text-[10px]">
                  {zarit.normalizedPercentage}%
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-xs text-muted-foreground">
            <p>• Caregiver: {caregiver?.name || 'Primary Caregiver'} ({caregiver?.kinship || 'Family'})</p>
            <p>• Lumbar Injury Risk: <strong>{careGap?.caregiverInjuryRiskScore ?? 0}%</strong></p>
          </CardContent>
        </Card>

        {/* Formal Support Infrastructure */}
        <Card className="border-border bg-card shadow-xs">
          <CardHeader className="pb-2">
            <span className="text-[10px] uppercase font-bold text-muted-foreground">Formal Support & Net Care Gap</span>
            <CardTitle className="text-xl font-bold flex items-baseline gap-2">
              <span className={(careGap?.netCareGapHours ?? 0) > 2 ? 'text-rose-600' : 'text-emerald-600'}>
                {(careGap?.netCareGapHours ?? 0) > 0 ? `+${careGap.netCareGapHours}h` : '0h Deficit'}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-xs text-muted-foreground">
            <p>• Formal Setup: <strong>{caregiver?.formalSupport?.type ? caregiver.formalSupport.type.replace(/_/g, ' ') : 'None'}</strong></p>
            <p>• Absorbed: <strong>{careGap?.formalSupportAbsorbedHours ?? 0} hrs/day</strong></p>
          </CardContent>
        </Card>
      </div>

      {/* Embedded Doctor's Clinical Encounter Brief */}
      <Card className="border-border bg-card shadow-sm overflow-hidden">
        <CardHeader className="border-b border-border/40 bg-muted/20 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <div>
                <CardTitle className="text-base font-bold">Live Geriatric Clinic Encounter Brief</CardTitle>
                <CardDescription className="text-xs">
                  Official clinical dyad evaluation and Beers Criteria prescription interactions ready for review.
                </CardDescription>
              </div>
            </div>
            <Button size="sm" onClick={() => window.print()} variant="outline" className="gap-1.5 text-xs font-bold">
              <Printer className="w-3.5 h-3.5" /> Print / Save PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-950">
          <ClinicalSummaryPrint zaritResult={zarit} vitals={vitals} medications={medications} />
        </CardContent>
      </Card>
    </div>
  );
}
