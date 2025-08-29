import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Bot } from 'lucide-react';
import Link from 'next/link';

const simulations = [
  {
    slug: 'managing-a-fall',
    title: 'Managing a Fall',
    description: 'Patient has fallen. Assess the situation and provide immediate care.',
  },
  {
    slug: 'medication-confusion',
    title: 'Medication Confusion',
    description: 'Patient is confused about their medication. Address the situation carefully.',
  },
  {
    slug: 'sudden-shortness-of-breath',
    title: 'Sudden Shortness of Breath',
    description: 'Patient is experiencing sudden dyspnea. React to a potential emergency.',
  },
];

export default function SimulationsListPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">Practice Simulations</h1>
        <p className="text-muted-foreground">
          Apply your knowledge in realistic, interactive scenarios.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {simulations.map((sim) => (
          <Card key={sim.slug} className="flex flex-col">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                  <Bot className="h-6 w-6 text-accent" />
                </div>
                <CardTitle className="font-headline text-xl">{sim.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <CardDescription>{sim.description}</CardDescription>
            </CardContent>
            <CardContent>
              <Button asChild className="w-full" variant="secondary">
                <Link href={`/simulations/${sim.slug}`}>
                  Start Simulation <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
