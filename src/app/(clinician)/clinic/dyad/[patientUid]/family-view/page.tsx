'use client';

/**
 * Read-only preview of what THIS patient's family/caregiver sees in their own Kutumbh Care
 * Circle — reachable from the clinician "Family View" header button while viewing a specific
 * dyad. Every field here is fetched by `patientUid` (the same `*For(patientUid)` functions the
 * clinician dyad page already uses) so it reflects the actual family-facing state of the currently
 * open patient, rather than the previous behaviour where "Family View" linked to the generic
 * `/dashboard` route — which showed the signed-in clinician's OWN account data (almost always
 * empty), with zero relationship to whichever patient they had open.
 *
 * Deliberately read-only: no save/edit/export/discharge affordances. A clinician previewing this
 * must not be able to mutate the family's data from here — that stays on the main dyad workspace.
 */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Users2,
  HeartPulse,
  Pill,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Hospital,
  Eye
} from 'lucide-react';
import {
  getPatientDisplayName,
  getCaregiverAttributesFor,
  getPatientProfileFor,
  getMedicationsFor,
  getVitalsFor,
  getZaritAssessmentsFor,
  getCareCircleFor,
  getClinicalAuthorizationFor
} from '@/lib/firebase/clinical-sync';
import type { CaregiverAttributes, PatientDependenceProfile } from '@/lib/clinical/care-gap-engine';
import { CareGapEngine, DEFAULT_ASSISTIVE_DEVICES } from '@/lib/clinical/care-gap-engine';
import { DIURNAL_BLOCK_META } from '@/lib/clinical/shift-allocator';
import { verifyClinicalAuthorization, type ClinicalAuthorizationRecord } from '@/lib/clinical/clinical-authorization';
import type { MedicationItem, VitalRecord, CareCircleMember, CareCircleTask } from '@/lib/db/health-repository';
import type { ZaritEvaluationResult } from '@/lib/zarit-scale';
import { cn } from '@/lib/utils';

const TASK_LABELS: Record<string, { label: string; icon: string }> = {
  heavy_transfers: { label: 'Heavy Transfers', icon: '💪' },
  bathing: { label: 'Bathing & Hygiene', icon: '🛁' },
  medications: { label: 'Medications & Logs', icon: '💊' },
  night_care: { label: 'Night Watch', icon: '🌙' },
  feeding: { label: 'Feeding & Nutrition', icon: '🍲' },
  logistics_errands: { label: 'Hospital Logistics', icon: '🚗' }
};

function PanelSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-24 rounded-3xl bg-muted/40" />
      <div className="h-40 rounded-3xl bg-muted/40" />
      <div className="h-40 rounded-3xl bg-muted/40" />
    </div>
  );
}

