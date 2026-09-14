'use client';

import React, { useState } from 'react';
import { DailyBedsideRoutine } from '@/components/domiciliary/daily-bedside-routine';
import { BedsideEmergencyCards } from '@/components/domiciliary/bedside-emergency-cards';
import { DischargeOnboardingPathway } from '@/components/domiciliary/discharge-onboarding-pathway';
import { HomeReadinessSafetyGate } from '@/components/discharge/home-readiness-safety-gate';
import { First72HoursCommandCenter } from '@/components/discharge/first-72h-command-center';
import { ActiveDutyRoster } from '@/components/caregiver/active-duty-roster';
import { CaregiverDailyPulseModal } from '@/components/caregiver/caregiver-daily-pulse-modal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bed,
  AlertTriangle,
  Compass,
  HeartPulse,
  BookOpen,
  LayoutDashboard,
  Home,
  Clock,
  Users
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function DomiciliaryHubPage() {
  const [activeTab, setActiveTab] = useState<string>('home_gate');
  const [pulseModalOpen, setPulseModalOpen] = useState<boolean>(false);

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-5xl space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            <span>Sanjeevani Discharge-to-Home OS</span>
            <span>•</span>
            <span className="text-primary font-bold">Post-Acute Command Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <Bed className="w-8 h-8 text-primary" />
            Home Transition & Caregiver Resilience OS
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl leading-relaxed">
            Safety-gated discharge transition, first 72-hour execution milestones, role-scoped duty roster, and proactive caregiver resilience tracking.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            onClick={() => setPulseModalOpen(true)}
            className="gap-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
          >
            <HeartPulse className="w-4 h-4" /> Caregiver Pulse (60s)
          </Button>
          <Link href="/dashboard">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs font-bold shadow-xs">
              <LayoutDashboard className="w-4 h-4 text-emerald-600" /> Shift Dashboard
            </Button>
          </Link>
          <Link href="/modules">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs font-semibold">
              <BookOpen className="w-4 h-4 text-primary" /> Care Modules
            </Button>
          </Link>
        </div>
      </div>

      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="w-full overflow-x-auto no-scrollbar pb-1">
          <TabsList className="inline-flex w-max sm:w-full sm:grid sm:grid-cols-6 max-w-4xl min-h-[44px] h-auto p-1 bg-muted/60 rounded-xl border border-border/50">
            <TabsTrigger value="home_gate" className="text-xs font-bold gap-1.5 py-2 px-2.5 shrink-0 min-h-[36px]">
              <Home className="w-3.5 h-3.5 text-primary" />
              <span>Safety Gate</span>
            </TabsTrigger>
            <TabsTrigger value="first_72h" className="text-xs font-bold gap-1.5 py-2 px-2.5 shrink-0 min-h-[36px]">
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              <span>First 72 Hours</span>
            </TabsTrigger>
            <TabsTrigger value="roster" className="text-xs font-bold gap-1.5 py-2 px-2.5 shrink-0 min-h-[36px]">
              <Users className="w-3.5 h-3.5 text-indigo-500" />
              <span>Duty Roster</span>
            </TabsTrigger>
            <TabsTrigger value="routine" className="text-xs font-bold gap-1.5 py-2 px-2.5 shrink-0 min-h-[36px]">
              <Bed className="w-3.5 h-3.5 text-emerald-500" />
              <span>Bedside Routine</span>
            </TabsTrigger>
            <TabsTrigger value="emergency" className="text-xs font-bold gap-1.5 py-2 px-2.5 shrink-0 min-h-[36px]">
              <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
              <span>Emergency Cards</span>
            </TabsTrigger>
            <TabsTrigger value="pathway" className="text-xs font-bold gap-1.5 py-2 px-2.5 shrink-0 min-h-[36px]">
              <Compass className="w-3.5 h-3.5 text-purple-500" />
              <span>14-Day Pathway</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="home_gate" className="space-y-4 outline-none">
          <HomeReadinessSafetyGate />
        </TabsContent>

        <TabsContent value="first_72h" className="space-y-4 outline-none">
          <First72HoursCommandCenter />
        </TabsContent>

        <TabsContent value="roster" className="space-y-4 outline-none">
          <ActiveDutyRoster />
        </TabsContent>

        <TabsContent value="routine" className="space-y-4 outline-none">
          <DailyBedsideRoutine />
        </TabsContent>

        <TabsContent value="emergency" className="space-y-4 outline-none">
          <BedsideEmergencyCards />
        </TabsContent>

        <TabsContent value="pathway" className="space-y-4 outline-none">
          <DischargeOnboardingPathway />
        </TabsContent>
      </Tabs>

      {/* Caregiver Daily Pulse Modal */}
      <CaregiverDailyPulseModal
        open={pulseModalOpen}
        onOpenChange={setPulseModalOpen}
        caregiverName="Ramesh Kumar"
        patientName="Smt. Savitri Sharma"
      />
    </div>
  );
}

