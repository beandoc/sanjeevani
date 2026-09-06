'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { PatientDependenceProfile } from '@/lib/db/health-repository';
import { nutritionSafetyFlags } from '@/lib/clinical/nutrition-safety';

type Props = { patient: PatientDependenceProfile; onChange: (patient: PatientDependenceProfile) => void };
const source = 'clinician_assisted' as const;
const today = () => new Date().toISOString();
const number = (value: string, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

export function ClinicalSafetyAssessmentPanel({ patient, onChange }: Props) {
  const assessments = patient.clinicalAssessments || {};
  const set = <K extends keyof NonNullable<PatientDependenceProfile['clinicalAssessments']>>(key: K, value: NonNullable<PatientDependenceProfile['clinicalAssessments']>[K]) => onChange({ ...patient, clinicalAssessments: { ...assessments, [key]: value } });
  const fourAt = assessments.fourAt?.score ?? 0;
  const braden = assessments.braden?.score ?? 23;
  const painad = assessments.painad?.score ?? 0;
  const nutrition = nutritionSafetyFlags({ currentWeightKg: patient.weightKg, baselineWeightKg: patient.nutritionMonitoring?.baselineWeightKg, dysphagiaRisk: patient.nutritionMonitoring?.dysphagiaRisk, intakePercentLast24h: patient.nutritionMonitoring?.intakePercentLast24h });

  return <Card className="border-border bg-card shadow-sm">
    <CardHeader><CardTitle className="text-base">Clinical safety assessment set</CardTitle><CardDescription className="text-xs">Validated scales are recorded for clinician review; they do not diagnose or issue treatment orders.</CardDescription></CardHeader>
    <CardContent className="space-y-5">
      <div className="grid gap-3 md:grid-cols-3">
        <div className="space-y-1.5"><Label className="text-xs">4AT score (0–12)</Label><Input type="number" min="0" max="12" value={fourAt} onChange={e => set('fourAt', { score: Math.max(0, Math.min(12, number(e.target.value))), assessedAt: today(), source })} className="h-9 text-xs" /><p className="text-[10px] text-muted-foreground">Localized 4AT workflow required; score ≥1 needs clinical review.</p></div>
        <div className="space-y-1.5"><Label className="text-xs">Braden score (6–23)</Label><Input type="number" min="6" max="23" value={braden} onChange={e => set('braden', { score: Math.max(6, Math.min(23, number(e.target.value, 23))), assessedAt: today(), source })} className="h-9 text-xs" /><p className="text-[10px] text-muted-foreground">Complete the six-item instrument before assigning pressure-injury risk.</p></div>
        <div className="space-y-1.5"><Label className="text-xs">PAINAD score (0–10)</Label><Input type="number" min="0" max="10" value={painad} onChange={e => set('painad', { score: Math.max(0, Math.min(10, number(e.target.value))), assessedAt: today(), source })} className="h-9 text-xs" /><p className="text-[10px] text-muted-foreground">Score {painad}; {painad >= 2 ? 'document clinician review.' : 'complete the full five-item instrument.'}</p></div>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <div className="space-y-1.5"><Label className="text-xs">Clinical Frailty Scale (1–9)</Label><Input type="number" min="1" max="9" value={assessments.clinicalFrailtyScale?.score ?? ''} onChange={e => set('clinicalFrailtyScale', { score: Math.max(1, Math.min(9, number(e.target.value, 1))), assessedAt: today(), source })} className="h-9 text-xs" /></div>
        <div className="space-y-1.5"><Label className="text-xs">GDS-15 score (0–15)</Label><Input type="number" min="0" max="15" value={assessments.gds15?.score ?? ''} onChange={e => set('gds15', { score: Math.max(0, Math.min(15, number(e.target.value))), assessedAt: today(), source: 'clinician_assisted' })} className="h-9 text-xs" /></div>
        <div className="space-y-1.5"><Label className="text-xs">MNA-SF score (0–14)</Label><Input type="number" min="0" max="14" value={assessments.mnaSf?.score ?? ''} onChange={e => set('mnaSf', { score: Math.max(0, Math.min(14, number(e.target.value))), assessedAt: today(), source })} className="h-9 text-xs" /></div>
      </div>
      <div className="grid gap-3 md:grid-cols-2 border-t pt-4">
        <div className="space-y-1.5"><Label className="text-xs">What matters most / goals of care</Label><Input value={patient.goalsOfCare?.whatMattersMost || ''} onChange={e => onChange({ ...patient, goalsOfCare: { ...patient.goalsOfCare, whatMattersMost: e.target.value, documentedAt: patient.goalsOfCare?.documentedAt || today() } })} placeholder="Patient priorities, acceptable trade-offs, meaningful activities" className="h-9 text-xs" /></div>
        <div className="space-y-1.5"><Label className="text-xs">Escalation preference</Label><Select value={patient.goalsOfCare?.escalationPreference || 'not_documented'} onValueChange={value => onChange({ ...patient, goalsOfCare: { ...patient.goalsOfCare, escalationPreference: value as 'full_escalation' | 'hospital_review_before_transfer' | 'comfort_focused' | 'not_documented', documentedAt: patient.goalsOfCare?.documentedAt || today() } })}><SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="not_documented">Not documented — seek clinical review</SelectItem><SelectItem value="full_escalation">Full escalation</SelectItem><SelectItem value="hospital_review_before_transfer">Hospital review before transfer</SelectItem><SelectItem value="comfort_focused">Comfort-focused (clinician-confirmed only)</SelectItem></SelectContent></Select></div>
      </div>
      <div className="grid gap-3 md:grid-cols-2"><Input value={patient.goalsOfCare?.surrogateName || ''} onChange={e => onChange({ ...patient, goalsOfCare: { ...patient.goalsOfCare, surrogateName: e.target.value } })} placeholder="Surrogate decision-maker name" className="h-9 text-xs" /><Input value={patient.goalsOfCare?.surrogatePhone || ''} onChange={e => onChange({ ...patient, goalsOfCare: { ...patient.goalsOfCare, surrogatePhone: e.target.value } })} placeholder="Surrogate phone" className="h-9 text-xs" /></div>
      <div className="border-t pt-4 space-y-3"><p className="text-xs font-bold">Skin, swallowing & nutrition surveillance</p><div className="grid gap-3 md:grid-cols-3"><Input type="date" value={patient.skinIntegrity?.lastSkinCheckAt?.slice(0, 10) || ''} onChange={e => onChange({ ...patient, skinIntegrity: { ...patient.skinIntegrity, lastSkinCheckAt: e.target.value || undefined } })} className="h-9 text-xs" /><Input type="number" min="0" max="100" value={patient.nutritionMonitoring?.intakePercentLast24h ?? ''} onChange={e => onChange({ ...patient, nutritionMonitoring: { ...patient.nutritionMonitoring, intakePercentLast24h: number(e.target.value) } })} placeholder="24h intake %" className="h-9 text-xs" /><Input type="number" min="1" step="0.1" value={patient.nutritionMonitoring?.baselineWeightKg ?? ''} onChange={e => onChange({ ...patient, nutritionMonitoring: { ...patient.nutritionMonitoring, baselineWeightKg: number(e.target.value) } })} placeholder="Baseline weight kg" className="h-9 text-xs" /></div><Select value={patient.nutritionMonitoring?.dysphagiaRisk || 'not_screened'} onValueChange={value => onChange({ ...patient, nutritionMonitoring: { ...patient.nutritionMonitoring, dysphagiaRisk: value as 'not_screened' | 'none_reported' | 'possible_risk' | 'clinician_confirmed' } })}><SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="not_screened">Dysphagia not screened</SelectItem><SelectItem value="none_reported">No risk reported</SelectItem><SelectItem value="possible_risk">Possible risk — clinician review</SelectItem><SelectItem value="clinician_confirmed">Clinician-confirmed risk</SelectItem></SelectContent></Select>{nutrition.flags.map(flag => <p key={flag} className="text-[11px] text-amber-700">{flag}</p>)}</div>
    </CardContent>
  </Card>;
}
