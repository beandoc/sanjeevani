'use client';

import React from 'react';
import { ZaritEvaluationResult } from '@/lib/zarit-scale';
import { VitalRecord, MedicationItem, EmergencyContact } from '@/lib/db/health-repository';
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
  const currentDate = new Date();

  // Compute Vitals Summary
  const recentVitals = vitals.slice(0, 10);
  const bpReadings = vitals.map((v) => v.bp).filter(Boolean);
  const pulseReadings = vitals.map((v) => Number(v.pulse)).filter((p) => !isNaN(p) && p > 0);
  const avgPulse = pulseReadings.length > 0 ? Math.round(pulseReadings.reduce((a, b) => a + b, 0) / pulseReadings.length) : null;

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
          <p className="font-mono font-bold text-xs">Generated: {format(currentDate, 'PPP p')}</p>
          <p className="text-[10px] text-slate-500">Document ID: SNJ-CLINICAL-{Date.now().toString().slice(-6)}</p>
        </div>
      </div>

      {/* 2. Patient & Caregiver Dyad Profile */}
      <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 border border-slate-300 rounded-lg">
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-500">Patient Demographics</span>
          <p className="text-sm font-bold text-slate-900">{patientName}</p>
          <p className="text-xs text-slate-700">Primary Diagnosis: Multimorbidity (Hypertension, Mild Cognitive Decline, Osteoarthritis)</p>
        </div>
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-500">Caregiver Profile</span>
          <p className="text-sm font-bold text-slate-900">{caregiverName}</p>
          <p className="text-xs text-slate-700">Role: {caregiverRelation} • Care Duration: 2+ Years</p>
        </div>
      </div>

      {/* 3. Standardized Zarit Caregiver Burden Scale (ZBI) Psychometrics */}
      <div className="space-y-2 border border-slate-300 p-4 rounded-lg">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <h3 className="text-sm font-bold text-slate-900 uppercase">
            1. Zarit Caregiver Burden Scale (ZBI) Evaluation
          </h3>
          {zaritResult && (
            <span className="font-mono font-bold text-xs px-2 py-0.5 bg-slate-200 text-slate-900 rounded">
              Tier: {zaritResult.tier}
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
                <p className="text-base font-bold text-slate-900 capitalize">{zaritResult.severityBand} Burden</p>
              </div>
              <div className="p-2.5 bg-slate-100 rounded text-center">
                <span className="text-[10px] uppercase font-bold text-slate-600">Scaled Strain</span>
                <p className="text-2xl font-black text-slate-900">{zaritResult.normalizedPercentage}%</p>
              </div>
            </div>

            {/* Subscale Factor Decomposition */}
            {zaritResult.factors && (
              <div className="pt-2">
                <span className="text-[10px] uppercase font-bold text-slate-600">Subscale Factor Breakdown (0-100% Normalized)</span>
                <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
                  <div className="p-1.5 border border-slate-200 rounded">
                    <strong>Personal Strain:</strong> {zaritResult.factors.personal_strain?.percentage || 0}%
                  </div>
                  <div className="p-1.5 border border-slate-200 rounded">
                    <strong>Role Strain:</strong> {zaritResult.factors.role_strain?.percentage || 0}%
                  </div>
                  <div className="p-1.5 border border-slate-200 rounded">
                    <strong>Financial Strain:</strong> {zaritResult.factors.financial_strain?.percentage || 0}%
                  </div>
                  <div className="p-1.5 border border-slate-200 rounded">
                    <strong>Competency:</strong> {zaritResult.factors.competency?.percentage || 0}%
                  </div>
                  <div className="p-1.5 border border-slate-200 rounded">
                    <strong>Guilt:</strong> {zaritResult.factors.guilt?.percentage || 0}%
                  </div>
                  <div className="p-1.5 border border-slate-200 rounded">
                    <strong>Global Anchor:</strong> {zaritResult.factors.global_burden?.percentage || 0}%
                  </div>
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

      {/* 4. Longitudinal Vitals Record Table */}
      <div className="space-y-2 border border-slate-300 p-4 rounded-lg">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <h3 className="text-sm font-bold text-slate-900 uppercase">
            2. Recent Clinical Vitals & Parameters ({recentVitals.length} Logs)
          </h3>
          {avgPulse && <span className="text-[11px] text-slate-600">Mean Pulse: {avgPulse} bpm</span>}
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

      {/* 5. Active Medication Regimen & Beers Safety */}
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

      {/* 6. Clinician Clinical Notes & Recommendations Box */}
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
