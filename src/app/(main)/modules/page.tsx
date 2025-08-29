

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  BrainCircuit,
  HeartPulse,
  Activity,
  User,
  ShieldAlert,
  Accessibility,
  PersonStanding,
  Recycle,
  Dumbbell,
  HeartHandshake,
  Users,
  Stethoscope,
} from 'lucide-react';
import Link from 'next/link';

const caregiverModules = [
  {
    id: 'kidney-failure',
    title: 'Kidney Failure on Dialysis',
    description:
      'Managing patients with kidney failure, including dialysis specifics, diet, and emergency procedures.',
    icon: ShieldAlert,
  },
  {
    id: 'dementia-care',
    title: 'Dementia Care',
    description:
      'Techniques for communicating with and caring for individuals with dementia, managing symptoms and safety.',
    icon: BrainCircuit,
  },
  {
    id: 'stroke-rehab',
    title: 'Stroke Rehabilitation',
    description:
      'Principles of stroke rehab, including mobility, speech therapy, and preventing complications.',
    icon: Activity,
  },
  {
    id: 'heart-failure',
    title: 'Heart Failure Management',
    description:
      'Managing heart failure, including medication, fluid balance, and lifestyle modifications.',
    icon: HeartPulse,
  },
  {
    id: 'bed-bound-care',
    title: 'Bed Bound Patient Care',
    description:
      'Essential care for bed-bound patients: pressure ulcer prevention, hygiene, and mobility.',
    icon: Accessibility,
  },
  {
    id: 'parkinsonism-care',
    title: 'Parkinsonism Care',
    description:
      "Guidance on managing Parkinson's symptoms, including medication, mobility, and support.",
    icon: User,
  },
  {
    id: 'fall-prevention',
    title: 'Staying Steady and Safe: Fall Prevention',
    description: 'Learn to identify risks and create a safe environment to prevent falls.',
    icon: PersonStanding,
  },
  {
    id: 'palliative-care-caregiver',
    title: 'Palliative Care: A Guide for Caregivers',
    description: 'A compassionate guide to understanding and navigating palliative care for a loved one.',
    icon: HeartHandshake,
  },
];

const professionalModules = [
  {
    id: 'geriatric-rehabilitation',
    title: 'Geriatric Rehabilitation',
    description: 'Understand the interventions that help restore function and independence in older adults.',
    icon: Recycle,
  },
  {
    id: 'strength-training',
    title: 'Strength Training for Health',
    description: 'Learn the principles and benefits of strength training for older adults.',
    icon: Dumbbell,
  },
  {
    id: 'palliative-care-professional',
    title: 'Palliative Care for Professionals',
    description: 'An evidence-based overview of geriatric palliative care principles and practice for clinicians.',
    icon: Users,
  },
   {
    id: 'geriatric-depression-professional',
    title: 'Geriatric Depression in Primary Care',
    description: 'A review of the detection and management of depression in older adults for primary care providers.',
    icon: Stethoscope,
  },
];

export default function ModulesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Learning Modules</h1>
        <p className="text-muted-foreground">
          Explore our comprehensive library of caregiving topics.
        </p>
      </div>
      
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold font-headline mb-4">For Family Caregivers</h2>
           <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {caregiverModules.map((module) => {
              const Icon = module.icon;
              return (
                <Card key={module.id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="font-headline text-xl">{module.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <CardDescription>{module.description}</CardDescription>
                  </CardContent>
                  <CardFooter>
                    <Button asChild className="w-full">
                      <Link href={`/modules/${module.id}`}>
                        Start Module <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold font-headline mb-4">For Health Professionals</h2>
           <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {professionalModules.map((module) => {
              const Icon = module.icon;
              return (
                <Card key={module.id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                        <Icon className="h-6 w-6 text-accent" />
                      </div>
                      <CardTitle className="font-headline text-xl">{module.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <CardDescription>{module.description}</CardDescription>
                  </CardContent>
                  <CardFooter>
                    <Button asChild className="w-full">
                      <Link href={`/modules/${module.id}`}>
                        Start Module <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
