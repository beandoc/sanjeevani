'use client';

import React, { useState, useEffect } from 'react';
import { ZaritEvaluationResult } from '@/lib/zarit-scale';
import { VitalRecord, MedicationItem, HealthRepository } from '@/lib/db/health-repository';
import {
  DEFAULT_CAREGIVER_ATTRIBUTES,
  DEFAULT_PATIENT_PROFILE,
  CareGapEngine
} from '@/lib/clinical/care-gap-engine';
import { format } from 'date-fns';

interface ClinicalSummaryPrintProps {
  zaritResult?: ZaritEvaluationResult | null;
  vitals: VitalRecord[];
  medications: MedicationItem[];
  patientName?: string;
  caregiverName?: string;
  caregiverRelation?: string;
}

export function ClinicalSummaryPrint({
  zaritResult,
  vitals,
  medications,
  patientName = 'Smt. Sarojini Devi (Age 81)',
  caregiverName = 'Suresh Kumar (Son)',
  caregiverRelation = 'Primary Family Caregiver',
}: ClinicalSummaryPrintProps) {
  const [mounted, setMounted] = useState(false);
  const [docId, setDocId] = useState('SNJ-CLINICAL-000000');
  const [generatedDate, setGeneratedDate] = useState<Date | null>(null);
  const [caregiverAttrs, setCaregiverAttrs] = useState(DEFAULT_CAREGIVER_ATTRIBUTES);
  const [patientProfile, setPatientProfile] = useState(DEFAULT_PATIENT_PROFILE);
  const [careGapEval, setCareGapEval] = useState(() =>
    CareGapEngine.evaluate(DEFAULT_CAREGIVER_ATTRIBUTES, DEFAULT_PATIENT_PROFILE)
  );

  useEffect(() => {
    setMounted(true);
    setGeneratedDate(new Date());
    setDocId(`SNJ-CLINICAL-${Date.now().toString().slice(-6)}`);
    setCaregiverAttrs(HealthRepository.getCaregiverAttributes());
    setPatientProfile(HealthRepository.getPatientProfile());
    setCareGapEval(HealthRepository.getCareGapEvaluation());
  }, []);

  // Consistent 10-Record / Recent 14-Day Window Analytics
  const recentVitals = vitals.slice(0, 10);

  const systolicValues = recentVitals
    .map((v) => parseInt(v.bp?.split('/')[0] || ''))
    .filter((n) => !isNaN(n) && n > 0);
  const diastolicValues = recentVitals
    .map((v) => parseInt(v.bp?.split('/')[1] || ''))
    .filter((n) => !isNaN(n) && n > 0);
  const meanSystolic =
    systolicValues.length > 0
      ? Math.round(systolicValues.reduce((a, b) => a + b, 0) / systolicValues.length)
      : null;
  const meanDiastolic =
    diastolicValues.length > 0
      ? Math.round(diastolicValues.reduce((a, b) => a + b, 0) / diastolicValues.length)
      : null;

  const pulseValues = recentVitals
    .map((v) => Number(v.pulse))
    .filter((p) => !isNaN(p) && p > 0);
  const meanPulse =
    pulseValues.length > 0
      ? Math.round(pulseValues.reduce((a, b) => a + b, 0) / pulseValues.length)
      : null;

  const sugarValues = recentVitals
    .map((v) => Number(v.bloodSugar))
    .filter((s) => !isNaN(s) && s > 0);
  const meanSugar =
    sugarValues.length > 0
      ? Math.round(sugarValues.reduce((a, b) => a + b, 0) / sugarValues.length)
      : null;

  // BP Stage Interpretation
  let bpClassification = '';
  if (meanSystolic && meanDiastolic) {
    if (meanSystolic < 120 && meanDiastolic < 80) bpClassification = 'Normotensive';
    else if (meanSystolic <= 129 && meanDiastolic < 80) bpClassification = 'Elevated';
    else if (meanSystolic <= 139 || meanDiastolic <= 89) bpClassification = 'Stage 1 HTN';
    else bpClassification = 'Stage 2 HTN';
  }

  return (
    <div className="bg-white text-black p-8 max-w-4xl mx-auto font-sans leading-relaxed text-xs space-y-6 print:p-0 print:m-0 print:text-black print:bg-white">
      {/* 1. Header & Clinic Encounter Banner */}
      <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 font-headline uppercase">
            Sanjeevani Clinical Care Brief
          </h1>
          <p className="text-xs font-semibold text-slate-600">
            Geriatric Caregiver Dyad Assessment & Health Trajectory Report
          </p>
        </div>
        <div className="text-right space-y-0.5">
          <p className="font-mono font-bold text-xs" suppressHydrationWarning>
            Generated: {generatedDate ? format(generatedDate, 'PPP p') : '—'}
          </p>
          <p className="text-[10px] text-slate-500" suppressHydrationWarning>
            Document ID: {docId}
          </p>
        </div>
      </div>

      {/* 2. Patient & Caregiver Dyad Profile Matrix */}
      <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 border border-slate-300 rounded-lg">
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-500">Patient Demographics & Functional State</span>
          <p className="text-sm font-bold text-slate-900">{patientProfile.name} (Age {patientProfile.age})</p>
          <p className="text-xs text-slate-700">Conditions: {patientProfile.primaryConditions.join(', ')}</p>
          <p className="text-xs font-medium text-slate-800">
            Katz ADL Independence: <strong>{careGapEval.katzAdlScore}/6</strong> ({careGapEval.katzDependenceLevel.replace('_', ' ')})
          </p>
        </div>
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-500">Caregiver Dyad Profile & Capacity</span>
          <p className="text-sm font-bold text-slate-900">{caregiverAttrs.name} (Age {caregiverAttrs.age}, {caregiverAttrs.kinship})</p>
          <p className="text-xs text-slate-700">
            Employment: {caregiverAttrs.employment.replace('_', ' ')} • Available: {caregiverAttrs.dailyHoursCommitted} hrs/day
          </p>
          <p className="text-xs text-slate-700">
            Formal Support: <strong>{caregiverAttrs.formalSupport && caregiverAttrs.formalSupport.type !== 'none' ? caregiverAttrs.formalSupport.type.replace(/_/g, ' ') : 'None (Solo Family)'}</strong>
            {careGapEval.formalSupportAbsorbedHours > 0 && ` (absorbs ${careGapEval.formalSupportAbsorbedHours}h/day)`}
          </p>
          <p className="text-xs font-medium text-slate-800">
            Net Care Gap: <strong>{careGapEval.netCareGapHours > 0 ? `+${careGapEval.netCareGapHours} hrs deficit/day` : 'Balanced'}</strong> ({careGapEval.careGapSeverity.replace('_', ' ')})
          </p>
        </div>
      </div>

      {/* 3. Care Gap & Biomechanical Deficit Findings */}
      <div className="p-3 bg-amber-50/60 border border-amber-300 rounded-lg text-xs space-y-1">
        <span className="text-[10px] uppercase font-bold text-amber-900 block">
          Geriatric Care Gap & Physical Fatigue Indicator
        </span>
        <p className="text-slate-800">
          Patient requires <strong>{careGapEval.patientCareDemandHours} hrs/day</strong> of direct assistance. 
          {careGapEval.formalSupportAbsorbedHours > 0 && ` Formal staff absorbs ${careGapEval.formalSupportAbsorbedHours} hrs/day.`}
          Caregiver safe physical threshold is <strong>{careGapEval.caregiverSafeCapacityHours} hrs/day</strong> (Caregiver Lumbar Injury Risk: <strong>{careGapEval.caregiverInjuryRiskScore}%</strong>).
        </p>
      </div>

      {/* 4. Standardized Zarit Caregiver Burden Scale (ZBI) Psychometrics */}
      <div className="space-y-2 border border-slate-300 p-4 rounded-lg">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <h3 className="text-sm font-bold text-slate-900 uppercase">
            1. Zarit Caregiver Burden Scale (ZBI) Evaluation
          </h3>
          {zaritResult && (
            <span className="font-mono font-bold text-xs px-2 py-0.5 bg-slate-200 text-slate-900 rounded">
              Instrument: {zaritResult.tier} ({zaritResult.totalScore}/{zaritResult.maxScore})
            </span>
          )}
        </div>

        {zaritResult ? (
          <div className="space-y-3 pt-1">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-2.5 bg-slate-100 rounded text-center">
                <span className="text-[10px] uppercase font-bold text-slate-600">Total Score</span>
                <p className="text-2xl font-black text-slate-900">
                  {zaritResult.totalScore} <span className="text-xs font-normal">/ {zaritResult.maxScore}</span>
                </p>
              </div>
              <div className="p-2.5 bg-slate-100 rounded text-center">
                <span className="text-[10px] uppercase font-bold text-slate-600">Severity Band</span>
                <p className="text-base font-bold text-slate-900 capitalize">{zaritResult.severityBand.replace('_', ' ')}</p>
              </div>
              <div className="p-2.5 bg-slate-100 rounded text-center">
                <span className="text-[10px] uppercase font-bold text-slate-600">Scaled Strain</span>
                <p className="text-2xl font-black text-slate-900">{zaritResult.normalizedPercentage}%</p>
              </div>
            </div>

            {/* Subscale Factor Decomposition */}
            {zaritResult.factors && (
              <div className="pt-2">
                <span className="text-[10px] uppercase font-bold text-slate-600">Subscale Factor Breakdown</span>
                <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
                  {Object.entries(zaritResult.factors).map(([key, f]) => (
                    <div key={key} className={`p-1.5 border rounded ${f.isMeasured ? 'border-slate-300 bg-white' : 'border-slate-200 bg-slate-50 text-slate-400'}`}>
                      <strong>{f.title.en}:</strong> {f.isMeasured && f.percentage !== null ? `${f.percentage}% (${f.rawScore}/${f.maxScore})` : 'Unassessed'}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Red Flags if Present */}
            {zaritResult.redFlags && zaritResult.redFlags.length > 0 && (
              <div className="p-2 bg-red-50 border border-red-200 text-red-900 rounded text-xs">
                <strong>Critical Clinical Flags:</strong> {zaritResult.redFlags.join('; ')}
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic">No Zarit evaluation recorded yet.</p>
        )}
      </div>

      {/* 5. Longitudinal Vitals Record Table & Window Analytics */}
      <div className="space-y-2 border border-slate-300 p-4 rounded-lg">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <h3 className="text-sm font-bold text-slate-900 uppercase">
            2. Recent Clinical Vitals & Parameters ({recentVitals.length} Logs Analyzed)
          </h3>
          <div className="flex items-center gap-3 text-[11px] text-slate-700">
            {meanSystolic && meanDiastolic && (
              <span className="font-semibold">
                Mean BP: <strong>{meanSystolic}/{meanDiastolic} mmHg</strong> ({bpClassification})
              </span>
            )}
            {meanPulse && <span>Mean Pulse: <strong>{meanPulse} bpm</strong></span>}
            {meanSugar && <span>Mean Sugar: <strong>{meanSugar} mg/dL</strong></span>}
          </div>
        </div>

        {recentVitals.length > 0 ? (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-300 font-bold bg-slate-50">
                <th className="py-1 px-2">Date</th>
                <th className="py-1 px-2">Blood Pressure</th>
                <th className="py-1 px-2">Pulse</th>
                <th className="py-1 px-2">Sugar</th>
                <th className="py-1 px-2">Weight</th>
                <th className="py-1 px-2">Sleep</th>
                <th className="py-1 px-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              {recentVitals.map((v) => (
                <tr key={v.id} className="border-b border-slate-200">
                  <td className="py-1 px-2 font-medium">{format(new Date(v.date), 'dd MMM yyyy')}</td>
                  <td className="py-1 px-2 font-mono">{v.bp || '—'}</td>
                  <td className="py-1 px-2 font-mono">{v.pulse ? `${v.pulse} bpm` : '—'}</td>
                  <td className="py-1 px-2 font-mono">{v.bloodSugar ? `${v.bloodSugar} mg/dL` : '—'}</td>
                  <td className="py-1 px-2 font-mono">{v.weight ? `${v.weight} kg` : '—'}</td>
                  <td className="py-1 px-2 capitalize">{v.sleep}</td>
                  <td className="py-1 px-2 text-slate-600 max-w-[150px] truncate">{v.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-xs text-slate-500 italic">No vitals logged.</p>
        )}
      </div>

      {/* 6. Active Medication Regimen & Beers Safety */}
      <div className="space-y-2 border border-slate-300 p-4 rounded-lg">
        <h3 className="text-sm font-bold text-slate-900 uppercase border-b border-slate-200 pb-2">
          3. Active Medication Schedule ({medications.length} Prescriptions)
        </h3>

        {medications.length > 0 ? (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-300 font-bold bg-slate-50">
                <th className="py-1 px-2">Drug Name</th>
                <th className="py-1 px-2">Dosage</th>
                <th className="py-1 px-2">Timing</th>
                <th className="py-1 px-2">Food Relation</th>
                <th className="py-1 px-2">Geriatric Caution</th>
              </tr>
            </thead>
            <tbody>
              {medications.map((m) => (
                <tr key={m.id} className="border-b border-slate-200">
                  <td className="py-1 px-2 font-bold">{m.name}</td>
                  <td className="py-1 px-2 font-mono">{m.dosage}</td>
                  <td className="py-1 px-2 capitalize">{m.timeOfDay.join(', ')}</td>
                  <td className="py-1 px-2 capitalize">{m.foodRelation} food</td>
                  <td className="py-1 px-2 text-slate-700">{m.beersWarning ? `⚠️ ${m.beersWarning}` : 'Standard'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-xs text-slate-500 italic">No medications recorded.</p>
        )}
      </div>

      {/* 7. Clinician Clinical Notes & Orders Box */}
      <div className="border-2 border-dashed border-slate-400 p-4 rounded-lg space-y-6">
        <span className="text-[10px] uppercase font-bold text-slate-600 block">
          4. Attending Geriatrician / Clinician Assessment & Orders
        </span>
        <div className="h-16" />
        <div className="flex items-center justify-between pt-4 border-t border-slate-300 text-[11px] text-slate-700">
          <div>
            <p>Doctor&apos;s Signature / Stamp: _______________________</p>
          </div>
          <div>
            <p>Date: _______________ • Registration No: _______________</p>
          </div>
        </div>
      </div>
    </div>
  );
}
