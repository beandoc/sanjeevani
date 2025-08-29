'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import DashboardClient from './dashboard-client';

export default function DashboardPage() {
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
        <DashboardClient />
    </div>
  );
}
