'use client';

import React, { useState } from 'react';
import { DailyBedsideRoutine } from '@/components/domiciliary/daily-bedside-routine';
import { BedsideEmergencyCards } from '@/components/domiciliary/bedside-emergency-cards';
import { DischargeOnboardingPathway } from '@/components/domiciliary/discharge-onboarding-pathway';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bed,
  AlertTriangle,
  Compass,
  HeartPulse,
  Sparkles,
  ArrowLeft,
  BookOpen,
  PhoneCall
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function DomiciliaryHubPage() {
  const [activeTab, setActiveTab] = useState<string>('routine');

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-5xl space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            <span>Sanjeevani Bedside Companion</span>
            <span>•</span>
            <span className="text-primary font-bold">Domiciliary Home Care Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <Bed className="w-8 h-8 text-primary" />
            Real-Time Domiciliary Care Companion
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl leading-relaxed">
            Real-time bedside micro-protocols, Q2H turning timers, acute situation emergency cards, and the 14-day post-discharge onboarding roadmap.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/stress-calculator">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs font-semibold">
              <HeartPulse className="w-4 h-4 text-primary" /> Burden Gauge
            </Button>
          </Link>
          <Link href="/modules">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs font-semibold">
              <BookOpen className="w-4 h-4 text-primary" /> All Modules
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-3 w-full max-w-2xl h-11 p-1 bg-muted/60">
          <TabsTrigger value="routine" className="text-xs sm:text-sm font-bold gap-1.5">
            <Bed className="w-4 h-4" />
            <span>Bedside Routine</span>
          </TabsTrigger>
          <TabsTrigger value="emergency" className="text-xs sm:text-sm font-bold gap-1.5">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            <span>Emergency Cards</span>
          </TabsTrigger>
          <TabsTrigger value="pathway" className="text-xs sm:text-sm font-bold gap-1.5">
            <Compass className="w-4 h-4 text-primary" />
            <span>14-Day Pathway</span>
          </TabsTrigger>
        </TabsList>

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
    </div>
  );
}
