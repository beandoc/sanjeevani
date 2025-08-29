
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import DashboardClient from './dashboard-client';
import { useProfile } from '@/context/role-context';

export default function DashboardPage() {
  const { role } = useProfile();
  const welcomeTitle = role === 'professional' ? 'Welcome, Nurse!' : 'Welcome, Caregiver!';

  return (
    <div className="container mx-auto p-0 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-3xl">{welcomeTitle}</CardTitle>
            <CardDescription>Your personalized dashboard to guide you in providing the best care.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Here you can find your learning modules, track your progress, and run simulations to practice your skills.</p>
          </CardContent>
        </Card>
        <DashboardClient />
    </div>
  );
}
