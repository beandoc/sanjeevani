
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpen, Stethoscope, Target, Puzzle, GitBranch } from 'lucide-react';
import Link from 'next/link';

const lessons = [
  {
    slug: '/assessment-guide/introduction',
    title: 'Introduction & Rationale',
    description: 'Understand the core principles and reasons for performing a geriatric assessment.',
    icon: BookOpen,
  },
  {
    slug: '/assessment-guide/predictive-value',
    title: 'Predictive Value & Impact',
    description: 'Learn how geriatric assessment predicts complications, survival, and influences treatment decisions.',
    icon: Target,
  },
  {
    slug: '/assessment-guide/components',
    title: 'Components & Tools',
    description: 'Explore the key domains of assessment and the common tools used for evaluation.',
    icon: Puzzle,
  },
  {
    slug: '/assessment-guide/implementation',
    title: 'Implementation Models',
    description: 'Discover the different models for implementing geriatric assessment in clinical practice.',
    icon: GitBranch,
  },
];

export default function AssessmentGuidePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">
          Geriatric Assessment Guide
        </h1>
        <p className="text-muted-foreground">
          A review of geriatric assessment (GA) in older patients with cancer, broken into focused lessons.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {lessons.map((lesson) => {
          const Icon = lesson.icon;
          return (
            <Card key={lesson.slug} className="flex flex-col">
              <CardHeader>
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="font-headline text-xl">{lesson.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <CardDescription>{lesson.description}</CardDescription>
              </CardContent>
              <CardContent>
                <Button asChild className="w-full" variant="secondary">
                  <Link href={lesson.slug}>
                    Start Lesson <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