export default function FamilyViewPage() {
  const params = useParams();
  const patientUid = (params?.patientUid as string) || '';

  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState('');
  const [caregiver, setCaregiver] = useState<CaregiverAttributes | null>(null);
  const [patient, setPatient] = useState<PatientDependenceProfile | null>(null);
  const [medications, setMedications] = useState<MedicationItem[]>([]);
  const [vitals, setVitals] = useState<VitalRecord[]>([]);
  const [zaritHistory, setZaritHistory] = useState<ZaritEvaluationResult[]>([]);
  const [circle, setCircle] = useState<{ members: CareCircleMember[]; tasks: CareCircleTask[] } | null>(null);
  const [authorization, setAuthorization] = useState<ClinicalAuthorizationRecord | null>(null);

  useEffect(() => {
    if (!patientUid) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [name, cg, pt, meds, vit, zarit, care, auth] = await Promise.all([
        getPatientDisplayName(patientUid).catch(() => 'Patient Dyad'),
        getCaregiverAttributesFor(patientUid).catch(() => null),
        getPatientProfileFor(patientUid).catch(() => null),
        getMedicationsFor(patientUid).catch(() => []),
        getVitalsFor(patientUid).catch(() => []),
        getZaritAssessmentsFor(patientUid).catch(() => []),
        getCareCircleFor(patientUid).catch(() => null),
        getClinicalAuthorizationFor(patientUid).catch(() => null)
      ]);
      if (cancelled) return;
      setDisplayName(name);
      setCaregiver(cg);
      setPatient(pt);
      setMedications(meds);
      setVitals(vit);
      setZaritHistory(zarit);
      setCircle(care);
      setAuthorization(auth);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [patientUid]);

  const evaluation = useMemo(() => {
    if (!caregiver || !patient) return null;
    return CareGapEngine.evaluate(caregiver, patient);
  }, [caregiver, patient]);

  const authVerdict = useMemo(
    () => (caregiver ? verifyClinicalAuthorization(authorization, caregiver) : null),
    [authorization, caregiver]
  );

  const latestZarit = zaritHistory[0];
  const latestVital = vitals[0];
  const cleanName = displayName.replace(/\s*\(Dyad\s*#[^)]+\)/i, '').trim() || displayName;
  const devices = caregiver?.assistiveDevices || DEFAULT_ASSISTIVE_DEVICES;

  if (!patientUid) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Link href={`/clinic/dyad/${patientUid}`}>
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Patient Record
          </Button>
        </Link>
        <Badge variant="outline" className="text-[10px] font-mono gap-1.5 border-blue-500/40 text-blue-700 dark:text-blue-300 bg-blue-500/5">
          <Eye className="w-3 h-3" /> Read-Only Family Preview
        </Badge>
      </div>

      <div className="p-4 rounded-2xl border border-blue-500/30 bg-blue-500/5 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2">
        <Eye className="w-4 h-4 shrink-0 mt-0.5" />
        <p>
          This is what <strong>{caregiver?.name || 'the family caregiver'}</strong> sees in their own Kutumbh Care Circle for{' '}
          <strong>{cleanName || 'this patient'}</strong> — sourced live from their account, not yours. Nothing on this page can be edited
          from here; go back to the patient record to make changes.
        </p>
      </div>

      {loading ? (
        <PanelSkeleton />
      ) : !caregiver || !patient ? (
        <Card className="rounded-3xl border-amber-500/40 bg-amber-500/5">
          <CardContent className="p-8 text-center space-y-2">
            <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto" />
            <p className="text-sm font-bold text-amber-900 dark:text-amber-300">No dyad profile documented yet</p>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              The family hasn&apos;t completed onboarding or a caregiver matrix yet, so there is nothing to preview.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Hero */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#04261a] via-[#064232] to-[#02130c] p-5 sm:p-7 text-white shadow-xl border border-emerald-700/60">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-emerald-500/20 via-transparent to-transparent pointer-events-none" />
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              <div className="flex items-start gap-4 min-w-0">
                <div className="relative h-14 w-14 rounded-2xl bg-emerald-600/30 border-2 border-emerald-400/50 flex items-center justify-center font-black text-emerald-100 text-xl shrink-0 shadow-lg">
                  {(cleanName || 'PT').split(' ').map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()}
                </div>
                <div className="min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="font-extrabold text-xl sm:text-2xl text-white tracking-tight leading-none">
                      {cleanName || patient.name}
                    </h1>
                    <Badge variant="outline" className="text-xs font-mono border-emerald-400/50 text-emerald-200 bg-emerald-500/20">
                      {patient.age} Yrs
                    </Badge>
                    {patient.isBedBound && (
                      <Badge variant="outline" className="text-xs font-mono border-amber-400/50 text-amber-300 bg-amber-500/15">
                        Bedbound Care
                      </Badge>
                    )}
                    {patient.fallHistoryLast6Months > 0 && (
                      <Badge variant="outline" className="text-xs font-mono border-red-400/50 text-red-300 bg-red-500/15">
                        {patient.fallHistoryLast6Months} Fall{patient.fallHistoryLast6Months === 1 ? '' : 's'} / 6mo
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
                    Primary Caregiver: <span className="font-bold text-white">{caregiver.name}</span> ({caregiver.kinship}) •{' '}
                    {(patient.primaryConditions || []).join(', ') || 'No conditions documented'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 shrink-0">
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-3">
                  <span className="text-[11px] font-semibold text-emerald-300/80 uppercase tracking-wider">Care Gap</span>
                  <div className="text-lg font-black text-white mt-1">
                    {evaluation ? (evaluation.netCareGapHours > 0 ? `${evaluation.netCareGapHours}h short` : 'Covered') : '—'}
                  </div>
                </div>
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-3">
                  <span className="text-[11px] font-semibold text-emerald-300/80 uppercase tracking-wider">Burden (ZBI)</span>
                  <div className="text-lg font-black text-white mt-1">
                    {latestZarit ? `${latestZarit.totalScore}/${latestZarit.maxScore}` : '—'}
                  </div>
                </div>
                <div className="col-span-2 sm:col-span-1 rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-3">
                  <span className="text-[11px] font-semibold text-emerald-300/80 uppercase tracking-wider">Plan Status</span>
                  <div className="text-sm font-black text-white mt-1">
                    {authVerdict?.planAuthorized ? 'Clinician Authorized' : authVerdict?.planStatus === 'stale' ? 'Needs Re-Review' : 'Draft / Pending'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Emergency readiness — signed values only, matching the bedside wall sheet */}
          <Card className="rounded-3xl border-red-500/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Hospital className="w-4 h-4 text-red-600" /> Emergency Readiness
              </CardTitle>
              <CardDescription className="text-xs">
                {authVerdict?.emergencyVerified
                  ? `Verified by ${authVerdict.verifiedByName || 'clinician'} on ${authVerdict.verifiedAt?.slice(0, 10)}`
                  : 'Not yet clinician-verified — the family sees this as unverified too.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
                <span className="text-[10px] font-bold uppercase text-muted-foreground">Preferred Hospital</span>
                <p className="font-semibold text-foreground mt-0.5">
                  {authVerdict?.emergencyVerified
                    ? authorization?.emergencyVerification?.snapshot.preferredHospitalName
                    : caregiver.emergencyLogistics?.preferredHospitalName || 'Not set'}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
                <span className="text-[10px] font-bold uppercase text-muted-foreground">Designated Driver</span>
                <p className="font-semibold text-foreground mt-0.5">
                  {authVerdict?.emergencyVerified
                    ? authorization?.emergencyVerification?.snapshot.designatedEmergencyDriver
                    : caregiver.emergencyLogistics?.designatedEmergencyDriver || 'Not set'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Secondary family roster */}
          <Card className="rounded-3xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Users2 className="w-4 h-4 text-primary" /> Secondary Family Roster
              </CardTitle>
              <CardDescription className="text-xs">
                Family members contributing to care, and whether they&apos;ve accepted their assignment.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {(caregiver.secondaryMembers || []).length === 0 ? (
                <p className="text-xs text-muted-foreground">No secondary family members configured — solo caregiver arrangement.</p>
              ) : (
                caregiver.secondaryMembers!.map((m) => (
                  <div key={m.id} className="p-3 rounded-xl bg-muted/30 border border-border/60 flex items-center justify-between gap-3 flex-wrap text-xs">
                    <div>
                      <span className="font-bold text-foreground">{m.name || 'Unnamed helper'}</span>
                      <span className="text-muted-foreground"> · {m.relationship.replace('_', ' ')} · {m.hoursPerDay}h/day</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {(m.assignedTasks || []).map((t) => (
                        <span key={t} className="text-[10px] bg-background border px-1.5 py-0.5 rounded font-mono">
                          {TASK_LABELS[t]?.icon} {TASK_LABELS[t]?.label || t}
                        </span>
                      ))}
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[10px] font-mono capitalize',
                          m.acceptanceStatus === 'accepted' && 'border-emerald-500/50 text-emerald-700 dark:text-emerald-300',
                          m.acceptanceStatus === 'declined' && 'border-rose-500/50 text-rose-700 dark:text-rose-300',
                          (!m.acceptanceStatus || m.acceptanceStatus === 'pending') && 'border-amber-500/50 text-amber-700 dark:text-amber-300'
                        )}
                      >
                        {m.acceptanceStatus || 'pending'}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Care circle daily tasks */}
          <Card className="rounded-3xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" /> Today&apos;s Care Circle Tasks
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {!circle || circle.tasks.length === 0 ? (
                <p className="text-xs text-muted-foreground">No care circle tasks recorded.</p>
              ) : (
                circle.tasks.map((t) => (
                  <div key={t.id} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-muted/30 border border-border/50 text-xs">
                    {t.isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
                    )}
                    <span className={cn('font-semibold', t.isCompleted && 'line-through text-muted-foreground')}>{t.title}</span>
                    <span className="text-muted-foreground">· {t.assignedToName} · {t.time}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Monthly support matrix summary (read-only) */}
          {evaluation && (
            <Card className="rounded-3xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" /> Monthly Support Matrix Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="p-2 rounded-xl bg-muted/30 border border-border/60">
                    <span className="text-[10px] text-muted-foreground block">Patient Demand</span>
                    <span className="text-sm font-black">{evaluation.patientCareDemandHours}h/day</span>
                  </div>
                  <div className="p-2 rounded-xl bg-muted/30 border border-border/60">
                    <span className="text-[10px] text-muted-foreground block">Team Absorbed</span>
                    <span className="text-sm font-black text-emerald-600">
                      {(evaluation.formalSupportAbsorbedHours + evaluation.familySupportAbsorbedHours).toFixed(1)}h/day
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-muted/30 border border-border/60">
                    <span className="text-[10px] text-muted-foreground block">Net Gap</span>
                    <span className={cn('text-sm font-black', evaluation.netCareGapHours > 0 ? 'text-red-600' : 'text-emerald-600')}>
                      {evaluation.netCareGapHours > 0 ? `${evaluation.netCareGapHours}h` : '0h'}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-muted/30 border border-border/60">
                    <span className="text-[10px] text-muted-foreground block">Manual Handling</span>
                    <span className="text-xs font-black capitalize">{evaluation.manualHandlingHazardTier}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(['morning_rush', 'afternoon', 'evening', 'night_watch'] as const).map((b) => {
                    const gap = evaluation.blockGaps[b];
                    const covered = gap.gapHours <= 0;
                    return (
                      <span
                        key={b}
                        className={cn(
                          'text-[10px] font-mono px-2 py-1 rounded-md border',
                          covered ? 'border-emerald-500/40 text-emerald-700 dark:text-emerald-300 bg-emerald-500/5' : 'border-red-500/40 text-red-700 dark:text-red-300 bg-red-500/5'
                        )}
                      >
                        {DIURNAL_BLOCK_META[b].icon} {DIURNAL_BLOCK_META[b].label}: {covered ? 'Covered' : `${gap.gapHours}h gap`}
                      </span>
                    );
                  })}
                </div>

                <div className="pt-1 border-t border-border/40 text-[11px] text-muted-foreground">
                  Devices: {[
                    devices.hospitalBed !== 'none' ? devices.hospitalBed.replace('_', ' ') : null,
                    devices.airWaterMattress ? 'ripple mattress' : null,
                    devices.wheelchair ? 'wheelchair' : null,
                    devices.transferAids ? 'transfer aids' : null
                  ].filter(Boolean).join(' • ') || 'None recorded'}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Medications */}
          <Card className="rounded-3xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Pill className="w-4 h-4 text-primary" /> Medications ({medications.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {medications.length === 0 ? (
                <p className="text-xs text-muted-foreground">No medications on file.</p>
              ) : (
                medications.map((med) => (
                  <div key={med.id} className="p-2.5 rounded-lg bg-muted/30 border border-border/50 text-xs">
                    <span className="font-bold">{med.name}</span>
                    <span className="text-muted-foreground"> · {med.dosage} · {med.frequency}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Latest vitals */}
          <Card className="rounded-3xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-primary" /> Latest Vitals
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!latestVital ? (
                <p className="text-xs text-muted-foreground">No vitals logged yet.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2 rounded-xl bg-muted/30 border border-border/60">
                    <span className="text-[10px] text-muted-foreground block">BP</span>
                    <span className="font-black">{latestVital.bp || (latestVital.systolic && latestVital.diastolic ? `${latestVital.systolic}/${latestVital.diastolic}` : '—')}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-muted/30 border border-border/60">
                    <span className="text-[10px] text-muted-foreground block">Pulse</span>
                    <span className="font-black">{latestVital.pulse || '—'}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-muted/30 border border-border/60">
                    <span className="text-[10px] text-muted-foreground block">SpO2</span>
                    <span className="font-black">{latestVital.spo2 || '—'}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-muted/30 border border-border/60">
                    <span className="text-[10px] text-muted-foreground block">Recorded</span>
                    <span className="font-black">{new Date(latestVital.date).toLocaleDateString()}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
