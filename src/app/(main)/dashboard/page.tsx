'use client';

import { useState, useEffect } from 'react';
import DashboardClient from './dashboard-client';
import { useProfile } from '@/context/role-context';
import { auth } from '@/lib/firebase/client';
import { HealthRepository } from '@/lib/db/health-repository';
import { Shield, Sparkles, HeartPulse, Stethoscope } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { role, caregivingScenario } = useProfile();
  const [caregiverName, setCaregiverName] = useState<string>('');
  const [patientName, setPatientName] = useState<string>('');

  useEffect(() => {
    const updateNames = () => {
      const cg = HealthRepository.getCaregiverAttributes();
      const pt = HealthRepository.getPatientProfile();

      if (cg?.name && !cg.name.includes('(You)') && cg.name !== 'Suresh Kumar') {
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
        setPatientName(pt.name);
      }
    };

    updateNames();
    const unsub = auth?.onAuthStateChanged(() => updateNames());
    const interval = setInterval(updateNames, 1500);
    return () => {
      unsub?.();
      clearInterval(interval);
    };
  }, []);

  const welcomeTitle =
    role === 'doctor' || role === 'professional'
      ? 'Welcome, Dr. Vivek!'
      : role === 'nurse'
      ? patientName && patientName !== 'Smt. Sarojini Devi'
        ? `Nurse Portal • ${patientName}'s Care`
        : 'Welcome, Nursing Officer!'
      : caregiverName
      ? `Welcome, ${caregiverName}!`
      : 'Welcome, Family Caregiver!';

  const isDoctor = role === 'doctor' || role === 'professional';
  const isNurse = role === 'nurse';

  const themeConfig = isDoctor
    ? {
        border: 'border-blue-800/60 shadow-blue-950/50',
        bgGradient: 'from-[#07152b] via-[#0e2c56]/90 to-[#020617]',
        glow1: 'bg-blue-600/30',
        glow2: 'bg-cyan-500/20',
        badgeBg: 'bg-blue-500/20 text-blue-200 border-blue-400/40',
        badgeLabel: `Clinical Cohort Surveillance • ${caregivingScenario}`,
        accentColor: 'text-blue-300'
      }
    : isNurse
    ? {
        border: 'border-rose-900/60 shadow-rose-950/50',
        bgGradient: 'from-[#3b0817] via-[#5c0b24]/90 to-[#120207]',
        glow1: 'bg-rose-600/35',
        glow2: 'bg-red-500/20',
        badgeBg: 'bg-rose-500/20 text-rose-200 border-rose-400/40',
        badgeLabel: 'Bedside MAR & Attendant Portal • Shift Active',
        accentColor: 'text-rose-300'
      }
    : {
        border: 'border-emerald-800/60 shadow-emerald-950/50',
        bgGradient: 'from-[#042418] via-[#064e3b]/85 to-[#020d08]',
        glow1: 'bg-emerald-600/30',
        glow2: 'bg-teal-500/20',
        badgeBg: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40',
        badgeLabel: `Family Caregiver Support • ${caregivingScenario}`,
        accentColor: 'text-emerald-300'
      };

  return (
    <div className="space-y-6 sm:space-y-8 pb-10">
      {/* Dynamic Hero Section - Role-Specific Themed */}
      <section className={`relative overflow-hidden rounded-3xl bg-slate-950 px-5 py-8 sm:px-8 sm:py-10 md:px-12 md:py-12 text-white shadow-xl border ${themeConfig.border}`}>
        <div className={`absolute inset-0 bg-gradient-to-br ${themeConfig.bgGradient} animate-gradient`} />
        <div className={`absolute -right-16 -top-16 h-64 w-64 rounded-full ${themeConfig.glow1} blur-3xl pointer-events-none`} />
        <div className={`absolute -bottom-16 -left-16 h-64 w-64 rounded-full ${themeConfig.glow2} blur-3xl pointer-events-none`} />

        <div className="relative z-10 max-w-3xl space-y-3 sm:space-y-4">
          <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-md border ${themeConfig.badgeBg}`}>
            <Sparkles className="w-3.5 h-3.5" />
            <span>{themeConfig.badgeLabel}</span>
          </div>

          <h1 className="font-headline text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
            {welcomeTitle}
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-slate-300 leading-relaxed max-w-2xl">
            {role === 'nurse' && patientName && patientName !== 'Smt. Sarojini Devi' ? (
              <>
                Bedside shift tasks, vitals tracking, and medication administration (MAR) for{' '}
                <span className="font-bold text-white">{patientName}</span>.
              </>
            ) : role === 'caregiver' && patientName && patientName !== 'Smt. Sarojini Devi' ? (
              <>
                Caring for <span className="font-bold text-white">{patientName}</span> • Your daily care plan, medicine reminders, and vitals in one place.
              </>
            ) : isDoctor ? (
              'Comprehensive longitudinal geriatric cohort management, acute care gaps, and dyad risk surveillance.'
            ) : (
              'Your daily care plan, medicine reminders, vitals, and doctor-ready notes in one place.'
            )}
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-3">
            {isNurse ? (
              <>
                <Link
                  href="/medications"
                  title="Shift Medication Administration Record"
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/20 px-3.5 py-1.5 text-xs font-medium backdrop-blur-md border border-white/15 transition-colors focus-visible:ring-2 focus-visible:ring-rose-500"
                >
                  <Shield className="w-3.5 h-3.5 text-rose-400" aria-hidden="true" />
                  <span>MAR / Meds</span>
                </Link>
                <Link
                  href="/domiciliary"
                  title="Bedside Companion & Q2H Clock"
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/20 px-3.5 py-1.5 text-xs font-medium backdrop-blur-md border border-white/15 transition-colors focus-visible:ring-2 focus-visible:ring-rose-500"
                >
                  <HeartPulse className="w-3.5 h-3.5 text-rose-400" aria-hidden="true" />
                  <span>Bedside Companion</span>
                </Link>
                <Link
                  href="/vital-logs"
                  title="Patient Vitals Trajectory"
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/20 px-3.5 py-1.5 text-xs font-medium backdrop-blur-md border border-white/15 transition-colors focus-visible:ring-2 focus-visible:ring-rose-500"
                >
                  <Stethoscope className="w-3.5 h-3.5 text-rose-400" aria-hidden="true" />
                  <span>Vitals History</span>
                </Link>
              </>
            ) : isDoctor ? (
              <>
                <Link
                  href="/clinic/roster"
                  title="Clinical Cohort Roster"
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/20 px-3.5 py-1.5 text-xs font-medium backdrop-blur-md border border-white/15 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <Stethoscope className="w-3.5 h-3.5 text-blue-400" aria-hidden="true" />
                  <span>Cohort Roster</span>
                </Link>
                <Link
                  href="/clinic/trajectory"
                  title="Scissors Trajectory Analytics"
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/20 px-3.5 py-1.5 text-xs font-medium backdrop-blur-md border border-white/15 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <HeartPulse className="w-3.5 h-3.5 text-blue-400" aria-hidden="true" />
                  <span>Scissors Trajectory</span>
                </Link>
                <Link
                  href="/simulations"
                  title="Clinical Simulations"
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/20 px-3.5 py-1.5 text-xs font-medium backdrop-blur-md border border-white/15 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <Shield className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />
                  <span>Case Simulations</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/stress-calculator"
                  title="Zarit Burden Interview (ZBI-22) — Assess caregiver fatigue and burnout risk"
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/20 px-3.5 py-1.5 text-xs font-medium backdrop-blur-md border border-white/15 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  <HeartPulse className="w-3.5 h-3.5 text-rose-400" aria-hidden="true" />
                  <span>Stress Check</span>
                </Link>
                <Link
                  href="/medications"
                  title="Geriatric Medication Regimen & Beers Criteria Safety Warnings"
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/20 px-3.5 py-1.5 text-xs font-medium backdrop-blur-md border border-white/15 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  <Shield className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                  <span>Medicines</span>
                </Link>
                <Link
                  href="/domiciliary"
                  title="Bedside Companion"
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/20 px-3.5 py-1.5 text-xs font-medium backdrop-blur-md border border-white/15 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  <Stethoscope className="w-3.5 h-3.5 text-teal-400" aria-hidden="true" />
                  <span>Bedside Care</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="w-full">
        <DashboardClient />
      </div>
    </div>
  );
}
