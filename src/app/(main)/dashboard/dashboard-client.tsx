
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
  Eye,
  Bone,
  Droplets,
  Utensils,
  Pill,
  Smile,
  Dumbbell,
  Siren,
  Brain,
} from 'lucide-react';
import Link from 'next/link';
import { useProfile } from '@/context/role-context';
import type { PersonalizedPathOutput } from '@/ai/flows/personalized-learning-path';
import { allModules } from '@/lib/modules';
import { EmergencyContactCard } from '@/components/cards/emergency-contact-card';


const iconMap: { [key: string]: React.ElementType } = {
  'Dementia Care': BrainCircuit,
  'Heart Failure': HeartPulse,
  'Stroke': Activity,
  'Parkinsonism Care': User,
  'Bed Bound Care': Accessibility,
  'Fall Prevention': PersonStanding,
  'Palliative Care': HeartHandshake,
  'Geriatric Rehabilitation': Recycle,
  'Geriatric Depression': Stethoscope,
  'Palliative Care Professional': Users,
  'Dementia': BrainCircuit,
  'Vision Problems': Eye,
  'Joint Problems': Bone,
  'Urinary Problems': Droplets,
  'Nutrition': Utensils,
  'Alzheimer\'s Disease': BrainCircuit,
  'Heart Disease': HeartPulse,
  'Delirium': Brain,
  'Hypertension': HeartPulse,
  'Medication Safety': Pill,
  'Oral Health': Smile,
  'Exercise': Dumbbell,
  'Constipation': Utensils,
  'Pneumonia': Siren,
};

// Function to shuffle an array
const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};


const getDynamicPersonalizedPath = (
  skillLevel: string,
  caregivingScenario: string
): PersonalizedPathOutput => {
  // Shuffle the array of all modules
  const shuffledModules = shuffleArray(allModules);
  
  // Take the first 3 modules from the shuffled list
  const suggestedModules = shuffledModules.slice(0, 3);
  
  // Add the missing `focusArea` property to each module
  const modulesWithFocusArea = suggestedModules.map(module => ({
    ...module,
    focusArea: caregivingScenario // You might want to make this more dynamic later
  }));

  return {
    suggestedModules: modulesWithFocusArea,
    reasoning: `Based on your profile, we've selected these modules for you to explore. They change periodically!`
  };
};


const initialActiveModules = [
  { id: 1, title: 'Delirium Care', progress: 0, topic: 'Delirium' },
  { id: 2, title: 'Heart Failure Management', progress: 0, topic: 'Heart Failure' },
  { id: 3, title: 'Stroke Rehabilitation', progress: 0, topic: 'Stroke' },
];

export default function DashboardClient() {
  const { role, skillLevel, caregivingScenario } = useProfile();
  const [personalizedPath, setPersonalizedPath] = useState<PersonalizedPathOutput | null>(null);
  const [activeModules, setActiveModules] = useState(initialActiveModules);

  useEffect(() => {
    // Simulate dynamic progress by randomizing it on mount
    const randomizedModules = initialActiveModules.map(mod => ({
      ...mod,
      progress: Math.floor(Math.random() * 81) + 10, // Random progress between 10 and 90
    }));
    setActiveModules(randomizedModules);
  }, []);

  useEffect(() => {
    const path = getDynamicPersonalizedPath(skillLevel, caregivingScenario);
    setPersonalizedPath(path);
  }, [skillLevel, caregivingScenario, role]);


  return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-headline text-2xl">Personalized Learning Path</CardTitle>
                <BookOpenCheck className="h-6 w-6 text-muted-foreground" />
              </div>
               <CardDescription>
                {personalizedPath?.reasoning}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!personalizedPath?.suggestedModules.length && (
                 <div className="flex items-center justify-center py-10">
                   <p className="text-muted-foreground">Select your learning profile in settings to see personalized modules.</p>
                 </div>
              )}

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
            <EmergencyContactCard />

            <Card>
              <CardHeader>
                <CardTitle className="font-headline text-2xl">Active Modules</CardTitle>
                <CardDescription>Continue where you left off.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {activeModules.map((mod) => {
                  const Icon = iconMap[mod.topic] || BookOpenCheck;
                  return (
                    <div key={`${mod.id}-${mod.title}`}>
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
