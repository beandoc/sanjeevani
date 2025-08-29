
'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  BrainCircuit,
  HeartPulse,
  Activity,
  User,
  ShieldAlert,
  Accessibility,
  ArrowRight,
  BookOpenCheck,
  PersonStanding,
  HeartHandshake,
  Recycle,
  Stethoscope,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useRole } from '@/context/role-context';
import type { PersonalizedPathOutput } from '@/ai/flows/personalized-learning-path';

const iconMap: { [key: string]: React.ElementType } = {
  'Dementia Care': BrainCircuit,
  'Heart Failure': HeartPulse,
  Stroke: Activity,
  'Parkinsonism Care': User,
  'Kidney Failure': ShieldAlert,
  'Bed Bound Care': Accessibility,
  'Fall Prevention': PersonStanding,
  'Palliative Care': HeartHandshake,
  'Geriatric Rehabilitation': Recycle,
  'Geriatric Depression': Stethoscope,
  'Palliative Care Professional': Users,
};

const caregiverLearningPath: PersonalizedPathOutput = {
  reasoning: '',
  suggestedModules: [
    {
      moduleId: 'fall-prevention',
      title: 'Fall Prevention',
      description: 'Learn to identify risks and create a safe environment to prevent falls, a critical skill for any caregiver.',
      estimatedDuration: 20,
      topic: 'Fall Prevention',
      focusArea: 'Safety',
    },
    {
      moduleId: 'dementia-care',
      title: 'Dementia Care Basics',
      description: 'Understand techniques for communicating with and caring for individuals with dementia.',
      estimatedDuration: 30,
      topic: 'Dementia Care',
      focusArea: 'Communication',
    },
    {
      moduleId: 'palliative-care-caregiver',
      title: 'Intro to Palliative Care',
      description: 'A compassionate guide to understanding palliative care and improving quality of life.',
      estimatedDuration: 25,
      topic: 'Palliative Care',
      focusArea: 'Comfort Care',
    },
  ],
};

const professionalLearningPath: PersonalizedPathOutput = {
  reasoning: '',
  suggestedModules: [
    {
      moduleId: 'geriatric-depression-professional',
      title: 'Geriatric Depression in Primary Care',
      description: 'A review of the detection and management of depression in older adults for primary care providers.',
      estimatedDuration: 45,
      topic: 'Geriatric Depression',
      focusArea: 'Clinical Management',
    },
    {
      moduleId: 'geriatric-rehabilitation',
      title: 'Geriatric Rehabilitation',
      description: 'Understand the interventions that help restore function and independence in older adults.',
      estimatedDuration: 35,
      topic: 'Geriatric Rehabilitation',
      focusArea: 'Functional Restoration',
    },
    {
      moduleId: 'palliative-care-professional',
      title: 'Principles of Geriatric Palliative Care',
      description: 'An evidence-based overview of geriatric palliative care principles and practice for clinicians.',
      estimatedDuration: 40,
      topic: 'Palliative Care Professional',
      focusArea: 'Advanced Care',
    },
  ],
};

const initialActiveModules = [
  { title: 'Dementia Care', progress: 0, topic: 'Dementia Care' },
  { title: 'Heart Failure Management', progress: 0, topic: 'Heart Failure' },
  { title: 'Stroke Rehabilitation', progress: 0, topic: 'Stroke' },
];

export default function DashboardClient() {
  const { role } = useRole();
  const personalizedPath = role === 'professional' ? professionalLearningPath : caregiverLearningPath;
  const [activeModules, setActiveModules] = useState(initialActiveModules);

  useEffect(() => {
    // Simulate dynamic progress by randomizing it on mount
    const randomizedModules = initialActiveModules.map(mod => ({
      ...mod,
      progress: Math.floor(Math.random() * 81) + 10, // Random progress between 10 and 90
    }));
    setActiveModules(randomizedModules);
  }, []);


  return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-headline text-2xl">Personalized Learning Path</CardTitle>
                <BookOpenCheck className="h-6 w-6 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {personalizedPath?.suggestedModules.map((module) => {
                  const Icon = iconMap[module.topic] || BookOpenCheck;
                  return (
                    <div
                      key={module.moduleId}
                      className="flex items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-secondary/50"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{module.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {module.description}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {module.estimatedDuration} min
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/modules/${module.moduleId}`}>
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  );
                })}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-headline text-2xl">Active Modules</CardTitle>
                <CardDescription>Continue where you left off.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {activeModules.map((mod) => {
                  const Icon = iconMap[mod.topic];
                  return (
                    <div key={mod.title}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
                          <span className="font-medium">{mod.title}</span>
                        </div>
                        <span className="text-muted-foreground">{mod.progress}%</span>
                      </div>
                      <Progress value={mod.progress} />
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-primary to-blue-600 text-primary-foreground">
              <CardHeader>
                <CardTitle className="font-headline text-2xl">Practice Scenarios</CardTitle>
                <CardDescription className="text-primary-foreground/80">
                  Hone your skills with real-world simulations.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="secondary" className="w-full" asChild>
                  <Link href="/simulations">
                    Start a Simulation <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
  );
}
