
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import DashboardClient from './dashboard-client';
import { generatePersonalizedPath, PersonalizedPathInput } from '@/ai/flows/personalized-learning-path';

export default async function DashboardPage() {

  const personalizedPathInput: PersonalizedPathInput = {
    skillLevel: 'intermediate',
    performanceHistory: [
      { moduleId: 'dementia-care', score: 75, timeSpent: 120 },
      { moduleId: 'heart-failure-management', score: 40, timeSpent: 90 },
    ],
    caregivingScenario:
      'Caring for an elderly person who recently had a stroke and needs help with moving around and seems a little confused.',
  };
  
  const personalizedPath = await generatePersonalizedPath(personalizedPathInput);

  return (
    <div className="container mx-auto p-0 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-3xl">Welcome, Caregiver!</CardTitle>
            <CardDescription>Your personalized dashboard to guide you in providing the best care.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Here you can find your learning modules, track your progress, and run simulations to practice your skills.</p>
          </CardContent>
        </Card>
        <DashboardClient personalizedPath={personalizedPath} />
    </div>
  );
}
