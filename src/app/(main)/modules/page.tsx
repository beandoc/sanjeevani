
'use client';

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
  ShieldAlert,
} from 'lucide-react';
import Link from 'next/link';
import { useProfile } from '@/context/role-context';
import { caregiverModules, professionalModules, iconMap } from '@/lib/modules';

type Module = {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  category: string;
};

const ModuleCard = ({ module }: { module: Module }) => {
  const Icon = module.icon || ShieldAlert; // Fallback icon to prevent crashes
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
};

const CompetencySection = ({ title, description, modules }: { title: string, description: string, modules: Module[] }) => {
  if (modules.length === 0) return null;

  return (
    <div className="space-y-4 py-4">
      <div>
        <h2 className="text-2xl font-semibold font-headline">{title}</h2>
        <p className="text-muted-foreground">{description}</p>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((module) => (
          <ModuleCard key={module.id} module={module} />
        ))}
      </div>
    </div>
  );
}

const ModulesView = ({ modules, role }: { modules: Module[], role: 'caregiver' | 'professional' }) => {
  const { caregivingScenario } = useProfile();

  const getCategorizedModules = () => {
    const coreCompetencies = ['Medication Safety', 'Fall Prevention', 'Nutrition', 'Exercise', 'Constipation', 'Oral Health', 'Bed Bound Care'];
    
    // Map the selected scenario to module categories
    const scenarioCategoryMap: { [key: string]: string[] } = {
        'Dementia': ['Alzheimer\'s Disease', 'Delirium'],
        'Heart Failure': ['Heart Disease', 'Hypertension'],
        'Stroke Recovery': ['Stroke'],
        'Parkinson\'s Disease': ['Parkinsonism Care'],
        'General Frailty': [], 
        'COPD': ['Pneumonia'],
        'Post-Surgery Recovery': ['Geriatric Rehabilitation'],
        'Multiple Chronic Conditions': ['Heart Disease', 'Hypertension', 'Pneumonia', 'Joint Problems'],
    };

    const recommendedCategories = scenarioCategoryMap[caregivingScenario] || [];

    const core = modules.filter(m => coreCompetencies.includes(m.category));
    const shouldKnow = modules.filter(m => recommendedCategories.includes(m.category) && !coreCompetencies.includes(m.category));
    const couldKnow = modules.filter(m => !coreCompetencies.includes(m.category) && !recommendedCategories.includes(m.category));

    return { core, shouldKnow, couldKnow };
  };

  const { core, shouldKnow, couldKnow } = getCategorizedModules();

  const recommendedDescription = role === 'caregiver'
    ? `Based on your selected profile need for "${caregivingScenario}", we recommend these modules.`
    : `Modules relevant to the selected patient scenario: "${caregivingScenario}".`;


  return (
    <div className="space-y-8">
        <CompetencySection 
            title="The Basics right"
            description="These foundational modules to professionals"
            modules={core}
        />
        <CompetencySection 
            title="Recommended For You (Should Know)"
            description={recommendedDescription}
            modules={shouldKnow}
        />
        <CompetencySection 
            title="Explore Other Topics (Could Know)"
            description="Broaden your knowledge with these specialized modules."
            modules={couldKnow}
        />
    </div>
  );
};


export default function ModulesPage() {
  const { role } = useProfile();

  const getModulesForRole = (role: 'caregiver' | 'professional') => {
    const source = role === 'caregiver' ? caregiverModules : professionalModules;
    return source.map(m => ({ ...m, icon: iconMap[m.category] }));
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Learning Modules</h1>
        <p className="text-muted-foreground">
          A guided curriculum based on core competencies and personalized recommendations.
        </p>
      </div>

      <Tabs defaultValue={role} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="caregiver">For Family Caregivers</TabsTrigger>
          <TabsTrigger value="professional">For Health Professionals</TabsTrigger>
        </TabsList>
        <TabsContent value="caregiver" className="pt-4">
          <ModulesView modules={getModulesForRole('caregiver')} role="caregiver" />
        </TabsContent>
        <TabsContent value="professional" className="pt-4">
          <ModulesView modules={getModulesForRole('professional')} role="professional" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
