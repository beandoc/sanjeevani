
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpen, Target, Puzzle, GitBranch, Globe, Users, HeartHandshake, Bot, Cpu } from 'lucide-react';
import Link from 'next/link';

const lessons = [
  {
    slug: '/assessment-guide/introduction',
    title: 'Foundations of Modern Geriatric Education',
    description: 'Explore the core principles and frameworks that define geriatric care education.',
    icon: BookOpen,
  },
  {
    slug: '/assessment-guide/workforce',
    title: 'Tailoring Modules for a Diverse Workforce',
    description: 'Learn how to adapt geriatric training for physicians, nurses, and the entire caregiving ecosystem.',
    icon: Users,
  },
  {
    slug: '/assessment-guide/clinical-content',
    title: 'Core Clinical Content',
    description: 'Delve into the essential clinical topics, from multimorbidity to palliative care.',
    icon: HeartHandshake,
  },
  {
    slug: '/assessment-guide/innovations',
    title: 'Innovations in Pedagogy and Care Models',
    description: 'Discover advances in teaching methods, technology, and patient-directed care models.',
    icon: Cpu,
  },
  {
    slug: '/assessment-guide/case-study',
    title: 'Global Case Study: India',
    description: 'Examine a real-world example of a nation building a multi-tiered geriatric education ecosystem.',
    icon: Globe,
  },
];

export default function AssessmentGuidePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">
          Crafting Effective Geriatric Learning Modules
        </h1>
        <p className="text-muted-foreground">
          A guide for caregivers and health workers on creating comprehensive geriatric training.
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
