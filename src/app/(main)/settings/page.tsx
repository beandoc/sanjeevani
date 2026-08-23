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
import { User, Settings as SettingsIcon } from 'lucide-react';

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
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider mb-1">
          <SettingsIcon className="w-4 h-4" />
          <span>Preferences & Data Governance</span>
        </div>
        <h1 className="text-3xl font-bold font-headline">Profile & Privacy Settings</h1>
        <p className="text-muted-foreground text-sm">
          Manage your account profile, clinical focus conditions, and DPDP Act 2023 data rights.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card className="border-border shadow-sm bg-card">
          <CardHeader>
            <CardTitle className="text-lg">Caregiver Identity</CardTitle>
            <CardDescription className="text-xs">Update your local profile name.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-semibold">Name</Label>
              <Input id="name" defaultValue="Suresh Kumar" className="h-9 text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold">Contact Email</Label>
              <Input
                id="email"
                type="email"
                defaultValue="caregiver@sanjeevani.local"
                className="h-9 text-xs"
              />
            </div>
            <Button size="sm" className="font-bold text-xs">Save Profile</Button>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm bg-card">
          <CardHeader>
            <CardTitle className="text-lg">Clinical Learning Path</CardTitle>
            <CardDescription className="text-xs">
              Personalize recommendations based on your recipient&apos;s condition.
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
                    Intermediate (Some experience)
                  </SelectItem>
                  <SelectItem value="advanced" className="text-xs">
                    Advanced (Years of experience / Clinical)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="condition" className="text-xs font-semibold">Primary Care Focus</Label>
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
            <Button size="sm" className="font-bold text-xs">Update Preferences</Button>
          </CardContent>
        </Card>
      </div>

      {/* Consent Manager Section */}
      <ConsentManager mode="full" />
    </div>
  );
}
