'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import DashboardClient from './dashboard-client';
import { useProfile } from '@/context/role-context';
import { Shield, Sparkles, HeartPulse, Stethoscope, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { role, caregivingScenario } = useProfile();
  const welcomeTitle =
    role === 'doctor' || role === 'professional'
      ? 'Welcome, Dr. Vivek!'
      : role === 'nurse'
      ? 'Welcome, Nurse Sister Anjali!'
      : 'Welcome, Suresh Kumar!';

  return (
    <div className="space-y-6 sm:space-y-8 pb-10">
      {/* Dynamic Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-slate-950 px-5 py-8 sm:px-8 sm:py-10 md:px-12 md:py-12 text-white shadow-xl border border-slate-800">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/25 via-blue-900/20 to-transparent animate-gradient" />
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-3 sm:space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold text-primary-foreground backdrop-blur-md border border-primary/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Geriatric Decision Support • {caregivingScenario}</span>
          </div>

          <h1 className="font-headline text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
            {welcomeTitle}
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-slate-300 leading-relaxed max-w-2xl">
            Your daily care plan, medicine reminders, vitals, and doctor-ready notes in one place.
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-3">
            <Link
              href="/stress-calculator"
              title="Zarit Burden Interview (ZBI-22) — Assess caregiver fatigue and burnout risk"
              aria-label="Check caregiver stress"
              className="inline-flex items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/20 px-3.5 py-1.5 text-xs font-medium backdrop-blur-md border border-white/15 transition-colors focus-visible:ring-2 focus-visible:ring-primary"
            >
              <HeartPulse className="w-3.5 h-3.5 text-rose-400" aria-hidden="true" />
              <span>Stress Check</span>
            </Link>
            <Link
              href="/medications"
              title="Geriatric Medication Regimen & Beers Criteria Safety Warnings"
              aria-label="Open medicine reminders"
              className="inline-flex items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/20 px-3.5 py-1.5 text-xs font-medium backdrop-blur-md border border-white/15 transition-colors focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Shield className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
              <span>Medicines</span>
            </Link>
            <Link
              href="/simulations"
              title="21 Interactive Clinical & Home-care Emergency Simulations"
              aria-label="Open practice cases"
              className="inline-flex items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/20 px-3.5 py-1.5 text-xs font-medium backdrop-blur-md border border-white/15 transition-colors focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Stethoscope className="w-3.5 h-3.5 text-blue-400" aria-hidden="true" />
              <span>Practice Cases</span>
            </Link>
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
