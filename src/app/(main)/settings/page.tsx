'use client';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useProfile, SkillLevel } from '@/context/role-context';
import { ConsentManager } from '@/components/privacy/consent-manager';
import { CaregiverDyadProfiler } from '@/components/profile/caregiver-dyad-profiler';
import { ShareWithClinicianCard } from '@/components/clinician/share-with-clinician-card';
import { User, Settings as SettingsIcon, HeartPulse } from 'lucide-react';

export default function SettingsPage() {
  const { 
    skillLevel, 
    setSkillLevel, 
    caregivingScenario, 
    setCaregivingScenario 
  } = useProfile();

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
    <div className="space-y-8 max-w-5xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider mb-1">
          <SettingsIcon className="w-4 h-4" />
          <span>Preferences & Data Governance</span>
        </div>
        <h1 className="text-3xl font-bold font-headline">Profile, Dyad Matrix & Privacy</h1>
        <p className="text-muted-foreground text-sm">
          Configure caregiver socio-demographics, patient Katz ADL functional dependence, and DPDP Act 2023 consent rights.
        </p>
      </div>

      {/* 1. Caregiver Dyad Profiler & Care Gap Engine */}
      <CaregiverDyadProfiler />

      {/* 2. Clinical Focus & Learning Path Preferences */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border shadow-sm bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">Clinical Learning Path</CardTitle>
            <CardDescription className="text-xs">
              Calibrate decision support and simulation difficulty.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="experience" className="text-xs font-semibold">Experience Level</Label>
              <Select 
                value={skillLevel} 
                onValueChange={(value) => setSkillLevel(value as SkillLevel)}
              >
                <SelectTrigger id="experience" className="h-9 text-xs">
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
                <SelectTrigger id="condition" className="h-9 text-xs">
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

        {/* DPDP Act Consent Manager */}
        <div className="space-y-4">
          <ConsentManager mode="full" />
        </div>
      </div>

      {/* 3. Clinician Sharing (consent-gated dyad access for the clinician dashboard) */}
      <ShareWithClinicianCard />
    </div>
  );
}
