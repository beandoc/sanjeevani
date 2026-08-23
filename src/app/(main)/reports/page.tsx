'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Printer, Download, FileText, ArrowLeft, HeartPulse } from 'lucide-react';
import Link from 'next/link';
import { HealthRepository, VitalRecord, MedicationItem } from '@/lib/db/health-repository';
import { ZaritEvaluationResult } from '@/lib/zarit-scale';
import { ClinicalSummaryPrint } from '@/components/reports/clinical-summary-print';

export default function ReportsPage() {
  const [zaritResult, setZaritResult] = useState<ZaritEvaluationResult | null>(null);
  const [vitals, setVitals] = useState<VitalRecord[]>([]);
  const [medications, setMedications] = useState<MedicationItem[]>([]);

  useEffect(() => {
    const assessments = HealthRepository.getZaritAssessments();
    if (assessments.length > 0) {
      setZaritResult(assessments[0]);
    }
    setVitals(HealthRepository.getVitals());
    setMedications(HealthRepository.getMedications());
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 sm:p-6">
      {/* Top Action Bar (Hidden in Print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider mb-1">
            <FileText className="w-4 h-4" />
            <span>Clinical Encounter Documentation</span>
          </div>
          <h1 className="text-3xl font-bold font-headline">Geriatric Clinic Encounter Brief</h1>
          <p className="text-muted-foreground text-sm">
            Print or save as PDF to present to your consulting geriatrician or physician during OPD visits.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link href="/dashboard">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
            </Button>
          </Link>
          <Button onClick={handlePrint} size="sm" className="gap-2 font-bold text-xs shadow-md">
            <Printer className="w-4 h-4" /> Print / Save as PDF
          </Button>
        </div>
      </div>

      {/* Report Container */}
      <div className="border border-border rounded-3xl overflow-hidden shadow-sm bg-white print:border-none print:shadow-none">
        <ClinicalSummaryPrint
          zaritResult={zaritResult}
          vitals={vitals}
          medications={medications}
        />
      </div>
    </div>
  );
}
