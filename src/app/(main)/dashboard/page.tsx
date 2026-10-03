'use client';

import { useState, useEffect } from 'react';
import DashboardClient from './dashboard-client';
import { useProfile } from '@/context/role-context';
import { auth } from '@/lib/firebase/client';
import { HealthRepository } from '@/lib/db/health-repository';
import type { PatientDependenceProfile } from '@/lib/clinical/care-gap-engine';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, Sparkles, HeartPulse, Bed, Activity } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { role, caregivingScenario } = useProfile();
  const [caregiverName, setCaregiverName] = useState<string>('');
  const [patientName, setPatientName] = useState<string>('');
  const [patientProfile, setPatientProfile] = useState<PatientDependenceProfile | null>(null);
  const [medicationCount, setMedicationCount] = useState<number>(0);
  const [latestZaritScore, setLatestZaritScore] = useState<number | null>(null);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    const updateNames = () => {
      const cg = HealthRepository.getCaregiverAttributes();
      const pt = HealthRepository.getPatientProfile();
      setPatientProfile(pt);
      setMedicationCount(HealthRepository.getMedications().length);
      const zbi = HealthRepository.getLatestZaritScore();
      setLatestZaritScore(zbi ? zbi.totalScore : null);

      if (cg?.name && !cg.name.includes('(You)') && cg.name !== 'Primary Caregiver') {
        setCaregiverName(cg.name);
      } else if (auth?.currentUser?.displayName) {
        setCaregiverName(auth.currentUser.displayName);
      } else if (auth?.currentUser?.email?.includes('caregiver')) {
        const prefix = auth.currentUser.email.split('@')[0].replace('caregiver', '');
        if (prefix) {
          setCaregiverName(prefix.charAt(0).toUpperCase() + prefix.slice(1));
        }
      } else if (cg?.name) {
        setCaregiverName(cg.name.replace(' (You)', ''));
      }

      if (pt?.name) {
        setPatientName(pt.name.replace(/\s*\(\d+\s*yrs?\)/gi, '').trim());
      }
    };

    updateNames();
    const unsub = auth?.onAuthStateChanged(() => updateNames());
    return () => {
      unsub?.();
    };
  }, []);

  const isNurse = role === 'nurse';

  return (
    <div className="space-y-6 sm:space-y-8 pb-10">
      {/* Role-Specific Hero / Patient HUD Sections */}
      {isNurse ? (
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#2c0814] via-[#3d0b1d] to-[#120207] p-4 sm:p-5 text-white shadow-xl border border-rose-900/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-rose-500/15 via-transparent to-transparent pointer-events-none" />
          <div className="relative z-10 flex items-center gap-3.5 min-w-0">
            <div className="relative h-12 w-12 rounded-xl bg-rose-600/25 border border-rose-500/50 flex items-center justify-center font-black text-rose-200 text-lg shrink-0 shadow-inner">
              {((mounted && patientName) || 'CR').split(' ').map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()}
            </div>
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-base sm:text-xl text-white tracking-tight capitalize" suppressHydrationWarning>
                  {mounted && patientName ? patientName : 'Care Recipient'}
                </span>
                {patientProfile?.age ? (
                  <Badge variant="outline" className="text-[10px] font-mono border-rose-400/50 text-rose-200 bg-rose-500/20">
                    {patientProfile.age} Yrs
                  </Badge>
                ) : null}
                {patientProfile?.isBedBound ? (
                  <Badge variant="outline" className="text-[10px] font-mono border-amber-500/50 text-amber-300 bg-amber-500/15">
                    Bedbound
                  </Badge>
                ) : null}
                {patientProfile?.fallHistoryLast6Months && patientProfile.fallHistoryLast6Months > 0 ? (
                  <Badge variant="outline" className="text-[10px] font-mono border-red-500/50 text-red-300 bg-red-500/15">
                    Fall Risk ({patientProfile.fallHistoryLast6Months} / 6mo)
                  </Badge>
                ) : null}
              </div>
              <p className="text-xs text-rose-200/80 line-clamp-2 sm:line-clamp-1 leading-snug">
                Nurse Station · Primary Conditions: {patientProfile?.primaryConditions?.length ? patientProfile.primaryConditions.join(', ') : 'Clinical Assessment Pending'}
              </p>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-2 shrink-0 flex-wrap">
            <Link href="/domiciliary">
              <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs font-bold border-rose-500/40 text-rose-200 hover:bg-rose-500/20 bg-rose-950/40">
                <Bed className="w-3.5 h-3.5 text-rose-400" />
                <span>Bedside Companion</span>
              </Button>
            </Link>
            <Link href="/vital-logs">
              <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs font-bold border-rose-500/40 text-rose-200 hover:bg-rose-500/20 bg-rose-950/40">
                <Activity className="w-3.5 h-3.5 text-rose-400" />
                <span>Vitals History</span>
              </Button>
            </Link>
          </div>
        </section>
      ) : role === 'caregiver' ? (
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#04261a] via-[#064232] to-[#02130c] p-5 sm:p-7 md:p-8 text-white shadow-xl border border-emerald-700/60 transition-all">
          {/* Subtle atmospheric ambient glow */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-emerald-500/20 via-transparent to-transparent pointer-events-none" />
          <div className="absolute -right-20 -bottom-20 h-72 w-72 rounded-full bg-emerald-600/15 blur-3xl pointer-events-none" />
          <div className="absolute -left-12 -top-12 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col gap-5 sm:gap-6">
            {/* Top Bar: Portal Brand + Live Cloud Sync + Quick Navigation */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-500/20">
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-md bg-emerald-500/20 text-emerald-200 border border-emerald-400/40 shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Kutumbh Caregiver Hub • {caregivingScenario}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-emerald-950/60 border border-emerald-500/40 text-emerald-300">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                  </span>
                  <span>Live Dyad Cloud Sync</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <Link href="/domiciliary">
                  <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs font-bold border-emerald-500/40 text-emerald-100 hover:bg-emerald-500/20 bg-emerald-950/50 shadow-xs">
                    <Bed className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Bedside Routine</span>
                  </Button>
                </Link>
                <Link href="/medications">
                  <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs font-bold border-emerald-500/40 text-emerald-100 hover:bg-emerald-500/20 bg-emerald-950/50 shadow-xs">
                    <Shield className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Medicines</span>
                  </Button>
                </Link>
                <Link href="/stress-calculator">
                  <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs font-bold border-emerald-500/40 text-emerald-100 hover:bg-emerald-500/20 bg-emerald-950/50 shadow-xs">
                    <HeartPulse className="w-3.5 h-3.5 text-rose-300" />
                    <span>Stress Check</span>
                  </Button>
                </Link>
              </div>
            </div>

            {/* Dyad Profile Info & Real-Time Telemetry Snapshot */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              {/* Left Side: Avatar + Names + Conditions */}
              <div className="flex items-start gap-4 min-w-0">
                <div className="relative h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-emerald-600/30 border-2 border-emerald-400/50 flex items-center justify-center font-black text-emerald-100 text-xl sm:text-2xl shrink-0 shadow-lg ring-4 ring-emerald-500/15">
                  {((mounted && patientName) || 'CR').split(' ').map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()}
                </div>
                <div className="min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="font-extrabold text-xl sm:text-2xl md:text-3xl text-white tracking-tight leading-none capitalize" suppressHydrationWarning>
                      {mounted && patientName ? patientName : 'Care Recipient'}
                    </h1>
                    {patientProfile?.age ? (
                      <Badge variant="outline" className="text-xs font-mono border-emerald-400/50 text-emerald-200 bg-emerald-500/20">
                        {patientProfile.age} Yrs
                      </Badge>
                    ) : null}
                    {patientProfile?.isBedBound ? (
                      <Badge variant="outline" className="text-xs font-mono border-amber-400/50 text-amber-300 bg-amber-500/15">
                        Bedbound Care
                      </Badge>
                    ) : null}
                    {patientProfile?.fallHistoryLast6Months && patientProfile.fallHistoryLast6Months > 0 ? (
                      <Badge variant="outline" className="text-xs font-mono border-red-400/50 text-red-300 bg-red-500/15">
                        High Fall Risk
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
                    Primary Caregiver: <span className="font-bold text-white capitalize" suppressHydrationWarning>{mounted && caregiverName ? caregiverName : 'Family Caregiver'}</span>
                    {patientProfile?.primaryConditions && patientProfile.primaryConditions.length > 0 ? (
                      <> • Diagnoses: <span className="text-emerald-200 font-medium">{patientProfile.primaryConditions.join(', ')}</span></>
                    ) : null}
                  </p>
                  <div className="flex items-center gap-2 pt-0.5 text-xs text-emerald-200/80">
                    <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Active Dyad Protocol: Longitudinal Care Surveillance</span>
                  </div>
                </div>
              </div>

              {/* Right Side: Micro-Telemetry Status Chips */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 shrink-0">
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-3 flex flex-col justify-between">
                  <span className="text-[11px] font-semibold text-emerald-300/80 uppercase tracking-wider">MAR Schedule</span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-lg font-black text-white">{medicationCount}</span>
                    <span className="text-[11px] text-emerald-300 font-medium">Active</span>
                  </div>
                  <span className="text-[10px] text-emerald-200/70 truncate mt-0.5">
                    {medicationCount > 0 ? 'Prescribed Regimen' : 'No Active Meds'}
                  </span>
                </div>

                <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-3 flex flex-col justify-between">
                  <span className="text-[11px] font-semibold text-emerald-300/80 uppercase tracking-wider">Burden Score</span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-lg font-black text-white">{latestZaritScore !== null ? `${latestZaritScore}` : '—'}</span>
                    <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-1 py-0.2 rounded">
                      {latestZaritScore !== null ? 'Validated' : 'Intake Needed'}
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-200/70 truncate mt-0.5">
                    {latestZaritScore !== null ? 'ZBI Assessed' : 'Burden Evaluation'}
                  </span>
                </div>

                <div className="col-span-2 sm:col-span-1 rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-3 flex flex-col justify-between">
                  <span className="text-[11px] font-semibold text-emerald-300/80 uppercase tracking-wider">Bedside Routine</span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-lg font-black text-white">
                      {patientProfile?.isBedBound ? '2h Turn' : 'Active'}
                    </span>
                    <span className="text-[11px] text-emerald-300 font-medium">
                      {patientProfile?.isBedBound ? 'Timer' : 'Ambulatory'}
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-200/70 truncate mt-0.5">
                    {patientProfile?.isBedBound ? 'Ulcer Prevention' : 'Daily Monitoring'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* Main Content Area */}
      <div className="w-full">
        <DashboardClient />
      </div>
    </div>
  );
}
