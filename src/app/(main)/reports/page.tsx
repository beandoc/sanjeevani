'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, FileText, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuthUser } from '@/hooks/use-auth-user';
import { HealthRepository, VitalRecord, MedicationItem } from '@/lib/db/health-repository';
import { ZaritEvaluationResult } from '@/lib/zarit-scale';
import {
  CaregiverAttributes,
  PatientDependenceProfile
} from '@/lib/clinical/care-gap-engine';
import {
  getCaregiverAttributesFor,
  getPatientProfileFor,
  getZaritAssessmentsFor,
  getVitalsFor,
  getMedicationsFor
} from '@/lib/firebase/clinical-sync';
import { ClinicalSummaryPrint } from '@/components/reports/clinical-summary-print';

function ReportsContent() {
  const searchParams = useSearchParams();
  const { user } = useAuthUser();

  const [zaritResult, setZaritResult] = useState<ZaritEvaluationResult | null>(null);
  const [vitals, setVitals] = useState<VitalRecord[]>([]);
  const [medications, setMedications] = useState<MedicationItem[]>([]);
  const [caregiverAttrs, setCaregiverAttrs] = useState<CaregiverAttributes | null>(null);
  const [patientProfile, setPatientProfile] = useState<PatientDependenceProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const patientUid = searchParams.get('patientUid') || user?.uid || null;

  useEffect(() => {
    async function loadReportData() {
      setIsLoading(true);
      try {
        if (patientUid) {
          const [remoteCg, remotePt, remoteZarit, remoteVitals, remoteMeds] = await Promise.all([
            getCaregiverAttributesFor(patientUid),
            getPatientProfileFor(patientUid),
            getZaritAssessmentsFor(patientUid),
            getVitalsFor(patientUid),
            getMedicationsFor(patientUid)
          ]);

          if (remoteCg) setCaregiverAttrs(remoteCg);
          else if (HealthRepository.hasStoredDyadProfile()) setCaregiverAttrs(HealthRepository.getCaregiverAttributes());

          if (remotePt) setPatientProfile(remotePt);
          else if (HealthRepository.hasStoredDyadProfile()) setPatientProfile(HealthRepository.getPatientProfile());

          if (remoteZarit && remoteZarit.length > 0) setZaritResult(remoteZarit[0]);
          else {
            const localZarit = HealthRepository.getZaritAssessments();
            if (localZarit.length > 0) setZaritResult(localZarit[0]);
          }

          if (remoteVitals && remoteVitals.length > 0) setVitals(remoteVitals);
          else setVitals(HealthRepository.getVitals());

          if (remoteMeds && remoteMeds.length > 0) setMedications(remoteMeds);
          else setMedications(HealthRepository.getMedications());
        } else {
          // Fallback to local repository
          const assessments = HealthRepository.getZaritAssessments();
          if (assessments.length > 0) {
            setZaritResult(assessments[0]);
          }
          setVitals(HealthRepository.getVitals());
          setMedications(HealthRepository.getMedications());
          if (HealthRepository.hasStoredDyadProfile()) {
            setCaregiverAttrs(HealthRepository.getCaregiverAttributes());
            setPatientProfile(HealthRepository.getPatientProfile());
          }
        }
      } catch (err) {
        console.warn('Could not load remote report data:', err);
      } finally {
        setIsLoading(false);
      }
    }

    void loadReportData();
  }, [patientUid]);

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
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="text-xs">Generating Clinical Encounter Brief…</span>
          </div>
        ) : (
          <ClinicalSummaryPrint
            zaritResult={zaritResult}
            vitals={vitals}
            medications={medications}
            caregiverAttrs={caregiverAttrs}
            patientProfile={patientProfile}
          />
        )}
      </div>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
        </div>
      }
    >
      <ReportsContent />
    </Suspense>
  );
}
