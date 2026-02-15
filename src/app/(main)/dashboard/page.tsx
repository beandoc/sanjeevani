
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

import { useTranslations } from 'next-intl';

export default function DashboardPage() {
  const { role } = useProfile();
  const t = useTranslations('Dashboard');
  const welcomeTitle = role === 'professional' ? t('welcomeNurse') : t('welcomeCaregiver');

  return (
    <div className="space-y-10 pb-10">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-slate-900 px-8 py-12 text-white shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-slate-900/10 to-transparent animate-gradient" />
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative z-10 max-w-2xl space-y-4">
          <h1 className="font-headline text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
            {welcomeTitle}
          </h1>
          <p className="text-lg text-slate-300 md:text-xl">
            Empower yourself with advanced training and simulations to provide the best care possible.
          </p>
          <div className="flex flex-wrap gap-4 pt-4">
            <div className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur-md border border-white/10">
              ✨ {t('advancedCertification')}
            </div>
            <div className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur-md border border-white/10">
              📊 {t('courseCompletion')}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="container mx-auto px-0">
        <DashboardClient />
      </div>
    </div>
  );
}
