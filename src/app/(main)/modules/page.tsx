
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
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
  Brain,
  Droplets,
  Footprints,
  Bone,
  Utensils,
  Eye,
  Smile,
  Pill,
  Shield,
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
    description:
      'Learn to identify risks and create a safe environment to prevent falls.',
    icon: PersonStanding,
  },
  {
    id: 'palliative-care-caregiver',
    title: 'Palliative Care: A Guide for Caregivers',
    description:
      'A compassionate guide to understanding and navigating palliative care for a loved one.',
    icon: HeartHandshake,
  },
  {
    id: 'benign-prostate-care',
    title: 'Urinary Problems in Men',
    description:
      'Understand common urinary issues like BPH and learn practical tips for management.',
    icon: Droplets,
  },
   {
    id: 'foot-care',
    title: 'Foot Care Essentials',
    description:
      'Learn the basics of foot care for older adults to maintain mobility and prevent complications.',
    icon: Footprints,
  },
  {
    id: 'joint-problems-caregiver',
    title: 'Understanding Joint Pain & Arthritis',
    description:
      'Learn about common joint problems like arthritis and gout and how to manage them at home.',
    icon: Bone,
  },
  {
    id: 'nutrition-caregiver',
    title: 'Nutrition and Feeding Issues',
    description:
      'Learn about malnutrition, feeding problems, and strategies to improve nutrition.',
    icon: Utensils,
  },
  {
    id: 'vision-problems-caregiver',
    title: 'Vision and Eye Problems',
    description:
      'Learn to recognize common eye issues, red flags, and when to see a doctor.',
    icon: Eye,
  },
  {
    id: 'oral-health-caregiver',
    title: 'Oral Health for Caregivers',
    description: 'Learn to manage daily oral care and identify common dental issues in older adults.',
    icon: Smile,
  },
  {
    id: 'strength-training-caregiver',
    title: 'Supporting Physical Activity',
    description: 'A caregiver\'s guide to encouraging exercise and physical fitness for older adults.',
    icon: Dumbbell,
  },
  {
    id: 'medication-management-caregiver',
    title: 'Helping Your Loved One Stay Safe with Medicines',
    description: 'Learn to manage medications safely and act as a key partner in their healthcare.',
    icon: Pill,
  }
];

const professionalModules = [
  {
    id: 'polypharmacy-professional',
    title: 'Medication Safety in Geriatric Care',
    description: 'A nurse\'s guide to identifying, preventing, and managing adverse drug events (ADEs) in older patients.',
    icon: Shield,
  },
  {
    id: 'dementia-care-professional',
    title: 'Dementia Care for Professionals',
    description:
      'An evidence-based module on the diagnosis, management, and treatment of dementia for clinicians.',
    icon: Brain,
  },
  {
    id: 'geriatric-rehabilitation',
    title: 'Geriatric Rehabilitation',
    description:
      'Understand the interventions that help restore function and independence in older adults.',
    icon: PersonStanding,
  },
  {
    id: 'strength-training',
    title: 'Prescribing Exercise for Older Adults',
    description:
      'A module for healthcare professionals on promoting and prescribing physical activity.',
    icon: Dumbbell,
  },
  {
    id: 'palliative-care-professional',
    title: 'Palliative Care for Professionals',
    description:
      'An evidence-based overview of geriatric palliative care principles and practice for clinicians.',
    icon: Users,
  },
  {
    id: 'geriatric-depression-professional',
    title: 'Geriatric Depression in Primary Care',
    description:
      'A review of the detection and management of depression in older adults for primary care providers.',
    icon: Stethoscope,
  },
  {
    id: 'benign-prostate-professional',
    title: 'Benign Prostatic Conditions',
    description:
      'A clinical review of the evaluation and management of BPH and prostatitis in older men.',
    icon: Droplets,
  },
   {
    id: 'foot-care-professional',
    title: 'Podogeriatrics: Clinical Foot Care',
    description:
      'A clinical review of common foot pathologies, assessment, and management in older adults.',
    icon: Footprints,
  },
  {
    id: 'joint-problems-professional',
    title: 'Management of Rheumatic Disorders',
    description:
      'A clinical review of OA, RA, Gout, and other common rheumatic conditions in older adults.',
    icon: Bone,
  },
  {
    id: 'nutrition-care-professional',
    title: 'Clinical Nutrition in Older Adults',
    description:
        'A review of malnutrition, screening, assessment, and management strategies for clinicians.',
    icon: Utensils,
  },
  {
    id: 'vision-problems-professional',
    title: 'Clinical Geriatric Ophthalmology',
    description:
        'A review of common age-related eye diseases, diagnosis, and management for clinicians.',
    icon: Eye,
  },
  {
    id: 'oral-health-professional',
    title: 'Geriatric Oral Health for Professionals',
    description: 'A review of oral health screening, common challenges, and interprofessional care for clinicians.',
    icon: Smile,
  }
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

      <Tabs defaultValue="caregiver" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="caregiver">For Family Caregivers</TabsTrigger>
          <TabsTrigger value="professional">For Health Professionals</TabsTrigger>
        </TabsList>
        <TabsContent value="caregiver">
          <div className="grid grid-cols-1 gap-6 pt-4 sm:grid-cols-2 lg:grid-cols-3">
            {caregiverModules.map((module) => {
              const Icon = module.icon;
              return (
                <Card key={module.id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="font-headline text-xl">
                        {module.title}
                      </CardTitle>
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
        </TabsContent>
        <TabsContent value="professional">
          <div className="grid grid-cols-1 gap-6 pt-4 sm:grid-cols-2 lg:grid-cols-3">
            {professionalModules.map((module) => {
              const Icon = module.icon;
              return (
                <Card key={module.id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                        <Icon className="h-6 w-6 text-accent" />
                      </div>
                      <CardTitle className="font-headline text-xl">
                        {module.title}
                      </CardTitle>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
