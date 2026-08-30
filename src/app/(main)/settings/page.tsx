'use client';

import React, { useState } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useProfile, SkillLevel } from '@/context/role-context';
import { ConsentManager } from '@/components/privacy/consent-manager';
import { EmergencyContactsManager } from '@/components/profile/emergency-contacts-manager';
import { CaregiverDyadProfiler } from '@/components/profile/caregiver-dyad-profiler';
import { HomeCareAddressCard } from '@/components/profile/home-care-address-card';
import { ShareWithClinicianCard } from '@/components/clinician/share-with-clinician-card';
import {
  Settings as SettingsIcon,
  MapPin,
  Users2,
  Activity,
  ShieldCheck,
  PhoneCall,
  GraduationCap
} from 'lucide-react';

export default function SettingsPage() {
  const { 
    skillLevel, 
    setSkillLevel, 
    caregivingScenario, 
    setCaregivingScenario 
  } = useProfile();

  const [activeTab, setActiveTab] = useState<string>('address');

  const patientConditions = [
    'General Frailty',
    'Dementia',
    'Heart Failure',
    'Stroke Recovery',
    'Parkinson\'s Disease',
    'COPD',
    'Post-Surgery Recovery',
    'Multiple Chronic Conditions',
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 sm:p-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider mb-1">
            <SettingsIcon className="w-4 h-4" />
            <span>Preferences & Data Governance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-headline">Settings & Dyad Profile</h1>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Manage your patient home address, caregiver capacity, clinical decision support, and DPDP privacy rights.
          </p>
        </div>
      </div>

      {/* Modern Top Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full h-auto p-1 bg-muted/70 rounded-2xl gap-1">
          <TabsTrigger
            value="address"
            className="flex items-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold data-[state=active]:bg-background data-[state=active]:shadow-xs"
          >
            <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
            <span>Address & Emergency</span>
          </TabsTrigger>

          <TabsTrigger
            value="dyad"
            className="flex items-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold data-[state=active]:bg-background data-[state=active]:shadow-xs"
          >
            <Users2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span>Dyad Profile</span>
          </TabsTrigger>

          <TabsTrigger
            value="engine"
            className="flex items-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold data-[state=active]:bg-background data-[state=active]:shadow-xs"
          >
            <Activity className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Care Gap Engine</span>
          </TabsTrigger>

          <TabsTrigger
            value="privacy"
            className="flex items-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold data-[state=active]:bg-background data-[state=active]:shadow-xs"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span>Privacy & DPDP</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: Address, Emergency Contacts & Doctor Sharing */}
        <TabsContent value="address" className="space-y-6 m-0">
          <HomeCareAddressCard />
          <EmergencyContactsManager />
          <ShareWithClinicianCard />
        </TabsContent>

        {/* TAB 2: Caregiver Demographics & Learning Calibration */}
        <TabsContent value="dyad" className="space-y-6 m-0">
          {/* Clinical Learning Path Card */}
          <Card className="border-border shadow-xs bg-card rounded-2xl">
            <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-primary" />
                Clinical Learning Path & Simulation Calibration
              </CardTitle>
              <CardDescription className="text-xs">
                Calibrate decision support difficulty and condition focus.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="experience" className="text-xs font-semibold">Caregiver Experience Level</Label>
                <Select 
                  value={skillLevel} 
                  onValueChange={(value) => setSkillLevel(value as SkillLevel)}
                >
                  <SelectTrigger id="experience" className="h-9 text-xs rounded-xl bg-background">
                    <SelectValue placeholder="Select experience level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner" className="text-xs">
                      Beginner (New to caregiving)
                    </SelectItem>
                    <SelectItem value="intermediate" className="text-xs">
                      Intermediate (Some care experience)
                    </SelectItem>
                    <SelectItem value="advanced" className="text-xs">
                      Advanced (Years of experience / Clinical)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="condition" className="text-xs font-semibold">Primary Care Focus Profile</Label>
                <Select
                  value={caregivingScenario}
                  onValueChange={setCaregivingScenario}
                >
                  <SelectTrigger id="condition" className="h-9 text-xs rounded-xl bg-background">
                    <SelectValue placeholder="Select primary condition" />
                  </SelectTrigger>
                  <SelectContent>
                    {patientConditions.map((condition) => (
                      <SelectItem key={condition} value={condition} className="text-xs">
                        {condition}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Dyad Profile Editor */}
          <CaregiverDyadProfiler defaultTab="caregiver" />
        </TabsContent>

        {/* TAB 3: Deep Clinical Care Gap Analysis & Staffing Engine */}
        <TabsContent value="engine" className="space-y-6 m-0">
          <CaregiverDyadProfiler defaultTab="gap" />
        </TabsContent>

        {/* TAB 4: Privacy & DPDP Consent */}
        <TabsContent value="privacy" className="space-y-6 m-0">
          <ConsentManager mode="full" />
        </TabsContent>
      </Tabs>
    </div>
  );
}

